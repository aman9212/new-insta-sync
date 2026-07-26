# Account Deletion & Data Retention Policy

This document details the data retention architecture for user account deletion to preserve the financial ledger and campaign statistics.

## Retention Requirements

The database holds financial records in `public.wallets`, `public.wallet_transactions`, `public.withdrawals`, and campaign metrics in `public.submissions`. A complete hard delete (cascading) of a user profile would:
- Delete all their historical submission views and earnings.
- Delete all related wallet transactions (credits and debits).
- Corrupt campaign total budgets and financial audits.

To prevent this corruption, CreatorX implements a **hybrid anonymization model** rather than a cascading hard delete.

## Implementation Details

1. **Foreign Key Decoupling**:
   - The foreign key constraint `profiles_id_fkey` linking `public.profiles(id)` to `auth.users(id)` is decoupled from the `on_delete cascade` behavior (by dropping the cascade constraint in Migration 005).
   - This ensures that deleting the authentication user does not delete the profile row.

2. **Server-Side Deletion & Anonymization Flow**:
   - The user triggers deletion from the settings dashboard by typing the exact string `DELETE`.
   - The frontend calls the secure Supabase Edge Function `delete-account`.
   - The Edge Function retrieves the caller's identity via authorization JWT.
   - It performs the following database mutations:
     - Deletes the caller's social account connections in `public.provider_connections`.
     - Anonymizes `public.profiles`:
       - `display_name` = `'Deleted User'`
       - `username` = `'deleted_' || substr(id::text, 1, 8)`
       - `email` = `NULL`
       - `avatar_url` = `NULL`
       - `account_status` = `'suspended'`
     - Invokes the Supabase Auth Admin API (`admin.deleteUser`) to permanently delete the Auth user.
