import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { getLinkedAccounts, disconnectAccount } from '../../services/intelligence.service';
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

  // Read message from router state
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

  const handleAddInstagramAccount = () => {
    setShowMethodModal(true);
  };

  const handleSelectMethod = async (method: 'oauth' | 'bio') => {
    setShowMethodModal(false);
    if (method === 'oauth') {
      void handleConnect('instagram');
    } else {
      if (!user) return;

      const inputUsername = prompt('Enter Instagram Username to link (e.g. aman__avtr):', '');
      if (!inputUsername || !inputUsername.trim()) return;

      if (!supabase) {
        alert('Supabase client is not configured');
        return;
      }

      const cleanUsername = inputUsername.trim().replace(/^@/, '').toLowerCase();

      // Check if handle already exists
      const existing = connections.find(
        c => c.provider === 'instagram' && (c.provider_username || '').toLowerCase() === cleanUsername && c.status === 'active'
      );

      if (existing) {
        setBioVerifConn(existing);
        return;
      }

      try {
        const { data: newConn, error: connErr } = await supabase
          .from('provider_connections')
          .insert({
            user_id: user.id,
            provider: 'instagram',
            provider_username: cleanUsername,
            display_name: cleanUsername,
            status: 'active',
            ownership_verified: false,
            connection_status: 'pending',
            connected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (connErr) {
          console.error('Failed to create Instagram connection:', connErr);
          alert('Failed to initialize Instagram account: ' + connErr.message);
          return;
        }

        setActionMessage(`Added @${cleanUsername}! Please complete bio ownership verification.`);
        await loadData();
        setBioVerifConn(newConn as ProviderConnectionExtended);
      } catch (err) {
        alert('Failed to initialize connection: ' + (err instanceof Error ? err.message : 'Error'));
      }
    }
  };

  const handleForceSync = async (connectionId: string, platformId: SocialPlatformId) => {
    setActioningId(connectionId);
    try {
      await socialIntegrationService.forceSyncAccount(connectionId, platformId);
      setActionMessage(`Successfully queued manual sync!`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger manual sync.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDisconnectByConn = async (connectionId: string, handleName: string) => {
    if (!confirm(`Are you sure you want to disconnect @${handleName}? Automated metric tracking for this account will stop.`)) return;
    setActioningId(connectionId);
    try {
      await disconnectAccount(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      setActionMessage(`Disconnected @${handleName} successfully.`);
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
        enabled: id === 'youtube' || id === 'instagram',
        apiHealthStatus: 'healthy',
        oauthSupported: true,
      } as any));

  const instagramConns = connections.filter(c => c.provider === 'instagram' && c.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-text-primary">Linked Social Accounts</h1>
        <p className="mt-1 text-xs sm:text-sm text-text-secondary">
          Manage platform authorizations and ownership verification for automatic submission tracking.
        </p>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm text-emerald-400 flex items-center justify-between animate-fade-in">
          <span className="font-medium">✓ {actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs sm:text-sm text-danger">{error}</div>
      )}

      {/* Grid of supported platforms */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayPlatforms.map((platform) => {
          const key = platform.id;
          const meta = PLATFORM_METAS[key] || { name: platform.displayName || key, logo: '🔗', color: 'border-border bg-surface' };
          const isConfiguredOnBackend = platform.enabled;

          // Instagram Special Multi-Account Card
          if (key === 'instagram') {
            return (
              <div
                key={key}
                className={`surface-card p-4 flex flex-col justify-between space-y-3.5 border rounded-2xl ${meta.color} transition-all hover:shadow-md`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{meta.logo}</span>
                    <div>
                      <h3 className="font-bold text-text-primary text-sm sm:text-base">{meta.name}</h3>
                      <span className="text-[10px] text-text-muted">Multi-ID Account Sync</span>
                    </div>
                  </div>
                  <Badge variant={instagramConns.length > 0 ? 'success' : 'neutral'} size="sm">
                    {instagramConns.length > 0 ? `${instagramConns.length} Connected` : 'Not Linked'}
                  </Badge>
                </div>

                {/* List of Connected Instagram Accounts */}
                {instagramConns.length > 0 ? (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {instagramConns.map((conn) => {
                      const isVerified = conn.ownership_verified === true;
                      return (
                        <div
                          key={conn.id}
                          className="bg-surface-elevated/60 rounded-xl p-3 text-xs space-y-2 border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-primary text-xs">@{conn.provider_username || 'handle'}</span>
                            {isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <Icon name="check-circle" size={10} /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Icon name="alert-triangle" size={10} /> Unverified
                              </span>
                            )}
                          </div>

                          {!isVerified && (
                            <div className="rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-300 flex items-center justify-between border border-amber-500/20">
                              <span>Bio verification recommended</span>
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 text-[10px] px-2 bg-gradient-to-r from-amber-500 to-pink-500 text-black font-bold border-none"
                                onClick={() => setBioVerifConn(conn)}
                              >
                                Verify Bio
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-1/2 h-7 text-[11px] px-2 flex items-center justify-center gap-1"
                              disabled={actioningId === conn.id}
                              onClick={() => handleForceSync(conn.id, 'instagram')}
                            >
                              <Icon name="refresh-cw" size={11} className={actioningId === conn.id ? 'animate-spin' : ''} /> Sync
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-1/2 h-7 text-[11px] px-2 flex items-center justify-center gap-1 text-danger hover:bg-danger/10 hover:text-danger"
                              disabled={actioningId === conn.id}
                              onClick={() => handleDisconnectByConn(conn.id, conn.provider_username || 'handle')}
                            >
                              <Icon name="trash-2" size={11} /> Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Link your Instagram handles to track views and engagement directly from your posts.
                  </p>
                )}

                {/* Compact Add Another Instagram Account Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-semibold border-dashed border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 flex items-center justify-center gap-1.5"
                  onClick={handleAddInstagramAccount}
                >
                  <Icon name="plus" size={13} />
                  {instagramConns.length > 0 ? '+ Add Another Instagram ID' : 'Connect Instagram ID'}
                </Button>
              </div>
            );
          }

          // Single-connection platforms (YouTube, Facebook, TikTok, X, LinkedIn)
          const activeConn = connections.find(c => c.provider === key && c.status === 'active');
          const isExpired = connections.some(c => c.provider === key && c.status === 'expired');

          return (
            <div
              key={key}
              className={`surface-card p-4 flex flex-col justify-between space-y-3 border rounded-2xl ${meta.color} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{meta.logo}</span>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">{meta.name}</h3>
                    {!isConfiguredOnBackend && (
                      <span className="text-[10px] text-text-muted">Integration not active</span>
                    )}
                  </div>
                </div>
                {activeConn ? (
                  <Badge variant="success" size="sm">Connected</Badge>
                ) : isExpired ? (
                  <Badge variant="danger" size="sm">Expired</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Linked</Badge>
                )}
              </div>

              {activeConn ? (
                <div className="space-y-2.5">
                  <div className="bg-surface-elevated/40 rounded-xl p-2.5 text-xs space-y-1 border border-white/5">
                    <div className="text-text-secondary flex justify-between">
                      <span>Username:</span>
                      <span className="font-bold text-text-primary">@{activeConn.provider_username || 'connected'}</span>
                    </div>
                    {activeConn.last_sync_at && (
                      <div className="text-text-secondary flex justify-between text-[10px]">
                        <span>Last Synced:</span>
                        <span>{new Date(activeConn.last_sync_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 h-8 text-xs font-semibold flex items-center justify-center gap-1"
                      disabled={actioningId === activeConn.id}
                      onClick={() => handleForceSync(activeConn.id, key)}
                    >
                      <Icon name="refresh-cw" size={12} className={actioningId === activeConn.id ? 'animate-spin' : ''} /> Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 h-8 text-xs font-semibold flex items-center justify-center gap-1 text-danger hover:bg-danger/10 hover:text-danger"
                      disabled={actioningId === activeConn.id}
                      onClick={() => handleDisconnectByConn(activeConn.id, activeConn.provider_username || key)}
                    >
                      <Icon name="trash-2" size={12} /> Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Authorize CreatorX to sync views and engagement directly from {meta.name}.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                    disabled={!isConfiguredOnBackend || actioningId === key}
                    onClick={() => handleConnect(key)}
                  >
                    <Icon name="link" size={12} />
                    {actioningId === key ? 'Connecting...' : isExpired ? 'Reconnect' : 'Connect Account'}
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
