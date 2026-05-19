/*
 * DoHSpeedTest - Real-time DNS over HTTPS (DoH) Speed Testing Tool
 * Copyright (C) 2023 Silviu Stroe
 *
 * This file is part of DoHSpeedTest.
 *
 * DoHSpeedTest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * DoHSpeedTest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with DoHSpeedTest. If not, see <http://www.gnu.org/licenses/>.
 */

// Stats/validation (canonical copy in stats.js for unit tests — keep in sync)
const MIN_SUCCESS_RATE_FOR_RANKING = 0.8;

function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

function calculateSpeedStats(results) {
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

function buildReliabilityProfile(speedResults, totalQueries) {
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

function isEligibleForRanking(server, options = {}) {
    const { verifiedOnly = true } = options;
    if (!server.reliability || !server.speed || typeof server.speed.median !== 'number') {
        return false;
    }
    if (server.reliability.successRate < MIN_SUCCESS_RATE_FOR_RANKING) return false;
    if (verifiedOnly && server.measurementConfidence !== 'verified') return false;
    return true;
}

function validateDnsJson(data) {
    return Boolean(
        data &&
        data.Status === 0 &&
        Array.isArray(data.Answer) &&
        data.Answer.length > 0
    );
}

function validateDnsWireResponse(buffer) {
    if (!buffer || buffer.byteLength < 12) return false;
    const view = new DataView(buffer);
    const rcode = view.getUint16(2) & 0x0f;
    const ancount = view.getUint16(6);
    return rcode === 0 && ancount > 0;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const TEST_MODES = {
    quick: { samples: 1, timeout: 5000 },
    standard: { samples: 3, timeout: 5000 },
    accurate: { samples: 5, timeout: 8000 }
};
const SAMPLE_DELAY_MS = 75;
const WARMUP_QUERIES_PER_HOST = 1;
const WARMUP_HOST_COUNT = 3;
const PARALLEL_HOST_LIMIT = 4;
const WARMUP_HOST = 'example.com';

const STORAGE_KEYS = {
    theme: 'dns-theme',
    settings: 'dns-settings',
    hosts: 'dns-test-hosts',
    customServers: 'dns-custom-servers',
    lastResults: 'dns-last-results'
};

const SETUP_LINKS = {
    windows: 'https://www.windowscentral.com/software-apps/how-to-configure-dns-over-https-doh-on-windows-11',
    macos: 'https://support.mozilla.org/en-US/kb/firefox-dns-over-https',
    android: 'https://support.google.com/android/answer/9657188'
};

const topWebsites = [
    'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com',
    'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com',
    'tiktok.com', 'pinterest.com'
];

const DEFAULT_DNS_SERVERS = [
    { name: "AdGuard", url: "https://dns.adguard-dns.com/dns-query", ips: ["94.140.14.14", "94.140.15.15"] },
    { name: "AliDNS", url: "https://dns.alidns.com/dns-query", ips: ["223.5.5.5", "223.6.6.6"] },
    { name: "OpenDNS", url: "https://doh.opendns.com/dns-query", ips: ["208.67.222.222", "208.67.220.220"] },
    { name: "CleanBrowsing", url: "https://doh.cleanbrowsing.org/doh/family-filter/", ips: ["185.228.168.9", "185.228.169.9"], tags: ["family-filter"] },
    { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query", type: "get", allowCors: true, ips: ["1.1.1.1", "1.0.0.1"] },
    { name: "ControlD", url: "https://freedns.controld.com/p0", ips: ["76.76.2.0", "76.223.122.150"] },
    { name: "DNS.SB", url: "https://doh.dns.sb/dns-query", type: "get", allowCors: true, ips: ["185.222.222.222", "45.11.45.11"] },
    { name: "DNSPod", url: "https://dns.pub/dns-query", type: "post", allowCors: false, ips: ["119.29.29.29", "182.254.116.116"] },
    { name: "Google", url: "https://dns.google/resolve", type: "get", allowCors: true, ips: ["8.8.8.8", "8.8.4.4"] },
    { name: "Mullvad", url: "https://dns.mullvad.net/dns-query", ips: ["194.242.2.2", "194.242.2.3"], type: "get", allowCors: false },
    { name: "Mullvad Base", url: "https://base.dns.mullvad.net/dns-query", ips: ["194.242.2.4", "194.242.2.4"], type: "get", allowCors: false },
    { name: "NextDNS", url: "https://dns.nextdns.io", type: "get", ips: ["45.90.28.0", "45.90.30.0"] },
    { name: "OpenBLD", url: "https://ada.openbld.net/dns-query", ips: ["146.112.41.2", "146.112.41.102"], allowCors: false },
    { name: "DNS4EU", url: "https://unfiltered.joindns4.eu/dns-query", ips: ["86.54.11.100", "86.54.11.200"], type: "post", allowCors: false },
    { name: "Quad9", url: "https://dns.quad9.net/dns-query", ips: ["9.9.9.9", "149.112.112.112"] },
    { name: "360", url: "https://doh.360.cn/dns-query", ips: ["101.226.4.6", "180.163.224.54"] },
    { name: "Canadian Shield", url: "https://private.canadianshield.cira.ca/dns-query", ips: ["149.112.121.10", "149.112.122.10"] },
    { name: "Digitale Gesellschaft", url: "https://dns.digitale-gesellschaft.ch/dns-query", ips: ["185.95.218.42", "185.95.218.43"] },
    { name: "DNS for Family", url: "https://dns-doh.dnsforfamily.com/dns-query", ips: ["94.130.180.225", "78.47.64.161"], tags: ["family-filter"] },
    { name: "Restena", url: "https://dnspub.restena.lu/dns-query", ips: ["158.64.1.29"] },
    { name: "IIJ", url: "https://public.dns.iij.jp/dns-query", ips: ["203.180.164.45", "203.180.166.45"] },
    { name: "LibreDNS", url: "https://doh.libredns.gr/dns-query", ips: ["116.202.176.26", "147.135.76.183"] },
    { name: "Switch", url: "https://dns.switch.ch/dns-query", ips: ["130.59.31.248", "130.59.31.251"] },
    { name: "Foundation for Applied Privacy", url: "https://doh.applied-privacy.net/query", ips: ["146.255.56.98"] },
    { name: "UncensoredDNS", url: "https://anycast.uncensoreddns.org/dns-query", ips: ["91.239.100.100", "89.233.43.71"] },
    { name: "RethinkDNS", url: "https://sky.rethinkdns.com/dns-query", ips: ["104.21.83.62", "172.67.214.246"], allowCors: false },
    { name: "Comcast Xfinity", url: "https://doh.xfinity.com/dns-query", type: "get", allowCors: false, ips: ["75.75.75.75", "75.75.76.76"] }
];

let dnsServers = [];
let customDnsServers = [];

let userSettings = {
    testMode: 'standard',
    rankByWarm: false,
    verifiedOnlyRanking: true,
    hideFamilyFilter: false
};

let testAbortController = null;
let cancelRequested = false;
let lastTestSnapshot = null;

function getTestModeConfig() {
    return TEST_MODES[userSettings.testMode] || TEST_MODES.standard;
}

function getSamplesPerHost() {
    return getTestModeConfig().samples;
}

function getQueryTimeoutMs() {
    return getTestModeConfig().timeout;
}

function ensureServerMetadata(server) {
    server.measurementConfidence = server.allowCors ? 'verified' : 'timing-only';
    try {
        const u = new URL(server.url);
        const isJson = (server.type || 'post') === 'get' && u.pathname.includes('/resolve');
        if (isJson) server.transport = 'GET JSON';
        else if ((server.type || 'post') === 'get') server.transport = 'GET wire';
        else server.transport = 'POST wire';
    } catch {
        server.transport = 'POST wire';
    }
}

function rebuildDnsServerList() {
    let list = DEFAULT_DNS_SERVERS.map(s => ({ ...s }));
    if (userSettings.hideFamilyFilter) {
        list = list.filter(s => !s.tags?.includes('family-filter'));
    }
    list.push(...customDnsServers.map(s => ({ ...s })));
    dnsServers = list;
    dnsServers.forEach(ensureServerMetadata);
}

function loadPersistedData() {
    try {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
        userSettings = { ...userSettings, ...settings };
    } catch { /* ignore */ }
    try {
        const hosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.hosts) || 'null');
        if (Array.isArray(hosts) && hosts.length) {
            topWebsites.length = 0;
            topWebsites.push(...hosts);
        }
    } catch { /* ignore */ }
    try {
        customDnsServers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customServers) || '[]');
        if (!Array.isArray(customDnsServers)) customDnsServers = [];
    } catch {
        customDnsServers = [];
    }
    try {
        lastTestSnapshot = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastResults) || 'null');
    } catch {
        lastTestSnapshot = null;
    }
    rebuildDnsServerList();
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(userSettings));
}

