import { TEMPLATES } from './engine/index.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } } };

const state = { leads: [], profile: null, mode: 'auto', agency: store.get('wdg-agency') ?? 'Digifyo', busy: false, viewer: 0, authRequired: false };

/* ---------------- chat helpers ---------------- */
const msgs = $('#msgs');
function say(html, cls = 'bot') {
  const el = document.createElement('div'); el.className = 'msg ' + cls; el.innerHTML = html;
  msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight; return el;
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2000); }

/* ---------------- leads ---------------- */
async function loadLeads() {
  try { state.leads = await (await fetch('leads.json')).json(); } catch { state.leads = []; }
  $('#leadlist').innerHTML = state.leads.map(l => `<option value="${esc(l.company)}">`).join('');
  $('#quick').innerHTML = state.leads.slice(0, 8).map(l => `<button data-lead="${esc(l.company)}">${esc(l.company.split('/')[0].trim())}</button>`).join('');
  drawLeads('');
}
function drawLeads(q) {
  q = q.toLowerCase();
  $('#leads').innerHTML = state.leads.filter(l => !q || (l.company + l.website + l.city).toLowerCase().includes(q)).map(l =>
    `<button class="lead" data-lead="${esc(l.company)}"><b>${esc(l.company)}</b><span>${esc(l.website.replace(/^https?:\/\/(www\.)?/, ''))}</span>${l.city ? `<small>${esc(l.city)}</small>` : ''}</button>`).join('') || '<p style="color:var(--muted)">No leads match.</p>';
}
function resolveInput(text) {
  text = text.trim();
  if (!text) return null;
  const byName = state.leads.find(l => l.company.toLowerCase() === text.toLowerCase()) ||
    state.leads.find(l => l.company.toLowerCase().includes(text.toLowerCase()) && text.length > 2);
  if (byName && !/\./.test(text)) return { url: byName.website, name: byName.company };
  if (/^(https?:\/\/)?[^\s/]+\.[a-z]{2,}([/?#]\S*)?$/i.test(text)) {
    const host = text.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
    const lead = state.leads.find(l => l.website.toLowerCase().includes(host));
    return { url: text, name: lead ? lead.company : '' };
  }
  return null;
}

/* ---------------- generation ---------------- */
async function api(path, body) {
  const headers = { 'content-type': 'application/json' };
  const key = sessionStorage.getItem('wdg-key'); if (key) headers['x-access-key'] = key;
  const r = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ...j };
}

async function generate(input) {
  if (state.busy) return;
  const t = input.trim();
  if (/^(dark|light|auto)( mode)?$/i.test(t)) { setMode(t.split(' ')[0].toLowerCase()); say(esc(t), 'me'); say(`Switched previews to <b>${t.split(' ')[0].toLowerCase()}</b>.`); return; }
  const target = resolveInput(t);
  say(esc(t), 'me');
  if (!target) { say('I need a website address (like <b>example.com</b>) or the name of a company from your leads list.', 'bot err'); return; }
  state.busy = true; $('#go').disabled = true;
  const steps = ['Opening the website', 'Reading brand colours & logo', 'Collecting products, images & contacts', 'Designing 5 concepts'];
  const bot = say(`Working on <b>${esc(target.name || target.url)}</b>…<ul>${steps.map(s => `<li>${s}</li>`).join('')}</ul>`);
  const lis = $$('li', bot); let i = 0;
  const ticker = setInterval(() => { if (i < lis.length - 1) lis[i++].classList.add('done'); }, 1100);
  let res;
  try { res = await api('/api/analyze', { url: target.url, name: target.name }); }
  catch (e) { res = { status: 0, error: 'Could not reach the generator service' }; }
  clearInterval(ticker);
  state.busy = false; $('#go').disabled = false;
  if (res.status === 401) {
    bot.remove();
    const k = prompt('This deployment is protected. Enter the access key:');
    if (k) { sessionStorage.setItem('wdg-key', k); return generate(input).catch(() => {}); }
    say('Access key required.', 'bot err'); return;
  }
  if (!res.ok) {
    bot.className = 'msg bot err';
    bot.innerHTML = `Couldn’t read that site: <b>${esc(res.error || 'unknown error')}</b>.<br><span style="color:var(--muted)">Some sites block automated visitors. You can still generate the five designs from the name alone and fill in details with “Edit details”.</span><div class="acts"><button class="ghost" id="nameOnly">Generate from name only</button></div>`;
    $('#nameOnly', bot).onclick = () => { fromNameOnly(target); };
    return;
  }
  lis.forEach(l => l.classList.add('done'));
  summarize(res.profile, bot);
  showResults(res.profile);
}

function fromNameOnly(target) {
  const url = /^https?:\/\//i.test(target.url) ? target.url : 'https://' + target.url;
  let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  const p = { url, host, name: target.name || host.split('.')[0], colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {}, tagline: '', description: '', about: '', meta: { found: {}, placeholders: 6 }, notes: ['Built from name only'] };
  say('Built from the name only — open <b>Edit details</b> to add logo, colour and contacts.');
  showResults(p);
}

function summarize(p, el) {
  const f = p.meta.found, c = p.colors && p.colors.primary;
  const bits = [`<b>${f.products}</b> product${f.products === 1 ? '' : 's'}`, `<b>${f.images}</b> images`, f.logo ? 'logo ✓' : 'no logo found', c ? `brand colour <span class="sw" style="background:${esc(c)}"></span> ${esc(c)}` : 'no brand colour (using a tuned default)', f.contact ? 'contact details ✓' : 'no contact details'];
  let h = `Done! Here are <b>5 concepts</b> for <b>${esc(p.name)}</b>.<br><span style="color:var(--muted)">I found ${bits.join(' · ')}.</span>`;
  if (p.meta.placeholders) h += `<br><span style="color:#ffb86b">⚠ Only ${6 - p.meta.placeholders} real products were found, so ${p.meta.placeholders} slot${p.meta.placeholders > 1 ? 's use' : ' uses'} placeholder names — fix with “Edit details” or pick better ones before pitching.</span>`;
  if (!f.products && f.images < 3) h += `<br><span style="color:#ffb86b">⚠ This site likely renders with JavaScript, so little could be read from its HTML.</span>`;
  if (p.notes && p.notes.length) h += `<br><span style="color:var(--muted)">${p.notes.map(esc).join(' · ')}</span>`;
  h += `<div class="acts"><button class="ghost" data-act="present">▶ Present full-screen</button><button class="ghost" data-act="edit">Edit details</button></div>`;
  el.className = 'msg bot'; el.innerHTML = h;
  msgs.scrollTop = msgs.scrollHeight;
}

/* ---------------- results grid ---------------- */
let io, ro;
function themeOpt() { return state.mode === 'auto' ? undefined : state.mode; }
function htmlFor(t) { return t.render(state.profile, { theme: themeOpt(), agency: state.agency }); }

function showResults(profile) {
  state.profile = profile;
  $('#welcome').hidden = true; $('#results').hidden = false; $('#editBtn').disabled = false;
  $('#resTitle').textContent = profile.name;
  $('#resMeta').textContent = `${profile.host} · 5 live, interactive concepts — hover a design and press “Interact” to scroll it`;
  const grid = $('#grid'); grid.innerHTML = '';
  if (io) io.disconnect(); if (ro) ro.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const f = $('iframe', e.target); if (f && !f.dataset.ready) { f.dataset.ready = 1; try { f.srcdoc = htmlFor(TEMPLATES[+e.target.dataset.i]); } catch (err) { console.error(err); f.srcdoc = `<body style="font:14px system-ui;padding:20px">Could not render this concept: ${esc(err.message)}</body>`; } } io.unobserve(e.target); } }), { rootMargin: '300px' });
  ro = new ResizeObserver(es => es.forEach(e => { const f = $('iframe', e.target); if (f) f.style.transform = `scale(${e.contentRect.width / 1440})`; }));
  TEMPLATES.forEach((t, i) => {
    const card = document.createElement('article'); card.className = 'card'; card.dataset.i = i; card.style.animationDelay = i * 90 + 'ms';
    card.innerHTML = `<div class="meta"><div><b>${esc(t.name)}</b><span>${esc(t.tagline)}</span></div><span class="num">0${i + 1}/05</span></div>
      <div class="shot"><iframe title="${esc(t.name)} preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe><button class="ov" aria-label="Interact with ${esc(t.name)}"><span>▶ Interact</span></button></div>
      <div class="foot"><button class="primary" data-open="${i}">Full screen</button><button class="ghost" data-tab="${i}">New tab</button><button class="ghost" data-dl="${i}">Download .html</button></div>`;
    grid.appendChild(card);
    const shot = $('.shot', card);
    $('.ov', card).onclick = () => shot.classList.add('live');
    shot.addEventListener('pointerleave', () => shot.classList.remove('live'));
    io.observe(card); ro.observe(shot);
  });
  $('#stage').scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: $('.stage').offsetTop - 70, behavior: 'smooth' });
}

