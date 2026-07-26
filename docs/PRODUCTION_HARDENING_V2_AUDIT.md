# CreatorX Production Hardening V2 Audit Report

Audit Date: 2026-07-09

## Current Security and Architecture Status

### CURRENT AUTH MODEL
CreatorX uses **Supabase Auth** for session management and authentication. Google OAuth is configured as the main login provider. When a user authenticates via Google OAuth, a PostgreSQL trigger (`on_auth_user_created` calling `handle_new_user`) creates a basic profile in the `profiles` table and inserts a corresponding row in the `wallets` table.

### CURRENT ROLE MODEL
The roles defined in the system are `'creator'`, `'brand'`, and `'admin'`. Upon initial sign-up, the database trigger defaults the user to the `'creator'` role. During onboarding, the frontend calls `completeOnboarding`, which directly runs an `upsert` REST query on the `profiles` table. This allows the client to update the user's role to `'creator'` or `'brand'`.

### CURRENT BRAND OWNERSHIP MODEL
A brand workspace is represented in the `brands` table, which is mapped via `owner_id` to a profile. A brand user is expected to have one brand workspace. Migration 004 introduced a bootstrap function (`bootstrap_brand_workspace`) that creates a brand workspace for the user if it doesn't already exist.

### CURRENT CAMPAIGN MODEL
Campaigns are stored in the `campaigns` table, linked to a brand. They track types, status, descriptions, budgets (total and used), views, platform limits, caps, and duration requirements. Supported platforms are tracked in a junction table `campaign_platforms`.

### CURRENT CAMPAIGN STATUS FLOW
Campaign status can be: `draft`, `pending_review`, `active`, `paused`, `completed`, `rejected`, `cancelled`. The frontend directly updates the `campaigns.status` column when transitioning between states (e.g., submitting for review or pausing).

### CURRENT SUBMISSION FLOW
Creators submit content URLs for active campaigns. The submission is inserted into the `submissions` table. The URL is normalized to check for duplicates using a unique constraint `(campaign_id, creator_id, normalized_post_url)`. Submissions default to a `'processing'` status, and once metrics are synced, they are updated to `'eligible'` or `'ineligible'`.

### CURRENT METRIC FLOW
A Supabase Edge Function `sync-submission-views` queries pending submissions, resolves the social platform provider, fetches views, hashes the payload to prevent duplicates, inserts into `submission_metric_snapshots`, runs fraud detection, and calls `credit_submission_earnings` to credit the creator's wallet.

### CURRENT FRAUD FLOW
The fraud engine in `sync-submission-views` evaluates metric trends, velocity anomalies, engagement mismatches, follower/view discrepancies, repeated identical growth, metric reversals, duplicate content, and payout gaming. The engine generates a risk score (0-100), risk level (`low`, `medium`, `high`, `critical`), and flags issues. High/Critical cases are set to `verification_hold` status. Brands can manually flag submissions, which currently inserts a fraud assessment with a hardcoded score of 50.

### CURRENT PAYOUT FLOW
Creators request withdrawals using the RPC `request_withdrawal`. This locks the wallet, debits `available_balance_cents`, creates a withdrawal row, and logs it. An admin processes withdrawals using the `process-withdrawal` Edge Function.

### CURRENT WALLET FLOW
Stored in `wallets` with fields: `available_balance_cents`, `pending_balance_cents`, `lifetime_earnings_cents`. Credits/debits write ledger entries into `wallet_transactions` using idempotency keys.

### CURRENT ADMIN AUTHORIZATION
Admin verification is checked using the `public.is_admin()` SQL helper function (checks if `profiles.role = 'admin'` and is active). React route guards prevent access to `/admin` pages, and RLS policies allow admin operations.

### CURRENT EDGE FUNCTIONS
- `sync-submission-views`: Synchronizes submission views, evaluates fraud, and credits wallets.
- `process-withdrawal`: Processes creator withdrawals through a simulated payout provider.

### CURRENT PROVIDER INTEGRATIONS
- Instagram, TikTok, YouTube. Currently uses mock adapters that return mock responses since real provider APIs are not yet integrated or configured.

### CURRENT TEST COVERAGE
- No existing tests or test framework configured. No `npm run test` script in `package.json`.

---

## Severity Matrix & Issue Log

| Issue ID | Issue Description | Severity | Affected Files | Database Impact | Security Impact | Financial Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Role Privilege Escalation: Public profile `upsert` allows arbitrary role modification (e.g. setting role to `'admin'`). | **P0** | `src/services/auth.service.ts`, `profiles` RLS | Low | Critical | Critical | Implement `complete_onboarding` RPC and restrict profile UPDATE RLS policies. |
| **SEC-02** | Missing Ledger-Safe Fraud Adjustments: Confirming fraud updates submission status without creating compensating ledger transactions. | **P0** | `admin_review_fraud` RPC | High | Low | Critical | Modify fraud review actions to create compensating ledger entries (`fraud_adjustment`) and update wallet balances. |
| **SEC-03** | Frontend-Authoritative Campaign State Transitions: Clients update campaign status directly via REST. | **P0** | `src/services/campaign.service.ts` | Low | High | Medium | Implement explicit state transition RPCs and database status history logging. |
| **SEC-04** | Direct Wallet Balance / Metic Modifiability: Profile and submission writes have loose update restrictions. | **P0** | Database RLS | High | High | High | Restrict profile and submission update RLS policies to non-sensitive columns. |
| **BUS-01** | Brand Campaign Wizard Mismatches: camelCase and empty values cause inserts to fail. | **P1** | `CreateCampaignPage.tsx` | Low | Low | Low | Perform thorough payload mapping and input validation. |
| **BUS-02** | No Daily Creator Analytics: Missing daily aggregation logic for analytics charts. | **P1** | `CreatorAnalyticsPage.tsx` | Medium | Low | Low | Build a daily aggregation view or materialized table in the database. |
| **BUS-03** | Unscheduled Metric Sync: The metrics sync worker is not scheduled or orchestrated. | **P1** | `sync-submission-views` | Low | Low | Low | Document orchestration setup and design retry/backoff limits. |
| **BUS-04** | Weak Fraud Signal Overwrite: Brand manual flag overrides risk score to a hardcoded 50. | **P1** | `brand_flag_submission` | Low | Low | Low | Record flag as `brand_manual_flag` signal and calculate composite score. |
| **OPS-01** | No Brand Team Support: Single owner workspace only. | **P2** | New Database schema | High | Medium | Low | Add `brand_members` and `brand_invitations` tables with scoped RLS. |
| **OPS-02** | Missing Admin Operations Queue & Health page: Admin cannot efficiently view tasks. | **P2** | `src/pages/admin/*` | Low | Low | Low | Create unified Admin exception queue and System Health monitor. |
| **UX-01** | Missing Creator Action Center & Earnings Forecast | **P3** | `src/pages/creator/*` | Low | Low | Low | Build derived Action Center notifications and forecast charts. |
