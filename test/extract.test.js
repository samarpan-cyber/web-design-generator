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
