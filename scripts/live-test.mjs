// node scripts/live-test.mjs <baseUrl> [accessKey]  -> calls /api/analyze for every lead, prints a report + saves profiles
import fs from 'node:fs';
const base = process.argv[2], key = process.argv[3];
const leads = JSON.parse(fs.readFileSync(new URL('../public/leads.json', import.meta.url), 'utf8'));
const out = process.env.OUT || '/tmp/claude-0/live'; fs.mkdirSync(out, { recursive: true });
const rows = [];
for (const [i, l] of leads.entries()) {
  const t0 = Date.now(); let status = 0, j = {};
  try {
    const r = await fetch(base + '/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json', ...(key ? { 'x-access-key': key } : {}) }, body: JSON.stringify({ url: l.website, name: l.company }), signal: AbortSignal.timeout(40000) });
    status = r.status; const txt = await r.text(); try { j = JSON.parse(txt); } catch { j = { error: txt.slice(0, 80) }; }
  } catch (e) { j = { error: e.message }; }
  const ms = Date.now() - t0, p = j.profile;
  if (p) fs.writeFileSync(`${out}/${i}.json`, JSON.stringify(p, null, 1));
  const f = p && p.meta.found;
  rows.push({ company: l.company.slice(0, 24), status, s: (ms / 1000).toFixed(1), prod: f ? f.products : '-', withImg: p ? p.products.filter(x => x.image).length : '-', sec: p && p.sections ? p.sections.map(x => x.kind[0]).join('') : '-', img: f ? f.images : '-', logo: f ? (f.logo ? 'Y' : 'n') : '-', color: f ? (f.brandColor ? p.colors.primary : 'n') : '-', contact: f ? f.contact : '-', err: j.error || '' });
  console.log(JSON.stringify(rows.at(-1)));
  if (i % 18 === 17) await new Promise(r => setTimeout(r, 61000)); // stay under the per-IP rate limit
}
const ok = rows.filter(r => r.status === 200);
console.log(`\nOK ${ok.length}/${rows.length}; >9s: ${rows.filter(r => +r.s > 9).length}; with products: ${ok.filter(r => r.prod > 0).length}; with logo: ${ok.filter(r => r.logo === 'Y').length}; total products: ${ok.reduce((a, r) => a + (+r.prod || 0), 0)}; leads with sections: ${ok.filter(r => r.sec && r.sec !== '-' && r.sec !== '').length}; with brand colour: ${ok.filter(r => r.color !== 'n').length}`);
