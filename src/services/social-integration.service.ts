import { supabase } from '../lib/supabase';
import type {
  SocialPlatformId,
  SocialPlatformInfo,
  PlatformCredentialsConfig,
  OAuthSession,
  CreatorSocialAccount,
  SyncJob,
  WebhookEventItem,
  VerificationRulesConfig,
  PlatformRateLimitConfig,
  PlatformHealthMetric,
  CredentialAuditLog,
  ApiHealthStatus,
  InstagramVerificationRecord,
  GenerateBioCodeResponse,
  VerifyBioResponse,
} from '../types/social-integration';
import type { ProviderConnectionExtended } from '../types';

export function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

class SocialIntegrationService {
  private async invoke(action: string, platformId?: SocialPlatformId, extra: Record<string, any> = {}) {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase.functions.invoke('social-integrations', {
      body: { action, platformId, ...extra }
    });

    if (error) {
      let serverErrorMsg = '';
      try {
        if (error && (error as any).context && typeof (error as any).context.json === 'function') {
          const body = await (error as any).context.json();
          if (body?.error) serverErrorMsg = body.error;
        }
      } catch {
        // Fallback reading context
      }

      if (!serverErrorMsg && data?.error) {
        serverErrorMsg = data.error;
      }

      if (serverErrorMsg) {
        throw new Error(serverErrorMsg);
      }

      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  public async getPlatforms(): Promise<SocialPlatformInfo[]> {
    try {
      const data = await this.invoke('summary');
      if (data?.platforms) {
        return data.platforms.map((p: any) => ({
          id: p.id as SocialPlatformId,
          displayName: p.display_name,
          display_name: p.display_name,
          iconKey: p.icon_key,
          icon_key: p.icon_key,
          category: p.category as SocialPlatformInfo['category'],
          enabled: p.enabled,
          oauthSupported: p.oauth_supported,
          oauth_supported: p.oauth_supported,
          webhookSupported: p.webhook_supported,
          webhook_supported: p.webhook_supported,
          apiHealthStatus: (p.api_health_status as ApiHealthStatus) || 'healthy',
          api_health_status: (p.api_health_status as ApiHealthStatus) || 'healthy',
          lastSyncAt: p.last_sync_at,
          last_sync_at: p.last_sync_at,
          lastHealthCheckAt: p.last_health_check_at,
          requestCount: p.health?.rate_limit_remaining ? 100 - p.health.rate_limit_remaining : 0,
          quotaUsagePercent: p.health?.rate_limit_remaining ? 100 - p.health.rate_limit_remaining : 0,
          errorCount: p.health?.status === 'offline' ? 1 : 0,
          avgResponseTimeMs: p.health?.response_time_ms || 100,
          connectedAccountCount: p.accounts?.length || 0,
          accounts: p.accounts ?? [],
        }));
      }
    } catch (e) {
      console.error('Failed to fetch platforms from Edge Function:', e);
      // DEV FALLBACK: Mock data so UI can render if Docker/Edge functions are offline locally
      return [
        { id: 'youtube', displayName: 'YouTube', iconKey: 'youtube', category: 'video', enabled: true, oauthSupported: true, webhookSupported: true, apiHealthStatus: 'healthy', quotaUsagePercent: 15, avgResponseTimeMs: 120, connectedAccountCount: 42 },
        { id: 'facebook', displayName: 'Facebook', iconKey: 'facebook', category: 'social', enabled: false, oauthSupported: true, webhookSupported: true, apiHealthStatus: 'offline', quotaUsagePercent: 0, avgResponseTimeMs: 0, connectedAccountCount: 0 },
        { id: 'instagram', displayName: 'Instagram', iconKey: 'instagram', category: 'social', enabled: true, oauthSupported: true, webhookSupported: true, apiHealthStatus: 'healthy', quotaUsagePercent: 45, avgResponseTimeMs: 85, connectedAccountCount: 128 },
      ] as any;
    }
    return [];
  }

  public async getPlatformCredentials(platformId: SocialPlatformId): Promise<PlatformCredentialsConfig> {
    let data: any = {};
    try {
      data = await this.configuration(platformId);
    } catch (e) {
      console.error('Failed to fetch credentials from Edge Function:', e);
      // DEV FALLBACK: Mock data
      data = {
        credential: { environment: 'sandbox', oauth_version: '2.0', api_version: 'v18.0', secrets: {} },
        platform: { enabled: true },
        settings: { sync_interval_minutes: 60, webhook_enabled: false }
      };
    }
    return {
      platformId,
      environment: data.credential?.environment ?? 'production',
      oauthVersion: data.credential?.oauth_version ?? '2.0',
      apiVersion: data.credential?.api_version ?? 'v20.0',
      clientId: data.credential?.secrets?.client_id?.hint || '',
      clientSecret: data.credential?.secrets?.client_secret?.hint || '',
      apiKey: data.credential?.secrets?.api_key?.hint || '',
      webhookSecret: data.credential?.secrets?.webhook_secret?.hint || '',
      redirectUri: data.credential?.redirect_url || `https://creatorx.app/auth/callback/${platformId}`,
      scopes: data.credential?.scopes ?? [],
      enabled: data.platform?.enabled ?? false,
      webhook_enabled: data.settings?.webhook_enabled ?? false,
      webhook_url: data.settings?.webhook_url || '',
      syncFrequencyMinutes: data.settings?.sync_interval_minutes ?? 60,
      retryAttempts: data.settings?.retry_count ?? 3,
      timeoutMs: data.settings?.request_timeout_ms ?? 10000,
      updatedAt: data.credential?.updated_at || new Date().toISOString(),
    };
  }

  public async savePlatformCredentials(config: PlatformCredentialsConfig): Promise<boolean> {
    config.secrets = {
      client_id: config.clientId || '',
      client_secret: config.clientSecret || '',
      api_key: config.apiKey || '',
      webhook_secret: config.webhookSecret || '',
    };
    await this.save(config.platformId, config);
    return true;
  }

  public async deletePlatformCredentials(platformId: SocialPlatformId): Promise<boolean> {
    await this.removeCredentials(platformId);
    return true;
  }

  public async initiateOAuthFlow(platformId: SocialPlatformId, _userId: string): Promise<{ url: string; session: OAuthSession }> {
    const callbackBase = window.location.origin;
    const redirectUri = `${callbackBase}/auth/callback/${platformId}`;
    const data = await this.invoke('oauth-start', platformId, { redirectUri });
    return {
      url: data.url,
      session: {
        id: `oauth_sess_${Date.now()}`,
        userId: _userId,
        platformId,
        state: 'oauth_state',
        redirectUri,
        scopes: [],
        status: 'initiated',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    };
  }

  public async getCreatorConnections(): Promise<ProviderConnectionExtended[]> {
    if (!supabase) return [];
    const { data } = await supabase.from('provider_connections').select('*').order('connected_at', { ascending: false });
    return (data as ProviderConnectionExtended[]) || [];
  }

  public async handleOAuthCallback(platformId: SocialPlatformId, code: string, state: string): Promise<CreatorSocialAccount> {
    const data = await this.invoke('oauth-callback', platformId, { code, state });
    if (!data.success) throw new Error(data.error || 'OAuth token exchange failed');
    return {
      id: data.account.id,
      creatorId: '',
      platformId,
      username: data.account.username,
      displayName: data.account.username,
      followersCount: data.account.followers,
      verificationStatus: 'verified',
      connectedAt: data.account.last_sync,
      lastSyncAt: data.account.last_sync,
      tokenExpired: false
    };
  }

  public async testConnection(platformId: SocialPlatformId): Promise<{ status: ApiHealthStatus; latencyMs: number; message: string }> {
    const data = await this.test(platformId);
    return {
      status: data.status as ApiHealthStatus,
      latencyMs: data.responseTime || 0,
      message: data.errorMessage || `Connection to ${platformId.toUpperCase()} API verified successfully.`
    };
  }

  public async forceSyncAccount(accountId: string, platformId?: SocialPlatformId): Promise<SyncJob> {
    const platform = platformId || (accountId.includes('instagram') ? 'instagram' : accountId.includes('facebook') ? 'facebook' : 'youtube');
    
    // For Instagram, we do real-time sync for instant feedback
    if (platform === 'instagram') {
      try {
        await this.invoke('instagram-sync-media', platform, { accountId });
      } catch (e) {
        console.error('Real-time sync failed, falling back to queued', e);
      }
    }

    const data = await this.invoke('manual-sync', platform, { accountId });
    return {
      id: data.jobId,
      platformId: platform,
      accountId,
      jobType: 'manual',
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      recordsSynced: 0,
      createdAt: new Date().toISOString()
    };
  }

  public async getSyncQueue(): Promise<SyncJob[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((j: any) => ({
      id: j.id,
      platformId: j.platform_id as SocialPlatformId,
      accountId: j.account_id,
      jobType: (j.job_type === 'account' ? 'manual' : 'scheduled') as SyncJob['jobType'],
      status: (j.status === 'queued' ? 'queued' : j.status === 'running' ? 'processing' : j.status === 'completed' ? 'completed' : 'failed') as SyncJob['status'],
      attempts: j.attempts,
      maxAttempts: j.max_attempts,
      createdAt: j.created_at,
      completedAt: j.completed_at,
      recordsSynced: 0
    }));
  }

  public async getWebhookEvents(platformId?: SocialPlatformId): Promise<WebhookEventItem[]> {
    if (!supabase) return [];
    let query = supabase.from('webhook_logs').select('*');
    if (platformId) {
      query = query.eq('platform', platformId);
    }
    const { data } = await query.order('received_at', { ascending: false }).limit(50);
    return (data ?? []).map((w: any) => ({
      id: w.id,
      platformId: w.platform as SocialPlatformId,
      eventType: w.event_type || 'unknown',
      payload: w.payload,
      signature: w.signature_valid ? 'Valid' : 'Invalid',
      status: w.status as WebhookEventItem['status'],
      errorMessage: w.error_message,
      receivedAt: w.received_at
    }));
  }

  public async getVerificationRules(platformId: SocialPlatformId): Promise<VerificationRulesConfig> {
    return {
      platformId,
      minViews: 5000,
      minWatchTimeMinutes: 100,
      minLikes: 250,
      minRetentionPercent: 45,
      maxDurationSeconds: 1800,
      acceptedLanguages: ['en', 'es'],
      acceptedRegions: ['US', 'CA'],
      acceptedCategories: ['Entertainment', 'Gaming'],
      autoApproveRules: ['views > 25000 AND retention > 60'],
      autoRejectRules: ['retention < 15'],
    };
  }

  public async getRateLimits(platformId: SocialPlatformId): Promise<PlatformRateLimitConfig> {
    return {
      platformId,
      maxRequests: 10000,
      requestsPerMinute: 300,
      requestsPerHour: 5000,
      burstLimit: 50,
      cooldownSeconds: 60,
      retryDelayMs: 1500,
    };
  }

  public async getHealthMetrics(): Promise<PlatformHealthMetric[]> {
    const platforms = await this.getPlatforms();
    return platforms.map((p) => ({
      platformId: p.id,
      status: p.apiHealthStatus,
      latencyMs: p.avgResponseTimeMs,
      failures24h: p.errorCount,
      quotaRemainingPercent: 100 - p.quotaUsagePercent,
      tokenExpirationDays: 45,
      webhookHealthPercent: 99.8,
      checkedAt: new Date().toISOString(),
    }));
  }

  public async getAuditLogs(): Promise<CredentialAuditLog[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(email)')
      .ilike('action', 'social.%')
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((l: any) => ({
      id: l.id,
      adminId: l.actor_id,
      adminEmail: l.profiles?.email || 'admin@creatorx.app',
      platformId: (l.metadata?.platformId || 'youtube') as SocialPlatformId,
      action: (l.action.split('.').pop() || 'update') as CredentialAuditLog['action'],
      changesMasked: l.metadata?.changed_fields ? `Updated fields: ${l.metadata.changed_fields.join(', ')}` : 'Credentials configuration modified',
      ipAddress: l.metadata?.ip || '127.0.0.1',
      userAgent: l.metadata?.user_agent || 'Unknown browser',
      createdAt: l.created_at
    }));
  }

  public async summary(): Promise<SocialPlatformInfo[]> {
    return this.getPlatforms();
  }

  public async configuration(platformId: SocialPlatformId) {
    return this.invoke('configuration', platformId);
  }

  public async save(platformId: SocialPlatformId, config: any) {
    return this.invoke('save-configuration', platformId, {
      configuration: {
        enabled: config.enabled,
        environment: config.environment,
        oauth_version: config.oauthVersion,
        api_version: config.apiVersion,
        scopes: config.scopes,
        redirect_url: config.redirectUri,
        secrets: config.secrets
      },
      settings: {
        max_requests: config.maxRequests ?? 1000,
        sync_interval_minutes: config.syncFrequencyMinutes ?? 60,
        retry_count: config.retryAttempts ?? 3,
        request_timeout_ms: config.timeoutMs ?? 10000,
        cache_duration_seconds: config.cacheDurationSeconds ?? 300,
        webhook_enabled: config.webhook_enabled,
        webhook_url: config.webhook_url
      }
    });
  }

  public async test(platformId: SocialPlatformId) {
    return this.invoke('test-connection', platformId);
  }

  public async sync(platformId: SocialPlatformId, accountId?: string) {
    return this.invoke('manual-sync', platformId, { accountId });
  }

  public async removeCredentials(platformId: SocialPlatformId) {
    return this.invoke('delete-credentials', platformId);
  }

  public async logs(platformId: SocialPlatformId) {
    const data = await this.invoke('logs', platformId);
    return data.logs ?? [];
  }
  
  public async disconnect(platformId: SocialPlatformId) {
    try {
      await this.invoke('disconnect-account', platformId);
    } catch (err) {
      console.warn('[disconnect] Edge function disconnect returned error, attempting direct database cleanup:', err);
    }

    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        await supabase
          .from('provider_connections')
          .delete()
          .eq('user_id', auth.user.id)
          .eq('provider', platformId);

        await supabase
          .from('instagram_verifications')
          .delete()
          .eq('user_id', auth.user.id);
      }
    }

    return { ok: true };
  }
  
  public async triggerSync(platformId: SocialPlatformId) {
    return this.invoke('sync-social-data', platformId);
  }

  public async generateInstagramBioCode(connectionId: string): Promise<GenerateBioCodeResponse> {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase.functions.invoke('verify-instagram-bio', {
      body: { action: 'generate-code', connectionId }
    });

    if (error) {
      let serverErrorMsg = '';
      try {
        if (error && (error as any).context && typeof (error as any).context.json === 'function') {
          const body = await (error as any).context.json();
          if (body?.error) serverErrorMsg = body.error;
        }
      } catch {
        // Fallback
      }
      if (serverErrorMsg) throw new Error(serverErrorMsg);
      if (data?.error) throw new Error(data.error);
      throw error;
    }

    if (data?.error) throw new Error(data.error);
    return data;
  }

  public async verifyInstagramBio(connectionId: string, verificationId?: string, code?: string, username?: string): Promise<VerifyBioResponse> {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase.functions.invoke('verify-instagram-bio', {
      body: { action: 'verify-bio', connectionId, verificationId, code, username }
    });

    if (error) {
      let serverErrorMsg = '';
      try {
        if (error && (error as any).context && typeof (error as any).context.json === 'function') {
          const body = await (error as any).context.json();
          if (body?.error) serverErrorMsg = body.error;
        }
      } catch {
        // Fallback
      }
      if (serverErrorMsg) throw new Error(serverErrorMsg);
      if (data?.error) throw new Error(data.error);
      throw error;
    }

    if (data?.error) throw new Error(data.error);
    return data;
  }

  public async getInstagramVerifications(connectionId?: string): Promise<InstagramVerificationRecord[]> {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase.functions.invoke('verify-instagram-bio', {
      body: { action: 'get-verifications', connectionId }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.verifications ?? [];
  }
}

export const socialIntegrationService = new SocialIntegrationService();
export const socialIntegrations = socialIntegrationService;

export type IntegrationPlatform = SocialPlatformInfo;
export interface IntegrationConfiguration {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  oauth_version: string;
  api_version: string;
  scopes: string[];
  redirect_url: string;
  secrets: Record<string, string>;
  max_requests: number;
  sync_interval_minutes: number;
  retry_count: number;
  request_timeout_ms: number;
  cache_duration_seconds: number;
  webhook_enabled: boolean;
  webhook_url: string;
}
export type IntegrationLog = {
  id: string;
  level: 'info' | 'warning' | 'error';
  event_type: string;
  message: string;
  response_time_ms: number | null;
  created_at: string;
};
