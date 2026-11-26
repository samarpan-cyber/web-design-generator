# Design Generator

Paste any company website → get **5 modern, interactive redesign concepts** built from that company's *real* content (name, logo, brand colour, products, images, contacts, certifications). Built to pitch electronics / hardware companies directly with "here's your site, redesigned".

```
chat box ──► /api/analyze (reads the live site) ──► profile JSON ──► 5 template engines ──► live previews
```

## The five concepts

| # | Concept | Default | Signature effects |
|---|---------|---------|-------------------|
| 1 | **Circuit Noir** | dark | Animated PCB-trace canvas with travelling pulses, spotlight-border cards, drag-scroll product rail, scroll-filled process timeline |
| 2 | **Bento Lab** | light | Floating pill nav, hero visual that scales/tilts with scroll, 3D-tilt bento grid, product shelf |
| 3 | **Blueprint** | dark (blueprint) / light (drafting paper) | Self-drawing SVG schematic, crosshair cursor with live X/Y readout, datasheet-style cards with scan-line hover |
| 4 | **Aurora Glass** | dark | Drifting gradient mesh, glassmorphism, pinned scroll-storytelling, draggable carousel |
| 5 | **Kinetic** | light | Giant type, scroll-velocity-skewed marquee, scroll-lit statement text, hover-image product index, cursor follower |

Every concept ships with: dark/light toggle · scroll-reveal animations · hover effects · live product search · **quote basket (RFQ)** that opens the visitor's email client addressed to the company · mobile layout · `prefers-reduced-motion` support · broken-image fallback (generated product artwork).

Research basis: 2026 hardware/tech design roundups (dark-first palettes, bento grids, scroll-driven product storytelling, per-product interactivity) plus B2B electronics conventions (datasheet/spec language, RFQ-first CTAs, certification badges).

## Using it

1. Type a URL (`temple-emc.com`) or a company name from your leads (`Temple Electromagnetics`), or click a lead card.
2. Five live previews appear. **Hover → Interact** to scroll a design inside its card. **Full screen** opens present mode (desktop / tablet / mobile switch, dark/light, ←/→ between concepts, Esc to close).
3. **Edit details** fixes anything the scraper missed (name, headline, colour, logo, contacts, your agency name) and re-renders all five instantly.
4. **Download .html** gives a single self-contained file per concept to send to the prospect.
5. Type `dark` / `light` / `auto` in the chat to flip all previews.

## Run locally

```bash
npm install
npm start            # http://localhost:3000
npm test             # extractor + template safety tests
```

Your CRM export lives in `data/leads.csv` (git-ignored). Rebuild the chat's lead list with `npm run leads` — only company / website / city are published to the browser (no emails or phone numbers).

## Deploy

The app is a static frontend + one stateless function (`/api/analyze`), so it runs anywhere:

- **Vercel (simplest):** import the repo → deploy. `vercel.json` and `api/` are already set up.
- **Render / Railway / Fly / any VPS:** `npm start` (Node ≥ 20), or use the included `Dockerfile`.

Environment variables:

| Var | Purpose |
|-----|---------|
| `ACCESS_KEY` | *(recommended)* If set, the API requires this key; the UI prompts once per browser session. Prevents strangers using your deployment to fetch arbitrary sites. |
| `PORT` | Node server port (default 3000) |

Built-in protections: SSRF guard (private/loopback/metadata IPs blocked, re-checked on every redirect), 12 s timeout, 2.5 MB response cap, per-IP rate limit (20/min), HTML-escaped output + URL scheme allow-listing, designs rendered in sandboxed iframes.

> The scraper must run somewhere with open internet access. Locked-down networks (e.g. a sandbox with an allow-list) will return "domain could not be found".

## Known limits (be upfront with prospects' sites)

- Sites that build their pages entirely with JavaScript (SPAs) expose little in raw HTML. The UI warns you, and **Edit details** lets you fill the gaps.
- Product photos are hot-linked from the live site. Downloaded `.html` files therefore need internet access, and a site that blocks hot-linking will fall back to generated artwork.
- Sections like "process", "applications" and some headings are **draft sample copy** — review before sending. Placeholders (when fewer than 6 products are found) are flagged in the chat.
- Statistics shown come from the site's own text (e.g. "20+ years") or are counts of what was found; nothing is invented.

## Project layout

```
public/            frontend (chat UI, preview grid, present mode)
  engine/          the 5 templates + shared helpers + in-page runtime
lib/               extractor (cheerio), safe fetcher, colour utils, API handler
api/               Vercel functions        server.js  plain Node server
scripts/           build-leads · shoot (screenshots) · e2e (browser smoke test)
test/              unit tests + HTML fixture
```

Add a sixth concept: create `public/engine/t6-name.js` exporting a `render(profile, opts)` function (copy any existing template) and register it in `public/engine/index.js`.
