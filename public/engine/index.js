import { renderNoir } from './t1-noir.js';
import { renderBento } from './t2-bento.js';
import { renderBlueprint } from './t3-blueprint.js';
import { renderAurora } from './t4-aurora.js';
import { renderKinetic } from './t5-kinetic.js';
import { CLASSIC_VARIANTS, renderClassic } from './t6-classic.js';
import { CLINIC_VARIANTS, renderClinic } from './t7-clinic.js';
import { INDUSTRIES, detectIndustry, industryName } from './industry.js';

const E = ['electronics'], H = ['dentists', 'doctors'];
const modern = [
  { id: 'noir', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Circuit Noir', tagline: 'Dark tech. Live circuit canvas. Ctrl K search.', best: 'Chips, power and embedded', render: renderNoir },
  { id: 'bento', industries: E, family: 'modern', defaultTheme: 'light', name: 'Bento Lab', tagline: 'Warm, editorial, serif. Bento tiles and masonry.', best: 'Friendly B2B and distributors', render: renderBento },
  { id: 'blueprint', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Blueprint', tagline: 'Engineering sheet. Table catalogue and RFQ form.', best: 'Test gear and custom engineering', render: renderBlueprint },
  { id: 'aurora', industries: E, family: 'modern', defaultTheme: 'dark', name: 'Aurora Glass', tagline: 'Soft futurism. Bottom dock and pinned story.', best: 'IoT, wireless and modern brands', render: renderAurora },
  { id: 'kinetic', industries: E, family: 'modern', defaultTheme: 'light', name: 'Kinetic', tagline: 'Loud editorial type. Full-screen menu.', best: 'Bold brands that want attention', render: renderKinetic }
];
const classic = CLASSIC_VARIANTS.map((v, i) => ({ id: v.id, industries: E, family: 'classic', defaultTheme: 'light', lightOnly: true, name: v.name, tagline: v.tagline, best: v.best, render: (p, o) => renderClassic(i, p, o) }));
const clinic = CLINIC_VARIANTS.map((v, i) => ({ id: v.id, industries: H, family: v.family, defaultTheme: 'light', lightOnly: true, name: v.name, tagline: v.tagline, best: v.best, render: (p, o) => renderClinic(i, p, o) }));

/** Every design the generator knows. Add a template here and it joins the pool for its industries. */
export const LIBRARY = [...modern, ...classic, ...clinic];
export const getTemplate = id => LIBRARY.find(t => t.id === id);
export { INDUSTRIES, detectIndustry, industryName };

function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Pick five for the industry: 3 creative + 2 plain WordPress style by default. `round` gives another set for the same site. */
export function pickSet(profile = {}, round = 0, { modern: nm = 3, classic: nc = 2, allow = null, industry = '' } = {}) {
  const ind = industry || profile.industry || 'electronics';
  const r = rng(hash((profile.host || profile.name || 'site') + ':' + ind + ':' + round));
  const ok = t => t.industries.includes(ind) && (!allow || allow.includes(t.id));
  const m = shuffle(LIBRARY.filter(t => t.family === 'modern' && ok(t)), r).slice(0, nm);
  const c = shuffle(LIBRARY.filter(t => t.family === 'classic' && ok(t)), r).slice(0, nc);
  const out = [...c.slice(0, 1), ...m, ...c.slice(1)];
  if (out.length < 5) for (const t of LIBRARY) if (out.length < 5 && ok(t) && !out.includes(t)) out.push(t);
  return out;
}

/** The active set the UI works with. Mutated in place so existing references stay valid. */
export const TEMPLATES = [];
export function setSet(list) { TEMPLATES.splice(0, TEMPLATES.length, ...list); return TEMPLATES; }
setSet(pickSet({}, 0));
