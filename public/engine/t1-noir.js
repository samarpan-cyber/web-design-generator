// Template 1 - CIRCUIT NOIR: dark-first, animated PCB-trace hero, spotlight cards, horizontal product rail, scroll-filled timeline.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, mobileNav, quoteBtn, navItems, socialLinks, agencyFlag } from './common.js';

const CSS = (m) => `
${themeVars(m, {
  dark: { bg: '#07090d', bg2: '#0d1117', fg: '#eef2f7', muted: '#8b97a8', line: 'rgba(255,255,255,.09)', card: 'rgba(255,255,255,.035)' },
  light: { bg: '#f4f6f9', bg2: '#ffffff', fg: '#0b1220', muted: '#5b6676', line: 'rgba(11,18,32,.1)', card: 'rgba(255,255,255,.8)' }
})}
body{font-family:'Space Grotesk',system-ui,sans-serif;line-height:1.55}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.02em}
.wrap{width:min(1240px,100% - 48px);margin-inline:auto}
header[data-header]{position:fixed;inset:0 0 auto 0;z-index:80;transition:.4s;padding:16px 0}
header.scrolled{background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(18px) saturate(1.4);border-bottom:1px solid var(--line);padding:10px 0}
.nav{display:flex;align-items:center;gap:28px}.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:18px;margin-right:auto}
.logo-img{height:34px;width:auto;max-width:150px;object-fit:contain;background:#fff;border-radius:8px;padding:4px 8px}.logo-fallback{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--brand);color:var(--brand-ink);font-size:14px}
.nav-links{display:flex;gap:26px}.nav-links a{text-decoration:none;font-size:14px;color:var(--muted);transition:.25s;position:relative}.nav-links a:hover{color:var(--fg)}
.nav-links a::after{content:"";position:absolute;left:0;bottom:-6px;height:2px;width:100%;background:var(--brand);transform:scaleX(0);transform-origin:0 50%;transition:transform .35s}.nav-links a:hover::after{transform:scaleX(1)}
.qbtn,.btn{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border-radius:99px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:14px;text-decoration:none;transition:.3s}
.btn.primary{background:var(--brand);color:var(--brand-ink);border-color:transparent;box-shadow:0 10px 40px -10px var(--brand)}.btn.primary:hover{transform:translateY(-2px);box-shadow:0 18px 50px -10px var(--brand)}.btn:hover,.qbtn:hover{border-color:var(--brand)}
/* hero */
.hero{position:relative;min-height:100svh;display:grid;align-items:center;padding:120px 0 80px;overflow:hidden;isolation:isolate}
#pcb{position:absolute;inset:0;width:100%;height:100%;z-index:-2}
.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(600px circle at var(--px,70%) var(--py,30%),color-mix(in srgb,var(--brand) 16%,transparent),transparent 60%),linear-gradient(180deg,transparent 60%,var(--bg))}
.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.eyebrow{display:inline-flex;gap:10px;align-items:center;padding:7px 14px;border:1px solid var(--line);border-radius:99px;background:var(--card);font-size:12px;color:var(--muted)}.eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 0 var(--brand);animation:ping 2s infinite}
@keyframes ping{70%{box-shadow:0 0 0 10px transparent}100%{box-shadow:0 0 0 0 transparent}}
h1{font-size:clamp(40px,6.2vw,88px);line-height:.98;letter-spacing:-.035em;margin:22px 0 22px;font-weight:700}
h1 em{font-style:normal;background:linear-gradient(100deg,var(--brand),var(--brand2),var(--brand));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:flow 6s linear infinite}
@keyframes flow{to{background-position:-200% 0}}
.lead{font-size:clamp(16px,1.5vw,19px);color:var(--muted);max-width:56ch;margin:0 0 32px}
.cta{display:flex;gap:14px;flex-wrap:wrap}.certs{display:flex;gap:8px;flex-wrap:wrap;margin-top:34px}.certs span{font-size:11px;padding:6px 10px;border:1px dashed var(--line);border-radius:6px;color:var(--muted)}
.device{position:relative;aspect-ratio:1/1.02;border-radius:28px;border:1px solid var(--line);background:linear-gradient(145deg,var(--card),transparent);transition:transform .2s;transform-style:preserve-3d;box-shadow:0 50px 120px -40px color-mix(in srgb,var(--brand) 45%,transparent)}
.device .plate{position:absolute;inset:14px;border-radius:20px}
.device .tag{position:absolute;padding:8px 12px;border-radius:12px;background:color-mix(in srgb,var(--bg2) 85%,transparent);backdrop-filter:blur(10px);border:1px solid var(--line);font-size:11px;animation:bob 6s ease-in-out infinite;transform:translateZ(60px)}
.device .tag b{color:var(--brand)}.t1{left:-28px;top:14%}.t2{right:-22px;top:48%;animation-delay:-2s}.t3{left:10%;bottom:-18px;animation-delay:-4s}
@keyframes bob{50%{translate:0 -10px}}
.scrollcue{position:absolute;left:50%;bottom:26px;translate:-50% 0;width:24px;height:40px;border:1.5px solid var(--muted);border-radius:14px;opacity:.7}.scrollcue::after{content:"";position:absolute;left:50%;top:8px;width:3px;height:8px;margin-left:-1.5px;border-radius:2px;background:var(--brand);animation:wheel 1.8s infinite}@keyframes wheel{to{transform:translateY(14px);opacity:0}}
/* marquee */
.marq{border-block:1px solid var(--line);padding:18px 0;overflow:hidden;background:var(--bg2)}.marq-track{display:flex;gap:44px;width:max-content;animation:mq 38s linear infinite}.marq:hover .marq-track{animation-play-state:paused}
.marq-track span{font-size:14px;text-transform:uppercase;color:var(--muted);white-space:nowrap;display:flex;gap:44px;align-items:center}.marq-track span::after{content:"◆";color:var(--brand);font-size:9px}
@keyframes mq{to{transform:translateX(-50%)}}
section{padding:clamp(70px,10vw,140px) 0;position:relative}
.sec-head{display:flex;justify-content:space-between;align-items:end;gap:30px;flex-wrap:wrap;margin-bottom:44px}
.kicker{font-size:12px;color:var(--brand);text-transform:uppercase;margin-bottom:12px}
h2{font-size:clamp(30px,4.4vw,58px);letter-spacing:-.03em;line-height:1.02;margin:0;max-width:18ch}
.search{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--card);border-radius:99px;padding:0 18px;min-width:min(320px,100%)}.search input{flex:1;background:none;border:0;padding:14px 0;color:var(--fg);font:inherit;outline:none}.search svg{width:18px;color:var(--muted)}
.rail-wrap{position:relative}.rail{display:flex;gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px max(24px,calc((100vw - 1240px)/2)) 30px;scrollbar-width:none;cursor:grab}.rail::-webkit-scrollbar{display:none}.rail.drag{cursor:grabbing;scroll-snap-type:none}
.card{flex:0 0 min(340px,82vw);scroll-snap-align:start;position:relative;border-radius:24px;border:1px solid var(--line);background:var(--card);padding:14px;transition:transform .5s cubic-bezier(.2,.8,.2,1),border-color .3s;overflow:hidden}
.card::before{content:"";position:absolute;inset:0;background:radial-gradient(420px circle at var(--mx,50%) var(--my,0),color-mix(in srgb,var(--brand) 22%,transparent),transparent 45%);opacity:0;transition:opacity .35s;pointer-events:none}
.card:hover{transform:translateY(-8px);border-color:color-mix(in srgb,var(--brand) 60%,transparent)}.card:hover::before{opacity:1}
.card .plate{aspect-ratio:4/3;border-radius:16px}.card .plate img{transition:transform .9s cubic-bezier(.2,.8,.2,1)}.card:hover .plate img{transform:scale(1.07)}
.card .idx{position:absolute;right:26px;top:26px;font-size:11px;color:#fff;background:rgba(0,0,0,.55);padding:4px 9px;border-radius:99px;backdrop-filter:blur(6px)}
.card h3{font-size:21px;margin:18px 6px 6px;letter-spacing:-.01em}.card p{margin:0 6px 16px;color:var(--muted);font-size:14px;min-height:44px}
.card .row{display:flex;gap:8px;margin:0 6px 6px}.card .row .btn{padding:10px 16px;font-size:13px}.card .row a.btn{flex:0}
.btn.added{background:var(--brand);color:var(--brand-ink);border-color:transparent}
.rail-ctrl{display:flex;gap:10px;margin-left:auto}.rail-ctrl button{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);background:var(--card);transition:.3s;font-size:18px}.rail-ctrl button:hover{background:var(--brand);color:var(--brand-ink);border-color:transparent}
.empty{padding:0 24px;color:var(--muted)}
/* stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--line);border-radius:28px;overflow:hidden;background:var(--bg2)}
.stat{padding:44px 32px;border-right:1px solid var(--line);position:relative;overflow:hidden}.stat:last-child{border:0}.stat::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:100%;background:linear-gradient(90deg,var(--brand),transparent);transform:scaleX(0);transform-origin:0;transition:transform 1.2s .3s}.stat.in::after{transform:scaleX(1)}
.stat b{display:block;font-size:clamp(40px,5vw,72px);letter-spacing:-.04em;line-height:1}.stat span{color:var(--muted);font-size:14px}
/* industries */
.rows{border-top:1px solid var(--line)}.row-i{display:grid;grid-template-columns:70px 1fr auto;align-items:center;padding:26px 8px;border-bottom:1px solid var(--line);position:relative;overflow:hidden;transition:padding .4s,color .3s;text-decoration:none}
.row-i::before{content:"";position:absolute;inset:0;background:var(--brand);transform:translateX(-101%);transition:transform .5s cubic-bezier(.7,0,.2,1);z-index:-1}.row-i:hover{padding-left:28px;color:var(--brand-ink)}.row-i:hover::before{transform:none}
.row-i span:first-child{color:var(--muted);font-size:13px}.row-i:hover span:first-child{color:inherit}.row-i strong{font-size:clamp(22px,3vw,40px);font-weight:600;letter-spacing:-.02em}.row-i i{font-style:normal;font-size:26px;transition:transform .4s}.row-i:hover i{transform:translateX(-10px) rotate(-45deg)}
/* process */
.tl{position:relative;display:grid;gap:34px;padding-left:46px;max-width:880px}.tl::before,.tl::after{content:"";position:absolute;left:11px;top:6px;bottom:6px;width:2px;background:var(--line)}
.tl::after{background:linear-gradient(var(--brand),var(--brand2));transform-origin:0 0;transform:scaleY(var(--fill,0));box-shadow:0 0 16px var(--brand)}
.step{position:relative}.step::before{content:"";position:absolute;left:-46px;top:4px;width:24px;height:24px;border-radius:50%;background:var(--bg);border:2px solid var(--line);transition:.5s}.step.in::before{border-color:var(--brand);background:var(--brand);box-shadow:0 0 0 6px color-mix(in srgb,var(--brand) 20%,transparent)}
.step h3{margin:0 0 6px;font-size:24px}.step p{margin:0;color:var(--muted);max-width:60ch}
/* about */
.about{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}.about .plate{aspect-ratio:5/4;border-radius:28px;border:1px solid var(--line)}
.facts{display:grid;gap:10px;margin-top:28px}.facts div{display:flex;gap:14px;padding:14px 18px;border:1px solid var(--line);border-radius:14px;background:var(--card);font-size:14px}.facts b{min-width:84px;color:var(--brand);font-weight:500}
/* cta */
.big-cta{text-align:center;padding:clamp(80px,12vw,170px) 0;position:relative;overflow:hidden}.big-cta::before{content:"";position:absolute;left:50%;top:50%;width:900px;height:900px;translate:-50% -50%;background:radial-gradient(circle,color-mix(in srgb,var(--brand) 22%,transparent),transparent 62%);filter:blur(20px)}
.big-cta h2{max-width:none;font-size:clamp(40px,8vw,120px);margin:0 auto 34px;position:relative}.big-cta .cta{justify-content:center;position:relative}
footer{border-top:1px solid var(--line);padding:40px 0;color:var(--muted);font-size:14px}.foot{display:flex;gap:24px;flex-wrap:wrap;justify-content:space-between;align-items:center}.foot nav,.foot .soc{display:flex;gap:20px;flex-wrap:wrap}.foot a{text-decoration:none}.foot a:hover{color:var(--brand)}
@media(max-width:900px){.hero-grid,.about{grid-template-columns:1fr}.device{max-width:420px}.t1{left:-6px}.t2{right:-6px}.row-i{grid-template-columns:44px 1fr auto}}
`;

