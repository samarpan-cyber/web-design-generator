// Design 1, CIRCUIT NOIR. Dark tech look. Top bar + command palette (Cmd/Ctrl+K), live trace canvas, drag rail.
import { esc, buildModel, shell, themeVars, media, logoMark, themeBtn, menuBtn, quoteBtn, goLink, navLinks, mobileLinks, socialLinks, contactForm, factList } from './common.js';

const PAGES = [['home', 'Home'], ['products', 'Products'], ['industries', 'Industries'], ['company', 'Company'], ['contact', 'Contact']];

const CSS = m => `
${themeVars(m, {
  dark: { bg: '#07090d', bg2: '#0d1117', fg: '#eef2f7', muted: '#8b97a8', line: 'rgba(255,255,255,.1)', card: 'rgba(255,255,255,.04)' },
  light: { bg: '#f3f5f8', bg2: '#ffffff', fg: '#0b1220', muted: '#566174', line: 'rgba(11,18,32,.12)', card: '#ffffff' }
})}
body{font-family:'Space Grotesk',system-ui,sans-serif;line-height:1.55;font-size:16px}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:.01em}
.wrap{width:min(1240px,100% - 40px);margin-inline:auto}
header[data-header]{position:fixed;inset:0 0 auto 0;z-index:80;padding:14px 0;transition:background .3s,padding .3s,border-color .3s;border-bottom:1px solid transparent}
header.scrolled{background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);border-color:var(--line);padding:8px 0}
.nav{display:flex;align-items:center;gap:20px}.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:18px;margin-right:auto;min-height:44px}
.logo-img{height:34px;width:auto;max-width:150px;object-fit:contain;background:#fff;border-radius:8px;padding:4px 8px}.logo-fallback{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--brand);color:var(--brand-ink);font-size:14px}
.nav-links{display:flex;gap:4px}.nav-links a{text-decoration:none;font-size:14px;color:var(--muted);padding:10px 14px;border-radius:10px;transition:color .2s,background .2s}.nav-links a:hover{color:var(--fg);background:var(--card)}.nav-links a.active{color:var(--fg);box-shadow:inset 0 -2px 0 var(--brand)}
.kbtn{display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--muted);min-height:44px}.kbtn kbd{font:500 11px 'JetBrains Mono',monospace;padding:2px 6px;border:1px solid var(--line);border-radius:6px}
.qbtn,.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 22px;min-height:46px;border-radius:99px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:14px;text-decoration:none;transition:transform .25s,border-color .25s,box-shadow .25s}
.btn.primary{background:var(--brand);color:var(--brand-ink);border-color:transparent;box-shadow:0 10px 36px -12px var(--brand)}.btn.primary:hover{transform:translateY(-2px)}.btn:hover,.qbtn:hover{border-color:var(--brand)}.btn.added{background:var(--brand);color:var(--brand-ink);border-color:transparent}
/* hero */
.hero{position:relative;min-height:100svh;display:grid;align-items:center;padding:110px 0 70px;overflow:hidden;isolation:isolate}
#pcb{position:absolute;inset:0;width:100%;height:100%;z-index:-2}
.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(700px 420px at 78% 30%,color-mix(in srgb,var(--brand) 16%,transparent),transparent 70%),linear-gradient(180deg,transparent 65%,var(--bg))}
.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.eyebrow{display:inline-flex;gap:10px;align-items:center;padding:7px 14px;border:1px solid var(--line);border-radius:99px;background:var(--card);font-size:12px;color:var(--muted)}.eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--brand)}
h1{font-size:clamp(40px,6.4vw,92px);line-height:.98;letter-spacing:-.035em;margin:20px 0;font-weight:700}
h1 em{font-style:normal;color:var(--brand)}
.lead{font-size:clamp(16px,1.5vw,19px);color:var(--muted);max-width:50ch;margin:0 0 30px}
.cta{display:flex;gap:12px;flex-wrap:wrap}.certs{display:flex;gap:8px;flex-wrap:wrap;margin-top:30px}.certs span{font-size:11px;padding:6px 10px;border:1px dashed var(--line);border-radius:6px;color:var(--muted)}
.device{position:relative;aspect-ratio:1/1;border-radius:28px;border:1px solid var(--line);background:var(--card);box-shadow:0 40px 100px -40px color-mix(in srgb,var(--brand) 50%,transparent);transition:transform .25s}
.device .plate{position:absolute;inset:14px;border-radius:20px}
.device .tag{position:absolute;padding:8px 12px;border-radius:12px;background:var(--bg2);border:1px solid var(--line);font-size:11px;animation:bob 6s ease-in-out infinite}.device .tag b{color:var(--brand)}.t1{left:-18px;top:14%}.t2{right:-14px;top:52%;animation-delay:-3s}
@keyframes bob{50%{transform:translate3d(0,-8px,0)}}
.marq{border-block:1px solid var(--line);padding:16px 0;overflow:hidden;background:var(--bg2)}.marq-track{display:flex;gap:40px;width:max-content;animation:mq 40s linear infinite}
.marq-track span{font-size:13px;text-transform:uppercase;color:var(--muted);white-space:nowrap;display:flex;gap:40px;align-items:center}.marq-track span::after{content:"/";color:var(--brand)}@keyframes mq{to{transform:translate3d(-50%,0,0)}}
section.blk{padding:clamp(64px,9vw,120px) 0}
.sec-head{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;margin-bottom:36px}
.kicker{font-size:12px;color:var(--brand);text-transform:uppercase;margin-bottom:10px;letter-spacing:.08em}
h2{font-size:clamp(30px,4.4vw,58px);letter-spacing:-.03em;line-height:1.04;margin:0;max-width:20ch}
.psub{color:var(--muted);max-width:52ch;margin:14px 0 0}
/* rail */
.rail{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px max(20px,calc((100vw - 1240px)/2)) 24px;scrollbar-width:none;cursor:grab;-webkit-overflow-scrolling:touch}.rail::-webkit-scrollbar{display:none}.rail.drag{cursor:grabbing;scroll-snap-type:none}
.rail .card{flex:0 0 min(320px,80vw);scroll-snap-align:start}
.rail-ctrl{display:flex;gap:10px}.rail-ctrl button{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);background:var(--card);font-size:18px}.rail-ctrl button:hover{background:var(--brand);color:var(--brand-ink)}
/* cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr));gap:18px}
.card{position:relative;border-radius:22px;border:1px solid var(--line);background:var(--card);padding:12px;transition:transform .4s cubic-bezier(.2,.8,.2,1),border-color .3s;overflow:hidden;contain:layout paint}
.card::before{content:"";position:absolute;inset:0;background:radial-gradient(380px circle at var(--mx,50%) var(--my,0),color-mix(in srgb,var(--brand) 20%,transparent),transparent 45%);opacity:0;transition:opacity .3s;pointer-events:none}
.card:hover{transform:translate3d(0,-6px,0);border-color:color-mix(in srgb,var(--brand) 60%,transparent)}.card:hover::before{opacity:1}
.card .plate{aspect-ratio:4/3;border-radius:14px}.card .plate img{transition:transform .7s cubic-bezier(.2,.8,.2,1)}.card:hover .plate img{transform:scale(1.06)}
.card .idx{position:absolute;right:22px;top:22px;font-size:11px;color:#fff;background:rgba(0,0,0,.55);padding:4px 9px;border-radius:99px}
.card h3{font-size:20px;margin:16px 6px 4px;letter-spacing:-.01em;line-height:1.2}.card p{margin:0 6px 14px;color:var(--muted);font-size:14px;min-height:0}
.card .row{display:flex;gap:8px;margin:12px 6px 6px}.card .row .btn{padding:9px 16px;font-size:13px;min-height:44px}
.empty{color:var(--muted);padding:20px 0}
.search{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--card);border-radius:99px;padding:0 18px;min-width:min(340px,100%)}.search input{flex:1;background:none;border:0;padding:14px 0;color:var(--fg);font:inherit;font-size:16px;outline:none;min-width:0}.search svg{width:18px;color:var(--muted);flex:none}
/* stats, band */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));border:1px solid var(--line);border-radius:24px;overflow:hidden;background:var(--bg2)}
.stat{padding:36px 28px;border-right:1px solid var(--line)}.stat:last-child{border:0}.stat b{display:block;font-size:clamp(38px,5vw,66px);letter-spacing:-.04em;line-height:1}.stat span{color:var(--muted);font-size:14px}
.band{text-align:center;position:relative;overflow:hidden;border:1px solid var(--line);border-radius:32px;padding:clamp(48px,8vw,100px) 24px;background:radial-gradient(500px 260px at 50% 0,color-mix(in srgb,var(--brand) 20%,transparent),transparent 70%),var(--bg2)}
.band h2{max-width:18ch;margin:0 auto 12px}.band p{color:var(--muted);margin:0 auto 28px;max-width:44ch}.band .cta{justify-content:center}
/* inner pages */
.phead{padding:130px 0 40px;border-bottom:1px solid var(--line)}.phead h1{font-size:clamp(36px,5.6vw,76px);margin:0;max-width:18ch}.phead .psub{font-size:18px}
.rows{border-top:1px solid var(--line);margin-top:10px}.row-i{display:grid;grid-template-columns:56px 1fr auto;gap:8px 20px;align-items:center;padding:24px 4px;border-bottom:1px solid var(--line);transition:padding .3s,background .3s}
.row-i:hover{padding-left:20px;background:var(--card)}.row-i .n{color:var(--brand);font-size:13px}.row-i strong{font-size:clamp(22px,3vw,38px);letter-spacing:-.02em;font-weight:600;line-height:1.1}.row-i p{margin:0;color:var(--muted);max-width:34ch;font-size:15px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.step{border:1px solid var(--line);border-radius:20px;padding:24px;background:var(--card)}.step b{color:var(--brand);font-size:13px}.step h3{margin:10px 0 6px;font-size:22px}.step p{margin:0;color:var(--muted);font-size:15px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}.split .plate{aspect-ratio:5/4;border-radius:26px;border:1px solid var(--line)}
.facts{display:grid;gap:10px;margin:24px 0 0}.facts div{display:grid;grid-template-columns:90px 1fr;gap:12px;padding:14px 18px;border:1px solid var(--line);border-radius:14px;background:var(--card);font-size:14px;word-break:break-word}.facts b{color:var(--brand);font-weight:500}.facts a{text-decoration:none}.facts a:hover{color:var(--brand)}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:8px 14px;border:1px solid var(--line);border-radius:99px;font-size:13px;color:var(--muted)}
.cform{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cform label{display:grid;gap:6px;font-size:13px;color:var(--muted)}.cform .full{grid-column:1/-1}.cform input,.cform textarea{padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;font-size:16px;outline:none;width:100%}.cform input:focus,.cform textarea:focus{border-color:var(--brand)}
.cbtn{grid-column:1/-1;padding:15px;border:0;border-radius:99px;background:var(--brand);color:var(--brand-ink);font-weight:700;min-height:48px}.sent{color:var(--brand);font-size:14px}
footer{border-top:1px solid var(--line);padding:34px 0 60px;color:var(--muted);font-size:14px}.foot{display:flex;gap:20px;flex-wrap:wrap;justify-content:space-between;align-items:center}.foot nav,.foot .soc{display:flex;gap:6px 18px;flex-wrap:wrap}.foot a{text-decoration:none;padding:6px 0}.foot a:hover{color:var(--brand)}
/* palette */
.pal{position:fixed;inset:0;z-index:250;display:none;align-items:flex-start;justify-content:center;padding:12vh 16px;background:rgba(0,0,0,.55)}.pal.open{display:flex}
.pal-box{width:min(560px,100%);background:var(--bg2);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.5)}.pal-box input{width:100%;padding:18px 20px;background:none;border:0;border-bottom:1px solid var(--line);color:var(--fg);font:inherit;font-size:17px;outline:none}
.pal-list{max-height:50vh;overflow:auto;padding:8px;margin:0;list-style:none}.pal-list li{padding:12px 14px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;gap:12px;font-size:15px}.pal-list li.on,.pal-list li:hover{background:var(--brand);color:var(--brand-ink)}.pal-list li small{opacity:.7;font-family:'JetBrains Mono',monospace;font-size:11px}
@media(max-width:900px){.hero-grid,.split{grid-template-columns:1fr}.device{max-width:420px}.steps{grid-template-columns:1fr}.row-i{grid-template-columns:40px 1fr}.row-i p{grid-column:2}.kbtn span,.kbtn kbd{display:none}.kbtn{padding:0;width:44px;justify-content:center}.t1{left:-6px}.t2{right:-6px}}
@media(max-width:560px){.cform{grid-template-columns:1fr}.phead{padding-top:104px}.stat{padding:24px 18px}.nav{gap:8px}}
`;

