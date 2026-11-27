// Intake for sites that cannot be crawled: spreadsheets, sitemaps, Google Business text and screenshots
// become the same profile object the crawler produces. No dependencies (zip reading uses node:zlib).
import zlib from 'node:zlib';
import { clean, trunc } from './util.js';
import { detectIndustry, signalsFromLinks } from './industry.js';
import { extractEstate, enrichProject } from './estate.js';

const EMPTY = host => ({ name: '', host, url: host ? 'https://' + host : '', colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {}, tagline: '', description: '', about: '', logo: '', sections: [] });

/* ---------- CSV ---------- */
export function parseCsv(text) {
  text = String(text || '').replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const d = [['\t', (first.match(/\t/g) || []).length], [';', (first.match(/;/g) || []).length], [',', (first.match(/,/g) || []).length]].sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === d) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
    if (rows.length > 5000) break;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim()));
}

/* ---------- XLSX (zip + xml, first sheet) ---------- */
function unzip(buf) {
  const files = {}; let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error('That file is not a valid Excel workbook');
  const count = buf.readUInt16LE(end + 10); let p = buf.readUInt32LE(end + 16);
  for (let n = 0; n < count && n < 2000; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl); p += 46 + nl + el + cl;
    if (!/^(xl\/(sharedStrings|worksheets\/sheet\d+|workbook)\.xml)$/.test(name) || csize > 30e6) continue;
    const ds = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28); const raw = buf.subarray(ds, ds + csize);
    files[name] = (method === 0 ? raw : zlib.inflateRawSync(raw, { maxOutputLength: 60e6 })).toString('utf8');
  }
  return files;
}
const unxml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
export function parseXlsx(buf) {
  const f = unzip(buf), sheetName = Object.keys(f).filter(k => /worksheets/.test(k)).sort()[0];
  if (!sheetName) throw new Error('No sheet found in that workbook');
  const shared = [...(f['xl/sharedStrings.xml'] || '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')));
  const rows = [];
  for (const rm of f[sheetName].matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cm of rm[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(cm[1]); if (!ref) continue;
      let col = 0; for (const ch of ref[1]) col = col * 26 + ch.charCodeAt(0) - 64; col--;
      const t = /t="(\w+)"/.exec(cm[1]), v = /<v>([\s\S]*?)<\/v>/.exec(cm[2] || ''), is = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(cm[2] || '');
      row[col] = t && t[1] === 's' && v ? shared[+v[1]] || '' : is ? unxml(is[1]) : v ? unxml(v[1]) : '';
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
    if (row.some(c => String(c).trim())) rows.push(row);
    if (rows.length > 5000) break;
  }
  return rows;
}

