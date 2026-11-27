// Design 5, KINETIC. Editorial and loud. Full-screen menu, giant type, velocity marquee, scroll-lit statement, hover-preview index.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, quoteBtn, goLink, socialLinks, contactForm, factList } from './common.js';

const PAGES = [['home', 'Home'], ['index', 'Index'], ['sectors', 'Sectors'], ['about', 'About'], ['contact', 'Contact']];

const CSS = m => `
${themeVars(m, {
  light: { bg: '#efede6', bg2: '#e6e3da', fg: '#0d0d0d', muted: '#6a6860', line: 'rgba(13,13,13,.2)', card: 'rgba(255,255,255,.55)' },
  dark: { bg: '#0c0c0c', bg2: '#151515', fg: '#f1efe8', muted: '#8f8d86', line: 'rgba(241,239,232,.2)', card: 'rgba(255,255,255,.05)' }
})}
body{font-family:'Bricolage Grotesque',system-ui,sans-serif;line-height:1.5;font-size:16px}
.ser{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;letter-spacing:0}
.big{font-weight:800;text-transform:uppercase;letter-spacing:-.045em;line-height:.88}
.wrap{width:min(1360px,100% - 40px);margin-inline:auto}
header[data-header]{position:fixed;inset:0 0 auto 0;z-index:95;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}header.scrolled{background:color-mix(in srgb,var(--bg) 92%,transparent);border-color:var(--line)}
.nav{display:flex;align-items:center;gap:12px;height:68px}.logo{margin-right:auto;text-decoration:none;display:flex;gap:10px;align-items:center;font-weight:800;text-transform:uppercase;letter-spacing:-.02em;font-size:19px;min-height:44px}
.logo-img{height:30px;max-width:130px;object-fit:contain;background:#fff;border-radius:6px;padding:2px 6px}.logo-fallback{display:grid;place-items:center;width:36px;height:36px;border:2px solid var(--fg);font-size:13px}
.theme-btn{width:44px;height:44px}
.qbtn,.mbtn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 20px;border-radius:99px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.05em;border:2px solid var(--fg);background:transparent;transition:background .2s,color .2s}.qbtn:hover,.mbtn:hover{background:var(--fg);color:var(--bg)}.qbtn [data-quote-count]{background:var(--fg);color:var(--bg)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:0 28px;min-height:52px;border-radius:99px;background:var(--fg);color:var(--bg);font-weight:800;text-transform:uppercase;font-size:14px;letter-spacing:.04em;text-decoration:none;border:2px solid var(--fg);transition:background .25s,color .25s,border-color .25s}.btn:hover{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.btn.ghost{background:transparent;color:var(--fg)}.btn.ghost:hover{background:var(--fg);color:var(--bg);border-color:var(--fg)}.btn.added{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.menu-btn{display:none!important}
.mnav{align-items:flex-start;justify-content:center;gap:0;padding:96px max(20px,calc((100vw - 1360px)/2)) 40px;font-weight:800;text-transform:uppercase;letter-spacing:-.04em;font-size:clamp(44px,10vw,132px);line-height:1}
.mnav a{display:flex;align-items:baseline;gap:18px;padding:4px 0;transition:color .2s,transform .3s;width:100%}.mnav a i{font:600 14px 'Bricolage Grotesque',sans-serif;color:var(--brand);letter-spacing:.1em}.mnav a:hover{color:var(--brand);transform:translate3d(14px,0,0)}.mnav a.active{color:var(--brand)}
@media(min-width:861px){html.menu-open .mnav{display:flex!important}}
html.menu-open header[data-header]{background:transparent;border-color:transparent}
.hero{min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:100px 0 36px;position:relative;overflow:hidden}
.hero h1{font-size:clamp(52px,13.5vw,230px);margin:0;word-break:break-word}.hero h1 span{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.06em}.hero h1 span i{display:inline-block;font-style:normal;transform:translate3d(0,105%,0);animation:up .9s cubic-bezier(.2,.8,.2,1) forwards}@keyframes up{to{transform:none}}
.hero h1 em{font-style:normal;color:var(--brand)}
.hero-row{display:grid;grid-template-columns:1.4fr 1fr auto;gap:28px;align-items:end;margin-top:28px;padding-top:22px;border-top:2px solid var(--fg)}.hero-row p{margin:0;font-size:clamp(22px,2.6vw,38px);line-height:1.08;max-width:22ch}.hero-row .meta{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);display:grid;gap:4px}.cta{display:flex;gap:12px;flex-wrap:wrap}
.hero .disc{position:absolute;right:5vw;top:15vh;width:min(24vw,320px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:2px solid var(--fg);animation:spin 50s linear infinite;z-index:0}.hero .disc .plate{position:absolute;inset:0}@keyframes spin{to{transform:rotate(360deg)}}
.hero .wrap{position:relative;z-index:1}
.mq{background:var(--brand);color:var(--brand-ink);padding:16px 0;border-block:2px solid var(--fg);overflow:hidden}.mq-t{display:flex;width:max-content;will-change:transform}.mq-t span{font-weight:800;text-transform:uppercase;font-size:clamp(26px,4.2vw,60px);letter-spacing:-.03em;white-space:nowrap;padding-right:28px}.mq-t span::after{content:"✦";padding-left:28px}
section.blk{padding:clamp(64px,9vw,140px) 0}
.kick{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--brand);margin-bottom:16px;display:flex;gap:12px;align-items:center}.kick::before{content:"";width:36px;height:2px;background:var(--brand)}
.stmt{font-size:clamp(28px,5vw,74px);font-weight:700;letter-spacing:-.04em;line-height:1.04;max-width:20ch}.stmt span{color:color-mix(in srgb,var(--fg) 18%,transparent);transition:color .25s}.stmt span.lit{color:var(--fg)}
.feat{display:grid;gap:0;border-top:2px solid var(--fg)}.fi{display:grid;grid-template-columns:90px 1fr minmax(180px,26vw);gap:24px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}.fi .n{font-weight:800;font-size:14px;color:var(--muted)}.fi h3{margin:0;font-size:clamp(28px,5vw,72px);font-weight:800;text-transform:uppercase;letter-spacing:-.04em;line-height:.92}.fi p{margin:8px 0 0;color:var(--muted);max-width:44ch}.fi .plate{aspect-ratio:4/3;border-radius:14px;border:2px solid var(--fg)}.fi .btn{margin-top:14px;min-height:46px;padding:0 20px;font-size:12px}
.fi:nth-child(2n) .plate{order:-1}.fi:nth-child(2n){grid-template-columns:minmax(180px,26vw) 1fr 90px}.fi:nth-child(2n) .n{order:3;text-align:right}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:0 30px;border-top:2px solid var(--fg)}.stat{padding:30px 0;border-bottom:2px solid var(--fg)}.stat b{display:block;font-size:clamp(60px,9.5vw,150px);font-weight:800;letter-spacing:-.06em;line-height:.85}.stat span{font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:var(--muted)}
.phead{padding:130px 0 30px}.phead h1{font-size:clamp(52px,11vw,180px);margin:0}.phead p{font-size:clamp(18px,2vw,26px);max-width:34ch;margin:18px 0 0;color:var(--muted)}
.search{display:flex;gap:10px;align-items:center;border-bottom:2px solid var(--fg);max-width:520px;margin:20px 0 26px}.search input{flex:1;background:none;border:0;padding:14px 0;color:var(--fg);font:inherit;font-weight:700;font-size:18px;outline:none;text-transform:uppercase;min-width:0}.search svg{width:20px;flex:none}
.list{border-top:2px solid var(--fg)}.item{display:grid;grid-template-columns:70px 1fr auto;gap:18px;align-items:center;padding:clamp(16px,2.6vw,30px) 4px;border-bottom:1px solid var(--line);transition:background .25s,color .25s,padding .35s cubic-bezier(.2,.8,.2,1)}
.item:hover{background:var(--fg);color:var(--bg);padding-left:24px;padding-right:24px}.item .n{font-weight:800;font-size:13px;opacity:.55}.item h3{margin:0;font-size:clamp(24px,4.4vw,64px);font-weight:800;text-transform:uppercase;letter-spacing:-.04em;line-height:.95}
.item .r{display:flex;gap:10px;align-items:center}.item .r .btn{min-height:44px;padding:0 18px;font-size:12px;background:transparent;color:inherit;border-color:currentColor}.item .r .btn:hover,.item .r .btn.added{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
.item .d{grid-column:2/3;font-size:14px;max-width:56ch;opacity:.7;margin:-8px 0 0}
.peek{position:fixed;left:0;top:0;width:min(30vw,380px);aspect-ratio:4/3;z-index:60;pointer-events:none;opacity:0;transition:opacity .25s;border-radius:8px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.5);will-change:transform}.peek.on{opacity:1}.peek .plate{position:absolute;inset:0}
.empty{padding:26px 0;font-weight:800;text-transform:uppercase;color:var(--muted)}
.secs{border-top:2px solid var(--fg)}.sec{display:grid;grid-template-columns:70px 1.4fr 1fr;gap:18px 30px;align-items:center;padding:clamp(20px,3vw,38px) 4px;border-bottom:1px solid var(--line);transition:background .25s,color .25s,padding .35s}.sec:hover{background:var(--brand);color:var(--brand-ink);padding-left:24px}.sec .n{font-weight:800;font-size:13px}.sec h3{margin:0;font-size:clamp(28px,5vw,76px);font-weight:800;text-transform:uppercase;letter-spacing:-.04em;line-height:.92}.sec p{margin:0;font-size:18px}
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:0 30px;border-top:2px solid var(--fg)}.how div{padding:28px 0}.how b{font-size:clamp(70px,10vw,150px);font-weight:800;line-height:.85;color:var(--brand);letter-spacing:-.06em}.how h3{margin:8px 0 4px;font-size:26px;text-transform:uppercase;letter-spacing:-.02em}.how p{margin:0;color:var(--muted)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:start}.cols .plate{aspect-ratio:4/5;border:2px solid var(--fg)}
.lede{font-size:clamp(24px,3vw,42px);font-weight:600;letter-spacing:-.03em;line-height:1.1;margin:0 0 28px}
.kv{border-top:2px solid var(--fg)}.kv div{display:grid;grid-template-columns:96px 1fr;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);word-break:break-word}.kv b{text-transform:uppercase;font-size:11px;letter-spacing:.1em;color:var(--brand);padding-top:4px}.kv a{text-decoration:none}.kv a:hover{color:var(--brand)}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}.tags span{border:2px solid var(--fg);padding:8px 16px;border-radius:99px;font-weight:800;text-transform:uppercase;font-size:12px;transition:background .2s,color .2s}.tags span:hover{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
.cform{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cform label{display:grid;gap:6px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.cform .full{grid-column:1/-1}.cform input,.cform textarea{padding:14px 0;border:0;border-bottom:2px solid var(--fg);background:none;color:var(--fg);font:inherit;font-size:18px;outline:none;width:100%}.cform input:focus,.cform textarea:focus{border-color:var(--brand)}
.cbtn{grid-column:1/-1;min-height:56px;border:0;border-radius:99px;background:var(--fg);color:var(--bg);font-weight:800;text-transform:uppercase;letter-spacing:.05em}.cbtn:hover{background:var(--brand);color:var(--brand-ink)}.sent{color:var(--brand);font-weight:700}
footer{background:var(--fg);color:var(--bg);padding:clamp(54px,8vw,110px) 0 90px;overflow:hidden}footer .kick{color:var(--brand)}footer .t{font-size:clamp(52px,14vw,240px);margin:0}footer .t span{color:var(--brand)}
.foot-row{display:flex;gap:18px 26px;flex-wrap:wrap;justify-content:space-between;margin-top:34px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.foot-row a{text-decoration:none;opacity:.85;padding:6px 0}.foot-row a:hover{opacity:1;color:var(--brand)}.foot-row nav,.foot-row .soc{display:flex;gap:4px 22px;flex-wrap:wrap}
footer .btn{background:var(--bg);color:var(--fg);border-color:var(--bg)}footer .btn.ghost{background:transparent;color:var(--bg)}
@media(max-width:900px){.hero-row,.cols,.how{grid-template-columns:1fr}.hero .disc{width:34vw;top:12vh}.fi,.fi:nth-child(2n){grid-template-columns:44px 1fr}.fi .plate,.fi:nth-child(2n) .plate{grid-column:1/-1;order:5}.fi:nth-child(2n) .n{order:0;text-align:left}.item{grid-template-columns:40px 1fr}.item .r,.item .d{grid-column:1/-1}.sec{grid-template-columns:40px 1fr}.sec p{grid-column:2}.peek{display:none}}
@media(max-width:560px){.cform{grid-template-columns:1fr}.theme-btn{width:40px;height:40px}.qbtn,.mbtn{padding:0 14px}.hero .disc{display:none}}
`;

