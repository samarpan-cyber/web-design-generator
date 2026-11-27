import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractProfile, normalizeUrl } from '../lib/extract.js';
import { isPrivateIp } from '../lib/fetcher.js';

const html = fs.readFileSync(new URL('./fixtures/sample.html', import.meta.url), 'utf8');
const fetcher = async u => ({ text: u.endsWith('.css') ? '' : html, url: u.startsWith('http') ? u : 'https://volt.example/' });

test('extracts a rich profile', async () => {
  const p = await extractProfile('volt.example', { fetcher });
  assert.equal(p.name, 'Volt Dynamics');
  assert.equal(p.colors.primary, '#e4572e');
  assert.equal(p.logo, 'https://volt.example/img/logo.png');
  assert.ok(p.products.length >= 6, 'products: ' + p.products.length);
  assert.ok(p.products.some(x => /VFD-X1/.test(x.name) && x.image));
  assert.deepEqual(p.categories.slice(0, 2), ['Solar Inverters', 'AC Motor Drives']);
  assert.ok(p.stats.some(s => s.value === 500));
  assert.ok(p.certifications.includes('ISO 9001'));
  assert.equal(p.contacts.emails[0], 'sales@voltdynamics.in');
  assert.ok(p.contacts.address.includes('Gandhinagar'));
  assert.ok(p.social.linkedin);
});
test('normalizeUrl', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com/');
  assert.throws(() => normalizeUrl('nodots'));
});
test('ssrf guard', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '169.254.169.254', '::1', 'fd00::1']) assert.ok(isPrivateIp(ip), ip);
  assert.ok(!isPrivateIp('8.8.8.8'));
});

test('ignores CMS default colours and falls back to menu labels when no products found', async () => {
  const page = `<html><head><title>Acme Wireless</title><style id="global-styles-inline-css">:root{--wp--preset--color--primary:#007cba}</style><style>.cta{background:#d4145a}.cta2{color:#d4145a}</style></head>
  <body><header><nav><ul><li><a href="/">Home</a></li><li><a href="/iot-modules">IOT Modules</a></li><li><a href="/sip">SIP</a></li><li><a href="/about">About</a></li><li><a href="/contact">Contact</a></li></ul></nav></header><main><h1>Wireless made simple</h1><p>Short.</p></main></body></html>`;
  const p = await extractProfile('acme.example', { fetcher: async u => ({ text: page, url: u.startsWith('http') ? u : 'https://acme.example/' }) });
  assert.equal(p.colors.primary, '#d4145a');
  assert.deepEqual(p.products.map(x => x.name).slice(0, 2), ['IOT Modules', 'SIP']);
  assert.ok(p.notes.some(n => /menu/.test(n)));
});

test('news-ticker links are not treated as products', async () => {
  const page = `<html><head><title>X Corp</title></head><body><main><div class="product-item"><a href="/n1"><img src="/a.jpg"><h3>Latest News</h3></a></div><div class="product-item"><a href="/p1"><img src="/b.jpg"><h3>Smart Relay SR-1</h3></a></div></main></body></html>`;
  const p = await extractProfile('x.example', { fetcher: async u => ({ text: page, url: u.startsWith('http') ? u : 'https://x.example/' }) });
  assert.ok(!p.products.some(x => /news/i.test(x.name)));
  assert.ok(p.products.some(x => /Smart Relay/.test(x.name)));
});

test('contact blocks are not used as the company description', async () => {
  const page = `<html><head><title>Y Ltd</title></head><body><main><p># 675, Sri Krishna Prowess, 14th Cross, JP Nagar, Bengaluru. Phone: 2659 2222, Fax: 91-80-2659 2220, Email: a@y.com</p><p>Y Ltd manufactures precision capacitors and crystals for industrial and automotive customers across India.</p></main></body></html>`;
  const p = await extractProfile('y.example', { fetcher: async u => ({ text: page, url: u.startsWith('http') ? u : 'https://y.example/' }) });
  assert.match(p.about, /manufactures precision capacitors/);
  assert.ok(!/Phone/.test(p.description));
});

test('company name ignores generic title segments like Home', async () => {
  const html = '<html><head><title>Home | Acme Power Systems</title></head><body><h1>Hi</h1></body></html>';
  const p = await extractProfile('acme-power.example', { fetcher: async u => ({ text: html, url: u.startsWith('http') ? u : 'https://acme-power.example/' }) });
  assert.equal(p.name, 'Acme Power Systems');
});
