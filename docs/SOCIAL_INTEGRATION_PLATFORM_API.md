# CreatorX Social Integration Platform API Documentation

This document specifies the services, platform adapters, OAuth flows, auto-verification engine, and admin REST/Edge Endpoints for the CreatorX Social Integration Platform.

---

## Supported Platforms (12)
1. **YouTube** (`youtube`): Data API v3, OAuth 2.0, Webhooks
2. **Instagram** (`instagram`): Graph API v20.0, OAuth 2.0, Webhooks
3. **TikTok** (`tiktok`): Display API & Commercial Content API, OAuth 2.0, Webhooks
4. **Facebook** (`facebook`): Graph API v20.0, OAuth 2.0, Webhooks
5. **X (Twitter)** (`x`): API v2, OAuth 2.0 PKCE, Webhooks
6. **LinkedIn** (`linkedin`): v2 API, OAuth 2.0, Webhooks
7. **Twitch** (`twitch`): Helix API, OAuth 2.0, EventSub Webhooks
8. **Kick** (`kick`): Public v1 API, OAuth 2.0
9. **Discord** (`discord`): v10 API, OAuth 2.0, Webhooks
10. **Reddit** (`reddit`): OAuth 2.0 API, Read/Write Scopes
11. **Snapchat** (`snapchat`): Marketing API, OAuth 2.0

---

## Service API (`SocialIntegrationService`)

Location: `src/services/social-integration.service.ts`

### Endpoints / Methods
- `getPlatforms(): Promise<SocialPlatformInfo[]>`
- `getPlatformCredentials(platformId: SocialPlatformId): Promise<PlatformCredentialsConfig>`
- `savePlatformCredentials(config: PlatformCredentialsConfig): Promise<boolean>`
- `deletePlatformCredentials(platformId: SocialPlatformId): Promise<boolean>`
- `initiateOAuthFlow(platformId: SocialPlatformId, userId: string): Promise<{ url: string; session: OAuthSession }>`
- `handleOAuthCallback(platformId: SocialPlatformId, code: string, state: string): Promise<CreatorSocialAccount>`
- `testConnection(platformId: SocialPlatformId): Promise<{ status: ApiHealthStatus; latencyMs: number; message: string }>`
- `forceSyncAccount(accountId: string): Promise<SyncJob>`
- `getSyncQueue(): Promise<SyncJob[]>`
- `getWebhookEvents(platformId?: SocialPlatformId): Promise<WebhookEventItem[]>`
- `getVerificationRules(platformId: SocialPlatformId): Promise<VerificationRulesConfig>`
- `getRateLimits(platformId: SocialPlatformId): Promise<PlatformRateLimitConfig>`
- `getHealthMetrics(): Promise<PlatformHealthMetric[]>`
- `getAuditLogs(): Promise<CredentialAuditLog[]>`

---

## Auto-Verification Engine (`SocialVerificationEngine`)

Location: `src/services/social-verification.service.ts`

Evaluates creator clip submissions in real-time against configurable threshold rules and flags fraud:
- `verifySubmission(submission, rules, existingFingerprints)`
- Validates: Existence, Public status, Min views, Min watch time, Min likes, Min retention %, Accepted regions & categories.
- Detects: Duplicate video fingerprints, view farming velocity spikes, bot engagement ratios, multi-account submissions.
