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
const topWebsites = ['google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'yahoo.com', 'wikipedia.org', 'twitter.com', 'instagram.com', 'linkedin.com', 'netflix.com'];
// Global variable to store chart instance
const dnsServers = [{name: "AdGuard", url: "https://dns.adguard-dns.com/dns-query"}, {
    name: "AliDNS", url: "https://dns.alidns.com/dns-query"
}, //{ name: "Bebasid", url: "https://dns.bebasid.com/dns-query", type: "get" },
    {
        name: "OpenDNS", url: "https://doh.opendns.com/dns-query"
    }, {name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query", type: "get", allowCors: true}, {
        name: "ControlD", url: "https://freedns.controld.com/p0"
    }, //{ name: "Decloudus", url: "https://dns.decloudus.com/dns-query" , type: "get" },
    {name: "DNS.SB", url: "https://doh.dns.sb/dns-query", type: "get", allowCors: true}, {
        name: "DNSPod", url: "https://dns.pub/dns-query", type: "get", allowCors: true
    }, {name: "Google", url: "https://dns.google/resolve", type: "get", allowCors: true}, {
        name: "Mullvad", url: "https://doh.mullvad.net/dns-query"
    }, {
        name: "NextDNS", url: "https://dns.nextdns.io", type: "get"
    }, {name: "OpenBLD", url: "https://ada.openbld.net/dns-query"}, {
        name: "DNS0.EU", url: "https://zero.dns0.eu/"
    }, {name: "Quad9", url: "https://dns.quad9.net/dns-query"}, {
        name: "360", url: "https://doh.360.cn/dns-query"
    }, //{ name: "Applied Privacy", url: "https://doh.applied-privacy.net/query" , type: "get" },
    {
        name: "Canadian Shield", url: "https://private.canadianshield.cira.ca/dns-query"
    }, //{ name: "Comss.one", url: "https://dns.comss.one/dns-query", type: "get"  },
    {
        name: "Digitale Gesellschaft", url: "https://dns.digitale-gesellschaft.ch/dns-query"
    }, {
        name: "DNS for Family", url: "https://dns-doh.dnsforfamily.com/dns-query"
    }, {name: "Restena", url: "https://kaitain.restena.lu/dns-query"}, {
        name: "IIJ", url: "https://public.dns.iij.jp/dns-query"
    }, {
        name: "LibreDNS", url: "https://doh.libredns.gr/dns-query"
    }, //{ name: "RoTunneling DNS", url: "https://dns.rotunneling.net/dns-query/public" , type: "get" },
    {name: "Switch", url: "https://dns.switch.ch/dns-query"}];

let dnsChart;

function updateChartWithData(server) {
    const chartContainer = document.getElementById('chartContainer');
    const ctx = document.getElementById('dnsChart').getContext('2d');

    // Check if there is valid data
    if (!server || !server.speed || server.speed.min === 'Unavailable') {
        chartContainer.style.display = 'none';
    } else {
        // Only display the chart container on non-mobile devices
        if (window.innerWidth > 768) {
            chartContainer.style.display = 'block';
        }
    }

    // Initialize the chart if it doesn't exist
    if (!dnsChart) {
        dnsChart = new Chart(ctx, {
            type: 'bar', data: {
                labels: [], datasets: [{
                    label: 'Min Speed (ms)',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: 'Median Speed (ms)',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Max Speed (ms)',
                    data: [],
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            }, options: {
                responsive: true, scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Check if the server data already exists in the chart
    const serverIndex = dnsChart.data.labels.indexOf(server.name);
    if (serverIndex === -1) {
        // Server not in chart, add new data
        dnsChart.data.labels.push(server.name);
        dnsChart.data.datasets[0].data.push(server.speed.min);
        dnsChart.data.datasets[1].data.push(server.speed.median);
        dnsChart.data.datasets[2].data.push(server.speed.max);
    } else {
        // Server already in chart, update existing data
        dnsChart.data.datasets[0].data[serverIndex] = server.speed.min;
        dnsChart.data.datasets[1].data[serverIndex] = server.speed.median;
        dnsChart.data.datasets[2].data[serverIndex] = server.speed.max;
    }

    // Update the chart
    dnsChart.update();
}

async function warmUpDNSServers() {
    // Display the warm-up message
    // Use the same DNS server list and top websites for warm-up
    for (const server of dnsServers) {
        // Perform DNS queries for each website in the topWebsites list
        await Promise.all(topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors)));
    }
    console.log("Warm-up phase completed");
}

checkButton.addEventListener('click', async function () {
    this.disabled = true;
    editButton.disabled = true; // Disable the Edit button
    document.getElementById('loadingMessage').style.display = 'block';

    document.getElementById('loadingMessage').innerHTML = 'Warming up DNS servers <img height="70" width="70" src="loading.gif"  alt="Loading" style="display: inline; vertical-align: middle;" />';
    await warmUpDNSServers();
    document.getElementById('loadingMessage').innerHTML = 'Analyzing DNS servers <img height="70" width="70" src="loading.gif" alt="Loading" style="display: inline; vertical-align: middle;" />';
    await performDNSTests();

    document.getElementById('loadingMessage').style.display = 'none';
    this.disabled = false;
    editButton.disabled = false; // Re-enable the Edit button
});

async function performDNSTests() {

    for (const server of dnsServers) {
        const speedResults = await Promise.all(topWebsites.map(website => measureDNSSpeed(server.url, website, server.type, server.allowCors)));

        // Store individual results for detailed view
        server.individualResults = speedResults.map((speed, index) => ({website: topWebsites[index], speed}));

        const validResults = speedResults.filter(speed => speed !== null && typeof speed === 'number');
        validResults.sort((a, b) => a - b);

        if (validResults.length > 0) {
            const min = validResults[0];
            const max = validResults[validResults.length - 1];
            const median = validResults.length % 2 === 0 ? (validResults[validResults.length / 2 - 1] + validResults[validResults.length / 2]) / 2 : validResults[Math.floor(validResults.length / 2)];

            server.speed = {min, median, max};
        } else {
            server.speed = {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable'};
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
        table.appendChild(row);

        // Create a new row for detailed information
        detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row');
        detailsRow.style.display = 'none'; // Hide by default
        table.appendChild(detailsRow);
    } else {
        // If the row already exists, get the next row as the details row
        detailsRow = row.nextElementSibling;
    }

    // Update row with basic information
    row.innerHTML = `
        <td>${server.name} <span class="copy-icon" onclick="copyToClipboard('${server.url}')">📋</span></td>
        <td>${server.speed.min !== 'Unavailable' ? server.speed.min.toFixed(2) : 'Unavailable'}</td>
        <td>${server.speed.median !== 'Unavailable' ? server.speed.median.toFixed(2) : 'Unavailable'}</td>
        <td>${server.speed.max !== 'Unavailable' ? server.speed.max.toFixed(2) : 'Unavailable'}</td>
    `;

    // Populate the detailed view with timings for each hostname
    detailsRow.innerHTML = `
        <td colspan="4">
            <div>Timings for each hostname:</div>
            <ul>
                ${server.individualResults.map(result => `<li>${result.website}: ${result.speed !== null ? result.speed.toFixed(2) + ' ms' : 'Unavailable'}</li>`).join('')}
            </ul>
        </td>
    `;

    // Add click event listener to toggle detailed view
    // row.addEventListener('click', function() {
    //     detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        //copied to clipboard
    }).catch(err => {
        console.error('Error in copying text: ', err);
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
    const chartContainer = document.getElementById('chartContainer');
    if (window.innerWidth <= 768) {
        chartContainer.style.display = 'none';
    } else {
        // Additional logic to determine if chartContainer should be displayed
        // For example, you might want to check if there's valid data
        // if (/* condition to show chart */) {
        //     chartContainer.style.display = 'block';
        // } else {
        //     chartContainer.style.display = 'none';
        // }
    }
}

// JavaScript to handle modal and list manipulation
document.addEventListener('DOMContentLoaded', function () {
    updateChartVisibility();
    document.getElementById('resultsTable').addEventListener('click', function (event) {
        let row = event.target.closest('tr');
        if (row && !row.classList.contains('details-row')) {
            let detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
            }
        }
    });

    const modal = document.getElementById("websiteModal");
    const btn = document.getElementById("editButton"); // Button that opens the modal
    const span = document.getElementsByClassName("close")[0];
    const addBtn = document.getElementById("addWebsite");
    const input = document.getElementById("newWebsite");
    const list = document.getElementById("websiteList");

    // Function to render the list
    function renderList() {
        list.innerHTML = '';
        topWebsites.forEach((site, index) => {
            const li = document.createElement("li");
            li.textContent = site;
            const removeBtn = document.createElement("button");
            removeBtn.textContent = '-';
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
});