import { useState } from 'react';
import { Icon } from '../ui/Icon';
import type { SocialPlatformId, CreatorSocialAccount } from '../../types/social-integration';
import { socialIntegrationService } from '../../services/social-integration.service';

const allPlatforms: Array<{ id: SocialPlatformId; name: string; icon: string; category: string }> = [
  { id: 'youtube', name: 'YouTube', icon: 'youtube', category: 'Video' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram', category: 'Social' },
  { id: 'tiktok', name: 'TikTok', icon: 'video', category: 'Video' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', category: 'Social' },
  { id: 'x', name: 'X (Twitter)', icon: 'twitter', category: 'Social' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', category: 'Professional' },
  { id: 'twitch', name: 'Twitch', icon: 'twitch', category: 'Streaming' },
  { id: 'kick', name: 'Kick', icon: 'radio', category: 'Streaming' },
  { id: 'discord', name: 'Discord', icon: 'gamepad-2', category: 'Community' },
  { id: 'reddit', name: 'Reddit', icon: 'message-circle', category: 'Community' },
  { id: 'snapchat', name: 'Snapchat', icon: 'ghost', category: 'Social' },
];

export function CreatorSocialAccounts() {
  const [connectedAccounts, setConnectedAccounts] = useState<CreatorSocialAccount[]>([
    {
      id: 'acc_yt_1',
      creatorId: 'c1',
      platformId: 'youtube',
      username: '@alexcreator_yt',
      displayName: 'Alex Rivers Tech',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      followersCount: 384000,
      subscribersCount: 384000,
      verificationStatus: 'verified',
      connectedAt: '2026-01-15T10:00:00Z',
      lastSyncAt: new Date().toISOString(),
      tokenExpired: false,
    },
    {
      id: 'acc_tt_2',
      creatorId: 'c1',
      platformId: 'tiktok',
      username: '@alex_clips',
      displayName: 'Alex Clips',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      followersCount: 890000,
      verificationStatus: 'verified',
      connectedAt: '2026-02-01T14:30:00Z',
      lastSyncAt: new Date().toISOString(),
      tokenExpired: false,
    },
  ]);

  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatformId | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleConnect = async (platformId: SocialPlatformId) => {
    setConnectingPlatform(platformId);
    await socialIntegrationService.initiateOAuthFlow(platformId, 'c1');
    setTimeout(async () => {
      const newAcc = await socialIntegrationService.handleOAuthCallback(platformId, 'code_mock', 'state_mock');
      setConnectedAccounts((prev) => [...prev.filter((a) => a.platformId !== platformId), newAcc]);
      setConnectingPlatform(null);
      setActionMessage(`Successfully connected ${platformId.toUpperCase()} account!`);
      setTimeout(() => setActionMessage(null), 3500);
    }, 1200);
  };

  const handleForceSync = async (account: CreatorSocialAccount) => {
    await socialIntegrationService.forceSyncAccount(account.id);
    setConnectedAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, lastSyncAt: new Date().toISOString() } : a))
    );
    setActionMessage(`Synced data for ${account.username}`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleDisconnect = (account: CreatorSocialAccount) => {
    if (confirm(`Disconnect ${account.username} from CreatorX?`)) {
      setConnectedAccounts((prev) => prev.filter((a) => a.id !== account.id));
      setActionMessage(`Disconnected ${account.username}`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Connected Social Accounts</h2>
          <p className="text-xs text-text-secondary">Link your channels to auto-verify clip submissions, sync follower counts, and unlock payouts.</p>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ {actionMessage}
        </div>
      )}

      {/* Grid of 12 Platforms */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPlatforms.map((p) => {
          const connected = connectedAccounts.find((a) => a.platformId === p.id);
          const isConnecting = connectingPlatform === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 space-y-4 transition ${
                connected ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
                    <Icon name={p.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{p.name}</h3>
                    <span className="text-[10px] text-text-muted">{p.category}</span>
                  </div>
                </div>
                {connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <Icon name="check-circle" size={12} /> Connected
                  </span>
                )}
              </div>

              {connected ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    {connected.avatarUrl && (
                      <img src={connected.avatarUrl} alt={connected.username} className="h-9 w-9 rounded-full object-cover border border-border" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-text-primary">{connected.displayName}</p>
                      <p className="text-[11px] text-text-secondary">{connected.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-y border-border py-2 text-text-secondary">
                    <span>Subscribers / Followers</span>
                    <span className="font-bold text-text-primary">{(connected.followersCount || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleForceSync(connected)}
                      className="rounded-xl border border-border bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-elevated transition flex items-center gap-1"
                    >
                      <Icon name="refresh-cw" size={13} /> Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnect(p.id)}
                      className="rounded-xl border border-border bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
                    >
                      Reconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(connected)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <p className="text-xs text-text-secondary mb-4">Connect your {p.name} channel to enable automated verification.</p>
                  <button
                    type="button"
                    onClick={() => handleConnect(p.id)}
                    disabled={isConnecting}
                    className="w-full rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Icon name="link" size={14} />
                    {isConnecting ? 'Authorizing OAuth...' : `Connect ${p.name}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
