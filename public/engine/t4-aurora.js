// Template 4 - AURORA GLASS: animated gradient mesh, glassmorphism, pinned scroll-storytelling, draggable carousel.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, mobileNav, quoteBtn, navItems, socialLinks, agencyFlag } from './common.js';

const CSS = m => `
${themeVars(m, {
  dark: { bg: '#05060f', bg2: '#0b0d1c', fg: '#f2f4ff', muted: '#9aa1c4', line: 'rgba(255,255,255,.11)', card: 'rgba(255,255,255,.06)' },
  light: { bg: '#eef0fb', bg2: '#ffffff', fg: '#10122a', muted: '#5d6388', line: 'rgba(16,18,42,.1)', card: 'rgba(255,255,255,.62)' }
})}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;line-height:1.55}
.wrap{width:min(1240px,100% - 44px);margin-inline:auto}
.aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;background:var(--bg)}
.aurora i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;mix-blend-mode:screen;animation:drift 22s ease-in-out infinite}
:root[data-theme=light] .aurora i{mix-blend-mode:multiply;opacity:.4}
.aurora i:nth-child(1){width:60vmax;height:60vmax;left:-15vmax;top:-20vmax;background:var(--brand)}
.aurora i:nth-child(2){width:50vmax;height:50vmax;right:-15vmax;top:10vmax;background:var(--brand2);animation-delay:-7s;animation-duration:28s}
.aurora i:nth-child(3){width:44vmax;height:44vmax;left:20vmax;bottom:-25vmax;background:#6d5cff;animation-delay:-13s;animation-duration:34s}
@keyframes drift{25%{transform:translate(8vmax,6vmax) scale(1.1)}50%{transform:translate(-4vmax,12vmax) scale(.92)}75%{transform:translate(-10vmax,-3vmax) scale(1.06)}}
.glass{background:var(--card);backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5);border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 24px 60px -30px rgba(0,0,0,.5)}
header[data-header]{position:fixed;inset:14px 0 auto 0;z-index:80;pointer-events:none}
.nav{pointer-events:auto;display:flex;align-items:center;gap:14px;padding:10px 12px 10px 20px;border-radius:22px;transition:.4s}
header.scrolled .nav{transform:scale(.985)}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;margin-right:auto;letter-spacing:-.02em}.logo-img{height:30px;max-width:130px;object-fit:contain;background:#fff;border-radius:8px;padding:3px 8px}.logo-fallback{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);font-size:13px}
.nav-links{display:flex;gap:4px}.nav-links a{text-decoration:none;font-size:14px;font-weight:600;padding:9px 14px;border-radius:12px;color:var(--muted);transition:.25s}.nav-links a:hover{background:var(--line);color:var(--fg)}
.qbtn,.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:14px;border:1px solid var(--line);background:var(--card);backdrop-filter:blur(10px);font-weight:700;font-size:14px;text-decoration:none;transition:.3s;position:relative}
.btn.primary{background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);border:0;box-shadow:0 14px 40px -12px var(--brand)}.btn.primary:hover{box-shadow:0 20px 50px -10px var(--brand2);transform:translateY(-2px)}.btn.added{background:var(--brand);color:var(--brand-ink)}
.hero{min-height:100svh;display:grid;place-items:center;text-align:center;padding:130px 0 70px}
.badge{display:inline-flex;gap:10px;align-items:center;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600}.badge i{width:8px;height:8px;border-radius:50%;background:var(--brand);box-shadow:0 0 12px var(--brand)}
h1{font-size:clamp(42px,7.6vw,108px);line-height:.98;letter-spacing:-.05em;font-weight:800;margin:26px auto;max-width:14ch}
h1 span{background:linear-gradient(100deg,var(--fg) 10%,var(--brand) 45%,var(--brand2) 70%,var(--fg));background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 8s linear infinite}@keyframes sheen{to{background-position:-220% 0}}
.lead{color:var(--muted);font-size:clamp(16px,1.6vw,20px);max-width:58ch;margin:0 auto 34px}.cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.orb-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:56px}.orb{padding:12px 18px;border-radius:99px;font-size:13px;font-weight:600;animation:bob 6s ease-in-out infinite}.orb:nth-child(2n){animation-delay:-2s}.orb:nth-child(3n){animation-delay:-4s}@keyframes bob{50%{translate:0 -9px}}.orb b{color:var(--brand)}
section{padding:clamp(60px,9vw,120px) 0;position:relative}
.sh{margin-bottom:44px;max-width:760px}.sh small{font-weight:700;color:var(--brand);letter-spacing:.1em;text-transform:uppercase;font-size:12px}.sh h2{font-size:clamp(32px,5vw,66px);letter-spacing:-.045em;line-height:1;margin:12px 0 0}
/* story */
.story{height:calc(var(--n,4) * 90vh + 20vh);padding:0}.story-in{position:sticky;top:0;height:100vh;padding:84px 0 24px;box-sizing:border-box;display:grid;grid-template-columns:1.05fr .95fr;gap:50px;align-items:center}
.stage{position:relative;aspect-ratio:1/.9;border-radius:34px;overflow:hidden;max-height:calc(100vh - 130px)}.stage .plate{position:absolute;inset:0;opacity:0;transform:scale(1.08) rotate(1deg);transition:opacity .8s,transform 1.2s cubic-bezier(.2,.8,.2,1)}.stage .plate.on{opacity:1;transform:none}
.stage .badge2{position:absolute;left:18px;bottom:18px;padding:10px 16px;border-radius:14px;font-weight:700;font-size:14px;z-index:2}
.steps{position:relative;display:grid;gap:12px}.stp{padding:16px 22px;border-radius:22px;opacity:.45;transform:scale(.975);transition:.5s cubic-bezier(.2,.8,.2,1);cursor:pointer}.stp.on{opacity:1;transform:none;border-color:color-mix(in srgb,var(--brand) 70%,transparent);box-shadow:0 20px 60px -24px var(--brand)}
.stp small{color:var(--brand);font-weight:800;letter-spacing:.1em}.stp h3{margin:2px 0 4px;font-size:clamp(20px,2.4vw,30px);letter-spacing:-.03em}.stp p{margin:0;color:var(--muted);font-size:15px;max-height:0;overflow:hidden;transition:max-height .6s}.stp.on p{max-height:120px;margin-top:6px}.stp .btn{display:none}.stp.on .btn{display:inline-flex}
.bar{height:3px;border-radius:3px;background:var(--line);margin-top:14px;overflow:hidden}.bar i{display:block;height:100%;width:calc(var(--p,0) * 100%);background:linear-gradient(90deg,var(--brand),var(--brand2))}
/* carousel */
.car{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px max(22px,calc((100vw - 1240px)/2)) 36px;scrollbar-width:none;cursor:grab}.car::-webkit-scrollbar{display:none}.car.drag{cursor:grabbing;scroll-snap-type:none}
.pc{flex:0 0 min(320px,80vw);scroll-snap-align:center;border-radius:28px;padding:12px;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .4s}.pc:hover{transform:translateY(-10px) rotate(-.6deg);box-shadow:0 40px 80px -30px var(--brand)}
.pc .plate{aspect-ratio:1/.9;border-radius:20px}.pc .plate img{transition:transform .9s}.pc:hover .plate img{transform:scale(1.08)}.pc h3{margin:16px 8px 4px;font-size:19px;letter-spacing:-.02em}.pc p{margin:0 8px 14px;color:var(--muted);font-size:14px;min-height:42px}.pc .btn{margin:0 8px 8px;padding:10px 16px;font-size:13px}
.tools{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:end;margin-bottom:30px}.search{display:flex;gap:10px;align-items:center;border-radius:99px;padding:0 20px;min-width:min(320px,100%)}.search input{flex:1;background:none;border:0;padding:14px 0;color:var(--fg);font:inherit;outline:none}.search svg{width:18px;color:var(--muted)}
.empty{padding:0 22px;color:var(--muted)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.stat{padding:36px 28px;border-radius:26px}.stat b{display:block;font-size:clamp(44px,5.4vw,78px);letter-spacing:-.05em;line-height:1;background:linear-gradient(135deg,var(--fg),var(--brand));-webkit-background-clip:text;background-clip:text;color:transparent}.stat span{color:var(--muted);font-size:14px;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:12px}.chips span{padding:16px 26px;border-radius:99px;font-weight:700;font-size:clamp(15px,1.8vw,20px);transition:.3s}.chips span:hover{background:linear-gradient(135deg,var(--brand),var(--brand2));color:var(--brand-ink);transform:translateY(-4px) scale(1.04)}
.about{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}.about .plate{aspect-ratio:5/4;border-radius:32px}
.kv{display:grid;gap:10px;margin-top:24px}.kv div{padding:14px 18px;border-radius:16px;display:flex;gap:14px;font-size:14px}.kv b{min-width:78px;color:var(--brand)}
.final{text-align:center;padding:clamp(40px,6vw,80px) 28px;border-radius:40px}.final h2{font-size:clamp(34px,6vw,88px);letter-spacing:-.05em;line-height:1;margin:0 auto 30px;max-width:16ch}
footer{padding:44px 0;color:var(--muted);font-size:14px}.foot{display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between}.foot a{text-decoration:none}.foot a:hover{color:var(--fg)}.foot nav,.foot .soc{display:flex;gap:20px;flex-wrap:wrap}
@media(max-width:900px){.story{height:auto;padding:60px 0}.story-in{position:static;height:auto;grid-template-columns:1fr}.stp{opacity:1;transform:none}.stp p{max-height:none}.about{grid-template-columns:1fr}}
`;

