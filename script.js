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
const topWebsites = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'];
// Global variable to store chart instance
const dnsServers = [{
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
    name: "OpenBLD", url: "https://ada.openbld.net/dns-query", ips: ["146.112.41.2", "146.112.41.102"]
}, {
    name: "DNS0.EU", url: "https://zero.dns0.eu/", ips: ["193.110.81.9", "185.253.5.9"]
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
}];

let dnsChart;

let chartData = [];

function updateChartWithData(server) {
    // Store server data for chart updates
    const existingIndex = chartData.findIndex(item => item.name === server.name);
    const serverInfo = {
        name: server.name,
        avg: server.speed.avg !== 'Unavailable' ? server.speed.avg : null,
        min: server.speed.min !== 'Unavailable' ? server.speed.min : null,
        max: server.speed.max !== 'Unavailable' ? server.speed.max : null
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
    const container = chartContainer.querySelector('.chart-container');
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

    for (const server of dnsServers) {
        const speedResults = await Promise.all(topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors)));

        // Map each website to its speed result for the current server
        server.individualResults = topWebsites.map((website, index) => {
            const speed = speedResults[index];
            return {website, speed: speed !== null ? speed : 'Unavailable'};
        });

        const validResults = speedResults.filter(speed => speed !== null && typeof speed === 'number');
        validResults.sort((a, b) => a - b);

        if (validResults.length > 0) {
            const min = validResults[0];
            const max = validResults[validResults.length - 1];
            const median = validResults.length % 2 === 0 ? (validResults[validResults.length / 2 - 1] + validResults[validResults.length / 2]) / 2 : validResults[Math.floor(validResults.length / 2)];

            let sum = 0;
            for (let i = 0; i < validResults.length; i++) {
                sum += validResults[i];
            }

            const avg = sum / validResults.length;


            server.speed = {min, median, max, avg};
        } else {
            server.speed = {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable'};
        }

        updateResult(server);
    }
}

async function measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
        const startTime = performance.now();
        let response;

        if (serverType === 'get') {
            const urlWithParam = new URL(dohUrl);
            urlWithParam.searchParams.append('name', hostname);
            urlWithParam.searchParams.append('nocache', Date.now());

            let fetchOptions = {
                method: 'GET', signal: controller.signal
            };

            if (allowCors) {
                fetchOptions.headers = {'Accept': 'application/dns-json'};
            } else {
                fetchOptions.mode = 'no-cors';
            }

            response = await fetch(urlWithParam, fetchOptions);
        } else {
            const dnsQuery = buildDNSQuery(hostname);
            let fetchOptions = {
                method: 'POST', body: dnsQuery, mode: allowCors ? 'cors' : 'no-cors', signal: controller.signal
            };

            if (allowCors) {
                fetchOptions.headers = {'Content-Type': 'application/dns-message'};
            }

            response = await fetch(dohUrl, fetchOptions);
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
    // Start with a simple DNS header
    // ID (2 bytes), Flags (2 bytes), QDCOUNT (2 bytes), ANCOUNT (2 bytes), NSCOUNT (2 bytes), ARCOUNT (2 bytes)
    const header = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    // Convert hostname to DNS question format
    const labels = hostname.split('.');
    const question = labels.flatMap(label => {
        const length = label.length;
        return [length, ...Array.from(label).map(c => c.charCodeAt(0))];
    });

    // Type (A record = 0x0001) and Class (IN = 0x0001)
    const typeAndClass = new Uint8Array([0x00, 0x01, 0x00, 0x01]);

    // Combine all parts
    const query = new Uint8Array(header.length + question.length + 2 + typeAndClass.length);
    query.set(header);
    query.set(question, header.length);
    query.set([0x00], header.length + question.length); // Null byte to end the QNAME
    query.set(typeAndClass, header.length + question.length + 1);

    return query;
}

