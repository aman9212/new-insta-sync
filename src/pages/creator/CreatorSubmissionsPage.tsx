import { useState, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { useCreatorSubmissions } from '../../hooks/useSubmissions';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatCents, formatViews, formatNumber } from '../../lib/currency';
import type { SubmissionWithJoins } from '../../types';

type TabKey = 'all' | 'processing' | 'eligible' | 'rejected' | 'under_review';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'accent' }> = {
  processing: { label: 'Pending', variant: 'warning' },
  eligible: { label: 'Approved', variant: 'success' },
  paid: { label: 'Paid', variant: 'success' },
  ineligible: { label: 'Ineligible', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'danger' },
  flagged: { label: 'Under Review', variant: 'warning' },
  under_review: { label: 'View Verification in Progress', variant: 'accent' },
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📷', tiktok: '🎵', youtube: '▶️', x: '𝕏', facebook: '📘',
};

const TABS: { key: TabKey; label: string; iconName: string }[] = [
  { key: 'all', label: 'All Clips', iconName: 'file-text' },
  { key: 'processing', label: 'Pending', iconName: 'clock' },
  { key: 'eligible', label: 'Approved', iconName: 'check-circle' },
  { key: 'rejected', label: 'Rejected', iconName: 'x-circle' },
  { key: 'under_review', label: 'Flagged', iconName: 'alert-triangle' },
];

type SortKey = 'recent' | 'oldest' | 'views' | 'earnings';

