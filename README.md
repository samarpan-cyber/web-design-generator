# Design Generator V3

Log in, pick an industry, paste a company website, and get **five distinct, mobile-ready, five-page redesign concepts** built from that company's real content. Share them with the client through a private link that stops working after 48 hours.

```
login → industry → website or lead → /api/analyze reads the live site → profile → 5 designs → share link
```

## What V3 adds

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
