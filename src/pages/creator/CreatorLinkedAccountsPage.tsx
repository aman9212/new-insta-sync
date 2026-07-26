import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { getLinkedAccounts } from '../../services/intelligence.service';
import { socialIntegrationService } from '../../services/social-integration.service';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { InstagramVerificationMethodModal } from '../../components/modals/InstagramVerificationMethodModal';
import { InstagramBioVerificationModal } from '../../components/modals/InstagramBioVerificationModal';
import type { ProviderConnectionExtended } from '../../types';
import type { SocialPlatformInfo, SocialPlatformId } from '../../types/social-integration';

interface PlatformMeta {
  name: string;
  logo: string;
  color: string;
}

const PLATFORM_METAS: Record<string, PlatformMeta> = {
  youtube: { name: 'YouTube', logo: '▶️', color: 'border-red-500/20 bg-red-500/5' },
  instagram: { name: 'Instagram', logo: '📷', color: 'border-pink-500/20 bg-pink-500/5' },
  tiktok: { name: 'TikTok', logo: '🎵', color: 'border-slate-500/20 bg-slate-500/5' },
  x: { name: 'X / Twitter', logo: '𝕏', color: 'border-neutral-500/20 bg-neutral-500/5' },
  facebook: { name: 'Facebook', logo: '📘', color: 'border-blue-500/20 bg-blue-500/5' },
  linkedin: { name: 'LinkedIn', logo: '💼', color: 'border-cyan-500/20 bg-cyan-500/5' },
};