function updateResult(server) {
    const table = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    let row = document.querySelector(`tr[data-server-name="${server.name}"]`);
    let detailsRow;

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
    row.innerHTML = `
        <td class="text-left py-2 px-4 dark:text-gray-300">${server.name} 
        <span class="cursor-pointer ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex" onclick="copyToClipboard('DoH Server URL: ${server.url}' + '\\n' + 'IP Addresses: ${server.ips.join(', ')}', this)" title="Copy server details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
        </span></td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.min !== 'Unavailable' ? server.speed.min.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.median !== 'Unavailable' ? server.speed.median.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300"> ${server.speed.avg !== 'Unavailable' ? server.speed.avg.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.max !== 'Unavailable' ? server.speed.max.toFixed(2) : 'Unavailable'}</td>
    `;

    // Populate the detailed view with timings for each hostname
    detailsRow.innerHTML = `
    <td colspan="4" class="py-2 px-4 dark:bg-gray-800 dark:text-gray-300">
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

function copyToClipboard(text, buttonElement) {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
        // Change button state to indicate success
        buttonElement.className = "cursor-pointer ml-2 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 border border-green-400 text-green-700 dark:text-green-300 rounded flex items-center gap-1 transition-all duration-200 select-none inline-flex";
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Copied!
        `;

        // Revert button state after 2 seconds
        setTimeout(() => {
            buttonElement.className = "cursor-pointer ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex";
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
        buttonElement.className = "cursor-pointer ml-2 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 border border-red-400 text-red-700 dark:text-red-300 rounded flex items-center gap-1 transition-all duration-200 select-none inline-flex";
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error
        `;
        setTimeout(() => {
            buttonElement.className = "cursor-pointer ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex";
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
    const span = document.getElementsByClassName("close")[0];
    const addBtn = document.getElementById("addHostname");
    const input = document.getElementById("newWebsite");
    const list = document.getElementById("websiteList");

    // Function to render the list
    function renderList() {
        list.innerHTML = '';
        topWebsites.forEach((site, index) => {
            const li = document.createElement("li");
            // Updated class list to include border-bottom for better separation
            li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600';

            const siteText = document.createElement("span");
            siteText.textContent = site;
            li.appendChild(siteText);  // Properly append the text content to the list item

            const removeBtn = document.createElement("button");
            removeBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800';
            removeBtn.textContent = 'Delete';
            removeBtn.onclick = function () {
                topWebsites.splice(index, 1);
                renderList();
            };

            li.appendChild(removeBtn);
            list.appendChild(li);
        });
        // Disable the checkButton if topWebsites is empty
        checkButton.disabled = topWebsites.length === 0;
    }

    // Open the modal
    btn.onclick = function () {
        modal.style.display = "block";
        renderList();
    }

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

    // Close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // Add new website
    addBtn.onclick = function () {
        const host = validateAndExtractHost(input.value);
        if (host) {
            if (!topWebsites.includes(host)) {
                topWebsites.push(host);
                renderList();
            } else {
                alert("This website is already in the list.");
            }
        } else {
            alert("Please enter a valid URL or hostname.");
        }
        input.value = ''; // Clear the input field
    }

    // Close the modal when clicking outside of it
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }


    const dohModal = document.getElementById("dohModal");
    const dohBtn = document.getElementById("editDoHButton");
    const closeDohBtn = dohModal.querySelector(".close");
    const addDoHBtn = document.getElementById("addDoH");
    const newDoHInput = document.getElementById("newDoH");
    const dohList = document.getElementById("dohList");

    // Function to render the DoH servers list
    function renderDoHList() {
        dohList.innerHTML = '';
        dnsServers.forEach((server, index) => {
            const li = document.createElement("li");
            li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600';

            const serverText = document.createElement("span");
            serverText.textContent = `${server.name}: ${server.url}`;
            li.appendChild(serverText);

            const removeBtn = document.createElement("button");
            removeBtn.className = 'bg-red-500 text-white rounded px-2 py-1 ml-2 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800';
            removeBtn.textContent = 'Delete';
            removeBtn.onclick = function () {
                dnsServers.splice(index, 1);
                renderDoHList();
            };

            li.appendChild(removeBtn);
            dohList.appendChild(li);
        });
    }

    dohBtn.onclick = function () {
        dohModal.style.display = "block";
        renderDoHList();
    };

    closeDohBtn.onclick = function () {
        dohModal.style.display = "none";
    };

    // Add new DoH server with automatic capability check
    addDoHBtn.onclick = function () {
        const serverDetails = newDoHInput.value.split(', '); // Expected format: "Name, URL"
        if (serverDetails.length >= 2) {
            const [name, url] = serverDetails;

            // Check if server already exists by URL or name
            const isDuplicate = dnsServers.some(server => server.url === url || server.name === name);
            if (!isDuplicate) {
                // If not duplicate, proceed to check and add the server
                checkServerCapabilities(name, url);
            } else {
                alert("A server with the same name or URL already exists. Please enter a unique name and URL.");
            }
        } else {
            alert("Please enter DoH server details in the correct format: Name, URL");
        }
        newDoHInput.value = ''; // Clear the input field
    };

    window.onclick = function (event) {
        if (event.target === dohModal) {
            dohModal.style.display = "none";
        }
    };

    // Function to check server capabilities for CORS and method support
    async function checkServerCapabilities(name, url) {
        let supportsGet = false;
        let supportsPost = false;
        let corsGet = false;
        let corsPost = false;

        // Function to test a fetch operation for a given method
        async function testMethod(method, mode) {
            try {
                const options = {
                    method: method,
                    mode: mode,
                    headers: {}
                };

                // Additional headers for POST
                if (method === 'POST') {
                    options.headers['Content-Type'] = 'application/dns-message';
                    options.body = new Uint8Array(); // Empty body for testing
                }

                const response = await fetch(url, options);
                if (response.ok || mode === 'no-cors') {
                    // If response is OK, check if CORS headers are present for 'cors' mode
                    const corsEnabled = mode === 'cors' && response.headers.get('Access-Control-Allow-Origin') === '*';
                    return {success: true, cors: corsEnabled};
                }
                return {success: false, cors: false};
            } catch (error) {
                console.error(`Error testing ${method} method with ${mode}:`, error);
                return {success: false, cors: false};
            }
        }

        // Test both GET and POST with 'cors' and 'no-cors'
        const results = await Promise.all([
            testMethod('GET', 'cors'),
            testMethod('POST', 'cors'),
            testMethod('GET', 'no-cors'),
            testMethod('POST', 'no-cors')
        ]);

        // Update based on results
        supportsGet = results[0].success || results[2].success;
        supportsPost = results[1].success || results[3].success;
        corsGet = results[0].cors;
        corsPost = results[1].cors;

        // Decide to add the server or not based on tests
        if (supportsGet || supportsPost) {
            const type = supportsGet ? 'get' : 'post';
            const allowCors = supportsGet ? corsGet : corsPost;

            dnsServers.push({name, url, type, allowCors, ips: []});
            renderDoHList();
            alert(`Server added successfully. GET support: ${supportsGet} (CORS: ${corsGet}), POST support: ${supportsPost} (CORS: ${corsPost})`);
        } else {
            alert('Failed to add server. Neither GET nor POST methods succeeded. Check console for details.');
        }
    }
});
