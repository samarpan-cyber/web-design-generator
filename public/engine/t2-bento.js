// Design 2, BENTO LAB. Warm, editorial, light-first. Serif headlines, floating pill nav, bento tiles, masonry catalogue.
import { esc, sectionsHtml, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, quoteBtn, goLink, navLinks, mobileLinks, socialLinks, contactForm, factList } from './common.js';

const PAGES = [['home', 'Home'], ['catalogue', 'Catalogue'], ['why', 'Why us'], ['company', 'Company'], ['contact', 'Contact']];

const CSS = m => `
${themeVars(m, {
  light: { bg: '#f5f0e8', bg2: '#fffdf9', fg: '#1b1a17', muted: '#6d675c', line: 'rgba(27,26,23,.1)', card: '#fffdf9' },
  dark: { bg: '#141310', bg2: '#1c1a16', fg: '#f4efe6', muted: '#a39c8e', line: 'rgba(244,239,230,.12)', card: '#1e1c18' }
})}
body{font-family:'DM Sans',system-ui,sans-serif;line-height:1.55;font-size:16px}
:root{--hs-w:1180px;--hs-ff:'DM Serif Display',Georgia,serif;--hs-fw:400;--hs-ls:-.01em;--hs-r:30px}.hs-card,.hs-step,.hs-q,.hs-list li{box-shadow:0 14px 40px -28px rgba(0,0,0,.35)}.hs-t{font-size:clamp(32px,4.8vw,62px)}
.serif{font-family:'DM Serif Display',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.wrap{width:min(1180px,100% - 40px);margin-inline:auto}
header[data-header]{position:fixed;top:12px;left:0;right:0;z-index:80;display:flex;justify-content:center;pointer-events:none;padding:0 12px}
.pill{pointer-events:auto;display:flex;align-items:center;gap:6px;padding:6px 6px 6px 18px;border-radius:99px;background:color-mix(in srgb,var(--bg2) 92%,transparent);backdrop-filter:blur(14px);border:1px solid var(--line);box-shadow:0 10px 30px -14px rgba(0,0,0,.3);max-width:100%}
.logo{display:flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;margin-right:10px;min-height:44px}.logo-img{height:26px;max-width:110px;object-fit:contain;background:#fff;border-radius:6px;padding:2px 6px}.logo-fallback{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--brand);color:var(--brand-ink);font-size:12px}
.nav-links{display:flex}.nav-links a{padding:11px 16px;border-radius:99px;text-decoration:none;font-size:14px;font-weight:500;color:var(--muted);transition:background .2s,color .2s}.nav-links a:hover{background:var(--line);color:var(--fg)}.nav-links a.active{background:var(--fg);color:var(--bg)}
.theme-btn,.menu-btn{width:42px;height:42px}
.qbtn,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;min-height:46px;border-radius:99px;border:0;background:var(--fg);color:var(--bg);font-weight:600;font-size:14px;text-decoration:none;transition:transform .25s,box-shadow .25s}
.btn.brand{background:var(--brand);color:var(--brand-ink)}.btn.ghost{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}.btn:hover,.qbtn:hover{transform:translate3d(0,-2px,0);box-shadow:0 12px 26px -12px rgba(0,0,0,.4)}.btn.added{background:var(--brand);color:var(--brand-ink)}.btn.lg{padding:16px 28px;font-size:16px;min-height:54px}
.hero{padding:140px 0 0;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;left:50%;top:0;width:min(1000px,140%);height:560px;transform:translateX(-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--brand) 22%,transparent),transparent);z-index:0}
.hero .wrap{position:relative;z-index:1}
.chip{display:inline-flex;gap:8px;align-items:center;padding:8px 16px;border-radius:99px;background:var(--card);border:1px solid var(--line);font-size:13px;font-weight:500}.chip i{width:8px;height:8px;border-radius:50%;background:var(--brand)}
h1{font-size:clamp(42px,8vw,108px);line-height:.98;margin:22px auto 20px;max-width:14ch}
h1 em{color:var(--brand);font-style:italic}
.lead{font-size:clamp(17px,1.7vw,21px);color:var(--muted);max-width:46ch;margin:0 auto 30px}
.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.stage{margin:56px auto 0;width:min(1060px,100%);perspective:1400px}
.screen{aspect-ratio:16/8.6;border-radius:30px 30px 0 0;border:1px solid var(--line);border-bottom:0;background:var(--card);box-shadow:0 -20px 80px -34px color-mix(in srgb,var(--brand) 55%,transparent);transform:rotateX(calc((1 - var(--vp,.5) * 2) * 9deg)) scale(calc(.92 + var(--vp,.5) * .08));transform-origin:50% 100%;overflow:hidden;position:relative;will-change:transform}
.screen .plate{position:absolute;inset:0}.screen .plate.photo img{padding:3%}
section.blk{padding:clamp(56px,8vw,110px) 0}
.sec-title{text-align:center;margin-bottom:40px}.sec-title small{color:var(--brand);font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:12px}.sec-title h2{font-size:clamp(32px,5vw,64px);line-height:1.02;margin:10px auto 0;max-width:16ch}.sec-title p{color:var(--muted);max-width:46ch;margin:14px auto 0}
/* bento */
.bento{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:minmax(140px,auto);gap:16px}
.tile{position:relative;border-radius:30px;background:var(--card);border:1px solid var(--line);padding:26px;overflow:hidden;transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s}
.tile:hover{box-shadow:0 26px 60px -30px rgba(0,0,0,.4)}.tile h3{margin:0 0 6px;font-size:24px;line-height:1.15}.tile p{margin:0;color:var(--muted);font-size:15px}
.tile::after{content:"";position:absolute;inset:0;background:radial-gradient(320px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--brand) 14%,transparent),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}.tile:hover::after{opacity:1}
.a{grid-column:span 4;grid-row:span 2;padding:0;min-height:360px}.a .plate{position:absolute;inset:0}.a .cap{position:absolute;left:0;right:0;bottom:0;padding:90px 26px 26px;background:linear-gradient(transparent,rgba(0,0,0,.78));color:#fff}.a .cap p{color:#e2ddd2}
.b{grid-column:span 2;background:var(--brand);color:var(--brand-ink);border:0}.b p{color:inherit;opacity:.82}.big{font-size:clamp(54px,7vw,92px);line-height:1;letter-spacing:-.03em}
.c{grid-column:span 2}.d{grid-column:span 3}.e{grid-column:span 3}
.mini{display:grid;gap:10px;margin-top:14px}.mini div{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:16px;background:var(--bg);border:1px solid var(--line);font-weight:600;font-size:15px}.mini .btn{padding:8px 14px;min-height:40px;font-size:13px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.pills span{padding:8px 14px;border-radius:99px;background:var(--bg);border:1px solid var(--line);font-size:13px;font-weight:500}
/* catalogue (masonry) */
.cat{display:grid;grid-template-columns:260px 1fr;gap:32px;align-items:start}
.side{position:sticky;top:96px;display:grid;gap:14px}.side .tile{padding:20px}
.search{display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:0 16px}.search input{flex:1;border:0;background:none;padding:13px 0;color:var(--fg);font:inherit;font-size:16px;outline:none;min-width:0}.search svg{width:18px;color:var(--muted);flex:none}
.mason{columns:3 240px;column-gap:16px}.pcard{break-inside:avoid;margin:0 0 16px;background:var(--card);border:1px solid var(--line);border-radius:26px;padding:10px;transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s;display:block;contain:layout paint}.pcard:hover{transform:translate3d(0,-6px,0);box-shadow:0 26px 54px -28px rgba(0,0,0,.45)}
.pcard .plate{border-radius:18px}.pcard:nth-child(3n+1) .plate{aspect-ratio:1/1.05}.pcard:nth-child(3n+2) .plate{aspect-ratio:4/3}.pcard:nth-child(3n) .plate{aspect-ratio:4/4.6}.pcard .plate img{transition:transform .7s cubic-bezier(.2,.8,.2,1)}.pcard:hover .plate img{transform:scale(1.06)}
.pcard h3{margin:14px 8px 4px;font-size:21px;line-height:1.15}.pcard p{margin:0 8px 8px;color:var(--muted);font-size:14px}.pcard .row{display:flex;gap:8px;margin:10px 8px 8px;flex-wrap:wrap}.pcard .btn{padding:9px 16px;font-size:13px;min-height:44px}
.empty{color:var(--muted);padding:20px 4px}
/* why */
.sectors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}.sector{padding:28px;border-radius:30px;background:var(--card);border:1px solid var(--line);transition:transform .4s,background .3s}.sector:hover{transform:translate3d(0,-6px,0);background:var(--brand);color:var(--brand-ink)}.sector:hover p{color:inherit}
.sector .no{font-size:48px;line-height:1;color:var(--brand)}.sector:hover .no{color:inherit}.sector h3{font-size:26px;margin:14px 0 6px;line-height:1.12}.sector p{margin:0;color:var(--muted)}
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.how div{padding:26px;border-radius:26px;background:var(--bg2);border:1px dashed var(--line)}.how b{font-size:40px;color:var(--brand);line-height:1}.how h3{margin:10px 0 4px;font-size:22px}.how p{margin:0;color:var(--muted)}
/* company + contact */
.statement{font-size:clamp(28px,4.4vw,58px);line-height:1.08;text-align:center;max-width:22ch;margin:0 auto}
.duo{display:grid;grid-template-columns:1.1fr .9fr;gap:20px}.duo .plate{border-radius:30px;aspect-ratio:4/3;border:1px solid var(--line)}
.facts{display:grid;gap:10px}.facts div{display:grid;grid-template-columns:84px 1fr;gap:10px;padding:14px 18px;border-radius:18px;background:var(--card);border:1px solid var(--line);font-size:14px;word-break:break-word}.facts b{color:var(--brand)}.facts a{text-decoration:none}
.cform{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cform label{display:grid;gap:6px;font-size:13px;font-weight:600}.cform .full{grid-column:1/-1}.cform input,.cform textarea{padding:14px;border-radius:16px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;font-size:16px;outline:none;width:100%}.cform input:focus,.cform textarea:focus{border-color:var(--brand)}
.cbtn{grid-column:1/-1;padding:15px;border:0;border-radius:99px;background:var(--brand);color:var(--brand-ink);font-weight:700;min-height:50px}.sent{color:var(--brand);font-size:14px}
.cta-box{border-radius:36px;padding:clamp(40px,7vw,90px) 24px;text-align:center;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink)}.cta-box h2{font-size:clamp(34px,5.6vw,76px);margin:0 0 10px;line-height:1}.cta-box p{margin:0 0 26px;opacity:.85}.cta-box .btn{background:var(--brand-ink);color:var(--brand)}
footer{padding:44px 0 70px;color:var(--muted);font-size:14px}.foot{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;align-items:center}.foot nav,.foot .soc{display:flex;gap:4px 18px;flex-wrap:wrap}.foot a{text-decoration:none;padding:6px 0}.foot a:hover{color:var(--fg)}
@media(max-width:900px){.a,.b,.c,.d,.e{grid-column:span 6}.a{min-height:320px}.cat{grid-template-columns:1fr}.side{position:static}.duo,.how{grid-template-columns:1fr}.screen{aspect-ratio:4/3}}
@media(max-width:560px){.cform{grid-template-columns:1fr}.hero{padding-top:110px}.mason{columns:1}.pill{padding-left:12px}}
`;