const SCRIPT = `window.__tpl=function(c){
  var cv=c.$('#pcb'), x=cv&&cv.getContext('2d'), W,H,dpr=Math.min(1.5,devicePixelRatio||1), paths=[], G=48, vis=true;
  function col(){return getComputedStyle(c.root).getPropertyValue('--brand').trim()||'#19d3b4'}
  function build(){ paths=[]; var cols=Math.ceil(W/G), rows=Math.ceil(H/G), n=Math.min(40,Math.round(cols*rows/70)), D=[[1,0],[0,1],[-1,0],[0,-1]];
    for(var i=0;i<n;i++){ var gx=Math.floor(Math.random()*cols), gy=Math.floor(Math.random()*rows), dir=Math.floor(Math.random()*4), pts=[[gx*G,gy*G]], len=5+Math.floor(Math.random()*8);
      for(var k=0;k<len;k++){ if(Math.random()<.45) dir=(dir+(Math.random()<.5?1:3))%4; var s=1+Math.floor(Math.random()*3); gx+=D[dir][0]*s; gy+=D[dir][1]*s; pts.push([gx*G,gy*G]); }
      var L=0,seg=[]; for(var j=1;j<pts.length;j++){var d=Math.abs(pts[j][0]-pts[j-1][0])+Math.abs(pts[j][1]-pts[j-1][1]); seg.push(d); L+=d;}
      paths.push({pts:pts,seg:seg,L:L,t:Math.random()*L,v:.5+Math.random()*.8,on:Math.random()<.5}); } }
  function size(){ if(!cv) return; var r=cv.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; x.setTransform(dpr,0,0,dpr,0,0); build(); draw(false); }
  function at(p,t){ var a=t; for(var i=0;i<p.seg.length;i++){ if(a<=p.seg[i]){ var f=a/p.seg[i]; return [p.pts[i][0]+(p.pts[i+1][0]-p.pts[i][0])*f, p.pts[i][1]+(p.pts[i+1][1]-p.pts[i][1])*f]; } a-=p.seg[i]; } return p.pts[p.pts.length-1]; }
  function draw(move){ var C=col(), dark=c.root.dataset.theme==='dark'; x.clearRect(0,0,W,H); x.lineWidth=1.2; x.lineJoin='round';
    paths.forEach(function(p){ x.strokeStyle=C; x.globalAlpha=dark?.14:.2; x.beginPath(); p.pts.forEach(function(q,i){ i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]); }); x.stroke();
      x.globalAlpha=dark?.35:.4; [p.pts[0],p.pts[p.pts.length-1]].forEach(function(q){ x.beginPath(); x.arc(q[0],q[1],3,0,6.3); x.stroke(); });
      if(move&&p.on){ p.t+=p.v; if(p.t>p.L+50){p.t=-50;p.on=Math.random()<.7;} x.fillStyle=C; for(var k=0;k<10;k++){ var tt=p.t-k*6; if(tt<0||tt>p.L) continue; var a=at(p,tt); x.globalAlpha=(1-k/10)*(dark?.95:.8); x.beginPath(); x.arc(a[0],a[1],2.2-k*.12,0,6.3); x.fill(); } }
      else if(move&&!p.on&&Math.random()<.003) p.on=true; }); x.globalAlpha=1; }
  function loop(){ if(vis&&c.isPlaying()&&c.root.dataset.page==='home'&&!c.reduce) draw(true); c.raf(loop); }
  if(cv){ size(); addEventListener('resize',size); new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(cv); loop(); window.addEventListener('themechange',function(){draw(false)}); window.addEventListener('pagechange',function(){ if(c.root.dataset.page==='home') size(); }); }
  // drag rail
  var rail=c.$('.rail'); if(rail){ var down=false,sx=0,sl=0; rail.addEventListener('pointerdown',function(e){ if(e.pointerType!=='mouse'||e.target.closest('button,a,input')) return; down=true; sx=e.clientX; sl=rail.scrollLeft; rail.classList.add('drag'); });
    addEventListener('pointermove',function(e){ if(down) rail.scrollLeft=sl-(e.clientX-sx); }); addEventListener('pointerup',function(){ down=false; rail.classList.remove('drag'); });
    c.$$('[data-rail]').forEach(function(b){ b.addEventListener('click',function(){ rail.scrollBy({left:b.dataset.rail*340,behavior:'smooth'}); }); }); }
  // command palette
  var pal=c.$('.pal'), inp=pal&&c.$('input',pal), ul=pal&&c.$('.pal-list'), items=[], sel=0;
  var all=[].concat(c.$$('[data-pal]').map(function(e){return {t:e.dataset.pal,k:e.dataset.kind,go:e.dataset.go2}}));
  function render(){ var v=inp.value.trim().toLowerCase(); items=all.filter(function(i){return !v||i.t.toLowerCase().indexOf(v)>-1}).slice(0,9); sel=0;
    ul.innerHTML=items.map(function(i,k){return '<li class="'+(k===0?'on':'')+'" data-i="'+k+'"><span>'+i.t.replace(/[<>&]/g,'')+'</span><small>'+i.k+'</small></li>'}).join('')||'<li>No match</li>'; }
  function open(v){ pal.classList.toggle('open',v); if(v){ inp.value=''; render(); setTimeout(function(){inp.focus()},30); } }
  function pick(i){ if(!i) return; open(false); if(i.k==='page') c.go(i.go); else { c.go('products'); var q=c.$('#q'); if(q){ q.value=i.t; q.dispatchEvent(new Event('input')); } } }
  if(pal){ c.$$('[data-pal-open]').forEach(function(b){b.addEventListener('click',function(){open(true)})}); inp.addEventListener('input',render);
    pal.addEventListener('click',function(e){ if(e.target===pal) open(false); var li=e.target.closest('li[data-i]'); if(li) pick(items[+li.dataset.i]); });
    addEventListener('keydown',function(e){ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); open(!pal.classList.contains('open')); return; } if(!pal.classList.contains('open')) return;
      if(e.key==='Escape') open(false); if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); sel=(sel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length; c.$$('li',ul).forEach(function(l,k){l.classList.toggle('on',k===sel)}); } if(e.key==='Enter') pick(items[sel]); }); }
};`;

