// Design 3, BLUEPRINT. Engineering-drawing look. Left sheet index, table catalogue, RFQ form, crosshair cursor.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, quoteBtn, goLink, mobileLinks, socialLinks, contactForm, factList } from './common.js';

const PAGES = [['home', 'Index'], ['catalogue', 'Catalogue'], ['apps', 'Applications'], ['company', 'Company'], ['rfq', 'RFQ']];

const CSS = m => `
${themeVars(m, {
  dark: { bg: '#0b2545', bg2: '#0e2e57', fg: '#e8f1ff', muted: '#93b2d8', line: 'rgba(147,178,216,.3)', card: 'rgba(255,255,255,.04)' },
  light: { bg: '#f3efe3', bg2: '#faf7ee', fg: '#13294b', muted: '#58698a', line: 'rgba(19,41,75,.28)', card: 'rgba(255,255,255,.55)' }
})}
body{font-family:'IBM Plex Mono',ui-monospace,monospace;line-height:1.6;font-size:14px;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:96px 96px,96px 96px;background-position:-1px -1px;background-attachment:fixed}
.d{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.01em;font-weight:600}
#xh-x,#xh-y{position:fixed;left:0;top:0;pointer-events:none;z-index:70;background:var(--brand);opacity:.5;will-change:transform}#xh-x{width:100vw;height:1px}#xh-y{width:1px;height:100vh}
#xh-t{position:fixed;left:0;top:0;z-index:71;pointer-events:none;font-size:11px;padding:3px 7px;background:var(--brand);color:var(--brand-ink);white-space:nowrap;will-change:transform}
@media(hover:none){#xh-x,#xh-y,#xh-t{display:none}}
/* sheet index sidebar */
header[data-header]{position:fixed;left:0;top:0;bottom:0;width:232px;z-index:80;border-right:1px solid var(--fg);background:var(--bg);display:flex;flex-direction:column;padding:22px 18px;gap:20px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-size:22px;min-height:44px}.logo-img{height:34px;max-width:150px;object-fit:contain;background:#fff;padding:3px 8px}.logo-fallback{display:grid;place-items:center;width:38px;height:38px;border:2px solid var(--brand);color:var(--brand);font-size:15px}
.idx-t{font-size:11px;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);padding-bottom:8px}
.nav-links{display:flex;flex-direction:column;gap:2px}.nav-links a{display:grid;grid-template-columns:34px 1fr;align-items:center;text-decoration:none;text-transform:uppercase;letter-spacing:.08em;font-size:12px;padding:11px 8px;border:1px solid transparent;transition:border-color .2s,color .2s,background .2s;min-height:44px}
.nav-links a span{color:var(--brand)}.nav-links a:hover{border-color:var(--line)}.nav-links a.active{border-color:var(--fg);background:var(--card);color:var(--fg)}
.side-foot{margin-top:auto;display:grid;gap:10px}.theme-btn,.menu-btn{border-radius:0;width:44px;height:44px}
.qbtn,.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 18px;min-height:46px;border:1px solid var(--fg);background:transparent;font:500 12px 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;transition:transform .2s,box-shadow .2s;color:var(--fg)}
.btn.primary,.qbtn{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.btn:hover,.qbtn:hover{transform:translate3d(-3px,-3px,0);box-shadow:4px 4px 0 var(--brand)}.btn.added{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
main{margin-left:232px}.wrap{width:min(1080px,100% - 56px);margin-inline:auto}
.sheet{padding:clamp(40px,6vw,80px) 0;border-bottom:1px solid var(--fg)}
.tb{font-size:11px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;display:flex;gap:18px;flex-wrap:wrap;margin-bottom:20px}.tb b{color:var(--brand);font-weight:500}
h1{font-size:clamp(46px,7vw,104px);line-height:.9;margin:0 0 22px}h1 span{color:var(--brand)}
h2{font-size:clamp(34px,5vw,68px);line-height:.92;margin:0}
.lead{color:var(--muted);max-width:48ch;margin:0 0 26px;font-size:15px}.cta{display:flex;gap:12px;flex-wrap:wrap}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center;min-height:100svh;padding-top:56px}
.frame{position:relative;border:1px solid var(--fg);padding:14px;background:var(--card)}
.frame::before,.frame::after,.frame i::before,.frame i::after{content:"";position:absolute;width:16px;height:16px;border:3px solid var(--brand)}
.frame::before{left:-4px;top:-4px;border-right:0;border-bottom:0}.frame::after{right:-4px;top:-4px;border-left:0;border-bottom:0}.frame i::before{left:-4px;bottom:-4px;border-right:0;border-top:0}.frame i::after{right:-4px;bottom:-4px;border-left:0;border-top:0}
svg.sch{width:100%;height:auto;display:block}svg.sch *{vector-effect:non-scaling-stroke}
.dr{fill:none;stroke:var(--fg);stroke-width:1.6;stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.4s cubic-bezier(.6,0,.2,1) forwards}.dr.b{stroke:var(--brand)}.dr.s{stroke-width:1;opacity:.7}@keyframes draw{to{stroke-dashoffset:0}}
.lbl{font:500 12px 'IBM Plex Mono',monospace;fill:var(--fg);opacity:0;animation:show .6s 1.8s forwards}.lbl.b{fill:var(--brand)}@keyframes show{to{opacity:1}}
.tblk{display:grid;grid-template-columns:1fr 1fr;margin-top:12px;border-top:1px solid var(--fg);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.tblk div{padding:7px 4px;border-bottom:1px solid var(--line)}.tblk div:nth-child(odd){color:var(--muted)}
.dim{position:relative;height:18px;border-left:1px solid var(--brand);border-right:1px solid var(--brand);margin-bottom:24px;transform-origin:0;transform:scaleX(0);transition:transform 1.2s cubic-bezier(.6,0,.2,1)}.dim.in{transform:scaleX(1)}.dim::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--brand)}.dim span{position:absolute;left:50%;top:50%;translate:-50% -50%;background:var(--bg);padding:0 12px;font-size:11px;color:var(--brand);letter-spacing:.14em;white-space:nowrap}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));border:1px solid var(--fg)}.stat{padding:28px 22px;border-right:1px solid var(--fg)}.stat:last-child{border:0}.stat b{display:block;font-size:clamp(52px,6vw,88px);line-height:.9;font-family:'Barlow Condensed',sans-serif;color:var(--brand);font-weight:600}.stat span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.figs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.fig{border:1px solid var(--fg);background:var(--card);transition:transform .3s,box-shadow .3s}.fig:hover{transform:translate3d(-4px,-4px,0);box-shadow:6px 6px 0 var(--brand)}.fig .plate{aspect-ratio:4/3;margin:10px;border:1px solid var(--line)}.fig h3{font-size:26px;margin:4px 14px 4px;line-height:1}.fig p{margin:0 14px 12px;color:var(--muted);font-size:12px}.fig .btn{margin:0 14px 14px;padding:9px 14px;min-height:44px;font-size:11px}.fig .cap{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid var(--fg);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.fig .cap b{color:var(--brand);font-weight:500}
/* catalogue table */
.tools{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 18px}.search{display:flex;gap:10px;align-items:center;border:1px solid var(--fg);padding:0 14px;flex:1;min-width:220px}.search input{flex:1;background:none;border:0;padding:13px 0;color:var(--fg);font:inherit;font-size:16px;outline:none;text-transform:uppercase;letter-spacing:.06em;min-width:0}.search svg{width:16px;flex:none}
.table{border:1px solid var(--fg);background:var(--card)}.th,.tr{display:grid;grid-template-columns:56px 64px 1.1fr 1.4fr auto;gap:16px;align-items:center;padding:12px 16px}.th{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--fg);padding-block:9px}
.tr{border-bottom:1px solid var(--line);transition:background .2s}.tr:last-of-type{border:0}.tr:hover{background:var(--bg2)}.tr .no{color:var(--brand)}.tr .plate{width:64px;aspect-ratio:1;border:1px solid var(--line)}.tr h3{margin:0;font-size:24px;line-height:1}.tr p{margin:0;color:var(--muted);font-size:12px}.tr .act{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.tr .btn{padding:9px 14px;min-height:44px;font-size:11px}
.empty{color:var(--muted);padding:20px 4px;text-transform:uppercase;letter-spacing:.08em;font-size:12px}
/* applications */
.apps{border-top:1px solid var(--fg)}.app{display:grid;grid-template-columns:80px 1fr 1fr;gap:12px 24px;align-items:baseline;padding:22px 6px;border-bottom:1px solid var(--line);transition:background .2s,padding .3s}.app:hover{background:var(--card);padding-left:16px}.app .n{color:var(--brand)}.app h3{margin:0;font-size:clamp(26px,3.4vw,44px);line-height:1}.app p{margin:0;color:var(--muted)}
.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--fg)}.flow div{padding:24px;border-right:1px solid var(--fg);position:relative}.flow div:last-child{border:0}.flow div::after{content:"→";position:absolute;right:14px;top:50%;translate:0 -50%;color:var(--brand);font-size:22px}.flow div:last-child::after{display:none}.flow b{color:var(--brand);font-weight:500;letter-spacing:.14em;text-transform:uppercase;font-size:11px}.flow h3{margin:8px 0 4px;font-size:30px;line-height:1}.flow p{margin:0;color:var(--muted);font-size:13px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
.kv{border:1px solid var(--fg);background:var(--card)}.kv div{display:grid;grid-template-columns:110px 1fr;padding:12px 16px;border-bottom:1px solid var(--line);font-size:13px;word-break:break-word}.kv div:last-child{border:0}.kv span{color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-size:10px;padding-top:2px}.kv a{text-decoration:none}.kv a:hover{color:var(--brand)}
.stamps{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.stamp{border:2px solid var(--brand);color:var(--brand);padding:10px 14px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;font-size:12px;transform:rotate(-2deg)}.stamp:nth-child(2n){transform:rotate(1.5deg)}
.cform{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--fg);background:var(--card)}.cform label{display:grid;gap:4px;padding:12px 16px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}.cform label:nth-child(1){border-right:1px solid var(--line)}.cform .full{grid-column:1/-1}.cform input,.cform textarea{background:none;border:0;color:var(--fg);font:inherit;font-size:16px;outline:none;padding:4px 0;width:100%}
.cbtn{grid-column:1/-1;padding:15px;border:0;background:var(--brand);color:var(--brand-ink);font:600 13px 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.1em;min-height:50px}.sent{color:var(--brand);font-size:13px}
footer{margin-left:232px;padding:24px 28px 70px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.foot{display:flex;flex-wrap:wrap;gap:14px 24px;justify-content:space-between}.foot a{text-decoration:none;padding:6px 0}.foot a:hover{color:var(--brand)}.foot nav,.foot .soc{display:flex;gap:4px 18px;flex-wrap:wrap}
.wdg-dock{left:244px}
@media(max-width:1000px){.figs{grid-template-columns:1fr}.hero,.two{grid-template-columns:1fr}.th{display:none}.tr{grid-template-columns:64px 1fr;gap:10px 14px}.tr .no{display:none}.tr p,.tr .act{grid-column:1/-1}.tr .act{justify-content:flex-start}.app{grid-template-columns:50px 1fr}.app p{grid-column:2}.flow{grid-template-columns:1fr}.flow div{border-right:0;border-bottom:1px solid var(--fg)}.flow div::after{display:none}}
@media(max-width:860px){header[data-header]{position:fixed;inset:0 0 auto 0;width:auto;height:60px;flex-direction:row;align-items:center;padding:8px 16px;border-right:0;border-bottom:1px solid var(--fg);gap:10px}.idx-t,.nav-links{display:none}.side-foot{margin:0 0 0 auto;display:flex;align-items:center}main,footer{margin-left:0}.wdg-dock{left:12px}.hero{padding-top:84px;min-height:0}.wrap{width:min(1080px,100% - 32px)}.cform{grid-template-columns:1fr}.cform label:nth-child(1){border-right:0}}
`;

