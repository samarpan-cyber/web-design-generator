import { TEMPLATES } from './engine/index.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } } };

/* ---------------- industries (only Electronics is live today) ---------------- */
const ICONS = {
  electronics: '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/>',
  manufacturing: '<path d="M3 21V10l6 3V10l6 3V6h6v15z"/>',
  healthcare: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  realestate: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
  logistics: '<path d="M2 7h12v10H2zM14 10h4l4 3v4h-8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  software: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3M8 10l-2 2 2 2M16 10l2 2-2 2"/>'
};
const INDUSTRIES = [
  { id: 'electronics', name: 'Electronics and hardware', blurb: 'Component makers, EMS, power, IoT, test gear and distributors.', ready: true },
  { id: 'manufacturing', name: 'Manufacturing', blurb: 'Plants, fabricators and industrial suppliers.' },
  { id: 'healthcare', name: 'Healthcare', blurb: 'Clinics, labs and medical suppliers.' },
  { id: 'realestate', name: 'Real estate', blurb: 'Developers, brokers and property managers.' },
  { id: 'logistics', name: 'Logistics', blurb: 'Freight, warehousing and last-mile teams.' },
  { id: 'software', name: 'Software and IT', blurb: 'SaaS, agencies and IT services.' }
];

const state = { user: null, shareUrl: null, shareExp: 0, leads: [], profile: null, mode: 'auto', agency: store.get('wdg-agency') ?? 'Digifyo', busy: false, viewer: 0, pushedView: false, favs: new Set(), booted: false, industry: null };

/* ---------------- chrome helpers ---------------- */
const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2000); };
function setStep(n) { $$('#steps li').forEach(li => { const s = +li.dataset.s; li.classList.toggle('on', s === n); li.classList.toggle('done', s < n); li.classList.toggle('off', s >= 3 && !state.profile); }); }
const msgs = $('#msgs');
function say(html, cls = 'bot') { const el = document.createElement('div'); el.className = 'msg ' + cls; el.innerHTML = html; msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight; return el; }
const generatorUrl = () => location.origin + location.pathname + '#/electronics';

