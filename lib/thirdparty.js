// Extra content sources. A prospect's own website is not always the best (or any) source of real content, so a design can also
// be fed from: a second website (their old or current site), a directory or marketplace listing (Practo, Justdial, IndiaMART,
// TradeIndia, Sulekha, Lybrate, Google Business pages and similar), pasted page source, and photos given by link.
// Everything is read by the same generic extractor (structured data, headings, cards, contacts), then merged into one profile.
// Nothing is invented: a field is filled from a source only when that source actually contained it.
import * as cheerio from 'cheerio';
import { extractProfile, normalizeUrl } from './extract.js';
import { fetchText } from './fetcher.js';
import { detectIndustry } from './industry.js';
import { clean, trunc, jsonLd } from './util.js';

const KINDS = [
  [/practo\.com|lybrate\.com|1mg\.com|credihealth|docprime|healthgrades|zocdoc/i, 'doctor directory'],
  [/justdial\.com|sulekha\.com|yellowpages|yelp\.com|asklaila|grotal|hotfrog/i, 'business directory'],
  [/indiamart\.com|tradeindia\.com|exportersindia\.com|alibaba\.com|made-in-china|globalsources|ec21\.com|thomasnet/i, 'supplier marketplace'],
  [/99acres|magicbricks|housing\.com|nobroker|commonfloor|squareyards|propertywala/i, 'property portal'],
  [/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|g\.page|goo\.gl\/maps/i, 'google business page'],
  [/linkedin\.com|facebook\.com|instagram\.com/i, 'social page']
];
export const sourceKind = url => { for (const [re, k] of KINDS) if (re.test(String(url))) return k; return 'website'; };

