// E2E smoke test: node scripts/e2e.mjs [baseUrl] [profile.json]. Mocks /api/analyze with a saved profile.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3333';
const profile = JSON.parse(fs.readFileSync(process.argv[3] || '/tmp/claude-0/v2/profile.json', 'utf8'));
const out = process.env.OUT || '/tmp/claude-0/e2e2'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const errs = [];
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) errs.push('assert: ' + m); };

async function run(label, viewport) {
  const page = await b.newPage({ viewport }); page.on('pageerror', e => errs.push(label + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(label + ': ' + m.text()); });
  await page.route('**/api/analyze', r => r.fulfill({ json: { ok: true, profile } }));
  await page.goto(base); await page.waitForSelector('.ind');
  ok(await page.locator('#gate').isVisible() && await page.locator('#app').isHidden(), `${label}: industry gate shows first`);
  ok(await page.locator('.ind').count() === 6 && await page.locator('.ind.ready').count() === 1, `${label}: 6 industries, only Electronics ready`);
  await page.screenshot({ path: `${out}/${label}-1-gate.png` });
  await page.click('.ind.ready'); await page.waitForSelector('.lead');
  ok(page.url().endsWith('#/electronics') && await page.locator('#app').isVisible(), `${label}: Electronics opens the generator`);
  ok(await page.locator('.lead').count() === 19, `${label}: 19 leads`);
  await page.screenshot({ path: `${out}/${label}-2-generator.png` });
  await page.fill('#input', 'Temple Electromagnetics'); await page.press('#input', 'Enter');
  await page.waitForSelector('#grid .card', { timeout: 15000 }); await page.waitForTimeout(2500);
  ok(await page.locator('#grid .card').count() === 5, `${label}: 5 design cards`);
  await page.click('#grid .card:nth-child(2) .star'); ok(await page.locator('#grid .card.fav').count() === 1, `${label}: shortlist star`);
  await page.screenshot({ path: `${out}/${label}-3-results.png` });
  await page.click('[data-t=light]'); await page.click('[data-t=auto]');
  // present mode: open design 4, walk all 5 pages inside it
  await page.click('[data-open="3"]'); await page.waitForTimeout(1500);
  ok(/\/view\/3$/.test(page.url()) && await page.locator('#viewer').isVisible(), `${label}: viewer opens with its own URL`);
  const fr = page.frameLocator('#vFrame'); const ids = await fr.locator('[data-page]').evaluateAll(els => els.map(e => e.dataset.page));
  ok(ids.length >= 5, `${label}: design has ${ids.length} pages`);
  for (const id of ids) { await fr.locator(`a[data-go="${id}"]`).first().evaluate(a => a.click()); await page.waitForTimeout(250); const on = await fr.locator('.page.on').getAttribute('data-page'); ok(on === id, `${label}: navigates to ${id}`); }
  await page.screenshot({ path: `${out}/${label}-4-viewer.png` });
  await fr.locator('[data-quote]').first().evaluate(b => b.click()); await fr.locator('[data-quote-open]').first().evaluate(b => b.click()); await page.waitForTimeout(500);
  ok(await fr.locator('#wdg-q.open').count() === 1, `${label}: quote basket opens in design`);
  await page.goBack(); await page.waitForTimeout(500);
  ok(await page.locator('#viewer').isHidden() && await page.locator('#results').isVisible(), `${label}: browser Back returns to the results`);
  await page.click('[data-open="0"]'); await page.waitForTimeout(800); await page.click('#vClose'); await page.waitForTimeout(500);
  ok(await page.locator('#viewer').isHidden(), `${label}: Back to generator button closes viewer`);
  await page.click('#pitchBtn'); await page.waitForTimeout(300);
  ok(/copied/i.test(await page.locator('#toast').innerText()) && (await page.locator('#steps li.on').getAttribute('data-s')) === '4', `${label}: pitch note copied and step 4 active`);
  if (viewport.width > 760) { await page.click('#changeInd'); await page.waitForTimeout(300); ok(await page.locator('#gate').isVisible(), `${label}: Change industry returns to gate`); }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(ov <= 2, `${label}: no horizontal overflow (${ov}px)`);
  await page.close();
}
await run('desktop', { width: 1440, height: 900 });
await run('phone', { width: 390, height: 844 });
await b.close();
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'ALL GOOD');
