// Real estate facts from a developer, builder, broker or agency website.
// Reads only what the page says. Prices, RERA numbers, areas and statuses are shown only when found.
import { clean, trunc } from './util.js';

const AMEN = [['Swimming pool', /swimming pool/i], ['Gym', /\b(gym|fitness (centre|center))\b/i], ['Clubhouse', /club ?house/i], ['Landscaped gardens', /\b(garden|landscap\w+|park)\b/i], ['Covered parking', /\b(covered |car )?parking\b/i], ['24x7 security', /\b(24\s?[x/]\s?7|round the clock) security|\bsecurity\b/i], ['Power backup', /power back.?up/i], ['Lifts', /\blifts?\b|\belevators?\b/i], ['Play area', /(children'?s?|kids) play|play area/i], ['Jogging track', /jogging|walking track/i], ['CCTV', /\bcctv\b/i], ['EV charging', /\bev charging\b/i], ['Rainwater harvesting', /rain ?water harvesting/i], ['Co-working lounge', /co-?working/i], ['Conference rooms', /conference room/i], ['Cafeteria', /\b(cafeteria|food court)\b/i], ['Loading docks', /loading dock/i], ['Fire safety', /fire (safety|fighting)/i]];
const STATUS = [['Under construction', /under construction|ongoing/i], ['Ready to move', /ready (to move|possession)|completed|handed over/i], ['New launch', /new launch|pre.?launch|just launched/i], ['Upcoming', /upcoming|coming soon/i]];

export const parseConfig = t => [...new Set([...String(t || '').matchAll(/(\d(?:\.\d)?)\s*(?:&|and|,|\/|-|to)?\s*(\d(?:\.\d)?)?\s*BHK/gi)].flatMap(m => [m[1], m[2]].filter(Boolean)))].map(n => `${n} BHK`).slice(0, 5);
export function parseArea(t) {
  const m = /([\d,]{3,6})\s*(?:-|to|–)\s*([\d,]{3,6})\s*(sq\.?\s*ft\.?|sqft|sq\.?\s*yards?|sq\.?\s*m)/i.exec(t) || /([\d,]{3,6})()\s*(sq\.?\s*ft\.?|sqft|sq\.?\s*yards?|sq\.?\s*m)/i.exec(t);
  if (!m) return ''; const unit = /yard/i.test(m[3]) ? 'sq yd' : /m\b/i.test(m[3]) ? 'sq m' : 'sq ft';
  return m[2] ? `${m[1]} to ${m[2]} ${unit}` : `${m[1]} ${unit}`;
}
export function parsePrice(t) {
  const m = /(?:starting(?: from| at)?|starts? (?:at|from)|from|price|@)?\s*(₹|rs\.?|inr|\$|aed|usd)\s*([\d.,]+)\s*(cr(?:ore)?s?|lakhs?|lacs?|l\b|k\b|m\b|million)?/i.exec(String(t || ''));
  if (!m || !/\d/.test(m[2]) || m[2].replace(/[.,]/g, '').length > 11) return '';
  const cur = /rs|inr|₹/i.test(m[1]) ? '₹' : /\$|usd/i.test(m[1]) ? '$' : m[1].toUpperCase(); const unit = (m[3] || '').toLowerCase(); const u = /^cr/.test(unit) ? ' Cr' : /^(lakh|lac|l)/.test(unit) ? ' Lakh' : /^k/.test(unit) ? 'K' : /^m/.test(unit) ? ' M' : '';
  return `${cur}${m[2].replace(/[.,]+$/, '')}${u}`;
}
export const parseStatus = t => (STATUS.find(([, re]) => re.test(t)) || [''])[0];
export function parseRera(t) {
  const out = new Set(); for (const m of String(t || '').matchAll(/\b(P\d{11})\b/g)) out.add(m[1]);
  for (const m of String(t || '').matchAll(/RERA\s*(?:Reg(?:istration)?\.?|No\.?|Number)?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\/\-.]{7,40})/g)) if (/\d/.test(m[1])) out.add(m[1].replace(/[.,]$/, ''));
  return [...out].slice(0, 3);
}
const locOf = t => { const m = /\b(?:in|at|near|off)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){0,2})(?=[,.\s]|$)/.exec(String(t || '')); return m && !/^(The|Our|Your|This|That|India)$/.test(m[1]) ? m[1] : ''; };

export function enrichProject(it) {
  const t = `${it.name || ''}. ${it.description || ''}. ${it.raw || ''}`;
  return { name: clean(it.name), location: it.location || locOf(t), config: parseConfig(t).join(', '), area: parseArea(t), price: parsePrice(t), status: parseStatus(t), type: it.type || '', image: it.image || '', url: it.url || '', description: it.description && it.description.length > 20 ? trunc(clean(it.description), 140) : '' };
}

/** text: the page text. products: scraped cards. sections: scraped homepage sections. */
export function extractEstate({ text = '', products = [], sections = [], headings = [], nav = [], address = '' } = {}) {
  const items = [...products.map(p => ({ name: p.name, description: p.description, image: p.image, url: p.url, location: p.location, raw: p.raw })), ...sections.filter(s => s.kind === 'cards' && /project|propert|listing|residen|apartment|villa|plot|space|launch|portfolio|featured|ongoing|completed/i.test(s.heading)).flatMap(s => s.items.map(i => ({ name: i.title, description: i.text, image: i.image, url: i.url })))];
  const seen = new Set(); const projects = [];
  for (const it of items) { const n = clean(it.name); if (!n || n.length < 3 || n.length > 70 || seen.has(n.toLowerCase())) continue; seen.add(n.toLowerCase()); projects.push(enrichProject(it)); if (projects.length >= 12) break; }
  const cities = new Map(); for (const h of [...headings, ...nav.map(n => n.label), address]) { const l = locOf(h); if (l) cities.set(l, (cities.get(l) || 0) + 1); }
  for (const pr of projects) if (pr.location) cities.set(pr.location, (cities.get(pr.location) || 0) + 1);
  const addr = String(address).split(',').map(x => x.trim()).filter(x => /^[A-Za-z .]{3,24}$/.test(x)).slice(-2, -1)[0]; if (addr) cities.set(addr, (cities.get(addr) || 0) + 1);
  const base = { projects, rera: parseRera(text), configs: parseConfig(text), area: parseArea(text), price: parsePrice(text), statuses: [...new Set(projects.map(p => p.status).filter(Boolean))], locations: [...cities].sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 5), amenities: AMEN.filter(([, re]) => re.test(text)).map(([n]) => n).slice(0, 12) };
  return base;
}