const SCRIPT = `window.__tpl=function(c){
 if(!c.fine) return;
 var X=document.createElement('div'),Y=document.createElement('div'),T=document.createElement('div'); X.id='xh-x';Y.id='xh-y';T.id='xh-t'; document.body.append(X,Y,T);
 var px=0,py=0,p=0; addEventListener('pointermove',function(e){ px=e.clientX; py=e.clientY; if(!p) p=c.raf(function(){ p=0; X.style.transform='translate3d(0,'+py+'px,0)'; Y.style.transform='translate3d('+px+'px,0,0)'; T.style.transform='translate3d('+(px+14)+'px,'+(py+14)+'px,0)'; T.textContent='X '+String(px).padStart(4,'0')+'  Y '+String(Math.round(py+scrollY)).padStart(5,'0'); }); },{passive:true});
};`;

export function renderBlueprint(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#ff6a3d', voice: 2, ...opts }), t = m.t, P = m.products;
  const code = i => `${m.initials}-${String(101 + i)}`;
  const nameAt = (i, n) => esc((m.sectors[i] ? m.sectors[i].name : P[i % P.length].name).toUpperCase().slice(0, n));
  const schematic = `<svg class="sch" viewBox="0 0 560 440" role="img" aria-label="Schematic"><g fill="none">
<rect class="dr b" pathLength="1" x="190" y="130" width="180" height="180" rx="4"/><rect class="dr s" pathLength="1" x="212" y="152" width="136" height="136"/>
${[0, 1, 2, 3, 4, 5].map(i => `<path class="dr" pathLength="1" d="M${212 + i * 27} 130V96M${212 + i * 27} 310V344" style="animation-delay:${.3 + i * .1}s"/><path class="dr" pathLength="1" d="M190 ${152 + i * 27}H156M370 ${152 + i * 27}H404" style="animation-delay:${.4 + i * .1}s"/>`).join('')}
<path class="dr" pathLength="1" d="M156 179H60V90H110M404 206H500V310H440M239 344V396H120M293 96V40H430" style="animation-delay:.7s"/>
<path class="dr b" pathLength="1" d="M60 260l10-12 10 24 10-24 10 24 10-24 10 12" style="animation-delay:1s"/><path class="dr" pathLength="1" d="M430 396h30m-15-18v36m-14-9h58" style="animation-delay:1.2s"/>
<path class="dr s" pathLength="1" d="M190 400V420M370 400V420M190 410H370M30 130V310M24 130h12M24 310h12" style="animation-delay:1.5s"/></g>
<text class="lbl b" x="280" y="226" text-anchor="middle">${esc(m.initials)}-01</text><text class="lbl" x="280" y="436" text-anchor="middle">W 180</text><text class="lbl" x="60" y="80">${nameAt(0, 18)}</text><text class="lbl" x="400" y="30">${nameAt(1, 18)}</text><text class="lbl" x="440" y="334">${nameAt(2, 14)}</text></svg>`;
  const dim = label => `<div class="dim" data-reveal><span>${esc(label)}</span></div>`;
  const home = `<div class="wrap"><div class="sheet hero"><div><div class="tb" data-reveal><span>DWG <b>${esc(m.initials)}-001</b></span><span>${esc(t.eyebrow)}</span></div>
<h1 class="d" data-reveal data-delay="70">${esc(m.headline)}</h1><p class="lead" data-reveal data-delay="130">${esc(m.sub)}</p>
<div class="cta" data-reveal data-delay="190"><a class="btn primary" href="#/catalogue" data-go="catalogue" data-magnetic>${esc(t.ctaA)}</a><button class="btn" data-quote-open data-magnetic>${esc(t.ctaB)}</button></div></div>
<div class="frame" data-reveal="zoom"><i></i>${schematic}<div class="tblk"><div>Subject</div><div>${esc(m.name)}</div><div>Drawn by</div><div>${esc(m.agency || 'Design team')}</div><div>Scale</div><div>1 : 1</div></div></div></div>
<div class="sheet">${dim('FIG. 01 / ' + t.statsKicker)}<div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b data-count="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div>
<div class="sheet">${dim('FIG. 02 / ' + t.featTitle)}<div class="figs">${P.slice(0, 3).map((p, i) => `<article class="fig" data-reveal data-delay="${i * 80}"><div class="cap"><span>Item <b>0${i + 1}</b></span><span>${code(i)}</span></div>${media(p)}<h3 class="d">${esc(p.name)}</h3>${p.desc2 ? `<p>${esc(p.desc2)}</p>` : ''}<button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button></article>`).join('')}</div><div style="margin-top:22px">${goLink('catalogue', t.featLink + ' →', 'btn')}</div></div>
<div class="sheet" style="border:0;text-align:center"><h2 class="d" data-reveal style="max-width:16ch;margin:0 auto 12px">${esc(t.bandTitle)}</h2><p class="lead" style="margin:0 auto 24px">${esc(t.bandSub)}</p><button class="btn primary" data-quote-open data-magnetic>${esc(t.bandCta)}</button></div></div>`;

  const catalogue = `<div class="wrap"><div class="sheet" style="border:0"><div class="tb"><span>${esc(PAGES[1][1])}</span><span><b>${P.length}</b> items</span></div><h1 class="d" style="font-size:clamp(44px,6vw,88px)">${esc(t.prodTitle)}</h1><p class="lead">${esc(t.prodSub)}</p>
<div class="tools"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label>${quoteBtn('RFQ list')}</div>
<div class="table"><div class="th"><span>No.</span><span>View</span><span>Item</span><span>Note</span><span></span></div>${P.map((p, i) => `<div class="tr" data-prod="${esc(p.name)}" data-reveal><span class="no">${String(i + 1).padStart(2, '0')}</span>${media(p)}<h3 class="d">${esc(p.name)}</h3><p>${esc(p.desc || code(i))}</p><div class="act"><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.details)}</a>` : ''}</div></div>`).join('')}</div><p class="empty" data-empty hidden>${esc(t.empty)}</p></div></div>`;

  const apps = `<div class="wrap"><div class="sheet"><div class="tb"><span>${esc(PAGES[2][1])}</span></div><h1 class="d" style="font-size:clamp(44px,6vw,88px)">${esc(t.solTitle)}</h1><p class="lead">${esc(t.solSub)}</p><div class="apps">${m.sectors.map((s, i) => `<div class="app" data-reveal data-delay="${i * 40}"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3 class="d">${esc(s.name)}</h3><p>${esc(s.line)}</p></div>`).join('')}</div></div>
