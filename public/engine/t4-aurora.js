// Design 4, AURORA GLASS. Soft futurism. Bottom dock navigation, compositor-only gradient glow, pinned scroll story, glass cards.
import { esc, sectionsHtml, buildModel, shell, themeVars, media, logoMark, themeBtn, quoteBtn, goLink, socialLinks, contactForm, factList } from './common.js';

const PAGES = [['home', 'Home'], ['range', 'Range'], ['sectors', 'Sectors'], ['about', 'About'], ['contact', 'Contact']];
const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  range: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sectors: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>'
};
const ico = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]}</svg>`;

const CSS = m => `
${themeVars(m, {
  dark: { bg: '#05060f', bg2: '#0c0e1d', fg: '#f2f4ff', muted: '#9aa1c8', line: 'rgba(255,255,255,.12)', card: 'rgba(255,255,255,.06)' },
  light: { bg: '#eef0fb', bg2: '#ffffff', fg: '#10122a', muted: '#5b6188', line: 'rgba(16,18,42,.1)', card: 'rgba(255,255,255,.7)' }
})}
:root{--flag-bottom:92px}
body{font-family:'Sora',system-ui,sans-serif;line-height:1.6;font-size:15px}
:root{--hs-w:1180px;--hs-ff:'Sora',sans-serif;--hs-r:28px}.hs-card,.hs-step,.hs-q,.hs-list li{box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.wrap{width:min(1180px,100% - 40px);margin-inline:auto}
.aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;background:var(--bg);contain:strict}
.aurora i{position:absolute;border-radius:50%;will-change:transform;opacity:.55}
.aurora i:nth-child(1){width:80vmax;height:80vmax;left:-30vmax;top:-34vmax;background:radial-gradient(closest-side,var(--brand),transparent);animation:d1 30s ease-in-out infinite}
.aurora i:nth-child(2){width:70vmax;height:70vmax;right:-28vmax;top:4vmax;background:radial-gradient(closest-side,var(--brand2),transparent);animation:d2 38s ease-in-out infinite}
.aurora i:nth-child(3){width:64vmax;height:64vmax;left:10vmax;bottom:-36vmax;background:radial-gradient(closest-side,#6d5cff,transparent);opacity:.45;animation:d1 44s ease-in-out infinite reverse}
:root[data-theme=light] .aurora i{opacity:.32}
@keyframes d1{50%{transform:translate3d(10vmax,8vmax,0)}}@keyframes d2{50%{transform:translate3d(-12vmax,6vmax,0)}}
.glass{background:var(--card);border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 20px 50px -30px rgba(0,0,0,.5)}
.blur{backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3)}
header[data-header]{position:fixed;inset:12px 0 auto 0;z-index:80;pointer-events:none}
.top{pointer-events:auto;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:20px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;margin-right:auto;letter-spacing:-.02em;min-height:44px}.logo-img{height:30px;max-width:130px;object-fit:contain;background:#fff;border-radius:8px;padding:3px 8px}.logo-fallback{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);font-size:13px}
.qbtn,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;min-height:46px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:14px;text-decoration:none;transition:transform .25s,box-shadow .25s,background .25s}
.btn.primary{background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);border:0;box-shadow:0 14px 36px -14px var(--brand)}.btn.primary:hover{transform:translate3d(0,-2px,0)}.btn:hover{border-color:var(--brand)}.btn.added{background:var(--brand);color:var(--brand-ink);border-color:transparent}
.menu-btn{display:none!important}
.dock{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:85;display:flex;gap:4px;padding:6px;border-radius:24px;max-width:calc(100vw - 20px)}
.dock a{display:flex;flex-direction:column;align-items:center;gap:3px;text-decoration:none;font-size:11px;font-weight:600;color:var(--muted);padding:9px 18px;border-radius:18px;min-width:62px;min-height:48px;transition:color .2s,background .2s}.dock a svg{width:21px;height:21px}
.dock a:hover{color:var(--fg)}.dock a.active{color:var(--brand-ink);background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hero{min-height:100svh;display:grid;align-items:center;padding:110px 0 120px}.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.badge{display:inline-flex;gap:10px;align-items:center;padding:8px 16px;border-radius:99px;font-size:12px;font-weight:600}.badge i{width:8px;height:8px;border-radius:50%;background:var(--brand);box-shadow:0 0 10px var(--brand)}
h1{font-size:clamp(38px,6vw,84px);line-height:1;letter-spacing:-.045em;font-weight:700;margin:22px 0}
h1 span{background:linear-gradient(100deg,var(--fg) 5%,var(--brand) 55%,var(--brand2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:var(--muted);font-size:clamp(15px,1.5vw,18px);max-width:46ch;margin:0 0 30px}.cta{display:flex;gap:12px;flex-wrap:wrap}
.stack{position:relative;aspect-ratio:1/.95}.stack .c1{position:absolute;inset:0 12% 14% 0;border-radius:32px;padding:10px;transition:transform .3s}.stack .c1 .plate{position:absolute;inset:10px;border-radius:24px}
.stack .c2{position:absolute;right:0;bottom:0;width:48%;border-radius:24px;padding:18px;animation:fl 8s ease-in-out infinite}.c2 small{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em}.c2 b{display:block;font-size:22px;letter-spacing:-.03em;margin-top:4px;line-height:1.15}
@keyframes fl{50%{transform:translate3d(0,-10px,0)}}
section.blk{padding:clamp(60px,9vw,120px) 0}
.sh{margin-bottom:38px;max-width:640px}.sh small{font-weight:700;color:var(--brand);letter-spacing:.12em;text-transform:uppercase;font-size:11px}.sh h2{font-size:clamp(30px,4.6vw,60px);letter-spacing:-.04em;line-height:1.02;margin:10px 0 0}.sh p{color:var(--muted);margin:14px 0 0}
/* pinned story */
.story{height:calc(var(--n,4) * 80vh + 20vh);padding:0}.story-in{position:sticky;top:0;height:100vh;padding:90px 0 110px;box-sizing:border-box;display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center}
.stage{position:relative;aspect-ratio:1/.88;border-radius:34px;overflow:hidden;max-height:100%;width:100%;justify-self:center}.stage .plate{position:absolute;inset:0;opacity:0;transform:scale(1.06);transition:opacity .7s,transform 1s cubic-bezier(.2,.8,.2,1)}.stage .plate.on{opacity:1;transform:none}
.steps{display:grid;gap:10px}.stp{padding:16px 22px;border-radius:22px;opacity:.5;transition:opacity .4s,transform .4s,border-color .4s;transform:scale(.98)}.stp.on{opacity:1;transform:none;border-color:color-mix(in srgb,var(--brand) 70%,transparent)}
.stp small{color:var(--brand);font-weight:800;letter-spacing:.1em}.stp h3{margin:2px 0 4px;font-size:clamp(19px,2.2vw,28px);letter-spacing:-.03em;line-height:1.15}.stp p{margin:0;color:var(--muted);font-size:14px;max-height:0;overflow:hidden;transition:max-height .5s}.stp.on p{max-height:90px;margin-top:6px}.stp .btn{display:none;margin-top:12px;padding:9px 16px;min-height:44px;font-size:13px}.stp.on .btn{display:inline-flex}
.bar{height:3px;border-radius:3px;background:var(--line);overflow:hidden}.bar i{display:block;height:100%;width:100%;transform-origin:0;transform:scaleX(var(--pp,0));background:linear-gradient(90deg,var(--brand),var(--brand2))}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}.stat{padding:30px 24px;border-radius:26px}.stat b{display:block;font-size:clamp(40px,5vw,70px);letter-spacing:-.05em;line-height:1;background:linear-gradient(135deg,var(--fg),var(--brand));-webkit-background-clip:text;background-clip:text;color:transparent}.stat span{color:var(--muted);font-size:13px;font-weight:600}
.final{text-align:center;padding:clamp(44px,7vw,90px) 24px;border-radius:38px}.final h2{font-size:clamp(32px,5.4vw,74px);letter-spacing:-.045em;line-height:1;margin:0 auto 12px;max-width:16ch}.final p{color:var(--muted);margin:0 0 26px}.final .cta{justify-content:center}
/* range */
.tools{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px}.search{display:flex;gap:10px;align-items:center;border-radius:16px;padding:0 18px;flex:1;min-width:230px;max-width:460px}.search input{flex:1;background:none;border:0;padding:15px 0;color:var(--fg);font:inherit;font-size:16px;outline:none;min-width:0}.search svg{width:18px;color:var(--muted);flex:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:16px}
.pc{border-radius:26px;padding:10px;transition:transform .4s cubic-bezier(.2,.8,.2,1),border-color .3s;contain:layout paint}.pc:hover{transform:translate3d(0,-8px,0);border-color:var(--brand)}
.pc .plate{aspect-ratio:1/.9;border-radius:18px}.pc .plate img{transition:transform .7s}.pc:hover .plate img{transform:scale(1.07)}.pc h3{margin:14px 8px 4px;font-size:18px;letter-spacing:-.02em;line-height:1.2}.pc p{margin:0 8px 6px;color:var(--muted);font-size:13px}.pc .row{display:flex;gap:8px;margin:10px 8px 8px;flex-wrap:wrap}.pc .btn{padding:9px 16px;min-height:44px;font-size:13px}
.empty{color:var(--muted);padding:16px 4px}
/* sectors */
.sgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}.sec{padding:28px;border-radius:28px;position:relative;overflow:hidden;transition:transform .4s,border-color .3s}.sec:hover{transform:translate3d(0,-6px,0);border-color:var(--brand)}
.sec .no{font-size:13px;font-weight:800;color:var(--brand);letter-spacing:.1em}.sec h3{font-size:26px;margin:10px 0 6px;letter-spacing:-.03em;line-height:1.1}.sec p{margin:0;color:var(--muted)}
.tl{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;position:relative}.tl::before{content:"";position:absolute;left:8%;right:8%;top:32px;height:2px;background:linear-gradient(90deg,var(--brand),var(--brand2));opacity:.5}.tl div{padding:20px;border-radius:24px;position:relative}.tl b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);font-size:13px;margin-bottom:10px}.tl h3{margin:0 0 4px;font-size:20px}.tl p{margin:0;color:var(--muted);font-size:14px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}.split .plate{aspect-ratio:5/4;border-radius:30px}
.kv{display:grid;gap:10px;margin-top:20px}.kv div{padding:14px 18px;border-radius:16px;display:grid;grid-template-columns:78px 1fr;gap:10px;font-size:14px;word-break:break-word}.kv b{color:var(--brand);font-weight:600}.kv a{text-decoration:none}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:9px 16px;border-radius:99px;font-size:13px;font-weight:600}
.cform{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:24px;border-radius:28px}.cform label{display:grid;gap:6px;font-size:12px;font-weight:600;color:var(--muted)}.cform .full{grid-column:1/-1}.cform input,.cform textarea{padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;font-size:16px;outline:none;width:100%}.cform input:focus,.cform textarea:focus{border-color:var(--brand)}
.cbtn{grid-column:1/-1;padding:15px;border:0;border-radius:14px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);font-weight:700;min-height:50px}.sent{color:var(--brand);font-size:14px}
footer{padding:30px 0 130px;color:var(--muted);font-size:13px}.foot{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between}.foot a{text-decoration:none;padding:6px 0}.foot a:hover{color:var(--fg)}.foot .soc{display:flex;gap:4px 18px;flex-wrap:wrap}
@media(max-width:900px){.hero-grid,.split{grid-template-columns:1fr}.stack{max-width:440px}.story{height:auto;padding:50px 0}.story-in{position:static;height:auto;grid-template-columns:1fr;padding:0}.stp{opacity:1;transform:none}.stp p{max-height:none;margin-top:6px}.stp .btn{display:inline-flex}.stage .plate{position:absolute}.tl{grid-template-columns:1fr}.tl::before{display:none}.hero{padding-bottom:140px}}
@media(max-width:560px){.dock a{padding:8px 10px;min-width:0;flex:1;font-size:10px}.dock{left:10px;right:10px;transform:none;justify-content:space-between}.cform{grid-template-columns:1fr}.top{padding-left:12px}:root{--flag-bottom:88px}.qbtn{padding:10px 14px}}
`;

const SCRIPT = `window.__tpl=function(c){
 var st=c.$('.story'); if(!st) return; var stp=c.$$('.stp'), pl=c.$$('.stage .plate'), n=stp.length, last=-1, tick=false;
 function upd(){ tick=false; if(c.root.dataset.page!=='home'||innerWidth<=900) return; var r=st.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; var tot=st.offsetHeight-innerHeight, p=Math.max(0,Math.min(.9999,-r.top/tot)), i=Math.floor(p*n);
  st.style.setProperty('--pp',p.toFixed(3)); if(i!==last){ last=i; stp.forEach(function(s,k){ s.classList.toggle('on',k===i); }); pl.forEach(function(s,k){ s.classList.toggle('on',k===i); }); } }
 addEventListener('scroll',function(){ if(!tick){ tick=true; c.raf(upd); } },{passive:true}); addEventListener('resize',upd);
 var tilt=c.$('.c1'); stp.forEach(function(s,k){ s.addEventListener('click',function(){ if(innerWidth>900) return; stp.forEach(function(x,j){x.classList.toggle('on',j===k)}); pl.forEach(function(x,j){x.classList.toggle('on',j===k)}); }); });
};`;

export function renderAurora(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#8b5cf6', voice: 3, ...opts }), t = m.t, P = m.products, story = P.slice(0, 4);
  const sh = (small, h, sub) => `<div class="sh" data-reveal><small>${esc(small)}</small><h2>${esc(h)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  const pc = (p, i) => `<article class="pc glass" data-prod="${esc(p.name)}" data-spot data-reveal data-delay="${(i % 4) * 60}">${media(p)}<h3>${esc(p.name)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}<div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.details)}</a>` : ''}</div></article>`;
  const home = `<section class="hero"><div class="wrap hero-grid"><div><span class="badge glass blur" data-reveal><i></i>${esc(t.eyebrow)}</span><h1 data-reveal data-delay="70"><span>${esc(m.headline)}</span></h1><p class="lead" data-reveal data-delay="130">${esc(m.sub)}</p>
