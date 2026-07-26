# Metric Sync Operations & Orchestration

This document details the scheduling, retries, and rate limiting behavior for the CreatorX metric synchronization engine.

## Orchestration Schema

The synchronization engine operates on an event-driven scheduler. The database schema in `public.submissions` has columns:
- `last_synced_at`: Timestamp of the last successful sync.
- `next_sync_at`: Scheduled timestamp for the next sync (uses a default interval of 24 hours, or exponential backoff on failure).

To track jobs and prevent duplicate invocation:
- The sync worker selects pending submissions: `next_sync_at <= now()`.
- It processes them in batches of 10.
- Database locking (`select ... for update`) isolates concurrent sync instances.

## Operational FAQs

### 1. Who invokes the sync worker?
The sync worker is invoked by an external HTTP scheduler (e.g. Supabase pg_net cron triggers, GitHub Actions, or Google Cloud Scheduler) hitting the secure Supabase Edge Function `sync-submission-views` via POST request.

### 2. How often does it run?
The scheduler executes the cron job every hour. Each run scans for up to 10 submissions that have `next_sync_at` in the past.

### 3. How do retries and backoffs work?
On execution failure (e.g. provider network error or api timeouts), the submission's `next_sync_at` is pushed forward using an exponential retry backoff schema:
- **Attempt 1**: `next_sync_at` = +2 hours
- **Attempt 2**: `next_sync_at` = +4 hours
- **Attempt 3**: `next_sync_at` = +8 hours
- **Attempt 4+**: Dead-letter/manual review status.

### 4. How are provider rate limits handled?
The edge function respects rate limits by checking standard response headers (`x-ratelimit-remaining`). If limits are close to exhausted, the job exits early and delays subsequent syncs by setting `next_sync_at` to the rate limit reset window.

### 5. How are duplicate invocations prevented?
Each sync execution locks rows via `select * from public.submissions where id = target_id for update`. Concurrently running sync workers block on the lock and bypass already locked/processed rows.
Furthermore, the `submission_metric_snapshots` has a unique constraint on `provider_response_hash` to prevent inserting duplicate snapshot rows for the same metric response payload.
