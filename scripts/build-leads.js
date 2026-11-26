// Converts data/leads.csv (CRM export) into public/leads.json used by the chat autocomplete.
// Only company / website / city are published to the browser - no emails or phone numbers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] || path.join(root, 'data/leads.csv');

function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

const [head, ...rows] = parseCSV(fs.readFileSync(src, 'utf8'));
const idx = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
const seen = new Set();
const leads = [];
for (const r of rows) {
  const website = (r[idx.website] || '').trim();
  const company = (r[idx.company] || '').trim();
  if (!website || !company) continue;
  const key = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase() + '|' + company.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  leads.push({ company, website, city: (r[idx.city] || '').trim(), source: (r[idx.source] || '').trim() });
}
fs.writeFileSync(path.join(root, 'public/leads.json'), JSON.stringify(leads, null, 1));
console.log(`Wrote ${leads.length} leads to public/leads.json`);
