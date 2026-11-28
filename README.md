# Design Generator V9

Log in, pick an industry, paste a company website, and get **five distinct, mobile-ready, five-page redesign concepts** built from that company's real content. Share them with the client through a private link that stops working after 48 hours.

```
login → industry → website or lead → /api/analyze reads the live site → profile → 5 designs → share link
```

## What V9 adds

- **Designs modelled on sites you like.** Fourteen new designs, none of them glassy: electronics and industrial (Factory Floor, Brand Store, Showroom Elementor, Label Hero), real estate (Night Skyline, Masterpiece, Project Ledger, Curtain), dentists and doctors (Appointment First, Elementor Dental, Doctor Portrait, Round Care). Frosted glass designs are still there but rarely suggested.
- **Content from anywhere.** Add the client's old or current website, a directory or marketplace listing (Practo, Justdial, IndiaMART, TradeIndia, Sulekha and similar), a saved page (.html) or pasted page source, and photo links or photo files (shrunk in the browser). Structured data on those pages (name, phone, address, rating, hours, reviews, doctors, products, photos) fills only what is missing. The industry follows the best source. Sites that block automated readers are reported, with the save-as-HTML fallback.
- **Expired links** say "This link has expired. Please contact Digifyo for the design", show Chirag's call, WhatsApp, email, LinkedIn and website, and note that every link expires in 48 hours for data safety. In the phone viewer the footer is gone so the design gets the whole screen.

## What V8 added

- **Plastic recycling and Chemicals** join the home page as new industries, detected from the website, Google Business text, notes and sheets. Plastic recycling kinds: machinery maker, recycler or regranulator, collector or trader. Chemicals kinds: industrial and specialty, metal and surface treatment, water treatment, distributor. The extractor (`lib/industrial.js`) reads stat cards as counters, "industries served" and "materials" cards, quality and standards cards and process steps from the page. Tested on two real sites (see `docs/RESEARCH-INDUSTRIAL-CLINICS.md`).
- **Eleven industrial designs** for electronics, plastic recycling and chemicals: Forge, Lab Notes, Closed Loop, Pellet Pop, Flow, Catalogue Pro, Plant Tour and Brand Lab (creative, each with its own fonts, hero and signature effect) plus Corporate WordPress, Catalogue WordPress and Elementor Style (plain). RFQ basket on every one.
- **Seven more doctor and dentist designs:** Little Smiles, Luxe Aesthetic, Care Compass (emergency bar and live treatment search), Mono Clinic, Calm Breath, Glass Tech (creative) and Health Pro WordPress (plain). Segment weights steer them (kids, cosmetic, hospital, wellness, implants).
- **Shared effects module** `public/engine/fx.js`: parallax, drag scrollers, tilt, magnetic buttons, cursor label, spotlight, tabs, live filters, calculators, step light-up and a drawing timeline. It respects reduced motion and skips pointer effects on touch devices.
- **More stock photos** for plastic recycling, chemicals and process equipment, and more for electronics, dentists and doctors, captioned "Illustrative image".

## What V7 added

- **Real estate.** A fourth industry with eight designs: six creative (Skyline, Atelier, Homestead, Listings, Terra, Workplace) with parallax, slow zoom, drag galleries, tilt cards, magnetic buttons, live filters and calculators, plus two plain WordPress/Elementor style (Property Search, Developer Classic). Research notes: `docs/RESEARCH-REAL-ESTATE.md`.
- **Kind of business, not just industry.** Every industry now has segments and the generator suggests designs that fit: real estate (residential, luxury, commercial, plots, mixed; developer or agency), electronics (manufacturer, distributor, product brand), doctors (clinic, individual, hospital, wellness) and dentists (general, cosmetic, braces, implants, kids). It is detected from the website, Google Business text, LinkedIn text, notes and sheets, shown with the reasons, and changed with the **Focus** selects above the designs.
- **Real estate facts from the site.** Projects with location, sizes, area, price and status, RERA numbers, locations and amenities are read from the page or from a project sheet. Nothing is invented: without projects, designs show property types instead.
- **Stock photos for real estate** (residential, commercial, land) when the site has few or small photos, captioned "Illustrative image".

## What V4.2 added

- **Stock photos when a site has none.** Clinics rarely have good photos beyond a logo. When the prospect's own site has few or small photos, designs fill the gaps with fast, high resolution stock photos from `public/stock` (about 130 KB each, Pexels licence, see `public/stock/LICENSE.txt`). The prospect's own logo and photos always come first, small images and logos are never stretched across a hero, and every design in a set gets different photos. Electronics designs use the same fallback instead of generated artwork. Stock photos are never shown as the prospect's doctors, staff or products.
- **No more stuck "reading the site".** One clock now covers the whole read (24 seconds): a slow page, a redirect chain, a hung server or a DNS lookup that never answers all stop on it, and the page shows a clear message after 55 seconds at most.

## What V4.1 added

- **Doctors and Dentists.** Two new industries on the home page, with eight clinic designs (four creative, four plain WordPress/Elementor style). Built from research into top clinic sites: booking above the fold, hours and location, named doctors with credentials, reviews, calm colours, one consistent treatment layout and an FAQ. Doctor names, hours, ratings and reviews are shown only when the site or your details contain them.
- **Smart industry detection.** `public/engine/industry.js` works out the industry from the website, Google Business category, LinkedIn headline, notes, lead industry and title. The result and the reasons are shown, and you can switch back. **Add data** takes a LinkedIn link, a Google Maps link, pasted Google Business text, notes and files, and **No website? Start from details** builds a set from those alone.
- Add a template in `public/engine/index.js` and it joins the pool for the industries it lists.

## What V4 added

