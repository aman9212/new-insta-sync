import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { getCreatorAnalytics, exportAnalyticsToCSV, getCreatorDailyAnalytics } from '../../services/intelligence.service';
import type { CreatorDailyAnalytics } from '../../services/intelligence.service';
import { listActiveCampaigns } from '../../services/campaign.service';
import { useCreatorSubmissions } from '../../hooks/useSubmissions';
import { StatCard } from '../../components/ui/StatCard';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PremiumChart } from '../../components/ui/Chart';
import { formatCents, formatViews, formatNumber } from '../../lib/currency';
import type { CreatorAnalyticsSummary, CampaignWithJoins } from '../../types';

export function CreatorAnalyticsPage() {
  const [platform, setPlatform] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [campaignId, setCampaignId] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<CreatorAnalyticsSummary[]>([]);
  const [dailyData, setDailyData] = useState<CreatorDailyAnalytics[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'views' | 'eligible' | 'earnings'>('views');

  const { submissions } = useCreatorSubmissions();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    // Fetch campaigns for the filter dropdown
    listActiveCampaigns()
      .then(data => { if (alive) setCampaigns(data); })
      .catch(console.error);

    // Calculate dates based on selected range
    let startDate: string | undefined;
    const now = new Date();
    if (dateRange === '7') {
      startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
    } else if (dateRange === '30') {
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
    } else if (dateRange === '90') {
      startDate = new Date(now.setDate(now.getDate() - 90)).toISOString();
    }

    Promise.all([
      getCreatorAnalytics({ platform, campaignId, startDate }),
      getCreatorDailyAnalytics({ platform, campaignId, startDate })
    ])
      .then(([summaryData, dailyData]) => {
        if (alive) {
          setAnalyticsData(summaryData);
          setDailyData(dailyData);
          setError(null);
        }
      })
      .catch(err => {
        if (alive) setError(err instanceof Error ? err.message : 'Unable to load analytics');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [platform, dateRange, campaignId]);

  // Aggregate stats based on currently loaded analytics summaries
  const aggregatedStats = useMemo(() => {
    let rawViews = 0;
    let verifiedViews = 0;
    let eligibleViews = 0;
    let earningsCents = 0;
    let paidEarningsCents = 0;
    let totalSubmissions = 0;
    let approvedSubmissions = 0;

    for (const item of analyticsData) {
      rawViews += Number(item.total_raw_views);
      verifiedViews += Number(item.total_verified_views);
      eligibleViews += Number(item.total_eligible_views);
      earningsCents += Number(item.total_earnings_cents);
      paidEarningsCents += Number(item.paid_earnings_cents);
      totalSubmissions += Number(item.total_submissions);
      approvedSubmissions += Number(item.approved_submissions);
    }

    const activeCampaigns = new Set(analyticsData.map(a => a.campaign_id)).size;

    return {
      rawViews,
      verifiedViews,
      eligibleViews,
      pendingEarningsCents: earningsCents - paidEarningsCents,
      paidEarningsCents,
      totalSubmissions,
      approvedSubmissions,
      activeCampaigns,
    };
  }, [analyticsData]);

  // Generate chart data series over time (grouped by day)
  const chartData = useMemo(() => {
    return dailyData.map(item => {
      let val = Number(item.raw_views);
      if (chartMetric === 'eligible') val = Number(item.eligible_views);
      else if (chartMetric === 'earnings') val = centsToDollars(Number(item.credited_earnings) + Number(item.pending_earnings));
      
      return {
        date: new Date(item.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: val,
      };
    });
  }, [dailyData, chartMetric]);

  // Helper helper to convert cents to dollars for the chart display
  function centsToDollars(cents: number) {
    return Math.round(cents) / 100;
  }

  // Campaigns performance secondary analytics table
  const campaignPerformance = useMemo(() => {
    const map = new Map<string, {
      name: string;
      submissions: number;
      rawViews: number;
      verifiedViews: number;
      eligibleViews: number;
      earnings: number;
      approved: number;
    }>();

    for (const sub of submissions) {
      const cId = sub.campaign_id;
      const current = map.get(cId) ?? {
        name: sub.campaign_name ?? cId,
        submissions: 0,
        rawViews: 0,
        verifiedViews: 0,
        eligibleViews: 0,
        earnings: 0,
        approved: 0,
      };

      current.submissions++;
      current.rawViews += sub.total_views;
      current.verifiedViews += sub.total_views; // verified = raw_views in existing views mapping
      current.eligibleViews += sub.eligible_views;
      current.earnings += sub.earnings_cents;
      if (sub.status === 'eligible' || sub.status === 'paid') {
        current.approved++;
      }
      map.set(cId, current);
    }

    return [...map.values()];
  }, [submissions]);

  // Platforms performance secondary analytics table
  const platformPerformance = useMemo(() => {
    const map = new Map<string, {
      platform: string;
      accounts: number;
      submissions: number;
      rawViews: number;
      verifiedViews: number;
      eligibleViews: number;
      earnings: number;
    }>();

    for (const sub of submissions) {
      const plat = sub.platform;
      const current = map.get(plat) ?? {
        platform: plat,
        accounts: 1, // Assume 1 for simplicity of grouped view
        submissions: 0,
        rawViews: 0,
        verifiedViews: 0,
        eligibleViews: 0,
        earnings: 0,
      };

      current.submissions++;
      current.rawViews += sub.total_views;
      current.verifiedViews += sub.total_views;
      current.eligibleViews += sub.eligible_views;
      current.earnings += sub.earnings_cents;
      map.set(plat, current);
    }

    return [...map.values()];
  }, [submissions]);

  // Export analytics to CSV
  function handleCSVExport() {
    const csvContent = exportAnalyticsToCSV(analyticsData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `creatorx_analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && analyticsData.length === 0) {
    return <TableSkeleton rows={8} cols={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-text-secondary">Comprehensive verification analytics and performance summaries.</p>
        </div>
        <button
          onClick={handleCSVExport}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-surface-elevated border border-border hover:bg-surface-hover text-text-primary text-sm font-medium transition-colors"
        >
          <Icon name="download" size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-surface p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <Icon name="filter" size={15} className="text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">Filter by:</span>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:flex sm:items-center">
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="x">X / Twitter</option>
            <option value="facebook">Facebook</option>
          </select>
          <select
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm text-text-primary focus:border-accent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified Views" value={formatViews(aggregatedStats.verifiedViews)} icon={<Icon name="eye" size={18} />} />
        <StatCard label="Eligible Views" value={formatViews(aggregatedStats.eligibleViews)} />
        <StatCard label="Pending Earnings" value={formatCents(aggregatedStats.pendingEarningsCents)} icon={<Icon name="dollar-sign" size={18} className="text-warning" />} />
        <StatCard label="Paid Earnings" value={formatCents(aggregatedStats.paidEarningsCents)} icon={<Icon name="dollar-sign" size={18} className="text-success" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Submissions" value={formatNumber(aggregatedStats.totalSubmissions)} icon={<Icon name="file-text" size={18} />} />
        <StatCard label="Approved Submissions" value={formatNumber(aggregatedStats.approvedSubmissions)} />
        <StatCard label="Active Campaigns" value={formatNumber(aggregatedStats.activeCampaigns)} />
      </div>

      {/* Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Metrics Performance</h2>
          <div className="flex rounded-xl bg-surface border border-border p-1">
            {(['views', 'eligible', 'earnings'] as const).map(m => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${chartMetric === m ? 'bg-accent text-black' : 'text-text-muted hover:text-text-primary'}`}
              >
                {m === 'views' ? 'Raw Views' : m === 'eligible' ? 'Eligible Views' : 'Earnings'}
              </button>
            ))}
          </div>
        </div>
        
        <PremiumChart
          data={chartData}
          label={chartMetric === 'views' ? 'Raw Views' : chartMetric === 'eligible' ? 'Eligible Views' : 'Earnings ($)'}
          color={chartMetric === 'earnings' ? 'emerald' : 'violet'}
        />
      </div>

      {/* Secondary Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaigns performance summary table */}
        <div className="surface-card p-5 space-y-4">
          <h3 className="text-lg font-bold">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium text-right">Clips</th>
                  <th className="pb-3 font-medium text-right">Verified Views</th>
                  <th className="pb-3 font-medium text-right">Earnings</th>
                  <th className="pb-3 font-medium text-right">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaignPerformance.map(cp => (
                  <tr key={cp.name} className="hover:bg-surface-hover/30">
                    <td className="py-3 font-medium text-text-primary truncate max-w-[150px]">{cp.name}</td>
                    <td className="py-3 text-right tabular-nums">{cp.submissions}</td>
                    <td className="py-3 text-right tabular-nums">{formatViews(cp.verifiedViews)}</td>
                    <td className="py-3 text-right tabular-nums text-success font-medium">{formatCents(cp.earnings)}</td>
                    <td className="py-3 text-right tabular-nums">
                      {cp.submissions > 0 ? `${Math.round((cp.approved / cp.submissions) * 100)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platforms performance summary table */}
        <div className="surface-card p-5 space-y-4">
          <h3 className="text-lg font-bold">Platform Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="pb-3 font-medium">Platform</th>
                  <th className="pb-3 font-medium text-right">Submissions</th>
                  <th className="pb-3 font-medium text-right">Verified Views</th>
                  <th className="pb-3 font-medium text-right">Eligible Views</th>
                  <th className="pb-3 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {platformPerformance.map(pp => (
                  <tr key={pp.platform} className="hover:bg-surface-hover/30">
                    <td className="py-3 font-medium text-text-primary capitalize">{pp.platform}</td>
                    <td className="py-3 text-right tabular-nums">{pp.submissions}</td>
                    <td className="py-3 text-right tabular-nums">{formatViews(pp.rawViews)}</td>
                    <td className="py-3 text-right tabular-nums">{formatViews(pp.eligibleViews)}</td>
                    <td className="py-3 text-right tabular-nums text-success font-medium">{formatCents(pp.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
