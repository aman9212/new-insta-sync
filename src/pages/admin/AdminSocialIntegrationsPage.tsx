import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { socialIntegrations, type IntegrationConfiguration, type IntegrationLog, type IntegrationPlatform } from '../../services/social-integration.service';
import type { InstagramVerificationRecord, InstagramVerificationStatus } from '../../types/social-integration';

const emptyConfig: IntegrationConfiguration = { enabled: false, environment: 'production', oauth_version: '2.0', api_version: '', scopes: [], redirect_url: '', secrets: {}, max_requests: 100, sync_interval_minutes: 60, retry_count: 3, request_timeout_ms: 10000, cache_duration_seconds: 300, webhook_enabled: false, webhook_url: '' };
const secretFields = [['client_id', 'Client ID'], ['client_secret', 'Client Secret'], ['access_token', 'Access Token'], ['refresh_token', 'Refresh Token'], ['api_key', 'API Key'], ['webhook_secret', 'Webhook Secret']] as const;

function time(value: string | null | undefined) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never'; }
function healthVariant(status: string) { return status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : status === 'offline' ? 'danger' : 'neutral'; }
function statusLabel(status: string) { return status.replaceAll('_', ' '); }

function verificationBadgeVariant(status: InstagramVerificationStatus) {
  switch (status) {
    case 'verified': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'danger';
    case 'expired': return 'neutral';
    default: return 'neutral';
  }
}

