// Template 3 - BLUEPRINT: engineering-drawing aesthetic. Self-drawing SVG schematic, crosshair cursor w/ coordinates, datasheet cards.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, mobileNav, quoteBtn, navItems, socialLinks, agencyFlag } from './common.js';

const CSS = m => `
${themeVars(m, {
  dark: { bg: '#0b2545', bg2: '#0e2e57', fg: '#e8f1ff', muted: '#8fb0d9', line: 'rgba(143,176,217,.3)', card: 'rgba(255,255,255,.04)' },
  light: { bg: '#f3efe3', bg2: '#faf7ee', fg: '#13294b', muted: '#5a6b85', line: 'rgba(19,41,75,.28)', card: 'rgba(255,255,255,.55)' }
})}
body{font-family:'IBM Plex Mono',ui-monospace,monospace;line-height:1.6;font-size:15px;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--line) 40%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--line) 40%,transparent) 1px,transparent 1px);background-size:120px 120px,120px 120px,24px 24px,24px 24px;background-position:-1px -1px}
.d{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.01em}
.wrap{width:min(1220px,100% - 48px);margin-inline:auto}
#xh-x,#xh-y{position:fixed;pointer-events:none;z-index:70;background:var(--brand);opacity:.55}#xh-x{left:0;right:0;height:1px;top:0}#xh-y{top:0;bottom:0;width:1px;left:0}
#xh-t{position:fixed;z-index:71;pointer-events:none;font-size:11px;padding:3px 7px;background:var(--brand);color:var(--brand-ink);left:0;top:0;white-space:nowrap}
@media(hover:none){#xh-x,#xh-y,#xh-t{display:none}}
header[data-header]{position:fixed;inset:0 0 auto 0;z-index:80;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);transition:.3s}
.nav{display:flex;align-items:center;gap:22px;height:64px}.logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-right:auto;font-size:22px;font-weight:700}
.logo-img{height:32px;max-width:140px;object-fit:contain;background:#fff;padding:3px 8px}.logo-fallback{display:grid;place-items:center;width:34px;height:34px;border:2px solid var(--brand);color:var(--brand);font-size:14px}
.nav-links{display:flex;gap:6px}.nav-links a{text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:.08em;padding:8px 12px;border:1px solid transparent;transition:.2s}.nav-links a:hover{border-color:var(--brand);color:var(--brand)}
.theme-btn,.menu-btn{border-radius:0;width:40px;height:40px}
.qbtn,.btn{display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border:1px solid var(--fg);background:transparent;font:500 13px 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;position:relative;transition:.25s;color:var(--fg)}
.btn.primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.btn:hover,.qbtn:hover{transform:translate(-3px,-3px);box-shadow:4px 4px 0 var(--brand)}.btn.added{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
.hero{padding:130px 0 70px;min-height:100svh;display:grid;align-items:center}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}
.tb{font-size:11px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;display:flex;gap:18px;flex-wrap:wrap;margin-bottom:22px}.tb b{color:var(--brand);font-weight:500}
h1{font-size:clamp(46px,7.6vw,112px);line-height:.9;margin:0 0 26px;font-weight:700}
h1 span{color:var(--brand)}
.lead{color:var(--muted);max-width:52ch;margin:0 0 30px}
.cta{display:flex;gap:14px;flex-wrap:wrap}
.frame{position:relative;border:1px solid var(--fg);padding:14px;background:var(--card)}
.frame::before,.frame::after,.frame i::before,.frame i::after{content:"";position:absolute;width:16px;height:16px;border:3px solid var(--brand)}
.frame::before{left:-4px;top:-4px;border-right:0;border-bottom:0}.frame::after{right:-4px;top:-4px;border-left:0;border-bottom:0}.frame i::before{left:-4px;bottom:-4px;border-right:0;border-top:0}.frame i::after{right:-4px;bottom:-4px;border-left:0;border-top:0}
svg.sch{width:100%;height:auto;display:block}svg.sch *{vector-effect:non-scaling-stroke}
.dr{fill:none;stroke:var(--fg);stroke-width:1.6;stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.6s cubic-bezier(.6,0,.2,1) forwards}.dr.b{stroke:var(--brand)}.dr.s{stroke-width:1;opacity:.7}
@keyframes draw{to{stroke-dashoffset:0}}
.lbl{font:500 12px 'IBM Plex Mono',monospace;fill:var(--fg);opacity:0;animation:show .6s 2s forwards}.lbl.b{fill:var(--brand)}@keyframes show{to{opacity:1}}
.pulse{fill:var(--brand);animation:pulse 2s infinite}@keyframes pulse{50%{opacity:.2;r:8}}
.tbl{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:12px;border-top:1px solid var(--fg);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.tbl div{padding:7px 4px;border-bottom:1px solid var(--line)}.tbl div:nth-child(odd){color:var(--muted)}
section{padding:clamp(60px,9vw,120px) 0;border-top:1px solid var(--fg);position:relative}
.sh{display:grid;grid-template-columns:140px 1fr auto;gap:24px;align-items:end;margin-bottom:46px}.sh .no{font-size:13px;color:var(--brand);letter-spacing:.14em}
h2{font-size:clamp(34px,5.5vw,76px);line-height:.92;margin:0;font-weight:700}
.dim{position:relative;height:18px;border-left:1px solid var(--brand);border-right:1px solid var(--brand);width:100%;margin-bottom:26px;transform-origin:0;transform:scaleX(0);transition:transform 1.4s cubic-bezier(.6,0,.2,1)}.dim.in{transform:scaleX(1)}.dim::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--brand)}.dim span{position:absolute;left:50%;top:50%;translate:-50% -50%;background:var(--bg);padding:0 12px;font-size:11px;color:var(--brand);letter-spacing:.14em}
.search{display:flex;gap:10px;align-items:center;border:1px solid var(--fg);padding:0 14px;min-width:min(300px,100%)}.search input{flex:1;background:none;border:0;padding:13px 0;color:var(--fg);font:inherit;outline:none;text-transform:uppercase;letter-spacing:.06em}.search svg{width:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:26px}
.sheet{border:1px solid var(--fg);background:var(--card);position:relative;transition:transform .35s,box-shadow .35s}.sheet:hover{transform:translate(-5px,-5px);box-shadow:8px 8px 0 var(--brand)}
.sheet .top{display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--fg);font-size:11px;letter-spacing:.12em;text-transform:uppercase}.sheet .top b{color:var(--brand);font-weight:500}
.sheet .plate{aspect-ratio:4/3;margin:12px;border:1px solid var(--line)}.sheet .plate img{transition:transform .7s,filter .5s;filter:saturate(.85)}.sheet:hover .plate img{transform:scale(1.06);filter:none}
.sheet .plate::after{content:"";position:absolute;inset:0;background:linear-gradient(var(--brand),var(--brand)) 0 -2px/100% 2px no-repeat;opacity:0;pointer-events:none}.sheet:hover .plate::after{opacity:.8;animation:scan 1.6s linear infinite}@keyframes scan{to{background-position:0 102%}}
.sheet h3{font-size:30px;line-height:1;margin:6px 14px 6px;font-weight:600}.sheet p{margin:0 14px 12px;color:var(--muted);font-size:13px}
.spec{margin:0 14px 14px;border-top:1px dashed var(--line);font-size:11px}.spec div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);text-transform:uppercase;letter-spacing:.08em}.spec span:first-child{color:var(--muted)}
.sheet .row{display:flex;gap:8px;padding:0 14px 14px}.sheet .btn{padding:9px 14px;font-size:11px}
.empty{color:var(--muted);padding:30px 0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--fg)}.stat{padding:34px 24px;border-right:1px solid var(--fg);position:relative}.stat:last-child{border:0}.stat b{display:block;font-size:clamp(54px,7vw,100px);line-height:.9;font-family:'Barlow Condensed',sans-serif;color:var(--brand)}.stat span{font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:start}
.list{border-top:1px solid var(--fg)}.list a{display:flex;justify-content:space-between;padding:16px 4px;border-bottom:1px solid var(--line);text-decoration:none;text-transform:uppercase;letter-spacing:.08em;transition:.25s}.list a:hover{padding-left:18px;color:var(--brand);background:var(--card)}
.kv{display:grid;gap:0;border:1px solid var(--fg)}.kv div{display:grid;grid-template-columns:120px 1fr;padding:12px 16px;border-bottom:1px solid var(--line);font-size:13px}.kv div:last-child{border:0}.kv span{color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-size:11px}
.cta-s{text-align:center}.cta-s h2{max-width:14ch;margin:0 auto 30px}.cta-s .cta{justify-content:center}
footer{border-top:1px solid var(--fg);padding:26px 0;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.foot{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between}.foot a{text-decoration:none}.foot a:hover{color:var(--brand)}.foot nav,.foot .soc{display:flex;gap:18px;flex-wrap:wrap}
@media(max-width:900px){.hero-grid,.two{grid-template-columns:1fr}.sh{grid-template-columns:1fr}.stat{border-right:0;border-bottom:1px solid var(--fg)}}
`;

