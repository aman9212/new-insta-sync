import { supabase } from '../lib/supabase';
import { validateUrl } from '../lib/validators';
import { fetchInstagramMetrics, extractInstagramMediaId } from './meta-sync.service';
import type { SocialPlatform, SubmissionWithJoins } from '../types';

export async function listCreatorSubmissions(status?: string) {
  if (!supabase) return [];
  let query = supabase.from('creator_submissions').select('*').order('submitted_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SubmissionWithJoins[];
}

export async function listBrandSubmissions() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('brand_submissions').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SubmissionWithJoins[];
}

/**
 * Creates a creator clip submission and triggers an instant initial Meta Graph API sync.
 */
export async function createSubmission(campaignId: string, platform: SocialPlatform, postUrl: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const validation = validateUrl(postUrl);
  if (!validation.valid || !validation.platform || validation.platform !== platform) {
    throw new Error(validation.error ?? 'The URL does not match the selected platform');
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');

  // Extract media ID if Instagram
  const mediaId = validation.externalId || (platform === 'instagram' ? extractInstagramMediaId(postUrl) : null);

  const { data: newSubmission, error } = await supabase
    .from('submissions')
    .insert({
      campaign_id: campaignId,
      creator_id: auth.user.id,
      platform,
      post_url: postUrl,
      normalized_post_url: validation.normalized,
      external_post_id: mediaId,
      status: 'processing',
    })
    .select('id')
    .single();

  if (error) throw error;

  // Trigger instant initial view sync using meta-sync.service.ts right after submission
  if (platform === 'instagram' && mediaId && newSubmission?.id) {
    try {
      const metrics = await fetchInstagramMetrics(mediaId);
      if (!metrics.error) {
        const timestamp = new Date().toISOString();
        await supabase
          .from('submissions')
          .update({
            total_views: metrics.raw_views,
            last_synced_at: timestamp,
            status: 'eligible',
          })
          .eq('id', newSubmission.id);

        await supabase.from('submission_metric_snapshots').insert({
          submission_id: newSubmission.id,
          raw_views: metrics.raw_views,
          raw_likes: metrics.raw_likes,
          captured_at: timestamp,
        });
      }
    } catch (syncErr) {
      console.warn('[SubmissionService] Instant view sync warning:', syncErr);
    }
  }

  return newSubmission;
}
