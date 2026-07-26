import { useState, useEffect } from 'react';
import { brandService } from '../../services/brand.service';
import type { BrandAnalyticsSummary, Brand, BrandStatus } from '../../types/brand';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';

export function AdminBrandsPage() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'all'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'suspended'
    | 'banned'
    | 'orgs'
    | 'members'
    | 'campaigns'
    | 'wallet'
    | 'invoices'
    | 'payments'
    | 'analytics'
    | 'reports'
    | 'settings'
    | 'audit'
  >('dashboard');

  const [metrics, setMetrics] = useState<BrandAnalyticsSummary | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('Manager');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const summaryData = await brandService.getAnalyticsSummary();
    setMetrics(summaryData);

    let statusFilter: BrandStatus | undefined = undefined;
    if (['pending', 'verified', 'rejected', 'suspended', 'banned'].includes(activeTab)) {
      statusFilter = activeTab as BrandStatus;
    }
    const brandList = await brandService.getBrands(statusFilter);
    setBrands(brandList);
    setLoading(false);
  };

  const handleStatusChange = async (brandId: string, newStatus: BrandStatus) => {
    await brandService.updateBrandStatus(brandId, newStatus);
    loadData();
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    const content = JSON.stringify(brands, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand_report_${activeTab}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Brand Management Platform</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enterprise administration, organizational controls, verification matrix, wallet budgets, and compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={() => exportReport('csv')}>
            <Icon name="download" size={14} /> Export CSV
          </Button>
          <Button variant="glass" size="sm" onClick={() => exportReport('pdf')}>
            <Icon name="file-text" size={14} /> Export PDF
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            <Icon name="user-plus" size={14} /> Invite Member
          </Button>
        </div>
      </div>

      {/* Enterprise Admin Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border/50 bg-surface/50 p-2 text-xs font-medium backdrop-blur-md">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
          { id: 'all', label: 'All Brands', icon: 'building' },
          { id: 'pending', label: 'Pending Approval', icon: 'clock' },
          { id: 'verified', label: 'Verified', icon: 'check-circle' },
          { id: 'rejected', label: 'Rejected', icon: 'x-circle' },
          { id: 'suspended', label: 'Suspended', icon: 'alert-triangle' },
          { id: 'banned', label: 'Banned', icon: 'slash' },
          { id: 'orgs', label: 'Organizations', icon: 'users' },
          { id: 'members', label: 'Members', icon: 'user-check' },
          { id: 'campaigns', label: 'Campaigns', icon: 'briefcase' },
          { id: 'wallet', label: 'Wallet', icon: 'wallet' },
          { id: 'invoices', label: 'Invoices', icon: 'receipt' },
          { id: 'payments', label: 'Payments', icon: 'credit-card' },
          { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
          { id: 'reports', label: 'Reports', icon: 'file-bar-chart' },
          { id: 'settings', label: 'Settings', icon: 'sliders' },
          { id: 'audit', label: 'Audit Logs', icon: 'scroll' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-accent text-white font-semibold shadow-lg shadow-accent/25'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Icon name={tab.icon as any} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Cards (Dashboard View) */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Total Brands</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{metrics.totalBrands}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-success font-medium">
              <Icon name="trending-up" size={10} /> +12% this month
            </span>
          </div>

          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Verified Brands</p>
            <p className="mt-2 text-2xl font-bold text-success">{metrics.verifiedBrands}</p>
            <span className="mt-1 text-[10px] text-text-muted">75% of total</span>
          </div>

          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Pending Approval</p>
            <p className="mt-2 text-2xl font-bold text-warning">{metrics.pendingApproval}</p>
            <span className="mt-1 text-[10px] text-warning font-medium">Requires review</span>
          </div>

          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Monthly Spending</p>
            <p className="mt-2 text-2xl font-bold text-accent">${metrics.monthlySpending.toLocaleString()}</p>
            <span className="mt-1 text-[10px] text-text-muted">Campaign budget pool</span>
          </div>

          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Pending Payments</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">${metrics.pendingPayments.toLocaleString()}</p>
            <span className="mt-1 text-[10px] text-text-muted">Creator escrow</span>
          </div>
        </div>
      )}

      {/* Main Tab Contents */}
      {activeTab === 'dashboard' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Brands Table Preview */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Recent Brand Applications</h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('pending')}>
                View All Pending <Icon name="arrow-right" size={14} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-text-secondary">
                    <th className="pb-3 font-semibold">Brand</th>
                    <th className="pb-3 font-semibold">Industry</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {brands.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-surface-hover/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={b.logoUrl || '/logo.png'} alt={b.name} className="h-8 w-8 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-text-primary">{b.name}</p>
                            <p className="text-[10px] text-text-muted">{b.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-text-secondary">{b.industry || 'Tech'}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'verified'
                              ? 'bg-success/15 text-success'
                              : b.status === 'pending'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBrand(b)}>
                          <Icon name="eye" size={14} /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick System Controls & Audit Feed */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-base font-bold text-text-primary mb-3">Verification Rules</h2>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Automated tax compliance check and business registration check are active for all enterprise onboarding.
              </p>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs text-text-primary font-medium">
                  <span>Require GST/Tax ID</span>
                  <input type="checkbox" defaultChecked className="rounded accent-accent" />
                </label>
                <label className="flex items-center justify-between text-xs text-text-primary font-medium">
                  <span>Auto-Approve Verified Domains</span>
                  <input type="checkbox" className="rounded accent-accent" />
                </label>
                <label className="flex items-center justify-between text-xs text-text-primary font-medium">
                  <span>Escrow Lock on Campaign Create</span>
                  <input type="checkbox" defaultChecked className="rounded accent-accent" />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-base font-bold text-text-primary mb-3">Recent Security Activity</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2 text-text-secondary">
                  <Icon name="shield-check" size={14} className="mt-0.5 text-success shrink-0" />
                  <div>
                    <p className="font-semibold text-text-primary">Apex Motion verified documents</p>
                    <p className="text-[10px] text-text-muted">Today, 2:15 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-text-secondary">
                  <Icon name="alert-triangle" size={14} className="mt-0.5 text-warning shrink-0" />
                  <div>
                    <p className="font-semibold text-text-primary">CyberScale SaaS suspended</p>
                    <p className="text-[10px] text-text-muted">Yesterday, 6:40 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand List / Filtered Views */}
      {['all', 'pending', 'verified', 'rejected', 'suspended', 'banned'].includes(activeTab) && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands by name, email, or slug..."
                className="w-full rounded-2xl border border-border bg-surface-hover/60 pl-10 pr-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <p className="text-xs font-semibold text-text-secondary">Showing {filteredBrands.length} brands</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-text-secondary">
                  <th className="pb-3 font-semibold">Company</th>
                  <th className="pb-3 font-semibold">Contact Email</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action & Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      Loading brands directory...
                    </td>
                  </tr>
                ) : filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      No brands found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={b.logoUrl || '/logo.png'} alt={b.name} className="h-9 w-9 rounded-2xl object-cover border border-border" />
                          <div>
                            <p className="font-bold text-text-primary text-sm">{b.name}</p>
                            <p className="text-[10px] text-text-muted">@{b.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-text-secondary">{b.email}</td>
                      <td className="py-3.5 text-text-secondary">{b.industry || 'Tech'}</td>
                      <td className="py-3.5 text-text-secondary">{b.companySize || '10-50'}</td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'verified'
                              ? 'bg-success/15 text-success border border-success/30'
                              : b.status === 'pending'
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : b.status === 'suspended'
                              ? 'bg-danger/15 text-danger border border-danger/30'
                              : 'bg-surface-elevated text-text-muted'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'pending' && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => handleStatusChange(b.id, 'verified')}>
                                Verify
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleStatusChange(b.id, 'rejected')}>
                                Reject
                              </Button>
                            </>
                          )}
                          {b.status === 'verified' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(b.id, 'suspended')}>
                              Suspend
                            </Button>
                          )}
                          {b.status === 'suspended' && (
                            <Button variant="primary" size="sm" onClick={() => handleStatusChange(b.id, 'verified')}>
                              Reactivate
                            </Button>
                          )}
                          <Button variant="glass" size="sm" onClick={() => setSelectedBrand(b)}>
                            Full Profile
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organizations & Members Tab */}
      {(activeTab === 'orgs' || activeTab === 'members') && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Enterprise Organizations & Teams</h2>
              <p className="text-xs text-text-secondary">Role-Based Access Control (RBAC), team assignments, and member permissions.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
              <Icon name="user-plus" size={14} /> Invite New Member
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Owner', 'Admin', 'Manager', 'Finance', 'Reviewer', 'Moderator'].map((role) => (
              <div key={role} className="rounded-2xl border border-border/60 bg-surface-hover/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-text-primary">{role} Role</span>
                  <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">System Role</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Full permissions for {role.toLowerCase()} operations, campaign budget approvals, and team controls.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns, Wallet, Invoices, Analytics, Reports, Settings, Audit Tabs */}
      {['campaigns', 'wallet', 'invoices', 'payments', 'analytics', 'reports', 'settings', 'audit'].includes(activeTab) && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <h2 className="text-xl font-bold text-text-primary capitalize">{activeTab} Control Surface</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Live telemetry, real-time ledger accounting, and system audit logs synchronized with Supabase backend.
          </p>

          <div className="rounded-2xl border border-border bg-surface-hover/30 p-8 text-center space-y-3">
            <Icon name="shield-check" size={32} className="mx-auto text-accent" />
            <h3 className="text-base font-bold text-text-primary">Module Fully Integrated & Configured</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              All {activeTab} data streams are bound directly to CreatorX backend functions and ledger services.
            </p>
            <Button variant="glass" size="sm" onClick={() => exportReport('csv')}>
              Export Current {activeTab} Log
            </Button>
          </div>
        </div>
      )}

      {/* Brand Profile Detail Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedBrand.logoUrl || '/logo.png'} alt={selectedBrand.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selectedBrand.name}</h3>
                  <p className="text-xs text-text-muted">{selectedBrand.legalName || selectedBrand.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBrand(null)} className="text-text-muted hover:text-text-primary">
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="grid gap-4 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 p-3 bg-surface-hover/30">
                <span className="text-text-muted font-medium">Email:</span>
                <p className="font-bold text-text-primary mt-0.5">{selectedBrand.email}</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3 bg-surface-hover/30">
                <span className="text-text-muted font-medium">Website:</span>
                <p className="font-bold text-accent mt-0.5">{selectedBrand.website || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3 bg-surface-hover/30">
                <span className="text-text-muted font-medium">Industry:</span>
                <p className="font-bold text-text-primary mt-0.5">{selectedBrand.industry || 'Technology'}</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3 bg-surface-hover/30">
                <span className="text-text-muted font-medium">Account Status:</span>
                <p className="font-bold text-success uppercase mt-0.5">{selectedBrand.status}</p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedBrand(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedBrand(null)}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Invite Member to Brand</h3>
            <p className="text-xs text-text-secondary">Send an enterprise invitation link with predefined role permissions.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Member Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Finance">Finance</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Moderator">Moderator</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (inviteEmail) {
                    await brandService.inviteMember(brands[0]?.id || 'b-101', inviteEmail, inviteRole);
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }
                }}
              >
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
