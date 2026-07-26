import { useState } from 'react';
import { Icon } from '../ui/Icon';

export interface CreatorMediaKitData {
  id?: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  trustScore: number; // 0-100
  totalVerifiedViews: number;
  totalEarningsCents: number;
  featuredPlatforms: string[];
  verifiedBadges: string[];
  shareSlug: string;
}

export function CreatorMediaKitCard({ data }: { data: CreatorMediaKitData }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/media-kit/${data.shareSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedViews = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(data.totalVerifiedViews);
  const formattedEarnings = `$${(data.totalEarningsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-surface p-6 shadow-2xl backdrop-blur-xl">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Header Profile Info */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-surface-hover border border-white/15 overflow-hidden grid place-items-center">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={data.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-accent">{data.username.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 border-2 border-surface text-black grid place-items-center" title="Verified Creator Profile">
            <Icon name="check-circle" size={14} />
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-text-primary">{data.displayName}</h2>
            <span className="text-xs font-mono text-text-muted">@{data.username}</span>
          </div>

          <p className="text-xs text-text-secondary line-clamp-2 max-w-lg">{data.bio || 'Verified content creator on CreatorX.'}</p>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
              <Icon name="shield-check" size={12} />
              Trust Score: {data.trustScore}%
            </span>
            {data.verifiedBadges.map((badge, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Icon name="award" size={12} />
                {badge.replace('_', ' ').toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-b border-border/50 py-4">
        <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">Verified Views</span>
          <span className="text-lg font-extrabold text-text-primary">{formattedViews}</span>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">Total Earnings</span>
          <span className="text-lg font-extrabold text-emerald-400">{formattedEarnings}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/5 bg-black/20 p-3 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">Platforms</span>
          <div className="flex items-center gap-2 mt-1">
            {data.featuredPlatforms.map(p => (
              <span key={p} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-text-primary capitalize">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-text-muted flex items-center gap-1.5">
          <Icon name="link" size={13} className="text-accent" />
          <span className="font-mono truncate max-w-[200px]">{shareUrl}</span>
        </div>

        <button
          onClick={handleCopyLink}
          className="w-full sm:w-auto rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition hover:bg-accent-hover flex items-center justify-center gap-1.5 shadow-lg"
        >
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          {copied ? 'Copied Link!' : 'Share Media Kit'}
        </button>
      </div>
    </div>
  );
}
