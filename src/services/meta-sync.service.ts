import { supabase } from '../lib/supabase';

export interface InstagramMetrics {
  mediaId: string;
  raw_views: number;
  raw_likes: number;
  comments_count: number;
  fetchedAt: string;
  error?: string;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SyncBatchResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  timestamp: string;
}

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Extracts an Instagram Media ID or shortcode from an Instagram post URL if needed.
 */
export function extractInstagramMediaId(postUrl: string): string | null {
  if (!postUrl) return null;
  const cleaned = postUrl.trim();
  const shortcodeMatch = cleaned.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
  if (shortcodeMatch && shortcodeMatch[1]) {
    return shortcodeMatch[1];
  }
  if (/^\d{15,25}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    const stripped = key.replace(/^VITE_/, '');
    if (process.env[stripped]) return process.env[stripped];
    const prefixed = `VITE_${key}`;
    if (process.env[prefixed]) return process.env[prefixed];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val) return val;
    const stripped = key.replace(/^VITE_/, '');
    if ((import.meta as any).env[stripped]) return (import.meta as any).env[stripped];
    const prefixed = `VITE_${key}`;
    if ((import.meta as any).env[prefixed]) return (import.meta as any).env[prefixed];
  }
  return undefined;
}

/**
 * Fetch Instagram post metrics from Meta Graph API (v19.0)
 * Endpoint: /{mediaId}?fields=like_count,comments_count,insights.metric(views)
 */
