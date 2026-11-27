import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { LIBRARY } from '../public/engine/index.js';
import { stockPhotos, goodPhoto, stockIndustries } from '../public/engine/stock.js';

const base = { name: 'Acme', host: 'acme.test', url: 'https://acme.test', colors: {}, nav: [], categories: [], products: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {} };
const dental = { ...base, industry: 'dentists', images: [] };
const imgs = html => [...html.matchAll(/(?:src="|url\(')([^"')]+\.(?:jpg|jpeg|png|webp)[^"')]*)/g)].map(m => m[1]);

test('every stock file exists, is a modest size and has a small twin', () => {
  const counts = { dentists: 10, doctors: 8, electronics: 9 };
  for (const [ind, n] of Object.entries(counts)) for (let k = 1; k <= n; k++) for (const t of ['l', 's']) {
    const f = new URL(`../public/stock/${ind}-${k}-${t}.jpg`, import.meta.url); const sz = fs.statSync(f).size;
    assert.ok(sz > 15_000 && sz < (t === 'l' ? 400_000 : 150_000), `${ind}-${k}-${t} ${sz}`);
  }
  assert.deepEqual(stockIndustries.slice().sort(), [...Object.keys(counts), 'realestate'].sort());
});
test('stock order is stable per site and different between sites', () => {
  const a = stockPhotos('dentists', 'a.test').map(x => x.src), b = stockPhotos('dentists', 'a.test').map(x => x.src), c = stockPhotos('dentists', 'zzz.test').map(x => x.src);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c); assert.equal(stockPhotos('unknown', 'x').length, 0);
  assert.ok(stockPhotos('doctors', 'x', 'https://crm.test/assets/stock')[0].src.startsWith('https://crm.test/assets/stock/doctors-'));
});
test('small or logo images are not treated as photos, unknown size is trusted', () => {
  assert.ok(!goodPhoto({ src: 'https://x.test/team-300x200.jpg', w: 300 })); assert.ok(!goodPhoto({ src: 'https://x.test/logo.png', w: 900 })); assert.ok(goodPhoto({ src: 'https://x.test/clinic.jpg', w: 0 })); assert.ok(goodPhoto({ src: 'https://x.test/clinic.jpg', w: 1400 }));
});
for (const t of LIBRARY.filter(x => x.industries.includes('dentists'))) {
  test(`${t.id}: no own photos gives stock photos, own good photos come first`, () => {
    const none = t.render(dental, { assetBase: 'https://crm.test/assets/stock/' }); assert.ok(imgs(none).some(u => u.startsWith('https://crm.test/assets/stock/dentists-')), 'stock used');
    const own = { ...dental, ogImage: 'https://acme.test/hero-1600.jpg', images: [{ src: 'https://acme.test/clinic-wide.jpg', alt: 'clinic', w: 1400 }, { src: 'https://acme.test/tiny-100x100.jpg', alt: 'x', w: 100 }] };
    const html = t.render(own, {}); const u = imgs(html);
    assert.ok(u.includes('https://acme.test/hero-1600.jpg'), 'own hero first');
    assert.ok(!u.includes('https://acme.test/tiny-100x100.jpg'), 'tiny image rejected');
  });
}
test('electronics sites with few photos get stock for the big slots, but products keep their own art', () => {
  const t = LIBRARY.find(x => x.id === 'bento'); const html = t.render({ ...base, industry: 'electronics', images: [], products: [{ name: 'VFD Drive X1', description: 'Smooth starts.', image: null, url: null }] }, { assetBase: '/stock/' });
  assert.ok(imgs(html).some(u => u.startsWith('/stock/electronics-')));
  const own = t.render({ ...base, images: [{ src: 'https://acme.test/a.jpg', w: 1500 }, { src: 'https://acme.test/b.jpg', w: 1500 }, { src: 'https://acme.test/c.jpg', w: 1500 }, { src: 'https://acme.test/d.jpg', w: 1500 }] }, {});
  assert.ok(!imgs(own).some(u => u.includes('/stock/')), 'no stock when the site has enough of its own');
});
