import { formatCents } from '../../lib/currency';
import type { Wallet } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { toast } from '../../lib/toast';

export function WalletSummary({ wallet }: { wallet: Wallet | null }) {
  const balance = formatCents(wallet?.available_balance_cents ?? 0);
  
  const handleCopy = () => {
    if (wallet?.solana_address) {
      navigator.clipboard.writeText(wallet.solana_address);
      toast.success("Address copied to clipboard");
    } else {
      toast.error("No wallet address to copy");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border/50">
          <h2 className="text-lg font-bold text-text-primary">Wallet Balance</h2>
          <p className="text-sm text-text-secondary mt-1">Your available token balance</p>
        </div>
        <div className="p-5 flex flex-col gap-5 flex-1">
          <div className="bg-bg rounded-xl border border-border p-5 flex items-center gap-4 shadow-inner">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
              <span className="font-bold text-xl">$</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {balance.replace('$', '')} <span className="text-text-secondary text-2xl">USDC</span>
            </div>
          </div>
          <div className="flex gap-3 mt-auto pt-2">
            <Button variant="primary" className="flex-1 shadow-[0_2px_10px_rgba(var(--color-accent),0.2)] font-medium">
              <Icon name="plus" size={16} className="mr-2" /> Deposit
            </Button>
            <Button variant="outline" className="flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] bg-bg/40 font-medium border-border/80 hover:bg-surface-elevated">
              <Icon name="send" size={14} className="mr-2 text-text-secondary" /> Withdraw
            </Button>
            <Button variant="outline" className="flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] bg-bg/40 font-medium border-border/80 hover:bg-surface-elevated">
              <Icon name="refresh" size={14} className="mr-2 text-text-secondary" /> Change
            </Button>
          </div>
        </div>
      </div>

      {/* Privy Wallet Card */}
      <div className="rounded-2xl border border-[#22c55e]/30 bg-surface shadow-sm overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        <div className="p-5 border-b border-[#22c55e]/20 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"></div>
            <h2 className="text-lg font-bold text-text-primary">Privy Wallet</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">Your embedded Solana wallet</p>
        </div>
        <div className="p-5 flex flex-col gap-5 flex-1 relative z-10">
          <div className="bg-bg/60 rounded-xl border border-border p-4 shadow-inner">
            <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Wallet Address</div>
            <div className="flex items-center justify-between gap-3">
              <code className="text-[13px] font-mono truncate text-text-primary flex-1">
                {wallet?.solana_address || "No address generated yet"}
              </code>
              <button 
                onClick={handleCopy}
                disabled={!wallet?.solana_address}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-text-secondary transition-colors disabled:opacity-50"
              >
                <Icon name="copy" size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-auto pt-2">
            <Button variant="outline" className="flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] bg-bg/40 font-medium border-border/80 hover:bg-surface-elevated">
              <Icon name="external-link" size={16} className="mr-2 text-text-secondary" /> View Explorer
            </Button>
            <Button variant="outline" className="flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] bg-bg/40 font-medium border-border/80 hover:bg-surface-elevated">
              <Icon name="key" size={16} className="mr-2 text-text-secondary" /> Export Key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
