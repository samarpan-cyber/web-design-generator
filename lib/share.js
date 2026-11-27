// Temporary client links. A link is valid for 48 hours and grants view-only access to the five concepts.
//  - Default (no setup): a signed, self-contained token in the URL. Nothing is stored; expiry is enforced by the signature.
//  - If KV_REST_API_URL + KV_REST_API_TOKEN exist (Vercel KV / Upstash Redis): a short link whose data expires in Redis after 48h.
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { signToken, verifyToken } from './auth.js';

export const SHARE_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_TOKEN = 9000; // keep URLs well under server and browser limits

const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').slice(0, n) : '');
const url = v => { const s = str(v, 600).trim(); return /^https?:\/\//i.test(s) ? s : null; };
const num = v => (Number.isFinite(+v) ? +v : 0);
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

/** Whitelist and size-limit a profile so a link can never carry arbitrary or huge data. */
export function slimProfile(p, level = 0) {
  p = p && typeof p === 'object' ? p : {};
  const L = [{ prod: 30, img: 8, sec: 6, items: 6 }, { prod: 20, img: 4, sec: 5, items: 4 }, { prod: 12, img: 2, sec: 4, items: 3 }, { prod: 8, img: 0, sec: 3, items: 3 }][Math.min(level, 3)];
  const c = p.contacts || {}; const col = p.colors || {};
  return {
    name: str(p.name, 80), host: str(p.host, 120), url: url(p.url), hintName: str(p.hintName, 80),
    tagline: str(p.tagline, 140), description: str(p.description, 400), about: str(p.about, 500),
    logo: url(p.logo), favicon: url(p.favicon), ogImage: url(p.ogImage),
    colors: { primary: /^#[0-9a-f]{6}$/i.test(col.primary || '') ? col.primary : null, secondary: /^#[0-9a-f]{6}$/i.test(col.secondary || '') ? col.secondary : null },
    nav: [], headings: arr(p.headings, 6).map(h => str(h, 90)),
    categories: arr(p.categories, 12).map(x => str(x, 60)),
    industries: arr(p.industries, 6).map(x => str(x, 40)), certifications: arr(p.certifications, 6).map(x => str(x, 30)),
    stats: arr(p.stats, 4).map(s => ({ value: num(s.value), suffix: str(s.suffix, 6), label: str(s.label, 40) })),
    products: arr(p.products, L.prod).map(x => ({ name: str(x.name, 80), image: url(x.image), url: url(x.url), description: str(x.description, 110) })).filter(x => x.name),
    images: arr(p.images, L.img).map(i => ({ src: url(i.src), alt: str(i.alt, 60) })).filter(i => i.src),
    contacts: { emails: arr(c.emails, 2).map(x => str(x, 90)), phones: arr(c.phones, 2).map(x => str(x, 40)), address: str(c.address, 160) },
    social: Object.fromEntries(Object.entries(p.social || {}).slice(0, 6).map(([k, v]) => [str(k, 20), url(v)]).filter(([, v]) => v)),
    sections: arr(p.sections, L.sec).map(s => ({
      kind: str(s.kind, 12), heading: str(s.heading, 80), text: str(s.text, 260), image: url(s.image),
      items: arr(s.items, L.items).map(i => ({ title: str(i.title, 60), text: str(i.text, 140), image: url(i.image), url: url(i.url) })),
      bullets: arr(s.bullets, 6).map(b => str(b, 70)),
      logos: arr(s.logos, 12).map(l => ({ src: url(l.src), alt: str(l.alt, 40) })).filter(l => l.src),
      quotes: arr(s.quotes, 3).map(q => ({ text: str(q.text, 200), author: str(q.author, 60) }))
    })),
    meta: { found: {}, placeholders: 0 }, notes: []
  };
}

const kvOn = (env = process.env) => !!(env.KV_REST_API_URL && env.KV_REST_API_TOKEN);
async function kv(cmd, env = process.env) {
  const r = await fetch(env.KV_REST_API_URL, { method: 'POST', headers: { authorization: `Bearer ${env.KV_REST_API_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd), signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('KV ' + r.status); return (await r.json()).result;
}

/** Create a link. Returns { token, expiresAt, short } where token goes after /s/ in the URL. */
export async function createShare(profile, { agency = '', by = '', secret, now = Date.now(), env = process.env } = {}) {
  const exp = now + SHARE_TTL_MS;
  const meta = { v: 1, exp, iat: now, agency: str(agency, 60), by: str(by, 40) };
  if (kvOn(env)) {
    const id = crypto.randomBytes(9).toString('base64url');
    await kv(['SET', 'share:' + id, JSON.stringify({ ...meta, profile: slimProfile(profile, 0) }), 'EX', String(Math.floor(SHARE_TTL_MS / 1000))], env);
    return { token: id, expiresAt: exp, short: true };
  }
  for (let level = 0; level < 4; level++) {
    const body = zlib.gzipSync(Buffer.from(JSON.stringify({ ...meta, profile: slimProfile(profile, level) }))).toString('base64url');
    const token = signToken({ z: body, exp }, secret);
    if (token.length <= MAX_TOKEN || level === 3) return { token, expiresAt: exp, short: false };
  }
}

/** Read a link. Returns { ok, data } or { ok:false, reason: 'invalid' | 'expired' }. */
export async function readShare(token, { secret, now = Date.now(), env = process.env } = {}) {
  token = String(token || '');
  try {
    if (!token.includes('.')) { // short id
      if (!kvOn(env) || !/^[A-Za-z0-9_-]{8,20}$/.test(token)) return { ok: false, reason: 'invalid' };
      const raw = await kv(['GET', 'share:' + token], env); if (!raw) return { ok: false, reason: 'expired' };
      const data = JSON.parse(raw); return data.exp > now ? { ok: true, data } : { ok: false, reason: 'expired' };
    }
    // signed token: check the signature first, then tell "expired" apart from "tampered"
    const p = verifyToken(token, secret, 0);
    if (!p || !p.z) return { ok: false, reason: 'invalid' };
    if (p.exp <= now) return { ok: false, reason: 'expired' };
    const data = JSON.parse(zlib.gunzipSync(Buffer.from(p.z, 'base64url'), { maxOutputLength: 400_000 }).toString('utf8'));
    return { ok: true, data };
  } catch { return { ok: false, reason: 'invalid' }; }
}
