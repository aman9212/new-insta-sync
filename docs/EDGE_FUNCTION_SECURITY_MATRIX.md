# Edge Function Security Matrix

This document outlines the security specifications and validation boundaries for all Supabase Edge Functions in CreatorX.

| Edge Function | Description | Access Mode | Auth Requirement | Service Role usage | CORS Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `delete-account` | Anonymizes user profile and deletes auth user. | HTTP POST | Verified User JWT (via `auth.getUser(token)`) | Yes (Admin API deletion) | Allowed (wildcard) |
| `process-withdrawal` | Processes withdrawal payouts. | HTTP POST | Verified Admin JWT (via `auth.getUser(token)` checking role in `profiles`) | Yes (updating withdrawals table) | Restricted / Internal only |
| `sync-submission-views` | Synchronizes submission metrics and credits wallets. | HTTP POST | Internal Worker Secret (via Bearer token matching `CRON_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`) | Yes (credits wallets, reads/writes submissions) | Denied (no browser CORS needed) |

## Security Hardening Details

### 1. `process-withdrawal`
- **Verification Rule:** JWT is parsed from `Authorization` header. Call to `auth.getUser(token)` resolves the identity. The corresponding `profiles` row is queried to ensure `role = 'admin'` and `account_status = 'active'`.
- **Method Validation:** HTTP POST only.
- **State Machine Protection:** Atomic row locking ensures withdrawals can only transition from `pending`/`approved` to `processing` or final states (`paid`/`failed`).

### 2. `sync-submission-views`
- **Verification Rule:** Expects `Authorization: Bearer <CRON_SECRET>` or `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
- **Method Validation:** HTTP POST only.
- **Concurrency Protection:** Uses PostgreSQL `claim_sync_jobs` RPC with `FOR UPDATE SKIP LOCKED` to prevent concurrent workers from claiming the same submissions.
