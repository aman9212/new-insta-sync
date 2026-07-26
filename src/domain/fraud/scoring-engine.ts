/**
 * CreatorX Fraud Risk Scoring Engine v1
 *
 * Deterministic, testable, versioned fraud scoring.
 * This runs server-side only — never trust client-side scoring.
 *
 * RULES:
 * - No single heuristic automatically confirms abuse
 * - Scores are combined from individual signals
 * - Weights are configuration-driven
 * - All signals produce evidence for review
 */

export const SCORING_ENGINE_VERSION = 1;

export interface MetricSnapshot {
  raw_views: number;
  raw_likes: number;
  raw_comments: number;
  raw_shares: number;
  raw_saves: number;
  raw_followers: number;
  captured_at: string;
}

export interface FraudSignalResult {
  signal_type: string;
  signal_code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score_contribution: number;
  evidence: Record<string, unknown>;
}

export interface ScoringInput {
  snapshots: MetricSnapshot[];
  submissionId: string;
  creatorId: string;
  // Other submissions from the same creator for cross-pattern analysis
  otherSubmissionSnapshots?: { submissionId: string; snapshots: MetricSnapshot[] }[];
  // Campaign payout threshold for gaming detection
  payoutThresholdViews?: number;
  // Known duplicate external post IDs
  duplicatePostIds?: string[];
}

export interface ScoringConfig {
  weights: Record<string, number>;
  thresholds: {
    low: [number, number];
    medium: [number, number];
    high: [number, number];
    critical: [number, number];
  };
}

export const DEFAULT_CONFIG: ScoringConfig = {
  weights: {
    view_velocity_anomaly: 25,
    engagement_mismatch: 20,
    follower_view_anomaly: 15,
    repeated_identical_growth: 20,
    metric_reversal: 15,
    snapshot_timing_anomaly: 10,
    duplicate_content: 30,
    cross_submission_pattern: 15,
    payout_threshold_gaming: 20,
  },
  thresholds: {
    low: [0, 29],
    medium: [30, 59],
    high: [60, 79],
    critical: [80, 100],
  },
};

function getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Detect abnormal sudden view growth relative to previous snapshots.
 * Compares velocity (delta views / delta time) changes across sequential snapshots.
 */
export function detectViewVelocityAnomaly(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  if (snapshots.length < 3) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const velocities: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const deltaViews = sorted[i].raw_views - sorted[i - 1].raw_views;
    const deltaHours = Math.max(
      1,
      (new Date(sorted[i].captured_at).getTime() - new Date(sorted[i - 1].captured_at).getTime()) / 3600000
    );
    velocities.push(deltaViews / deltaHours);
  }

  if (velocities.length < 2) return null;

  // Find max velocity spike
  const maxVelocity = Math.max(...velocities);
  
  // Calculate average of lower half of velocities to get a stable background baseline
  const sortedVelocities = [...velocities].sort((a, b) => a - b);
  const halfLen = Math.max(1, Math.floor(sortedVelocities.length / 2));
  const avgVelocity = sortedVelocities.slice(0, halfLen).reduce((sum, v) => sum + v, 0) / halfLen;

  const ratio = maxVelocity / Math.max(1, avgVelocity);

  // Spike must be at least 5x average of other periods to flag
  if (ratio < 5) return null;

  const normalizedScore = Math.min(1, (ratio - 5) / 15); // 5x = 0, 20x = 1
  const contribution = Math.round(normalizedScore * maxWeight);

  return {
    signal_type: 'velocity',
    signal_code: 'view_velocity_anomaly',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      avg_background_velocity_per_hour: Math.round(avgVelocity),
      max_velocity_per_hour: Math.round(maxVelocity),
      spike_ratio: Math.round(ratio * 10) / 10,
      snapshot_count: snapshots.length,
    },
  };
}

/**
 * Compare engagement ratios (likes/views, comments/views, shares/views).
 * Flag extreme inconsistencies.
 */
export function detectEngagementMismatch(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  const latest = snapshots[snapshots.length - 1];
  if (!latest || latest.raw_views < 1000) return null;

  const likeRatio = latest.raw_likes / latest.raw_views;
  const commentRatio = latest.raw_comments / latest.raw_views;

  // Typical engagement: likes 2-8%, comments 0.1-2%
  // Suspicious: views with almost zero engagement
  const hasLowEngagement = likeRatio < 0.001 && latest.raw_views > 10000;
  // Suspicious: impossibly high engagement
  const hasHighEngagement = likeRatio > 0.5 && latest.raw_views > 5000;

  if (!hasLowEngagement && !hasHighEngagement) return null;

  const normalizedScore = hasLowEngagement
    ? Math.min(1, (0.001 - likeRatio) / 0.001)
    : Math.min(1, (likeRatio - 0.5) / 0.5);

  const contribution = Math.round(normalizedScore * maxWeight);

  return {
    signal_type: 'engagement',
    signal_code: 'engagement_mismatch',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      like_ratio: Math.round(likeRatio * 10000) / 100,
      comment_ratio: Math.round(commentRatio * 10000) / 100,
      raw_views: latest.raw_views,
      raw_likes: latest.raw_likes,
      pattern: hasLowEngagement ? 'abnormally_low' : 'abnormally_high',
    },
  };
}

