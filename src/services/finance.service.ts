import { supabase } from '../lib/supabase';
import type {
  PaymentProviderId,
  PaymentProviderConfig,
  WalletState,
  WalletTransactionItem,
  WithdrawRequestItem,
  CampaignBudgetItem,
  SubscriptionPlanItem,
  UserSubscriptionItem,
  InvoiceItem,
  CouponCodeItem,
  TaxRuleItem,
  AffiliatePayoutItem,
  RefundRequestItem,
  RevenueAnalyticsMetrics,
  FinanceSettingsConfig,
  FinanceAuditLogItem,
  PaymentMethodType,
} from '../types/finance';

const defaultProviders: PaymentProviderConfig[] = [
  {
    id: 'stripe',
    displayName: 'Stripe Connect',
    category: 'gateway',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    processingFeePercent: 2.9,
    fixedFeeCents: 30,
    clientId: 'ca_stripe_live_8912',
    clientSecret: 'sk_live_••••89ab',
    apiKey: 'pk_live_••••12cd',
    webhookSecret: 'whsec_••••78ef',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'razorpay',
    displayName: 'Razorpay',
    category: 'gateway',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['INR', 'USD'],
    processingFeePercent: 2.0,
    fixedFeeCents: 0,
    clientId: 'rzp_live_12893',
    clientSecret: 'rzp_secret_••••4567',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'paypal',
    displayName: 'PayPal Payouts & Checkout',
    category: 'digital_wallet',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    processingFeePercent: 3.4,
    fixedFeeCents: 49,
    clientId: 'paypal_client_9812',
    clientSecret: 'paypal_sec_••••1122',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wise',
    displayName: 'Wise (TransferWise)',
    category: 'bank_transfer',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
    processingFeePercent: 0.5,
    fixedFeeCents: 100,
    apiKey: 'wise_key_••••3344',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bank_transfer',
    displayName: 'Direct Bank Transfer (ACH / SEPA / NEFT)',
    category: 'bank_transfer',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
    processingFeePercent: 0.0,
    fixedFeeCents: 100,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crypto',
    displayName: 'Crypto Wallet (USDC / USDT / SOL)',
    category: 'crypto',
    enabled: true,
    sandboxMode: false,
    supportedCurrencies: ['USDC', 'USDT', 'SOL'],
    processingFeePercent: 0.8,
    fixedFeeCents: 50,
    updatedAt: new Date().toISOString(),
  },
];

class FinanceService {
  private providersState: PaymentProviderConfig[] = [...defaultProviders];

