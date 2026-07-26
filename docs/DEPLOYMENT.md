# Deployment

1. Create a Supabase project.
2. Configure Google OAuth provider.
3. Push migrations with `supabase db push`.
4. Deploy Edge Functions.
5. Set Edge Function secrets.
6. Deploy the Vite app with:

```bash
npm install
npm run build
```

Required frontend environment:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Required server secrets for optional integrations:

```bash
YOUTUBE_API_KEY=
```

Never expose service role keys in the frontend deployment environment.
