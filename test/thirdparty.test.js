import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { applyExtras, listingFromHtml, sourceKind, cleanPhotoList, directoryFacts } from '../lib/thirdparty.js';
import { extractProfile } from '../lib/extract.js';
import { LIBRARY } from '../public/engine/index.js';

const listing = fs.readFileSync(new URL('./fixtures/listing.html', import.meta.url), 'utf8'), market = fs.readFileSync(new URL('./fixtures/market.html', import.meta.url), 'utf8');
const sample = fs.readFileSync(new URL('./fixtures/sample.html', import.meta.url), 'utf8');
const fetcher = map => async u => { const k = Object.keys(map).find(x => u.startsWith(x)); if (!k) throw new Error('403 blocked'); return { text: map[k], url: u }; };
const empty = () => ({ name: 'Mystery Co', host: 'mystery.test', url: 'https://mystery.test', colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {}, sections: [], description: '' });

test('sources are labelled by kind', () => {
  assert.equal(sourceKind('https://www.practo.com/pune/doctor/x'), 'doctor directory'); assert.equal(sourceKind('https://www.justdial.com/Pune/x'), 'business directory');
  assert.equal(sourceKind('https://www.indiamart.com/panchal/'), 'supplier marketplace'); assert.equal(sourceKind('https://example.com'), 'website');
});
test('a doctor directory listing yields name, rating, hours, reviews, doctor and photos from structured data', () => {
  const l = listingFromHtml(listing, 'https://www.practo.com/pune/clinic/smile-hub');
  assert.equal(l.name, 'Smile Hub Dental Clinic'); assert.equal(l.rating.value, 4.7); assert.equal(l.rating.count, 184); assert.ok(l.phones[0].includes('98200')); assert.match(l.address, /Baner/);
  assert.ok(l.doctors.some(d => /Meera Shah/.test(d.name))); assert.equal(l.reviews.length, 1); assert.ok(l.images.includes('https://img.example/clinic.jpg')); assert.equal(l.facts.experience, '14 Years'); assert.ok(l.social.facebook);
});
test('marketplace facts: only exact facts are kept', () => { const f = directoryFacts(market); assert.equal(f.established, 2005); assert.equal(f.nature, 'Manufacturer'); });
test('photo links are validated', () => { assert.deepEqual(cleanPhotoList('https://a.test/x.jpg javascript:alert(1) ftp://x data:image/png;base64,AAAA'), ['https://a.test/x.jpg', 'data:image/png;base64,AAAA']); });

test('a useless main site is filled from a directory listing, the industry follows it, and the designs show the real details', async () => {
  const p = { ...empty(), name: 'mystery.test' }; const r = await applyExtras(p, { sources: ['https://www.practo.com/pune/clinic/smile-hub'], fetcher: fetcher({ 'https://www.practo.com': listing }) });
  const q = r.profile; assert.equal(q.industry, 'dentists'); assert.equal(q.name, 'Smile Hub Dental Clinic'); assert.equal(q.clinic.rating.value, 4.7); assert.ok(q.clinic.doctors.some(d => /Meera/.test(d.name))); assert.ok(q.contacts.phones.length); assert.ok(q.images.length);
  assert.ok(r.notes.some(n => /doctor directory/.test(n)));
  const t = LIBRARY.find(x => x.id === 'clinic-compass'); const html = t.render(q, { industry: 'dentists' }); assert.match(html, /Smile Hub Dental Clinic/); assert.match(html, /Dr Meera Shah/); assert.match(html, /4\.7/);
});
test('a supplier marketplace page supplies products, years in business and the industry', async () => {
  const r = await applyExtras(empty(), { sources: ['https://www.indiamart.com/panchal-recycling/'], fetcher: fetcher({ 'https://www.indiamart.com': market }) }); const q = r.profile;
  assert.equal(q.industry, 'recycling'); assert.ok(q.products.some(x => /Shredder/.test(x.name))); assert.ok(q.stats.some(s => /Years in business/.test(s.label) && s.value === new Date().getFullYear() - 2005));
});
test("the client's existing website can supply the content, while a user chosen industry stays", async () => {
  const p = empty(); p.industry = 'electronics'; p.industryInfo = { forced: true, confidence: 1 };
  const r = await applyExtras(p, { sources: ['https://old.example/'], fetcher: fetcher({ 'https://old.example': sample }) }); const q = r.profile;
  assert.equal(q.industry, 'electronics'); assert.ok(q.products.length >= 3, 'products from the old site'); assert.ok(q.description.length > 20);
});
test('own photos go first, and a blocked site is reported instead of failing the build', async () => {
  const r = await applyExtras(empty(), { sources: ['https://blocked.example/'], photos: ['https://me.test/a.jpg', 'javascript:x'], fetcher: fetcher({}) });
  assert.equal(r.profile.images[0].src, 'https://me.test/a.jpg'); assert.equal(r.profile.ogImage, 'https://me.test/a.jpg'); assert.equal(r.failed.length, 1); assert.match(r.failed[0].reason, /blocks|saved|403/i);
});
test('pasted page source is read like a fetched page', async () => {
  const r = await applyExtras(empty(), { html: listing + ' '.repeat(300), fetcher: fetcher({}) }); assert.equal(r.profile.industry, 'dentists'); assert.ok(r.profile.clinic.doctors.length);
});
