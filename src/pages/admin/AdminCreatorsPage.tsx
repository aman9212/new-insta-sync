import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, Button, DataTable, EmptyState, Input, Modal, Select, Textarea } from '../../components/ui';
import { formatCents, formatNumber, formatViews } from '../../lib/currency';
import { showToast } from '../../lib/toast';
import {
  addCreatorNote, adjustCreatorWallet, awardCreatorBadge, downloadCreatorCsv,
  getAdminCreatorById, getCreatorDashboardStats, getCreatorSettings, invokeCreatorAdminAuthAction, listAdminCreators,
  reviewCreatorKYC, setCreatorPermission, updateCreatorLevel, updateCreatorProfile, updateCreatorSettings,
  updateCreatorStatus, upsertCreatorSocialAccount,
} from '../../services/creator-management.service';
import type { AdminCreatorDashboardStats, CreatorFullDetail, ExtendedCreatorStatus, KYCStatus } from '../../types/creator-management';

type Section = 'dashboard' | 'all' | 'kyc' | 'social' | 'wallets' | 'submissions' | 'campaigns' | 'achievements' | 'referrals' | 'analytics' | 'reports' | 'audit' | 'settings';
type ActionKind = 'note' | 'wallet' | 'badge' | 'level' | 'social' | 'permission' | null;

const sections: { id: Section; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'all', label: 'All Creators' }, { id: 'kyc', label: 'KYC Review' },
  { id: 'social', label: 'Social Accounts' }, { id: 'wallets', label: 'Wallets' }, { id: 'submissions', label: 'Submissions' },
  { id: 'campaigns', label: 'Campaign Participation' }, { id: 'achievements', label: 'Achievements, Badges & Levels' },
  { id: 'referrals', label: 'Referrals' }, { id: 'analytics', label: 'Analytics' }, { id: 'reports', label: 'Reports' },
  { id: 'audit', label: 'Audit Logs' }, { id: 'settings', label: 'Settings' },
];

const statuses: ExtendedCreatorStatus[] = ['pending', 'verified', 'rejected', 'suspended', 'banned', 'archived', 'deleted'];
const kycStatuses: KYCStatus[] = ['pending', 'approved', 'rejected', 'changes_requested'];
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const statusVariant = (status: string) => status === 'verified' || status === 'approved' ? 'success' : status === 'pending' || status === 'changes_requested' ? 'warning' : status === 'suspended' || status === 'banned' || status === 'rejected' ? 'danger' : 'neutral';

function Metric({ title, value, detail }: { title: string; value: string | number; detail?: string }) {
  return <div className="glass rounded-2xl border border-border p-4 shadow-xl shadow-black/10"><p className="text-xs font-medium text-text-muted">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>{detail && <p className="mt-1 text-xs text-text-secondary truncate">{detail}</p>}</div>;
}

