export type PerformanceTierName = 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ViewMilestoneTier {
  name: PerformanceTierName;
  minViews: number;
  baseRewardCents: number;
  bonusPercentage: number;
}

export const VIEW_MILESTONE_TIERS: ViewMilestoneTier[] = [
  { name: 'diamond', minViews: 1_000_000, baseRewardCents: 750_000, bonusPercentage: 25 },
  { name: 'platinum', minViews: 500_000, baseRewardCents: 350_000, bonusPercentage: 20 },
  { name: 'gold', minViews: 100_000, baseRewardCents: 70_000, bonusPercentage: 15 },
  { name: 'silver', minViews: 25_000, baseRewardCents: 15_000, bonusPercentage: 10 },
  { name: 'bronze', minViews: 5_000, baseRewardCents: 2_500, bonusPercentage: 5 },
  { name: 'standard', minViews: 0, baseRewardCents: 0, bonusPercentage: 0 },
];

export interface PayoutCalculationInput {
  verifiedViews: number;
  cpmRateCents?: number; // Cents per 1,000 views (default $5.00 / 1k = 500 cents)
  maxCapCents?: number; // Maximum earnings cap for single submission
  isOwnershipVerified?: boolean; // Bonus multiplier if bio/OAuth ownership is verified
}

export interface PayoutCalculationResult {
  tier: ViewMilestoneTier;
  verifiedViews: number;
  baseEarningsCents: number;
  milestoneBonusCents: number;
  verificationBonusCents: number;
  grossEarningsCents: number;
  cappedEarningsCents: number;
  effectiveCpmCents: number; // Effective CPM in cents per 1,000 views
}

/**
 * Pure domain calculator for performance milestone payouts and CPM metrics.
 */
export function calculatePerformancePayout(input: PayoutCalculationInput): PayoutCalculationResult {
  const verifiedViews = Math.max(0, input.verifiedViews || 0);
  const cpmRateCents = input.cpmRateCents ?? 500; // $5.00 default CPM
  const maxCapCents = input.maxCapCents ?? 1_000_000; // $10,000 max default cap

  // 1. Resolve Tier
  const tier = VIEW_MILESTONE_TIERS.find(t => verifiedViews >= t.minViews) || VIEW_MILESTONE_TIERS[VIEW_MILESTONE_TIERS.length - 1];

  // 2. Base CPM Earnings
  const baseEarningsCents = Math.round((verifiedViews / 1000) * cpmRateCents);

  // 3. Milestone Bonus
  const milestoneBonusCents = Math.round(baseEarningsCents * (tier.bonusPercentage / 100));

  // 4. Verification Bonus (10% extra if account ownership is verified)
  const verificationBonusCents = input.isOwnershipVerified ? Math.round(baseEarningsCents * 0.1) : 0;

  // 5. Total Gross Earnings
  const grossEarningsCents = baseEarningsCents + milestoneBonusCents + verificationBonusCents;

  // 6. Apply Safety Cap
  const cappedEarningsCents = Math.min(grossEarningsCents, maxCapCents);

  // 7. Effective CPM
  const effectiveCpmCents = verifiedViews > 0 ? Math.round((cappedEarningsCents / verifiedViews) * 1000) : 0;

  return {
    tier,
    verifiedViews,
    baseEarningsCents,
    milestoneBonusCents,
    verificationBonusCents,
    grossEarningsCents,
    cappedEarningsCents,
    effectiveCpmCents,
  };
}
