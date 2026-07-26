export type SocialPlatformId =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'twitch'
  | 'kick'
  | 'discord'
  | 'reddit'
  | 'snapchat';

export type ApiHealthStatus = 'healthy' | 'degraded' | 'offline' | 'not_configured';

export type EnvironmentMode = 'sandbox' | 'production';

export interface SocialPlatformInfo {
  id: SocialPlatformId;
  displayName: string;
  display_name?: string;
  iconKey: string;
  icon_key?: string;
  category: 'video' | 'social' | 'community' | 'professional';
  enabled: boolean;
  oauthSupported: boolean;
  oauth_supported?: boolean;
  webhookSupported: boolean;
  webhook_supported?: boolean;
  apiHealthStatus: ApiHealthStatus;
  api_health_status?: ApiHealthStatus;
  lastSyncAt: string | null;
  last_sync_at?: string | null;
  lastHealthCheckAt: string | null;
  requestCount: number;
  quotaUsagePercent: number;
  errorCount: number;
  avgResponseTimeMs: number;
  connectedAccountCount: number;
  accounts?: Array<{ status: string; last_sync_at: string | null; last_error_at: string | null }>;
}

export interface PlatformCredentialsConfig {
  platformId: SocialPlatformId;
  environment: EnvironmentMode;
  oauthVersion: string;
  oauth_version?: string;
  apiVersion: string;
  api_version?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  redirectUri: string;
  redirect_url?: string;
  scopes: string[];
  enabled: boolean;
  syncFrequencyMinutes: number;
  sync_interval_minutes?: number;
  retryAttempts: number;
  retry_count?: number;
  timeoutMs: number;
  request_timeout_ms?: number;
  max_requests?: number;
  cache_duration_seconds?: number;
  webhook_enabled?: boolean;
  webhook_url?: string;
  secrets?: Record<string, string>;
  updatedAt: string;
}

export interface OAuthSession {
  id: string;
  userId: string;
  platformId: SocialPlatformId;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  scopes: string[];
  status: 'initiated' | 'authorized' | 'failed' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface OAuthTokenData {
  platformId: SocialPlatformId;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresInSeconds: number;
  expiresAt: string;
  scopes: string[];
}

export interface CreatorSocialAccount {
  id: string;
  creatorId: string;
  platformId: SocialPlatformId;
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl?: string;
  followersCount: number;
  subscribersCount?: number;
  verificationStatus: 'verified' | 'pending' | 'failed' | 'unverified';
  connectedAt: string;
  lastSyncAt: string | null;
  lastError?: string;
  tokenExpired: boolean;
}

export interface SyncJob {
  id: string;
  platformId: SocialPlatformId;
  accountId?: string;
  jobType: 'automatic' | 'manual' | 'scheduled' | 'webhook';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  errorDetails?: string;
  recordsSynced: number;
  createdAt: string;
  completedAt?: string;
}

export interface WebhookEventItem {
  id: string;
  platformId: SocialPlatformId;
  eventType: string;
  payload: Record<string, unknown>;
  signature: string;
  status: 'received' | 'processed' | 'failed';
  errorMessage?: string;
  receivedAt: string;
  deliveryLatencyMs?: number;
}

export interface VerificationRulesConfig {
  platformId: SocialPlatformId;
  minViews: number;
  minWatchTimeMinutes: number;
  minLikes: number;
  minRetentionPercent: number;
  maxDurationSeconds: number;
  acceptedLanguages: string[];
  acceptedRegions: string[];
  acceptedCategories: string[];
  autoApproveRules: string[];
  autoRejectRules: string[];
}

export interface VerificationResult {
  submissionId: string;
  platformId: SocialPlatformId;
  creatorId: string;
  videoExists: boolean;
  isPublic: boolean;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retentionPercent: number;
  watchTimeMinutes: number;
  uploadDate: string;
  isCreatorOwner: boolean;
  isDuplicate: boolean;
  isDeleted: boolean;
  passed: boolean;
  rejectionReasons: string[];
  evaluatedAt: string;
}

export interface SocialFraudEvent {
  id: string;
  creatorId: string;
  platformId: SocialPlatformId;
  submissionId?: string;
  fraudType:
    | 'fake_views'
    | 'view_farming'
    | 'bot_likes'
    | 'duplicate_video'
    | 'reused_clip'
    | 'spam_account'
    | 'vpn_abuse'
    | 'device_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  details: string;
  detectedAt: string;
}

export interface PlatformRateLimitConfig {
  platformId: SocialPlatformId;
  maxRequests: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  cooldownSeconds: number;
  retryDelayMs: number;
}

export interface PlatformHealthMetric {
  platformId: SocialPlatformId;
  status: ApiHealthStatus;
  latencyMs: number;
  failures24h: number;
  quotaRemainingPercent: number;
  tokenExpirationDays: number;
  webhookHealthPercent: number;
  checkedAt: string;
}

export interface CredentialAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  platformId: SocialPlatformId;
  action: 'create' | 'update' | 'delete' | 'rotate' | 'toggle';
  changesMasked: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export type InstagramVerificationStatus = 'pending' | 'verified' | 'expired' | 'failed';
export type InstagramVerificationMethod = 'bio' | 'oauth';

export interface InstagramVerificationRecord {
  id: string;
  user_id: string;
  provider_connection_id: string;
  verification_code: string;
  status: InstagramVerificationStatus;
  verification_method: InstagramVerificationMethod;
  attempts: number;
  failure_reason?: string | null;
  created_at: string;
  expires_at: string;
  verified_at?: string | null;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
  connection?: {
    provider_username: string | null;
    display_name: string | null;
  };
}

export interface GenerateBioCodeResponse {
  ok: boolean;
  code: string;
  expiresAt: string;
  verificationId: string;
}

export interface VerifyBioResponse {
  verified: boolean;
  message?: string;
  error?: string;
  attempts?: number;
  status?: string;
  maxAttemptsExceeded?: boolean;
}
