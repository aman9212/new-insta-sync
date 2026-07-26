import { supabase } from '../lib/supabase';
import type { Wallet, WalletTransaction } from '../types';

export async function getWallet() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('wallets').select('*').maybeSingle();
  if (error) throw error;
  return data as Wallet | null;
}

export async function listWalletTransactions() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WalletTransaction[];
}
