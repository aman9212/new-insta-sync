import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  // 1. Resolve and verify JWT caller identity
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Missing Authorization header' }, { status: 401, headers: corsHeaders });
  }

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  // Parse JWT
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !user) {
    return Response.json({ error: 'Invalid session or token: ' + (authError?.message ?? '') }, { status: 401, headers: corsHeaders });
  }

  const userId = user.id;

  // 2. Anonymize user profiles and clean up provider connections
  const { error: providerErr } = await supabaseClient
    .from('provider_connections')
    .delete()
    .eq('user_id', userId);

  if (providerErr) {
    return Response.json({ error: 'Failed to delete provider connections: ' + providerErr.message }, { status: 500, headers: corsHeaders });
  }

  // Anonymize profiles row
  const { error: profileErr } = await supabaseClient
    .from('profiles')
    .update({
      display_name: 'Deleted User',
      username: `deleted_${userId.slice(0, 8)}`,
      email: null,
      avatar_url: null,
      onboarding_completed: false,
      account_status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileErr) {
    return Response.json({ error: 'Failed to anonymize profile: ' + profileErr.message }, { status: 500, headers: corsHeaders });
  }

  // 3. Delete auth.users record via Admin API
  const { error: deleteUserErr } = await supabaseClient.auth.admin.deleteUser(userId);
  if (deleteUserErr) {
    return Response.json({ error: 'Failed to delete auth user: ' + deleteUserErr.message }, { status: 500, headers: corsHeaders });
  }

  // Log audit log
  await supabaseClient.from('audit_logs').insert({
    actor_id: null,
    action: 'user.delete',
    entity_type: 'profile',
    entity_id: userId,
    metadata: { userId },
  });

  return Response.json({ success: true, message: 'Account successfully anonymized and deleted' }, { headers: corsHeaders });
});
