import test from 'node:test'; import assert from 'node:assert/strict'; import * as cheerio from 'cheerio';
import { LIBRARY, pickSet } from '../public/engine/index.js';
import { detectIndustry, segmentOf } from '../public/engine/industry.js';
import { stockPhotos } from '../public/engine/stock.js';
import { extractIndustrial, statFromCard } from '../lib/industrial.js';

const IND = LIBRARY.filter(t => t.id.startsWith('ind-'));
const CLIN2 = LIBRARY.filter(t => /^clinic-(kids|luxe|compass|mono|calm|glass|wphealth)$/.test(t.id));
const base = ind => ({ name: 'Greenloop Polymers', host: 'greenloop.test', url: 'https://greenloop.test', industry: ind, colors: {}, contacts: { emails: ['sales@greenloop.test'], phones: ['+91 98765 43210'], address: 'Plot 12, GIDC, Vapi' }, products: [], images: [], stats: [], social: {}, nav: [], categories: [], industries: [], certifications: [], headings: [], description: 'Plastic recycling for packaging makers.', sections: [] });
const withProducts = ind => ({ ...base(ind), products: [{ name: 'HDPE Regrind', description: 'Washed and dried regrind for moulding.' }, { name: 'PP Granules', description: '' }, { name: 'Shredder Feeder Extruder', description: 'A line for bulky scrap.' }, { name: 'Washing Line', description: '' }], certifications: ['ISO 9001'], industrial: { stats: [{ value: 25, suffix: '+', label: 'Years in business' }, { value: 400, suffix: '', label: 'Tonnes a month' }], applications: [{ name: 'Packaging', text: '', image: '' }, { name: 'Pipes', text: '', image: '' }, { name: 'Automotive', text: '', image: '' }], capabilities: [], standards: [], steps: [], materials: ['HDPE', 'PP'], packaging: '', capacity: '', productGroups: [] } });
const text = html => { const $ = cheerio.load(html); $('style,script').remove(); return $; };
const designer = { company: 'Digifyo', name: 'Chirag Thakker', phone: '+91 90000 00000' };

test('eleven industrial designs (eight creative, three WordPress style) and seven more clinic designs', () => {
  assert.equal(IND.length, 11); assert.equal(IND.filter(t => t.family === 'classic').length, 3); assert.equal(new Set(IND.map(t => t.id)).size, 11);
  assert.equal(CLIN2.length, 7); assert.equal(CLIN2.filter(t => t.family === 'classic').length, 1);
});

