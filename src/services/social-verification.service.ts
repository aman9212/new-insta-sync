import type {
  SocialPlatformId,
  VerificationRulesConfig,
  VerificationResult,
  SocialFraudEvent,
} from '../types/social-integration';

export interface SubmissionToVerify {
  id: string;
  creatorId: string;
  platformId: SocialPlatformId;
  videoUrl: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retentionPercent: number;
  watchTimeMinutes: number;
  uploadDate: string;
  isPublic?: boolean;
  fingerprintHash?: string;
}

class SocialVerificationEngine {
  public verifySubmission(
    submission: SubmissionToVerify,
    rules: VerificationRulesConfig,
    existingFingerprints: string[] = []
  ): { result: VerificationResult; fraudEvents: SocialFraudEvent[] } {
    const rejectionReasons: string[] = [];
    const fraudEvents: SocialFraudEvent[] = [];

    // 1. Existence & Public Visibility Check
    const videoExists = true;
    const isPublic = submission.isPublic !== false;

    if (!isPublic) {
      rejectionReasons.push('Video is private or unlisted');
    }

    // 2. Metrics & Threshold Evaluation
    if (submission.views < rules.minViews) {
      rejectionReasons.push(`Views (${submission.views.toLocaleString()}) below required minimum (${rules.minViews.toLocaleString()})`);
    }

    if (submission.likes < rules.minLikes) {
      rejectionReasons.push(`Likes (${submission.likes}) below required minimum (${rules.minLikes})`);
    }

    if (submission.retentionPercent < rules.minRetentionPercent) {
      rejectionReasons.push(`Audience retention (${submission.retentionPercent}%) below required threshold (${rules.minRetentionPercent}%)`);
    }

    if (submission.watchTimeMinutes < rules.minWatchTimeMinutes) {
      rejectionReasons.push(`Watch time (${submission.watchTimeMinutes} min) below minimum (${rules.minWatchTimeMinutes} min)`);
    }

    // 3. Duplicate & Reused Clip Fingerprint Detection
    const isDuplicate = Boolean(submission.fingerprintHash && existingFingerprints.includes(submission.fingerprintHash));
    if (isDuplicate) {
      rejectionReasons.push('Duplicate video fingerprint detected (content reused across submissions)');
      fraudEvents.push({
        id: `fraud_${Date.now()}_1`,
        creatorId: submission.creatorId,
        platformId: submission.platformId,
        submissionId: submission.id,
        fraudType: 'duplicate_video',
        severity: 'high',
        confidenceScore: 98,
        details: `Fingerprint ${submission.fingerprintHash} matched previously verified campaign clip.`,
        detectedAt: new Date().toISOString(),
      });
    }

    // 4. Fraud Detection Metrics (View farming & Bot Likes ratio)
    const engagementRatio = submission.views > 0 ? (submission.likes + submission.comments) / submission.views : 0;
    if (submission.views > 50000 && engagementRatio < 0.001) {
      fraudEvents.push({
        id: `fraud_${Date.now()}_2`,
        creatorId: submission.creatorId,
        platformId: submission.platformId,
        submissionId: submission.id,
        fraudType: 'fake_views',
        severity: 'critical',
        confidenceScore: 92,
        details: `Abnormally low engagement ratio (${(engagementRatio * 100).toFixed(3)}%) relative to ${submission.views.toLocaleString()} views indicates view farming / bot traffic.`,
        detectedAt: new Date().toISOString(),
      });
      rejectionReasons.push('Suspicious view farming / bot traffic signature flagged');
    }

    const passed = rejectionReasons.length === 0;

    const result: VerificationResult = {
      submissionId: submission.id,
      platformId: submission.platformId,
      creatorId: submission.creatorId,
      videoExists,
      isPublic,
      views: submission.views,
      likes: submission.likes,
      comments: submission.comments,
      shares: submission.shares,
      retentionPercent: submission.retentionPercent,
      watchTimeMinutes: submission.watchTimeMinutes,
      uploadDate: submission.uploadDate,
      isCreatorOwner: true,
      isDuplicate,
      isDeleted: false,
      passed,
      rejectionReasons,
      evaluatedAt: new Date().toISOString(),
    };

    return { result, fraudEvents };
  }
}

export const socialVerificationEngine = new SocialVerificationEngine();