export function CreatorSubmissionsPage() {
  const { submissions, loading, error } = useCreatorSubmissions();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithJoins | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'payouts' | 'timeline' | 'verification'>('details');

  const tabCounts = useMemo(() => ({
    all: submissions.length,
    processing: submissions.filter(s => (s.status as string) === 'processing').length,
    eligible: submissions.filter(s => (s.status as string) === 'eligible' || (s.status as string) === 'paid').length,
    rejected: submissions.filter(s => (s.status as string) === 'rejected' || (s.status as string) === 'ineligible').length,
    under_review: submissions.filter(s => (s.status as string) === 'flagged' || (s.status as string) === 'under_review').length,
  }), [submissions]);

  const filtered = useMemo(() => {
    let list = [...submissions];

    // Tab filter
    if (activeTab === 'processing') list = list.filter(s => (s.status as string) === 'processing');
    else if (activeTab === 'eligible') list = list.filter(s => (s.status as string) === 'eligible' || (s.status as string) === 'paid');
    else if (activeTab === 'rejected') list = list.filter(s => (s.status as string) === 'rejected' || (s.status as string) === 'ineligible');
    else if (activeTab === 'under_review') list = list.filter(s => (s.status as string) === 'flagged' || (s.status as string) === 'under_review');

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.campaign_name ?? '').toLowerCase().includes(q) ||
        s.post_url.toLowerCase().includes(q)
      );
    }

    // Platform
    if (platformFilter !== 'all') list = list.filter(s => s.platform === platformFilter);

    // Sort
    if (sort === 'recent') list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    else if (sort === 'oldest') list.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    else if (sort === 'views') list.sort((a, b) => b.total_views - a.total_views);
    else if (sort === 'earnings') list.sort((a, b) => b.earnings_cents - a.earnings_cents);

    return list;
  }, [submissions, activeTab, search, platformFilter, sort]);

  if (loading) return <TableSkeleton rows={6} cols={5} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="mt-1 text-text-secondary">Track your clips, views, earnings, and verification status.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Submissions" value={formatNumber(submissions.length)} icon={<Icon name="file-text" size={18} />} />
        <StatCard label="Total Views" value={formatViews(submissions.reduce((s, r) => s + r.total_views, 0))} icon={<Icon name="eye" size={18} />} />
        <StatCard label="Eligible Views" value={formatViews(submissions.reduce((s, r) => s + r.eligible_views, 0))} />
        <StatCard label="Total Earnings" value={formatCents(submissions.reduce((s, r) => s + r.earnings_cents, 0))} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
          >
            <Icon name={tab.iconName} size={15} />
            {tab.label}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-accent/15 text-accent' : 'bg-surface-elevated text-text-muted'}`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns or URLs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface border border-border text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Icon name="filter" size={14} className="text-text-muted" />
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-9 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="views">Highest Views</option>
            <option value="earnings">Highest Earnings</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Submission Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description="Submit your first clip to a campaign to see it here."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map(sub => (
            <div
              key={sub.id}
              className="group surface-card p-4 flex items-center gap-4 hover:border-border-strong transition-all cursor-pointer"
              onClick={() => { setSelectedSubmission(sub); setModalTab('details'); }}
            >
              {/* Platform icon */}
              <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-lg shrink-0">
                {PLATFORM_ICONS[sub.platform] || '🔗'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary truncate">{sub.campaign_name || 'Campaign'}</span>
                  <Badge variant={(STATUS_CONFIG[sub.status as string]?.variant || 'default') as 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'} size="sm">
                    {STATUS_CONFIG[sub.status as string]?.label || sub.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">
                  {sub.platform} · {new Date(sub.submitted_at).toLocaleDateString()}
                </p>
              </div>

              {/* Metrics */}
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="text-right">
                  <div className="text-text-muted text-xs">Views</div>
                  <div className="font-medium tabular-nums">{formatViews(sub.total_views)}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted text-xs">Eligible</div>
                  <div className="font-medium tabular-nums">{formatViews(sub.eligible_views)}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted text-xs">Earnings</div>
                  <div className="font-medium tabular-nums text-success">{formatCents(sub.earnings_cents)}</div>
                </div>
              </div>

              {/* Action */}
              <button className="shrink-0 text-text-muted group-hover:text-accent transition-colors">
                <Icon name="eye" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submission Detail Modal */}
      <Modal
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={selectedSubmission?.campaign_name || 'Submission Details'}
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-5">
            {/* Modal Tabs */}
            <div className="flex gap-1 border-b border-border pb-px">
              {(['details', 'payouts', 'timeline', 'verification'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors
                    ${modalTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                >
                  {tab === 'details' ? 'Notes' : tab}
                </button>
              ))}
            </div>

            {/* Notes Tab */}
            {modalTab === 'details' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="surface-card-elevated p-4">
                    <span className="text-xs text-text-muted">Status</span>
                    <div className="mt-1">
                      <Badge variant={(STATUS_CONFIG[selectedSubmission.status as string]?.variant || 'default') as 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'}>
                        {STATUS_CONFIG[selectedSubmission.status as string]?.label || selectedSubmission.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="surface-card-elevated p-4">
                    <span className="text-xs text-text-muted">Platform</span>
                    <div className="mt-1 font-medium capitalize">{selectedSubmission.platform}</div>
                  </div>
                </div>
                {selectedSubmission.rejection_reason && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                    <span className="text-xs font-medium text-danger">Rejection Reason</span>
                    <p className="mt-1 text-sm text-text-secondary">{selectedSubmission.rejection_reason}</p>
                  </div>
                )}
                {selectedSubmission.ineligible_reason && (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                    <span className="text-xs font-medium text-warning">Note</span>
                    <p className="mt-1 text-sm text-text-secondary">{selectedSubmission.ineligible_reason}</p>
                  </div>
                )}
                <div className="surface-card-elevated p-4">
                  <span className="text-xs text-text-muted">Post URL</span>
                  <a href={selectedSubmission.post_url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-sm text-accent hover:underline truncate">
                    {selectedSubmission.post_url}
                  </a>
                </div>
              </div>
            )}

            {/* Payouts Tab */}
            {modalTab === 'payouts' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Total Earned</span>
                    <div className="mt-1 text-xl font-bold tabular-nums">{formatCents(selectedSubmission.earnings_cents)}</div>
                  </div>
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Status</span>
                    <div className="mt-1 text-xl font-bold">
                      {selectedSubmission.status === 'paid' ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Eligible Views</span>
                    <div className="mt-1 text-xl font-bold tabular-nums">{formatViews(selectedSubmission.eligible_views)}</div>
                  </div>
                </div>
                <p className="text-xs text-text-muted">Earnings are calculated server-side based on verified eligible views and campaign rate. Minimum payout threshold applies.</p>
              </div>
            )}

            {/* Timeline Tab */}
            {modalTab === 'timeline' && (
              <div className="space-y-0">
                {[
                  { event: 'Submitted', date: selectedSubmission.submitted_at, done: true },
                  { event: 'Processing', date: selectedSubmission.submitted_at, done: true },
                  { event: 'Metrics Collected', date: selectedSubmission.last_synced_at, done: !!selectedSubmission.last_synced_at },
                  { event: 'Reviewed', date: selectedSubmission.reviewed_at, done: !!selectedSubmission.reviewed_at },
                  { event: selectedSubmission.status === 'eligible' || selectedSubmission.status === 'paid' ? 'Approved' : 'Awaiting Approval', date: selectedSubmission.reviewed_at, done: selectedSubmission.status === 'eligible' || selectedSubmission.status === 'paid' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 py-3">
                    <div className={`w-3 h-3 mt-1 rounded-full shrink-0 ${step.done ? 'bg-accent' : 'bg-border'}`} />
                    <div>
                      <span className={`text-sm font-medium ${step.done ? 'text-text-primary' : 'text-text-muted'}`}>{step.event}</span>
                      {step.date && <p className="text-xs text-text-muted">{new Date(step.date).toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Verification Tab */}
            {modalTab === 'verification' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="surface-card-elevated p-4">
                    <span className="text-xs text-text-muted">Last Metrics Sync</span>
                    <div className="mt-1 text-sm font-medium">
                      {selectedSubmission.last_synced_at
                        ? new Date(selectedSubmission.last_synced_at).toLocaleString()
                        : 'Not yet synced'}
                    </div>
                  </div>
                  <div className="surface-card-elevated p-4">
                    <span className="text-xs text-text-muted">Next Sync</span>
                    <div className="mt-1 text-sm font-medium">
                      {selectedSubmission.next_sync_at
                        ? new Date(selectedSubmission.next_sync_at).toLocaleString()
                        : 'Pending'}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Raw Views</span>
                    <div className="mt-1 text-lg font-bold tabular-nums">{formatViews(selectedSubmission.total_views)}</div>
                  </div>
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Eligible Views</span>
                    <div className="mt-1 text-lg font-bold tabular-nums">{formatViews(selectedSubmission.eligible_views)}</div>
                  </div>
                  <div className="surface-card-elevated p-4 text-center">
                    <span className="text-xs text-text-muted">Verification</span>
                    <div className="mt-1">
                      <Badge variant={selectedSubmission.eligible_views > 0 ? 'success' : 'warning'}>
                        {selectedSubmission.eligible_views > 0 ? 'Verified' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-muted">View verification is performed server-side. Metrics are synced periodically from the platform provider.</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedSubmission(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