/**
 * Compare view volume against known follower count.
 * Very high views-to-followers can be viral (legitimate) — this is a weak signal.
 */
export function detectFollowerViewAnomaly(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  const latest = snapshots[snapshots.length - 1];
  if (!latest || latest.raw_followers <= 0 || latest.raw_views < 1000) return null;

  const ratio = latest.raw_views / latest.raw_followers;

  // Only flag extreme ratios (> 100x followers) as weak signal
  if (ratio < 100) return null;

  const normalizedScore = Math.min(1, (ratio - 100) / 400);
  // Cap at 60% of maxWeight since this is a weak signal (viral content is legitimate)
  const contribution = Math.round(normalizedScore * maxWeight * 0.6);

  return {
    signal_type: 'follower',
    signal_code: 'follower_view_anomaly',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      views_to_followers_ratio: Math.round(ratio * 10) / 10,
      raw_views: latest.raw_views,
      raw_followers: latest.raw_followers,
    },
  };
}

/**
 * Detect suspicious repeated identical metric increments across snapshots.
 */
export function detectRepeatedIdenticalGrowth(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  if (snapshots.length < 4) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    deltas.push(sorted[i].raw_views - sorted[i - 1].raw_views);
  }

  // Count identical deltas (> 100 views to avoid noise)
  const significantDeltas = deltas.filter(d => d > 100);
  if (significantDeltas.length < 3) return null;

  const deltaCounts = new Map<number, number>();
  for (const d of significantDeltas) {
    deltaCounts.set(d, (deltaCounts.get(d) ?? 0) + 1);
  }

  const maxRepeats = Math.max(...deltaCounts.values());
  const repeatRatio = maxRepeats / significantDeltas.length;

  if (repeatRatio < 0.6 || maxRepeats < 3) return null;

  const contribution = Math.round(
    Math.min(1, (repeatRatio - 0.6) / 0.3) * maxWeight
  );

  return {
    signal_type: 'pattern',
    signal_code: 'repeated_identical_growth',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      max_repeat_count: maxRepeats,
      repeat_ratio: Math.round(repeatRatio * 100),
      repeated_delta: [...deltaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
      total_deltas: significantDeltas.length,
    },
  };
}

/**
 * Detect unexplained decreases in cumulative provider metrics.
 */
export function detectMetricReversal(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  let maxReversal = 0;
  let reversalCount = 0;

  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i].raw_views - sorted[i - 1].raw_views;
    if (delta < -10) {
      reversalCount++;
      maxReversal = Math.max(maxReversal, Math.abs(delta));
    }
  }

  if (reversalCount === 0) return null;

  const reversalRatio = reversalCount / (sorted.length - 1);
  const contribution = Math.round(
    Math.min(1, reversalRatio + maxReversal / 100000) * maxWeight
  );

  return {
    signal_type: 'integrity',
    signal_code: 'metric_reversal',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      reversal_count: reversalCount,
      max_reversal_views: maxReversal,
      reversal_ratio: Math.round(reversalRatio * 100),
    },
  };
}

/**
 * Detect inconsistent or manipulated metric ingestion sequences.
 */
export function detectSnapshotTimingAnomaly(
  snapshots: MetricSnapshot[],
  maxWeight: number
): FraudSignalResult | null {
  if (snapshots.length < 3) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(
      new Date(sorted[i].captured_at).getTime() - new Date(sorted[i - 1].captured_at).getTime()
    );
  }

  const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  if (avgInterval <= 0) return null;

  // Check for suspiciously regular intervals (< 1% variance)
  const variance =
    intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length;
  const cv = Math.sqrt(variance) / avgInterval;

  // Very low CV (< 0.01) with many snapshots suggests automated manipulation
  if (cv > 0.01 || intervals.length < 5) return null;

  const contribution = Math.round(Math.min(1, (0.01 - cv) / 0.01) * maxWeight);

  return {
    signal_type: 'timing',
    signal_code: 'snapshot_timing_anomaly',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      coefficient_of_variation: Math.round(cv * 10000) / 100,
      avg_interval_hours: Math.round(avgInterval / 3600000 * 10) / 10,
      snapshot_count: snapshots.length,
    },
  };
}

/**
 * Detect duplicate provider post IDs.
 */
export function detectDuplicateContent(
  duplicatePostIds: string[] | undefined,
  maxWeight: number
): FraudSignalResult | null {
  if (!duplicatePostIds || duplicatePostIds.length === 0) return null;

  return {
    signal_type: 'content',
    signal_code: 'duplicate_content',
    severity: 'high',
    score_contribution: maxWeight,
    evidence: {
      duplicate_count: duplicatePostIds.length,
    },
  };
}

/**
 * Detect suspicious patterns across multiple submissions from the same creator.
 */