<div class="sheet" style="border:0">${dim(t.stepsTitle)}<div class="flow">${t.steps.map(([a, b], i) => `<div data-reveal data-delay="${i * 80}"><b>${esc(a)}</b><h3 class="d">${esc(b)}</h3></div>`).join('')}</div></div></div>`;

  const kv = rows => `<div class="kv">${rows.map(([k, v, h]) => `<div><span>${esc(k)}</span>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<b style="font-weight:400">${esc(v)}</b>`}</div>`).join('')}</div>`;
  const facts = factList(m);
  const company = `<div class="wrap"><div class="sheet"><div class="tb"><span>${esc(PAGES[3][1])}</span></div><h1 class="d" style="font-size:clamp(44px,6vw,88px)">${esc(t.aboutTitle)}</h1><p class="lead">${esc(t.aboutSub)}</p>
<div class="two"><div data-reveal="left"><div class="frame"><i></i>${media(m.img.about)}</div></div><div data-reveal="right">${m.aboutLine ? `<p class="lead" style="color:var(--fg);font-size:17px">${esc(m.aboutLine)}</p>` : ''}${kv(facts)}${m.certs.length ? `<div class="idx-t" style="margin-top:26px;border:0">${esc(t.certsTitle)}</div><div class="stamps">${m.certs.map(c => `<span class="stamp">${esc(c)}</span>`).join('')}</div>` : ''}</div></div></div></div>`;

  const rfq = `<div class="wrap"><div class="sheet"><div class="tb"><span>${esc(PAGES[4][1])}</span></div><h1 class="d" style="font-size:clamp(44px,6vw,88px)">${esc(t.contactTitle)}</h1><p class="lead">${esc(t.contactSub)}</p>
<div class="two"><div data-reveal="left">${contactForm(m)}</div><div data-reveal="right"><div class="idx-t" style="border:0;padding:0 0 10px">${esc(t.direct)}</div>${kv(facts)}</div></div></div></div>`;

  const header = `<header data-header><a class="logo d" href="#/home" data-go="home">${logoMark(m)}${m.logo ? '' : `<span class="hide-m">${esc(m.name)}</span>`}</a><div class="idx-t">${esc(t.pill)}</div><nav class="nav-links" aria-label="Main">${PAGES.map(([id, l], i) => `<a href="#/${id}" data-go="${id}"><span>0${i + 1}</span>${esc(l)}</a>`).join('')}</nav><div class="side-foot">${quoteBtn('RFQ list')}${themeBtn()}${menuBtn()}</div></header>`;
  const footer = `<footer><div class="foot"><span>© ${m.year} ${esc(m.name)}. ${esc(t.foot)}</span><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site</a>` : ''}</div></div></footer>`;
  const pages = PAGES.map(([id, label], i) => ({ id, label, html: [home, catalogue, apps, company, rfq][i] }));
  return shell(m, { tpl: 'blueprint', fonts: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap', css: CSS(m), header, footer, pages, script: SCRIPT, themeDefault: opts.theme || 'dark', menuLinks: mobileLinks(PAGES, m, `<a href="#" data-quote-open>${esc(t.navCta)}</a>`) });
}