const SCRIPT = `window.__tpl=function(c){
 var st=c.$('.story'); if(st){ var stp=c.$$('.stp'), pl=c.$$('.stage .plate'), n=stp.length;
  function upd(){ if(innerWidth<=900) return; var r=st.getBoundingClientRect(), tot=st.offsetHeight-innerHeight, p=Math.max(0,Math.min(.9999,-r.top/tot)), i=Math.floor(p*n);
   stp.forEach(function(s,k){ s.classList.toggle('on',k===i); }); pl.forEach(function(s,k){ s.classList.toggle('on',k===i); }); st.style.setProperty('--p',p.toFixed(3)); }
  addEventListener('scroll',upd,{passive:true}); upd();
  stp.forEach(function(s,k){ s.addEventListener('mouseenter',function(){ if(innerWidth>900) return; }); });
 }
 var car=c.$('.car'); if(car){ var d=false,sx=0,sl=0; car.addEventListener('pointerdown',function(e){ if(e.target.closest('button,a,input')) return; d=true; sx=e.clientX; sl=car.scrollLeft; car.classList.add('drag'); });
  addEventListener('pointermove',function(e){ if(d) car.scrollLeft=sl-(e.clientX-sx); }); addEventListener('pointerup',function(){ d=false; car.classList.remove('drag'); }); }
};`;

