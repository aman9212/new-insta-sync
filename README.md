# CreatorX

CreatorX is a production-oriented creator campaign and clipping marketplace for Creators, Brands, and Admins.

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- lucide-react
- Supabase Auth, PostgreSQL, RLS, and Edge Functions

## Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase

```bash
supabase db push
supabase functions deploy sync-submission-views
supabase functions deploy process-withdrawal
```

Configure Google OAuth in Supabase Auth and add `/auth/callback` for local and production origins.

## Build

```bash
npm run build
npm run preview
```

## External API Limitations

YouTube metrics require `YOUTUBE_API_KEY` in Supabase Edge Function secrets. Instagram and TikTok metrics require approved provider API access and account authorization; CreatorX does not scrape or fake metrics. Payouts use a manual provider until a real payout provider is configured.
