(() => {
  "use strict";

  const els = {
    brand: document.getElementById("brand"),
    headline: document.getElementById("headline"),
    lede: document.getElementById("lede"),
    ctaGroup: document.getElementById("cta-group"),
    primaryCta: document.getElementById("primary-cta"),
    secondaryCta: document.getElementById("secondary-cta"),
    callCta: document.getElementById("call-cta"),
    emailCta: document.getElementById("email-cta"),
    platformHint: document.getElementById("platform-hint"),
    qrCta: document.getElementById("qr-cta"),
    detailList: document.getElementById("detail-list"),
    detailsFold: document.getElementById("details-fold"),
    footerName: document.getElementById("footer-name"),
    visualName: document.getElementById("visual-name"),
    visualMeta: document.getElementById("visual-meta"),
    visualPhoto: document.getElementById("visual-photo"),
    cardOrg: document.getElementById("card-org"),
    cardPhone: document.getElementById("card-phone"),
    cardEmail: document.getElementById("card-email"),
    cardWeb: document.getElementById("card-web"),
    cardNick: document.getElementById("card-nick"),
    toast: document.getElementById("toast"),
  };

  let toastTimer = 0;

  /* ---------- Theme toggle: auto (OS) -> light -> dark -> auto ---------- */

  const THEME_ICONS = {
    auto: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg>',
    light:
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>',
    dark: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  };

  const THEME_LABELS = {
    auto: "Theme: auto (follows system). Activate to switch to light.",
    light: "Theme: light. Activate to switch to dark.",
    dark: "Theme: dark. Activate to follow the system setting.",
  };

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function themeMode() {
    try {
      const t = localStorage.getItem("theme");
      return t === "light" || t === "dark" ? t : "auto";
    } catch {
      return "auto";
    }
  }

  function applyTheme() {
    const mode = themeMode();
    const dark = mode === "dark" || (mode === "auto" && darkQuery.matches);
    document.documentElement.classList.toggle("theme-dark", dark);

    // Keep browser chrome color in sync when the user forces a theme.
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((m) => {
      if (mode === "auto") {
        m.content = m.media.includes("dark") ? "#0e1520" : "#0f766e";
      } else {
        m.content = dark ? "#0e1520" : "#0f766e";
      }
    });

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.innerHTML = THEME_ICONS[mode];
      btn.setAttribute("aria-label", THEME_LABELS[mode]);
      btn.title = `Theme: ${mode}`;
    }
  }

  function setupThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = { auto: "light", light: "dark", dark: "auto" }[themeMode()];
      try {
        if (next === "auto") localStorage.removeItem("theme");
        else localStorage.setItem("theme", next);
      } catch {}
      applyTheme();
    });
    darkQuery.addEventListener("change", () => {
      if (themeMode() === "auto") applyTheme();
    });
    applyTheme();
  }

  setupThemeToggle();

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
   * Slim vCard for QR codes (no embedded photo — too large for QR).
   * Full photo card is served from /contact.vcf.
   * @param {Record<string, any>} contact
   */
  function buildVCard(contact) {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "PRODID:-//reichi.id//contact//EN",
      `N:${escapeVCard(contact.lastName || "")};${escapeVCard(contact.firstName || "")};;;`,
      `FN:${escapeVCard(contact.displayName || `${contact.firstName} ${contact.lastName}`.trim())}`,
    ];

    if (contact.nickname) lines.push(`NICKNAME:${escapeVCard(contact.nickname)}`);
    if (contact.organization) lines.push(`ORG:${escapeVCard(contact.organization)}`);
    if (contact.role || contact.title) {
      lines.push(`TITLE:${escapeVCard(contact.role || contact.title)}`);
    }
    if (contact.phone) {
      lines.push(`TEL;TYPE=${contact.phoneType || "CELL"}:${escapeVCard(contact.phone)}`);
    }
    const homeEmail = contact.emailHome || contact.email;
    const workEmail = contact.emailWork;
    if (homeEmail) lines.push(`EMAIL;TYPE=HOME,INTERNET:${escapeVCard(homeEmail)}`);
    if (workEmail) lines.push(`EMAIL;TYPE=WORK,INTERNET:${escapeVCard(workEmail)}`);
    if (contact.website) lines.push(`URL:${escapeVCard(contact.website)}`);
    if (contact.websiteWork) lines.push(`URL;TYPE=WORK:${escapeVCard(contact.websiteWork)}`);
    if (contact.github) lines.push(`URL:${escapeVCard(contact.github)}`);
    if (contact.address) {
      const a = contact.address;
      lines.push(
        `ADR;TYPE=HOME:;;${escapeVCard(a.street || "")};${escapeVCard(
          a.city || ""
        )};;${escapeVCard(a.postalCode || "")};${escapeVCard(a.country || "")}`
      );
    }
    if (contact.note) lines.push(`NOTE:${escapeVCard(contact.note)}`);
    if (contact.uid) lines.push(`UID:${escapeVCard(contact.uid)}`);
    if (contact.birthday) {
      lines.push(`BDAY:${escapeVCard(String(contact.birthday).replace(/-/g, ""))}`);
    }

    lines.push(`REV:${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`);
    lines.push("END:VCARD");
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  /**
   * Prefer the static full vCard (includes photo). Fallback to generated blob.
   * @param {string} vcard
   * @param {string} filename
   * @param {"open"|"download"} mode
   */
  function deliverVCard(vcard, filename, mode) {
    const hosted = new URL("contact.vcf", location.href).href;

    if (mode === "open") {
      window.location.href = hosted;
      return;
    }

    const a = document.createElement("a");
    a.href = hosted;
    a.download = filename || "contact.vcf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
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
    const email = contact.emailHome || contact.email;
    if (email) parts.push(`S.email=${encodeIntentExtra(email)}`);
    if (contact.organization) {
      parts.push(`S.company=${encodeIntentExtra(contact.organization)}`);
    }
    if (contact.role || contact.title) {
      parts.push(`S.job_title=${encodeIntentExtra(contact.role || contact.title)}`);
    }
    if (contact.address) {
      const a = contact.address;
      const postal = [a.street, a.postalCode, a.city, a.country]
        .filter(Boolean)
        .join(", ");
      if (postal) parts.push(`S.postal=${encodeIntentExtra(postal)}`);
    }

    const noteBits = [];
    if (contact.nickname) noteBits.push(`Nickname: ${contact.nickname}`);
    if (contact.emailWork) noteBits.push(`Work: ${contact.emailWork}`);
    if (contact.website) noteBits.push(contact.website);
    if (contact.websiteWork) noteBits.push(contact.websiteWork);
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
   * @param {Record<string, any>} contact
   */
  function contactPlainText(contact) {
    const addr = contact.address
      ? [
          contact.address.street,
          `${contact.address.postalCode || ""} ${contact.address.city || ""}`.trim(),
          contact.address.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    return [
      contact.displayName ||
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      contact.role || contact.title,
      contact.organization,
      contact.phone,
      contact.emailHome || contact.email,
      contact.emailWork,
      contact.website,
      contact.websiteWork,
      contact.github,
      addr,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const ICONS = {
    download:
      '<svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    userPlus:
      '<svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    copy:
      '<svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  };

  /**
   * @param {HTMLAnchorElement} el
   * @param {{ label: string, href?: string, onClick?: (e: Event) => void, className: string, hidden?: boolean, icon?: string }} opts
   */
  function bindCta(el, opts) {
    el.hidden = Boolean(opts.hidden);
    el.className = opts.className;
    if (opts.icon && ICONS[opts.icon]) {
      el.innerHTML = ICONS[opts.icon];
      const span = document.createElement("span");
      span.textContent = opts.label;
      el.appendChild(span);
    } else {
      el.textContent = opts.label;
    }

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
   * @param {HTMLElement|null} target
   * @param {string} vcard
   */
  function renderQrInto(target, vcard) {
    if (typeof qrcode !== "function" || !target) return false;

    const qr = qrcode(0, "M");
    qr.addData(vcard);
    qr.make();

    // Larger module size keeps the QR sharp when scaled up outside the card.
    target.innerHTML = qr.createSvgTag(6, 2);
    const svg = target.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("viewBox", svg.getAttribute("viewBox") || "0 0 100 100");
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("role", "img");
      svg.setAttribute(
        "aria-label",
        "QR code — scan with a phone camera to save Christian Reichinger's contact card"
      );
    }
    return true;
  }

  /* ---------- Card animations: flip + tilt/gloss + gyro ---------- */

  /** Set by setupCardFlip; used by the "Scan QR code" button. */
  let flipCard = () => {};

  function setupCardFlip() {
    const card = document.getElementById("biz-card");
    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");
    if (!card || !front || !back) return;

    let flipped = false;
    const setFlipped = (v) => {
      flipped = v;
      card.classList.toggle("flipped", flipped);
      front.toggleAttribute("inert", flipped);
      back.toggleAttribute("inert", !flipped);
    };
    setFlipped(location.hash === "#qr");
    flipCard = setFlipped;

    card.addEventListener("click", (e) => {
      // Links on the card keep working; anything else flips.
      if (e.target.closest("a")) return;
      setFlipped(!flipped);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && flipped) setFlipped(false);
    });
  }

  function setupCardTilt() {
    const card = document.getElementById("biz-card");
    const stage = document.querySelector(".hero-stage");
    if (!card || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const apply = (rx, ry, gx, gy, glossO) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        card.style.transform = `rotate3d(1, 0, 0, ${rx.toFixed(2)}deg) rotate3d(0, 1, 0, ${ry.toFixed(2)}deg)`;
        card.style.setProperty("--gx", `${gx.toFixed(1)}%`);
        card.style.setProperty("--gy", `${gy.toFixed(1)}%`);
        card.style.setProperty("--gloss-o", String(glossO));
      });
    };
    const reset = () => {
      card.classList.remove("tilting");
      card.style.transform = "";
      card.style.setProperty("--gloss-o", "0");
    };

    // Desktop: card follows the cursor like a held card.
    if (window.matchMedia("(pointer: fine)").matches) {
      stage.addEventListener("pointermove", (e) => {
        card.classList.add("tilting");
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        apply(-py * 10, px * 12, (px + 0.5) * 100, (py + 0.5) * 100, 0.85);
      });
      stage.addEventListener("pointerleave", reset);
    }

    // Mobile: gyroscope tilt where no permission prompt is required
    // (iOS 13+ needs an explicit permission dialog — skipped on purpose).
    const canGyro =
      typeof window.DeviceOrientationEvent !== "undefined" &&
      typeof window.DeviceOrientationEvent.requestPermission !== "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (canGyro) {
      const clamp = (v, m) => Math.max(-m, Math.min(m, v));
      window.addEventListener(
        "deviceorientation",
        (e) => {
          if (e.beta == null || e.gamma == null) return;
          card.classList.add("tilting");
          const ry = clamp(e.gamma / 6, 8); // left/right
          const rx = clamp((e.beta - 45) / 8, 8); // natural holding angle ~45°
          apply(rx, ry, 50 + ry * 5, 40 + rx * 5, 0.7);
        },
        { passive: true }
      );
    }
  }

  setupCardFlip();
  setupCardTilt();

  /**
   * @param {Record<string, any>} contact
   */
  function renderDetails(contact) {
    /** @type {{ label: string, value: string, href?: string, copy?: string }[]} */
    const rows = [];
    const name =
      contact.displayName ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

    rows.push({ label: "Name", value: name, copy: name });
    if (contact.nickname) {
      rows.push({ label: "Nick", value: contact.nickname, copy: contact.nickname });
    }
    if (contact.role || contact.title) {
      rows.push({
        label: "Role",
        value: contact.role || contact.title,
        copy: contact.role || contact.title,
      });
    }
    if (contact.organization) {
      rows.push({
        label: "Org",
        value: contact.organization,
        copy: contact.organization,
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
    const homeEmail = contact.emailHome || contact.email;
    if (homeEmail) {
      rows.push({
        label: "Email",
        value: homeEmail,
        href: `mailto:${homeEmail}`,
        copy: homeEmail,
      });
    }
    if (contact.emailWork) {
      rows.push({
        label: "Work",
        value: contact.emailWork,
        href: `mailto:${contact.emailWork}`,
        copy: contact.emailWork,
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
    if (contact.websiteWork) {
      rows.push({
        label: "Company",
        value: contact.websiteWork.replace(/^https?:\/\//, ""),
        href: contact.websiteWork,
        copy: contact.websiteWork,
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
    if (contact.address) {
      const a = contact.address;
      const formatted = [
        a.street,
        `${a.postalCode || ""} ${a.city || ""}`.trim(),
        a.country,
      ]
        .filter(Boolean)
        .join(", ");
      if (formatted) {
        rows.push({ label: "Address", value: formatted, copy: formatted });
      }
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
        btn.setAttribute("aria-label", `Copy ${row.label.toLowerCase()}`);
        btn.addEventListener("click", () => {
          copyToClipboard(row.copy, `${row.label} copied`);
        });
        li.appendChild(btn);
      }

      els.detailList.appendChild(li);
    }
  }

  /**
   * Show Call / Send email on every platform (desktop, Android, iOS page view).
   * @param {Record<string, any>} contact
   */
  function wireQuickActions(contact) {
    const phone = contact.phone || "";
    const email = contact.emailHome || contact.email || "";

    // Only update href/visibility — static markup keeps its icon + label.
    if (els.callCta) {
      if (phone) {
        els.callCta.href = `tel:${phone}`;
        els.callCta.hidden = false;
      } else {
        els.callCta.hidden = true;
      }
    }

    if (els.emailCta) {
      if (email) {
        els.emailCta.href = `mailto:${email}`;
        els.emailCta.hidden = false;
      } else {
        els.emailCta.hidden = true;
      }
    }
  }

  /**
   * @param {Platform} platform
   * @param {Record<string, string>} contact
   * @param {string} vcard
   */
  function configurePlatform(platform, contact, vcard) {
    const filename = contact.filename || "contact.vcf";

    els.ctaGroup.hidden = false;
    els.platformHint.hidden = false;

    // "Scan QR code" flips the card to its QR side and brings it into view.
    if (els.qrCta) {
      els.qrCta.addEventListener("click", () => {
        flipCard(true);
        const card = document.getElementById("biz-card");
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        card?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        });
      });
    }

    if (platform === "ios") {
      els.headline.textContent = "Add me to your contacts";
      els.lede.textContent =
        "On iPhone and iPad, Safari opens this as a contact card you can save in one step.";
      bindCta(els.primaryCta, {
        label: "Add to Contacts",
        className: "btn btn-primary",
        href: new URL("contact.vcf", location.href).href,
        icon: "userPlus",
      });
      bindCta(els.secondaryCta, {
        label: "",
        className: "btn btn-ghost",
        hidden: true,
      });
      wireQuickActions(contact);
      els.platformHint.textContent =
        "Safari opens the contact sheet automatically. If you close it, use the buttons below.";
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
        icon: "userPlus",
      });
      bindCta(els.secondaryCta, {
        label: "Copy details",
        className: "btn btn-ghost",
        icon: "copy",
        onClick: () => {
          copyToClipboard(contactPlainText(contact), "Contact details copied");
        },
      });
      wireQuickActions(contact);
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
      icon: "download",
      onClick: () => deliverVCard(vcard, filename, "download"),
    });
    bindCta(els.secondaryCta, {
      label: "",
      className: "btn btn-ghost",
      hidden: true,
    });
    els.platformHint.textContent =
      platform === "macos"
        ? "Opens in Contacts.app. Prefer your phone? Scan the QR."
        : platform === "windows"
          ? "Opens in People / Outlook. Prefer your phone? Scan the QR."
          : "Open the .vcf in your contacts app, or scan the QR.";
    wireQuickActions(contact);
  }

  /**
   * Open the vCard after the HTML UI is ready. Prefer a history entry so
   * dismissing / going back still shows Call + Email on this page.
   * @param {string} href
   */
  function openVCardSheet(href) {
    window.setTimeout(() => {
      window.location.href = href;
    }, 80);
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const skipAutoVcf =
      params.has("page") ||
      params.has("html") ||
      params.get("view") === "page";
    const { platform } = detectPlatform();

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
    if (els.brand) els.brand.textContent = name || "Contact";
    if (els.visualName) els.visualName.textContent = name || "Contact";
    if (els.visualMeta) {
      const meta = [contact.role || contact.title, contact.organization]
        .filter(Boolean)
        .join(" · ");
      els.visualMeta.textContent = meta || contact.nickname || "reichi.id";
    }
    if (els.cardOrg) {
      els.cardOrg.textContent = contact.organization || "reichi.id";
    }
    if (els.cardNick) {
      els.cardNick.textContent = contact.nickname || "reichi";
    }
    if (els.cardPhone && contact.phone) {
      const pretty = contact.phone.replace(
        /^\+(\d{2})(\d{3})(\d+)$/,
        "+$1 $2 $3"
      );
      els.cardPhone.textContent = pretty;
      els.cardPhone.href = `tel:${contact.phone}`;
    }
    if (els.cardEmail) {
      const email = contact.emailHome || contact.email || "";
      if (email) {
        els.cardEmail.textContent = email;
        els.cardEmail.href = `mailto:${email}`;
      }
    }
    if (els.cardWeb && contact.website) {
      try {
        const host = new URL(contact.website).hostname.replace(/^www\./, "");
        els.cardWeb.textContent = host;
        els.cardWeb.href = contact.website;
      } catch {
        els.cardWeb.textContent = contact.website;
        els.cardWeb.href = contact.website;
      }
    }
    if (els.visualPhoto) {
      els.visualPhoto.alt = name || "Contact photo";
      // Keep the inlined hero photo unless the hosted asset actually loads.
      // (Some Cloudflare setups SPA-fallback missing assets to HTML.)
      if (contact.photo && !String(contact.photo).startsWith("data:")) {
        const photoSrc = contact.photo.startsWith("http")
          ? contact.photo
          : new URL(contact.photo, window.location.origin).href;
        const probe = new Image();
        probe.onload = () => {
          els.visualPhoto.src = photoSrc;
        };
        probe.src = photoSrc;
      }
    }
    document.title = `${name || "Contact"} — reichi.id`;
    renderDetails(contact);
    configurePlatform(platform, contact, vcard);

    // Back of the card always carries a scannable QR, on every platform.
    renderQrInto(document.getElementById("qrcode-back"), vcard);

    // Nav link / deep link to #details should reveal the folded directory.
    if (els.detailsFold) {
      const openFold = () => {
        els.detailsFold.open = true;
      };
      if (location.hash === "#details") openFold();
      document.querySelectorAll('a[href="#details"]').forEach((a) => {
        a.addEventListener("click", openFold);
      });
    }

    if (params.has("download") || params.has("vcf")) {
      deliverVCard(
        vcard,
        contact.filename || "contact.vcf",
        platform === "ios" ? "open" : "download"
      );
    } else if (platform === "ios" && !skipAutoVcf) {
      // Page (with Call / Email) is already painted; then open the sheet.
      openVCardSheet(new URL("contact.vcf", location.href).href);
    }
  }

  init().catch((err) => {
    console.error(err);
    els.lede.textContent =
      "Could not load contact data. Check your connection and try again.";
    els.ctaGroup.hidden = true;

    // Recoverable error state: offer retry + direct fallback links.
    const note = document.createElement("div");
    note.className = "error-note";
    note.setAttribute("role", "alert");
    note.textContent = "Loading failed. ";

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "copy-btn";
    retry.textContent = "Try again";
    retry.addEventListener("click", () => window.location.reload());
    note.appendChild(retry);

    const fallback = document.createElement("p");
    fallback.className = "platform-hint";
    fallback.innerHTML =
      'Direct links: <a href="/contact.vcf">download vCard</a> · ' +
      '<a href="tel:+436644385462">call</a> · ' +
      '<a href="mailto:reichi@reichi.com">email</a>';

    const copyEl = document.querySelector(".hero-copy");
    if (copyEl) {
      copyEl.appendChild(note);
      copyEl.appendChild(fallback);
    }
  });
})();
