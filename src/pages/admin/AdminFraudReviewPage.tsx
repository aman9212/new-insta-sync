import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { listFraudReviewQueue, getSubmissionFraudAssessment, getSubmissionSnapshots, adminReviewFraud } from '../../services/intelligence.service';
import { listAdminTable } from '../../services/admin.service';
import { StatCard } from '../../components/ui/StatCard';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PremiumChart } from '../../components/ui/Chart';
import { formatCents, formatViews } from '../../lib/currency';
import type { FraudAssessmentWithSignals, SubmissionMetricSnapshot, SubmissionWithJoins } from '../../types';

export function AdminFraudReviewPage() {
  const [queue, setQueue] = useState<FraudAssessmentWithSignals[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [riskFilter, setRiskFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Case Detail selection
  const [selectedAssessment, setSelectedAssessment] = useState<FraudAssessmentWithSignals | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubmissionWithJoins | null>(null);
  const [snapshots, setSnapshots] = useState<SubmissionMetricSnapshot[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action states
  const [actionModal, setActionModal] = useState<'confirm_abuse' | 'false_positive' | 'clear' | 'monitor' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actioning, setActioning] = useState(false);

  async function loadData() {
    try {
      const [queueData, subsData] = await Promise.all([
        listFraudReviewQueue({ status: 'under_review' }),
        listAdminTable('submissions'),
      ]);
      setQueue(queueData);
      setSubmissions(subsData as SubmissionWithJoins[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load fraud queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Map submission details to assessments
  const queueWithSubmissions = useMemo(() => {
    return queue.map(a => {
      const sub = submissions.find(s => s.id === a.submission_id);
      return {
        ...a,
        submission: sub,
      };
    });
  }, [queue, submissions]);

  // Aggregate queue metrics for dashboard cards
  const stats = useMemo(() => {
    return {
      underReview: queue.filter(q => q.assessment_status === 'under_review').length,
      highRisk: queue.filter(q => q.risk_level === 'high').length,
      criticalRisk: queue.filter(q => q.risk_level === 'critical').length,
      monitoring: queue.filter(q => q.assessment_status === 'monitoring').length,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    let list = [...queueWithSubmissions];
    if (riskFilter !== 'all') list = list.filter(q => q.risk_level === riskFilter);
    if (platformFilter !== 'all') list = list.filter(q => q.submission?.platform === platformFilter);
    return list;
  }, [queueWithSubmissions, riskFilter, platformFilter]);

  async function handleSelectCase(assess: FraudAssessmentWithSignals) {
    setSelectedAssessment(assess);
    const sub = submissions.find(s => s.id === assess.submission_id) || null;
    setSelectedSub(sub);
    setLoadingDetail(true);
    try {
      // Reload full assessment details (signals, etc) and snapshots
      const [fullAssess, snapshotData] = await Promise.all([
        getSubmissionFraudAssessment(assess.submission_id),
        getSubmissionSnapshots(assess.submission_id),
      ]);
      if (fullAssess) setSelectedAssessment(fullAssess);
      setSnapshots(snapshotData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handlePerformAction() {
    if (!selectedAssessment || !actionModal) return;
    
    // Require reasons for abusive or false positive declarations
    if ((actionModal === 'confirm_abuse' || actionModal === 'false_positive') && !actionReason.trim()) {
      alert('A review justification/reason is required for this action.');
      return;
    }

    setActioning(true);
    try {
      await adminReviewFraud(selectedAssessment.id, actionModal, actionReason, actionNotes);
      setActionModal(null);
      setActionReason('');
      setActionNotes('');
      setSelectedAssessment(null);
      setSelectedSub(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action execution failed');
    } finally {
      setActioning(false);
    }
  }

  const chartData = useMemo(() => {
    return snapshots.map(s => ({
      date: new Date(s.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }),
      value: Number(s.raw_views),
    }));
  }, [snapshots]);

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

  if (loading) return <TableSkeleton rows={8} cols={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Fraud Review Center</h1>
        <p className="mt-1 text-text-secondary">Perform authoritative fraud audits, signal correlations, and escrow releases.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Submissions Under Review" value={stats.underReview} icon={<Icon name="shield-alert" size={18} />} />
        <StatCard label="High Risk Cases" value={stats.highRisk} icon={<Icon name="alert-triangle" size={18} className="text-danger" />} />
        <StatCard label="Critical Risk Cases" value={stats.criticalRisk} icon={<Icon name="ban" size={18} className="text-danger" />} />
        <StatCard label="Case Monitoring" value={stats.monitoring} />
      </div>

      {/* Queue Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="h-9 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical Risk Only</option>
          <option value="high">High Risk Only</option>
          <option value="medium">Medium Risk Only</option>
          <option value="low">Low Risk Only</option>
        </select>
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
      </div>

      {/* Queue List */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/40 text-text-muted">
                <th className="p-4 font-medium">Case ID</th>
                <th className="p-4 font-medium">Platform</th>
                <th className="p-4 font-medium text-right">Risk Score</th>
                <th className="p-4 font-medium">Risk Level</th>
                <th className="p-4 font-medium">Escrow Status</th>
                <th className="p-4 font-medium text-center">Audited Age</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQueue.map(item => (
                <tr key={item.id} className="hover:bg-surface-hover/20">
                  <td className="p-4">
                    <div className="font-medium text-text-primary">Case #{item.id.slice(0, 8)}</div>
                    <div className="text-xs text-text-muted">Sub: {item.submission_id.slice(0, 8)}...</div>
                  </td>
                  <td className="p-4 uppercase text-xs font-semibold">{item.submission?.platform || 'unknown'}</td>
                  <td className="p-4 text-right tabular-nums font-bold text-text-primary">{item.risk_score}/100</td>
                  <td className="p-4">
                    <Badge variant={
                      item.risk_level === 'critical' || item.risk_level === 'high' ? 'danger' :
                      item.risk_level === 'medium' ? 'warning' : 'success'
                    }>
                      {item.risk_level}
                    </Badge>
                  </td>
                  <td className="p-4 capitalize text-xs text-text-muted">{item.submission?.payout_status || 'Hold'}</td>
                  <td className="p-4 text-center text-xs text-text-muted">
                    {new Date(item.assessed_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectCase(item)}
                    >
                      Audit Case <Icon name="chevron-right" size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Fraud review queue is currently empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      <Modal
        open={!!selectedAssessment && !actionModal}
        onClose={() => { setSelectedAssessment(null); setSelectedSub(null); }}
        title={`Audit Fraud Assessment Case #${selectedAssessment?.id.slice(0, 8)}`}
        size="xl"
      >
        {selectedAssessment && (
          <div className="space-y-6">
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Icon name="refresh" size={24} animation="spin" className="text-accent" />
                <span className="text-xs text-text-muted">Correlating signals and snapshots...</span>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Left panel: Chart and signals */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Ingestion Velocity Metrics</h3>
                    <PremiumChart
                      data={chartData}
                      label="Audit Views"
                      height={200}
                    />
                  </div>

                  {/* Signals evidence */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text-primary">Ingestion Anomalies & Fraud Signals</h3>
                    <div className="space-y-2">
                      {selectedAssessment.signals?.map(s => (
                        <div key={s.id} className="surface-card-elevated p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary capitalize">{s.signal_type} Signal</span>
                            <Badge variant={s.severity === 'critical' || s.severity === 'high' ? 'danger' : 'warning'} size="sm">
                              +{s.score_contribution} pts
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Code: <span className="font-mono text-accent">{s.signal_code}</span>
                          </p>
                          <div className="bg-surface p-2.5 rounded-lg text-[10px] font-mono text-text-muted overflow-x-auto">
                            {JSON.stringify(s.evidence_json, null, 2)}
                          </div>
                        </div>
                      ))}
                      {(!selectedAssessment.signals || selectedAssessment.signals.length === 0) && (
                        <p className="text-xs text-text-muted">No algorithmic flags triggered on this case.</p>
                      )}
                    </div>
                  </div>

                  {/* Review Events History */}
                  {selectedAssessment.review_events && selectedAssessment.review_events.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h3 className="text-sm font-semibold text-text-primary">Audit Timeline</h3>
                      <div className="space-y-2">
                        {selectedAssessment.review_events.map(e => (
                          <div key={e.id} className="text-xs border-l-2 border-border pl-3 space-y-1">
                            <div className="font-semibold text-text-secondary">{e.action}</div>
                            {e.reason && <p className="text-text-muted">Reason: {e.reason}</p>}
                            <span className="text-[10px] text-text-muted">{new Date(e.created_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right panel: Details & Decisions */}
                <div className="space-y-5 bg-surface-elevated/40 border border-border p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Cumulative Risk Score</span>
                    <div className="text-3xl font-extrabold text-text-primary tabular-nums mt-0.5">
                      {selectedAssessment.risk_score}
                      <span className="text-xs text-text-muted font-normal">/100</span>
                    </div>
                    <div className="mt-1">
                      <Badge variant={
                        selectedAssessment.risk_level === 'critical' || selectedAssessment.risk_level === 'high' ? 'danger' : 'warning'
                      }>
                        {selectedAssessment.risk_level} risk
                      </Badge>
                    </div>
                  </div>

                  {engagementMetrics && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-text-muted uppercase">Engagement Summary</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Likes:</span>
                          <span className="font-semibold">{engagementMetrics.likeRatio.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Comments:</span>
                          <span className="font-semibold">{engagementMetrics.commentRatio.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSub && (
                    <div className="space-y-2 text-xs border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Creator ID:</span>
                        <span className="font-mono text-text-muted">{selectedSub.creator_id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Campaign ID:</span>
                        <span className="font-mono text-text-muted">{selectedSub.campaign_id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Eligible Views:</span>
                        <span>{formatViews(selectedSub.eligible_views)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Payout Impact:</span>
                        <span className="text-success font-semibold">{formatCents(selectedSub.earnings_cents)}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Decision Panel */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <Button
                      variant="danger"
                      className="w-full text-xs h-9"
                      onClick={() => setActionModal('confirm_abuse')}
                    >
                      <Icon name="ban" size={13} /> Confirm Abuse (Hold/Reversal)
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full text-xs h-9"
                      onClick={() => setActionModal('false_positive')}
                    >
                      <Icon name="shield-check" size={13} /> Mark False Positive
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs h-8 border border-border"
                        onClick={() => setActionModal('monitor')}
                      >
                        Monitor
                      </Button>
                      <Button
                        variant="secondary"
                        className="text-xs h-8 border border-border"
                        onClick={() => setActionModal('clear')}
                      >
                        Clear Case
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => { setSelectedAssessment(null); setSelectedSub(null); }}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Decision Modals */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal === 'confirm_abuse' ? 'Confirm Abuse / Fraud Decision' :
          actionModal === 'false_positive' ? 'Mark Case as False Positive' :
          actionModal === 'clear' ? 'Clear Review Case' : 'Place Case Under Monitoring'
        }
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            {actionModal === 'confirm_abuse' && 'This action is irreversible. The submission payout status will be set to reversed, and any pending credit will be permanently withheld.'}
            {actionModal === 'false_positive' && 'This will release all verification escrow holds, enabling the creator to request settlements on their verified earnings.'}
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Justification / Reason (Required):</label>
              <input
                type="text"
                placeholder="e.g. Verified metric reversal anomalies, pattern matches..."
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Internal Auditor Notes:</label>
              <textarea
                rows={3}
                placeholder="Write optional review logs..."
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface border border-border text-sm focus:border-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button
              variant={actionModal === 'confirm_abuse' ? 'danger' : 'primary'}
              onClick={handlePerformAction}
              disabled={actioning || !actionReason.trim()}
              loading={actioning}
            >
              Execute Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
