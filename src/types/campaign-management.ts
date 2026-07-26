// Enterprise Campaign Management System Types

export type ExtendedCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'expired'
  | 'archived'
  | 'cancelled'
  | 'deleted';

export type ExtendedPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'twitch'
  | 'kick';

export interface CampaignCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMediaItem {
  id: string;
  campaign_id: string;
  media_type: 'thumbnail' | 'banner' | 'logo' | 'gallery' | 'video' | 'brand_asset' | 'reference' | 'document';
  title?: string | null;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string | null;
  created_at: string;
}

export interface CampaignAssetItem {
  id: string;
  campaign_id: string;
  name: string;
  asset_type: string;
  url: string;
  download_count: number;
  created_at: string;
}

export interface CampaignTargetingRules {
  id?: string;
  campaign_id: string;
  countries: string[];
  states: string[];
  cities: string[];
  languages: string[];
  creator_level: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  creator_badge: 'all' | 'verified' | 'top_creator' | 'pro';
  min_followers: number;
  max_followers: number;
  min_subscribers: number;
  min_views: number;
  age_restriction: 'none' | '13+' | '18+' | '21+';
  gender: 'all' | 'male' | 'female' | 'non_binary';
  devices: string[];
  platforms: ExtendedPlatform[];
  created_at?: string;
  updated_at?: string;
}

export interface CampaignLimitRules {
  id?: string;
  campaign_id: string;
  max_participants: number;
  max_videos: number;
  max_posts: number;
  max_earnings_cents: number;
  max_daily_reward_cents: number;
  max_views_counted: number;
  submission_limit: number;
  daily_submission_limit: number;
  created_at?: string;
}

export interface CampaignRequirementRules {
  id?: string;
  campaign_id: string;
  min_video_length_seconds: number;
  max_video_length_seconds: number;
  allowed_languages: string[];
  required_hashtags: string[];
  required_mentions: string[];
  required_links: string[];
  required_keywords: string[];
  required_cta?: string | null;
  allowed_categories: string[];
  allowed_music: string[];
  allowed_countries: string[];
  allowed_devices: string[];
  required_thumbnail: boolean;
  content_guidelines?: string | null;
  created_at?: string;
}

export interface CampaignVerificationRules {
  id?: string;
  campaign_id: string;
  video_public: boolean;
  original_content: boolean;
  min_watch_time_seconds: number;
  min_retention_percent: number;
  min_likes: number;
  min_comments: number;
  min_shares: number;
  min_views: number;
  no_deleted_videos: boolean;
  no_private_videos: boolean;
  duplicate_detection: boolean;
  ai_spam_detection: boolean;
  manual_review_required: boolean;
  auto_approval_rules: Record<string, unknown>;
  auto_rejection_rules: Record<string, unknown>;
  created_at?: string;
}

export interface MilestoneReward {
  views: number;
  bonus_cents: number;
  description: string;
}

export interface TierReward {
  tier_name: string;
  min_views: number;
  rate_per_million_cents: number;
}

export interface CampaignRewardRules {
  id?: string;
  campaign_id: string;
  reward_type: 'fixed' | 'per_view' | 'cpm' | 'per_click' | 'per_sale' | 'milestone' | 'tier' | 'hybrid';
  fixed_amount_cents: number;
  reward_per_view_cents: number;
  reward_per_click_cents: number;
  reward_per_sale_cents: number;
  milestone_rewards: MilestoneReward[];
  tier_rewards: TierReward[];
  leaderboard_rewards: { rank: number; prize_cents: number }[];
  bonus_rewards: { name: string; amount_cents: number }[];
  referral_bonus_cents: number;
  early_bird_bonus_cents: number;
  leaderboard_bonus_cents: number;
  created_at?: string;
}

export interface CampaignScheduleTimeline {
  id?: string;
  campaign_id: string;
  registration_start?: string | null;
  registration_end?: string | null;
  campaign_start?: string | null;
  campaign_end?: string | null;
  submission_deadline?: string | null;
  review_deadline?: string | null;
  payout_date?: string | null;
  timezone: string;
  created_at?: string;
}

export interface CampaignWorkflowState {
  id?: string;
  campaign_id: string;
  current_stage: ExtendedCampaignStatus;
  require_approval: boolean;
  auto_approval: boolean;
  manual_approval: boolean;
  moderator_queue: boolean;
  assigned_reviewer_id?: string | null;
  history: { stage: string; timestamp: string; note?: string; by?: string }[];
  internal_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  config: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignLeaderboardEntry {
  id: string;
  campaign_id?: string | null;
  timeframe: 'weekly' | 'monthly' | 'lifetime';
  top_creators: { creator_id: string; name: string; avatar_url?: string; views: number; earnings_cents: number }[];
  top_views: { submission_id: string; post_url: string; creator_name: string; views: number }[];
  top_earnings: { creator_id: string; name: string; earnings_cents: number }[];
  top_videos: { submission_id: string; title: string; post_url: string; views: number }[];
  updated_at: string;
}

export interface CampaignReportConfig {
  id: string;
  title: string;
  report_type: 'summary' | 'creator' | 'finance' | 'verification';
  format: 'csv' | 'json' | 'pdf';
  config: Record<string, unknown>;
  file_url?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface EnterpriseCampaign {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  campaign_type: 'logo' | 'music' | 'clipping' | 'ugc';
  status: ExtendedCampaignStatus;
  short_description?: string | null;
  description?: string | null;
  instructions?: string | null;
  category_id?: string | null;
  sub_category?: string | null;
  campaign_color?: string;
  priority?: number;
  internal_notes?: string | null;
  requirements: string[];
  cover_url?: string | null;
  
  // Budget & Rates
  total_budget_cents: number;
  used_budget_cents: number;
  daily_budget_cents?: number;
  max_budget_cents?: number;
  min_budget_cents?: number;
  rate_per_million_cents: number;
  cpm_cents?: number;
  reward_per_view_cents?: number;
  reward_per_like_cents?: number;
  reward_per_click_cents?: number;
  reward_per_sale_cents?: number;
  cap_per_post_cents?: number | null;
  cap_per_creator_cents?: number | null;
  minimum_duration_seconds?: number | null;
  
  // Joined Sub-objects
  brand_name?: string;
  brand_logo_url?: string | null;
  category_name?: string;
  platforms?: ExtendedPlatform[];
  tags?: string[];
  media?: CampaignMediaItem[];
  assets?: CampaignAssetItem[];
  targeting?: CampaignTargetingRules;
  limits?: CampaignLimitRules;
  requirement_rules?: CampaignRequirementRules;
  verification_rules?: CampaignVerificationRules;
  reward_rules?: CampaignRewardRules;
  schedule?: CampaignScheduleTimeline;
  workflow?: CampaignWorkflowState;
  
  // Metrics & Calculated fields
  creator_count?: number;
  submission_count?: number;
  total_views?: number;
  budget_used_percent?: number;
  average_cpm?: number;
  average_cpv?: number;

  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCampaignDashboardStats {
  totalCampaigns: number;
  liveCampaigns: number;
  pausedCampaigns: number;
  scheduledCampaigns: number;
  expiredCampaigns: number;
  draftCampaigns: number;
  pendingReviewCampaigns: number;
  creatorCount: number;
  submissionCount: number;
  totalViews: number;
  budgetUsedCents: number;
  budgetRemainingCents: number;
  topCampaignName: string;
  topCreatorName: string;
  averageCPM: number;
  averageCostPerView: number;
}
