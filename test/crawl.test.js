import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProfile } from '../lib/extract.js';

const page = (title, body, head = '') => `<!doctype html><html><head><title>${title}</title>${head}</head><body>${body}</body></html>`;
const card = (n, img = true) => `<li class="product"><a href="/product/${n.toLowerCase().replace(/\W+/g, '-')}/">${img ? `<img src="/img/${n.toLowerCase().replace(/\W+/g, '-')}.jpg">` : ''}<h2 class="woocommerce-loop-product__title">${n}</h2></a><span class="price">₹ 1,200</span></li>`;
const nav = `<header><nav><ul><li><a href="/">Home</a></li><li><a href="/products/">Products</a><ul class="sub-menu"><li><a href="/product-category/sensors/">Sensors</a></li><li><a href="/product-category/relays/">Relays</a></li></ul></li><li><a href="/about/">About</a></li></ul></nav></header>`;

function site(map) {
  const calls = [];
  const fetcher = async (u) => {
    calls.push(u);
    const url = new URL(u, 'https://store.example/').href; const hit = map[url];
    if (hit === undefined) throw new Error('HTTP 404');
    return { text: typeof hit === 'string' ? hit : JSON.stringify(hit), url };
  };
  fetcher.calls = calls; return fetcher;
}

const A = ['Alpha Sensor', 'Bravo Relay', 'Charlie Probe', 'Delta Switch', 'Echo Encoder', 'Foxtrot Gateway'];
const B = ['Golf Module', 'Hotel Detector', 'India Controller', 'Juliet Display', 'Kilo Meter'];
const C = ['Lima Transducer', 'Mike Proximity Sensor', 'November Timer'];

test('follows listing pages, pagination and category pages to collect the whole catalogue', async () => {
  const f = site({
    'https://store.example/': page('Store', nav + `<main><h1>Store</h1><ul>${A.slice(0, 2).map(n => card(n)).join('')}</ul></main>`),
    'https://store.example/products/': page('Products', nav + `<ul>${A.map(n => card(n)).join('')}</ul><nav class="pagination"><a class="page-numbers" href="/products/page/2/">2</a><a class="next page-numbers" href="/products/page/2/">Next</a></nav>`),
    'https://store.example/products/page/2/': page('Products 2', nav + `<ul>${B.map(n => card(n)).join('')}</ul>`),
    'https://store.example/product-category/sensors/': page('Sensors', nav + `<ul>${C.map(n => card(n)).join('')}</ul>`),
    'https://store.example/product-category/relays/': page('Relays', nav + `<ul>${[A[1], 'Oscar Contactor'].map(n => card(n)).join('')}</ul>`),
  });
  const p = await extractProfile('store.example', { fetcher: f });
  const names = p.products.map(x => x.name);
  for (const n of [...A, ...B, ...C, 'Oscar Contactor']) assert.ok(names.includes(n), 'missing ' + n);
  assert.equal(new Set(names.map(n => n.toLowerCase())).size, names.length, 'no duplicates');
  assert.ok(p.products.length >= 15, 'found ' + p.products.length);
  assert.ok(p.products.every(x => !/₹|price/i.test(x.name)), 'prices stripped from names');
  assert.ok(p.products.filter(x => x.image).length >= 15, 'images kept');
});

test('uses the WooCommerce store API when present', async () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ name: `Item Number ${i + 1}`, permalink: `https://store.example/product/item-${i + 1}/`, images: [{ src: `https://store.example/i/${i + 1}.jpg` }], short_description: `<p>Short text ${i + 1} about this product.</p>` }));
  const f = site({ 'https://store.example/': page('Store', nav + '<p>wp-content woocommerce</p>'), 'https://store.example/wp-json/wc/store/v1/products?per_page=100': items });
  const p = await extractProfile('store.example', { fetcher: f });
  assert.ok(p.products.length >= 30, 'found ' + p.products.length);
  assert.equal(p.products[0].image, 'https://store.example/i/1.jpg');
  assert.match(p.products[0].description, /Short text 1/);
  assert.ok(p.notes.some(n => /WooCommerce/.test(n)));
});

test('uses the Shopify products.json feed', async () => {
  const products = Array.from({ length: 12 }, (_, i) => ({ title: `Board ${i + 1}`, handle: `board-${i + 1}`, body_html: '<p>Nice <b>board</b> &amp; more</p>', images: [{ src: `https://cdn.shopify.com/${i + 1}.jpg` }] }));
  const f = site({ 'https://store.example/': page('Shop', '<script src="https://cdn.shopify.com/x.js"></script>'), 'https://store.example/products.json?limit=250': { products } });
  const p = await extractProfile('store.example', { fetcher: f });
  assert.ok(p.products.length >= 12);
  assert.equal(p.products[1].url, 'https://store.example/products/board-2');
  assert.equal(p.products[0].description, 'Nice board & more');
});

