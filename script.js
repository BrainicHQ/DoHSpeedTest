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
const checkButton = document.getElementById('checkButton');
const editButton = document.getElementById('editButton');
const hostFeedback = document.getElementById('websiteFeedback');
const hostCountBadge = document.getElementById('hostCountBadge');
const resetHostnamesButton = document.getElementById('resetHostnames');
const dohFeedback = document.getElementById('dohFeedback');
const dohCountBadge = document.getElementById('dohCountBadge');
const resetDoHButton = document.getElementById('resetDoHButton');
const newDoHNameInput = document.getElementById('newDoHName');
const newDoHUrlInput = document.getElementById('newDoHUrl');
const newDoHIpsInput = document.getElementById('newDoHIps');
const DEFAULT_TOP_WEBSITES = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'];
const STORAGE_KEYS = {
    hostnames: 'dohSpeedTest.hostnames',
    servers: 'dohSpeedTest.dnsServers'
};
let topWebsites = loadStoredHostnames();
// Penalize failed/timeout requests so they don't skew averages in favor of unstable servers
const TIMEOUT_PENALTY_MS = 5000;
// Global variable to store chart instance
const DEFAULT_DNS_SERVERS = [{
    name: "AdGuard", url: "https://dns.adguard-dns.com/dns-query", ips: ["94.140.14.14", "94.140.15.15"]
}, {
    name: "AliDNS", url: "https://dns.alidns.com/dns-query", ips: ["223.5.5.5", "223.6.6.6"]
}, {
    name: "OpenDNS", url: "https://doh.opendns.com/dns-query", ips: ["208.67.222.222", "208.67.220.220"]
}, {
    name: "CleanBrowsing",
    url: "https://doh.cleanbrowsing.org/doh/family-filter/",
    ips: ["185.228.168.9", "185.228.169.9"]
}, {
    name: "Cloudflare",
    url: "https://cloudflare-dns.com/dns-query",
    type: "get",
    allowCors: true,
    ips: ["1.1.1.1", "1.0.0.1"]
}, {
    name: "ControlD", url: "https://freedns.controld.com/p0", ips: ["76.76.2.0", "76.223.122.150"]
}, {
    name: "DNS.SB",
    url: "https://doh.dns.sb/dns-query",
    type: "get",
    allowCors: true,
    ips: ["185.222.222.222", "45.11.45.11"]
}, {
    name: "DNSPod",
    url: "https://dns.pub/dns-query",
    type: "post",
    allowCors: false,
    ips: ["119.29.29.29", "182.254.116.116"]
}, {
    name: "Google", url: "https://dns.google/resolve", type: "get", allowCors: true, ips: ["8.8.8.8", "8.8.4.4"]
}, {
    name: "Mullvad", url: "https://dns.mullvad.net/dns-query", ips: ["194.242.2.2", "194.242.2.2"], type: "get", allowCors: false
}, {
    name: "Mullvad Base", url: "https://base.dns.mullvad.net/dns-query", ips: ["194.242.2.4", "194.242.2.4"], type: "get", allowCors: false
}, {
    name: "NextDNS", url: "https://dns.nextdns.io", type: "get", ips: ["45.90.28.0", "45.90.30.0"]
}, {
    name: "OpenBLD", url: "https://ada.openbld.net/dns-query", ips: ["146.112.41.2", "146.112.41.102"], allowCors: false
}, {
    name: "DNS4EU", url: "https://unfiltered.joindns4.eu/dns-query", ips: ["86.54.11.100", "86.54.11.200"],
    type: "post",
    allowCors: false,
}, {
    name: "Quad9", url: "https://dns.quad9.net/dns-query", ips: ["9.9.9.9", "149.112.112.112"]
}, {
    name: "360", url: "https://doh.360.cn/dns-query", ips: ["101.226.4.6", "180.163.224.54"]
}, {
    name: "Canadian Shield",
    url: "https://private.canadianshield.cira.ca/dns-query",
    ips: ["149.112.121.10", "149.112.122.10"]
}, {
    name: "Digitale Gesellschaft",
    url: "https://dns.digitale-gesellschaft.ch/dns-query",
    ips: ["185.95.218.42", "185.95.218.43"]
}, {
    name: "DNS for Family", url: "https://dns-doh.dnsforfamily.com/dns-query", ips: ["94.130.180.225", "78.47.64.161"]
}, {
    name: "Restena", url: "https://dnspub.restena.lu/dns-query", ips: ["158.64.1.29"]
}, {
    name: "IIJ", url: "https://public.dns.iij.jp/dns-query", ips: ["203.180.164.45", "203.180.166.45"]
}, {
    name: "LibreDNS", url: "https://doh.libredns.gr/dns-query", ips: ["116.202.176.26", "147.135.76.183"]
}, {
    name: "Switch", url: "https://dns.switch.ch/dns-query", ips: ["130.59.31.248", "130.59.31.251"]
}, {
    name: "Foundation for Applied Privacy", url: "https://doh.applied-privacy.net/query", ips: ["146.255.56.98"],
}, {
    name: "UncensoredDNS", url: "https://anycast.uncensoreddns.org/dns-query", ips: ["91.239.100.100", "89.233.43.71"]
}, {
    name: "RethinkDNS",
    url: "https://sky.rethinkdns.com/dns-query",
    ips: ["104.21.83.62", "172.67.214.246"],
    allowCors: false,
}, {
    name: "FlashStart (registration required)",
    url: "https://doh.flashstart.com/f17c9ee5",
    type: "post",
    allowCors: false,
    ips: ["185.236.104.104"]
}, {
        name: "Comcast Xfinity",
        url: "https://doh.xfinity.com/dns-query",
        type: "get",
        allowCors: false,
        ips: ["75.75.75.75", "75.75.76.76"]
    }
];