function saveHosts() {
    localStorage.setItem(STORAGE_KEYS.hosts, JSON.stringify(topWebsites));
}

function saveCustomServers() {
    localStorage.setItem(STORAGE_KEYS.customServers, JSON.stringify(customDnsServers));
}

function saveLastResults(snapshot) {
    lastTestSnapshot = snapshot;
    localStorage.setItem(STORAGE_KEYS.lastResults, JSON.stringify(snapshot));
}

async function mapPool(items, limit, iterator) {
    const results = new Array(items.length);
    let nextIndex = 0;
    async function worker() {
        while (nextIndex < items.length) {
            if (cancelRequested) return;
            const i = nextIndex++;
            results[i] = await iterator(items[i], i);
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

// ─── State ───────────────────────────────────────────────────────────────────

let dnsChart = null;
let chartData = [];
let sortState = { column: -1, direction: 'asc' };
let testRunning = false;

// ─── DOM References (set in initApp) ─────────────────────────────────────────

const $ = (id) => document.getElementById(id);
let checkButton;
let btnIcon;
let btnText;
let progressContainer;
let progressFill;
let progressPhase;
let progressCount;
let topResults;
let rankingList;
let chartSection;
let tableSection;
let resultsBody;
let drawer;
let overlay;
let exportBtn;
let winnerGuide;
let timingOnlySection;
let timingOnlyList;

function initApp() {
    loadPersistedData();
    checkButton = $('checkButton');
    btnIcon = $('btnIcon');
    btnText = $('btnText');
    progressContainer = $('progressContainer');
    progressFill = $('progressFill');
    progressPhase = $('progressPhase');
    progressCount = $('progressCount');
    topResults = $('topResults');
    rankingList = $('rankingList');
    chartSection = $('chartSection');
    tableSection = $('tableSection');
    resultsBody = $('resultsBody');
    drawer = $('settingsDrawer');
    overlay = $('drawerOverlay');
    exportBtn = $('exportBtn');
    winnerGuide = $('winnerGuide');
    timingOnlySection = $('timingOnlySection');
    timingOnlyList = $('timingOnlyList');

    if (!checkButton) {
        console.error('DoHSpeedTest: #checkButton not found');
        return;
    }

    syncSettingsUi();
    bindUiHandlers();
    initTheme();
}

function syncSettingsUi() {
    document.querySelectorAll('input[name="testMode"]').forEach(radio => {
        radio.checked = radio.value === userSettings.testMode;
    });
    const rankByWarm = $('rankByWarm');
    const verifiedOnly = $('verifiedOnlyRanking');
    const hideFamily = $('hideFamilyFilter');
    if (rankByWarm) rankByWarm.checked = userSettings.rankByWarm;
    if (verifiedOnly) verifiedOnly.checked = userSettings.verifiedOnlyRanking;
    if (hideFamily) hideFamily.checked = userSettings.hideFamilyFilter;
}

function applySettingsFromUi() {
    const mode = document.querySelector('input[name="testMode"]:checked');
    if (mode) userSettings.testMode = mode.value;
    userSettings.rankByWarm = $('rankByWarm')?.checked ?? false;
    userSettings.verifiedOnlyRanking = $('verifiedOnlyRanking')?.checked ?? true;
    const hideChanged = userSettings.hideFamilyFilter !== ($('hideFamilyFilter')?.checked ?? false);
    userSettings.hideFamilyFilter = $('hideFamilyFilter')?.checked ?? false;
    saveSettings();
    if (hideChanged) rebuildDnsServerList();
}

// ─── Theme ───────────────────────────────────────────────────────────────────

function initTheme() {
    const stored = localStorage.getItem('dns-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function bindUiHandlers() {
    $('themeToggle')?.addEventListener('click', () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('dns-theme', html.classList.contains('dark') ? 'dark' : 'light');
    if (dnsChart) {
        updateChart();
    }
    });

    checkButton.addEventListener('click', onRunSpeedTest);

    $('shareBtn')?.addEventListener('click', shareResults);

    exportBtn?.addEventListener('click', exportResultsJson);

    $('settingsBtn')?.addEventListener('click', openDrawer);
    $('closeDrawer')?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) closeDrawer();
    });

    document.querySelectorAll('.drawer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.drawerTab;
            document.querySelectorAll('.drawer-tab').forEach(t => {
                const isActive = t.dataset.drawerTab === target;
                t.classList.toggle('border-emerald-600', isActive);
                t.classList.toggle('text-emerald-600', isActive);
                t.classList.toggle('dark:text-emerald-400', isActive);
                t.classList.toggle('dark:border-emerald-400', isActive);
                t.classList.toggle('border-transparent', !isActive);
                t.classList.toggle('text-slate-400', !isActive);
            });
            document.querySelectorAll('.drawer-panel').forEach(p => p.classList.add('hidden'));
            const panelId = target === 'hosts' ? 'hostsPanel' : target === 'doh' ? 'dohPanel' : 'optionsPanel';
            $(panelId)?.classList.remove('hidden');
        });
    });

    document.querySelectorAll('input[name="testMode"]').forEach(radio => {
        radio.addEventListener('change', applySettingsFromUi);
    });
    ['rankByWarm', 'verifiedOnlyRanking', 'hideFamilyFilter'].forEach(id => {
        $(id)?.addEventListener('change', applySettingsFromUi);
    });

    $('addHostname')?.addEventListener('click', () => {
        const input = $('newWebsite');
        const host = validateAndExtractHost(input.value.trim());
        if (!host) {
            showToast('Enter a valid hostname or URL', 'error');
        } else if (topWebsites.includes(host)) {
            showToast('Already in the list', 'error');
        } else {
            topWebsites.push(host);
            saveHosts();
            renderHostsList();
            showToast(`Added ${host}`, 'success');
        }
        input.value = '';
    });

    $('newWebsite')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('addHostname')?.click();
    });

    $('addDoH')?.addEventListener('click', () => {
        const nameInput = $('newDoHName');
        const urlInput = $('newDoHUrl');
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name) {
            showToast('Enter a server name', 'error');
            nameInput.focus();
            return;
        }
        let parsedUrl;
        try { parsedUrl = new URL(url); } catch { parsedUrl = null; }
        if (!parsedUrl || parsedUrl.protocol !== 'https:') {
            showToast('Enter a valid HTTPS URL', 'error');
            urlInput.focus();
            return;
        }
        if (dnsServers.some(s => s.url === url || s.name === name)) {
            showToast('Server with that name or URL already exists', 'error');
            return;
        }
        checkServerCapabilities(name, url);
        nameInput.value = '';
        urlInput.value = '';
    });

    $('newDoHUrl')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('addDoH')?.click();
    });

    document.querySelectorAll('th[data-sortable]').forEach(th => {
        th.addEventListener('click', () => {
            const col = parseInt(th.dataset.col);
            if (sortState.column === col) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = col;
                sortState.direction = 'asc';
            }

            document.querySelectorAll('th[data-sortable] .sort-arrow').forEach(arrow => {
                arrow.innerHTML = '&#8597;';
                arrow.classList.remove('text-emerald-600', 'dark:text-emerald-400');
                arrow.classList.add('text-slate-400');
            });
            const activeArrow = th.querySelector('.sort-arrow');
            activeArrow.innerHTML = sortState.direction === 'asc' ? '&#8593;' : '&#8595;';
            activeArrow.classList.remove('text-slate-400');
            activeArrow.classList.add('text-emerald-600', 'dark:text-emerald-400');

            sortTable(col, sortState.direction);
        });
    });

    window.addEventListener('resize', () => {
        if (dnsChart) dnsChart.resize();
    });

    window.copyServerDetails = copyServerDetails;
}

