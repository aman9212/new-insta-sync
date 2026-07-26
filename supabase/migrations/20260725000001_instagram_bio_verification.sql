-- Migration: 20260725000001_instagram_bio_verification.sql
-- Description: Adds Instagram Bio Verification schema coexisting with OAuth link account system.

-- 1. Extend public.provider_connections table safely
DO $$
BEGIN
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS ownership_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS verification_method TEXT;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'connected';
END $$;

-- 2. Create instagram_verifications table for tracking bio verification codes & attempts
CREATE TABLE IF NOT EXISTS public.instagram_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_connection_id UUID NOT NULL REFERENCES public.provider_connections(id) ON DELETE CASCADE,
    verification_code VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
    verification_method VARCHAR(32) NOT NULL DEFAULT 'bio',
    attempts INTEGER NOT NULL DEFAULT 0,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    verified_at TIMESTAMPTZ
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_ig_verifications_conn_status ON public.instagram_verifications(provider_connection_id, status);
CREATE INDEX IF NOT EXISTS idx_ig_verifications_user ON public.instagram_verifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_verifications_code ON public.instagram_verifications(verification_code);

-- 3. Row Level Security Policies
ALTER TABLE public.instagram_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own verifications'
    ) THEN
        CREATE POLICY "Creators can view own verifications" ON public.instagram_verifications
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can insert own verifications'
    ) THEN
        CREATE POLICY "Creators can insert own verifications" ON public.instagram_verifications
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can update own verifications'
    ) THEN
        CREATE POLICY "Creators can update own verifications" ON public.instagram_verifications
            FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
            WITH CHECK (user_id = auth.uid() OR public.is_admin());
    END IF;
END $$;