const SCRIPT = `
window.__tpl=function(c){
  var cv=c.$('#pcb'); if(!cv) return; var x=cv.getContext('2d'), W,H,dpr=Math.min(2,devicePixelRatio||1), paths=[], vis=true, G=44;
  function col(){return getComputedStyle(c.root).getPropertyValue('--brand').trim()||'#2dd4bf'}
  function build(){
    paths=[]; var cols=Math.ceil(W/G), rows=Math.ceil(H/G), n=Math.round(cols*rows/38);
    for(var i=0;i<n;i++){
      var gx=Math.floor(Math.random()*cols), gy=Math.floor(Math.random()*rows), dir=Math.floor(Math.random()*4), pts=[[gx*G,gy*G]], len=5+Math.floor(Math.random()*9);
      var D=[[1,0],[0,1],[-1,0],[0,-1]];
      for(var k=0;k<len;k++){ if(Math.random()<.45) dir=(dir+(Math.random()<.5?1:3))%4; var s=1+Math.floor(Math.random()*3); gx+=D[dir][0]*s; gy+=D[dir][1]*s; pts.push([gx*G,gy*G]); }
      var L=0,seg=[]; for(var j=1;j<pts.length;j++){var d=Math.abs(pts[j][0]-pts[j-1][0])+Math.abs(pts[j][1]-pts[j-1][1]); seg.push(d); L+=d;}
      paths.push({pts:pts,seg:seg,L:L,t:Math.random()*L,v:.4+Math.random()*.9,on:Math.random()<.55});
    }
  }
  function size(){ var r=cv.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; x.setTransform(dpr,0,0,dpr,0,0); build(); }
  function at(p,t){ var a=t; for(var i=0;i<p.seg.length;i++){ if(a<=p.seg[i]){ var f=a/p.seg[i]; return [p.pts[i][0]+(p.pts[i+1][0]-p.pts[i][0])*f, p.pts[i][1]+(p.pts[i+1][1]-p.pts[i][1])*f]; } a-=p.seg[i]; } return p.pts[p.pts.length-1]; }
  var mx=-999,my=-999; addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top;});
  function frame(){
    if(vis){
      var C=col(); x.clearRect(0,0,W,H); var dark=c.root.dataset.theme==='dark';
      x.lineWidth=1.2; x.lineJoin='round';
      paths.forEach(function(p){
        x.strokeStyle=C; x.globalAlpha=dark?.13:.18; x.beginPath(); p.pts.forEach(function(q,i){ i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]); }); x.stroke();
        var e=p.pts[p.pts.length-1], s=p.pts[0]; x.globalAlpha=dark?.35:.4; [s,e].forEach(function(q){ x.beginPath(); x.arc(q[0],q[1],3,0,6.3); x.stroke(); });
        if(p.on&&!c.reduce){ p.t+=p.v; if(p.t>p.L+60){p.t=-60; p.on=Math.random()<.7;}
          for(var k=0;k<14;k++){ var tt=p.t-k*5; if(tt<0||tt>p.L) continue; var a=at(p,tt); x.globalAlpha=(1-k/14)*(dark?.95:.8); x.fillStyle=C; x.beginPath(); x.arc(a[0],a[1],2.2-k*.1,0,6.3); x.fill(); } }
        else if(!p.on&&Math.random()<.002) p.on=true;
      });
      x.globalAlpha=1; if(mx>0){ var g=x.createRadialGradient(mx,my,0,mx,my,160); g.addColorStop(0,C+'33'); g.addColorStop(1,'transparent'); x.fillStyle=g; x.fillRect(mx-160,my-160,320,320); }
    }
    requestAnimationFrame(frame);
  }
  size(); addEventListener('resize',size); new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(cv); frame();
  // rail: drag to scroll + buttons
  var rail=c.$('.rail'); if(rail){ var down=false,sx=0,sl=0,moved=0;
    rail.addEventListener('pointerdown',function(e){ if(e.target.closest('button,a,input')) return; down=true; moved=0; sx=e.clientX; sl=rail.scrollLeft; rail.classList.add('drag'); });
    addEventListener('pointermove',function(e){ if(!down) return; moved=e.clientX-sx; rail.scrollLeft=sl-moved; });
    addEventListener('pointerup',function(){ down=false; rail.classList.remove('drag'); });
    c.$$('[data-rail]').forEach(function(b){ b.addEventListener('click',function(){ rail.scrollBy({left:b.dataset.rail*360,behavior:'smooth'}); }); });
  }
};`;

