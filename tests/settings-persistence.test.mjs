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
            setItem: (key, value) => storage.set(key, value)
        },
        navigator: {
            clipboard: { writeText: async () => {} }
        },
        document,
        Chart: function Chart() {},
        addEventListener: () => {},
        matchMedia: () => ({ matches: false })
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

    assert.equal(providers.length, 28);
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

console.log('Settings persistence tests passed');
