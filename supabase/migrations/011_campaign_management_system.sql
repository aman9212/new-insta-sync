-- Migration: 011_campaign_management_system.sql
-- Description: Comprehensive Enterprise Campaign Management System schema for CreatorX

-- 1. Create or update Campaign Status Enum / Domain if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_lifecycle_status') THEN
    CREATE TYPE campaign_lifecycle_status AS ENUM (
      'draft',
      'scheduled',
      'pending',
      'active',
      'paused',
      'completed',
      'expired',
      'archived',
      'cancelled',
      'deleted'
    );
  END IF;
END $$;

-- 2. Campaign Categories
CREATE TABLE IF NOT EXISTS campaign_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES campaign_categories(id) ON DELETE SET NULL,
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Campaign Settings
CREATE TABLE IF NOT EXISTS campaign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Extend / Ensure columns in main campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES campaign_categories(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_color TEXT DEFAULT '#6366f1';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS daily_budget_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_budget_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_budget_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cpm_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reward_per_view_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reward_per_like_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reward_per_click_cents BIGINT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reward_per_sale_cents BIGINT DEFAULT 0;

-- 5. Campaign Tags
CREATE TABLE IF NOT EXISTS campaign_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, tag)
);

-- 6. Campaign Media & Assets
CREATE TABLE IF NOT EXISTS campaign_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'thumbnail', 'banner', 'logo', 'gallery', 'video', 'brand_asset', 'reference', 'document'
  title TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  url TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Campaign Targeting
CREATE TABLE IF NOT EXISTS campaign_targeting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  countries TEXT[] DEFAULT '{}',
  states TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  creator_level TEXT DEFAULT 'all',
  creator_badge TEXT DEFAULT 'all',
  min_followers INTEGER DEFAULT 0,
  max_followers INTEGER DEFAULT 0,
  min_subscribers INTEGER DEFAULT 0,
  min_views INTEGER DEFAULT 0,
  age_restriction TEXT DEFAULT 'none',
  gender TEXT DEFAULT 'all',
  devices TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Campaign Languages & Countries (Dictionary & junction)
CREATE TABLE IF NOT EXISTS campaign_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  UNIQUE(campaign_id, language_code)
);

CREATE TABLE IF NOT EXISTS campaign_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT TRUE,
  UNIQUE(campaign_id, country_code)
);

-- 9. Campaign Limits
CREATE TABLE IF NOT EXISTS campaign_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  max_participants INTEGER DEFAULT 0,
  max_videos INTEGER DEFAULT 0,
  max_posts INTEGER DEFAULT 0,
  max_earnings_cents BIGINT DEFAULT 0,
  max_daily_reward_cents BIGINT DEFAULT 0,
  max_views_counted BIGINT DEFAULT 0,
  submission_limit INTEGER DEFAULT 0,
  daily_submission_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Campaign Requirements
CREATE TABLE IF NOT EXISTS campaign_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  min_video_length_seconds INTEGER DEFAULT 0,
  max_video_length_seconds INTEGER DEFAULT 0,
  allowed_languages TEXT[] DEFAULT '{}',
  required_hashtags TEXT[] DEFAULT '{}',
  required_mentions TEXT[] DEFAULT '{}',
  required_links TEXT[] DEFAULT '{}',
  required_keywords TEXT[] DEFAULT '{}',
  required_cta TEXT,
  allowed_categories TEXT[] DEFAULT '{}',
  allowed_music TEXT[] DEFAULT '{}',
  allowed_countries TEXT[] DEFAULT '{}',
  allowed_devices TEXT[] DEFAULT '{}',
  required_thumbnail BOOLEAN DEFAULT FALSE,
  content_guidelines TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Campaign Verification Rules
CREATE TABLE IF NOT EXISTS campaign_verification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  video_public BOOLEAN DEFAULT TRUE,
  original_content BOOLEAN DEFAULT TRUE,
  min_watch_time_seconds INTEGER DEFAULT 0,
  min_retention_percent NUMERIC(5,2) DEFAULT 0,
  min_likes INTEGER DEFAULT 0,
  min_comments INTEGER DEFAULT 0,
  min_shares INTEGER DEFAULT 0,
  min_views INTEGER DEFAULT 0,
  no_deleted_videos BOOLEAN DEFAULT TRUE,
  no_private_videos BOOLEAN DEFAULT TRUE,
  duplicate_detection BOOLEAN DEFAULT TRUE,
  ai_spam_detection BOOLEAN DEFAULT TRUE,
  manual_review_required BOOLEAN DEFAULT FALSE,
  auto_approval_rules JSONB DEFAULT '{}'::jsonb,
  auto_rejection_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Campaign Rewards & Bonus Rules
