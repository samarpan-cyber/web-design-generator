// Turns a live website into a normalized "profile" that every design template renders.
import * as cheerio from 'cheerio';
import { fetchText } from './fetcher.js';
import { parseColor, isBrandy, hexToHsl } from './colors.js';

const clean = s => (s || '').replace(/\s+/g, ' ').replace(/[​ ]/g, ' ').trim();
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

export function normalizeUrl(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Enter a website address');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  const u = new URL(s);
  if (!u.hostname.includes('.')) throw new Error('That does not look like a website address');
  return u.href;
}

const abs = (href, base) => {
  if (!href) return null;
  href = href.trim();
  if (/^(javascript:|mailto:|tel:|#|data:)/i.test(href)) return null;
  try { const u = new URL(href, base); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; }
};

function pickSrc($el, base) {
  const attrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'src'];
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

const JUNK_IMG = /(sprite|pixel|spacer|blank|loader|loading|placeholder|tracking|facebook|twitter|linkedin|instagram|youtube|whatsapp|arrow|icon-|\/icons?\/|favicon|gravatar|captcha|emoji|flag|star-|rating|payment|visa|mastercard)/i;
const PRODUCT_WORDS = /(product|catalog|catalogue|categor|solution|range|portfolio|shop|item|series|equipment|machine|component|service|offering)/i;

function jsonLd($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text());
      const walk = n => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { out.push(n); if (n['@graph']) walk(n['@graph']); } };
      walk(j);
    } catch { /* ignore malformed */ }
  });
  return out;
}

function guessName($, url, hint, ld) {
  const org = ld.find(n => /Organization|LocalBusiness|Corporation/.test([].concat(n['@type'] || []).join(',')) && n.name);
  const cands = [
    $('meta[property="og:site_name"]').attr('content'),
    org && org.name,
    $('meta[name="application-name"]').attr('content'),
  ].map(clean).filter(Boolean);
  if (hint) return clean(hint);
  if (cands.length) return trunc(cands[0], 48);
  const title = clean($('title').first().text());
  const parts = title.split(/\s[|\-–—•·:]\s|\s[|\-–—•·]\s?/).map(clean).filter(Boolean);
  const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0].toLowerCase();
  const byHost = parts.find(p => p.toLowerCase().replace(/[^a-z0-9]/g, '').includes(host.replace(/[^a-z0-9]/g, '')));
  if (byHost) return trunc(byHost, 48);
  if (parts.length) return trunc([...parts].sort((a, b) => a.length - b.length)[0], 48);
  return host.charAt(0).toUpperCase() + host.slice(1);
}

function findLogo($, base, ld) {
  const org = ld.find(n => n.logo);
  if (org) {
    const l = typeof org.logo === 'string' ? org.logo : org.logo.url || org.logo['@id'];
    const a = abs(l, base); if (a && !/\.svg(\?|$)/i.test(a)) return a; // svg ok too, keep below
    if (a) return a;
  }
  let best = null, score = -1;
  $('header img, nav img, .header img, #header img, .navbar img, .logo img, img[class*="logo" i], img[id*="logo" i], img[alt*="logo" i], img[src*="logo" i], a[class*="logo" i] img, [class*="brand" i] img').each((i, el) => {
    const $el = $(el); const src = pickSrc($el, base); if (!src) return;
    let s = 10 - Math.min(i, 8);
    const sig = ($el.attr('class') || '') + ($el.attr('id') || '') + ($el.attr('alt') || '') + src;
    if (/logo/i.test(sig)) s += 20;
    if (/(menu|search|cart|arrow|icon|banner|slider|hero)/i.test(sig)) s -= 15;
    if (s > score) { score = s; best = src; }
  });
  return best;
}

