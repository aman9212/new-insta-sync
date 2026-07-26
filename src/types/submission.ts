// Submission Management & AI Moderation TypeScript Interfaces

export type SubmissionStatus =
  | 'pending'
  | 'ai_review'
  | 'manual_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes'
  | 'escalated';

export interface SubmissionReviewer {
  id: string;
  userId: string;
  name: string;
  email: string;
  activeWorkload: number;
  completedReviewsCount: number;
  averageResponseTimeSeconds: number;
  createdAt: string;
}

export interface SubmissionModerationMetadata {
  id: string;
  submissionId: string;
  aiRiskScore: number; // 0-100
  aiConfidenceScore: number; // 0-100
  ocrHashtagsChecked: string[];
  ocrMentionsChecked: string[];
  detectedLanguage?: string;
  detectedRegion?: string;
  isPublicVideo: boolean;
  videoDurationSeconds?: number;
  assignedReviewerId?: string;
  autoExpiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionMedia {
  id: string;
  submissionId: string;
  mediaType: 'thumbnail' | 'video_frame' | 'audio_fingerprint';
  fileUrl: string;
  frameTimestampSeconds?: number;
  imageHash?: string;
  createdAt: string;
}

export interface SubmissionDuplicate {
  id: string;
  submissionId: string;
  originalSubmissionId?: string;
  similarityScore: number;
  duplicateType: 'url' | 'video' | 'audio' | 'thumbnail';
  crossCampaign: boolean;
  createdAt: string;
}

export interface SubmissionFraud {
  id: string;
  submissionId: string;
  fakeViewsDetected: boolean;
  fakeLikesDetected: boolean;
  fakeCommentsDetected: boolean;
  vpnProxyUsed: boolean;
  multiAccountMatch: boolean;
  rapidUploadAbuse: boolean;
  suspiciousTrafficScore: number;
  createdAt: string;
}

export interface SubmissionReview {
  id: string;
  submissionId: string;
  reviewerId?: string;
  notes: string;
  checklistChecked: Record<string, boolean>;
  decision: 'approve' | 'reject' | 'request_changes' | 'escalate';
  createdAt: string;
}

export interface SubmissionAppeal {
  id: string;
  submissionId: string;
  reason: string;
  evidenceUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionReward {
  id: string;
  submissionId: string;
  baseRewardCents: number;
  bonusCents: number;
  penaltyCents: number;
  finalRewardCents: number;
  payoutStatus: 'pending' | 'eligible' | 'paid' | 'reversed';
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionHistory {
  id: string;
  submissionId: string;
  actorEmail: string;
  fromStatus?: string;
  toStatus: string;
  notes?: string;
  createdAt: string;
}

export interface SubmissionSettings {
  id: string;
  autoApprovalEnabled: boolean;
  manualApprovalRequired: boolean;
  aiThresholdScore: number;
  fraudThresholdScore: number;
  duplicateThresholdScore: number;
  maxReviewTimeHours: number;
  defaultReviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnalytics {
  totalSubmissions: number;
  pendingReview: number;
  approvedCount: number;
  rejectedCount: number;
  appealedCount: number;
  aiFlaggedCount: number;
  duplicateCount: number;
  fraudRiskCount: number;
  averageReviewTimeMinutes: number;
  dailyApprovalRatePercent: number;
}
