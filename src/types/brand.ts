// Enterprise Brand Management Types for CreatorX

export type BrandStatus = 'pending' | 'verified' | 'rejected' | 'suspended' | 'banned' | 'archived';
export type BrandDocStatus = 'pending' | 'approved' | 'rejected';
export type BrandMemberRole = 'Owner' | 'Admin' | 'Manager' | 'Finance' | 'Reviewer' | 'Moderator';
export type BrandTransactionType = 'deposit' | 'withdrawal' | 'campaign_spend' | 'refund';

export interface Brand {
  id: string;
  userId?: string;
  name: string;
  legalName?: string;
  slug: string;
  username?: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  industry?: string;
  businessCategory?: string;
  description?: string;
  foundedYear?: number;
  companySize?: string;
  status: BrandStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  brandId: string;
  taxId?: string;
  gstNumber?: string;
  country: string;
  state?: string;
  city?: string;
  timezone: string;
  language: string;
  address?: string;
  emailVerified: boolean;
  domainVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandWallet {
  id: string;
  brandId: string;
  availableBalance: number;
  pendingBalance: number;
  campaignBudget: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandMember {
  id: string;
  brandId: string;
  userId?: string;
  email: string;
  role: BrandMemberRole;
  status: 'active' | 'invited' | 'suspended';
  invitationToken?: string;
  invitedAt: string;
  joinedAt?: string;
  createdAt: string;
}

export interface BrandDocument {
  id: string;
  brandId: string;
  docType: 'business_license' | 'gst_certificate' | 'tax_doc' | 'website_proof';
  docName: string;
  fileUrl: string;
  status: BrandDocStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface BrandTransaction {
  id: string;
  brandId: string;
  type: BrandTransactionType;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  referenceId?: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface BrandReport {
  id: string;
  brandId: string;
  title: string;
  reportType: 'campaign' | 'finance' | 'creator' | 'invoice';
  format: 'pdf' | 'csv' | 'excel';
  fileUrl?: string;
  generatedBy: string;
  createdAt: string;
}

export interface BrandSettings {
  id: string;
  brandId: string;
  defaultBudget: number;
  defaultCurrency: string;
  autoApproveCampaign: boolean;
  autoInviteCreators: boolean;
  verificationRequired: boolean;
  taxRules: { vat: number; gst: number };
  updatedAt: string;
}

export interface BrandActivityLog {
  id: string;
  brandId: string;
  actorEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface BrandNotification {
  id: string;
  brandId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface BrandAnalyticsSummary {
  totalBrands: number;
  verifiedBrands: number;
  pendingApproval: number;
  suspendedBrands: number;
  totalRevenue: number;
  campaignCount: number;
  creatorCount: number;
  monthlySpending: number;
  pendingPayments: number;
}
