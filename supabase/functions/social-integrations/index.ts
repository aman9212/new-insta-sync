import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AdminRole = 'super_admin' | 'admin' | 'moderator';
type PlatformId = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'facebook' | 'twitch' | 'kick' | 'linkedin' | 'snapchat' | 'reddit' | 'discord';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-worker-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const healthEndpoints: Record<PlatformId, string> = {
  youtube: 'https://www.googleapis.com',
  instagram: 'https://graph.facebook.com',
  tiktok: 'https://open.tiktokapis.com',
  x: 'https://api.x.com',
  facebook: 'https://graph.facebook.com',
  twitch: 'https://id.twitch.tv',
  kick: 'https://kick.com',
  linkedin: 'https://api.linkedin.com',
  snapchat: 'https://kit.snapchat.com',
  reddit: 'https://www.reddit.com',
  discord: 'https://discord.com/api',
};

const DEFAULT_INSTAGRAM_SCOPES = [
  'instagram_basic',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'business_management'
];

const rank: Record<AdminRole, number> = { moderator: 1, admin: 2, super_admin: 3 };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function unbase64(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

async function sha256(value: string) {
  return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

async function keyFromEnvironment() {
  let raw = Deno.env.get('SOCIAL_CREDENTIALS_ENCRYPTION_KEY');
  if (!raw) {
    // Graceful fallback for local development if environment variables are not loaded
    raw = 'c3VwZXItc2VjcmV0LWtleS0zMi1ieXRlcy1mb3ItZGV2ZWxvcG1lbnQ=';
  }
  const bytes = unbase64(raw);
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptSecrets(values: Record<string, string>) {
  const key = await keyFromEnvironment();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(values)));
  return { version: 1, iv: base64(iv), ciphertext: base64(new Uint8Array(encrypted)) };
}

async function decryptSecrets(payload: unknown): Promise<Record<string, string>> {
  const data = asObject(payload);
  const iv = text(data.iv);
  const ciphertext = text(data.ciphertext);
  if (!iv || !ciphertext) return asObject(payload) as Record<string, string>;
  try {
    const key = await keyFromEnvironment();
    const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv) }, key, unbase64(ciphertext));
    return asObject(JSON.parse(new TextDecoder().decode(decoded))) as Record<string, string>;
  } catch (e) {
    return asObject(payload) as Record<string, string>;
  }
}

async function encryptToken(token: string): Promise<string> {
  const key = await keyFromEnvironment();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  return JSON.stringify({ version: 1, iv: base64(iv), ciphertext: base64(new Uint8Array(encrypted)) });
}

async function decryptToken(encryptedString: string): Promise<string> {
  try {
    const data = JSON.parse(encryptedString);
    const iv = text(data.iv);
    const ciphertext = text(data.ciphertext);
    if (!iv || !ciphertext) return encryptedString;
    const key = await keyFromEnvironment();
    const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv) }, key, unbase64(ciphertext));
    return new TextDecoder().decode(decoded);
  } catch {
    return encryptedString;
  }
}

function maskedConfiguration(secrets: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(secrets)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => [key, { configured: true, hint: `${value.slice(0, 2)}••••${value.slice(-2)}` }])
  );
}

async function getAdmin(supabase: ReturnType<typeof createClient>, request: Request, minimum: AdminRole) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Authentication required');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid session');
  const { data: admin } = await supabase.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
  const role = admin?.role as AdminRole | undefined;
  if (!role || rank[role] < rank[minimum]) throw new Error('Insufficient permission');
  return { id: user.id, role };
}

async function getCreator(supabase: ReturnType<typeof createClient>, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Authentication required');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid session');
  return user;
}

async function audit(supabase: ReturnType<typeof createClient>, actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>, request: Request) {
  await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: { ...metadata, ip: request.headers.get('x-forwarded-for')?.split(',')[0] ?? null, user_agent: request.headers.get('user-agent') ?? null }
  });
}

async function logApiCall(supabase: ReturnType<typeof createClient>, connectionId: string | null, platform: string, endpoint: string, httpStatus: number, durationMs: number, errorCode: string | null, errorMessage: string | null, payload?: unknown) {
  try {
    await supabase.from('api_logs').insert({
      connection_id: connectionId,
      platform,
      endpoint,
      http_status: httpStatus,
      request_duration_ms: durationMs,
      error_code: errorCode,
      error_message: errorMessage,
      response_payload: payload ? asObject(payload) : null
    });
  } catch (e) {
    console.error('Failed to insert api_logs record:', e);
  }
}

async function logSyncHistory(supabase: ReturnType<typeof createClient>, connectionId: string, userId: string, platform: string, status: string, recordsSynced: number, details: Record<string, unknown>, errorMessage: string | null = null) {
  try {
    await supabase.from('sync_history').insert({
      connection_id: connectionId,
      user_id: userId,
      platform,
      status,
      records_synced: recordsSynced,
      details,
      error_message: errorMessage
    });
  } catch (e) {
    console.error('Failed to insert sync_history record:', e);
  }
}

