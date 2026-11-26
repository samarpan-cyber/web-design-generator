// Template 2 - BENTO LAB: light-first, floating pill nav, scroll-scaling hero visual, bento grid with tilt, product shelf.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, mobileNav, quoteBtn, navItems, socialLinks, agencyFlag } from './common.js';

const CSS = m => `
${themeVars(m, {
  light: { bg: '#f5f5f7', bg2: '#ffffff', fg: '#111114', muted: '#6b6b76', line: 'rgba(17,17,20,.09)', card: '#ffffff' },
  dark: { bg: '#0a0a0c', bg2: '#141418', fg: '#f5f5f7', muted: '#9a9aa6', line: 'rgba(255,255,255,.1)', card: '#17171c' }
})}
body{font-family:'Inter',system-ui,sans-serif;line-height:1.5}
.wrap{width:min(1200px,100% - 40px);margin-inline:auto}
header[data-header]{position:fixed;top:14px;left:0;right:0;z-index:80;display:flex;justify-content:center;pointer-events:none}
.pill{pointer-events:auto;display:flex;align-items:center;gap:6px;padding:8px 8px 8px 18px;border-radius:99px;background:color-mix(in srgb,var(--bg2) 78%,transparent);backdrop-filter:blur(22px) saturate(1.6);border:1px solid var(--line);box-shadow:0 8px 30px -12px rgba(0,0,0,.25);transition:.5s cubic-bezier(.2,.8,.2,1);max-width:calc(100% - 24px)}
header.scrolled .pill{box-shadow:0 18px 50px -14px rgba(0,0,0,.35)}
.logo{display:flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;margin-right:14px;letter-spacing:-.02em}.logo-img{height:26px;max-width:120px;object-fit:contain;background:#fff;border-radius:6px;padding:2px 6px}.logo-fallback{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--brand);color:var(--brand-ink);font-size:12px}
.nav-links{display:flex}.nav-links a{padding:9px 15px;border-radius:99px;text-decoration:none;font-size:14px;font-weight:500;color:var(--muted);transition:.25s}.nav-links a:hover{background:var(--line);color:var(--fg)}
.theme-btn,.menu-btn{width:38px;height:38px}
.qbtn,.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:99px;border:0;background:var(--fg);color:var(--bg);font-weight:600;font-size:14px;text-decoration:none;transition:transform .3s,box-shadow .3s}
.btn.brand{background:var(--brand);color:var(--brand-ink)}.btn.ghost{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}.btn:hover,.qbtn:hover{transform:translateY(-2px);box-shadow:0 12px 30px -10px rgba(0,0,0,.35)}
.btn.lg{padding:16px 28px;font-size:16px}
/* hero */
.hero{padding:150px 0 0;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;left:50%;top:-10%;width:1100px;height:700px;translate:-50% 0;background:radial-gradient(closest-side,color-mix(in srgb,var(--brand) 22%,transparent),transparent);filter:blur(30px);z-index:0}
.hero .wrap{position:relative;z-index:1}
.chip{display:inline-flex;gap:8px;align-items:center;padding:7px 14px;border-radius:99px;background:var(--card);border:1px solid var(--line);font-size:13px;font-weight:500}.chip b{background:var(--brand);color:var(--brand-ink);padding:2px 8px;border-radius:99px;font-size:11px}
h1{font-size:clamp(40px,7vw,96px);line-height:1;letter-spacing:-.05em;font-weight:800;margin:24px auto 20px;max-width:15ch}
h1 span{background:linear-gradient(95deg,var(--brand),var(--brand2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:clamp(16px,1.6vw,21px);color:var(--muted);max-width:60ch;margin:0 auto 32px}
.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.stage{margin:64px auto 0;width:min(1100px,100%);perspective:1400px}
.screen{aspect-ratio:16/8.6;border-radius:28px 28px 0 0;border:1px solid var(--line);border-bottom:0;background:var(--card);box-shadow:0 -20px 100px -30px color-mix(in srgb,var(--brand) 40%,transparent);transform:rotateX(calc((1 - var(--vp,.5) * 2) * 14deg)) scale(calc(.9 + var(--vp,.5) * .1));transform-origin:50% 100%;overflow:hidden;position:relative;transition:transform .15s linear}
.screen .plate{position:absolute;inset:0}.screen .plate.photo img{padding:3%}
.screen .float{position:absolute;padding:10px 16px;border-radius:14px;background:color-mix(in srgb,var(--bg2) 85%,transparent);backdrop-filter:blur(14px);border:1px solid var(--line);font-size:13px;font-weight:600;box-shadow:0 10px 30px -10px rgba(0,0,0,.3);animation:fl 7s ease-in-out infinite}.f1{left:5%;top:14%}.f2{right:5%;top:30%;animation-delay:-3s}.f3{left:12%;bottom:12%;animation-delay:-5s}
@keyframes fl{50%{translate:0 -12px}}
.float i{font-style:normal;color:var(--brand);margin-right:6px}
/* trust */
.trust{padding:34px 0;display:flex;gap:10px 30px;flex-wrap:wrap;justify-content:center;color:var(--muted);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}
section{padding:clamp(60px,9vw,120px) 0}
.sec-title{text-align:center;margin-bottom:48px}.sec-title small{color:var(--brand);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px}.sec-title h2{font-size:clamp(30px,4.6vw,60px);letter-spacing:-.045em;line-height:1.02;margin:12px auto 0;max-width:20ch}
/* bento */
.bento{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:minmax(150px,auto);gap:16px}
.tile{position:relative;border-radius:28px;background:var(--card);border:1px solid var(--line);padding:28px;overflow:hidden;transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s;transform-style:preserve-3d}
.tile:hover{box-shadow:0 30px 70px -30px rgba(0,0,0,.35)}.tile h3{margin:0 0 6px;font-size:22px;letter-spacing:-.02em}.tile p{margin:0;color:var(--muted);font-size:15px}
.tile::after{content:"";position:absolute;inset:0;background:radial-gradient(360px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--brand) 14%,transparent),transparent 60%);opacity:0;transition:.4s;pointer-events:none}.tile:hover::after{opacity:1}
.a{grid-column:span 4;grid-row:span 2;padding:0}.a .plate{position:absolute;inset:0}.a .cap{position:absolute;left:0;right:0;bottom:0;padding:90px 28px 28px;background:linear-gradient(transparent,rgba(0,0,0,.78));color:#fff}.a .cap p{color:#ddd}
.b{grid-column:span 2;background:var(--brand);color:var(--brand-ink);border:0}.b p{color:inherit;opacity:.8}.b .big{font-size:clamp(54px,7vw,92px);font-weight:800;letter-spacing:-.06em;line-height:1}
.c{grid-column:span 2}.d{grid-column:span 3}.e{grid-column:span 3;display:flex;gap:22px;align-items:center}.e .plate{flex:0 0 42%;aspect-ratio:1;border-radius:20px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.pills span{padding:7px 13px;border-radius:99px;background:var(--bg);border:1px solid var(--line);font-size:13px;font-weight:500;transition:.25s}.pills span:hover{background:var(--brand);color:var(--brand-ink);transform:translateY(-2px)}
.dots{position:absolute;right:-30px;bottom:-30px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,var(--brand) 2px,transparent 2.5px) 0 0/16px 16px;opacity:.35}
/* shelf */
.tools{display:flex;gap:14px;flex-wrap:wrap;justify-content:space-between;margin-bottom:26px}.search{flex:1;min-width:240px;max-width:420px;display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:0 18px}.search input{flex:1;border:0;background:none;padding:14px 0;color:var(--fg);font:inherit;outline:none}.search svg{width:18px;color:var(--muted)}
.shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.pcard{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:12px;display:flex;flex-direction:column;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .4s}.pcard:hover{transform:translateY(-8px);box-shadow:0 30px 60px -28px rgba(0,0,0,.4)}
.pcard .plate{aspect-ratio:1/.85;border-radius:16px}.pcard .plate img{transition:transform .8s cubic-bezier(.2,.8,.2,1)}.pcard:hover .plate img{transform:scale(1.08) rotate(-1deg)}
.pcard h3{margin:16px 8px 4px;font-size:18px;letter-spacing:-.02em}.pcard p{margin:0 8px 14px;color:var(--muted);font-size:14px;flex:1}.pcard .row{display:flex;gap:8px;margin:0 8px 8px}.pcard .btn{padding:9px 16px;font-size:13px}.btn.added{background:var(--brand);color:var(--brand-ink)}
.empty{text-align:center;color:var(--muted);padding:40px}
/* strip */
.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}.strip div{text-align:center;padding:34px 10px;border-radius:24px;background:var(--card);border:1px solid var(--line)}.strip b{display:block;font-size:clamp(36px,5vw,60px);letter-spacing:-.05em;line-height:1}.strip span{color:var(--muted);font-size:14px}
.cta-box{border-radius:36px;padding:clamp(40px,7vw,90px) 30px;text-align:center;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);position:relative;overflow:hidden}.cta-box h2{font-size:clamp(32px,5.4vw,72px);letter-spacing:-.045em;margin:0 0 24px;line-height:1}.cta-box .btn{background:var(--brand-ink);color:var(--brand)}.cta-box .btn.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
footer{padding:50px 0 40px;color:var(--muted);font-size:14px}.foot{display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between}.foot nav,.foot .soc{display:flex;gap:20px;flex-wrap:wrap}.foot a{text-decoration:none}.foot a:hover{color:var(--fg)}
@media(max-width:900px){.a,.b,.c,.d,.e{grid-column:span 6}.a{min-height:340px}.e{flex-direction:column;align-items:flex-start}.e .plate{flex-basis:auto;width:100%}.screen{aspect-ratio:4/3}.f2{display:none}}
`;

