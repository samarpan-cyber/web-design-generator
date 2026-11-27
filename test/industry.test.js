import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import * as cheerio from 'cheerio';
import { detectIndustry, signalsFromLinks } from '../public/engine/industry.js';
import { LIBRARY, pickSet } from '../public/engine/index.js';
import { extractProfile } from '../lib/extract.js';
import { noDash } from '../public/engine/copy.js';

test('industry is detected from any single signal', () => {
  assert.equal(detectIndustry({ category: 'Dentist' }).industry, 'dentists');
  assert.equal(detectIndustry({ name: 'Bright Smiles Orthodontics' }).industry, 'dentists');
  assert.equal(detectIndustry({ linkedin: 'Orthodontist at Bright Smiles' }).specialty, 'ortho');
  assert.equal(detectIndustry({ name: 'Dr. Mehta Skin Clinic', category: 'Dermatologist' }).industry, 'doctors');
  assert.equal(detectIndustry({ name: 'Dr. Mehta Skin Clinic', category: 'Dermatologist' }).specialty, 'skin');
  assert.equal(detectIndustry({ industry: 'Electronics manufacturing', text: 'inverter ups battery' }).industry, 'electronics');
  assert.equal(detectIndustry({ ldTypes: ['Dentist'] }).industry, 'dentists');
  assert.equal(detectIndustry({ name: 'Elite AquaChem', text: 'pickling and passivation chemicals for steel, speciality chemicals manufacturer' }).industry, 'chemicals'); assert.equal(detectIndustry({ name: 'Acme', industry: 'Law' }).industry, '', 'unknown stays unknown');
});
test('a dental clinic is not read as a generic doctor, and a hint always wins', () => {
  assert.equal(detectIndustry({ name: 'City Dental Clinic', text: 'dentist doctors clinic patients' }).industry, 'dentists');
  assert.equal(detectIndustry({ name: 'City Dental Clinic', hint: 'doctors' }).industry, 'doctors');
});
test('google maps and linkedin links give names, never fetched', () => {
  assert.equal(signalsFromLinks({ gmbUrl: 'https://www.google.com/maps/place/Smile+Care+Dental/@18.5,73.8,17z' }).name, 'Smile Care Dental');
  assert.equal(signalsFromLinks({ linkedin: 'https://www.linkedin.com/in/anita-rao-bds-mds-123456789/' }).linkedin, 'anita rao bds mds');
});

const html = fs.readFileSync(new URL('./fixtures/dental.html', import.meta.url), 'utf8');
const dental = await extractProfile('smilecare.test', { fetcher: async u => ({ text: html, url: u.startsWith('http') ? u : 'https://smilecare.test/' }) });
test('a dental site is read as a clinic: doctors, hours, rating and treatments', () => {
  assert.equal(dental.industry, 'dentists'); assert.ok(dental.clinic);
  assert.ok(dental.clinic.doctors.some(d => /Anita Rao/.test(d.name) && /BDS/.test(d.title)), JSON.stringify(dental.clinic.doctors));
  assert.equal(dental.clinic.rating.value, 4.8); assert.equal(dental.clinic.rating.count, 312);
  assert.ok(dental.clinic.hours.length >= 1);
  assert.ok(dental.clinic.services.some(s => /implant/i.test(s.name)), JSON.stringify(dental.clinic.services));
  assert.match(dental.clinic.bookingUrl, /\/book$/);
});
test('the industry choice picks only that industry\'s designs', () => {
  for (const ind of ['dentists', 'doctors', 'electronics']) { const set = pickSet({ host: 'a.test', industry: ind }, 0); assert.equal(set.length, 5); assert.ok(set.every(t => t.industries.includes(ind)), ind); assert.equal(set.filter(t => t.family === 'classic').length, 2); }
  assert.notDeepEqual(pickSet({ host: 'a.test', industry: 'dentists' }, 0).map(t => t.id), pickSet({ host: 'a.test', industry: 'dentists' }, 3).map(t => t.id));
});
test('every clinic design renders real data and invents nothing', () => {
  const bare = { name: 'Bare Clinic', host: 'bare.test', industry: 'doctors', colors: {}, contacts: { emails: [], phones: [], address: '' }, products: [], images: [], stats: [], social: {} };
  for (const t of LIBRARY.filter(x => x.industries.includes('dentists'))) {
    const h = t.render(dental, { designer: { company: 'Digifyo', name: 'Chirag Thakker', phone: '+91 90000 00000' } }); const $ = cheerio.load(h); $('style,script').remove(); const txt = $.text();
    assert.match(txt, /Anita Rao/); assert.match(txt, /4\.8/); assert.match(txt, /Dental Implants/); assert.match(h, /Chirag Thakker/);
    const b = t.render(bare, {}); const $b = cheerio.load(b); $b('style,script').remove(); const bt = $b.text();
    assert.ok(!/Google reviews|Years in practice|\b\d+\+? (patients|years)\b/i.test(bt), t.id + ' invented a fact');
    assert.ok(!/Dr\.? [A-Z]/.test(bt), t.id + ' invented a doctor');
    assert.ok(!/[–—]/.test(h));
  }
});
