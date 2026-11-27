// Zero-framework Node server: static files + the same API handler Vercel uses. `npm start` -> http://localhost:3000
// Reads WDG_AUTH from the environment or from data/wdg-auth.json (git-ignored).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from './lib/handler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'public');
const PORT = process.env.PORT || 3000;
if (!process.env.WDG_AUTH) { try { process.env.WDG_AUTH = fs.readFileSync(path.join(here, 'data/wdg-auth.json'), 'utf8').trim(); } catch { /* not configured */ } }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const API = new Set(['login', 'logout', 'me', 'leads', 'analyze', 'share', 'intake']);

function readBody(req, limit = 400_000) {
  return new Promise((resolve, reject) => {
    let d = ''; req.on('data', c => { d += c; if (d.length > limit) { reject(new Error('Body too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { reject(new Error('Bad JSON')); } });
    req.on('error', reject);
  });
}
const send = (res, status, obj, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const m = url.pathname.match(/^\/api\/([a-z]+)$/);
    if (m && API.has(m[1])) {
      const body = req.method === 'POST' ? await readBody(req, m[1] === 'intake' ? 6_500_000 : 400_000) : {};
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
      const out = await handle(m[1], { method: req.method, headers: req.headers, ip, body, query: Object.fromEntries(url.searchParams) });
      return send(res, out.status, out.json, out.headers);
    }
    if (url.pathname === '/healthz') return send(res, 200, { ok: true });
    let p = decodeURIComponent(url.pathname);
    if (/^\/s\/[\w.-]+$/.test(p)) p = '/share.html';
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
      const h = { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' };
      if (p === '/share.html') Object.assign(h, { 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' });
      res.writeHead(200, h); res.end(data);
    });
  } catch (e) { send(res, 400, { error: e.message }); }
}).listen(PORT, () => console.log(`Web Design Generator running on http://localhost:${PORT}`));