// ─── Toast Notifications ─────────────────────────────────────────────────────

function showToast(message, type = 'info') {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    const colors = {
        info: 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900',
        success: 'bg-emerald-700 text-white',
        error: 'bg-red-700 text-white'
    };
    toast.className = `toast-enter pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${colors[type] || colors.info}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 2800);
}

// ─── Settings Drawer ─────────────────────────────────────────────────────────

function openDrawer() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        drawer.style.transform = 'translateX(0)';
    });
    renderHostsList();
    renderDoHList();
}

function closeDrawer() {
    overlay.style.opacity = '0';
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => overlay.classList.add('hidden'), 200);
}

// ─── Hosts Management ────────────────────────────────────────────────────────

function renderHostsList() {
    const list = $('websiteList');
    list.innerHTML = '';
    topWebsites.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm';

        const span = document.createElement('span');
        span.className = 'text-slate-700 dark:text-slate-300 truncate mr-2';
        span.textContent = site;

        const btn = document.createElement('button');
        btn.className = 'shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors';
        btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
        btn.addEventListener('click', () => {
            topWebsites.splice(index, 1);
            saveHosts();
            renderHostsList();
        });

        li.append(span, btn);
        list.appendChild(li);
    });
    checkButton.disabled = topWebsites.length === 0 && !testRunning;
}

function validateAndExtractHost(input) {
    try {
        const url = new URL(input);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
        return url.hostname;
    } catch {
        const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
        return hostnameRegex.test(input) ? input : null;
    }
}

// ─── DoH Server Management ──────────────────────────────────────────────────

function renderDoHList() {
    const list = $('dohList');
    list.innerHTML = '';
    dnsServers.forEach((server, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm gap-2';

        const info = document.createElement('div');
        info.className = 'min-w-0 flex-1';
        info.innerHTML = `<div class="text-slate-700 dark:text-slate-300 font-medium truncate">${server.name}</div>
                          <div class="text-xs text-slate-400 dark:text-slate-500 truncate">${server.url}</div>`;

        const btn = document.createElement('button');
        btn.className = 'shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors';
        btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
        btn.addEventListener('click', () => {
            const removed = dnsServers[index];
            dnsServers.splice(index, 1);
            const customIdx = customDnsServers.findIndex(s => s.url === removed.url && s.name === removed.name);
            if (customIdx >= 0) {
                customDnsServers.splice(customIdx, 1);
                saveCustomServers();
            }
            renderDoHList();
        });

        li.append(info, btn);
        list.appendChild(li);
    });
}

// ─── DNS Speed Test Logic ────────────────────────────────────────────────────

function setButtonState(state) {
    const spinnerSVG = '<svg class="w-4 h-4 btn-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>';
    const playSVG = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

    if (state === 'warmup') {
        btnIcon.innerHTML = spinnerSVG;
        btnText.textContent = 'Warming up...';
        checkButton.disabled = true;
    } else if (state === 'testing') {
        btnIcon.innerHTML = spinnerSVG;
        btnText.textContent = 'Cancel test';
        checkButton.disabled = false;
        checkButton.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        checkButton.classList.add('bg-red-600', 'hover:bg-red-700');
    } else if (state === 'done') {
        btnIcon.innerHTML = playSVG;
        btnText.textContent = 'Run Again';
        checkButton.disabled = false;
        checkButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        checkButton.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
    } else {
        btnIcon.innerHTML = playSVG;
        btnText.textContent = 'Run Speed Test';
        checkButton.disabled = false;
        checkButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        checkButton.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
    }
}

async function onRunSpeedTest() {
    if (testRunning) {
        cancelRequested = true;
        testAbortController?.abort();
        showToast('Cancelling test…', 'info');
        return;
    }

    applySettingsFromUi();
    testRunning = true;
    cancelRequested = false;
    testAbortController = new AbortController();

    chartData = [];
    chartSection.classList.add('hidden');
    topResults.classList.add('hidden');
    timingOnlySection?.classList.add('hidden');
    winnerGuide?.classList.add('hidden');
    exportBtn?.classList.add('hidden');
    exportBtn && (exportBtn.disabled = true);
    resultsBody.innerHTML = '';
    tableSection.classList.remove('hidden');

    dnsServers.forEach(s => {
        delete s.speed;
        delete s.reliability;
        delete s.individualResults;
    });

    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressPhase.textContent = 'Testing DNS servers...';
    progressCount.textContent = '';

    setButtonState('testing');

    try {
        await performDNSTests();
        if (!cancelRequested) {
            showTopResults();
            exportBtn?.classList.remove('hidden');
            exportBtn && (exportBtn.disabled = false);
        } else {
            showToast('Test cancelled', 'info');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('DNS speed test failed:', err);
            showToast('Test failed. Check the browser console for details.', 'error');
        }
    }

    progressContainer.classList.add('hidden');
    setButtonState('done');
    testRunning = false;
    cancelRequested = false;
    testAbortController = null;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function warmUpServer(server) {
    const hosts = topWebsites.length
        ? topWebsites.slice(0, WARMUP_HOST_COUNT)
        : [WARMUP_HOST];
    for (const host of hosts) {
        if (cancelRequested) return;
        for (let i = 0; i < WARMUP_QUERIES_PER_HOST; i++) {
            await measureDNSSpeed(server.url, host, server.type, server.allowCors);
        }
    }
}

async function measureHostMedian(server, hostname) {
    const sampleCount = getSamplesPerHost();
    const samples = [];
    for (let i = 0; i < sampleCount; i++) {
        if (cancelRequested) break;
        if (i > 0) await delay(SAMPLE_DELAY_MS);
        samples.push(await measureDNSSpeed(server.url, hostname, server.type, server.allowCors));
    }
    const successful = samples.filter(s => typeof s === 'number');
    const coldMs = typeof samples[0] === 'number' ? samples[0] : null;
    const warmSamples = samples.slice(1).filter(s => typeof s === 'number');
    const warmMs = warmSamples.length ? median(warmSamples) : null;
    const allMedian = successful.length ? median(successful) : null;
    const speed = userSettings.rankByWarm && warmMs !== null ? warmMs : allMedian;
    return { speed, coldMs, warmMs, sampleCount, allMedian };
}

async function performDNSTests() {
    const totalServers = dnsServers.length;
    const totalQueries = topWebsites.length;

    for (let i = 0; i < dnsServers.length; i++) {
        if (cancelRequested) break;
        const server = dnsServers[i];
        ensureServerMetadata(server);

        btnText.textContent = `Testing ${i + 1}/${totalServers}...`;
        progressCount.textContent = `${i + 1} of ${totalServers}`;
        progressFill.style.width = `${((i + 1) / totalServers) * 100}%`;

        await warmUpServer(server);
        if (cancelRequested) break;

        const hostResults = await mapPool(topWebsites, PARALLEL_HOST_LIMIT, async (website) => {
            progressPhase.textContent = `${server.name} — ${website}`;
            return measureHostMedian(server, website);
        });

        server.individualResults = topWebsites.map((website, idx) => {
            const r = hostResults[idx];
            return {
                website,
                speed: r && r.speed !== null ? r.speed : 'Unavailable',
                coldMs: r?.coldMs ?? null,
                warmMs: r?.warmMs ?? null,
                sampleCount: r?.sampleCount ?? getSamplesPerHost()
            };
        });

        const speedResults = hostResults.map(r => (r && r.speed !== null) ? r.speed : null);

        if (totalQueries === 0) {
            server.speed = { min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable', jitter: 'Unavailable' };
            server.reliability = { status: 'no-data', successCount: 0, failureCount: 0, totalQueries: 0, successRate: 0, message: 'No hostnames configured for testing.' };
        } else {
            server.speed = calculateSpeedStats(speedResults);
            server.reliability = buildReliabilityProfile(speedResults, totalQueries);
        }

        updateResult(server);
    }
}

// ─── DNS Query Logic (preserved exactly) ─────────────────────────────────────

async function measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
    const controller = new AbortController();
    const timeoutMs = getQueryTimeoutMs();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const parentSignal = testAbortController?.signal;
    const onParentAbort = () => controller.abort();
    parentSignal?.addEventListener('abort', onParentAbort);

    try {
        const dnsQuery = buildDNSQuery(hostname);
        const startTime = performance.now();
        let response;
        let usesJsonApi = false;

        if (serverType === 'get') {
            const urlWithParam = new URL(dohUrl);
            usesJsonApi = urlWithParam.pathname.includes('/resolve');
            let fetchOptions = { method: 'GET', signal: controller.signal };

            if (usesJsonApi) {
                urlWithParam.searchParams.set('name', hostname);
                urlWithParam.searchParams.set('type', 'A');
                urlWithParam.searchParams.set('nocache', Date.now());
                if (allowCors) {
                    fetchOptions.mode = 'cors';
                    fetchOptions.headers = { 'Accept': 'application/dns-json' };
                } else {
                    fetchOptions.mode = 'no-cors';
                }
            } else {
                urlWithParam.searchParams.set('dns', encodeDnsQueryBase64Url(dnsQuery));
                fetchOptions.mode = allowCors ? 'cors' : 'no-cors';
                if (allowCors) {
                    fetchOptions.headers = { 'Accept': 'application/dns-message' };
                }
            }
            response = await fetch(urlWithParam, fetchOptions);
        } else {
            if (allowCors) {
                response = await fetch(dohUrl, {
                    method: 'POST',
                    body: dnsQuery,
                    mode: 'cors',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/dns-message',
                        'Accept': 'application/dns-message'
                    }
                });
            } else {
                const urlWithParam = new URL(dohUrl);
                urlWithParam.searchParams.set('dns', encodeDnsQueryBase64Url(dnsQuery));
                response = await fetch(urlWithParam, { method: 'GET', mode: 'no-cors', signal: controller.signal });
            }
        }

        clearTimeout(timeoutId);
        if (allowCors && !response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const elapsed = performance.now() - startTime;

        if (allowCors) {
            if (usesJsonApi) {
                const data = await response.json();
                if (!validateDnsJson(data)) return null;
            } else {
                const buffer = await response.arrayBuffer();
                if (!validateDnsWireResponse(buffer)) return null;
            }
        }

        return elapsed;
    } catch (error) {
        clearTimeout(timeoutId);
        parentSignal?.removeEventListener('abort', onParentAbort);
        if (error.name === 'AbortError' || error.message === 'NS_BINDING_ABORTED') {
            console.error('Request timed out or was aborted');
        } else {
            console.error('Error during DNS resolution:', error);
        }
        return null;
    } finally {
        parentSignal?.removeEventListener('abort', onParentAbort);
    }
}

function buildDNSQuery(hostname) {
    const normalizedHost = (() => {
        const trimmed = hostname.trim().replace(/\.$/, '');
        try { return new URL(`http://${trimmed}`).hostname; }
        catch { return trimmed; }
    })();

    const labels = normalizedHost.split('.').filter(Boolean);
    if (labels.length === 0) throw new Error('Invalid hostname for DNS query');

    const header = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(header.subarray(0, 2));
    } else {
        const txid = Math.floor(Math.random() * 0xffff);
        header[0] = (txid >> 8) & 0xff;
        header[1] = txid & 0xff;
    }
    header[2] = 0x01;
    header[5] = 0x01;

    const qnameParts = [];
    labels.forEach(label => {
        const bytes = Array.from(label).map(char => {
            const code = char.charCodeAt(0);
            if (code > 0x7f) throw new Error('Hostname must be ASCII/punycode encoded');
            return code;
        });
        if (bytes.length === 0 || bytes.length > 63) throw new Error('Invalid label length in hostname');
        qnameParts.push(bytes.length, ...bytes);
    });
    const qname = new Uint8Array(qnameParts.length + 1);
    qname.set(qnameParts);

    const typeAndClass = new Uint8Array([0x00, 0x01, 0x00, 0x01]);
    const query = new Uint8Array(header.length + qname.length + typeAndClass.length);
    let offset = 0;
    query.set(header, offset); offset += header.length;
    query.set(qname, offset); offset += qname.length;
    query.set(typeAndClass, offset);
    return query;
}

