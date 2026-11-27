import test from 'node:test'; import assert from 'node:assert/strict'; import zlib from 'node:zlib';
import { parseCsv, parseXlsx, rowsToProducts, parseSitemap, parseGmb, buildIntakeProfile, decodeUpload } from '../lib/intake.js';

function zip(files) { // tiny stored/deflated zip writer for the test
  const parts = [], cd = []; let off = 0;
  for (const [n, c] of Object.entries(files)) { const nb = Buffer.from(n), raw = Buffer.from(c), d = zlib.deflateRawSync(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(8, 8); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nb.length, 26);
    const c1 = Buffer.alloc(46); c1.writeUInt32LE(0x02014b50, 0); c1.writeUInt16LE(8, 10); c1.writeUInt32LE(d.length, 20); c1.writeUInt32LE(raw.length, 24); c1.writeUInt16LE(nb.length, 28); c1.writeUInt32LE(off, 42);
    parts.push(h, nb, d); cd.push(c1, nb); off += 30 + nb.length + d.length; }
  const cdb = Buffer.concat(cd), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(Object.keys(files).length, 10); e.writeUInt32LE(cdb.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cdb, e]);
}
const xlsx = zip({ 'xl/sharedStrings.xml': '<sst><si><t>Product</t></si><si><t>Description</t></si><si><t>Solar &amp; Hybrid Inverter</t></si><si><t>Runs the whole shop</t></si><si><t>UPS 1kVA</t></si></sst>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row><row r="3"><c r="A3" t="s"><v>4</v></c></row></sheetData></worksheet>' });

test('csv handles quotes, semicolons and tabs', () => {
  assert.deepEqual(parseCsv('a,b\n"x, y",2\n'), [['a', 'b'], ['x, y', '2']]);
  assert.equal(parseCsv('a;b;c\n1;2;3')[1][2], '3');
});
test('xlsx first sheet is read with shared strings', () => {
  const rows = parseXlsx(xlsx); assert.equal(rows[1][0], 'Solar & Hybrid Inverter');
  const p = rowsToProducts(rows); assert.equal(p.length, 2); assert.equal(p[0].description, 'Runs the whole shop');
});
test('products need a name and are de-duplicated', () => {
  assert.equal(rowsToProducts([['Name', 'Image'], ['A1', 'http://x/y.png'], ['a1', ''], ['', 'x']]).length, 1);
});
test('sitemap turns product urls into names', () => {
  const s = parseSitemap('<urlset><url><loc>https://acme.test/product/solar-inverter-5kw</loc></url><url><loc>https://acme.test/contact</loc></url></urlset>');
  assert.equal(s.products[0].name, 'Solar Inverter 5kw'); assert.equal(s.host, 'acme.test');
});
test('gmb text and json', () => {
  const t = parseGmb('Name: Acme Power\nPhone: +91 98765 43210\nAddress: Mumbai\nWebsite: https://acme.test'); assert.equal(t.name, 'Acme Power'); assert.match(t.phone, /98765/);
  assert.equal(parseGmb('{"name":"Z","reviews":["Great"]}').reviews[0], 'Great');
});
test('buildIntakeProfile merges sources into a renderable profile', () => {
  const p = buildIntakeProfile({ name: 'Acme', host: 'acme.test', rows: parseXlsx(xlsx), gmb: 'Phone: +91 98765 43210', vision: { tagline: 'Power on', color: '#112233', products: [{ name: 'Charger' }] } });
  assert.equal(p.products.length, 3); assert.equal(p.colors.primary, '#112233'); assert.equal(p.contacts.phones.length, 1); assert.ok(p.intake.notes.length >= 3);
});
test('decodeUpload sniffs the file type and caps size', () => {
  assert.equal(decodeUpload({ name: 'a.xlsx', data: xlsx.toString('base64') }).kind, 'rows');
  assert.equal(decodeUpload({ name: 'a.png', data: 'iVBOR' }).kind, 'image');
  assert.equal(decodeUpload({ name: 's.xml', data: Buffer.from('<urlset></urlset>').toString('base64') }).kind, 'sitemap');
  assert.throws(() => decodeUpload({ name: 'x.csv', data: Buffer.alloc(9e6).toString('base64') }));
});

import { createShare, readShare } from '../lib/share.js';
import { designerFromEnv } from '../lib/designer.js';
test('share links remember which five designs were chosen, and only safe ids', async () => {
  const secret = 'x'.repeat(40);
  const r = await createShare({ name: 'Acme', host: 'acme.test', products: [] }, { agency: 'Digifyo', ids: ['noir', 'classic-corporate', '<script>', 5], by: 'tester', secret, env: {} });
  const back = await readShare(r.token, { secret, env: {} });
  assert.ok(back.ok); assert.deepEqual(back.data.ids, ['noir', 'classic-corporate']);
});
test('designer details come from settings and are never invented', () => {
  const d = designerFromEnv({ DESIGNER_PHONE: '+91 1', DESIGNER_SITE: 'javascript:alert(1)' });
  assert.equal(d.company, 'Digifyo'); assert.equal(d.phone, '+91 1'); assert.equal(d.email, ''); assert.equal(d.site, 'https://digifyo.com');
});