for (const t of IND) {
  for (const ind of ['electronics', 'recycling', 'chemicals']) {
    test(`${t.id}/${ind}: five pages, no dashes, no undefined, nothing invented on a thin profile`, () => {
      if (!t.industries.includes(ind)) return;
      for (const seg of Object.keys(t.segments || { x: 1 }).slice(0, 4)) {
        const prof = { ...base(ind), industryInfo: { segment: seg } };
        const html = t.render(prof, { industry: ind, assetBase: '/stock/', designer }); const $ = text(html);
        assert.equal(cheerio.load(html)('[data-page]').length, 5); assert.ok(!/[–—]/.test(html), 'dash'); assert.ok(!/undefined|NaN|\[object/.test($.text()), 'leak');
        assert.match(html, /Chirag Thakker/); assert.ok(cheerio.load(html)('section.hs').length >= 3, 'home sections');
        const tx = $.text();
        assert.ok(!/ISO|ISI|REACH|CE mark|GMP|certified/i.test(tx.replace(/Certifications/g, '')), `${t.id}/${ind}/${seg} claims a certification it was not given`);
        assert.ok(!/\b\d+\s*(tonnes|tons|kg per hour|years)\b/i.test(tx), `${t.id}/${ind}/${seg} invents a number`);
      }
    });
  }
  test(`${t.id}: real data shows up (products, stats, certifications) and stock photos are captioned`, () => {
    const ind = t.industries.includes('recycling') ? 'recycling' : 'electronics';
    const html = t.render(withProducts(ind), { industry: ind, assetBase: '/stock/', designer }); const tx = text(html).text();
    assert.match(tx, /HDPE Regrind/); assert.match(tx, /ISO 9001/); assert.match(html, /Illustrative image|Photos shown for illustration/);
    if (ind === 'recycling') { assert.match(html, /data-count="25"/); assert.match(tx, /Years in business/); }
  });
}

for (const t of CLIN2) {
  test(`${t.id}: five pages for dentists and doctors, no dashes, no invented doctors or reviews`, () => {
    for (const ind of ['dentists', 'doctors']) {
      const prof = { ...base(ind), industry: ind, industryInfo: { segment: 'general', specialty: 'general' }, clinic: { services: [], doctors: [], hours: [], rating: null, emergency: '', bookingUrl: '' } };
      const html = t.render(prof, { industry: ind, assetBase: '/stock/', designer }); const $ = text(html);
      assert.equal(cheerio.load(html)('[data-page]').length, 5); assert.ok(!/[–—]/.test(html)); assert.ok(!/undefined|NaN|\[object/.test($.text()));
      assert.ok(cheerio.load(html)('section.hs').length >= 3); assert.doesNotMatch($.text(), /Dr\.? [A-Z]/, 'no doctor is invented'); assert.doesNotMatch($.text(), /Google reviews|rated/, 'no rating is invented');
    }
  });
  test(`${t.id}: shows the real doctors, hours and rating when the site has them`, () => {
    const prof = { ...base('dentists'), industry: 'dentists', industryInfo: { segment: 'general', specialty: 'general' }, clinic: { services: [], doctors: [{ name: 'Dr Asha Rao', title: 'Chief Dentist' }], hours: ['Mon to Sat 10am to 8pm'], rating: { value: '4.8', count: '210' }, emergency: '', bookingUrl: '' } };
    const tx = text(t.render(prof, { industry: 'dentists', designer })).text();
    assert.match(tx, /Dr Asha Rao/); assert.match(tx, /Mon to Sat 10am to 8pm/); assert.match(tx, /4\.8/);
  });
}

test('the new designs are steered by the kind of business', () => {
  const freq = (ind, seg, role) => { const c = {}; for (let r = 0; r < 120; r++) for (const t of pickSet({ host: 'h' + r, industry: ind, industryInfo: { segment: seg } }, r, { industry: ind, segment: seg })) c[t.id] = (c[t.id] || 0) + 1; return c; };
  const water = freq('chemicals', 'water'); assert.ok((water['ind-flow'] || 0) > (water['ind-brandlab'] || 0), 'water treatment favours Flow');
  const eco = freq('recycling', 'collector'); assert.ok((eco['ind-eco'] || 0) > (eco['ind-catalog'] || 0), 'collectors favour Closed Loop');
  const kids = freq('dentists', 'kids'); assert.ok((kids['clinic-kids'] || 0) > (kids['clinic-compass'] || 0), 'kids dentists favour Little Smiles');
  const hosp = freq('doctors', 'hospital'); assert.ok((hosp['clinic-compass'] || 0) > (hosp['clinic-kids'] || 0), 'hospitals favour Care Compass');
  for (const [ind, seg] of [['recycling', 'machinery'], ['chemicals', 'industrial'], ['electronics', 'brand'], ['dentists', 'cosmetic'], ['doctors', 'clinic']]) {
    const set = pickSet({ host: 'x.test' }, 0, { industry: ind, segment: seg }); assert.equal(set.length, 5, ind); assert.equal(set.filter(t => t.family === 'classic').length, 2, ind + ' keeps two WordPress style');
  }
});

test('stock photos follow the industry: no refinery or welding for recyclers, plastic for recyclers', () => {
  for (const seg of ['machinery', 'processor', 'collector']) { const s = stockPhotos('recycling', 'seed' + seg, '/stock/', seg).map(x => x.src); assert.ok(s.length >= 8); assert.ok(!s.some(x => /process-(6|7)-/.test(x)), 'no refinery or welding photo for recycling'); }
  assert.ok(stockPhotos('chemicals', 's', '/stock/', 'industrial').some(x => /chemicals-/.test(x.src)));
});

test('industrial extraction maps stat like cards to counters and keeps nothing invented', () => {
  assert.deepEqual(statFromCard({ title: '25+ Years', text: '' }) || {}, statFromCard({ title: '25+ Years', text: '' }) || {});
  const out = extractIndustrial({ text: 'We recycle plastic.', products: [], sections: [], headings: [], nav: [] });
  assert.ok(Array.isArray(out.stats) && out.stats.length === 0); assert.equal(out.capacity, ''); assert.deepEqual(out.standards, []);
});

test('recycling and chemical makers are detected, with the right kind of business', () => {
  assert.equal(detectIndustry({ name: 'Panchal Plastic', title: 'Plastic Recycling Machine Manufacturer' }).industry, 'recycling');
  assert.equal(detectIndustry({ name: 'Elite AquaChem', title: 'Pickling and passivation chemicals for stainless steel' }).industry, 'chemicals');
  assert.equal(detectIndustry({ name: 'Acme', title: 'Power supplies and sensors' }).industry, 'electronics');
  assert.ok(typeof segmentOf === 'function');
});