<div class="cta" data-reveal data-delay="190"><a class="btn primary" href="#/range" data-go="range" data-magnetic>${esc(t.ctaA)}</a><button class="btn" data-quote-open data-magnetic>${esc(t.ctaB)}</button></div></div>
<div class="stack" data-reveal="zoom" data-delay="120"><div class="c1 glass" data-tilt="6">${media(m.img.hero)}</div><div class="c2 glass blur"><small>${esc(m.certs[0] ? t.certsTitle : t.pill)}</small><b>${esc(m.certs[0] || m.sectors[0].name)}</b></div></div></div></section>
${sectionsHtml(m)}
<section class="story" style="--n:${story.length}"><div class="wrap story-in"><div class="stage glass" data-reveal="zoom">${story.map((p, i) => media(p, i === 0 ? 'on' : '')).join('')}</div>
<div class="steps">${sh(t.featKicker, t.featTitle)}${story.map((p, i) => `<div class="stp glass ${i === 0 ? 'on' : ''}"><small>0${i + 1}</small><h3>${esc(p.name)}</h3>${p.desc2 ? `<p>${esc(p.desc2)}</p>` : ''}<button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button></div>`).join('')}<div class="bar"><i></i></div></div></div></section>
<section class="blk"><div class="wrap">${sh(t.statsKicker, t.statsTitle)}<div class="stats">${m.stats.map(s => `<div class="stat glass" data-reveal="zoom"><b data-count="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="final glass" data-reveal="zoom"><h2>${esc(t.bandTitle)}</h2><p>${esc(t.bandSub)}</p><div class="cta"><button class="btn primary" data-quote-open data-magnetic>${esc(t.bandCta)}</button>${goLink('range', t.featLink, 'btn')}</div></div></div></section>`;

  const range = `<section class="blk" style="padding-top:120px"><div class="wrap">${sh(PAGES[1][1], t.prodTitle, t.prodSub)}<div class="tools"><label class="search glass blur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label>${quoteBtn('Quote list')}</div><div class="grid">${P.map(pc).join('')}</div><p class="empty" data-empty hidden>${esc(t.empty)}</p></div></section>`;

  const sectors = `<section class="blk" style="padding-top:120px"><div class="wrap">${sh(PAGES[2][1], t.solTitle, t.solSub)}<div class="sgrid">${m.sectors.map((s, i) => `<div class="sec glass" data-reveal data-delay="${(i % 3) * 70}"><div class="no">${String(i + 1).padStart(2, '0')}</div><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p></div>`).join('')}</div></div></section>`;

  const facts = factList(m);
  const kv = `<div class="kv">${facts.map(([k, v, h]) => `<div class="glass"><b>${esc(k)}</b>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<span>${esc(v)}</span>`}</div>`).join('')}</div>`;
  const about = `<section class="blk" style="padding-top:120px"><div class="wrap">${sh(PAGES[3][1], t.aboutTitle, t.aboutSub)}<div class="split"><div class="glass" style="padding:10px;border-radius:34px" data-reveal="left">${media(m.img.about)}</div><div data-reveal="right">${m.aboutLine ? `<p class="lead" style="margin:0;color:var(--fg);font-size:18px">${esc(m.aboutLine)}</p>` : ''}${kv}${m.certs.length ? `<div class="chips">${m.certs.map(c => `<span class="glass">${esc(c)}</span>`).join('')}</div>` : ''}</div></div></div></section>`;
  const contact = `<section class="blk" style="padding-top:120px"><div class="wrap">${sh(PAGES[4][1], t.contactTitle, t.contactSub)}<div class="split"><div class="glass" style="border-radius:28px" data-reveal="left">${contactForm(m)}</div><div data-reveal="right"><h3 style="margin:0;font-size:20px">${esc(t.direct)}</h3>${kv}</div></div></div></section>`;

  const header = `<header data-header><div class="wrap"><div class="top glass blur"><a class="logo" href="#/home" data-go="home">${logoMark(m)}${m.logo ? '' : `<span class="hide-m">${esc(m.name)}</span>`}</a>${themeBtn()}${quoteBtn(t.navCta)}</div></div></header>`;
  const dockHtml = `<nav class="dock glass blur" aria-label="Main">${PAGES.map(([id, l]) => `<a href="#/${id}" data-go="${id}">${ico(id)}<span>${esc(l)}</span></a>`).join('')}</nav>`;
  const footer = `<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}. ${esc(t.foot)}</span><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site</a>` : ''}</div></div></footer><div class="aurora amb" aria-hidden="true"><i></i><i></i><i></i></div>${dockHtml}`;
  const pages = PAGES.map(([id, label], i) => ({ id, label, html: [home, range, sectors, about, contact][i] }));
  return shell(m, { tpl: 'aurora', fonts: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap', css: CSS(m), header, footer, pages, script: SCRIPT, themeDefault: opts.theme || 'dark', menuLinks: '' });
}
