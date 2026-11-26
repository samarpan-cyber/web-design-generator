import test from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import { TEMPLATES } from '../public/engine/index.js';

const minimal = { name: 'Acme', host: 'acme.test', url: 'https://acme.test', colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {} };
const evil = '"><script>alert(1)</script><img src=x onerror=alert(2)>';
const hostile = { ...minimal, name: evil, tagline: evil, description: evil, about: evil, logo: 'javascript:alert(3)', ogImage: 'javascript:alert(4)', favicon: 'javascript:alert(5)',
  colors: { primary: '#ff0000' }, categories: [evil], industries: [evil], certifications: [evil], headings: [evil],
  products: [{ name: evil, description: evil, image: 'javascript:alert(6)', url: 'javascript:alert(7)' }],
  images: [{ src: 'javascript:alert(8)', alt: evil }], stats: [{ value: 5, suffix: evil, label: evil }],
  contacts: { emails: [evil], phones: [evil], address: evil }, social: { linkedin: 'javascript:alert(9)' }, nav: [{ label: evil, href: 'javascript:alert(10)' }] };

for (const t of TEMPLATES) {
  for (const theme of ['dark', 'light']) {
    test(`${t.id}/${theme}: renders with minimal profile`, () => {
      const html = t.render(minimal, { theme, agency: 'Studio' });
      assert.ok(html.startsWith('<!doctype html>'));
      assert.ok(html.includes('Acme'));
      assert.ok(html.includes(`data-theme="${theme}"`));
      assert.ok(!/undefined|NaN|\[object/.test(html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/g, '')), 'no undefined/NaN leaks');
    });
  }
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
