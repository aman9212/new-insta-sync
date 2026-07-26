import type { ViewProvider } from './mod.ts';

export const instagramProvider: ViewProvider = {
  supports: url => url.includes('instagram.com'),
  normalizeUrl: url => url,
  extractExternalId: url => {
    try {
      const match = new URL(url).pathname.match(/\/(reel|p)\/([^/?#]+)/);
      return match?.[2] ?? null;
    } catch {
      return null;
    }
  },
  async fetchMetrics(input) {
    if (!input.accessToken) {
      return {
        limitation: 'Instagram metrics require Meta-supported API permissions and creator account authorization. No access token was provided.',
        fetchedAt: new Date().toISOString(),
      };
    }

    if (!input.externalId) {
      return {
        limitation: 'Unable to extract valid Instagram Reel shortcode or media identifier from URL.',
        fetchedAt: new Date().toISOString()
      };
    }

    try {
      // 1. Fetch user's recent media to match shortcode
      const mediaListUrl = `https://graph.facebook.com/v20.0/me/media?fields=id,shortcode,like_count,comments_count,media_type&access_token=${input.accessToken}`;
      const listRes = await fetch(mediaListUrl);
      
      if (!listRes.ok) {
        const errPayload = await listRes.json().catch(() => ({}));
        throw new Error(errPayload.error?.message || `Meta Media Query returned HTTP ${listRes.status}`);
      }

      const listData = await listRes.json();
      const matchingMedia = (listData.data ?? []).find((m: any) => m.shortcode === input.externalId);

      if (!matchingMedia) {
        throw new Error(`Instagram media with shortcode '${input.externalId}' was not found in creator feed.`);
      }

      // 2. Query Insights for plays (views)
      let views = 0;
      let reach = 0;

      const insightsUrl = `https://graph.facebook.com/v20.0/${matchingMedia.id}/insights?metric=plays,play_count,reach&access_token=${input.accessToken}`;
      const insRes = await fetch(insightsUrl);

      if (insRes.ok) {
        const insData = await insRes.json();
        for (const metric of (insData.data ?? [])) {
          const val = Number(metric.values?.[0]?.value ?? 0);
          if (metric.name === 'plays' || metric.name === 'play_count') views = val;
          if (metric.name === 'reach') reach = val;
        }
      }

      // Fallback: If media is not a video reel or play metric is unavailable, views default to 0 (NO RANDOM MOCKS!)
      return {
        totalViews: views,
        fetchedAt: new Date().toISOString()
      };

    } catch (err) {
      console.error('Instagram Graph API metrics fetch failed:', err);
      return {
        limitation: err instanceof Error ? err.message : 'Meta Graph API call failed',
        fetchedAt: new Date().toISOString()
      };
    }
  },
};
