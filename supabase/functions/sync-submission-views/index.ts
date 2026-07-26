import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getProvider } from './providers/mod.ts';
import { calculateFraudScore } from './fraud.ts';

interface SyncSubmission {
  id: string;
  creator_id: string;
  post_url: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  external_post_id?: string;
  campaign_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function unbase64(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }

async function keyFromEnvironment() {
  let raw = Deno.env.get('SOCIAL_CREDENTIALS_ENCRYPTION_KEY');
  if (!raw) raw = 'c3VwZXItc2VjcmV0LWtleS0zMi1ieXRlcy1mb3ItZGV2ZWxvcG1lbnQ=';
  const bytes = unbase64(raw);
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function decryptToken(encryptedString: string): Promise<string> {
  try {
    const data = JSON.parse(encryptedString);
    const iv = data.iv;
    const ciphertext = data.ciphertext;
    if (!iv || !ciphertext) return encryptedString;
    const key = await keyFromEnvironment();
    const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv) }, key, unbase64(ciphertext));
    return new TextDecoder().decode(decoded);
  } catch {
    return encryptedString;
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Server Supabase credentials are not configured' }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // 1. Fetch submissions that need sync
  const { data: subs, error } = await supabase
    .from('submissions')
    .select('id, creator_id, post_url, platform, external_post_id, campaign_id')
    .in('status', ['processing', 'eligible', 'under_review'])
    .or(`next_sync_at.is.null,next_sync_at.lte.${new Date().toISOString()}`)
    .limit(10);

  if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

  const results = [];
  for (const submission of (subs ?? []) as SyncSubmission[]) {
    try {
      const provider = getProvider(submission.platform);
      const extId = submission.external_post_id || provider.extractExternalId(submission.post_url);

      // Fetch creator's OAuth access token from provider_connections
      const { data: socialAcc } = await supabase
        .from('provider_connections')
        .select('encrypted_token')
        .eq('user_id', submission.creator_id)
        .eq('provider', submission.platform)
        .eq('status', 'active')
        .maybeSingle();

      let accessToken: string | null = null;
      if (socialAcc?.encrypted_token) {
        accessToken = await decryptToken(socialAcc.encrypted_token);
      }

      const metrics = await provider.fetchMetrics({
        url: submission.post_url,
        externalId: extId,
        accessToken
      });

      if ('limitation' in metrics) {
        await supabase.from('audit_logs').insert({
          action: 'views.provider_limitation',
          entity_type: 'submission',
          entity_id: submission.id,
          metadata: { provider: submission.platform, limitation: metrics.limitation },
        });
        results.push({ id: submission.id, status: 'manual_review', limitation: metrics.limitation });
        continue;
      }

      // 2. Insert into the immutable submission_metric_snapshots table
      const responseHash = btoa(`${submission.id}:${metrics.fetchedAt}:${metrics.totalViews}`);
      const { data: snapshotRecord, error: snapshotError } = await supabase
        .from('submission_metric_snapshots')
        .insert({
          submission_id: submission.id,
          provider: submission.platform,
          provider_post_id: extId,
          captured_at: metrics.fetchedAt,
          raw_views: metrics.totalViews,
          raw_likes: 0,
          raw_comments: 0,
          raw_shares: 0,
          source: 'provider_api',
          provider_response_hash: responseHash,
        })
        .select()
        .single();

      if (snapshotError) {
        results.push({ id: submission.id, error: `Snapshot error: ${snapshotError.message}` });
        continue;
      }

      // 3. Load all snapshots for this submission for velocity/trend analysis
      const { data: allSnapshots } = await supabase
        .from('submission_metric_snapshots')
        .select('raw_views, captured_at')
        .eq('submission_id', submission.id)
        .order('captured_at', { ascending: true });

      const mappedSnapshots = (allSnapshots ?? []).map(s => ({
        raw_views: Number(s.raw_views),
        raw_likes: 0,
        raw_comments: 0,
        raw_shares: 0,
        raw_saves: 0,
        raw_followers: 0,
        captured_at: s.captured_at,
      }));

      // 4. Check for duplicate post external IDs across other creators
      const { count: dupCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('platform', submission.platform)
        .eq('external_post_id', extId)
        .neq('id', submission.id);

      const duplicatePostIds = dupCount && dupCount > 0 ? [extId || ''] : [];

      // 5. Run Fraud Engine analysis
      const fraudResult = calculateFraudScore(mappedSnapshots, duplicatePostIds);

      // Create or update fraud assessment
      const { data: assess, error: assessError } = await supabase
        .from('fraud_assessments')
        .insert({
          submission_id: submission.id,
          creator_id: submission.creator_id,
          risk_score: fraudResult.score,
          risk_level: fraudResult.level,
          assessment_status: fraudResult.level === 'critical' || fraudResult.level === 'high' ? 'under_review' : 'clear',
        })
        .select()
        .single();

      if (assess && !assessError && fraudResult.signals.length > 0) {
        // Insert signals
        const signalsToInsert = fraudResult.signals.map(s => ({
          assessment_id: assess.id,
          signal_type: s.signal_type,
          signal_code: s.signal_code,
          severity: s.severity,
          score_contribution: s.score_contribution,
          evidence_json: s.evidence,
        }));
        await supabase.from('fraud_signals').insert(signalsToInsert);
      }

      // 6. Escrow state / Hold determination
      let verifiedViews = metrics.totalViews;
      let eligibleViews = metrics.totalViews;
      let payoutStatus: 'pending' | 'verification_hold' | 'eligible' = 'eligible';

      if (fraudResult.level === 'critical' || fraudResult.level === 'high') {
        payoutStatus = 'verification_hold';
        // Subscriptions set under_review
        await supabase
          .from('submissions')
          .update({
            status: 'under_review',
            payout_status: 'verification_hold',
            verified_views: verifiedViews,
            next_sync_at: new Date(Date.now() + 3600000 * 24).toISOString(), // sync in 24 hours
          })
          .eq('id', submission.id);

        results.push({ id: submission.id, status: 'verification_hold', score: fraudResult.score });
      } else {
        // Credit the wallet/submission earnings
        const { data: credited, error: creditError } = await supabase.rpc('credit_submission_earnings', {
          target_submission_id: submission.id,
          new_total_views: verifiedViews,
          idempotency_key: `${submission.id}:${metrics.fetchedAt}:${verifiedViews}`,
        });

        // Update payout status to eligible
        await supabase
          .from('submissions')
          .update({
            payout_status: 'eligible',
            verified_views: verifiedViews,
            eligible_views: verifiedViews,
            next_sync_at: new Date(Date.now() + 3600000 * 24).toISOString(),
          })
          .eq('id', submission.id);

        results.push({ id: submission.id, status: 'synced', credited, error: creditError?.message });
      }
    } catch (err) {
      results.push({ id: submission.id, error: err instanceof Error ? err.message : 'Unknown sync error' });
    }
  }

  return Response.json({ processed: results }, { headers: corsHeaders });
});
