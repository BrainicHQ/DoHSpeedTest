/*
 * DoHSpeedTest - Statistics and DNS response validation
 * Copyright (C) 2023 Silviu Stroe
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Canonical source for unit tests. The browser bundle duplicates this logic in script.js.
 */

export const MIN_SUCCESS_RATE_FOR_RANKING = 0.8;

export function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

export function calculateSpeedStats(results) {
    const values = results.filter(v => typeof v === 'number');
    if (!values.length) {
        return {
            min: 'Unavailable',
            median: 'Unavailable',
            max: 'Unavailable',
            avg: 'Unavailable',
            jitter: 'Unavailable'
        };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avg = sum / sorted.length;
    const med = median(sorted);
    return {
        min: sorted[0],
        median: med,
        max: sorted[sorted.length - 1],
        avg,
        jitter: sorted[sorted.length - 1] - sorted[0]
    };
}

export function buildReliabilityProfile(speedResults, totalQueries) {
    if (totalQueries === 0) {
        return {
            status: 'no-data',
            successCount: 0,
            failureCount: 0,
            totalQueries: 0,
            message: 'No hostnames configured for testing.'
        };
    }
    const successCount = speedResults.filter(s => typeof s === 'number').length;
    const failureCount = totalQueries - successCount;
    const successRate = successCount / totalQueries;

    let status;
    let message;
    if (successCount === 0) {
        status = 'failed';
        message = 'All hostname queries failed or timed out.';
    } else if (failureCount > 0) {
        status = 'partial';
        message = `${failureCount} of ${totalQueries} hostnames had no successful response. Failed hosts are excluded from speed scores.`;
    } else {
        status = 'healthy';
        message = 'All hostname queries succeeded.';
    }
    return { status, successCount, failureCount, totalQueries, successRate, message };
}

export function isEligibleForRanking(server, options = {}) {
    const { verifiedOnly = true } = options;
    if (!server.reliability || !server.speed || typeof server.speed.median !== 'number') {
        return false;
    }
    if (server.reliability.successRate < MIN_SUCCESS_RATE_FOR_RANKING) return false;
    if (verifiedOnly && server.measurementConfidence !== 'verified') return false;
    return true;
}

export function validateDnsJson(data) {
    return Boolean(
        data &&
        data.Status === 0 &&
        Array.isArray(data.Answer) &&
        data.Answer.length > 0
    );
}

export function validateDnsWireResponse(buffer) {
    if (!buffer || buffer.byteLength < 12) return false;
    const view = new DataView(buffer);
    const rcode = view.getUint16(2) & 0x0f;
    const ancount = view.getUint16(6);
    return rcode === 0 && ancount > 0;
}