function encodeDnsQueryBase64Url(query) {
    const binary = Array.from(query, byte => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Results Display ─────────────────────────────────────────────────────────

function updateResult(server) {
    let row = document.querySelector(`tr[data-server="${server.name}"]`);
    let detailsRow;

    const fmt = (v) => typeof v === 'number' ? v.toFixed(2) : 'N/A';
    const badgeHTML = reliabilityBadge(server.reliability) + confidenceBadge(server);

    if (!row) {
        row = document.createElement('tr');
        row.setAttribute('data-server', server.name);
        row.className = 'border-b border-slate-100 dark:border-slate-800/50 perf-border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors row-enter';
        resultsBody.appendChild(row);

        detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row hidden';
        resultsBody.appendChild(detailsRow);

        row.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn')) return;
            detailsRow.classList.toggle('hidden');
            row.classList.toggle('row-expanded');
        });
    } else {
        detailsRow = row.nextElementSibling;
    }

    const ipsText = server.ips && server.ips.length ? server.ips.join(', ') : '';

    row.innerHTML = `
        <td class="py-3 px-4 text-left">
            <div class="flex items-center gap-2">
                <svg class="expand-chevron w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-medium text-slate-800 dark:text-slate-200">${server.name}</span>
                        ${badgeHTML}
                    </div>
                    ${ipsText ? `<div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabnum">${ipsText}</div>` : ''}
                </div>
            </div>
        </td>
        <td class="py-3 px-4 text-right tabnum text-slate-700 dark:text-slate-300">${fmt(server.speed.min)}</td>
        <td class="py-3 px-4 text-right tabnum font-medium text-slate-900 dark:text-slate-100">${fmt(server.speed.median)}</td>
        <td class="py-3 px-4 text-right tabnum text-slate-700 dark:text-slate-300">${fmt(server.speed.avg)}</td>
        <td class="py-3 px-4 text-right tabnum text-slate-700 dark:text-slate-300">${fmt(server.speed.max)}</td>
    `;

    const reliabilityMsg = server.reliability && server.reliability.message
        ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-2">${server.reliability.message}</p>` : '';
    const jitterMsg = typeof server.speed.jitter === 'number'
        ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Jitter (max−min across host medians): ${server.speed.jitter.toFixed(2)} ms · ${getSamplesPerHost()} runs per host, median shown</p>`
        : `<p class="text-xs text-slate-500 dark:text-slate-400 mb-3">${getSamplesPerHost()} runs per host, median shown · ${server.transport || ''}</p>`;

    const copyData = `${server.name}\nURL: ${server.url}\nIPs: ${ipsText}`;

    detailsRow.innerHTML = `
        <td colspan="5" class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/50">
            ${reliabilityMsg}
            ${jitterMsg}
            <div class="flex items-center gap-2 mb-3">
                <code class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate">${server.url}</code>
                <button class="copy-btn shrink-0 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        onclick="copyServerDetails(this, \`${copyData.replace(/`/g, '\\`')}\`)">
                    Copy details
                </button>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Per-hostname breakdown:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                ${(server.individualResults || []).map(r => {
                    const speedNum = typeof r.speed === 'number' ? r.speed : null;
                    const speedText = speedNum !== null ? speedNum.toFixed(2) + ' ms' : 'N/A';
                    const coldWarm = (typeof r.coldMs === 'number' || typeof r.warmMs === 'number')
                        ? ` <span class="text-[10px] text-slate-400">(cold ${typeof r.coldMs === 'number' ? r.coldMs.toFixed(0) : '-'}, warm ${typeof r.warmMs === 'number' ? r.warmMs.toFixed(0) : '-'})</span>`
                        : '';
                    return `<div class="flex justify-between py-0.5 gap-2"><span class="text-slate-600 dark:text-slate-400 truncate">${r.website}</span><span class="tabnum shrink-0 ${speedNum !== null ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}">${speedText}${coldWarm}</span></div>`;
                }).join('')}
            </div>
        </td>
    `;

    updateChartWithData(server);
}

