# CreatorX Finance Center API Documentation

This document specifies the services, ledger engine, payment gateway integrations, invoice generators, tax rules, and admin REST/Edge endpoints for the CreatorX Enterprise Finance Center.

---

## Supported Payment Gateways & Methods (6)
1. **Stripe Connect** (`stripe`): Card payments, Apple Pay, Instant Payouts
2. **Razorpay** (`razorpay`): NetBanking, UPI, Cards (India)
3. **PayPal** (`paypal`): PayPal Checkout & Instant Payouts
4. **Wise** (`wise`): Cross-border Bank Wire & Low-fee Payouts
5. **Direct Bank Transfer** (`bank_transfer`): ACH, SEPA, NEFT
6. **Crypto Wallet** (`crypto`): USDC, USDT, Solana Pay

---

## Service API (`FinanceService`)

Location: `src/services/finance.service.ts`

### Endpoints / Methods
- `getWallet(userId: string): Promise<WalletState>`
- `getTransactions(walletId: string): Promise<WalletTransactionItem[]>`
- `requestWithdrawal(userId, amountCents, methodType, details): Promise<WithdrawRequestItem>`
- `getWithdrawalRequests(): Promise<WithdrawRequestItem[]>`
- `approveWithdrawal(requestId: string): Promise<boolean>`
- `bulkApproveWithdrawals(requestIds: string[]): Promise<number>`
- `rejectWithdrawal(requestId: string, reason: string): Promise<boolean>`
- `getPaymentProviders(): Promise<PaymentProviderConfig[]>`
- `savePaymentProvider(config: PaymentProviderConfig): Promise<boolean>`
- `testProviderConnection(providerId: PaymentProviderId): Promise<{ success: boolean; latencyMs: number; message: string }>`
- `getCampaignBudgets(): Promise<CampaignBudgetItem[]>`
- `getSubscriptionPlans(): Promise<SubscriptionPlanItem[]>`
- `getSubscriptions(): Promise<UserSubscriptionItem[]>`
- `getInvoices(): Promise<InvoiceItem[]>`
- `getCoupons(): Promise<CouponCodeItem[]>`
- `getTaxRules(): Promise<TaxRuleItem[]>`
- `getAffiliatePayouts(): Promise<AffiliatePayoutItem[]>`
- `getRefundRequests(): Promise<RefundRequestItem[]>`
- `getRevenueAnalytics(): Promise<RevenueAnalyticsMetrics>`
- `getFinanceSettings(): Promise<FinanceSettingsConfig>`
- `saveFinanceSettings(settings: FinanceSettingsConfig): Promise<boolean>`
- `getAuditLogs(): Promise<FinanceAuditLogItem[]>`
