import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import {
  listAdminTable,
  getSystemHealth,
  adminModerateCampaign
} from '../../services/admin.service';
import type { SystemHealthData } from '../../services/admin.service';
import { formatCents } from '../../lib/currency';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [flaggedSubmissions, setFlaggedSubmissions] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [profiles, brands, campaigns, submissions, withdrawals, healthData] = await Promise.all([
        listAdminTable('profiles'),
        listAdminTable('brands'),
        listAdminTable('campaigns'),
        listAdminTable('submissions'),
        listAdminTable('withdrawals'),
        getSystemHealth().catch(() => [] as SystemHealthData[])
      ]);

      setCounts({
        users: profiles.length,
        creators: profiles.filter((row: any) => row.role === 'creator').length,
        brands: brands.length,
        campaigns: campaigns.length,
        submissions: submissions.length,
        pendingWithdrawalsCount: withdrawals.filter((row: any) => row.status === 'pending').length,
      });

      // Filter Pending campaigns queue
      setPendingCampaigns(campaigns.filter((row: any) => row.status === 'pending_review'));

      // Filter Flagged/verification-hold submissions queue
      setFlaggedSubmissions(
        submissions.filter(
          (row: any) => row.status === 'under_review' || row.payout_status === 'verification_hold'
        )
      );

      // Filter Pending withdrawal requests queue
      setPendingWithdrawals(withdrawals.filter((row: any) => row.status === 'pending'));

      if (healthData && healthData.length > 0) {
        setHealth(healthData[0]);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  async function handleApproveCampaign(id: string) {
    if (!confirm('Approve this campaign to make it active?')) return;
    setActioningId(id);
    try {
      await adminModerateCampaign(id, 'active');
      alert('Campaign approved and marked active.');
      await loadAllData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleRejectCampaign(id: string) {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    setActioningId(id);
    try {
      await adminModerateCampaign(id, 'rejected', reason);
      alert('Campaign rejected.');
      await loadAllData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleApproveWithdrawal(id: string) {
    if (!confirm('Approve and process this withdrawal?')) return;
    setActioningId(id);
    try {
      if (!supabase) throw new Error('Supabase client is not configured');
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'paid', completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      alert('Withdrawal approved and marked paid.');
      await loadAllData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleRejectWithdrawal(id: string) {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    setActioningId(id);
    try {
      if (!supabase) throw new Error('Supabase client is not configured');
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id);
      if (error) throw error;
      alert('Withdrawal rejected.');
      await loadAllData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActioningId(null);
    }
  }

  const databaseSizeFormatted = useMemo(() => {
    if (!health?.database_size_bytes) return 'Unknown';
    return `${(health.database_size_bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [health]);

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold text-accent tracking-widest uppercase text-gradient">Console Panel</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-text-primary via-text-primary to-text-muted bg-clip-text text-transparent">
            Admin operations dashboard
          </h1>
          <p className="mt-2 text-text-secondary text-base">
            Unified operations, queues, system health and metrics.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={loadAllData}
            disabled={loading}
            className="gap-2 border border-border shadow-sm"
          >
            <Icon name="refresh" size={14} animation={loading ? 'spin' : undefined} /> Refresh Queues
          </Button>
        </div>
      </div>

      {/* 2. Operations Grid Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Total Users", value: counts.users ?? 0, iconName: "users", color: "text-accent" },
          { label: "Creators", value: counts.creators ?? 0, iconName: "users", color: "text-cyan-400" },
          { label: "Brands", value: counts.brands ?? 0, iconName: "users", color: "text-emerald-400" },
          { label: "Campaigns", value: counts.campaigns ?? 0, iconName: "briefcase", color: "text-lime-400" },
          { label: "Submissions", value: counts.submissions ?? 0, iconName: "file-stack", color: "text-amber-400" },
          { label: "Pending Withdrawals", value: counts.pendingWithdrawalsCount ?? 0, iconName: "shield-alert", color: "text-rose-400" }
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

      {/* 3. System Health Panel */}
      <Card variant="glass" className="relative overflow-hidden bg-accent/[0.01]">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Icon name="activity" size={18} className="text-accent" /> System Health Panel
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" /> Operational
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-4">
          <div className="bg-bg-secondary/80 border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="database" size={12} className="text-accent" /> DB Size
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums">{databaseSizeFormatted}</div>
          </div>
          <div className="bg-bg-secondary/80 border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="cpu" size={12} className="text-accent" /> Connection Load
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums">{health?.active_cron_jobs ?? 0} active</div>
          </div>
          <div className="bg-bg-secondary/80 border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="activity" size={12} className="text-accent" /> Sync Queue
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums">{health?.sync_queue_size ?? 0} processing</div>
          </div>
          <div className="bg-bg-secondary/80 border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="shield-alert" size={12} className="text-accent" /> Youtube API
            </span>
            <div className="text-2xl font-black text-green-400 flex items-center gap-1.5">
              <Icon name="check" size={20} /> {health?.youtube_api_status ?? 'Operational'}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Queue Grids */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending campaigns queue */}
        <Card className="bg-surface/60 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">Pending Campaigns Review</h3>
              <Badge variant="warning">{pendingCampaigns.length}</Badge>
            </div>
            <div className="divide-y divide-border max-h-[350px] overflow-y-auto pr-2">
              {pendingCampaigns.length === 0 ? (
                <p className="text-xs text-text-muted py-12 text-center">No campaigns awaiting review</p>
              ) : (
                pendingCampaigns.map((camp: any) => (
                  <div key={camp.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{camp.name}</h4>
                      <p className="text-xs text-text-secondary mt-1">Budget: {formatCents(camp.total_budget_cents)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApproveCampaign(camp.id)}
                        disabled={actioningId === camp.id}
                        className="text-[11px] font-bold h-8 px-2.5 bg-green-500 hover:bg-green-400 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRejectCampaign(camp.id)}
                        disabled={actioningId === camp.id}
                        className="text-[11px] font-bold h-8 px-2.5 text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Flagged submissions queue */}
        <Card className="bg-surface/60 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">Flagged / Review Submissions</h3>
              <Badge variant="danger">{flaggedSubmissions.length}</Badge>
            </div>
            <div className="divide-y divide-border max-h-[350px] overflow-y-auto pr-2">
              {flaggedSubmissions.length === 0 ? (
                <p className="text-xs text-text-muted py-12 text-center">No submissions flagged for review</p>
              ) : (
                flaggedSubmissions.map((sub: any) => (
                  <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <div className="text-sm font-bold text-text-primary truncate">Post ID: {sub.external_post_id || sub.id}</div>
                      <p className="text-xs text-text-secondary mt-1 truncate uppercase font-semibold">{sub.platform} · {sub.status}</p>
                    </div>
                    <Link to="/admin/fraud">
                      <Button size="sm" variant="secondary" className="text-xs h-8 gap-1 border border-border shadow-sm shrink-0">
                        Audit Queue <Icon name="arrow-right" size={12} />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Pending withdrawals queue */}
        <Card className="bg-surface/60 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-base font-bold text-text-primary">Pending Payout Requests</h3>
            <Badge variant="warning">{pendingWithdrawals.length}</Badge>
          </div>
          <div className="divide-y divide-border max-h-[350px] overflow-y-auto pr-2">
            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-text-muted py-12 text-center">No pending withdrawal requests</p>
            ) : (
              pendingWithdrawals.map((withdraw: any) => (
                <div key={withdraw.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Amount: {formatCents(withdraw.amount_cents)}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">Requested on {new Date(withdraw.requested_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveWithdrawal(withdraw.id)}
                      disabled={actioningId === withdraw.id}
                      className="text-[11px] font-bold h-8 px-2.5 bg-green-500 hover:bg-green-400 text-white"
                    >
                      Approve Payout
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRejectWithdrawal(withdraw.id)}
                      disabled={actioningId === withdraw.id}
                      className="text-[11px] font-bold h-8 px-2.5 text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
