// Which industry is this? Works from whatever is known: website text, Google Business category, LinkedIn headline,
// the lead's industry field, company name, free notes. Pure functions, no network.
export const INDUSTRIES = [
  { id: 'electronics', name: 'Electronics', blurb: 'Manufacturers, components, power and IoT', ready: true },
  { id: 'dentists', name: 'Dentists', blurb: 'Dental clinics and dental specialists', ready: true },
  { id: 'doctors', name: 'Doctors', blurb: 'Clinics, hospitals and medical specialists', ready: true }
];
export const industryName = id => (INDUSTRIES.find(i => i.id === id) || {}).name || '';

// [regex, weight]. Strong, specific words weigh more; generic words weigh little.
const RULES = {
  dentists: [[/\bdentist(s|ry)?\b/i, 6], [/\bdental\b/i, 6], [/\b(bds|mds)\b/i, 5], [/\borthodont/i, 5], [/\bendodont|root canal\b/i, 4], [/\b(periodont|implantolog)/i, 4], [/\bteeth|tooth|smile|braces|aligners?|invisalign|whitening\b/i, 3], [/\boral (health|care|surgeon)|maxillofacial\b/i, 4], [/\bdds\b|\bdmd\b/i, 5]],
  doctors: [[/\b(doctor|physician|clinic|hospital|surgeon|medical|healthcare|polyclinic|nursing home)\b/i, 4], [/\b(dr\.?|md|mbbs|ms|dnb|dm|mch|frcs|mrcp)\b/i, 3], [/\b(cardiolog|dermatolog|pediatric|paediatric|gynaecolog|gynecolog|orthopaedic|orthopedic|neurolog|urolog|oncolog|ophthalmolog|ent specialist|endocrinolog|gastroenterolog|pulmonolog|psychiatr|physiotherap|ayurved|homeopath|diabetolog|nephrolog|radiolog|pathology|general practitioner|physician)/i, 5], [/\b(patients?|consultation|appointment|opd|diagnos|treatment|health ?check)\b/i, 2], [/\b(skin|hair|eye|heart|bone|kidney|liver|spine|joint|fertility|ivf|child)\s+(care|clinic|specialist|doctor|hospital|centre|center)\b/i, 4]],
  electronics: [[/\b(electronics?|electrical|semiconductor|pcb|circuit|embedded|inverter|ups|transformer|capacitor|resistor|relay|sensor|microcontroller|iot|power supply|smps|battery|solar|led|cable|connector|switchgear|automation|plc|drives?|vfd)\b/i, 4], [/\b(manufactur|oem|odm|components?|distributor|industrial)\w*\b/i, 2], [/\b(iso 9001|ce certified|rohs|bis|ul listed)\b/i, 2]]
};
// strong negatives: a dental clinic must not be read as a generic doctor unless it is clearly both
const SPECIALTIES = {
  dentists: [
    ['implants', /implant/i, 'Dental implants'], ['ortho', /orthodont|braces|aligner|invisalign/i, 'Braces and aligners'], ['kids', /pedodont|paediatric dent|pediatric dent|kids dent|child dent/i, 'Kids dentistry'],
    ['cosmetic', /cosmetic|smile design|makeover|veneer|whitening/i, 'Cosmetic dentistry'], ['general', /./, 'General dentistry']
  ],
  doctors: [
    ['skin', /dermatolog|skin|hair|cosmetolog/i, 'Skin and hair'], ['child', /pediatric|paediatric|child|neonat/i, 'Child health'], ['women', /gynaecolog|gynecolog|obstetric|fertility|ivf|maternity/i, 'Women\'s health'],
    ['bone', /orthop|bone|joint|spine|sports medicine|physiotherap/i, 'Bone and joint'], ['heart', /cardiolog|heart/i, 'Heart care'], ['eye', /ophthalm|eye|retina|lasik|cataract/i, 'Eye care'],
    ['ent', /\bent\b|otolaryng|hearing|sinus/i, 'Ear, nose and throat'], ['mind', /psychiatr|psycholog|mental|counsell?ing/i, 'Mental health'], ['diabetes', /diabet|endocrin|thyroid/i, 'Diabetes and hormones'],
    ['ayush', /ayurved|homeopath|naturopath|unani/i, 'Ayurveda and homeopathy'], ['general', /./, 'Family medicine']
  ]
};

const toText = v => (Array.isArray(v) ? v.map(toText).join(' ') : v && typeof v === 'object' ? Object.values(v).map(toText).join(' ') : String(v ?? ''));

