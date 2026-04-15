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

// ─── Configuration ───────────────────────────────────────────────────────────

const topWebsites = [
    'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com',
    'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com',
    'tiktok.com', 'pinterest.com'
];

const TIMEOUT_PENALTY_MS = 5000;

const dnsServers = [
    { name: "AdGuard", url: "https://dns.adguard-dns.com/dns-query", ips: ["94.140.14.14", "94.140.15.15"] },
    { name: "AliDNS", url: "https://dns.alidns.com/dns-query", ips: ["223.5.5.5", "223.6.6.6"] },
    { name: "OpenDNS", url: "https://doh.opendns.com/dns-query", ips: ["208.67.222.222", "208.67.220.220"] },
    { name: "CleanBrowsing", url: "https://doh.cleanbrowsing.org/doh/family-filter/", ips: ["185.228.168.9", "185.228.169.9"] },
    { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query", type: "get", allowCors: true, ips: ["1.1.1.1", "1.0.0.1"] },
    { name: "ControlD", url: "https://freedns.controld.com/p0", ips: ["76.76.2.0", "76.223.122.150"] },
    { name: "DNS.SB", url: "https://doh.dns.sb/dns-query", type: "get", allowCors: true, ips: ["185.222.222.222", "45.11.45.11"] },
    { name: "DNSPod", url: "https://dns.pub/dns-query", type: "post", allowCors: false, ips: ["119.29.29.29", "182.254.116.116"] },
    { name: "Google", url: "https://dns.google/resolve", type: "get", allowCors: true, ips: ["8.8.8.8", "8.8.4.4"] },
    { name: "Mullvad", url: "https://dns.mullvad.net/dns-query", ips: ["194.242.2.2", "194.242.2.2"], type: "get", allowCors: false },
    { name: "Mullvad Base", url: "https://base.dns.mullvad.net/dns-query", ips: ["194.242.2.4", "194.242.2.4"], type: "get", allowCors: false },
    { name: "NextDNS", url: "https://dns.nextdns.io", type: "get", ips: ["45.90.28.0", "45.90.30.0"] },
    { name: "OpenBLD", url: "https://ada.openbld.net/dns-query", ips: ["146.112.41.2", "146.112.41.102"], allowCors: false },
    { name: "DNS4EU", url: "https://unfiltered.joindns4.eu/dns-query", ips: ["86.54.11.100", "86.54.11.200"], type: "post", allowCors: false },
    { name: "Quad9", url: "https://dns.quad9.net/dns-query", ips: ["9.9.9.9", "149.112.112.112"] },
    { name: "360", url: "https://doh.360.cn/dns-query", ips: ["101.226.4.6", "180.163.224.54"] },
    { name: "Canadian Shield", url: "https://private.canadianshield.cira.ca/dns-query", ips: ["149.112.121.10", "149.112.122.10"] },
    { name: "Digitale Gesellschaft", url: "https://dns.digitale-gesellschaft.ch/dns-query", ips: ["185.95.218.42", "185.95.218.43"] },
    { name: "DNS for Family", url: "https://dns-doh.dnsforfamily.com/dns-query", ips: ["94.130.180.225", "78.47.64.161"] },
    { name: "Restena", url: "https://dnspub.restena.lu/dns-query", ips: ["158.64.1.29"] },
    { name: "IIJ", url: "https://public.dns.iij.jp/dns-query", ips: ["203.180.164.45", "203.180.166.45"] },
    { name: "LibreDNS", url: "https://doh.libredns.gr/dns-query", ips: ["116.202.176.26", "147.135.76.183"] },
    { name: "Switch", url: "https://dns.switch.ch/dns-query", ips: ["130.59.31.248", "130.59.31.251"] },
    { name: "Foundation for Applied Privacy", url: "https://doh.applied-privacy.net/query", ips: ["146.255.56.98"] },
    { name: "UncensoredDNS", url: "https://anycast.uncensoreddns.org/dns-query", ips: ["91.239.100.100", "89.233.43.71"] },
    { name: "RethinkDNS", url: "https://sky.rethinkdns.com/dns-query", ips: ["104.21.83.62", "172.67.214.246"], allowCors: false },
    { name: "FlashStart (registration required)", url: "https://doh.flashstart.com/f17c9ee5", type: "post", allowCors: false, ips: ["185.236.104.104"] },
    { name: "Comcast Xfinity", url: "https://doh.xfinity.com/dns-query", type: "get", allowCors: false, ips: ["75.75.75.75", "75.75.76.76"] }
];

// ─── State ───────────────────────────────────────────────────────────────────

let dnsChart = null;
let chartData = [];
let sortState = { column: -1, direction: 'asc' };
let testRunning = false;

// ─── DOM References ──────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const checkButton = $('checkButton');
const btnIcon = $('btnIcon');
const btnText = $('btnText');
const progressContainer = $('progressContainer');
const progressFill = $('progressFill');
const progressPhase = $('progressPhase');
const progressCount = $('progressCount');
const topResults = $('topResults');
const rankingList = $('rankingList');
const chartSection = $('chartSection');
const tableSection = $('tableSection');
const resultsBody = $('resultsBody');

// ─── Theme ───────────────────────────────────────────────────────────────────

(function initTheme() {
    const stored = localStorage.getItem('dns-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

$('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('dns-theme', html.classList.contains('dark') ? 'dark' : 'light');
    if (dnsChart) {
        updateChart();
    }
});

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

// ─── Share ────────────────────────────────────────────────────────────────────

$('shareBtn').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'DNS Speed Test',
            text: 'Find the fastest DNS server for your location',
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Link copied to clipboard', 'success');
        }).catch(() => {});
    }
});

