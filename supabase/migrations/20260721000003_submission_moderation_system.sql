-- ====================================================
-- CreatorX Submission Management & AI Moderation Schema
-- Migration File: 20260721_submission_moderation_system.sql
-- ====================================================

-- 1. SUBMISSION REVIEWERS
CREATE TABLE IF NOT EXISTS public.submission_reviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    active_workload INT DEFAULT 0,
    completed_reviews_count INT DEFAULT 0,
    average_response_time_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXTENDING / ENHANCING SUBMISSIONS TABLE WITH COMPANION
CREATE TABLE IF NOT EXISTS public.submission_moderation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE NOT NULL,
    ai_risk_score INT DEFAULT 0, -- 0 to 100 risk
    ai_confidence_score INT DEFAULT 0, -- 0 to 100 confidence
    ocr_hashtags_checked JSONB DEFAULT '[]'::jsonb,
    ocr_mentions_checked JSONB DEFAULT '[]'::jsonb,
    detected_language VARCHAR(50),
    detected_region VARCHAR(100),
    is_public_video BOOLEAN DEFAULT TRUE,
    video_duration_seconds INT,
    assigned_reviewer_id UUID REFERENCES public.submission_reviewers(id) ON DELETE SET NULL,
    auto_expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBMISSION MEDIA (Frame-by-frame, thumbnails)
CREATE TABLE IF NOT EXISTS public.submission_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- thumbnail, video_frame, audio_fingerprint
    file_url TEXT NOT NULL,
    frame_timestamp_seconds INT,
    image_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBMISSION DUPLICATES
CREATE TABLE IF NOT EXISTS public.submission_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    original_submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    similarity_score INT DEFAULT 0, -- 0 to 100
    duplicate_type VARCHAR(50) NOT NULL, -- url, video, audio, thumbnail
    cross_campaign BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBMISSION FRAUD DATA
CREATE TABLE IF NOT EXISTS public.submission_fraud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE NOT NULL,
    fake_views_detected BOOLEAN DEFAULT FALSE,
    fake_likes_detected BOOLEAN DEFAULT FALSE,
    fake_comments_detected BOOLEAN DEFAULT FALSE,
    vpn_proxy_used BOOLEAN DEFAULT FALSE,
    multi_account_match BOOLEAN DEFAULT FALSE,
    rapid_upload_abuse BOOLEAN DEFAULT FALSE,
    suspicious_traffic_score INT DEFAULT 0, -- 0 to 100
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBMISSION REVIEWS (Manual review actions)
CREATE TABLE IF NOT EXISTS public.submission_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.submission_reviewers(id) ON DELETE SET NULL,
    notes TEXT,
    checklist_checked JSONB DEFAULT '{}'::jsonb, -- e.g. {"has_logo": true, "correct_audio": false}
    decision VARCHAR(50) NOT NULL, -- approve, reject, request_changes, escalate
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBMISSION APPEALS
CREATE TABLE IF NOT EXISTS public.submission_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, info_requested
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUBMISSION REWARDS (Dynamic rewards breakdown)
CREATE TABLE IF NOT EXISTS public.submission_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE NOT NULL,
    base_reward_cents INT DEFAULT 0,
    bonus_cents INT DEFAULT 0,
    penalty_cents INT DEFAULT 0,
    final_reward_cents INT DEFAULT 0,
    payout_status VARCHAR(50) DEFAULT 'pending', -- pending, eligible, paid, reversed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SUBMISSION HISTORY (Audit timeline logs)
CREATE TABLE IF NOT EXISTS public.submission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUBMISSION SETTINGS
CREATE TABLE IF NOT EXISTS public.submission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auto_approval_enabled BOOLEAN DEFAULT FALSE,
    manual_approval_required BOOLEAN DEFAULT TRUE,
    ai_threshold_score INT DEFAULT 70,
    fraud_threshold_score INT DEFAULT 30,
    duplicate_threshold_score INT DEFAULT 85,
    max_review_time_hours INT DEFAULT 48,
    default_reviewer_id UUID REFERENCES public.submission_reviewers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- RLS POLICIES & SECURITY
-- ====================================================
ALTER TABLE public.submission_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_moderation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_fraud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_settings ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Allow authenticated read on reviewers" ON public.submission_reviewers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on metadata" ON public.submission_moderation_metadata FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on media" ON public.submission_media FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on duplicates" ON public.submission_duplicates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on fraud" ON public.submission_fraud FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on reviews" ON public.submission_reviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on appeals" ON public.submission_appeals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on rewards" ON public.submission_rewards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on history" ON public.submission_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on settings" ON public.submission_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Admin write access policies
CREATE POLICY "Admin write submission_reviewers" ON public.submission_reviewers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_moderation_metadata" ON public.submission_moderation_metadata FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_media" ON public.submission_media FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_duplicates" ON public.submission_duplicates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_fraud" ON public.submission_fraud FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_reviews" ON public.submission_reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_appeals" ON public.submission_appeals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_rewards" ON public.submission_rewards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_history" ON public.submission_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write submission_settings" ON public.submission_settings FOR ALL USING (auth.role() = 'authenticated');
