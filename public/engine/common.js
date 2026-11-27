// Shared helpers for all templates. Pure functions - works in the browser and in Node (tests/screenshots).
import { runtime } from './runtime.js';
import { noDash, brief, topicOf, NOUN, headline, voiceCopy, describe, sectorLine } from './copy.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = u => (typeof u === 'string' && /^(https?:\/\/|data:image\/)/i.test(u.trim()) ? u.trim() : '');
export const jsonForScript = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');

/* ---------------- colour ---------------- */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
export function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
export function lum(hex) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
}
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
}
/** Returns brand tokens tuned for a theme so text/accents always have contrast. */
export function tones(m, theme) {
  const [h, s, l] = hexToHsl(m.brand);
  const sat = clamp(s, .55, .95);
  const brand = theme === 'dark' ? hsl(h, sat, clamp(l, .52, .68)) : hsl(h, sat, clamp(l, .34, .48));
  const brand2 = theme === 'dark' ? hsl(h + 42, sat, .62) : hsl(h + 42, sat, .45);
  return { brand, brand2, ink: lum(brand) > .32 ? '#0b0f14' : '#ffffff' };
}

/* ---------------- procedural artwork (used when a product has no usable photo) ---------------- */
function rng(seed) { let t = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261) || 1; return () => { t |= 0; t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const uri = svg => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
export function kindFor(name, r) {
  const n = String(name).toLowerCase();
  if (/sensor|probe|detector|encoder|transducer|proximity/.test(n)) return 'sensor';
  if (/display|scope|meter|analy[sz]|test|measure|signal|instrument|calibrat/.test(n)) return 'wave';
  if (/chip|\bic\b|semic|processor|mcu|soc|fpga|asic|silicon|component|connector/.test(n)) return 'chip';
  if (/pcb|board|module|controller|drive|inverter|ups|psu|supply|relay|power|battery|bms/.test(n)) return 'module';
  return ['chip', 'pcb', 'module'][Math.floor(r() * 3)];
}
export function art(seed, brandHex, name = '', w = 800, h = 600) {
  const r = rng(seed + name), kind = kindFor(name || seed, r);
  const hue = hexToHsl(brandHex)[0], A = hsl(hue, .85, .6), B = hsl(hue + 40, .8, .62), bg1 = hsl(hue, .45, .11), bg2 = hsl(hue + 20, .5, .19);
  let g = '';
  const grid = `<pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${A}" stroke-opacity=".08"/></pattern>`;
  if (kind === 'chip') {
    const cx = w / 2, cy = h / 2, s = 200 + r() * 40, pins = 9;
    for (let i = 0; i < pins; i++) { const p = -s + 22 + i * ((2 * s - 44) / (pins - 1)); g += `<rect x="${cx + p - 6}" y="${cy - s - 34}" width="12" height="34" rx="2" fill="${A}" opacity=".7"/><rect x="${cx + p - 6}" y="${cy + s}" width="12" height="34" rx="2" fill="${A}" opacity=".7"/><rect x="${cx - s - 34}" y="${cy + p - 6}" width="34" height="12" rx="2" fill="${A}" opacity=".7"/><rect x="${cx + s}" y="${cy + p - 6}" width="34" height="12" rx="2" fill="${A}" opacity=".7"/>`; }
    g = `<circle cx="${cx}" cy="${cy}" r="260" fill="url(#glow)"/>` + g + `<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" rx="26" fill="url(#body)" stroke="${A}" stroke-opacity=".6" stroke-width="2"/><rect x="${cx - s + 28}" y="${cy - s + 28}" width="${2 * s - 56}" height="${2 * s - 56}" rx="14" fill="none" stroke="${B}" stroke-opacity=".35"/><circle cx="${cx - s + 54}" cy="${cy - s + 54}" r="9" fill="${B}"/>` + [0, 1, 2].map(i => `<rect x="${cx - 90}" y="${cy - 28 + i * 26}" width="${150 - i * 34}" height="9" rx="4.5" fill="${A}" opacity="${.85 - i * .22}"/>`).join('');
  } else if (kind === 'pcb') {
    for (let i = 0; i < 16; i++) { let x = r() * w, y = r() * h, d = `M${x | 0} ${y | 0}`; for (let k = 0; k < 4; k++) { if (r() > .5) x += (r() - .5) * 360; else y += (r() - .5) * 280; d += `L${x | 0} ${y | 0}`; } g += `<path d="${d}" fill="none" stroke="${i % 3 ? A : B}" stroke-width="${2 + r() * 2}" stroke-opacity=".7" stroke-linejoin="round"/><circle cx="${x | 0}" cy="${y | 0}" r="7" fill="${bg1}" stroke="${B}" stroke-width="3"/>`; }
    g += `<rect x="${w / 2 - 90}" y="${h / 2 - 70}" width="180" height="140" rx="12" fill="url(#body)" stroke="${A}" stroke-width="2"/><circle cx="${w / 2 - 60}" cy="${h / 2 - 40}" r="7" fill="${B}"/>`;
  } else if (kind === 'sensor') {
    const cx = w / 2, cy = h / 2;
    for (let i = 5; i > 0; i--) g += `<circle cx="${cx}" cy="${cy}" r="${i * 56}" fill="none" stroke="${i % 2 ? A : B}" stroke-opacity="${.12 + (5 - i) * .07}" stroke-width="2" stroke-dasharray="${i * 5} ${i * 9}"/>`;
    g += `<rect x="${cx - 46}" y="${cy - 100}" width="92" height="200" rx="46" fill="url(#body)" stroke="${A}" stroke-width="2"/><circle cx="${cx}" cy="${cy - 50}" r="22" fill="${B}" opacity=".9"/><circle cx="${cx}" cy="${cy - 50}" r="9" fill="${bg1}"/>` + `<rect x="${cx - 8}" y="${cy + 100}" width="16" height="90" fill="${A}" opacity=".6"/>`;
  } else if (kind === 'wave') {
    let d1 = '', d2 = ''; for (let x = 0; x <= w; x += 8) { d1 += (x ? 'L' : 'M') + x + ' ' + (h / 2 + Math.sin(x / 55) * 90 * (.6 + .4 * Math.sin(x / 190))).toFixed(1); d2 += (x ? 'L' : 'M') + x + ' ' + (h / 2 + 130 + (Math.floor(x / 70) % 2 ? -34 : 34)); }
    g = `<rect x="70" y="70" width="${w - 140}" height="${h - 140}" rx="22" fill="${bg1}" stroke="${A}" stroke-opacity=".5" stroke-width="2"/><rect x="70" y="70" width="${w - 140}" height="${h - 140}" rx="22" fill="url(#g)"/><path d="${d1}" fill="none" stroke="${A}" stroke-width="4"/><path d="${d2}" fill="none" stroke="${B}" stroke-width="3" stroke-opacity=".8"/>`;
  } else {
    const x0 = 110, y0 = 110, bw = w - 220, bh = h - 220, nt = 3 + Math.floor(r() * 6), nc = 2 + Math.floor(r() * 4), left = r() > .5;
    g = `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="20" fill="url(#body)" stroke="${A}" stroke-opacity=".7" stroke-width="2"/>`;
    for (let i = 0; i < nt; i++) g += `<rect x="${x0 + 22 + i * 28}" y="${y0 - 18}" width="18" height="26" rx="3" fill="${i % 2 ? A : B}" opacity=".85"/>`;
    for (let i = 0; i < nc; i++) g += `<circle cx="${left ? x0 + 60 : x0 + bw - 56}" cy="${y0 + 56 + i * 56}" r="${16 + Math.floor(r() * 10)}" fill="none" stroke="${A}" stroke-width="3"/><circle cx="${left ? x0 + 60 : x0 + bw - 56}" cy="${y0 + 56 + i * 56}" r="5" fill="${B}"/>`;
    const cx0 = left ? x0 + 150 : x0 + 40, cw = 120 + Math.floor(r() * 90);
    g += `<rect x="${cx0}" y="${y0 + 56}" width="${cw}" height="${90 + Math.floor(r() * 50)}" rx="10" fill="${bg1}" stroke="${B}" stroke-width="2"/><rect x="${cx0 + cw + 30}" y="${y0 + 56}" width="${60 + Math.floor(r() * 60)}" height="${50 + Math.floor(r() * 40)}" rx="8" fill="${bg1}" stroke="${A}" stroke-width="2"/>`;
    for (let i = 0; i < 4 + Math.floor(r() * 4); i++) g += `<path d="M${cx0} ${y0 + 200 + i * 10}H${cx0 + 80 + r() * 200}" stroke="${A}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hsl(hue, .35, .2)}"/><stop offset="1" stop-color="${hsl(hue, .35, .09)}"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="${A}" stop-opacity=".45"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></radialGradient>${grid}</defs><rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#g)"/>${g}</svg>`);
}

/* ---------------- model: normalizes a scraped profile for templates ---------------- */
const GENERIC_PRODUCTS = ['Core range', 'Custom builds', 'Engineering support', 'Embedded systems', 'Power solutions', 'Testing and service'];
const GENERIC_SECTORS = ['Industrial equipment', 'Embedded systems', 'Power systems', 'Custom projects'];
const clean = s => noDash(s);

export function buildModel(p, opts = {}) {
  const voice = opts.voice ?? 0;
  const name = clean(p.name || p.host || 'Your Company').slice(0, 60);
  const initials = name.split(/[\s/&,-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'E';
  const brand = (p.colors && p.colors.primary) || opts.fallbackBrand || '#2dd4bf';
  const cats = (p.categories || []).map(clean).slice(0, 12);
  const industries = (p.industries || []).slice(0, 6);
  const m = { name, initials, brand, cats, industries, voice };

  // products: real names, short real descriptions or distinct micro-lines, never filler repeated
  const used = new Set();
  let products = (p.products || []).map(x => ({ name: clean(x.name), raw: x.description || '', url: safeUrl(x.url), img: safeUrl(x.image) }));
  let placeholders = 0;
  if (products.length < 6) {
    const have = new Set(products.map(x => x.name.toLowerCase()));
    for (const n of [...cats, ...GENERIC_PRODUCTS]) { if (products.length >= 6) break; if (!have.has(n.toLowerCase())) { have.add(n.toLowerCase()); products.push({ name: n, raw: '', url: '', img: '', placeholder: true }); placeholders++; } }
  }
  products = products.slice(0, 12).map((x, i) => {
    let desc = x.raw && x.raw.length > 24 ? brief(x.raw, 96) : '';
    if (desc && used.has(desc.toLowerCase())) desc = '';
    if (!desc) desc = describe(x.name, voice, used); else used.add(desc.toLowerCase());
    const art0 = art(p.host || name, brand, x.name);
    return { name: x.name, desc, desc2: '', url: x.url, placeholder: !!x.placeholder, i, art: art0, isPhoto: !!x.img, src: x.img || art0 };
  });
  products.forEach(x => { x.desc2 = describe(x.name, voice, used, 1); });
  m.products = products; m.placeholders = placeholders;
  m.topic = topicOf(m); m.noun = NOUN[m.topic];

  // images: every slot gets a different picture, art fills any gap
  const gallery = [...new Set([safeUrl(p.ogImage), ...(p.images || []).map(i => safeUrl(i.src))].filter(Boolean))];
  const slot = (k, label) => { const a = art((p.host || name) + k, brand, label || 'module sensor chip'); return gallery[k] ? { src: gallery[k], art: a, name, isPhoto: true } : { src: a, art: a, name, isPhoto: false }; };
  m.img = { hero: slot(0, 'sensor module'), about: slot(1, 'pcb board'), wide: slot(2, 'chip'), extra: slot(3, 'wave scope') };

  // text: hero line from the voice bank, supporting line from the site (one sentence), about from the site if distinct
  const raw = clean(p.description || p.about || '');
  m.rawDesc = raw;
  m.headline = headline(m.topic, voice);
  const subSrc = brief(raw, 128);
  m.sub = subSrc || '';
  const aboutSrc = brief(clean(p.about || ''), 200);
  m.aboutLine = aboutSrc && aboutSrc !== subSrc ? aboutSrc : '';
  if (!m.aboutLine && raw) { const sents = raw.match(/[^.!?]+[.!?]+/g) || []; if (sents[1]) m.aboutLine = brief(sents[1].trim(), 200); }
  m.t = voiceCopy(voice, m, m.topic);
  if (!m.sub) m.sub = ({ power: 'Reliable conversion, backup and control for equipment that cannot blink.', iot: 'Modules and devices that connect cleanly and keep reporting.', pcb: 'Design, assembly and testing from one accountable team.', test: 'Instruments and services that turn guesses into readings.', components: 'A broad catalogue with the paperwork to match.', auto: 'Controllers and drives tuned for torque, efficiency and uptime.', rf: 'Wireless and network hardware built for signal integrity.', lighting: 'Efficient fixtures, specified properly and delivered on schedule.', automation: 'Control hardware that keeps lines moving and operators calm.', general: 'Practical electronics, supplied by people who read the datasheet.' })[m.topic];

  // sectors with their own one-liners
  const secNames = industries.length ? industries : cats.length ? cats.slice(0, 6) : GENERIC_SECTORS;
  m.sectors = secNames.map((n, i) => ({ name: n, line: sectorLine(n, i, voice) }));
  m.sectorsAreGeneric = !industries.length && !cats.length;
  m.marquee = [...new Set([...industries, ...cats, ...m.sectors.map(s => s.name)])].slice(0, 10);

  // stats: only what the site says, or counts of what we found
  const stats = (p.stats || []).slice(0, 4).map(s => ({ value: s.value, suffix: s.suffix || '', label: clean(s.label) }));
  const derived = [
    { value: products.filter(x => !x.placeholder).length, suffix: '+', label: 'Products listed' },
    { value: cats.length, suffix: '', label: 'Categories' },
    { value: industries.length, suffix: '', label: 'Industries served' },
    { value: (p.certifications || []).length, suffix: '', label: 'Certifications' }
  ].filter(s => s.value > 0);
  for (const d of derived) { if (stats.length >= 4) break; if (!stats.some(s => s.label === d.label)) stats.push(d); }
  m.stats = stats;

  const c = p.contacts || {};
  Object.assign(m, {
    certs: (p.certifications || []).slice(0, 6), logo: safeUrl(p.logo), favicon: safeUrl(p.favicon),
    email: (c.emails || [])[0] || '', phone: (c.phones || [])[0] || '', address: clean(c.address || ''), social: p.social || {},
    host: p.host || '', site: safeUrl(p.url), agency: opts.agency || '', back: opts.back || '', paused: !!opts.paused,
    theme: opts.theme || 'dark', year: new Date().getFullYear(), placeholders, opts
  });
  return m;
}

/* ---------------- page shell ---------------- */
export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased;overflow-x:hidden;min-width:320px}
img{max-width:100%;display:block}a{color:inherit}button{font:inherit;cursor:pointer;color:inherit}h1,h2,h3,p{overflow-wrap:break-word}
:focus-visible{outline:2px solid var(--brand);outline-offset:3px;border-radius:6px}
.page{display:none}.page.on{display:block;animation:pgin .5s cubic-bezier(.2,.8,.2,1)}@keyframes pgin{from{opacity:0;transform:translate3d(0,12px,0)}}
html.js [data-reveal]{opacity:0;transform:translate3d(0,22px,0);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
html.js [data-reveal="left"]{transform:translate3d(-28px,0,0)}html.js [data-reveal="right"]{transform:translate3d(28px,0,0)}html.js [data-reveal="zoom"]{transform:scale(.96)}
html.js [data-reveal].in{opacity:1;transform:none}
#prog{position:fixed;left:0;top:0;height:3px;width:100%;background:linear-gradient(90deg,var(--brand),var(--brand2));transform-origin:0 50%;transform:scaleX(0);z-index:200;will-change:transform}
.plate{overflow:hidden;position:relative;contain:paint}.plate img{width:100%;height:100%;object-fit:cover}.plate.photo{background:#fff}.plate.photo img{object-fit:contain;padding:6%}
.hide{display:none!important}
html.paused :is(.amb,.amb *){animation-play-state:paused!important}
.wdg-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:var(--fg);color:var(--bg);padding:10px 18px;border-radius:99px;font:600 13px system-ui;opacity:0;pointer-events:none;transition:.3s;z-index:400;max-width:90vw;text-align:center}.wdg-toast.show{opacity:1;transform:translate(-50%,0)}
#wdg-q{position:fixed;inset:0;z-index:300;pointer-events:none}#wdg-q .wq-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;transition:opacity .3s}
#wdg-q .wq-panel{position:absolute;right:0;top:0;bottom:0;width:min(420px,100%);background:var(--bg2,var(--bg));color:var(--fg);border-left:1px solid var(--line);padding:28px 24px;overflow:auto;transform:translateX(102%);transition:transform .45s cubic-bezier(.2,.8,.2,1);font-family:system-ui,sans-serif}
#wdg-q.open{pointer-events:auto}#wdg-q.open .wq-bg{opacity:1}#wdg-q.open .wq-panel{transform:none}
.wq-panel h3{margin:0 0 6px;font-size:24px}.wq-sub{color:var(--muted);margin:0 0 20px;font-size:14px}.wq-x{position:absolute;right:12px;top:8px;background:none;border:0;font-size:32px;line-height:1;width:44px;height:44px}
.wq-list{list-style:none;margin:0 0 20px;padding:0;display:grid;gap:8px}.wq-list li{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);font-size:14px}.wq-list li button{background:none;border:0;font-size:22px;color:var(--muted);width:36px;height:36px}.wq-empty{color:var(--muted)}
.wq-form{display:grid;gap:10px}.wq-form input,.wq-form textarea{width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;font-size:16px}.wq-send{padding:14px;border:0;border-radius:12px;background:var(--brand);color:var(--brand-ink);font-weight:700}.wq-done{color:var(--brand);font-size:14px}
[data-quote-count]{display:none;min-width:20px;height:20px;border-radius:10px;background:var(--brand);color:var(--brand-ink);font:700 11px/20px system-ui;text-align:center;padding:0 5px}[data-quote-count].on{display:inline-block}
.wdg-dock{position:fixed;left:12px;bottom:var(--flag-bottom,12px);z-index:150;display:flex;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 24px)}
.wdg-dock a{font:600 11px/1 system-ui;letter-spacing:.03em;padding:9px 12px;border-radius:99px;background:var(--fg);color:var(--bg);text-decoration:none;opacity:.92;white-space:nowrap}.wdg-dock a:hover{opacity:1}
.menu-btn{display:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--card);place-items:center;padding:0}.menu-btn span{display:block;width:18px;height:2px;background:var(--fg);box-shadow:0 6px 0 var(--fg);transform:translateY(-3px)}
.mnav{position:fixed;inset:0;background:var(--bg);z-index:90;display:none;flex-direction:column;justify-content:center;align-items:center;gap:18px;font-size:32px;font-weight:700;padding:80px 24px 40px;overflow:auto}.mnav a{text-decoration:none;padding:6px 14px}html.menu-open .mnav{display:flex}html.menu-open{overflow:hidden}
.theme-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--card);display:inline-grid;place-items:center;transition:transform .4s cubic-bezier(.2,.8,.2,1);padding:0}.theme-btn:hover{transform:rotate(25deg)}.theme-btn svg{width:20px;height:20px}
:root[data-theme=dark] .i-moon,:root[data-theme=light] .i-sun{display:none}
@media (max-width:860px){.menu-btn{display:inline-grid}.nav-links{display:none!important}.hide-m{display:none!important}}
@media (min-width:861px){.mnav{display:none!important}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}html{scroll-behavior:auto}html.js [data-reveal]{opacity:1;transform:none}}
`;

export function themeVars(m, vars) {
  return ['dark', 'light'].map(t => {
    const tn = tones(m, t);
    const base = { ...vars[t], brand: tn.brand, 'brand-ink': tn.ink, brand2: tn.brand2 };
    return `:root[data-theme="${t}"]{color-scheme:${t};${Object.entries(base).map(([k, v]) => `--${k}:${v}`).join(';')}}`;
  }).join('\n');
}

/**
 * pages: [{id, label, html}] first page is home. Each template supplies header/footer HTML and CSS.
 */
export function shell(m, { tpl, fonts, css, header = '', footer = '', pages, script = '', themeDefault = 'dark', menuLinks = '' }) {
  const labels = Object.fromEntries(pages.map(p => [p.id, p.label]));
  const cfg = { name: m.name, email: m.email, labels, paused: m.paused, t: { send: m.t.send, added: 'Added', qTitle: m.t.navCta === 'RFQ' ? 'RFQ list' : 'Your quote list', qSub: m.t.bandSub } };
  const fav = m.favicon || m.logo;
  const dock = (m.back || m.agency) ? `<div class="wdg-dock">${m.back ? `<a href="${esc(m.back)}">← Back to Design Generator</a>` : ''}${m.agency ? `<a href="#/home" data-go="home">Concept by ${esc(m.agency)}</a>` : ''}</div>` : '';
  return `<!doctype html><html lang="en" data-theme="${themeDefault}" data-tpl="${tpl}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(m.name)} | ${esc(pages[0].label)}</title><meta name="description" content="${esc((m.sub || '').slice(0, 160))}">${fav ? `<link rel="icon" href="${esc(fav)}">` : ''}${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${esc(fonts)}" rel="stylesheet">` : ''}<script>document.documentElement.classList.add('js');window.__WDG=${jsonForScript(cfg)}</script><style>${BASE_CSS}\n${css}</style></head><body><div id="prog"></div>${header}<div class="mnav" data-mobile-nav>${menuLinks}</div><main id="top">${pages.map((p, i) => `<section class="page${i === 0 ? ' on' : ''}" data-page="${esc(p.id)}" aria-label="${esc(p.label)}">${p.html}</section>`).join('')}</main>${footer}${dock}<script>${script}</script><script>(${runtime.toString()})()</script></body></html>`;
}

