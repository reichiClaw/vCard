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

## Deploy to reichi.id

This repo is plain static files — no build step.

- **Cloudflare Pages / Netlify**: publish the repo root. `_headers` sets the vCard MIME type.
- **GitHub Pages**: enable Pages on `main` / root. `.vcf` downloads work; MIME may vary by host.
- Point the `reichi.id` DNS to your host.

## Stack

- Vanilla HTML / CSS / JS
- [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) (vendored, ~20 KB) for offline QR rendering
- No bundler, no framework