export function renderNoir(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#19d3b4', ...opts });
  const nav = navItems(m);
  const marq = [...m.products.map(p => p.name), ...m.industries, ...m.cats].slice(0, 14);
  const steps = [['Brief', 'Tell us the application, volumes and constraints. We scope it in a single call.'], ['Design', 'Schematics, firmware and enclosure engineered against your spec.'], ['Prototype', 'Fast turn samples you can hold, test and break.'], ['Validate', 'Environmental, EMC and functional testing before anything ships.'], ['Deliver', 'Production runs, documentation and support that does not disappear.']];
  const rows = m.industries.length ? m.industries : m.cats.length ? m.cats.slice(0, 6) : ['Industrial', 'Embedded', 'Power', 'Custom engineering'];
  const body = `<div id="prog"></div><div id="top"></div>
<header data-header><div class="wrap nav"><a class="logo" href="#top">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>${themeBtn()}${quoteBtn('Quote list')}<a class="btn primary hide-m" href="#contact" data-magnetic>Talk to us</a>${menuBtn()}</div></header>${mobileNav(m)}
<section class="hero" style="padding-top:120px"><canvas id="pcb"></canvas><div class="wrap hero-grid">
 <div><span class="eyebrow mono" data-reveal><i></i>${esc(m.host || m.name)} · concept 01 · circuit noir</span>
 <h1 data-reveal data-delay="80">${esc(m.headline)}</h1><p class="lead" data-reveal data-delay="160">${esc(m.desc)}</p>
 <div class="cta" data-reveal data-delay="240"><a class="btn primary" href="#products" data-magnetic>Explore products →</a><a class="btn" href="#contact" data-magnetic>Request a quote</a></div>
 ${m.certs.length ? `<div class="certs mono" data-reveal data-delay="320">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div>
 <div class="device" data-tilt="10" data-reveal="zoom" data-delay="200">${media({ src: m.heroPhoto || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!m.heroPhoto })}
  <span class="tag mono t1"><b>●</b> ${esc(m.products[0].name.slice(0, 26))}</span><span class="tag mono t2"><b>◆</b> ${esc((m.products[1] || m.products[0]).name.slice(0, 26))}</span><span class="tag mono t3"><b>▲</b> ${esc(m.certs[0] || 'Engineered to spec')}</span></div>
 </div><div class="scrollcue"></div></section>
<div class="marq" aria-hidden="true"><div class="marq-track mono"><span>${marq.map(esc).join('</span><span>')}</span><span>${marq.map(esc).join('</span><span>')}</span></div></div>
<section id="products"><div class="wrap sec-head"><div><div class="kicker mono">/ 01 — products</div><h2 data-reveal>Hardware you can spec with confidence</h2></div>
 <label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Search ${m.products.length} products…" aria-label="Search products"></label>
 <div class="rail-ctrl hide-m"><button data-rail="-1" aria-label="Previous">←</button><button data-rail="1" aria-label="Next">→</button></div></div>
 <div class="rail-wrap"><div class="rail">${m.products.map((p, i) => `<article class="card" data-prod="${esc(p.name + ' ' + p.desc)}" data-spot data-reveal data-delay="${Math.min(i, 4) * 70}">${media(p)}<span class="idx mono">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc || 'Engineered for reliability in demanding environments.')}</p><div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>Add to quote</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Details">↗</a>` : ''}</div></article>`).join('')}</div><p class="empty" data-empty hidden>No product matches that search.</p></div></section>
<section><div class="wrap"><div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">0</b><span class="mono">${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section id="industries"><div class="wrap"><div class="kicker mono">/ 02 — industries</div><h2 data-reveal style="margin-bottom:44px">Built for the places electronics get tested hardest</h2><div class="rows">${rows.map((r, i) => `<a class="row-i" href="#contact" data-reveal data-delay="${i * 60}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><strong>${esc(r)}</strong><i>→</i></a>`).join('')}</div></div></section>
<section><div class="wrap"><div class="kicker mono">/ 03 — process</div><h2 data-reveal style="margin-bottom:54px">From brief to shipped, in five clean steps</h2><div class="tl" data-scrollvar>${steps.map(([t, d], i) => `<div class="step" data-reveal><div class="mono" style="color:var(--brand);font-size:12px">STEP 0${i + 1}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section id="about"><div class="wrap about"><div data-reveal="left">${media({ src: m.gallery[1] || m.gallery[0] || m.heroArt, art: m.heroArt, name: m.name, isPhoto: !!(m.gallery[1] || m.gallery[0]) })}</div><div data-reveal="right"><div class="kicker mono">/ 04 — about</div><h2>About ${esc(m.name)}</h2><p class="lead" style="margin-top:22px">${esc(m.about)}</p><div class="facts mono">${m.address ? `<div><b>Location</b><span>${esc(m.address)}</span></div>` : ''}${m.email ? `<div><b>Email</b><span>${esc(m.email)}</span></div>` : ''}${m.phone ? `<div><b>Phone</b><span>${esc(m.phone)}</span></div>` : ''}<div><b>Web</b><span>${esc(m.host)}</span></div></div></div></div></section>
<section id="contact" class="big-cta"><div class="wrap"><div class="kicker mono">/ 05 — contact</div><h2 data-reveal>Let’s build the next one together.</h2><div class="cta" data-reveal data-delay="150"><a class="btn primary" href="#" data-quote-open data-magnetic>Start a quote request</a>${m.email ? `<a class="btn" href="mailto:${esc(m.email)}" data-magnetic>${esc(m.email)}</a>` : ''}${m.phone ? `<a class="btn" href="tel:${esc(m.phone.replace(/[^+\d]/g, ''))}" data-magnetic>${esc(m.phone)}</a>` : ''}</div></div></section>
<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}</span><nav>${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site ↗</a>` : ''}</div></div></footer>${agencyFlag(m)}`;
  return shell(m, { title: `${m.name} — Circuit Noir concept`, fonts: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap', css: CSS(m), body, script: SCRIPT, themeDefault: opts.theme || 'dark' });
}
