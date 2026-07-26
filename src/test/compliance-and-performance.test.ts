import { describe, it, expect } from 'vitest';
import { complianceValidatorService } from '../services/compliance-validator.service';
import { calculatePerformancePayout, VIEW_MILESTONE_TIERS } from '../domain/performance/payout-calculator';

describe('ComplianceValidatorService', () => {
  it('should pass compliance when all required hashtags and mentions are present', () => {
    const caption = 'Check out this epic new launch with @CreatorX! #CreatorX #ad #viral';
    const result = complianceValidatorService.evaluateCaption(caption, {
      requiredHashtags: ['#CreatorX', '#ad'],
      requiredMentions: ['@CreatorX'],
    });

    expect(result.isCompliant).toBe(true);
    expect(result.complianceScore).toBe(100);
    expect(result.missingHashtags).toHaveLength(0);
    expect(result.missingMentions).toHaveLength(0);
  });

  it('should detect missing hashtags and flag non-compliant captions', () => {
    const caption = 'Just another day posting content!';
    const result = complianceValidatorService.evaluateCaption(caption, {
      requiredHashtags: ['#CreatorX', '#sponsored'],
      requiredMentions: ['@CreatorXBrand'],
    });

    expect(result.isCompliant).toBe(false);
    expect(result.complianceScore).toBe(0);
    expect(result.missingHashtags).toEqual(['#CreatorX', '#sponsored']);
    expect(result.missingMentions).toEqual(['@CreatorXBrand']);
    expect(result.feedbackMessages).toHaveLength(3);
  });

  it('should perform case-insensitive hashtag and mention matching', () => {
    const caption = 'Loving this product @CREATORX #CREATORXAD';
    const result = complianceValidatorService.evaluateCaption(caption, {
      requiredHashtags: ['#creatorxad'],
      requiredMentions: ['@creatorx'],
    });

    expect(result.isCompliant).toBe(true);
    expect(result.complianceScore).toBe(100);
  });
});

describe('PayoutCalculator', () => {
  it('should resolve bronze tier for 10,000 views', () => {
    const result = calculatePerformancePayout({
      verifiedViews: 10000,
      cpmRateCents: 500, // $5.00 / 1k views
    });

    expect(result.tier.name).toBe('bronze');
    expect(result.baseEarningsCents).toBe(5000); // $50.00
    expect(result.milestoneBonusCents).toBe(250); // 5% bonus = $2.50
    expect(result.grossEarningsCents).toBe(5250); // $52.50 total
  });

  it('should resolve gold tier for 150,000 views', () => {
    const result = calculatePerformancePayout({
      verifiedViews: 150000,
      cpmRateCents: 600, // $6.00 / 1k views
      isOwnershipVerified: true,
    });

    expect(result.tier.name).toBe('gold');
    expect(result.baseEarningsCents).toBe(90000); // $900.00
    expect(result.milestoneBonusCents).toBe(13500); // 15% gold bonus = $135.00
    expect(result.verificationBonusCents).toBe(9000); // 10% verification bonus = $90.00
    expect(result.grossEarningsCents).toBe(112500); // $1,125.00
  });

  it('should enforce safety cap on maximum earnings', () => {
    const result = calculatePerformancePayout({
      verifiedViews: 2000000, // 2 million views
      cpmRateCents: 1000, // $10.00 / 1k
      maxCapCents: 500000, // $5,000 max cap
    });

    expect(result.grossEarningsCents).toBeGreaterThan(500000);
    expect(result.cappedEarningsCents).toBe(500000); // Capped at $5,000
  });

  it('should return valid milestones tiers definition', () => {
    expect(VIEW_MILESTONE_TIERS).toBeDefined();
    expect(VIEW_MILESTONE_TIERS.length).toBeGreaterThan(0);
  });
});