const pcard = (p, i, t) => `<article class="pcard" data-prod="${esc(p.name)}" data-reveal data-delay="${(i % 3) * 70}">${media(p)}<h3 class="serif">${esc(p.name)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}<div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button>${p.url ? `<a class="btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.details)}</a>` : ''}</div></article>`;

export function renderBento(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#e0623a', voice: 1, ...opts }), t = m.t, P = m.products;
  const s0 = m.stats[0], s1 = m.stats[1];
  const title = (small, h, sub) => `<div class="sec-title" data-reveal><small>${esc(small)}</small><h2 class="serif">${esc(h)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  const home = `<section class="hero"><div class="wrap"><span class="chip" data-reveal><i></i>${esc(t.eyebrow)}</span>
<h1 class="serif" data-reveal data-delay="70">${esc(m.headline)}</h1><p class="lead" data-reveal data-delay="130">${esc(m.sub)}</p>
<div class="cta" data-reveal data-delay="190"><a class="btn brand lg" href="#/catalogue" data-go="catalogue" data-magnetic>${esc(t.ctaA)}</a><a class="btn ghost lg" href="#/contact" data-go="contact" data-magnetic>${esc(t.ctaB)}</a></div>
<div class="stage"><div class="screen" data-scrollvar>${media(m.img.hero)}</div></div></div></section>
${sectionsHtml(m)}
<section class="blk"><div class="wrap">${title(t.featKicker, t.featTitle)}
<div class="bento">
<div class="tile a" data-spot data-reveal="zoom">${media(P[0])}<div class="cap"><h3 class="serif">${esc(P[0].name)}</h3>${P[0].desc2 ? `<p>${esc(P[0].desc2)}</p>` : ''}<button class="btn brand" style="margin-top:14px" data-quote="${esc(P[0].name)}"><span data-label>${esc(t.add)}</span></button></div></div>
${s0 ? `<div class="tile b" data-reveal data-delay="80"><div class="big serif" data-count="${s0.value}" data-suffix="${esc(s0.suffix)}">0</div><p>${esc(s0.label)}</p></div>` : ''}
${s1 ? `<div class="tile c" data-reveal data-delay="140"><div class="big serif" style="color:var(--brand)" data-count="${s1.value}" data-suffix="${esc(s1.suffix)}">0</div><p>${esc(s1.label)}</p></div>` : `<div class="tile c" data-reveal><h3 class="serif">${esc(t.statsKicker)}</h3>${m.certs.length ? `<div class="pills">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div>`}
<div class="tile d" data-spot data-reveal><h3 class="serif">${esc(t.featKicker)}</h3><div class="mini">${P.slice(1, 3).map(p => `<div><span>${esc(p.name)}</span><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button></div>`).join('')}</div></div>
<div class="tile e" data-spot data-reveal data-delay="100">${m.stats[2] ? `<div class="big serif" data-count="${m.stats[2].value}" data-suffix="${esc(m.stats[2].suffix)}">0</div><p>${esc(m.stats[2].label)}</p>` : `<p>${esc(m.host)}</p>`}<div style="margin-top:16px">${goLink('company', t.aboutTitle + ' →', 'btn ghost')}</div></div>
</div></div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="cta-box" data-reveal="zoom"><h2 class="serif">${esc(t.bandTitle)}</h2><p>${esc(t.bandSub)}</p><button class="btn lg" data-quote-open data-magnetic>${esc(t.bandCta)}</button></div></div></section>`;

  const catalogue = `<section class="blk" style="padding-top:130px"><div class="wrap">${title(PAGES[1][1], t.prodTitle, t.prodSub)}
<div class="cat"><aside class="side"><div class="tile"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label></div><div class="tile">${quoteBtn(t.navCta)}</div></aside>
<div><div class="mason">${P.map((p, i) => pcard(p, i, t)).join('')}</div><p class="empty" data-empty hidden>${esc(t.empty)}</p></div></div></div></section>`;

  const why = `<section class="blk" style="padding-top:130px"><div class="wrap">${title(PAGES[2][1], t.solTitle, t.solSub)}
<div class="sectors">${m.sectors.map((s, i) => `<div class="sector" data-reveal data-delay="${(i % 3) * 70}"><div class="no serif">${String(i + 1).padStart(2, '0')}</div><h3 class="serif">${esc(s.name)}</h3><p>${esc(s.line)}</p></div>`).join('')}</div></div></section>`;

  const facts = factList(m);
  const factHtml = `<div class="facts">${facts.map(([k, v, h]) => `<div><b>${esc(k)}</b>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<span>${esc(v)}</span>`}</div>`).join('')}</div>`;
  const company = `<section class="blk" style="padding-top:130px"><div class="wrap">${title(PAGES[3][1], t.aboutTitle, t.aboutSub)}
