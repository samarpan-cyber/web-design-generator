// Shared wrapper: files starting with an underscore are not exposed as routes by Vercel.
import { handle } from '../lib/handler.js';

export const run = name => async (req, res) => {
  const headers = req.headers || {};
  const ip = (headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'x';
  const out = await handle(name, { method: req.method, headers, ip, body: req.body, query: req.query || {} });
  for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
  res.status(out.status).json(out.json);
};
