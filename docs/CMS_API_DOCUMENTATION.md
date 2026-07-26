# CreatorX CMS & Website Builder API Documentation

This document describes the services, data structures, and database endpoints of the CreatorX No-Code Website Management System.

---

## Data Models & Schema

The CMS system persists state across 14 PostgreSQL tables defined in `supabase/migrations/002_website_builder_cms.sql`:

1. `website_settings`: Category-keyed JSON settings (hero, navbar, footer, contact, social, seo, maintenance).
2. `website_pages`: Page slug metadata, statuses (`published`, `draft`, `scheduled`, `archived`), and version numbers.
3. `website_sections`: Section hierarchy attached to pages.
4. `website_blocks`: Modular content blocks (`hero`, `features`, `faq`, `pricing`, `testimonials`, `rich_text`, `custom_html`, etc.).
5. `website_menus`: Dynamic navigation trees (`main_navbar`, `footer_quick`, `footer_support`).
6. `website_media`: Assets registry (URL, mime type, folder taxonomy, tag filtering).
7. `website_blog_posts`: Full blog articles with rich HTML, author details, view counts, and category links.
8. `website_categories`: Post categories.
9. `website_tags`: Article and asset tags.
10. `website_announcements`: Top header banners, toast alerts, popups, and maintenance notices.
11. `website_seo`: Open Graph cards, meta titles, descriptions, and sitemap settings.
12. `website_redirects`: 301, 302, and 404 URL mapping rules and hit counters.
13. `website_custom_code`: Head, body, and footer script injections (GA4, GTM, Meta Pixel, Clarity, CSS, JS).
14. `website_versions`: Historic snapshots for autosave recovery, page comparison, and rollback.

---

## Service API Interface (`CMSService`)

Location: `src/services/cms.service.ts`

### Setting Endpoints
- `getHero()` / `updateHero(HeroSettings)`
- `getNavbar()` / `updateNavbar(NavbarSettings)`
- `getFooter()` / `updateFooter(FooterSettings)`
- `getContact()` / `updateContact(ContactSettings)`
- `getSocial()` / `updateSocial(SocialLinksSettings)`
- `getSEO()` / `updateSEO(SEOSettings)`
- `getMaintenance()` / `updateMaintenance(MaintenanceSettings)`

### Pages Endpoints
- `getPages()`
- `savePage(CMSPage)`
- `deletePage(id)`
- `duplicatePage(id)`

### Blog Endpoints
- `getPosts()`
- `savePost(BlogPost)`
- `deletePost(id)`

### Media Endpoints
- `getMedia()`
- `uploadMedia(MediaItem)`
- `deleteMedia(id)`

### Announcements Endpoints
- `getAnnouncements()`
- `saveAnnouncement(Announcement)`
- `deleteAnnouncement(id)`

### Redirects & Custom Code
- `getRedirects()` / `saveRedirect()` / `deleteRedirect()`
- `getCustomCode()` / `saveCustomCode()` / `deleteCustomCode()`

---

## React Hook (`useCMS`)

Location: `src/hooks/useCMS.ts`

Provides reactive React state, automatic 30-second background autosaving, theme mode toggling (`dark`, `light`, `amoled`), and action dispatchers to any UI component.
