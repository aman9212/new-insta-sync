# RLS Effective Policy Audit

This document presents a comprehensive effective policy audit of all CreatorX database tables based on migrations 001 through 005.

---

## Effective Policies by Table

### 1. Table: `profiles`
- **SELECT:**
  - `profiles own read`: User can read their own profile.
  - `profiles_select_policy`: Brands can read profiles of creators (where onboarding is completed and role = 'creator' and status is active). Admins can read all profiles.
- **INSERT:**
  - `profiles own insert`: Authenticated users can insert their own profile during initial signup.
- **UPDATE:**
  - `profiles own safe update` (hardened in 005): Authenticated users can update their own profile, but only safe columns (cannot change role or onboarding status directly).
- **DELETE:**
  - Blocked for all roles.

### 2. Table: `brands`
- **SELECT:** `brands owner read` / `admin brands`
- **INSERT:** `brands owner insert`
- **UPDATE:** `brands owner update`
- **DELETE:** `admin brands` (restricted to admin/service role)

### 3. Table: `campaigns`
- **SELECT:**
  - Creator can read active campaigns.
  - Brand owner can read own campaigns.
  - Admin can read all.
- **INSERT:** Brand owner or admin only.
- **UPDATE:** Brand owner or admin only.
- **DELETE:** Admin only.

### 4. Table: `campaign_platforms`
- **SELECT:** Accessible if parent campaign is readable.
- **INSERT/UPDATE/DELETE:** Brand owner or admin only.

### 5. Table: `submissions`
- **SELECT:** Scoped to creator (own submissions), brand owner (submissions for their campaigns), or admin.
- **INSERT:** Creator only (forces `creator_id = auth.uid()`).
- **UPDATE:** Admin or brand owner (for reviews).
- **DELETE:** Blocked.

### 6. Table: `wallets`
- **SELECT:** Wallet owner or admin only.
- **INSERT/UPDATE/DELETE:** Blocked for all (updated via secure ledger RPCs).

### 7. Table: `wallet_transactions`
- **SELECT:** Wallet owner or admin only.
- **INSERT/UPDATE/DELETE:** Blocked (inserted via secure ledger RPCs).

### 8. Table: `withdrawals`
- **SELECT:** Creator (own withdrawals) or admin.
- **INSERT:** Creator (own withdrawals, checks minimum amount constraint).
- **UPDATE:** Admin only (to change status).
- **DELETE:** Blocked.

### 9. Table: `provider_connections`
- **SELECT/INSERT/UPDATE/DELETE:** Owner or admin only.

### 10. Table: `submission_metric_snapshots`
- **SELECT:** Creator (own snapshots), brand (matching campaign), or admin.
- **INSERT/UPDATE/DELETE:** Blocked (inserted by service-role edge functions).

### 11. Table: `fraud_assessments`
- **SELECT:** Brand (matching campaign) or admin.
- **INSERT/UPDATE/DELETE:** Blocked.

### 12. Table: `fraud_signals`
- **SELECT:** Brand (matching campaign) or admin.
- **INSERT/UPDATE/DELETE:** Blocked.

### 13. Table: `fraud_review_events`
- **SELECT/INSERT/UPDATE/DELETE:** Admin only.

### 14. Table: `campaign_status_history`
- **SELECT:** Brand owner, creator, or admin.
- **INSERT/UPDATE/DELETE:** Blocked (managed by triggers).

### 15. Table: `submission_event_history`
- **SELECT:** Brand owner, creator, or admin.
- **INSERT/UPDATE/DELETE:** Blocked (managed by triggers).

### 16. Table: `brand_members`
- **SELECT/INSERT/UPDATE/DELETE:** Workspace owner, admin members, or admin only.

### 17. Table: `brand_invitations`
- **SELECT/INSERT/UPDATE/DELETE:** Inviter, invitee, or admin only.

### 18. Table: `notifications`
- **SELECT/UPDATE:** Recipient or admin only.
- **INSERT:** Admin or service role.

### 19. Table: `system_settings`
- **SELECT:** Authenticated users.
- **INSERT/UPDATE/DELETE:** Admin only.

### 20. Table: `audit_logs`
- **SELECT:** Admin only.
- **INSERT/UPDATE/DELETE:** Blocked (managed by triggers/RPCs).
