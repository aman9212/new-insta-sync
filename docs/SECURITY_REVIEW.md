# Security Review

Controls added:

- Supabase Auth replaces localStorage role selection.
- RLS is enabled on user-facing tables.
- Admin role is checked server-side through `profiles`.
- Creator and brand route guards redirect by database role.
- Duplicate submissions are blocked with `(campaign_id, creator_id, normalized_post_url)`.
- Wallet credits/debits use PostgreSQL functions.
- Money uses integer cents.
- Campaign requirements render as text, not HTML.
- Secrets are not exposed through Vite env vars.
- Edge Functions read server secrets only.
- Sensitive admin actions write audit logs.

Known residual risks:

- SQL policies should be tested in a real Supabase project with multiple test users before production.
- Manual payout completion still requires operational controls outside this repo.
- Instagram/TikTok provider permissions are external prerequisites.
