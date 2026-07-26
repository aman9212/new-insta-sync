import type { ViewProvider } from './mod.ts';

export const tiktokProvider: ViewProvider = {
  supports: url => url.includes('tiktok.com'),
  normalizeUrl: url => url,
  extractExternalId: url => new URL(url).pathname.match(/\/video\/(\d+)/)?.[1] ?? null,
  async fetchMetrics() {
    return {
      limitation: 'TikTok metrics require approved TikTok API access and account authorization. Frontend scraping and fake metrics are intentionally not implemented.',
      fetchedAt: new Date().toISOString(),
    };
  },
};