CREATE TABLE IF NOT EXISTS campaign_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  reward_type TEXT NOT NULL DEFAULT 'cpm', -- 'fixed', 'per_view', 'per_click', 'per_sale', 'milestone', 'tier', 'hybrid'
  fixed_amount_cents BIGINT DEFAULT 0,
  reward_per_view_cents BIGINT DEFAULT 0,
  reward_per_click_cents BIGINT DEFAULT 0,
  reward_per_sale_cents BIGINT DEFAULT 0,
  milestone_rewards JSONB DEFAULT '[]'::jsonb,
  tier_rewards JSONB DEFAULT '[]'::jsonb,
  leaderboard_rewards JSONB DEFAULT '[]'::jsonb,
  bonus_rewards JSONB DEFAULT '[]'::jsonb,
  referral_bonus_cents BIGINT DEFAULT 0,
  early_bird_bonus_cents BIGINT DEFAULT 0,
  leaderboard_bonus_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Campaign Templates & Items
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES campaign_templates(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Campaign Schedule & Timeline
CREATE TABLE IF NOT EXISTS campaign_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  campaign_start TIMESTAMPTZ,
  campaign_end TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  review_deadline TIMESTAMPTZ,
  payout_date TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Campaign Workflows & Approvals
CREATE TABLE IF NOT EXISTS campaign_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  current_stage TEXT NOT NULL DEFAULT 'draft',
  require_approval BOOLEAN DEFAULT TRUE,
  auto_approval BOOLEAN DEFAULT FALSE,
  manual_approval BOOLEAN DEFAULT TRUE,
  moderator_queue BOOLEAN DEFAULT TRUE,
  assigned_reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  history JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Campaign Submissions Junction / Analytics table if needed
CREATE TABLE IF NOT EXISTS campaign_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  submission_id UUID UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  verified_views BIGINT DEFAULT 0,
  calculated_reward_cents BIGINT DEFAULT 0,
  ai_spam_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Campaign Leaderboards
CREATE TABLE IF NOT EXISTS campaign_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL, -- 'weekly', 'monthly', 'lifetime'
  top_creators JSONB DEFAULT '[]'::jsonb,
  top_views JSONB DEFAULT '[]'::jsonb,
  top_earnings JSONB DEFAULT '[]'::jsonb,
  top_videos JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, timeframe)
);

-- 18. Campaign Reports
CREATE TABLE IF NOT EXISTS campaign_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'summary', 'creator', 'finance', 'verification'
  format TEXT NOT NULL DEFAULT 'csv',
  config JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Campaign Notifications
CREATE TABLE IF NOT EXISTS campaign_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE campaign_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_verification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_notifications ENABLE ROW LEVEL SECURITY;

-- Grant RLS policies
-- Public / Auth users can view categories, tags, platforms, requirements, targeting, rewards, leaderboards
CREATE POLICY "Public categories read" ON campaign_categories FOR SELECT USING (true);
CREATE POLICY "Public tags read" ON campaign_tags FOR SELECT USING (true);
CREATE POLICY "Public media read" ON campaign_media FOR SELECT USING (true);
CREATE POLICY "Public assets read" ON campaign_assets FOR SELECT USING (true);
CREATE POLICY "Public targeting read" ON campaign_targeting FOR SELECT USING (true);
CREATE POLICY "Public requirements read" ON campaign_requirements FOR SELECT USING (true);
CREATE POLICY "Public rewards read" ON campaign_rewards FOR SELECT USING (true);
CREATE POLICY "Public schedule read" ON campaign_schedule FOR SELECT USING (true);
CREATE POLICY "Public leaderboards read" ON campaign_leaderboards FOR SELECT USING (true);

-- Admins have full control on all campaign management tables
CREATE POLICY "Admin full categories" ON campaign_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full settings" ON campaign_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full tags" ON campaign_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full media" ON campaign_media FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full assets" ON campaign_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full targeting" ON campaign_targeting FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full languages" ON campaign_languages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full countries" ON campaign_countries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full limits" ON campaign_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full requirements" ON campaign_requirements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full verification" ON campaign_verification_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full rewards" ON campaign_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full templates" ON campaign_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full template items" ON campaign_template_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full schedule" ON campaign_schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full workflows" ON campaign_workflows FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full submissions" ON campaign_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full leaderboards" ON campaign_leaderboards FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full reports" ON campaign_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin full notifications" ON campaign_notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Populate default system settings if missing
INSERT INTO campaign_settings (key, value)
VALUES 
  ('default_budget', '{"total_budget_cents": 500000, "daily_budget_cents": 50000, "cpm_cents": 1500}'::jsonb),
  ('default_reward', '{"reward_type": "cpm", "reward_per_view_cents": 10, "referral_bonus_cents": 2500}'::jsonb),
  ('default_verification', '{"video_public": true, "original_content": true, "min_views": 100, "ai_spam_detection": true}'::jsonb),
  ('default_country', '{"default_countries": ["US", "CA", "GB", "AU"]}'::jsonb),
  ('default_language', '{"default_languages": ["en", "es", "fr"]}'::jsonb),
  ('default_platform', '{"default_platforms": ["youtube", "instagram", "tiktok"]}'::jsonb),
  ('automation_config', '{"auto_archive": true, "auto_expire": true, "auto_notify": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