export function AdminSocialIntegrationsPage() {
  const [platforms, setPlatforms] = useState<IntegrationPlatform[]>([]);
  const [selected, setSelected] = useState<IntegrationPlatform | null>(null);
  const [logsFor, setLogsFor] = useState<IntegrationPlatform | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [config, setConfig] = useState<IntegrationConfiguration>(emptyConfig);
  const [secretHints, setSecretHints] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bio Verifications Modal / View
  const [showVerificationsModal, setShowVerificationsModal] = useState(false);
  const [verifications, setVerifications] = useState<InstagramVerificationRecord[]>([]);
  const [verifFilter, setVerifFilter] = useState<string>('all');
  const [loadingVerifs, setLoadingVerifs] = useState(false);

  const configuredCount = useMemo(() => platforms.filter(p => p.enabled).length, [platforms]);
  const healthyCount = useMemo(() => platforms.filter(p => p.api_health_status === 'healthy').length, [platforms]);

  async function refresh() { setLoading(true); try { setPlatforms(await socialIntegrations.summary()); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not load integrations.' }); } finally { setLoading(false); } }
  useEffect(() => { void refresh(); }, []);

  async function loadVerifications() {
    setLoadingVerifs(true);
    try {
      const data = await socialIntegrations.getInstagramVerifications();
      setVerifications(data);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not load verifications.' });
    } finally {
      setLoadingVerifs(false);
    }
  }

  function openVerifications() {
    setShowVerificationsModal(true);
    void loadVerifications();
  }

  async function openConfigure(platform: IntegrationPlatform) {
    try {
      const data = await socialIntegrations.configuration(platform.id);
      const credential = data.credential;
      const settings = data.settings;
      setSecretHints(Object.fromEntries(Object.entries(credential?.secrets ?? {}).map(([key, value]) => [key, (value as { hint: string })?.hint ?? ''])));
      setConfig({ ...emptyConfig, enabled: data.platform.enabled, environment: credential?.environment ?? 'production', oauth_version: credential?.oauth_version ?? '2.0', api_version: credential?.api_version ?? '', scopes: credential?.scopes ?? [], redirect_url: credential?.redirect_url ?? '', max_requests: settings?.max_requests ?? 100, sync_interval_minutes: settings?.sync_interval_minutes ?? 60, retry_count: settings?.retry_count ?? 3, request_timeout_ms: settings?.request_timeout_ms ?? 10000, cache_duration_seconds: settings?.cache_duration_seconds ?? 300, webhook_enabled: Boolean(settings?.webhook_enabled), webhook_url: settings?.webhook_url ?? '' });
      setSelected(platform);
    } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to open configuration.' }); }
  }

  async function save() { if (!selected) return; setSaving(true); try { await socialIntegrations.save(selected.id, config); setMessage({ type: 'success', text: `${selected.display_name} configuration saved securely.` }); setSelected(null); await refresh(); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Save failed.' }); } finally { setSaving(false); } }
  async function test(platform: IntegrationPlatform) { try { const result = await socialIntegrations.test(platform.id); setMessage({ type: result.status === 'healthy' ? 'success' : 'error', text: `${platform.display_name}: ${statusLabel(result.status)}${result.responseTime ? ` · ${result.responseTime}ms` : ''}` }); await refresh(); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Health check failed.' }); } }
  async function sync(platform: IntegrationPlatform) { try { await socialIntegrations.sync(platform.id); setMessage({ type: 'success', text: `${platform.display_name} sync queued.` }); await refresh(); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not queue sync.' }); } }
  async function openLogs(platform: IntegrationPlatform) { try { setLogs(await socialIntegrations.logs(platform.id)); setLogsFor(platform); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not load logs.' }); } }
  async function deleteCredentials(platform: IntegrationPlatform) { if (!window.confirm(`Permanently remove ${platform.display_name} credentials and disable this integration?`)) return; try { await socialIntegrations.removeCredentials(platform.id); setMessage({ type: 'success', text: `${platform.display_name} credentials removed.` }); await refresh(); } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Credential removal failed.' }); } }

  const filteredVerifications = useMemo(() => {
    if (verifFilter === 'all') return verifications;
    return verifications.filter(v => v.status === verifFilter);
  }, [verifications, verifFilter]);

  return <div className="mx-auto max-w-7xl space-y-7 py-3">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-accent">Integration control plane</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Social integrations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Configure provider credentials, observe platform health, and operate account syncs without allowing secrets into the browser.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={openVerifications}>
          <Icon name="shield-check" size={15} /> Instagram Verifications
        </Button>
        <Button variant="secondary" onClick={() => void refresh()} loading={loading}>
          <Icon name="refresh-cw" size={15} /> Refresh status
        </Button>
      </div>
    </div>

    {message && <div role="status" className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}><span>{message.text}</span><button onClick={() => setMessage(null)} aria-label="Dismiss message"><Icon name="x" size={16}/></button></div>}
    
    <div className="grid gap-4 sm:grid-cols-3">
      {[[`${configuredCount}`, 'Enabled platforms', 'plug-zap'], [`${healthyCount}`, 'Healthy APIs', 'heart-pulse'], [`${platforms.reduce((sum, p) => sum + (p.accounts?.length || 0), 0)}`, 'Connected accounts', 'users']].map(([value,label,icon]) => <Card key={label} padding={false} className="overflow-hidden bg-surface/60"><div className="flex items-center gap-4 p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><Icon name={icon} size={18}/></span><div><p className="text-2xl font-semibold tracking-[-.05em]">{value}</p><p className="text-xs text-text-muted">{label}</p></div></div></Card>)}
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {loading ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[244px] animate-shimmer rounded-[24px]" />) : platforms.map(platform => <Card key={platform.id} padding={false} className="overflow-hidden bg-[linear-gradient(135deg,rgba(26,31,57,.76),rgba(14,17,32,.68))]" hover><div className="relative p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.055] text-accent"><Icon name={platform.icon_key || platform.iconKey || 'plug'} size={20}/></span><div><h2 className="font-semibold tracking-[-.02em]">{platform.display_name || platform.displayName}</h2><p className="mt-0.5 text-[11px] capitalize text-text-muted">{platform.category} · OAuth {platform.oauth_supported || platform.oauthSupported ? 'ready' : 'not supported'}</p></div></div><Badge variant={platform.enabled ? 'success' : 'neutral'} size="sm"><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${platform.enabled ? 'bg-success animate-pulse' : 'bg-text-muted'}`} />{platform.enabled ? 'Enabled' : 'Disabled'}</Badge></div><div className="mt-5 grid grid-cols-3 gap-2 border-y border-border py-4 text-xs"><div><p className="text-text-muted">Accounts</p><p className="mt-1 font-medium">{platform.accounts?.length || 0}</p></div><div><p className="text-text-muted">API health</p><div className="mt-1"><Badge variant={healthVariant(platform.api_health_status || platform.apiHealthStatus || 'healthy')} size="sm">{statusLabel(platform.api_health_status || platform.apiHealthStatus || 'healthy')}</Badge></div></div><div><p className="text-text-muted">Last sync</p><p className="mt-1 truncate font-medium" title={time(platform.last_sync_at || platform.lastSyncAt)}>{(platform.last_sync_at || platform.lastSyncAt) ? time(platform.last_sync_at || platform.lastSyncAt) : 'Never'}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => void openConfigure(platform)}><Icon name="settings-2" size={14}/> Configure</Button><Button size="sm" variant="ghost" onClick={() => void test(platform)}><Icon name="heart-pulse" size={14}/> Test</Button><Button size="sm" variant="ghost" onClick={() => void sync(platform)}><Icon name="refresh-cw" size={14}/> Sync</Button><Button size="sm" variant="ghost" onClick={() => void openLogs(platform)}><Icon name="scroll-text" size={14}/> Logs</Button>{platform.id === 'instagram' && <Button size="sm" variant="ghost" onClick={openVerifications}><Icon name="shield-check" size={14}/> Verifications</Button>}{platform.enabled && <Button size="sm" variant="ghost" className="ml-auto text-danger hover:bg-danger/10 hover:text-danger" onClick={() => void deleteCredentials(platform)} title="Requires Super Admin"><Icon name="trash-2" size={14}/></Button>}</div></div></Card>)}
    </div>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`${selected?.display_name ?? ''} configuration`} description="Secret fields are write-only. A configured value is never returned to the frontend." size="xl">{selected && <ConfigurationForm config={config} hints={secretHints} onChange={setConfig} onSave={() => void save()} onCancel={() => setSelected(null)} saving={saving} />}</Modal>
    <Modal open={Boolean(logsFor)} onClose={() => setLogsFor(null)} title={`${logsFor?.display_name ?? ''} operational logs`} description="Recent server-side sync and integration events." size="lg"><div className="space-y-2">{logs.length === 0 ? <p className="py-10 text-center text-sm text-text-muted">No operational events have been recorded for this platform.</p> : logs.map(log => <div key={log.id} className="rounded-xl border border-border bg-surface p-3"><div className="flex justify-between gap-3"><Badge variant={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : 'accent'} size="sm">{log.event_type}</Badge><time className="text-[11px] text-text-muted">{time(log.created_at)}</time></div><p className="mt-2 text-sm text-text-secondary">{log.message}</p>{log.response_time_ms != null && <p className="mt-1 text-[11px] text-text-muted">Response time {log.response_time_ms}ms</p>}</div>)}</div></Modal>

    {/* Instagram Verifications Admin View Modal */}
    <Modal open={showVerificationsModal} onClose={() => setShowVerificationsModal(false)} title="Instagram Bio Verifications Control" description="Audit bio verification attempts, status codes, and attempts." size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Filter Status:</span>
            <Select value={verifFilter} onChange={e => setVerifFilter(e.target.value)} options={[{ value: 'all', label: 'All Statuses' }, { value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' }, { value: 'expired', label: 'Expired' }, { value: 'failed', label: 'Failed' }]} />
          </div>
          <Button size="sm" variant="ghost" onClick={loadVerifications} loading={loadingVerifs}>
            <Icon name="refresh-cw" size={14} /> Refresh List
          </Button>
        </div>

        {loadingVerifs ? (
          <div className="py-10 text-center text-sm text-text-muted">Loading verification records...</div>
        ) : filteredVerifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">No Instagram bio verifications recorded matching criteria.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/80 text-text-muted uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Creator</th>
                  <th className="px-3 py-2.5">Username</th>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Method</th>
                  <th className="px-3 py-2.5">Attempts</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredVerifications.map(item => (
                  <tr key={item.id} className="hover:bg-surface-hover/50">
                    <td className="px-3 py-2.5 font-medium text-text-primary">
                      {item.profile?.display_name || item.profile?.email || 'Unknown User'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-text-secondary">
                      @{item.connection?.provider_username || 'n/a'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-accent">
                      {item.verification_code}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={verificationBadgeVariant(item.status)} size="sm">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 uppercase text-[10px] text-text-muted font-bold">
                      {item.verification_method}
                    </td>
                    <td className="px-3 py-2.5 font-bold">
                      {item.attempts}
                    </td>
                    <td className="px-3 py-2.5 text-text-muted">
                      {time(item.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-text-muted">
                      {time(item.verified_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  </div>;
}

function ConfigurationForm({ config, hints, onChange, onSave, onCancel, saving }: { config: IntegrationConfiguration; hints: Record<string, string>; onChange: (next: IntegrationConfiguration) => void; onSave: () => void; onCancel: () => void; saving: boolean }) {
  const set = <K extends keyof IntegrationConfiguration>(key: K, value: IntegrationConfiguration[K]) => onChange({ ...config, [key]: value });
  return <div className="space-y-7"><section className="grid gap-4 sm:grid-cols-2"><label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface p-3"><span><span className="block text-sm font-medium">Integration enabled</span><span className="text-xs text-text-muted">Permits sync and OAuth operations.</span></span><input type="checkbox" checked={config.enabled} onChange={e => set('enabled', e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" /></label><Select label="Environment" value={config.environment} onChange={e => set('environment', e.target.value as 'sandbox' | 'production')} options={[{ value: 'production', label: 'Production' }, { value: 'sandbox', label: 'Sandbox' }]} /></section><section><h3 className="mb-3 text-sm font-semibold">Credentials</h3><div className="grid gap-4 sm:grid-cols-2">{secretFields.map(([key,label]) => <Input key={key} type="password" autoComplete="new-password" label={label} placeholder={hints[key] ? `Configured (${hints[key]}) — enter to replace` : `Enter ${label.toLowerCase()}`} value={config.secrets[key] ?? ''} onChange={e => set('secrets', { ...config.secrets, [key]: e.target.value })} hint={hints[key] ? 'A value is stored securely. Leaving this empty preserves it.' : undefined} />)}</div></section><section><h3 className="mb-3 text-sm font-semibold">OAuth and API</h3><div className="grid gap-4 sm:grid-cols-2"><Select label="OAuth version" value={config.oauth_version} onChange={e => set('oauth_version', e.target.value)} options={[{ value: '2.0', label: 'OAuth 2.0' }, { value: '1.0a', label: 'OAuth 1.0a' }]} /><Input label="API version" value={config.api_version} onChange={e => set('api_version', e.target.value)} placeholder="e.g. v20.0" /><Input className="sm:col-span-2" label="Redirect URL" type="url" value={config.redirect_url} onChange={e => set('redirect_url', e.target.value)} placeholder="https://app.example.com/auth/callback" /><Input className="sm:col-span-2" label="Scopes" value={config.scopes.join(', ')} onChange={e => set('scopes', e.target.value.split(',').map(v => v.trim()).filter(Boolean))} placeholder="read:profile, read:content" hint="Comma-separated. Validate scopes with the provider before enabling production traffic." /></div></section><section><h3 className="mb-3 text-sm font-semibold">Reliability controls</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Input label="Maximum requests" type="number" min="1" value={config.max_requests} onChange={e => set('max_requests', Number(e.target.value))} /><Input label="Sync interval (minutes)" type="number" min="5" value={config.sync_interval_minutes} onChange={e => set('sync_interval_minutes', Number(e.target.value))} /><Input label="Retry count" type="number" min="0" max="10" value={config.retry_count} onChange={e => set('retry_count', Number(e.target.value))} /><Input label="Request timeout (ms)" type="number" min="1000" value={config.request_timeout_ms} onChange={e => set('request_timeout_ms', Number(e.target.value))} /><Input label="Cache duration (seconds)" type="number" min="0" value={config.cache_duration_seconds} onChange={e => set('cache_duration_seconds', Number(e.target.value))} /><label className="flex items-end gap-2 pb-2 text-sm text-text-secondary"><input type="checkbox" checked={config.webhook_enabled} onChange={e => set('webhook_enabled', e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" /> Enable webhook processing</label><Input className="sm:col-span-2 lg:col-span-3" label="Webhook URL" type="url" value={config.webhook_url} onChange={e => set('webhook_url', e.target.value)} placeholder="https://your-provider-webhook.example/events" /></div></section><div className="flex justify-end gap-3 border-t border-border pt-5"><Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="button" onClick={onSave} loading={saving}><Icon name="lock-keyhole" size={15}/> Save securely</Button></div></div>;
}