function navLinks($, base) {
  const seen = new Set(); const items = [];
  const roots = $('header nav, nav, .navbar, #menu, .main-menu, .menu, header ul').toArray();
  for (const root of roots.slice(0, 3)) {
    $(root).find('a').each((_, a) => {
      const label = clean($(a).text());
      const href = abs($(a).attr('href'), base);
      if (!label || label.length > 26 || label.length < 2 || !href) return;
      const key = label.toLowerCase();
      if (seen.has(key) || /^(home|login|sign in|register|search|menu|cart|skip)/i.test(label)) return;
      seen.add(key); items.push({ label, href });
    });
    if (items.length >= 4) break;
  }
  return items.slice(0, 12);
}

function extractProducts($, base, ld) {
  const out = []; const seen = new Set();
  const push = p => {
    const name = clean(p.name);
    if (!name || name.length < 3 || name.length > 80) return;
    if (/^(read more|learn more|view (all|more)|click here|know more|more|details|enquire|contact|buy now|shop now|get a quote|submit|download)/i.test(name)) return;
    if (/^(latest news|current updates?|new launch(es)?|news( ?(&|and) ?events?)?|events?|updates?|announcements?|press|blog|careers?|gallery|testimonials?|offers?|login|register|sitemap|disclaimer|privacy|terms)\b/i.test(name)) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return; seen.add(key);
    out.push({ name, image: p.image || null, url: p.url || null, description: p.description ? trunc(clean(p.description), 140) : '' });
  };
  // 1) schema.org Product / ItemList
  for (const n of ld) {
    const types = [].concat(n['@type'] || []);
    if (types.includes('Product') && n.name) {
      const img = [].concat(n.image || [])[0];
      push({ name: n.name, image: abs(typeof img === 'string' ? img : img && img.url, base), url: abs(n.url, base), description: n.description });
    }
  }
  // 2) WooCommerce / common e-commerce cards
  $('li.product, .product-item, .product-card, .product-box, .product-grid-item, .woocommerce-loop-product__link, [class*="product-item" i], [class*="product_item" i]').each((_, el) => {
    const $el = $(el);
    const name = $el.find('.woocommerce-loop-product__title, h2, h3, h4, .product-title, .title, [class*="title" i], [class*="name" i]').first().text() || $el.find('a').first().attr('title') || $el.find('img').first().attr('alt');
    const img = pickSrc($el.find('img').first(), base);
    push({ name, image: img && !JUNK_IMG.test(img) ? img : null, url: abs($el.find('a').first().attr('href'), base), description: $el.find('p').first().text() });
  });
  // 3) generic: link-cards (image + short heading) preferably inside product-like sections
  const cards = [];
  $('a').each((_, a) => {
    const $a = $(a);
    if ($a.closest('header, nav, footer, .nav, .menu').length) return;
    const $img = $a.find('img').first();
    const text = clean($a.find('h2,h3,h4,h5,h6,.title,strong,figcaption').first().text()) || clean($a.text());
    if (!$img.length && !$a.find('h3,h4,h5').length) return;
    if (!text || text.length < 3 || text.length > 70) return;
    const href = abs($a.attr('href'), base); if (!href) return;
    const src = $img.length ? pickSrc($img, base) : null;
    if (src && JUNK_IMG.test(src)) return;
    let score = 0;
    if (src) score += 3;
    const ctx = ($a.attr('class') || '') + ' ' + ($a.parent().attr('class') || '') + ' ' + ($a.closest('section,div[id]').attr('id') || '') + ' ' + ($a.closest('section,div[class]').attr('class') || '') + ' ' + href;
    if (PRODUCT_WORDS.test(ctx)) score += 4;
    if (/(blog|news|post|career|event|privacy|terms|about|contact)/i.test(href)) score -= 5;
    cards.push({ name: text, image: src, url: href, score, description: '' });
  });
  cards.filter(c => c.score >= 3).sort((a, b) => b.score - a.score).forEach(push);
  // 4) heading + image blocks (feature / grid columns)
  if (out.length < 6) {
    $('main h3, section h3, .container h3, #content h3, h4').each((_, h) => {
      const $h = $(h); const name = clean($h.text());
      const $blk = $h.closest('div, li, article');
      const img = pickSrc($blk.find('img').first(), base);
      if (img && !JUNK_IMG.test(img) && name.length >= 4 && name.length <= 60) {
        push({ name, image: img, url: abs($blk.find('a').first().attr('href'), base), description: $blk.find('p').first().text() });
      }
    });
  }
  return out;
}

