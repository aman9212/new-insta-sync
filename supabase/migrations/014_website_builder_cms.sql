-- ===================================================
-- CreatorX Website Builder & CMS Database Migration
-- Migration: 002_website_builder_cms.sql
-- ===================================================

BEGIN;

-- 1. WEBSITE SETTINGS
CREATE TABLE IF NOT EXISTS public.website_settings (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. WEBSITE PAGES
CREATE TABLE IF NOT EXISTS public.website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(128) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  seo_title VARCHAR(255),
  seo_description TEXT,
  keywords TEXT[],
  og_image TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WEBSITE SECTIONS
CREATE TABLE IF NOT EXISTS public.website_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.website_pages(id) ON DELETE CASCADE,
  section_type VARCHAR(64) NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  description TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WEBSITE BLOCKS
CREATE TABLE IF NOT EXISTS public.website_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.website_sections(id) ON DELETE CASCADE,
  block_type VARCHAR(64) NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WEBSITE MENUS
CREATE TABLE IF NOT EXISTS public.website_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  location VARCHAR(64) NOT NULL UNIQUE,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WEBSITE MEDIA
CREATE TABLE IF NOT EXISTS public.website_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(64) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  folder VARCHAR(128) DEFAULT 'general',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BLOG CATEGORIES
CREATE TABLE IF NOT EXISTS public.website_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BLOG TAGS
CREATE TABLE IF NOT EXISTS public.website_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WEBSITE BLOG POSTS
CREATE TABLE IF NOT EXISTS public.website_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(128) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category_id UUID REFERENCES public.website_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_name VARCHAR(128) DEFAULT 'CreatorX Team',
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  seo_title VARCHAR(255),
  seo_description TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WEBSITE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.website_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(32) NOT NULL CHECK (type IN ('top_banner', 'popup', 'toast', 'maintenance_notice', 'marketing_banner')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  link_text VARCHAR(128),
  bg_color VARCHAR(32) DEFAULT '#8b5cf6',
  text_color VARCHAR(32) DEFAULT '#ffffff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. WEBSITE SEO
CREATE TABLE IF NOT EXISTS public.website_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug VARCHAR(128) UNIQUE NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[],
  canonical_url TEXT,
  og_image TEXT,
  og_title VARCHAR(255),
  og_description TEXT,
  twitter_card VARCHAR(64) DEFAULT 'summary_large_image',
  robots VARCHAR(64) DEFAULT 'index, follow',
  json_ld JSONB DEFAULT '{}'::jsonb,
  favicon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. WEBSITE REDIRECTS
CREATE TABLE IF NOT EXISTS public.website_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path VARCHAR(255) UNIQUE NOT NULL,
  target_path VARCHAR(255) NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 404)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. WEBSITE CUSTOM CODE
CREATE TABLE IF NOT EXISTS public.website_custom_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  location VARCHAR(32) NOT NULL CHECK (location IN ('head', 'body_start', 'body_end', 'footer')),
  code_type VARCHAR(32) NOT NULL CHECK (code_type IN ('javascript', 'css', 'html', 'analytics')),
  code_content TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WEBSITE VERSIONS
CREATE TABLE IF NOT EXISTS public.website_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.website_pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_json JSONB NOT NULL,
  change_summary TEXT,
  created_by VARCHAR(128) DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================
-- INDEXES FOR HIGH PERFORMANCE
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_website_pages_slug ON public.website_pages(slug);
CREATE INDEX IF NOT EXISTS idx_website_sections_page ON public.website_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_website_blocks_section ON public.website_blocks(section_id);
CREATE INDEX IF NOT EXISTS idx_website_blog_posts_slug ON public.website_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_website_redirects_source ON public.website_redirects(source_path);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_custom_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_versions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read website_settings" ON public.website_settings FOR SELECT USING (true);
CREATE POLICY "Public read website_pages" ON public.website_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Public read website_sections" ON public.website_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Public read website_blocks" ON public.website_blocks FOR SELECT USING (is_active = true);
CREATE POLICY "Public read website_menus" ON public.website_menus FOR SELECT USING (is_active = true);
CREATE POLICY "Public read website_media" ON public.website_media FOR SELECT USING (true);
CREATE POLICY "Public read website_categories" ON public.website_categories FOR SELECT USING (true);
CREATE POLICY "Public read website_tags" ON public.website_tags FOR SELECT USING (true);
CREATE POLICY "Public read website_blog_posts" ON public.website_blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read website_announcements" ON public.website_announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read website_seo" ON public.website_seo FOR SELECT USING (true);
CREATE POLICY "Public read website_redirects" ON public.website_redirects FOR SELECT USING (is_active = true);
CREATE POLICY "Public read website_custom_code" ON public.website_custom_code FOR SELECT USING (is_enabled = true);

-- Admin full access policies
CREATE POLICY "Admin write website_settings" ON public.website_settings FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_pages" ON public.website_pages FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_sections" ON public.website_sections FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_blocks" ON public.website_blocks FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_menus" ON public.website_menus FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_media" ON public.website_media FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_categories" ON public.website_categories FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_tags" ON public.website_tags FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_blog_posts" ON public.website_blog_posts FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_announcements" ON public.website_announcements FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_seo" ON public.website_seo FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_redirects" ON public.website_redirects FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_custom_code" ON public.website_custom_code FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);
CREATE POLICY "Admin write website_versions" ON public.website_versions FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR true);

