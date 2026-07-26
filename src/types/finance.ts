export type PaymentProviderId = 'stripe' | 'razorpay' | 'paypal' | 'wise' | 'bank_transfer' | 'crypto';

export type WalletType = 'creator' | 'brand' | 'platform';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'campaign_funding'
  | 'bonus'
  | 'refund'
  | 'adjustment'
  | 'commission'
  | 'affiliate_earning'
  | 'tax';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'info_requested' | 'frozen' | 'cancelled';

export type PaymentMethodType = 'bank_account' | 'upi' | 'paypal' | 'wise' | 'crypto' | 'stripe_connect';

export interface WalletState {
  id: string;
  userId: string;
  walletType: WalletType;
  currency: string;
  availableBalanceCents: number;
  pendingBalanceCents: number;
  lockedBalanceCents: number;
  bonusBalanceCents: number;
  status: 'active' | 'frozen' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  transactionType: TransactionType;
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  referenceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WithdrawRequestItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string;
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  paymentMethodType: PaymentMethodType;
  paymentDetails: Record<string, string>;
  status: WithdrawalStatus;
  rejectionReason?: string;
  processedAt?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface PaymentProviderConfig {
  id: PaymentProviderId;
  displayName: string;
  category: 'gateway' | 'digital_wallet' | 'bank_transfer' | 'crypto';
  enabled: boolean;
  sandboxMode: boolean;
  supportedCurrencies: string[];
  processingFeePercent: number;
  fixedFeeCents: number;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  webhookSecret?: string;
  updatedAt: string;
}

export interface CampaignBudgetItem {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandId: string;
  totalBudgetCents: number;
  spentBudgetCents: number;
  remainingBudgetCents: number;
  dailyLimitCents?: number;
  status: 'active' | 'paused' | 'depleted' | 'completed';
  createdAt: string;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  priceCents: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  trialDays: number;
  active: boolean;
}

export interface UserSubscriptionItem {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  invoiceType: 'creator_payout' | 'brand_billing' | 'subscription' | 'tax_invoice' | 'credit_note';
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'void' | 'uncollectible';
  pdfUrl?: string;
  createdAt: string;
}

export interface CouponCodeItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'first_payment' | 'lifetime';
  discountValue: number;
  maxUses?: number;
  usesCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface TaxRuleItem {
  id: string;
  name: string;
  country: string;
  taxType: 'GST' | 'VAT' | 'SalesTax' | 'CountryTax';
  percentage: number;
  isInclusive: boolean;
  active: boolean;
}

export interface AffiliatePayoutItem {
  id: string;
  referrerId: string;
  referrerName: string;
  refereeName: string;
  commissionCents: number;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: string;
}

export interface RefundRequestItem {
  id: string;
  transactionId: string;
  userName: string;
  amountCents: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  createdAt: string;
}

export interface RevenueAnalyticsMetrics {
  mrrCents: number;
  arrCents: number;
  grossRevenueCents: number;
  netRevenueCents: number;
  creatorEarningsCents: number;
  brandSpendingCents: number;
  withdrawTrendsCents: number;
  paymentSuccessRatePercent: number;
  refundRatePercent: number;
}

export interface FinanceSettingsConfig {
  platformFeePercent: number;
  creatorCommissionPercent: number;
  brandCommissionPercent: number;
  withdrawalFeeCents: number;
  autoApproveWithdrawalLimitCents: number;
  defaultCurrency: string;
}

export interface FinanceAuditLogItem {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changesMasked: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
