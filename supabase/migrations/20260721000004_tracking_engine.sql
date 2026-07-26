-- Social Media Anti-Fraud & Tracking Engine Schema
-- Contains tracking settings, tracked posts, metrics history, and fraud alerts

-- 1. Tracking Settings (Singleton)
CREATE TABLE public.tracking_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_interval_minutes integer DEFAULT 60 NOT NULL,
  high_risk_threshold integer DEFAULT 80 NOT NULL,
  medium_risk_threshold integer DEFAULT 50 NOT NULL,
  auto_freeze_rewards_threshold integer DEFAULT 90 NOT NULL,
  auto_review_threshold integer DEFAULT 75 NOT NULL,
  data_retention_days integer DEFAULT 90 NOT NULL,
  instagram_api_quota integer DEFAULT 10000,
  youtube_api_quota integer DEFAULT 10000,
  tiktok_api_quota integer DEFAULT 5000,
  max_retries integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert default settings
INSERT INTO public.tracking_settings (
  tracking_interval_minutes, high_risk_threshold, medium_risk_threshold, 
  auto_freeze_rewards_threshold, auto_review_threshold, data_retention_days
) VALUES (
  60, 80, 50, 90, 75, 90
);

-- 2. Tracked Posts
CREATE TABLE public.tracked_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL, -- References submissions table ideally, but keeping decoupled for now if references don't exist
  creator_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'facebook', 'x')),
  post_url text NOT NULL,
  platform_post_id text,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'error')),
  current_views bigint DEFAULT 0,
  current_likes bigint DEFAULT 0,
  current_comments bigint DEFAULT 0,
  current_shares bigint DEFAULT 0,
  current_risk_score integer DEFAULT 0,
  last_tracked_at timestamp with time zone,
  next_track_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Post Metrics History
CREATE TABLE public.post_metrics_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracked_post_id uuid NOT NULL REFERENCES public.tracked_posts(id) ON DELETE CASCADE,
  views bigint NOT NULL,
  likes bigint NOT NULL,
  comments bigint NOT NULL,
  shares bigint NOT NULL,
  engagement_rate numeric(10,2),
  views_growth bigint DEFAULT 0,
  likes_growth bigint DEFAULT 0,
  anomaly_detected boolean DEFAULT false,
  snapshot_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Fraud Alerts
CREATE TABLE public.tracking_fraud_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracked_post_id uuid NOT NULL REFERENCES public.tracked_posts(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('bot_views_suspected', 'engagement_farming', 'sudden_spike', 'platform_takedown')),
  risk_score integer NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- RLS Policies
ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can read and write everything
CREATE POLICY "Admins have full access to tracking_settings" ON public.tracking_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to tracked_posts" ON public.tracked_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to post_metrics_history" ON public.post_metrics_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to tracking_fraud_alerts" ON public.tracking_fraud_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tracking_settings_updated_at
    BEFORE UPDATE ON public.tracking_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracked_posts_updated_at
    BEFORE UPDATE ON public.tracked_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_fraud_alerts_updated_at
    BEFORE UPDATE ON public.tracking_fraud_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