-- ===================================================
-- INITIAL DEFAULT SEED DATA
-- ===================================================

INSERT INTO public.website_settings (id, category, settings_json) VALUES
('hero', 'homepage', '{
  "title": "Make every moment compound.",
  "subtitle": "The creator operating system",
  "description": "CreatorX turns sharp creative work into measurable momentum—connecting high-fit campaigns, performance intelligence, and payouts in one beautifully calm workspace.",
  "primaryCta": {"text": "Build your momentum", "url": "/login"},
  "secondaryCta": {"text": "See the flow", "url": "#how-it-works"},
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "badge": "The creator operating system",
  "animationEnabled": true,
  "stats": [
    {"label": "Creator balance", "value": "$2,480.20"},
    {"label": "Momentum score", "value": "94/100"},
    {"label": "Earnings velocity", "value": "+28.6%"}
  ]
}'::jsonb),
('navbar', 'navigation', '{
  "logoText": "creatorx",
  "logoUrl": "/",
  "sticky": true,
  "transparent": true,
  "showCTA": true,
  "ctaText": "Start creating",
  "ctaUrl": "/login",
  "showSignIn": true
}'::jsonb),
('footer', 'navigation', '{
  "companyName": "CreatorX Studio",
  "description": "One premium home for the creative economy’s most ambitious teams and independent voices.",
  "email": "support@creatorx.io",
  "phone": "+1 (800) 555-0199",
  "address": "100 Innovation Way, San Francisco, CA",
  "copyright": "© 2026 CreatorX. Made for momentum.",
  "newsletterTitle": "Stay updated",
  "newsletterSubtitle": "Subscribe to our newsletter for creator tips and system updates."
}'::jsonb),
('contact', 'general', '{
  "email": "hello@creatorx.io",
  "phone": "+1 (800) 555-0199",
  "whatsapp": "+18005550199",
  "discord": "https://discord.gg/creatorx",
  "telegram": "https://t.me/creatorx",
  "supportHours": "Mon - Fri: 9:00 AM - 6:00 PM PST",
  "address": "100 Innovation Way, San Francisco, CA",
  "googleMapsEmbed": "https://maps.google.com"
}'::jsonb),
('social', 'general', '{
  "youtube": "https://youtube.com/@creatorx",
  "instagram": "https://instagram.com/creatorx",
  "tiktok": "https://tiktok.com/@creatorx",
  "facebook": "https://facebook.com/creatorx",
  "twitter": "https://x.com/creatorx",
  "linkedin": "https://linkedin.com/company/creatorx",
  "discord": "https://discord.gg/creatorx",
  "reddit": "https://reddit.com/r/creatorx",
  "github": "https://github.com/creatorx"
}'::jsonb),
('maintenance', 'system', '{
  "enabled": false,
  "message": "We are upgrading our platform for better performance. We will be back online shortly!",
  "countdownEnd": "2026-08-01T00:00:00Z",
  "whitelistAdmin": true
}'::jsonb),
('seo', 'general', '{
  "metaTitle": "CreatorX — Premium Creator Clipping & Campaign Platform",
  "metaDescription": "CreatorX connects high-fit campaigns, performance intelligence, and instant payouts for creators.",
  "keywords": ["creator economy", "clipping", "campaigns", "monetization", "influencer marketing"],
  "canonicalUrl": "https://creatorx.io",
  "ogImage": "https://creatorx.io/og-image.jpg",
  "twitterCard": "summary_large_image",
  "robots": "index, follow",
  "faviconUrl": "/favicon.ico"
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET settings_json = EXCLUDED.settings_json, updated_at = NOW();

INSERT INTO public.website_menus (name, location, items_json) VALUES
('Header Main Menu', 'main_navbar', '[
  {"id": "1", "label": "Platform", "url": "#how-it-works", "openInNewTab": false},
  {"id": "2", "label": "Intelligence", "url": "#intelligence", "openInNewTab": false},
  {"id": "3", "label": "For teams", "url": "#for-teams", "openInNewTab": false},
  {"id": "4", "label": "Blog", "url": "/blog", "openInNewTab": false}
]'::jsonb),
('Footer Quick Links', 'footer_quick', '[
  {"id": "1", "label": "Platform Overview", "url": "#how-it-works"},
  {"id": "2", "label": "Creator Intelligence", "url": "#intelligence"},
  {"id": "3", "label": "Blog & News", "url": "/blog"}
]'::jsonb),
('Footer Support & Legal', 'footer_support', '[
  {"id": "1", "label": "Privacy Policy", "url": "/legal/privacy"},
  {"id": "2", "label": "Terms of Service", "url": "/legal/terms"},
  {"id": "3", "label": "Refund Policy", "url": "/legal/refund"},
  {"id": "4", "label": "Cookie Policy", "url": "/legal/cookie"}
]'::jsonb)
ON CONFLICT (location) DO UPDATE SET items_json = EXCLUDED.items_json, updated_at = NOW();

COMMIT;
