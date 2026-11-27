// node scripts/probe.mjs <baseUrl> <site> [site...]  -> shows what the scraper found and what it tried
const [base, ...sites] = process.argv.slice(2);
for (const site of sites) {
  const t0 = Date.now();
  const r = await fetch(base + '/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: site }), signal: AbortSignal.timeout(45000) }).then(r => r.json()).catch(e => ({ error: e.message }));
  const p = r.profile; if (!p) { console.log('\n' + site, 'ERR', r.error); continue; }
  console.log(`\n== ${site}  ${((Date.now() - t0) / 1000).toFixed(1)}s  products=${p.products.length} (img ${p.products.filter(x => x.image).length})  sections=${(p.sections || []).map(s => s.kind + ':' + s.heading.slice(0, 22)).join(' | ')}`);
  console.log('   notes:', (p.notes || []).join('; '));
  console.log('   diag :', (p.meta.diag || []).map(d => `${d.page}=${d.found}[${(d.cards || []).join(',')}]`).join('  '));
  console.log('   heads:', JSON.stringify(p.meta.counts), (p.meta.secDbg || []).join('  '));
  console.log('   first:', p.products.slice(0, 4).map(x => x.name).join(' / '));
}
