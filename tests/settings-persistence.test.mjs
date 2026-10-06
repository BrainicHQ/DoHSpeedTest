import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const HOSTS_KEY = 'dns-speed-test-hostnames-v1';
const DOH_KEY = 'dns-speed-test-doh-servers-v1';

function createClassList() {
    const values = new Set();
    return {
        add: (...classes) => classes.forEach(cls => values.add(cls)),
        remove: (...classes) => classes.forEach(cls => values.delete(cls)),
        toggle: (cls, force) => {
            const shouldAdd = force ?? !values.has(cls);
            if (shouldAdd) values.add(cls);
            else values.delete(cls);
            return shouldAdd;
        },
        contains: cls => values.has(cls)
    };
}

function createElement(id = '') {
    const listeners = new Map();
    const element = {
        id,
        dataset: {},
        style: {},
        classList: createClassList(),
        children: [],
        parentElement: { style: {} },
        nextElementSibling: null,
        disabled: false,
        value: '',
        textContent: '',
        addEventListener: function (type, handler) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(handler);
        },
        click: function () {
            (listeners.get('click') || []).forEach(handler => handler({ target: this }));
        },
        append: function (...children) { this.children.push(...children); },
        appendChild: function (child) { this.children.push(child); return child; },
        remove: () => {},
        setAttribute: () => {},
        focus: () => {},
        querySelector: () => null,
        showModal: function () { this.open = true; },
        close: function () { this.open = false; },
        querySelectorAll: () => [],
        getContext: () => ({})
    };

    let innerHTML = '';
    Object.defineProperty(element, 'innerHTML', {
        get: () => innerHTML,
        set: value => {
            innerHTML = value;
            element.children = [];
        }
    });

    return element;
}

function createHarness(seed = {}) {
    const storage = new Map(Object.entries(seed));
    const elements = new Map();
    const testConsole = Object.assign(Object.create(console), { warn: () => {} });
    const documentElement = createElement('html');
    const document = {
        documentElement,
        getElementById: id => {
            if (!elements.has(id)) elements.set(id, createElement(id));
            return elements.get(id);
        },
        createElement,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    };

    const context = {
        console: testConsole,
        URL,
        AbortController,
        Uint8Array,
        Date,
        Math,
        setTimeout: () => 0,
        clearTimeout: () => {},
        requestAnimationFrame: callback => callback(),
        btoa: value => Buffer.from(value, 'binary').toString('base64'),
        crypto: {
            getRandomValues: array => {
                array.fill(0);
                return array;
            }
        },
        performance: { now: () => 0 },
        localStorage: {
            getItem: key => storage.has(key) ? storage.get(key) : null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key)
        },
        navigator: {
            clipboard: { writeText: async () => {} }
        },
        document,
        Chart: function Chart() {},
        addEventListener: () => {},
        matchMedia: () => ({ matches: false }),
        confirm: () => true
    };
    context.window = context;

    vm.runInNewContext(fs.readFileSync('script.js', 'utf8'), context, { filename: 'script.js' });
    return { context, elements, storage };
}

function nodeText(element) {
    if (!element) return '';
    if (!element.children || element.children.length === 0) return element.textContent;
    return element.children.map(nodeText).join('');
}

function listText(element) {
    return element.children.map(nodeText);
}

{
    const { context, elements } = createHarness({
        [HOSTS_KEY]: JSON.stringify(['Example.org', 'https://Brainic.io/path', 'not a host']),
        [DOH_KEY]: JSON.stringify([
            { name: 'Saved DNS', url: 'https://saved.example/dns-query', type: 'get', allowCors: false, ips: ['192.0.2.10'] }
        ])
    });

    vm.runInNewContext('renderHostsList(); renderDoHList();', context);

    const hostRows = elements.get('websiteList').children;
    assert.deepEqual(hostRows.map(row => row.children[0].textContent), ['example.org', 'brainic.io']);

    const dohRows = elements.get('dohList').children;
    assert.equal(dohRows.length, 1);
    assert.deepEqual(listText(dohRows[0].children[0]), ['Saved DNS', 'https://saved.example/dns-query']);
}

