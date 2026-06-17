import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
    return {
        id,
        dataset: {},
        style: {},
        classList: createClassList(),
        children: [],
        parentElement: { style: {} },
        nextElementSibling: null,
        disabled: false,
        value: '',
        innerHTML: '',
        textContent: '',
        addEventListener: () => {},
        append: function (...children) { this.children.push(...children); },
        appendChild: function (child) { this.children.push(child); return child; },
        remove: () => {},
        setAttribute: () => {},
        focus: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        getContext: () => ({})
    };
}

const elements = new Map();
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

let now = 0;
const context = {
    console,
    URL,
    AbortController,
    Uint8Array,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    crypto: {
        getRandomValues: array => {
            array.fill(0);
            return array;
        }
    },
    performance: {
        now: () => {
            now += 10;
            return now;
        }
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
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

function headerValue(headers, name) {
    if (!headers) return undefined;
    if (typeof headers.get === 'function') return headers.get(name);
    const key = Object.keys(headers).find(candidate => candidate.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
}

async function captureMeasure(...args) {
    const calls = [];
    context.fetch = async (input, options = {}) => {
        calls.push({ input: String(input), options });
        return {
            ok: true,
            status: 200,
            type: options.mode === 'cors' ? 'cors' : 'opaque'
        };
    };

    const result = await context.measureDNSSpeed(...args);
    assert.equal(typeof result, 'number');
    assert.equal(calls.length, 1);
    return calls[0];
}

let call = await captureMeasure('https://root.hagezi.org/dns-query', 'example.com', 'get', false);
assert.equal(call.options.method, 'GET');
assert.equal(call.options.mode, 'no-cors');
assert.equal(headerValue(call.options.headers, 'Accept'), 'application/dns-message');
assert.match(call.input, /[?&]dns=/);

call = await captureMeasure('https://root.hagezi.org/dns-query', 'example.com', 'post', false);
assert.equal(call.options.method, 'GET');
assert.equal(call.options.mode, 'no-cors');
assert.equal(headerValue(call.options.headers, 'Accept'), 'application/dns-message');
assert.match(call.input, /[?&]dns=/);

call = await captureMeasure('https://root.hagezi.org/dns-query', 'example.com', 'post', true);
assert.equal(call.options.method, 'POST');
assert.equal(call.options.mode, 'cors');
assert.equal(headerValue(call.options.headers, 'Content-Type'), 'application/dns-message');
assert.equal(headerValue(call.options.headers, 'Accept'), 'application/dns-message');
assert.ok(call.options.body instanceof Uint8Array);

call = await captureMeasure('https://dns.google/resolve', 'example.com', 'get', false);
assert.equal(call.options.method, 'GET');
assert.equal(call.options.mode, 'no-cors');
assert.equal(headerValue(call.options.headers, 'Accept'), 'application/dns-json');
assert.match(call.input, /[?&]name=example\.com/);
assert.match(call.input, /[?&]type=A/);

console.log('DoH request option tests passed');