function extractImages($, base) {
  const list = []; const seen = new Set();
  $('img').each((_, el) => {
    const $el = $(el); const src = pickSrc($el, base);
    if (!src || JUNK_IMG.test(src) || seen.has(src)) return;
    if (/\.(svg|gif)(\?|$)/i.test(src)) return;
    const w = parseInt($el.attr('width') || '0', 10), h = parseInt($el.attr('height') || '0', 10);
    if ((w && w < 120) || (h && h < 80)) return;
    seen.add(src);
    list.push({ src, alt: clean($el.attr('alt') || '') });
  });
  return list.slice(0, 30);
}

const CONTACTY_RE = /(phone|fax|mobile|e-?mail|@|\+\d{2}|\d{6,})/i;
const STATS_RE = /(\d{1,3}(?:[,.]\d{3})*|\d+(?:\.\d+)?)\s?(\+|k\+?|m\+?|%)?\s+(years?|clients?|customers?|products?|projects?|countries|engineers|employees|installations|patents?|partners?|dealers?|distributors?|cities|states|branches|offices|brands)/gi;

function extractStats(text) {
  const out = []; const seen = new Set(); let m;
  while ((m = STATS_RE.exec(text)) && out.length < 4) {
    const raw = m[1].replace(/,/g, ''); const val = parseFloat(raw);
    if (!isFinite(val) || val <= 0 || val > 9_999_999) continue;
    const label = m[3].toLowerCase().replace(/s$/, '');
    if (seen.has(label)) continue; seen.add(label);
    out.push({ value: val, suffix: m[2] ? m[2].replace(/[kK]/, 'K').replace(/m/i, 'M') : '+', label: label.charAt(0).toUpperCase() + label.slice(1) + 's' });
  }
  return out;
}

const CERTS = ['ISO 9001', 'ISO 14001', 'ISO 13485', 'ISO 45001', 'IATF 16949', 'AS9100', 'CE', 'RoHS', 'REACH', 'UL', 'BIS', 'NABL', 'IPC-A-610', 'ATEX', 'IECEx', 'FCC', 'MSME', 'Make in India', 'ESD'];
const INDUSTRIES = {
  Automotive: /automotive|vehicle|\bEV\b|electric vehicle|e-mobility/i, Medical: /medical|healthcare|diagnostic|hospital/i,
  'Industrial Automation': /automation|\bPLC\b|industrial|scada|factory/i, 'IoT & Smart Devices': /\bIoT\b|internet of things|smart (home|city|device)|sensor/i,
  'Power & Energy': /power|energy|solar|inverter|battery|\bUPS\b|transformer/i, Telecom: /telecom|5g|network|rf\b|antenna|wireless/i,
  'Aerospace & Defence': /defen[cs]e|aerospace|military|avionics/i, 'Embedded & Semiconductor': /semiconductor|embedded|\bMCU\b|\bSoC\b|firmware|chip|fpga|asic/i,
  'PCB & EMS': /\bPCB\b|\bSMT\b|\bEMS\b|assembly|printed circuit|contract manufactur/i, 'Test & Measurement': /test equipment|measurement|oscilloscope|calibrat|instrument/i,
  Lighting: /\bLED\b|lighting|luminaire/i, Components: /component|connector|capacitor|resistor|relay|switch|cable/i
};

