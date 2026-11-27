import { renderNoir } from './t1-noir.js';
import { renderBento } from './t2-bento.js';
import { renderBlueprint } from './t3-blueprint.js';
import { renderAurora } from './t4-aurora.js';
import { renderKinetic } from './t5-kinetic.js';
import { CLASSIC_VARIANTS, renderClassic } from './t6-classic.js';

const modern = [
  { id: 'noir', family: 'modern', defaultTheme: 'dark', name: 'Circuit Noir', tagline: 'Dark tech. Live circuit canvas. Ctrl K search.', best: 'Chips, power and embedded', render: renderNoir },
  { id: 'bento', family: 'modern', defaultTheme: 'light', name: 'Bento Lab', tagline: 'Warm, editorial, serif. Bento tiles and masonry.', best: 'Friendly B2B and distributors', render: renderBento },
  { id: 'blueprint', family: 'modern', defaultTheme: 'dark', name: 'Blueprint', tagline: 'Engineering sheet. Table catalogue and RFQ form.', best: 'Test gear and custom engineering', render: renderBlueprint },
  { id: 'aurora', family: 'modern', defaultTheme: 'dark', name: 'Aurora Glass', tagline: 'Soft futurism. Bottom dock and pinned story.', best: 'IoT, wireless and modern brands', render: renderAurora },
  { id: 'kinetic', family: 'modern', defaultTheme: 'light', name: 'Kinetic', tagline: 'Loud editorial type. Full-screen menu.', best: 'Bold brands that want attention', render: renderKinetic }
];
const classic = CLASSIC_VARIANTS.map((v, i) => ({ id: v.id, family: 'classic', defaultTheme: 'light', name: v.name, tagline: v.tagline, best: v.best, render: (p, o) => renderClassic(i, p, o) }));

/** Every design the generator knows. Add a template here and it joins the pool. */
export const LIBRARY = [...modern, ...classic];
export const getTemplate = id => LIBRARY.find(t => t.id === id);

function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Pick five: 3 modern + 2 classic by default. `round` gives a different set for the same site (shuffle). */
export function pickSet(profile = {}, round = 0, { modern: nm = 3, classic: nc = 2, allow = null } = {}) {
  const r = rng(hash((profile.host || profile.name || 'site') + ':' + round));
  const m = shuffle(LIBRARY.filter(t => t.family === 'modern' && (!allow || allow.includes(t.id))), r).slice(0, nm);
  const c = shuffle(LIBRARY.filter(t => t.family === 'classic' && (!allow || allow.includes(t.id))), r).slice(0, nc);
  return [...c.slice(0, 1), ...m, ...c.slice(1)];
}

/** The active set the UI works with. Mutated in place so existing references stay valid. */
export const TEMPLATES = [];
export function setSet(list) { TEMPLATES.splice(0, TEMPLATES.length, ...list); return TEMPLATES; }
setSet(pickSet({}, 0));
