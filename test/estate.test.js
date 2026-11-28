import test from 'node:test'; import assert from 'node:assert/strict'; import * as cheerio from 'cheerio';
import { LIBRARY, pickSet } from '../public/engine/index.js';
import { detectIndustry, signalsFromLinks } from '../public/engine/industry.js';
import { parsePrice, parseArea, parseConfig, parseRera, extractEstate } from '../lib/estate.js';
import { buildIntakeProfile } from '../lib/intake.js';

const ESTATE = LIBRARY.filter(t => t.industries.includes('realestate'));
const SEGS = ['residential', 'luxury', 'commercial', 'plots', 'mixed'];
const base = { name: 'Skyline Builders', host: 'skyline.test', url: 'https://skyline.test', industry: 'realestate', colors: {}, contacts: { emails: ['a@skyline.test'], phones: ['+91 98765 43210'], address: '12 MG Road, Pune' }, products: [], images: [], stats: [], social: {}, nav: [], categories: [], industries: [], certifications: [], headings: [], sections: [], description: 'A developer building homes across the city. Founded by two engineers who wanted fewer surprises.' };
const withProjects = seg => ({ ...base, industryInfo: { segment: seg, role: 'developer' }, estate: { projects: [{ name: 'Skyline Heights', location: 'Baner', config: '2 BHK, 3 BHK', area: '950 to 1,300 sq ft', price: '₹85 Lakh', status: 'Under construction', description: 'Two towers with open green space.' }, { name: 'Green Acres', location: 'Hinjewadi', config: '1 BHK, 2 BHK', area: '620 to 900 sq ft', status: 'Ready to move' }, { name: 'Lakeview Villas', location: 'Lonavala', config: '4 BHK', status: 'New launch' }], rera: ['P52100012345'], locations: ['Baner', 'Hinjewadi', 'Lonavala'], configs: ['1 BHK', '2 BHK', '3 BHK'], amenities: ['Gym', 'Clubhouse', 'Covered parking'] } });
const bare = seg => ({ ...base, industryInfo: { segment: seg, role: 'agency' }, estate: { projects: [], rera: [], locations: [], configs: [], amenities: [] } });
const text = html => { const $ = cheerio.load(html); $('style,script').remove(); return $; };

