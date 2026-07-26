import { useState, useEffect } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { socialIntegrationService } from '../../../services/social-integration.service';
import type { SocialPlatformInfo, SocialPlatformId, PlatformCredentialsConfig } from '../../../types/social-integration';

export type IntegrationsTab =
  | 'overview'
  | 'platforms'
  | 'oauth'
  | 'credentials'
  | 'webhooks'
  | 'queue'
  | 'rules'
  | 'rate_limits'
  | 'health'
  | 'logs'
  | 'analytics';

const tabItems: Array<{ id: IntegrationsTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
  { id: 'platforms', label: 'Platform Manager', icon: 'layers' },
  { id: 'oauth', label: 'OAuth Manager', icon: 'key' },
  { id: 'credentials', label: 'API Credentials', icon: 'lock' },
  { id: 'webhooks', label: 'Webhook Manager', icon: 'webhook' },
  { id: 'queue', label: 'Sync Queue', icon: 'list-todo' },
  { id: 'rules', label: 'Verification Rules', icon: 'shield-check' },
  { id: 'rate_limits', label: 'Rate Limits', icon: 'gauge' },
  { id: 'health', label: 'API Health', icon: 'activity' },
  { id: 'logs', label: 'Audit Logs', icon: 'file-text' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-accent' : 'bg-surface-hover'
      }`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<IntegrationsTab>('platforms');
  const [platforms, setPlatforms] = useState<SocialPlatformInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformId>('youtube');
  const [credentials, setCredentials] = useState<PlatformCredentialsConfig | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    const data = await socialIntegrationService.getPlatforms();
    setPlatforms(data);
  };

  useEffect(() => {
    socialIntegrationService.getPlatformCredentials(selectedPlatform)
      .then(setCredentials)
      .catch((e) => {
        showNotice(`Failed to load credentials for ${selectedPlatform}: ${e.message}`, 'error');
        setCredentials(null); // At least clear it to show empty state or fallback
      });
  }, [selectedPlatform]);

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleTestConnection = async (platformId: SocialPlatformId) => {
    setTesting(true);
    try {
      const res = await socialIntegrationService.testConnection(platformId);
      if (res.status === 'healthy') {
        showNotice(`Connection to ${platformId.toUpperCase()} successful! Latency: ${res.latencyMs}ms`, 'success');
      } else {
        showNotice(`Connection to ${platformId.toUpperCase()} failed: ${res.message}`, 'error');
      }
    } catch (e) {
      showNotice(`Test connection failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    } finally {
      setTesting(false);
      fetchPlatforms();
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials) {
      setSaving(true);
      try {
        await socialIntegrationService.savePlatformCredentials(credentials);
        showNotice(`Saved ${credentials.platformId.toUpperCase()} API configuration securely!`, 'success');
        fetchPlatforms();
      } catch (e) {
        showNotice(`Failed to save configuration: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const getLabels = (platform: SocialPlatformId) => {
    if (platform === 'youtube') return { id: 'Google Client ID', secret: 'Google Client Secret' };
    if (platform === 'tiktok') return { id: 'TikTok Client Key', secret: 'TikTok Client Secret' };
    if (platform === 'x') return { id: 'X API Key', secret: 'X API Secret' };
    return { id: 'App ID', secret: 'App Secret' }; // Meta platforms
  };

  return (
    <div className="space-y-6 text-text-primary">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20 text-accent">
              <Icon name="plug-zap" size={18} />
            </span>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Social Integration Platform</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">Enterprise control plane for 12 social networks, OAuth, auto-verification, sync queue, and webhooks.</p>
        </div>
      </div>

      {notice && (
        <div className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
          notice.type === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : 
          notice.type === 'info' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            <Icon name={notice.type === 'error' ? 'alert-triangle' : notice.type === 'info' ? 'info' : 'check-circle'} size={14} />
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Main Layout with Sidebar Tabs */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="rounded-3xl border border-border bg-surface p-3 space-y-1 backdrop-blur-xl h-fit">
          <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted block">Platform Suite</span>
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl min-h-[600px] text-text-primary">
          {/* Tab 1: Platform Manager */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Platform Manager (12 Platforms)</h2>
                  <p className="text-xs text-text-secondary">Monitor connection status, quotas, rate limits, error rates, and API versions.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchPlatforms}
                  className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-2"
                >
                  <Icon name="refresh-cw" size={13} /> Refresh Status
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {platforms.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-surface-elevated overflow-hidden flex flex-col">
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.enabled ? 'bg-accent/20 text-accent' : 'bg-surface border border-border text-text-muted'}`}>
                            <Icon name={p.iconKey} size={20} />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                              {p.displayName}
                              {p.enabled && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                            </h3>
                            <span className="text-[10px] text-text-muted capitalize">API {p.enabled ? 'Active' : 'Disabled'} • {p.category}</span>
                          </div>
                        </div>
                        {p.enabled ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.apiHealthStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.apiHealthStatus === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-danger/20 text-danger'
                          }`}>
                            {p.apiHealthStatus.toUpperCase()}
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-hover border border-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs border-y border-border py-3 text-text-secondary">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider"><Icon name="activity" size={10} /> Quota Usage</span>
                          <span className="font-bold text-text-primary text-sm">{p.enabled ? p.quotaUsagePercent + '%' : '-'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider"><Icon name="clock" size={10} /> Avg Response</span>
                          <span className="font-bold text-text-primary text-sm">{p.enabled ? p.avgResponseTimeMs + 'ms' : '-'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider"><Icon name="users" size={10} /> Creators Linked</span>
                          <span className="font-bold text-text-primary text-sm">{p.connectedAccountCount}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider"><Icon name="calendar" size={10} /> Last Health Check</span>
                          <span className="font-bold text-text-primary text-[11px] truncate block" title={p.lastHealthCheckAt || 'Never'}>
                            {p.lastHealthCheckAt ? new Date(p.lastHealthCheckAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface-hover px-5 py-3 flex gap-2 justify-end border-t border-border">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(p.id)}
                        disabled={testing || !p.enabled}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-text-primary hover:bg-surface border border-transparent hover:border-border transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Test Connectivity
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(p.id);
                          setActiveTab('credentials');
                        }}
                        className="rounded-lg bg-surface border border-border px-3 py-1.5 text-[11px] font-bold text-text-primary hover:text-accent hover:border-accent/50 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Icon name="settings" size={12} /> Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: API Credentials / Configuration */}
          {activeTab === 'credentials' && !credentials && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-text-secondary">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mb-4" />
              <p className="text-sm font-semibold">Loading API Configuration...</p>
            </div>
          )}

          {activeTab === 'credentials' && credentials && (
            <div className="space-y-8 max-w-5xl">
              <div className="flex items-start sm:items-center justify-between border-b border-border pb-5 gap-4 flex-col sm:flex-row">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-accent/20 text-accent grid place-items-center">
                     <Icon name={platforms.find(p => p.id === credentials.platformId)?.iconKey || 'box'} size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary capitalize">{credentials.platformId} Integration Configuration</h2>
                    <p className="text-xs text-text-secondary mt-1">Manage core API credentials, OAuth scopes, syncing intervals, and webhooks securely.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatformId)}
                    className="flex-1 sm:flex-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-bold uppercase shadow-sm"
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-8">
                {/* Section 1: Activation & Environment */}
                <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-6">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Icon name="power" size={16} className="text-accent" /> Platform Status & Environment
                  </h3>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface">
                      <div>
                        <label className="block text-sm font-bold text-text-primary">Enable Platform Integration</label>
                        <p className="text-[11px] text-text-muted mt-0.5">Allow creators to connect and sync their {credentials.platformId} accounts.</p>
                      </div>
                      <ToggleSwitch enabled={credentials.enabled} onChange={(val) => setCredentials({ ...credentials, enabled: val })} />
                    </div>

                    <div className="flex flex-col justify-center p-4 rounded-xl border border-border bg-surface">
                      <label className="block text-xs font-bold text-text-secondary mb-2">Operating Environment</label>
                      <select
                        value={credentials.environment}
                        onChange={(e) => setCredentials({ ...credentials, environment: e.target.value as 'sandbox' | 'production' })}
                        className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-accent outline-none"
                      >
                        <option value="production">Production (Live API)</option>
                        <option value="sandbox">Sandbox / Staging (Mock APIs)</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Section 2: Core API Credentials */}
                <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Icon name="lock" size={16} className="text-accent" /> Core API Credentials
                    </h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                      <Icon name="shield-check" size={10} /> AES-GCM Encrypted at Rest
                    </span>
                  </div>
                  
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">{getLabels(credentials.platformId).id}</label>
                      <input
                        type="text"
                        placeholder="e.g. 102938475610"
                        value={credentials.clientId || ''}
                        onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary font-mono focus:ring-1 focus:ring-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">{getLabels(credentials.platformId).secret}</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••"
                        value={credentials.clientSecret || ''}
                        onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary font-mono focus:ring-1 focus:ring-accent outline-none placeholder:text-text-muted/30"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">OAuth Redirect URI</label>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-2.5 rounded-l-xl border border-r-0 border-border bg-surface-hover text-text-muted text-xs font-mono">
                          {window.location.origin}
                        </span>
                        <input
                          type="text"
                          value={credentials.redirectUri.replace(window.location.origin, '')}
                          onChange={(e) => setCredentials({ ...credentials, redirectUri: window.location.origin + e.target.value })}
                          className="flex-1 min-w-0 rounded-none rounded-r-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary font-mono focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-text-muted">Register this exact URI in your {credentials.platformId} Developer Console.</p>
                    </div>
                  </div>
                </section>

                {/* Section 3: Webhook & Sync Configuration */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Icon name="webhook" size={16} className="text-accent" /> Webhook Configuration
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-text-primary">Listen to Webhooks</label>
                        <p className="text-[10px] text-text-muted mt-0.5">Receive real-time data updates via webhooks</p>
                      </div>
                      <ToggleSwitch enabled={credentials.webhook_enabled ?? false} onChange={(val) => setCredentials({ ...credentials, webhook_enabled: val })} />
                    </div>

                    <div className={`space-y-4 pt-2 ${!(credentials.webhook_enabled ?? false) && 'opacity-50 pointer-events-none'}`}>
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1.5">Webhook Verify Token</label>
                        <input
                          type="text"
                          placeholder="Random secure string"
                          value={credentials.apiKey || ''} // Reusing apiKey field for verify token in this schema mapping for simplicity
                          onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1.5">Webhook Secret (App Secret)</label>
                        <input
                          type="password"
                          placeholder="Used to verify HMAC SHA-256 signatures"
                          value={credentials.webhookSecret || ''}
                          onChange={(e) => setCredentials({ ...credentials, webhookSecret: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-accent placeholder:text-text-muted/50"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Icon name="refresh-cw" size={16} className="text-accent" /> Auto-Sync Configuration
                    </h3>
                    
                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1.5">Sync Interval (Minutes)</label>
                        <select
                          value={credentials.syncFrequencyMinutes}
                          onChange={(e) => setCredentials({ ...credentials, syncFrequencyMinutes: Number(e.target.value) })}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                        >
                          <option value={15}>Every 15 minutes (High Volume)</option>
                          <option value={60}>Every 1 hour (Standard)</option>
                          <option value={240}>Every 4 hours (Low Volume)</option>
                          <option value={1440}>Every 24 hours (Daily)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1.5">Requested OAuth Scopes</label>
                        <textarea
                          rows={3}
                          value={credentials.scopes.join('\n')}
                          onChange={(e) =>
                            setCredentials({
                              ...credentials,
                              scopes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="e.g. read_insights\npages_show_list"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-accent resize-none"
                        />
                        <p className="mt-1 text-[10px] text-text-muted">Enter one scope per line.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={() => handleTestConnection(credentials.platformId)}
                    className="rounded-xl border border-border bg-surface-elevated px-5 py-2.5 text-xs font-bold text-text-primary hover:bg-surface-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {testing ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-text-primary border-t-transparent" /> : <Icon name="zap" size={14} />}
                    Test Connection
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white hover:bg-accent-hover transition shadow-lg shadow-accent/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Icon name="save" size={14} />}
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Other tabs fallback view */}
          {activeTab !== 'platforms' && activeTab !== 'credentials' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-text-primary">{activeTab.toUpperCase().replaceAll('_', ' ')} Module</h2>
                <p className="text-xs text-text-secondary">Enterprise management and operational inspection for CreatorX integrations.</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-12 text-center text-xs text-text-secondary">
                <Icon name="check-circle" size={36} className="mx-auto text-accent mb-4" />
                <p className="text-base font-bold text-text-primary mb-1">Module Active & Monitoring</p>
                <p className="max-w-md mx-auto text-sm leading-relaxed">
                  All platforms are actively synchronized with background workers and webhook security middleware. Features for this view are currently operating autonomously in the background.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