/** signals: any of {industry, category, title, name, host, url, text, description, headings, nav, services, linkedin, notes, ldTypes}. */
export function detectIndustry(sig = {}) {
  const parts = {
    industry: [toText(sig.industry), 3], category: [toText(sig.category), 4], title: [toText(sig.title), 2], name: [toText(sig.name), 2], host: [toText(sig.host || sig.url), 1],
    notes: [toText(sig.notes), 3], linkedin: [toText(sig.linkedin), 3], text: [toText(sig.text), 1], description: [toText(sig.description), 1.5], headings: [toText(sig.headings), 1], nav: [toText(sig.nav), 1], services: [toText(sig.services), 1]
  };
  const scores = {}, why = {};
  for (const [id, rules] of Object.entries(RULES)) {
    scores[id] = 0; why[id] = [];
    for (const [k, [txt, w]] of Object.entries(parts)) {
      if (!txt) continue;
      for (const [re, rw] of rules) { const m = txt.match(re); if (m) { scores[id] += rw * w * (k === 'text' || k === 'headings' || k === 'nav' ? Math.min(3, (txt.match(new RegExp(re.source, 'gi')) || []).length) : 1); if (why[id].length < 4) why[id].push(`${k}: "${m[0].trim().slice(0, 30)}"`); } }
    }
  }
  for (const t of toText(sig.ldTypes).split(/\s+/)) {
    if (/^(dentist|dentalclinic)$/i.test(t)) scores.dentists += 40; else if (/^(physician|medicalclinic|medicalbusiness|hospital|medicalorganization|individualphysician)$/i.test(t)) scores.doctors += 30;
  }
  // a dental practice is also "medical": prefer dentists when dental words are present
  if (scores.dentists >= 12 && scores.dentists * 0.6 >= scores.doctors * 0.4) scores.doctors *= 0.4;
  if (sig.hint && scores[sig.hint] !== undefined && !sig.prefer) return { industry: sig.hint, confidence: 1, forced: true, reasons: ['chosen by you'], scores, ...specialtyOf(sig.hint, sig) };
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]); const [top, topScore] = ranked[0]; const second = ranked[1][1];
  if (topScore < 8) return sig.prefer && scores[sig.prefer] !== undefined ? { industry: sig.prefer, confidence: 0.2, preferred: true, reasons: ['your choice'], scores, ...specialtyOf(sig.prefer, sig) } : { industry: '', confidence: 0, reasons: [], scores, specialty: '', specialtyLabel: '' };
  if (sig.prefer && top !== sig.prefer && scores[sig.prefer] !== undefined && scores[sig.prefer] >= topScore * 0.7) return { industry: sig.prefer, confidence: 0.4, preferred: true, reasons: ['your choice'], scores, ...specialtyOf(sig.prefer, sig) };
  const confidence = Math.max(0.3, Math.min(0.98, (topScore - second) / (topScore + 1) + Math.min(0.5, topScore / 80)));
  return { industry: top, confidence: Math.round(confidence * 100) / 100, reasons: why[top], scores, ...specialtyOf(top, sig) };
}

export function specialtyOf(industry, sig = {}) {
  const list = SPECIALTIES[industry]; if (!list) return { specialty: '', specialtyLabel: '' };
  const txt = [sig.industry, sig.category, sig.title, sig.name, sig.notes, sig.linkedin, sig.description, sig.services, sig.headings, sig.nav].map(toText).join(' ');
  const hit = list.find(([, re]) => re.test(txt)) || list[list.length - 1];
  return { specialty: hit[0], specialtyLabel: hit[2] };
}

/** Pull signals out of a Google Maps link and a LinkedIn link/handle (we never fetch these; names only). */
export function signalsFromLinks({ gmbUrl = '', linkedin = '' } = {}) {
  const out = {};
  const m = /google\.[a-z.]+\/maps\/place\/([^/@?]+)/i.exec(String(gmbUrl)); if (m) { try { out.name = decodeURIComponent(m[1].replace(/\+/g, ' ')).slice(0, 80); } catch { /* ignore */ } }
  const l = /linkedin\.com\/(in|company)\/([^/?#]+)/i.exec(String(linkedin)); if (l) { try { out.linkedin = decodeURIComponent(l[2]).replace(/[-_]+/g, ' ').replace(/\d{5,}/g, '').trim().slice(0, 80); out.linkedinKind = l[1]; } catch { /* ignore */ } }
  return out;
}