export function renderBento(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#3b82f6', ...opts });
  const nav = navItems(m), P = m.products;
  const trust = [...m.certs, ...m.industries.slice(0, 3)].slice(0, 6);
  const s0 = m.stats[0], pills = (m.cats.length ? m.cats : m.industries.length ? m.industries : P.map(p => p.name)).slice(0, 9);
  const body = `<div id="prog"></div><div id="top"></div>
<header data-header><div class="pill"><a class="logo" href="#top">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>${themeBtn()}${quoteBtn('Quote')}${menuBtn()}</div></header>${mobileNav(m)}
<section class="hero"><div class="wrap"><span class="chip" data-reveal><b>New</b> ${esc(m.host || m.name)} · redesigned</span>
<h1 data-reveal data-delay="80"><span>${esc(m.headline)}</span></h1><p class="lead" data-reveal data-delay="150">${esc(m.desc)}</p>
<div class="cta" data-reveal data-delay="220"><a class="btn brand lg" href="#products" data-magnetic>Browse products</a><a class="btn ghost lg" href="#contact" data-magnetic>Talk to sales</a></div>
<div class="stage"><div class="screen" data-scrollvar>${media({ src: m.heroPhoto || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!m.heroPhoto })}<span class="float f1"><i>●</i>${esc(P[0].name.slice(0, 28))}</span><span class="float f2"><i>◆</i>${esc((P[1] || P[0]).name.slice(0, 28))}</span><span class="float f3"><i>▲</i>${esc(m.certs[0] || (P[2] || P[0]).name.slice(0, 24))}</span></div></div></div></section>
${trust.length ? `<div class="trust wrap">${trust.map(t => `<span>${esc(t)}</span>`).join('<span>·</span>')}</div>` : ''}
<section id="about"><div class="wrap"><div class="sec-title" data-reveal><small>Why ${esc(m.name)}</small><h2>Everything you need, at a glance</h2></div>
<div class="bento">
<div class="tile a" data-tilt="3" data-spot data-reveal="zoom">${media(P[0])}<div class="cap"><h3>${esc(P[0].name)}</h3><p>${esc(P[0].desc || 'Our flagship — built for performance and long service life.')}</p><button class="btn brand" style="margin-top:14px" data-quote="${esc(P[0].name)}"><span data-label>Add to quote</span></button></div></div>
<div class="tile b" data-tilt="6" data-reveal data-delay="80">${s0 ? `<div class="big" data-count="${s0.value}" data-suffix="${esc(s0.suffix || '')}">0</div><p>${esc(s0.label)}</p>` : `<div class="big">${P.length}+</div><p>Products</p>`}<div class="dots"></div></div>
<div class="tile c" data-tilt="6" data-spot data-reveal data-delay="140"><h3>Dark &amp; light, instantly</h3><p>Switch the theme any time from the top bar. Your catalogue reads beautifully either way.</p></div>
<div class="tile d" data-spot data-reveal><h3>Product range</h3><p>Find the right part fast.</p><div class="pills">${pills.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>
<div class="tile e" data-spot data-reveal data-delay="100">${media({ src: m.gallery[2] || m.gallery[0] || (P[1] || P[0]).src, art: (P[1] || P[0]).art, name: m.name, isPhoto: !!(m.gallery[2] || m.gallery[0]) })}<div><h3>About us</h3><p>${esc(m.about.slice(0, 200))}${m.about.length > 200 ? '…' : ''}</p></div></div>
</div></div></section>
<section id="products"><div class="wrap"><div class="sec-title" data-reveal><small>Catalogue</small><h2>Find your next component</h2></div>
<div class="tools"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Search products…" aria-label="Search products"></label>${quoteBtn('Open quote list')}</div>
<div class="shelf">${P.map((p, i) => `<article class="pcard" data-prod="${esc(p.name + ' ' + p.desc)}" data-reveal data-delay="${(i % 4) * 70}">${media(p)}<h3>${esc(p.name)}</h3><p>${esc(p.desc || 'Reliable, certified and ready to ship.')}</p><div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>Add to quote</span></button>${p.url ? `<a class="btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">Details ↗</a>` : ''}</div></article>`).join('')}</div><p class="empty" data-empty hidden>No product matches your search.</p></div></section>
<section><div class="wrap"><div class="strip">${m.stats.map(s => `<div data-reveal="zoom"><b data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section id="industries" style="padding-top:0"><div class="wrap"><div class="sec-title" data-reveal><small>Industries</small><h2>Trusted where reliability matters</h2></div><div class="pills" style="justify-content:center">${(m.industries.length ? m.industries : ['Industrial', 'Automotive', 'Energy', 'Medical', 'Telecom']).map(x => `<span style="padding:14px 24px;font-size:16px">${esc(x)}</span>`).join('')}</div></div></section>
<section id="contact" style="padding-top:0"><div class="wrap"><div class="cta-box" data-reveal="zoom"><h2>Ready to spec your next project?</h2><div class="cta"><a class="btn lg" href="#" data-quote-open data-magnetic>Request a quote</a>${m.email ? `<a class="btn ghost lg" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}${m.phone ? `<a class="btn ghost lg" href="tel:${esc(m.phone.replace(/[^+\d]/g, ''))}">${esc(m.phone)}</a>` : ''}</div>${m.address ? `<p style="margin:24px 0 0;opacity:.85">${esc(m.address)}</p>` : ''}</div></div></section>
<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}</span><nav>${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site ↗</a>` : ''}</div></div></footer>${agencyFlag(m)}`;
  return shell(m, { title: `${m.name} — Bento Lab concept`, fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', css: CSS(m), body, themeDefault: opts.theme || 'light' });
}
