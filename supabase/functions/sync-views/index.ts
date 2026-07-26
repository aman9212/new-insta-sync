import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');

    if (cronSecret) {
      const expectedBearer = `Bearer ${cronSecret}`;
      if (!authHeader || authHeader !== expectedBearer) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid or missing CRON_SECRET header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase environment variables missing in Edge Function' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const metaAccessToken = Deno.env.get('META_USER_ACCESS_TOKEN');

    if (!metaAccessToken) {
      return new Response(
        JSON.stringify({ error: 'META_USER_ACCESS_TOKEN secret is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = new Date().toISOString();

    let submissions: any[] = [];
    const { data: primaryData, error: primaryErr } = await supabase
      .from('post_submissions')
      .select('id, external_post_id, post_url, platform')
      .in('status', ['approved', 'eligible'])
      .eq('platform', 'instagram');

    if (primaryErr) {
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('submissions')
        .select('id, external_post_id, post_url, platform')
        .in('status', ['approved', 'eligible'])
        .eq('platform', 'instagram');

      if (fallbackErr) {
        throw new Error(`Database query error: ${primaryErr.message}`);
      }
      submissions = fallbackData || [];
    } else {
      submissions = primaryData || [];
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const post of submissions) {
      let mediaId = post.external_post_id;
      if (!mediaId && post.post_url) {
        const match = post.post_url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
        if (match && match[1]) mediaId = match[1];
      }

      if (!mediaId) {
        failureCount++;
        errors.push(`Submission ${post.id}: Unable to extract Instagram mediaId from URL`);
        continue;
      }

      try {
        const fieldsParam = encodeURIComponent('like_count,comments_count,insights.metric(plays)');
        const metaUrl = `${META_GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}?fields=${fieldsParam}&access_token=${encodeURIComponent(metaAccessToken)}`;

        const metaRes = await fetch(metaUrl);
        const metaData = await metaRes.json();

        if (!metaRes.ok || metaData.error) {
          const errDetail = metaData?.error?.message || `HTTP ${metaRes.status}`;
          failureCount++;
          errors.push(`Media ID ${mediaId}: ${errDetail}`);
          continue;
        }

        const likes = Number(metaData.like_count) || 0;
        const comments = Number(metaData.comments_count) || 0;
        let views = 0;

        if (metaData.insights?.data && Array.isArray(metaData.insights.data)) {
          const playsItem = metaData.insights.data.find((item: any) => item.name === 'plays');
          if (playsItem?.values?.[0]?.value !== undefined) {
            views = Number(playsItem.values[0].value) || 0;
          }
        }

        const { error: snapErr } = await supabase
          .from('post_snapshots')
          .insert({
            submission_id: post.id,
            raw_views: views,
            raw_likes: likes,
            comments_count: comments,
            captured_at: timestamp,
          });

        if (snapErr) {
          await supabase.from('submission_metric_snapshots').insert({
            submission_id: post.id,
            raw_views: views,
            raw_likes: likes,
            captured_at: timestamp,
          });
        }

        const { error: updErr } = await supabase
          .from('post_submissions')
          .update({
            raw_views: views,
            raw_likes: likes,
            last_synced_at: timestamp,
          })
          .eq('id', post.id);

        if (updErr) {
          await supabase
            .from('submissions')
            .update({
              total_views: views,
              last_synced_at: timestamp,
            })
            .eq('id', post.id);
        }

        successCount++;
      } catch (err) {
        failureCount++;
        errors.push(`Media ID ${mediaId}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp,
        totalProcessed: submissions.length,
        successCount,
        failureCount,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
