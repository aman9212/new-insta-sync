import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    const stripped = key.replace(/^VITE_/, '');
    if (process.env[stripped]) return process.env[stripped];
    const prefixed = `VITE_${key}`;
    if (process.env[prefixed]) return process.env[prefixed];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val) return val;
    const stripped = key.replace(/^VITE_/, '');
    if ((import.meta as any).env[stripped]) return (import.meta as any).env[stripped];
    const prefixed = `VITE_${key}`;
    if ((import.meta as any).env[prefixed]) return (import.meta as any).env[prefixed];
  }
  return undefined;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = getEnvVar('VITE_SUPABASE_URL')?.trim();
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY')?.trim();

  if (!url || !key) {
    return null;
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.error('Invalid VITE_SUPABASE_URL format. Expected: https://<project-id>.supabase.co');
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    },
  });

  return cachedClient;
}

/**
 * Proxy export for backward compatibility.
 * Dynamically resolves to initialized SupabaseClient on demand.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

export function getSupabaseUrl(): string {
  return getEnvVar('VITE_SUPABASE_URL')?.trim() || '';
}