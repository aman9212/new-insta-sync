import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPayoutProvider } from './payout.provider.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Server Supabase credentials are not configured' }, { status: 500, headers: corsHeaders });
  }

  const { withdrawalId } = await req.json();
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: withdrawal, error } = await supabase.from('withdrawals').select('*').eq('id', withdrawalId).single();
  if (error) return Response.json({ error: error.message }, { status: 404, headers: corsHeaders });

  const payoutProvider = getPayoutProvider(supabase, withdrawal);
  const payout = await payoutProvider.createPayout({
    withdrawalId,
    amountCents: withdrawal.amount_cents,
    userId: withdrawal.user_id,
  });

  await supabase.from('withdrawals').update({
    status: payout.status,
    payout_provider: payout.provider,
    payout_reference: payout.reference,
    processed_at: payout.status === 'paid' ? new Date().toISOString() : null,
  }).eq('id', withdrawalId);

  await supabase.from('audit_logs').insert({
    action: 'withdrawal.process',
    entity_type: 'withdrawal',
    entity_id: withdrawalId,
    metadata: payout,
  });

  return Response.json(payout, { headers: corsHeaders });
});
