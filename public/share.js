// Client-facing page for a private share link. No login: the link itself is the key, and it expires after 48 hours.
import { TEMPLATES, getTemplate, setSet } from '/engine/index.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const post = (frame, msg) => { try { frame.contentWindow.postMessage(msg, '*'); } catch { /* ignore */ } };

const token = (location.pathname.match(/^\/s\/([\w.-]+)/) || [])[1] || new URLSearchParams(location.search).get('t') || '';
const state = { profile: null, agency: '', exp: 0, viewer: 0, pushed: false };

function stateScreen(title, text) { $('#shMain').hidden = true; $('#viewer').hidden = true; $('#shState').hidden = false; $('#shStateTitle').textContent = title; $('#shStateText').textContent = text; }

async function load() {
  if (!token) return stateScreen('This link is not valid', 'Check that the whole link was copied, or ask for a new one.');
  let r, j = {};
  try { r = await fetch('/api/share?t=' + encodeURIComponent(token)); j = await r.json().catch(() => ({})); } catch { return stateScreen('Could not load the preview', 'Check your connection and reload the page.'); }
  if (r.status === 410) return stateScreen('This link has expired', 'Private links stay open for 48 hours. Ask the person who sent it for a fresh one.');
  if (r.status === 503) return stateScreen('Previews are not available right now', 'Please try again a little later.');
  if (!r.ok || !j.ok) return stateScreen('This link is not valid', 'Check that the whole link was copied, or ask for a new one.');
  state.profile = j.profile; state.agency = j.agency || ''; state.exp = j.exp; state.designer = j.designer || null;
  const chosen = (j.ids || []).map(getTemplate).filter(Boolean); if (chosen.length) setSet(chosen);
  renderBy(j.designer);
  document.title = `Concepts for ${j.profile.name}`;
  $('#shAgency').textContent = state.agency ? `Prepared by ${state.agency}` : 'Design concepts';
  $('#shTitle').textContent = `Five website concepts for ${j.profile.name}`;
  const hours = Math.max(1, Math.ceil((state.exp - Date.now()) / 3_600_000));
  $('#shExpiry').textContent = hours >= 2 ? `Private link, open for about ${hours} more hours` : 'Private link, closes within the hour';
  $('#shState').hidden = true; $('#shMain').hidden = false;
  render(); route();
}

const htmlFor = (t, o = {}) => t.render(state.profile, { agency: state.agency, designer: state.designer, assetBase: location.origin + '/stock/', ...o });

function renderBy(d) {
  const box = $('#shBy'); if (!box || !d) return; const wa = String(d.whatsapp || d.phone || '').replace(/\D/g, '');
  box.innerHTML = `<div><b>Designed by ${esc(d.company)}</b>${d.name ? `<span>${esc(d.name)}${d.role ? ', ' + esc(d.role) : ''}</span>` : ''}</div><div class="by-act">${d.phone ? `<a href="tel:${esc(d.phone.replace(/[^+\d]/g, ''))}">Call ${esc(d.phone)}</a>` : ''}${wa ? `<a class="wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ''}</div>`; box.hidden = false;
}

function render() {
  const grid = $('#grid'); grid.innerHTML = '';
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const f = $('iframe', e.target); if (f && !f.dataset.ready) { f.dataset.ready = 1; try { f.srcdoc = htmlFor(TEMPLATES[+e.target.dataset.i], { paused: true }); } catch (err) { console.error(err); } } io.unobserve(e.target); }), { rootMargin: '300px' });
  const ro = new ResizeObserver(es => es.forEach(e => { const f = $('iframe', e.target); if (f) f.style.transform = `scale(${e.contentRect.width / 1440})`; }));
  TEMPLATES.forEach((t, i) => {
    const card = document.createElement('article'); card.className = 'card'; card.dataset.i = i; card.style.animationDelay = i * 80 + 'ms';
    card.innerHTML = `<div class="meta"><div><b>${i + 1}. ${esc(t.name)}</b><span>${esc(t.tagline)}</span></div></div>
      <div class="shot"><iframe title="${esc(t.name)} preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe><button class="ov" aria-label="Open ${esc(t.name)}"><span>Open this concept</span></button></div>
      <div class="foot"><button class="primary" data-open="${i}">Explore full screen</button></div>`;
    grid.appendChild(card);
    const shot = $('.shot', card), fr = $('iframe', card);
    shot.addEventListener('pointerenter', () => post(fr, { wdg: 'play', value: true }));
    shot.addEventListener('pointerleave', () => post(fr, { wdg: 'play', value: false }));
    $('.ov', card).onclick = () => openViewer(i);
    io.observe(card); ro.observe(shot);
  });
}

/* ---------------- viewer, history aware ---------------- */
const route = () => { const m = location.hash.match(/^#\/view\/(\d)$/); if (m && +m[1] < TEMPLATES.length && state.profile) showViewer(+m[1]); else hideViewer(); };
function openViewer(i) { if ($('#viewer').hidden) { state.pushed = true; location.hash = '#/view/' + i; } else { history.replaceState(null, '', '#/view/' + i); route(); } }
function mountFrame(html) {
  const old = $('#vFrame'), f = document.createElement('iframe');
  f.id = 'vFrame'; f.title = 'Full preview'; f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox'); f.style.width = old.style.width;
  if (html != null) f.srcdoc = html; old.replaceWith(f);
}
function showViewer(i) {
  state.viewer = (i + TEMPLATES.length) % TEMPLATES.length; const t = TEMPLATES[state.viewer];
  $('#viewer').hidden = false; document.body.style.overflow = 'hidden';
  $('#vName').textContent = `${state.profile.name} | ${t.name}`; $('#vCount').textContent = `Concept ${state.viewer + 1} of ${TEMPLATES.length}. Use the menu inside the site to visit its five pages.`;
  mountFrame(htmlFor(t));
  $$('#vThemeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === t.defaultTheme));
}
function hideViewer() { if ($('#viewer').hidden) return; $('#viewer').hidden = true; state.pushed = false; document.body.style.overflow = ''; mountFrame(null); }
function closeViewer() { if (state.pushed) { state.pushed = false; history.back(); } else { history.replaceState(null, '', location.pathname + location.search); route(); } }

addEventListener('hashchange', route);
$('#grid').addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) openViewer(+o.dataset.open); });
$('#vClose').onclick = closeViewer; $('#vPrev').onclick = () => openViewer(state.viewer - 1); $('#vNext').onclick = () => openViewer(state.viewer + 1);
$$('#devSeg button').forEach(b => b.onclick = () => { $$('#devSeg button').forEach(x => x.classList.toggle('on', x === b)); $('#vFrame').style.width = b.dataset.d; });
$$('#vThemeSeg button').forEach(b => b.onclick = () => { $$('#vThemeSeg button').forEach(x => x.classList.toggle('on', x === b)); post($('#vFrame'), { wdg: 'theme', value: b.dataset.t }); });
addEventListener('message', e => { const d = e.data; if (d && d.wdg === 'key' && !$('#viewer').hidden && d.key === 'Escape') closeViewer(); });
addEventListener('keydown', e => { if ($('#viewer').hidden) return; if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') openViewer(state.viewer + 1); if (e.key === 'ArrowLeft') openViewer(state.viewer - 1); });

load();