{
    const { context } = createHarness();

    const providers = vm.runInNewContext(`DEFAULT_DNS_SERVERS.map(server => ({
        name: server.name,
        countryCode: server.countryCode,
        country: server.country,
        flag: countryFlag(server.countryCode)
    }))`, context);
    const missingCountry = providers.filter(server => !server.countryCode || !server.country || !server.flag);

    assert.equal(providers.length, 26);
    assert.equal(missingCountry.length, 0);
}

{
    const { context, storage } = createHarness({
        [DOH_KEY]: JSON.stringify([
            { name: 'AdGuard', url: 'https://dns.adguard-dns.com/dns-query', ips: ['94.140.14.14'] },
            { name: 'Custom DNS', url: 'https://custom.example/dns-query', ips: [] }
        ])
    });

    assert.equal(vm.runInNewContext('dnsServers[0].countryCode', context), 'CY');
    assert.equal(vm.runInNewContext('dnsServers[0].country', context), 'Cyprus');
    assert.equal(vm.runInNewContext('dnsServers[1].countryCode', context), undefined);

    vm.runInNewContext('persistDoHServers()', context);
    const persisted = JSON.parse(storage.get(DOH_KEY));
    assert.equal(persisted[0].countryCode, 'CY');
    assert.equal(persisted[0].country, 'Cyprus');
    assert.equal(Object.hasOwn(persisted[1], 'countryCode'), false);
}

{
    const { elements, storage } = createHarness();

    elements.get('newWebsite').value = 'https://persist.example/path';
    elements.get('addHostname').click();
    assert.ok(JSON.parse(storage.get(HOSTS_KEY)).includes('persist.example'));

    const firstRemoveButton = elements.get('websiteList').children[0].children[1];
    firstRemoveButton.click();
    assert.equal(JSON.parse(storage.get(HOSTS_KEY)).includes('google.com'), false);

    elements.get('resetHostnames').click();
    assert.deepEqual(JSON.parse(storage.get(HOSTS_KEY)).slice(0, 2), ['google.com', 'youtube.com']);
}

{
    const { context, storage } = createHarness();
    context.fetch = async (_input, options = {}) => ({
        ok: options.mode === 'cors',
        type: options.mode === 'cors' ? 'cors' : 'opaque'
    });

    await context.checkServerCapabilities('Persisted DNS', 'https://persist.example/dns-query');
    const persisted = JSON.parse(storage.get(DOH_KEY));
    assert.ok(persisted.some(server =>
        server.name === 'Persisted DNS' &&
        server.url === 'https://persist.example/dns-query' &&
        server.type === 'get' &&
        server.allowCors === true
    ));
}

{
    const { context, elements } = createHarness({
        [HOSTS_KEY]: 'not-json',
        [DOH_KEY]: JSON.stringify([{ name: 'Invalid HTTP DNS', url: 'http://invalid.example/dns-query' }])
    });

    vm.runInNewContext('renderHostsList(); renderDoHList();', context);
    assert.equal(elements.get('websiteList').children[0].children[0].textContent, 'google.com');
    assert.equal(nodeText(elements.get('dohList').children[0].children[0].children[0]).endsWith('AdGuard'), true);
    assert.match(elements.get('dohList').children[0].children[0].children[1].textContent, /^Cyprus \(CY\)/);
}

{
    const { context } = createHarness();
    const profile = vm.runInNewContext('buildReliabilityProfile([], 3)', context);
    assert.equal(profile.status, 'failed');
    assert.match(profile.message, /current network/);
    assert.match(profile.message, /blocking|connectivity/i);
}

// Retired built-in endpoints must not survive saved settings or erase custom servers.
{
    const retired = [
        { name: 'Saved Mullvad', url: 'https://dns.mullvad.net/dns-query' },
        { name: 'Saved Mullvad Base', url: 'https://base.dns.mullvad.net/dns-query' }
    ];
    const custom = { name: 'Mullvad', url: 'https://custom.example/dns-query', type: 'get', allowCors: true, ips: ['192.0.2.10'] };
    const { context, storage } = createHarness({ [DOH_KEY]: JSON.stringify([...retired, custom]) });

    assert.deepEqual(JSON.parse(vm.runInNewContext('JSON.stringify(dnsServers)', context)), [custom]);
    vm.runInNewContext('persistDoHServers()', context);
    assert.deepEqual(JSON.parse(storage.get(DOH_KEY)), [custom]);

    const onlyRetired = createHarness({ [DOH_KEY]: JSON.stringify(retired) });
    assert.equal(vm.runInNewContext('dnsServers.length', onlyRetired.context), 26);
    assert.equal(vm.runInNewContext('dnsServers.some(server => server.url.includes("mullvad.net"))', onlyRetired.context), false);

    const empty = createHarness({ [DOH_KEY]: '[]' });
    assert.equal(vm.runInNewContext('dnsServers.length', empty.context), 0);
}

