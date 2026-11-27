// Small shared helpers for the extractor modules.
import * as cheerio from 'cheerio';

export const clean = s => (s || '').replace(/\s+/g, ' ').replace(/[​ ]/g, ' ').trim();
export const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

export const abs = (href, base) => {
  if (!href) return null;
  href = href.trim();
  if (/^(javascript:|mailto:|tel:|#|data:)/i.test(href)) return null;
  try { const u = new URL(href, base); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; }
};

export function pickSrc($el, base) {
  const attrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'data-image', 'src'];
  for (const a of attrs) {
    const v = $el.attr(a);
    if (v && !v.startsWith('data:')) return abs(v, base);
  }
  const ss = $el.attr('data-srcset') || $el.attr('srcset');
  if (ss) {
    const parts = ss.split(',').map(p => p.trim().split(/\s+/)).filter(p => p[0]);
    if (parts.length) {
      parts.sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0));
      return abs(parts[0][0], base);
    }
  }
  return null;
}

export const JUNK_IMG = /(sprite|pixel|spacer|blank|loader|loading|placeholder|tracking|facebook|twitter|linkedin|instagram|youtube|whatsapp|arrow|icon-|\/icons?\/|favicon|gravatar|captcha|emoji|flag|star-|rating|payment|visa|mastercard)/i;
export const PRODUCT_WORDS = /(product|catalog|catalogue|categor|solution|range|portfolio|shop|item|series|equipment|machine|component|service|offering)/i;

export function jsonLd($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text());
      const walk = n => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { out.push(n); if (n['@graph']) walk(n['@graph']); if (n.itemListElement) walk(n.itemListElement); if (n.item) walk(n.item); } };
      walk(j);
    } catch { /* ignore malformed */ }
  });
  return out;
}

/** Strip " | Brand" or " - Brand" suffixes from page titles. */
export function titleCase(s) { return s.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).trim(); }
export function cleanTitle(t) {
  t = clean(t);
  const parts = t.split(/\s+[|–—•·]\s+|\s+-\s+/).map(clean).filter(Boolean);
  return (parts[0] && parts[0].length >= 3 ? parts[0] : t).slice(0, 90);
}

/** Run fn over items with limited concurrency. */
export async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch { out[k] = null; } }
  }));
  return out;
}

export const load = html => cheerio.load(html);
