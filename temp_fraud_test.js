"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFraudScore = calculateFraudScore;

function calculateFraudScore(snapshots, duplicatePostIds = [], payoutThresholdViews = 0) {
    const signals = [];
    if (!snapshots || snapshots.length === 0) {
        return { score: 0, level: 'low', signals: [] };
    }

    const sorted = [...snapshots].sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
    const latest = sorted[sorted.length - 1];

    // 1. View Velocity Anomaly (Sub-second capture & divide-by-zero protection)
    if (sorted.length >= 3) {
        const velocities = [];
        for (let i = 1; i < sorted.length; i++) {
            const deltaViews = Math.max(0, (sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0));
            const timeDiffMs = new Date(sorted[i].captured_at).getTime() - new Date(sorted[i - 1].captured_at).getTime();
            // Minimum threshold of 0.01666 hours (1 minute) to prevent Infinity on sub-second snapshots
            const deltaHours = Math.max(0.01666, timeDiffMs / 3600000);
            velocities.push(deltaViews / deltaHours);
        }

        const maxVelocity = Math.max(...velocities);
        const sortedVelocities = [...velocities].sort((a, b) => a - b);
        const halfLen = Math.max(1, Math.floor(sortedVelocities.length / 2));
        const avgVelocity = sortedVelocities.slice(0, halfLen).reduce((s, v) => s + v, 0) / halfLen;

        const safeAvgVelocity = avgVelocity <= 0 ? 1 : avgVelocity;
        const ratio = isNaN(maxVelocity / safeAvgVelocity) ? 1 : maxVelocity / safeAvgVelocity;

        if (ratio >= 5 && maxVelocity > 500) {
            const contribution = Math.round(Math.min(1, (ratio - 5) / 15) * 25);
            signals.push({
                signal_type: 'velocity',
                signal_code: 'view_velocity_anomaly',
                severity: contribution >= 20 ? 'high' : 'medium',
                score_contribution: contribution,
                evidence: { avg_background_velocity_per_hour: avgVelocity, max_velocity_per_hour: maxVelocity, spike_ratio: ratio },
            });
        }
    }

    // 2. Engagement Mismatch (Zero-views & NaN protection)
    if (latest && latest.raw_views >= 1000) {
        const safeViews = Math.max(1, latest.raw_views);
        const rawLikes = Math.max(0, latest.raw_likes ?? 0);
        const likeRatio = rawLikes / safeViews;

        const hasLowEngagement = likeRatio < 0.001 && latest.raw_views > 10000;
        const hasHighEngagement = likeRatio > 0.5 && latest.raw_views > 5000;

        if (hasLowEngagement || hasHighEngagement) {
            const score = hasLowEngagement
                ? Math.min(1, (0.001 - likeRatio) / 0.001)
                : Math.min(1, (likeRatio - 0.5) / 0.5);
            const contribution = Math.round(score * 20);
            signals.push({
                signal_type: 'engagement',
                signal_code: 'engagement_mismatch',
                severity: contribution >= 15 ? 'high' : 'medium',
                score_contribution: contribution,
                evidence: { like_ratio: likeRatio, pattern: hasLowEngagement ? 'abnormally_low' : 'abnormally_high' },
            });
        }
    }

    // 3. Follower View Anomaly
    if (latest && (latest.raw_followers ?? 0) > 0 && latest.raw_views >= 1000) {
        const ratio = latest.raw_views / latest.raw_followers;
        if (ratio >= 100) {
            const contribution = Math.round(Math.min(1, (ratio - 100) / 400) * 15 * 0.6);
            signals.push({
                signal_type: 'follower',
                signal_code: 'follower_view_anomaly',
                severity: 'low',
                score_contribution: contribution,
                evidence: { views_to_followers_ratio: ratio },
            });
        }
    }

    // 4. Repeated Identical Growth
    if (sorted.length >= 4) {
        const deltas = [];
        for (let i = 1; i < sorted.length; i++) {
            deltas.push((sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0));
        }
        const significant = deltas.filter(d => d > 100);
        if (significant.length >= 3) {
            const counts = new Map();
            for (const d of significant)
                counts.set(d, (counts.get(d) ?? 0) + 1);
            const maxRepeats = Math.max(...counts.values());
            const ratio = maxRepeats / significant.length;
            if (ratio >= 0.6 && maxRepeats >= 3) {
                const contribution = Math.round(Math.min(1, (ratio - 0.6) / 0.3) * 20);
                signals.push({
                    signal_type: 'pattern',
                    signal_code: 'repeated_identical_growth',
                    severity: contribution >= 15 ? 'high' : 'medium',
                    score_contribution: contribution,
                    evidence: { repeat_count: maxRepeats, repeat_ratio: ratio },
                });
            }
        }
    }

    // 5. Metric Reversal
    if (sorted.length >= 2) {
        let reversalCount = 0;
        let maxReversal = 0;
        for (let i = 1; i < sorted.length; i++) {
            const delta = (sorted[i].raw_views ?? 0) - (sorted[i - 1].raw_views ?? 0);
            if (delta < -10) {
                reversalCount++;
                maxReversal = Math.max(maxReversal, Math.abs(delta));
            }
        }
        if (reversalCount > 0) {
            const ratio = reversalCount / (sorted.length - 1);
            const contribution = Math.round(Math.min(1, ratio + maxReversal / 100000) * 15);
            signals.push({
                signal_type: 'integrity',
                signal_code: 'metric_reversal',
                severity: 'high',
                score_contribution: contribution,
                evidence: { reversal_count: reversalCount, max_reversal_views: maxReversal },
            });
        }
    }

    // 6. Duplicate Content
    if (duplicatePostIds && duplicatePostIds.length > 0) {
        signals.push({
            signal_type: 'content',
            signal_code: 'duplicate_content',
            severity: 'high',
            score_contribution: 30,
            evidence: { duplicate_count: duplicatePostIds.length },
        });
    }

    // 7. Payout Threshold Gaming
    if (latest && payoutThresholdViews && payoutThresholdViews > 0 && sorted.length >= 2) {
        const viewsAbove = latest.raw_views - payoutThresholdViews;
        const percentAbove = viewsAbove / payoutThresholdViews;
        if (percentAbove >= 0 && percentAbove <= 0.03) {
            const recent = sorted.slice(-3);
            if (recent.length >= 2) {
                const recentGrowth = recent[recent.length - 1].raw_views - recent[0].raw_views;
                if (recentGrowth < payoutThresholdViews * 0.01) {
                    signals.push({
                        signal_type: 'gaming',
                        signal_code: 'payout_threshold_gaming',
                        severity: 'medium',
                        score_contribution: 14,
                        evidence: { views_percent_above: percentAbove, recent_growth: recentGrowth },
                    });
                }
            }
        }
    }

    const rawScore = signals.reduce((sum, s) => sum + (s.score_contribution || 0), 0);
    const score = Math.min(100, Math.max(0, isNaN(rawScore) ? 0 : rawScore));
    let level = 'low';
    if (score >= 80)
        level = 'critical';
    else if (score >= 60)
        level = 'high';
    else if (score >= 30)
        level = 'medium';
    return { score, level, signals };
}
