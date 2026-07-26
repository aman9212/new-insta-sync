import { useEffect, useState, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { useBrandCampaigns } from '../../hooks/useCampaigns';
import { listBrandSubmissions } from '../../services/submission.service';
import { StatCard } from '../../components/ui/StatCard';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatCents } from '../../lib/currency';
import type { SubmissionWithJoins } from '../../types';

export function BrandPayoutOverviewPage() {
  const { campaigns, loading: campaignsLoading } = useBrandCampaigns();
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBrandSubmissions()
      .then(setSubmissions)
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load payout overview'))
      .finally(() => setSubmissionsLoading(false));
  }, []);

  const aggregatedStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;

    for (const c of campaigns) {
      totalBudget += Number(c.total_budget_cents);
      totalSpent += Number(c.used_budget_cents);
    }

    return {
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      approvedCount: submissions.filter(s => s.status === 'eligible' || s.status === 'paid').length,
    };
  }, [campaigns, submissions]);

  if (campaignsLoading || submissionsLoading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payout Overview</h1>
        <p className="mt-1 text-text-secondary">Audit and monitor ledger settlements, payouts, and campaign escrow accounts.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Campaign Escrow" value={formatCents(aggregatedStats.totalBudget)} icon={<Icon name="wallet" size={18} />} />
        <StatCard label="Paid / Settled" value={formatCents(aggregatedStats.totalSpent)} icon={<Icon name="credit-card" size={18} className="text-success" />} />
        <StatCard label="Remaining Escrow Balance" value={formatCents(aggregatedStats.remainingBudget)} icon={<Icon name="dollar-sign" size={18} className="text-accent" />} />
      </div>

      {/* Ledger Settlements list */}
      <div className="surface-card p-5 space-y-4">
        <h3 className="text-lg font-bold">Payout Settlements Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 font-medium">Submission ID</th>
                <th className="pb-3 font-medium">Creator</th>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium text-right">Settled Amount</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.filter(s => s.earnings_cents > 0).map(s => (
                <tr key={s.id} className="hover:bg-surface-hover/20">
                  <td className="py-3 font-mono text-xs text-text-muted">{s.id.slice(0, 8)}...</td>
                  <td className="py-3 font-medium text-text-primary">{s.creator_name || 'Creator'}</td>
                  <td className="py-3 text-text-secondary truncate max-w-[150px]">{s.campaign_name}</td>
                  <td className="py-3 text-right tabular-nums text-success font-medium">{formatCents(s.earnings_cents)}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                      ${s.status === 'paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                      {s.status === 'paid' ? 'Paid' : 'Escrow Reserved'}
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