const digits = s => String(s || '').replace(/\D/g, '');
const goodImg = u => typeof u === 'string' && (/^https?:\/\//i.test(u) || /^data:image\/(png|jpe?g|webp);base64,/i.test(u));
export const cleanPhotoList = list => [...new Set((Array.isArray(list) ? list : String(list || '').split(/\s+/)).map(x => String(x || '').trim()).filter(goodImg))].slice(0, 12);

/** Facts that directories print as "Label: value" pairs. Only facts we can state exactly are kept. */
export function directoryFacts(html) {
  const $ = cheerio.load(html); $('script,style,noscript').remove(); const out = {};
  const rows = [];
  $('tr').each((_, tr) => { const c = $(tr).children('td,th').toArray().map(x => clean($(x).text())); if (c.length === 2) rows.push(c); });
  $('li,p,div').each((_, el) => { if ($(el).children().length > 2) return; const m = clean($(el).text()).match(/^([A-Za-z ]{4,40})\s*[:\-]\s*(.{2,80})$/); if (m) rows.push([m[1], m[2]]); });
  for (const [k, v] of rows) {
    if (/year of (establishment|incorporation)|established( in)?$|^since$/i.test(k) && /^(19|20)\d\d$/.test(v.trim())) out.established = Number(v.trim());
    else if (/nature of business|business type/i.test(k) && v.length < 70 && !out.nature) out.nature = v;
    else if (/^(specialit(y|ies)|specialization)$/i.test(k) && v.length < 100 && !out.specialty) out.specialty = v;
    else if (/^(experience)$/i.test(k) && /\d+\s*(\+|years?)/i.test(v) && !out.experience) out.experience = v;
  }
  return out;
}

/** Structured data of a listing, in the shape the profile uses. */
export function listingFromHtml(html, url) {
  const $ = cheerio.load(html); const ld0 = jsonLd($); const ld = [...ld0, ...ld0.flatMap(n => [].concat(n.employee || [], n.member || [], n.founder || [], n.provider || []).filter(x => x && typeof x === 'object'))];
  const out = { name: '', description: '', phones: [], emails: [], address: '', rating: null, hours: [], reviews: [], images: [], social: {}, products: [], doctors: [], facts: directoryFacts(html), kind: sourceKind(url) };
  const str = v => clean(typeof v === 'string' ? v : v && (v.name || v['@id'] || '') || '');
  for (const n of ld) {
    const types = [].concat(n['@type'] || []).join(',');
    if (/Product|Offer\b/i.test(types) && n.name) out.products.push({ name: trunc(str(n.name), 70), description: trunc(clean(n.description || ''), 140), image: goodImg([].concat(n.image || [])[0]) ? [].concat(n.image)[0] : '', url: '' });
    if (/LocalBusiness|Organization|Dentist|Physician|MedicalBusiness|MedicalClinic|Hospital|Store|Corporation|ProfessionalService|RealEstateAgent|Person|HomeAndConstruction|Manufacturer/i.test(types)) {
      if (!out.name && n.name) out.name = trunc(str(n.name), 80);
      if (!out.description && n.description) out.description = trunc(clean(n.description), 400);
      for (const t of [].concat(n.telephone || [])) if (digits(t).length >= 8) out.phones.push(clean(t));
      if (n.email && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(n.email)) out.emails.push(String(n.email).toLowerCase());
      const a = n.address; if (a && !out.address) out.address = trunc(typeof a === 'string' ? clean(a) : [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).map(clean).join(', '), 160);
      const ag = n.aggregateRating; if (ag && !out.rating) { const v = Number(ag.ratingValue), c = Number(ag.reviewCount || ag.ratingCount); if (v >= 1 && v <= 5) out.rating = { value: Math.round(v * 10) / 10, count: c > 0 ? c : 0 }; }
      for (const r of [].concat(n.review || [])) { const t = clean(r && (r.reviewBody || r.description) || ''); if (t.length > 20 && out.reviews.length < 4) out.reviews.push({ text: trunc(t, 170), author: trunc(str(r.author) || 'Customer', 40) }); }
      for (const im of [].concat(n.image || [], n.photo || [])) { const u = typeof im === 'string' ? im : im && (im.url || im.contentUrl); if (goodImg(u)) out.images.push(u); }
      const oh = n.openingHours; if (oh && !out.hours.length) out.hours = [].concat(oh).map(clean).filter(Boolean).slice(0, 7);
      for (const s of [].concat(n.sameAs || [])) { const m = /(linkedin|facebook|instagram|twitter|youtube)\./i.exec(String(s)); if (m && !out.social[m[1].toLowerCase()]) out.social[m[1].toLowerCase()] = String(s); }
      if (/Physician|Dentist/i.test(types) && n.name && /^dr\.?\s/i.test(clean(n.name))) out.doctors.push({ name: trunc(clean(n.name).replace(/^Dr\.\s*/i, 'Dr '), 50), title: clean(str(n.medicalSpecialty) || '').replace(/^.*\//, ''), image: '' });
      for (const o of [].concat(n.makesOffer || [], n.hasOfferCatalog && n.hasOfferCatalog.itemListElement || [])) { const it = o && (o.itemOffered || o); const nm = str(it && it.name || ''); if (nm && nm.length > 2 && nm.length < 70) out.products.push({ name: nm, description: trunc(clean(it.description || ''), 140), image: '', url: '' }); }
    }
  }
  const og = clean($('meta[property="og:image"]').attr('content') || ''); if (goodImg(og)) out.images.push(og);
  $('a[href^="tel:"]').each((_, a) => { const p = clean(decodeURIComponent(($(a).attr('href') || '').replace(/^tel:/i, ''))); if (digits(p).length >= 8) out.phones.push(p); });
  $('a[href^="mailto:"]').each((_, a) => { const e = ($(a).attr('href') || '').replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase(); if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) out.emails.push(e); });
  out.phones = [...new Map(out.phones.map(p => [digits(p).slice(-10), p])).values()].slice(0, 3); out.emails = [...new Set(out.emails)].slice(0, 3); out.images = [...new Set(out.images)].slice(0, 8);
  return out;
}

const thin = s => !s || String(s).trim().length < 40;
const byName = list => { const seen = new Set(); return list.filter(x => x && x.name && !seen.has(x.name.toLowerCase()) && seen.add(x.name.toLowerCase())); };

/** Merge what an extra source found into the main profile. Identity (name, logo, colours) stays with the main profile unless it is missing. */
export function mergeInto(p, ex, listing = null, { label = '', kind = 'website' } = {}) {
  const before = { products: p.products.length, images: p.images.length };
  const hostLike = n => !n || /^https?:|\.[a-z]{2,}$/i.test(n) || n === p.host;
  const exName = (kind !== 'website' && listing && listing.name) || (ex && ex.name && !/^https?:|\.[a-z]{2,}$/i.test(ex.name) ? ex.name : '') || (listing && listing.name) || '';
  if (hostLike(p.name) && exName) p.name = exName;
  if (ex) {
    if (thin(p.description) && ex.description) p.description = ex.description; if (thin(p.about) && ex.about) p.about = ex.about; if (!p.tagline && ex.tagline) p.tagline = ex.tagline;
    if (!p.logo && ex.logo) p.logo = ex.logo; if (!p.favicon && ex.favicon) p.favicon = ex.favicon; if (!(p.colors && p.colors.primary) && ex.colors && ex.colors.primary) p.colors = ex.colors;
    p.products = byName(p.products.length < 3 ? [...ex.products, ...p.products] : [...p.products, ...ex.products]).slice(0, 120);
    const seenI = new Set(p.images.map(i => i.src)); for (const i of ex.images || []) if (i && i.src && !seenI.has(i.src)) { seenI.add(i.src); p.images.push(i); }
    if (!p.ogImage && ex.ogImage) p.ogImage = ex.ogImage;
    for (const k of ['certifications', 'industries', 'categories', 'headings']) p[k] = [...new Set([...(p[k] || []), ...(ex[k] || [])])].slice(0, 12);
    if ((p.sections || []).length < 3) p.sections = [...(p.sections || []), ...(ex.sections || []).filter(s => !(p.sections || []).some(o => o.heading === s.heading))].slice(0, 14);
    if (!(p.stats || []).length) p.stats = (ex.stats || []).slice(0, 4);
    p.nav = (p.nav || []).length ? p.nav : (ex.nav || []);
    for (const [k, v] of Object.entries(ex.social || {})) if (!p.social[k]) p.social[k] = v;
    const c = p.contacts, ec = ex.contacts || {}; const have = new Set(c.phones.map(x => digits(x).slice(-10)));
    for (const ph of ec.phones || []) if (!have.has(digits(ph).slice(-10)) && c.phones.length < 3) c.phones.push(ph);
    for (const e of ec.emails || []) if (!c.emails.includes(e) && c.emails.length < 3) c.emails.push(e);
    if (!c.address && ec.address) c.address = ec.address;
  }
  if (listing) {
    if (thin(p.description) && listing.description) { p.description = listing.description; if (thin(p.about)) p.about = listing.description; }
    const c = p.contacts; const have = new Set(c.phones.map(x => digits(x).slice(-10)));
    for (const ph of listing.phones) if (!have.has(digits(ph).slice(-10)) && c.phones.length < 3) c.phones.push(ph);
    for (const e of listing.emails) if (!c.emails.includes(e) && c.emails.length < 3) c.emails.push(e);
    if (!c.address && listing.address) c.address = listing.address;
    p.products = byName([...p.products, ...listing.products]).slice(0, 120);
    const seenI = new Set(p.images.map(i => i.src)); for (const u of listing.images) if (!seenI.has(u)) { seenI.add(u); p.images.push({ src: u, alt: p.name }); }
    for (const [k, v] of Object.entries(listing.social)) if (!p.social[k]) p.social[k] = v;
    if (listing.reviews.length && !(p.sections || []).some(s => s.kind === 'quotes')) p.sections = [...(p.sections || []), { kind: 'quotes', heading: 'What customers say', quotes: listing.reviews.map(r => ({ text: r.text, author: r.author })) }];
    const f = listing.facts || {};
    if (f.established && f.established <= new Date().getFullYear() && !(p.stats || []).some(s => /year/i.test(s.label))) p.stats = [...(p.stats || []), { value: new Date().getFullYear() - f.established, suffix: '+', label: 'Years in business' }].slice(0, 4);
    p.sourceFacts = { ...(p.sourceFacts || {}), ...f };
  }
  p.sources = [...(p.sources || []), { label: label || kind, kind, products: p.products.length - before.products, photos: p.images.length - before.images }];
}

/** Run the three industry specific extractors again on merged data, using clinic info the extra pages found. */
function mergeClinic(p, parts, listings) {
  const ck = p.clinic || { doctors: [], hours: [], rating: null, services: [], bookingUrl: '', specialties: [], emergency: '' };
  for (const c of parts) { if (!c) continue;
    for (const d of c.doctors || []) if (!ck.doctors.some(x => x.name.toLowerCase() === d.name.toLowerCase()) && ck.doctors.length < 4) ck.doctors.push(d);
    if (!ck.hours.length) ck.hours = c.hours || []; if (!ck.rating && c.rating) ck.rating = c.rating; if (!ck.bookingUrl && c.bookingUrl) ck.bookingUrl = c.bookingUrl; if (!ck.emergency && c.emergency) ck.emergency = c.emergency;
    const have = new Set(ck.services.map(s => s.name.toLowerCase())); for (const s of c.services || []) if (!have.has(s.name.toLowerCase()) && ck.services.length < 12) { have.add(s.name.toLowerCase()); ck.services.push(s); }
    ck.specialties = [...new Set([...(ck.specialties || []), ...(c.specialties || [])])].slice(0, 5);
  }
  for (const l of listings) { if (!l) continue;
    for (const d of l.doctors) if (!ck.doctors.some(x => x.name.toLowerCase() === d.name.toLowerCase()) && ck.doctors.length < 4) ck.doctors.push(d);
    if (!ck.rating && l.rating) ck.rating = l.rating; if (!ck.hours.length && l.hours.length) ck.hours = l.hours;
  }
  p.clinic = ck;
}

/** Fetch each extra source and fold it into the profile. Failures are reported, never fatal. */
export async function applyExtras(profile, { sources = [], photos = [], html = '', pasteUrl = '', fetcher = fetchText, hint = '', force = '' } = {}) {
  const p = profile; const notes = []; const failed = []; const exProfiles = []; const listings = [];
  const urls = [...new Set((Array.isArray(sources) ? sources : String(sources || '').split(/\s+/)).map(x => String(x || '').trim()).filter(Boolean))].slice(0, 4);
  const jobs = urls.map(async u => {
    let nu; try { nu = normalizeUrl(u); } catch { failed.push({ url: u, reason: 'That does not look like a web address' }); return; }
    const kind = sourceKind(nu);
    try {
      const page = await fetcher(nu, { timeout: 10000 });
      const ex = await extractProfile(nu, { hint, fetcher: async x => (x === nu || x === page.url ? page : fetcher(x)), budgetMs: 9000, totalMs: 13000 }).catch(() => null);
      const lst = listingFromHtml(page.text, nu); exProfiles.push({ ex, lst, nu, kind }); listings.push(lst);
    } catch (e) { failed.push({ url: u, reason: /403|blocked|denied|forbidden/i.test(e.message) ? 'That site blocks automated readers. Open it, save the page as HTML (or copy its text) and add it as a file instead.' : (e && e.message) || 'Could not read it' }); }
  });
  await Promise.all(jobs);
  if (html && String(html).length > 200 && /<(html|body|div|section|article)\b/i.test(html)) {
    const u = pasteUrl || 'https://pasted.page/'; try { const nu = normalizeUrl(u); const doc = { text: String(html).slice(0, 2_500_000), url: nu }; const ex = await extractProfile(nu, { hint, fetcher: async () => doc, budgetMs: 6000, totalMs: 9000 }).catch(() => null); const lst = listingFromHtml(doc.text, nu); exProfiles.push({ ex, lst, nu, kind: 'pasted page' }); listings.push(lst); } catch { failed.push({ url: 'pasted page', reason: 'Could not read the pasted page' }); }
  }
  const mainWeak = !p.products.length && !(p.sections || []).length && thin(p.description);
  // which industry? The main site decides when it is clear, otherwise the most confident extra source (a user choice always wins)
  const locked = p.industryInfo && (p.industryInfo.forced || p.industryInfo.preferred);
  let best = { industry: p.industry, conf: p.industryInfo ? p.industryInfo.confidence || 0 : 0, from: 'main', info: p.industryInfo };
  if (!locked) for (const x of exProfiles) { const ii = x.ex && x.ex.industryInfo; if (x.ex && x.ex.industry && ii && (ii.confidence || 0) > best.conf + (mainWeak ? -1 : 0.15)) best = { industry: x.ex.industry, conf: ii.confidence || 0, from: x.nu, info: ii }; }
  for (const x of exProfiles) { mergeInto(p, x.ex, x.lst, { label: x.nu.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), kind: x.kind }); notes.push(`${x.kind === 'website' ? 'Content from' : 'Details from the'} ${x.kind === 'website' ? x.nu.replace(/^https?:\/\/(www\.)?/, '') : x.kind}`); }
  if (best.from !== 'main') { p.industry = best.industry; p.industryInfo = { ...(best.info || {}), switchedBy: best.from }; }
  if (p.industry === 'dentists' || p.industry === 'doctors') mergeClinic(p, [p.clinic, ...exProfiles.map(x => x.ex && x.ex.clinic)], listings);
  if (['electronics', 'recycling', 'chemicals'].includes(p.industry)) { const ind = [p.industrial, ...exProfiles.map(x => x.ex && x.ex.industrial)].filter(Boolean); if (ind.length) p.industrial = ind.reduce((a, b) => ({ ...a, stats: a.stats && a.stats.length ? a.stats : b.stats, applications: a.applications && a.applications.length ? a.applications : b.applications, capabilities: a.capabilities && a.capabilities.length ? a.capabilities : b.capabilities, standards: a.standards && a.standards.length ? a.standards : b.standards, steps: a.steps && a.steps.length ? a.steps : b.steps, materials: [...new Set([...(a.materials || []), ...(b.materials || [])])].slice(0, 6), packaging: a.packaging || b.packaging, capacity: a.capacity || b.capacity, productGroups: [...new Set([...(a.productGroups || []), ...(b.productGroups || [])])].slice(0, 8) })); }
  if (p.industry === 'realestate') { const es = exProfiles.map(x => x.ex && x.ex.estate).filter(Boolean); if (es.length && !(p.estate && p.estate.projects && p.estate.projects.length)) p.estate = es.find(e => e.projects && e.projects.length) || p.estate || es[0]; }
  // the person's own photos go first
  const own = cleanPhotoList(photos);
  if (own.length) { p.images = [...own.map(src => ({ src, alt: p.name, own: true })), ...p.images.filter(i => !own.includes(i.src))]; p.ogImage = own[0]; notes.push(`${own.length} photo${own.length === 1 ? '' : 's'} you provided`); }
  p.meta = { ...(p.meta || {}), extras: { used: exProfiles.map(x => ({ url: x.nu, kind: x.kind })), failed } };
  return { profile: p, notes, failed };
}

export { detectIndustry };
