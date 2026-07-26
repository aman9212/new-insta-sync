import { supabase } from '../lib/supabase';
import type { CampaignWithJoins, CampaignType, SocialPlatform } from '../types';

export interface CampaignFilters {
  search?: string;
  campaignType?: CampaignType | 'all';
  platform?: SocialPlatform | 'all';
  sort?: 'newest' | 'rate' | 'budget';
}

import { listAllAdminCampaigns, getAdminCampaignById } from './campaign-management.service';

export async function listActiveCampaigns(filters: CampaignFilters = {}) {
  if (supabase) {
    try {
      let query = supabase.from('campaign_marketplace').select('*');

      if (filters.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters.campaignType && filters.campaignType !== 'all') query = query.eq('campaign_type', filters.campaignType);
      if (filters.platform && filters.platform !== 'all') query = query.contains('platforms', [filters.platform]);

      const sort = filters.sort ?? 'newest';
      if (sort === 'rate') query = query.order('rate_per_million_cents', { ascending: false });
      if (sort === 'budget') query = query.order('total_budget_cents', { ascending: false });
      if (sort === 'newest') query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CampaignWithJoins[];
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to active campaigns from campaign management service
  const all = await listAllAdminCampaigns('active');
  return all as unknown as CampaignWithJoins[];
}

export async function getCampaign(id: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('campaign_marketplace').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as CampaignWithJoins | null;
    } catch {
      // Fallback
    }
  }

  const campaign = await getAdminCampaignById(id);
  return campaign as unknown as CampaignWithJoins | null;
}

export async function listBrandCampaigns() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('brand_campaigns').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CampaignWithJoins[];
}

export async function createCampaign(input: Record<string, unknown> & { platforms: SocialPlatform[] }) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.rpc('create_brand_campaign', input);
  if (error) throw error;
  return data;
}

export async function submitCampaignForReview(campaignId: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('submit_campaign_for_review', { target_campaign_id: campaignId });
  if (error) throw error;
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  let rpcName = '';
  if (status === 'paused') {
    rpcName = 'pause_campaign';
  } else if (status === 'active') {
    rpcName = 'resume_campaign';
  } else {
    throw new Error(`Unsupported status transition: ${status}`);
  }

  const { error } = await supabase.rpc(rpcName, { target_campaign_id: campaignId });
  if (error) throw error;
}

export async function updateCampaignDetails(campaignId: string, updates: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('campaigns').update(updates).eq('id', campaignId);
  if (error) throw error;
}

export async function getBrandCampaign(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, platforms:campaign_platforms(platform)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  
  // Format platforms to be a simple array of social platform keys
  const platforms = (data?.platforms as { platform: string }[] | undefined)?.map(p => p.platform) ?? [];
  return { ...data, platforms };
}

export async function updateCampaignPlatforms(campaignId: string, platforms: string[]) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error: deleteError } = await supabase.from('campaign_platforms').delete().eq('campaign_id', campaignId);
  if (deleteError) throw deleteError;

  if (platforms.length > 0) {
    const records = platforms.map(p => ({ campaign_id: campaignId, platform: p }));
    const { error: insertError } = await supabase.from('campaign_platforms').insert(records);
    if (insertError) throw insertError;
  }
}

export async function deleteCampaignDraft(campaignId: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
  if (error) throw error;
}

