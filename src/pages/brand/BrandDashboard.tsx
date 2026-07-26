import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { useBrandCampaigns } from '../../hooks/useCampaigns';
import { useBrandSubmissions } from '../../hooks/useSubmissions';
import { formatCents } from '../../lib/currency';
import { useMemo } from 'react';

export function BrandDashboard() {
  const { campaigns } = useBrandCampaigns();
  const { submissions } = useBrandSubmissions();

  const used = campaigns.reduce((sum, campaign) => sum + campaign.used_budget_cents, 0);
  const total = campaigns.reduce((sum, campaign) => sum + campaign.total_budget_cents, 0);

  const budgetUsagePercent = useMemo(() => {
    if (total === 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  }, [used, total]);

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* 1. Symmetrical Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold text-accent tracking-widest uppercase">Analytics Dashboard</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-text-primary via-text-primary to-text-muted bg-clip-text text-transparent">
            Brand dashboard
          </h1>
          <p className="mt-2 text-text-secondary text-base">
            Campaign budgets, creator activity, and review pipeline.
          </p>
        </div>
        <div>
          <Link to="/brand/campaigns/new">
            <Button className="bg-gradient-to-r from-accent to-accent-strong text-white shadow-lg shadow-accent/15">
              Create campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Visual Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total campaigns", value: campaigns.length, iconName: "briefcase", color: "text-accent" },
          { label: "Active campaigns", value: campaigns.filter(c => c.status === 'active').length, iconName: "check-circle", color: "text-emerald-400" },
          { label: "Submissions", value: submissions.length, iconName: "file-stack", color: "text-cyan-400" },
          { label: "Budget used", value: formatCents(used), iconName: "wallet", color: "text-amber-400" },
          { label: "Budget committed", value: formatCents(total), iconName: "trending-up", color: "text-lime-400" }
        ].map((stat, idx) => {
          return (
            <Card key={idx} hover className="relative group overflow-hidden bg-surface/80 border border-white/10 backdrop-blur-2xl p-5 rounded-[28px] shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">{stat.label}</span>
                <span className={`p-2 rounded-2xl bg-surface-elevated ${stat.color} transition-all duration-300 border border-white/10 shadow-inner`}>
                  <Icon name={stat.iconName} size={14} />
                </span>
              </div>
              <div className="text-2xl font-black text-text-primary tracking-tight tabular-nums">
                {stat.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Deep Analysis and Budget Management Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget Usage Section */}
        <Card className="lg:col-span-2 space-y-6 bg-surface/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Icon name="wallet" size={18} className="text-accent" /> Budget Utilization
            </h2>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              {budgetUsagePercent}% Spent
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-bg-secondary h-3 rounded-full overflow-hidden border border-border">
              <div
                className="bg-gradient-to-r from-accent to-accent-strong h-full rounded-full transition-all duration-500"
                style={{ width: `${budgetUsagePercent}%` }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="p-4 rounded-xl border border-border bg-bg-secondary/80">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Spent Budget</span>
                <span className="text-xl font-bold text-text-primary tabular-nums">{formatCents(used)}</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-bg-secondary/80">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Remaining Budget</span>
                <span className="text-xl font-bold text-text-primary tabular-nums">{formatCents(total - used)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        <Card className="flex flex-col justify-between bg-surface/60 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Icon name="star" size={18} className="text-accent" /> AI Campaign Insights
              </h2>
              <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">Active Analysis</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed pt-2">
              Based on recent submissions, budget pacing is on track. Creators with ugc-related clips have achieved 28% higher CTRs.
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-4 bg-bg-secondary/30 -mx-6 -mb-6 p-6">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 mb-1.5">
              <Icon name="alert-circle" size={14} className="text-accent" /> Recommended Actions
            </h4>
            <ul className="space-y-1.5 text-[10px] text-text-secondary">
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-accent rounded-full" />
                Review 4 pending video submissions
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-accent rounded-full" />
                Inject funds into high-performance campaigns
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* 4. Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Quick Mappings
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Campaign List", to: "/brand/campaigns", desc: "Audit and pause existing campaign runs" },
            { title: "Submission Queue", to: "/brand/submissions", desc: "View and accept creator clipping submissions" },
            { title: "Payout Logs", to: "/brand/payouts", desc: "Manage ledger payouts and wallet balance details" }
          ].map((item, idx) => (
            <Card key={idx} hover className="bg-surface/60 hover:bg-surface p-6 border border-border group transition-all duration-300">
              <Link to={item.to} className="space-y-2 block">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors duration-200">{item.title}</h3>
                  <Icon name="chevron-right" size={16} className="text-text-muted group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