export function detectCrossSubmissionPattern(
  otherSubmissions: ScoringInput['otherSubmissionSnapshots'],
  maxWeight: number
): FraudSignalResult | null {
  if (!otherSubmissions || otherSubmissions.length < 2) return null;

  // Check if multiple submissions show identical growth patterns
  const growthPatterns = otherSubmissions.map(sub => {
    const sorted = [...sub.snapshots].sort(
      (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
    );
    return sorted.map((s, i) => (i > 0 ? s.raw_views - sorted[i - 1].raw_views : 0)).slice(1);
  });

  // Compare patterns pairwise
  let similarCount = 0;
  for (let i = 0; i < growthPatterns.length; i++) {
    for (let j = i + 1; j < growthPatterns.length; j++) {
      const minLen = Math.min(growthPatterns[i].length, growthPatterns[j].length);
      if (minLen < 2) continue;
      let matchCount = 0;
      for (let k = 0; k < minLen; k++) {
        const a = growthPatterns[i][k];
        const b = growthPatterns[j][k];
        if (a > 100 && b > 100 && Math.abs(a - b) / Math.max(a, b) < 0.1) {
          matchCount++;
        }
      }
      if (matchCount / minLen > 0.7) similarCount++;
    }
  }

  if (similarCount === 0) return null;

  const contribution = Math.round(Math.min(1, similarCount / 3) * maxWeight);

  return {
    signal_type: 'pattern',
    signal_code: 'cross_submission_pattern',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      similar_pattern_pairs: similarCount,
      submissions_analyzed: otherSubmissions.length,
    },
  };
}

/**
 * Detect suspicious patterns where eligible views stop immediately above payout thresholds.
 */
export function detectPayoutThresholdGaming(
  snapshots: MetricSnapshot[],
  payoutThresholdViews: number | undefined,
  maxWeight: number
): FraudSignalResult | null {
  if (!payoutThresholdViews || payoutThresholdViews <= 0 || snapshots.length < 2) return null;

  const latest = snapshots[snapshots.length - 1];
  if (!latest) return null;

  const viewsAboveThreshold = latest.raw_views - payoutThresholdViews;
  const percentAbove = viewsAboveThreshold / payoutThresholdViews;

  // Views just barely above threshold (0-3% above) and growth stopped
  if (percentAbove < 0 || percentAbove > 0.03) return null;

  // Check if growth has plateaued (compare last 2 snapshots)
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );
  const recentSnapshots = sorted.slice(-2);
  if (recentSnapshots.length < 2) return null;

  const recentGrowth = recentSnapshots[recentSnapshots.length - 1].raw_views - recentSnapshots[0].raw_views;
  const hasPlateaued = recentGrowth < payoutThresholdViews * 0.01;

  if (!hasPlateaued) return null;

  const contribution = Math.round(maxWeight * 0.7);

  return {
    signal_type: 'gaming',
    signal_code: 'payout_threshold_gaming',
    severity: getSeverity(contribution),
    score_contribution: contribution,
    evidence: {
      views: latest.raw_views,
      threshold: payoutThresholdViews,
      percent_above: Math.round(percentAbove * 10000) / 100,
      recent_growth: recentGrowth,
    },
  };
}

/**
 * Main scoring function — runs all detectors and combines signals.
 */
export function calculateFraudScore(
  input: ScoringInput,
  config: ScoringConfig = DEFAULT_CONFIG
): { score: number; level: 'low' | 'medium' | 'high' | 'critical'; signals: FraudSignalResult[] } {
  const signals: FraudSignalResult[] = [];

  const sorted = [...input.snapshots].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const detectors = [
    () => detectViewVelocityAnomaly(sorted, config.weights.view_velocity_anomaly ?? 25),
    () => detectEngagementMismatch(sorted, config.weights.engagement_mismatch ?? 20),
    () => detectFollowerViewAnomaly(sorted, config.weights.follower_view_anomaly ?? 15),
    () => detectRepeatedIdenticalGrowth(sorted, config.weights.repeated_identical_growth ?? 20),
    () => detectMetricReversal(sorted, config.weights.metric_reversal ?? 15),
    () => detectSnapshotTimingAnomaly(sorted, config.weights.snapshot_timing_anomaly ?? 10),
    () => detectDuplicateContent(input.duplicatePostIds, config.weights.duplicate_content ?? 30),
    () => detectCrossSubmissionPattern(input.otherSubmissionSnapshots, config.weights.cross_submission_pattern ?? 15),
    () => detectPayoutThresholdGaming(sorted, input.payoutThresholdViews, config.weights.payout_threshold_gaming ?? 20),
  ];

  for (const detect of detectors) {
    const result = detect();
    if (result) signals.push(result);
  }

  // Combined score is the sum of contributions, capped at 100
  const rawScore = signals.reduce((sum, s) => sum + s.score_contribution, 0);
  const score = Math.min(100, rawScore);

  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (score >= (config.thresholds.critical?.[0] ?? 80)) level = 'critical';
  else if (score >= (config.thresholds.high?.[0] ?? 60)) level = 'high';
  else if (score >= (config.thresholds.medium?.[0] ?? 30)) level = 'medium';

  return { score, level, signals };
}
