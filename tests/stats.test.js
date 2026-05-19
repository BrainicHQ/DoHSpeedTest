import { describe, it, expect } from 'vitest';
import {
    median,
    calculateSpeedStats,
    buildReliabilityProfile,
    isEligibleForRanking,
    validateDnsJson,
    validateDnsWireResponse,
    MIN_SUCCESS_RATE_FOR_RANKING
} from '../stats.js';

describe('median', () => {
    it('returns middle value for odd count', () => {
        expect(median([30, 10, 20])).toBe(20);
    });

    it('returns average of two middle values for even count', () => {
        expect(median([10, 20, 30, 40])).toBe(25);
    });

    it('returns null for empty input', () => {
        expect(median([])).toBeNull();
    });
});

describe('calculateSpeedStats', () => {
    it('computes min, median, max, avg, and jitter', () => {
        const stats = calculateSpeedStats([100, 50, 200]);
        expect(stats.min).toBe(50);
        expect(stats.median).toBe(100);
        expect(stats.max).toBe(200);
        expect(stats.avg).toBeCloseTo(116.67, 1);
        expect(stats.jitter).toBe(150);
    });

    it('ignores non-numeric entries', () => {
        const stats = calculateSpeedStats([null, 40, undefined, 60]);
        expect(stats.min).toBe(40);
        expect(stats.median).toBe(50);
    });

    it('returns Unavailable when no numeric values', () => {
        const stats = calculateSpeedStats([null, null]);
        expect(stats.median).toBe('Unavailable');
        expect(stats.jitter).toBe('Unavailable');
    });
});

describe('buildReliabilityProfile', () => {
    it('marks partial failures without penalty wording', () => {
        const profile = buildReliabilityProfile([10, null, 20], 3);
        expect(profile.status).toBe('partial');
        expect(profile.successCount).toBe(2);
        expect(profile.successRate).toBeCloseTo(2 / 3);
        expect(profile.message).not.toMatch(/penalty/i);
    });
});

describe('isEligibleForRanking', () => {
    it('requires median and minimum success rate', () => {
        const eligible = {
            speed: { median: 42 },
            reliability: { successRate: MIN_SUCCESS_RATE_FOR_RANKING },
            measurementConfidence: 'verified'
        };
        const ineligible = {
            speed: { median: 42 },
            reliability: { successRate: MIN_SUCCESS_RATE_FOR_RANKING - 0.01 },
            measurementConfidence: 'verified'
        };
        const timingOnly = {
            speed: { median: 42 },
            reliability: { successRate: 1 },
            measurementConfidence: 'timing-only'
        };
        expect(isEligibleForRanking(eligible)).toBe(true);
        expect(isEligibleForRanking(ineligible)).toBe(false);
        expect(isEligibleForRanking(timingOnly, { verifiedOnly: true })).toBe(false);
        expect(isEligibleForRanking(timingOnly, { verifiedOnly: false })).toBe(true);
    });
});

describe('validateDnsJson', () => {
    it('accepts NOERROR with answers', () => {
        expect(validateDnsJson({ Status: 0, Answer: [{ data: '93.184.216.34' }] })).toBe(true);
    });

    it('rejects NXDOMAIN and empty answers', () => {
        expect(validateDnsJson({ Status: 3, Answer: [] })).toBe(false);
        expect(validateDnsJson({ Status: 0, Answer: [] })).toBe(false);
    });
});

describe('validateDnsWireResponse', () => {
    it('accepts minimal NOERROR response with ANCOUNT > 0', () => {
        const buf = new ArrayBuffer(12);
        const view = new DataView(buf);
        view.setUint16(6, 1);
        expect(validateDnsWireResponse(buf)).toBe(true);
    });

    it('rejects short buffers and NXDOMAIN', () => {
        expect(validateDnsWireResponse(new ArrayBuffer(8))).toBe(false);
        const buf = new ArrayBuffer(12);
        const view = new DataView(buf);
        view.setUint16(2, 3);
        expect(validateDnsWireResponse(buf)).toBe(false);
    });
});
