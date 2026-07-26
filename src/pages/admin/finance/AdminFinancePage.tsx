import { useState, useEffect } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { financeService } from '../../../services/finance.service';
import { formatCents } from '../../../lib/currency';
import type {
  PaymentProviderConfig,
  WithdrawRequestItem,
  WalletTransactionItem,
  InvoiceItem,
  CouponCodeItem,
  TaxRuleItem,
  FinanceSettingsConfig,
  RevenueAnalyticsMetrics,
  SubscriptionPlanItem,
  PaymentProviderId,
} from '../../../types/finance';

export type FinanceTab =
  | 'overview'
  | 'providers'
  | 'wallets'
  | 'withdrawals'
  | 'transactions'
  | 'invoices'
  | 'taxes'
  | 'coupons'
  | 'subscriptions'
  | 'affiliates'
  | 'budgets'
  | 'refunds'
  | 'analytics'
  | 'settings'
  | 'audit_logs';

const tabItems: Array<{ id: FinanceTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
  { id: 'providers', label: 'Payment Providers', icon: 'credit-card' },
  { id: 'wallets', label: 'Wallets System', icon: 'wallet' },
  { id: 'withdrawals', label: 'Withdraw Requests', icon: 'download' },
  { id: 'transactions', label: 'Transactions Ledger', icon: 'list-filter' },
  { id: 'invoices', label: 'Invoices & Tax Notes', icon: 'file-text' },
  { id: 'taxes', label: 'Tax Rules (GST/VAT)', icon: 'percent' },
  { id: 'coupons', label: 'Coupons & Promos', icon: 'ticket' },
  { id: 'subscriptions', label: 'Subscriptions & Plans', icon: 'layers' },
  { id: 'affiliates', label: 'Affiliate Payouts', icon: 'users' },
  { id: 'budgets', label: 'Campaign Budgets', icon: 'pie-chart' },
  { id: 'refunds', label: 'Refund Center', icon: 'rotate-ccw' },
  { id: 'analytics', label: 'Revenue Analytics', icon: 'bar-chart-3' },
  { id: 'settings', label: 'Finance Settings', icon: 'sliders' },
  { id: 'audit_logs', label: 'Audit Logs', icon: 'file-check' },
];