const card = (p, i, t, alt = false) => { const d = alt ? p.desc2 : p.desc; return `<article class="card" data-prod="${esc(p.name)}" data-spot data-reveal data-delay="${(i % 4) * 60}">${media(p)}<span class="idx mono">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3>${d ? `<p>${esc(d)}</p>` : ''}<div class="row"><button class="btn" data-quote="${esc(p.name)}"><span data-label>${esc(t.add)}</span></button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.details)}</a>` : ''}</div></article>`; };

export function renderNoir(profile, opts = {}) {
  const m = buildModel(profile, { fallbackBrand: '#19d3b4', voice: 0, ...opts }), t = m.t, P = m.products;
  const marq = [t.marqueeLead, ...m.marquee];
  const head = (kick, title, sub, link) => `<div class="sec-head"><div><div class="kicker mono">${esc(kick)}</div><h2 data-reveal>${esc(title)}</h2>${sub ? `<p class="psub">${esc(sub)}</p>` : ''}</div>${link || ''}</div>`;
  const home = `<section class="hero"><canvas class="amb" id="pcb"></canvas><div class="wrap hero-grid">
 <div><span class="eyebrow mono" data-reveal><i></i>${esc(t.eyebrow)}</span><h1 data-reveal data-delay="70">${esc(m.headline)}</h1><p class="lead" data-reveal data-delay="140">${esc(m.sub)}</p>
 <div class="cta" data-reveal data-delay="210"><a class="btn primary" href="#/products" data-go="products" data-magnetic>${esc(t.ctaA)}</a><button class="btn" data-quote-open data-magnetic>${esc(t.ctaB)}</button></div>
 ${m.certs.length ? `<div class="certs mono" data-reveal data-delay="280">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div>
 <div class="device" data-tilt="8" data-reveal="zoom" data-delay="160">${media(m.img.hero)}<span class="tag mono t1 amb"><b>01</b> ${esc(m.sectors[0].name.slice(0, 24))}</span>${m.sectors[1] ? `<span class="tag mono t2 amb"><b>02</b> ${esc(m.sectors[1].name.slice(0, 24))}</span>` : ''}</div></div></section>
<div class="marq amb" aria-hidden="true"><div class="marq-track mono"><span>${marq.map(esc).join('</span><span>')}</span><span>${marq.map(esc).join('</span><span>')}</span></div></div>
<section class="blk"><div class="wrap">${head('01 / ' + t.featKicker, t.featTitle, '', `<div class="rail-ctrl hide-m"><button data-rail="-1" aria-label="Previous">←</button><button data-rail="1" aria-label="Next">→</button></div>`)}</div>
 <div class="rail">${P.slice(0, 6).map((p, i) => card(p, i, t, true)).join('')}</div><div class="wrap" style="margin-top:12px">${goLink('products', t.featLink + ' →', 'btn')}</div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="kicker mono">${esc(t.statsKicker)}</div><div class="stats">${m.stats.map(s => `<div class="stat" data-reveal><b data-count="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span class="mono">${esc(s.label)}</span></div>`).join('')}</div></div></section>
<section class="blk" style="padding-top:0"><div class="wrap"><div class="band" data-reveal="zoom"><h2>${esc(t.bandTitle)}</h2><p>${esc(t.bandSub)}</p><div class="cta"><button class="btn primary" data-quote-open data-magnetic>${esc(t.bandCta)}</button></div></div></div></section>`;

  const products = `<div class="phead"><div class="wrap"><div class="kicker mono">/ ${esc(PAGES[1][1])}</div><h1>${esc(t.prodTitle)}</h1><p class="psub">${esc(t.prodSub)}</p></div></div>
<section class="blk" style="padding-top:36px"><div class="wrap"><div class="sec-head" style="margin-bottom:24px"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label>${quoteBtn(t.navCta === 'Talk to us' ? 'Quote list' : t.navCta)}</div>
 <div class="grid">${P.map((p, i) => card(p, i, t)).join('')}</div><p class="empty" data-empty hidden>${esc(t.empty)}</p></div></section>`;

  const industries = `<div class="phead"><div class="wrap"><div class="kicker mono">/ ${esc(PAGES[2][1])}</div><h1>${esc(t.solTitle)}</h1><p class="psub">${esc(t.solSub)}</p></div></div>
<section class="blk" style="padding-top:30px"><div class="wrap"><div class="rows">${m.sectors.map((s, i) => `<div class="row-i" data-reveal data-delay="${i * 40}"><span class="n mono">${String(i + 1).padStart(2, '0')}</span><strong>${esc(s.name)}</strong><p>${esc(s.line)}</p></div>`).join('')}</div></div></section>
<section class="blk" style="padding-top:0"><div class="wrap">${head('/ ' + t.stepsTitle, t.stepsTitle, '')}<div class="steps">${t.steps.map(([a, b], i) => `<div class="step" data-reveal data-delay="${i * 80}"><b class="mono">0${i + 1}</b><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div></div></section>`;

  const facts = factList(m);
  const company = `<div class="phead"><div class="wrap"><div class="kicker mono">/ ${esc(PAGES[3][1])}</div><h1>${esc(t.aboutTitle)}</h1><p class="psub">${esc(t.aboutSub)}</p></div></div>
<section class="blk" style="padding-top:44px"><div class="wrap split"><div data-reveal="left">${media(m.img.about)}</div><div data-reveal="right">${m.aboutLine ? `<p class="lead" style="margin-top:0">${esc(m.aboutLine)}</p>` : ''}
 <div class="kicker mono" style="margin-top:${m.aboutLine ? 26 : 0}px">${esc(t.factsTitle)}</div><div class="facts mono" style="margin-top:0">${facts.map(([k, v, h]) => `<div><b>${esc(k)}</b>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<span>${esc(v)}</span>`}</div>`).join('')}</div>
 ${m.certs.length ? `<div class="kicker mono" style="margin-top:26px">${esc(t.certsTitle)}</div><div class="chips mono">${m.certs.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}</div></div></section>`;

  const contact = `<div class="phead"><div class="wrap"><div class="kicker mono">/ ${esc(PAGES[4][1])}</div><h1>${esc(t.contactTitle)}</h1><p class="psub">${esc(t.contactSub)}</p></div></div>
<section class="blk" style="padding-top:44px"><div class="wrap split"><div data-reveal="left">${contactForm(m)}</div><div data-reveal="right"><div class="kicker mono">${esc(t.direct)}</div><div class="facts mono" style="margin-top:0">${facts.map(([k, v, h]) => `<div><b>${esc(k)}</b>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(v)}</a>` : `<span>${esc(v)}</span>`}</div>`).join('')}</div><div class="cta" style="margin-top:20px"><button class="btn primary" data-quote-open>${esc(t.bandCta)}</button></div></div></div></section>`;

  const header = `<header data-header><div class="wrap nav"><a class="logo" href="#/home" data-go="home">${logoMark(m)}${m.logo ? '' : `<span>${esc(m.name)}</span>`}</a><nav class="nav-links" aria-label="Main">${navLinks(PAGES)}</nav><button class="kbtn" data-pal-open aria-label="Search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>Search</span><kbd>Ctrl K</kbd></button>${themeBtn()}${quoteBtn(t.pill === 'Open quotes' ? 'Quote' : t.pill)}${menuBtn()}</div></header>`;
  const footer = `<footer><div class="wrap foot"><span>© ${m.year} ${esc(m.name)}. ${esc(t.foot)}</span><nav>${navLinks(PAGES)}</nav><div class="soc">${socialLinks(m)}${m.site ? `<a href="${esc(m.site)}" target="_blank" rel="noopener">Current site</a>` : ''}</div></div></footer>
<div class="pal" role="dialog" aria-label="Search"><div class="pal-box"><input placeholder="Jump to a page or product" aria-label="Search"><ul class="pal-list"></ul></div></div>
<div hidden>${PAGES.map(([id, l]) => `<i data-pal="${esc(l)}" data-kind="page" data-go2="${id}"></i>`).join('')}${P.map(p => `<i data-pal="${esc(p.name)}" data-kind="product"></i>`).join('')}</div>`;
  const pages = PAGES.map(([id, label], i) => ({ id, label, html: [home, products, industries, company, contact][i] }));
  return shell(m, { tpl: 'noir', fonts: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap', css: CSS(m), header, footer, pages, script: SCRIPT, themeDefault: opts.theme || 'dark', menuLinks: mobileLinks(PAGES, m, `<a href="#" data-quote-open>${esc(t.navCta)}</a>`) });
}