/* ---------- rows -> products ---------- */
const COLS = { loc: /locat|locality|city|area name|micro/i, cfg: /bhk|config|unit type|property type/i, size: /size|sq ?ft|area$|carpet|built/i, price: /price|cost|rate|budget/i, status: /status|stage|possession/i, name: /^(product|item|name|title|model|part|project|property|listing|development|service|treatment)( ?(name|title|no\.?|number))?$/i, desc: /desc|detail|about|summary|spec/i, image: /image|img|photo|picture|thumb/i, url: /^(url|link|page)$|product ?(url|link)/i, cat: /categor|type|group|series|range/i };
export function rowsToProducts(rows) {
  if (!rows || rows.length < 2) return [];
  const head = rows[0].map(h => String(h || '').trim()); const idx = {};
  for (const [k, re] of Object.entries(COLS)) { const i = head.findIndex(h => re.test(h)); if (i >= 0) idx[k] = i; }
  let start = 1; if (idx.name === undefined) { idx.name = 0; if (!head.some(h => /name|product|item|title|project|property|listing/i.test(h))) start = 0; }
  const out = [], seen = new Set();
  for (const r of rows.slice(start)) {
    const name = trunc(clean(r[idx.name]), 90); if (!name || name.length < 2 || seen.has(name.toLowerCase())) continue; seen.add(name.toLowerCase());
    const img = idx.image !== undefined ? String(r[idx.image] || '').trim() : '', url = idx.url !== undefined ? String(r[idx.url] || '').trim() : '';
    const g = k => (idx[k] !== undefined ? clean(r[idx[k]]) : '');
    out.push({ name, description: idx.desc !== undefined ? trunc(clean(r[idx.desc]), 220) : '', image: /^https?:\/\//i.test(img) ? img : null, url: /^https?:\/\//i.test(url) ? url : null, category: idx.cat !== undefined ? clean(r[idx.cat]) : '', location: g('loc'), configRaw: g('cfg'), sizeRaw: g('size'), priceRaw: g('price'), statusRaw: g('status') });
    if (out.length >= 120) break;
  }
  return out;
}

/* ---------- sitemap ---------- */
export function parseSitemap(xml) {
  const urls = [...String(xml || '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => unxml(m[1])).slice(0, 4000);
  const host = urls[0] ? new URL(urls[0]).hostname.replace(/^www\./, '') : '';
  const prod = [], seen = new Set(), pages = [];
  for (const u of urls) {
    let p; try { p = new URL(u); } catch { continue; }
    const segs = p.pathname.split('/').filter(Boolean); if (!segs.length) continue;
    const last = decodeURIComponent(segs[segs.length - 1]).replace(/\.\w{2,5}$/, '');
    if (/^(page|tag|author|category|feed|wp-|cart|checkout|my-account|privacy|terms|login|blog|news|contact|about)/i.test(segs[0]) && segs.length < 2) { pages.push(segs[0]); continue; }
    if (!/product|shop|item|catalog|store|\/p\//i.test(p.pathname) && segs.length < 2) { pages.push(last); continue; }
    const name = last.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    if (name.length < 3 || seen.has(name.toLowerCase()) || /^\d+$/.test(name)) continue; seen.add(name.toLowerCase());
    prod.push({ name: trunc(name, 80), description: '', image: null, url: u, category: segs.length > 2 ? segs[segs.length - 2].replace(/[-_]+/g, ' ') : '' });
    if (prod.length >= 80) break;
  }
  return { host, products: prod, pages: [...new Set(pages)].slice(0, 12) };
}

/* ---------- Google Business (pasted text or JSON) ---------- */
export function parseGmb(text) {
  const out = { name: '', phone: '', address: '', website: '', category: '', description: '', hours: '', reviews: [], email: '', rating: null };
  text = String(text || '').trim(); if (!text) return out;
  try { const j = JSON.parse(text); const o = Array.isArray(j) ? j[0] : j; if (o && typeof o === 'object') {
    out.name = clean(o.name || o.title || o.businessName); out.phone = clean(o.phone || o.phoneNumber || o.telephone); out.address = clean(o.address || o.formattedAddress);
    out.website = clean(o.website || o.url); out.category = clean(o.category || o.primaryCategory || (o.categories || [])[0]); out.description = trunc(clean(o.description || o.about), 400);
    if (o.rating || o.totalScore) out.rating = { value: Number(o.rating || o.totalScore) || 0, count: Number(o.reviewsCount || o.reviewCount || 0) || 0 }; out.hours = clean(o.hours || o.openingHours || '');
    out.reviews = (o.reviews || []).map(r => typeof r === 'string' ? r : r.text || r.comment).filter(Boolean).map(r => trunc(clean(r), 200)).slice(0, 3); return out; } } catch { /* plain text */ }
  const kv = k => { const m = new RegExp('^\\s*(?:' + k + ')\\s*[:\\-]\\s*(.+)$', 'im').exec(text); return m ? clean(m[1]) : ''; };
  out.name = kv('name|business name|title') || clean(text.split(/\r?\n/)[0]).slice(0, 80);
  out.phone = kv('phone|tel|telephone|mobile') || (/(\+?\d[\d\s().-]{8,16}\d)/.exec(text) || [])[1] || '';
  out.address = kv('address|location'); out.website = kv('website|site|url') || (/https?:\/\/[^\s]+/.exec(text) || [])[0] || '';
  const rt = /(\d(?:\.\d)?)\s*(?:\u2605|stars?|\/\s*5)?\s*\(\s*([\d,]{1,6})\s*(?:reviews?|ratings?)?\s*\)/i.exec(text) || /rating\s*[:\-]?\s*(\d(?:\.\d)?)(?:.*?(\d[\d,]{1,5})\s*reviews?)?/i.exec(text); if (rt && +rt[1] >= 1 && +rt[1] <= 5) out.rating = { value: +rt[1], count: rt[2] ? +String(rt[2]).replace(/,/g, '') : 0 };
  out.email = (/[\w.+-]+@[\w-]+\.[\w.]+/.exec(text) || [])[0] || ''; out.category = kv('category|type'); out.description = trunc(kv('description|about'), 400); out.hours = kv('hours|timings');
  return out;
}

/* ---------- combine everything into one profile ---------- */
export function buildIntakeProfile(inp = {}, base) {
  const gm = inp.gmb ? parseGmb(inp.gmb) : null; const p = base ? JSON.parse(JSON.stringify(base)) : EMPTY((inp.host || '').replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
  const notes = [];
  p.name = clean(inp.name) || p.name || (gm && gm.name) || p.host || 'Your company';
  if (gm) {
    if (gm.phone && !p.contacts.phones.length) p.contacts.phones = [gm.phone]; if (gm.email && !p.contacts.emails.length) p.contacts.emails = [gm.email];
    if (gm.address && !p.contacts.address) p.contacts.address = gm.address; if (gm.description && !p.description) { p.description = gm.description; p.about = gm.description; }
    if (gm.category && !p.industries.length) p.industries = [gm.category]; if (gm.website && !p.url) { p.url = gm.website; try { p.host = new URL(gm.website).hostname.replace(/^www\./, ''); } catch { /* ignore */ } }
    if (gm.reviews.length) p.sections = [...(p.sections || []), { kind: 'quotes', heading: 'What customers say', quotes: gm.reviews.map(t => ({ text: t, author: 'Google review' })) }];
    notes.push('Google Business details');
  }
  const add = list => { const have = new Set(p.products.map(x => x.name.toLowerCase())); for (const x of list) if (!have.has(x.name.toLowerCase())) { p.products.push({ name: x.name, description: x.description || '', image: x.image || null, url: x.url || null, location: x.location || '', raw: [x.configRaw, x.sizeRaw, x.priceRaw, x.statusRaw].filter(Boolean).join('. ') }); have.add(x.name.toLowerCase()); } };
  const sheetRows = inp.rows || null; if (sheetRows) { const pr = rowsToProducts(sheetRows); add(pr); if (pr.length) { notes.push(pr.length + ' products from the sheet'); p.categories = [...new Set([...(p.categories || []), ...pr.map(x => x.category).filter(Boolean)])].slice(0, 10); } }
  if (inp.sitemap) { const sm = parseSitemap(inp.sitemap); add(sm.products); if (!p.host && sm.host) { p.host = sm.host; p.url = p.url || 'https://' + sm.host; } if (sm.products.length) notes.push(sm.products.length + ' products from the sitemap'); }
  if (inp.vision && typeof inp.vision === 'object') { const v = inp.vision; if (v.tagline && !p.tagline) p.tagline = clean(v.tagline); if (v.description && !p.description) { p.description = clean(v.description); p.about = p.description; } if (Array.isArray(v.products)) add(v.products.filter(x => x && x.name).map(x => ({ name: trunc(clean(x.name), 80), description: trunc(clean(x.description || ''), 200) }))); if (v.color && /^#[0-9a-f]{6}$/i.test(v.color)) p.colors.primary = v.color; notes.push('Read from screenshot'); }
  // which industry is this? Use everything we were told, then the lead's own fields
  const links = signalsFromLinks({ gmbUrl: inp.gmbUrl, linkedin: inp.linkedin });
  if (!p.name || p.name === 'Your company') p.name = links.name || p.name;
  const det = detectIndustry({ name: p.name, host: p.host, category: gm && gm.category, industry: inp.leadIndustry, title: inp.leadTitle, notes: inp.notes, linkedin: [inp.linkedin, links.linkedin].filter(Boolean).join(' '), description: p.description, text: (gm ? gm.description : '') + ' ' + (inp.gmb || ''), services: p.products.map(x => x.name), nav: p.nav && p.nav.map(n => n.label), hint: inp.force || inp.industry, prefer: inp.force ? '' : inp.industry, segment: inp.segment, role: inp.role });
  if (det.industry) { p.industry = det.industry; p.industryInfo = { confidence: det.confidence, reasons: det.reasons, specialty: det.specialty, specialtyLabel: det.specialtyLabel, forced: !!det.forced, preferred: !!det.preferred, segment: det.segment, segmentLabel: det.segmentLabel, role: det.role, roleLabel: det.roleLabel }; if (!notes.includes('Industry: ' + det.industry)) notes.push('Industry: ' + det.industry); }
  if (p.industry === 'dentists' || p.industry === 'doctors') {
    const ck = p.clinic || (p.clinic = { doctors: [], hours: [], rating: null, services: [], bookingUrl: '', specialties: [], emergency: '' });
    if (gm) { if (gm.rating && gm.rating.value && !ck.rating) ck.rating = gm.rating; if (gm.hours && !ck.hours.length) ck.hours = [gm.hours]; }
    const names = [...String([inp.gmb, inp.notes, inp.linkedin].join(' ')).matchAll(/\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g)].map(m => m[1].replace(/\.$/, ''));
    for (const n of [...new Set(names)].slice(0, 3)) if (!ck.doctors.some(d => d.name.toLowerCase() === n.toLowerCase())) ck.doctors.push({ name: n, title: '', image: '' });
  }
  if (p.industry === 'realestate') {
    const est = extractEstate({ text: [inp.gmb, inp.notes, p.description, p.about].filter(Boolean).join(' '), products: p.products.map(x => ({ name: x.name, description: x.description, raw: x.raw, image: x.image, url: x.url, location: x.location })), address: (p.contacts && p.contacts.address) || '' });
    const old = p.estate || {}; p.estate = { ...est, projects: est.projects.length ? est.projects : old.projects || [], rera: [...new Set([...(old.rera || []), ...est.rera])].slice(0, 3), locations: [...new Set([...(old.locations || []), ...est.locations])].slice(0, 5), amenities: [...new Set([...(old.amenities || []), ...est.amenities])].slice(0, 12) };
  }
  p.products = p.products.slice(0, 120); p.intake = { notes };
  return p;
}

/* ---------- decode an uploaded file by name/type ---------- */
export function decodeUpload(f) {
  const name = String((f && f.name) || '').toLowerCase(), buf = Buffer.from(String((f && f.data) || ''), 'base64');
  if (buf.length > 8e6) throw new Error('File is too large (limit 8 MB)');
  if (/\.xlsx$|\.xlsm$/.test(name) || (buf[0] === 0x50 && buf[1] === 0x4b)) return { kind: 'rows', rows: parseXlsx(buf) };
  if (/\.(png|jpe?g|webp|gif)$/.test(name) || /^image\//.test(f.type || '')) return { kind: 'image', mime: f.type || 'image/png', data: buf.toString('base64') };
  const text = buf.toString('utf8');
  if (/<urlset|<sitemapindex/i.test(text)) return { kind: 'sitemap', text };
  if (/\.json$/.test(name) || /^\s*[\[{]/.test(text)) return { kind: 'gmb', text };
  if (/\.(csv|tsv|txt)$/.test(name) && /[,;\t].*\n/.test(text)) return { kind: 'rows', rows: parseCsv(text) };
  return { kind: 'gmb', text };
}