test('twelve real estate designs: ten creative and two plain WordPress style', () => {
  assert.equal(ESTATE.length, 12); assert.equal(ESTATE.filter(t => t.family === 'classic').length, 2); assert.equal(new Set(ESTATE.map(t => t.id)).size, 12);
});
for (const t of ESTATE) {
  test(`${t.id}: five pages, no dashes, no repeated lines, no undefined, for every segment with and without projects`, () => {
    for (const seg of SEGS) for (const prof of [withProjects(seg), bare(seg)]) {
      const html = t.render(prof, { assetBase: '/stock/', designer: { company: 'Digifyo', name: 'Chirag Thakker', phone: '+91 90000 00000' } }); const $ = text(html);
      assert.equal(cheerio.load(html)('[data-page]').length, 5, seg); assert.ok(cheerio.load(html)('a[data-go]').length >= 5);
      assert.ok(!/[–—]/.test(html), `${t.id}/${seg} has a dash`); assert.ok(!/undefined|NaN|\[object/.test($.text()), `${t.id}/${seg} leaks undefined`);
      assert.ok(cheerio.load(html)('section.hs').length >= 3, 'home sections'); assert.match(html, /Chirag Thakker/);
      const seen = new Map(); const skip = new Set(['skyline builders', 'skyline heights', 'green acres', 'lakeview villas']);
      $('p,h1,h2,h3,h4,.lead').each((_, el) => { const x = $(el).text().replace(/\s+/g, ' ').trim(); if (x.length < 14 || skip.has(x.toLowerCase())) return; seen.set(x, (seen.get(x) || 0) + 1); });
      const dupes = [...seen].filter(([, n]) => n > 1).map(([x]) => x); assert.deepEqual(dupes, [], `${t.id}/${seg} repeated: ${dupes.join(' | ')}`);
    }
  });
  test(`${t.id}: nothing is invented when the data is thin`, () => {
    const html = t.render(bare('residential'), {}); const tx = text(html).text();
    assert.ok(!/₹|\$\d|RERA registered|P5\d{10}|Swimming pool|sq ft\b.*\d/.test(tx), 'no price, RERA number, amenity or area appeared from nowhere');
    assert.ok(!/Under construction|Ready to move|New launch/.test(tx), 'no invented status');
  });
  test(`${t.id}: stock photos follow the segment, own photos come first`, () => {
    const com = t.render(bare('commercial'), { assetBase: 'https://x.test/stock/' }); assert.match(com, /stock\/realestate-com-\d+-l\.jpg/);
    const plots = t.render(bare('plots'), { assetBase: 'https://x.test/stock/' }); assert.match(plots, /stock\/realestate-(land|res)-\d+-l\.jpg/);
    const own = t.render({ ...bare('residential'), ogImage: 'https://skyline.test/hero.jpg', images: [{ src: 'https://skyline.test/a.jpg', w: 1600 }] }, {}); assert.ok(own.includes('https://skyline.test/hero.jpg'));
  });
  test(`${t.id}: hostile input is escaped`, () => {
    const evil = '"><script>alert(1)</script><img src=x onerror=alert(2)>';
    const html = t.render({ ...bare('residential'), name: evil, description: evil, about: evil, logo: 'javascript:alert(3)', ogImage: 'javascript:alert(4)', estate: { projects: [{ name: evil, location: evil, config: evil, status: evil, image: 'javascript:alert(5)', url: 'javascript:alert(6)' }], rera: [evil], locations: [evil], configs: [evil], amenities: [evil] } }, {});
    const $ = cheerio.load(html); assert.equal($('img[src="x"]').length, 0); $('script').each((_, el) => assert.ok(!/<\/?script/i.test($(el).html() || '')));
    $('*').each((_, el) => { for (const [k, v] of Object.entries(el.attribs || {})) { if (/^on/i.test(k)) assert.match(v, /^this\.onerror=null;|^this\.replaceWith|^this\.remove\(\)|^this\.closest|^document\./, `${k}=${v}`); if (['href', 'src'].includes(k)) assert.ok(!/^\s*javascript:/i.test(v)); } });
  });
}
test('widgets exist only when they have something to work with', () => {
  const q = (html, sel) => cheerio.load(html)(sel).length;
  const home = ESTATE.find(t => t.id === 'estate-homestead'); const a = home.render(withProjects('residential'), {}); assert.ok(q(a, '[data-emi]') >= 1); assert.ok(q(a, 'form[data-search]') >= 1); assert.ok(q(a, 'button[data-f]') >= 3);
  const wp = ESTATE.find(t => t.id === 'estate-workplace').render(withProjects('commercial'), {}); assert.ok(q(wp, '[data-area]') >= 1);
  const none = home.render(bare('residential'), {}); assert.equal(q(none, 'form[data-search]'), 0, 'no search form without locations or sizes'); assert.equal(q(none, 'button[data-f]'), 0, 'no filter chips without projects');
});
test('segment and role steer which designs are suggested, and shuffle still varies', () => {
  const freq = (seg, role, id) => { let n = 0; for (let i = 0; i < 40; i++) if (pickSet({ host: 'h' + i, industry: 'realestate', industryInfo: { segment: seg, role } }, 0).some(t => t.id === id)) n++; return n; };
  assert.ok(freq('plots', 'developer', 'estate-terra') >= 30, 'terra for plots'); assert.ok(freq('commercial', 'agency', 'estate-workplace') >= 30, 'workplace for commercial');
  assert.ok(freq('residential', 'developer', 'estate-terra') < freq('plots', 'developer', 'estate-terra'), 'terra is less likely for homes');
  assert.ok(freq('residential', 'agency', 'estate-portal') > freq('residential', 'developer', 'estate-portal'), 'listings portal favours agencies');
  const p = { host: 'x.test', industry: 'realestate', industryInfo: { segment: 'residential', role: 'developer' } }; assert.notDeepEqual(pickSet(p, 0).map(t => t.id), pickSet(p, 1).map(t => t.id));
  assert.equal(pickSet(p, 0).length, 5); assert.equal(pickSet(p, 0).filter(t => t.family === 'classic').length, 2);
  const ele = i => pickSet({ host: 'e' + i, industry: 'electronics', industryInfo: { segment: 'brand' } }, 0).filter(t => ['kinetic', 'aurora'].includes(t.id)).length; let s = 0; for (let i = 0; i < 40; i++) s += ele(i);
  const man = i => pickSet({ host: 'e' + i, industry: 'electronics', industryInfo: { segment: 'manufacturer' } }, 0).filter(t => ['kinetic', 'aurora'].includes(t.id)).length; let s2 = 0; for (let i = 0; i < 40; i++) s2 += man(i); assert.ok(s > s2, 'consumer brands get the bolder electronics designs');
});
test('real estate and its segment are detected from any signal', () => {
  const d = detectIndustry({ name: 'Prime Commercial Spaces', text: 'Office space for lease, retail showrooms and a business park. Leasing consultants.' }); assert.equal(d.industry, 'realestate'); assert.equal(d.segment, 'commercial'); assert.equal(d.role, 'agency');
  assert.equal(detectIndustry({ name: 'GreenAcres', text: 'NA plots, farmland and plotted layouts. Land survey, plots from 1200 sq ft' }).segment, 'plots');
  assert.equal(detectIndustry({ name: 'Skyline Builders and Developers', text: '2 BHK apartments. RERA registered residential projects with possession in 2026.' }).role, 'developer');
  assert.equal(detectIndustry({ name: 'Elite Luxury Villas', text: 'Premium villas, penthouses and waterfront luxury residences by the developers.' }).segment, 'luxury');
  assert.equal(detectIndustry({ category: 'Real estate agency' }).industry, 'realestate'); assert.equal(detectIndustry({ ldTypes: ['RealEstateAgent'] }).industry, 'realestate');
  assert.equal(detectIndustry({ name: 'City Multispeciality Hospital', text: 'hospital multispeciality medical centre diagnostics' }).segment, 'hospital');
  assert.equal(detectIndustry({ name: 'Sunrise Software developers', text: 'app developers building SaaS' }).industry, '', 'software developers are not real estate developers');
  assert.equal(detectIndustry({ name: 'X', hint: 'realestate', segment: 'plots' }).segment, 'plots');
});
test('estate facts are read only when present', () => {
  assert.equal(parsePrice('Starting from ₹85 Lakh onwards'), '₹85 Lakh'); assert.equal(parsePrice('call 98765 43210'), ''); assert.equal(parseArea('1,050 to 1,420 sq ft'), '1,050 to 1,420 sq ft'); assert.deepEqual(parseConfig('2 & 3 BHK flats'), ['2 BHK', '3 BHK']); assert.deepEqual(parseRera('MahaRERA No: P52100012345'), ['P52100012345']);
  const e = extractEstate({ text: 'Swimming pool and gym. P52100012345', products: [{ name: 'Skyline Heights', description: '2 and 3 BHK apartments in Baner. Starting from ₹85 Lakh. Under construction.' }], headings: ['Apartments in Pune'] });
  assert.equal(e.projects[0].price, '₹85 Lakh'); assert.equal(e.projects[0].location, 'Baner'); assert.equal(e.projects[0].status, 'Under construction'); assert.deepEqual(e.amenities.slice(0, 2), ['Swimming pool', 'Gym']); assert.ok(e.locations.includes('Pune'));
  const none = extractEstate({ text: 'We build things.', products: [], headings: [] }); assert.deepEqual([none.projects.length, none.rera.length, none.amenities.length], [0, 0, 0]);
});
test('a project sheet becomes real estate projects, and links give names without being fetched', () => {
  const rows = [['Project', 'Location', 'Configuration', 'Price', 'Status'], ['Skyline Heights', 'Baner, Pune', '2, 3 BHK', 'Starting ₹85 Lakh', 'Under construction']];
  const p = buildIntakeProfile({ name: 'Skyline Builders', host: 'x.test', rows, notes: 'RERA registered residential developer, apartments and flats' });
  assert.equal(p.industry, 'realestate'); assert.equal(p.industryInfo.role, 'developer'); assert.equal(p.estate.projects[0].price, '₹85 Lakh'); assert.equal(p.estate.projects[0].config, '2 BHK, 3 BHK'); assert.equal(p.estate.projects[0].status, 'Under construction');
  assert.equal(signalsFromLinks({ gmbUrl: 'https://www.google.com/maps/place/Skyline+Realty/@18.5,73.8' }).name, 'Skyline Realty');
});
