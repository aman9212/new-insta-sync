import { supabase } from '../lib/supabase';

export async function requestWithdrawal(amountCents: number) {
  if (!supabase) throw new Error('Supabase is not configured');
  const idempotencyKey = crypto.randomUUID();
  const { data, error } = await supabase.rpc('request_withdrawal', {
    request_amount_cents: amountCents,
    request_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  return data;
}
