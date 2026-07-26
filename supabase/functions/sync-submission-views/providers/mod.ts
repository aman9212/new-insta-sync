import { instagramProvider } from './instagram.provider.ts';
import { tiktokProvider } from './tiktok.provider.ts';
import { youtubeProvider } from './youtube.provider.ts';
import { facebookProvider } from './facebook.provider.ts';

export interface ViewProvider {
  supports(url: string): boolean;
  normalizeUrl(url: string): string;
  extractExternalId(url: string): string | null;
  fetchMetrics(input: { url: string; externalId: string | null; accessToken?: string | null }): Promise<
    { totalViews: number; fetchedAt: string } | { limitation: string; fetchedAt: string }
  >;
}

export function getProvider(platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook'): ViewProvider {
  if (platform === 'youtube') return youtubeProvider;
  if (platform === 'instagram') return instagramProvider;
  if (platform === 'facebook') return facebookProvider;
  return tiktokProvider;
}
