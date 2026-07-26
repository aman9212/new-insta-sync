# CreatorX Creator Intelligence Architecture

## Current Data Flow

```
Google OAuth → Supabase Auth → profiles (trigger)
  → onboarding → role selection → creator/brand dashboard

Creator:
  browse campaigns → submit post URL → submission created (processing)
  → server sync worker → view_snapshots → credit_submission_earnings()
  → wallet credited → request_withdrawal() → process-withdrawal edge fn

Brand:
  create campaign → campaign review → active → creators submit
  → brand reviews submissions → admin moderation

Admin:
  moderate campaigns → moderate submissions → process withdrawals
```

## Existing Schema (migration 001 + 002)

| Table | RLS | Notes |
|---|---|---|
| profiles | ✅ | PK = auth.users.id, trigger auto-creates |
| brands | ✅ | owner_id → profiles |
| campaigns | ✅ | brand_id → brands |
| campaign_platforms | ✅ | campaign_id → campaigns |
| submissions | ✅ | creator_id, campaign_id |
| wallets | ✅ | user_id → profiles |
| wallet_transactions | ✅ | idempotency_key prevents dupes |
| withdrawals | ✅ | user_id → profiles |
| referrals | ✅ | |
| view_snapshots | ✅ | append-only (admin-scoped RLS) |
| provider_connections | ✅ | user_id → profiles |
| audit_logs | ✅ | admin-only read |
| system_settings | ✅ | admin-only |

## Existing Edge Functions

1. **sync-submission-views** — fetches metrics from provider APIs, inserts view_snapshots, calls credit_submission_earnings()
2. **process-withdrawal** — processes pending withdrawals via payout provider

## Existing Provider Architecture

ViewProvider interface: `supports()`, `normalizeUrl()`, `extractExternalId()`, `fetchMetrics()`
- YouTube: uses YOUTUBE_API_KEY (Data API v3)
- Instagram: returns limitation (no API key support yet)
- TikTok: returns limitation (no API key support yet)

## Proposed Architecture Extension

### New Database Tables (migration 003)

#### submission_metric_snapshots
Extended metrics snapshots (replaces simple view_snapshots for new submissions):
- raw_views, raw_likes, raw_comments, raw_shares, raw_saves, raw_followers
- source ('provider_api' | 'manual_review')
- provider_response_hash for deduplication
- **Append-only**: no UPDATE/DELETE for non-admin

#### fraud_assessments
One assessment per submission:
- risk_score (0-100), risk_level (low/medium/high/critical)
- assessment_version, assessment_status
- reviewed_by (admin who reviewed), reviewed_at

#### fraud_signals
Individual detected signals per assessment:
- signal_type, signal_code, severity, score_contribution
- evidence_json, detected_at

#### fraud_review_events
Immutable timeline of review actions:
- assessment_id, action, actor_id, reason, notes, created_at

### Fraud Risk Engine

Server-side deterministic scoring:
- View velocity anomaly
- Engagement mismatch (likes/views, comments/views)
- Follower-view ratio anomaly
- Repeated identical growth
- Metric reversal detection
- Snapshot timing anomaly
- Duplicate content/URL detection
- Cross-submission pattern analysis
- Payout threshold gaming detection

Risk levels: 0-29 LOW, 30-59 MEDIUM, 60-79 HIGH, 80-100 CRITICAL
Configurable thresholds via system_settings.

### Eligible View Engine

```
raw_views → verified_views (after metrics validation)
  → eligible_views (after campaign rules + fraud check)
```

Deductions:
- Views outside campaign window
- Duplicate submission attribution
- Confirmed abuse adjustments (requires admin review)

HIGH/CRITICAL risk → earnings placed in verification_hold
No automatic confiscation — requires authorized review.

### Payout States

```
pending → verification_hold → eligible → credited → withdrawn
                                                   → reversed (abuse)
```

### Frontend Pages

| Page | Role | Route |
|---|---|---|
| My Submissions (premium) | Creator | /creator/submissions |
| Creator Analytics | Creator | /creator/analytics |
| Linked Accounts | Creator | /creator/accounts |
| Brand Submissions (intelligence) | Brand | /brand/submissions |
| Brand Analytics | Brand | /brand/analytics |
| Admin Fraud Review | Admin | /admin/fraud-review |

### RLS Policy Summary

- Creators: own data only, no fraud weights/scores visible
- Brands: their campaign submissions + authorized risk summaries
- Admins: full access through is_admin() check
- No role can self-promote to admin
- No role can modify wallet balances directly
- All financial mutations through SECURITY DEFINER functions