export function renderAurora(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#8b5cf6', ...opts });
  const nav = navItems(m), P = m.products, story = P.slice(0, 4);
  const body = `<div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div><div id="prog"></div><div id="top"></div>
<header data-header><div class="wrap"><div class="nav glass"><a class="logo" href="#top">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>${themeBtn()}${quoteBtn('Quote')}${menuBtn()}</div></div></header>${mobileNav(m)}
<section class="hero"><div class="wrap"><span class="badge glass" data-reveal><i></i>${esc(m.host || m.name)} · reimagined</span><h1 data-reveal data-delay="80"><span>${esc(m.headline)}</span></h1><p class="lead" data-reveal data-delay="160">${esc(m.desc)}</p>
<div class="cta" data-reveal data-delay="240"><a class="btn primary" href="#products" data-magnetic>Explore the range</a><a class="btn" href="#contact" data-magnetic>Get a quote</a></div>
<div class="orb-row">${P.slice(0, 5).map(p => `<span class="orb glass" data-reveal="zoom"><b>●</b> ${esc(p.name.slice(0, 30))}</span>`).join('')}</div></div></section>
<section class="story" id="products" style="--n:${story.length}" data-scrollvar><div class="wrap story-in"><div class="stage glass" data-reveal="zoom">${story.map((p, i) => media(p, i === 0 ? 'on' : '')).join('')}<span class="badge2 glass">${esc(m.name)}</span></div>
<div class="steps"><div class="sh" style="margin-bottom:6px"><small>Featured</small><h2 style="font-size:clamp(26px,3.2vw,44px)">Engineered to stand out</h2></div>${story.map((p, i) => `<div class="stp glass ${i === 0 ? 'on' : ''}"><small>0${i + 1}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc || 'Built for performance, certified for confidence, supported for the long run.')}</p><button class="btn" style="margin-top:12px;padding:9px 16px;font-size:13px" data-quote="${esc(p.name)}"><span data-label>Add to quote</span></button></div>`).join('')}<div class="bar"><i></i></div></div></div></section>
<section id="catalogue"><div class="wrap tools"><div class="sh" style="margin:0"><small>Full range</small><h2>Browse everything</h2></div><label class="search glass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Search products…" aria-label="Search products"></label></div>
<div class="car">${P.map(p => `<article class="pc glass" data-prod="${esc(p.name + ' ' + p.desc)}" data-spot>${media(p)}<h3>${esc(p.name)}</h3><p>${esc(p.desc || 'Reliable, certified, ready to ship.')}</p><button class="btn" data-quote="${esc(p.name)}"><span data-label>Add to quote</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">↗</a>` : ''}</article>`).join('')}</div><p class="empty" data-empty hidden>No product matches your search.</p></section>
<section><div class="wrap"><div class="stats">${m.stats.map(s => `<div class="stat glass" data-reveal="zoom"><b data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section id="industries"><div class="wrap"><div class="sh" data-reveal><small>Industries</small><h2>Powering what you build</h2></div><div class="chips">${(m.industries.length ? m.industries : m.cats.length ? m.cats : ['Industrial', 'Automotive', 'Energy', 'Telecom']).map((x, i) => `<span class="glass" data-reveal="zoom" data-delay="${i * 60}">${esc(x)}</span>`).join('')}${m.certs.map(c => `<span class="glass" data-reveal="zoom">✓ ${esc(c)}</span>`).join('')}</div></div></section>
<section id="about"><div class="wrap about"><div data-reveal="left" class="glass" style="border-radius:34px;padding:10px">${media({ src: m.gallery[1] || m.gallery[0] || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!(m.gallery[1] || m.gallery[0]) })}</div><div data-reveal="right"><div class="sh" style="margin-bottom:16px"><small>About</small><h2>${esc(m.name)}</h2></div><p class="lead" style="margin:0">${esc(m.about)}</p><div class="kv">${m.address ? `<div class="glass"><b>Where</b><span>${esc(m.address)}</span></div>` : ''}${m.email ? `<div class="glass"><b>Email</b><span>${esc(m.email)}</span></div>` : ''}${m.phone ? `<div class="glass"><b>Phone</b><span>${esc(m.phone)}</span></div>` : ''}</div></div></div></section>
<section id="contact"><div class="wrap"><div class="final glass" data-reveal="zoom"><h2>Let’s make something remarkable.</h2><div class="cta"><a class="btn primary" href="#" data-quote-open data-magnetic>Start a quote</a>${m.email ? `<a class="btn" href="mailto:${esc(m.email)}" data-magnetic>${esc(m.email)}</a>` : ''}</div></div></div></section>
<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}</span><nav>${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site ↗</a>` : ''}</div></div></footer>${agencyFlag(m)}`;
  return shell(m, { title: `${m.name} — Aurora Glass concept`, fonts: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap', css: CSS(m), body, script: SCRIPT, themeDefault: opts.theme || 'dark' });
}
