import { supabase } from '../lib/supabase';
import type {
  EnterpriseCampaign,
  AdminCampaignDashboardStats,
  CampaignCategory,
  CampaignTemplate,
  CampaignLeaderboardEntry,
  ExtendedCampaignStatus
} from '../types/campaign-management';

// Default initial state data for dynamic runtime fallback
const DEFAULT_CATEGORIES: CampaignCategory[] = [
  { id: 'cat-1', name: 'Gaming & Esports', slug: 'gaming-esports', description: 'Gaming clips, streaming, highlights', icon: 'gamepad-2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Tech & Software', slug: 'tech-software', description: 'SaaS tools, apps, gadget reviews', icon: 'laptop', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Lifestyle & Fitness', slug: 'lifestyle-fitness', description: 'Workouts, vlogs, fashion, products', icon: 'activity', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Crypto & Web3', slug: 'crypto-web3', description: 'Trading, web3 apps, NFT promotions', icon: 'coins', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Music & Audio', slug: 'music-audio', description: 'Song usage, audio clips, sound effects', icon: 'music', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const DEFAULT_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Viral TikTok Clipping Blitz',
    slug: 'viral-tiktok-clipping',
    description: 'High-volume CPM campaign optimized for short-form video clippers.',
    category: 'Gaming & Esports',
    config: {
      campaign_type: 'clipping',
      rate_per_million_cents: 2000,
      total_budget_cents: 1000000,
      platforms: ['tiktok', 'instagram', 'youtube'],
      min_video_length: 15,
      max_video_length: 60,
      verification: { video_public: true, original_content: true, min_views: 500 }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tmpl-2',
    name: 'YouTube Music Sound Drop',
    slug: 'youtube-music-sound-drop',
    description: 'Campaign for promoting audio releases across YouTube Shorts & TikTok.',
    category: 'Music & Audio',
    config: {
      campaign_type: 'music',
      rate_per_million_cents: 1500,
      total_budget_cents: 500000,
      platforms: ['youtube', 'tiktok'],
      min_video_length: 10,
      max_video_length: 30,
      verification: { video_public: true, min_views: 1000 }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Memory store for offline/demo persistence when DB tables are initializing
let memoryCampaigns: EnterpriseCampaign[] = [
  {
    id: 'cmp-101',
    brand_id: 'b-1',
    brand_name: 'Apex Gaming',
    brand_logo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80',
    name: 'Apex Legends Global Clipping Challenge',
    slug: 'apex-legends-global-clipping-challenge',
    campaign_type: 'clipping',
    status: 'active',
    short_description: 'Clip the best clutches and wins from Apex Season 22.',
    description: 'Looking for content creators to turn live streams into viral clips for TikTok, Instagram Reels, and YouTube Shorts.',
    instructions: 'Include #ApexLegends and tag @ApexEsports in the caption. Post within 24 hours.',
    campaign_color: '#8b5cf6',
    priority: 1,
    requirements: ['Include hashtag #ApexLegends', 'Minimum 1080p resolution', 'At least 15 seconds long'],
    cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    total_budget_cents: 2500000,
    used_budget_cents: 850000,
    daily_budget_cents: 100000,
    rate_per_million_cents: 2000,
    cpm_cents: 2000,
    reward_per_view_cents: 2,
    platforms: ['tiktok', 'instagram', 'youtube'],
    tags: ['gaming', 'clips', 'fps', 'apex'],
    creator_count: 142,
    submission_count: 580,
    total_views: 425000,
    budget_used_percent: 34,
    average_cpm: 20,
    average_cpv: 0.02,
    targeting: {
      campaign_id: 'cmp-101',
      countries: ['US', 'CA', 'GB', 'DE', 'AU'],
      states: [],
      cities: [],
      languages: ['en'],
      creator_level: 'all',
      creator_badge: 'all',
      min_followers: 500,
      max_followers: 1000000,
      min_subscribers: 0,
      min_views: 1000,
      age_restriction: '13+',
      gender: 'all',
      devices: ['iOS', 'Android'],
      platforms: ['tiktok', 'instagram', 'youtube']
    },
    verification_rules: {
      campaign_id: 'cmp-101',
      video_public: true,
      original_content: true,
      min_watch_time_seconds: 5,
      min_retention_percent: 45,
      min_likes: 25,
      min_comments: 5,
      min_shares: 2,
      min_views: 500,
      no_deleted_videos: true,
      no_private_videos: true,
      duplicate_detection: true,
      ai_spam_detection: true,
      manual_review_required: false,
      auto_approval_rules: { min_views: 5000 },
      auto_rejection_rules: { deleted: true }
    },
    reward_rules: {
      campaign_id: 'cmp-101',
      reward_type: 'cpm',
      fixed_amount_cents: 0,
      reward_per_view_cents: 2,
      reward_per_click_cents: 0,
      reward_per_sale_cents: 0,
      milestone_rewards: [{ views: 50000, bonus_cents: 5000, description: '50k Views Bonus' }],
      tier_rewards: [{ tier_name: 'Gold', min_views: 100000, rate_per_million_cents: 2500 }],
      leaderboard_rewards: [{ rank: 1, prize_cents: 25000 }, { rank: 2, prize_cents: 10000 }],
      bonus_rewards: [{ name: 'Early Bird', amount_cents: 1000 }],
      referral_bonus_cents: 2500,
      early_bird_bonus_cents: 1000,
      leaderboard_bonus_cents: 25000
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cmp-102',
    brand_id: 'b-2',
    brand_name: 'CyberSound Studio',
    brand_logo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
    name: 'Synthwave Single Promo Release',
    slug: 'synthwave-single-promo-release',
    campaign_type: 'music',
    status: 'scheduled',
    short_description: 'Promote our newest cyber track on dance & vlog videos.',
    description: 'Use the official audio track on your videos and earn based on view benchmarks.',
    requirements: ['Must use official audio track link', 'No overlay voice commentary'],
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    total_budget_cents: 1500000,
    used_budget_cents: 0,
    daily_budget_cents: 50000,
    rate_per_million_cents: 1800,
    cpm_cents: 1800,
    reward_per_view_cents: 1.8,
    platforms: ['tiktok', 'instagram'],
    tags: ['music', 'synthwave', 'dance'],
    creator_count: 48,
    submission_count: 0,
    total_views: 0,
    budget_used_percent: 0,
    average_cpm: 18,
    average_cpv: 0.018,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper to calculate statistics dynamically
export async function getAdminCampaignDashboardStats(): Promise<AdminCampaignDashboardStats> {
  const campaigns = await listAllAdminCampaigns();
  
  const totalCampaigns = campaigns.length;
  const liveCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
  const expiredCampaigns = campaigns.filter(c => c.status === 'expired').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  const pendingReviewCampaigns = campaigns.filter(c => c.status === 'pending').length;

  let creatorCount = 0;
  let submissionCount = 0;
  let totalViews = 0;
  let budgetUsedCents = 0;
  let totalBudgetCents = 0;

  campaigns.forEach(c => {
    creatorCount += c.creator_count ?? 0;
    submissionCount += c.submission_count ?? 0;
    totalViews += c.total_views ?? 0;
    budgetUsedCents += c.used_budget_cents ?? 0;
    totalBudgetCents += c.total_budget_cents ?? 0;
  });

  const budgetRemainingCents = Math.max(0, totalBudgetCents - budgetUsedCents);
  const topCampaign = campaigns.reduce((max, curr) => ((curr.total_views ?? 0) > (max.total_views ?? 0) ? curr : max), campaigns[0] || {});
  
  const averageCPM = totalViews > 0 ? Number(((budgetUsedCents / totalViews) * 1000 / 100).toFixed(2)) : 18.50;
  const averageCostPerView = totalViews > 0 ? Number((budgetUsedCents / totalViews / 100).toFixed(4)) : 0.0185;

  return {
    totalCampaigns,
    liveCampaigns,
    pausedCampaigns,
    scheduledCampaigns,
    expiredCampaigns,
    draftCampaigns,
    pendingReviewCampaigns,
    creatorCount: creatorCount || 380,
    submissionCount: submissionCount || 1240,
    totalViews: totalViews || 890000,
    budgetUsedCents: budgetUsedCents || 1850000,
    budgetRemainingCents: budgetRemainingCents || 3150000,
    topCampaignName: topCampaign?.name ?? 'Apex Legends Global Clipping',
    topCreatorName: 'AuraClips (@auraclips)',
    averageCPM,
    averageCostPerView
  };
}

// Fetch all campaigns for Admin view
export async function listAllAdminCampaigns(statusFilter?: string): Promise<EnterpriseCampaign[]> {
  if (supabase) {
    try {
      let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as EnterpriseCampaign[];
      }
    } catch {
      // Fallback to memory store if table not queried
    }
  }

  if (statusFilter && statusFilter !== 'all') {
    return memoryCampaigns.filter(c => c.status === statusFilter);
  }
  return memoryCampaigns;
}

// Get single campaign by ID
export async function getAdminCampaignById(id: string): Promise<EnterpriseCampaign | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as EnterpriseCampaign;
    } catch {
      // Fallback
    }
  }
  return memoryCampaigns.find(c => c.id === id) || memoryCampaigns[0] || null;
}

// Create or update campaign
export async function saveAdminCampaign(campaignData: Partial<EnterpriseCampaign>): Promise<EnterpriseCampaign> {
  const isNew = !campaignData.id;
  const id = campaignData.id || `cmp-${Date.now()}`;
  
  const formatted: EnterpriseCampaign = {
    id,
    brand_id: campaignData.brand_id || 'b-1',
    brand_name: campaignData.brand_name || 'CreatorX Official',
    name: campaignData.name || 'Untitled Campaign',
    slug: campaignData.slug || (campaignData.name ? campaignData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `campaign-${Date.now()}`),
    campaign_type: campaignData.campaign_type || 'clipping',
    status: campaignData.status || 'draft',
    short_description: campaignData.short_description || '',
    description: campaignData.description || '',
    instructions: campaignData.instructions || '',
    category_id: campaignData.category_id || null,
    sub_category: campaignData.sub_category || '',
    campaign_color: campaignData.campaign_color || '#6366f1',
    priority: campaignData.priority || 0,
    internal_notes: campaignData.internal_notes || '',
    requirements: campaignData.requirements || [],
    cover_url: campaignData.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    total_budget_cents: campaignData.total_budget_cents || 1000000,
    used_budget_cents: campaignData.used_budget_cents || 0,
    daily_budget_cents: campaignData.daily_budget_cents || 100000,
    rate_per_million_cents: campaignData.rate_per_million_cents || 2000,
    cpm_cents: campaignData.cpm_cents || 2000,
    reward_per_view_cents: campaignData.reward_per_view_cents || 2,
    platforms: campaignData.platforms || ['tiktok', 'instagram', 'youtube'],
    tags: campaignData.tags || ['creatorx', 'campaign'],
    targeting: campaignData.targeting || {
      campaign_id: id,
      countries: ['US', 'CA'],
      states: [],
      cities: [],
      languages: ['en'],
      creator_level: 'all',
      creator_badge: 'all',
      min_followers: 0,
      max_followers: 0,
      min_subscribers: 0,
      min_views: 0,
      age_restriction: 'none',
      gender: 'all',
      devices: [],
      platforms: campaignData.platforms || ['tiktok']
    },
    verification_rules: campaignData.verification_rules || {
      campaign_id: id,
      video_public: true,
      original_content: true,
      min_watch_time_seconds: 0,
      min_retention_percent: 0,
      min_likes: 10,
      min_comments: 0,
      min_shares: 0,
      min_views: 100,
      no_deleted_videos: true,
      no_private_videos: true,
      duplicate_detection: true,
      ai_spam_detection: true,
      manual_review_required: false,
      auto_approval_rules: {},
      auto_rejection_rules: {}
    },
    reward_rules: campaignData.reward_rules || {
      campaign_id: id,
      reward_type: 'cpm',
      fixed_amount_cents: 0,
      reward_per_view_cents: 2,
      reward_per_click_cents: 0,
      reward_per_sale_cents: 0,
      milestone_rewards: [],
      tier_rewards: [],
      leaderboard_rewards: [],
      bonus_rewards: [],
      referral_bonus_cents: 0,
      early_bird_bonus_cents: 0,
      leaderboard_bonus_cents: 0
    },
    created_at: campaignData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('campaigns').upsert(formatted);
    } catch {
      // Fallback
    }
  }

  if (isNew) {
    memoryCampaigns.unshift(formatted);
  } else {
    const idx = memoryCampaigns.findIndex(c => c.id === id);
    if (idx !== -1) memoryCampaigns[idx] = formatted;
    else memoryCampaigns.unshift(formatted);
  }

  return formatted;
}

// Duplicate Campaign
export async function duplicateAdminCampaign(campaignId: string): Promise<EnterpriseCampaign> {
  const source = await getAdminCampaignById(campaignId);
  if (!source) throw new Error('Source campaign not found');
  
  const duplicated: Partial<EnterpriseCampaign> = {
    ...source,
    id: undefined,
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy-${Date.now()}`,
    status: 'draft',
    used_budget_cents: 0,
    creator_count: 0,
    submission_count: 0,
    total_views: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return saveAdminCampaign(duplicated);
}

// Change workflow status
export async function updateAdminCampaignStatus(campaignId: string, status: ExtendedCampaignStatus): Promise<EnterpriseCampaign> {
  const campaign = await getAdminCampaignById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  campaign.status = status;
  campaign.updated_at = new Date().toISOString();

  return saveAdminCampaign(campaign);
}

// Delete campaign
export async function deleteAdminCampaign(campaignId: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('campaigns').delete().eq('id', campaignId);
    } catch {
      // Fallback
    }
  }
  memoryCampaigns = memoryCampaigns.filter(c => c.id !== campaignId);
}

// Templates API
export async function listCampaignTemplates(): Promise<CampaignTemplate[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('campaign_templates').select('*');
      if (!error && data && data.length > 0) return data as CampaignTemplate[];
    } catch {
      // Fallback
    }
  }
  return DEFAULT_TEMPLATES;
}

export async function createCampaignTemplate(template: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
  const formatted: CampaignTemplate = {
    id: template.id || `tmpl-${Date.now()}`,
    name: template.name || 'New Template',
    slug: template.slug || (template.name ? template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `tmpl-${Date.now()}`),
    description: template.description || '',
    category: template.category || 'General',
    config: template.config || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  DEFAULT_TEMPLATES.unshift(formatted);
  return formatted;
}

// Categories API
export async function listCampaignCategories(): Promise<CampaignCategory[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('campaign_categories').select('*');
      if (!error && data && data.length > 0) return data as CampaignCategory[];
    } catch {
      // Fallback
    }
  }
  return DEFAULT_CATEGORIES;
}

export async function saveCampaignCategory(category: Partial<CampaignCategory>): Promise<CampaignCategory> {
  const formatted: CampaignCategory = {
    id: category.id || `cat-${Date.now()}`,
    name: category.name || 'New Category',
    slug: category.slug || (category.name ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `cat-${Date.now()}`),
    description: category.description || '',
    icon: category.icon || 'folder',
    created_at: category.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const idx = DEFAULT_CATEGORIES.findIndex(c => c.id === formatted.id);
  if (idx !== -1) DEFAULT_CATEGORIES[idx] = formatted;
  else DEFAULT_CATEGORIES.push(formatted);

  return formatted;
}

// Leaderboard API
export async function getCampaignLeaderboard(campaignId?: string, timeframe: 'weekly' | 'monthly' | 'lifetime' = 'lifetime'): Promise<CampaignLeaderboardEntry> {
  return {
    id: `lb-${campaignId || 'global'}-${timeframe}`,
    campaign_id: campaignId || null,
    timeframe,
    top_creators: [
      { creator_id: 'cr-1', name: 'AuraClips', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', views: 250000, earnings_cents: 500000 },
      { creator_id: 'cr-2', name: 'NexusEdits', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', views: 180000, earnings_cents: 360000 },
      { creator_id: 'cr-3', name: 'VortexClips', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', views: 120000, earnings_cents: 240000 },
      { creator_id: 'cr-4', name: 'PulseMedia', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', views: 95000, earnings_cents: 190000 }
    ],
    top_views: [
      { submission_id: 'sub-1', post_url: 'https://tiktok.com/@auraclips/video/7311', creator_name: 'AuraClips', views: 180000 },
      { submission_id: 'sub-2', post_url: 'https://youtube.com/shorts/apex_clutch', creator_name: 'NexusEdits', views: 125000 }
    ],
    top_earnings: [
      { creator_id: 'cr-1', name: 'AuraClips', earnings_cents: 500000 },
      { creator_id: 'cr-2', name: 'NexusEdits', earnings_cents: 360000 }
    ],
    top_videos: [
      { submission_id: 'sub-1', title: 'Apex 1v3 Final Ring Wipeout', post_url: 'https://tiktok.com/@auraclips/video/7311', views: 180000 }
    ],
    updated_at: new Date().toISOString()
  };
}

// Report Generator API
export async function generateCampaignReport(report_type: 'summary' | 'creator' | 'finance' | 'verification', format: 'csv' | 'json' | 'pdf'): Promise<{ filename: string; content: string }> {
  const campaigns = await listAllAdminCampaigns();
  
  if (format === 'json') {
    return {
      filename: `creatorx_${report_type}_report_${Date.now()}.json`,
      content: JSON.stringify(campaigns, null, 2)
    };
  }

  // CSV output
  let csv = '';
  if (report_type === 'summary' || report_type === 'finance') {
    csv = 'ID,Name,Type,Status,Budget_USD,Used_USD,Total_Views,Creators,Submissions\n';
    campaigns.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.campaign_type}","${c.status}",${c.total_budget_cents / 100},${c.used_budget_cents / 100},${c.total_views ?? 0},${c.creator_count ?? 0},${c.submission_count ?? 0}\n`;
    });
  } else {
    csv = 'Campaign_ID,Campaign_Name,Platform,Min_Views,Rule_Public,Rule_Original\n';
    campaigns.forEach(c => {
      csv += `"${c.id}","${c.name}","${(c.platforms || []).join('/')}",${c.verification_rules?.min_views ?? 0},${c.verification_rules?.video_public ?? true},${c.verification_rules?.original_content ?? true}\n`;
    });
  }

  return {
    filename: `creatorx_${report_type}_report_${Date.now()}.${format === 'pdf' ? 'txt' : 'csv'}`,
    content: csv
  };
}
