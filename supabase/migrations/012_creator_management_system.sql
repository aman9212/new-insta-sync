-- Migration: 012_creator_management_system.sql
-- Description: Complete Enterprise Creator Management System schema for CreatorX

-- 1. Create creator account status enum if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'creator_account_status') THEN
    CREATE TYPE creator_account_status AS ENUM (
      'pending',
      'verified',
      'rejected',
      'suspended',
      'banned',
      'archived',
      'deleted'
    );
  END IF;
END $$;

-- 2. Creator Settings (Global Admin System Configurations)
CREATE TABLE IF NOT EXISTS creator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Extend / Ensure creator_profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  banner_url TEXT,
  country TEXT DEFAULT 'US',
  state TEXT,
  city TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  bio TEXT,
  portfolio_url TEXT,
  website_url TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT DEFAULT 'intermediate',
  status creator_account_status DEFAULT 'pending',
  kyc_status TEXT DEFAULT 'unsubmitted', -- 'unsubmitted', 'pending', 'approved', 'rejected', 'changes_requested'
  is_online BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  device_info TEXT,
  last_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Creator Levels & XP System
CREATE TABLE IF NOT EXISTS creator_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_xp BIGINT DEFAULT 0,
  level_number INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Rookie Clipper',
  rank_name TEXT DEFAULT 'Bronze',
  unlocked_rewards JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Creator Badges Library & Awards
CREATE TABLE IF NOT EXISTS creator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  icon TEXT DEFAULT 'award',
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(creator_id, badge_key)
);

-- 6. Creator Social Accounts
CREATE TABLE IF NOT EXISTS creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'youtube', 'instagram', 'tiktok', 'facebook', 'x', 'linkedin', 'discord', 'twitch', 'kick'
  account_handle TEXT NOT NULL,
  follower_count BIGINT DEFAULT 0,
  subscriber_count BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, platform)
);

-- 7. Creator Wallets & Financial Controls
CREATE TABLE IF NOT EXISTS creator_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  available_balance_cents BIGINT DEFAULT 0,
  pending_balance_cents BIGINT DEFAULT 0,
  locked_balance_cents BIGINT DEFAULT 0,
  lifetime_earnings_cents BIGINT DEFAULT 0,
  total_withdrawals_cents BIGINT DEFAULT 0,
  bonus_earnings_cents BIGINT DEFAULT 0,
  referral_earnings_cents BIGINT DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Creator KYC Documents & Submissions
CREATE TABLE IF NOT EXISTS creator_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'changes_requested'
  doc_type TEXT DEFAULT 'government_id',
  gov_id_url TEXT,
  passport_url TEXT,
  driving_license_url TEXT,
  selfie_url TEXT,
  address_proof_url TEXT,
  tax_doc_url TEXT,
  business_doc_url TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Creator Notes & Internal Flags
CREATE TABLE IF NOT EXISTS creator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'internal', -- 'internal', 'warning', 'flag'
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'fraud_risk', 'bot_views', 'duplicate_account', 'suspicious_activity'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Creator Referrals Engine
CREATE TABLE IF NOT EXISTS creator_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  commission_bps INTEGER DEFAULT 500, -- 5.0% BPS
  lifetime_commission_cents BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Creator Permissions & Impersonation Audit
CREATE TABLE IF NOT EXISTS creator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, permission_key)
);

-- 12. Creator Analytics Snapshots
CREATE TABLE IF NOT EXISTS creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count BIGINT DEFAULT 0,
  earnings_cents BIGINT DEFAULT 0,
  campaign_completions INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

-- 13. Creator Audit & History Log
CREATE TABLE IF NOT EXISTS creator_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'status_changed', 'kyc_reviewed', 'balance_adjusted', 'badge_awarded', 'account_frozen'
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Creator Custom Reports
CREATE TABLE IF NOT EXISTS creator_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'performance', 'earnings', 'history', 'fraud'
  format TEXT NOT NULL DEFAULT 'csv',
  file_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all creator management tables
ALTER TABLE creator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_reports ENABLE ROW LEVEL SECURITY;

-- Public / Auth Creator Read RLS Policies
CREATE POLICY "Creator self profile read" ON creator_profiles FOR SELECT USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Creator self level read" ON creator_levels FOR SELECT USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Creator self badges read" ON creator_badges FOR SELECT USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Creator self social read" ON creator_social_accounts FOR SELECT USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Creator self wallet read" ON creator_wallets FOR SELECT USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Creator self kyc read" ON creator_kyc FOR SELECT USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin Full Access RLS Policies
CREATE POLICY "Admin full creator settings" ON creator_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator profiles" ON creator_profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator levels" ON creator_levels FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator badges" ON creator_badges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator social" ON creator_social_accounts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator wallets" ON creator_wallets FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator kyc" ON creator_kyc FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator notes" ON creator_notes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator flags" ON creator_flags FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator referrals" ON creator_referrals FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator permissions" ON creator_permissions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator analytics" ON creator_analytics FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator history" ON creator_history FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full creator reports" ON creator_reports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Creator policy values are deliberately not seeded. Administrators configure every
-- eligibility, KYC, referral, and level rule through creator_settings.
