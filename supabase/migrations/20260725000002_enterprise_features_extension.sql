-- Migration: 20260725000002_enterprise_features_extension.sql
-- Description: Extends submissions schema for compliance validation & creates creator_media_kits table.

-- 1. Extend public.submissions table safely
DO $$
BEGIN
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS caption_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS missing_hashtags TEXT[] DEFAULT '{}';
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS missing_mentions TEXT[] DEFAULT '{}';
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS validation_details JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS performance_tier TEXT DEFAULT 'standard';
    ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS calculated_cpm_cents BIGINT DEFAULT 0;
END $$;

-- 2. Create creator_media_kits table for shareable verified creator profiles
CREATE TABLE IF NOT EXISTS public.creator_media_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    featured_platforms TEXT[] DEFAULT '{instagram,youtube}',
    trust_score INTEGER NOT NULL DEFAULT 95 CHECK (trust_score BETWEEN 0 AND 100),
    verified_badges TEXT[] DEFAULT '{verified_creator}',
    total_verified_views BIGINT NOT NULL DEFAULT 0,
    total_earnings_cents BIGINT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_media_kits_user ON public.creator_media_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_media_kits_slug ON public.creator_media_kits(slug);

-- 3. Row Level Security Policies
ALTER TABLE public.creator_media_kits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public read for active media kits'
    ) THEN
        CREATE POLICY "Public read for active media kits" ON public.creator_media_kits
            FOR SELECT USING (is_public = TRUE OR user_id = auth.uid() OR public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can manage own media kit'
    ) THEN
        CREATE POLICY "Creators can manage own media kit" ON public.creator_media_kits
            FOR ALL USING (user_id = auth.uid() OR public.is_admin())
            WITH CHECK (user_id = auth.uid() OR public.is_admin());
    END IF;
END $$;
