-- Migration: 20260725_instagram_production_tables.sql
-- Description: Creates & verifies tables for Instagram Graph API production integration including provider_connections extensions, social_metrics, sync_history, api_logs, and action center triggers.

-- 1. Extend provider_connections table safely
DO $$
BEGIN
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS biography TEXT;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS followers_count BIGINT DEFAULT 0;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS follows_count BIGINT DEFAULT 0;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS media_count BIGINT DEFAULT 0;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS encrypted_token TEXT;
END $$;

-- Trigger to sync encrypted_token and encrypted_token_reference if one is updated
CREATE OR REPLACE FUNCTION public.sync_provider_connection_tokens()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.encrypted_token IS NOT NULL THEN
            NEW.encrypted_token_reference := NEW.encrypted_token;
        ELSIF NEW.encrypted_token_reference IS NOT NULL THEN
            NEW.encrypted_token := NEW.encrypted_token_reference;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.encrypted_token IS NOT NULL AND (OLD.encrypted_token IS NULL OR NEW.encrypted_token <> OLD.encrypted_token) THEN
            NEW.encrypted_token_reference := NEW.encrypted_token;
        ELSIF NEW.encrypted_token_reference IS NOT NULL AND (OLD.encrypted_token_reference IS NULL OR NEW.encrypted_token_reference <> OLD.encrypted_token_reference) THEN
            NEW.encrypted_token := NEW.encrypted_token_reference;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_provider_connection_tokens ON public.provider_connections;
CREATE TRIGGER trg_sync_provider_connection_tokens
    BEFORE INSERT OR UPDATE ON public.provider_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_provider_connection_tokens();

-- 2. Create social_metrics table for historical tracking
CREATE TABLE IF NOT EXISTS public.social_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES public.provider_connections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, date)
);

CREATE INDEX IF NOT EXISTS idx_social_metrics_conn_date ON public.social_metrics(connection_id, date DESC);

-- RLS for social_metrics
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own social metrics'
    ) THEN
        CREATE POLICY "Creators can view own social metrics" ON public.social_metrics
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.provider_connections
                    WHERE provider_connections.id = social_metrics.connection_id
                    AND provider_connections.user_id = auth.uid()
                ) OR public.is_admin()
            );
    END IF;
END $$;

-- 3. Create sync_history table for sync execution tracking
CREATE TABLE IF NOT EXISTS public.sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES public.provider_connections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'instagram',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited', 'token_expired', 'reconnect_required', 'running', 'disabled')),
    records_synced INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_history_conn_created ON public.sync_history(connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_created ON public.sync_history(user_id, created_at DESC);

-- RLS for sync_history
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own sync history'
    ) THEN
        CREATE POLICY "Creators can view own sync history" ON public.sync_history
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
    END IF;
END $$;

-- 4. Create api_logs table for API requests & error tracking
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES public.provider_connections(id) ON DELETE SET NULL,
    platform TEXT NOT NULL DEFAULT 'instagram',
    endpoint TEXT NOT NULL,
    http_status INTEGER,
    request_duration_ms INTEGER,
    error_code TEXT,
    error_message TEXT,
    response_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_platform_created ON public.api_logs(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_conn_created ON public.api_logs(connection_id, created_at DESC);

-- RLS for api_logs
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view api logs'
    ) THEN
        CREATE POLICY "Admins can view api logs" ON public.api_logs
            FOR SELECT USING (public.is_admin());
    END IF;
END $$;

-- 5. Update Creator Dynamic Action Center RPC to detect reconnect_required accounts
CREATE OR REPLACE FUNCTION public.get_creator_action_items()
RETURNS TABLE (
  type text,
  priority text,
  title text,
  description text,
  target_route text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Provider connection expired, revoked, or reconnect_required
  RETURN QUERY
  SELECT
    'provider_connection'::text,
    'Critical'::text,
    'Social account reconnection required'::text,
    'Your ' || provider::text || ' account (' || COALESCE(provider_username, 'connected') || ') status is ' || status::text || '. Reconnect to resume metric tracking.',
    '/creator/accounts'::text,
    updated_at
  FROM public.provider_connections
  WHERE user_id = auth.uid()
    AND (status IN ('expired', 'revoked', 'disabled', 'reconnect_required', 'token_expired') OR verification_status = 'pending');

  -- 2. Submission under verification hold
  RETURN QUERY
  SELECT
    'submission_verification'::text,
    'Important'::text,
    'Submission under verification hold'::text,
    'Your submission for campaign "' || c.name || '" is currently held for metric verification.',
    '/creator/submissions'::text,
    s.updated_at
  FROM public.submissions s
  JOIN public.campaigns c ON c.id = s.campaign_id
  WHERE s.creator_id = auth.uid()
    AND s.status = 'under_review';
END;
$$;
