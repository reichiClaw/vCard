# reichi.id contact card

Fast, static contact page for [reichi.id](https://reichi.id). It detects the visitor’s OS and presents the best way to save the contact.

## Platform behavior

| Platform | Best option | Why |
| --- | --- | --- |
| **iOS / iPadOS** | Tap **Add to Contacts** (vCard) | Safari opens a native contact sheet (`Create New Contact` / `Add to Existing Contact`). |
| **Android** | **Scan the QR code** with Camera | Chrome typically downloads `.vcf` files instead of showing a contact preview. Camera → scan vCard QR → **Add contact** is the smoothest path. Download `.vcf` remains available as a fallback (open with Contacts). |
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

## Deploy to reichi.id

This repo is plain static files — no build step.

- **Cloudflare Pages / Netlify**: publish the repo root. `_headers` sets the vCard MIME type.
- **GitHub Pages**: enable Pages on `main` / root. `.vcf` downloads work; MIME may vary by host.
- Point the `reichi.id` DNS to your host.

## Stack

- Vanilla HTML / CSS / JS
- [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) (vendored, ~20 KB) for offline QR rendering
- No bundler, no framework
