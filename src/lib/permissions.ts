import type { UserRole } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  brand: 2,
  creator: 1,
};

export function canAccessRoute(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === 'admin';
}

export function isBrand(userRole: UserRole | null | undefined): boolean {
  return userRole === 'brand';
}

export function isCreator(userRole: UserRole | null | undefined): boolean {
  return userRole === 'creator';
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'creator': return '/creator/dashboard';
    case 'brand': return '/brand/dashboard';
    case 'admin': return '/admin/dashboard';
  }
}

// Fields creators are allowed to update on their own profile
export const CREATOR_UPDATABLE_PROFILE_FIELDS: readonly string[] = [
  'display_name',
  'username',
  'avatar_url',
  'onboarding_completed',
] as const;

// Fields brands are allowed to update on their own campaigns (before review)
export const BRAND_UPDATABLE_CAMPAIGN_FIELDS_DRAFT: readonly string[] = [
  'name',
  'campaign_type',
  'description',
  'requirements',
  'cover_url',
  'total_budget_cents',
  'rate_per_million_cents',
  'cap_per_post_cents',
  'cap_per_creator_cents',
  'minimum_duration_seconds',
  'start_at',
  'end_at',
] as const;

// Fields brands can update on active campaigns (limited)
export const BRAND_UPDATABLE_CAMPAIGN_FIELDS_ACTIVE: readonly string[] = [
  'description',
  'requirements',
  'end_at',
] as const;