export async function fetchInstagramMetrics(
  mediaId: string,
  accessToken?: string
): Promise<InstagramMetrics> {
  const token =
    accessToken ||
    getEnvVar('META_USER_ACCESS_TOKEN') ||
    getEnvVar('VITE_META_USER_ACCESS_TOKEN');
  const now = new Date().toISOString();

  if (!mediaId) {
    return {
      mediaId: '',
      raw_views: 0,
      raw_likes: 0,
      comments_count: 0,
      fetchedAt: now,
      error: 'Media ID is required',
    };
  }

  if (!token) {
    return {
      mediaId,
      raw_views: 0,
      raw_likes: 0,
      comments_count: 0,
      fetchedAt: now,
      error: 'Meta Access Token is not provided or configured',
    };
  }

  try {
    const fieldsParam = encodeURIComponent('like_count,comments_count,insights.metric(views)');
    const url = `${META_GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}?fields=${fieldsParam}&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      if (data?.error?.code === 100) {
        const simpleUrl = `${META_GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}?fields=like_count,comments_count&access_token=${encodeURIComponent(token)}`;
        const simpleRes = await fetch(simpleUrl);
        const simpleData = await simpleRes.json();
        if (simpleRes.ok && !simpleData.error) {
          return {
            mediaId,
            raw_views: 0,
            raw_likes: Number(simpleData.like_count) || 0,
            comments_count: Number(simpleData.comments_count) || 0,
            fetchedAt: now,
          };
        }
      }

      const errorMsg = data?.error?.message || `Meta Graph API HTTP ${response.status}`;
      console.warn(`[MetaSync] Warning fetching mediaId ${mediaId}:`, errorMsg);
      return {
        mediaId,
        raw_views: 0,
        raw_likes: 0,
        comments_count: 0,
        fetchedAt: now,
        error: errorMsg,
      };
    }

    const likes = Number(data.like_count) || 0;
    const comments = Number(data.comments_count) || 0;

    let views = 0;
    if (data.insights?.data && Array.isArray(data.insights.data)) {
      const viewsInsight = data.insights.data.find(
        (item: { name: string; values?: Array<{ value: number }> }) =>
          item.name === 'views' || item.name === 'plays' || item.name === 'video_views'
      );
      if (viewsInsight?.values?.[0]?.value !== undefined) {
        views = Number(viewsInsight.values[0].value) || 0;
      }
    }

    return {
      mediaId,
      raw_views: views,
      raw_likes: likes,
      comments_count: comments,
      fetchedAt: now,
    };
  } catch (err) {
    const catchErrorMsg = (err as Error).message || 'Network failure fetching Instagram metrics';
    console.error(`[MetaSync] Network error for mediaId ${mediaId}:`, catchErrorMsg);
    return {
      mediaId,
      raw_views: 0,
      raw_likes: 0,
      comments_count: 0,
      fetchedAt: now,
      error: catchErrorMsg,
    };
  }
}

/**
 * Exchange Short-Lived User Access Token to 60-Day Long-Lived User Access Token
 */
export async function exchangeShortToLongLivedToken(
  shortToken: string,
  appId?: string,
  appSecret?: string
): Promise<LongLivedTokenResponse> {
  const metaAppId = appId || getEnvVar('VITE_META_APP_ID') || getEnvVar('META_APP_ID');
  const metaAppSecret = appSecret || getEnvVar('VITE_META_APP_SECRET') || getEnvVar('META_APP_SECRET');

  if (!shortToken) {
    throw new Error('Short-lived access token is required');
  }
  if (!metaAppId || !metaAppSecret) {
    throw new Error('Meta App ID or App Secret is missing in environment or arguments');
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: metaAppId,
    client_secret: metaAppSecret,
    fb_exchange_token: shortToken,
  });

  const response = await fetch(`${META_GRAPH_BASE_URL}/oauth/access_token?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data?.error?.message || `Token exchange failed with HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    expires_in: Number(data.expires_in) || 5184000,
  };
}

/**
 * Sync all active approved post submissions with latest Meta Graph API metrics
 */
export async function syncAllActivePosts(): Promise<SyncBatchResult> {
  const timestamp = new Date().toISOString();
  const summary: SyncBatchResult = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
    timestamp,
  };

  if (!supabase) {
    summary.errors.push('Supabase client is not initialized');
    return summary;
  }

  let submissionsData: any[] = [];
  // Primary query: submissions table (core PostgreSQL schema)
  const { data: primaryData, error: primaryErr } = await supabase
    .from('submissions')
    .select('id, external_post_id, post_url, platform, total_views, status')
    .eq('platform', 'instagram');

  if (primaryErr) {
    // Secondary query: post_submissions view if present
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from('post_submissions')
      .select('id, external_post_id, post_url, platform, raw_views, status')
      .eq('platform', 'instagram');

    if (fallbackErr) {
      summary.errors.push(`Database query failed: ${primaryErr.message}`);
      return summary;
    }
    submissionsData = fallbackData || [];
  } else {
    submissionsData = primaryData || [];
  }

  summary.totalProcessed = submissionsData.length;

  if (submissionsData.length === 0) {
    return summary;
  }

  const globalToken =
    getEnvVar('META_USER_ACCESS_TOKEN') || getEnvVar('VITE_META_USER_ACCESS_TOKEN');

  for (const post of submissionsData) {
    const mediaId = post.external_post_id || extractInstagramMediaId(post.post_url);
    if (!mediaId) {
      summary.failureCount++;
      summary.errors.push(`Post ID ${post.id}: Unable to extract Meta Media ID from URL ${post.post_url}`);
      continue;
    }

    const metrics = await fetchInstagramMetrics(mediaId, globalToken);

    if (metrics.error) {
      summary.failureCount++;
      summary.errors.push(`Post ID ${post.id} (${mediaId}): ${metrics.error}`);
      continue;
    }

    // Record snapshot
    await supabase.from('submission_metric_snapshots').insert({
      submission_id: post.id,
      raw_views: metrics.raw_views,
      raw_likes: metrics.raw_likes,
      captured_at: timestamp,
    });

    // Update submissions table
    await supabase
      .from('submissions')
      .update({
        total_views: metrics.raw_views,
        last_synced_at: timestamp,
      })
      .eq('id', post.id);

    summary.successCount++;
  }

  return summary;
}

export const metaSyncService = {
  fetchInstagramMetrics,
  exchangeShortToLongLivedToken,
  syncAllActivePosts,
  extractInstagramMediaId,
};
