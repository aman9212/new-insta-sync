import { useEffect, useState } from 'react';
import { getWallet, listWalletTransactions } from '../services/wallet.service';
import type { Wallet, WalletTransaction } from '../types';

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [walletData, txData] = await Promise.all([getWallet(), listWalletTransactions()]);
    setWallet(walletData);
    setTransactions(txData);
  }

  useEffect(() => {
    refresh()
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return { wallet, transactions, loading, error, refresh };
}