const SCRIPT = `window.__tpl=function(c){
 var t=c.$('.mq-t'); if(t){ var x=0,last=scrollY,vel=0,w=0; function m(){ w=t.scrollWidth/2; } m(); addEventListener('resize',m); var mqe=c.$('.mq');
  (function loop(){ var d=scrollY-last; last=scrollY; vel+=(d-vel)*.1; if(c.isPlaying()&&c.root.dataset.page==='home'&&!c.reduce){ x-=1.1+Math.abs(vel)*.5; if(-x>w) x+=w; t.style.transform='translate3d('+x+'px,0,0)'; } c.raf(loop); })(); }
 var s=c.$('.stmt'); if(s){ var words=s.textContent.trim().split(/\\s+/); s.innerHTML=words.map(function(x){return '<span>'+x.replace(/[<>&]/g,'')+'</span>'}).join(' '); var sp=c.$$('span',s), tk=false;
  function lit(){ tk=false; if(c.root.dataset.page!=='home') return; var r=s.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; var p=Math.max(0,Math.min(1,(innerHeight*.85-r.top)/(r.height+innerHeight*.3))), n=Math.round(p*sp.length); sp.forEach(function(e,i){ e.classList.toggle('lit',i<n); }); }
  addEventListener('scroll',function(){ if(!tk){ tk=true; c.raf(lit); } },{passive:true}); window.addEventListener('pagechange',lit); lit(); }
 var pk=c.$('.peek'); if(pk&&c.fine){ var img=pk.querySelector('img'), box=pk.querySelector('.plate'), px=0,py=0,tx=0,ty=0,run=false;
  c.$$('.item').forEach(function(it){ it.addEventListener('pointerenter',function(){ img.src=it.dataset.img; box.className='plate '+(it.dataset.photo==='1'?'photo':'art'); pk.classList.add('on'); run=true; }); it.addEventListener('pointerleave',function(){ pk.classList.remove('on'); run=false; }); });
  addEventListener('pointermove',function(e){ tx=e.clientX+28; ty=e.clientY-110; },{passive:true}); (function f(){ if(run){ px+=(tx-px)*.18; py+=(ty-py)*.18; pk.style.transform='translate3d('+px.toFixed(1)+'px,'+py.toFixed(1)+'px,0)'; } c.raf(f); })(); }
 c.$$('.item').forEach(function(it){ it.addEventListener('click',function(e){ if(e.target.closest('a,button')) return; var q=it.querySelector('[data-quote]'); if(q) q.click(); }); });
};`;

