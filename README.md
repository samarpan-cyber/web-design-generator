# Design Generator V2

Pick an industry, paste a company website, and get **five distinct, mobile-ready, five-page redesign concepts** built from that company's real content. Built to pitch electronics and hardware companies with "here is your site, redesigned".

```
industry → website or lead → /api/analyze reads the live site → profile → 5 template engines → previews
```

## What is new in V2

- **Industry picker first.** The generator opens by asking which industry you are designing for. Electronics is live. Manufacturing, Healthcare, Real estate, Logistics and Software are placeholders.
- **Five genuinely different designs**, each with its own fonts, navigation pattern and page layouts (table below).
- **Every design is a five-page site** (home, catalogue, sectors, company, contact) with working navigation, a real contact form and a quote basket.
- **Copy engine.** One short, witty, action-driving voice. No em or en dashes anywhere, no walls of text, no repeated lines. Tests enforce all three.
- **Smoother scrolling.** One batched scroll loop, no per-scroll style invalidation, no full-page blur or blend effects. Previews stay calm until hovered.
- **Back to the generator, always.** Full-screen view has its own URL, so the browser Back button works. Tabs opened from the generator carry a "Back to Design Generator" pill.
- **Pitch tools.** Star your favourites, then copy a ready-to-send pitch note. Loading skeletons, mobile layout, stepper.

## The five designs

| Design | Look | Fonts | Navigation | Signature |
|---|---|---|---|---|
| **Circuit Noir** | Dark tech | Space Grotesk, JetBrains Mono | Top bar | Live circuit canvas, drag rail, Ctrl K command palette |
| **Bento Lab** | Warm cream, editorial | DM Serif Display, DM Sans | Floating pill | Bento tiles, scroll-tilting hero, masonry catalogue |
| **Blueprint** | Engineering sheet | Barlow Condensed, IBM Plex Mono | Left sheet index | Self-drawing schematic, table catalogue, RFQ form, crosshair |
| **Aurora Glass** | Soft futurism | Sora | Bottom dock | Pinned scroll story, glass cards, gradient glow |
| **Kinetic** | Loud editorial | Bricolage Grotesque, Instrument Serif | Full-screen menu | Giant type, velocity marquee, hover-preview index |

All five have dark and light mode, scroll reveals, hover effects, product search and a quote basket that opens the visitor's email app addressed to the company.

## Using it

1. Choose **Electronics and hardware**.
2. Type a URL (`temple-emc.com`), a company name from your leads, or click a lead card.
3. Five live previews appear. Hover one to wake it up, or tap "Tap to scroll it". **Full screen** opens present mode (desktop, tablet, phone, dark, light, arrow keys).
4. Star favourites, **Copy pitch note**, then **Download** the HTML files to send.
5. **Edit details** fixes anything the scraper missed and updates all five at once.

## Run locally

```bash
npm install
npm start      # http://localhost:3000
npm test       # extractor, copy rules, template safety
```

`data/leads.csv` (git-ignored) feeds `npm run leads`, which writes `public/leads.json` (company, website, city only).

## Deploy

Static frontend plus one stateless function, so it runs anywhere.

- **Vercel:** import the repo. `vercel.json` forces the static preset; `api/` holds the functions.
- **Render, Railway, Fly, VPS:** `npm start` (Node 20 or newer) or the included `Dockerfile`. The entry file is `local-server.js`.

| Variable | Purpose |
|---|---|
| `ACCESS_KEY` | Recommended. If set, the API requires this key and the UI asks for it once per session. The variable name must be exactly `ACCESS_KEY`. |
| `PORT` | Node server port (default 3000) |

Protections: SSRF guard (private and metadata addresses blocked, re-checked on every redirect), 12 s timeout, 2.5 MB cap, per-IP rate limit, HTML escaping and URL allow-listing, previews in sandboxed iframes.

## Limits

- Sites that build pages entirely with JavaScript expose little HTML. The chat says so and Edit details fills the gaps.
- Product photos are hot-linked. A site that blocks hot-linking falls back to generated artwork.
- Copy is written to be accurate and generic: it never invents numbers, awards or claims. Stats come from the site or are counts of what was found.
- When fewer than six real products are found, placeholder names are used and the chat flags it.

## Layout

```
public/            frontend (industry gate, chat, previews, present mode)
  engine/          copy.js (voice), common.js (model + shell), runtime.js (router, scroll, quote basket), t1 to t5 (designs)
lib/               extractor, safe fetcher, colour utils, API handler
api/               Vercel functions       local-server.js  plain Node server
scripts/           build-leads, shoot (screenshots + overflow), e2e, live-test, live-e2e
test/              unit tests + fixture
```

Add a sixth design: copy any `public/engine/tN-*.js`, give it a new voice index in `copy.js`, and register it in `public/engine/index.js`. Add an industry by adding it to `INDUSTRIES` in `public/app.js` once it has its own leads and copy.
