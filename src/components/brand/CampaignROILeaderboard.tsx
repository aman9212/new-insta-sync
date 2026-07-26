import { Icon } from '../ui/Icon';

export interface LeaderboardCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verifiedViews: number;
  earningsCents: number;
  complianceRate: number; // 0-100
  badge?: string;
}

export interface CampaignROIMetrics {
  totalBudgetCents: number;
  totalSpentCents: number;
  totalVerifiedViews: number;
  avgCpmCents: number;
  complianceRatePercentage: number;
  creators: LeaderboardCreator[];
}

export function CampaignROILeaderboard({ data }: { data: CampaignROIMetrics }) {
  const formattedSpent = `$${(data.totalSpentCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formattedBudget = `$${(data.totalBudgetCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formattedViews = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(data.totalVerifiedViews);
  const formattedCpm = `$${(data.avgCpmCents / 100).toFixed(2)}`;

  const budgetUsagePercent = data.totalBudgetCents > 0 ? Math.min(100, Math.round((data.totalSpentCents / data.totalBudgetCents) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
            <Icon name="dollar-sign" size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-text-primary">{formattedSpent}</div>
          <div className="text-[11px] text-text-muted">Budget: {formattedBudget} ({budgetUsagePercent}% allocated)</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Reach</span>
            <Icon name="eye" size={16} className="text-accent" />
          </div>
          <div className="text-2xl font-extrabold text-accent">{formattedViews}</div>
          <div className="text-[11px] text-text-muted">100% Graph API verified views</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Effective CPM</span>
            <Icon name="trending-up" size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400">{formattedCpm}</div>
          <div className="text-[11px] text-text-muted">Cost per 1,000 verified views</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Caption Compliance</span>
            <Icon name="check-circle" size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{data.complianceRatePercentage}%</div>
          <div className="text-[11px] text-text-muted">Hashtag & mention rule matching</div>
        </div>
      </div>

      {/* Clipper Leaderboard Table */}
      <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Icon name="award" size={18} className="text-amber-400" />
              Top Performing Creators Leaderboard
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Ranked by verified video reach and caption compliance rate.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-black/30 text-[10px] uppercase font-bold text-text-muted border-b border-border/50">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4 text-right">Verified Views</th>
                <th className="py-3 px-4 text-right">Earnings</th>
                <th className="py-3 px-4 text-center">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.creators.map((creator, idx) => (
                <tr key={creator.id || idx} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4 font-bold text-text-primary">
                    <span className={`inline-grid place-items-center w-6 h-6 rounded-full text-[11px] ${idx === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40 font-extrabold' : idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' : idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' : 'bg-surface-hover text-text-muted'}`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 grid place-items-center font-bold text-accent">
                        {creator.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          {creator.displayName}
                          {creator.badge && (
                            <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 text-[9px] font-mono border border-emerald-500/20">
                              {creator.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">@{creator.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                    {new Intl.NumberFormat('en-US').format(creator.verifiedViews)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ${(creator.earningsCents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {creator.complianceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
