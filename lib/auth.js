// Login + session tokens. No credentials or secrets live in the repo (it is public):
// everything comes from ONE environment variable, WDG_AUTH, a JSON string:
//   { "secret": "<random 32+ chars>", "users": { "samarpan": { "name": "Samarpan", "hash": "scrypt$salt$hash" }, ... } }
// Generate it with:  node scripts/make-auth.mjs "Samarpan:password" "Chirag:password"
import crypto from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1 };
const SESSION_MS = 12 * 60 * 60 * 1000;
export const COOKIE = 'wdg_session';

export function getConfig(env = process.env) {
  const raw = env.WDG_AUTH; if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    if (!c || typeof c.secret !== 'string' || c.secret.length < 24 || !c.users || typeof c.users !== 'object') return null;
    return c;
  } catch { return null; }
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, 32, SCRYPT);
  return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`;
}

export function verifyPassword(pw, stored) {
  try {
    const [alg, s, h] = String(stored).split('$'); if (alg !== 'scrypt') return false;
    const want = Buffer.from(h, 'hex');
    const got = crypto.scryptSync(String(pw), Buffer.from(s, 'hex'), want.length, SCRYPT);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch { return false; }
}

// A real-looking hash so an unknown username costs the same time as a wrong password.
const DUMMY = hashPassword('not-a-real-password');

/** Returns the canonical display name on success, otherwise null. */
export function checkLogin(username, password, cfg) {
  const key = String(username || '').trim().toLowerCase().slice(0, 60);
  const user = cfg && cfg.users && Object.prototype.hasOwnProperty.call(cfg.users, key) ? cfg.users[key] : null;
  const ok = verifyPassword(String(password || '').slice(0, 200), user ? user.hash : DUMMY);
  return user && ok ? (user.name || key) : null;
}

/* ---------- signed tokens (sessions and share links) ---------- */
export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifyToken(token, secret, now = Date.now()) {
  const [body, sig] = String(token || '').split('.'); if (!body || !sig) return null;
  const want = crypto.createHmac('sha256', secret).update(body).digest();
  let got; try { got = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); return p && (!p.exp || p.exp > now) ? p : null; } catch { return null; }
}

/* ---------- cookies ---------- */
export function readCookie(header, name = COOKIE) {
  for (const part of String(header || '').split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim()); }
  return '';
}
export function sessionFrom(headers, cfg, now = Date.now()) {
  if (!cfg) return null;
  const p = verifyToken(readCookie(headers && headers.cookie), cfg.secret, now);
  return p && p.u ? p : null;
}
export function newSession(name, cfg, now = Date.now()) {
  const token = signToken({ u: name, iat: now, exp: now + SESSION_MS }, cfg.secret);
  return token;
}
export function setCookie(token, { secure = true } = {}) {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${secure ? '; Secure' : ''}`;
}
export function clearCookie({ secure = true } = {}) { return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`; }
