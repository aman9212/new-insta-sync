import { describe, it, expect } from 'vitest';
import {
  calculateFraudScore,
  detectEngagementMismatch,
  detectFollowerViewAnomaly,
  detectRepeatedIdenticalGrowth,
  detectMetricReversal,
  detectDuplicateContent,
  detectPayoutThresholdGaming,
  type MetricSnapshot,
} from './scoring-engine';

function makeSnapshot(views: number, likes = 0, comments = 0, shares = 0, saves = 0, followers = 0, hoursAgo = 0): MetricSnapshot {
  return {
    raw_views: views,
    raw_likes: likes,
    raw_comments: comments,
    raw_shares: shares,
    raw_saves: saves,
    raw_followers: followers,
    captured_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
  };
}

describe('Fraud Scoring Engine', () => {
  it('1. Normal organic growth', () => {
    const snapshots = [
      makeSnapshot(100, 5, 1, 0, 0, 500, 72),
      makeSnapshot(500, 25, 5, 2, 1, 500, 48),
      makeSnapshot(1200, 60, 12, 5, 3, 500, 24),
      makeSnapshot(2000, 100, 20, 8, 5, 500, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.level).toBe('low');
    expect(result.signals.length).toBe(0);
  });

  it('2. Viral growth (legitimate)', () => {
    const snapshots = [
      makeSnapshot(1000, 200, 50, 30, 20, 5000, 48),
      makeSnapshot(50000, 10000, 2500, 1500, 1000, 5000, 24),
      makeSnapshot(500000, 100000, 25000, 15000, 10000, 5000, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.score).toBeLessThan(60);
  });

  it('3. Sudden abnormal velocity spike', () => {
    const snapshots = [
      makeSnapshot(100, 5, 1, 0, 0, 500, 96),
      makeSnapshot(200, 10, 2, 0, 0, 500, 72),
      makeSnapshot(300, 15, 3, 0, 0, 500, 48),
      makeSnapshot(50000, 20, 3, 0, 0, 500, 24),
      makeSnapshot(50100, 21, 3, 0, 0, 500, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.signals.some(s => s.signal_code === 'view_velocity_anomaly')).toBe(true);
  });

  it('4. Engagement mismatch', () => {
    const snapshots = [
      makeSnapshot(100000, 0, 0, 0, 0, 1000, 24),
      makeSnapshot(200000, 1, 0, 0, 0, 1000, 0),
    ];
    const signal = detectEngagementMismatch(snapshots, 20);
    expect(signal).not.toBeNull();
    expect(signal?.evidence?.pattern).toBe('abnormally_low');
  });

  it('5. Duplicate content', () => {
    const signal = detectDuplicateContent(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'], 30);
    expect(signal).not.toBeNull();
    expect(signal?.score_contribution).toBe(30);
  });

  it('6. Metric reversal', () => {
    const snapshots = [
      makeSnapshot(1000, 50, 10, 5, 2, 500, 24),
      makeSnapshot(800, 50, 10, 5, 2, 500, 0),
    ];
    const signal = detectMetricReversal(snapshots, 25);
    expect(signal).not.toBeNull();
    expect(signal?.score_contribution).toBeGreaterThan(0);
  });

  it('7. Repeated identical increments', () => {
    const snapshots = [
      makeSnapshot(200, 5, 1, 0, 0, 500, 72),
      makeSnapshot(400, 10, 2, 0, 0, 500, 48),
      makeSnapshot(600, 15, 3, 0, 0, 500, 24),
      makeSnapshot(800, 20, 4, 0, 0, 500, 0),
    ];
    const signal = detectRepeatedIdenticalGrowth(snapshots, 20);
    expect(signal).not.toBeNull();
  });

  it('8. Multiple weak signals combining', () => {
    const snapshots = [
      makeSnapshot(100, 5, 1, 0, 0, 500, 72),
      makeSnapshot(200, 10, 2, 0, 0, 500, 48),
      makeSnapshot(300, 15, 3, 0, 0, 500, 24),
      makeSnapshot(100000, 15, 3, 0, 0, 10, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('9. Critical combined signals', () => {
    const snapshots = [
      makeSnapshot(100, 0, 0, 0, 0, 10, 72),
      makeSnapshot(200, 0, 0, 0, 0, 10, 48),
      makeSnapshot(300, 0, 0, 0, 0, 10, 24),
      makeSnapshot(200000, 1, 0, 0, 0, 10, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('10. Payout threshold gaming', () => {
    const threshold = 100000;
    const snapshots = [
      makeSnapshot(90000, 4500, 900, 180, 90, 5000, 48),
      makeSnapshot(100500, 5025, 1005, 201, 100, 5000, 24),
      makeSnapshot(100600, 5030, 1006, 201, 100, 5000, 0),
    ];
    const signal = detectPayoutThresholdGaming(snapshots, threshold, 20);
    expect(signal).not.toBeNull();
  });

  it('11. Insufficient data', () => {
    const result = calculateFraudScore({
      snapshots: [makeSnapshot(100)],
      submissionId: 'test',
      creatorId: 'test',
    });
    expect(result.score).toBe(0);
    expect(result.signals.length).toBe(0);
  });

  it('12. No single signal confirms abuse', () => {
    const snapshots = [
      makeSnapshot(100, 5, 1, 0, 0, 500, 72),
      makeSnapshot(200, 10, 2, 0, 0, 500, 48),
      makeSnapshot(300, 15, 3, 1, 0, 500, 24),
      makeSnapshot(10000, 500, 100, 30, 15, 500, 0),
    ];
    const result = calculateFraudScore({ snapshots, submissionId: 'test', creatorId: 'test' });
    expect(result.level).not.toBe('critical');
  });

  it('13. Follower view anomaly (weak signal)', () => {
    const snapshots = [
      makeSnapshot(500000, 25000, 5000, 1000, 500, 100, 0),
    ];
    const signal = detectFollowerViewAnomaly(snapshots, 15);
    expect(signal).not.toBeNull();
    expect(signal!.score_contribution).toBeLessThanOrEqual(15);
  });
});