// Hostname bars preserve exact timings, scale from zero, and exclude failed queries.
{
    const { context, elements } = createHarness();
    context.results = [
        { website: 'fast.example', speed: 50 },
        { website: 'slow.example', speed: 200 },
        { website: 'zero.example', speed: 0 },
        { website: '<unsafe>&.example', speed: 'Unavailable' },
        { website: 'invalid.example', speed: NaN }
    ];
    vm.runInNewContext(`updateResult({
        name: 'Test DNS', url: 'https://test.example/dns-query', ips: [],
        speed: { min: 0, median: 50, avg: 83.33, max: 200 },
        reliability: { status: 'partial', successCount: 3, totalQueries: 5 },
        individualResults: results
    })`, context);
    const html = elements.get('resultsBody').children[1].innerHTML;
    const widths = [...html.matchAll(/width: ([\d.]+)%/g)].map(match => Number(match[1]));
    assert.deepEqual(widths, [25, 100, 0]);
    assert.match(html, /50\.00 ms/);
    assert.match(html, /200\.00 ms/);
    assert.match(html, /0\.00 ms/);
    assert.match(html, /&lt;unsafe&gt;&amp;\.example/);
    assert.equal((html.match(/Unavailable/g) || []).length, 2);
    assert.doesNotMatch(html, /NaN|Infinity|<unsafe>/);
    assert.match(vm.runInNewContext('hostnameBreakdownHTML([])', context), /No hostname results/);
    assert.match(vm.runInNewContext('hostnameBreakdownHTML([{ website: "failed.example", speed: null }])', context), /No successful responses/);
    assert.doesNotMatch(vm.runInNewContext('hostnameBreakdownHTML([{ website: "zero.example", speed: 0 }])', context), /NaN|Infinity/);
}

// Settings transfer validates the whole file and preserves existing data on failure.
{
    const { context, elements, storage } = createHarness({
        [HOSTS_KEY]: JSON.stringify(['original.example']),
        [DOH_KEY]: JSON.stringify([{ name: 'Original DNS', url: 'https://original.example/dns-query' }])
    });
    const original = new Map(storage);
    const snapshot = vm.runInNewContext('exportSettingsJSON()', context);
    assert.deepEqual(JSON.parse(snapshot).hostnames, ['original.example']);
    assert.equal(JSON.parse(snapshot).dohServers[0].url, 'https://original.example/dns-query');
    const settings = {
        version: 1, hostnames: ['Example.ORG', 'https://example.org/path', 'second.example'],
        dohServers: [{ name: 'Imported DNS', url: 'https://imported.example/dns-query', type: 'get', allowCors: true, ips: ['192.0.2.10'] }]
    };
    context.payload = JSON.stringify(settings);
    const invalid = [
        'not-json', 'null', '{}',
        JSON.stringify({ ...settings, version: 2 }),
        JSON.stringify({ ...settings, hostnames: ['not a host'] }),
        JSON.stringify({ ...settings, dohServers: [{ name: 'HTTP DNS', url: 'http://invalid.example' }] }),
        JSON.stringify({ ...settings, dohServers: [{ ...settings.dohServers[0], allowCors: 'true' }] })
    ];
    for (const payload of invalid) {
        context.invalidPayload = payload;
        assert.throws(() => vm.runInNewContext('importSettingsJSON(invalidPayload)', context));
        assert.deepEqual(storage, original);
    }
    context.confirm = () => false;
    assert.equal(vm.runInNewContext('importSettingsJSON(payload)', context), false);
    assert.deepEqual(storage, original);
    context.confirm = () => true;
    const originalSetItem = context.localStorage.setItem;
    context.localStorage.setItem = (key, value) => {
        if (key === DOH_KEY) throw new Error('Quota exceeded');
        originalSetItem(key, value);
    };
    assert.throws(() => vm.runInNewContext('importSettingsJSON(payload)', context), /unchanged/);
    assert.deepEqual(storage, original);
    assert.equal(vm.runInNewContext('topWebsites[0]', context), 'original.example');
    context.localStorage.setItem = originalSetItem;
    vm.runInNewContext('testRunning = true', context);
    assert.throws(() => vm.runInNewContext('importSettingsJSON(payload)', context), /finish/);
    assert.deepEqual(storage, original);
    vm.runInNewContext('testRunning = false', context);
    assert.equal(vm.runInNewContext('importSettingsJSON(payload)', context), true);
    assert.deepEqual(JSON.parse(storage.get(HOSTS_KEY)), ['example.org', 'second.example']);
    assert.deepEqual(JSON.parse(storage.get(DOH_KEY)), settings.dohServers);
    assert.equal(elements.get('checkButton').disabled, false);
    const roundTrip = vm.runInNewContext('exportSettingsJSON()', context);
    const reloaded = createHarness(Object.fromEntries(storage));
    assert.deepEqual(JSON.parse(vm.runInNewContext('exportSettingsJSON()', reloaded.context)), JSON.parse(roundTrip));
    context.emptyServers = JSON.stringify({ version: 1, hostnames: ['example.org'], dohServers: [] });
    vm.runInNewContext('importSettingsJSON(emptyServers)', context);
    assert.equal(elements.get('checkButton').disabled, true);
    assert.deepEqual(JSON.parse(storage.get(DOH_KEY)), []);
    vm.runInNewContext('importSettingsJSON(JSON.stringify({version:1,hostnames:[],dohServers:[]}))', context);
    assert.deepEqual(JSON.parse(storage.get(HOSTS_KEY)), []);
}