- **Plain, WordPress-style designs.** Four extra designs (Corporate Classic, Industrial Pro, Clean Catalog, Modern Business) that look hand-built on WordPress with Elementor: Open Sans, Roboto, Lato and Poppins, top bar, photo hero, icon boxes, grey placeholders where there is no photo. Each set of five is three creative plus two plain designs. **Shuffle set** picks another combination from the library (`public/engine/index.js`, add a template there and it joins the pool).
- **Sites that cannot be crawled.** **Add data** takes an Excel or CSV product list, a sitemap.xml, Google Business text or JSON, or a screenshot. Screenshots are read by a vision model when `ANTHROPIC_API_KEY` is set (optional `VISION_MODEL`).
- **Designed by Digifyo.** Every design and every share page carries the designer's name, call, WhatsApp and email. Set `DESIGNER_COMPANY`, `DESIGNER_NAME`, `DESIGNER_ROLE`, `DESIGNER_PHONE`, `DESIGNER_WHATSAPP`, `DESIGNER_EMAIL`, `DESIGNER_SITE`. Nothing is invented: empty fields are hidden.
- **CRM integration.** The same engine runs inside Digifyo CRM v6 (leads in, links on crm.digifyo.com, open tracking). See HOSTINGER.md.

## What V3 added

- **Login.** Only people with a username and password can open the generator, scrape sites or see the lead list. Passwords are never stored: only salted scrypt hashes, in one server-side setting.
- **Private client links.** "Share with client" creates a link that shows only the five designs, needs no login, and expires after **48 hours**. Clients can explore and switch themes and devices, but cannot edit or download.
- **Full homepages.** Each design rebuilds the original site's own sections (cards, story, logos, testimonials) after the hero, then products, stats and the quote steps. Sites that expose little still get a full page.
- **Much better product capture.** The crawler uses Shopify and WooCommerce APIs, listing pages, pagination, category pages, the sitemap and product detail pages, inside an 18 second budget. Menu pages and "what we make" sections are the fallback when a site has no product grid.
- **Navigation.** Every step (Industry, Website, Compare, Pitch) is a button. Your results are kept when you go back to the Website step.

## Set up login (required, one minute)

The repo is public, so it contains **no passwords and no secrets**. Everything lives in one environment variable, `WDG_AUTH`.

```bash
node scripts/make-auth.mjs "Samarpan:their-password" "Chirag:their-password"
```

It prints a JSON value (salted hashes plus a random signing secret). In Vercel go to **Settings, Environment Variables**, add `WDG_AUTH` with that value, then **Redeploy**. Until it is set the generator stays locked and the login page says so. To add or change a user, run the script again and replace the variable. Changing the value signs everyone out.

## Share links

- Default: a signed link that carries the designs inside it. Nothing is stored, so it works with no extra setup. The signature enforces the 48 hour expiry.
- Optional short links: add Vercel KV or Upstash Redis (`KV_REST_API_URL` and `KV_REST_API_TOKEN`). Links become `/s/<short id>` and the data expires in Redis after 48 hours.

Shared pages are marked `noindex`, are never cached, and send no referrer.

## The five designs

| Design | Look | Navigation | Signature |
|---|---|---|---|
| **Circuit Noir** | Dark tech | Top bar | Live circuit canvas, drag rail, Ctrl K search |
| **Bento Lab** | Warm cream, serif | Floating pill | Bento tiles, masonry catalogue |
| **Blueprint** | Engineering sheet | Left sheet index | Self-drawing schematic, table catalogue, RFQ form |
| **Aurora Glass** | Soft futurism | Bottom dock | Pinned scroll story, glass cards |
| **Kinetic** | Loud editorial | Full-screen menu | Giant type, hover-preview index |

All five have dark and light mode, five pages, product search and a quote basket that opens the visitor's email app addressed to the company. Copy follows one short, witty voice with no em dashes and no repeated lines, enforced by tests.

## Run locally

```bash
npm install
node scripts/make-auth.mjs "You:a-password"   # also writes data/wdg-auth.json (git-ignored)
npm start                                      # http://localhost:3000
npm test
node scripts/e2e.mjs                           # drives the real UI with throwaway test credentials
```

`data/leads.csv` (git-ignored) feeds `npm run leads`, which writes `lib/leads-data.js` (company, website and city only). The lead list is served only to logged-in users.

## Deploy

Static frontend plus stateless functions (`api/`). On Vercel, import the repo and set `WDG_AUTH`. On Render, Railway, Fly or a VPS use `npm start` (Node 20 or newer) or the `Dockerfile`, with `WDG_AUTH` set.

Protections: server-verified login, HttpOnly SameSite session cookie (12 hours), login rate limit, constant-time checks, JSON-only POSTs with origin checks, SSRF guard on the scraper, response caps, HTML escaping and URL allow-listing, sandboxed previews.

## Limits

- The design engine runs in the browser, so someone who is not logged in can read the template code. They still cannot scrape sites or see leads, which need a session.
- Sites that build their pages entirely with JavaScript expose little HTML. The chat says so and Edit details fills the gaps.
- Product photos are hot-linked. A site that blocks hot-linking falls back to generated artwork.
- Copy never invents numbers, awards or claims. Stats come from the site or are counts of what was found.
- A signed share link cannot be revoked early (use KV short links for that); it simply expires.

## Layout

```
public/            frontend (login, industry, chat, previews, share page)
  engine/          copy.js (voice), common.js (model + shell + sections), runtime.js, t1 to t5 (designs)
lib/               auth, share, handler, extractor (extract, products, sections), safe fetcher
api/               Vercel functions       local-server.js  plain Node server
scripts/           make-auth, build-leads, shoot, e2e, live-test, probe
test/              unit tests + fixtures
```