// ─── Settings Drawer ─────────────────────────────────────────────────────────

const drawer = $('settingsDrawer');
const overlay = $('drawerOverlay');

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

$('settingsBtn').addEventListener('click', openDrawer);
$('closeDrawer').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeDrawer();
});

// Drawer tabs
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
        $(target === 'hosts' ? 'hostsPanel' : 'dohPanel').classList.remove('hidden');
    });
});

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

$('addHostname').addEventListener('click', () => {
    const input = $('newWebsite');
    const host = validateAndExtractHost(input.value.trim());
    if (!host) {
        showToast('Enter a valid hostname or URL', 'error');
    } else if (topWebsites.includes(host)) {
        showToast('Already in the list', 'error');
    } else {
        topWebsites.push(host);
        renderHostsList();
        showToast(`Added ${host}`, 'success');
    }
    input.value = '';
});

$('newWebsite').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('addHostname').click();
});

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
            dnsServers.splice(index, 1);
            renderDoHList();
        });

        li.append(info, btn);
        list.appendChild(li);
    });
}

$('addDoH').addEventListener('click', () => {
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

$('newDoHUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('addDoH').click();
});

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
        // btnText updated per-server in performDNSTests
    } else if (state === 'done') {
        btnIcon.innerHTML = playSVG;
        btnText.textContent = 'Run Again';
        checkButton.disabled = false;
    } else {
        btnIcon.innerHTML = playSVG;
        btnText.textContent = 'Run Speed Test';
        checkButton.disabled = false;
    }
}

checkButton.addEventListener('click', async function () {
    if (testRunning) return;
    testRunning = true;

    // Reset state
    chartData = [];
    chartSection.classList.add('hidden');
    topResults.classList.add('hidden');
    resultsBody.innerHTML = '';
    tableSection.classList.remove('hidden');

    // Show progress
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressPhase.textContent = 'Warming up connections...';
    progressCount.textContent = '';

    setButtonState('warmup');

    await warmUpDNSServers();

    setButtonState('testing');
    progressPhase.textContent = 'Testing DNS servers...';

    await performDNSTests();

    // Hide progress, show final state
    progressContainer.classList.add('hidden');
    setButtonState('done');
    testRunning = false;

    // Show top results
    showTopResults();
});

async function warmUpDNSServers() {
    const warmUpPromises = dnsServers.map(server =>
        Promise.all(topWebsites.map(website =>
            measureDNSSpeed(server.url, website, server.type, server.allowCors)
        ))
    );
    await Promise.all(warmUpPromises);
}

