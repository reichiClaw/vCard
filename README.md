# reichi.id contact card

Fast, static contact page for [reichi.id](https://reichi.id). It detects the visitor’s OS and presents the best way to save the contact.

## Platform behavior

| Platform | Best option | Why |
| --- | --- | --- |
| **iOS / iPadOS** | Tap **Add to Contacts** (vCard) | Safari opens a native contact sheet (`Create New Contact` / `Add to Existing Contact`). |
| **Android (on the phone)** | **Android `INSERT` intent** | `.vcf` files only download on Android — they do not open a save sheet. Chrome can launch `android.intent.action.INSERT` with `S.name` / `S.email` / `S.phone` extras so the native Contacts editor opens pre-filled. Fallback: copy details. |
| **Desktop → phone** | **Scan the QR** | QR shines when this page is on a laptop/monitor and the phone’s camera does the save. |
| **macOS** | Download `.vcf` | Opens in Contacts.app. QR is offered for saving onto a phone. |
| **Windows** | Download `.vcf` | Opens in People / Outlook. QR for phone save. |
| **Linux / other** | Download `.vcf` or scan QR | Use Evolution, GNOME Contacts, or any vCard-capable app — or scan from a phone. |

Direct static file: [`/contact.vcf`](./contact.vcf)  
Query shortcuts: `/?download=1` or `/?vcf=1`

## Edit your details

Update [`contact.json`](./contact.json) — one source of truth for the page, QR payload, and generated vCard.

Also keep [`contact.vcf`](./contact.vcf) in sync if you want the static file to match (or regenerate it after editing JSON).

## Run locally

Any static server works:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy on Cloudflare Pages (reichi.id)

This repo is plain static files — **no build step**. `_headers` is picked up by Cloudflare Pages for the vCard MIME type.

### 1. Create the Pages project

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Connect GitHub and select `reichiClaw/vCard`.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** leave empty
   - **Build output directory:** `/` (repo root)
4. Save and deploy. You’ll get a URL like `https://vcard.<account>.pages.dev`.

Every push to the production branch redeploys automatically. Preview URLs are created for other branches/PRs.

### 2. Attach `reichi.id`

1. Add the domain in Cloudflare (if it isn’t already): **Websites** → **Add a site** → `reichi.id` → move nameservers when asked.
2. In the Pages project → **Custom domains** → **Set up a custom domain** → `reichi.id` (and optionally `www.reichi.id`).
3. Cloudflare will create the DNS records for you (CNAME to the Pages project). Keep the proxy **proxied** (orange cloud).
4. SSL is automatic (Full / Strict once the cert is issued).

### 3. Optional DNS notes

If `reichi.id` was already on Cloudflare for something else, either:

- point the apex/`www` at this Pages project, or  
- use a subdomain (e.g. `card.reichi.id`) via **Custom domains**

### 4. Verify

- `https://reichi.id/` — contact page  
- `https://reichi.id/contact.vcf` — should be `Content-Type: text/vcard` (from `_headers`)  
- Android Chrome: **Add to Contacts** opens the native editor  
- iOS Safari: **Add to Contacts** opens the contact sheet  

### CLI alternative (Wrangler)

```bash
npx wrangler pages deploy . --project-name=reichi-id --commit-dirty=true
```

Then attach `reichi.id` under the project’s **Custom domains** as above.

## Stack

- Vanilla HTML / CSS / JS
- [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) (vendored, ~20 KB) for offline QR rendering
- No bundler, no framework
