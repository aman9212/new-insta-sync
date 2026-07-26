# Database

The core schema is in `supabase/migrations/001_core_schema.sql`.

Primary tables:

- `profiles`
- `brands`
- `campaigns`
- `campaign_platforms`
- `submissions`
- `wallets`
- `wallet_transactions`
- `withdrawals`
- `referrals`
- `view_snapshots`
- `provider_connections`
- `audit_logs`
- `system_settings`

Money is stored in integer cents using `bigint`. Wallet mutations are performed through PostgreSQL functions so the browser cannot directly credit earnings or debit balances.

Views used by the frontend:

- `campaign_marketplace`
- `brand_campaigns`
- `creator_submissions`
- `brand_submissions`

RPC functions:

- `create_brand_campaign`
- `request_withdrawal`
- `credit_submission_earnings`
- `admin_moderate_campaign`
- `admin_moderate_submission`