/* ---------------- tiny markup helpers shared by templates ---------------- */
export const media = (x, cls = '') => `<div class="plate ${x.isPhoto ? 'photo' : 'art'} ${cls}"><img src="${esc(x.src)}" alt="${esc(x.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${x.art}';this.parentNode.classList.remove('photo')"></div>`;
export const logoMark = m => m.logo
  ? `<img class="logo-img" src="${esc(m.logo)}" alt="${esc(m.name)}" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'logo-fallback',textContent:'${esc(m.initials)}'}))">`
  : `<b class="logo-fallback">${esc(m.initials)}</b>`;
export const socialLinks = m => Object.entries(m.social).filter(([, u]) => safeUrl(u)).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)}</a>`).join('');
export const themeBtn = () => `<button class="theme-btn" data-theme-toggle aria-label="Toggle dark or light mode"><svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>`;
export const menuBtn = () => `<button class="menu-btn" data-menu-btn aria-label="Menu"><span></span></button>`;
export const quoteBtn = (label = 'Quote', cls = 'qbtn') => `<button class="${cls}" data-quote-open>${esc(label)} <span data-quote-count>0</span></button>`;
export const goLink = (id, label, cls = '') => `<a href="#/${id}" data-go="${id}"${cls ? ` class="${cls}"` : ''}>${esc(label)}</a>`;
export const navLinks = (pages) => pages.map(([id, label]) => goLink(id, label)).join('');
export const mobileLinks = (pages, m, extra = '') => pages.map(([id, label]) => goLink(id, label)).join('') + extra;

/** Contact form markup shared by all templates (styling comes from each template). */
export const contactForm = m => `<form class="cform" data-contact><label><span>Name</span><input name="n" required autocomplete="name"></label><label><span>Email</span><input name="e" type="email" required autocomplete="email"></label><label class="full"><span>Message</span><textarea name="m" rows="4" required></textarea></label><button class="cbtn" type="submit">${esc(m.t.send)}</button></form><p class="sent" data-sent hidden>Done. Your email app should open with the message ready to send.</p>`;
export const factList = m => [
  m.address && ['Address', m.address], m.email && ['Email', m.email, `mailto:${m.email}`], m.phone && ['Phone', m.phone, `tel:${m.phone.replace(/[^+\d]/g, '')}`], m.host && ['Web', m.host, m.site]
].filter(Boolean);
