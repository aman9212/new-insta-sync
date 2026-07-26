import { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import type { WalletState, WalletTransactionItem, PaymentMethodType } from '../../types/finance';
import { financeService } from '../../services/finance.service';
import { formatCents } from '../../lib/currency';

export function WalletCenter() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState('250.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bank_account');
  const [accountNumber, setAccountNumber] = useState('••••4819');
  const [bankName, setBankName] = useState('Chase Bank');
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    financeService.getWallet('user_1').then(setWallet);
    financeService.getTransactions('w_creator_1').then(setTransactions);
  }, []);

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(Number(withdrawAmount) * 100);
    if (!wallet || amountCents <= 0 || amountCents > wallet.availableBalanceCents) {
      alert('Invalid withdrawal amount or insufficient available balance.');
      return;
    }

    setIsSubmitting(true);
    await financeService.requestWithdrawal('user_1', amountCents, paymentMethod, { bankName, accountNumber });
    const updatedWallet = await financeService.getWallet('user_1');
    setWallet(updatedWallet);
    setIsSubmitting(false);
    setShowWithdrawModal(false);
    setNotice(`Withdrawal request of ${formatCents(amountCents)} submitted successfully!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDepositModal(false);
    setNotice('Deposit initiated via Stripe gateway.');
    setTimeout(() => setNotice(null), 3500);
  };

  if (!wallet) return null;

  return (
    <div className="space-y-6 text-text-primary">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Finance & Wallet Center</h1>
          <p className="mt-1 text-xs text-text-secondary">Manage balances, instant payouts, campaign funding, and transaction receipts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-1.5"
          >
            <Icon name="plus" size={14} /> Add Funds
          </button>
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg flex items-center gap-1.5"
          >
            <Icon name="arrow-up-right" size={14} /> Request Withdrawal
          </button>
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

      {/* 3D Glassmorphism Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <div className="rounded-3xl border border-accent/40 bg-[linear-gradient(135deg,rgba(139,92,246,0.15),rgba(15,23,42,0.8))] p-6 space-y-2 shadow-[0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Available Balance</span>
            <Icon name="wallet" size={18} className="text-accent" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary">{formatCents(wallet.availableBalanceCents)}</p>
          <p className="text-[11px] text-text-secondary">Cleared and ready for instant withdrawal.</p>
        </div>

        {/* Pending Balance */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pending Payouts</span>
            <Icon name="clock" size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary">{formatCents(wallet.pendingBalanceCents)}</p>
          <p className="text-[11px] text-text-secondary">Under verification or bank clearance.</p>
        </div>

        {/* Locked Balance */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Locked Escrow</span>
            <Icon name="lock" size={18} className="text-text-muted" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary">{formatCents(wallet.lockedBalanceCents)}</p>
          <p className="text-[11px] text-text-secondary">Held for active campaign deliverables.</p>
        </div>

        {/* Bonus Balance */}
        <div className="rounded-3xl border border-border bg-surface p-6 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bonus Credit</span>
            <Icon name="sparkles" size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary">{formatCents(wallet.bonusBalanceCents)}</p>
          <p className="text-[11px] text-text-secondary">Onboarding & referral milestone credits.</p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Recent Financial Transactions</h2>
          <span className="text-xs text-text-secondary">30-day activity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-hover/50">
                  <td className="py-3.5 text-text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 capitalize font-semibold text-text-primary">{tx.transactionType.replaceAll('_', ' ')}</td>
                  <td className="py-3.5 text-text-secondary">{tx.description}</td>
                  <td
                    className={`py-3.5 text-right font-bold ${
                      tx.transactionType === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.transactionType === 'withdrawal' ? '-' : '+'}{formatCents(tx.netAmountCents)}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-primary">Request Payout Withdrawal</h3>
              <button type="button" onClick={() => setShowWithdrawModal(false)} className="text-text-muted hover:text-text-primary">
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Withdrawal Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="10.00"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-primary"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Available to withdraw: {formatCents(wallet.availableBalanceCents)} (Fee: $1.00)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
                >
                  <option value="bank_account">Direct Bank Account (ACH / SEPA)</option>
                  <option value="upi">UPI Transfer (India)</option>
                  <option value="paypal">PayPal Instant</option>
                  <option value="wise">Wise (Global Wire)</option>
                  <option value="crypto">Crypto Wallet (USDC / SOL)</option>
                  <option value="stripe_connect">Stripe Connect Instant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Bank Name / Address</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Account Number / Handle</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-md"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-primary">Add Wallet Funds</h3>
              <button type="button" onClick={() => setShowDepositModal(false)} className="text-text-muted hover:text-text-primary">
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  step="10.00"
                  defaultValue="500.00"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Gateway Provider</label>
                <select className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary">
                  <option value="stripe">Stripe Card / Apple Pay</option>
                  <option value="razorpay">Razorpay NetBanking / UPI</option>
                  <option value="paypal">PayPal Balance</option>
                  <option value="crypto">USDC / Solana Pay</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
