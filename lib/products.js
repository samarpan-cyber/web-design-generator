// Product discovery. Layers, cheapest and most reliable first, all inside one time budget:
//   1. platform APIs (Shopify products.json, WooCommerce store API, WordPress product posts)
//   2. product cards on the home page and on listing pages found via menu and links
//   3. pagination and category pages of those listings
//   4. sitemap product URLs
//   5. product detail pages to fill in missing images, names and descriptions
import { clean, trunc, abs, pickSrc, JUNK_IMG, PRODUCT_WORDS, jsonLd, cleanTitle, titleCase, pool, load } from './util.js';

const BAD_NAME = /^(read more|learn more|view (all|more|details)|click here|know more|more|details|enquire|enquiry|contact|buy now|shop now|add to cart|add to quote|get a quote|submit|download|quick view|compare|wishlist|sale|new|home|products?|categories|search|menu|login|register|cart|checkout|my account)$/i;
const BAD_START = /^(latest news|current updates?|new launch(es)?|news( ?(&|and) ?events?)?|events?|updates?|announcements?|press|blog|careers?|gallery|testimonials?|offers?|sitemap|disclaimer|privacy|terms|read more|learn more|view (all|more))\b/i;
const key = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

export function cleanName(raw) {
  let n = clean(raw)
    .replace(/(?:₹|rs\.?|inr|usd|\$|€|£)\s?[\d,.]+(?:\s?\/?-?)?/gi, '')
    .replace(/\b(sku|model|part no\.?|code)\s*[:#]?\s*[\w-]+$/i, '')
    .replace(/\b(add to cart|add to quote|read more|learn more|view details|enquire now|buy now|quick view)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  n = n.replace(/^[\W_]+|[\W_]+$/g, '').trim();
  return n;
}

function acceptable(name) {
  return name.length >= 3 && name.length <= 80 && !BAD_NAME.test(name) && !BAD_START.test(name) && /[a-z]/i.test(name);
}

/* ---------------- page-level extraction ---------------- */
export function extractProducts($, base, ld = []) {
  const out = []; const seen = new Set();
  const push = (p, weight = 0) => {
    const name = cleanName(p.name || '');
    if (!acceptable(name)) return;
    const k = key(name); if (seen.has(k)) return; seen.add(k);
    out.push({ name, image: p.image || null, url: p.url || null, description: p.description ? trunc(clean(p.description), 160) : '', weight });
  };
  // 1) schema.org Product / ItemList
  for (const n of ld) {
    const types = [].concat(n['@type'] || []);
    if (types.includes('Product') && n.name) {
      const img = [].concat(n.image || [])[0];
      push({ name: n.name, image: abs(typeof img === 'string' ? img : img && img.url, base), url: abs(n.url, base), description: n.description }, 5);
    }
  }
  // 2) known e-commerce card containers
  const CARD = 'li.product, .product, .product-item, .product-card, .product-box, .product-block, .product-thumb, .product-layout, .product-grid-item, .product-miniature, .item.product, .grid-product, .grid__item .card, .card--product, .collection-product, .woocommerce-loop-product__link, [class*="product-item" i], [class*="product_item" i], [class*="productItem" i], [class*="product-list" i] > li, [class*="products-grid" i] > div';
  $(CARD).each((_, el) => {
    const $el = $(el);
    if ($el.closest('header, nav, footer, .menu, .widget, .sidebar').length) return;
    const name = $el.find('.woocommerce-loop-product__title, .product-title, .product-name, .card__heading, [class*="product-title" i], [class*="product-name" i], h2, h3, h4, h5, .title, [class*="title" i], [class*="name" i]').first().text() || $el.find('a[title]').first().attr('title') || $el.find('img').first().attr('alt');
    const img = pickSrc($el.find('img').first(), base);
    push({ name, image: img && !JUNK_IMG.test(img) ? img : null, url: abs($el.find('a').first().attr('href'), base), description: $el.find('.short-description, .product-excerpt, p').first().text() }, 4);
  });
  // 3) link cards (image + short heading); product-looking URLs and product-like sections score higher
  const cards = [];
  $('a[href]').each((_, a) => {
    const $a = $(a);
    if ($a.closest('header, nav, footer, .nav, .menu, .breadcrumb, .widget_nav_menu, .pagination').length) return;
    const href = abs($a.attr('href'), base); if (!href) return;
    const $img = $a.find('img').first();
    const heading = clean($a.find('h2,h3,h4,h5,h6,.title,strong,figcaption,[class*="title" i],[class*="name" i]').first().text());
    const text = heading || clean($img.attr('alt') || '') || (clean($a.text()).length <= 60 ? clean($a.text()) : '');
    const urlish = /\/(products?|product-category|categor(?:y|ies)|collections?|item|items|shop|catalog(?:ue)?|p|equipment|series|range|solutions?)\/[^/?#]+/i.test(href);
    if (!$img.length && !heading && !urlish) return;
    if (!text || text.length < 3 || text.length > 70) return;
    const src = $img.length ? pickSrc($img, base) : null;
    if (src && JUNK_IMG.test(src)) return;
    let score = 0;
    if (src) score += 3;
    if (urlish) score += 3;
    if (heading) score += 1;
    const ctx = ($a.attr('class') || '') + ' ' + ($a.parent().attr('class') || '') + ' ' + ($a.closest('section,div[id]').attr('id') || '') + ' ' + ($a.closest('section,div[class]').attr('class') || '');
    if (PRODUCT_WORDS.test(ctx)) score += 3;
    if (/(blog|news|post|career|event|privacy|terms|about|contact|login|account|cart|checkout|wishlist|tag|author|feed)\b/i.test(href)) score -= 6;
    cards.push({ name: text, image: src, url: href, score });
  });
  cards.filter(c => c.score >= 4).sort((a, b) => b.score - a.score).forEach(c => push(c, 2));
  // 4) heading + image blocks (feature columns), only when we found little
  if (out.length < 6) {
    $('main h3, section h3, .container h3, #content h3, h4').each((_, h) => {
      const $h = $(h); const name = clean($h.text());
      const $blk = $h.closest('div, li, article');
      const img = pickSrc($blk.find('img').first(), base);
      if (img && !JUNK_IMG.test(img) && name.length >= 4 && name.length <= 60) push({ name, image: img, url: abs($blk.find('a').first().attr('href'), base), description: $blk.find('p').first().text() }, 1);
    });
  }
  return out;
}

/** Same-origin links that probably lead to a product or category listing. */
export function listingLinks($, base) {
  const origin = new URL(base).origin; const seen = new Set(); const out = [];
  $('a[href]').each((_, a) => {
    const $a = $(a); const href = abs($a.attr('href'), base); if (!href) return;
    let u; try { u = new URL(href); } catch { return; }
    if (u.origin !== origin) return;
    const path = u.pathname.replace(/\/+$/, '');
    if (!path || path === new URL(base).pathname.replace(/\/+$/, '')) return;
    const label = clean($a.text()) || clean($a.find('img').attr('alt') || '');
    const hit = /\/(products?|product-category|categor(?:y|ies)|collections?|catalog(?:ue)?|shop|solutions?|range|portfolio|equipment|series|items?)(\/|$)/i.test(path) || PRODUCT_WORDS.test(label);
    if (!hit || /\.(pdf|jpg|png|zip)$/i.test(path) || /(blog|news|career|privacy|terms|login|account|cart|checkout|wishlist|feed|tag|author|contact|about)/i.test(path)) return;
    if (u.search && /[?&](orderby|sort|filter|min_price|max_price|add-to-cart)=/i.test(u.search)) return;
    const k = u.origin + path; if (seen.has(k)) return; seen.add(k);
    out.push({ href: u.origin + path + (u.search && /[?&](page|paged)=/.test(u.search) ? u.search : ''), label: label.slice(0, 40), depth: path.split('/').filter(Boolean).length });
  });
  return out;
}

export function paginationLinks($, base) {
  const out = new Set(); const baseU = new URL(base);
  const add = h => { const a = abs(h, base); if (!a) return; try { const u = new URL(a); if (u.origin === baseU.origin && u.href !== baseU.href) out.add(u.href); } catch { /* ignore */ } };
  $('link[rel="next"], a[rel="next"]').each((_, e) => add($(e).attr('href')));
  $('.pagination a, .page-numbers a, .pager a, ul.page-numbers a, nav[aria-label*="pagination" i] a, a.next, .next a, [class*="pagination" i] a').each((_, e) => {
    const h = $(e).attr('href') || ''; if (/page[=/]\d|paged=\d|\/page\/\d|p=\d/i.test(h)) add(h);
  });
  return [...out].slice(0, 6);
}

/* ---------------- platform APIs ---------------- */
async function getJson(fetcher, url, timeout) { const r = await fetcher(url, { timeout, maxBytes: 3_000_000 }); const t = r.text.trim(); if (!/^[\[{]/.test(t)) throw new Error('not json'); return JSON.parse(t); }
const stripHtml = h => clean(String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, "'"));

async function viaShopify(origin, fetcher, t) {
  const j = await getJson(fetcher, origin + '/products.json?limit=250', t);
  return (j.products || []).map(p => ({ name: p.title, url: origin + '/products/' + p.handle, image: p.images && p.images[0] ? p.images[0].src : null, description: stripHtml(p.body_html), weight: 6 }));
}
async function viaWoo(origin, fetcher, t) {
  const j = await getJson(fetcher, origin + '/wp-json/wc/store/v1/products?per_page=100', t);
  return (Array.isArray(j) ? j : []).map(p => ({ name: stripHtml(p.name), url: p.permalink, image: p.images && p.images[0] ? p.images[0].src : null, description: stripHtml(p.short_description || p.description), weight: 6 }));
}
async function viaWpProducts(origin, fetcher, t) {
  const j = await getJson(fetcher, origin + '/wp-json/wp/v2/product?per_page=100&_embed=wp:featuredmedia', t);
  return (Array.isArray(j) ? j : []).map(p => ({ name: stripHtml(p.title && p.title.rendered), url: p.link, image: p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0] ? p._embedded['wp:featuredmedia'][0].source_url : null, description: stripHtml(p.excerpt && p.excerpt.rendered), weight: 5 }));
}

/* ---------------- sitemap ---------------- */
async function viaSitemap(origin, fetcher, t) {
  const get = async u => (await fetcher(u, { timeout: t, maxBytes: 2_500_000 })).text;
  let xml = ''; for (const p of ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']) { try { xml = await get(origin + p); if (/<(urlset|sitemapindex)/i.test(xml)) break; } catch { /* next */ } }
  if (!xml) return [];
  const locs = x => [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1].replace(/&amp;/g, '&'));
  let urls = [];
  if (/<sitemapindex/i.test(xml)) {
    const kids = locs(xml).filter(u => /product|shop|catalog|item/i.test(u) && !/categor|tag/i.test(u)).slice(0, 3);
    for (const k of kids) { try { urls.push(...locs(await get(k))); } catch { /* skip */ } }
  } else urls = locs(xml);
  const seen = new Set();
  return urls.filter(u => { try { return new URL(u).origin === origin; } catch { return false; } })
    .filter(u => /\/(products?|item|items|shop|catalog(?:ue)?)\/[^/]+\/?$/i.test(u) && !/categor|tag|page\/\d/i.test(u))
    .filter(u => !seen.has(u) && seen.add(u)).slice(0, 60)
    .map(u => ({ name: titleCase(decodeURIComponent(u.replace(/\/+$/, '').split('/').pop()).replace(/\.\w+$/, '')), url: u, image: null, description: '', weight: 1, needsDetail: true }));
}

/* ---------------- detail pages ---------------- */
function readDetail(html, url) {
  const $ = load(html); const ld = jsonLd($);
  const lp = ld.find(n => [].concat(n['@type'] || []).includes('Product'));
  const og = p => clean($(`meta[property="${p}"]`).attr('content') || '');
  const name = cleanTitle((lp && lp.name) || og('og:title') || $('h1').first().text() || $('title').text());
  let image = abs(og('og:image'), url) || (lp && abs([].concat(lp.image || [])[0] && ([].concat(lp.image)[0].url || [].concat(lp.image)[0]), url));
  if (!image) { const i = $('main img, .product img, #content img').toArray().map(e => pickSrc($(e), url)).find(s => s && !JUNK_IMG.test(s) && !/\.(svg|gif)(\?|$)/i.test(s)); image = i || null; }
  const description = clean((lp && lp.description) || og('og:description') || $('meta[name="description"]').attr('content') || $('main p, .product p').first().text());
  return { name, image, description };
}

/* ---------------- orchestrator ---------------- */
export async function collectProducts({ $, base, ld, nav, navCats, homeProducts, html, fetcher, deadline, notes }) {
  const origin = new URL(base).origin;
  const left = () => deadline - Date.now();
  const to = (max) => Math.max(1200, Math.min(max, left() - 300));
  const byKey = new Map(); const order = [];
  const merge = (list, src) => {
    let added = 0;
    for (const p of list || []) {
      const name = cleanName(p.name || ''); if (!acceptable(name)) continue;
      const k = key(name); const cur = byKey.get(k);
      if (!cur) { byKey.set(k, { ...p, name, src }); order.push(k); added++; }
      else { if (!cur.image && p.image) cur.image = p.image; if (!cur.description && p.description) cur.description = p.description; if (!cur.url && p.url) cur.url = p.url; cur.weight = Math.max(cur.weight || 0, p.weight || 0); }
    }
    return added;
  };
  merge(homeProducts, 'home');

  // 1) platform APIs
  const hints = { shopify: /cdn\.shopify\.com|Shopify\./i.test(html), wp: /wp-content|wp-json|wordpress/i.test(html), woo: /woocommerce/i.test(html) };
  const apis = [];
  if (hints.shopify) apis.push(['Shopify catalogue', viaShopify]);
  if (hints.woo || hints.wp) apis.push(['WooCommerce catalogue', viaWoo]);
  if (hints.wp) apis.push(['WordPress products', viaWpProducts]);
  if (apis.length && left() > 2500) {
    const got = await Promise.all(apis.map(([label, fn]) => fn(origin, fetcher, to(6000)).then(l => ({ label, l })).catch(() => null)));
    for (const g of got.filter(Boolean)) if (g.l.length && merge(g.l, 'api')) notes.push(`Read the ${g.label}`);
  }

  // 2) listing pages: menu, categories, links on the home page
  const apiRich = byKey.size >= 12;
  if (!apiRich && left() > 3000) {
    const seen = new Set([base.split('#')[0]]); const cands = [];
    const add = (href, label, pri) => { if (!href) return; const k = href.split('#')[0]; if (seen.has(k)) return; seen.add(k); cands.push({ href: k, label, pri }); };
    nav.filter(n => /product|catalog|solution|range|portfolio|shop|module|device|equipment|machine|component|categor/i.test(n.label)).forEach(n => add(n.href, n.label, 0));
    navCats.forEach(c => add(c.url, c.name, 1));
    listingLinks($, base).forEach(l => add(l.href, l.label, 2 + Math.min(l.depth, 3)));
    nav.filter(n => !/^(about|contact|news|blog|career|login|team|home|faq|gallery)/i.test(n.label)).forEach(n => add(n.href, n.label, 6));
    cands.sort((a, b) => a.pri - b.pri);
    const sameOrigin = c => { try { return new URL(c.href).origin === origin; } catch { return false; } };
    const first = cands.filter(sameOrigin).slice(0, 10);
    const pages = []; // [{url, html}]
    const fetchPage = async c => { if (left() < 1500) return null; const r = await fetcher(c.href, { timeout: to(7000) }); return { c, r }; };
    const wave1 = (await pool(first, 6, fetchPage)).filter(Boolean);
    const extra = [];
    for (const w of wave1) {
      const $p = load(w.r.text); const found = extractProducts($p, w.r.url, jsonLd(load(w.r.text)));
      const n = merge(found, 'listing'); if (n) notes.push(`Read "${w.c.label || 'listing'}" page`);
      pages.push({ $p, url: w.r.url, n: found.length });
      paginationLinks($p, w.r.url).forEach(u => extra.push({ href: u, label: 'page', pri: 0 }));
      if (found.length < 4) listingLinks($p, w.r.url).slice(0, 4).forEach(l => { if (!seen.has(l.href)) { seen.add(l.href); extra.push({ href: l.href, label: l.label, pri: 1 }); } });
    }
    // 3) pagination and category children
    const wave2 = (await pool(extra.filter(sameOrigin).filter(e => !seen.has(e.href) || e.label === 'page').slice(0, 12), 6, fetchPage)).filter(Boolean);
    for (const w of wave2) { const f = extractProducts(load(w.r.text), w.r.url, jsonLd(load(w.r.text))); merge(f, 'listing2'); }
    if (wave2.length) notes.push(`Followed ${wave2.length} more listing pages`);
  }

  // 4) sitemap, only when still thin
  if (byKey.size < 12 && left() > 3500) {
    const sm = await viaSitemap(origin, fetcher, to(5000)).catch(() => []);
    if (sm.length && merge(sm, 'sitemap')) notes.push('Found product pages in the sitemap');
  }

  // 5) detail pages for anything missing an image or a real name
  const needs = order.map(k => byKey.get(k)).filter(p => p.url && (!p.image || p.needsDetail)).slice(0, 24);
  if (needs.length && left() > 2500) {
    await pool(needs, 6, async p => {
      if (left() < 1200) return;
      const r = await fetcher(p.url, { timeout: to(5000) });
      const d = readDetail(r.text, r.url);
      if (p.needsDetail && d.name && acceptable(cleanName(d.name))) p.name = cleanName(d.name);
      if (!p.image && d.image) p.image = d.image;
      if (!p.description && d.description) p.description = trunc(d.description, 160);
      delete p.needsDetail;
    });
  }

  // final: re-key (names may have been improved), drop weak sitemap-only entries without enrichment if we have real ones
  const finalMap = new Map();
  for (const k of order) { const p = byKey.get(k); const kk = key(p.name); if (!finalMap.has(kk)) finalMap.set(kk, p); }
  let list = [...finalMap.values()];
  const strong = list.filter(p => (p.weight || 0) >= 2);
  if (strong.length >= 6) list = list.filter(p => (p.weight || 0) >= 2 || p.image);
  return list.slice(0, 60).map(({ name, image, url, description }) => ({ name, image: image || null, url: url || null, description: description || '' }));
}
