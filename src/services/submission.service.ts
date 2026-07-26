import { supabase } from '../lib/supabase';
import { validateUrl } from '../lib/validators';
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

export async function createSubmission(campaignId: string, platform: SocialPlatform, postUrl: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const validation = validateUrl(postUrl);
  if (!validation.valid || !validation.platform || validation.platform !== platform) {
    throw new Error(validation.error ?? 'The URL does not match the selected platform');
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = await supabase.from('submissions').insert({
    campaign_id: campaignId,
    creator_id: auth.user.id,
    platform,
    post_url: postUrl,
    normalized_post_url: validation.normalized,
    external_post_id: validation.externalId,
    status: 'processing',
  });
  if (error) throw error;
}
