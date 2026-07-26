import { useEffect, useState, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { useBrandCampaigns } from '../../hooks/useCampaigns';
import { listBrandSubmissions } from '../../services/submission.service';
import { StatCard } from '../../components/ui/StatCard';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PremiumChart } from '../../components/ui/Chart';
import { formatCents, formatViews, formatNumber } from '../../lib/currency';
import type { SubmissionWithJoins } from '../../types';

export function BrandAnalyticsPage() {
  const { campaigns, loading: campaignsLoading } = useBrandCampaigns();
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'views' | 'spend'>('views');

  useEffect(() => {
    listBrandSubmissions()
      .then(setSubmissions)
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load analytics'))
      .finally(() => setSubmissionsLoading(false));
  }, []);

  const aggregatedStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalViews = 0;
    let totalEligible = 0;

    for (const c of campaigns) {
      totalBudget += Number(c.total_budget_cents);
      totalSpent += Number(c.used_budget_cents);
    }

    for (const s of submissions) {
      totalViews += Number(s.total_views);
      totalEligible += Number(s.eligible_views);
    }

    return {
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      totalViews,
      totalEligible,
      submissionCount: submissions.length,
      approvedCount: submissions.filter(s => s.status === 'eligible' || s.status === 'paid').length,
    };
  }, [campaigns, submissions]);

  const chartData = useMemo(() => {
    if (submissions.length === 0) return [];
    
    const sorted = [...submissions].sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );

    const dayMap = new Map<string, number>();
    for (const s of sorted) {
      const day = new Date(s.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const val = chartMetric === 'views' ? s.total_views : Math.round(s.earnings_cents / 100);
      dayMap.set(day, (dayMap.get(day) ?? 0) + val);
    }

    return [...dayMap.entries()].map(([date, value]) => ({ date, value }));
  }, [submissions, chartMetric]);

  if (campaignsLoading || submissionsLoading) {
    return <TableSkeleton rows={6} cols={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Brand Analytics</h1>
        <p className="mt-1 text-text-secondary">Track budget allocation, overall view metrics, and campaign conversions.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Budget Allocated" value={formatCents(aggregatedStats.totalBudget)} icon={<Icon name="dollar-sign" size={18} />} />
        <StatCard label="Total Spent" value={formatCents(aggregatedStats.totalSpent)} icon={<Icon name="dollar-sign" size={18} className="text-success" />} />
        <StatCard label="Total Views Generated" value={formatViews(aggregatedStats.totalViews)} icon={<Icon name="eye" size={18} />} />
        <StatCard label="Eligible Views" value={formatViews(aggregatedStats.totalEligible)} />
      </div>

      {/* Campaign Details summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Submissions Received" value={formatNumber(aggregatedStats.submissionCount)} icon={<Icon name="file-text" size={18} />} />
        <StatCard label="Approved Submissions" value={formatNumber(aggregatedStats.approvedCount)} />
        <StatCard label="Active Campaigns" value={formatNumber(campaigns.filter(c => c.status === 'active').length)} />
      </div>

      {/* Main Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-sans">Campaign Growth Trends</h2>
          <div className="flex rounded-xl bg-surface border border-border p-1">
            {(['views', 'spend'] as const).map(m => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${chartMetric === m ? 'bg-accent text-black' : 'text-text-muted hover:text-text-primary'}`}
              >
                {m === 'views' ? 'Cumulative Views' : 'Budget Spent'}
              </button>
            ))}
          </div>
        </div>

        <PremiumChart
          data={chartData}
          label={chartMetric === 'views' ? 'Cumulative Views' : 'Total Spend ($)'}
          color={chartMetric === 'spend' ? 'emerald' : 'violet'}
        />
      </div>

      {/* Campaign Performance Table */}
      <div className="surface-card p-5 space-y-4">
        <h3 className="text-lg font-bold">Campaign Progression Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Allocated Budget</th>
                <th className="pb-3 font-medium text-right">Spent Budget</th>
                <th className="pb-3 font-medium text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map(c => {
                const spent = Number(c.used_budget_cents);
                const budget = Number(c.total_budget_cents) || 1;
                const percent = Math.min(100, Math.round((spent / budget) * 100));

                return (
                  <tr key={c.id} className="hover:bg-surface-hover/20">
                    <td className="py-3 font-medium text-text-primary truncate max-w-[200px]">{c.name}</td>
                    <td className="py-3 uppercase text-xs text-text-muted">{c.campaign_type}</td>
                    <td className="py-3 text-right tabular-nums">{formatCents(c.total_budget_cents)}</td>
                    <td className="py-3 text-right tabular-nums text-success font-medium">{formatCents(c.used_budget_cents)}</td>
                    <td className="py-3 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
                        </div>
                        <span>{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
