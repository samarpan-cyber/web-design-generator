// QA helper: node scripts/shoot.mjs <outDir> [templateIds...]  -> renders fixture + screenshots (desktop/mobile, dark/light)
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
const browser = await chromium.launch();
const errors = [];
for (const t of TEMPLATES.filter(t => ids.includes(t.id))) {
  for (const theme of ['dark', 'light']) {
    const file = path.join(out, `${t.id}-${theme}.html`);
    fs.writeFileSync(file, t.render(profile, { theme, agency: 'Digifyo' }));
    for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      if (label === 'mobile' && theme === 'light') continue;
      const page = await browser.newPage({ viewport: vp });
      page.on('pageerror', e => errors.push(`${t.id}/${theme}/${label}: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) errors.push(`${t.id}: console ${m.text()}`); });
      await page.goto('file://' + file); await page.waitForTimeout(600);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 500) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(90); }
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 2) errors.push(`${t.id}/${theme}/${label}: horizontal overflow ${overflow}px`);
      await page.screenshot({ path: path.join(out, `${t.id}-${theme}-${label}.png`), fullPage: true });
      await page.close();
    }
  }
}
await browser.close();
console.log(errors.length ? 'ISSUES:\n' + errors.join('\n') : 'No JS errors / overflow');
