(() => {
  "use strict";

  const els = {
    brand: document.getElementById("brand"),
    headline: document.getElementById("headline"),
    lede: document.getElementById("lede"),
    ctaGroup: document.getElementById("cta-group"),
    primaryCta: document.getElementById("primary-cta"),
    secondaryCta: document.getElementById("secondary-cta"),
    platformHint: document.getElementById("platform-hint"),
    qrPanel: document.getElementById("qr-panel"),
    qrcode: document.getElementById("qrcode"),
    qrCaption: document.getElementById("qr-caption"),
    detailList: document.getElementById("detail-list"),
    footerName: document.getElementById("footer-name"),
  };

  /** @typedef {"ios"|"android"|"macos"|"windows"|"linux"|"other"} Platform */

  /**
   * @returns {{ platform: Platform, label: string }}
   */
  function detectPlatform() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const touchMac = navigator.maxTouchPoints > 1 && /Mac/i.test(platform);

    if (/iPhone|iPad|iPod/i.test(ua) || touchMac) {
      return { platform: "ios", label: "iOS" };
    }
    if (/Android/i.test(ua)) {
      return { platform: "android", label: "Android" };
    }
    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
      return { platform: "macos", label: "macOS" };
    }
    if (/Win/i.test(platform) || /Windows/i.test(ua)) {
      return { platform: "windows", label: "Windows" };
    }
    if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
      return { platform: "linux", label: "Linux" };
    }
    return { platform: "other", label: "your device" };
  }

  /**
   * Escape text for vCard values (RFC 6350 style escaping for 3.0).
   * @param {string} value
   */
  function escapeVCard(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  /**
   * Fold long vCard lines at 75 octets (approx chars for ASCII payloads).
   * @param {string} line
   */
  function foldLine(line) {
    if (line.length <= 75) return line;
    let out = line.slice(0, 75);
    let rest = line.slice(75);
    while (rest.length) {
      out += "\r\n " + rest.slice(0, 74);
      rest = rest.slice(74);
    }
    return out;
  }

  /**
   * @param {Record<string, string>} contact
   */
  function buildVCard(contact) {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "PRODID:-//reichi.id//contact//EN",
      `N:${escapeVCard(contact.lastName || "")};${escapeVCard(contact.firstName || "")};;;`,
      `FN:${escapeVCard(contact.displayName || `${contact.firstName} ${contact.lastName}`.trim())}`,
    ];

    if (contact.organization) {
      lines.push(`ORG:${escapeVCard(contact.organization)}`);
    }
    if (contact.title) {
      lines.push(`TITLE:${escapeVCard(contact.title)}`);
    }
    if (contact.phone) {
      const type = contact.phoneType || "CELL";
      lines.push(`TEL;TYPE=${type}:${escapeVCard(contact.phone)}`);
    }
    if (contact.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(contact.email)}`);
    }
    if (contact.website) {
      lines.push(`URL:${escapeVCard(contact.website)}`);
    }
    if (contact.github) {
      lines.push(`URL:${escapeVCard(contact.github)}`);
    }
    if (contact.note) {
      lines.push(`NOTE:${escapeVCard(contact.note)}`);
    }
    if (contact.uid) {
      lines.push(`UID:${escapeVCard(contact.uid)}`);
    }

    lines.push(`REV:${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`);
    lines.push("END:VCARD");

    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  /**
   * @param {string} vcard
   * @param {string} filename
   * @param {"open"|"download"} mode
   */
  function deliverVCard(vcard, filename, mode) {
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    if (mode === "open") {
      // iOS Safari: navigating to a vCard blob presents the native contact sheet.
      window.location.href = url;
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "contact.vcf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Encode a string intent extra. Values must not contain raw ';' (delimiter).
   * @param {string} value
   */
  function encodeIntentExtra(value) {
    return encodeURIComponent(String(value));
  }

  /**
   * Build a Chrome/Android Intent URI that opens the native "Add contact" editor
   * pre-filled — no .vcf download. See ContactsContract.Intents.Insert.
   * @param {Record<string, string>} contact
   */
  function buildAndroidInsertIntent(contact) {
    /** @type {string[]} */
    const parts = ["action=android.intent.action.INSERT"];

    const name =
      contact.displayName ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    if (name) parts.push(`S.name=${encodeIntentExtra(name)}`);
    if (contact.phone) parts.push(`S.phone=${encodeIntentExtra(contact.phone)}`);
    if (contact.email) parts.push(`S.email=${encodeIntentExtra(contact.email)}`);
    if (contact.organization) {
      parts.push(`S.company=${encodeIntentExtra(contact.organization)}`);
    }
    if (contact.title) {
      parts.push(`S.job_title=${encodeIntentExtra(contact.title)}`);
    }

    const noteBits = [];
    if (contact.website) noteBits.push(contact.website);
    if (contact.github) noteBits.push(contact.github);
    if (contact.note) noteBits.push(contact.note);
    if (noteBits.length) {
      parts.push(`S.notes=${encodeIntentExtra(noteBits.join("\n"))}`);
    }

    // If the intent cannot run (non-Chrome, blocked, etc.), land on the details.
    const fallback = encodeURIComponent(
      `${location.origin}${location.pathname}#details`
    );
    parts.push(`S.browser_fallback_url=${fallback}`);

    // Path carries RawContacts.CONTENT_TYPE; extras prefill the editor.
    // Requires a user gesture (anchor tap). Works in Chrome / most WebViews.
    return `intent://vnd.android.cursor.dir/raw_contact/#Intent;${parts.join(
      ";"
    )};end`;
  }

  /**
   * @param {Record<string, string>} contact
   */
  function contactPlainText(contact) {
    return [
      contact.displayName ||
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      contact.phone,
      contact.email,
      contact.website,
      contact.github,
      contact.organization,
      contact.title,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Wire a CTA anchor: either a real href (Android intent) or a click handler.
   * @param {HTMLAnchorElement} el
   * @param {{ label: string, href?: string, onClick?: (e: Event) => void, className: string, hidden?: boolean }} opts
   */
  function bindCta(el, opts) {
    el.hidden = Boolean(opts.hidden);
    el.className = opts.className;
    el.textContent = opts.label;
    el.removeAttribute("aria-disabled");

    if (opts.href) {
      el.href = opts.href;
      el.onclick = opts.onClick || null;
      return;
    }

    el.href = "#";
    el.onclick = (e) => {
      e.preventDefault();
      opts.onClick?.(e);
    };
  }

  /**
   * @param {string} vcard
   */
  function renderQr(vcard) {
    if (typeof qrcode !== "function") return false;

    const typeNumber = 0; // auto
    const errorCorrectionLevel = "M";
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(vcard);
    qr.make();

    els.qrcode.innerHTML = qr.createSvgTag(4, 0);
    const svg = els.qrcode.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("viewBox", svg.getAttribute("viewBox") || "0 0 100 100");
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "QR code containing contact vCard");
    }
    return true;
  }

  /**
   * @param {Record<string, string>} contact
   */
  function renderDetails(contact) {
    /** @type {{ label: string, value: string, href?: string, copy?: string }[]} */
    const rows = [];

    rows.push({ label: "Name", value: contact.displayName, copy: contact.displayName });

    if (contact.email) {
      rows.push({
        label: "Email",
        value: contact.email,
        href: `mailto:${contact.email}`,
        copy: contact.email,
      });
    }
    if (contact.phone) {
      rows.push({
        label: "Phone",
        value: contact.phone,
        href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`,
        copy: contact.phone,
      });
    }
    if (contact.website) {
      rows.push({
        label: "Web",
        value: contact.website.replace(/^https?:\/\//, ""),
        href: contact.website,
        copy: contact.website,
      });
    }
    if (contact.github) {
      rows.push({
        label: "GitHub",
        value: contact.github.replace(/^https?:\/\//, ""),
        href: contact.github,
        copy: contact.github,
      });
    }
    if (contact.organization) {
      rows.push({ label: "Org", value: contact.organization, copy: contact.organization });
    }
    if (contact.title) {
      rows.push({ label: "Title", value: contact.title, copy: contact.title });
    }

    els.detailList.innerHTML = "";
    for (const row of rows) {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = row.label;

      const value = document.createElement("span");
      value.className = "value";
      if (row.href) {
        const a = document.createElement("a");
        a.href = row.href;
        a.textContent = row.value;
        if (row.href.startsWith("http")) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        value.appendChild(a);
      } else {
        value.textContent = row.value;
      }

      li.append(label, value);

      if (row.copy) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.textContent = "Copy";
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(row.copy);
            btn.textContent = "Copied";
            window.setTimeout(() => {
              btn.textContent = "Copy";
            }, 1400);
          } catch {
            btn.textContent = "Failed";
            window.setTimeout(() => {
              btn.textContent = "Copy";
            }, 1400);
          }
        });
        li.appendChild(btn);
      }

      els.detailList.appendChild(li);
    }
  }

  /**
   * @param {Platform} platform
   * @param {Record<string, string>} contact
   * @param {string} vcard
   */
  function configurePlatform(platform, contact, vcard) {
    const filename = contact.filename || "contact.vcf";
    const showQr = () => {
      const ok = renderQr(vcard);
      if (ok) {
        els.qrPanel.hidden = false;
      }
    };

    els.ctaGroup.hidden = false;
    els.platformHint.hidden = false;

    if (platform === "ios") {
      els.headline.textContent = "Add me to your contacts";
      els.lede.textContent =
        "On iPhone and iPad, Safari opens this as a contact card you can save in one step.";
      bindCta(els.primaryCta, {
        label: "Add to Contacts",
        className: "btn btn-primary",
        href: new URL("contact.vcf", location.href).href,
      });
      bindCta(els.secondaryCta, {
        label: "",
        className: "btn btn-ghost",
        hidden: true,
      });
      els.platformHint.textContent =
        "Normally iOS opens the card automatically when you visit reichi.id. Use this button if you landed on the page view.";
      return;
    }

    if (platform === "android") {
      // .vcf downloads on Android do not open a save sheet. Use an INSERT intent
      // so Chrome opens the native Contacts editor pre-filled.
      const intentUrl = buildAndroidInsertIntent(contact);
      els.headline.textContent = "Add me to your contacts";
      els.lede.textContent =
        "On Android, this opens the Contacts app with my details already filled in — then tap Save.";
      bindCta(els.primaryCta, {
        label: "Add to Contacts",
        className: "btn btn-primary",
        href: intentUrl,
      });
      bindCta(els.secondaryCta, {
        label: "Copy details",
        className: "btn btn-ghost",
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(contactPlainText(contact));
            els.secondaryCta.textContent = "Copied";
            window.setTimeout(() => {
              els.secondaryCta.textContent = "Copy details";
            }, 1400);
          } catch {
            els.secondaryCta.textContent = "Copy failed";
            window.setTimeout(() => {
              els.secondaryCta.textContent = "Copy details";
            }, 1400);
          }
        },
      });
      els.platformHint.textContent =
        "Uses Android’s Add Contact screen (Chrome). No .vcf file. If your browser blocks it, copy the details below.";
      return;
    }

    // Desktop / other
    const labels = {
      macos: "macOS",
      windows: "Windows",
      linux: "Linux",
      other: "desktop",
    };
    const osName = labels[platform] || "desktop";

    els.headline.textContent = "Save my contact card";
    els.lede.textContent = `On ${osName}, download the vCard for your contacts app — or scan the QR with your phone.`;
    bindCta(els.primaryCta, {
      label: "Download .vcf",
      className: "btn btn-primary",
      onClick: () => deliverVCard(vcard, filename, "download"),
    });
    bindCta(els.secondaryCta, {
      label: "Show QR for phone",
      className: "btn btn-ghost",
      onClick: () => {
        showQr();
        els.qrCaption.textContent = "Scan with your phone camera";
      },
    });
    els.platformHint.textContent =
      platform === "macos"
        ? "The .vcf opens in Contacts.app. Prefer saving on your phone? Use the QR."
        : platform === "windows"
          ? "The .vcf opens in People / Outlook. Prefer saving on your phone? Use the QR."
          : "Open the .vcf with your contacts app, or scan the QR from your phone.";
    showQr();
    els.qrCaption.textContent = "Scan with your phone camera";
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const forcePage =
      params.has("page") ||
      params.has("html") ||
      params.get("view") === "page";
    const { platform } = detectPlatform();

    // iOS: jump straight to the vCard so Safari shows the native sheet.
    // On Cloudflare, Pages middleware does this at the edge for iPhone/iPad UAs.
    // This client path covers local preview and iPadOS that reports as Macintosh.
    if (
      platform === "ios" &&
      !forcePage &&
      !params.has("download") &&
      !params.has("vcf")
    ) {
      els.headline.textContent = "Opening contact…";
      els.lede.textContent = "Safari is loading the contact card.";
      els.ctaGroup.hidden = true;
      els.platformHint.hidden = true;
      window.location.replace(new URL("contact.vcf", location.href).href);
      return;
    }

    const response = await fetch("./contact.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load contact.json (${response.status})`);
    }
    const contact = await response.json();
    const vcard = buildVCard(contact);

    els.footerName.textContent = contact.displayName || "Contact";
    document.title = `${contact.displayName || "Contact"} — reichi.id`;
    renderDetails(contact);
    configurePlatform(platform, contact, vcard);

    // Deep link helpers: ?download=1 or ?vcf=1
    if (params.has("download") || params.has("vcf")) {
      deliverVCard(
        vcard,
        contact.filename || "contact.vcf",
        platform === "ios" ? "open" : "download"
      );
    }
  }

  init().catch((err) => {
    console.error(err);
    els.lede.textContent = "Could not load contact data. Try again in a moment.";
    els.ctaGroup.hidden = true;
  });
})();
