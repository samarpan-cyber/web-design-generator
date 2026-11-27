import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as cheerio from 'cheerio';
import { TEMPLATES } from '../public/engine/index.js';
import { extractProfile } from '../lib/extract.js';
import { brief, noDash } from '../public/engine/copy.js';

const sampleHtml = fs.readFileSync(new URL('./fixtures/sample.html', import.meta.url), 'utf8');
const fixture = await extractProfile('volt.example', { fetcher: async u => ({ text: u.endsWith('.css') ? '' : sampleHtml, url: u.startsWith('http') ? u : 'https://volt.example/' }) });
const richHtml = fs.readFileSync(new URL('./fixtures/rich.html', import.meta.url), 'utf8');
const rich = await extractProfile('rich.example', { fetcher: async u => ({ text: richHtml, url: u.startsWith('http') ? u : 'https://rich.example/' }) });
const minimal = { name: 'Acme', host: 'acme.test', url: 'https://acme.test', colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {} };
// A messy real-world profile: dashes everywhere, boilerplate descriptions, same text reused
const dashy = { ...fixture, name: 'Volt — Dynamics', description: 'We build drives – and inverters. Based in Gandhinagar. Serving 12 countries.', about: 'We build drives – and inverters. Based in Gandhinagar. Serving 12 countries.', tagline: 'Power — delivered',
  products: [{ name: 'Alpha — Drive', description: 'Read our long story about this product — in detail. It is great.', image: null, url: null }, { name: 'Beta Drive', description: 'Read our long story about this product — in detail. It is great.', image: null, url: null }, { name: 'Gamma Relay', description: '', image: null, url: null }, { name: 'Delta Sensor', description: '', image: null, url: null }, { name: 'Eps Inverter', description: '', image: null, url: null }, { name: 'Zeta Capacitor', description: '', image: null, url: null }] };
const evil = '"><script>alert(1)</script><img src=x onerror=alert(2)>';
const hostile = { ...minimal, name: evil, tagline: evil, description: evil, about: evil, logo: 'javascript:alert(3)', ogImage: 'javascript:alert(4)', favicon: 'javascript:alert(5)',
  colors: { primary: '#ff0000' }, categories: [evil], industries: [evil], certifications: [evil], headings: [evil],
  products: [{ name: evil, description: evil, image: 'javascript:alert(6)', url: 'javascript:alert(7)' }],
  images: [{ src: 'javascript:alert(8)', alt: evil }], stats: [{ value: 5, suffix: evil, label: evil }],
  contacts: { emails: [evil], phones: [evil], address: evil }, social: { linkedin: 'javascript:alert(9)' }, nav: [{ label: evil, href: 'javascript:alert(10)' }] };

const visible = html => { const $ = cheerio.load(html); $('style,script').remove(); return $; };

test('copy helpers', () => {
  assert.equal(noDash('a — b – c - d'), 'a, b, c, d');
  assert.ok(brief('One short sentence. Another one follows.', 80) === 'One short sentence.');
  assert.ok(brief('x'.repeat(300), 100).length <= 101);
  assert.ok(!/[–—]/.test(brief('Fast — and – loose', 100)));
});

