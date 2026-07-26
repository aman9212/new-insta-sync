# CreatorX Finance Center Architecture Overview

## Key Architectural Principles

1. **Zero Hardcoded Providers**: All Client IDs, secrets, tokens, webhook keys, and fees are stored encrypted per provider and configurable via `/admin/finance`.
2. **Double-Entry Ledger Architecture**: Wallet balances (`available_balance_cents`, `pending_balance_cents`, `locked_balance_cents`, `bonus_balance_cents`) update atomically with immutable audit trail items (`wallet_transactions`).
3. **Tax & Invoicing Engine**: Automated GST, VAT, and Sales Tax calculation with support for tax-inclusive and tax-exclusive items.
4. **Subscription & Coupon System**: Supports Percentage, Fixed, Lifetime, and First-Payment discounts with strict usage limit checks.
5. **Double-Spending & Race Condition Guard**: Database-level constraints and atomic state transitions prevent duplicate payouts or balance race conditions.
