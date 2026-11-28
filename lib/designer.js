// "Designed by" details shown on every design and share link. Set in the hosting dashboard; nothing is invented.
const clip = (v, n) => String(v || '').trim().slice(0, n);
export function designerFromEnv(env = process.env) {
  return { company: clip(env.DESIGNER_COMPANY, 40) || 'Digifyo', name: clip(env.DESIGNER_NAME, 60) || 'Chirag Thakker', role: clip(env.DESIGNER_ROLE, 60), phone: clip(env.DESIGNER_PHONE, 30), whatsapp: clip(env.DESIGNER_WHATSAPP, 30), email: clip(env.DESIGNER_EMAIL, 90), linkedin: /^https?:\/\//i.test(env.DESIGNER_LINKEDIN || '') ? clip(env.DESIGNER_LINKEDIN, 200) : '', site: /^https?:\/\//i.test(env.DESIGNER_SITE || '') ? clip(env.DESIGNER_SITE, 120) : 'https://digifyo.com' };
}
