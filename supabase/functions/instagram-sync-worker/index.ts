import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-worker-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

// Sleep helper for exponential backoff retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = request.headers.get('Authorization');
  const workerSecret = request.headers.get('x-worker-secret');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  // Verify authorization (cron trigger using service key, worker secret, or valid bearer)
  const isServiceAuth = authHeader === `Bearer ${serviceKey}`;
  const isSecretAuth = workerSecret && workerSecret === Deno.env.get('WORKER_SECRET');
  if (!isServiceAuth && !isSecretAuth && authHeader !== `Bearer ${serviceKey}`) {
    return json({ error: 'Unauthorized scheduled worker invocation' }, 401);
  }

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  console.log('Starting scheduled Instagram sync worker execution...');

  // Fetch all active Instagram accounts
  const { data: accounts, error } = await supabase
    .from('provider_connections')
    .select('id, user_id, provider_account_id, provider_username, token_expires_at, status, last_sync_at')
    .eq('provider', 'instagram')
    .in('status', ['active', 'token_expired']);

  if (error || !accounts) {
    console.error('Failed to query provider_connections:', error);
    return json({ error: `Failed to fetch accounts: ${error?.message || 'Unknown'}` }, 500);
  }

  const summary = {
    total: accounts.length,
    synced: 0,
    refreshed: 0,
    failed: 0,
    reconnect_required: 0,
    errors: [] as Array<{ accountId: string; error: string }>
  };

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  for (const account of accounts) {
    let accountActive = account.status === 'active';

    // 1. Check if Token needs Refreshing (expiring within 7 days or already expired)
    const tokenExpMs = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
    const isExpiringSoon = tokenExpMs && (tokenExpMs - nowMs < sevenDaysInMs);

    if (isExpiringSoon || account.status === 'token_expired') {
      console.log(`Refreshing access token for account ${account.id} (${account.provider_username})...`);
      
      let refreshSuccess = false;
      let attempts = 0;

      while (attempts < 3 && !refreshSuccess) {
        attempts++;
        try {
          const refreshRes = await fetch(`${supabaseUrl}/functions/v1/social-integrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({ action: 'instagram-refresh-token', platformId: 'instagram', accountId: account.id })
          });

          const refreshData = await refreshRes.json().catch(() => ({}));

          if (refreshRes.ok && refreshData.success) {
            summary.refreshed++;
            refreshSuccess = true;
            accountActive = true;
          } else if (refreshData.code === 'RECONNECT_REQUIRED' || refreshRes.status === 401) {
            // Token is revoked or non-refreshable
            summary.reconnect_required++;
            accountActive = false;
            break;
          } else {
            // Transient failure, back off before retry
            await delay(500 * Math.pow(2, attempts));
          }
        } catch (err) {
          console.warn(`Token refresh attempt ${attempts} failed for ${account.id}:`, err);
          await delay(500 * Math.pow(2, attempts));
        }
      }

      if (!refreshSuccess && !accountActive) {
        summary.errors.push({ accountId: account.id, error: 'Token refresh failed; reconnect required' });
        continue; // Skip media sync for invalid tokens
      }
    }

    if (!accountActive) continue;

    // 2. Deep Metrics & Media Sync with Exponential Backoff Retry
    let syncSuccess = false;
    let syncAttempts = 0;
    let lastErrorMessage = '';

    while (syncAttempts < 3 && !syncSuccess) {
      syncAttempts++;
      try {
        const syncRes = await fetch(`${supabaseUrl}/functions/v1/social-integrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({ action: 'instagram-sync-media', platformId: 'instagram', accountId: account.id })
        });

        const syncData = await syncRes.json().catch(() => ({}));

        if (syncRes.ok && syncData.success) {
          summary.synced++;
          syncSuccess = true;
        } else if (syncData.code === 'RECONNECT_REQUIRED' || syncRes.status === 401) {
          summary.reconnect_required++;
          lastErrorMessage = syncData.error || 'Token expired or revoked';
          break;
        } else {
          lastErrorMessage = syncData.error || `HTTP ${syncRes.status}`;
          // Exponential backoff for rate limits or server errors
          await delay(1000 * Math.pow(2, syncAttempts));
        }
      } catch (e: any) {
        lastErrorMessage = e.message || 'Network exception during sync';
        await delay(1000 * Math.pow(2, syncAttempts));
      }
    }

    if (!syncSuccess) {
      summary.failed++;
      summary.errors.push({ accountId: account.id, error: lastErrorMessage });
    }

    // Gentle throttle between accounts to respect Meta API rate limit quotas
    await delay(300);
  }

  console.log('Instagram sync worker finished execution:', summary);

  return json({
    success: true,
    timestamp: new Date().toISOString(),
    summary
  });
});
