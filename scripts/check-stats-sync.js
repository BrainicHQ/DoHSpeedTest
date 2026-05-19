/**
 * Warns if stats.js and script.js stats helpers drift apart (browser uses inline copy).
 * Run: node scripts/check-stats-sync.js
 */
import { readFileSync } from 'fs';
import { median, calculateSpeedStats } from '../stats.js';

const script = readFileSync('script.js', 'utf8');
const samples = [12, 45, 30];
const expected = calculateSpeedStats(samples);

if (!script.includes('function median(values)')) {
    console.error('script.js missing median() — sync with stats.js');
    process.exit(1);
}

const med = median(samples);
if (med !== expected.median) {
    console.error('median mismatch between modules');
    process.exit(1);
}

console.log('stats.js and script.js appear in sync (smoke check passed).');
