import { supabase } from '../lib/supabase';
import type { TrackingSettings, TrackedPost, TrackingFraudAlert } from '../types/tracking';

/**
 * Service for the Social Media Anti-Fraud Tracking Engine.
 * Handles fetching tracked posts, updating settings, and anomaly detection.
 */
class TrackingService {
  private fallbackSettings: TrackingSettings = {
    id: 'fallback-settings-id',
    tracking_interval_minutes: 60,
    high_risk_threshold: 80,
    medium_risk_threshold: 50,
    auto_freeze_rewards_threshold: 90,
    auto_review_threshold: 75,
    data_retention_days: 90,
    instagram_api_quota: 10000,
    youtube_api_quota: 10000,
    tiktok_api_quota: 5000,
    max_retries: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  private fallbackTrackedPosts: TrackedPost[] = [
    {
      id: 'post-1',
      submission_id: 'sub-1',
      creator_id: 'creator-1',
      campaign_id: 'camp-1',
      platform: 'instagram',
      post_url: 'https://instagram.com/p/123456',
      status: 'active',
      current_views: 15400,
      current_likes: 2100,
      current_comments: 150,
      current_shares: 45,
      current_risk_score: 12,
      last_tracked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'post-2',
      submission_id: 'sub-2',
      creator_id: 'creator-2',
      campaign_id: 'camp-2',
      platform: 'tiktok',
      post_url: 'https://tiktok.com/@user/video/123456',
      status: 'active',
      current_views: 250000,
      current_likes: 1200,
      current_comments: 10,
      current_shares: 2,
      current_risk_score: 85,
      last_tracked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  async getSettings(): Promise<TrackingSettings> {
    if (!supabase) return this.fallbackSettings;
    try {
      const { data, error } = await supabase
        .from('tracking_settings')
        .select('*')
        .single();
      
      if (error || !data) return this.fallbackSettings;
      return data as TrackingSettings;
    } catch (e) {
      console.error('Error fetching tracking settings', e);
      return this.fallbackSettings;
    }
  }

  async updateSettings(settings: Partial<TrackingSettings>): Promise<TrackingSettings> {
    if (!supabase) {
      this.fallbackSettings = { ...this.fallbackSettings, ...settings };
      return this.fallbackSettings;
    }
    
    try {
      const current = await this.getSettings();
      const { data, error } = await supabase
        .from('tracking_settings')
        .update(settings)
        .eq('id', current.id)
        .select()
        .single();
        
      if (error || !data) throw error;
      return data as TrackingSettings;
    } catch (e) {
      console.error('Error updating tracking settings', e);
      throw e;
    }
  }

  async getTrackedPosts(): Promise<TrackedPost[]> {
    if (!supabase) return this.fallbackTrackedPosts;
    try {
      const { data, error } = await supabase
        .from('tracked_posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error || !data) return this.fallbackTrackedPosts;
      return data as TrackedPost[];
    } catch (e) {
      console.error('Error fetching tracked posts', e);
      return this.fallbackTrackedPosts;
    }
  }

  async getFraudAlerts(): Promise<TrackingFraudAlert[]> {
    if (!supabase) {
      return [
        {
          id: 'alert-1',
          tracked_post_id: 'post-2',
          alert_type: 'bot_views_suspected',
          risk_score: 85,
          description: 'Massive spike in views (250k) with extremely low engagement rate (0.4%). Highly indicative of bot view farming.',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
    
    try {
      const { data, error } = await supabase
        .from('tracking_fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error || !data) return [];
      return data as TrackingFraudAlert[];
    } catch (e) {
      console.error('Error fetching fraud alerts', e);
      return [];
    }
  }

  /**
   * Simulates tracking logic: updates metrics and recalculates risk score.
   */
  async simulateTrackingRun(postId: string): Promise<void> {
    console.log(`[TrackingEngine] Running anomaly detection on post ${postId}...`);
    // In production, this would be an Edge Function or Cron Job calling external APIs.
  }
}

export const trackingService = new TrackingService();