let dnsServers = loadStoredDnsServers();
const modalFeedbackElements = {
    hosts: hostFeedback,
    doh: dohFeedback
};
const MODAL_FEEDBACK_BASE = 'mt-2 text-sm';
const MODAL_FEEDBACK_STYLES = {
    info: 'text-slate-500 dark:text-slate-400',
    success: 'text-emerald-600 dark:text-emerald-300',
    error: 'text-red-600 dark:text-red-300'
};

function syncRunButtonState() {
    checkButton.disabled = topWebsites.length === 0 || dnsServers.length === 0;
}
syncRunButtonState();
updateHostStats();
updateDoHStats();
clearModalFeedback('hosts');
clearModalFeedback('doh');

function loadStoredHostnames() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.hostnames);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn('Unable to load stored hostnames, falling back to defaults.', error);
    }
    return [...DEFAULT_TOP_WEBSITES];
}

function loadStoredDnsServers() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.servers);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map(cloneServer);
            }
        }
    } catch (error) {
        console.warn('Unable to load stored DoH servers, falling back to defaults.', error);
    }
    return DEFAULT_DNS_SERVERS.map(cloneServer);
}

function persistHostnames() {
    try {
        localStorage.setItem(STORAGE_KEYS.hostnames, JSON.stringify(topWebsites));
    } catch (error) {
        console.warn('Unable to persist hostnames', error);
    }
}

function persistDnsServers() {
    try {
        localStorage.setItem(STORAGE_KEYS.servers, JSON.stringify(dnsServers));
    } catch (error) {
        console.warn('Unable to persist DoH servers', error);
    }
}

function cloneServer(server) {
    return {
        ...server,
        ips: Array.isArray(server.ips) ? [...server.ips] : []
    };
}

function showModalFeedback(target, type, message) {
    const element = modalFeedbackElements[target];
    if (!element) return;
    const feedbackType = MODAL_FEEDBACK_STYLES[type] || MODAL_FEEDBACK_STYLES.info;
    element.className = `${MODAL_FEEDBACK_BASE} ${feedbackType}`;
    element.textContent = message;
    element.classList.remove('hidden');
}

function clearModalFeedback(target) {
    const element = modalFeedbackElements[target];
    if (!element) return;
    element.textContent = '';
    element.className = `${MODAL_FEEDBACK_BASE} ${MODAL_FEEDBACK_STYLES.info} hidden`;
}

function updateHostStats() {
    if (hostCountBadge) {
        const count = topWebsites.length;
        const label = count === 1 ? 'hostname' : 'hostnames';
        hostCountBadge.textContent = `${count} ${label} configured`;
    }
}

function updateDoHStats() {
    if (dohCountBadge) {
        const count = dnsServers.length;
        const label = count === 1 ? 'DoH server' : 'DoH servers';
        dohCountBadge.textContent = `${count} ${label} configured`;
    }
}

function resetHostnamesToDefault() {
    topWebsites = [...DEFAULT_TOP_WEBSITES];
    persistHostnames();
    updateHostStats();
    showModalFeedback('hosts', 'success', 'Restored recommended hostnames.');
}

function resetDnsServersToDefault() {
    dnsServers = DEFAULT_DNS_SERVERS.map(cloneServer);
    persistDnsServers();
    updateDoHStats();
    syncRunButtonState();
    showModalFeedback('doh', 'success', 'Restored curated DoH server list.');
}

