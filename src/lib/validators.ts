import { SUPPORTED_POST_DOMAINS, MAX_INPUT_LENGTHS } from './constants';
import type { SocialPlatform } from '../types';

export function validateUrl(url: string): { valid: boolean; normalized: string; platform: SocialPlatform | null; externalId: string | null; error?: string } {
  if (!url || url.length > MAX_INPUT_LENGTHS.POST_URL) {
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'URL is too long or empty' };
  }

  let parsed: URL;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'URL must use HTTP or HTTPS' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // Instagram: instagram.com/reel/<id>/ or instagram.com/p/<id>/
  if (SUPPORTED_POST_DOMAINS.instagram.some(d => hostname === d.replace('www.', ''))) {
    const match = parsed.pathname.match(/\/(reel|p)\/([^/?#]+)/);
    if (match) {
      const shortcode = match[2];
      return { valid: true, normalized: `https://www.instagram.com/${match[1]}/${shortcode}/`, platform: 'instagram', externalId: shortcode };
    }
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'Not a valid Instagram post or reel URL' };
  }

  // TikTok: tiktok.com/@user/video/<id>
  if (SUPPORTED_POST_DOMAINS.tiktok.some(d => hostname === d.replace('www.', ''))) {
    const match = parsed.pathname.match(/\/@[^/]+\/video\/(\d+)/);
    if (match) {
      const videoId = match[1];
      return { valid: true, normalized: `https://www.tiktok.com/@user/video/${videoId}`, platform: 'tiktok', externalId: videoId };
    }
    // tiktok.com/t/<shortcode> or vm.tiktok.com/<id> redirect form
    const shortMatch = parsed.pathname.match(/\/t\/([^/?#]+)/);
    if (shortMatch) {
      return { valid: true, normalized: `https://www.tiktok.com/t/${shortMatch[1]}`, platform: 'tiktok', externalId: shortMatch[1] };
    }
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'Not a valid TikTok video URL' };
  }

  // YouTube: youtube.com/watch?v=<id> or youtu.be/<id> or youtube.com/shorts/<id>
  if (SUPPORTED_POST_DOMAINS.youtube.some(d => hostname === d.replace('www.', ''))) {
    if (hostname === 'youtu.be') {
      const vid = parsed.pathname.slice(1).split(/[/?#]/)[0];
      if (vid && vid.length >= 10) {
        return { valid: true, normalized: `https://www.youtube.com/watch?v=${vid}`, platform: 'youtube', externalId: vid };
      }
    }
    const searchId = parsed.searchParams.get('v');
    if (searchId) {
      return { valid: true, normalized: `https://www.youtube.com/watch?v=${searchId}`, platform: 'youtube', externalId: searchId };
    }
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?#]+)/);
    if (shortsMatch) {
      return { valid: true, normalized: `https://www.youtube.com/shorts/${shortsMatch[1]}`, platform: 'youtube', externalId: shortsMatch[1] };
    }
    return { valid: false, normalized: '', platform: null, externalId: null, error: 'Not a valid YouTube video or Short URL' };
  }

  return { valid: false, normalized: '', platform: null, externalId: null, error: 'Unsupported URL domain. Must be Instagram, TikTok, or YouTube' };
}

export function validateDisplayName(name: string): string | null {
  if (!name || name.trim().length < 1) return 'Display name is required';
  if (name.trim().length > MAX_INPUT_LENGTHS.DISPLAY_NAME) return `Display name must be ${MAX_INPUT_LENGTHS.DISPLAY_NAME} characters or less`;
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || username.trim().length < 3) return 'Username must be at least 3 characters';
  if (username.length > MAX_INPUT_LENGTHS.USERNAME) return `Username must be ${MAX_INPUT_LENGTHS.USERNAME} characters or less`;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
}

export function validateCampaignName(name: string): string | null {
  if (!name || name.trim().length < 3) return 'Campaign name must be at least 3 characters';
  if (name.length > MAX_INPUT_LENGTHS.CAMPAIGN_NAME) return `Campaign name must be ${MAX_INPUT_LENGTHS.CAMPAIGN_NAME} characters or less`;
  return null;
}

export function validateBrandName(name: string): string | null {
  if (!name || name.trim().length < 2) return 'Brand name must be at least 2 characters';
  if (name.length > MAX_INPUT_LENGTHS.BRAND_NAME) return `Brand name must be ${MAX_INPUT_LENGTHS.BRAND_NAME} characters or less`;
  return null;
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeRequirements(requirements: string[]): string[] {
  return requirements
    .map(r => r.trim())
    .filter(Boolean)
    .slice(0, MAX_INPUT_LENGTHS.REQUIREMENTS_COUNT)
    .map(r => r.length > MAX_INPUT_LENGTHS.REQUIREMENT ? r.slice(0, MAX_INPUT_LENGTHS.REQUIREMENT) : r)
    .map(sanitizeText);
}

export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString();
}