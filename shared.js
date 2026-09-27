/**
 * Ops Room — shared UI primitives
 *
 * Loaded by every page. Provides:
 *   - esc() — HTML escaping (use EVERY time user text hits the DOM)
 *   - toast() — unobtrusive auto-dismissing notifications
 *   - confirmDialog() — promise-based modal confirm
 *   - icons — inline SVG set, one consistent stroke style
 *   - injectChrome() — renders header + sidebar + overlay into any page
 *   - counter() — the [- n +] control used everywhere
 *   - fmtTime() — relative/absolute time for sync labels
 *
 * Depends on: core.js (for auth, sync state, nav memory).
 * No modules, no bundler. Exposes everything under window.Ops (extends core.js).
 */

(function () {
  "use strict";

  // ── escaping ───────────────────────────────────────────────────────────────
  // The ONLY safe way to insert dynamic text into the DOM.
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ── DOM utilities ──────────────────────────────────────────────────────────
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k]; // caller must ensure safety
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] !== null && attrs[k] !== undefined) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      for (const c of children) {
        if (c == null) continue;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  // ── toast ──────────────────────────────────────────────────────────────────
  // Simple, stackable, auto-dismiss. Colors: "success" | "error" | "info".
  let toastHost = null;
  function ensureToastHost() {
    if (toastHost && document.body.contains(toastHost)) return toastHost;
    toastHost = el("div", { class: "toast-host", "aria-live": "polite" });
    document.body.appendChild(toastHost);
    return toastHost;
  }

  function toast(message, kind) {
    const host = ensureToastHost();
    const type = kind === "error" ? "error" : kind === "info" ? "info" : "success";
    const node = el("div", { class: `toast toast-${type}`, role: "status" });
    node.appendChild(el("span", { class: "toast-msg", text: message }));
    host.appendChild(node);

    // Force reflow so the enter transition runs.
    void node.offsetHeight;
    node.classList.add("in");

    const ttl = type === "error" ? 5200 : 2800;
    const t = setTimeout(() => dismiss(), ttl);

    function dismiss() {
      clearTimeout(t);
      node.classList.remove("in");
      setTimeout(() => {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 200);
    }
    node.addEventListener("click", dismiss);
    return dismiss;
  }

  // ── confirm dialog ─────────────────────────────────────────────────────────
  // Promise<boolean>. Never use window.confirm — visual consistency matters.
  function confirmDialog(opts) {
    const o = opts || {};
    const title = o.title || "Are you sure?";
    const body = o.body || "";
    const confirmText = o.confirmText || "Confirm";
    const cancelText = o.cancelText || "Cancel";
    const danger = !!o.danger;

    return new Promise((resolve) => {
      const overlay = el("div", { class: "modal-overlay" });
      const box = el("div", { class: "modal", role: "dialog", "aria-modal": "true" });

      box.appendChild(el("h3", { class: "modal-title", text: title }));
      if (body) box.appendChild(el("p", { class: "modal-body", text: body }));

      const actions = el("div", { class: "modal-actions" });

      const cancelBtn = el("button", {
        class: "btn btn-ghost",
        type: "button",
        text: cancelText,
      });
      const confirmBtn = el("button", {
        class: `btn ${danger ? "btn-danger" : "btn-primary"}`,
        type: "button",
        text: confirmText,
      });

      cancelBtn.addEventListener("click", () => close(false));
      confirmBtn.addEventListener("click", () => close(true));
      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      void overlay.offsetHeight;
      overlay.classList.add("in");

      const onKey = (e) => {
        if (e.key === "Escape") close(false);
        if (e.key === "Enter") close(true);
      };
      document.addEventListener("keydown", onKey);

      function close(val) {
        document.removeEventListener("keydown", onKey);
        overlay.classList.remove("in");
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 160);
        resolve(val);
      }
    });
  }

  // ── icons ──────────────────────────────────────────────────────────────────
  // One stroke weight (1.75), 24×24 viewBox, currentColor stroke. No fills
  // unless noted. All hand-made paths.
  const ICON_PATHS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    dashboard:
      '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/>',
    subject:
      '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>',
    chapter:
      '<path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5z"/><path d="M15 3.5V8h4.5"/><path d="M8.5 12.5h7M8.5 16h7"/>',
    paper:
      '<path d="M4 4.5h11l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M15 4.5V9.5h5"/>',
    final:
      '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
    mock:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    settings:
      '<circle cx="12" cy="12" r="2.75"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18.01 5.99l-1.55 1.55M7.54 16.46l-1.55 1.55M18.01 18.01l-1.55-1.55M7.54 7.54L5.99 5.99"/>',
    cloud:
      '<path d="M7 17.5a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 8.4a4.25 4.25 0 0 1 .75 8.35"/>',
    bell:
      '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.2 1.5H4.8z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    user:
      '<circle cx="12" cy="8.5" r="3.75"/><path d="M4.5 20.2a7.5 7.5 0 0 1 15 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    search:
      '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    coin:
      '<circle cx="12" cy="12" r="8.5"/><path d="M9 9.5h4.2a1.9 1.9 0 0 1 0 3.8H9l4.6 3.2M9 13.3h4.5"/>',
    warning:
      '<path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4.2M12 17.2v.05"/>',
    sync:
      '<path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9.5"/><path d="M19.5 4.5v5h-5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 14.5"/><path d="M4.5 19.5v-5h5"/>',
    logout:
      '<path d="M15 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H15"/><path d="M10 12h10M17 8.5l3.5 3.5L17 15.5"/>',
    download:
      '<path d="M12 4.5v11M7.5 11l4.5 4.5L16.5 11"/><path d="M5 19.5h14"/>',
    upload:
      '<path d="M12 15.5v-11M7.5 9l4.5-4.5L16.5 9"/><path d="M5 19.5h14"/>',
    trash:
      '<path d="M5 7h14"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M7 7l1 12a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 16 19l1-12"/>',
  };

  function icon(name, size) {
    const path = ICON_PATHS[name];
    if (!path) return "";
    const s = size || 20;
    return `<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  // ── chrome (header + sidebar) ──────────────────────────────────────────────
  // Every authenticated page calls this. It renders:
  //   <header class="app-header"> ... </header>
  //   <aside class="app-sidebar"> ... </aside>
  //   <div class="app-overlay"></div>
  // and wires the hamburger, overlay close, nav, and sync-status pill.
  //
  // Pages must provide:
  //   - <body data-page="dashboard"> (matches a nav id)
  //   - an element with id="app-view" for chrome to attach before? No —
  //     chrome is prepended to <body> in fixed position; content flows under it.
  //   - CSS defines .app-content { padding-top: 64px; padding-left: 0 } and
  //     on ≥860px: .app-content { padding-left: 260px }

  const NAV = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
    { id: "subjects", label: "Subjects", href: "dashboard.html#subjects", icon: "subject" },
    { id: "paper-finals", label: "Paper Finals", href: "finals.html#paper", icon: "paper" },
    { id: "subject-finals", label: "Subject Finals", href: "finals.html#subject", icon: "final" },
    { id: "mock-test", label: "Full Mock Test", href: "mock-test.html", icon: "mock" },
    { id: "settings", label: "Settings", href: "settings.html", icon: "settings" },
  ];

  function injectChrome() {
    const page = document.body.dataset.page || "";
    const overlay = el("div", { class: "app-overlay", hidden: "" });

    // Header
    const header = el("header", { class: "app-header" });
    const left = el("div", { class: "header-left" });
    const burger = el("button", {
      class: "icon-btn",
      type: "button",
      "aria-label": "Open menu",
    });
    burger.innerHTML = icon("menu", 22);
    burger.addEventListener("click", () => openSidebar());

    const logo = el("a", { class: "brand", href: "dashboard.html" });
    const logoImg = el("img", {
      src: "/images/logo.png",
      alt: "Ops Room",
      height: "32",
      class: "brand-logo",
    });
    // If logo file is missing, hide gracefully rather than show broken icon.
    logoImg.addEventListener("error", () => {
      logoImg.style.display = "none";
      const fallback = el("span", { class: "brand-text", text: "Ops Room" });
      logo.appendChild(fallback);
    });
    logo.appendChild(logoImg);
    left.appendChild(burger);
    left.appendChild(logo);

    const right = el("div", { class: "header-right" });
    const syncPill = el("button", {
      class: "sync-pill",
      type: "button",
      "aria-label": "Sync status — tap to save",
    });
    syncPill.addEventListener("click", async () => {
      await doCloudSave(syncPill);
    });
    right.appendChild(syncPill);

    header.appendChild(left);
    header.appendChild(right);

    // Sidebar
    const sidebar = el("aside", { class: "app-sidebar", "aria-label": "Main navigation" });
    const navList = el("nav", { class: "sidebar-nav" });
    for (const item of NAV) {
      const a = el("a", {
        class: "sidebar-item" + (item.id === page ? " active" : ""),
        href: item.href,
      });
      a.innerHTML = icon(item.icon, 18);
      a.appendChild(el("span", { text: item.label }));
      a.addEventListener("click", () => closeSidebar());
      navList.appendChild(a);
    }

    const footList = el("div", { class: "sidebar-foot" });
    const signout = el("button", { class: "sidebar-item sidebar-signout", type: "button" });
    signout.innerHTML = icon("logout", 18);
    signout.appendChild(el("span", { text: "Sign out" }));
    signout.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "Sign out?",
        body: "Your local progress stays on this device. You can log back in any time.",
        confirmText: "Sign out",
        danger: false,
      });
      if (ok) await Ops.logout();
    });
    footList.appendChild(signout);

    sidebar.appendChild(navList);
    sidebar.appendChild(footList);

    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.insertBefore(header, document.body.firstChild);

    overlay.addEventListener("click", () => closeSidebar());

    // Update sync pill on interval + when visibility returns.
    refreshSyncPill(syncPill);
    setInterval(() => refreshSyncPill(syncPill), 30000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshSyncPill(syncPill);
    });

    // Expose for pages that want to refresh on demand.
    window.Ops._refreshSync = () => refreshSyncPill(syncPill);
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
    const o = document.querySelector(".app-overlay");
    if (o) o.removeAttribute("hidden");
  }
  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    const o = document.querySelector(".app-overlay");
    if (o) o.setAttribute("hidden", "");
  }

  function refreshSyncPill(node) {
    const unsynced = Ops.isUnsynced();
    const when = Ops.getLastSyncedAt();
    node.classList.toggle("sync-unsynced", unsynced);
    const label = unsynced ? "Unsynced" : when ? fmtTime(when) : "Not synced";
    node.innerHTML = "";
    const dot = el("span", { class: "sync-dot" });
    node.appendChild(dot);
    node.appendChild(el("span", { class: "sync-label", text: label }));
  }

  async function doCloudSave(pillNode) {
    const original = pillNode.innerHTML;
    pillNode.classList.add("sync-busy");
    pillNode.innerHTML = "";
    pillNode.appendChild(el("span", { class: "sync-dot" }));
    pillNode.appendChild(el("span", { class: "sync-label", text: "Saving…" }));

    try {
      await Ops.cloudSave();
      toast("Synced to cloud.", "success");
      if (window.Ops._refreshSync) window.Ops._refreshSync();
    } catch (err) {
      toast("Cloud sync failed. Your local data is safe.", "error");
      pillNode.innerHTML = original;
      pillNode.classList.remove("sync-busy");
      return;
    }
    pillNode.classList.remove("sync-busy");
    if (window.Ops._refreshSync) window.Ops._refreshSync();
  }

  // ── counter component ──────────────────────────────────────────────────────
  // Returns { node, setValue, getValue }.
  //   onChange(newValue) is called AFTER internal state updates.
  //   value is always a non-negative integer.
  function counter(initial, onChange, opts) {
    const o = opts || {};
    let value = Ops.num(initial);

    const wrap = el("div", { class: "counter" + (o.compact ? " counter-compact" : "") });
    const minus = el("button", {
      class: "counter-btn",
      type: "button",
      "aria-label": "Decrease",
    });
    minus.innerHTML = icon("minus", 16);
    const numEl = el("span", { class: "counter-value", text: String(value) });
    const plus = el("button", {
      class: "counter-btn",
      type: "button",
      "aria-label": "Increase",
    });
    plus.innerHTML = icon("plus", 16);

    function refresh() {
      numEl.textContent = String(value);
      minus.disabled = value <= 0;
      minus.classList.toggle("is-disabled", value <= 0);
    }

    minus.addEventListener("click", () => {
      if (value <= 0) return;
      value -= 1;
      refresh();
      if (onChange) onChange(value);
    });
    plus.addEventListener("click", () => {
      value += 1;
      refresh();
      if (onChange) onChange(value);
    });

    wrap.appendChild(minus);
    wrap.appendChild(numEl);
    wrap.appendChild(plus);
    refresh();

    return {
      node: wrap,
      setValue(v) {
        value = Ops.num(v);
        refresh();
      },
      getValue() {
        return value;
      },
    };
  }

  // ── toggle component ───────────────────────────────────────────────────────
  // A 44px-tall, accessible on/off row. Returns { node, setValue, getValue }.
  function toggle(initial, onChange, labelText) {
    let on = !!initial;
    const wrap = el("button", {
      class: "toggle",
      type: "button",
      role: "switch",
      "aria-checked": on ? "true" : "false",
    });
    const track = el("span", { class: "toggle-track" });
    const knob = el("span", { class: "toggle-knob" });
    track.appendChild(knob);
    wrap.appendChild(track);
    if (labelText) wrap.appendChild(el("span", { class: "toggle-label", text: labelText }));

    function refresh() {
      wrap.classList.toggle("on", on);
      wrap.setAttribute("aria-checked", on ? "true" : "false");
    }
    wrap.addEventListener("click", () => {
      on = !on;
      refresh();
      if (onChange) onChange(on);
    });
    refresh();
    return {
      node: wrap,
      setValue(v) {
        on = !!v;
        refresh();
      },
      getValue() {
        return on;
      },
    };
  }

  // ── progress bar ───────────────────────────────────────────────────────────
  function progressBar(pct, opts) {
    const o = opts || {};
    const wrap = el("div", { class: "progress" + (o.small ? " progress-sm" : "") });
    const fill = el("div", { class: "progress-fill" });
    fill.style.width = Math.max(0, Math.min(100, Number(pct) || 0)) + "%";
    wrap.appendChild(fill);
    return wrap;
  }

  // ── time format ────────────────────────────────────────────────────────────
  function fmtTime(iso) {
    if (!iso) return "—";
    const t = new Date(iso);
    if (isNaN(t.getTime())) return "—";
    const diff = Date.now() - t.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    // Beyond a week: short date.
    return t.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // ── url param helpers ──────────────────────────────────────────────────────
  function qs(name) {
    const p = new URLSearchParams(location.search);
    return p.get(name);
  }

  // ── page boot ──────────────────────────────────────────────────────────────
  // Every protected page calls Ops.boot() at the bottom of its body.
  // It runs the auth guard, injects chrome, and returns true/false.
  function boot() {
    if (!Ops.requireAuth()) return false;
    injectChrome();
    // Remove the initial "loading" class if the page set one.
    document.body.classList.remove("booting");
    return true;
  }

  // ── exports (extend core.js) ───────────────────────────────────────────────
  Object.assign(window.Ops, {
    esc,
    $,
    $$,
    el,
    toast,
    confirmDialog,
    icon,
    counter,
    toggle,
    progressBar,
    fmtTime,
    qs,
    injectChrome,
    openSidebar,
    closeSidebar,
    boot,
  });

  // Every page's inline script calls el(...) as a bare global (not Ops.el(...)),
  // 250+ call sites across dashboard/subject/chapter/finals/mock-test/settings/
  // index. Rather than edit every page, expose the one helper they actually
  // rely on as a real global too. (Nothing else is called bare — only this one.)
  window.el = el;
})();
