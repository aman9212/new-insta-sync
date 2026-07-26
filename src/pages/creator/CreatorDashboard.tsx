import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { CampaignGrid } from '../../components/campaigns/CampaignGrid';
import { SubmissionTable } from '../../components/submissions/SubmissionTable';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useCreatorSubmissions } from '../../hooks/useSubmissions';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { formatCents, formatViews } from '../../lib/currency';
import { getCreatorActionItems } from '../../services/intelligence.service';
import type { CreatorActionItem } from '../../services/intelligence.service';

export function CreatorDashboard() {
  const { wallet } = useWallet();
  const { campaigns } = useCampaigns({ sort: 'rate' });
  const { submissions } = useCreatorSubmissions();
  const { profile, user } = useAuth();
  const [actions, setActions] = useState<CreatorActionItem[]>([]);

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? "Creator";

  useEffect(() => {
    getCreatorActionItems()
      .then(data => setActions(data))
      .catch(console.error);
  }, []);

  // Display-only earnings forecast calculation
  const forecast = useMemo(() => {
    let totalEligibleViews = 0;
    let totalEstimatedEarnings = 0;

    for (const sub of submissions) {
      if (sub.status === 'processing' || sub.status === 'eligible' || sub.status === 'under_review') {
        const views = sub.eligible_views || sub.total_views || 0;
        totalEligibleViews += views;
        totalEstimatedEarnings += sub.earnings_cents || 0;
      }
    }

    return {
      eligibleViews: totalEligibleViews,
      estimatedEarningsCents: totalEstimatedEarnings,
    };
  }, [submissions]);

  // Goal Progress (e.g. reach $500.00 this month)
  const goalProgressPercent = useMemo(() => {
    const currentBalance = wallet?.available_balance_cents ?? 0;
    const targetCents = 50000; // $500 target
    return Math.min(Math.round((currentBalance / targetCents) * 100), 100);
  }, [wallet]);

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* 1. Large Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold text-accent tracking-widest uppercase">Overview</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-text-primary via-text-primary to-text-muted bg-clip-text text-transparent">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-text-secondary text-base">
            Track submissions, earnings, and high-fit campaign opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/creator/explore">
            <Button className="bg-gradient-to-r from-accent to-accent-strong text-white shadow-lg shadow-accent/15">
              <Icon name="compass" size={16} /> Explore campaigns
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Action Center / System Alerts */}
      {actions.length > 0 && (
        <Card variant="glass" className="border-accent/10 relative overflow-hidden bg-accent/[0.01]">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Icon name="shield-alert" size={18} className="text-accent" /> Action Center
          </h2>
          <div className="grid gap-3">
            {actions.map((item, idx) => {
              const isCritical = item.priority === 'Critical';
              const isImportant = item.priority === 'Important';
              return (
                <div
                  key={idx}
                  className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-300
                    ${isCritical ? 'bg-danger/5 border-danger/25 hover:bg-danger/10' :
                      isImportant ? 'bg-warning/5 border-warning/25 hover:bg-warning/10' :
                      'bg-surface-elevated/40 border-border hover:bg-surface-hover'}`}
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 shrink-0">
                      {isCritical ? <Icon name="shield-alert" size={18} className="text-danger" /> :
                       isImportant ? <Icon name="alert-triangle" size={18} className="text-warning" /> :
                       <Icon name="info" size={18} className="text-accent" />}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                      <p className="text-xs text-text-secondary mt-1">{item.description}</p>
                    </div>
                  </div>
                  <Link to={item.target_route}>
                    <Button size="sm" variant="secondary" className="shrink-0">Resolve</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. Stat Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available balance", value: formatCents(wallet?.available_balance_cents ?? 0), iconName: "wallet", color: "text-accent" },
          { label: "Pending earnings", value: formatCents(wallet?.pending_balance_cents ?? 0), iconName: "trending-up", color: "text-amber-400" },
          { label: "Lifetime earnings", value: formatCents(wallet?.lifetime_earnings_cents ?? 0), iconName: "trophy", color: "text-emerald-400" },
          { label: "Active submissions", value: submissions.filter(s => s.status === 'processing' || s.status === 'eligible').length, iconName: "check-circle", color: "text-cyan-400" }
        ].map((stat, idx) => {
          return (
            <Card key={idx} hover className="relative group overflow-hidden bg-surface/80 border border-white/10 backdrop-blur-2xl p-6 rounded-[28px] shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-wider text-text-secondary uppercase">{stat.label}</span>
                <span className={`p-2.5 rounded-2xl bg-surface-elevated ${stat.color} transition-all duration-300 border border-white/10 shadow-inner`}>
                  <Icon name={stat.iconName} size={18} />
                </span>
              </div>
              <div className="text-3xl font-black text-text-primary tracking-tight tabular-nums">
                {stat.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 4. Forecast & Goals Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forecast Column */}
        <Card className="lg:col-span-2 space-y-5 bg-surface/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Icon name="trending-up" size={18} className="text-accent" /> Estimated Earnings Forecast
            </h2>
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 uppercase tracking-wider">
              Real-time Simulation
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-bg-secondary border border-border p-5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Projected Views</span>
              <div className="text-2xl font-black text-text-primary tabular-nums">{formatViews(forecast.eligibleViews)}</div>
            </div>
            <div className="bg-bg-secondary border border-border p-5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Estimated Pending Earnings</span>
              <div className="text-2xl font-black text-text-primary tabular-nums">{formatCents(forecast.estimatedEarningsCents)}</div>
            </div>
          </div>

          <div className="bg-surface-elevated/40 border border-border p-4 rounded-xl flex items-start gap-3">
            <span className="mt-0.5 text-accent shrink-0"><Icon name="info" size={16} /></span>
            <div>
              <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Authority Warning</span>
              <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                Forecasts are computed clientside using historical campaign metrics. Actual payouts are audited by admins and depend on campaign RLS compliance.
              </p>
            </div>
          </div>
        </Card>

        {/* Goals & Achievements Column */}
        <Card className="flex flex-col justify-between bg-surface/60 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Icon name="trophy" size={18} className="text-accent" /> Active Goal
              </h2>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Monthly milestone</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-end text-xs">
                <span className="text-text-secondary">Progress towards $500 target</span>
                <span className="font-bold text-text-primary">{goalProgressPercent}%</span>
              </div>
              <div className="w-full bg-bg-secondary h-2.5 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-gradient-to-r from-accent to-accent-strong h-full rounded-full transition-all duration-500"
                  style={{ width: `${goalProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-text-secondary">
                {goalProgressPercent >= 100 
                  ? "🎉 You have achieved your balance target milestone!"
                  : `Earn ${formatCents(50000 - (wallet?.available_balance_cents ?? 0))} more to reach your $500.00 payout milestone.`}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 bg-bg-secondary/30 -mx-6 -mb-6 p-6 flex items-start gap-3">
            <Icon name="star" size={16} className="text-accent mt-0.5 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-text-primary">AI Recommendation Insights</h4>
              <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
                Campaign rates matching your history are up by 22% this week. Submit key clips to maximize pending earnings.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Recommended Campaigns */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            Recommended campaigns
          </h2>
          <Link to="/creator/explore" className="text-xs text-accent hover:underline font-semibold flex items-center gap-1">
            See all campaign listings <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <CampaignGrid campaigns={campaigns.slice(0, 3)} />
      </section>

      {/* 6. Recent Submissions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Recent submissions
        </h2>
        <div className="overflow-hidden rounded-[20px] border border-border shadow-md">
          <SubmissionTable submissions={submissions.slice(0, 5)} />
        </div>
      </section>
    </div>
  );
}
