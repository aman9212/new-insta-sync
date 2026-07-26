import { WalletSummary } from '../../components/wallet/WalletSummary';
import { TransactionTable } from '../../components/wallet/TransactionTable';
import { WithdrawalDialog } from '../../components/wallet/WithdrawalDialog';
import { useWallet } from '../../hooks/useWallet';

export function CreatorWalletPage() {
  const { wallet, transactions, refresh } = useWallet();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Wallet</h1>
        <p className="mt-1 text-text-secondary">Balances are maintained through atomic database ledger functions.</p>
      </div>
      <WalletSummary wallet={wallet} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <TransactionTable transactions={transactions} />
        <WithdrawalDialog onRequested={refresh} />
      </div>
    </div>
  );
}