function parseIpList(rawValue) {
    if (!rawValue) return [];
    return rawValue
        .split(/[\n,;]/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

let dnsChart;

let chartData = [];

function updateChartWithData(server) {
    // Store server data for chart updates
    const existingIndex = chartData.findIndex(item => item.name === server.name);
    const hasReliableSamples = server.reliability ? server.reliability.successCount > 0 : server.speed.avg !== 'Unavailable';
    const serverInfo = {
        name: server.name,
        avg: hasReliableSamples && typeof server.speed.avg === 'number' ? server.speed.avg : null,
        min: hasReliableSamples && typeof server.speed.min === 'number' ? server.speed.min : null,
        max: hasReliableSamples && typeof server.speed.max === 'number' ? server.speed.max : null
    };

    if (existingIndex === -1) {
        chartData.push(serverInfo);
    } else {
        chartData[existingIndex] = serverInfo;
    }

    // Update chart when we have valid data
    updateChart();
}

function updateChart() {
    const chartContainer = document.getElementById('chartContainer');
    const canvas = document.getElementById('dnsChart');
    const ctx = canvas.getContext('2d');
    
    // Filter valid data and sort by average response time (ascending - fastest first)
    const validData = chartData.filter(item => item.avg !== null).sort((a, b) => a.avg - b.avg);
    
    if (validData.length === 0) return;

    // Calculate dynamic height based on number of servers (35px per server + padding)
    const minHeight = 300;
    const maxHeight = 800;
    const heightPerServer = 35;
    const dynamicHeight = Math.max(minHeight, Math.min(maxHeight, validData.length * heightPerServer + 100));
    
    // Update container height
    const container = chartContainer.querySelector('.chart-container') || chartContainer;
    container.style.height = `${dynamicHeight}px`;

    // Show chart container
    chartContainer.classList.remove('hidden');

    // Destroy existing chart if it exists
    if (dnsChart) {
        dnsChart.destroy();
    }

    // Calculate scale range to ensure all bars are visually meaningful
    const minValue = Math.min(...validData.map(item => item.avg));
    const maxValue = Math.max(...validData.map(item => item.avg));
    const range = maxValue - minValue;
    
    // Use a more aggressive approach: start from 70% of minimum value
    // This ensures the fastest server still gets at least 30% bar length
    const scaleMin = Math.max(0, minValue * 0.7);

    // Create horizontal bar chart
    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(item => item.name),
            datasets: [{
                label: 'Average Response Time (ms)',
                data: validData.map(item => item.avg),
                backgroundColor: validData.map(item => getPerformanceColor(item.avg, validData)),
                borderColor: validData.map(item => getPerformanceColor(item.avg, validData, true)),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false // Hide legend for cleaner look
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const server = validData[context.dataIndex];
                            return [
                                `Average: ${server.avg.toFixed(2)}ms`,
                                `Min: ${server.min?.toFixed(2) || 'N/A'}ms`,
                                `Max: ${server.max?.toFixed(2) || 'N/A'}ms`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: scaleMin,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0) + 'ms';
                        }
                    }
                },
                y: {
                    title: {
                        display: window.innerWidth >= 768,
                        text: 'DNS Servers (Slowest → Fastest)'
                    },
                    ticks: {
                        maxRotation: 0,
                        font: {
                            size: 11
                        }
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.6
                }
            },
            elements: {
                bar: {
                    borderWidth: 1
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 15,
                    bottom: 15
                }
            }
        }
    });
}

