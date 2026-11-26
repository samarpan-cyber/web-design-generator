import { extractProfile } from './extract.js';

const hits = new Map();
function limited(ip, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

/** Framework-agnostic: (body, headers, ip) -> {status, json} */
export async function analyze({ body, headers = {}, ip = 'x' }) {
  const key = process.env.ACCESS_KEY;
  if (key && headers['x-access-key'] !== key) return { status: 401, json: { error: 'Access key required', code: 'AUTH' } };
  if (limited(ip)) return { status: 429, json: { error: 'Too many requests - wait a minute and retry.' } };
  const url = body && typeof body.url === 'string' ? body.url.slice(0, 500) : '';
  const hint = body && typeof body.name === 'string' ? body.name.slice(0, 80) : '';
  try {
    const profile = await extractProfile(url, { hint });
    return { status: 200, json: { ok: true, profile } };
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'The website took too long to respond' : (e && e.message) || 'Could not read that website';
    const friendly = /ENOTFOUND|getaddrinfo/.test(msg) ? 'That domain could not be found' : /fetch failed/.test(msg) ? 'Could not connect to that website' : msg;
    return { status: 422, json: { error: friendly } };
  }
}

export const authRequired = () => !!process.env.ACCESS_KEY;
