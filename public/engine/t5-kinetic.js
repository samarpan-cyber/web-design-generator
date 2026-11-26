// Template 5 - KINETIC: editorial/brutalist type. Velocity-skewed marquee, scroll-lit statement, hover-image product index, cursor follower.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, mobileNav, quoteBtn, navItems, socialLinks, agencyFlag } from './common.js';

const CSS = m => `
${themeVars(m, {
  light: { bg: '#efede6', bg2: '#e6e3da', fg: '#0d0d0d', muted: '#6a6860', line: 'rgba(13,13,13,.18)', card: 'rgba(255,255,255,.5)' },
  dark: { bg: '#0c0c0c', bg2: '#151515', fg: '#f1efe8', muted: '#8d8b84', line: 'rgba(241,239,232,.18)', card: 'rgba(255,255,255,.04)' }
})}
body{font-family:'Archivo',system-ui,sans-serif;line-height:1.5}
.wrap{width:min(1400px,100% - 48px);margin-inline:auto}
.big{font-family:'Archivo',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:-.045em;line-height:.86}
header[data-header]{position:fixed;inset:0 0 auto 0;z-index:80;mix-blend-mode:difference;color:#fff}
.nav{display:flex;align-items:center;gap:26px;height:70px}.logo{margin-right:auto;text-decoration:none;display:flex;gap:10px;align-items:center;font-weight:900;text-transform:uppercase;letter-spacing:-.02em;font-size:20px}
.logo-img{height:30px;max-width:130px;object-fit:contain;filter:grayscale(1) invert(1)}.logo-fallback{display:grid;place-items:center;width:34px;height:34px;border:2px solid #fff;font-size:13px}
.nav-links{display:flex;gap:26px}.nav-links a{text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.06em;position:relative}.nav-links a::after{content:"";position:absolute;left:0;bottom:-4px;width:100%;height:2px;background:#fff;transform:scaleX(0);transform-origin:100% 50%;transition:transform .4s}.nav-links a:hover::after{transform:scaleX(1);transform-origin:0 50%}
.theme-btn,.menu-btn{background:transparent;border-color:#fff;color:#fff;width:38px;height:38px}.menu-btn span{background:#fff;box-shadow:0 6px 0 #fff}
.qbtn{background:#fff;color:#000;border:0;border-radius:99px;padding:9px 18px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em}.qbtn [data-quote-count]{background:#000;color:#fff}
.btn{display:inline-flex;align-items:center;gap:10px;padding:16px 28px;border-radius:99px;background:var(--fg);color:var(--bg);font-weight:800;text-transform:uppercase;font-size:14px;letter-spacing:.04em;text-decoration:none;border:2px solid var(--fg);transition:.3s}.btn:hover{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}.btn.ghost{background:transparent;color:var(--fg)}.btn.ghost:hover{background:var(--fg);color:var(--bg);border-color:var(--fg)}.btn.added{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.cur{position:fixed;left:0;top:0;width:14px;height:14px;border-radius:50%;background:var(--brand);pointer-events:none;z-index:300;mix-blend-mode:normal;transition:width .3s,height .3s,margin .3s;margin:-7px 0 0 -7px}.cur.big{width:70px;height:70px;margin:-35px 0 0 -35px;opacity:.9}@media(hover:none){.cur{display:none}}
.hero{min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:100px 0 40px;position:relative;overflow:hidden}
.hero h1{font-size:clamp(54px,14.5vw,250px);margin:0;word-break:break-word}.hero h1 span{display:inline-block;overflow:hidden;vertical-align:top}.hero h1 span i{display:inline-block;font-style:normal;transform:translateY(105%);animation:up 1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes up{to{transform:none}}
.hero h1 em{font-style:normal;color:var(--brand)}
.hero-row{display:grid;grid-template-columns:1.3fr 1fr auto;gap:30px;align-items:end;margin-top:34px;padding-top:24px;border-top:2px solid var(--fg)}.hero-row p{margin:0;font-size:clamp(15px,1.4vw,19px);max-width:52ch}.hero-row .meta{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);display:grid;gap:4px}.cta{display:flex;gap:12px;flex-wrap:wrap}
.hero .disc{position:absolute;right:6vw;top:16vh;width:min(26vw,330px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:2px solid var(--fg);animation:spin 40s linear infinite;z-index:-1}.hero .disc .plate{position:absolute;inset:0}@keyframes spin{to{transform:rotate(360deg)}}
.mq{overflow:hidden;background:var(--brand);color:var(--brand-ink);padding:18px 0;transform:skewX(var(--sk,0deg));margin-inline:-30px;border-block:2px solid var(--fg)}.mq-t{display:flex;width:max-content;will-change:transform}.mq-t span{font-weight:900;text-transform:uppercase;font-size:clamp(28px,4.4vw,64px);letter-spacing:-.03em;white-space:nowrap;padding-right:30px}.mq-t span::after{content:"✦";padding-left:30px}
section{padding:clamp(70px,10vw,150px) 0}
.stmt{font-size:clamp(28px,5.2vw,78px);font-weight:800;letter-spacing:-.04em;line-height:1.04;max-width:20ch}.stmt span{color:color-mix(in srgb,var(--fg) 16%,transparent);transition:color .3s}.stmt span.lit{color:var(--fg)}
.kick{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--brand);margin-bottom:18px;display:flex;gap:12px;align-items:center}.kick::before{content:"";width:40px;height:2px;background:var(--brand)}
.idx-h{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap;margin-bottom:30px}.idx-h h2{font-size:clamp(44px,9vw,150px);margin:0}
.search{display:flex;gap:10px;align-items:center;border-bottom:2px solid var(--fg);min-width:min(300px,100%)}.search input{flex:1;background:none;border:0;padding:12px 0;color:var(--fg);font:inherit;font-weight:700;outline:none;text-transform:uppercase}.search svg{width:18px}
.list{border-top:2px solid var(--fg)}.item{display:grid;grid-template-columns:90px 1fr auto;gap:20px;align-items:center;padding:clamp(18px,3vw,36px) 6px;border-bottom:1px solid var(--line);position:relative;transition:padding .45s cubic-bezier(.2,.8,.2,1),background .3s,color .3s;cursor:pointer}
.item:hover{padding-left:30px;padding-right:30px;background:var(--fg);color:var(--bg)}.item .n{font-weight:800;font-size:14px;opacity:.55}.item h3{margin:0;font-size:clamp(26px,5vw,76px);font-weight:900;text-transform:uppercase;letter-spacing:-.04em;line-height:.95}
.item .r{display:flex;gap:10px;align-items:center}.item .r .btn{padding:10px 18px;font-size:12px;background:transparent;color:inherit;border-color:currentColor}.item .r .btn:hover{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}.item .r .btn.added{background:var(--brand);color:var(--brand-ink)}
.item .d{grid-column:2/3;font-size:14px;max-width:60ch;opacity:.7;margin-top:-6px}
.peek{position:fixed;left:0;top:0;width:min(34vw,420px);aspect-ratio:4/3;z-index:60;pointer-events:none;opacity:0;scale:.8;transition:opacity .3s,scale .4s cubic-bezier(.2,.8,.2,1);border-radius:6px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}.peek.on{opacity:1;scale:1}.peek .plate{position:absolute;inset:0}@media(hover:none){.peek{display:none}}
.empty{padding:30px 0;font-weight:700;text-transform:uppercase;color:var(--muted)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 30px;border-top:2px solid var(--fg)}.stat{padding:40px 0;border-bottom:2px solid var(--fg)}.stat b{display:block;font-size:clamp(64px,9.5vw,150px);font-weight:900;letter-spacing:-.06em;line-height:.85}.stat span{font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:13px;color:var(--muted)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:60px}.cols .plate{aspect-ratio:4/5;border:2px solid var(--fg)}.cols h2{font-size:clamp(40px,7vw,110px);margin:0 0 26px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.tags span{border:2px solid var(--fg);padding:8px 16px;border-radius:99px;font-weight:800;text-transform:uppercase;font-size:13px;transition:.25s}.tags span:hover{background:var(--brand);color:var(--brand-ink);border-color:var(--brand);transform:rotate(-3deg)}
.kv{display:grid;gap:0;border-top:2px solid var(--fg)}.kv div{display:flex;gap:18px;padding:14px 0;border-bottom:1px solid var(--line)}.kv b{min-width:90px;text-transform:uppercase;font-size:12px;letter-spacing:.1em;color:var(--brand)}
.foot-big{padding:clamp(60px,8vw,120px) 0 30px;background:var(--fg);color:var(--bg);overflow:hidden}.foot-big .t{font-size:clamp(50px,15vw,280px);white-space:nowrap}.foot-big .t span{color:var(--brand)}
.foot-row{display:flex;gap:22px;flex-wrap:wrap;justify-content:space-between;margin-top:36px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.foot-row a{text-decoration:none;opacity:.8}.foot-row a:hover{opacity:1;color:var(--brand)}.foot-row nav,.foot-row .soc{display:flex;gap:22px;flex-wrap:wrap}
.cta-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:34px}
.foot-big .btn{background:var(--bg);color:var(--fg);border-color:var(--bg)}.foot-big .btn.ghost{background:transparent;color:var(--bg)}
@media(max-width:900px){.hero-row{grid-template-columns:1fr}.hero .disc{display:none}.item{grid-template-columns:44px 1fr}.item .r{grid-column:1/-1}.item .d{grid-column:1/-1}.cols{grid-template-columns:1fr}}
`;

