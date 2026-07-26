export interface TrackingSettings {
  id: string;
  tracking_interval_minutes: number;
  high_risk_threshold: number;
  medium_risk_threshold: number;
  auto_freeze_rewards_threshold: number;
  auto_review_threshold: number;
  data_retention_days: number;
  instagram_api_quota: number;
  youtube_api_quota: number;
  tiktok_api_quota: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface TrackedPost {
  id: string;
  submission_id: string;
  creator_id: string;
  campaign_id: string;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'x';
  post_url: string;
  platform_post_id?: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  current_views: number;
  current_likes: number;
  current_comments: number;
  current_shares: number;
  current_risk_score: number;
  last_tracked_at?: string;
  next_track_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PostMetricHistory {
  id: string;
  tracked_post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  views_growth: number;
  likes_growth: number;
  anomaly_detected: boolean;
  snapshot_at: string;
}

export interface TrackingFraudAlert {
  id: string;
  tracked_post_id: string;
  alert_type: 'bot_views_suspected' | 'engagement_farming' | 'sudden_spike' | 'platform_takedown';
  risk_score: number;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
}
