# CreatorX Workspace Context

This document maintains the persistent state, architecture decisions, and current progress of the CreatorX premium creator clipping campaign marketplace.

## Latest Status
- **Build Status**: Passing (`tsc -b && vite build` succeeded)
- **Lint Status**: Passing (`oxlint` reported 0 errors and 0 warnings)
- **Runtime Environment**: Vite dev server successfully verifies compilation; Supabase client is initialized.

---

## Current Architecture Decisions

1. **Frontend Structure**: React 19, TypeScript, and Vite 8. Styling is driven by Tailwind CSS v4 using custom CSS variables mapping for a premium dark SaaS theme in `src/styles/globals.css`.
2. **Modular File Layout**: Consolidated original inline monolithic state into clean subdirectories under `src/`:
   - `src/app/`: Providers and router definitions.
   - `src/components/`: Modular UI units (tables, status indicators, badges, inputs, dialogs, forms).
   - `src/pages/`: Dedicated routing pages for Public, Creator, Brand, and Admin portals.
   - `src/services/` & `src/hooks/`: Supabase client-backed database abstraction and state management.
3. **Database Architecture**: Supabase PostgreSQL database schemas mapping UUID primary keys, exact integer minor units (cents) for budgets and wallet accounting, and Row Level Security (RLS) policies.
4. **View Tracking & Payouts**: Standardized adapter interfaces for YouTube, TikTok, and Instagram integrations. Real credentials (e.g. YouTube API keys, real payout credentials) are kept safe on the server-side via Supabase Edge Functions.

---

## Phases and Progress

### Completed Phases
- **Phase 0 & 1 — Repository Audit & Foundation Repair**: Verified `index.html` mounts correctly, packages compile with no issues.
- **Phase 2 & 3 — Architectural Refactor & Premium Design System**: Complete. Routed pages and premium UI variables are configured.
- **Phase 4 & 5 — Supabase Setup & Database Migrations**: PostgreSQL core schema, RPCs, views, and update triggers are pushed in `001_core_schema.sql`.
- **Phase 6 — Row Level Security**: Configured and validated. Creator, Brand, and Admin policies restrict operations to authorized tenants.
- **Phase 7 — Auth callback & Routing guards**: Configured. Built redirect callback mechanism using context session profile and enforced authenticated/unauthenticated routes.
- **Phase 8, 9, & 10 — Portals**: Created functional pages for Creator (explore, dashboard, wallet, submissions), Brand (dashboard, campaigns list, draft creator, edit draft, pause/resume active, analytics), and Admin (moderation, settings, users, brands).
- **Phase 11, 12, & 13 — view tracking, earnings engine, and payout provider**: Structured edge functions, YouTube provider adapters, manual review limits, integer math functions, and atomic reservation withdrawal transactions.
- **Phase 14 & 15 — Security Pass & Demo/Local Environment Setup**: Implemented placeholder setups, warnings, and detailed documentation.

### Pending Phases
- **Provider Account Linking API Validation**: (Requires active client API keys for TikTok/Meta configurations).
- **Real Payment Integrations**: Stripe/India-compatible provider endpoints hookups.

---

## External Credentials Required

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase project anonymous key.
- `YOUTUBE_API_KEY`: Server-side API key for the YouTube view-tracking module.

---

## Known Limitations

1. **Social Scrapers & Fake API metrics**: CreatorX does not scrape social networks or fabricate metrics in the client browser. View tracking relies on official backend APIs or falls back to manual admin validation if permissions are absent.
2. **Mock Payouts fallback**: Without India-compatible production payout credentials, the system falls back to `ManualPayoutProvider`.