test('falls back to sitemap product pages and reads their detail pages', async () => {
  const urls = Array.from({ length: 8 }, (_, i) => `https://store.example/products/gadget-${i + 1}/`);
  const map = {
    'https://store.example/': page('Store', '<main><h1>Hi</h1></main>'),
    'https://store.example/sitemap.xml': `<urlset>${urls.map(u => `<url><loc>${u}</loc></url>`).join('')}<url><loc>https://store.example/about/</loc></url></urlset>`
  };
  urls.forEach((u, i) => { map[u] = page(`Smart Gadget ${i + 1} | Store`, '', `<meta property="og:image" content="/g/${i + 1}.jpg"><meta property="og:description" content="Gadget ${i + 1} does clever things for you.">`); });
  const p = await extractProfile('store.example', { fetcher: site(map) });
  assert.ok(p.products.length >= 8, 'found ' + p.products.length);
  assert.ok(p.products.some(x => x.name === 'Smart Gadget 3'), 'real names from detail pages');
  assert.equal(p.products.find(x => x.name === 'Smart Gadget 2').image, 'https://store.example/g/2.jpg');
});

test('respects the time budget', async () => {
  const slow = async (u) => { await new Promise(r => setTimeout(r, 400)); if (u === 'https://store.example/') return { text: page('Store', nav), url: u }; throw new Error('404'); };
  const t0 = Date.now();
  await extractProfile('store.example', { fetcher: slow, budgetMs: 1500 });
  assert.ok(Date.now() - t0 < 6000, 'finished in ' + (Date.now() - t0));
});

test('reads the homepage section by section', async () => {
  const body = `<header><nav><a href="/">Home</a></nav></header><main>
  <section><h1>Precision power</h1><p>We design and build industrial power electronics for tough sites.</p></section>
  <section><h2>Why choose us</h2><div class="g"><div class="c"><img src="/a.jpg"><h3>Built to last</h3><p>Every unit is burn-in tested before it ships out.</p></div><div class="c"><img src="/b.jpg"><h3>Local support</h3><p>Engineers on call across the region, every working day.</p></div><div class="c"><img src="/c.jpg"><h3>Custom builds</h3><p>Tell us the spec and we will design to it.</p></div></div></section>
  <section><h2>Our story</h2><div><img src="/story.jpg" width="800"><p>Founded by two engineers who were tired of unreliable converters, the company now serves plants across the country.</p></div></section>
  <section><h2>Our clients</h2><div><img src="/l1.png"><img src="/l2.png"><img src="/l3.png"><img src="/l4.png"><img src="/l5.png"></div></section>
  <section><h2>What customers say</h2><blockquote><p>They fixed in a week what two vendors could not fix in a year.</p><cite>Plant Manager</cite></blockquote></section>
  <section><h2>Contact us</h2><p>Tell us about your project and we will respond promptly.</p></section>
  </main><footer><h2>Quick links</h2></footer>`;
  const p = await extractProfile('store.example', { fetcher: site({ 'https://store.example/': page('Acme', body) }) });
  const byHead = Object.fromEntries(p.sections.map(s => [s.heading, s]));
  assert.equal(byHead['Why choose us'].kind, 'cards');
  assert.equal(byHead['Why choose us'].items.length, 3);
  assert.equal(byHead['Why choose us'].items[0].image, 'https://store.example/a.jpg');
  assert.equal(byHead['Our story'].kind, 'split');
  assert.equal(byHead['Our story'].image, 'https://store.example/story.jpg');
  assert.equal(byHead['Our clients'].kind, 'logos');
  assert.equal(byHead['Our clients'].logos.length, 5);
  assert.equal(byHead['What customers say'].kind, 'quotes');
  assert.match(byHead['What customers say'].quotes[0].text, /two vendors/);
  assert.equal(byHead['Contact us'].kind, 'cta');
  assert.ok(!byHead['Quick links'], 'footer headings skipped');
  assert.equal(p.hero.title, 'Precision power');
});

test('menu pages become products with real images and descriptions when there is no grid', async () => {
  const menuNav = `<header><nav><ul><li><a href="/">Home</a></li><li><a href="/pcb-assembly/">PCB Assembly</a></li><li><a href="/pcb-design/">PCB Design</a></li><li><a href="/box-build/">Box Build</a></li><li><a href="/contact-us/">Contact Us</a></li></ul></nav></header>`;
  const detail = (t, i) => page(`${t} | Acme`, '', `<meta property="og:image" content="/img/${i}.jpg"><meta name="description" content="${t} done properly by our team.">`);
  const f = site({ 'https://store.example/': page('Acme', menuNav + '<main><h1>Acme</h1></main>'), 'https://store.example/pcb-assembly/': detail('PCB Assembly', 1), 'https://store.example/pcb-design/': detail('PCB Design', 2), 'https://store.example/box-build/': detail('Box Build', 3), 'https://store.example/contact-us/': page('Contact') });
  const p = await extractProfile('store.example', { fetcher: f });
  const names = p.products.map(x => x.name);
  assert.deepEqual(names.slice(0, 3), ['PCB Assembly', 'PCB Design', 'Box Build']);
  assert.ok(!names.includes('Contact Us'));
  assert.equal(p.products[0].image, 'https://store.example/img/1.jpg');
  assert.match(p.products[1].description, /done properly/);
  assert.ok(!f.calls.some(u => /contact-us/.test(u)), 'did not waste a fetch on the contact page');
});

