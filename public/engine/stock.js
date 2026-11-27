// Fallback photography for prospects whose own site has few or small photos. Real media always comes first;
// these fill only the gaps. Files live in /stock (about 150 KB each, progressive JPEG), photos from Pexels (see stock/LICENSE.txt).
const COUNT = { dentists: 10, doctors: 8, electronics: 15, recycling: 8, process: 7, chemicals: 6 };
const POOLS = { 'realestate-res': 12, 'realestate-com': 9, 'realestate-land': 4 };
// process-6 (refinery) and process-7 (welding) suit chemicals and metal work, not recycling lines
const PROC = { recycling: [3, 4, 5, 1, 2], chemicals: [1, 2, 3, 4, 5, 6, 7] };
const REAL = { residential: ['res'], luxury: ['res'], commercial: ['com'], plots: ['land', 'res'], mixed: ['res', 'com'] };
// which pools an industry draws from, first pool first (the first photos, used for heroes, come from it)
const MULTI = (industry, segment) => {
  if (industry === 'recycling') return segment === 'machinery' ? ['process', 'recycling'] : ['recycling', 'process'];
  if (industry === 'chemicals') return segment === 'distributor' ? ['chemicals'] : ['chemicals', 'process'];
  return [industry];
};
export const stockIndustries = [...Object.keys(COUNT).filter(k => k !== 'process'), 'realestate'];

function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function shuffled(arr, seed) { const a = arr.slice(); let s = hash(seed) || 1; for (let i = a.length - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** A deterministic, site specific order of stock photos so two prospects in one industry do not look identical. */
export function stockPhotos(industry, seed = '', base = '/stock/', segment = '') {
  const b = /\/$/.test(base) ? base : base + '/';
  let entries = [];
  if (industry === 'realestate') {
    const names = []; for (const g of REAL[segment] || ['res', 'com']) for (let k = 1; k <= POOLS['realestate-' + g]; k++) names.push(`realestate-${g}-${k}`);
    entries = shuffled(names, industry + segment + seed);
  } else {
    for (const pool of MULTI(industry, segment)) { if (!COUNT[pool]) continue; const idx = pool === 'process' && PROC[industry] ? PROC[industry] : Array.from({ length: COUNT[pool] }, (_, i) => i + 1); entries.push(...shuffled(idx.map(i => `${pool}-${i}`), pool + seed)); }
  }
  return entries.map(e => ({ src: `${b}${e}-l.jpg`, small: `${b}${e}-s.jpg`, isStock: true }));
}
/** Is a scraped image big enough to be shown full width? Unknown size is trusted, known small sizes are not. */
export const goodPhoto = i => !!i && !!i.src && !(i.w && i.w < 640) && !/logo|icon|avatar|favicon|badge|flag|sprite/i.test(i.src + ' ' + (i.alt || ''));
