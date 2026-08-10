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
    visualName: document.getElementById("visual-name"),
    toast: document.getElementById("toast"),
  };

  let toastTimer = 0;

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
   * @param {string} message
   */
  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  /**
   * @param {string} text
   * @param {string} doneMessage
   */
  async function copyToClipboard(text, doneMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(doneMessage);
      return true;
    } catch {
      showToast("Copy failed — select the text manually");
      return false;
    }
  }

  /**
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

    if (contact.organization) lines.push(`ORG:${escapeVCard(contact.organization)}`);
    if (contact.title) lines.push(`TITLE:${escapeVCard(contact.title)}`);
    if (contact.phone) {
      lines.push(`TEL;TYPE=${contact.phoneType || "CELL"}:${escapeVCard(contact.phone)}`);
    }
    if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(contact.email)}`);
    if (contact.website) lines.push(`URL:${escapeVCard(contact.website)}`);
    if (contact.github) lines.push(`URL:${escapeVCard(contact.github)}`);
    if (contact.note) lines.push(`NOTE:${escapeVCard(contact.note)}`);
    if (contact.uid) lines.push(`UID:${escapeVCard(contact.uid)}`);

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
   * @param {string} value
   */
  function encodeIntentExtra(value) {
    return encodeURIComponent(String(value));
  }

  /**
   * @param {Record<string, string>} contact
   */
  function buildAndroidInsertIntent(contact) {
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

    const fallback = encodeURIComponent(
      `${location.origin}${location.pathname}#details`
    );
    parts.push(`S.browser_fallback_url=${fallback}`);

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
   * @param {HTMLAnchorElement} el
   * @param {{ label: string, href?: string, onClick?: (e: Event) => void, className: string, hidden?: boolean }} opts
   */
  function bindCta(el, opts) {
    el.hidden = Boolean(opts.hidden);
    el.className = opts.className;
    el.textContent = opts.label;

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
    if (typeof qrcode !== "function" || !els.qrcode) return false;

    const qr = qrcode(0, "M");
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
    const name =
      contact.displayName ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

    rows.push({ label: "Name", value: name, copy: name });

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
      rows.push({
        label: "Org",
        value: contact.organization,
        copy: contact.organization,
      });
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
        btn.addEventListener("click", () => {
          copyToClipboard(row.copy, `${row.label} copied`);
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
      if (renderQr(vcard)) {
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
        "Normally iOS opens the card automatically when you visit reichi.id.";
      return;
    }

    if (platform === "android") {
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
        onClick: () => {
          copyToClipboard(contactPlainText(contact), "Contact details copied");
        },
      });
      els.platformHint.textContent =
        "Uses Android’s Add Contact screen in Chrome. If it’s blocked, copy the details below.";
      return;
    }

    const labels = {
      macos: "macOS",
      windows: "Windows",
      linux: "Linux",
      other: "desktop",
    };
    const osName = labels[platform] || "desktop";

    els.headline.textContent = "Save my contact";
    els.lede.textContent = `On ${osName}, download the vCard — or scan the QR with your phone.`;
    bindCta(els.primaryCta, {
      label: "Download .vcf",
      className: "btn btn-primary",
      onClick: () => deliverVCard(vcard, filename, "download"),
    });
    bindCta(els.secondaryCta, {
      label: "Scan with phone",
      className: "btn btn-ghost",
      onClick: () => {
        showQr();
        if (els.qrCaption) {
          els.qrCaption.textContent = "Open your camera and point it here.";
        }
        document.getElementById("qr")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      },
    });
    els.platformHint.textContent =
      platform === "macos"
        ? "Opens in Contacts.app. Prefer your phone? Scan the QR below."
        : platform === "windows"
          ? "Opens in People / Outlook. Prefer your phone? Scan the QR below."
          : "Open the .vcf in your contacts app, or scan the QR below.";
    showQr();
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const forcePage =
      params.has("page") ||
      params.has("html") ||
      params.get("view") === "page";
    const { platform } = detectPlatform();

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
    const name =
      contact.displayName ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

    els.footerName.textContent = name || "Contact";
    if (els.visualName) els.visualName.textContent = name || "Contact";
    document.title = `${name || "Contact"} — reichi.id`;
    renderDetails(contact);
    configurePlatform(platform, contact, vcard);

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
