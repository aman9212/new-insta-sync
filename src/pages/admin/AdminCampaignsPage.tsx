import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import {
  listAllAdminCampaigns,
  getAdminCampaignDashboardStats,
  saveAdminCampaign,
  duplicateAdminCampaign,
  updateAdminCampaignStatus,
  deleteAdminCampaign,
  listCampaignTemplates,
  createCampaignTemplate,
  listCampaignCategories,
  saveCampaignCategory,
  getCampaignLeaderboard,
  generateCampaignReport
} from '../../services/campaign-management.service';
import type {
  EnterpriseCampaign,
  AdminCampaignDashboardStats,
  CampaignTemplate,
  CampaignCategory,
  ExtendedCampaignStatus,
  ExtendedPlatform,
  CampaignLeaderboardEntry
} from '../../types/campaign-management';

type AdminSubView =
  | 'dashboard'
  | 'all-campaigns'
  | 'create'
  | 'templates'
  | 'categories'
  | 'rewards'
  | 'verification'
  | 'targeting'
  | 'assets'
  | 'analytics'
  | 'leaderboard'
  | 'reports'
  | 'settings';

export function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState<AdminSubView>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [stats, setStats] = useState<AdminCampaignDashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<EnterpriseCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [leaderboard, setLeaderboard] = useState<CampaignLeaderboardEntry | null>(null);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Edit & Modal State
  const [editingCampaign, setEditingCampaign] = useState<Partial<EnterpriseCampaign> | null>(null);
  const [templateJsonModal, setTemplateJsonModal] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [sData, cData, tData, catData, lbData] = await Promise.all([
        getAdminCampaignDashboardStats(),
        listAllAdminCampaigns(statusFilter),
        listCampaignTemplates(),
        listCampaignCategories(),
        getCampaignLeaderboard(undefined, leaderboardTimeframe)
      ]);
      setStats(sData);
      setCampaigns(cData);
      setTemplates(tData);
      setCategories(catData);
      setLeaderboard(lbData);
    } catch (err) {
      console.error('Failed loading campaign management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, [statusFilter, leaderboardTimeframe]);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Status state transition handler
  async function handleStatusChange(id: string, newStatus: ExtendedCampaignStatus) {
    try {
      await updateAdminCampaignStatus(id, newStatus);
      showToast(`Campaign status updated to ${newStatus.toUpperCase()}`);
      void refreshData();
    } catch {
      showToast('Failed to update campaign status');
    }
  }

  // Duplicate handler
  async function handleDuplicate(id: string) {
    try {
      await duplicateAdminCampaign(id);
      showToast('Campaign duplicated as Draft');
      void refreshData();
    } catch {
      showToast('Failed to duplicate campaign');
    }
  }

  // Delete handler
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to permanently delete this campaign?')) return;
    try {
      await deleteAdminCampaign(id);
      showToast('Campaign deleted successfully');
      void refreshData();
    } catch {
      showToast('Failed to delete campaign');
    }
  }

  // Save campaign form submit
  async function handleSaveCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCampaign?.name) {
      alert('Campaign name is required');
      return;
    }
    try {
      await saveAdminCampaign(editingCampaign);
      showToast(editingCampaign.id ? 'Campaign updated successfully!' : 'Campaign created successfully!');
      setEditingCampaign(null);
      setActiveTab('all-campaigns');
      void refreshData();
    } catch {
      showToast('Failed to save campaign');
    }
  }

  // Export report download trigger
  async function handleDownloadReport(type: 'summary' | 'creator' | 'finance' | 'verification', format: 'csv' | 'json' | 'pdf') {
    const report = await generateCampaignReport(type, format);
    const blob = new Blob([report.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.filename;
    link.click();
    showToast(`Report ${report.filename} downloaded`);
  }

  // Filter campaigns by search
  const filteredCampaigns = campaigns.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.brand_name ?? '').toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-surface/80 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold uppercase tracking-wider">
              CreatorX Enterprise Engine
            </span>
            <span className="text-xs text-text-muted">v2.5 Production Ready</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Icon name="briefcase" size={32} className="text-accent" /> Campaign Management Portal
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure lifecycle rules, targeting, verification, payouts, templates, and analytics across all campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingCampaign({
                name: '',
                campaign_type: 'clipping',
                status: 'draft',
                total_budget_cents: 1000000,
                daily_budget_cents: 100000,
                rate_per_million_cents: 2000,
                platforms: ['tiktok', 'instagram', 'youtube']
              });
              setActiveTab('create');
            }}
            className="bg-accent hover:bg-accent-hover text-white font-semibold flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg shadow-accent/30 active:scale-95 transition-all"
          >
            <Icon name="plus" size={18} /> Create Campaign
          </Button>
        </div>
      </div>

      {notificationMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="check-circle" size={18} /> {notificationMsg}
          </div>
        </div>
      )}

      {/* Admin Menu Sub-navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/50 no-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
          { id: 'all-campaigns', label: 'All Campaigns', icon: 'list' },
          { id: 'create', label: editingCampaign?.id ? 'Edit Campaign' : 'Create Campaign', icon: 'plus-circle' },
          { id: 'templates', label: 'Templates', icon: 'copy' },
          { id: 'categories', label: 'Categories', icon: 'folder' },
          { id: 'rewards', label: 'Rewards Matrix', icon: 'dollar-sign' },
          { id: 'verification', label: 'Verification Rules', icon: 'shield-check' },
          { id: 'targeting', label: 'Eligibility & Geo', icon: 'globe' },
          { id: 'assets', label: 'Assets', icon: 'file' },
          { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
          { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
          { id: 'reports', label: 'Reports', icon: 'file-text' },
          { id: 'settings', label: 'Settings', icon: 'settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as AdminSubView)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200
              ${
                activeTab === item.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 border border-white/20 font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/60 border border-transparent'
              }
            `}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-12 flex justify-center items-center gap-3 text-accent font-medium">
          <Icon name="refresh-cw" size={24} animation="spin" /> Synchronizing Enterprise Engine...
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {!loading && activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Total', value: stats.totalCampaigns, color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400' },
              { label: 'Live', value: stats.liveCampaigns, color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400' },
              { label: 'Paused', value: stats.pausedCampaigns, color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400' },
              { label: 'Scheduled', value: stats.scheduledCampaigns, color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400' },
              { label: 'Expired', value: stats.expiredCampaigns, color: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400' },
              { label: 'Drafts', value: stats.draftCampaigns, color: 'from-slate-500/20 to-gray-500/10 border-slate-500/30 text-slate-400' },
              { label: 'Pending Review', value: stats.pendingReviewCampaigns, color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400' },
              { label: 'Creators', value: stats.creatorCount, color: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400' }
            ].map((st, i) => (
              <div key={i} className={`p-4 rounded-2xl bg-gradient-to-b ${st.color} border backdrop-blur-md flex flex-col justify-between`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{st.label}</span>
                <span className={`text-2xl font-black mt-2 ${st.color.split(' ').pop()}`}>{st.value}</span>
              </div>
            ))}
          </div>

          {/* Revenue & Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>TOTAL BUDGET USED</span>
                <Icon name="dollar-sign" size={18} className="text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">${(stats.budgetUsedCents / 100).toLocaleString()}</span>
                <span className="text-xs text-text-muted block mt-1">Remaining: ${(stats.budgetRemainingCents / 100).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>TOTAL VERIFIED VIEWS</span>
                <Icon name="eye" size={18} className="text-indigo-400" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{(stats.totalViews / 1000).toFixed(1)}k</span>
                <span className="text-xs text-text-muted block mt-1">{stats.submissionCount} Submissions</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>AVERAGE CPM</span>
                <Icon name="trending-up" size={18} className="text-amber-400" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">${stats.averageCPM.toFixed(2)}</span>
                <span className="text-xs text-text-muted block mt-1">Cost Per View: ${stats.averageCostPerView}</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>TOP PERFORMER</span>
                <Icon name="trophy" size={18} className="text-yellow-400" />
              </div>
              <div className="mt-3">
                <span className="text-sm font-bold text-accent truncate block">{stats.topCampaignName}</span>
                <span className="text-xs text-text-secondary block mt-0.5">Top Creator: {stats.topCreatorName}</span>
              </div>
            </div>
          </div>

          {/* Charts & Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icon name="bar-chart" size={20} className="text-accent" /> Budget Utilization & Growth
                </h3>
                <span className="text-xs text-text-muted">Realtime Analytics</span>
              </div>
              <div className="h-64 flex items-end gap-3 pt-6 border-b border-border/50 px-2">
                {[45, 60, 52, 78, 85, 92, 68, 74, 88, 95, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div
                      style={{ height: `${h}%` }}
                      className="w-full bg-gradient-to-t from-accent/40 via-accent to-indigo-400 rounded-t-xl group-hover:brightness-125 transition-all relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 px-2 py-0.5 rounded text-white font-bold">
                        {h}%
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">{`W${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon name="clock" size={20} className="text-emerald-400" /> Recent Activity Stream
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { title: 'Apex Legends Campaign Launched', time: '10 mins ago', type: 'active' },
                  { title: 'CyberSound Studio Scheduled', time: '1 hour ago', type: 'scheduled' },
                  { title: 'Milestone Payout of $250 Released', time: '3 hours ago', type: 'payout' },
                  { title: 'New Template "Music Sound Drop" Added', time: '5 hours ago', type: 'template' }
                ].map((act, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-surface-hover/40 border border-white/5 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
                    <div>
                      <span className="font-semibold text-text-primary block">{act.title}</span>
                      <span className="text-text-muted text-[10px]">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL CAMPAIGNS & STATUS SUBVIEWS */}
      {!loading && activeTab === 'all-campaigns' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'draft', 'scheduled', 'pending', 'active', 'paused', 'completed', 'expired', 'archived'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all
                    ${
                      statusFilter === st
                        ? 'bg-accent text-white shadow-md font-bold'
                        : 'text-text-secondary hover:bg-surface-hover/80'
                    }
                  `}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="relative min-w-[240px]">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by name, brand, or slug..."
                className="w-full pl-9 pr-4 py-2 bg-surface/90 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Campaigns Datatable */}
          <div className="bg-surface/75 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-text-muted bg-surface/90">
                  <th className="py-4 px-6">Campaign</th>
                  <th className="py-4 px-4">Brand</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Platforms</th>
                  <th className="py-4 px-4">Budget</th>
                  <th className="py-4 px-4">CPM</th>
                  <th className="py-4 px-4">Views</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-medium">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      No campaigns found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map(c => (
                    <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={c.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        <div>
                          <span className="font-bold text-white text-sm block">{c.name}</span>
                          <span className="text-text-muted text-[11px] font-mono">{c.slug}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">{c.brand_name || 'CreatorX'}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {(c.platforms || ['tiktok']).map(p => (
                            <span key={p} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] uppercase font-bold text-text-secondary">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-white">${(c.total_budget_cents / 100).toLocaleString()}</span>
                        <span className="text-[10px] text-text-muted block">{c.budget_used_percent ?? 0}% Used</span>
                      </td>
                      <td className="py-4 px-4 text-accent font-semibold">${(c.rate_per_million_cents / 1000).toFixed(2)}</td>
                      <td className="py-4 px-4 text-text-primary">{((c.total_views ?? 0) / 1000).toFixed(1)}k</td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingCampaign(c);
                            setActiveTab('create');
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-white"
                          title="Edit Campaign"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          onClick={() => void handleDuplicate(c.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-indigo-400 hover:text-indigo-300"
                          title="Duplicate"
                        >
                          <Icon name="copy" size={16} />
                        </button>
                        {c.status !== 'active' ? (
                          <button
                            onClick={() => void handleStatusChange(c.id, 'active')}
                            className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400"
                            title="Activate"
                          >
                            <Icon name="play" size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => void handleStatusChange(c.id, 'paused')}
                            className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400"
                            title="Pause"
                          >
                            <Icon name="pause" size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => void handleDelete(c.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          title="Delete"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE / EDIT CAMPAIGN BUILDER */}
      {!loading && activeTab === 'create' && (
        <form onSubmit={e => void handleSaveCampaign(e)} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon name="edit-3" size={22} className="text-accent" />
              {editingCampaign?.id ? `Edit Campaign (${editingCampaign.name})` : 'Create New Enterprise Campaign'}
            </h2>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('all-campaigns')}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-hover text-white">
                Save Campaign Configuration
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column 1: Basic Info & Budget */}
            <div className="space-y-5 lg:col-span-2">
              <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/10 pb-2">
                  1. Campaign Core Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign?.name ?? ''}
                      onChange={e => setEditingCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Apex Legends Season 22 Clipping Blitz"
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Custom Slug</label>
                    <input
                      type="text"
                      value={editingCampaign?.slug ?? ''}
                      onChange={e => setEditingCampaign(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated-slug"
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Short Tagline Description</label>
                  <input
                    type="text"
                    value={editingCampaign?.short_description ?? ''}
                    onChange={e => setEditingCampaign(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief 1-sentence hook for creator marketplace..."
                    className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Long Description & Instructions</label>
                  <textarea
                    rows={4}
                    value={editingCampaign?.description ?? ''}
                    onChange={e => setEditingCampaign(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Full instructions, rules, requirements..."
                    className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Budget & Reward Engine */}
              <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/10 pb-2">
                  2. Budget & Payout Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Total Budget ($ USD)</label>
                    <input
                      type="number"
                      value={((editingCampaign?.total_budget_cents ?? 1000000) / 100).toString()}
                      onChange={e => setEditingCampaign(prev => ({ ...prev, total_budget_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Daily Cap ($ USD)</label>
                    <input
                      type="number"
                      value={((editingCampaign?.daily_budget_cents ?? 100000) / 100).toString()}
                      onChange={e => setEditingCampaign(prev => ({ ...prev, daily_budget_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">CPM Rate ($ Per 1,000 Views)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={((editingCampaign?.rate_per_million_cents ?? 2000) / 1000).toString()}
                      onChange={e => setEditingCampaign(prev => ({ ...prev, rate_per_million_cents: Math.round(parseFloat(e.target.value || '0') * 1000) }))}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column 2: Status, Media & Supported Platforms */}
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/10 pb-2">
                  3. Settings & Status
                </h3>
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Lifecycle Status</label>
                  <select
                    value={editingCampaign?.status ?? 'draft'}
                    onChange={e => setEditingCampaign(prev => ({ ...prev, status: e.target.value as ExtendedCampaignStatus }))}
                    className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {['draft', 'scheduled', 'pending', 'active', 'paused', 'completed', 'expired', 'archived', 'cancelled', 'deleted'].map(st => (
                      <option key={st} value={st}>{st.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={editingCampaign?.cover_url ?? ''}
                    onChange={e => setEditingCampaign(prev => ({ ...prev, cover_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-2">Supported Platforms</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['youtube', 'instagram', 'tiktok', 'facebook', 'x', 'linkedin', 'twitch', 'kick'].map(plat => {
                      const selected = (editingCampaign?.platforms || []).includes(plat as ExtendedPlatform);
                      return (
                        <button
                          type="button"
                          key={plat}
                          onClick={() => {
                            const current = editingCampaign?.platforms || [];
                            const updated = selected
                              ? current.filter(p => p !== plat)
                              : [...current, plat as ExtendedPlatform];
                            setEditingCampaign(prev => ({ ...prev, platforms: updated }));
                          }}
                          className={`p-2.5 rounded-xl border font-semibold uppercase text-[10px] transition-all flex items-center justify-between ${
                            selected ? 'bg-accent/20 border-accent text-white font-bold' : 'bg-surface/50 border-white/10 text-text-muted'
                          }`}
                        >
                          {plat}
                          {selected && <Icon name="check" size={14} className="text-accent" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: TEMPLATES */}
      {!loading && activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Campaign Blueprint Templates</h3>
            <Button
              onClick={() => {
                const name = prompt('Template Name:');
                if (name) {
                  void createCampaignTemplate({ name, description: 'Custom template', category: 'General' }).then(() => refreshData());
                }
              }}
              size="sm"
            >
              + Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="p-5 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/20 text-accent uppercase">{tmpl.category || 'General'}</span>
                  <button onClick={() => setTemplateJsonModal(JSON.stringify(tmpl.config, null, 2))} className="text-xs text-text-muted hover:text-white">
                    Export JSON
                  </button>
                </div>
                <h4 className="text-base font-bold text-white">{tmpl.name}</h4>
                <p className="text-xs text-text-secondary">{tmpl.description}</p>
                <Button
                  onClick={() => {
                    setEditingCampaign({
                      name: `${tmpl.name} Campaign`,
                      description: tmpl.description ?? '',
                      ...(tmpl.config as Record<string, unknown>)
                    });
                    setActiveTab('create');
                  }}
                  size="sm"
                  className="w-full bg-white/10 hover:bg-white/20 text-white"
                >
                  Apply Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {!loading && activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Campaign Categories</h3>
            <Button
              onClick={() => {
                const name = prompt('Category Name:');
                if (name) void saveCampaignCategory({ name }).then(() => refreshData());
              }}
              size="sm"
            >
              + New Category
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 rounded-2xl bg-surface/75 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                    <Icon name={cat.icon || 'folder'} size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">{cat.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{cat.slug}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: REWARDS MATRIX */}
      {!loading && activeTab === 'rewards' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="dollar-sign" size={20} className="text-emerald-400" /> Reward Rules & Payout Matrix
          </h3>
          <p className="text-xs text-text-secondary">Global configurable reward structures and tier bonuses for active campaigns.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted uppercase block">Fixed Reward Tier</span>
              <span className="text-xl font-bold text-white mt-1 block">$50 - $500 / Post</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted uppercase block">CPM Standard Rate</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">$1.50 - $5.00 / 1k Views</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted uppercase block">Referral Bonus Rate</span>
              <span className="text-xl font-bold text-accent mt-1 block">5.0% BPS Commission</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VERIFICATION RULES */}
      {!loading && activeTab === 'verification' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="shield-check" size={20} className="text-accent" /> Verification & Anti-Fraud Suite
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-2">
              <span className="font-bold text-white text-sm block">Automated AI Spam Check</span>
              <p className="text-xs text-text-secondary">Detect bot views, fake engagement, and duplicate video submissions automatically.</p>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ACTIVE</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-2">
              <span className="font-bold text-white text-sm block">Watch Time & Retention Rules</span>
              <p className="text-xs text-text-secondary">Require at least 45% audience retention before payout eligibility triggers.</p>
              <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">ENFORCED</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ELIGIBILITY & GEO */}
      {!loading && activeTab === 'targeting' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="globe" size={20} className="text-indigo-400" /> Geographic & Creator Eligibility Dictionary
          </h3>
          <div className="flex flex-wrap gap-2 pt-2">
            {['United States (US)', 'United Kingdom (GB)', 'Canada (CA)', 'Australia (AU)', 'Germany (DE)', 'Japan (JP)'].map(c => (
              <span key={c} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: ASSETS */}
      {!loading && activeTab === 'assets' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="file" size={20} className="text-amber-400" /> Central Campaign Asset Library
          </h3>
          <p className="text-xs text-text-secondary">Manage logos, sound files, brand guidelines, and reference videos across campaigns.</p>
        </div>
      )}

      {/* TAB 10: ANALYTICS */}
      {!loading && activeTab === 'analytics' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="bar-chart" size={20} className="text-accent" /> Visual Performance Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted">CTR AVERAGE</span>
              <span className="text-2xl font-black text-white block mt-1">4.85%</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted">COST PER VIEW</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">$0.002</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-white/10">
              <span className="text-xs font-bold text-text-muted">ESTIMATED ROI</span>
              <span className="text-2xl font-black text-amber-400 block mt-1">3.4x</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: LEADERBOARD */}
      {!loading && activeTab === 'leaderboard' && leaderboard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-surface/75 border border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon name="trophy" size={20} className="text-yellow-400" /> Creator Leaderboard
            </h3>
            <div className="flex gap-1">
              {(['weekly', 'monthly', 'lifetime'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setLeaderboardTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${
                    leaderboardTimeframe === tf ? 'bg-accent text-white font-bold' : 'text-text-muted hover:bg-white/5'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface/75 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
            <div className="space-y-3">
              {leaderboard.top_creators.map((c, i) => (
                <div key={c.creator_id} className="flex items-center justify-between p-4 rounded-2xl bg-surface/90 border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent font-black text-sm flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <img src={c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-white text-sm block">{c.name}</span>
                      <span className="text-xs text-text-muted">{c.views.toLocaleString()} Total Views</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-base">${(c.earnings_cents / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: REPORTS */}
      {!loading && activeTab === 'reports' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="file-text" size={20} className="text-accent" /> Campaign Reports Exporter Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'summary', title: 'Campaign Performance Summary Report', desc: 'Complete breakdown of budget usage, views, CPM and creator engagement.' },
              { type: 'creator', title: 'Creator Activity & Payout Report', desc: 'Earnings per creator, submission validation states, and performance metrics.' },
              { type: 'finance', title: 'Financial Audit Report', desc: 'Budget allocations, daily drawdowns, and transaction logs.' },
              { type: 'verification', title: 'Fraud & Verification Audit Report', desc: 'AI spam checks, flags, auto-approvals, and rejection reasons.' }
            ].map(rep => (
              <div key={rep.type} className="p-5 rounded-2xl bg-surface border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-sm">{rep.title}</h4>
                <p className="text-xs text-text-secondary">{rep.desc}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void handleDownloadReport(rep.type as any, 'csv')}>
                    Export CSV
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void handleDownloadReport(rep.type as any, 'json')}>
                    Export JSON
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 13: SETTINGS */}
      {!loading && activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-surface/75 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="settings" size={20} className="text-accent" /> Global Campaign System Settings
          </h3>
          <div className="space-y-3 text-xs max-w-xl">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/10">
              <span>Auto-Archive Expired Campaigns</span>
              <input type="checkbox" defaultChecked className="accent-accent" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/10">
              <span>Auto-Notify Creators on Status Change</span>
              <input type="checkbox" defaultChecked className="accent-accent" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/10">
              <span>Enforce Strict AI Duplicate Detection</span>
              <input type="checkbox" defaultChecked className="accent-accent" />
            </div>
          </div>
        </div>
      )}

      {/* Template JSON Modal */}
      {templateJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">Template Configuration JSON</h3>
            <textarea readOnly rows={10} value={templateJsonModal} className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-emerald-400" />
            <div className="flex justify-end">
              <Button onClick={() => setTemplateJsonModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
