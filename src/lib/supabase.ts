import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readSupabaseUrl(): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_URL) return import.meta.env.VITE_SUPABASE_URL;
      if ((import.meta.env as any).SUPABASE_URL) return (import.meta.env as any).SUPABASE_URL;
    }
  } catch {
    // Ignore browser import.meta issues
  }

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
    if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  }
  return undefined;
}

function readSupabaseAnonKey(): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) return import.meta.env.VITE_SUPABASE_ANON_KEY;
      if ((import.meta.env as any).SUPABASE_ANON_KEY) return (import.meta.env as any).SUPABASE_ANON_KEY;
    }
  } catch {
    // Ignore browser import.meta issues
  }

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
    if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  }
  return undefined;
}

const supabaseUrl = readSupabaseUrl();
const supabaseAnonKey = readSupabaseAnonKey();

function initSupabase(): SupabaseClient | null {
  const url = supabaseUrl?.trim();
  const key = supabaseAnonKey?.trim();

  if (!url || !key) {
    return null;
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.error('Invalid VITE_SUPABASE_URL format. Expected: https://<project-id>.supabase.co');
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    },
  });
}

export const supabase = initSupabase();

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function getSupabaseUrl(): string {
  return supabaseUrl?.trim() || '';
}