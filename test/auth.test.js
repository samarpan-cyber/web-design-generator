import test from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../lib/auth.js';
import { createShare, readShare, slimProfile, SHARE_TTL_MS } from '../lib/share.js';

// Made-up credentials: real ones never appear in the repo.
const PW_A = 'Alpha#Test-1', PW_B = 'Bravo#Test-2';
const cfg = { secret: 'x'.repeat(48), users: { alice: { name: 'Alice', hash: auth.hashPassword(PW_A) }, bob: { name: 'Bob', hash: auth.hashPassword(PW_B) } } };
const cookieOf = res => (res.headers['set-cookie'] || '').split(';')[0];

test('passwords: right one passes, wrong one fails, username is case-insensitive', () => {
  assert.equal(auth.checkLogin('Alice', PW_A, cfg), 'Alice');
  assert.equal(auth.checkLogin('ALICE', PW_A, cfg), 'Alice');
  assert.equal(auth.checkLogin('bob', PW_B, cfg), 'Bob');
  assert.equal(auth.checkLogin('Alice', PW_A.toLowerCase(), cfg), null, 'password is case-sensitive');
  assert.equal(auth.checkLogin('Alice', PW_B, cfg), null, 'passwords are not interchangeable');
  assert.equal(auth.checkLogin('nobody', PW_A, cfg), null);
  assert.equal(auth.checkLogin('', '', cfg), null);
  assert.equal(auth.checkLogin('__proto__', 'x', cfg), null, 'prototype keys are not users');
  assert.ok(!JSON.stringify(cfg).includes(PW_A), 'no plaintext stored');
});

test('config must be complete or login stays disabled', () => {
  assert.equal(auth.getConfig({}), null);
  assert.equal(auth.getConfig({ WDG_AUTH: 'not json' }), null);
  assert.equal(auth.getConfig({ WDG_AUTH: JSON.stringify({ secret: 'short', users: {} }) }), null);
  assert.ok(auth.getConfig({ WDG_AUTH: JSON.stringify(cfg) }));
});

test('tokens: valid, tampered, wrong secret and expired', () => {
  const t = auth.signToken({ u: 'a', exp: Date.now() + 1000 }, cfg.secret);
  assert.equal(auth.verifyToken(t, cfg.secret).u, 'a');
  assert.equal(auth.verifyToken(t, 'y'.repeat(48)), null);
  const [b, s] = t.split('.'); const forged = Buffer.from(JSON.stringify({ u: 'admin', exp: Date.now() + 1e9 })).toString('base64url');
  assert.equal(auth.verifyToken(forged + '.' + s, cfg.secret), null);
  assert.equal(auth.verifyToken(b + '.' + s.slice(0, -2) + 'AA', cfg.secret), null);
  assert.equal(auth.verifyToken(auth.signToken({ u: 'a', exp: Date.now() - 1 }, cfg.secret), cfg.secret), null);
  assert.equal(auth.verifyToken('', cfg.secret), null);
});

const big = { name: 'Big Co', host: 'big.example', url: 'https://big.example', colors: { primary: '#336699' }, products: Array.from({ length: 40 }, (_, i) => ({ name: `Product ${i} with a long name`, image: `https://big.example/img/${i}.jpg`, url: `https://big.example/p/${i}`, description: 'A reasonably long description that goes on for a bit '.repeat(3) })), images: Array.from({ length: 40 }, (_, i) => ({ src: `https://big.example/i/${i}.jpg`, alt: 'x' })), sections: Array.from({ length: 9 }, (_, i) => ({ kind: 'cards', heading: 'Section ' + i, text: 'Text '.repeat(60), items: Array.from({ length: 8 }, (_, j) => ({ title: 'Item ' + j, text: 'Words '.repeat(40), image: `https://big.example/s/${i}${j}.jpg` })) })), evil: '<script>', contacts: { emails: ['a@b.co'], phones: [], address: 'x' }, social: { linkedin: 'javascript:alert(1)', facebook: 'https://facebook.com/x' } };

test('share links: 48 hours, view-only data, tamper-proof', async () => {
  const t0 = 1_700_000_000_000;
  const { token, expiresAt, short } = await createShare(big, { agency: 'Studio', by: 'Alice', secret: cfg.secret, now: t0, env: {} });
  assert.equal(short, false);
  assert.equal(expiresAt - t0, 48 * 3600 * 1000); assert.equal(SHARE_TTL_MS, 48 * 3600 * 1000);
  assert.ok(token.length <= 9000, 'token fits in a URL: ' + token.length);
  const ok = await readShare(token, { secret: cfg.secret, now: t0 + 47 * 3600 * 1000, env: {} });
  assert.equal(ok.ok, true); assert.equal(ok.data.profile.name, 'Big Co'); assert.equal(ok.data.agency, 'Studio');
  assert.ok(ok.data.profile.products.length >= 8, 'keeps products');
  assert.ok(!('evil' in ok.data.profile), 'unknown fields dropped');
  assert.ok(!ok.data.profile.social.linkedin, 'javascript: URLs dropped'); assert.ok(ok.data.profile.social.facebook);
  const last = await readShare(token, { secret: cfg.secret, now: t0 + 48 * 3600 * 1000 - 1, env: {} }); assert.equal(last.ok, true, 'still valid one ms before 48h');
  const gone = await readShare(token, { secret: cfg.secret, now: t0 + 48 * 3600 * 1000, env: {} }); assert.deepEqual([gone.ok, gone.reason], [false, 'expired']);
  const bad = await readShare(token.slice(0, -3) + 'abc', { secret: cfg.secret, now: t0, env: {} }); assert.deepEqual([bad.ok, bad.reason], [false, 'invalid']);
  const wrong = await readShare(token, { secret: 'z'.repeat(48), now: t0, env: {} }); assert.equal(wrong.ok, false);
  assert.equal((await readShare('garbage', { secret: cfg.secret, env: {} })).ok, false);
  assert.equal((await readShare('abcdefghij', { secret: cfg.secret, env: {} })).reason, 'invalid', 'short ids need KV');
});

