// Runs INSIDE every generated page (serialized with .toString()). Vanilla JS, no dependencies.
// Performance rules: one rAF-batched scroll loop, reads before writes, no per-scroll style invalidation
// on the root, pointer effects touch only the element they affect, ambient loops pause when hidden.
export function runtime() {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const cfg = window.__WDG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sandboxed */ } } };
  const raf = f => requestAnimationFrame(f);

  /* ---------- play / pause (previews stay calm until hovered) ---------- */
  let playing = !cfg.paused;
  const isPlaying = () => playing && !document.hidden;
  window.__wdgPlaying = isPlaying;
  function setPlaying(v) { playing = v; root.classList.toggle('paused', !v); window.dispatchEvent(new CustomEvent('wdgplay', { detail: v })); }
  root.classList.toggle('paused', !playing);

  /* ---------- theme ---------- */
  function setTheme(t, silent) {
    root.dataset.theme = t;
    if (!silent) store.set('wdg-theme', t);
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
    $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode'));
  }
  const saved = store.get('wdg-theme');
  if (!cfg.paused && (saved === 'dark' || saved === 'light')) root.dataset.theme = saved;
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));
  addEventListener('message', e => { const d = e.data; if (!d) return; if (d.wdg === 'theme') setTheme(d.value, true); if (d.wdg === 'play') setPlaying(!!d.value); });

  /* ---------- multi-page router (hash based, works in sandboxed iframes and standalone files) ---------- */
  const pages = $$('[data-page]'); const ids = pages.map(p => p.dataset.page); let cur = ids[0];
  const parse = h => (h || '').replace(/^#\/?/, '').split(/[/?]/)[0];
  const closeMenu = () => root.classList.remove('menu-open');
  function go(id, opts) {
    opts = opts || {};
    if (ids.indexOf(id) < 0) id = ids[0];
    if (id === cur && !opts.force) { window.scrollTo({ top: 0, behavior: 'smooth' }); closeMenu(); return; }
    pages.forEach(p => p.classList.toggle('on', p.dataset.page === id));
    $$('[data-go]').forEach(a => { const on = a.dataset.go === id; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    root.dataset.page = id; cur = id;
    document.title = ((cfg.labels || {})[id] || id) + ' | ' + (cfg.name || '');
    window.scrollTo({ top: 0, behavior: 'instant' });
    closeMenu();
    if (opts.push !== false) { try { if (parse(location.hash) !== id) { if (parent !== window) history.replaceState(null, '', '#/' + id); else location.hash = '#/' + id; } } catch (e) { /* ignore */ } }
    window.dispatchEvent(new CustomEvent('pagechange', { detail: id }));
    raf(frame);
  }
  window.__go = go;
  addEventListener('hashchange', () => go(parse(location.hash) || ids[0], { push: false }));
  document.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); go(a.dataset.go); } });

  /* ---------- reveal + counters (observe once, never touch layout) ---------- */
  const rv = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(el => { const d = el.getAttribute('data-delay'); if (d) el.style.transitionDelay = d + 'ms'; io.observe(el); });
  } else rv.forEach(el => el.classList.add('in'));

  const runCount = el => {
    const end = parseFloat(el.getAttribute('data-count')) || 0, suf = el.getAttribute('data-suffix') || '', dur = 1400, t0 = performance.now();
    if (reduce) { el.textContent = end.toLocaleString() + suf; return; }
    const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e).toLocaleString() + suf; if (p < 1) raf(tick); };
    raf(tick);
  };
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: 0.4 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------- scroll loop: progress, header state, parallax, scroll variables ---------- */
  const prog = $('#prog'), hdr = $('[data-header]');
  const live = new Set();
  if ('IntersectionObserver' in window) {
    const lio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) live.add(e.target); else live.delete(e.target); }), { rootMargin: '25% 0px' });
    $$('[data-parallax],[data-scrollvar]').forEach(el => lio.observe(el));
  }
  let ticking = false, scrolled = false;
  const cl = v => Math.max(0, Math.min(1, v));
  function frame() {
    ticking = false;
    const y = scrollY, h = root.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0).toFixed(4) + ')';
    const sc = y > 24; if (sc !== scrolled) { scrolled = sc; if (hdr) hdr.classList.toggle('scrolled', sc); }
    if (reduce || !live.size) return;
    const reads = []; live.forEach(el => reads.push([el, el.getBoundingClientRect()]));
    for (let i = 0; i < reads.length; i++) {
      const el = reads[i][0], r = reads[i][1];
      if (el.hasAttribute('data-parallax')) { const k = parseFloat(el.getAttribute('data-parallax')) || 0.12; el.style.transform = 'translate3d(0,' + (-(r.top + r.height / 2 - innerHeight / 2) * k).toFixed(1) + 'px,0)'; }
      else {
        el.style.setProperty('--vp', cl((innerHeight - r.top) / (innerHeight + r.height)).toFixed(3));
        el.style.setProperty('--fill', cl((innerHeight * 0.65 - r.top) / r.height).toFixed(3));
      }
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(frame); } }, { passive: true });
  addEventListener('resize', () => raf(frame));

  /* ---------- pointer effects: cached rect, rAF-throttled, desktop only ---------- */
  function pointerFx(el, apply, reset) {
    let r = null, pending = 0, ex = 0, ey = 0;
    el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', e => { ex = e.clientX; ey = e.clientY; if (!pending) pending = raf(() => { pending = 0; if (!r) r = el.getBoundingClientRect(); apply(el, ex - r.left, ey - r.top, r); }); });
    el.addEventListener('pointerleave', () => { r = null; if (reset) reset(el); });
  }
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(el => { const max = parseFloat(el.getAttribute('data-tilt')) || 8; pointerFx(el, (n, x, y, r) => { n.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y / r.height) * max).toFixed(2) + 'deg) rotateY(' + ((x / r.width - 0.5) * max).toFixed(2) + 'deg)'; }, n => { n.style.transform = ''; }); });
    $$('[data-magnetic]').forEach(el => pointerFx(el, (n, x, y, r) => { n.style.transform = 'translate(' + ((x - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((y - r.height / 2) * 0.3).toFixed(1) + 'px)'; }, n => { n.style.transform = ''; }));
    $$('[data-spot]').forEach(el => pointerFx(el, (n, x, y) => { n.style.setProperty('--mx', x.toFixed(0) + 'px'); n.style.setProperty('--my', y.toFixed(0) + 'px'); }));
  }

  /* ---------- product search ---------- */
  const q = $('#q'), prods = $$('[data-prod]'), empty = $('[data-empty]');
  if (q) q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); let n = 0;
    prods.forEach(p => { const hit = !v || p.getAttribute('data-prod').toLowerCase().includes(v); p.classList.toggle('hide', !hit); if (hit) n++; });
    if (empty) empty.hidden = n > 0;
  });

  /* ---------- quote basket ---------- */
  const picked = new Map();
  const drawer = document.createElement('aside');
  drawer.id = 'wdg-q'; drawer.setAttribute('aria-hidden', 'true');
  const t = cfg.t || {};
  drawer.innerHTML = '<div class="wq-bg" data-wq-close></div><div class="wq-panel" role="dialog" aria-label="Quote list"><button class="wq-x" data-wq-close aria-label="Close">×</button><h3>' + (t.qTitle || 'Your quote list') + '</h3><p class="wq-sub">' + (t.qSub || 'Add what you need. We will reply with pricing.') + '</p><ul class="wq-list"></ul><form class="wq-form"><input name="n" placeholder="Name" required autocomplete="name"><input name="e" type="email" placeholder="Email" required autocomplete="email"><input name="c" placeholder="Company" autocomplete="organization"><textarea name="m" rows="3" placeholder="Quantity, specs, deadline"></textarea><button class="wq-send" type="submit">' + (t.send || 'Send request') + '</button></form><p class="wq-done" hidden>Almost there. Your email app should open with everything filled in.</p></div>';
  document.body.appendChild(drawer);
  const list = $('.wq-list', drawer);
  const refresh = () => {
    list.innerHTML = '';
    picked.forEach((_, name) => { const li = document.createElement('li'); li.textContent = name; const b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Remove ' + name); b.onclick = () => { picked.delete(name); refresh(); }; li.appendChild(b); list.appendChild(li); });
    if (!picked.size) { const li = document.createElement('li'); li.className = 'wq-empty'; li.textContent = 'Empty for now. Add a product to start.'; list.appendChild(li); }
    $$('[data-quote-count]').forEach(c => { c.textContent = picked.size; c.classList.toggle('on', picked.size > 0); });
    $$('[data-quote]').forEach(b => { const on = picked.has(b.getAttribute('data-quote')); b.classList.toggle('added', on); const l = b.querySelector('[data-label]') || b; if (b.dataset.labelAdd === undefined) b.dataset.labelAdd = l.textContent; l.textContent = on ? (t.added || 'Added') : b.dataset.labelAdd; });
  };
  const openQ = v => { drawer.classList.toggle('open', v); drawer.setAttribute('aria-hidden', String(!v)); };
  document.addEventListener('click', e => {
    const qb = e.target.closest('[data-quote]');
    if (qb) { e.preventDefault(); const n = qb.getAttribute('data-quote'); if (picked.has(n)) picked.delete(n); else { picked.set(n, 1); toast(t.toast || 'Added to your quote list'); } refresh(); return; }
    if (e.target.closest('[data-quote-open]')) { e.preventDefault(); openQ(true); return; }
    if (e.target.closest('[data-wq-close]')) openQ(false);
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (drawer.classList.contains('open')) { openQ(false); return; }
    if (root.classList.contains('menu-open')) { closeMenu(); return; }
    if (parent !== window) parent.postMessage({ wdg: 'key', key: 'Escape' }, '*');
  });
  const mail = (subject, body) => { if (cfg.email) { try { window.open('mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)); } catch (err) { /* sandbox */ } } };
  $('.wq-form', drawer).addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), items = Array.from(picked.keys());
    mail('Quote request', 'Hello ' + (cfg.name || '') + ',\n\nI would like a quote for:\n' + (items.map(i => ' - ' + i).join('\n') || ' - General enquiry') + '\n\n' + (f.get('m') || '') + '\n\n' + f.get('n') + (f.get('c') ? ', ' + f.get('c') : '') + '\n' + f.get('e'));
    $('.wq-done', drawer).hidden = false;
  });
  $$('form[data-contact]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(form);
    mail('Website enquiry', (f.get('m') || '') + '\n\n' + f.get('n') + '\n' + f.get('e'));
    const ok = $('[data-sent]', form.parentNode); if (ok) ok.hidden = false; form.reset();
  }));
  refresh();

  let tt; const tel = document.createElement('div'); tel.className = 'wdg-toast'; document.body.appendChild(tel);
  function toast(m) { tel.textContent = m; tel.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => tel.classList.remove('show'), 1700); }

  /* ---------- mobile menu ---------- */
  $$('[data-menu-btn]').forEach(b => b.addEventListener('click', () => root.classList.toggle('menu-open')));

  /* ---------- hand over to the template ---------- */
  const ctx = { $, $$, reduce, fine, root, raf, isPlaying, go, toast, openQuote: () => openQ(true) };
  if (typeof window.__tpl === 'function') window.__tpl(ctx);
  const first = parse(location.hash);
  if (first && ids.indexOf(first) > 0) go(first, { push: false, force: true });
  frame();
}