function postTheme(frame, value) { try { frame.contentWindow.postMessage({ wdg: 'theme', value }, '*'); } catch { /* ignore */ } }
function setMode(mode) {
  state.mode = mode;
  $$('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === mode));
  if (!state.profile) return;
  $$('#grid .card').forEach(card => {
    const f = $('iframe', card); if (!f.dataset.ready) return;
    const t = TEMPLATES[+card.dataset.i]; postTheme(f, mode === 'auto' ? t.defaultTheme : mode);
  });
}

/* ---------------- download / tab ---------------- */
function download(i) {
  const t = TEMPLATES[i], blob = new Blob([htmlFor(t)], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(state.profile.host || 'site').replace(/\W+/g, '-')}-${t.id}.html`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function openTab(i) { const url = URL.createObjectURL(new Blob([htmlFor(TEMPLATES[i])], { type: 'text/html' })); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000); }

/* ---------------- viewer (present mode) ---------------- */
function openViewer(i) {
  state.viewer = (i + TEMPLATES.length) % TEMPLATES.length;
  const t = TEMPLATES[state.viewer];
  $('#viewer').hidden = false; document.body.style.overflow = 'hidden';
  $('#vName').textContent = `${state.profile.name} — ${t.name}`; $('#vCount').textContent = `Concept ${state.viewer + 1} of ${TEMPLATES.length} · ${t.tagline}`;
  $('#vFrame').srcdoc = htmlFor(t);
  const eff = state.mode === 'auto' ? t.defaultTheme : state.mode;
  $$('#vThemeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === eff));
}
function closeViewer() { $('#viewer').hidden = true; document.body.style.overflow = ''; $('#vFrame').srcdoc = ''; }

/* ---------------- edit dialog ---------------- */
function openEdit() {
  const p = state.profile, f = $('#editForm');
  f.name.value = p.name || ''; f.tagline.value = p.tagline || ''; f.description.value = p.description || '';
  f.color.value = (p.colors && p.colors.primary) || '#7c5cff'; f.agency.value = state.agency; f.logo.value = p.logo || '';
  f.email.value = (p.contacts.emails || [])[0] || ''; f.phone.value = (p.contacts.phones || [])[0] || '';
  $('#editDlg').showModal();
}
$('#editForm').addEventListener('submit', e => {
  if (e.submitter && e.submitter.value !== 'ok') return;
  const f = e.target, p = structuredClone(state.profile);
  p.name = f.name.value.trim() || p.name; p.tagline = f.tagline.value.trim(); p.description = f.description.value.trim();
  p.colors = { ...p.colors, primary: f.color.value }; p.logo = f.logo.value.trim() || null;
  p.contacts = { ...p.contacts, emails: f.email.value.trim() ? [f.email.value.trim()] : [], phones: f.phone.value.trim() ? [f.phone.value.trim()] : [] };
  state.agency = f.agency.value.trim(); store.set('wdg-agency', state.agency);
  showResults(p); toast('Designs updated');
});

/* ---------------- events ---------------- */
$('#form').addEventListener('submit', e => { e.preventDefault(); const v = $('#input').value; $('#input').value = ''; if (v.trim()) generate(v); });
document.addEventListener('click', e => {
  const lead = e.target.closest('[data-lead]'); if (lead) { generate(lead.dataset.lead); return; }
  const act = e.target.closest('[data-act]'); if (act) { act.dataset.act === 'present' ? openViewer(0) : openEdit(); return; }
  const o = e.target.closest('[data-open]'); if (o) openViewer(+o.dataset.open);
  const d = e.target.closest('[data-dl]'); if (d) download(+d.dataset.dl);
  const t = e.target.closest('[data-tab]'); if (t) openTab(+t.dataset.tab);
});
$('#leadSearch').addEventListener('input', e => drawLeads(e.target.value));
$$('#themeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.t));
$('#editBtn').onclick = openEdit;
$('#dlAll').onclick = () => TEMPLATES.forEach((_, i) => setTimeout(() => download(i), i * 350));
$('#vClose').onclick = closeViewer; $('#vPrev').onclick = () => openViewer(state.viewer - 1); $('#vNext').onclick = () => openViewer(state.viewer + 1);
$('#vDl').onclick = () => download(state.viewer);
$$('#devSeg button').forEach(b => b.onclick = () => { $$('#devSeg button').forEach(x => x.classList.toggle('on', x === b)); $('#vFrame').style.width = b.dataset.d; });
$$('#vThemeSeg button').forEach(b => b.onclick = () => { $$('#vThemeSeg button').forEach(x => x.classList.toggle('on', x === b)); postTheme($('#vFrame'), b.dataset.t); });
addEventListener('message', e => { const d = e.data; if (d && d.wdg === 'key' && !$('#viewer').hidden) { if (d.key === 'Escape') closeViewer(); if (d.key === 'ArrowRight') openViewer(state.viewer + 1); if (d.key === 'ArrowLeft') openViewer(state.viewer - 1); } });
addEventListener('keydown', e => {
  if ($('#viewer').hidden) return;
  if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') openViewer(state.viewer + 1); if (e.key === 'ArrowLeft') openViewer(state.viewer - 1);
});

/* ---------------- boot ---------------- */
say('Hi! Paste any company’s website — or pick a lead on the right — and I’ll build <b>5 redesign concepts</b> from their live site: products, logo, colours, contacts and all.');
say('Tip: type <b>dark</b> or <b>light</b> to flip every preview.');
loadLeads();
fetch('/api/config').then(r => r.json()).then(c => { state.authRequired = !!c.authRequired; }).catch(() => {});