function reliabilityBadge(reliability) {
    if (!reliability) return '';
    const cfg = {
        healthy: { label: 'Stable', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
        partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
        failed: { label: 'Failed', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
        'no-data': { label: 'No data', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' }
    };
    const c = cfg[reliability.status] || cfg['no-data'];
    const ratio = reliability.totalQueries ? ` ${reliability.successCount}/${reliability.totalQueries}` : '';
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.cls}" title="${(reliability.message || '').replace(/"/g, '&quot;')}">${c.label}${ratio}</span>`;
}

function confidenceBadge(server) {
    if (server.measurementConfidence === 'verified') {
        return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" title="DNS response validated via CORS">Verified</span>`;
    }
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400" title="Round-trip timing only; response body cannot be read (no-CORS)">Timing only</span>`;
}

function copyServerDetails(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('text-emerald-600', 'dark:text-emerald-400');
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('text-emerald-600', 'dark:text-emerald-400');
        }, 1500);
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// ─── Top Results (post-test ranking) ─────────────────────────────────────────

function showTopResults() {
    const verifiedOnly = userSettings.verifiedOnlyRanking;
    const ranked = dnsServers
        .filter(s => isEligibleForRanking(s, { verifiedOnly }))
        .sort((a, b) => a.speed.median - b.speed.median)
        .slice(0, 3);

    const timingOnlyRanked = dnsServers
        .filter(s => isEligibleForRanking(s, { verifiedOnly: false }) && s.measurementConfidence === 'timing-only')
        .filter(s => !ranked.includes(s))
        .sort((a, b) => a.speed.median - b.speed.median)
        .slice(0, 3);

    if (ranked.length === 0 && timingOnlyRanked.length === 0) return;

    rankingList.innerHTML = ranked.length ? ranked.map((server, i) => renderRankingItem(server, i)).join('') :
        '<li class="px-4 py-3 text-sm text-slate-500">No verified resolvers met the 80% success threshold. See timing-only results below.</li>';

    topResults.classList.remove('hidden');
    topResults.classList.add('fade-up');

    if (timingOnlyRanked.length) {
        timingOnlyList.innerHTML = timingOnlyRanked.map((server, i) => renderRankingItem(server, i, true)).join('');
        timingOnlySection?.classList.remove('hidden');
    } else {
        timingOnlySection?.classList.add('hidden');
    }

    const prevSnapshot = lastTestSnapshot;
    const winner = ranked[0];
    if (winner && winnerGuide) {
        const delta = formatDeltaVsLast(winner, prevSnapshot);
        winnerGuide.innerHTML = `
            <p class="font-medium text-slate-800 dark:text-slate-200 mb-2">Use ${winner.name}</p>
            <p class="mb-2 tabnum text-xs"><code class="bg-slate-100 dark:bg-slate-800 px-1 rounded">${winner.url}</code></p>
            ${winner.ips?.length ? `<p class="text-xs mb-2">IPs: <span class="tabnum">${winner.ips.join(', ')}</span></p>` : ''}
            <p class="text-xs mb-2">${winner.transport || ''} · ${getSamplesPerHost()} runs/host${userSettings.rankByWarm ? ' · warm ranking' : ''}</p>
            ${delta ? `<p class="text-xs text-emerald-700 dark:text-emerald-400 mb-2">${delta}</p>` : ''}
            <p class="text-xs">Configure DoH:
              <a class="underline" href="${SETUP_LINKS.windows}" target="_blank" rel="noopener">Windows</a> ·
              <a class="underline" href="${SETUP_LINKS.macos}" target="_blank" rel="noopener">macOS</a> ·
              <a class="underline" href="${SETUP_LINKS.android}" target="_blank" rel="noopener">Android</a>
            </p>`;
        winnerGuide.classList.remove('hidden');
    }

    saveLastResults({
        at: new Date().toISOString(),
        mode: userSettings.testMode,
        top: ranked.map(s => ({ name: s.name, median: s.speed.median, url: s.url }))
    });

    colorTableRows();
    applyDefaultMedianSort();
}

function renderRankingItem(server, i, timingOnly = false) {
    const medal = ['text-amber-500', 'text-slate-400', 'text-amber-700'][i] || 'text-slate-400';
    return `<li class="flex items-center gap-4 px-4 py-3">
        <span class="text-lg font-bold tabnum ${medal} w-6 text-right">${i + 1}</span>
        <div class="flex-1 min-w-0">
            <span class="font-medium text-slate-800 dark:text-slate-200">${server.name}</span>
            ${timingOnly ? '<span class="text-[10px] text-amber-600 ml-1">timing only</span>' : ''}
            ${server.ips?.length ? `<span class="text-xs text-slate-400 ml-2 tabnum">${server.ips[0]}</span>` : ''}
        </div>
        <div class="text-right shrink-0">
            <span class="font-semibold tabnum">${server.speed.median.toFixed(1)}</span><span class="text-xs text-slate-400 ml-0.5">ms</span>
        </div>
    </li>`;
}

function formatDeltaVsLast(winner, prevSnapshot) {
    if (!prevSnapshot?.top?.[0]) return null;
    if (prevSnapshot.top[0].name !== winner.name) {
        return `Previous #1: ${prevSnapshot.top[0].name} (${prevSnapshot.top[0].median.toFixed(1)} ms).`;
    }
    const diff = winner.speed.median - prevSnapshot.top[0].median;
    if (Math.abs(diff) < 0.5) return 'About the same as your last test.';
    return diff < 0 ? `${Math.abs(diff).toFixed(1)} ms faster than last run.` : `${diff.toFixed(1)} ms slower than last run.`;
}

function buildResultsExport() {
    return {
        exportedAt: new Date().toISOString(),
        testMode: userSettings.testMode,
        hosts: [...topWebsites],
        servers: dnsServers.map(s => ({
            name: s.name, url: s.url, ips: s.ips, transport: s.transport,
            confidence: s.measurementConfidence, speed: s.speed,
            reliability: s.reliability, hosts: s.individualResults
        }))
    };
}

function exportResultsJson() {
    const blob = new Blob([JSON.stringify(buildResultsExport(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doh-speedtest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Results exported', 'success');
}

function shareResults() {
    const top = dnsServers.filter(s => isEligibleForRanking(s, { verifiedOnly: userSettings.verifiedOnlyRanking }))
        .sort((a, b) => a.speed.median - b.speed.median)[0];
    const text = top ? `Fastest DoH: ${top.name} (${top.speed.median.toFixed(1)} ms median) — dnsspeedtest.online` : 'DoH speed test — dnsspeedtest.online';
    if (navigator.share) {
        navigator.share({ title: 'DNS Speed Test', text, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(`${text}\n${window.location.href}`).then(() => showToast('Copied', 'success'));
    }
}

function applyDefaultMedianSort() {
    sortState.column = 2;
    sortState.direction = 'asc';
    document.querySelectorAll('th[data-sortable] .sort-arrow').forEach(arrow => {
        arrow.innerHTML = '&#8597;';
        arrow.classList.remove('text-emerald-600', 'dark:text-emerald-400');
        arrow.classList.add('text-slate-400');
    });
    const medianTh = document.querySelector('th[data-sortable][data-col="2"]');
    if (medianTh) {
        const activeArrow = medianTh.querySelector('.sort-arrow');
        activeArrow.innerHTML = '&#8593;';
        activeArrow.classList.remove('text-slate-400');
        activeArrow.classList.add('text-emerald-600', 'dark:text-emerald-400');
    }
    sortTable(2, 'asc');
}

function colorTableRows() {
    const servers = dnsServers.filter(s => s.speed && typeof s.speed.median === 'number');
    if (servers.length === 0) return;

    const medians = servers.map(s => s.speed.median);
    const minMedian = Math.min(...medians);
    const maxMedian = Math.max(...medians);
    const range = maxMedian - minMedian || 1;

    servers.forEach(server => {
        const row = document.querySelector(`tr[data-server="${server.name}"]`);
        if (!row) return;
        const norm = (server.speed.median - minMedian) / range;
        if (norm <= 0.33) row.style.borderLeftColor = '#22c55e';
        else if (norm <= 0.66) row.style.borderLeftColor = '#eab308';
        else row.style.borderLeftColor = '#ef4444';

        if (server.reliability && server.reliability.status === 'failed') {
            row.style.borderLeftColor = '#94a3b8';
        }
    });
}

// ─── Table Sorting ───────────────────────────────────────────────────────────

function sortTable(columnIndex, direction) {
    const rows = Array.from(resultsBody.querySelectorAll('tr'));
    const rowPairs = [];

    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].classList.contains('details-row')) {
            const detail = (i + 1 < rows.length && rows[i + 1].classList.contains('details-row')) ? rows[i + 1] : null;
            rowPairs.push([rows[i], detail]);
        }
    }

    rowPairs.sort((a, b) => {
        const cellA = a[0].querySelectorAll('td')[columnIndex];
        const cellB = b[0].querySelectorAll('td')[columnIndex];
        if (!cellA || !cellB) return 0;

        let valA = cellA.textContent.trim();
        let valB = cellB.textContent.trim();
        valA = valA === 'N/A' ? Infinity : parseFloat(valA) || 0;
        valB = valB === 'N/A' ? Infinity : parseFloat(valB) || 0;

        return direction === 'asc' ? valA - valB : valB - valA;
    });

    for (const pair of rowPairs) {
        resultsBody.appendChild(pair[0]);
        if (pair[1]) resultsBody.appendChild(pair[1]);
    }
}

// ─── Chart ───────────────────────────────────────────────────────────────────

function updateChartWithData(server) {
    const hasData = server.reliability ? server.reliability.successCount > 0 : server.speed.median !== 'Unavailable';
    const info = {
        name: server.name,
        median: hasData && typeof server.speed.median === 'number' ? server.speed.median : null,
        min: hasData && typeof server.speed.min === 'number' ? server.speed.min : null,
        max: hasData && typeof server.speed.max === 'number' ? server.speed.max : null
    };

    const idx = chartData.findIndex(item => item.name === server.name);
    if (idx === -1) chartData.push(info);
    else chartData[idx] = info;

    updateChart();
}

function updateChart() {
    const canvas = $('dnsChart');
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    const validData = chartData.filter(d => d.median !== null).sort((a, b) => a.median - b.median);
    if (validData.length === 0) return;

    // Dynamic height
    const height = Math.max(300, Math.min(800, validData.length * 32 + 80));
    canvas.parentElement.style.height = `${height}px`;

    chartSection.classList.remove('hidden');

    if (dnsChart) dnsChart.destroy();

    const minVal = Math.min(...validData.map(d => d.median));
    const scaleMin = Math.max(0, minVal * 0.7);

    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.1)';

    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(d => d.name),
            datasets: [{
                label: 'Median Response Time (ms)',
                data: validData.map(d => d.median),
                backgroundColor: validData.map(d => getBarColor(d.median, validData)),
                borderColor: validData.map(d => getBarColor(d.median, validData, true)),
                borderWidth: 1,
                borderRadius: 3
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'y' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 6,
                    callbacks: {
                        label: function (context) {
                            const s = validData[context.dataIndex];
                            return [
                                `Median: ${s.median.toFixed(2)} ms`,
                                `Min: ${s.min?.toFixed(2) || 'N/A'} ms`,
                                `Max: ${s.max?.toFixed(2) || 'N/A'} ms`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: scaleMin,
                    title: { display: true, text: 'Response Time (ms)', color: textColor, font: { size: 11 } },
                    ticks: { callback: v => v.toFixed(0) + 'ms', color: textColor, font: { size: 10 } },
                    grid: { color: gridColor }
                },
                y: {
                    title: { display: false },
                    ticks: { color: textColor, font: { size: 11 }, maxRotation: 0 },
                    grid: { display: false },
                    categoryPercentage: 0.82,
                    barPercentage: 0.65
                }
            },
            layout: { padding: { left: 8, right: 16, top: 8, bottom: 8 } }
        }
    });
}

function getBarColor(responseTime, allData, border = false) {
    if (!allData || allData.length === 0) return border ? '#22c55e' : '#22c55e80';

    const times = allData.map(d => d.median).filter(t => t !== null);
    const min = Math.min(...times);
    const max = Math.max(...times);
    if (min === max) return border ? '#22c55e' : '#22c55e80';

    const norm = (responseTime - min) / (max - min);
    let r, g;
    if (norm <= 0.5) {
        r = Math.round(255 * (norm * 2));
        g = 255;
    } else {
        r = 255;
        g = Math.round(255 * (2 - norm * 2));
    }
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
    return border ? hex : hex + '80';
}

// ─── Server Capability Check ─────────────────────────────────────────────────

async function checkServerCapabilities(name, url) {
    showToast('Checking server capabilities...', 'info');

    const testHostname = 'example.com';
    const dnsQuery = buildDNSQuery(testHostname);
    const usesJsonApi = (() => {
        try { return new URL(url).pathname.includes('/resolve'); }
        catch { return false; }
    })();

    const wireGetUrl = (() => {
        const u = new URL(url);
        u.searchParams.set('dns', encodeDnsQueryBase64Url(dnsQuery));
        return u;
    })();

    const jsonGetUrl = (() => {
        const u = new URL(url);
        u.searchParams.set('name', testHostname);
        u.searchParams.set('type', 'A');
        u.searchParams.set('nocache', Date.now());
        return u;
    })();

    const withTimeout = async (input, options = {}) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try { return await fetch(input, { ...options, signal: controller.signal }); }
        catch (error) { console.error('Capability test error', { input, options, error }); return null; }
        finally { clearTimeout(timer); }
    };

    const testGet = async (mode) => {
        const urlToUse = usesJsonApi ? jsonGetUrl : wireGetUrl;
        const headers = usesJsonApi ? { 'Accept': 'application/dns-json' } : { 'Accept': 'application/dns-message' };
        const response = await withTimeout(urlToUse, { method: 'GET', mode, headers });
        if (!response) return { success: false, cors: false };
        if (mode === 'cors') return { success: response.ok, cors: response.type === 'cors' };
        return { success: true, cors: false };
    };

    const testPostCors = async () => {
        if (usesJsonApi) return { success: false, cors: false };
        const response = await withTimeout(url, {
            method: 'POST', mode: 'cors',
            headers: { 'Content-Type': 'application/dns-message', 'Accept': 'application/dns-message' },
            body: dnsQuery
        });
        if (!response) return { success: false, cors: false };
        return { success: response.ok, cors: response.type === 'cors' };
    };

    const [getCors, postCors, getNoCors] = await Promise.all([
        testGet('cors'), testPostCors(), testGet('no-cors')
    ]);

    let chosenType = null;
    let allowCors = false;

    if (getCors.success) { chosenType = 'get'; allowCors = true; }
    else if (postCors.success) { chosenType = 'post'; allowCors = true; }
    else if (getNoCors.success) { chosenType = 'get'; allowCors = false; }

    if (chosenType) {
        const entry = { name, url, type: chosenType, allowCors, ips: [] };
        ensureServerMetadata(entry);
        customDnsServers.push(entry);
        saveCustomServers();
        rebuildDnsServerList();
        renderDoHList();
        showToast(`${name} added (${chosenType.toUpperCase()}, ${allowCors ? 'CORS' : 'no-CORS'})`, 'success');
    } else {
        showToast('Server unreachable. Neither GET nor POST succeeded.', 'error');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
