import { useState, useEffect } from 'react';
import { submissionModerationService } from '../../services/submission-moderation.service';
import type { ModerationSubmissionItem } from '../../services/submission-moderation.service';
import type { SubmissionAnalytics, SubmissionStatus, SubmissionSettings } from '../../types/submission';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';

export function AdminSubmissionsPage() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'kanban'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'needs_changes'
    | 'appeals'
    | 'duplicate'
    | 'fraud'
    | 'settings'
  >('dashboard');

  const [loading, setLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<ModerationSubmissionItem[]>([]);
  const [metrics, setMetrics] = useState<SubmissionAnalytics | null>(null);
  const [selectedSub, setSelectedSub] = useState<ModerationSubmissionItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<SubmissionSettings | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const summary = await submissionModerationService.getAnalyticsSummary();
    setMetrics(summary);

    const config = await submissionModerationService.getSettings();
    setSettings(config);

    let statusFilter: SubmissionStatus | undefined = undefined;
    if (activeTab === 'pending') statusFilter = 'pending';
    if (activeTab === 'approved') statusFilter = 'approved';
    if (activeTab === 'rejected') statusFilter = 'rejected';
    if (activeTab === 'needs_changes') statusFilter = 'needs_changes';

    const list = await submissionModerationService.getSubmissions(statusFilter);
    setSubmissions(list);
    setLoading(false);
  };

  const handleDecision = async (
    subId: string,
    decision: 'approve' | 'reject' | 'request_changes' | 'escalate',
    notes: string
  ) => {
    await submissionModerationService.moderateSubmission(subId, decision, notes);
    setSelectedSub(null);
    loadData();
  };

  const handleBulkAction = async (decision: 'approve' | 'reject') => {
    for (const id of selectedIds) {
      await submissionModerationService.moderateSubmission(id, decision, 'Bulk moderated via Admin panel');
    }
    setSelectedIds([]);
    loadData();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const triggerAIAnalyze = async (subId: string) => {
    const res = await submissionModerationService.triggerAIModeration(subId);
    const updated = submissions.map((s) => {
      if (s.id === subId) {
        return { ...s, metadata: res.metadata, fraud: res.fraud, duplicate: res.duplicate };
      }
      return s;
    });
    setSubmissions(updated);
    if (selectedSub?.id === subId) {
      setSelectedSub({
        ...selectedSub,
        metadata: res.metadata,
        fraud: res.fraud,
        duplicate: res.duplicate,
      });
    }
  };

  const exportCSV = () => {
    const header = 'ID,Creator,Campaign,Platform,Views,Reward,Status\n';
    const rows = submissions
      .map((s) => `"${s.id}","${s.creatorName}","${s.campaignName}","${s.platform}",${s.views},${s.rewardCents / 100},"${s.status}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_report_${Date.now()}.csv`;
    a.click();
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-surface/85 p-6 shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Moderation & Submission Suite</h1>
          <p className="mt-1 text-xs text-text-secondary">
            AI compliance logs, audio/video similarity indexes, dynamic clickbait risk detectors, and manual review boards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={exportCSV}>
            <Icon name="download" size={14} /> Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => activeTab !== 'kanban' ? setActiveTab('kanban') : setActiveTab('dashboard')}>
            <Icon name={activeTab === 'kanban' ? 'grid' : 'layout'} size={14} /> {activeTab === 'kanban' ? 'Grid View' : 'Kanban Board'}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border/50 bg-surface/50 p-2 text-xs font-medium backdrop-blur-md">
        {[
          { id: 'dashboard', label: 'Telemetry & Analytics', icon: 'line-chart' },
          { id: 'kanban', label: 'Reviewer Kanban Board', icon: 'columns' },
          { id: 'pending', label: 'Pending Review', icon: 'clock' },
          { id: 'approved', label: 'Approved', icon: 'check' },
          { id: 'rejected', label: 'Rejected', icon: 'x' },
          { id: 'needs_changes', label: 'Needs Changes', icon: 'refresh-cw' },
          { id: 'appeals', label: 'Appeals Queue', icon: 'life-buoy' },
          { id: 'duplicate', label: 'Duplicate Check', icon: 'copy' },
          { id: 'fraud', label: 'Fraud Detection', icon: 'shield-alert' },
          { id: 'settings', label: 'Auto Moderation Settings', icon: 'sliders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedSub(null);
            }}
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

      {/* Statistics Section */}
      {metrics && activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Pending Mod</p>
            <p className="mt-2 text-2xl font-bold text-warning">{metrics.pendingReview}</p>
            <span className="text-[10px] text-text-muted">Awaiting manual click</span>
          </div>
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">AI Flags</p>
            <p className="mt-2 text-2xl font-bold text-danger">{metrics.aiFlaggedCount}</p>
            <span className="text-[10px] text-danger font-medium">Auto-quarantined</span>
          </div>
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Duplicate Index</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{metrics.duplicateCount}</p>
            <span className="text-[10px] text-text-muted">Similarity matches</span>
          </div>
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Fraud Risk</p>
            <p className="mt-2 text-2xl font-bold text-danger">{metrics.fraudRiskCount}</p>
            <span className="text-[10px] text-text-muted">High VPN/Bot activity</span>
          </div>
          <div className="cx-premium-card rounded-3xl border border-border p-4 shadow-xl">
            <p className="text-xs font-semibold text-text-secondary">Avg Response</p>
            <p className="mt-2 text-2xl font-bold text-accent">{metrics.averageReviewTimeMinutes}m</p>
            <span className="text-[10px] text-success font-medium">92% within SLA</span>
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {activeTab === 'kanban' && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { id: 'pending', title: 'Pending Review', color: 'border-warning/40 text-warning', filter: 'pending' },
            { id: 'ai_review', title: 'Under AI Review', color: 'border-accent/40 text-accent', filter: 'pending' },
            { id: 'needs_changes', title: 'Needs Changes', color: 'border-danger/40 text-danger', filter: 'needs_changes' },
            { id: 'approved', title: 'Approved / Cleared', color: 'border-success/40 text-success', filter: 'approved' },
          ].map((column) => {
            const items = submissions.filter((s) => s.status === column.filter);
            return (
              <div key={column.id} className="rounded-3xl border border-border bg-surface/40 p-4 space-y-4 min-h-[480px]">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${column.color}`}>{column.title}</span>
                  <span className="text-[10px] bg-surface-hover px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSub(item)}
                      className="group cursor-pointer rounded-2xl border border-border/80 bg-surface-overlay p-3 hover:bg-surface-hover hover:border-accent/50 transition-all duration-300 shadow-md space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <img src={item.creatorAvatar || '/avatar.png'} className="h-6 w-6 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-text-primary group-hover:text-accent transition">
                            {item.creatorName}
                          </p>
                          <p className="text-[9px] text-text-muted">{item.campaignName}</p>
                        </div>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-20 bg-black/40">
                        <img src={item.thumbnailUrl} className="w-full h-full object-cover opacity-80" />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] px-1 rounded text-white font-mono uppercase">
                          {item.platform}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-secondary">
                        <span>Views: {item.views.toLocaleString()}</span>
                        <span className="font-bold text-success">${(item.rewardCents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid Moderation Queue */}
      {['pending', 'approved', 'rejected', 'needs_changes', 'duplicate', 'fraud'].includes(activeTab) && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by creator name or campaign..."
                className="w-full rounded-2xl border border-border bg-surface-hover/60 pl-10 pr-4 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-2xl px-3 py-1 text-xs">
                <span className="font-bold text-accent">{selectedIds.length} Selected</span>
                <Button variant="primary" size="sm" onClick={() => handleBulkAction('approve')}>
                  Bulk Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleBulkAction('reject')}>
                  Bulk Reject
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-text-secondary">
                  <th className="pb-3">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredSubmissions.length} />
                  </th>
                  <th className="pb-3 font-semibold">Creator</th>
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Views</th>
                  <th className="pb-3 font-semibold">Estimated Reward</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      Syncing moderation data...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-hover/40 transition">
                      <td className="py-3">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleToggleSelect(s.id)} />
                      </td>
                      <td className="py-3 font-bold text-text-primary">{s.creatorName}</td>
                      <td className="py-3 text-text-secondary">{s.campaignName}</td>
                      <td className="py-3 capitalize text-text-secondary">{s.platform}</td>
                      <td className="py-3 text-text-secondary">{s.views.toLocaleString()}</td>
                      <td className="py-3 text-success font-bold">${(s.rewardCents / 100).toFixed(2)}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'approved'
                              ? 'bg-success/15 text-success'
                              : s.status === 'pending'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="glass" size="sm" onClick={() => triggerAIAnalyze(s.id)}>
                            <Icon name="zap" size={12} className="text-accent" /> AI Check
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => setSelectedSub(s)}>
                            Moderate
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

      {/* Appeals Tab */}
      {activeTab === 'appeals' && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary font-display">Creator Dispute Appeals Queue</h2>
            <p className="text-xs text-text-secondary mt-1">Review validation disputes, manual evidence logs, and process payouts override.</p>
          </div>

          <div className="space-y-4">
            {submissions
              .filter((s) => s.status === 'rejected')
              .map((s) => (
                <div key={s.id} className="rounded-2xl border border-border p-4 bg-surface-hover/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={s.creatorAvatar || '/avatar.png'} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{s.creatorName}</h3>
                        <p className="text-[10px] text-text-muted">Dispute for {s.campaignName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-danger/15 text-danger border border-danger/30 font-bold px-2 py-0.5 rounded">
                      Appeal Pending
                    </span>
                  </div>

                  <div className="rounded-xl bg-black/25 p-3 text-xs text-text-secondary border border-border/40">
                    <span className="font-bold text-text-primary block mb-1">Creator Appeal Statement:</span>
                    "The submission was rejected for required hashtags check. However, if you look at the video captions, both #creatorx and #clipping are clearly visible in the bottom overlay screenshot. Please manually check and approve."
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <a href={s.videoUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                      <Icon name="link" size={12} /> View Submission Proof Evidence
                    </a>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleDecision(s.id, 'approve', 'Approved after reviewing appeal evidence')}>
                        Accept Appeal & Pay
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDecision(s.id, 'reject', 'Appeal rejected. Document check still invalid.')}>
                        Dismiss Appeal
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Auto Moderation Settings */}
      {activeTab === 'settings' && settings && (
        <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Auto Moderation Settings</h2>
            <p className="text-xs text-text-secondary mt-1">Adjust automated risk check constraints, OCR matching bounds, and fraud filters.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center justify-between text-xs text-text-primary font-medium">
                <div>
                  <span className="block font-bold">Auto-Approve Low Risk Videos</span>
                  <span className="text-[10px] text-text-secondary">Directly approve submissions below risk threshold</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApprovalEnabled}
                  onChange={(e) => setSettings({ ...settings, autoApprovalEnabled: e.target.checked })}
                  className="rounded accent-accent"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">AI Risk Guard Limit (0-100)</label>
                <input
                  type="number"
                  value={settings.aiThresholdScore}
                  onChange={(e) => setSettings({ ...settings, aiThresholdScore: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Bot/Fraud Severity Filter (0-100)</label>
                <input
                  type="number"
                  value={settings.fraudThresholdScore}
                  onChange={(e) => setSettings({ ...settings, fraudThresholdScore: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Video Duplicate Threshold Match (%)</label>
                <input
                  type="number"
                  value={settings.duplicateThresholdScore}
                  onChange={(e) => setSettings({ ...settings, duplicateThresholdScore: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">SLA Deadline Review Expiry (Hours)</label>
                <input
                  type="number"
                  value={settings.maxReviewTimeHours}
                  onChange={(e) => setSettings({ ...settings, maxReviewTimeHours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface-hover/60 px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => loadData()}>
                  Save Configuration Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Detail Modal Drawer */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedSub.creatorAvatar || '/avatar.png'} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <h3 className="text-base font-bold text-text-primary">{selectedSub.creatorName}</h3>
                  <p className="text-xs text-text-secondary">Submission ID: {selectedSub.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-text-muted hover:text-text-primary">
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Layout Split */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Side: Video Preview & Captions */}
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/80 border border-border/60">
                  <img src={selectedSub.thumbnailUrl} className="w-full h-full object-cover opacity-80" />
                  <a
                    href={selectedSub.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 grid place-items-center bg-black/20 hover:bg-black/40 transition group"
                  >
                    <span className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs text-white font-bold shadow-lg group-hover:scale-105 transition">
                      <Icon name="play" size={14} /> Open Post URL
                    </span>
                  </a>
                </div>

                <div className="rounded-2xl border border-border p-4 bg-surface-hover/30 space-y-3">
                  <h4 className="font-bold text-xs text-text-primary">OCR & Captured Video Captions</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon name="check-circle" size={14} className="text-success shrink-0" />
                      <span>Hashtags Detected: {selectedSub.metadata?.ocrHashtagsChecked.join(', ') || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon name="check-circle" size={14} className="text-success shrink-0" />
                      <span>Mentions Match: {selectedSub.metadata?.ocrMentionsChecked.join(', ') || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon name="check-circle" size={14} className="text-success shrink-0" />
                      <span>Duration verified: {selectedSub.metadata?.videoDurationSeconds || 0} seconds</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Analytics Risk Score & Fraud Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border p-4 bg-surface-hover/30 text-center space-y-2">
                    <span className="text-xs text-text-secondary">AI Risk Score</span>
                    <p
                      className={`text-3xl font-extrabold ${
                        (selectedSub.metadata?.aiRiskScore || 0) > 50 ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {selectedSub.metadata?.aiRiskScore || 0}/100
                    </p>
                    <span className="text-[10px] text-text-muted">Flagged if &gt; 30</span>
                  </div>

                  <div className="rounded-2xl border border-border p-4 bg-surface-hover/30 text-center space-y-2">
                    <span className="text-xs text-text-secondary">Similarity Index</span>
                    <p
                      className={`text-3xl font-extrabold ${
                        (selectedSub.duplicate?.similarityScore || 0) > 50 ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {selectedSub.duplicate?.similarityScore || 0}%
                    </p>
                    <span className="text-[10px] text-text-muted">Overlap ratio check</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-4 bg-surface-hover/30 space-y-3">
                  <h4 className="font-bold text-xs text-text-primary">Fraud & Bot Activity Audits</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon
                        name={selectedSub.fraud?.fakeViewsDetected ? 'alert-triangle' : 'check'}
                        size={14}
                        className={selectedSub.fraud?.fakeViewsDetected ? 'text-danger' : 'text-success'}
                      />
                      <span>Views Audit</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon
                        name={selectedSub.fraud?.vpnProxyUsed ? 'alert-triangle' : 'check'}
                        size={14}
                        className={selectedSub.fraud?.vpnProxyUsed ? 'text-danger' : 'text-success'}
                      />
                      <span>Proxy/VPN</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon
                        name={selectedSub.fraud?.rapidUploadAbuse ? 'alert-triangle' : 'check'}
                        size={14}
                        className={selectedSub.fraud?.rapidUploadAbuse ? 'text-danger' : 'text-success'}
                      />
                      <span>Rate Abuse</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Icon
                        name={selectedSub.fraud?.multiAccountMatch ? 'alert-triangle' : 'check'}
                        size={14}
                        className={selectedSub.fraud?.multiAccountMatch ? 'text-danger' : 'text-success'}
                      />
                      <span>Multi-Accounts</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-2xl border border-border p-4 bg-surface-hover/30 space-y-2">
                  <h4 className="font-bold text-xs text-text-primary">Submission Lifecycle Track</h4>
                  <div className="space-y-3 text-xs pl-2 border-l border-border/60">
                    <div className="relative pl-4">
                      <span className="absolute left-[-21px] top-1 h-2.5 w-2.5 rounded-full bg-success" />
                      <p className="font-bold text-text-primary">Video Upload Verified</p>
                      <p className="text-[9px] text-text-muted">Approved by platform webhook API</p>
                    </div>
                    <div className="relative pl-4">
                      <span className="absolute left-[-21px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                      <p className="font-bold text-text-primary">AI Similarity Checked</p>
                      <p className="text-[9px] text-text-muted">Finished in 4.2 seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-border/60 pt-4 flex justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSub(null)}>
                Close Panel
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDecision(selectedSub.id, 'request_changes', 'Requires video re-edit.')}>
                  Request Changes
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDecision(selectedSub.id, 'reject', 'Reused clip / metadata invalid')}>
                  Reject Post
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleDecision(selectedSub.id, 'approve', 'Verified all checklist criteria')}>
                  Approve & Release Funds
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
