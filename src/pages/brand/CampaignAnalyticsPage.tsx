import { useBrandSubmissions } from '../../hooks/useSubmissions';
import { StatCard } from '../../components/ui/StatCard';
import { formatCents, formatNumber } from '../../lib/currency';

export function CampaignAnalyticsPage() {
  const { submissions } = useBrandSubmissions();
  const views = submissions.reduce((sum, row) => sum + row.total_views, 0);
  const eligibleViews = submissions.reduce((sum, row) => sum + row.eligible_views, 0);
  const earnings = submissions.reduce((sum, row) => sum + row.earnings_cents, 0);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Campaign analytics</h1>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Submissions" value={submissions.length} />
        <StatCard label="Eligible" value={submissions.filter(s => s.status === 'eligible').length} />
        <StatCard label="Tracked views" value={formatNumber(views)} />
        <StatCard label="Eligible views" value={formatNumber(eligibleViews)} />
        <StatCard label="Creator earnings" value={formatCents(earnings)} />
      </div>
    </div>
  );
}
