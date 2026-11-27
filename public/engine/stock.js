// Fallback photography for prospects whose own site has few or small photos. Real media always comes first;
// these fill only the gaps. Files live in /stock (about 130 KB each, progressive JPEG), photos from Pexels (see stock/LICENSE.txt).
const COUNT = { dentists: 10, doctors: 8, electronics: 9 };
export const stockIndustries = Object.keys(COUNT);

function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }

/** A deterministic, site specific order of stock photos so two prospects in one industry do not look identical. */
export function stockPhotos(industry, seed = '', base = '/stock/') {
  const n = COUNT[industry]; if (!n) return [];
  const b = /\/$/.test(base) ? base : base + '/';
  const order = Array.from({ length: n }, (_, i) => i + 1); let s = hash(industry + seed) || 1;
  for (let i = order.length - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order.map(k => ({ src: `${b}${industry}-${k}-l.jpg`, small: `${b}${industry}-${k}-s.jpg`, isStock: true }));
}
/** Is a scraped image big enough to be shown full width? Unknown size is trusted, known small sizes are not. */
export const goodPhoto = i => !!i && !!i.src && !(i.w && i.w < 640) && !/logo|icon|avatar|favicon|badge|flag|sprite/i.test(i.src + ' ' + (i.alt || ''));