const CMS_DEFAULTS = new Set(['#007cba', '#3858e9', '#2ea2cc', '#0693e3', '#fcb900', '#ff6900', '#7bdcb5', '#00d084', '#8ed1fc', '#abb8c3', '#eb144c', '#f78da7', '#9b51e0', '#cf2e2e', '#0073aa', '#00a0d2', '#007bff', '#0d6efd', '#6610f2', '#6f42c1', '#e83e8c', '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8', '#3498db', '#2271b1', '#135e96', '#0085ba', '#6200ee', '#3700b3', '#03dac6', '#ff0266', '#1e73be', '#61ce70', '#6ec1e4', '#93003c']);
function extractColors($, cssTexts, html) {
  const votes = new Map(); const add = (hex, w) => { hex = parseColor(hex); if (hex) votes.set(hex, (votes.get(hex) || 0) + w); };
  const theme = $('meta[name="theme-color"]').attr('content'); if (theme) add(theme, 25);
  const tile = $('meta[name="msapplication-TileColor"]').attr('content'); if (tile) add(tile, 12);
  const all = cssTexts.join('\n') + '\n' + $('style').filter((_, e) => !/global-styles|wp-block|classic-theme|woocommerce|elementor-frontend|bootstrap/i.test(($(e).attr('id') || '') + ($(e).attr('class') || ''))).map((_, e) => $(e).html()).get().join('\n');
  const varRe = /--([\w-]*(?:primary|brand|accent|main|theme|highlight)[\w-]*)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/gi; let m;
  while ((m = varRe.exec(all))) add(m[2], /primary|brand/.test(m[1]) ? 40 : 20);
  const hexRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi; let c = 0;
  while ((m = hexRe.exec(all)) && c++ < 6000) { const h = parseColor('#' + m[1]); if (h && isBrandy(h)) votes.set(h, (votes.get(h) || 0) + 1); }
  const inline = html.match(/(?:background(?:-color)?|color|fill)\s*:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi) || [];
  inline.forEach(s => add(s.split(':')[1], 2));
  const brandy = [...votes.entries()].filter(([h]) => isBrandy(h) && !CMS_DEFAULTS.has(h)).sort((a, b) => b[1] - a[1]);
  const primary = brandy[0] ? brandy[0][0] : null;
  let secondary = null;
  if (primary) { const [ph] = hexToHsl(primary); const alt = brandy.find(([h]) => { const d = Math.abs(hexToHsl(h)[0] - ph); return Math.min(d, 360 - d) > 35; }); secondary = alt ? alt[0] : null; }
  return { primary, secondary };
}

function extractContacts($, text, ld, base) {
  const emails = new Set(); const phones = new Set();
  $('a[href^="mailto:"]').each((_, a) => { const e = ($(a).attr('href') || '').replace(/^mailto:/i, '').split('?')[0].trim(); if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) emails.add(e.toLowerCase()); });
  (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).forEach(e => { if (!/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)) emails.add(e.toLowerCase()); });
  $('a[href^="tel:"]').each((_, a) => { const p = clean(($(a).attr('href') || '').replace(/^tel:/i, '')); if (p.replace(/\D/g, '').length >= 8) phones.add(decodeURIComponent(p)); });
  let address = '';
  const org = ld.find(n => n.address);
  if (org) { const a = org.address; address = typeof a === 'string' ? a : [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry && (a.addressCountry.name || a.addressCountry)].filter(Boolean).join(', '); }
  if (!address) address = clean($('address').first().text());
  if (!address) { const m = $('footer').text().match(/(?:address|reg(?:istered)? office|head ?office)\s*[:\-–]?\s*([^|]{15,160})/i); if (m) address = clean(m[1]); }
  return { emails: [...emails].slice(0, 3), phones: [...phones].slice(0, 3), address: trunc(address, 160) };
}