/* ---------------- routing: #/ (industry) -> #/electronics -> #/electronics/view/N ---------------- */
function navTo(hash, replace) { if (replace) { history.replaceState(null, '', hash); route(); } else location.hash = hash; }
function route() {
  if (!state.user) { showLogin(); return; }
  const m = (location.hash || '#/').match(/^#\/([a-z]+)(?:\/(compare))?(?:\/view\/(\d))?$/);
  const ind = m && INDUSTRIES.find(i => i.id === m[1] && i.ready);
  if (!ind) { showGate(); return; }
  const wantsCompare = !!(m[2] || m[3] !== undefined);
  if (wantsCompare && !state.profile) history.replaceState(null, '', '#/' + ind.id);
  showApp(ind, wantsCompare && !!state.profile);
  if (m[3] !== undefined && state.profile && +m[3] < TEMPLATES.length) showViewer(+m[3]); else hideViewer();
}
/* ---------------- login ---------------- */
function showLogin(msg) {
  hideViewer(); document.body.classList.add('is-login');
  $('#login').hidden = false; $('#gate').hidden = true; $('#app').hidden = true; $('#topActions').hidden = true; $('#who').hidden = true;
  $('#loginMsg').textContent = msg || ''; document.title = 'Design Generator | Log in';
  setTimeout(() => $('#loginUser').focus(), 50);
}
function enterApp(user) {
  state.user = user; document.body.classList.remove('is-login'); $('#login').hidden = true; $('#who').hidden = false; $('#whoName').textContent = user;
  if (!state.booted) renderGate(); route();
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const btn = $('#loginGo'); btn.disabled = true; $('#loginMsg').textContent = '';
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: $('#loginUser').value, password: $('#loginPass').value }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { $('#loginPass').value = ''; enterApp(j.user); } else $('#loginMsg').textContent = j.error || 'Could not log in';
  } catch { $('#loginMsg').textContent = 'Could not reach the server'; }
  btn.disabled = false;
});
async function logout() {
  try { await fetch('/api/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch { /* ignore */ }
  state.user = null; state.profile = null; state.shareUrl = null; state.booted = false; $('#msgs').innerHTML = ''; history.replaceState(null, '', '#/'); showLogin('You are logged out.');
}
$('#logout').onclick = logout;
const expired = () => { state.user = null; showLogin('Your session ended. Please log in again.'); };

function showGate() {
  hideViewer(); $('#gate').hidden = false; $('#app').hidden = true; $('#topActions').hidden = true; setStep(1); document.title = 'Design Generator | Pick an industry'; window.scrollTo(0, 0);
}
function showApp(ind, compare) {
  $('#gate').hidden = true; $('#app').hidden = false; $('#topActions').hidden = false; $('#indName').textContent = ind.name; state.industry = ind;
  const hasP = !!state.profile;
  if (!state.busy) { $('#welcome').hidden = !!compare; $('#results').hidden = !compare; }
  $('#resume').hidden = !(hasP && !compare); if (hasP) $('#resumeText').textContent = `Five designs for ${state.profile.name} are ready.`;
  $('#editBtn').disabled = !hasP;
  setStep(compare ? 3 : 2); document.title = compare ? `${state.profile.name} | Design Generator` : 'Design Generator | ' + ind.name;
  if (!state.booted) boot();
}

function renderGate() {
  $('#indGrid').innerHTML = INDUSTRIES.map(i => {
    const inner = `<span class="chip">${i.ready ? 'Ready' : 'Soon'}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[i.id]}</svg><b>${esc(i.name)}</b><span>${esc(i.blurb)}</span>${i.ready ? '<span class="go-line">Start designing →</span>' : ''}`;
    return i.ready ? `<a class="ind ready" href="#/${i.id}">${inner}</a>` : `<div class="ind soon" aria-disabled="true">${inner}</div>`;
  }).join('');
}

/* ---------------- leads ---------------- */
async function loadLeads() {
  try { const r = await fetch('/api/leads'); if (r.status === 401) { expired(); state.leads = []; return; } state.leads = await r.json(); } catch { state.leads = []; }
  $('#leadlist').innerHTML = state.leads.map(l => `<option value="${esc(l.company)}">`).join('');
  $('#quick').innerHTML = state.leads.slice(0, 8).map(l => `<button data-lead="${esc(l.company)}">${esc(l.company.split('/')[0].trim())}</button>`).join('');
  drawLeads('');
}
function drawLeads(q) {
  q = q.toLowerCase();
  $('#leads').innerHTML = state.leads.filter(l => !q || (l.company + l.website + l.city).toLowerCase().includes(q)).map(l =>
    `<button class="lead" data-lead="${esc(l.company)}"><b>${esc(l.company)}</b><span>${esc(l.website.replace(/^https?:\/\/(www\.)?/, ''))}</span>${l.city ? `<small>${esc(l.city)}</small>` : ''}</button>`).join('') || '<p style="color:var(--muted)">No leads match that.</p>';
}
function resolveInput(text) {
  text = text.trim(); if (!text) return null;
  const byName = state.leads.find(l => l.company.toLowerCase() === text.toLowerCase()) || (text.length > 2 && state.leads.find(l => l.company.toLowerCase().includes(text.toLowerCase())));
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
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}
function showSkeletons() {
  $('#welcome').hidden = true; $('#results').hidden = false; $('#resTitle').textContent = 'Designing'; $('#resMeta').textContent = 'Reading the site and building five concepts.';
  $('#grid').innerHTML = TEMPLATES.map(() => '<div class="skeleton"></div>').join(''); $('#pitchBtn').disabled = true; $('#dlAll').disabled = true;
}
async function generate(input) {
  if (state.busy) return;
  const t = input.trim();
  if (/^(dark|light|auto)( mode)?$/i.test(t)) { const v = t.split(' ')[0].toLowerCase(); say(esc(t), 'me'); setMode(v); say(`Previews switched to <b>${v}</b>.`); return; }
  say(esc(t), 'me');
  await state.leadsReady;
  const target = resolveInput(t);
  if (!target) { say('I need a website address, like <b>example.com</b>, or a company name from your lead list.', 'bot err'); return; }
  state.busy = true; $('#go').disabled = true;
  const steps = ['Opening the website', 'Reading brand and logo', 'Collecting products and contacts', 'Designing five concepts'];
  const bot = say(`Working on <b>${esc(target.name || target.url)}</b><ul>${steps.map(s => `<li>${s}</li>`).join('')}</ul>`);
  showSkeletons(); if (innerWidth < 980) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const lis = $$('li', bot); let i = 0;
  const ticker = setInterval(() => { if (i < lis.length - 1) lis[i++].classList.add('done'); }, 1000);
  let res; try { res = await api('/api/analyze', { url: target.url, name: target.name }); } catch { res = { status: 0, error: 'Could not reach the generator service' }; }
  clearInterval(ticker); state.busy = false; $('#go').disabled = false;
  if (res.status === 401) { bot.remove(); $('#results').hidden = true; $('#welcome').hidden = false; expired(); return; }
  if (!res.ok) {
    $('#results').hidden = true; $('#welcome').hidden = false;
    bot.className = 'msg bot err';
    bot.innerHTML = `That site would not open: <b>${esc(res.error || 'unknown error')}</b>.<br><span style="color:var(--muted)">Some sites block automated visitors. You can still build five designs from the name alone, then fill in details with Edit details.</span><div class="acts"><button class="ghost" id="nameOnly">Build from name only</button></div>`;
    $('#nameOnly', bot).onclick = () => fromNameOnly(target); return;
  }
  lis.forEach(l => l.classList.add('done')); summarize(res.profile, bot); showResults(res.profile);
}
function fromNameOnly(target) {
  const url = /^https?:\/\//i.test(target.url) ? target.url : 'https://' + target.url; let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  const p = { url, host, name: target.name || host.split('.')[0], colors: {}, nav: [], categories: [], products: [], images: [], headings: [], stats: [], certifications: [], industries: [], contacts: { emails: [], phones: [], address: '' }, social: {}, tagline: '', description: '', about: '', meta: { found: {}, placeholders: 6 }, notes: ['Built from the name only'] };
  say('Built from the name only. Open Edit details to add a logo, colour and contacts.'); showResults(p);
}
function summarize(p, el) {
  const f = p.meta.found, c = p.colors && p.colors.primary;
  const bits = [`<b>${f.products}</b> product${f.products === 1 ? '' : 's'}`, `<b>${f.images}</b> images`, f.logo ? 'logo found' : 'no logo', c ? `colour <span class="sw" style="background:${esc(c)}"></span> ${esc(c)}` : 'no brand colour, using a tuned default', f.contact ? 'contacts found' : 'no contacts'];
  let h = `Done. Five concepts for <b>${esc(p.name)}</b>.<br><span style="color:var(--muted)">I found ${bits.join(', ')}.</span>`;
  if (p.meta.placeholders) h += `<br><span style="color:#ffb86b">Only ${6 - p.meta.placeholders} real product${6 - p.meta.placeholders === 1 ? '' : 's'} found, so ${p.meta.placeholders} slot${p.meta.placeholders > 1 ? 's use' : ' uses'} a placeholder name. Fix it in Edit details before you pitch.</span>`;
  if (!f.products && f.images < 3) h += `<br><span style="color:#ffb86b">This site probably builds its pages with JavaScript, so little could be read.</span>`;
  if (p.notes && p.notes.length) h += `<br><span style="color:var(--muted)">${p.notes.map(esc).join('. ')}.</span>`;
  h += `<div class="acts"><button class="ghost" data-act="present">Present full screen</button><button class="ghost" data-act="edit">Edit details</button></div>`;
  el.className = 'msg bot'; el.innerHTML = h; msgs.scrollTop = msgs.scrollHeight;
}

/* ---------------- results grid ---------------- */
let io, ro;
const themeOpt = () => (state.mode === 'auto' ? undefined : state.mode);
const htmlFor = (t, o = {}) => t.render(state.profile, { theme: themeOpt(), agency: state.agency, ...o });
const effectiveTheme = t => (state.mode === 'auto' ? t.defaultTheme : state.mode);
function post(frame, msg) { try { frame.contentWindow.postMessage(msg, '*'); } catch { /* ignore */ } }

function showResults(profile) {
  state.profile = profile; state.favs = new Set(); state.shareUrl = null;
  $('#welcome').hidden = true; $('#results').hidden = false; $('#editBtn').disabled = false; $('#pitchBtn').disabled = false; $('#dlAll').disabled = false; $('#resume').hidden = true; setStep(3);
  document.title = `${profile.name} | Design Generator`;
  $('#resTitle').textContent = profile.name; $('#resMeta').textContent = `${profile.host}. Five concepts, five pages each. Star your favourites, then copy the pitch note.`;
  const grid = $('#grid'); grid.innerHTML = '';
  if (io) io.disconnect(); if (ro) ro.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const f = $('iframe', e.target); if (f && !f.dataset.ready) { f.dataset.ready = 1; try { f.srcdoc = htmlFor(TEMPLATES[+e.target.dataset.i], { paused: true }); } catch (err) { console.error(err); f.srcdoc = `<body style="font:14px system-ui;padding:20px">This concept could not render: ${esc(err.message)}</body>`; } } io.unobserve(e.target); }), { rootMargin: '300px' });
  ro = new ResizeObserver(es => es.forEach(e => { const f = $('iframe', e.target); if (f) f.style.transform = `scale(${e.contentRect.width / 1440})`; }));
  TEMPLATES.forEach((t, i) => {
    const card = document.createElement('article'); card.className = 'card'; card.dataset.i = i; card.style.animationDelay = i * 80 + 'ms';
    card.innerHTML = `<div class="meta"><div><b>${i + 1}. ${esc(t.name)}</b><span>${esc(t.tagline)}</span><span class="best">Best for: ${esc(t.best)}</span></div><button class="star" aria-pressed="false" aria-label="Shortlist ${esc(t.name)}" title="Shortlist">☆</button></div>
      <div class="shot"><iframe title="${esc(t.name)} preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe><button class="ov" aria-label="Interact with ${esc(t.name)}"><span>Tap to scroll it</span></button></div>
      <div class="foot"><button class="primary" data-open="${i}">Full screen</button><button class="ghost" data-tab="${i}">Open in tab</button><button class="ghost" data-dl="${i}">Download</button></div>`;
    grid.appendChild(card);
    const shot = $('.shot', card), fr = $('iframe', card);
    shot.addEventListener('pointerenter', () => post(fr, { wdg: 'play', value: true }));
    shot.addEventListener('pointerleave', () => { shot.classList.remove('live'); post(fr, { wdg: 'play', value: false }); });
    $('.ov', card).onclick = () => { shot.classList.add('live'); post(fr, { wdg: 'play', value: true }); };
    $('.star', card).onclick = e => { const on = !state.favs.has(i); on ? state.favs.add(i) : state.favs.delete(i); e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? '★' : '☆'; card.classList.toggle('fav', on); };
    io.observe(card); ro.observe(shot);
  });
  if (innerWidth >= 980) $('#stage').scrollTo({ top: 0, behavior: 'smooth' });
  if (!/\/compare/.test(location.hash)) navTo('#/' + (state.industry ? state.industry.id : 'electronics') + '/compare');
}
function setMode(mode) {
  state.mode = mode; $$('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === mode));
  if (!state.profile) return;
  $$('#grid .card').forEach(card => { const f = $('iframe', card); if (f && f.dataset.ready) post(f, { wdg: 'theme', value: effectiveTheme(TEMPLATES[+card.dataset.i]) }); });
}

/* ---------------- download / tab / pitch ---------------- */
function download(i) {
  const t = TEMPLATES[i], blob = new Blob([htmlFor(t)], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(state.profile.host || 'site').replace(/\W+/g, '-')}-${t.id}.html`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); setStep(4);
}
function openTab(i) { const url = URL.createObjectURL(new Blob([htmlFor(TEMPLATES[i], { back: generatorUrl() })], { type: 'text/html' })); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 120000); }
function pitchNote() {
  const p = state.profile, picks = [...state.favs].sort().map(i => TEMPLATES[i].name);
  return [`Hi ${p.name} team,`, '', `I rebuilt ${p.host} as five fresh website concepts, using your real products and branding. Each one has five pages, works on phones, and includes dark mode, product search and a quote basket.`, picks.length ? `My pick for you: ${picks.join(' and ')}.` : '', state.shareUrl ? `Take a look here (private link, open for 48 hours): ${state.shareUrl}` : '', 'Happy to walk you through them. Which one feels most like you?', '', state.agency || ''].filter((l, i, a) => l || (a[i - 1] && a[i + 1] !== undefined)).join('\n').trim();
}
function openPitch() { if (!state.profile) return; $('#pitchText').value = pitchNote(); $('#pitchDlg').showModal(); setStep(4); }
async function copyPitch() {
  const text = $('#pitchText').value || pitchNote();
  try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove(); }
  toast('Pitch note copied'); setStep(4);
}

/* ---------------- full-screen viewer (history aware, so Back works) ---------------- */
function openViewer(i) {
  const wasOpen = !$('#viewer').hidden, hash = `#/${state.industry ? state.industry.id : 'electronics'}/compare/view/${i}`;
  if (wasOpen) navTo(hash, true); else { state.pushedView = true; navTo(hash, false); }
}
function showViewer(i) {
  state.viewer = (i + TEMPLATES.length) % TEMPLATES.length; const t = TEMPLATES[state.viewer];
  $('#viewer').hidden = false; document.body.style.overflow = 'hidden';
  $('#vName').textContent = `${state.profile.name} | ${t.name}`; $('#vCount').textContent = `Concept ${state.viewer + 1} of ${TEMPLATES.length}. Use the menu inside the site to visit all five pages.`;
  mountFrame(htmlFor(t));
  $$('#vThemeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === effectiveTheme(t)));
}
/** A fresh iframe each time: re-assigning srcdoc would add browser history entries and break the Back button. */
function mountFrame(html) {
  const old = $('#vFrame'), f = document.createElement('iframe');
  f.id = 'vFrame'; f.title = 'Full preview'; f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox'); f.style.width = old.style.width;
  if (html != null) f.srcdoc = html;
  old.replaceWith(f);
}
function hideViewer() { if ($('#viewer').hidden) return; $('#viewer').hidden = true; state.pushedView = false; document.body.style.overflow = ''; mountFrame(null); }
function closeViewer() { if (state.pushedView) { state.pushedView = false; history.back(); } else navTo('#/electronics/compare', true); }

/* ---------------- edit details ---------------- */
function openEdit() {
  const p = state.profile, f = $('#editForm');
  f.name.value = p.name || ''; f.description.value = p.description || ''; f.color.value = (p.colors && p.colors.primary) || '#7c5cff'; f.agency.value = state.agency; f.logo.value = p.logo || '';
  f.email.value = (p.contacts.emails || [])[0] || ''; f.phone.value = (p.contacts.phones || [])[0] || ''; $('#editDlg').showModal();
}
$('#editForm').addEventListener('submit', e => {
  if (e.submitter && e.submitter.value !== 'ok') return;
  const f = e.target, p = structuredClone(state.profile);
  p.name = f.name.value.trim() || p.name; p.description = f.description.value.trim(); p.about = p.description || p.about;
  p.colors = { ...p.colors, primary: f.color.value }; p.logo = f.logo.value.trim() || null;
  p.contacts = { ...p.contacts, emails: f.email.value.trim() ? [f.email.value.trim()] : [], phones: f.phone.value.trim() ? [f.phone.value.trim()] : [] };
  state.agency = f.agency.value.trim(); store.set('wdg-agency', state.agency); showResults(p); toast('All five designs updated');
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
$('#editBtn').onclick = openEdit; $('#pitchBtn').onclick = openPitch; $('#pitchCopy').onclick = copyPitch;
$('#pitchDl').onclick = () => TEMPLATES.forEach((_, i) => setTimeout(() => download(i), i * 400));
$('#newSite').onclick = () => navTo('#/electronics'); $('#resumeBtn').onclick = () => navTo('#/electronics/compare');
$$('#steps li button').forEach(b => b.onclick = () => { const n = +b.parentNode.dataset.s; if (n === 1) navTo('#/'); else if (n === 2) navTo('#/electronics'); else if (!state.profile) toast('Generate a design first'); else if (n === 3) navTo('#/electronics/compare'); else openPitch(); });
$('#dlAll').onclick = () => TEMPLATES.forEach((_, i) => setTimeout(() => download(i), i * 400));
$('#vClose').onclick = closeViewer; $('#vPrev').onclick = () => openViewer(state.viewer - 1); $('#vNext').onclick = () => openViewer(state.viewer + 1); $('#vDl').onclick = () => download(state.viewer);
$$('#devSeg button').forEach(b => b.onclick = () => { $$('#devSeg button').forEach(x => x.classList.toggle('on', x === b)); $('#vFrame').style.width = b.dataset.d; });
$$('#vThemeSeg button').forEach(b => b.onclick = () => { $$('#vThemeSeg button').forEach(x => x.classList.toggle('on', x === b)); post($('#vFrame'), { wdg: 'theme', value: b.dataset.t }); });
addEventListener('message', e => { const d = e.data; if (d && d.wdg === 'key' && !$('#viewer').hidden && d.key === 'Escape') closeViewer(); });
addEventListener('keydown', e => { if ($('#viewer').hidden) return; if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') openViewer(state.viewer + 1); if (e.key === 'ArrowLeft') openViewer(state.viewer - 1); });
addEventListener('hashchange', route);

/* ---------------- boot ---------------- */
function boot() {
  state.booted = true;
  say('Paste a website or pick a lead. I will build five concepts from the real site.');
  say('Tip: type <b>dark</b> or <b>light</b> to flip every preview.');
  state.leadsReady = loadLeads();
}

/* ---------------- share with client (private link, 48 hours) ---------------- */
async function openShare() {
  if (!state.profile) return;
  const dlg = $('#shareDlg'); $('#shareState').textContent = 'Creating a private link'; $('#shareBox').hidden = true; $('#shareErr').textContent = ''; dlg.showModal();
  try {
    if (!state.shareUrl || state.shareExp < Date.now() + 60_000) {
      const r = await fetch('/api/share', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: state.profile, agency: state.agency }) });
      if (r.status === 401) { dlg.close(); expired(); return; }
      const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) throw new Error(j.error || 'Could not create the link');
      state.shareUrl = `${location.origin}/s/${j.token}`; state.shareExp = j.expiresAt;
    }
    $('#shareLink').value = state.shareUrl; $('#shareBox').hidden = false;
    $('#shareState').textContent = `Ready. Valid for 48 hours, until ${new Date(state.shareExp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`;
  } catch (e) { $('#shareState').textContent = ''; $('#shareErr').textContent = e.message; }
}
$('#shareBtn').onclick = openShare;
$('#shareCopy').onclick = async () => { const v = $('#shareLink').value; try { await navigator.clipboard.writeText(v); } catch { $('#shareLink').select(); try { document.execCommand('copy'); } catch { /* ignore */ } } toast('Link copied'); };
$('#shareNew').onclick = () => { state.shareUrl = null; openShare(); };

/* ---------------- start: who is this? ---------------- */
async function init() {
  const me = await fetch('/api/me').then(r => r.json()).catch(() => ({}));
  if (me.authed) { enterApp(me.user); return; }
  showLogin(me.configured === false ? 'Login is not set up on this server yet. Add the WDG_AUTH setting in the hosting dashboard, then reload.' : '');
}
init();
