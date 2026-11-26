// Vercel serverless entry (also works on Netlify/Cloudflare-style Node runtimes).
import { analyze } from '../lib/handler.js';
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'x';
  const out = await analyze({ body: req.body, headers: req.headers, ip });
  res.status(out.status).json(out.json);
}