async function performDNSTests() {
    const totalServers = dnsServers.length;
    const totalQueries = topWebsites.length;

    for (let i = 0; i < dnsServers.length; i++) {
        const server = dnsServers[i];

        // Update progress
        btnText.textContent = `Testing ${i + 1}/${totalServers}...`;
        progressCount.textContent = `${i + 1} of ${totalServers}`;
        progressFill.style.width = `${((i + 1) / totalServers) * 100}%`;

        const speedResults = await Promise.all(
            topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors))
        );

        server.individualResults = topWebsites.map((website, idx) => ({
            website,
            speed: speedResults[idx] !== null ? speedResults[idx] : 'Unavailable'
        }));

        if (totalQueries === 0) {
            server.speed = { min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable' };
            server.reliability = { status: 'no-data', successCount: 0, failureCount: 0, totalQueries: 0, message: 'No hostnames configured for testing.' };
        } else {
            const penalizedResults = speedResults.map(s => typeof s === 'number' ? s : TIMEOUT_PENALTY_MS);
            server.speed = calculateSpeedStats(penalizedResults);
            server.reliability = buildReliabilityProfile(speedResults, totalQueries);
        }

        updateResult(server);
    }
}

function calculateSpeedStats(results) {
    if (!results.length) {
        return { min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable' };
    }
    const sorted = [...results].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avg = sum / sorted.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    return { min: sorted[0], median, max: sorted[sorted.length - 1], avg };
}

function buildReliabilityProfile(speedResults, totalQueries) {
    if (totalQueries === 0) {
        return { status: 'no-data', successCount: 0, failureCount: 0, totalQueries: 0, message: 'No hostnames configured for testing.' };
    }
    const successCount = speedResults.filter(s => typeof s === 'number').length;
    const failureCount = totalQueries - successCount;

    let status, message;
    if (successCount === 0) {
        status = 'failed';
        message = `All queries failed. Each timeout counts as ${TIMEOUT_PENALTY_MS}ms penalty.`;
    } else if (failureCount > 0) {
        status = 'partial';
        message = `${failureCount} of ${totalQueries} queries timed out. Failed runs scored as ${TIMEOUT_PENALTY_MS}ms.`;
    } else {
        status = 'healthy';
        message = 'All queries succeeded.';
    }
    return { status, successCount, failureCount, totalQueries, message };
}

// ─── DNS Query Logic (preserved exactly) ─────────────────────────────────────

async function measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const dnsQuery = buildDNSQuery(hostname);
        const startTime = performance.now();
        let response;

        if (serverType === 'get') {
            const urlWithParam = new URL(dohUrl);
            const usesJsonApi = urlWithParam.pathname.includes('/resolve');
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
        return performance.now() - startTime;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.message === 'NS_BINDING_ABORTED') {
            console.error('Request timed out or was aborted');
        } else {
            console.error('Error during DNS resolution:', error);
        }
        return null;
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
    const badgeHTML = reliabilityBadge(server.reliability);

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
        <td class="py-3 px-4 text-right tabnum text-slate-700 dark:text-slate-300">${fmt(server.speed.median)}</td>
        <td class="py-3 px-4 text-right tabnum font-medium text-slate-900 dark:text-slate-100">${fmt(server.speed.avg)}</td>
        <td class="py-3 px-4 text-right tabnum text-slate-700 dark:text-slate-300">${fmt(server.speed.max)}</td>
    `;

    const reliabilityMsg = server.reliability && server.reliability.message
        ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-3">${server.reliability.message}</p>` : '';

    const copyData = `${server.name}\nURL: ${server.url}\nIPs: ${ipsText}`;

    detailsRow.innerHTML = `
        <td colspan="5" class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/50">
            ${reliabilityMsg}
            <div class="flex items-center gap-2 mb-3">
                <code class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate">${server.url}</code>
                <button class="copy-btn shrink-0 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        onclick="copyServerDetails(this, \`${copyData.replace(/`/g, '\\`')}\`)">
                    Copy details
                </button>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Per-hostname breakdown:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                ${(server.individualResults || []).map(r =>
                    `<div class="flex justify-between py-0.5">
                        <span class="text-slate-600 dark:text-slate-400">${r.website}</span>
                        <span class="tabnum ${typeof r.speed === 'number' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}">${typeof r.speed === 'number' ? r.speed.toFixed(2) + ' ms' : 'N/A'}</span>
                    </div>`
                ).join('')}
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
    const ranked = dnsServers
        .filter(s => s.speed && typeof s.speed.avg === 'number' && s.reliability && s.reliability.successCount > 0)
        .sort((a, b) => a.speed.avg - b.speed.avg)
        .slice(0, 3);

    if (ranked.length === 0) return;

    rankingList.innerHTML = ranked.map((server, i) => {
        const medal = ['text-amber-500', 'text-slate-400', 'text-amber-700'][i] || 'text-slate-400';
        return `
            <li class="flex items-center gap-4 px-4 py-3">
                <span class="text-lg font-bold tabnum ${medal} w-6 text-right">${i + 1}</span>
                <div class="flex-1 min-w-0">
                    <span class="font-medium text-slate-800 dark:text-slate-200">${server.name}</span>
                    ${server.ips && server.ips.length ? `<span class="text-xs text-slate-400 ml-2 tabnum">${server.ips[0]}</span>` : ''}
                </div>
                <div class="text-right shrink-0">
                    <span class="font-semibold tabnum text-slate-900 dark:text-slate-100">${server.speed.avg.toFixed(1)}</span>
                    <span class="text-xs text-slate-400 ml-0.5">ms</span>
                </div>
            </li>
        `;
    }).join('');

    topResults.classList.remove('hidden');
    topResults.classList.add('fade-up');

    // Color table rows by performance
    colorTableRows();
}

function colorTableRows() {
    const servers = dnsServers.filter(s => s.speed && typeof s.speed.avg === 'number');
    if (servers.length === 0) return;

    const avgs = servers.map(s => s.speed.avg);
    const minAvg = Math.min(...avgs);
    const maxAvg = Math.max(...avgs);
    const range = maxAvg - minAvg || 1;

    servers.forEach(server => {
        const row = document.querySelector(`tr[data-server="${server.name}"]`);
        if (!row) return;
        const norm = (server.speed.avg - minAvg) / range;
        if (norm <= 0.33) row.style.borderLeftColor = '#22c55e';
        else if (norm <= 0.66) row.style.borderLeftColor = '#eab308';
        else row.style.borderLeftColor = '#ef4444';

        if (server.reliability && server.reliability.status === 'failed') {
            row.style.borderLeftColor = '#94a3b8';
        }
    });
}

// ─── Table Sorting ───────────────────────────────────────────────────────────

document.querySelectorAll('th[data-sortable]').forEach(th => {
    th.addEventListener('click', () => {
        const col = parseInt(th.dataset.col);
        if (sortState.column === col) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.column = col;
            sortState.direction = 'asc';
        }

        // Update arrows
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
    const hasData = server.reliability ? server.reliability.successCount > 0 : server.speed.avg !== 'Unavailable';
    const info = {
        name: server.name,
        avg: hasData && typeof server.speed.avg === 'number' ? server.speed.avg : null,
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

    const validData = chartData.filter(d => d.avg !== null).sort((a, b) => a.avg - b.avg);
    if (validData.length === 0) return;

    // Dynamic height
    const height = Math.max(300, Math.min(800, validData.length * 32 + 80));
    canvas.parentElement.style.height = `${height}px`;

    chartSection.classList.remove('hidden');

    if (dnsChart) dnsChart.destroy();

    const minVal = Math.min(...validData.map(d => d.avg));
    const scaleMin = Math.max(0, minVal * 0.7);

    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.1)';

    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(d => d.name),
            datasets: [{
                label: 'Avg Response Time (ms)',
                data: validData.map(d => d.avg),
                backgroundColor: validData.map(d => getBarColor(d.avg, validData)),
                borderColor: validData.map(d => getBarColor(d.avg, validData, true)),
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
                                `Avg: ${s.avg.toFixed(2)} ms`,
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

    const times = allData.map(d => d.avg).filter(t => t !== null);
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
        dnsServers.push({ name, url, type: chosenType, allowCors, ips: [] });
        renderDoHList();
        showToast(`${name} added (${chosenType.toUpperCase()}, ${allowCors ? 'CORS' : 'no-CORS'})`, 'success');
    } else {
        showToast('Server unreachable. Neither GET nor POST succeeded.', 'error');
    }
}

// ─── Resize Handler ──────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    if (dnsChart) dnsChart.resize();
});