export function renderKinetic(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#ff3d2e', voice: 4, ...opts }), t = m.t, P = m.products;
  const words = m.name.split(/\s+/);
  const nameHtml = words.map((w, i) => `<span><i style="animation-delay:${i * 110}ms">${i === words.length - 1 && words.length > 1 ? `<em>${esc(w)}</em>` : esc(w)}</i></span>`).join(' ');
  const mq = [t.marqueeLead, ...m.marquee].slice(0, 9);
  const facts = factList(m);
  const kv = `<div class="kv">${facts.map(([k, v, h]) => `<div><b>${esc(k)}</b>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<span>${esc(v)}</span>`}</div>`).join('')}</div>`;

  const home = `<div class="hero"><div class="disc amb">${media(m.img.hero)}</div><div class="wrap"><h1 class="big">${nameHtml}</h1>
<div class="hero-row"><p class="ser">${esc(m.headline)}</p><div class="meta"><span>${esc(t.eyebrow)}</span>${m.address ? `<span>${esc(m.address.slice(0, 54))}</span>` : ''}</div><div class="cta"><a class="btn" href="#/index" data-go="index">${esc(t.ctaA)}</a><a class="btn ghost" href="#/contact" data-go="contact">${esc(t.ctaB)}</a></div></div></div></div>
<div style="overflow:hidden"><div class="mq amb" aria-hidden="true"><div class="mq-t"><span>${mq.map(esc).join('</span><span>')}</span><span>${mq.map(esc).join('</span><span>')}</span><span>${mq.map(esc).join('</span><span>')}</span></div></div></div>
<section class="blk"><div class="wrap"><div class="kick">${esc(t.aboutTitle)}</div><p class="stmt">${esc(m.sub)}</p></div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="kick">${esc(t.featKicker)}</div><div class="feat">${P.slice(0, 3).map((p, i) => `<div class="fi" data-reveal><span class="n">0${i + 1}</span><div><h3>${esc(p.name)}</h3>${p.desc2 ? `<p>${esc(p.desc2)}</p>` : ''}<button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button></div>${media(p)}</div>`).join('')}</div><div style="margin-top:26px">${goLink('index', t.featLink + ' →', 'btn ghost')}</div></div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="kick">${esc(t.statsKicker)}</div><div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b class="big" data-count="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>`;

  const index = `<div class="wrap"><div class="phead"><div class="kick">${esc(PAGES[1][1])}</div><h1 class="big">${esc(t.prodTitle)}</h1><p>${esc(t.prodSub)}</p></div>
<label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label>
<div class="list">${P.map((p, i) => `<div class="item" data-prod="${esc(p.name)}" data-img="${esc(p.src)}" data-photo="${p.isPhoto ? 1 : 0}" data-reveal><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3><div class="r"><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.details)}</a>` : ''}</div>${p.desc ? `<p class="d">${esc(p.desc)}</p>` : ''}</div>`).join('')}</div><p class="empty" data-empty hidden>${esc(t.empty)}</p><div style="height:clamp(50px,8vw,110px)"></div></div>
<div class="peek"><div class="plate art"><img alt="" src="${esc(m.img.hero.art)}"></div></div>`;

  const sectors = `<div class="wrap"><div class="phead"><div class="kick">${esc(PAGES[2][1])}</div><h1 class="big">${esc(t.solTitle)}</h1><p>${esc(t.solSub)}</p></div>
