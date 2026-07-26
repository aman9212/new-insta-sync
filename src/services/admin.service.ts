import { supabase } from '../lib/supabase';

export async function listAdminTable(table: string) {
  if (!supabase) return [];
  const allowed = ['profiles', 'brands', 'campaigns', 'submissions', 'withdrawals', 'audit_logs', 'system_settings'];
  if (!allowed.includes(table)) throw new Error('Unsupported admin table');
  const { data, error } = await supabase.from(table).select('*').limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function adminModerateCampaign(campaignId: string, status: 'active' | 'rejected' | 'paused', reason?: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('admin_moderate_campaign', {
    target_campaign_id: campaignId,
    next_status: status,
    moderation_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function adminModerateSubmission(submissionId: string, status: 'eligible' | 'ineligible' | 'rejected', reason?: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('admin_moderate_submission', {
    target_submission_id: submissionId,
    next_status: status,
    moderation_reason: reason ?? null,
  });
  if (error) throw error;
}

export interface SystemHealthData {
  database_size_bytes: number;
  sync_queue_size: number;
  active_cron_jobs: number;
  youtube_api_status: string;
}

export async function getSystemHealth(): Promise<SystemHealthData[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_system_health');
  if (error) throw error;
  return (data ?? []) as SystemHealthData[];
}