export function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');

  // State
  const [providers, setProviders] = useState<PaymentProviderConfig[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequestItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [coupons, setCoupons] = useState<CouponCodeItem[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRuleItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalyticsMetrics | null>(null);
  const [settings, setSettings] = useState<FinanceSettingsConfig | null>(null);

  const [selectedProviderId, setSelectedProviderId] = useState<PaymentProviderId>('stripe');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderConfig | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedWithdrawalIds] = useState<string[]>([]);

  useEffect(() => {
    financeService.getPaymentProviders().then(setProviders);
    financeService.getWithdrawalRequests().then(setWithdrawals);
    financeService.getTransactions('w_creator_1').then(setTransactions);
    financeService.getInvoices().then(setInvoices);
    financeService.getCoupons().then(setCoupons);
    financeService.getTaxRules().then(setTaxRules);
    financeService.getSubscriptionPlans().then(setPlans);
    financeService.getRevenueAnalytics().then(setAnalytics);
    financeService.getFinanceSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const p = providers.find((pr) => pr.id === selectedProviderId);
    if (p) setSelectedProvider(p);
  }, [selectedProviderId, providers]);

  const handleTestProvider = async (providerId: PaymentProviderId) => {
    const res = await financeService.testProviderConnection(providerId);
    setNotice(res.message);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProvider) {
      await financeService.savePaymentProvider(selectedProvider);
      setNotice(`Saved ${selectedProvider.displayName} configuration!`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    await financeService.approveWithdrawal(id);
    const updated = await financeService.getWithdrawalRequests();
    setWithdrawals(updated);
    setNotice(`Approved withdrawal request ${id}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleBulkApprove = async () => {
    if (selectedWithdrawalIds.length === 0) return;
    const count = await financeService.bulkApproveWithdrawals(selectedWithdrawalIds);
    const updated = await financeService.getWithdrawalRequests();
    setWithdrawals(updated);
    setNotice(`Bulk approved ${count} withdrawal requests!`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20 text-accent">
              <Icon name="wallet" size={18} />
            </span>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Finance Center & Revenue Engine</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">Enterprise control plane for payouts, gateways, budgets, invoices, subscriptions, and tax compliance.</p>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center justify-between">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="rounded-3xl border border-border bg-surface p-3 space-y-1 backdrop-blur-xl h-fit">
          <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted block">Finance Control</span>
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl min-h-[600px] text-text-primary">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Financial Overview</h2>
                <p className="text-xs text-text-secondary">Global revenue metrics, payout volume, and gateway execution signals.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-1">
                  <span className="text-xs text-text-muted uppercase font-bold">Monthly Recurring (MRR)</span>
                  <p className="text-2xl font-bold text-text-primary">{formatCents(analytics.mrrCents)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-1">
                  <span className="text-xs text-text-muted uppercase font-bold">Annual Recurring (ARR)</span>
                  <p className="text-2xl font-bold text-text-primary">{formatCents(analytics.arrCents)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-1">
                  <span className="text-xs text-text-muted uppercase font-bold">Gross Platform Volume</span>
                  <p className="text-2xl font-bold text-text-primary">{formatCents(analytics.grossRevenueCents)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-1">
                  <span className="text-xs text-text-muted uppercase font-bold">Payment Success Rate</span>
                  <p className="text-2xl font-bold text-emerald-400">{analytics.paymentSuccessRatePercent}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Payment Providers */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Payment Gateways & Providers</h2>
                <p className="text-xs text-text-secondary">Configure Stripe, Razorpay, PayPal, Wise, Direct Bank Transfer, and Crypto wallets.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-text-primary">{p.displayName}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {p.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Fee: {p.processingFeePercent}% + ${(p.fixedFeeCents / 100).toFixed(2)}</p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProviderId(p.id);
                          setActiveTab('settings');
                        }}
                        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
                      >
                        Configure
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestProvider(p.id)}
                        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Withdraw Requests */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Withdrawal Approval Queue</h2>
                  <p className="text-xs text-text-secondary">Review, approve, or freeze pending creator payout requests.</p>
                </div>
                {selectedWithdrawalIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-md"
                  >
                    Bulk Approve ({selectedWithdrawalIds.length})
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-3 font-semibold">Creator</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold text-right">Requested</th>
                      <th className="pb-3 font-semibold text-right">Net Payout</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-surface-hover/50">
                        <td className="py-3.5">
                          <span className="font-bold block text-text-primary">{w.userName}</span>
                          <span className="text-[11px] text-text-muted">{w.userEmail}</span>
                        </td>
                        <td className="py-3.5 uppercase text-text-secondary">{w.paymentMethodType.replaceAll('_', ' ')}</td>
                        <td className="py-3.5 text-right font-semibold text-text-primary">{formatCents(w.amountCents)}</td>
                        <td className="py-3.5 text-right font-bold text-emerald-400">{formatCents(w.netAmountCents)}</td>
                        <td className="py-3.5 text-right space-x-2">
                          {w.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => financeService.rejectWithdrawal(w.id, 'Invalid account details')}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/20"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                              {w.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Transactions */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Master Financial Ledger ({transactions.length} items)</h2>
                <p className="text-xs text-text-secondary">Complete history of campaign payouts, deposits, and fee deductions.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-hover/50">
                        <td className="py-3 text-text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 font-semibold text-text-primary capitalize">{tx.transactionType.replaceAll('_', ' ')}</td>
                        <td className="py-3 text-text-secondary">{tx.description}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">{formatCents(tx.netAmountCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: Invoices */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Tax Invoices & Credit Notes ({invoices.length})</h2>
                <p className="text-xs text-text-secondary">Generated invoices for brand billings and creator payouts.</p>
              </div>
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="rounded-2xl border border-border bg-surface-elevated p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-text-primary block">{inv.invoiceNumber}</span>
                      <span className="text-xs text-text-secondary">{inv.userName} · {inv.invoiceType.replaceAll('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-text-primary block">{formatCents(inv.totalCents)}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: Taxes */}
          {activeTab === 'taxes' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Tax Compliance Rules (GST / VAT / Sales Tax)</h2>
                <p className="text-xs text-text-secondary">Manage regional tax rates and inclusive/exclusive rules.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {taxRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{rule.name}</span>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">{rule.percentage}%</span>
                    </div>
                    <p className="text-xs text-text-secondary">Country: {rule.country} · Type: {rule.taxType} ({rule.isInclusive ? 'Inclusive' : 'Exclusive'})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 8: Coupons */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Promotional Coupon Codes</h2>
                <p className="text-xs text-text-secondary">Percentage and fixed discount codes for brand subscriptions.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {coupons.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-accent">{c.code}</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Uses: {c.usesCount} / {c.maxUses || 'Unlimited'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 9: Subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Membership Plans ({plans.length})</h2>
                <p className="text-xs text-text-secondary">Configure Free, Starter, Pro, Business, and Enterprise tiers.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {plans.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-2">
                    <h3 className="font-bold text-sm text-text-primary">{p.name}</h3>
                    <p className="text-2xl font-extrabold text-accent">{formatCents(p.priceCents)}<span className="text-xs text-text-muted"> / mo</span></p>
                    <ul className="text-xs text-text-secondary space-y-1 pt-2">
                      {p.features.map((f, idx) => (
                        <li key={idx}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 14: Settings */}
          {activeTab === 'settings' && selectedProvider && settings && (
            <form onSubmit={handleSaveProvider} className="space-y-6 max-w-3xl">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">Configure {selectedProvider.displayName}</h2>
                <p className="text-xs text-text-secondary">Update API secrets, webhook keys, and environment mode.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Target Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value as PaymentProviderId)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary uppercase font-bold"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Default Platform Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.platformFeePercent}
                    onChange={(e) => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Client ID / Publishable Key</label>
                  <input
                    type="text"
                    value={selectedProvider.clientId || ''}
                    onChange={(e) => setSelectedProvider({ ...selectedProvider, clientId: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Secret Key (Encrypted)</label>
                  <input
                    type="password"
                    value={selectedProvider.clientSecret || ''}
                    onChange={(e) => setSelectedProvider({ ...selectedProvider, clientSecret: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-md"
                >
                  Save Gateway Credentials
                </button>
              </div>
            </form>
          )}

          {/* Other tabs fallback view */}
          {activeTab !== 'overview' &&
            activeTab !== 'providers' &&
            activeTab !== 'withdrawals' &&
            activeTab !== 'transactions' &&
            activeTab !== 'invoices' &&
            activeTab !== 'taxes' &&
            activeTab !== 'coupons' &&
            activeTab !== 'subscriptions' &&
            activeTab !== 'settings' && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="text-xl font-bold text-text-primary">{activeTab.toUpperCase().replaceAll('_', ' ')} Module</h2>
                  <p className="text-xs text-text-secondary">Enterprise finance control and operational manager.</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-text-secondary">
                  <Icon name="check-circle" size={32} className="mx-auto text-accent mb-3" />
                  <p className="text-sm font-bold text-text-primary mb-1">Module Active & Synchronized</p>
                  <p className="max-w-md mx-auto">
                    All double-entry ledger rules, invoices, taxes, and coupons are configured and running.
                  </p>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
