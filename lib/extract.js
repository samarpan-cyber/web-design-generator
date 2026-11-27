// Turns a live website into a normalized "profile" that every design template renders.
import * as cheerio from 'cheerio';
import { fetchText } from './fetcher.js';
import { parseColor, isBrandy, hexToHsl } from './colors.js';
import { clean, trunc, abs, pickSrc, JUNK_IMG, PRODUCT_WORDS, jsonLd } from './util.js';
import { extractProducts, collectProducts } from './products.js';
import { extractSections, extractHero } from './sections.js';

export function normalizeUrl(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Enter a website address');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  const u = new URL(s);
  if (!u.hostname.includes('.')) throw new Error('That does not look like a website address');
  return u.href;
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
  return list.slice(0, 48);
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

function navAllLinks($, base) {
  const seen = new Set(); const out = [];
  $('header a, nav a, .menu a, .navbar a, #menu a, .main-menu a').each((_, a) => {
    const label = clean($(a).text()); const href = abs($(a).attr('href'), base);
    if (!label || label.length < 3 || label.length > 44 || !href) return;
    const k = href.split('#')[0]; if (seen.has(k)) return; seen.add(k); out.push({ label, href: k });
  });
  return out.slice(0, 50);
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

export async function extractProfile(inputUrl, { hint = '', fetcher = fetchText, budgetMs = 18000 } = {}) {
  const startedAt = Date.now(); const deadline = startedAt + budgetMs;
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
  const homeProducts = extractProducts(cheerio.load(rawHtml), base, ld);
  const images = extractImages(cheerio.load(rawHtml), base);
  const contacts = extractContacts(cheerio.load(rawHtml), pg.text, ld, base);
  const sections = extractSections(cheerio.load(rawHtml), base);
  const hero = extractHero(cheerio.load(rawHtml), base);

  const notes = []; const diag = [];
  const GENERIC_NAV = /^(about|contact|news|blog|career|login|team|meet|privacy|terms|faq|support|gallery|events?|media|investors?|pricing|ai|home|projects?|downloads?|resources?|partners?|clients?|testimonials?|careers?|get in touch|enquiry|inquiry)\b/i;
  let products = [];
  try {
    products = await collectProducts({ $, base, ld, nav, navAll: navAllLinks($, base), navCats, homeProducts, html: rawHtml, fetcher, deadline, notes, diag });
  } catch { products = homeProducts; }
  if (products.length < 3) {
    const menu = nav.filter(n => !GENERIC_NAV.test(n.label) && !/^(products?|industries|services?|solutions?)$/i.test(n.label)).slice(0, 8);
    const have = new Set(products.map(p => p.name.toLowerCase()));
    const fill = (navCats.length ? navCats.map(c => ({ label: c.name, href: c.url })) : menu).filter(m => !have.has(m.label.toLowerCase()));
    if (fill.length) { fill.slice(0, 8 - products.length).forEach(m => products.push({ name: m.label, image: null, url: m.href || null, description: '' })); notes.push('Products inferred from menu'); }
  }
  if (products.filter(p => !p.inferred).length < 4) {
    // no product grid: a home-page cards section that is clearly about what they make or sell is the next best thing
    const strong = /manufactur|products?|devices?|solutions?|offerings?|our (range|services|expertise)|capabilit|categor|equipment|what we (make|sell|offer|build|supply)/i;
    const score = h => (/manufactur|product|device|equipment|what we (make|sell|build|supply)/i.test(h) ? 2 : strong.test(h) ? 1 : 0);
    const pools = sections.filter(sec => (sec.kind === 'cards' || sec.kind === 'steps') && sec.items.length >= 3 && score(sec.heading) > 0).sort((a, b) => score(b.heading) - score(a.heading));
    const have = new Set(products.map(p => p.name.toLowerCase()));
    const picked = pools[0] ? pools[0].items.filter(i => !have.has(i.title.toLowerCase())) : [];
    if (picked.length >= 3) {
      const rest = products.filter(p => !picked.some(i => i.title.toLowerCase() === p.name.toLowerCase()));
      products = [...picked.map(i => ({ name: i.title, image: i.image, url: i.url, description: i.text })), ...rest].slice(0, 30);
      notes.push(`Products taken from the "${pools[0].heading}" section`);
    }
  }
  products.forEach(p => { if (p.image) images.push({ src: p.image, alt: p.name }); });

  const cats = navCats.map(c => c.name);
  const stats = extractStats(pg.text);
  const profile = {
    url: base, host: new URL(base).hostname.replace(/^www\./, ''), name, hintName: hint || '',
    tagline: pg.h1 && pg.h1.length > 8 && pg.h1.length < 110 ? pg.h1 : (pg.desc ? trunc(pg.desc, 90) : ''),
    description: (pg.desc && !CONTACTY_RE.test(pg.desc) ? pg.desc : '') || pg.about || '',
    about: pg.about, logo, favicon, ogImage: pg.ogImage,
    colors, nav, categories: cats, products, images,
    headings: pg.headings, stats, certifications: pg.certs, industries: pg.industries,
    contacts, social, sections, hero, title: clean($('title').first().text()),
    lang: ($0('html').attr('lang') || 'en').slice(0, 2),
    notes
  };
  const placeholders = Math.max(0, 6 - profile.products.length);
  profile.meta = {
    extractedAt: new Date().toISOString(),
    found: { products: profile.products.length, sections: sections.length, images: images.length, categories: cats.length, nav: nav.length, logo: !!logo, brandColor: !!colors.primary, stats: stats.length, contact: contacts.emails.length + contacts.phones.length },
    placeholders, diag: diag.slice(0, 14), ms: Date.now() - startedAt
  };
  return profile;
}

export { profileFromPage, extractProducts };