test('takes products from a "what we make" cards section when the site has no catalogue', async () => {
  const body = `<main><h1>Acme IoT</h1><section><h2>What we manufacture</h2><div><div class="c"><img src="/a.jpg"><h3>Smart Meter</h3><p>Tracks energy use in real time for plants.</p></div><div class="c"><img src="/b.jpg"><h3>Gas Sensor</h3><p>Detects leaks long before they matter to anyone.</p></div><div class="c"><img src="/c.jpg"><h3>Edge Gateway</h3><p>Bridges field devices and the cloud securely.</p></div></div></section></main>`;
  const p = await extractProfile('store.example', { fetcher: site({ 'https://store.example/': page('Acme IoT', body) }) });
  assert.deepEqual(p.products.slice(0, 3).map(x => x.name), ['Smart Meter', 'Gas Sensor', 'Edge Gateway']);
  assert.equal(p.products[0].image, 'https://store.example/a.jpg');
  assert.equal(p.products.length, 3, 'no duplicates from the cards fallback');
});

test('sections are still read when the body carries theme classes like no-sidebar and modal-open', async () => {
  const body = `<main><section><h2>Why choose us</h2><div><div><img src="/a.jpg"><h3>Built to last</h3><p>Every unit is burn-in tested before it ships out.</p></div><div><img src="/b.jpg"><h3>Local support</h3><p>Engineers on call across the region every day.</p></div><div><img src="/c.jpg"><h3>Custom builds</h3><p>Tell us the spec and we design to it.</p></div></div></section></main>`;
  const html = `<!doctype html><html class="no-js"><head><title>Acme</title></head><body class="home no-sidebar modal-open elementor-popup">${body}</body></html>`;
  const p = await extractProfile('store.example', { fetcher: site({ 'https://store.example/': html }) });
  assert.equal(p.sections.length, 1);
  assert.equal(p.sections[0].kind, 'cards');
});

test('reads sections on sites that use h1 or h3 for section headings and wrap the page in a form', async () => {
  const sec = (h, t) => `<section><h3>${h}</h3><p>${t}</p><div><div><img src="/a.jpg"><h4>First thing</h4><p>Something specific about the first thing here.</p></div><div><img src="/b.jpg"><h4>Second thing</h4><p>Something specific about the second thing here.</p></div><div><img src="/c.jpg"><h4>Third thing</h4><p>Something specific about the third thing here.</p></div></div></section>`;
  const html = `<!doctype html><html><head><title>Acme</title></head><body><form id="aspnetForm"><div>${sec('What we do', 'We do a lot of useful things for plants.')}${sec('How we work', 'We work with care and a bias for shipping.')}${sec('Why us', 'Because the details are not optional here.')}</div></form></body></html>`;
  const p = await extractProfile('store.example', { fetcher: site({ 'https://store.example/': html }) });
  assert.ok(p.sections.length >= 2, 'sections: ' + p.sections.map(s => s.heading).join(','));
  assert.equal(p.sections[0].heading, 'What we do');
  assert.equal(p.sections[0].items.length, 3);
});

test('a site that never answers cannot hang the read: the whole thing stops on the clock', async () => {
  const hang = () => new Promise(() => {});
  const t0 = Date.now();
  await assert.rejects(() => extractProfile('hung.example', { fetcher: hang, totalMs: 1200 }), /too long|time/i);
  assert.ok(Date.now() - t0 < 3500, 'stopped in ' + (Date.now() - t0));
});
test('a site whose first page works but everything else hangs still finishes in time', async () => {
  const page = '<html><head><title>Slow Co</title><link rel="stylesheet" href="/a.css"></head><body><h1>Slow Co</h1><a href="/products">Products</a><p>We make things for people who need them done well.</p></body></html>';
  const f = (u) => (/\.css|products/.test(u) ? new Promise(() => {}) : Promise.resolve({ text: page, url: 'https://slow.example/' }));
  const t0 = Date.now(); const p = await extractProfile('slow.example', { fetcher: f, totalMs: 2500, budgetMs: 1500 });
  assert.equal(p.name, 'Slow Co'); assert.ok(Date.now() - t0 < 6500, 'finished in ' + (Date.now() - t0));
});
