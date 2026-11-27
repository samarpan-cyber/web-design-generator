// Fallback photography for prospects whose own site has few or small photos. Real media always comes first;
// these fill only the gaps. Files live in /stock (about 150 KB each, progressive JPEG), photos from Pexels (see stock/LICENSE.txt).
const COUNT = { dentists: 10, doctors: 8, electronics: 9 };
const POOLS = { 'realestate-res': 12, 'realestate-com': 9, 'realestate-land': 4 };
const REAL = { residential: ['res'], luxury: ['res'], commercial: ['com'], plots: ['land', 'res'], mixed: ['res', 'com'] };
export const stockIndustries = [...Object.keys(COUNT), 'realestate'];

function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }

/** A deterministic, site specific order of stock photos so two prospects in one industry do not look identical. */
export function stockPhotos(industry, seed = '', base = '/stock/', segment = '') {
  const b = /\/$/.test(base) ? base : base + '/';
  let entries = [];
  if (industry === 'realestate') { for (const g of REAL[segment] || ['res', 'com']) for (let k = 1; k <= POOLS['realestate-' + g]; k++) entries.push(`realestate-${g}-${k}`); }
  else if (COUNT[industry]) entries = Array.from({ length: COUNT[industry] }, (_, i) => `${industry}-${i + 1}`);
  if (!entries.length) return [];
  let s = hash(industry + segment + seed) || 1;
  for (let i = entries.length - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [entries[i], entries[j]] = [entries[j], entries[i]]; }
  return entries.map(e => ({ src: `${b}${e}-l.jpg`, small: `${b}${e}-s.jpg`, isStock: true }));
}
/** Is a scraped image big enough to be shown full width? Unknown size is trusted, known small sizes are not. */
export const goodPhoto = i => !!i && !!i.src && !(i.w && i.w < 640) && !/logo|icon|avatar|favicon|badge|flag|sprite/i.test(i.src + ' ' + (i.alt || ''));
