# Payouts

Edge Function: `supabase/functions/process-withdrawal`

Provider interface:

```ts
interface PayoutProvider {
  createPayout(input): Promise<PayoutResult>
  getPayoutStatus(reference): Promise<PayoutStatus>
}
```

Current provider: `ManualPayoutProvider`.

The withdrawal request itself is atomic in PostgreSQL through `request_withdrawal`:

1. Validate authenticated user.
2. Validate minimum withdrawal from `system_settings`.
3. Lock wallet row.
4. Validate available balance.
5. Reserve/debit funds.
6. Create withdrawal.
7. Create wallet transaction.

No real payout is claimed unless a real payout provider is later configured and returns success.
