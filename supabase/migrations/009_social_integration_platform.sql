-- Social Integration Management Platform
-- Secret values are encrypted by the social-integrations Edge Function using
-- SOCIAL_CREDENTIALS_ENCRYPTION_KEY. No credential plaintext is readable via RLS.

CREATE TABLE IF NOT EXISTS admin_roles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_roles (user_id, role)
SELECT id, 'super_admin' FROM profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION social_admin_rank(p_role TEXT) RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role WHEN 'super_admin' THEN 3 WHEN 'admin' THEN 2 WHEN 'moderator' THEN 1 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION has_social_admin_role(p_minimum TEXT DEFAULT 'moderator') RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT social_admin_rank(ar.role) >= social_admin_rank(p_minimum)
    FROM admin_roles ar WHERE ar.user_id = auth.uid()), false);
$$;

CREATE TABLE IF NOT EXISTS social_platforms (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'social',
  enabled BOOLEAN NOT NULL DEFAULT false,
  oauth_supported BOOLEAN NOT NULL DEFAULT true,
  webhook_supported BOOLEAN NOT NULL DEFAULT false,
  api_health_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (api_health_status IN ('healthy','degraded','offline','not_configured')),
  last_sync_at TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO social_platforms (id, display_name, icon_key, category, oauth_supported, webhook_supported) VALUES
  ('youtube', 'YouTube', 'youtube', 'video', true, true),
  ('instagram', 'Instagram', 'instagram', 'social', true, true),
  ('tiktok', 'TikTok', 'video', 'social', true, true),
  ('x', 'X', 'twitter', 'social', true, true),
  ('facebook', 'Facebook', 'facebook', 'social', true, true),
  ('twitch', 'Twitch', 'twitch', 'video', true, true),
  ('kick', 'Kick', 'radio', 'video', true, false),
  ('linkedin', 'LinkedIn', 'linkedin', 'professional', true, true),
  ('snapchat', 'Snapchat', 'ghost', 'social', true, false),
  ('reddit', 'Reddit', 'message-circle', 'community', true, false),
  ('discord', 'Discord', 'gamepad-2', 'community', true, true)
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, icon_key = EXCLUDED.icon_key;

CREATE TABLE IF NOT EXISTS social_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL UNIQUE REFERENCES social_platforms(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox','production')),
  oauth_version TEXT NOT NULL DEFAULT '2.0',
  api_version TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  redirect_url TEXT,
  encrypted_secrets JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_fingerprint TEXT,
  credentials_status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (credentials_status IN ('unconfigured','configured','invalid','expired')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  platform_id TEXT PRIMARY KEY REFERENCES social_platforms(id) ON DELETE CASCADE,
  max_requests INTEGER NOT NULL DEFAULT 100 CHECK (max_requests > 0),
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (sync_interval_minutes >= 5),
  retry_count INTEGER NOT NULL DEFAULT 3 CHECK (retry_count BETWEEN 0 AND 10),
  request_timeout_ms INTEGER NOT NULL DEFAULT 10000 CHECK (request_timeout_ms BETWEEN 1000 AND 120000),
  cache_duration_seconds INTEGER NOT NULL DEFAULT 300 CHECK (cache_duration_seconds >= 0),
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  webhook_secret_fingerprint TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (platform_id) SELECT id FROM social_platforms ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE RESTRICT,
  platform_account_id TEXT NOT NULL,
  platform_username TEXT,
  encrypted_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','disabled','error')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  follower_count BIGINT NOT NULL DEFAULT 0,
  subscriber_count BIGINT NOT NULL DEFAULT 0,
  view_count BIGINT NOT NULL DEFAULT 0,
  post_count BIGINT NOT NULL DEFAULT 0,
  video_count BIGINT NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, platform_account_id)
);

CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_hash TEXT NOT NULL UNIQUE,
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','expired','cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
  account_id UUID REFERENCES creator_social_accounts(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('account','submission','webhook','health')),
  trigger_source TEXT NOT NULL DEFAULT 'scheduled' CHECK (trigger_source IN ('scheduled','manual','webhook','retry')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','partial','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
  account_id UUID REFERENCES creator_social_accounts(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('info','warning','error')),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  response_time_ms INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
  event_id TEXT,
  event_type TEXT,
  signature_valid BOOLEAN,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed','ignored')),
  attempts INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS api_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','offline','not_configured')),
  response_time_ms INTEGER,
  http_status INTEGER,
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMPTZ,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_creator_platform ON creator_social_accounts(creator_id, platform_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_queue ON sync_jobs(status, run_after) WHERE status IN ('queued','failed');
CREATE INDEX IF NOT EXISTS idx_sync_logs_platform_created ON sync_logs(platform_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform_received ON webhook_logs(platform_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_logs_platform_checked ON api_health_logs(platform_id, checked_at DESC);

ALTER TABLE social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_platforms_admin_read ON social_platforms FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY platform_settings_admin_read ON platform_settings FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY accounts_admin_read ON creator_social_accounts FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY sync_jobs_admin_read ON sync_jobs FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY sync_logs_admin_read ON sync_logs FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY webhook_logs_admin_read ON webhook_logs FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY health_logs_admin_read ON api_health_logs FOR SELECT USING (has_social_admin_role('moderator'));
CREATE POLICY admin_roles_read ON admin_roles FOR SELECT USING (has_social_admin_role('moderator'));

CREATE OR REPLACE FUNCTION social_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_social_platforms BEFORE UPDATE ON social_platforms FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();
CREATE TRIGGER touch_social_credentials BEFORE UPDATE ON social_credentials FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();
CREATE TRIGGER touch_platform_settings BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();
CREATE TRIGGER touch_creator_social_accounts BEFORE UPDATE ON creator_social_accounts FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();
CREATE TRIGGER touch_sync_jobs BEFORE UPDATE ON sync_jobs FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();
CREATE TRIGGER touch_admin_roles BEFORE UPDATE ON admin_roles FOR EACH ROW EXECUTE FUNCTION social_touch_updated_at();

-- Enqueue a sync without allowing the browser to set attempts or payload.
CREATE OR REPLACE FUNCTION enqueue_social_sync(p_platform_id TEXT, p_account_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_job_id UUID; v_retry_count INTEGER;
BEGIN
  IF NOT has_social_admin_role('admin') THEN RAISE EXCEPTION 'Insufficient social integration permission'; END IF;
  SELECT retry_count INTO v_retry_count FROM platform_settings WHERE platform_id = p_platform_id;
  INSERT INTO sync_jobs(platform_id, account_id, job_type, trigger_source, max_attempts, created_by)
  VALUES (p_platform_id, p_account_id, CASE WHEN p_account_id IS NULL THEN 'health' ELSE 'account' END, 'manual', COALESCE(v_retry_count, 3), auth.uid())
  RETURNING id INTO v_job_id;
  INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'social.sync.enqueued', 'social_platform', p_platform_id, jsonb_build_object('account_id', p_account_id, 'job_id', v_job_id));
  RETURN v_job_id;
END; $$;