test('slimProfile bounds everything', () => {
  const s = slimProfile({ name: 'x'.repeat(5000), products: Array(500).fill({ name: 'p' }), images: Array(500).fill({ src: 'https://a.co/x.jpg' }) });
  assert.ok(s.name.length <= 80); assert.ok(s.products.length <= 30); assert.ok(s.images.length <= 8);
  assert.doesNotThrow(() => slimProfile(null));
});

test('handler: login, protected routes, share round trip, CSRF', async () => {
  process.env.WDG_AUTH = JSON.stringify(cfg);
  const { handle } = await import('../lib/handler.js');
  const J = { 'content-type': 'application/json', host: 'app.test' };
  assert.equal((await handle('me', { headers: J })).json.authed, false);
  assert.equal((await handle('analyze', { method: 'POST', headers: J, body: { url: 'example.com' } })).status, 401);
  assert.equal((await handle('leads', { headers: J })).status, 401);
  assert.equal((await handle('share', { method: 'POST', headers: J, body: { profile: big } })).status, 401, 'creating a link needs login');
  const bad = await handle('login', { method: 'POST', headers: J, ip: '1.1.1.1', body: { username: 'Alice', password: 'nope' } }); assert.equal(bad.status, 401);
  assert.equal((await handle('login', { method: 'POST', headers: { ...J, 'content-type': 'text/plain' }, ip: '1.1.1.2', body: { username: 'Alice', password: PW_A } })).status, 403, 'CSRF: non-JSON refused');
  assert.equal((await handle('login', { method: 'POST', headers: { ...J, origin: 'https://evil.test' }, ip: '1.1.1.3', body: { username: 'Alice', password: PW_A } })).status, 403, 'CSRF: foreign origin refused');
  const good = await handle('login', { method: 'POST', headers: { ...J, 'x-forwarded-proto': 'https' }, ip: '1.1.1.4', body: { username: 'Alice', password: PW_A } });
  assert.equal(good.status, 200); assert.match(good.headers['set-cookie'], /HttpOnly/); assert.match(good.headers['set-cookie'], /Secure/); assert.match(good.headers['set-cookie'], /SameSite=Lax/);
  const H = { ...J, cookie: cookieOf(good) };
  const me = await handle('me', { headers: H }); assert.deepEqual([me.json.authed, me.json.user], [true, 'Alice']);
  assert.equal((await handle('leads', { headers: H })).json.length, 19);
  const forged = { ...J, cookie: 'wdg_session=' + auth.signToken({ u: 'Alice', exp: Date.now() + 1e6 }, 'q'.repeat(48)) };
  assert.equal((await handle('leads', { headers: forged })).status, 401, 'forged cookie rejected');
  const made = await handle('share', { method: 'POST', headers: H, body: { profile: big, agency: 'Studio' } });
  assert.equal(made.status, 200); assert.equal(made.json.hours, 48);
  const view = await handle('share', { method: 'GET', headers: { host: 'app.test' }, ip: '2.2.2.2', query: { t: made.json.token } });
  assert.equal(view.status, 200, 'the client needs no login'); assert.equal(view.json.profile.name, 'Big Co'); assert.match(view.headers['x-robots-tag'], /noindex/);
  assert.equal((await handle('share', { method: 'GET', headers: { host: 'app.test' }, ip: '2.2.2.3', query: { t: made.json.token + 'x' } })).status, 404);
  const out = await handle('logout', { method: 'POST', headers: H }); assert.match(out.headers['set-cookie'], /Max-Age=0/);
  delete process.env.WDG_AUTH;
  const off = await handle('login', { method: 'POST', headers: J, ip: '1.1.1.5', body: { username: 'Alice', password: PW_A } }); assert.equal(off.status, 503, 'fails closed when not configured');
  assert.equal((await handle('leads', { headers: H })).status, 401, 'no session is valid without config');
});

test('login is rate limited', async () => {
  process.env.WDG_AUTH = JSON.stringify(cfg);
  const { handle } = await import('../lib/handler.js');
  const J = { 'content-type': 'application/json', host: 'app.test' }; let last;
  for (let i = 0; i < 12; i++) last = await handle('login', { method: 'POST', headers: J, ip: '9.9.9.9', body: { username: 'Alice', password: 'bad' + i } });
  assert.equal(last.status, 429);
  delete process.env.WDG_AUTH;
});
