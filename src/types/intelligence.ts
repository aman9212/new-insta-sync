// Extended database types for Creator Intelligence

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssessmentStatus = 'clear' | 'monitoring' | 'under_review' | 'confirmed_abuse' | 'false_positive';
// PayoutHoldStatus is imported/exported via database.ts

export interface SubmissionMetricSnapshot {
  id: string;
  submission_id: string;
  provider: string;
  provider_post_id: string | null;
  captured_at: string;
  raw_views: number;
  raw_likes: number;
  raw_comments: number;
  raw_shares: number;
  raw_saves: number;
  raw_followers: number;
  source: string;
  provider_response_hash: string | null;
  created_at: string;
}

export interface FraudAssessment {
  id: string;
  submission_id: string;
  creator_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  assessment_version: number;
  assessment_status: AssessmentStatus;
  assessed_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FraudSignal {
  id: string;
  assessment_id: string;
  signal_type: string;
  signal_code: string;
  severity: RiskLevel;
  score_contribution: number;
  evidence_json: Record<string, unknown>;
  detected_at: string;
}

export interface FraudReviewEvent {
  id: string;
  assessment_id: string;
  action: string;
  actor_id: string | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FraudAssessmentWithSignals extends FraudAssessment {
  signals?: FraudSignal[];
  review_events?: FraudReviewEvent[];
}

export interface CreatorAnalyticsSummary {
  creator_id: string;
  platform: string;
  campaign_id: string;
  campaign_name: string;
  total_submissions: number;
  approved_submissions: number;
  total_raw_views: number;
  total_verified_views: number;
  total_eligible_views: number;
  total_earnings_cents: number;
  paid_earnings_cents: number;
  first_submission_at: string | null;
  last_submission_at: string | null;
}

export interface ProviderConnectionExtended {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string | null;
  provider_username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  encrypted_token: string | null;
  status: string;
  verification_status: string;
  ownership_verified?: boolean;
  verification_method?: string | null;
  verified_at?: string | null;
  connection_status?: string;
  token_expires_at: string | null;
  last_sync_at: string | null;
  connected_at: string;
  updated_at: string;
}

// Signal codes for fraud detection
export const FRAUD_SIGNAL_CODES = {
  VIEW_VELOCITY_ANOMALY: 'view_velocity_anomaly',
  ENGAGEMENT_MISMATCH: 'engagement_mismatch',
  FOLLOWER_VIEW_ANOMALY: 'follower_view_anomaly',
  REPEATED_IDENTICAL_GROWTH: 'repeated_identical_growth',
  METRIC_REVERSAL: 'metric_reversal',
  SNAPSHOT_TIMING_ANOMALY: 'snapshot_timing_anomaly',
  DUPLICATE_CONTENT: 'duplicate_content',
  CROSS_SUBMISSION_PATTERN: 'cross_submission_pattern',
  PAYOUT_THRESHOLD_GAMING: 'payout_threshold_gaming',
} as const;

// Human-readable signal descriptions (safe to show to brands/admins)
export const FRAUD_SIGNAL_DESCRIPTIONS: Record<string, string> = {
  view_velocity_anomaly: 'Unusual view velocity change detected',
  engagement_mismatch: 'Engagement pattern differs significantly from expected ratios',
  follower_view_anomaly: 'View volume unusual relative to follower count',
  repeated_identical_growth: 'Repeated identical metric growth observed',
  metric_reversal: 'Unexplained decrease in cumulative metrics detected',
  snapshot_timing_anomaly: 'Inconsistent metric ingestion sequence detected',
  duplicate_content: 'Duplicate provider post detected',
  cross_submission_pattern: 'Suspicious metric pattern across multiple submissions',
  payout_threshold_gaming: 'Activity concentrated around payout thresholds',
};

// Risk level display config
export const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low Risk', color: 'text-success', bgColor: 'bg-success/10' },
  medium: { label: 'Medium Risk', color: 'text-warning', bgColor: 'bg-warning/10' },
  high: { label: 'High Risk', color: 'text-danger', bgColor: 'bg-danger/10' },
  critical: { label: 'Critical Risk', color: 'text-danger', bgColor: 'bg-danger/20' },
};

export const ASSESSMENT_STATUS_CONFIG: Record<AssessmentStatus, { label: string; color: string }> = {
  clear: { label: 'Clear', color: 'text-success' },
  monitoring: { label: 'Monitoring', color: 'text-warning' },
  under_review: { label: 'Under Review', color: 'text-warning' },
  confirmed_abuse: { label: 'Confirmed Abuse', color: 'text-danger' },
  false_positive: { label: 'False Positive', color: 'text-text-muted' },
};