for (const t of TEMPLATES) {
  for (const theme of ['dark', 'light']) {
    test(`${t.id}/${theme}: renders a full 5-page site from a minimal profile`, () => {
      const html = t.render(minimal, { theme, agency: 'Studio' });
      const $ = cheerio.load(html);
      assert.ok(html.startsWith('<!doctype html>'));
      assert.ok($('[data-page]').length >= 5, 'at least 5 pages');
      assert.ok($('a[data-go]').length >= 5, 'navigation present');
      assert.equal($('html').attr('data-theme'), theme);
      assert.ok(!/undefined|NaN|\[object/.test(visible(html).text()), 'no undefined/NaN leaks');
    });
  }

  test(`${t.id}: never contains an em or en dash anywhere`, () => {
    for (const p of [fixture, dashy, minimal, rich]) {
      const html = t.render(p, { theme: 'dark', agency: 'Studio' });
      const hit = html.match(/.{0,30}[–—].{0,30}/);
      assert.ok(!hit, 'dash found: ' + (hit && hit[0]));
      assert.ok(!/&mdash;|&ndash;|&#8211;|&#8212;/.test(html), 'dash entity found');
    }
  });

  test(`${t.id}: no line of copy is repeated across the whole site`, () => {
    for (const p of [fixture, dashy, rich]) {
      const $ = visible(t.render(p, { theme: 'dark' }));
      const skip = new Set([...(p.products || []).map(x => x.name), ...(p.industries || []), ...(p.categories || []), p.name].map(s => noDash(s).toLowerCase()));
      const seen = new Map();
      $('p,h1,h2,h3,h4,.lede,.statement,.lead,.stmt').each((_, el) => {
        const txt = $(el).text().replace(/\s+/g, ' ').trim();
        if (txt.length < 14 || skip.has(txt.toLowerCase()) || $(el).closest('.pal,.mnav').length) return;
        seen.set(txt, (seen.get(txt) || 0) + 1);
      });
      const dupes = [...seen].filter(([, n]) => n > 1).map(([s]) => s);
      assert.deepEqual(dupes, [], 'repeated copy: ' + dupes.join(' | '));
    }
  });

  test(`${t.id}: paragraphs stay short (no walls of text)`, () => {
    const $ = visible(t.render(fixture, { theme: 'dark' }));
    $('p,.lede,.statement,.stmt').each((_, el) => { const n = $(el).text().trim().length; assert.ok(n <= 230, `long paragraph (${n}): ${$(el).text().slice(0, 60)}`); });
  });

  test(`${t.id}: hostile input is escaped`, () => {
    const $ = cheerio.load(t.render(hostile, { theme: 'dark' }));
    assert.ok($('script').length <= 3, 'only built-in scripts (config, template hook, runtime)');
    $('script').each((_, el) => assert.ok(!/<\/?script/i.test($(el).html() || ''), 'script breakout'));
    $('*').each((_, el) => {
      for (const [k, v] of Object.entries(el.attribs || {})) {
        if (/^on/i.test(k)) assert.match(v, /^this\.onerror=null;|^this\.replaceWith|^document\./, `unexpected handler ${k}=${v}`);
        if (['href', 'src'].includes(k)) assert.ok(!/^\s*javascript:/i.test(v), `javascript: URL in ${k}`);
      }
    });
    assert.equal($('img[src="x"]').length, 0, 'injected img element');
  });
}

test('the five designs use five different font stacks and nav patterns', () => {
  const sig = TEMPLATES.map(t => { const h = t.render(fixture, {}); return { fonts: (h.match(/family=([^&:]+)/g) || []).join(','), tpl: (h.match(/data-tpl="(\w+)"/) || [])[1] }; });
  assert.equal(new Set(sig.map(s => s.fonts)).size, TEMPLATES.length, 'unique font combos');
  assert.equal(new Set(sig.map(s => s.tpl)).size, TEMPLATES.length);
});

for (const t of TEMPLATES) {
  test(`${t.id}: home page mirrors the site section by section`, () => {
    const $ = visible(t.render(rich, { theme: 'dark' }));
    const home = $('[data-page]').first();
    const heads = home.find('.hs-t').toArray().map(e => $(e).text().trim());
    assert.ok(heads.includes('Why Choose Us'), 'site heading kept and tidied: ' + heads.join(' | '));
    assert.ok(heads.includes('Our story'));
    assert.ok(heads.length >= 5, 'at least 5 scraped or guaranteed sections: ' + heads.length);
    assert.ok(home.find('.hs-card').length >= 3, 'cards rendered');
    assert.ok(home.find('.hs-logos .lg').length >= 4, 'logo wall rendered');
    assert.ok(home.find('.hs-q').length >= 1, 'testimonial rendered');
    assert.ok(home.find('.hs-step').length >= 3, 'how it works steps rendered');
    assert.ok(!heads.some(h => /what we manufacture/i.test(h)), 'catalogue-mirroring section not duplicated');
    assert.ok(!heads.some(h => /get in touch|quick links/i.test(h)), 'cta and footer sections skipped');
  });
}

test('the home page of a site that exposes little still has several sections', () => {
  for (const t of TEMPLATES) {
    const $ = visible(t.render({ ...minimal, certifications: ['ISO 9001', 'CE'], industries: ['Automotive', 'Medical', 'Telecom'] }, { theme: 'dark' }));
    assert.ok($('[data-page]').first().find('section.hs').length >= 3, t.id + ' thin-site home sections');
  }
});
