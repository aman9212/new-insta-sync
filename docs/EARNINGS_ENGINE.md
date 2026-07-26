# Earnings Engine

Earnings are calculated server-side in `credit_submission_earnings`.

Formula:

```text
earnings_cents = floor(eligible_views * rate_per_million_cents / 1_000_000)
```

Controls:

- Integer-safe cents.
- No negative values.
- Post cap.
- Remaining campaign budget cap.
- Idempotent wallet transaction keys.
- Wallet pending balance and lifetime earnings updated in the same database transaction.

Example: 250,000 eligible views at $2,000 per million is:

```text
floor(250000 * 200000 / 1000000) = 50000 cents = $500.00
```
