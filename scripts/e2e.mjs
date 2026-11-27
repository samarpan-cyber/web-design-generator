// E2E: node scripts/e2e.mjs [profile.json]
// Starts its own local server with THROWAWAY test credentials (never your real ones), mocks /api/analyze with a saved profile,
// and drives the real UI: login, industry gate, designs, navigation, viewer, share link, expiry, logout.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { hashPassword } from '../lib/auth.js';
import { createShare } from '../lib/share.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const profile = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/claude-0/v2/profile.json', 'utf8'));
const out = process.env.OUT || '/tmp/claude-0/e2e3'; fs.mkdirSync(out, { recursive: true });
const USER = 'Tester', PASS = 'E2e#Pass-1';
const cfg = { secret: 'e'.repeat(48), users: { tester: { name: USER, hash: hashPassword(PASS) } } };
const PORT = 3900 + Math.floor(Math.random() * 90), base = `http://localhost:${PORT}`;
const server = spawn(process.execPath, ['local-server.js'], { env: { ...process.env, PORT: String(PORT), WDG_AUTH: JSON.stringify(cfg) }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(base + '/healthz')).ok) break; } catch { /* wait */ } await new Promise(r => setTimeout(r, 150)); }

const b = await chromium.launch(); const errs = [];
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) errs.push('assert: ' + m); };
const J = { 'content-type': 'application/json' };

// server-side protection, no browser needed
const anon = async (p, o) => (await fetch(base + p, { headers: J, ...o })).status;
ok(await anon('/api/leads') === 401, 'leads need login');
ok(await anon('/api/analyze', { method: 'POST', body: '{"url":"example.com"}' }) === 401, 'analyze needs login');
ok(await anon('/api/share', { method: 'POST', body: JSON.stringify({ profile }) }) === 401, 'creating a share link needs login');
ok((await fetch(base + '/leads.json')).status === 404, 'lead list is not publicly downloadable');

async function run(label, viewport, doShare) {
  const ctx = await b.newContext({ viewport }); const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(label + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|401|403|404|410/.test(m.text())) errs.push(label + ': ' + m.text()); });
  await page.route('**/api/analyze', r => r.fulfill({ json: { ok: true, profile } }));

  await page.goto(base); await page.waitForSelector('#login:not([hidden])');
  ok(await page.locator('#gate').isHidden() && await page.locator('#topActions').isHidden(), `${label}: login screen comes first, nothing else is reachable`);
  await page.screenshot({ path: `${out}/${label}-0-login.png` });
  await page.fill('#loginUser', USER); await page.fill('#loginPass', 'wrong-password'); await page.click('#loginGo'); await page.waitForTimeout(900);
  ok(/wrong username or password/i.test(await page.locator('#loginMsg').innerText()) && await page.locator('#login').isVisible(), `${label}: wrong password is refused`);
  await page.fill('#loginPass', PASS); await page.click('#loginGo'); await page.waitForSelector('.ind');
  ok(await page.locator('#gate').isVisible() && (await page.locator('#whoName').innerText()) === USER, `${label}: right password opens the industry screen`);
  const cookie = (await ctx.cookies()).find(c => c.name === 'wdg_session');
  ok(!!cookie && cookie.httpOnly && cookie.sameSite === 'Lax', `${label}: session cookie is HttpOnly and SameSite`);
  await page.reload(); await page.waitForSelector('.ind');
  ok(await page.locator('#gate').isVisible(), `${label}: stays logged in after a reload`);

  ok(await page.locator('.ind').count() === 7 && await page.locator('.ind.ready').count() === 3, `${label}: 7 industries, Electronics, Dentists and Doctors ready`);
  await page.click('.ind.ready'); await page.waitForSelector('.lead');
  ok(await page.locator('.lead').count() === 19, `${label}: 19 leads load for a logged-in user`);
  await page.fill('#input', 'Temple Electromagnetics'); await page.press('#input', 'Enter');
  await page.waitForSelector('#grid .card', { timeout: 15000 }); await page.waitForTimeout(2500);
  ok(await page.locator('#grid .card').count() === 5 && page.url().endsWith('#/electronics/compare'), `${label}: 5 designs on the Compare URL`);
  await page.click('#grid .card:nth-child(2) .star'); ok(await page.locator('#grid .card.fav').count() === 1, `${label}: shortlist star`);

  // viewer and the pages inside a design
  await page.click('[data-open="3"]'); await page.waitForTimeout(1500);
  ok(/\/compare\/view\/3$/.test(page.url()), `${label}: viewer has its own URL`);
  const fr = page.frameLocator('#vFrame'); const ids = await fr.locator('[data-page]').evaluateAll(els => els.map(e => e.dataset.page));
  ok(ids.length >= 5, `${label}: design has ${ids.length} pages`);
  for (const id of ids) { await fr.locator(`a[data-go="${id}"]`).first().evaluate(a => a.click()); await page.waitForTimeout(200); ok((await fr.locator('.page.on').getAttribute('data-page')) === id, `${label}: navigates to ${id}`); }
  await fr.locator('[data-quote]').first().evaluate(x => x.click()); await fr.locator('[data-quote-open]').first().evaluate(x => x.click()); await page.waitForTimeout(400);
  ok(await fr.locator('#wdg-q.open').count() === 1, `${label}: quote basket opens in design`);
  await page.goBack(); await page.waitForTimeout(400);
  ok(await page.locator('#viewer').isHidden() && await page.locator('#results').isVisible(), `${label}: browser Back returns to the results`);

  // navigation between steps
  await page.click('#steps li[data-s="2"] button'); await page.waitForTimeout(250);
  ok(await page.locator('#welcome').isVisible() && await page.locator('#resume').isVisible(), `${label}: Compare to Website keeps the results`);
  await page.click('#resumeBtn'); await page.waitForTimeout(250);
  ok(await page.locator('#grid .card').count() === 5, `${label}: and back to the five designs`);

  if (doShare) {
    await page.click('#shareBtn'); await page.waitForSelector('#shareBox:not([hidden])');
    const link = await page.inputValue('#shareLink');
    ok(/\/s\/[\w.-]+$/.test(link) && /48 hours/.test(await page.locator('#shareState').innerText()), `${label}: share dialog gives a 48 hour link`);
    await page.screenshot({ path: `${out}/${label}-share-dialog.png` });
    await page.click('#shareCopy'); await page.keyboard.press('Escape');
    await page.click('#pitchBtn'); ok((await page.inputValue('#pitchText')).includes(link), `${label}: pitch note includes the share link`); await page.keyboard.press('Escape');

    // the client: a brand new browser context with no cookies
    const cctx = await b.newContext({ viewport }); const cp = await cctx.newPage();
    cp.on('pageerror', e => errs.push('client: ' + e.message));
    await cp.goto(link); await cp.waitForSelector('#grid .card', { timeout: 15000 }); await cp.waitForTimeout(1800);
    ok(await cp.locator('#grid .card').count() === 5 && (await cp.locator('#shTitle').innerText()).includes(profile.name), `${label}: client sees the five designs with no login`);
    ok((await cp.locator('#shExpiry').innerText()).match(/\d+ more hours|within the hour/) !== null, `${label}: client sees how long the link lasts`);
    ok(await cp.locator('text=Download').count() === 0 && await cp.locator('#editBtn').count() === 0 && await cp.locator('#login').count() === 0, `${label}: client has no download, edit or generator controls`);
    await cp.screenshot({ path: `${out}/${label}-client.png` });
    await cp.click('[data-open="1"]'); await cp.waitForTimeout(1200);
    const cf = cp.frameLocator('#vFrame'); ok((await cf.locator('[data-page]').count()) >= 5, `${label}: client can explore all pages of a design`);
    await cp.goBack(); await cp.waitForTimeout(300); ok(await cp.locator('#viewer').isHidden(), `${label}: client Back closes the viewer`);
    ok(await (await cctx.request.get(base + '/api/leads')).status() === 401 && await (await cctx.request.post(base + '/api/analyze', { data: { url: 'example.com' } })).status() === 401, `${label}: the link does not unlock the generator`);
    // tampered and expired links
    await cp.goto(link.slice(0, -4) + 'abcd'); await cp.waitForSelector('#shState:not([hidden])'); ok(/not valid/i.test(await cp.locator('#shStateTitle').innerText()), `${label}: tampered link is rejected`);
    const old = await createShare(profile, { agency: 'Studio', by: USER, secret: cfg.secret, now: Date.now() - 49 * 3600 * 1000, env: {} });
    await cp.goto(`${base}/s/${old.token}`); await cp.waitForSelector('#shState:not([hidden])'); ok(/expired/i.test(await cp.locator('#shStateTitle').innerText()), `${label}: a link older than 48 hours says it has expired`);
    await cctx.close();
  }

  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(ov <= 2, `${label}: no horizontal overflow (${ov}px)`);
  // logout
  await page.click('#logout'); await page.waitForSelector('#login:not([hidden])');
  ok(await page.locator('#gate').isHidden() && (await ctx.request.get(base + '/api/leads')).status() === 401, `${label}: logout locks the generator again`);
  await ctx.close();
}