// Performance-based color coding (green = fast, red = slow)
function getPerformanceColor(responseTime, allData, border = false) {
    if (!allData || allData.length === 0) return border ? '#22c55e' : '#22c55e80';
    
    const validTimes = allData.map(d => d.avg).filter(t => t !== null);
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    
    // Avoid division by zero
    if (minTime === maxTime) return border ? '#22c55e' : '#22c55e80';
    
    // Normalize response time to 0-1 scale
    const normalized = (responseTime - minTime) / (maxTime - minTime);
    
    // Color interpolation from green (fast) to red (slow)
    let r, g, b;
    if (normalized <= 0.5) {
        // Green to yellow (0-0.5)
        r = Math.round(255 * (normalized * 2));
        g = 255;
        b = 0;
    } else {
        // Yellow to red (0.5-1)
        r = 255;
        g = Math.round(255 * (2 - normalized * 2));
        b = 0;
    }
    
    // Return hex color with or without alpha
    const alpha = border ? '' : '80';
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha}`;
}

// Legacy function kept for compatibility
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

async function warmUpDNSServers() {
    // Display the warm-up message
    // Use the same DNS server list and top websites for warm-up
    const warmUpPromises = dnsServers.map(server => Promise.all(topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors))));

    await Promise.all(warmUpPromises);
    console.log("Warm-up phase completed");
}

async function updateLoadingMessage(message) {
    document.getElementById('loadingMessage').innerHTML = `${message} <div class="spinner">
        <div class="dot dot-1"></div>
        <div class="dot dot-2"></div>
        <div class="dot dot-3"></div>
    </div>`;
}

checkButton.addEventListener('click', async function () {
    this.disabled = true;
    editButton.disabled = true; // Disable the Edit button
    document.getElementById('editDoHButton').disabled = true; // Disable the DoH Edit button
    document.getElementById('loadingMessage').classList.remove('hidden');
    
    // Clear previous chart data
    chartData = [];
    document.getElementById('chartContainer').classList.add('hidden');

    await updateLoadingMessage('Warming up DNS servers');
    await warmUpDNSServers();
    await updateLoadingMessage('Analyzing DNS servers');
    await performDNSTests();

    document.getElementById('loadingMessage').classList.add('hidden');
    this.disabled = false;
    editButton.disabled = false; // Re-enable the Edit button
    document.getElementById('editDoHButton').disabled = false; // Re-enable the DoH Edit button
});

async function performDNSTests() {

    const totalQueries = topWebsites.length;
    const totalServers = dnsServers.length;

    if (totalServers === 0) {
        await updateLoadingMessage('No DoH servers configured. Add at least one server to run the benchmark.');
        return;
    }

    for (let index = 0; index < totalServers; index++) {
        const server = dnsServers[index];
        await updateLoadingMessage(`Analyzing DNS servers (${index + 1}/${totalServers}): ${server.name}`);
        const speedResults = await Promise.all(topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors)));

        // Map each website to its speed result for the current server
        server.individualResults = topWebsites.map((website, index) => {
            const speed = speedResults[index];
            return {website, speed: speed !== null ? speed : 'Unavailable'};
        });

        if (totalQueries === 0) {
            server.speed = {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable'};
            server.reliability = {
                status: 'no-data',
                successCount: 0,
                failureCount: 0,
                totalQueries: 0,
                message: 'No hostnames configured for testing.'
            };
            updateResult(server);
            continue;
        }

        const penalizedResults = speedResults.map(speed => typeof speed === 'number' ? speed : TIMEOUT_PENALTY_MS);
        server.speed = calculateSpeedStats(penalizedResults);
        server.reliability = buildReliabilityProfile(speedResults, totalQueries);

        updateResult(server);
    }
}

function calculateSpeedStats(results) {
    if (!results.length) {
        return {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable'};
    }

    const sorted = [...results].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, value) => acc + value, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const middleIndex = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2 : sorted[middleIndex];

    return {min, median, max, avg};
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

    const successCount = speedResults.filter(speed => typeof speed === 'number').length;
    const failureCount = totalQueries - successCount;

    let status = 'healthy';
    if (successCount === 0) {
        status = 'failed';
    } else if (failureCount > 0) {
        status = 'partial';
    }

    let message;
    if (status === 'healthy') {
        message = 'All queries succeeded.';
    } else if (status === 'partial') {
        message = `${failureCount} of ${totalQueries} queries timed out or failed. Failed runs are scored as ${TIMEOUT_PENALTY_MS}ms penalties.`;
    } else if (status === 'failed') {
        message = `All queries failed. Each timeout counts as ${TIMEOUT_PENALTY_MS}ms to avoid skewed averages.`;
    } else {
        message = 'No hostnames configured for testing.';
    }

    return {status, successCount, failureCount, totalQueries, message};
}

async function measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
        const dnsQuery = buildDNSQuery(hostname);
        const startTime = performance.now();
        let response;

        if (serverType === 'get') {
            const urlWithParam = new URL(dohUrl);
            const usesJsonApi = urlWithParam.pathname.includes('/resolve');

            let fetchOptions = {method: 'GET', signal: controller.signal};

            if (usesJsonApi) {
                // JSON-style API (e.g., dns.google/resolve)
                urlWithParam.searchParams.set('name', hostname);
                urlWithParam.searchParams.set('type', 'A');
                urlWithParam.searchParams.set('nocache', Date.now());
                if (allowCors) {
                    fetchOptions.mode = 'cors';
                    fetchOptions.headers = {'Accept': 'application/dns-json'};
                } else {
                    fetchOptions.mode = 'no-cors';
                }
            } else {
                // RFC 8484 wire-format GET with base64url-encoded DNS message
                urlWithParam.searchParams.set('dns', encodeDnsQueryBase64Url(dnsQuery));
                fetchOptions.mode = allowCors ? 'cors' : 'no-cors';
                if (allowCors) {
                    fetchOptions.headers = {'Accept': 'application/dns-message'};
                }
            }

            response = await fetch(urlWithParam, fetchOptions);
        } else {
            if (allowCors) {
                const fetchOptions = {
                    method: 'POST',
                    body: dnsQuery,
                    mode: 'cors',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/dns-message',
                        'Accept': 'application/dns-message'
                    }
                };
                response = await fetch(dohUrl, fetchOptions);
            } else {
                // Non-CORS endpoints: use GET with `dns` param to avoid missing Content-Type rejections
                const urlWithParam = new URL(dohUrl);
                urlWithParam.searchParams.set('dns', encodeDnsQueryBase64Url(dnsQuery));
                const fetchOptions = {method: 'GET', mode: 'no-cors', signal: controller.signal};
                response = await fetch(urlWithParam, fetchOptions);
            }
        }

        clearTimeout(timeoutId);

        if (allowCors && !response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const endTime = performance.now();
        return endTime - startTime;
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
    // Normalize hostname: drop trailing dot and let the URL parser punycode-encode IDNs
    const normalizedHost = (() => {
        const trimmed = hostname.trim().replace(/\.$/, '');
        try {
            return new URL(`http://${trimmed}`).hostname;
        } catch (e) {
            return trimmed;
        }
    })();

    const labels = normalizedHost.split('.').filter(Boolean);
    if (labels.length === 0) {
        throw new Error('Invalid hostname for DNS query');
    }

    // Header: random TXID, RD flag set, QDCOUNT=1
    const header = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(header.subarray(0, 2));
    } else {
        const txid = Math.floor(Math.random() * 0xffff);
        header[0] = (txid >> 8) & 0xff;
        header[1] = txid & 0xff;
    }
    header[2] = 0x01; // Flags: recursion desired (0x0100)
    header[5] = 0x01; // QDCOUNT: one question

    // Build QNAME (labels + terminating zero)
    const qnameParts = [];
    labels.forEach(label => {
        const bytes = Array.from(label).map(char => {
            const code = char.charCodeAt(0);
            if (code > 0x7f) {
                throw new Error('Hostname must be ASCII/punycode encoded');
            }
            return code;
        });
        if (bytes.length === 0 || bytes.length > 63) {
            throw new Error('Invalid label length in hostname');
        }
        qnameParts.push(bytes.length, ...bytes);
    });
    const qname = new Uint8Array(qnameParts.length + 1); // trailing zero byte already 0
    qname.set(qnameParts);

    // Type (A) + Class (IN)
    const typeAndClass = new Uint8Array([0x00, 0x01, 0x00, 0x01]);

    // Assemble final query without extra padding bytes
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

