import { supabase } from '../lib/supabase';
import type {
  SubmissionMetricSnapshot,
  FraudAssessmentWithSignals,
  CreatorAnalyticsSummary,
  ProviderConnectionExtended,
} from '../types';

// ============================================================
// Creator Daily Analytics
// ============================================================

export interface CreatorDailyAnalytics {
  day: string;
  raw_views: number;
  verified_views: number;
  eligible_views: number;
  pending_earnings: number;
  credited_earnings: number;
  paid_earnings: number;
  submission_count: number;
  approved_submission_count: number;
}

export async function getCreatorDailyAnalytics(filters?: {
  platform?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CreatorDailyAnalytics[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_creator_daily_analytics', {
    platform_filter: filters?.platform || null,
    campaign_id_filter: filters?.campaignId && filters.campaignId !== 'all' ? filters.campaignId : null,
    start_date: filters?.startDate || null,
    end_date: filters?.endDate || null,
  });
  if (error) throw error;
  return (data ?? []) as CreatorDailyAnalytics[];
}

export interface CreatorActionItem {
  type: string;
  priority: string;
  title: string;
  description: string;
  target_route: string;
  created_at: string;
}

export async function getCreatorActionItems(): Promise<CreatorActionItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_creator_action_items');
  if (error) throw error;
  return (data ?? []) as CreatorActionItem[];
}

// ============================================================
// Creator Analytics
// ============================================================

