// Runs INSIDE every generated page (serialized with .toString()). Pure vanilla JS, no deps.
// Hooks are driven by data-attributes so each template only needs markup + CSS.
export function runtime() {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const cfg = window.__WDG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sandboxed */ } } };

  /* ---------- theme ---------- */
  function setTheme(t, silent) {
    root.dataset.theme = t;
    if (!silent) store.set('wdg-theme', t);
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
    $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode'));
  }
  const saved = store.get('wdg-theme');
  if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));
  addEventListener('message', e => { const d = e.data; if (d && d.wdg === 'theme') setTheme(d.value, true); });
  window.addEventListener('themechange', () => { /* canvases listen */ });

  /* ---------- scroll reveal ---------- */
  const rv = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(el => { const d = el.getAttribute('data-delay'); if (d) el.style.transitionDelay = d + 'ms'; io.observe(el); });
  } else rv.forEach(el => el.classList.add('in'));

  /* ---------- counters ---------- */
  const counters = $$('[data-count]');
  const runCount = el => {
    const end = parseFloat(el.getAttribute('data-count')) || 0, suf = el.getAttribute('data-suffix') || '', dur = 1600, t0 = performance.now();
    if (reduce) { el.textContent = end.toLocaleString() + suf; return; }
    const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e).toLocaleString() + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: 0.4 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------- scroll-linked: progress, header, parallax, custom props ---------- */
  const prog = $('#prog'), hdr = $('[data-header]');
  const par = $$('[data-parallax]');
  const scrollVars = $$('[data-scrollvar]');
  let ticking = false;
  function onScroll() {
    const y = scrollY, h = root.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (hdr) hdr.classList.toggle('scrolled', y > 24);
    root.style.setProperty('--sy', y.toFixed(0));
    if (!reduce) {
      par.forEach(el => { const r = el.getBoundingClientRect(); const k = parseFloat(el.getAttribute('data-parallax')) || 0.15; const c = r.top + r.height / 2 - innerHeight / 2; el.style.transform = 'translate3d(0,' + (-c * k).toFixed(1) + 'px,0)'; });
      scrollVars.forEach(el => { const r = el.getBoundingClientRect(); const cl = v => Math.max(0, Math.min(1, v)); el.style.setProperty('--vp', cl((innerHeight - r.top) / (innerHeight + r.height)).toFixed(4)); el.style.setProperty('--fill', cl((innerHeight * 0.65 - r.top) / r.height).toFixed(4)); el.style.setProperty('--p', cl(r.height > innerHeight ? -r.top / (r.height - innerHeight) : 0).toFixed(4)); });
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* ---------- pointer effects (desktop only) ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(el => {
      const max = parseFloat(el.getAttribute('data-tilt')) || 8;
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = 'perspective(900px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg) translateZ(0)'; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)'; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
  // spotlight: sets --mx/--my on each [data-spot] (works on touch via tap too)
  $$('[data-spot]').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
  // global pointer position for page-wide effects
  addEventListener('pointermove', e => { root.style.setProperty('--px', e.clientX + 'px'); root.style.setProperty('--py', e.clientY + 'px'); root.style.setProperty('--pxn', (e.clientX / innerWidth).toFixed(3)); root.style.setProperty('--pyn', (e.clientY / innerHeight).toFixed(3)); }, { passive: true });

  /* ---------- product search / filter ---------- */
  const q = $('#q'), prods = $$('[data-prod]'), empty = $('[data-empty]');
  if (q) q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); let n = 0;
    prods.forEach(p => { const hit = !v || p.getAttribute('data-prod').toLowerCase().includes(v); p.classList.toggle('hide', !hit); if (hit) n++; });
    if (empty) empty.hidden = n > 0;
  });

  /* ---------- quote basket (RFQ) ---------- */
  const picked = new Map();
  const drawer = document.createElement('aside');
  drawer.id = 'wdg-q'; drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = '<div class="wq-bg" data-wq-close></div><div class="wq-panel" role="dialog" aria-label="Request a quote"><button class="wq-x" data-wq-close aria-label="Close">×</button><h3>Request a quote</h3><p class="wq-sub">Select products and we will get back with pricing and lead times.</p><ul class="wq-list"></ul><form class="wq-form"><input name="n" placeholder="Your name" required><input name="e" type="email" placeholder="Work email" required><input name="c" placeholder="Company"><textarea name="m" rows="3" placeholder="Quantity, specs, timeline…"></textarea><button class="wq-send" type="submit">Send request</button></form><p class="wq-done" hidden>Request prepared. Your email app will open to send it.</p></div>';
  document.body.appendChild(drawer);
  const list = $('.wq-list', drawer);
  const refresh = () => {
    list.innerHTML = '';
    picked.forEach((_, name) => { const li = document.createElement('li'); li.textContent = name; const b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Remove ' + name); b.onclick = () => { picked.delete(name); sync(); }; li.appendChild(b); list.appendChild(li); });
    if (!picked.size) { const li = document.createElement('li'); li.className = 'wq-empty'; li.textContent = 'No products selected yet'; list.appendChild(li); }
    $$('[data-quote-count]').forEach(c => { c.textContent = picked.size; c.classList.toggle('on', picked.size > 0); });
    $$('[data-quote]').forEach(b => { const on = picked.has(b.getAttribute('data-quote')); b.classList.toggle('added', on); const l = b.querySelector('[data-label]') || b; if (b.dataset.labelAdd === undefined) b.dataset.labelAdd = l.textContent; l.textContent = on ? 'Added ✓' : b.dataset.labelAdd; });
  };
  const sync = refresh;
  const open = v => { drawer.classList.toggle('open', v); drawer.setAttribute('aria-hidden', String(!v)); };
  document.addEventListener('click', e => {
    const qb = e.target.closest('[data-quote]');
    if (qb) { e.preventDefault(); const n = qb.getAttribute('data-quote'); if (picked.has(n)) picked.delete(n); else { picked.set(n, 1); toast('Added to quote list'); } sync(); return; }
    if (e.target.closest('[data-quote-open]')) { e.preventDefault(); open(true); return; }
    if (e.target.closest('[data-wq-close]')) open(false);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) { open(false); return; }
    // let the generator's present-mode handle navigation keys when focus is inside the design
    if (parent !== window && (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '') && e.altKey) { parent.postMessage({ wdg: 'key', key: e.key }, '*'); }
    if (parent !== window && e.key === 'Escape') parent.postMessage({ wdg: 'key', key: 'Escape' }, '*');
  });
  $('.wq-form', drawer).addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), items = Array.from(picked.keys());
    const body = 'Hello ' + (cfg.name || '') + ',\n\nI would like a quote for:\n' + (items.map(i => ' - ' + i).join('\n') || ' - (general enquiry)') + '\n\n' + (f.get('m') || '') + '\n\n' + f.get('n') + (f.get('c') ? ', ' + f.get('c') : '') + '\n' + f.get('e');
    $('.wq-done', drawer).hidden = false;
    if (cfg.email) { try { window.open('mailto:' + cfg.email + '?subject=' + encodeURIComponent('Quote request') + '&body=' + encodeURIComponent(body)); } catch (err) { /* sandbox */ } }
  });
  refresh();

  /* ---------- toast ---------- */
  let tt; const tel = document.createElement('div'); tel.className = 'wdg-toast'; document.body.appendChild(tel);
  function toast(m) { tel.textContent = m; tel.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => tel.classList.remove('show'), 1800); }

  /* ---------- mobile menu ---------- */
  const mb = $('[data-menu-btn]');
  if (mb) { mb.addEventListener('click', () => root.classList.toggle('menu-open')); $$('[data-mobile-nav] a').forEach(a => a.addEventListener('click', () => root.classList.remove('menu-open'))); }

  /* ---------- template hook ---------- */
  if (typeof window.__tpl === 'function') window.__tpl({ $, $$, reduce, fine, root });
}
