# Local Setup

## Commands

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
supabase functions deploy sync-submission-views
supabase functions deploy process-withdrawal
```

Set Edge Function secrets server-side:

```bash
supabase secrets set YOUTUBE_API_KEY=...
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` or `YOUTUBE_API_KEY` in Vite env vars.

## Local Auth Users

Create users through Supabase Auth or the local Supabase Studio. SQL seed files should not fabricate `auth.users` records for normal development. After Google sign-in, the database trigger creates a profile and wallet automatically. Complete onboarding in the app as Creator or Brand. Admin roles must be assigned manually through secure database administration.