const SCRIPT = `window.__tpl=function(c){
 var cur=document.createElement('div'); cur.className='cur'; document.body.appendChild(cur);
 addEventListener('pointermove',function(e){ cur.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)'; },{passive:true});
 c.$$('a,button,.item').forEach(function(el){ el.addEventListener('pointerenter',function(){cur.classList.add('big')}); el.addEventListener('pointerleave',function(){cur.classList.remove('big')}); });
 // marquee driven by scroll velocity
 var t=c.$('.mq-t'), mq=c.$('.mq'); if(t){ var x=0,last=scrollY,vel=0,w=0; function m(){ w=t.scrollWidth/2; } m(); addEventListener('resize',m);
  (function loop(){ var d=scrollY-last; last=scrollY; vel+=(d-vel)*.12; x-= (c.reduce?0:1.2)+vel*.9; if(-x>w) x+=w; if(x>0) x-=w; t.style.transform='translate3d('+x+'px,0,0)'; mq.style.setProperty('--sk',Math.max(-8,Math.min(8,vel*-.35))+'deg'); requestAnimationFrame(loop); })(); }
 // scroll-lit statement
 var s=c.$('.stmt'); if(s){ var w=s.textContent.trim().split(/\\s+/); s.innerHTML=w.map(function(x){return '<span>'+x.replace(/[<>&]/g,'')+'</span>'}).join(' '); var sp=c.$$('span',s);
  function lit(){ var r=s.getBoundingClientRect(), p=Math.max(0,Math.min(1,(innerHeight*.85-r.top)/(r.height+innerHeight*.35))); var n=Math.round(p*sp.length); sp.forEach(function(e,i){ e.classList.toggle('lit',i<n); }); } addEventListener('scroll',lit,{passive:true}); lit(); }
 // hover image preview following cursor
 var pk=c.$('.peek'); if(pk){ var imgs={}; c.$$('.item').forEach(function(it){ it.addEventListener('pointerenter',function(){ pk.querySelector('img').src=it.dataset.img; pk.querySelector('img').parentNode.className='plate '+(it.dataset.photo==='1'?'photo':'art'); pk.classList.add('on'); }); it.addEventListener('pointerleave',function(){ pk.classList.remove('on'); }); });
  var px=0,py=0,tx=0,ty=0; addEventListener('pointermove',function(e){ tx=e.clientX+30; ty=e.clientY-120; }); (function f(){ px+=(tx-px)*.14; py+=(ty-py)*.14; pk.style.transform='translate('+px+'px,'+py+'px) rotate('+((tx-px)*.05)+'deg)'; requestAnimationFrame(f); })(); }
 c.$$('.item').forEach(function(it){ it.addEventListener('click',function(e){ if(e.target.closest('a,button')) return; var q=it.querySelector('[data-quote]'); if(q) q.click(); }); });
};`;