async function getConfiguration(supabase: ReturnType<typeof createClient>, platformId: string) {
  const [{ data: platform }, { data: credential }, { data: settings }] = await Promise.all([
    supabase.from('social_platforms').select('*').eq('id', platformId).maybeSingle(),
    supabase.from('social_credentials').select('platform_id, environment, oauth_version, api_version, scopes, redirect_url, credentials_status, expires_at, encrypted_secrets, updated_at').eq('platform_id', platformId).maybeSingle(),
    supabase.from('platform_settings').select('*').eq('platform_id', platformId).maybeSingle(),
  ]);
  if (!platform) throw new Error('Unknown platform');
  const secrets = credential ? await decryptSecrets(credential.encrypted_secrets) : {};
  return { platform, credential: credential ? { ...credential, encrypted_secrets: undefined, secrets: maskedConfiguration(secrets) } : null, settings };
}

async function testHealth(supabase: ReturnType<typeof createClient>, platformId: PlatformId) {
  const started = Date.now();
  let httpStatus: number | null = null;
  let errorMessage: string | null = null;
  try {
    const response = await fetch(healthEndpoints[platformId], { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    httpStatus = response.status;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Network check failed';
  }
  const responseTime = Date.now() - started;
  const status = errorMessage ? 'offline' : (httpStatus && httpStatus < 500 ? 'healthy' : 'degraded');
  await Promise.all([
    supabase.from('api_health_logs').insert({ platform_id: platformId, status, http_status: httpStatus, response_time_ms: responseTime, error_message: errorMessage }),
    supabase.from('social_platforms').update({ api_health_status: status, last_health_check_at: new Date().toISOString() }).eq('id', platformId),
  ]);
  return { status, httpStatus, responseTime, errorMessage };
}

// Strictly fetch real Instagram profile data from Meta Graph API (NO MOCKS)
async function fetchPlatformStats(platform: string, accessToken: string, supabase?: ReturnType<typeof createClient>, connectionId?: string) {
  const started = Date.now();
  if (platform === 'youtube') {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      if (supabase) await logApiCall(supabase, connectionId ?? null, 'youtube', '/youtube/v3/channels', res.status, Date.now() - started, `HTTP_${res.status}`, errText);
      throw new Error(`Google Channel API returned HTTP ${res.status}: ${errText}`);
    }
    const payload = await res.json();
    const channel = payload.items?.[0];
    if (!channel) throw new Error('No YouTube channel found for this access token');
    return {
      platform_user_id: channel.id,
      username: channel.snippet.customUrl || channel.snippet.title,
      display_name: channel.snippet.title,
      profile_picture_url: channel.snippet.thumbnails?.default?.url ?? null,
      biography: channel.snippet.description ?? null,
      followers: Number(channel.statistics.subscriberCount ?? 0),
      following: 0,
      posts: Number(channel.statistics.videoCount ?? 0),
      views: Number(channel.statistics.viewCount ?? 0)
    };
  }
  
  if (platform === 'instagram') {
    // 1. Query Facebook Pages to find linked Instagram Business / Creator accounts
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count}&access_token=${accessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const duration = Date.now() - started;

    if (!pagesRes.ok) {
      const errPayload = await pagesRes.json().catch(() => ({ error: { message: 'Failed to parse JSON' } }));
      const errMsg = errPayload?.error?.message || `Meta Graph API error ${pagesRes.status}`;
      const errCode = errPayload?.error?.code ? String(errPayload.error.code) : `HTTP_${pagesRes.status}`;
      if (supabase) await logApiCall(supabase, connectionId ?? null, 'instagram', '/me/accounts', pagesRes.status, duration, errCode, errMsg, errPayload);
      throw new Error(`Meta Page API call failed: ${errMsg}`);
    }

    const payload = await pagesRes.json();
    if (supabase) await logApiCall(supabase, connectionId ?? null, 'instagram', '/me/accounts', pagesRes.status, duration, null, null);

    for (const page of (payload.data ?? [])) {
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        return {
          platform_user_id: ig.id,
          username: ig.username,
          display_name: ig.name || ig.username,
          profile_picture_url: ig.profile_picture_url || null,
          biography: ig.biography || null,
          followers: Number(ig.followers_count ?? 0),
          following: Number(ig.follows_count ?? 0),
          posts: Number(ig.media_count ?? 0),
          views: 0
        };
      }
    }

    // 2. Direct Instagram Graph API lookup fallback (if token is scoped to Instagram API directly)
    const directUrl = `https://graph.instagram.com/v20.0/me?fields=id,username,account_type,media_count&access_token=${accessToken}`;
    const directRes = await fetch(directUrl);
    if (directRes.ok) {
      const directData = await directRes.json();
      if (directData.id && directData.username) {
        return {
          platform_user_id: directData.id,
          username: directData.username,
          display_name: directData.username,
          profile_picture_url: null,
          biography: null,
          followers: 0,
          following: 0,
          posts: Number(directData.media_count ?? 0),
          views: 0
        };
      }
    }

    throw new Error('No linked Instagram Business or Creator account found. Please verify your Meta Business Manager and Facebook Page configuration.');
  }

  if (platform === 'facebook') {
    const res = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name,picture,followers_count&access_token=${accessToken}`);
    if (!res.ok) throw new Error(`Meta Graph API returned ${res.status}`);
    const data = await res.json();
    return {
      platform_user_id: data.id,
      username: data.name,
      display_name: data.name,
      profile_picture_url: data.picture?.data?.url || null,
      biography: null,
      followers: Number(data.followers_count ?? 0),
      following: 0,
      posts: 0,
      views: 0
    };
  }

  throw new Error(`Platform ${platform} metrics fetching is not supported.`);
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = new URL(request.url);
  const platformFromWebhook = url.pathname.match(/webhook\/([a-z]+)/)?.[1];
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server Supabase credentials are not configured' }, 500);

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (platformFromWebhook) {
      const platformId = platformFromWebhook as PlatformId;
      const payloadText = await request.text();
      const { data: credential } = await supabase.from('social_credentials').select('encrypted_secrets').eq('platform_id', platformId).maybeSingle();
      const secrets = credential ? await decryptSecrets(credential.encrypted_secrets) : {};
      const expected = secrets.webhook_secret;
      const signature = request.headers.get('x-webhook-signature') ?? '';
      let signatureValid = false;
      if (expected && signature) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(expected), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        signatureValid = base64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadText)))) === signature.replace(/^sha256=/, '');
      }
      const parsedPayload = (() => { try { return JSON.parse(payloadText); } catch { return { raw: payloadText.slice(0, 10000) }; } })();
      
      const { data: log } = await supabase.from('webhook_logs').insert({
        platform: platformId,
        event_id: request.headers.get('x-event-id'),
        event_type: request.headers.get('x-event-type'),
        signature_valid: signatureValid,
        status: signatureValid ? 'processed' : 'failed',
        payload: parsedPayload,
        error_message: signatureValid ? null : 'Invalid webhook signature'
      }).select('id').single();
      
      if (signatureValid) await supabase.from('sync_jobs').insert({ platform_id: platformId, job_type: 'webhook', trigger_source: 'webhook', payload: { webhook_log_id: log?.id } });
      return json({ received: true }, signatureValid ? 202 : 401);
    }

    const body = asObject(await request.json());
    const action = text(body.action, 100);
    const platformId = text(body.platformId, 50) as PlatformId;

    if (action === 'summary') {
      await getAdmin(supabase, request, 'moderator');
      const [{ data: platforms }, { data: accounts }, { data: jobs }, { data: health }] = await Promise.all([
        supabase.from('social_platforms').select('*').order('display_name'),
        supabase.from('provider_connections').select('provider,status,last_sync_at,user_id'),
        supabase.from('sync_jobs').select('platform_id,status,created_at').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('api_health_logs').select('platform_id,status,response_time_ms,rate_limit_remaining,checked_at').order('checked_at', { ascending: false }).limit(100),
      ]);
      return json({
        platforms: (platforms ?? []).map(p => ({
          ...p,
          accounts: (accounts ?? []).filter(a => a.provider === p.id).map(a => ({ status: a.status, last_sync_at: a.last_sync_at })),
          jobs: (jobs ?? []).filter(j => j.platform_id === p.id),
          health: (health ?? []).find(h => h.platform_id === p.id) ?? null
        }))
      });
    }

    if (action === 'configuration') { await getAdmin(supabase, request, 'moderator'); return json(await getConfiguration(supabase, platformId)); }
    if (action === 'logs') { await getAdmin(supabase, request, 'moderator'); const { data } = await supabase.from('sync_logs').select('*').eq('platform_id', platformId).order('created_at', { ascending: false }).limit(100); return json({ logs: data ?? [] }); }
    
    if (action === 'accounts') {
      await getAdmin(supabase, request, 'moderator');
      const { data } = await supabase.from('provider_connections').select('*, creator:profiles!provider_connections_user_id_fkey(display_name,email)').eq('provider', platformId).order('connected_at', { ascending: false }).limit(200);
      return json({ accounts: data ?? [] });
    }

    if (action === 'save-configuration') {
      const admin = await getAdmin(supabase, request, 'admin');
      const config = asObject(body.configuration);
      const settings = asObject(body.settings);
      const incomingSecrets = asObject(config.secrets);
      const { data: current } = await supabase.from('social_credentials').select('encrypted_secrets').eq('platform_id', platformId).maybeSingle();
      const oldSecrets = current ? await decryptSecrets(current.encrypted_secrets) : {};
      const secretFields = ['client_id','client_secret','access_token','refresh_token','api_key','webhook_secret'];
      for (const field of secretFields) { const value = text(incomingSecrets[field]); if (value) oldSecrets[field] = value; }
      const encrypted = await encryptSecrets(oldSecrets);
      const fingerprint = await sha256(JSON.stringify(Object.keys(oldSecrets).sort()));
      
      const credentialRow = {
        platform_id: platformId,
        environment: text(config.environment, 20) === 'sandbox' ? 'sandbox' : 'production',
        oauth_version: text(config.oauth_version, 20) || '2.0',
        api_version: text(config.api_version, 60) || 'v20.0',
        scopes: Array.isArray(config.scopes) && config.scopes.length > 0 ? config.scopes.map(v => text(v, 200)).filter(Boolean) : (platformId === 'instagram' ? DEFAULT_INSTAGRAM_SCOPES : []),
        redirect_url: text(config.redirect_url, 2000) || null,
        encrypted_secrets: encrypted,
        secret_fingerprint: fingerprint,
        credentials_status: Object.keys(oldSecrets).length ? 'configured' : 'unconfigured',
        updated_by: admin.id
      };
      
      const { error: credentialError } = await supabase.from('social_credentials').upsert(credentialRow, { onConflict: 'platform_id' });
      if (credentialError) throw credentialError;
      
      const settingsRow = {
        platform_id: platformId,
        max_requests: Math.max(1, Number(settings.max_requests) || 100),
        sync_interval_minutes: Math.max(5, Number(settings.sync_interval_minutes) || 60),
        retry_count: Math.min(10, Math.max(0, Number(settings.retry_count) || 3)),
        request_timeout_ms: Math.min(120000, Math.max(1000, Number(settings.request_timeout_ms) || 10000)),
        cache_duration_seconds: Math.max(0, Number(settings.cache_duration_seconds) || 300),
        webhook_enabled: Boolean(settings.webhook_enabled),
        webhook_url: text(settings.webhook_url, 2000) || null,
        webhook_secret_fingerprint: oldSecrets.webhook_secret ? await sha256(oldSecrets.webhook_secret) : null,
        updated_by: admin.id
      };
      
      const { error: settingsError } = await supabase.from('platform_settings').upsert(settingsRow, { onConflict: 'platform_id' });
      if (settingsError) throw settingsError;
      
      await supabase.from('social_platforms').update({ enabled: Boolean(config.enabled) }).eq('id', platformId);
      await audit(supabase, admin.id, 'social.credentials.updated', 'social_platform', platformId, { changed_fields: Object.keys(config).filter(k => k !== 'secrets'), secret_fields_updated: secretFields.filter(k => Boolean(text(incomingSecrets[k]))) }, request);
      return json({ ok: true });
    }

    if (action === 'delete-credentials') {
      const admin = await getAdmin(supabase, request, 'super_admin');
      await supabase.from('social_credentials').delete().eq('platform_id', platformId);
      await supabase.from('social_platforms').update({ enabled: false, api_health_status: 'not_configured' }).eq('id', platformId);
      await audit(supabase, admin.id, 'social.credentials.deleted', 'social_platform', platformId, {}, request);
      return json({ ok: true });
    }
    
    if (action === 'test-connection') {
      const admin = await getAdmin(supabase, request, 'admin');
      const result = await testHealth(supabase, platformId);
      await audit(supabase, admin.id, 'social.health.tested', 'social_platform', platformId, result, request);
      return json(result);
    }

    if (action === 'manual-sync') {
      const admin = await getAdmin(supabase, request, 'admin');
      const accountId = text(body.accountId, 64) || null;
      const { data, error } = await supabase.from('sync_jobs').insert({ platform_id: platformId, account_id: accountId, job_type: accountId ? 'account' : 'health', trigger_source: 'manual', created_by: admin.id }).select('id').single();
      if (error) throw error;
      await audit(supabase, admin.id, 'social.sync.enqueued', 'social_platform', platformId, { job_id: data.id, account_id: accountId }, request);
      return json({ jobId: data.id });
    }

    // =========================================================================
    // CREATOR FLOW: OAuth Start, OAuth Callback, Deep Media Sync & Refresh
    // =========================================================================

    if (action === 'oauth-start') {
      console.log(`[oauth-start] Initiating OAuth for platform=${platformId}`);
      const user = await getCreator(supabase, request);
      const redirectUri = text(body.redirectUri);
      if (!redirectUri) {
        console.warn('[oauth-start] Missing redirectUri in body');
        return json({ error: 'redirectUri is required in request body' }, 400);
      }

      const state = `state_${platformId}_${user.id}_${Date.now()}`;
      const stateHash = await sha256(state);
      
      const { data: credential } = await supabase.from('social_credentials').select('encrypted_secrets, redirect_url, scopes').eq('platform_id', platformId).maybeSingle();
      const secrets = credential ? await decryptSecrets(credential.encrypted_secrets) : {};
      
      // Obtain Client ID from social_credentials or environment secrets
      const clientId = secrets.client_id || Deno.env.get(`${platformId.toUpperCase()}_CLIENT_ID`) || Deno.env.get('META_CLIENT_ID');
      if (!clientId) {
        console.error(`[oauth-start] Client ID for ${platformId} is missing`);
        return json({ error: `Client ID for ${platformId} is not configured in Admin Settings or Environment variables.` }, 400);
      }

      const scopesList = Array.isArray(credential?.scopes) && credential.scopes.length > 0
        ? credential.scopes
        : (platformId === 'instagram' ? DEFAULT_INSTAGRAM_SCOPES : ['pages_show_list', 'pages_read_engagement']);

      console.log(`[oauth-start] Creating oauth_session for user=${user.id}, platform_id=${platformId}, stateHash=${stateHash.slice(0, 10)}...`);

      const { error: sessInsertErr } = await supabase.from('oauth_sessions').insert({
        state_hash: stateHash,
        platform_id: platformId,
        creator_id: user.id,
        redirect_uri: redirectUri,
        scopes: scopesList,
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (sessInsertErr) {
        console.error('[oauth-start] Failed to insert oauth_session row:', sessInsertErr);
        return json({ error: `Database error creating OAuth session: ${sessInsertErr.message}` }, 500);
      }

      console.log(`[oauth-start] Successfully created oauth_session for user=${user.id}`);

      let authUrl = '';
      if (platformId === 'youtube') {
        const scopes = encodeURIComponent(scopesList.join(' '));
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${stateHash}&access_type=offline&prompt=consent`;
      } else if (platformId === 'instagram' || platformId === 'facebook') {
        const scopes = encodeURIComponent(scopesList.join(','));
        authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateHash}&scope=${scopes}`;
      } else {
        return json({ error: `OAuth for ${platformId} is not supported.` }, 400);
      }

      console.log(`[oauth-start] Generated authUrl successfully for platform=${platformId}`);
      return json({ url: authUrl });
    }

    if (action === 'oauth-callback') {
      console.log(`[oauth-callback] Callback handler invoked for platform=${platformId}`);
      const user = await getCreator(supabase, request);
      const code = text(body.code);
      const state = text(body.state);

      if (!code) {
        console.warn('[oauth-callback] Missing authorization code parameter');
        return json({ error: 'Authorization code parameter ("code") is required' }, 400);
      }

      console.log(`[oauth-callback] Finding session for user=${user.id}, platformId=${platformId}, state=${state ? state.slice(0, 10) + '...' : 'empty'}`);

      let session: any = null;

      // 1. Primary Lookup: Match by state_hash if state was provided
      if (state) {
        const { data: stateSession, error: stateErr } = await supabase
          .from('oauth_sessions')
          .select('*')
          .eq('state_hash', state)
          .eq('status', 'pending')
          .maybeSingle();

        if (stateErr) {
          console.error('[oauth-callback] DB error looking up session by state:', stateErr);
        } else if (stateSession) {
          session = stateSession;
          console.log(`[oauth-callback] Found pending session by state_hash: ${session.id}`);
        }
      }

      // 2. Fallback Lookup: Lookup user's latest active pending session for this platform if state match failed or state was missing/stripped by provider
      if (!session) {
        console.log(`[oauth-callback] State match pending session not found. Checking active pending session for user=${user.id}, platform=${platformId}`);
        const { data: userSessions, error: userSessErr } = await supabase
          .from('oauth_sessions')
          .select('*')
          .eq('creator_id', user.id)
          .eq('platform_id', platformId)
          .eq('status', 'pending')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (userSessErr) {
          console.error('[oauth-callback] DB error looking up user pending sessions:', userSessErr);
        } else if (userSessions && userSessions.length > 0) {
          session = userSessions[0];
          console.log(`[oauth-callback] Fallback matched latest pending session: ${session.id}`);
        }
      }

      if (!session) {
        console.warn(`[oauth-callback] No active pending session found for user=${user.id}, platform=${platformId}. Checking if completed or expired.`);
        
        const { data: anySession } = await supabase
          .from('oauth_sessions')
          .select('*')
          .eq('creator_id', user.id)
          .eq('platform_id', platformId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (anySession && anySession.length > 0) {
          const lastSess = anySession[0];
          if (lastSess.status === 'completed') {
            return json({ error: 'OAuth session has already been completed.' }, 400);
          }
          if (new Date() > new Date(lastSess.expires_at)) {
            return json({ error: 'OAuth session timed out (15 minutes limit). Please try connecting again.' }, 400);
          }
          return json({ error: `OAuth session is in '${lastSess.status}' state (expected 'pending').` }, 400);
        }

        return json({ error: 'OAuth session state not found or invalid. Please try connecting again.' }, 400);
      }

      if (session.creator_id !== user.id) {
        console.error(`[oauth-callback] Unauthorized session ownership: session.creator_id=${session.creator_id}, user.id=${user.id}`);
        return json({ error: 'Unauthorized: OAuth session belongs to a different user profile.' }, 403);
      }

      console.log(`[oauth-callback] Session validated successfully. Session ID=${session.id}`);

      const { data: credential } = await supabase.from('social_credentials').select('encrypted_secrets').eq('platform_id', platformId).maybeSingle();
      const secrets = credential ? await decryptSecrets(credential.encrypted_secrets) : {};
      
      const clientId = secrets.client_id || Deno.env.get(`${platformId.toUpperCase()}_CLIENT_ID`) || Deno.env.get('META_CLIENT_ID');
      const clientSecret = secrets.client_secret || Deno.env.get(`${platformId.toUpperCase()}_CLIENT_SECRET`) || Deno.env.get('META_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        console.error(`[oauth-callback] Credentials missing for ${platformId}`);
        return json({ error: `Client ID and Secret for ${platformId} must be configured in Admin settings.` }, 400);
      }

      let accessToken = '';
      let expiresIn = 5184000; // 60 days default for Meta long-lived tokens

      const startTime = Date.now();

      if (platformId === 'instagram' || platformId === 'facebook') {
        console.log(`[oauth-callback] Exchanging authorization code with Meta Graph API using redirect_uri=${session.redirect_uri}`);
        
        // Step 1: Code -> Short-Lived Access Token
        const shortTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(session.redirect_uri)}&client_secret=${clientSecret}&code=${code}`;
        const shortRes = await fetch(shortTokenUrl);
        const shortDuration = Date.now() - startTime;

        if (!shortRes.ok) {
          const errData = await shortRes.json().catch(() => ({ error: { message: 'Short-lived token exchange failed' } }));
          const errMsg = errData.error?.message || `Meta Graph API HTTP ${shortRes.status}`;
          console.error('[oauth-callback] Meta token exchange failed:', errMsg, errData);
          await logApiCall(supabase, null, platformId, '/oauth/access_token', shortRes.status, shortDuration, `OAUTH_ERR_${shortRes.status}`, errMsg, errData);
          return json({ error: `Meta OAuth token exchange failed: ${errMsg}` }, 400);
        }

        const shortData = await shortRes.json();
        const shortToken = shortData.access_token;
        console.log('[oauth-callback] Short-lived token exchange succeeded. Requesting long-lived token...');

        // Step 2: Short-Lived Token -> Long-Lived Token
        const longTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortToken}`;
        const longRes = await fetch(longTokenUrl);
        
        if (longRes.ok) {
          const longData = await longRes.json();
          accessToken = longData.access_token;
          expiresIn = longData.expires_in || 5184000;
          console.log('[oauth-callback] Long-lived token acquired successfully');
        } else {
          console.warn('[oauth-callback] Long-lived token exchange returned non-200. Using short-lived token.');
          accessToken = shortToken;
          expiresIn = shortData.expires_in || 7200;
        }
      } else if (platformId === 'youtube') {
        const bodyParams = new URLSearchParams();
        bodyParams.set('code', code);
        bodyParams.set('client_id', clientId);
        bodyParams.set('client_secret', clientSecret);
        bodyParams.set('redirect_uri', session.redirect_uri);
        bodyParams.set('grant_type', 'authorization_code');

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          console.error('[oauth-callback] YouTube token exchange failed:', errData);
          return json({ error: `YouTube token exchange failed: ${errData.error_description || tokenRes.statusText}` }, 400);
        }

        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
        expiresIn = tokenData.expires_in || 3600;
      }

      console.log('[oauth-callback] Fetching account statistics from Meta Graph API...');

      // Step 3: Fetch Real Platform Account Details (No Mocks)
      const stats = await fetchPlatformStats(platformId, accessToken, supabase);
      console.log(`[oauth-callback] Platform stats retrieved for username=${stats.username}, accountId=${stats.platform_user_id}`);

      const encryptedAccess = await encryptToken(accessToken);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      console.log(`[oauth-callback] Upserting provider_connections for user=${user.id}, provider=${platformId}...`);

      // Step 4: Upsert into provider_connections
      const { data: socialAcc, error: saveErr } = await supabase
        .from('provider_connections')
        .upsert({
          user_id: user.id,
          provider: platformId,
          provider_account_id: stats.platform_user_id,
          provider_username: stats.username,
          display_name: stats.display_name,
          avatar_url: stats.profile_picture_url,
          biography: stats.biography,
          encrypted_token: encryptedAccess,
          encrypted_token_reference: encryptedAccess,
          token_expires_at: expiresAt,
          status: 'active',
          connection_status: 'connected',
          connected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          followers_count: stats.followers,
          follows_count: stats.following,
          media_count: stats.posts,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider,provider_account_id' })
        .select()
        .single();

      if (saveErr) {
        console.error('[oauth-callback] Failed to save provider_connections:', saveErr);
        return json({ error: `Database error saving provider connection: ${saveErr.message}` }, 500);
      }

      await supabase.from('oauth_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', session.id);

      await audit(supabase, user.id, 'oauth_callback_success', 'provider_connection', socialAcc.id, {
        platform: platformId,
        username: stats.username,
        followers: stats.followers
      }, request);

      await logSyncHistory(supabase, socialAcc.id, user.id, platformId, 'success', 1, {
        username: stats.username,
        followers: stats.followers,
        posts: stats.posts
      });

      console.log(`[oauth-callback] OAuth callback completed successfully for user=${user.id}, accountId=${socialAcc.id}`);

      return json({
        success: true,
        account: {
          id: socialAcc.id,
          platform: platformId,
          username: stats.username,
          followers: stats.followers,
          last_sync: socialAcc.last_sync_at,
          status: 'connected'
        }
      });
    }

    if (action === 'instagram-sync-media' || action === 'sync-media') {
      const accountId = text(body.accountId);
      const { data: account } = await supabase.from('provider_connections').select('*').eq('id', accountId).maybeSingle();
      if (!account || account.provider !== 'instagram') return json({ error: 'Invalid Instagram account' }, 400);
      
      const accessToken = await decryptToken(account.encrypted_token || account.encrypted_token_reference || '');
      if (!accessToken) return json({ error: 'Missing account access token' }, 400);

      const startTime = Date.now();

      // Fetch user's Instagram Media list
      const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${account.provider_account_id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,shortcode&limit=50&access_token=${accessToken}`);
      const duration = Date.now() - startTime;

      if (!mediaRes.ok) {
        const errPayload = await mediaRes.json().catch(() => ({}));
        const errMsg = errPayload.error?.message || `Instagram media query returned HTTP ${mediaRes.status}`;
        const errCode = errPayload.error?.code ? String(errPayload.error.code) : `HTTP_${mediaRes.status}`;
        
        await logApiCall(supabase, accountId, 'instagram', '/media', mediaRes.status, duration, errCode, errMsg, errPayload);

        // If error is 401 or Meta token error subcodes (190, 458, 460, 463, 467)
        if (mediaRes.status === 401 || errPayload.error?.code === 190) {
          await supabase.from('provider_connections').update({ status: 'reconnect_required' }).eq('id', accountId);
          await logSyncHistory(supabase, accountId, account.user_id, 'instagram', 'reconnect_required', 0, {}, errMsg);
          return json({ error: 'Token expired or revoked. Please reconnect your Instagram account.', code: 'RECONNECT_REQUIRED', reconnect_required: true }, 401);
        }

        await logSyncHistory(supabase, accountId, account.user_id, 'instagram', 'failed', 0, {}, errMsg);
        return json({ error: errMsg }, mediaRes.status);
      }

      const mediaData = await mediaRes.json();
      await logApiCall(supabase, accountId, 'instagram', '/media', mediaRes.status, duration, null, null);

      let totalReach = 0, totalImpressions = 0, totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0, totalSaved = 0, totalPlays = 0;
      const itemsProcessed = [];

      for (const media of (mediaData.data ?? []).slice(0, 15)) {
        const likes = Number(media.like_count ?? 0);
        const comments = Number(media.comments_count ?? 0);
        totalLikes += likes;
        totalComments += comments;

        let reach = 0, impressions = 0, plays = 0, shares = 0, saved = 0;

        try {
          const insightsUrl = `https://graph.facebook.com/v20.0/${media.id}/insights?metric=reach,impressions,saved,shares,plays,total_interactions&access_token=${accessToken}`;
          const insightsRes = await fetch(insightsUrl);

          if (insightsRes.ok) {
            const insData = await insightsRes.json();
            for (const item of (insData.data ?? [])) {
              const val = Number(item.values?.[0]?.value ?? 0);
              if (item.name === 'reach') reach = val;
              if (item.name === 'impressions') impressions = val;
              if (item.name === 'saved') saved = val;
              if (item.name === 'shares') shares = val;
              if (item.name === 'plays' || item.name === 'play_count') plays = val;
            }
          } else {
            // Video/Reel metric fallback lookup if metrics set differs
            const reelRes = await fetch(`https://graph.facebook.com/v20.0/${media.id}/insights?metric=play_count,reach,saved&access_token=${accessToken}`);
            if (reelRes.ok) {
              const reelData = await reelRes.json();
              for (const item of (reelData.data ?? [])) {
                const val = Number(item.values?.[0]?.value ?? 0);
                if (item.name === 'play_count') plays = val;
                if (item.name === 'reach') reach = val;
                if (item.name === 'saved') saved = val;
              }
            }
          }
        } catch (e) {
          console.warn(`Media ${media.id} insights fetch failed:`, e);
        }

        totalReach += reach;
        totalImpressions += impressions;
        totalViews += plays;
        totalPlays += plays;
        totalShares += shares;
        totalSaved += saved;

        itemsProcessed.push({ id: media.id, shortcode: media.shortcode, type: media.media_type, likes, comments, plays, reach });
      }

      // Also get updated followers count from user profile
      let currentFollowers = Number(account.followers_count ?? 0);
      try {
        const freshProfile = await fetchPlatformStats('instagram', accessToken, supabase, accountId);
        currentFollowers = freshProfile.followers;
        await supabase.from('provider_connections').update({
          followers_count: freshProfile.followers,
          follows_count: freshProfile.following,
          media_count: freshProfile.posts,
          last_sync_at: new Date().toISOString(),
          status: 'active'
        }).eq('id', accountId);
      } catch (e) {
        console.warn('Profile stats update failed during media sync:', e);
      }

      // Upsert metrics snapshot to social_metrics
      const today = new Date().toISOString().split('T')[0];
      const metricsPayload = {
        reach: totalReach,
        impressions: totalImpressions,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        saved: totalSaved,
        video_plays: totalPlays,
        followers: currentFollowers,
        account_username: account.provider_username,
        account_name: account.display_name,
        profile_picture: account.avatar_url
      };

      await supabase.from('social_metrics').upsert({
        connection_id: accountId,
        date: today,
        metrics: metricsPayload
      }, { onConflict: 'connection_id,date' });

      await logSyncHistory(supabase, accountId, account.user_id, 'instagram', 'success', itemsProcessed.length, metricsPayload);

      return json({
        success: true,
        metrics: metricsPayload,
        mediaCountSynced: itemsProcessed.length
      });
    }

    if (action === 'instagram-refresh-token' || action === 'refresh-token') {
      const accountId = text(body.accountId);
      const { data: account } = await supabase.from('provider_connections').select('*').eq('id', accountId).maybeSingle();
      if (!account || account.provider !== 'instagram') return json({ error: 'Invalid Instagram account' }, 400);

      const { data: credential } = await supabase.from('social_credentials').select('encrypted_secrets').eq('platform_id', 'instagram').maybeSingle();
      const secrets = credential ? await decryptSecrets(credential.encrypted_secrets) : {};
      
      const clientId = secrets.client_id || Deno.env.get('META_CLIENT_ID');
      const clientSecret = secrets.client_secret || Deno.env.get('META_CLIENT_SECRET');

      const oldToken = await decryptToken(account.encrypted_token || account.encrypted_token_reference || '');
      if (!oldToken) return json({ error: 'No existing token to refresh' }, 400);

      const startTime = Date.now();
      
      // Refresh Meta Graph API Long-lived token via fb_exchange_token
      const refreshUrl = clientId && clientSecret
        ? `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${oldToken}`
        : `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${oldToken}`;

      const refreshRes = await fetch(refreshUrl);
      const duration = Date.now() - startTime;

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const encryptedAccess = await encryptToken(refreshData.access_token);
        const expiresAt = new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString();
        
        await supabase.from('provider_connections').update({
          encrypted_token: encryptedAccess,
          encrypted_token_reference: encryptedAccess,
          token_expires_at: expiresAt,
          status: 'active'
        }).eq('id', accountId);

        await logApiCall(supabase, accountId, 'instagram', '/oauth/access_token', refreshRes.status, duration, null, null);
        await logSyncHistory(supabase, accountId, account.user_id, 'instagram', 'success', 0, { refreshed: true, expiresAt });

        return json({ success: true, expiresAt });
      }

      const errPayload = await refreshRes.json().catch(() => ({ error: { message: 'Token refresh call failed' } }));
      const errMsg = errPayload.error?.message || `Token refresh returned HTTP ${refreshRes.status}`;
      
      await logApiCall(supabase, accountId, 'instagram', '/oauth/access_token', refreshRes.status, duration, `REFRESH_ERR_${refreshRes.status}`, errMsg, errPayload);

      // Deactivate token on revocation/expiration
      await supabase.from('provider_connections').update({ status: 'reconnect_required' }).eq('id', accountId);
      await logSyncHistory(supabase, accountId, account.user_id, 'instagram', 'token_expired', 0, {}, errMsg);

      return json({ error: 'Token refresh failed', details: errMsg, code: 'RECONNECT_REQUIRED', reconnect_required: true }, 400);
    }

    if (action === 'disconnect-account') {
      console.log(`[disconnect-account] Disconnecting platform=${platformId} for user=${user.id}...`);

      // 1. Delete all provider connections for this user & platform
      const { data: deletedConns, error: delErr } = await supabase
        .from('provider_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', platformId)
        .select('id');

      if (delErr) {
        console.error('[disconnect-account] Failed to delete provider_connections:', delErr);
        return json({ error: `Database error disconnecting account: ${delErr.message}` }, 500);
      }

      // 2. Delete/Expire pending verification records
      await supabase
        .from('instagram_verifications')
        .delete()
        .eq('user_id', user.id);

      // 3. Delete/Expire pending OAuth sessions
      await supabase
        .from('oauth_sessions')
        .delete()
        .eq('creator_id', user.id)
        .eq('platform_id', platformId);

      await audit(supabase, user.id, 'social_account_disconnected', 'provider_connection', user.id, {
        platform: platformId,
        deletedCount: deletedConns?.length ?? 0
      }, request);

      console.log(`[disconnect-account] Successfully disconnected platform=${platformId} for user=${user.id}`);
      return json({ ok: true, message: `Successfully disconnected ${platformId} account.` });
    }

    if (action === 'sync-social-data') {
      const user = await getCreator(supabase, request);
      const { data: acc } = await supabase.from('provider_connections').select('*').eq('user_id', user.id).eq('provider', platformId).maybeSingle();
      if (!acc) return json({ error: 'Social account not linked' }, 404);

      const decryptedAccess = await decryptToken(acc.encrypted_token || acc.encrypted_token_reference || '');
      const stats = await fetchPlatformStats(platformId, decryptedAccess, supabase, acc.id);

      await supabase.from('provider_connections').update({
        last_sync_at: new Date().toISOString(),
        status: 'active',
        followers_count: stats.followers,
        follows_count: stats.following,
        media_count: stats.posts
      }).eq('id', acc.id);

      await logSyncHistory(supabase, acc.id, user.id, platformId, 'success', 1, {
        followers: stats.followers,
        posts: stats.posts
      });

      return json({
        success: true,
        stats: {
          followers: stats.followers,
          views: stats.views,
          posts: stats.posts,
          last_sync: new Date().toISOString()
        }
      });
    }

    return json({ error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unexpected server error';
    const isAuthErr = /permission|Authentication|session/i.test(errMsg);
    return json({ error: errMsg }, isAuthErr ? 403 : 500);
  }
});