// A failed second write must also restore the absence of a hostname key.
{
    const { context, storage } = createHarness();
    const setItem = context.localStorage.setItem;
    context.localStorage.setItem = (key, value) => {
        if (key === DOH_KEY) throw new Error('Quota exceeded');
        setItem(key, value);
    };
    assert.throws(() => vm.runInNewContext('importSettingsJSON(JSON.stringify({version:1,hostnames:["example.org"],dohServers:[]}))', context), /unchanged/);
    assert.equal(storage.has(HOSTS_KEY), false);
    assert.equal(storage.has(DOH_KEY), false);
}

// Every supported URL hostname must also survive storage and settings transfer.
{
    const { context, elements, storage } = createHarness();
    for (const value of ['https://пример.рф', 'https://localhost', 'https://example.com.']) {
        elements.get('newWebsite').value = value;
        elements.get('addHostname').click();
    }
    context.backup = vm.runInNewContext('exportSettingsJSON()', context);
    assert.doesNotThrow(() => vm.runInNewContext('importSettingsJSON(backup)', context));
    const reloaded = createHarness(Object.fromEntries(storage));
    const restored = JSON.parse(vm.runInNewContext('exportSettingsJSON()', reloaded.context));
    assert.ok(restored.hostnames.includes('xn--e1afmkfd.xn--p1ai'));
    assert.ok(restored.hostnames.includes('localhost'));
    assert.ok(restored.hostnames.includes('example.com.'));
}

// Hostnames differing only by case are the same host: adding one must be rejected as a duplicate,
// and the session list must match what is restored after a reload.
{
    const { elements, storage } = createHarness();
    for (const value of ['Google.com', 'GOOGLE.COM', 'https://Google.com/path', 'New.Example']) {
        elements.get('newWebsite').value = value;
        elements.get('addHostname').click();
    }
    const saved = JSON.parse(storage.get(HOSTS_KEY));
    // google.com is already a default, so only the new host is added, stored in lowercase.
    assert.equal(saved.filter(host => host.toLowerCase() === 'google.com').length, 1);
    assert.ok(saved.includes('new.example'));
    assert.deepEqual(saved, saved.map(host => host.toLowerCase()));
    const reloaded = createHarness(Object.fromEntries(storage));
    assert.deepEqual(JSON.parse(vm.runInNewContext('JSON.stringify(topWebsites)', reloaded.context)), saved);
}

console.log('Settings persistence tests passed');