${m.aboutLine ? `<p class="statement serif" data-reveal style="margin-bottom:44px">${esc(m.aboutLine)}</p>` : ''}
<div class="duo"><div data-reveal="left">${media(m.img.about)}</div><div class="tile" data-reveal="right"><h3 class="serif">${esc(t.factsTitle)}</h3><div style="margin-top:14px">${factHtml}</div>${m.certs.length ? `<h3 class="serif" style="margin-top:22px">${esc(t.certsTitle)}</h3><div class="pills">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div></div></div></section>`;

  const contact = `<section class="blk" style="padding-top:130px"><div class="wrap">${title(PAGES[4][1], t.contactTitle, t.contactSub)}
<div class="duo"><div class="tile" data-reveal="left">${contactForm(m)}</div><div class="tile" data-reveal="right"><h3 class="serif">${esc(t.direct)}</h3><div style="margin-top:14px">${factHtml}</div><div class="cta" style="justify-content:flex-start;margin-top:18px"><button class="btn brand" data-quote-open>${esc(t.bandCta)}</button></div></div></div></div></section>`;

  const header = `<header data-header><div class="pill"><a class="logo" href="#/home" data-go="home">${logoMark(m)}${m.logo ? '' : `<span class="hide-m">${esc(m.name)}</span>`}</a><nav class="nav-links" aria-label="Main">${navLinks(PAGES)}</nav>${themeBtn()}${quoteBtn(t.navCta)}${menuBtn()}</div></header>`;
  const footer = `<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}. ${esc(t.foot)}</span><nav>${navLinks(PAGES)}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site</a>` : ''}</div></div></footer>`;
  const pages = PAGES.map(([id, label], i) => ({ id, label, html: [home, catalogue, why, company, contact][i] }));
  return shell(m, { tpl: 'bento', fonts: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap', css: CSS(m), header, footer, pages, themeDefault: opts.theme || 'light', menuLinks: mobileLinks(PAGES, m, `<a href="#" data-quote-open>${esc(t.navCta)}</a>`) });
}