<div class="secs">${m.sectors.map((s, i) => `<div class="sec" data-reveal><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p></div>`).join('')}</div>
<div class="kick" style="margin:clamp(50px,7vw,100px) 0 20px">${esc(t.stepsTitle)}</div><div class="how">${t.steps.map(([a, b], i) => `<div data-reveal data-delay="${i * 80}"><b class="big">${i + 1}</b><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div><div style="height:clamp(50px,8vw,110px)"></div></div>`;

  const about = `<div class="wrap"><div class="phead"><div class="kick">${esc(PAGES[3][1])}</div><h1 class="big">${esc(t.aboutTitle)}</h1><p>${esc(t.aboutSub)}</p></div>
<div class="cols" style="padding-bottom:clamp(50px,8vw,110px)"><div data-reveal="left">${media(m.img.about)}</div><div data-reveal="right">${m.aboutLine ? `<p class="lede">${esc(m.aboutLine)}</p>` : ''}<div class="kick" style="margin-top:8px">${esc(t.factsTitle)}</div>${kv}${m.certs.length ? `<div class="kick" style="margin-top:30px">${esc(t.certsTitle)}</div><div class="tags" style="margin-top:0">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div></div></div>`;

  const contact = `<div class="wrap"><div class="phead"><div class="kick">${esc(PAGES[4][1])}</div><h1 class="big">${esc(t.contactTitle)}</h1><p>${esc(t.contactSub)}</p></div>
<div class="cols" style="padding-bottom:clamp(50px,8vw,110px)"><div data-reveal="left">${contactForm(m)}</div><div data-reveal="right"><div class="kick">${esc(t.direct)}</div>${kv}</div></div></div>`;

  const header = `<header data-header><div class="wrap nav"><a class="logo" href="#/home" data-go="home">${logoMark(m)}${m.logo ? '' : `<span class="hide-m">${esc(m.name)}</span>`}</a>${themeBtn()}${quoteBtn(t.navCta)}<button class="mbtn" data-menu-btn aria-label="Menu">${esc(t.pill)}</button></div></header>`;
  const footer = `<footer><div class="wrap"><div class="kick">${esc(t.direct)}</div><div class="t big">${esc(t.bandTitle.replace(/\.$/, ''))}<span>.</span></div><p style="margin:16px 0 0;opacity:.75;font-size:18px">${esc(t.bandSub)}</p><div class="cta" style="margin-top:26px"><button class="btn" data-quote-open>${esc(t.bandCta)}</button>${m.email ? `<a class="btn ghost" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}</div>
<div class="foot-row"><span>© ${m.year} ${esc(m.name)}. ${esc(t.foot)}</span><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site</a>` : ''}</div></div></div></footer>`;
  const pages = PAGES.map(([id, label], i) => ({ id, label, html: [home, index, sectors, about, contact][i] }));
  const menu = PAGES.map(([id, l], i) => `<a href="#/${id}" data-go="${id}"><i>0${i + 1}</i>${esc(l)}</a>`).join('');
  return shell(m, { tpl: 'kinetic', fonts: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Serif:ital@1&display=swap', css: CSS(m), header, footer, pages, script: SCRIPT, themeDefault: opts.theme || 'light', menuLinks: menu });
}
