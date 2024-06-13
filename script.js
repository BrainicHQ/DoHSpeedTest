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
    ips: ["185.222.222.222", "185.184.222.222"]
}, {
    name: "DNSPod",
    url: "https://dns.pub/dns-query",
    type: "get",
    allowCors: true,
    ips: ["119.29.29.29", "182.254.116.116"]
}, {
    name: "Google", url: "https://dns.google/resolve", type: "get", allowCors: true, ips: ["8.8.8.8", "8.8.4.4"]
}, {
    name: "Mullvad", url: "https://doh.mullvad.net/dns-query", ips: ["193.138.218.74", "194.242.2.2"]
}, {
    name: "NextDNS", url: "https://dns.nextdns.io", type: "get", ips: ["45.90.28.0", "45.90.30.0"]
}, {
    name: "OpenBLD", url: "https://ada.openbld.net/dns-query", ips: ["146.112.41.2", "146.112.41.102"]
}, {
    name: "DNS0.EU", url: "https://zero.dns0.eu/", ips: ["5.9.149.169", "195.201.169.147"]
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
    name: "Restena", url: "https://kaitain.restena.lu/dns-query", ips: ["158.64.1.29", "158.64.1.30"]
}, {
    name: "IIJ", url: "https://public.dns.iij.jp/dns-query", ips: ["203.180.164.45", "203.180.166.45"]
}, {
    name: "LibreDNS", url: "https://doh.libredns.gr/dns-query", ips: ["116.202.176.26", "147.135.76.183"]
}, {
    name: "Switch", url: "https://dns.switch.ch/dns-query", ips: ["130.59.31.248", "130.59.31.251"]
}];

let dnsChart;

function updateChartWithData(server) {
    const chartContainer = document.getElementById('chartContainer');
    const ctx = document.getElementById('dnsChart').getContext('2d');

    // Display the chart container if it's hidden and there's valid data
    if (server.speed.min !== 'Unavailable' && window.innerWidth > 768) {
        chartContainer.classList.remove('hidden');
    }

    // Initialize the chart if it doesn't exist, with the new line chart structure
    if (!dnsChart) {
        dnsChart = new Chart(ctx, {
            type: 'line', // Changed to 'line'
            data: {
                labels: topWebsites, // Assuming topWebsites is the array of websites
                datasets: [] // Start with an empty array of datasets
            }, options: {
                responsive: true, scales: {
                    y: {
                        beginAtZero: true
                    }
                }, plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true, // Enable zooming with mouse wheel
                            }, pinch: {
                                enabled: true // Enable zooming with pinch gestures
                            }, mode: 'xy', // Zoom both x and y axes
                        }, pan: {
                            enabled: true, mode: 'xy' // Pan both x and y axes
                        }
                    }
                }
            }
        });
    }

    // Find the dataset for the current server
    const serverIndex = dnsChart.data.datasets.findIndex(dataset => dataset.label === server.name);

    // Prepare the server data for the chart (speed results for each website)
    const serverData = server.individualResults.map(result => result.speed === 'Unavailable' ? null : result.speed);

    if (serverIndex === -1) {
        // If the server is not in the chart, add it as a new dataset
        const newDataset = {
            label: server.name, data: serverData, fill: false, borderColor: getRandomColor(), // A function to generate a random color
            borderWidth: 2, lineTension: 0.1 // Adjust for line smoothness
        };
        dnsChart.data.datasets.push(newDataset);
    } else {
        // If the server is already in the chart, update its data
        dnsChart.data.datasets[serverIndex].data = serverData;
    }

    // Update the chart to reflect the new or updated data
    dnsChart.update();
}

// Helper function to generate a random color for the chart lines
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

checkButton.addEventListener('click', async function () {
    this.disabled = true;
    editButton.disabled = true; // Disable the Edit button
    document.getElementById('loadingMessage').classList.remove('hidden');

    document.getElementById('loadingMessage').innerHTML = 'Warming up DNS servers <img height="70" width="70" src="loading.gif"  alt="Loading" style="display: inline; vertical-align: middle;" />';
    await warmUpDNSServers();
    document.getElementById('loadingMessage').innerHTML = 'Analyzing DNS servers <img height="70" width="70" src="loading.gif" alt="Loading" style="display: inline; vertical-align: middle;" />';
    await performDNSTests();

    document.getElementById('loadingMessage').classList.add('hidden');
    this.disabled = false;
    editButton.disabled = false; // Re-enable the Edit button
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
        row.classList.add('border-b', 'border-gray-300', 'hover:bg-gray-200');
        table.appendChild(row);

        // Create a new row for detailed information
        detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row', 'hidden'); // Hide by default
        detailsRow.classList.add('border-b', 'border-gray-300', 'hover:bg-gray-200');
        table.appendChild(detailsRow);
    } else {
        // If the row already exists, get the next row as the details row
        detailsRow = row.nextElementSibling;
    }

    // Update row with basic information
    row.innerHTML = `
        <td class="text-left py-2 px-4">${server.name} 
        <span class="copy-icon" onclick="copyToClipboard('DoH Server URL: ${server.url}' + '\\n' + 'IP Addresses: ${server.ips.join(', ')}', this)">📋</span></td>
        <td class="text-center py-2 px-4">${server.speed.min !== 'Unavailable' ? server.speed.min.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4">${server.speed.median !== 'Unavailable' ? server.speed.median.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4">${server.speed.max !== 'Unavailable' ? server.speed.max.toFixed(2) : 'Unavailable'}</td>
    `;

    // Populate the detailed view with timings for each hostname
    detailsRow.innerHTML = `
    <td colspan="4" class="py-2 px-4">
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
        buttonElement.classList.add('copied');
        buttonElement.textContent = '✓ Copied';

        // Revert button state after 2 seconds
        setTimeout(() => {
            buttonElement.classList.remove('copied');
            buttonElement.textContent = '📋';
        }, 2000);
    }).catch(err => {
        console.error('Error in copying text: ', err);
        // Optionally, handle error state
        buttonElement.textContent = '❌ Error';
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
    if (window.innerWidth < 768) {
        chartContainer.classList.add('hidden');
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
                detailsRow.classList.toggle('hidden');
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
            li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center';
            li.textContent = site;
            const removeBtn = document.createElement("button");
            removeBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600';
            removeBtn.textContent = 'Delete️';
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

    document.getElementById('resetZoom').addEventListener('click', function () {
        dnsChart.resetZoom();
    });
});