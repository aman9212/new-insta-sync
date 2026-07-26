-- ===================================================
-- CreatorX Theme Builder & Design System Migration
-- Migration: 003_theme_builder_design_system.sql
-- ===================================================

BEGIN;

-- 1. THEME SETTINGS
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id VARCHAR(64) PRIMARY KEY,
  mode VARCHAR(32) NOT NULL DEFAULT 'dark' CHECK (mode IN ('dark', 'light', 'amoled')),
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. THEME PRESETS
CREATE TABLE IF NOT EXISTS public.theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  author VARCHAR(128) DEFAULT 'CreatorX',
  is_built_in BOOLEAN NOT NULL DEFAULT false,
  preset_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. THEME HISTORY (SNAP SHOTS / ROLLBACK)
CREATE TABLE IF NOT EXISTS public.theme_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  snapshot_json JSONB NOT NULL,
  change_summary TEXT,
  created_by VARCHAR(128) DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CUSTOM FONTS
CREATE TABLE IF NOT EXISTS public.custom_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family VARCHAR(128) UNIQUE NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'custom_upload')),
  weights INTEGER[] DEFAULT ARRAY[400, 500, 600, 700],
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CUSTOM ICONS
CREATE TABLE IF NOT EXISTS public.custom_icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name VARCHAR(64) NOT NULL DEFAULT 'lucide' CHECK (pack_name IN ('lucide', 'heroicons', 'tabler', 'phosphor', 'material')),
  custom_svgs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BRANDING SETTINGS
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  brand_name VARCHAR(128) NOT NULL DEFAULT 'CreatorX',
  company_name VARCHAR(128) NOT NULL DEFAULT 'CreatorX Studio Inc.',
  dark_logo_url TEXT,
  light_logo_url TEXT,
  favicon_url TEXT,
  app_icon_url TEXT,
  loading_logo_url TEXT,
  email_logo_url TEXT,
  custom_domain VARCHAR(255),
  support_email VARCHAR(128) DEFAULT 'support@creatorx.io',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. APPEARANCE SETTINGS
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  active_preset_slug VARCHAR(128) DEFAULT 'creatorx-default',
  custom_css TEXT,
  enable_animations BOOLEAN NOT NULL DEFAULT true,
  enable_glassmorphism BOOLEAN NOT NULL DEFAULT true,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  active_icon_pack VARCHAR(64) DEFAULT 'lucide',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read theme_settings" ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY "Public read theme_presets" ON public.theme_presets FOR SELECT USING (true);
CREATE POLICY "Public read custom_fonts" ON public.custom_fonts FOR SELECT USING (true);
CREATE POLICY "Public read branding_settings" ON public.branding_settings FOR SELECT USING (true);
CREATE POLICY "Public read appearance_settings" ON public.appearance_settings FOR SELECT USING (true);

CREATE POLICY "Admin write theme_settings" ON public.theme_settings FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write theme_presets" ON public.theme_presets FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write theme_history" ON public.theme_history FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write custom_fonts" ON public.custom_fonts FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write custom_icons" ON public.custom_icons FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write branding_settings" ON public.branding_settings FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write appearance_settings" ON public.appearance_settings FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);

-- ===================================================
-- SEED INITIAL BUILT-IN THEME PRESETS
-- ===================================================
INSERT INTO public.theme_presets (name, slug, description, is_built_in, preset_json) VALUES
('CreatorX Default', 'creatorx-default', 'Official atmospheric glassmorphism dark theme with purple accent glow.', true, '{
  "primary": "#8b9bff",
  "accent": "#8b5cf6",
  "background": "#080a13",
  "surface": "#13172a",
  "textPrimary": "#f4f5ff",
  "borderRadius": "16px",
  "glassBlur": "22px"
}'::jsonb),
('Luxury Black', 'luxury-black', 'Deep luxury jet-black theme with subtle gold and violet accents.', true, '{
  "primary": "#d4af37",
  "accent": "#a78bfa",
  "background": "#030303",
  "surface": "#0d0d0d",
  "textPrimary": "#ffffff",
  "borderRadius": "20px",
  "glassBlur": "30px"
}'::jsonb),
('Apple Dark', 'apple-dark', 'Sleek San Francisco dark mode with crisp borders and translucent glass.', true, '{
  "primary": "#007aff",
  "accent": "#5e5ce6",
  "background": "#000000",
  "surface": "#1c1c1e",
  "textPrimary": "#ffffff",
  "borderRadius": "14px",
  "glassBlur": "20px"
}'::jsonb),
('Linear Cyber', 'linear-cyber', 'Minimalist high-contrast dark theme inspired by modern software engineering tools.', true, '{
  "primary": "#5e6ad2",
  "accent": "#7070ff",
  "background": "#0f1015",
  "surface": "#191a21",
  "textPrimary": "#f7f8f8",
  "borderRadius": "10px",
  "glassBlur": "16px"
}'::jsonb),
('Vercel Monochrome', 'vercel-monochrome', 'Ultra-clean monochrome black and white theme with sharp edges.', true, '{
  "primary": "#ffffff",
  "accent": "#888888",
  "background": "#000000",
  "surface": "#111111",
  "textPrimary": "#ffffff",
  "borderRadius": "8px",
  "glassBlur": "12px"
}'::jsonb),
('Stripe Indigo', 'stripe-indigo', 'Vibrant tech theme featuring gradient Indigo accents and deep slate backgrounds.', true, '{
  "primary": "#635bff",
  "accent": "#00d4ff",
  "background": "#0a2540",
  "surface": "#102a45",
  "textPrimary": "#adbdcc",
  "borderRadius": "12px",
  "glassBlur": "24px"
}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
