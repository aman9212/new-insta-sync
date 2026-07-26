import { supabase } from '../lib/supabase';
import type {
  AdminCreatorDashboardStats, CreatorBadgeItem, CreatorFlagItem, CreatorFullDetail,
  CreatorKYCDocument, CreatorLevelXP, CreatorNoteItem, CreatorSocialAccountItem,
  CreatorWalletDetail, ExtendedCreatorStatus, KYCStatus,
} from '../types/creator-management';

export interface CreatorListResult { creators: CreatorFullDetail[]; total: number; }
export interface CreatorListFilters { status?: ExtendedCreatorStatus | 'all'; query?: string; page?: number; pageSize?: number; }
export interface CreatorActionPayload { [key: string]: unknown; }

function configured() {
  if (!supabase) throw new Error('Supabase is not configured. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

function normalizeProfile(row: Record<string, unknown>): CreatorFullDetail {
  return {
    id: String(row.id), display_name: String(row.display_name ?? ''), username: String(row.username ?? ''),
    email: String(row.email ?? ''), phone: row.phone as string | null, avatar_url: row.avatar_url as string | null,
    banner_url: row.banner_url as string | null, country: String(row.country ?? ''), state: row.state as string | null,
    city: row.city as string | null, timezone: String(row.timezone ?? 'UTC'), language: String(row.language ?? 'en'),
    bio: row.bio as string | null, portfolio_url: row.portfolio_url as string | null, website_url: row.website_url as string | null,
    skills: Array.isArray(row.skills) ? row.skills as string[] : [], experience_level: String(row.experience_level ?? ''),
    status: row.status as ExtendedCreatorStatus, kyc_status: row.kyc_status as KYCStatus,
    is_online: Boolean(row.is_online), last_login_at: row.last_login_at as string | null,
    device_info: row.device_info as string | null, last_ip: row.last_ip as string | null,
    created_at: String(row.created_at), updated_at: String(row.updated_at),
  };
}

export async function listAdminCreators(filters: CreatorListFilters = {}): Promise<CreatorListResult> {
  const client = configured();
  const page = Math.max(0, filters.page ?? 0);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  let query = client.from('creator_profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.query?.trim()) {
    const term = filters.query.trim().replace(/[,%]/g, '');
    query = query.or(`display_name.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error, count } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) throw error;
  return { creators: (data ?? []).map(row => normalizeProfile(row as Record<string, unknown>)), total: count ?? 0 };
}

export async function getAdminCreatorById(creatorId: string): Promise<CreatorFullDetail | null> {
  const client = configured();
  const { data: profile, error } = await client.from('creator_profiles').select('*').eq('id', creatorId).maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const [wallet, kyc, level, badges, socials, notes, flags, submissions] = await Promise.all([
    client.from('creator_wallets').select('*').eq('creator_id', creatorId).maybeSingle(),
    client.from('creator_kyc').select('*').eq('creator_id', creatorId).maybeSingle(),
    client.from('creator_levels').select('*').eq('creator_id', creatorId).maybeSingle(),
    client.from('creator_badges').select('*').eq('creator_id', creatorId).order('awarded_at', { ascending: false }),
    client.from('provider_connections').select('*').eq('user_id', creatorId).order('provider'),
    client.from('creator_notes').select('*').eq('creator_id', creatorId).order('created_at', { ascending: false }).limit(100),
    client.from('creator_flags').select('*').eq('creator_id', creatorId).order('created_at', { ascending: false }),
    client.from('submissions').select('id,total_views', { count: 'exact' }).eq('creator_id', creatorId),
  ]);
  for (const result of [wallet, kyc, level, badges, socials, notes, flags, submissions]) if (result.error) throw result.error;
  const creator = normalizeProfile(profile as Record<string, unknown>);
  creator.wallet = wallet.data as CreatorWalletDetail | undefined;
  creator.kyc = kyc.data as CreatorKYCDocument | undefined;
  creator.level = level.data as CreatorLevelXP | undefined;
  creator.badges = (badges.data ?? []) as CreatorBadgeItem[];
  creator.socials = (socials.data ?? []).map((s: any) => ({
    id: s.id,
    creator_id: s.user_id,
    platform: s.provider,
    account_handle: s.provider_username || '',
    follower_count: s.followers_count ?? 0,
    subscriber_count: s.followers_count ?? 0,
    total_views: s.media_count ?? 0, // Approx for now
    total_posts: s.media_count ?? 0,
    is_verified: s.verification_status === 'verified',
    last_synced_at: s.last_sync_at
  })) as CreatorSocialAccountItem[];
  creator.notes = (notes.data ?? []) as CreatorNoteItem[];
  creator.flags = (flags.data ?? []) as CreatorFlagItem[];
  creator.campaign_participations_count = submissions.count ?? 0;
  creator.total_submissions_count = submissions.count ?? 0;
  creator.verified_views_count = (submissions.data ?? []).reduce((sum, item) => sum + Number(item.total_views ?? 0), 0);
  return creator;
}

export async function getCreatorDashboardStats(): Promise<AdminCreatorDashboardStats> {
  const client = configured();
  const { data, error } = await client.rpc('admin_creator_dashboard');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalCreators: Number(row?.total_creators ?? 0), onlineCreators: Number(row?.online_creators ?? 0),
    verifiedCreators: Number(row?.verified_creators ?? 0), pendingKYCCreators: Number(row?.pending_kyc_creators ?? 0),
    rejectedCreators: Number(row?.rejected_creators ?? 0), suspendedCreators: Number(row?.suspended_creators ?? 0),
    bannedCreators: Number(row?.banned_creators ?? 0), topEarnerName: String(row?.top_earner_name ?? '—'),
    topCreatorName: String(row?.top_creator_name ?? '—'), newRegistrationsToday: Number(row?.new_registrations_today ?? 0),
    dailyActiveCreators: Number(row?.daily_active_creators ?? 0), totalCampaignParticipations: Number(row?.campaign_participations ?? 0),
    pendingWithdrawalsCount: Number(row?.pending_withdrawals ?? 0),
  };
}

export async function executeCreatorAction(creatorId: string, action: string, payload: CreatorActionPayload = {}) {
  const { error } = await configured().rpc('admin_creator_action', { p_creator_id: creatorId, p_action: action, p_payload: payload });
  if (error) throw error;
}

export async function updateCreatorProfile(creatorId: string, changes: Pick<CreatorFullDetail, 'display_name' | 'username' | 'phone' | 'country' | 'state' | 'city' | 'timezone' | 'language' | 'bio' | 'portfolio_url' | 'website_url' | 'skills' | 'experience_level' | 'banner_url'>) {
  const { error } = await configured().from('creator_profiles').update(changes).eq('id', creatorId);
  if (error) throw error;
}

export async function updateCreatorStatus(creatorId: string, status: ExtendedCreatorStatus, reason?: string) {
  return executeCreatorAction(creatorId, 'set_status', { status, reason });
}
export async function reviewCreatorKYC(creatorId: string, status: KYCStatus, reason?: string) {
  return executeCreatorAction(creatorId, 'review_kyc', { status, reason });
}
export async function adjustCreatorWallet(creatorId: string, kind: 'credit' | 'bonus' | 'deduct' | 'freeze' | 'unfreeze', amountCents = 0, reason?: string) {
  return executeCreatorAction(creatorId, 'adjust_wallet', { kind, amount_cents: amountCents, reason });
}
export async function addCreatorNote(creatorId: string, content: string, noteType: 'internal' | 'warning' | 'flag' = 'internal') {
  return executeCreatorAction(creatorId, 'add_note', { content, note_type: noteType });
}
export async function awardCreatorBadge(creatorId: string, badgeKey: string, badgeName: string, icon = 'award') {
  return executeCreatorAction(creatorId, 'award_badge', { badge_key: badgeKey, badge_name: badgeName, icon });
}
export async function updateCreatorLevel(creatorId: string, levelNumber: number, levelName: string, rankName: string, currentXp: number) {
  return executeCreatorAction(creatorId, 'set_level', { level_number: levelNumber, level_name: levelName, rank_name: rankName, current_xp: currentXp });
}
export async function setCreatorPermission(creatorId: string, permissionKey: string, isGranted: boolean) {
  return executeCreatorAction(creatorId, 'set_permission', { permission_key: permissionKey, is_granted: isGranted });
}
export async function invokeCreatorAdminAuthAction(creatorId: string, action: 'force_logout' | 'send_password_recovery' | 'create_impersonation_link', reason?: string): Promise<{ impersonationUrl?: string }> {
  const { data, error } = await configured().functions.invoke('creator-admin', { body: { creatorId, action, reason } });
  if (error) throw error;
  return (data ?? {}) as { impersonationUrl?: string };
}
export async function upsertCreatorSocialAccount(creatorId: string, payload: Omit<CreatorSocialAccountItem, 'id' | 'creator_id' | 'last_synced_at'>) {
  const { error } = await configured().from('provider_connections').upsert({
    user_id: creatorId, 
    provider: payload.platform,
    provider_username: payload.account_handle,
    followers_count: payload.follower_count,
    last_sync_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider,provider_account_id' });
  if (error) throw error;
}
export async function updateCreatorSettings(value: Record<string, unknown>) {
  const { error } = await configured().from('creator_settings').upsert({ key: 'creator_platform', value });
  if (error) throw error;
}
export async function getCreatorSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await configured().from('creator_settings').select('value').eq('key', 'creator_platform').maybeSingle();
  if (error) throw error;
  return (data?.value ?? {}) as Record<string, unknown>;
}

export function downloadCreatorCsv(creators: CreatorFullDetail[], report: 'performance' | 'earnings' | 'campaign-history' | 'fraud') {
  const columns = report === 'earnings'
    ? ['id', 'display_name', 'username', 'email', 'status', 'kyc_status']
    : ['id', 'display_name', 'username', 'country', 'status', 'kyc_status', 'created_at'];
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [columns.join(','), ...creators.map(row => columns.map(key => escape(row[key as keyof CreatorFullDetail])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `creatorx-${report}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
}
