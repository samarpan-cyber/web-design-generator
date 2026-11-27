// Facts from a manufacturer's website (electronics, plastic recycling, chemicals): stats, applications served, capabilities,
// standards, process steps, materials, packaging and capacity. Reads only what the page says; anything not found stays empty.
import { clean, trunc } from './util.js';

const STAT = /^(\d[\d,.]*)\s*(\+|%|k\+?|m\+?|x)?\s*(.*)$/i;
const MATERIAL = [['HDPE', /\bhdpe\b/i], ['LDPE', /\bldpe\b/i], ['LLDPE', /\blldpe\b/i], ['PP', /\b(pp|polypropylene)\b/i], ['PET', /\b(pet|r-?pet)\b/i], ['PVC', /\bpvc\b/i], ['ABS', /\babs\b/i], ['PS', /\b(hips|polystyrene)\b/i], ['Nylon', /\b(nylon|pa6)\b/i], ['PC', /\bpolycarbonate\b/i]];
const PACK = /\b(\d{1,3}\s?(?:kg|l|ltr|litre|liter|mt)\s?(?:drum|can|bag|carboy|barrel|jumbo bag|pack)s?|jumbo bags?|drums?|carboys?|iso ?tanks?|ibc|bulk tankers?)\b/i;
const CAP = /(\d[\d,.]*\s?(?:\+)?\s?(?:tpa|tons?|tonnes?|mt|kg)\s?(?:\/|per|a)\s?(?:day|month|year|hour|hr|annum))/i;
const APPS = /industr(y|ies)|sector|appli|we serve|who we serve|markets/i;
const WHAT = /solution|capabilit|service|what we|offer|specialis|expertise|how we|why/i;
const QUAL = /quality|standard|certif|trust|assur|compliance|why (choose|us)|why industry/i;
const METHOD = /step|method|process|how it works|how we work|approach/i;

export function statFromCard(c) {
  const t = clean(c.title), x = clean(c.text); const m = STAT.exec(t); if (!m) return null;
  const value = parseFloat(m[1].replace(/,/g, '')); if (!isFinite(value) || value <= 0 || value > 9999999) return null;
  const rest = clean(m[3]); const label = x && rest ? `${x} (${rest})` : x || rest; if (!label || label.length > 40) return null;
  return { value, suffix: m[2] ? m[2].replace(/k/i, 'K').replace(/m/i, 'M') : '', label };
}

export function extractIndustrial({ text = '', products = [], sections = [], headings = [], nav = [] } = {}) {
  const out = { stats: [], applications: [], capabilities: [], standards: [], steps: [], materials: [], packaging: '', capacity: '', productGroups: [] };
  const cards = sections.filter(s => s.kind === 'cards' || s.kind === 'steps' || s.kind === 'list');
  for (const s of cards) {
    const items = s.kind === 'list' ? (s.bullets || []).map(b => ({ title: b, text: '', image: '' })) : (s.items || []);
    const stats = items.map(statFromCard).filter(Boolean);
    if (stats.length >= 2 && stats.length >= items.length - 1 && !out.stats.length) { out.stats = stats.slice(0, 4); continue; }
    const mapItems = a => items.slice(0, 10).map(i => ({ name: clean(i.title), text: trunc(clean(i.text || ''), 110), image: i.image || '' })).filter(i => i.name && i.name.length < 70).forEach(i => a.push(i));
    if (APPS.test(s.heading) && !out.applications.length) mapItems(out.applications);
    else if (QUAL.test(s.heading) && !out.standards.length) mapItems(out.standards);
    else if ((METHOD.test(s.heading) || s.kind === 'steps') && !out.steps.length) mapItems(out.steps);
    else if (WHAT.test(s.heading) && !out.capabilities.length) mapItems(out.capabilities);
  }
  out.materials = MATERIAL.filter(([, re]) => re.test(text)).map(([n]) => n).slice(0, 6);
  const pk = PACK.exec(text); if (pk) out.packaging = clean(pk[1]); const cp = CAP.exec(text); if (cp) out.capacity = clean(cp[1]);
  // product groups: the first few uppercase or short category cards when the site names them
  out.productGroups = [...new Set(nav.map(n => clean(n.label)).filter(l => l.length > 3 && l.length < 40 && /chemical|machine|extrud|shred|grind|wash|plant|inhibitor|polish|granul|agglomer|mixer|crusher|compound|resin|additive/i.test(l)))].slice(0, 10);
  return out;
}
