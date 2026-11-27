// Reads the structure of a home page: each heading plus the content it owns, classified so a
// redesign can rebuild it section by section.
import { clean, trunc, abs, pickSrc, JUNK_IMG } from './util.js';

const SKIP_HEAD = /^(menu|search|subscribe|newsletter|follow us|share|cookies?|copyright|quick links|useful links|links|address|navigation|categories|recent posts|latest posts|archives|tags|social|sitemap|connect with us|download|brochure|enquiry form|inquiry form|leave a reply|comments?|my account|login|register)$/i;
const CONTACTY = /(phone|tel\b|fax|mobile|e-?mail|address|@|\bpin\b|\+\d{2}|\d{5,}|all rights reserved|©|cookie)/i;
const LOGO_HEAD = /client|partner|customer|brands?|trusted|associates|collaborat|serve|worked with/i;
const CTA_HEAD = /contact|get in touch|quote|enquir|inquir|call us|reach us|talk to|let'?s|ready to|start your/i;
const STEP_HEAD = /how (it|we) works?|process|steps?|approach|workflow|journey/i;

const keyOf = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

function imgOk(src) { return src && !JUNK_IMG.test(src) && !/\.(svg|gif)(\?|$)/i.test(src); }

export function extractSections($, base, dbg = []) {
  $('script,style,noscript,svg,iframe,form,header,nav,footer,aside').remove();
  // noise by class name, but never page wrappers: themes put classes like "no-sidebar" or "modal-open" on <body>
  $('[class*="cookie" i],[id*="cookie" i],[class*="popup" i],[class*="modal" i],[class*="breadcrumb" i],[class*="sidebar" i],.widget,.widget-area').each((_, el) => {
    if (!el.parent || ['body', 'html'].includes(el.name) || ['body', 'html'].includes(el.parent.name)) return;
    if ($(el).find('h2').length > 2) return;
    $(el).remove();
  });
  const heads = $('h2').toArray();
  const out = []; const seen = new Set();

  const blockFor = h => {
    let node = h;
    while (node.parent && node.parent.name && !['body', 'html'].includes(node.parent.name)) {
      const $p = $(node.parent);
      if ($p.find('h1,h2').toArray().some(x => x !== h)) break;
      if (clean($p.text()).length > 5000) break;
      node = node.parent;
    }
    let $b = $(node);
    // heading sits in a shared container: take the siblings that follow it up to the next major heading
    if (clean($b.text()).length - clean($(h).text()).length < 25) {
      let sib = node.next; const take = [];
      while (sib && take.length < 8) {
        if (sib.type === 'tag') { if ($(sib).is('h1,h2') || $(sib).find('h1,h2').length) break; take.push(sib); }
        sib = sib.next;
      }
      if (take.length) $b = $b.add(take);
    }
    return $b;
  };

  for (const h of heads) {
    const heading = clean($(h).text());
    if (heading.length < 3 || heading.length > 90 || SKIP_HEAD.test(heading)) { dbg.push(`${heading.slice(0, 20)}|skipped`); continue; }
    const hk = keyOf(heading); if (seen.has(hk)) continue;
    const $b = blockFor(h);
    const paras = $b.find('p').toArray().map(p => clean($(p).text())).filter(t => t.length >= 35 && t.length <= 600 && !CONTACTY.test(t));
    const own = $b.filter('p').toArray().map(p => clean($(p).text())).filter(t => t.length >= 35 && !CONTACTY.test(t));
    const text = [...own, ...paras][0] || '';

    // card items: sub-headings with the content around them
    const items = []; const itemKeys = new Set();
    const subs = $b.find('h3,h4,h5,h6').toArray();
    for (const s of subs) {
      const title = clean($(s).text());
      if (title.length < 3 || title.length > 70 || SKIP_HEAD.test(title) || CONTACTY.test(title) || itemKeys.has(keyOf(title))) continue;
      let c = s;
      for (let i = 0; i < 4; i++) { const p = c.parent; if (!p || !$b.is(p) && !$b.find(p).length) break; if ($(p).find('h3,h4,h5,h6').length > 1) break; c = p; }
      const $c = $(c);
      const itext = clean($c.find('p').first().text()) || clean($c.text()).replace(title, '').trim();
      const img = pickSrc($c.find('img').first(), base);
      const link = abs(($c.is('a') ? $c : $c.find('a').first()).attr('href'), base);
      itemKeys.add(keyOf(title));
      items.push({ title, text: !CONTACTY.test(itext) && itext.length >= 12 && itext.length <= 400 ? itext : '', image: imgOk(img) ? img : null, url: link });
    }
    // bullet lists as light items
    let bullets = [];
    if (items.length < 3) bullets = $b.find('ul li').toArray().map(li => clean($(li).text())).filter(t => t.length >= 4 && t.length <= 70 && !CONTACTY.test(t));

    // images owned by the block
    const imgs = $b.find('img').toArray().map(e => ({ src: pickSrc($(e), base), alt: clean($(e).attr('alt') || ''), w: parseInt($(e).attr('width') || '0', 10) })).filter(i => imgOk(i.src));
    const bigImg = imgs.find(i => !i.w || i.w >= 200);

    // testimonials
    const quotes = $b.find('blockquote, [class*="testimonial" i], [class*="review" i]').toArray().map(q => {
      const $q = $(q); const t = clean($q.find('p').first().text() || $q.text()); const a = clean($q.find('cite, .author, .name, [class*="author" i], [class*="name" i], footer, strong').first().text());
      return { text: t.length >= 30 && t.length <= 400 ? t : '', author: a && a.length <= 60 && a !== t ? a : '' };
    }).filter(q => q.text).slice(0, 4);

    // the intro line must come from outside the cards, otherwise the first card's text shows twice
    const owned = new Set(items.map(i => i.text).filter(Boolean));
    const intro = [...own, ...paras].find(t => !owned.has(t) && !quotes.some(q => q.text === t)) || '';
    let kind = '';
    if (quotes.length >= 1) kind = 'quotes';
    else if (LOGO_HEAD.test(heading) && imgs.length >= 4 && items.length < 2) kind = 'logos';
    else if (CTA_HEAD.test(heading) && items.length < 3) kind = 'cta';
    else if (items.length >= 3) kind = STEP_HEAD.test(heading) ? 'steps' : 'cards';
    else if (bullets.length >= 3 && intro) kind = 'split';
    else if (bullets.length >= 3) kind = 'list';
    else if (intro && (bigImg || items.length)) kind = 'split';
    else if (intro.length >= 60) kind = 'text';
    else if (items.length === 2) kind = 'cards';
    dbg.push(`${heading.slice(0, 20)}|p${paras.length}|i${items.length}|b${bullets.length}|m${imgs.length}|${kind || 'none'}`);
    if (!kind) continue;

    seen.add(hk);
    out.push({
      heading: trunc(heading, 80), text: trunc(intro, 260), kind,
      items: items.slice(0, 8).map(i => ({ ...i, text: trunc(i.text, 200) })),
      bullets: bullets.slice(0, 8),
      image: bigImg ? bigImg.src : null,
      logos: kind === 'logos' ? imgs.slice(0, 12).map(i => ({ src: i.src, alt: i.alt })) : [],
      quotes: kind === 'quotes' ? quotes : []
    });
    if (out.length >= 9) break;
  }
  return out;
}

/** The hero: first h1 with its supporting line and image. */
export function extractHero($, base) {
  const h1 = $('h1').first(); if (!h1.length) return null;
  const title = clean(h1.text()); if (title.length < 4 || title.length > 120) return null;
  let node = h1[0]; for (let i = 0; i < 3 && node.parent && !['body', 'html'].includes(node.parent.name); i++) node = node.parent;
  const $b = $(node);
  const sub = $b.find('p').toArray().map(p => clean($(p).text())).find(t => t.length >= 25 && t.length <= 220 && !CONTACTY.test(t)) || '';
  const ctas = $b.find('a').toArray().map(a => clean($(a).text())).filter(t => t.length >= 3 && t.length <= 28).slice(0, 2);
  return { title, sub, ctas };
}
