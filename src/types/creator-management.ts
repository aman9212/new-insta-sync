// Enterprise Creator Management System Types

export type ExtendedCreatorStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended'
  | 'banned'
  | 'archived'
  | 'deleted';

export type KYCStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type CreatorSocialPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'discord'
  | 'twitch'
  | 'kick';

export interface CreatorProfileDetail {
  id: string;
  display_name: string;
  username: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  country: string;
  state?: string | null;
  city?: string | null;
  timezone: string;
  language: string;
  bio?: string | null;
  portfolio_url?: string | null;
  website_url?: string | null;
  skills: string[];
  experience_level: string;
  status: ExtendedCreatorStatus;
  kyc_status: KYCStatus;
  is_online: boolean;
  last_login_at?: string | null;
  device_info?: string | null;
  last_ip?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorSocialAccountItem {
  id: string;
  creator_id: string;
  platform: CreatorSocialPlatform;
  account_handle: string;
  follower_count: number;
  subscriber_count: number;
  total_views: number;
  total_posts: number;
  is_verified: boolean;
  last_synced_at: string;
}

export interface CreatorKYCDocument {
  id: string;
  creator_id: string;
  status: KYCStatus;
  doc_type: string;
  gov_id_url?: string | null;
  passport_url?: string | null;
  driving_license_url?: string | null;
  selfie_url?: string | null;
  address_proof_url?: string | null;
  tax_doc_url?: string | null;
  business_doc_url?: string | null;
  rejection_reason?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export interface CreatorWalletDetail {
  id: string;
  creator_id: string;
  available_balance_cents: number;
  pending_balance_cents: number;
  locked_balance_cents: number;
  lifetime_earnings_cents: number;
  total_withdrawals_cents: number;
  bonus_earnings_cents: number;
  referral_earnings_cents: number;
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorLevelXP {
  id: string;
  creator_id: string;
  current_xp: number;
  level_number: number;
  level_name: string;
  rank_name: string;
  unlocked_rewards: string[];
  updated_at: string;
}

export interface CreatorBadgeItem {
  id: string;
  creator_id: string;
  badge_key: string;
  badge_name: string;
  icon: string;
  awarded_at: string;
  awarded_by?: string | null;
}

export interface CreatorReferralDetail {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  commission_bps: number;
  lifetime_commission_cents: number;
  status: string;
  created_at: string;
}

export interface CreatorNoteItem {
  id: string;
  creator_id: string;
  note_type: 'internal' | 'warning' | 'flag';
  content: string;
  is_flagged: boolean;
  created_by?: string | null;
  created_at: string;
}

export interface CreatorFlagItem {
  id: string;
  creator_id: string;
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  resolved: boolean;
  created_at: string;
}

export interface CreatorFullDetail extends CreatorProfileDetail {
  wallet?: CreatorWalletDetail;
  kyc?: CreatorKYCDocument;
  level?: CreatorLevelXP;
  badges?: CreatorBadgeItem[];
  socials?: CreatorSocialAccountItem[];
  notes?: CreatorNoteItem[];
  flags?: CreatorFlagItem[];
  referral?: CreatorReferralDetail;
  campaign_participations_count?: number;
  active_campaigns_count?: number;
  total_submissions_count?: number;
  verified_views_count?: number;
}

export interface AdminCreatorDashboardStats {
  totalCreators: number;
  onlineCreators: number;
  verifiedCreators: number;
  pendingKYCCreators: number;
  rejectedCreators: number;
  suspendedCreators: number;
  bannedCreators: number;
  topEarnerName: string;
  topCreatorName: string;
  newRegistrationsToday: number;
  dailyActiveCreators: number;
  totalCampaignParticipations: number;
  pendingWithdrawalsCount: number;
}
