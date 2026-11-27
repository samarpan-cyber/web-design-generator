// One request handler used by both the Vercel functions (api/*.js) and local-server.js.
// handle(name, { method, headers, ip, body, query }) -> { status, json, headers }
import { extractProfile } from './extract.js';
import * as auth from './auth.js';
import { createShare, readShare, SHARE_TTL_MS } from './share.js';
import { LEADS } from './leads-data.js';
import { decodeUpload, buildIntakeProfile } from './intake.js';
import { readScreenshot } from './vision.js';

const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); const arr = (hits.get(key) || []).filter(t => now - t < windowMs); arr.push(now); hits.set(key, arr);
  if (hits.size > 8000) hits.clear();
  return arr.length > max;
}
const NO_STORE = { 'cache-control': 'no-store' };
const json = (status, body, headers = {}) => ({ status, json: body, headers: { ...NO_STORE, ...headers } });
const isHttps = h => /https/i.test(h['x-forwarded-proto'] || '') || (!!h.host && !/^(localhost|127\.|\[::1\])/.test(h.host));

/** Cross-site POSTs are refused: JSON only, and the Origin (when sent) must be this host. */
function csrfOk({ method, headers }) {
  if (method !== 'POST') return true;
  if (!/application\/json/i.test(headers['content-type'] || '')) return false;
  if (!headers.origin) return true;
  try { return new URL(headers.origin).host === headers.host; } catch { return false; }
}

export async function handle(name, req) {
  const { method = 'GET', headers = {}, ip = 'x', query = {} } = req; const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!csrfOk({ method, headers })) return json(403, { error: 'Request blocked' });
  const cfg = auth.getConfig();
  const session = auth.sessionFrom(headers, cfg);
  const needLogin = () => json(401, { error: 'Please log in', code: 'AUTH' });

  switch (name) {
    case 'me':
      return json(200, { configured: !!cfg, authed: !!session, user: session ? session.u : null });

    case 'login': {
      if (method !== 'POST') return json(405, { error: 'POST only' });
      if (!cfg) return json(503, { error: 'Login is not set up on this server yet. Add the WDG_AUTH setting in the hosting dashboard.', code: 'NOT_CONFIGURED' });
      if (limited('login:' + ip, 10, 10 * 60_000)) return json(429, { error: 'Too many attempts. Wait a few minutes and try again.' });
      const who = auth.checkLogin(body.username, body.password, cfg);
      if (!who) { await new Promise(r => setTimeout(r, 450)); return json(401, { error: 'Wrong username or password' }); }
      return json(200, { ok: true, user: who }, { 'set-cookie': auth.setCookie(auth.newSession(who, cfg), { secure: isHttps(headers) }) });
    }

    case 'logout':
      return json(200, { ok: true }, { 'set-cookie': auth.clearCookie({ secure: isHttps(headers) }) });

    case 'leads':
      if (!session) return needLogin();
      return json(200, LEADS);

    case 'analyze': {
      if (method !== 'POST') return json(405, { error: 'POST only' });
      if (!session) return needLogin();
      if (limited('an:' + session.u, 40, 60_000)) return json(429, { error: 'Too many requests. Wait a minute and retry.' });
      const url = typeof body.url === 'string' ? body.url.slice(0, 500) : ''; const hint = typeof body.name === 'string' ? body.name.slice(0, 80) : '';
      try { return json(200, { ok: true, profile: await extractProfile(url, { hint }) }); }
      catch (e) {
        const msg = e && e.name === 'AbortError' ? 'The website took too long to respond' : (e && e.message) || 'Could not read that website';
        return json(422, { error: /ENOTFOUND|getaddrinfo/.test(msg) ? 'That domain could not be found' : /fetch failed/.test(msg) ? 'Could not connect to that website' : msg });
      }
    }

    case 'intake': { // sites that cannot be crawled: sheets, sitemaps, Google Business text, screenshots
      if (method !== 'POST') return json(405, { error: 'POST only' });
      if (!session) return needLogin();
      if (limited('in:' + session.u, 20, 60_000)) return json(429, { error: 'Too many requests. Wait a minute and retry.' });
      try {
        const inp = { name: String(body.name || '').slice(0, 80), host: String(body.host || '').slice(0, 120), gmb: String(body.gmb || '').slice(0, 20000) };
        let base = null; const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '';
        if (url) { try { base = await extractProfile(url, { hint: inp.name }); } catch { /* the whole point: it may not be crawlable */ } }
        let image = null;
        for (const f of (Array.isArray(body.files) ? body.files : []).slice(0, 4)) {
          const d = decodeUpload(f);
          if (d.kind === 'rows') inp.rows = d.rows; else if (d.kind === 'sitemap') inp.sitemap = d.text; else if (d.kind === 'gmb') inp.gmb = (inp.gmb + '\n' + d.text).slice(0, 20000); else if (d.kind === 'image') image = d;
        }
        if (image) { try { inp.vision = await readScreenshot(image); } catch (e) { inp.visionError = e.message; } }
        const profile = buildIntakeProfile(inp, base);
        if (!profile.products.length && !profile.description && !(profile.contacts.phones.length || profile.contacts.emails.length)) return json(422, { error: 'Nothing usable found. Add a product sheet, sitemap, Google Business details or a screenshot.' + (image && !inp.vision ? ' Screenshot reading needs an AI key on the server.' : '') });
        return json(200, { ok: true, profile, notes: profile.intake.notes, visionError: inp.visionError || '' });
      } catch (e) { return json(422, { error: (e && e.message) || 'Could not read those files' }); }
    }

    case 'share': {
      if (method === 'GET') { // public: whoever holds the link can read it until it expires
        if (!cfg) return json(503, { error: 'Sharing is not set up on this server yet.' });
        if (limited('sr:' + ip, 120, 60_000)) return json(429, { error: 'Too many requests' });
        const r = await readShare(String(query.t || ''), { secret: cfg.secret });
        if (!r.ok) return json(r.reason === 'expired' ? 410 : 404, { error: r.reason });
        return json(200, { ok: true, profile: r.data.profile, agency: r.data.agency || '', exp: r.data.exp }, { 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' });
      }
      if (method !== 'POST') return json(405, { error: 'GET or POST only' });
      if (!session) return needLogin();
      if (limited('sc:' + session.u, 30, 10 * 60_000)) return json(429, { error: 'Too many links created. Try again shortly.' });
      if (!body.profile || typeof body.profile !== 'object') return json(400, { error: 'Nothing to share' });
      try {
        const r = await createShare(body.profile, { agency: body.agency, by: session.u, secret: cfg.secret });
        return json(200, { ok: true, token: r.token, expiresAt: r.expiresAt, short: r.short, hours: SHARE_TTL_MS / 3_600_000 });
      } catch { return json(500, { error: 'Could not create the link' }); }
    }

    default:
      return json(404, { error: 'Not found' });
  }
}
