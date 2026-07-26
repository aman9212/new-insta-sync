import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { listBrandSubmissions } from '../../services/submission.service';
import { getSubmissionFraudAssessment, getSubmissionSnapshots, brandFlagSubmission } from '../../services/intelligence.service';
import { adminModerateSubmission } from '../../services/admin.service';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PremiumChart } from '../../components/ui/Chart';
import { formatCents, formatViews } from '../../lib/currency';
import type { SubmissionWithJoins, FraudAssessmentWithSignals, SubmissionMetricSnapshot } from '../../types';

export function BrandCreatorIntelligencePage() {
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [selectedSub, setSelectedSub] = useState<SubmissionWithJoins | null>(null);
  const [assessment, setAssessment] = useState<FraudAssessmentWithSignals | null>(null);
  const [snapshots, setSnapshots] = useState<SubmissionMetricSnapshot[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Flag action states
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  // Moderation state
  const [moderating, setModerating] = useState(false);

  async function loadSubmissions() {
    try {
      const data = await listBrandSubmissions();
      setSubmissions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load submissions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function handleViewRisk(sub: SubmissionWithJoins) {
    setSelectedSub(sub);
    setLoadingModal(true);
    try {
      const [assessData, snapshotData] = await Promise.all([
        getSubmissionFraudAssessment(sub.id),
        getSubmissionSnapshots(sub.id),
      ]);
      setAssessment(assessData);
      setSnapshots(snapshotData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModal(false);
    }
  }

  async function handleFlagForVerification() {
    if (!selectedSub || !flagReason.trim()) return;
    setFlagging(true);
    try {
      await brandFlagSubmission(selectedSub.id, flagReason);
      setFlagModalOpen(false);
      setFlagReason('');
      setSelectedSub(null);
      await loadSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to flag submission');
    } finally {
      setFlagging(false);
    }
  }

  async function handleModerate(status: 'eligible' | 'rejected') {
    if (!selectedSub) return;
    const promptReason = status === 'rejected' ? prompt('Please enter rejection reason:') : undefined;
    if (status === 'rejected' && promptReason === null) return; // user cancelled

    const reason = promptReason || undefined;

    setModerating(true);
    try {
      await adminModerateSubmission(selectedSub.id, status, reason);
      setSelectedSub(null);
      await loadSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Moderation failed');
    } finally {
      setModerating(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(s =>
      (s.creator_name ?? '').toLowerCase().includes(q) ||
      (s.campaign_name ?? '').toLowerCase().includes(q) ||
      s.post_url.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  const chartData = useMemo(() => {
    return snapshots.map(s => ({
      date: new Date(s.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }),
      value: Number(s.raw_views),
    }));
  }, [snapshots]);

  // Calculations for engagement ratios
  const engagementMetrics = useMemo(() => {
    if (snapshots.length === 0) return null;
    const latest = snapshots[snapshots.length - 1];
    const views = latest.raw_views || 1;
    return {
      likeRatio: (latest.raw_likes / views) * 100,
      commentRatio: (latest.raw_comments / views) * 100,
      shareRatio: (latest.raw_shares / views) * 100,
    };
  }, [snapshots]);

  if (loading) return <TableSkeleton rows={8} cols={7} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Creator Intelligence</h1>
        <p className="mt-1 text-text-secondary">Brand audit panel: monitor verification metrics and signals for submitted content.</p>
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-sm">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search creator, campaign, or link..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface border border-border text-sm placeholder:text-text-muted focus:border-accent"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/40 text-text-muted">
                <th className="p-4 font-medium">Creator</th>
                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium text-right">Raw Views</th>
                <th className="p-4 font-medium text-right">Verified</th>
                <th className="p-4 font-medium text-right">Eligible</th>
                <th className="p-4 font-medium text-right">Est. Payout</th>
                <th className="p-4 font-medium">Verification Status</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(sub => {
                // Approximate risk level from status or internal logic
                const isUnderReview = (sub.status as string) === 'flagged' || (sub.status as string) === 'under_review';
                
                return (
                  <tr key={sub.id} className="hover:bg-surface-hover/20">
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{sub.creator_name || 'Creator'}</div>
                      <div className="text-xs text-text-muted uppercase">{sub.platform}</div>
                    </td>
                    <td className="p-4 truncate max-w-[150px]">{sub.campaign_name}</td>
                    <td className="p-4 text-right tabular-nums">{formatViews(sub.total_views)}</td>
                    <td className="p-4 text-right tabular-nums">{formatViews(sub.total_views)}</td>
                    <td className="p-4 text-right tabular-nums">{formatViews(sub.eligible_views)}</td>
                    <td className="p-4 text-right tabular-nums text-success font-medium">
                      {formatCents(sub.earnings_cents)}
                    </td>
                    <td className="p-4">
                      <Badge variant={isUnderReview ? 'warning' : sub.status === 'eligible' || sub.status === 'paid' ? 'success' : 'default'}>
                        {isUnderReview ? 'Under Verification' : sub.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewRisk(sub)}
                      >
                        <Icon name="bar-chart" size={14} /> Risk Analysis
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis Drawer Modal */}
      <Modal
        open={!!selectedSub && !flagModalOpen}
        onClose={() => setSelectedSub(null)}
        title="Creator Performance & Risk Analysis"
        size="xl"
      >
        {selectedSub && (
          <div className="space-y-6">
            {loadingModal ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Icon name="refresh" size={24} animation="spin" className="text-accent" />
                <span className="text-xs text-text-muted">Loading metrics snapshots...</span>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Chart & Snapshots */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-text-primary">Metric Growth Over Time</h3>
                  <PremiumChart
                    data={chartData}
                    label="Views Ingestion"
                    height={220}
                  />

                  {/* Signals list */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Detected Signals</h4>
                    {assessment && assessment.signals && assessment.signals.length > 0 ? (
                      <div className="space-y-2">
                        {assessment.signals.map(s => (
                          <div key={s.id} className="bg-surface border border-border p-3 rounded-xl flex items-start gap-2.5">
                            <Icon name="alert-triangle" size={16} className="text-warning shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <div className="font-semibold text-text-primary capitalize">{s.signal_type} Anomaly</div>
                              <p className="text-text-muted mt-0.5">Additional verification recommended based on ingestion trends.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted bg-surface/50 border border-border p-3 rounded-xl flex items-center gap-2">
                        <Icon name="shield-check" size={16} className="text-success" />
                        No critical patterns or anomalies detected.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar details */}
                <div className="space-y-5 bg-surface-elevated/40 border border-border p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Risk Profile</span>
                    <div className="text-lg font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
                      {assessment ? (
                        <span className={
                          assessment.risk_level === 'critical' || assessment.risk_level === 'high' ? 'text-danger' :
                          assessment.risk_level === 'medium' ? 'text-warning' : 'text-success'
                        }>
                          {assessment.risk_level.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-text-muted">PENDING</span>
                      )}
                    </div>
                  </div>

                  {engagementMetrics && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-text-muted uppercase">Engagement Ratios</span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Likes/Views:</span>
                          <span className="font-medium tabular-nums">{engagementMetrics.likeRatio.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Comments/Views:</span>
                          <span className="font-medium tabular-nums">{engagementMetrics.commentRatio.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Shares/Views:</span>
                          <span className="font-medium tabular-nums">{engagementMetrics.shareRatio.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission details */}
                  <div className="space-y-2 text-xs border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Campaign:</span>
                      <span className="text-text-primary font-medium">{selectedSub.campaign_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Platform:</span>
                      <span className="text-text-primary capitalize">{selectedSub.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Submission ID:</span>
                      <span className="text-text-muted font-mono">{selectedSub.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <Button
                      variant="danger"
                      className="w-full text-xs h-9"
                      onClick={() => setFlagModalOpen(true)}
                    >
                      <Icon name="flag" size={13} /> Flag for Verification
                    </Button>
                    {selectedSub.status === 'processing' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          variant="secondary"
                          className="text-xs h-9 border border-border"
                          onClick={() => handleModerate('rejected')}
                          disabled={moderating}
                        >
                          <Icon name="x" size={13} /> Reject
                        </Button>
                        <Button
                          variant="primary"
                          className="text-xs h-9"
                          onClick={() => handleModerate('eligible')}
                          disabled={moderating}
                        >
                          <Icon name="check" size={13} /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => setSelectedSub(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Flag submission reason Modal */}
      <Modal
        open={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        title="Flag Submission for Verification"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Flagging this submission puts pending payouts on hold and triggers a manual fraud assessment queue for the admin team.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Reason for flagging:</label>
            <textarea
              rows={4}
              placeholder="e.g. Unusual metric progression, suspicious engagement patterns..."
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface border border-border text-sm focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFlagModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleFlagForVerification}
              disabled={flagging || !flagReason.trim()}
              loading={flagging}
            >
              Flag Submission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
