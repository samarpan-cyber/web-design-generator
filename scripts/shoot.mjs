// QA helper: node scripts/shoot.mjs <outDir> [templateIds...]
// Renders every page of each design at phone / tablet / desktop widths, reports JS errors + horizontal overflow, saves screenshots.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { extractProfile } from '../lib/extract.js';
import { TEMPLATES } from '../public/engine/index.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(out, { recursive: true });
const ids = process.argv.slice(3).length ? process.argv.slice(3) : TEMPLATES.map(t => t.id);
const html = fs.readFileSync(new URL('../test/fixtures/sample.html', import.meta.url), 'utf8');
const profile = await extractProfile('volt.example', { fetcher: async u => ({ text: u.endsWith('.css') ? '' : html, url: u.startsWith('http') ? u : 'https://volt.example/' }) });
fs.writeFileSync(path.join(out, 'profile.json'), JSON.stringify(profile, null, 1));
const VIEWS = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1100 }, desktop: { width: 1440, height: 900 } };
const only = (process.env.VIEWS || 'phone,tablet,desktop').split(',');
const pagesOnly = process.env.PAGES ? process.env.PAGES.split(',') : null;
const shots = process.env.SHOTS !== '0';
const browser = await chromium.launch(); const errors = [];
for (const t of TEMPLATES.filter(t => ids.includes(t.id))) {
  const themes = process.env.BOTH_THEMES ? ['dark', 'light'] : [t.defaultTheme];
  for (const theme of themes) {
    const file = path.join(out, `${t.id}-${theme}.html`);
    fs.writeFileSync(file, t.render(profile, { theme, agency: 'Digifyo' }));
    for (const view of only) {
      const page = await browser.newPage({ viewport: VIEWS[view] });
      page.on('pageerror', e => errors.push(`${t.id}/${view}: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) errors.push(`${t.id}/${view}: console ${m.text()}`); });
      await page.goto('file://' + file); await page.waitForTimeout(500);
      const pageIds = await page.$$eval('[data-page]', els => els.map(e => e.dataset.page));
      if (pageIds.length < 5) errors.push(`${t.id}: only ${pageIds.length} pages`);
      for (const id of pageIds.filter(i => !pagesOnly || pagesOnly.includes(i))) {
        await page.evaluate(id => window.__go(id, { force: true }), id); await page.waitForTimeout(350);
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 600) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(60); }
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(400);
        const ov = await page.evaluate(() => { const w = innerWidth; const bad = [...document.querySelectorAll('.page.on *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.rail,.car,.marq,.mq,.track,[data-allow-x]'); }).slice(0, 3).map(e => (e.className || e.tagName) + ''); return { d: document.documentElement.scrollWidth - w, bad }; });
        if (ov.d > 2 || ov.bad.length) errors.push(`${t.id}/${theme}/${view}/${id}: overflow ${ov.d}px ${ov.bad.join(' | ')}`);
        if (shots) await page.screenshot({ path: path.join(out, `${t.id}-${theme}-${view}-${id}.png`), fullPage: true });
      }
      await page.close();
    }
  }
}
await browser.close();
console.log(errors.length ? 'ISSUES:\n' + [...new Set(errors)].join('\n') : 'No JS errors, 5 pages each, no overflow');
