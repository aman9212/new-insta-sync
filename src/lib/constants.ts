export const APP_NAME = 'CreatorX';
export const APP_DESCRIPTION = 'Premium creator campaign and clipping marketplace';

export const ROUTES = {
  // Public
  LANDING: '/',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  SETUP: '/setup',

  // Creator
  CREATOR_DASHBOARD: '/creator/dashboard',
  EXPLORE_CAMPAIGNS: '/creator/explore',
  CAMPAIGN: '/creator/campaigns/:id',
  CREATOR_SUBMISSIONS: '/creator/submissions',
  CREATOR_WALLET: '/creator/wallet',
  CREATOR_SETTINGS: '/creator/settings',

  // Brand
  BRAND_DASHBOARD: '/brand/dashboard',
  BRAND_CAMPAIGNS: '/brand/campaigns',
  CREATE_CAMPAIGN: '/brand/campaigns/new',
  EDIT_CAMPAIGN: '/brand/campaigns/:id/edit',
  CAMPAIGN_ANALYTICS: '/brand/campaigns/:id/analytics',
  BRAND_SUBMISSIONS: '/brand/submissions',
  BRAND_SETTINGS: '/brand/settings',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_BRANDS: '/admin/brands',
  ADMIN_CAMPAIGNS: '/admin/campaigns',
  ADMIN_SUBMISSIONS: '/admin/submissions',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export const DEFAULT_MIN_WITHDRAWAL_CENTS = 5000; // $50.00
export const DEFAULT_REFERRAL_COMMISSION_BPS = 500; // 5%
export const DEFAULT_VIEW_SYNC_INTERVAL_HOURS = 24;
export const VIEWS_PER_MILLION = 1_000_000;

export const SUPPORTED_POST_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
};

export const MAX_INPUT_LENGTHS = {
  DISPLAY_NAME: 64,
  USERNAME: 32,
  CAMPAIGN_NAME: 128,
  BRAND_NAME: 64,
  POST_URL: 2048,
  REQUIREMENT: 256,
  REQUIREMENTS_COUNT: 20,
  DESCRIPTION: 2000,
  REJECTION_REASON: 500,
} as const;

export const CAMPAIGN_TYPES = [
  { value: 'logo', label: 'Logo Design' },
  { value: 'music', label: 'Music / Audio' },
  { value: 'clipping', label: 'Clipping / Editing' },
  { value: 'ugc', label: 'UGC Content' },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const;