function updateResult(server) {
    const table = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    let row = document.querySelector(`tr[data-server-name="${server.name}"]`);
    let detailsRow;
    const reliabilityBadge = getReliabilityBadge(server.reliability);
    const reliabilityDetails = server.reliability && server.reliability.message ? `<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">${server.reliability.message}</div>` : '';
    const minValue = formatMetric(server.speed.min);
    const medianValue = formatMetric(server.speed.median);
    const avgValue = formatMetric(server.speed.avg);
    const maxValue = formatMetric(server.speed.max);

    if (!row) {
        row = document.createElement('tr');
        row.setAttribute('data-server-name', server.name);
        row.classList.add('border-b', 'border-gray-300', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700');
        table.appendChild(row);

        // Create a new row for detailed information
        detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row', 'hidden', 'border-b', 'border-gray-300', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700'); // Hide by default
        table.appendChild(detailsRow);
    } else {
        // If the row already exists, get the next row as the details row
        detailsRow = row.nextElementSibling;
    }

    // Update row with basic information
    row.innerHTML = '';

    const serverCell = document.createElement('td');
    serverCell.className = 'text-left py-2 px-4 dark:text-gray-300 flex flex-col gap-1';
    const serverName = document.createElement('span');
    serverName.textContent = server.name;
    serverCell.appendChild(serverName);
    const copyButton = createCopyButton(server);
    serverCell.appendChild(copyButton);
    serverCell.insertAdjacentHTML('beforeend', reliabilityBadge);
    row.appendChild(serverCell);

    const metricValues = [minValue, medianValue, avgValue, maxValue];
    metricValues.forEach(value => {
        const cell = document.createElement('td');
        cell.className = 'text-center py-2 px-4 dark:text-gray-300';
        cell.textContent = value;
        row.appendChild(cell);
    });

    // Populate the detailed view with timings for each hostname
    detailsRow.innerHTML = `
    <td colspan="5" class="py-2 px-4 dark:bg-gray-800 dark:text-gray-300">
        ${reliabilityDetails}
        <div>Timings for each hostname:</div>
        <ul>
            ${server.individualResults.map(result => {
        if (typeof result.speed === 'number') {
            return `<li>${result.website}: ${result.speed.toFixed(2)} ms</li>`;
        } else {
            return `<li>${result.website}: Unavailable</li>`;
        }
    }).join('')}
        </ul>
    </td>
`;

    // Add click event listener to toggle detailed view
    // row.addEventListener('click', function() {
    //     detailsRow.classList.toggle('hidden');
    // });

    updateChartWithData(server);
}

function formatMetric(value) {
    return typeof value === 'number' ? value.toFixed(2) : 'Unavailable';
}