export async function getCreatorAnalytics(filters?: {
  platform?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CreatorAnalyticsSummary[]> {
  if (!supabase) return [];
  let query = supabase.from('creator_analytics_summary').select('*');

  if (filters?.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.campaignId && filters.campaignId !== 'all') {
    query = query.eq('campaign_id', filters.campaignId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let results = (data ?? []) as CreatorAnalyticsSummary[];

  // Client-side date filtering on aggregated data
  if (filters?.startDate) {
    results = results.filter(r => !r.last_submission_at || r.last_submission_at >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter(r => !r.first_submission_at || r.first_submission_at <= filters.endDate!);
  }

  return results;
}

// ============================================================
// Metric Snapshots
// ============================================================

export async function getSubmissionSnapshots(submissionId: string): Promise<SubmissionMetricSnapshot[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('submission_metric_snapshots')
    .select('*')
    .eq('submission_id', submissionId)
    .order('captured_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubmissionMetricSnapshot[];
}

// ============================================================
// Fraud Assessments (Brand/Admin)
// ============================================================

export async function getSubmissionFraudAssessment(submissionId: string): Promise<FraudAssessmentWithSignals | null> {
  if (!supabase) return null;
  const { data: assessment, error } = await supabase
    .from('fraud_assessments')
    .select('*')
    .eq('submission_id', submissionId)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!assessment) return null;

  const typed = assessment as FraudAssessmentWithSignals;

  // Load signals
  const { data: signals } = await supabase
    .from('fraud_signals')
    .select('*')
    .eq('assessment_id', typed.id)
    .order('score_contribution', { ascending: false });
  typed.signals = (signals ?? []) as FraudAssessmentWithSignals['signals'];

  // Load review events
  const { data: events } = await supabase
    .from('fraud_review_events')
    .select('*')
    .eq('assessment_id', typed.id)
    .order('created_at', { ascending: false });
  typed.review_events = (events ?? []) as FraudAssessmentWithSignals['review_events'];

  return typed;
}

// ============================================================
// Brand: Flag submission
// ============================================================

export async function brandFlagSubmission(submissionId: string, reason: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.rpc('brand_flag_submission', {
    target_submission_id: submissionId,
    flag_reason: reason,
  });
  if (error) throw error;
  return data as string;
}

// ============================================================
// Admin: Fraud review actions
// ============================================================

export async function adminReviewFraud(
  assessmentId: string,
  action: 'clear' | 'monitor' | 'confirm_abuse' | 'false_positive',
  reason?: string,
  notes?: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('admin_review_fraud', {
    target_assessment_id: assessmentId,
    review_action: action,
    review_reason: reason ?? null,
    review_notes: notes ?? null,
  });
  if (error) throw error;
}

// ============================================================
// Admin: List assessments for review queue
// ============================================================

export async function listFraudReviewQueue(filters?: {
  riskLevel?: string;
  status?: string;
}): Promise<FraudAssessmentWithSignals[]> {
  if (!supabase) return [];
  let query = supabase
    .from('fraud_assessments')
    .select('*')
    .order('risk_score', { ascending: false });

  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    query = query.eq('risk_level', filters.riskLevel);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('assessment_status', filters.status);
  } else {
    query = query.in('assessment_status', ['under_review', 'monitoring']);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  return (data ?? []) as FraudAssessmentWithSignals[];
}

// ============================================================
// Linked Social Accounts
// ============================================================

export async function getLinkedAccounts(): Promise<ProviderConnectionExtended[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('provider_connections')
    .select('*')
    .order('connected_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProviderConnectionExtended[];
}

export async function disconnectAccount(connectionId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  // Soft disconnect — mark as revoked, don't delete (preserve financial history)
  const { error } = await supabase
    .from('provider_connections')
    .update({ status: 'revoked' })
    .eq('id', connectionId);
  if (error) throw error;
}

// ============================================================
// CSV Export
// ============================================================

export function exportAnalyticsToCSV(data: CreatorAnalyticsSummary[]): string {
  const headers = [
    'Campaign', 'Platform', 'Submissions', 'Approved',
    'Raw Views', 'Verified Views', 'Eligible Views',
    'Total Earnings', 'Paid Earnings'
  ];

  function escapeValue(val: any): string {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const rows = data.map(row => [
    escapeValue(row.campaign_name),
    escapeValue(row.platform),
    escapeValue(row.total_submissions),
    escapeValue(row.approved_submissions),
    escapeValue(row.total_raw_views),
    escapeValue(row.total_verified_views),
    escapeValue(row.total_eligible_views),
    ((row.total_earnings_cents ?? 0) / 100).toFixed(2),
    ((row.paid_earnings_cents ?? 0) / 100).toFixed(2),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ============================================================
// Fraud Score Calculation (Safe & Robust)
// ============================================================

export interface SnapshotInput {
  captured_at: string;
  raw_views: number;
  raw_likes: number;
  raw_followers: number;
}

export interface FraudSignalOutput {
  signal_type: string;
  signal_code: string;
  severity: 'low' | 'medium' | 'high';
  score_contribution: number;
  evidence: Record<string, any>;
}

export interface FraudScoreResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  signals: FraudSignalOutput[];
}

export function calculateFraudScore(
  snapshots: SnapshotInput[],
  duplicatePostIds: string[] = [],
  payoutThresholdViews: number = 0
): FraudScoreResult {
  const signals: FraudSignalOutput[] = [];
  if (!snapshots || snapshots.length === 0) {
    return { score: 0, level: 'low', signals: [] };
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );
  const latest = sorted[sorted.length - 1];

  // 1. View Velocity Anomaly (Sub-second capture & divide-by-zero protection)
  if (sorted.length >= 3) {
    const velocities: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const deltaViews = Math.max(0, (sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0));
      const timeDiffMs = new Date(sorted[i].captured_at).getTime() - new Date(sorted[i - 1].captured_at).getTime();
      // Ensure min threshold of 0.01666 hours (1 minute) to prevent Infinity on sub-second snapshots
      const deltaHours = Math.max(0.01666, timeDiffMs / 3600000);
      velocities.push(deltaViews / deltaHours);
    }

    const maxVelocity = Math.max(...velocities);
    const sortedVelocities = [...velocities].sort((a, b) => a - b);
    const halfLen = Math.max(1, Math.floor(sortedVelocities.length / 2));
    const avgVelocity = sortedVelocities.slice(0, halfLen).reduce((s, v) => s + v, 0) / halfLen;

    const safeAvgVelocity = avgVelocity <= 0 ? 1 : avgVelocity;
    const ratio = isNaN(maxVelocity / safeAvgVelocity) ? 1 : maxVelocity / safeAvgVelocity;

    if (ratio >= 5 && maxVelocity > 500) {
      const contribution = Math.round(Math.min(1, (ratio - 5) / 15) * 25);
      signals.push({
        signal_type: 'velocity',
        signal_code: 'view_velocity_anomaly',
        severity: contribution >= 20 ? 'high' : 'medium',
        score_contribution: contribution,
        evidence: { avg_background_velocity_per_hour: avgVelocity, max_velocity_per_hour: maxVelocity, spike_ratio: ratio },
      });
    }
  }

  // 2. Engagement Mismatch (Zero-views & NaN protection)
  if (latest && latest.raw_views >= 1000) {
    const safeViews = Math.max(1, latest.raw_views);
    const rawLikes = Math.max(0, latest.raw_likes ?? 0);
    const likeRatio = rawLikes / safeViews;

    const hasLowEngagement = likeRatio < 0.001 && latest.raw_views > 10000;
    const hasHighEngagement = likeRatio > 0.5 && latest.raw_views > 5000;

    if (hasLowEngagement || hasHighEngagement) {
      const score = hasLowEngagement
        ? Math.min(1, (0.001 - likeRatio) / 0.001)
        : Math.min(1, (likeRatio - 0.5) / 0.5);
      const contribution = Math.round(score * 20);
      signals.push({
        signal_type: 'engagement',
        signal_code: 'engagement_mismatch',
        severity: contribution >= 15 ? 'high' : 'medium',
        score_contribution: contribution,
        evidence: { like_ratio: likeRatio, pattern: hasLowEngagement ? 'abnormally_low' : 'abnormally_high' },
      });
    }
  }

  // 3. Follower View Anomaly
  if (latest && (latest.raw_followers ?? 0) > 0 && latest.raw_views >= 1000) {
    const ratio = latest.raw_views / latest.raw_followers;
    if (ratio >= 100) {
      const contribution = Math.round(Math.min(1, (ratio - 100) / 400) * 15 * 0.6);
      signals.push({
        signal_type: 'follower',
        signal_code: 'follower_view_anomaly',
        severity: 'low',
        score_contribution: contribution,
        evidence: { views_to_followers_ratio: ratio },
      });
    }
  }

  // 4. Repeated Identical Growth
  if (sorted.length >= 4) {
    const deltas: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      deltas.push((sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0));
    }
    const significant = deltas.filter(d => d > 100);
    if (significant.length >= 3) {
      const counts = new Map<number, number>();
      for (const d of significant) counts.set(d, (counts.get(d) ?? 0) + 1);
      const maxRepeats = Math.max(...Array.from(counts.values()));
      const ratio = maxRepeats / significant.length;
      if (ratio >= 0.6 && maxRepeats >= 3) {
        const contribution = Math.round(Math.min(1, (ratio - 0.6) / 0.3) * 20);
        signals.push({
          signal_type: 'pattern',
          signal_code: 'repeated_identical_growth',
          severity: contribution >= 15 ? 'high' : 'medium',
          score_contribution: contribution,
          evidence: { repeat_count: maxRepeats, repeat_ratio: ratio },
        });
      }
    }
  }

  // 5. Metric Reversal
  if (sorted.length >= 2) {
    let reversalCount = 0;
    let maxReversal = 0;
    for (let i = 1; i < sorted.length; i++) {
      const delta = (sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0);
      if (delta < -10) {
        reversalCount++;
        maxReversal = Math.max(maxReversal, Math.abs(delta));
      }
    }
    if (reversalCount > 0) {
      const ratio = reversalCount / (sorted.length - 1);
      const contribution = Math.round(Math.min(1, ratio + maxReversal / 100000) * 15);
      signals.push({
        signal_type: 'integrity',
        signal_code: 'metric_reversal',
        severity: 'high',
        score_contribution: contribution,
        evidence: { reversal_count: reversalCount, max_reversal_views: maxReversal },
      });
    }
  }

  // 6. Duplicate Content
  if (duplicatePostIds && duplicatePostIds.length > 0) {
    signals.push({
      signal_type: 'content',
      signal_code: 'duplicate_content',
      severity: 'high',
      score_contribution: 30,
      evidence: { duplicate_count: duplicatePostIds.length },
    });
  }

  // 7. Payout Threshold Gaming
  if (latest && payoutThresholdViews && payoutThresholdViews > 0 && sorted.length >= 2) {
    const viewsAbove = latest.raw_views - payoutThresholdViews;
    const percentAbove = viewsAbove / payoutThresholdViews;
    if (percentAbove >= 0 && percentAbove <= 0.03) {
      const recent = sorted.slice(-3);
      if (recent.length >= 2) {
        const recentGrowth = recent[recent.length - 1].raw_views - recent[0].raw_views;
        if (recentGrowth < payoutThresholdViews * 0.01) {
          signals.push({
            signal_type: 'gaming',
            signal_code: 'payout_threshold_gaming',
            severity: 'medium',
            score_contribution: 14,
            evidence: { views_percent_above: percentAbove, recent_growth: recentGrowth },
          });
        }
      }
    }
  }

  const rawScore = signals.reduce((sum, s) => sum + (s.score_contribution || 0), 0);
  const score = Math.min(100, Math.max(0, isNaN(rawScore) ? 0 : rawScore));
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (score >= 80) level = 'critical';
  else if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  return { score, level, signals };
}

