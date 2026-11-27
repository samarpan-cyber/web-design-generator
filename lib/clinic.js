// Clinic facts from a doctor or dentist website: named doctors, hours, rating, treatments, booking link.
// Only reads what the page says. Anything not found stays empty and the designs simply leave it out.
import { clean, trunc, abs } from './util.js';

const CRED = /\b(BDS|MDS|MBBS|MD|MS|DNB|DM|MCh|DDS|DMD|FRCS|MRCP|BAMS|BHMS|MPT|BPT|PhD|FICOI|MFDS|MRCS)\b/g;
const NAME = /\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;
const DAYS = /\b(mon(day)?|tue(s|sday)?|wed(nesday)?|thu(r|rs|rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;
const TREAT = /(implant|whiten|root canal|braces|aligner|crown|bridge|denture|veneer|filling|scaling|cleaning|extraction|smile|checkup|check-up|consult|therapy|surgery|screening|vaccin|diabetes|thyroid|skin|hair|laser|physio|ultrasound|ecg|pathology|diagnos|fertility|antenatal|pediatric|paediatric|cardiac|care|treatment|clinic|dentistry|orthodont|endodont|periodont|pedodont)/i;
const NOT_SERVICE = /^(home|about|contact|blog|gallery|testimonials?|faq|book|appointment|login|privacy|terms|careers?|news|events?|team|our team|meet|reviews?)\b/i;

export function extractClinic($, { ld = [], sections = [], nav = [], base = '' } = {}) {
  $('script,style,noscript').remove(); $('p,h1,h2,h3,h4,h5,li,div,section,td,tr,a,span,header,footer,br').after(' '); const text = clean($('body').text()); // read the whole page, whatever other extractors removed
  const out = { doctors: [], hours: [], rating: null, services: [], bookingUrl: '', specialties: [], emergency: '' };
  // rating and hours from structured data
  for (const n of ld) {
    const ag = n.aggregateRating; if (ag && !out.rating) { const v = Number(ag.ratingValue), c = Number(ag.reviewCount || ag.ratingCount); if (v >= 1 && v <= 5) out.rating = { value: Math.round(v * 10) / 10, count: c > 0 ? c : 0 }; }
    const oh = n.openingHours; if (oh && !out.hours.length) out.hours = [].concat(oh).map(clean).filter(Boolean).slice(0, 7);
    const spec = n.openingHoursSpecification; if (spec && !out.hours.length) out.hours = [].concat(spec).map(s => `${[].concat(s.dayOfWeek || []).map(d => String(d).replace(/^.*\//, '').slice(0, 3)).join(', ')} ${s.opens || ''}${s.closes ? ' to ' + s.closes : ''}`.trim()).filter(Boolean).slice(0, 7);
    const ms = n.medicalSpecialty; if (ms) out.specialties.push(...[].concat(ms).map(x => clean(String(x).replace(/^.*\//, ''))).filter(Boolean));
    if (/Physician|Dentist/i.test([].concat(n['@type'] || []).join(',')) && n.name && /dr\.?\s/i.test(n.name) && !out.doctors.some(d => d.name === clean(n.name))) out.doctors.push({ name: trunc(clean(n.name), 50), title: '', image: abs(typeof n.image === 'string' ? n.image : n.image && n.image.url, base) || '' });
  }
  // hours from text
  if (!out.hours.length) {
    const lines = [];
    $('p,li,div,span,td').each((_, el) => { if ($(el).children().length > 3) return; const t = clean($(el).text()); if (t.length > 8 && t.length < 90 && DAYS.test(t) && /\d{1,2}([:.]\d{2})?\s?(am|pm|a\.m\.|p\.m\.)?\s*(-|to|–)\s*\d{1,2}/i.test(t) && !lines.includes(t)) lines.push(t); });
    out.hours = lines.slice(0, 5);
  }
  // named doctors: most mentioned, with credentials found near the first mention
  const counts = new Map();
  for (const m of text.matchAll(NAME)) { const n = clean(m[1]).replace(/\.$/, ''); counts.set(n, (counts.get(n) || 0) + 1); }
  for (const [n] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4)) {
    if (out.doctors.some(d => d.name.toLowerCase() === n.toLowerCase())) continue;
    const at = text.indexOf(n); const near = text.slice(at, at + 140); const creds = [...new Set(near.match(CRED) || [])].slice(0, 3).join(', ');
    let image = '';
    $('img').each((_, el) => { const alt = clean($(el).attr('alt') || ''); if (!image && alt && alt.toLowerCase().includes(n.toLowerCase().replace(/^dr\.?\s*/, ''))) image = abs($(el).attr('data-src') || $(el).attr('src'), base) || ''; });
    out.doctors.push({ name: n, title: creds, image });
  }
  out.doctors = out.doctors.slice(0, 4);
  // treatments: a section whose heading is about services, else menu items that look like treatments
  const secs = sections.filter(s => (s.kind === 'cards' || s.kind === 'steps' || s.kind === 'list') && /service|treatment|specialit|what we|procedure|care we|conditions?/i.test(s.heading));
  const fromSec = secs.flatMap(s => s.kind === 'list' ? (s.bullets || []).map(b => ({ name: b, description: '', image: '' })) : (s.items || []).map(i => ({ name: i.title, description: i.text || '', image: i.image || '' })));
  const fromNav = nav.filter(n => n.label && n.label.length < 40 && !NOT_SERVICE.test(n.label) && TREAT.test(n.label)).map(n => ({ name: n.label, description: '', image: '', url: n.href }));
  const seen = new Set();
  out.services = [...fromSec, ...fromNav].map(s => ({ ...s, name: clean(s.name) })).filter(s => s.name.length > 2 && s.name.length < 60 && !NOT_SERVICE.test(s.name) && !seen.has(s.name.toLowerCase()) && seen.add(s.name.toLowerCase())).slice(0, 12);
  // booking
  $('a').each((_, a) => { if (out.bookingUrl) return; const t = clean($(a).text()); if (/book|appointment|schedule/i.test(t) && t.length < 40) out.bookingUrl = abs($(a).attr('href'), base) || ''; });
  const em = /(emergency|24\s?[x/]\s?7|24 hours?)[^.]{0,60}?(\+?\d[\d\s().-]{7,15}\d)/i.exec(text); if (em) out.emergency = clean(em[2]);
  out.specialties = [...new Set(out.specialties)].slice(0, 5);
  return out;
}