export function CreatorLinkedAccountsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [connections, setConnections] = useState<ProviderConnectionExtended[]>([]);
  const [platforms, setPlatforms] = useState<SocialPlatformInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Method Selection Modal state
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Bio Verification Modal state
  const [bioVerifConn, setBioVerifConn] = useState<ProviderConnectionExtended | null>(null);

  // Read message from router state (e.g. from OAuth callback redirect)
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setActionMessage(state.message);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  async function loadData() {
    try {
      const [connectionsData, platformsData] = await Promise.all([
        getLinkedAccounts(),
        socialIntegrationService.getPlatforms(),
      ]);
      setConnections(connectionsData);
      setPlatforms(platformsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load connections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleConnect = async (platformId: SocialPlatformId) => {
    if (!user) return;
    setActioningId(platformId);
    try {
      const res = await socialIntegrationService.initiateOAuthFlow(platformId, user.id);
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('OAuth start did not return a valid URL.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'OAuth flow initiation failed');
      setActioningId(null);
    }
  };

  const handleInstagramConnectClick = () => {
    const activeConn = connections.find(c => c.provider === 'instagram' && c.status === 'active');
    if (activeConn && !activeConn.ownership_verified) {
      // Show choose verification method modal
      setShowMethodModal(true);
    } else {
      setShowMethodModal(true);
    }
  };

  const handleSelectMethod = async (method: 'oauth' | 'bio') => {
    setShowMethodModal(false);
    if (method === 'oauth') {
      void handleConnect('instagram');
    } else {
      let activeConn = connections.find(c => c.provider === 'instagram');
      if (!activeConn && user) {
        const inputUsername = prompt('Enter your Instagram Username for Bio Verification (e.g. aman__avtr):', '');
        if (!inputUsername || !inputUsername.trim()) return;

        if (!supabase) {
          alert('Supabase client is not configured');
          return;
        }

        const cleanUsername = inputUsername.trim().replace(/^@/, '');
        try {
          const { data: newConn, error: connErr } = await supabase
            .from('provider_connections')
            .upsert({
              user_id: user.id,
              provider: 'instagram',
              provider_username: cleanUsername,
              display_name: cleanUsername,
              status: 'active',
              ownership_verified: false,
              connection_status: 'pending',
              connected_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider' })
            .select()
            .single();

          if (connErr) {
            console.error('Failed to create pending connection:', connErr);
            alert('Failed to initialize Instagram account: ' + connErr.message);
            return;
          }
          activeConn = newConn as any;
          await loadData();
        } catch (err) {
          alert('Failed to initialize connection: ' + (err instanceof Error ? err.message : 'Error'));
          return;
        }
      }

      if (activeConn) {
        setBioVerifConn(activeConn);
      }
    }
  };

  const handleForceSync = async (platformId: SocialPlatformId) => {
    setActioningId(platformId);
    try {
      const conn = connections.find(c => c.provider === platformId);
      if (conn) {
        await socialIntegrationService.forceSyncAccount(conn.id, platformId);
        setActionMessage(`Successfully queued manual sync for ${platformId.toUpperCase()}!`);
        setTimeout(() => setActionMessage(null), 4000);
        await loadData();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger manual sync.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDisconnect = async (platformId: SocialPlatformId) => {
    if (!confirm(`Are you sure you want to disconnect your ${platformId.toUpperCase()} account? Automated metric tracking for submissions on this channel will stop.`)) return;
    setActioningId(platformId);
    try {
      await socialIntegrationService.disconnect(platformId);
      setConnections(prev => prev.filter(c => c.provider !== platformId));
      setActionMessage(`Disconnected ${platformId.toUpperCase()} account successfully.`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect account.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  const displayPlatforms = platforms.length > 0 
    ? platforms.filter(p => PLATFORM_METAS[p.id])
    : Object.keys(PLATFORM_METAS).map(id => ({
        id: id as SocialPlatformId,
        displayName: PLATFORM_METAS[id].name,
        enabled: id === 'youtube',
        apiHealthStatus: 'healthy',
        oauthSupported: true,
      } as any));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Linked Social Accounts</h1>
        <p className="mt-1 text-text-secondary">Manage platform authorizations and ownership verification for automatic submission tracking.</p>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex items-center justify-between animate-fade-in">
          <span>✓ {actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Grid of supported platforms */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayPlatforms.map((platform) => {
          const key = platform.id;
          const meta = PLATFORM_METAS[key] || { name: platform.displayName || key, logo: '🔗', color: 'border-border bg-surface' };
          
          const activeConn = connections.find(c => c.provider === key && c.status === 'active');
          const isExpired = connections.some(c => c.provider === key && c.status === 'expired');
          const isConfiguredOnBackend = platform.enabled;

          const isOwnershipVerified = activeConn?.ownership_verified === true;

          return (
            <div
              key={key}
              className={`surface-card p-5 flex flex-col justify-between space-y-4 border rounded-[24px] ${meta.color} transition hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.logo}</span>
                  <div>
                    <h3 className="font-bold text-text-primary text-base">{meta.name}</h3>
                    {!isConfiguredOnBackend && (
                      <span className="text-[10px] text-text-muted">Integration not active</span>
                    )}
                  </div>
                </div>
                {activeConn ? (
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="success" size="sm">Connected</Badge>
                    {key === 'instagram' && (
                      isOwnershipVerified ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <Icon name="check-circle" size={11} /> Verified Creator
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5">
                          <Icon name="alert-triangle" size={11} /> Unverified
                        </span>
                      )
                    )}
                  </div>
                ) : isExpired ? (
                  <Badge variant="danger" size="sm">Expired</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Linked</Badge>
                )}
              </div>

              {activeConn ? (
                <div className="space-y-3">
                  <div className="bg-surface-elevated/40 rounded-xl p-3 text-xs space-y-2 border border-white/5">
                    <div className="text-text-secondary flex justify-between">
                      <span>Username:</span>
                      <span className="font-bold text-text-primary">@{activeConn.provider_username || 'unknown'}</span>
                    </div>

                    <div className="text-text-secondary flex justify-between">
                      <span>Method 1 (Link Account):</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Icon name="check-circle" size={12} /> Connected
                      </span>
                    </div>

                    {/* Method 2: Instagram Bio Verification Banner */}
                    {key === 'instagram' && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary font-medium">Method 2 (Ownership):</span>
                          {isOwnershipVerified ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Icon name="shield-check" size={12} /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Icon name="alert-circle" size={12} /> Not Verified
                            </span>
                          )}
                        </div>

                        {isOwnershipVerified ? (
                          <div className="rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300 space-y-0.5 border border-emerald-500/20">
                            <div className="font-semibold">Verified using Instagram Bio</div>
                            {activeConn.verified_at && (
                              <div className="text-[10px] text-emerald-400/80">
                                Date verified: {new Date(activeConn.verified_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-300 space-y-2 border border-amber-500/20">
                            <span>Bio ownership verification recommended for campaign submissions.</span>
                            <Button
                              type="button"
                              variant="primary"
                              className="w-full text-xs h-8 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 border-none text-black font-bold flex items-center justify-center gap-1.5 shadow-sm"
                              onClick={() => setBioVerifConn(activeConn)}
                            >
                              <Icon name="shield-check" size={13} />
                              Verify via Bio
                              <span className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">Recommended</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeConn.last_sync_at && (
                      <div className="text-text-secondary flex justify-between text-[11px] pt-1">
                        <span>Last Synced:</span>
                        <span>{new Date(activeConn.last_sync_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {key === 'instagram' && isOwnershipVerified && (
                      <Button
                        variant="outline"
                        className="w-full text-xs h-9 flex items-center justify-center gap-1"
                        onClick={() => setBioVerifConn(activeConn)}
                      >
                        <Icon name="shield" size={13} /> Re-verify Bio
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
                      disabled={actioningId === key}
                      onClick={() => handleForceSync(key)}
                    >
                      <Icon name="refresh-cw" size={13} className={actioningId === key ? 'animate-spin' : ''} /> Sync
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs h-9 flex items-center justify-center gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
                      disabled={actioningId === key}
                      onClick={() => handleDisconnect(key)}
                    >
                      <Icon name="trash-2" size={13} /> Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Authorize CreatorX to sync views and engagement directly from your posts on {meta.name}.
                  </p>
                  <Button
                    variant="primary"
                    className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
                    disabled={!isConfiguredOnBackend || actioningId === key}
                    onClick={() => key === 'instagram' ? handleInstagramConnectClick() : handleConnect(key)}
                  >
                    <Icon name="link" size={13} />
                    {actioningId === key ? 'Initiating OAuth...' : isExpired ? 'Reconnect Account' : 'Connect Account'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Verification Method Selection Modal */}
      <InstagramVerificationMethodModal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        onSelectMethod={handleSelectMethod}
      />

      {/* Instagram Bio Verification Modal Component */}
      {bioVerifConn && (
        <InstagramBioVerificationModal
          isOpen={Boolean(bioVerifConn)}
          onClose={() => setBioVerifConn(null)}
          connection={bioVerifConn}
          onSuccess={() => {
            setActionMessage('Instagram bio ownership verified successfully!');
            loadData();
          }}
        />
      )}
    </div>
  );
}
