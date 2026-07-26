import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function unbase64(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[\s\r\n\t]+/g, '');
}

function generateVerificationCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `CX-${hex}`;
}

async function keyFromEnvironment() {
  let raw = Deno.env.get('SOCIAL_CREDENTIALS_ENCRYPTION_KEY');
  if (!raw) {
    raw = 'c3VwZXItc2VjcmV0LWtleS0zMi1ieXRlcy1mb3ItZGV2ZWxvcG1lbnQ=';
  }
  const bytes = unbase64(raw);
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function decryptToken(encryptedString: string): Promise<string> {
  if (!encryptedString) return '';
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

async function getUser(supabase: ReturnType<typeof createClient>, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Authentication required');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid session');
  return user;
}

async function audit(supabase: ReturnType<typeof createClient>, actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>, request: Request) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: {
        ...metadata,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
        user_agent: request.headers.get('user-agent') ?? null
      }
    });
  } catch (e) {
    console.error('Audit log insertion failed:', e);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server Supabase credentials are not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const user = await getUser(supabase, request);
    const body = asObject(await request.json().catch(() => ({})));
    const action = text(body.action, 100) || 'verify-bio';
    const connectionId = text(body.connectionId, 100);

    if (!connectionId) {
      return json({ error: 'connectionId is required' }, 400);
    }

    // Load provider connection & verify ownership
    const { data: connection, error: connErr } = await supabase
      .from('provider_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();

    if (connErr || !connection) {
      return json({ error: 'Provider connection not found' }, 404);
    }

    // Admins can manage, creators can only verify their own accounts
    const { data: admin } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = Boolean(admin);

    if (connection.user_id !== user.id && !isAdmin) {
      return json({ error: 'Unauthorized: You can only verify your own Instagram connection' }, 403);
    }

    if (connection.provider !== 'instagram') {
      return json({ error: 'Bio verification is only applicable to Instagram connections' }, 400);
    }

    // =========================================================================
    // ACTION: generate-code
    // =========================================================================
    if (action === 'generate-code') {
      // Expire any existing pending codes for this connection
      await supabase
        .from('instagram_verifications')
        .update({ status: 'expired', failure_reason: 'Superceded by new verification code request' })
        .eq('provider_connection_id', connectionId)
        .eq('status', 'pending');

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: verification, error: insertErr } = await supabase
        .from('instagram_verifications')
        .insert({
          user_id: connection.user_id,
          provider_connection_id: connectionId,
          verification_code: code,
          status: 'pending',
          verification_method: 'bio',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (insertErr || !verification) {
        throw new Error(`Failed to generate verification code: ${insertErr?.message}`);
      }

      await audit(supabase, user.id, 'verification_started', 'instagram_verification', verification.id, {
        connection_id: connectionId,
        code,
        expires_at: expiresAt
      }, request);

      return json({
        ok: true,
        code,
        expiresAt,
        verificationId: verification.id
      });
    }

    // =========================================================================
    // ACTION: verify-bio
    // =========================================================================
    if (action === 'verify-bio' || action === 'verify') {
      const verificationId = text(body.verificationId);
      const inputCode = text(body.code);
      const inputUsername = text(body.username);

      if (inputUsername && inputUsername !== connection.provider_username) {
        console.log(`[verify-bio] Updating provider_username to @${inputUsername} for connection ${connectionId}`);
        await supabase
          .from('provider_connections')
          .update({ provider_username: inputUsername, display_name: inputUsername })
          .eq('id', connectionId);
        connection.provider_username = inputUsername;
      }

      let query = supabase
        .from('instagram_verifications')
        .select('*')
        .eq('provider_connection_id', connectionId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (verificationId) {
        query = query.eq('id', verificationId);
      }

      const { data: verifications } = await query;
      let verif = verifications?.[0];

      // Fallback: If verification record was not found or code was generated client-side, look up by verification_code or insert on the fly
      if (!verif && inputCode) {
        console.log(`[verify-bio] Verification record not found by ID. Searching by code=${inputCode}...`);
        const { data: matchedByCode } = await supabase
          .from('instagram_verifications')
          .select('*')
          .eq('verification_code', inputCode)
          .maybeSingle();

        if (matchedByCode) {
          verif = matchedByCode;
        } else {
          console.log(`[verify-bio] Creating verification record on the fly for code=${inputCode}`);
          const { data: newVerif } = await supabase
            .from('instagram_verifications')
            .insert({
              user_id: user.id,
              provider_connection_id: connectionId,
              verification_code: inputCode,
              status: 'pending',
              verification_method: 'bio',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          verif = newVerif;
        }
      }

      if (!verif) {
        return json({ error: 'No active pending verification code found. Please generate a new code.' }, 400);
      }

      // Check 24-hour expiration
      if (new Date() > new Date(verif.expires_at)) {
        await supabase
          .from('instagram_verifications')
          .update({ status: 'expired', failure_reason: 'Code expired after 24 hours' })
          .eq('id', verif.id);

        await audit(supabase, user.id, 'verification_expired', 'instagram_verification', verif.id, {
          connection_id: connectionId,
          code: verif.verification_code
        }, request);

        return json({
          verified: false,
          error: 'Verification expired. Please generate a new code.',
          status: 'expired'
        }, 400);
      }

      // Decrypt Instagram access token if available
      const rawToken = connection.encrypted_token || connection.encrypted_token_reference || '';
      const accessToken = rawToken ? await decryptToken(rawToken) : '';

      // Query Meta Graph API or Public Web Profile for current Instagram biography
      let userBio = '';
      let apiSuccess = false;

      // 1. Primary: Facebook Pages -> Instagram Business/Creator Account (Graph API)
      if (accessToken) {
        try {
          const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,biography}&access_token=${accessToken}`;
          const pagesRes = await fetch(pagesUrl);

          if (pagesRes.ok) {
            const pagesData = await pagesRes.json();
            for (const page of (pagesData.data ?? [])) {
              if (page.instagram_business_account?.biography) {
                userBio = page.instagram_business_account.biography;
                apiSuccess = true;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Facebook Pages graph lookup failed:', e);
        }

        // 2. Direct Instagram Graph API fallback
        if (!apiSuccess && connection.provider_account_id) {
          try {
            const directUrl = `https://graph.facebook.com/v20.0/${connection.provider_account_id}?fields=id,username,biography&access_token=${accessToken}`;
            const directRes = await fetch(directUrl);
            if (directRes.ok) {
              const directData = await directRes.json();
              if (typeof directData.biography === 'string') {
                userBio = directData.biography;
                apiSuccess = true;
              }
            }
          } catch (e) {
            console.warn('Direct Instagram graph lookup failed:', e);
          }
        }
      }

      // 3. Independent Public Web Bio Scraper (For pure Bio Verification without OAuth)
      if (!apiSuccess && connection.provider_username) {
        console.log(`[verify-bio] Fetching public web profile for @${connection.provider_username}...`);
        try {
          const pubRes = await fetch(`https://www.instagram.com/${connection.provider_username}/`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });

          if (pubRes.ok) {
            const html = await pubRes.text();
            // Match meta description or biography JSON tag
            const ogMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) ||
                            html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
            const bioMatch = html.match(/"biography":"([^"]*)"/);

            if (bioMatch && bioMatch[1]) {
              try { userBio = JSON.parse(`"${bioMatch[1]}"`); } catch { userBio = bioMatch[1]; }
              apiSuccess = true;
            } else if (ogMatch && ogMatch[1]) {
              userBio = ogMatch[1];
              apiSuccess = true;
            } else if (html.toLowerCase().includes(verif.verification_code.toLowerCase())) {
              userBio = verif.verification_code;
              apiSuccess = true;
            }
          }
        } catch (pubErr) {
          console.warn('[verify-bio] Public web profile fetch failed:', pubErr);
        }
      }

      // Perform strict case-insensitive, space & newline-ignored comparison
      const cleanBio = normalizeText(userBio);
      const cleanCode = normalizeText(verif.verification_code);
      const isMatched = cleanBio.includes(cleanCode);

      if (isMatched) {
        const nowStr = new Date().toISOString();

        // Update verification record
        await supabase
          .from('instagram_verifications')
          .update({
            status: 'verified',
            verified_at: nowStr,
            failure_reason: null
          })
          .eq('id', verif.id);

        // Update provider_connections table
        await supabase
          .from('provider_connections')
          .update({
            ownership_verified: true,
            verification_method: 'bio',
            verified_at: nowStr,
            connection_status: 'connected',
            biography: userBio,
            status: 'active'
          })
          .eq('id', connectionId);

        await audit(supabase, user.id, 'verification_success', 'instagram_verification', verif.id, {
          connection_id: connectionId,
          code: verif.verification_code,
          verification_method: 'bio'
        }, request);

        return json({
          verified: true,
          message: 'Instagram ownership verified successfully using bio code!'
        });
      } else {
        const newAttempts = (verif.attempts || 0) + 1;
        const isMaxAttempts = newAttempts >= 10;
        const newStatus = isMaxAttempts ? 'failed' : 'pending';
        const failureReason = isMaxAttempts
          ? 'Maximum verification attempts exceeded (10)'
          : 'Verification code not found in Instagram bio';

        await supabase
          .from('instagram_verifications')
          .update({
            attempts: newAttempts,
            status: newStatus,
            failure_reason: failureReason
          })
          .eq('id', verif.id);

        await audit(supabase, user.id, 'verification_failed', 'instagram_verification', verif.id, {
          connection_id: connectionId,
          code: verif.verification_code,
          attempts: newAttempts,
          user_bio_length: userBio.length
        }, request);

        return json({
          verified: false,
          error: 'Code not found in Instagram bio. Please update your bio and try again.',
          attempts: newAttempts,
          maxAttemptsExceeded: isMaxAttempts
        }, 400);
      }
    }

    // =========================================================================
    // ACTION: get-verifications
    // =========================================================================
    if (action === 'get-verifications') {
      let query = supabase
        .from('instagram_verifications')
        .select('*, profile:profiles!user_id(display_name, email), connection:provider_connections!provider_connection_id(provider_username, display_name)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      if (connectionId) {
        query = query.eq('provider_connection_id', connectionId);
      }

      const { data: list, error: listErr } = await query.limit(100);

      if (listErr) throw listErr;
      return json({ verifications: list ?? [] });
    }

    return json({ error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return json({ error: errMsg }, 500);
  }
});
