import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!url || !serviceKey) return json({ error: 'Server configuration is incomplete' }, 500);
  if (!bearer) return json({ error: 'Authentication is required' }, 401);

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userResult, error: userError } = await admin.auth.getUser(bearer);
  if (userError || !userResult.user) return json({ error: 'Invalid session' }, 401);
  const { data: actor } = await admin.from('profiles').select('role,account_status').eq('id', userResult.user.id).maybeSingle();
  if (actor?.role !== 'admin' || actor.account_status !== 'active') return json({ error: 'Administrator permission is required' }, 403);

  let input: { action?: string; creatorId?: string; reason?: string };
  try { input = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!input.creatorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.creatorId)) return json({ error: 'A valid creatorId is required' }, 400);
  if (!['force_logout', 'send_password_recovery', 'soft_delete', 'create_impersonation_link'].includes(input.action ?? '')) return json({ error: 'Unsupported action' }, 400);

  const { data: target, error: targetError } = await admin.from('profiles').select('id,email,role').eq('id', input.creatorId).maybeSingle();
  if (targetError || !target || target.role !== 'creator') return json({ error: 'Creator not found' }, 404);
  if (input.action === 'force_logout') {
    const { error } = await admin.auth.admin.signOut(input.creatorId, 'global');
    if (error) return json({ error: error.message }, 400);
  }
  if (input.action === 'send_password_recovery') {
    if (!target.email) return json({ error: 'The creator does not have an email address' }, 422);
    const { error } = await admin.auth.resetPasswordForEmail(target.email, { redirectTo: `${corsHeaders['Access-Control-Allow-Origin']}/auth/callback` });
    if (error) return json({ error: error.message }, 400);
  }
  if (input.action === 'create_impersonation_link') {
    if (!target.email) return json({ error: 'The creator does not have an email address' }, 422);
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: target.email, options: { redirectTo: `${corsHeaders['Access-Control-Allow-Origin']}/auth/callback` } });
    if (error || !data.properties.action_link) return json({ error: error?.message ?? 'Unable to generate an impersonation link' }, 400);
    await admin.from('audit_logs').insert({ actor_id: userResult.user.id, action: 'creator.create_impersonation_link', entity_type: 'creator', entity_id: input.creatorId, metadata: { reason: input.reason ?? null } });
    return json({ ok: true, impersonationUrl: data.properties.action_link });
  }
  if (input.action === 'soft_delete') {
    const { error } = await admin.from('creator_profiles').update({ status: 'deleted' }).eq('id', input.creatorId);
    if (error) return json({ error: error.message }, 400);
  }
  await admin.from('audit_logs').insert({ actor_id: userResult.user.id, action: `creator.${input.action}`, entity_type: 'creator', entity_id: input.creatorId, metadata: { reason: input.reason ?? null } });
  return json({ ok: true });
});
