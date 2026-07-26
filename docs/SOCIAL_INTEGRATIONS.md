# Social Integrations Control Plane

The Social Integrations page is available at `/admin/settings/social-integrations`. It uses the `social-integrations` Edge Function for every credential operation; browser clients never read `social_credentials` or token ciphertext.

## Deploy

Apply migration `009_social_integration_platform.sql`, then deploy the function:

```bash
supabase functions deploy social-integrations
```

Set a distinct 32-byte AES key as a base64 string in the Edge Function environment. Generate it once with a cryptographically secure secret manager, not in source control:

```bash
supabase secrets set SOCIAL_CREDENTIALS_ENCRYPTION_KEY="<base64-encoded-32-byte-key>"
```

The function also requires the standard Supabase `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime variables. Do not put provider keys, access tokens, refresh tokens, or the encryption key in Vite variables or client-side configuration.

## Roles

`admin_roles` provides the Social Integrations permission tier independent of product roles:

- `super_admin`: full control, including credential deletion.
- `admin`: read, configure, test, and queue synchronisation.
- `moderator`: read-only operational visibility.

The migration bootstraps existing `profiles.role = 'admin'` users as `super_admin`. Review this assignment immediately after deployment and downgrade or add users deliberately.

## Webhooks

Point each provider to:

```text
https://<project-ref>.functions.supabase.co/social-integrations/webhook/<platform-id>
```

The function verifies the `x-webhook-signature` HMAC-SHA256 header against the encrypted webhook secret and records every delivery in `webhook_logs`. Invalid signatures are retained as failed events and never enqueue a sync job.

## Operations

The Admin page drives these server actions: platform summary, masked configuration reads, credential writes, provider reachability tests, manual sync enqueueing, and operational log reads. Sync workers should claim `sync_jobs` in `queued` state, honour `run_after` and `max_attempts`, and write immutable `sync_logs`; schedule that worker in your deployment scheduler at the cadence configured per platform.

Provider account discovery and OAuth consent must be enabled only after registering the exact redirect URL and approved scopes with the individual provider. API reachability is deliberately reported as `not_configured` until encrypted credentials exist, rather than synthesizing successful provider connections.
