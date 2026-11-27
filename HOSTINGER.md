# Deploying the Design Generator on Hostinger (Node.js)

1. hPanel > Websites > Add website > **Node.js Apps**. Upload `digifyo-design-generator-v4.0.0.zip` (or connect the GitHub repo).
2. Settings: Node **22**, entry file **server.js** (included in the zip; it starts `local-server.js`), run **NPM install**.
3. Environment variables (hPanel > Environment variables):

| Variable | Value |
|---|---|
| `WDG_AUTH` | output of `node scripts/make-auth.mjs "Samarpan:password" "Chirag:password"` (salted hashes and a signing secret) |
| `DESIGNER_NAME` / `DESIGNER_PHONE` / `DESIGNER_WHATSAPP` / `DESIGNER_EMAIL` | Chirag's details, shown on every design |
| `ANTHROPIC_API_KEY` | optional, only to read screenshots |

4. Restart. Open the domain, log in, pick Electronics.

You do not need this app if you use the CRM: Digifyo CRM v6 contains the same generator (Website designs in the sidebar).