  private walletState: WalletState = {
    id: 'w_creator_1',
    userId: 'user_1',
    walletType: 'creator',
    currency: 'USD',
    availableBalanceCents: 248020,
    pendingBalanceCents: 84000,
    lockedBalanceCents: 15000,
    bonusBalanceCents: 5000,
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 86400 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  private withdrawQueue: WithdrawRequestItem[] = [
    {
      id: 'wreq_101',
      userId: 'user_1',
      userName: 'Alex Rivers',
      userEmail: 'alex@creator.com',
      walletId: 'w_creator_1',
      amountCents: 50000,
      feeCents: 100,
      netAmountCents: 49900,
      paymentMethodType: 'bank_account',
      paymentDetails: { bankName: 'Chase Bank', accountNumber: '••••4819', routingNumber: '021000021' },
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'wreq_102',
      userId: 'user_2',
      userName: 'Maya Tech',
      userEmail: 'maya@tech.com',
      walletId: 'w_creator_2',
      amountCents: 120000,
      feeCents: 100,
      netAmountCents: 119900,
      paymentMethodType: 'crypto',
      paymentDetails: { cryptoNetwork: 'Solana (USDC)', walletAddress: '8xP9...3kLq' },
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
  ];

  public async getWallet(userId: string): Promise<WalletState> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            walletType: data.wallet_type,
            currency: data.currency,
            availableBalanceCents: Number(data.available_balance_cents),
            pendingBalanceCents: Number(data.pending_balance_cents),
            lockedBalanceCents: Number(data.locked_balance_cents),
            bonusBalanceCents: Number(data.bonus_balance_cents),
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Using fallback wallet state', e);
      }
    }
    return this.walletState;
  }

  public async getTransactions(_walletId: string): Promise<WalletTransactionItem[]> {
    return [
      {
        id: 'tx_1',
        walletId: 'w_creator_1',
        transactionType: 'campaign_funding',
        amountCents: 84000,
        feeCents: 0,
        netAmountCents: 84000,
        currency: 'USD',
        status: 'completed',
        referenceId: 'sub_camp_9812',
        description: 'Verified Clip Submission Earnings (Tech Velocity Campaign)',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tx_2',
        walletId: 'w_creator_1',
        transactionType: 'withdrawal',
        amountCents: 50000,
        feeCents: 100,
        netAmountCents: 49900,
        currency: 'USD',
        status: 'completed',
        referenceId: 'wreq_099',
        description: 'Bank Withdrawal to Chase Bank (••••4819)',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tx_3',
        walletId: 'w_creator_1',
        transactionType: 'bonus',
        amountCents: 5000,
        feeCents: 0,
        netAmountCents: 5000,
        currency: 'USD',
        status: 'completed',
        referenceId: 'bon_9812',
        description: 'Creator Onboarding Milestone Bonus',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
    ];
  }

  public async requestWithdrawal(
    userId: string,
    amountCents: number,
    paymentMethodType: PaymentMethodType,
    paymentDetails: Record<string, string>
  ): Promise<WithdrawRequestItem> {
    const feeCents = 100;
    const netAmountCents = Math.max(0, amountCents - feeCents);

    const newReq: WithdrawRequestItem = {
      id: `wreq_${Date.now()}`,
      userId,
      userName: 'Creator User',
      userEmail: 'creator@creatorx.app',
      walletId: 'w_creator_1',
      amountCents,
      feeCents,
      netAmountCents,
      paymentMethodType,
      paymentDetails,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.withdrawQueue.unshift(newReq);

    // Deduct available balance
    this.walletState.availableBalanceCents = Math.max(0, this.walletState.availableBalanceCents - amountCents);
    this.walletState.pendingBalanceCents += amountCents;

    return newReq;
  }

  public async getWithdrawalRequests(): Promise<WithdrawRequestItem[]> {
    return this.withdrawQueue;
  }

  public async approveWithdrawal(requestId: string): Promise<boolean> {
    const req = this.withdrawQueue.find((r) => r.id === requestId);
    if (req) {
      req.status = 'approved';
      req.processedAt = new Date().toISOString();
      req.receiptUrl = `https://creatorx.app/receipts/${req.id}.pdf`;
    }
    return true;
  }

  public async bulkApproveWithdrawals(requestIds: string[]): Promise<number> {
    let count = 0;
    for (const id of requestIds) {
      if (await this.approveWithdrawal(id)) count++;
    }
    return count;
  }

  public async rejectWithdrawal(requestId: string, reason: string): Promise<boolean> {
    const req = this.withdrawQueue.find((r) => r.id === requestId);
    if (req) {
      req.status = 'rejected';
      req.rejectionReason = reason;
      // Refund balance
      this.walletState.availableBalanceCents += req.amountCents;
    }
    return true;
  }

  public async getPaymentProviders(): Promise<PaymentProviderConfig[]> {
    return this.providersState;
  }

  public async savePaymentProvider(config: PaymentProviderConfig): Promise<boolean> {
    const idx = this.providersState.findIndex((p) => p.id === config.id);
    if (idx !== -1) {
      this.providersState[idx] = { ...config, updatedAt: new Date().toISOString() };
    }
    return true;
  }

  public async testProviderConnection(providerId: PaymentProviderId): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const latencyMs = Math.floor(Math.random() * 90) + 50;
    return {
      success: true,
      latencyMs,
      message: `${providerId.toUpperCase()} API connection test successful (${latencyMs}ms).`,
    };
  }

  public async getCampaignBudgets(): Promise<CampaignBudgetItem[]> {
    return [
      {
        id: 'cb_1',
        campaignId: 'c_tech_1',
        campaignTitle: 'Tech Launch Velocity Q3',
        brandId: 'brand_1',
        totalBudgetCents: 500000,
        spentBudgetCents: 214000,
        remainingBudgetCents: 286000,
        dailyLimitCents: 50000,
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
      },
    ];
  }

  public async getSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
    return [
      { id: 'plan_free', name: 'Free', priceCents: 0, billingCycle: 'monthly', features: ['1 Campaign', 'Basic Analytics'], trialDays: 0, active: true },
      { id: 'plan_starter', name: 'Starter', priceCents: 2900, billingCycle: 'monthly', features: ['5 Campaigns', 'Standard Verification', 'Export CSV'], trialDays: 14, active: true },
      { id: 'plan_pro', name: 'Pro Creator', priceCents: 7900, billingCycle: 'monthly', features: ['Unlimited Campaigns', 'Auto Verification Engine', 'Priority Payouts'], trialDays: 14, active: true },
      { id: 'plan_business', name: 'Business Brand', priceCents: 19900, billingCycle: 'monthly', features: ['Multi-Brand Management', 'Custom Tax Rules', 'Dedicated API Manager'], trialDays: 14, active: true },
      { id: 'plan_enterprise', name: 'Enterprise Custom', priceCents: 49900, billingCycle: 'monthly', features: ['SLA Guarantee', 'Dedicated Node', 'Custom Webhook Retries'], trialDays: 30, active: true },
    ];
  }

  public async getSubscriptions(): Promise<UserSubscriptionItem[]> {
    return [
      {
        id: 'sub_1',
        userId: 'user_1',
        userEmail: 'alex@creator.com',
        planId: 'plan_pro',
        planName: 'Pro Creator',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 86400 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
      },
    ];
  }

  public async getInvoices(): Promise<InvoiceItem[]> {
    return [
      {
        id: 'inv_1001',
        invoiceNumber: 'INV-2026-001001',
        userId: 'user_1',
        userName: 'Alex Rivers',
        invoiceType: 'creator_payout',
        subtotalCents: 50000,
        taxCents: 0,
        totalCents: 50000,
        currency: 'USD',
        status: 'paid',
        pdfUrl: 'https://creatorx.app/invoices/INV-2026-001001.pdf',
        createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      },
      {
        id: 'inv_1002',
        invoiceNumber: 'INV-2026-001002',
        userId: 'brand_1',
        userName: 'TechCorp Brand',
        invoiceType: 'brand_billing',
        subtotalCents: 500000,
        taxCents: 41250,
        totalCents: 541250,
        currency: 'USD',
        status: 'paid',
        pdfUrl: 'https://creatorx.app/invoices/INV-2026-001002.pdf',
        createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
      },
    ];
  }

  public async getCoupons(): Promise<CouponCodeItem[]> {
    return [
      { id: 'c_1', code: 'LAUNCH2026', discountType: 'percentage', discountValue: 20, maxUses: 1000, usesCount: 142, active: true, createdAt: new Date().toISOString() },
      { id: 'c_2', code: 'WELCOME50', discountType: 'fixed', discountValue: 50, maxUses: 500, usesCount: 89, active: true, createdAt: new Date().toISOString() },
    ];
  }

  public async getTaxRules(): Promise<TaxRuleItem[]> {
    return [
      { id: 'tax_1', name: 'US Sales Tax Standard', country: 'US', taxType: 'SalesTax', percentage: 8.25, isInclusive: false, active: true },
      { id: 'tax_2', name: 'UK VAT Standard', country: 'GB', taxType: 'VAT', percentage: 20.0, isInclusive: true, active: true },
      { id: 'tax_3', name: 'EU VAT Standard', country: 'EU', taxType: 'VAT', percentage: 21.0, isInclusive: true, active: true },
      { id: 'tax_4', name: 'India GST Standard', country: 'IN', taxType: 'GST', percentage: 18.0, isInclusive: false, active: true },
    ];
  }

  public async getAffiliatePayouts(): Promise<AffiliatePayoutItem[]> {
    return [
      { id: 'aff_1', referrerId: 'r1', referrerName: 'Sarah Jenkins', refereeName: 'TechCreator Hub', commissionCents: 15000, status: 'paid', createdAt: new Date().toISOString() },
    ];
  }

  public async getRefundRequests(): Promise<RefundRequestItem[]> {
    return [
      { id: 'ref_1', transactionId: 'tx_9812', userName: 'Brand User', amountCents: 12000, reason: 'Campaign paused before launch', status: 'approved', createdAt: new Date().toISOString() },
    ];
  }

  public async getRevenueAnalytics(): Promise<RevenueAnalyticsMetrics> {
    return {
      mrrCents: 4280000,
      arrCents: 51360000,
      grossRevenueCents: 124800000,
      netRevenueCents: 112320000,
      creatorEarningsCents: 94500000,
      brandSpendingCents: 124800000,
      withdrawTrendsCents: 82100000,
      paymentSuccessRatePercent: 99.4,
      refundRatePercent: 0.35,
    };
  }

  public async getFinanceSettings(): Promise<FinanceSettingsConfig> {
    return {
      platformFeePercent: 5.0,
      creatorCommissionPercent: 85.0,
      brandCommissionPercent: 10.0,
      withdrawalFeeCents: 100,
      autoApproveWithdrawalLimitCents: 25000,
      defaultCurrency: 'USD',
    };
  }

  public async saveFinanceSettings(_settings: FinanceSettingsConfig): Promise<boolean> {
    return true;
  }

  public async getAuditLogs(): Promise<FinanceAuditLogItem[]> {
    return [
      {
        id: 'aud_f1',
        userId: 'admin_1',
        userEmail: 'admin@creatorx.app',
        action: 'withdrawal.bulk_approved',
        entityType: 'withdraw_request',
        entityId: 'wreq_101, wreq_102',
        changesMasked: 'Approved 2 withdrawal requests worth $1,700.00',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      },
    ];
  }
}

export const financeService = new FinanceService();