const SCRIPT = `window.__tpl=function(c){
 var X=document.createElement('div'),Y=document.createElement('div'),T=document.createElement('div'); X.id='xh-x';Y.id='xh-y';T.id='xh-t'; document.body.append(X,Y,T);
 addEventListener('pointermove',function(e){ X.style.transform='translateY('+e.clientY+'px)'; Y.style.transform='translateX('+e.clientX+'px)'; T.style.transform='translate('+(e.clientX+14)+'px,'+(e.clientY+14)+'px)'; T.textContent='X '+String(e.clientX).padStart(4,'0')+'  Y '+String(Math.round(e.clientY+scrollY)).padStart(5,'0'); },{passive:true});
};`;

export function renderBlueprint(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#ff6a3d', ...opts });
  const nav = navItems(m), P = m.products;
  const L = (i, n) => esc((P[i] || P[0]).name.toUpperCase().slice(0, n));
  const schematic = `<svg class="sch" viewBox="0 0 560 440" role="img" aria-label="Schematic illustration"><g fill="none">
<rect class="dr b" pathLength="1" x="190" y="130" width="180" height="180" rx="4"/><rect class="dr s" pathLength="1" x="212" y="152" width="136" height="136"/><circle class="pulse" cx="228" cy="168" r="5"/>
${[0, 1, 2, 3, 4, 5].map(i => `<path class="dr" pathLength="1" d="M${212 + i * 27} 130V96M${212 + i * 27} 310V344" style="animation-delay:${.3 + i * .12}s"/><path class="dr" pathLength="1" d="M190 ${152 + i * 27}H156M370 ${152 + i * 27}H404" style="animation-delay:${.4 + i * .12}s"/>`).join('')}
<path class="dr" pathLength="1" d="M156 179H60V90H110M404 206H500V310H440M239 344V396H120M293 96V40H430" style="animation-delay:.8s"/>
<path class="dr b" pathLength="1" d="M60 260l10-12 10 24 10-24 10 24 10-24 10 12" style="animation-delay:1.2s"/><path class="dr" pathLength="1" d="M430 396h30m-15-18v36m-14-9h58" style="animation-delay:1.4s"/>
<path class="dr s" pathLength="1" d="M190 400V420M370 400V420M190 410H370" style="animation-delay:1.8s"/>
<path class="dr s" pathLength="1" d="M30 130V310M24 130h12M24 310h12" style="animation-delay:1.8s"/></g>
<text class="lbl b" x="260" y="226" text-anchor="middle">${esc(m.initials)}-01</text><text class="lbl" x="280" y="413" text-anchor="middle">W 180 mm</text><text class="lbl" x="22" y="224" transform="rotate(-90 22 224)" text-anchor="middle">H 180</text>
<text class="lbl" x="60" y="80">${L(0, 20)}</text><text class="lbl" x="430" y="30">${L(1, 20)}</text><text class="lbl" x="440" y="330">${L(2, 20)}</text><text class="lbl b" x="30" y="296">R1</text></svg>`;
  const body = `<div id="prog"></div><div id="top"></div>
<header data-header><div class="wrap nav"><a class="logo d" href="#top">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>${themeBtn()}${quoteBtn('RFQ')}${menuBtn()}</div></header>${mobileNav(m)}
<div class="hero"><div class="wrap hero-grid"><div><div class="tb" data-reveal><span>DWG <b>${esc(m.initials)}-001</b></span><span>REV <b>C</b></span><span>${esc(m.host)}</span></div>
<h1 class="d" data-reveal data-delay="80">${esc(m.headline)}</h1><p class="lead" data-reveal data-delay="160">${esc(m.desc)}</p>
<div class="cta" data-reveal data-delay="240"><a class="btn primary" href="#products" data-magnetic>View catalogue →</a><a class="btn" href="#contact" data-magnetic>Request quote</a></div></div>
<div class="frame" data-reveal="zoom"><i></i>${schematic}<div class="tbl"><div>Drawn by</div><div>${esc(m.agency || 'Design team')}</div><div>Subject</div><div>${esc(m.name)}</div><div>Scale</div><div>1 : 1</div></div></div></div></div>
<section id="products"><div class="wrap"><div class="dim" data-reveal><span>FIG. 01 — PRODUCT CATALOGUE</span></div><div class="sh"><div class="no">01 / 04</div><h2 class="d">Product catalogue</h2><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Search…" aria-label="Search products"></label></div>
<div class="grid">${P.map((p, i) => `<article class="sheet" data-prod="${esc(p.name + ' ' + p.desc)}" data-reveal data-delay="${(i % 3) * 80}"><div class="top"><span>Item <b>${String(i + 1).padStart(2, '0')}</b></span><span>${esc(m.initials)}-${String(100 + i)}</span></div>${media(p)}<h3 class="d">${esc(p.name)}</h3><p>${esc(p.desc || 'Datasheet and drawings available on request.')}</p><div class="spec"><div><span>Ref</span><span>${esc(m.initials)}-${String(100 + i)}</span></div><div><span>Status</span><span>${p.placeholder ? 'Add details' : 'In catalogue'}</span></div>${m.certs[0] ? `<div><span>Cert</span><span>${esc(m.certs[i % m.certs.length])}</span></div>` : ''}</div><div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>+ RFQ</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Datasheet ↗</a>` : ''}</div></article>`).join('')}</div><p class="empty" data-empty hidden>NO MATCHING ITEMS.</p></div></section>
<section><div class="wrap"><div class="dim" data-reveal><span>FIG. 02 — KEY FIGURES</span></div><div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section id="industries"><div class="wrap"><div class="dim" data-reveal><span>FIG. 03 — APPLICATIONS</span></div><div class="sh"><div class="no">03 / 04</div><h2 class="d">Applications &amp; sectors</h2><span></span></div><div class="two"><div class="list">${(m.industries.length ? m.industries : m.cats.length ? m.cats : ['Industrial', 'Embedded', 'Power', 'Custom']).map((x, i) => `<a href="#contact" data-reveal data-delay="${i * 50}"><span>${String(i + 1).padStart(2, '0')} — ${esc(x)}</span><span>→</span></a>`).join('')}</div><p class="lead" data-reveal="right">${esc(m.about)}</p></div></div></section>
<section id="about"><div class="wrap two"><div data-reveal="left"><div class="dim"><span>FIG. 04 — COMPANY</span></div><h2 class="d" style="margin-bottom:24px">About ${esc(m.name)}</h2>${m.certs.length ? `<div class="tb">${m.certs.map(c => `<b>${esc(c)}</b>`).join(' ')}</div>` : ''}</div><div class="kv" data-reveal="right">${m.address ? `<div><span>Address</span>${esc(m.address)}</div>` : ''}${m.email ? `<div><span>Email</span>${esc(m.email)}</div>` : ''}${m.phone ? `<div><span>Phone</span>${esc(m.phone)}</div>` : ''}<div><span>Website</span>${esc(m.host)}</div></div></div></section>
<section id="contact" class="cta-s"><div class="wrap"><h2 class="d" data-reveal>Send us your drawing. We'll quote it.</h2><div class="cta" data-reveal data-delay="120"><a class="btn primary" href="#" data-quote-open data-magnetic>Open RFQ form</a>${m.email ? `<a class="btn" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}</div></div></section>
<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}</span><nav>${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site ↗</a>` : ''}</div></div></footer>${agencyFlag(m)}`;
  return shell(m, { title: `${m.name} — Blueprint concept`, fonts: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap', css: CSS(m), body, script: SCRIPT, themeDefault: opts.theme || 'dark' });
}