async function runClinic() {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const label = 'dentist';
  page.on('pageerror', e => errs.push(label + ': ' + e.message));
  await page.goto(base); await page.waitForSelector('#login:not([hidden])'); await page.fill('#loginUser', USER); await page.fill('#loginPass', PASS); await page.click('#loginGo'); await page.waitForSelector('.ind');
  await page.click('a.ind[href="#/dentists"]'); await page.waitForSelector('#startDetails');
  ok((await page.locator('#indName').innerText()).includes('Dentists'), `${label}: Dentists opens its own workspace`);
  await page.click('#startDetails'); await page.waitForSelector('#intakeDlg[open]');
  await page.fill('#intakeForm [name=name]', 'Smile Care Dental'); await page.fill('#intakeForm [name=gmb]', 'Category: Dentist\nPhone: +91 98765 43210\nAddress: 12 MG Road, Pune\nRating: 4.8 (312 reviews)'); await page.fill('#intakeForm [name=notes]', 'Dr. Anita Rao, orthodontist');
  await page.click('#intakeGo'); await page.waitForSelector('#grid .card', { timeout: 15000 }); await page.waitForTimeout(2500);
  const names = await page.locator('#grid .card .meta b').allInnerTexts();
  ok(names.length === 5, `${label}: five designs from details alone (${names.join(', ')})`);
  ok(page.url().endsWith('#/dentists/compare'), `${label}: URL stays in the dentist workspace`);
  await page.click('[data-open="0"]'); await page.waitForTimeout(1500);
  const fr = page.frameLocator('#vFrame'); const txt = await fr.locator('body').innerText();
  ok(/Anita Rao/.test(txt) && /4\.8/.test(txt) && /Designed by Digifyo/.test(txt) && /98765 43210/.test(txt), `${label}: design shows the doctor, rating, phone and who designed it`);
  await page.screenshot({ path: `${out}/${label}-viewer.png` });
  await ctx.close();
}
try { await run('desktop', { width: 1440, height: 900 }, true); await run('phone', { width: 390, height: 844 }, false); await runClinic(); }
finally { await b.close(); server.kill(); }
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'ALL GOOD');
process.exit(errs.length ? 1 : 0);
