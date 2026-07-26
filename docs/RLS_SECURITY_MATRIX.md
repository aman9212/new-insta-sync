# Row Level Security (RLS) Security Matrix

This document outlines the Row Level Security (RLS) policies for all core tables in the CreatorX database.

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
| :--- | :--- | :--- | :--- | :--- |
| **profiles** | Public reads allowed for admin/self; only active creators shown to brands. | Authenticated user only (via onboarding RPC). | Own profile only (safe fields check; no role/status changes). | Blocked for all. |
| **brands** | Owner, members, and admins only. | Workspace owner only. | Owner, admin members, and admins only. | Owner and admins only. |
| **campaigns** | Owner, members, and admins, or if campaign is active (creators). | Owner, admin members, and admins only. | Owner, admin members, and admins only. | Admins only. |
| **submissions** | Creator (self), brand owner/member (if campaign matches), or admin. | Creator self-insert (forces `creator_id = auth.uid()`, enforces eligibility checks). | Admin or brand (for risk review holds). | Blocked for all. |
| **wallets** | Wallet owner or admin only. | Blocked (wallet created via trigger on profile insert). | Blocked for all (updated via secure ledger RPCs). | Blocked for all. |
| **wallet_transactions** | Wallet owner or admin only. | Blocked (inserted via secure ledger RPCs). | Blocked for all. | Blocked for all. |
| **withdrawals** | Owner or admin only. | Owner self-insert (amount >= $50.00 check). | Admins only (to mark as processing/paid/rejected). | Blocked for all. |
| **fraud_assessments** | Brand owner/member (if campaign matches) or admin only. | Blocked (created via triggers or brand flag RPCs). | Admins only. | Blocked for all. |
| **fraud_signals** | Brand owner/member (if campaign matches) or admin only. | Blocked (created via triggers or brand flag RPCs). | Admins only. | Blocked for all. |
| **audit_logs** | Admins only. | Blocked (inserted via triggers/RPCs). | Blocked for all. | Blocked for all. |
| **notifications** | Recipient user or admin only. | Blocked (inserted via system operations). | Recipient user or admin only. | Blocked for all. |
| **brand_members** | Brand owner, members, or admin only. | Brand owner, admin members, or admin only. | Brand owner, admin members, or admin only. | Brand owner, admin members, or admin only. |
| **brand_invitations** | Invited recipient, brand owner/admin, or admin only. | Brand owner/admin or admin only. | Brand owner/admin or admin only. | Brand owner/admin or admin only. |
