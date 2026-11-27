// node scripts/live-e2e.mjs <baseUrl> "<company or url>" [accessKey] -- drives the REAL deployed UI (no mocks)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [base, query, key] = process.argv.slice(2);
const out = process.env.OUT || '/tmp/claude-0/live-e2e'; fs.mkdirSync(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const b = await chromium.launch({ proxy }); const page = await b.newPage({ viewport: { width: 1500, height: 950 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
if (key) await page.addInitScript(k => sessionStorage.setItem('wdg-key', k), key);
await page.goto(base, { waitUntil: 'networkidle' });
console.log('gate first:', await page.locator('#gate').isVisible(), '| industries:', await page.locator('.ind').count());
await page.click('.ind.ready'); await page.waitForSelector('#input');
await page.fill('#input', query); await page.press('#input', 'Enter');
await page.waitForSelector('#grid .card', { timeout: 60000 }); await page.waitForTimeout(6000);
console.log('summary:', (await page.locator('.msg.bot').last().innerText()).replace(/\n/g, ' | '));
await page.screenshot({ path: `${out}/results.png` });
const frames = await page.$$eval('#grid iframe', fs => fs.map(f => (f.srcdoc || '').length));
console.log('iframe html sizes:', frames.join(','));
for (const i of [0, 1, 2, 3, 4]) {
  await page.click(`[data-open="${i}"]`); await page.waitForTimeout(2500);
  const fr = page.frameLocator('#vFrame');
  const info = await fr.locator('body').evaluate(() => ({ pages: document.querySelectorAll('[data-page]').length, imgs: document.images.length, title: document.title, font: getComputedStyle(document.body).fontFamily.split(',')[0] }));
  console.log(i, JSON.stringify(info));
  for (const [n, y] of [['top', 0], ['mid', 0.35]]) { await fr.locator('body').evaluate((_, y) => scrollTo(0, y * document.documentElement.scrollHeight), y); await page.waitForTimeout(900); await page.screenshot({ path: `${out}/d${i}-${n}.png` }); }
  await page.click('#vClose'); await page.waitForTimeout(400);
}
await b.close(); console.log(errs.length ? 'ERRORS ' + errs.join('; ') : 'no page errors');
