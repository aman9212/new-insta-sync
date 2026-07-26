import { describe, it, expect } from 'vitest';
import { validateUrl, validateUsername, validateDisplayName } from './validators';
import { exportAnalyticsToCSV } from '../services/intelligence.service';
import type { CreatorAnalyticsSummary } from '../types';

describe('Validators tests', () => {
  it('should validate social URLs correctly', () => {
    // Instagram
    const instaResult = validateUrl('https://www.instagram.com/reel/C7xY8zNp1A2/');
    expect(instaResult.valid).toBe(true);
    expect(instaResult.platform).toBe('instagram');
    expect(instaResult.externalId).toBe('C7xY8zNp1A2');
    expect(instaResult.normalized).toBe('https://www.instagram.com/reel/C7xY8zNp1A2/');

    // YouTube
    const ytResult = validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(ytResult.valid).toBe(true);
    expect(ytResult.platform).toBe('youtube');
    expect(ytResult.externalId).toBe('dQw4w9WgXcQ');

    // TikTok
    const ttResult = validateUrl('https://www.tiktok.com/@testuser/video/738291048291');
    expect(ttResult.valid).toBe(true);
    expect(ttResult.platform).toBe('tiktok');
    expect(ttResult.externalId).toBe('738291048291');
  });

  it('should reject invalid platforms and formats', () => {
    const invalidRes = validateUrl('https://github.com/google/gemini');
    expect(invalidRes.valid).toBe(false);
  });

  it('should validate username format and lengths', () => {
    expect(validateUsername('ab')).toContain('at least 3 characters');
    expect(validateUsername('valid_user')).toBeNull();
    expect(validateUsername('user!invalid')).toContain('letters, numbers, and underscores');
  });

  it('should validate display name', () => {
    expect(validateDisplayName('')).toContain('required');
    expect(validateDisplayName('A valid display name')).toBeNull();
  });
});

describe('CSV Escaping tests', () => {
  it('should escape quotes, commas, and newlines in CSV export values', () => {
    const mockData: CreatorAnalyticsSummary[] = [
      {
        creator_id: 'test',
        campaign_id: '1',
        campaign_name: 'Summer Campaign, Phase 1',
        platform: 'youtube',
        total_submissions: 2,
        approved_submissions: 1,
        total_raw_views: 5000,
        total_verified_views: 4800,
        total_eligible_views: 4500,
        total_earnings_cents: 9000,
        paid_earnings_cents: 5000,
        first_submission_at: '2026-07-09T00:00:00Z',
        last_submission_at: '2026-07-09T00:00:00Z',
      },
      {
        creator_id: 'test',
        campaign_id: '2',
        campaign_name: 'Brand "Special" Deal',
        platform: 'instagram',
        total_submissions: 1,
        approved_submissions: 1,
        total_raw_views: 2000,
        total_verified_views: 2000,
        total_eligible_views: 2000,
        total_earnings_cents: 4000,
        paid_earnings_cents: 4000,
        first_submission_at: '2026-07-09T00:00:00Z',
        last_submission_at: '2026-07-09T00:00:00Z',
      }
    ];

    const csvContent = exportAnalyticsToCSV(mockData);
    expect(csvContent).toContain('"Summer Campaign, Phase 1"');
    expect(csvContent).toContain('"Brand ""Special"" Deal"');
  });
});