export function renderKinetic(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#ff3d2e', ...opts });
  const nav = navItems(m), P = m.products;
  const words = m.name.split(/\s+/);
  const nameHtml = words.map((w, i) => `<span><i style="animation-delay:${i * 120}ms">${i === words.length - 1 && words.length > 1 ? `<em>${esc(w)}</em>` : esc(w)}</i></span>`).join(' ');
  const mq = [...P.map(p => p.name), ...m.industries].slice(0, 8);
  const body = `<div id="prog"></div><div id="top"></div>
<header data-header><div class="wrap nav"><a class="logo" href="#top">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>${themeBtn()}${quoteBtn('Quote')}${menuBtn()}</div></header>${mobileNav(m)}
<div class="hero"><div class="disc">${media({ src: m.heroPhoto || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!m.heroPhoto })}</div><div class="wrap"><h1 class="big">${nameHtml}</h1>
<div class="hero-row"><p>${esc(m.headline)}. ${esc(m.desc.slice(0, 180))}</p><div class="meta"><span>${esc(m.host)}</span>${m.address ? `<span>${esc(m.address.slice(0, 50))}</span>` : ''}<span>${P.length} products · ${m.industries.length || 'multi'} sectors</span></div><div class="cta"><a class="btn" href="#products">Products ↓</a><a class="btn ghost" href="#contact">Contact</a></div></div></div></div>
<div style="overflow:hidden"><div class="mq" aria-hidden="true"><div class="mq-t"><span>${mq.map(esc).join('</span><span>')}</span><span>${mq.map(esc).join('</span><span>')}</span><span>${mq.map(esc).join('</span><span>')}</span><span>${mq.map(esc).join('</span><span>')}</span></div></div></div>
<section id="about"><div class="wrap"><div class="kick">Who we are</div><p class="stmt">${esc(m.about.slice(0, 230))}</p></div></section>
<section id="products" style="padding-top:0"><div class="wrap"><div class="idx-h"><h2 class="big" data-reveal>Index</h2><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Filter ${P.length} products" aria-label="Filter products"></label></div>
<div class="list">${P.map((p, i) => `<div class="item" data-prod="${esc(p.name + ' ' + p.desc)}" data-img="${esc(p.src)}" data-photo="${p.isPhoto ? 1 : 0}" data-reveal data-delay="${(i % 5) * 50}"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3><div class="r"><button class="btn" data-quote="${esc(p.name)}"><span data-label>+ Quote</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">↗</a>` : ''}</div>${p.desc ? `<p class="d">${esc(p.desc)}</p>` : ''}</div>`).join('')}</div><p class="empty" data-empty hidden>Nothing matches.</p></div></section>
<div class="peek"><div class="plate art"><img alt="" src="${esc(m.heroArt)}"></div></div>
<section style="padding-top:0"><div class="wrap"><div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b class="big" data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section id="industries"><div class="wrap cols"><div data-reveal="left">${media({ src: m.gallery[1] || m.gallery[0] || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!(m.gallery[1] || m.gallery[0]) })}</div><div data-reveal="right"><div class="kick">Sectors &amp; standards</div><h2 class="big">Made for hard jobs</h2><div class="tags">${[...m.industries, ...m.certs].map(x => `<span>${esc(x)}</span>`).join('') || '<span>Industrial</span><span>Embedded</span><span>Power</span>'}</div><div class="kv">${m.email ? `<div><b>Email</b>${esc(m.email)}</div>` : ''}${m.phone ? `<div><b>Phone</b>${esc(m.phone)}</div>` : ''}${m.address ? `<div><b>Office</b>${esc(m.address)}</div>` : ''}</div></div></div></section>
<footer id="contact" class="foot-big"><div class="wrap"><div class="kick" style="color:var(--brand)">Next step</div><div class="t big" data-reveal>Let’s talk<span>.</span></div><div class="cta-row"><a class="btn" href="#" data-quote-open>Request a quote</a>${m.email ? `<a class="btn ghost" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}</div><div class="foot-row"><span>© ${m.year} ${esc(m.name)}</span><nav>${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site ↗</a>` : ''}</div></div></div></footer>${agencyFlag(m)}`;
  return shell(m, { title: `${m.name} — Kinetic concept`, fonts: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&display=swap', css: CSS(m), body, script: SCRIPT, themeDefault: opts.theme || 'light' });
}