function extractSocial($, base) {
  const out = {};
  $('a[href]').each((_, a) => {
    const h = $(a).attr('href') || '';
    for (const [k, re] of Object.entries({ linkedin: /linkedin\.com\/(company|in|school)/i, facebook: /facebook\.com\//i, twitter: /(twitter|x)\.com\/[^/?]+/i, instagram: /instagram\.com\//i, youtube: /youtube\.com\/(channel|c|user|@)/i, whatsapp: /(wa\.me|api\.whatsapp\.com)/i })) {
      if (!out[k] && re.test(h) && !/share|intent|sharer/i.test(h)) out[k] = abs(h, base);
    }
  });
  return out;
}

function extractNavCategories($, base) {
  // submenu entries under a "Products"-like parent
  const cats = []; const seen = new Set();
  $('nav li, header li, .menu li').each((_, li) => {
    const $li = $(li); const parent = clean($li.children('a').first().text());
    if (!PRODUCT_WORDS.test(parent)) return;
    $li.find('ul a, .sub-menu a, .dropdown-menu a').each((__, a) => {
      const name = clean($(a).text()); const key = name.toLowerCase();
      if (name.length >= 3 && name.length <= 40 && !seen.has(key)) { seen.add(key); cats.push({ name, url: abs($(a).attr('href'), base) }); }
    });
  });
  return cats.slice(0, 16);
}

async function loadCss($, base, fetcher) {
  const links = $('link[rel="stylesheet"]').map((_, e) => abs($(e).attr('href'), base)).get().filter(Boolean)
    .filter(h => !/fonts\.googleapis|fontawesome|font-awesome|bootstrap|animate|swiper|slick|owl|aos|cdnjs|jsdelivr|unpkg|wp-includes|block-library|\/plugins\/|elementor\/assets|woocommerce|wp-admin|gutenberg/i.test(h)).slice(0, 3);
  const texts = await Promise.all(links.map(l => fetcher(l, { timeout: 6000, maxBytes: 600_000 }).then(r => r.text).catch(() => '')));
  return texts;
}

function profileFromPage(html, url, hint) {
  const $ = cheerio.load(html);
  const ld = jsonLd($);
  $('script, noscript, style, svg').remove();
  const text = clean($('body').text());
  const ogImage = abs($('meta[property="og:image"]').attr('content'), url);
  const desc = clean($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '');
  const h1 = clean($('h1').first().text());
  const headings = [];
  $('h2').each((_, h) => { const t = clean($(h).text()); if (t.length > 3 && t.length < 90 && !headings.includes(t)) headings.push(t); });
  let about = '';
  const CONTACTY = /(phone|tel\b|fax|mobile|e-?mail|address|@|\bpin\b|\+\d{2}|\d{5,}|all rights reserved|©)/i;
  const sentencey = t => /[.!?]$/.test(t) || (t.match(/[a-z]{3,}\s/gi) || []).length > 12;
  $('p').each((_, p) => { const t = clean($(p).text()); if (!about && t.length > 90 && t.length < 600 && !/cookie|privacy|copyright/i.test(t) && !CONTACTY.test(t) && sentencey(t)) about = t; });
  const industries = Object.entries(INDUSTRIES).filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, 6);
  const certs = CERTS.filter(c => new RegExp('(^|[^A-Za-z])' + c.replace(/ /g, '[ -]?') + '([^A-Za-z]|$)', c === 'CE' || c === 'UL' ? '' : 'i').test(text)).slice(0, 6);
  return { $, ld, text, ogImage, desc, h1, headings: headings.slice(0, 8), about, industries, certs, url, hint };
}

export async function extractProfile(inputUrl, { hint = '', fetcher = fetchText } = {}) {
  const url = normalizeUrl(inputUrl);
  const page = await fetcher(url);
  const base = page.url;
  const rawHtml = page.text;
  const $0 = cheerio.load(rawHtml);
  const cssTexts = await loadCss($0, base, fetcher);

  const $ = cheerio.load(rawHtml);
  const ld = jsonLd($);
  const name = guessName($, base, hint, ld);
  const logo = findLogo($, base, ld);
  const nav = navLinks($, base);
  const navCats = extractNavCategories($, base);
  const favicon = abs($('link[rel~="icon"], link[rel="apple-touch-icon"]').first().attr('href'), base) || new URL('/favicon.ico', base).href;
  const colors = extractColors($0, cssTexts, rawHtml);
  const social = extractSocial($, base);
  const pg = profileFromPage(rawHtml, base, hint);
  let products = extractProducts(cheerio.load(rawHtml), base, ld);
  const images = extractImages(cheerio.load(rawHtml), base);
  const contacts = extractContacts(cheerio.load(rawHtml), pg.text, ld, base);

  // crawl a few more menu pages when the home page shows few products
  const notes = [];
  const GENERIC_NAV = /^(about|contact|news|blog|career|login|team|meet|privacy|terms|faq|support|gallery|events?|media|investors?|pricing|ai|home|projects?|downloads?|resources?|partners?|clients?|testimonials?|careers?|get in touch|enquiry|inquiry)\b/i;
  const strip = h => h.replace(/#.*/, '');
  const sameOrigin = n => { try { return new URL(n.href).origin === new URL(base).origin; } catch { return false; } };
  if (products.length < 6) {
    const cands = nav.filter(n => sameOrigin(n) && strip(n.href) !== strip(base));
    const prodLike = cands.filter(n => /product|catalog|solution|range|portfolio|shop|module|device|equipment|machine|component/i.test(n.label));
    const rest = cands.filter(n => !GENERIC_NAV.test(n.label) && !prodLike.includes(n));
    const hops = [...prodLike, ...rest].slice(0, 3);
    const got = await Promise.all(hops.map(h => fetcher(h.href, { timeout: 7000 }).then(r => ({ h, r })).catch(() => null)));
    for (const g of got.filter(Boolean)) {
      const $h = cheerio.load(g.r.text);
      const more = extractProducts($h, g.r.url, jsonLd(cheerio.load(g.r.text)));
      const have = new Set(products.map(p => p.name.toLowerCase()));
      more.forEach(p => { if (!have.has(p.name.toLowerCase())) { have.add(p.name.toLowerCase()); products.push(p); } });
      extractImages(cheerio.load(g.r.text), g.r.url).forEach(i => { if (!images.some(x => x.src === i.src)) images.push(i); });
      notes.push(`Also read "${g.h.label}" page`);
    }
  }
  products = products.slice(0, 16);
  if (products.length < 3) {
    const menu = nav.filter(n => !GENERIC_NAV.test(n.label) && !/^(products?|industries|services?|solutions?)$/i.test(n.label)).slice(0, 8);
    const have = new Set(products.map(p => p.name.toLowerCase()));
    const fill = (navCats.length ? navCats.map(c => ({ label: c.name, href: c.url })) : menu).filter(m => !have.has(m.label.toLowerCase()));
    if (fill.length) { fill.slice(0, 8 - products.length).forEach(m => products.push({ name: m.label, image: null, url: m.href || null, description: '' })); notes.push('Products inferred from menu'); }
  }

  const cats = navCats.map(c => c.name);
  const stats = extractStats(pg.text);
  const profile = {
    url: base, host: new URL(base).hostname.replace(/^www\./, ''), name, hintName: hint || '',
    tagline: pg.h1 && pg.h1.length > 8 && pg.h1.length < 110 ? pg.h1 : (pg.desc ? trunc(pg.desc, 90) : ''),
    description: (pg.desc && !CONTACTY_RE.test(pg.desc) ? pg.desc : '') || pg.about || '',
    about: pg.about, logo, favicon, ogImage: pg.ogImage,
    colors, nav, categories: cats, products, images,
    headings: pg.headings, stats, certifications: pg.certs, industries: pg.industries,
    contacts, social, title: clean($('title').first().text()),
    lang: ($0('html').attr('lang') || 'en').slice(0, 2),
    notes
  };
  const placeholders = Math.max(0, 6 - profile.products.length);
  profile.meta = {
    extractedAt: new Date().toISOString(),
    found: { products: profile.products.length, images: images.length, categories: cats.length, nav: nav.length, logo: !!logo, brandColor: !!colors.primary, stats: stats.length, contact: contacts.emails.length + contacts.phones.length },
    placeholders
  };
  return profile;
}

export { profileFromPage, extractProducts };
