import { renderNoir } from './t1-noir.js';
import { renderBento } from './t2-bento.js';
import { renderBlueprint } from './t3-blueprint.js';
import { renderAurora } from './t4-aurora.js';
import { renderKinetic } from './t5-kinetic.js';
import { CLASSIC_VARIANTS, renderClassic } from './t6-classic.js';
import { CLINIC_VARIANTS, renderClinic } from './t7-clinic.js';
import { ESTATE_VARIANTS, renderEstate } from './t8-estate.js';
import { INDUSTRIES, detectIndustry, industryName, SEGMENTS, ROLES } from './industry.js';

const E = ['electronics'], H = ['dentists', 'doctors'];
const modern = [
  { id: 'noir', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Circuit Noir', tagline: 'Dark tech. Live circuit canvas. Ctrl K search.', best: 'Chips, power and embedded', segments: { manufacturer: 2, distributor: 1, brand: 1 }, render: (p, o) => renderNoir(p, { photoSeed: 'noir', ...o }) },
  { id: 'bento', industries: E, family: 'modern', defaultTheme: 'light', name: 'Bento Lab', tagline: 'Warm, editorial, serif. Bento tiles and masonry.', best: 'Friendly B2B and distributors', segments: { distributor: 2, brand: 2, manufacturer: 1 }, render: (p, o) => renderBento(p, { photoSeed: 'bento', ...o }) },
  { id: 'blueprint', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Blueprint', tagline: 'Engineering sheet. Table catalogue and RFQ form.', best: 'Test gear and custom engineering', segments: { manufacturer: 3, distributor: 1, brand: 0.6 }, render: (p, o) => renderBlueprint(p, { photoSeed: 'blueprint', ...o }) },
  { id: 'aurora', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Aurora Glass', tagline: 'Soft futurism. Bottom dock and pinned story.', best: 'IoT, wireless and modern brands', segments: { brand: 2.5, manufacturer: 1, distributor: 0.8 }, render: (p, o) => renderAurora(p, { photoSeed: 'aurora', ...o }) },
  { id: 'kinetic', industries: E, family: 'modern', defaultTheme: 'light', name: 'Kinetic', tagline: 'Loud editorial type. Full-screen menu.', best: 'Bold brands that want attention', segments: { brand: 3, distributor: 1, manufacturer: 0.6 }, render: (p, o) => renderKinetic(p, { photoSeed: 'kinetic', ...o }) }
];
const CLASSIC_SEG = { 'classic-corporate': { manufacturer: 2, distributor: 2, brand: 1 }, 'classic-industrial': { manufacturer: 3, distributor: 1, brand: 0.5 }, 'classic-catalog': { distributor: 3, brand: 1.5, manufacturer: 0.8 }, 'classic-modern': { brand: 2, distributor: 1.5, manufacturer: 1 } };
const CLINIC_SEG = {
  'clinic-serene': { wellness: 3, solo: 2, clinic: 2, hospital: 0.5, general: 2, cosmetic: 2.5, kids: 1.5, ortho: 1, implants: 1 },
  'clinic-bright': { clinic: 2, kids: 3, cosmetic: 2.5, general: 2.5, ortho: 2, implants: 1.2, wellness: 1, solo: 1, hospital: 0.7 },
  'clinic-specialist': { solo: 3, hospital: 1.2, clinic: 1.2, implants: 3, ortho: 2.5, cosmetic: 1.5, general: 1, wellness: 0.5, kids: 0.5 },
  'clinic-pulse': { hospital: 3, clinic: 1.5, implants: 2, ortho: 1.5, general: 1.2, solo: 1, wellness: 0.6, kids: 0.6, cosmetic: 0.8 },
  'clinic-family': { clinic: 3, general: 3, kids: 2, solo: 1.5, hospital: 1.2, wellness: 1, cosmetic: 1, ortho: 1, implants: 1 },
  'clinic-dentalcare': { general: 3, ortho: 2.5, implants: 2, cosmetic: 2, kids: 2, clinic: 2, solo: 1, hospital: 0.6, wellness: 0.5 },
  'clinic-medcenter': { hospital: 3, clinic: 2, general: 1.5, solo: 0.8, wellness: 0.6, ortho: 1, implants: 1, cosmetic: 0.6, kids: 1 },
  'clinic-wellness': { wellness: 3.5, cosmetic: 2.5, clinic: 1.2, solo: 1.5, general: 1, kids: 1, hospital: 0.3, ortho: 0.5, implants: 0.5 }
};
const classic = CLASSIC_VARIANTS.map((v, i) => ({ id: v.id, segments: CLASSIC_SEG[v.id], industries: E, family: 'classic', defaultTheme: 'light', lightOnly: true, name: v.name, tagline: v.tagline, best: v.best, render: (p, o) => renderClassic(i, p, { photoSeed: v.id, ...o }) }));
const clinic = CLINIC_VARIANTS.map((v, i) => ({ id: v.id, segments: CLINIC_SEG[v.id], industries: H, family: v.family, defaultTheme: 'light', lightOnly: true, name: v.name, tagline: v.tagline, best: v.best, render: (p, o) => renderClinic(i, p, { photoSeed: v.id, ...o }) }));

const estate = ESTATE_VARIANTS.map((v, i) => ({ id: v.id, industries: ['realestate'], family: v.family, defaultTheme: v.theme, lightOnly: true, name: v.name, tagline: v.tagline, best: v.best, segments: v.segments, roles: v.roles, render: (p, o) => renderEstate(i, p, { photoSeed: v.id, ...o }) }));

/** Every design the generator knows. Add a template here and it joins the pool for its industries. */
export const LIBRARY = [...modern, ...classic, ...clinic, ...estate];
export const getTemplate = id => LIBRARY.find(t => t.id === id);
export { INDUSTRIES, detectIndustry, industryName, SEGMENTS, ROLES };

function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Weighted pick without replacement: a template that suits the segment is far more likely, but never certain, so Shuffle still varies. */
function weighted(list, weights, n, r) {
  const pool = list.map((t, i) => ({ t, w: Math.pow(Math.max(0.05, weights[i]), 2) })); const out = [];
  while (out.length < n && pool.length) { const tot = pool.reduce((a, x) => a + x.w, 0); let x = r() * tot, k = 0; for (; k < pool.length - 1; k++) { x -= pool[k].w; if (x <= 0) break; } out.push(pool.splice(k, 1)[0].t); }
  return out;
}

/** Pick five for the industry and kind of business: 3 creative + 2 plain WordPress style by default.
 *  `segment` (for example commercial, plots, kids, hospital, brand) and `role` (developer or agency) steer which designs are favoured.
 *  `round` gives another set for the same site. */
export function pickSet(profile = {}, round = 0, { modern: nm = 3, classic: nc = 2, allow = null, industry = '', segment = '', role = '' } = {}) {
  const ind = industry || profile.industry || 'electronics'; const info = profile.industryInfo || {};
  const seg = segment || info.segment || ''; const rol = role || info.role || '';
  const r = rng(hash((profile.host || profile.name || 'site') + ':' + ind + ':' + round));
  const ok = t => t.industries.includes(ind) && (!allow || allow.includes(t.id));
  const wt = t => ((t.segments && seg && t.segments[seg] !== undefined) ? t.segments[seg] : 1) * ((t.roles && rol && t.roles[rol] !== undefined) ? t.roles[rol] : 1);
  const pool = fam => LIBRARY.filter(t => t.family === fam && ok(t));
  const mp = pool('modern'), cp = pool('classic');
  const m = weighted(mp, mp.map(wt), nm, r), c = weighted(cp, cp.map(wt), nc, r);
  const out = [...c.slice(0, 1), ...m, ...c.slice(1)];
  if (out.length < 5) for (const t of LIBRARY) if (out.length < 5 && ok(t) && !out.includes(t)) out.push(t);
  return out;
}

/** The active set the UI works with. Mutated in place so existing references stay valid. */
export const TEMPLATES = [];
export function setSet(list) { TEMPLATES.splice(0, TEMPLATES.length, ...list); return TEMPLATES; }
setSet(pickSet({}, 0));
