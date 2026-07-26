# Creator Management API

All browser requests use the authenticated Supabase client. Every mutation is rejected unless `public.is_admin()` confirms an active administrator. No service-role credential is exposed to the browser.

## Read endpoints

| Operation | Supabase request | Result |
| --- | --- | --- |
| List creators | `creator_profiles.select('*')` with `status`, search, range, and descending `created_at` | Paginated creator directory |
| Creator detail | Reads `creator_profiles`, `creator_wallets`, `creator_kyc`, `creator_levels`, `creator_badges`, `creator_social_accounts`, notes, flags, and submissions by creator id | Full operational record |
| Dashboard | `rpc('admin_creator_dashboard')` | Live account, KYC, activity, participation, withdrawal, and leader metrics |
| Settings | `creator_settings` key `creator_platform` | Admin-controlled policy JSON |

## Admin mutation RPC

`rpc('admin_creator_action', { p_creator_id, p_action, p_payload })`

Supported actions are `set_status`, `review_kyc`, `adjust_wallet`, `add_note`, `award_badge`, `set_level`, and `set_permission`. Each action validates its payload server-side, writes `creator_history`, and writes the central `audit_logs` table in the same database transaction. Wallet adjustments also synchronize the legacy `wallets` balance and create an immutable `wallet_transactions` adjustment entry.

## Sensitive Auth operations

Deploy `creator-admin` as an Edge Function. It requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_ORIGIN`. It accepts an authenticated administrator only and supports `force_logout`, `send_password_recovery`, `create_impersonation_link`, and `soft_delete`. An impersonation link is a short-lived Supabase magic link and is always audit logged; restrict its use to authorized support staff. Use a bearer token and a JSON body such as:

```json
{ "action": "force_logout", "creatorId": "creator-uuid" }
```

## Document storage

KYC files are represented by document URLs in `creator_kyc`; production deployments must store them in a private Supabase Storage bucket, use short-lived signed URLs, and encrypt source documents before upload where required by the operating jurisdiction. The admin UI never exposes an anonymous KYC asset URL.

## Reports

The admin workspace exports real, currently filtered creator rows to CSV. CSV is intentionally used for spreadsheet interoperability without transmitting sensitive creator data to a third-party report renderer. PDF generation belongs in a separately deployed, authenticated reporting job when a regulated, signed PDF is required.