function getReliabilityBadge(reliability) {
    if (!reliability) {
        return '';
    }

    const escapedMessage = reliability.message ? reliability.message.replace(/"/g, '&quot;') : '';
    const badgeConfig = {
        healthy: {
            label: 'Stable',
            classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        },
        partial: {
            label: 'Partial',
            classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        },
        failed: {
            label: 'Unreachable',
            classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        },
        'no-data': {
            label: 'No data',
            classes: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
        }
    };

    const config = badgeConfig[reliability.status] || badgeConfig['no-data'];
    const ratioText = reliability.totalQueries ? ` (${reliability.successCount}/${reliability.totalQueries})` : '';

    return `
        <div class="mt-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.classes}" title="${escapedMessage}">
                ${config.label}${ratioText}
            </span>
        </div>
    `;
}

function sortTable(columnIndex) {
    let table = document.getElementById("resultsTable");
    let rows = Array.from(table.getElementsByTagName("tr"));

    let startIndex = 1; // Adjust this index as per your table structure

    let rowPairs = [];
    for (let i = startIndex; i < rows.length; i++) {
        if (!rows[i].classList.contains("details-row")) {
            let detailRow = (i + 1 < rows.length && rows[i + 1].classList.contains("details-row")) ? rows[i + 1] : null;
            rowPairs.push([rows[i], detailRow]);
        }
    }

    rowPairs.sort((a, b) => {
        let cellA = a[0].getElementsByTagName("TD")[columnIndex];
        let cellB = b[0].getElementsByTagName("TD")[columnIndex];

        if (!cellA || !cellB) {
            console.error("Undefined cell encountered", {
                cellA, cellB, rowIndexA: a[0].rowIndex, rowIndexB: b[0].rowIndex
            });
            return 0;
        }

        let valA = cellA.textContent.trim();
        let valB = cellB.textContent.trim();

        // Convert 'Unavailable' to a high number for sorting
        valA = valA === 'Unavailable' ? Infinity : parseFloat(valA) || 0;
        valB = valB === 'Unavailable' ? Infinity : parseFloat(valB) || 0;

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    for (let pair of rowPairs) {
        table.appendChild(pair[0]);
        if (pair[1]) table.appendChild(pair[1]);
    }
}

function createCopyButton(server) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = "cursor-pointer ml-0 mt-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex w-max";
    button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1-.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copy
    `;
    const ipList = Array.isArray(server.ips) && server.ips.length ? server.ips.join(', ') : 'Not provided';
    const copyText = `DoH Server URL: ${server.url}\nIP Addresses: ${ipList}`;
    button.dataset.copyText = copyText;
    button.title = "Copy server details";
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        copyToClipboard(button.dataset.copyText, button);
    });
    return button;
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        // Change button state to indicate success
        buttonElement.className = "cursor-pointer ml-0 mt-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 border border-green-400 text-green-700 dark:text-green-300 rounded flex items-center gap-1 transition-all duration-200 select-none inline-flex w-max";
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Copied!
        `;

        // Revert button state after 2 seconds
        setTimeout(() => {
            buttonElement.className = "cursor-pointer ml-0 mt-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex w-max";
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy
            `;
        }, 2000);
    }).catch(err => {
        console.error('Error in copying text: ', err);
        // Show error state
        buttonElement.className = "cursor-pointer ml-0 mt-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 border border-red-400 text-red-700 dark:text-red-300 rounded flex items-center gap-1 transition-all duration-200 select-none inline-flex w-max";
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error
        `;
        setTimeout(() => {
            buttonElement.className = "cursor-pointer ml-0 mt-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex w-max";
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy
            `;
        }, 2000);
    });
}

document.getElementById('cta').addEventListener('click', function () {
    if (navigator.share) {
        navigator.share({
            title: 'Find the Fastest DNS Server for You',
            text: 'Check out this tool to find the fastest DNS server for your location!',
            url: window.location.href
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(console.error);
    }
});

// Add this at the top of your script, after the global variable declarations
window.addEventListener('resize', function () {
    updateChartVisibility();
    if (dnsChart) {
        dnsChart.resize(); // This line triggers the chart to resize
    }
});

function updateChartVisibility() {
    // Horizontal bar chart works well on mobile - no need to hide
    // Chart is responsive and maintains good UX on all screen sizes
}

// JavaScript to handle modal and list manipulation
document.addEventListener('DOMContentLoaded', function () {
    updateChartVisibility();
    const showModal = (element) => {
        element.classList.remove('hidden');
        element.removeAttribute('aria-hidden');
    };
    const hideModal = (element) => {
        element.classList.add('hidden');
        element.setAttribute('aria-hidden', 'true');
    };
    document.getElementById('resultsTable').addEventListener('click', function (event) {
        let row = event.target.closest('tr');
        if (row && !row.classList.contains('details-row')) {
            let detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                detailsRow.classList.toggle('hidden');
            }
        }
    });

    const modal = document.getElementById("websiteModal");
    const btn = document.getElementById("editButton"); // Button that opens the modal
    const hostModalCloseButton = modal.querySelector(".close");
    const addBtn = document.getElementById("addHostname");
    const input = document.getElementById("newWebsite");
    const list = document.getElementById("websiteList");

    // Function to render the list
    function renderList() {
        list.innerHTML = '';
        if (topWebsites.length === 0) {
            const emptyState = document.createElement("li");
            emptyState.className = 'px-2 py-3 text-sm text-slate-500 dark:text-slate-300';
            emptyState.textContent = 'No hostnames configured. Use the form below to add some.';
            list.appendChild(emptyState);
        } else {
            topWebsites.forEach((site, index) => {
                const li = document.createElement("li");
                li.className = 'px-2 py-2 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600';

                const siteText = document.createElement("span");
                siteText.textContent = site;
                li.appendChild(siteText);

                const removeBtn = document.createElement("button");
                removeBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800';
                removeBtn.textContent = 'Delete';
                removeBtn.onclick = function () {
                    const removed = topWebsites.splice(index, 1);
                    persistHostnames();
                    renderList();
                    showModalFeedback('hosts', 'info', `${removed[0]} removed from the test list.`);
                };

                li.appendChild(removeBtn);
                list.appendChild(li);
            });
        }
        updateHostStats();
        // Disable the checkButton if we have no hostnames or DoH servers
        syncRunButtonState();
    }

    // Open the modal
    btn.onclick = function () {
        showModal(modal);
        renderList();
    };

    function validateAndExtractHost(input) {
        try {
            // Check if input is a valid URL with http or https protocol
            const url = new URL(input);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
            return url.hostname; // Return the hostname part of the URL
        } catch (e) {
            // If it's not a URL, check if it's a valid hostname
            const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
            if (hostnameRegex.test(input)) {
                return input; // Return the input as it's a valid hostname
            } else {
                return null; // Invalid input
            }
        }
    }

    if (hostModalCloseButton) {
        hostModalCloseButton.onclick = function () {
            hideModal(modal);
            clearModalFeedback('hosts');
        };
    }

    if (resetHostnamesButton) {
        resetHostnamesButton.addEventListener('click', () => {
            resetHostnamesToDefault();
            renderList();
        });
    }

    if (input) {
        input.addEventListener('input', () => clearModalFeedback('hosts'));
    }

    // Add new website(s)
    addBtn.onclick = function () {
        const candidate = input.value.trim();
        if (!candidate) {
            showModalFeedback('hosts', 'error', 'Please enter at least one hostname or URL.');
            return;
        }
        const entries = candidate.split(/[\n,;]/).map(entry => entry.trim()).filter(Boolean);
        if (!entries.length) {
            showModalFeedback('hosts', 'error', 'Please enter at least one hostname or URL.');
            return;
        }

        const added = [];
        const duplicates = [];
        const invalid = [];

        entries.forEach(entry => {
            const host = validateAndExtractHost(entry);
            if (!host) {
                invalid.push(entry);
                return;
            }
            if (topWebsites.includes(host)) {
                duplicates.push(host);
                return;
            }
            topWebsites.push(host);
            added.push(host);
        });

        if (added.length) {
            persistHostnames();
            renderList();
        } else {
            updateHostStats();
        }

        input.value = '';

        const messageParts = [];
        let severity = 'info';
        if (added.length) {
            severity = 'success';
            messageParts.push(`${added.length} ${added.length === 1 ? 'hostname' : 'hostnames'} added.`);
        }
        if (duplicates.length) {
            messageParts.push(`${duplicates.length} duplicate ${duplicates.length === 1 ? 'entry was' : 'entries were'} skipped.`);
        }
        if (invalid.length) {
            if (!added.length) {
                severity = 'error';
            }
            messageParts.push(`${invalid.length} invalid ${invalid.length === 1 ? 'entry' : 'entries'} ignored.`);
        }
        if (!messageParts.length) {
            severity = 'error';
            messageParts.push('No valid hostnames detected. Please double-check your entries.');
        }
        showModalFeedback('hosts', severity, messageParts.join(' '));
    };

    // Close the modal when clicking outside of it


    const dohModal = document.getElementById("dohModal");
    const dohBtn = document.getElementById("editDoHButton");
    const closeDohBtn = dohModal.querySelector(".close");
    const addDoHBtn = document.getElementById("addDoH");
    const dohList = document.getElementById("dohList");

    // Function to render the DoH servers list
    function renderDoHList() {
        dohList.innerHTML = '';
        if (dnsServers.length === 0) {
            const emptyState = document.createElement("li");
            emptyState.className = 'px-2 py-3 text-sm text-slate-500 dark:text-slate-300';
            emptyState.textContent = 'No DoH servers configured yet.';
            dohList.appendChild(emptyState);
        } else {
            dnsServers.forEach((server, index) => {
                const li = document.createElement("li");
                li.className = 'px-3 py-2 mb-1 bg-gray-200 rounded border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600 flex flex-col gap-2';

                const serverText = document.createElement("div");
                serverText.className = 'flex flex-col gap-0.5';
                const methodLabel = (server.type || 'auto').toUpperCase();
                const corsLabel = server.allowCors ? 'CORS allowed' : 'No CORS';
                const ipPreview = server.ips && server.ips.length ? server.ips.slice(0, 3).join(', ') + (server.ips.length > 3 ? '…' : '') : null;
                serverText.innerHTML = `
                    <span class="font-semibold text-sm">${server.name}</span>
                    <span class="text-xs text-slate-600 dark:text-slate-300 break-all">${server.url}</span>
                    <div class="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span class="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-slate-700 dark:text-slate-200">${methodLabel}</span>
                        <span class="rounded-full px-2 py-0.5 ${server.allowCors ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}">${corsLabel}</span>
                        ${ipPreview ? `<span class="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-slate-600 dark:text-slate-200">${ipPreview}</span>` : ''}
                    </div>
                `;
                li.appendChild(serverText);

                const actionsRow = document.createElement("div");
                actionsRow.className = 'flex justify-end';

                const removeBtn = document.createElement("button");
                removeBtn.className = 'bg-red-500 text-white rounded px-3 py-1 text-xs hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800';
                removeBtn.textContent = 'Delete';
                removeBtn.onclick = function () {
                    const removed = dnsServers.splice(index, 1);
                    persistDnsServers();
                    renderDoHList();
                    syncRunButtonState();
                    showModalFeedback('doh', 'info', `${removed[0].name} removed from the list.`);
                };

                actionsRow.appendChild(removeBtn);
                li.appendChild(actionsRow);
                dohList.appendChild(li);
            });
        }
        updateDoHStats();
    }

    dohBtn.onclick = function () {
        showModal(dohModal);
        renderDoHList();
    };

    closeDohBtn.onclick = function () {
        hideModal(dohModal);
        clearModalFeedback('doh');
    };

    if (resetDoHButton) {
        resetDoHButton.addEventListener('click', () => {
            resetDnsServersToDefault();
            renderDoHList();
        });
    }

    [newDoHNameInput, newDoHUrlInput, newDoHIpsInput].forEach(inputField => {
        if (inputField) {
            inputField.addEventListener('input', () => clearModalFeedback('doh'));
        }
    });

    if (addDoHBtn) {
        let dohCheckInProgress = false;
        const defaultAddDoHLabel = addDoHBtn.textContent;

        const setDoHBusyState = (state) => {
            dohCheckInProgress = state;
            addDoHBtn.disabled = state;
            addDoHBtn.textContent = state ? 'Checking…' : defaultAddDoHLabel;
        };

        // Add new DoH server with automatic capability check
        addDoHBtn.addEventListener('click', async () => {
            if (dohCheckInProgress) return;
            const name = newDoHNameInput.value.trim();
            const url = newDoHUrlInput.value.trim();
            const ips = parseIpList(newDoHIpsInput.value);

            if (!name || !url) {
                showModalFeedback('doh', 'error', 'Please provide both a server name and a DoH endpoint URL.');
                return;
            }

            try {
                new URL(url);
            } catch (error) {
                showModalFeedback('doh', 'error', 'Please provide a valid URL (including https://).');
                return;
            }

            const isDuplicate = dnsServers.some(server => server.url === url || server.name === name);
            if (isDuplicate) {
                showModalFeedback('doh', 'error', 'A server with the same name or URL already exists.');
                return;
            }

            showModalFeedback('doh', 'info', 'Checking server capabilities…');
            setDoHBusyState(true);
            try {
                const result = await checkServerCapabilities({name, url, ips});
                if (newDoHNameInput) newDoHNameInput.value = '';
                if (newDoHUrlInput) newDoHUrlInput.value = '';
                if (newDoHIpsInput) newDoHIpsInput.value = '';
                renderDoHList();
                const summary = `Added ${name} using ${result.chosenType.toUpperCase()} ${result.allowCors ? 'with' : 'without'} CORS.`;
                showModalFeedback('doh', 'success', summary);
            } catch (error) {
                showModalFeedback('doh', 'error', error.message || 'Failed to add DoH server.');
            } finally {
                setDoHBusyState(false);
            }
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            hideModal(modal);
            clearModalFeedback('hosts');
        }
        if (event.target === dohModal) {
            hideModal(dohModal);
            clearModalFeedback('doh');
        }
    });

    // Function to check server capabilities for CORS and method support
    async function checkServerCapabilities({name, url, ips = []}) {
        const testHostname = 'example.com';
        const dnsQuery = buildDNSQuery(testHostname);
        const usesJsonApi = (() => {
            try {
                return new URL(url).pathname.includes('/resolve');
            } catch (e) {
                return false;
            }
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
            try {
                return await fetch(input, {...options, signal: controller.signal});
            } catch (error) {
                console.error('Capability test error', {input, options, error});
                return null;
            } finally {
                clearTimeout(timer);
            }
        };

        const testGet = async (mode) => {
            const urlToUse = usesJsonApi ? jsonGetUrl : wireGetUrl;
            const headers = usesJsonApi ? {'Accept': 'application/dns-json'} : {'Accept': 'application/dns-message'};
            const response = await withTimeout(urlToUse, {method: 'GET', mode, headers});
            if (!response) return {success: false, cors: false};
            if (mode === 'cors') {
                const corsAllowed = response.type === 'cors';
                return {success: response.ok, cors: corsAllowed};
            }
            // In no-cors mode we can't inspect status; assume success if no network error
            return {success: true, cors: false};
        };

        const testPostCors = async () => {
            // Only meaningful for wire-format endpoints
            if (usesJsonApi) return {success: false, cors: false};
            const response = await withTimeout(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/dns-message',
                    'Accept': 'application/dns-message'
                },
                body: dnsQuery
            });
            if (!response) return {success: false, cors: false};
            return {success: response.ok, cors: response.type === 'cors'};
        };

        const [getCors, postCors, getNoCors] = await Promise.all([
            testGet('cors'),
            testPostCors(),
            testGet('no-cors')
        ]);

        let chosenType = null;
        let allowCors = false;

        if (getCors.success) {
            chosenType = 'get';
            allowCors = true;
        } else if (postCors.success) {
            chosenType = 'post';
            allowCors = true;
        } else if (getNoCors.success) {
            chosenType = 'get';
            allowCors = false;
        }

        if (!chosenType) {
            throw new Error('Failed to confirm DoH capabilities. Neither GET nor POST tests succeeded.');
        }

        dnsServers.push({
            name,
            url,
            type: chosenType,
            allowCors,
            ips: Array.isArray(ips) ? [...ips] : []
        });
        persistDnsServers();
        syncRunButtonState();
        return {chosenType, allowCors, getCors, postCors, getNoCors};
    }
});
