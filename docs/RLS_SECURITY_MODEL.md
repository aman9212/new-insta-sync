# RLS Security Model

RLS is enabled on every user-facing table.

Creators can read active campaigns, insert their own submissions, read their own submissions, wallet, wallet transactions, withdrawals, referrals, provider connections, and safe profile fields.

Brands can manage brands they own, create and update campaigns under their brands, and read submissions belonging to their campaigns.

Admins are verified server-side with `public.is_admin()`, which reads `profiles.role` for `auth.uid()`. Admin access is never derived from localStorage or URL routes.

Sensitive operations use RPC functions:

- Earnings: `credit_submission_earnings`
- Withdrawal reserve/debit: `request_withdrawal`
- Moderation: `admin_moderate_campaign`, `admin_moderate_submission`

Frontend route guards improve UX but are not the security boundary. PostgreSQL policies are the security boundary.
