-- Migration: 20260721_instagram_provider_connections.sql
-- Description: Extends the existing provider_connections table for Instagram deep metrics and creates social_metrics tracking.

-- 1. Extend public.provider_connections (using existing schema properties)
DO $$
BEGIN
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS biography TEXT;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS followers_count BIGINT DEFAULT 0;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS follows_count BIGINT DEFAULT 0;
    ALTER TABLE public.provider_connections ADD COLUMN IF NOT EXISTS media_count BIGINT DEFAULT 0;
END $$;

-- 2. Create social_metrics table for historical tracking
CREATE TABLE IF NOT EXISTS public.social_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES public.provider_connections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(connection_id, date)
);

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
                )
            );
    END IF;
END $$;