export function AdminCreatorsPage() {
  const [section, setSection] = useState<Section>('dashboard');
  const [creators, setCreators] = useState<CreatorFullDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AdminCreatorDashboardStats | null>(null);
  const [selected, setSelected] = useState<CreatorFullDetail | null>(null);
  const [status, setStatus] = useState<ExtendedCreatorStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionKind>(null);
  const [saving, setSaving] = useState(false);
  const [settingsText, setSettingsText] = useState('{}');

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [list, dashboard] = await Promise.all([listAdminCreators({ status, query, pageSize: 100 }), getCreatorDashboardStats()]);
      setCreators(list.creators); setTotal(list.total); setStats(dashboard);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load creator management data.'); }
    finally { setLoading(false); }
  }, [status, query]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (section === 'settings') getCreatorSettings().then(value => setSettingsText(JSON.stringify(value, null, 2))).catch(reason => setError(reason.message)); }, [section]);

  async function openCreator(id: string) {
    try { setSelected(await getAdminCreatorById(id)); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : 'Unable to load creator.', 'error'); }
  }
  async function applyStatus(next: ExtendedCreatorStatus) {
    if (!selected) return;
    try { setSaving(true); await updateCreatorStatus(selected.id, next); await openCreator(selected.id); await refresh(); showToast(`Creator marked ${label(next)}.`); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : 'Unable to change status.', 'error'); } finally { setSaving(false); }
  }
  async function applyKyc(next: KYCStatus) {
    if (!selected) return;
    const reason = next === 'rejected' || next === 'changes_requested' ? window.prompt('Reason shown to the creator:') ?? undefined : undefined;
    if ((next === 'rejected' || next === 'changes_requested') && !reason) return;
    try { setSaving(true); await reviewCreatorKYC(selected.id, next, reason); await openCreator(selected.id); await refresh(); showToast('KYC review saved.'); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : 'Unable to review KYC.', 'error'); } finally { setSaving(false); }
  }
  async function saveSettings() {
    try { const value = JSON.parse(settingsText) as Record<string, unknown>; setSaving(true); await updateCreatorSettings(value); showToast('Creator settings saved.'); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : 'Settings must be valid JSON.', 'error'); } finally { setSaving(false); }
  }

  const columns = [
    { key: 'creator', header: 'Creator', render: (item: CreatorFullDetail) => <div className="flex items-center gap-3"><Avatar src={item.avatar_url ?? undefined} alt={item.display_name} size="sm"/><div><p className="font-semibold">{item.display_name || item.username}</p><p className="text-xs text-text-muted">@{item.username}</p></div></div> },
    { key: 'status', header: 'Status', render: (item: CreatorFullDetail) => <Badge variant={statusVariant(item.status)} size="sm">{label(item.status)}</Badge> },
    { key: 'kyc', header: 'KYC', render: (item: CreatorFullDetail) => <Badge variant={statusVariant(item.kyc_status)} size="sm">{label(item.kyc_status)}</Badge>, hideOnMobile: true },
    { key: 'country', header: 'Location', render: (item: CreatorFullDetail) => item.city ? `${item.city}, ${item.country}` : item.country, hideOnMobile: true },
    { key: 'joined', header: 'Joined', render: (item: CreatorFullDetail) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(item.created_at)), hideOnMobile: true },
  ];

  if (error) return <EmptyState title="Creator management unavailable" description={error} action={<Button variant="secondary" onClick={() => void refresh()}>Retry</Button>} />;

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Creator operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Creator Management</h1><p className="mt-1 text-sm text-text-secondary">Govern every creator account, trust decision, wallet, and performance record from one controlled workspace.</p></div><Button variant="secondary" loading={loading} onClick={() => void refresh()}>Refresh data</Button></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{sections.map(item => <button key={item.id} onClick={() => setSection(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${section === item.id ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>{item.label}</button>)}</div>

    {section === 'dashboard' && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Total creators" value={formatNumber(stats?.totalCreators ?? 0)} /><Metric title="Online now" value={formatNumber(stats?.onlineCreators ?? 0)} /><Metric title="Verified" value={formatNumber(stats?.verifiedCreators ?? 0)} /><Metric title="Pending KYC" value={formatNumber(stats?.pendingKYCCreators ?? 0)} /><Metric title="New registrations today" value={formatNumber(stats?.newRegistrationsToday ?? 0)} /><Metric title="Daily active creators" value={formatNumber(stats?.dailyActiveCreators ?? 0)} /><Metric title="Campaign participation" value={formatNumber(stats?.totalCampaignParticipations ?? 0)} /><Metric title="Pending withdrawals" value={formatNumber(stats?.pendingWithdrawalsCount ?? 0)} /></div><div className="grid gap-4 md:grid-cols-2"><Metric title="Top earner" value={stats?.topEarnerName ?? '—'} /><Metric title="Top creator by views" value={stats?.topCreatorName ?? '—'} /></div></div>}

    {section === 'settings' && <div className="max-w-3xl rounded-2xl border border-border bg-surface p-5"><h2 className="text-lg font-bold">Creator platform settings</h2><p className="mt-1 text-sm text-text-secondary">Store policy configuration as JSON. These values are administrator-owned and are not embedded in application code.</p><Textarea className="mt-4 min-h-[320px] font-mono text-xs" value={settingsText} onChange={event => setSettingsText(event.target.value)} aria-label="Creator settings JSON"/><div className="mt-4"><Button loading={saving} onClick={() => void saveSettings()}>Save settings</Button></div></div>}

    {section === 'reports' && <div className="rounded-2xl border border-border bg-surface p-5"><h2 className="text-lg font-bold">Creator reports</h2><p className="mt-1 text-sm text-text-secondary">Exports reflect the live creator list currently filtered above. CSV opens directly in Excel and keeps audit-sensitive records inside your environment.</p><div className="mt-4 flex flex-wrap gap-2">{(['performance','earnings','campaign-history','fraud'] as const).map(report => <Button key={report} variant="secondary" onClick={() => downloadCreatorCsv(creators, report)}>Export {label(report)} CSV</Button>)}</div></div>}

    {section !== 'dashboard' && section !== 'settings' && section !== 'reports' && <div className="space-y-4"><div className="flex flex-col gap-3 md:flex-row"><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, username, or email" className="md:max-w-sm"/><Select value={status} onChange={event => setStatus(event.target.value as ExtendedCreatorStatus | 'all')} options={[{ value: 'all', label: 'All statuses' }, ...statuses.map(value => ({ value, label: label(value) }))]} className="md:max-w-48"/><p className="self-center text-sm text-text-muted">{formatNumber(total)} creators</p></div><DataTable columns={columns} rows={creators} keyField="id" onRowClick={item => void openCreator(item.id)} variant="glass" emptyMessage={loading ? 'Loading creators…' : 'No creators match this view.'}/></div>}

    <CreatorDetail creator={selected} saving={saving} onClose={() => setSelected(null)} onStatus={applyStatus} onKyc={applyKyc} onAction={setAction} onProfile={async changes => { if (!selected) return; await updateCreatorProfile(selected.id, changes); await openCreator(selected.id); await refresh(); }} onAuthAction={async actionName => { if (!selected) return; if (!window.confirm(`${label(actionName)} for this creator?`)) return; try { setSaving(true); const response = await invokeCreatorAdminAuthAction(selected.id, actionName); if (response.impersonationUrl) window.open(response.impersonationUrl, '_blank', 'noopener,noreferrer'); showToast(actionName === 'send_password_recovery' ? 'Password recovery email requested.' : 'Security action completed.'); } catch (reason) { showToast(reason instanceof Error ? reason.message : 'Security action failed.', 'error'); } finally { setSaving(false); } }} />
    <ActionDialog kind={action} creator={selected} loading={saving} onClose={() => setAction(null)} onSubmit={async values => { if (!selected) return; try { setSaving(true); if (action === 'note') await addCreatorNote(selected.id, String(values.content), values.noteType as 'internal' | 'warning' | 'flag'); if (action === 'wallet') await adjustCreatorWallet(selected.id, values.kind as 'credit' | 'bonus' | 'deduct' | 'freeze' | 'unfreeze', Math.round(Number(values.amount || 0) * 100), String(values.reason ?? '')); if (action === 'badge') await awardCreatorBadge(selected.id, String(values.key), String(values.name), String(values.icon)); if (action === 'level') await updateCreatorLevel(selected.id, Number(values.level), String(values.name), String(values.rank), Number(values.xp)); if (action === 'permission') await setCreatorPermission(selected.id, String(values.key), Boolean(values.granted)); if (action === 'social') await upsertCreatorSocialAccount(selected.id, { platform: values.platform as never, account_handle: String(values.handle), follower_count: Number(values.followers || 0), subscriber_count: 0, total_views: Number(values.views || 0), total_posts: Number(values.posts || 0), is_verified: Boolean(values.verified) }); await openCreator(selected.id); await refresh(); setAction(null); showToast('Creator record updated.'); } catch (reason) { showToast(reason instanceof Error ? reason.message : 'Unable to save creator record.', 'error'); } finally { setSaving(false); } }} />
  </div>;
}

function CreatorDetail({ creator, saving, onClose, onStatus, onKyc, onAction, onProfile, onAuthAction }: { creator: CreatorFullDetail | null; saving: boolean; onClose: () => void; onStatus: (status: ExtendedCreatorStatus) => Promise<void>; onKyc: (status: KYCStatus) => Promise<void>; onAction: (action: ActionKind) => void; onProfile: (changes: Parameters<typeof updateCreatorProfile>[1]) => Promise<void>; onAuthAction: (action: 'force_logout' | 'send_password_recovery' | 'create_impersonation_link') => Promise<void> }) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { setDraft({ display_name: creator?.display_name ?? '', username: creator?.username ?? '', phone: creator?.phone ?? '', country: creator?.country ?? '', state: creator?.state ?? '', city: creator?.city ?? '', timezone: creator?.timezone ?? 'UTC', language: creator?.language ?? '', bio: creator?.bio ?? '', portfolio_url: creator?.portfolio_url ?? '', website_url: creator?.website_url ?? '', banner_url: creator?.banner_url ?? '', skills: creator?.skills.join(', ') ?? '', experience_level: creator?.experience_level ?? '' }); setEditing(false); }, [creator]);
  if (!creator) return null;
  const setDraftValue = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const editField = (key: string, title: string, type = 'text') => <Input label={title} type={type} value={draft[key] ?? ''} onChange={event => setDraftValue(key, event.target.value)} />;
  return <Modal open onClose={onClose} title={creator.display_name || creator.username} description={`${creator.email} · ${creator.country || 'Location not provided'}`} size="xl"><div className="space-y-6"><div className="flex flex-wrap gap-2"><Badge variant={statusVariant(creator.status)}>{label(creator.status)}</Badge><Badge variant={statusVariant(creator.kyc_status)}>KYC {label(creator.kyc_status)}</Badge>{creator.wallet?.is_frozen && <Badge variant="danger">Wallet frozen</Badge>}<span className="flex-1"/>{statuses.filter(value => value !== creator.status).map(value => <Button key={value} size="sm" variant={value === 'banned' || value === 'deleted' ? 'danger' : 'secondary'} loading={saving} onClick={() => void onStatus(value)}>{label(value)}</Button>)}</div><div className="grid gap-4 md:grid-cols-3"><Metric title="Available balance" value={formatCents(creator.wallet?.available_balance_cents ?? 0)} /><Metric title="Lifetime earnings" value={formatCents(creator.wallet?.lifetime_earnings_cents ?? 0)} /><Metric title="Verified views" value={formatViews(creator.verified_views_count ?? 0)} /><Metric title="Campaign participation" value={formatNumber(creator.campaign_participations_count ?? 0)} /><Metric title="Submissions" value={formatNumber(creator.total_submissions_count ?? 0)} /><Metric title="XP / level" value={`${formatNumber(creator.level?.current_xp ?? 0)} / ${creator.level?.level_number ?? 0}`} detail={creator.level ? `${creator.level.level_name} · ${creator.level.rank_name}` : undefined}/></div><div className="grid gap-6 lg:grid-cols-2"><section className="space-y-3"><h3 className="font-bold">Profile & device</h3>{editing ? <><div className="grid gap-3 md:grid-cols-2">{editField('display_name', 'Display name')}{editField('username', 'Username')}{editField('phone', 'Phone')}{editField('country', 'Country')}{editField('state', 'State')}{editField('city', 'City')}{editField('timezone', 'Timezone')}{editField('language', 'Language')}{editField('portfolio_url', 'Portfolio URL', 'url')}{editField('website_url', 'Website URL', 'url')}{editField('banner_url', 'Banner URL', 'url')}{editField('experience_level', 'Experience')}</div><Textarea label="Bio" value={draft.bio ?? ''} onChange={event => setDraftValue('bio', event.target.value)}/><Input label="Skills (comma separated)" value={draft.skills ?? ''} onChange={event => setDraftValue('skills', event.target.value)}/><Button loading={saving} size="sm" onClick={() => void onProfile({ display_name: draft.display_name, username: draft.username, phone: draft.phone, country: draft.country, state: draft.state, city: draft.city, timezone: draft.timezone, language: draft.language, bio: draft.bio, portfolio_url: draft.portfolio_url, website_url: draft.website_url, banner_url: draft.banner_url, skills: (draft.skills ?? '').split(',').map(value => value.trim()).filter(Boolean), experience_level: draft.experience_level })}>Save profile</Button></> : <><p className="text-sm text-text-secondary whitespace-pre-wrap">{creator.bio || 'No bio provided.'}</p><dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-text-muted">Last login</dt><dd>{creator.last_login_at ? new Date(creator.last_login_at).toLocaleString() : 'Never'}</dd></div><div><dt className="text-text-muted">Device / IP</dt><dd className="truncate">{creator.device_info || 'Not recorded'} · {creator.last_ip || 'Not recorded'}</dd></div><div><dt className="text-text-muted">Skills</dt><dd>{creator.skills.join(', ') || 'None'}</dd></div><div><dt className="text-text-muted">Experience</dt><dd>{creator.experience_level || 'Not set'}</dd></div></dl><Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit profile</Button></>}</section><section className="space-y-3"><h3 className="font-bold">KYC & trust</h3><p className="text-sm text-text-secondary">{creator.kyc?.rejection_reason || 'No review note.'}</p><div className="flex flex-wrap gap-2">{kycStatuses.map(value => <Button key={value} size="sm" variant={value === 'approved' ? 'primary' : value === 'rejected' ? 'danger' : 'secondary'} loading={saving} onClick={() => void onKyc(value)}>{label(value)}</Button>)}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => onAction('note')}>Add note / warning</Button><Button size="sm" variant="secondary" onClick={() => onAction('permission')}>Permissions</Button><Button size="sm" variant="secondary" onClick={() => void onAuthAction('send_password_recovery')}>Reset password</Button><Button size="sm" variant="secondary" onClick={() => void onAuthAction('force_logout')}>Force logout</Button><Button size="sm" variant="secondary" onClick={() => void onAuthAction('create_impersonation_link')}>Impersonate</Button></div></section></div><div className="grid gap-6 lg:grid-cols-2"><section><h3 className="font-bold">Social accounts</h3><div className="mt-3 space-y-2">{creator.socials?.length ? creator.socials.map(account => <div key={account.id} className="flex items-center justify-between rounded-xl bg-surface-hover px-3 py-2 text-sm"><span className="font-medium">{label(account.platform)} · {account.account_handle}</span><span className="text-text-muted">{formatNumber(account.follower_count)} followers</span></div>) : <p className="text-sm text-text-muted">No connected accounts.</p>}</div><Button className="mt-3" size="sm" variant="secondary" onClick={() => onAction('social')}>Manage social account</Button></section><section><h3 className="font-bold">Achievements & notes</h3><div className="mt-3 flex flex-wrap gap-2">{creator.badges?.map(badge => <Badge key={badge.id}>{badge.badge_name}</Badge>)}{!creator.badges?.length && <p className="text-sm text-text-muted">No badges awarded.</p>}</div><div className="mt-3 space-y-1">{creator.notes?.slice(0, 3).map(note => <p key={note.id} className="rounded-lg bg-surface-hover p-2 text-xs">{label(note.note_type)}: {note.content}</p>)}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => onAction('badge')}>Award badge</Button><Button size="sm" variant="secondary" onClick={() => onAction('level')}>Set level</Button><Button size="sm" variant="secondary" onClick={() => onAction('wallet')}>Adjust wallet</Button></div></section></div></div></Modal>;
}

function ActionDialog({ kind, creator, loading, onClose, onSubmit }: { kind: ActionKind; creator: CreatorFullDetail | null; loading: boolean; onClose: () => void; onSubmit: (values: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<Record<string, string | boolean>>({ kind: 'credit', noteType: 'internal', granted: true, platform: 'youtube', verified: false });
  useEffect(() => setForm({ kind: 'credit', noteType: 'internal', granted: true, platform: 'youtube', verified: false }), [kind, creator?.id]);
  if (!kind || !creator) return null; const set = (key: string, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const field = (key: string, title: string, type = 'text') => <Input label={title} type={type} value={String(form[key] ?? '')} onChange={event => set(key, event.target.value)} />;
  return <Modal open onClose={onClose} title={`${label(kind)} · ${creator.display_name || creator.username}`}><div className="space-y-4">{kind === 'note' && <><Select label="Type" value={String(form.noteType)} onChange={event => set('noteType', event.target.value)} options={['internal','warning','flag'].map(value => ({ value, label: label(value) }))}/><Textarea label="Internal record" value={String(form.content ?? '')} onChange={event => set('content', event.target.value)}/></>}{kind === 'wallet' && <><Select label="Operation" value={String(form.kind)} onChange={event => set('kind', event.target.value)} options={['credit','bonus','deduct','freeze','unfreeze'].map(value => ({ value, label: label(value) }))}/>{!['freeze','unfreeze'].includes(String(form.kind)) && field('amount', 'Amount (USD)', 'number')}{field('reason', 'Reason')}</>}{kind === 'badge' && <>{field('key', 'Badge key')}{field('name', 'Badge name')}{field('icon', 'Icon name')}</>}{kind === 'level' && <>{field('level', 'Level number', 'number')}{field('name', 'Level name')}{field('rank', 'Rank name')}{field('xp', 'Current XP', 'number')}</>}{kind === 'permission' && <><Input label="Permission key" value={String(form.key ?? '')} onChange={event => set('key', event.target.value)}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.granted)} onChange={event => set('granted', event.target.checked)}/> Grant permission</label></>}{kind === 'social' && <><Input label="Platform identifier" value={String(form.platform)} onChange={event => set('platform', event.target.value)}/>{field('handle', 'Account handle')}{field('followers', 'Followers', 'number')}{field('views', 'Total views', 'number')}{field('posts', 'Posts', 'number')}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.verified)} onChange={event => set('verified', event.target.checked)}/> Verified account</label></>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={() => void onSubmit(form)}>Save</Button></div></div></Modal>;
}
