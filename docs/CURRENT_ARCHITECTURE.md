# CreatorX Current Architecture

Audit date: 2026-07-09

## Current Architecture

CreatorX is a React 19, TypeScript, Vite 8, Tailwind CSS 4 application. The Vite root now contains `index.html`, mounts `<div id="root"></div>`, and loads `/src/main.tsx`.

The original application was concentrated in `src/App.tsx` and used hardcoded users, campaigns, submissions, and `localStorage` under `creatorx-v2`. The refactor introduced:

- `src/app` for providers and routing.
- `src/components` for UI, layout, campaigns, submissions, and wallet surfaces.
- `src/pages` for public, creator, brand, and admin routes.
- `src/hooks` and `src/services` for Supabase-backed data access.
- `supabase/migrations/001_core_schema.sql` for PostgreSQL schema, RLS, views, and RPC functions.
- `supabase/functions` for view tracking and payout processing architecture.

## Existing Features Found

- Creator demo workflow: campaign browsing, post submission, activity table, and balance display.
- Brand demo workflow: campaign creation, campaign status toggle, and submission inspection.
- Admin demo workflow: users/campaigns/submissions, manual approve/reject, campaign deletion, and demo reset.
- Early design-system scaffolding existed in `src/components/ui` and `src/styles/globals.css`.
- Supabase client scaffolding existed in `src/lib/supabase.ts`.
- A partial migration existed but lacked the requested schema breadth and RLS model.

## Technical Debt Found

- Demo authentication used role buttons instead of Supabase Auth.
- Authorization trusted React state/localStorage instead of database policies.
- Money was represented as floating point values in the browser.
- Earnings were calculated in React.
- Campaign creation published campaigns directly as active.
- Root Vite entry had previously been missing; it is now present and valid.
- `src/App.css`, `src/index.css`, `src/assets/react.svg`, and `src/assets/vite.svg` remain legacy Vite artifacts and are no longer part of the primary application path.

## Hardcoded Data Found

The old `src/App.tsx` defined seed users, seed campaigns, and seed submissions inline. That code has been removed from the application path. Development seed guidance now lives in `supabase/seed.sql` and `docs/LOCAL_SETUP.md`.

## State Moved To PostgreSQL

- Profiles and roles.
- Brands and verification status.
- Campaigns, platforms, status, budgets, and payout rates.
- Submissions, normalized URLs, external ids, view counts, and review state.
- Wallets, immutable ledger transactions, withdrawals, referrals, provider connections, view snapshots, audit logs, and system settings.

## Migration Strategy

1. Configure Supabase environment variables.
2. Push `supabase/migrations/001_core_schema.sql`.
3. Configure Google OAuth in Supabase Auth.
4. Run the application and complete creator or brand onboarding.
5. Add server-side secrets only to Supabase Edge Functions.
6. Deploy `sync-submission-views` and `process-withdrawal`.
