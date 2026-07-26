// Core database enums and shared types

export type UserRole = 'creator' | 'brand' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';
export type CampaignType = 'logo' | 'music' | 'clipping' | 'ugc';
export type CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected' | 'cancelled';
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube';
export type SubmissionStatus = 'processing' | 'eligible' | 'ineligible' | 'rejected' | 'paid' | 'flagged' | 'under_review';
export type PayoutHoldStatus = 'pending' | 'verification_hold' | 'eligible' | 'credited' | 'withdrawn' | 'reversed';
export type TransactionType = 'earning' | 'adjustment' | 'withdrawal' | 'refund' | 'referral';
export type TransactionDirection = 'credit' | 'debit';
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';
export type ProviderConnectionStatus = 'active' | 'expired' | 'revoked';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// Database row types matching PostgreSQL schema
export interface Profile extends Timestamps {
  id: string;
  role: UserRole;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  onboarding_completed: boolean;
  account_status: AccountStatus;
  currency?: string | null;
  country?: string | null;
  timezone?: string | null;
}

export interface Brand extends Timestamps {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  verification_status: VerificationStatus;
}

export interface Campaign extends Timestamps {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  description: string | null;
  requirements: string[];
  cover_url: string | null;
  total_budget_cents: number;
  used_budget_cents: number;
  rate_per_million_cents: number;
  cap_per_post_cents: number | null;
  cap_per_creator_cents: number | null;
  minimum_duration_seconds: number | null;
  start_at: string | null;
  end_at: string | null;
}

export interface CampaignWithJoins extends Campaign {
  brand_name?: string;
  brand_logo_url?: string | null;
  platforms?: SocialPlatform[];
  budget_used_percent?: number;
}

export interface CampaignPlatform extends Timestamps {
  id: string;
  campaign_id: string;
  platform: SocialPlatform;
}

export interface Submission extends Timestamps {
  id: string;
  campaign_id: string;
  creator_id: string;
  platform: SocialPlatform;
  post_url: string;
  normalized_post_url: string | null;
  external_post_id: string | null;
  status: SubmissionStatus;
  payout_status: PayoutHoldStatus;
  total_views: number;
  verified_views: number;
  eligible_views: number;
  earnings_cents: number;
  rejection_reason: string | null;
  ineligible_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  last_synced_at: string | null;
  next_sync_at: string | null;
}

export interface SubmissionWithJoins extends Submission {
  campaign_name?: string;
  campaign_type?: CampaignType;
  brand_name?: string;
  creator_name?: string;
}

export interface Wallet extends Timestamps {
  id: string;
  user_id: string;
  available_balance_cents: number;
  pending_balance_cents: number;
  lifetime_earnings_cents: number;
  solana_address?: string | null;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount_cents: number;
  direction: TransactionDirection;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface Withdrawal extends Timestamps {
  id: string;
  user_id: string;
  amount_cents: number;
  status: WithdrawalStatus;
  payout_provider: string | null;
  payout_reference: string | null;
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface Referral extends Timestamps {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_bps: number;
  total_commission_cents: number;
}

export interface ViewSnapshot {
  id: string;
  submission_id: string;
  provider: SocialPlatform;
  total_views: number;
  captured_at: string;
}

export interface ProviderConnection extends Timestamps {
  id: string;
  user_id: string;
  provider: SocialPlatform;
  provider_account_id: string | null;
  provider_username: string | null;
  encrypted_token_reference: string | null;
  status: ProviderConnectionStatus;
  connected_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}