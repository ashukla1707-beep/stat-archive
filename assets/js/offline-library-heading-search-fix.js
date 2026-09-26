/* Stat Archive — Offline Library compatibility and navigation fixes. */
(() => {
  "use strict";
  document.getElementById("saOfflineStableShellOverrides")?.remove();
  document.getElementById("saOfflineHeadingSearchStyle")?.remove();
  document.getElementById("saOfflineHeadingSearchFixStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_HEADING_LEGACY_DISABLED__ = true;
})();

/* Keep the side menu visually out of the way once Offline Library is ready. */
(() => {
  "use strict";

  function offlineLibraryVisible() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return false;
    const style = getComputedStyle(overlay);
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      overlay.getClientRects().length > 0;
  }

  function closeMenuVisualOnly() {
    if (!offlineLibraryVisible()) return;
    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
  }

  function install() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    const observer = new MutationObserver(() => {
      if (!offlineLibraryVisible()) return;
      closeMenuVisualOnly();
      requestAnimationFrame(closeMenuVisualOnly);
    });

    observer.observe(overlay, {
      attributes: true,
      attributeFilter: ["style", "class", "aria-hidden", "hidden"]
    });
    closeMenuVisualOnly();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* Open Offline Library on the subject that owns the clicked saved entry and
   keep the subject accordion strictly single-open. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__) return;
  window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__ = "2";

  const selectorEscape = value => {
    const text = String(value ?? "");
    try { return CSS.escape(text); }
    catch (_) { return text.replace(/["\\]/g, "\\$&"); }
  };

  function overlay() {
    return document.getElementById("offlineLibraryOverlay");
  }

  function collapseOtherSubjects(keepGroup = null) {
    const root = overlay();
    if (!root) return;

    root.querySelectorAll(".sa-offline-group.open").forEach(group => {
      if (keepGroup && group === keepGroup) return;
      group.classList.remove("open");
      const chev = group.querySelector(".sa-offline-group-head .chev");
      if (chev) chev.textContent = "›";
      const body = group.querySelector(".sa-offline-group-body");
      if (body) body.scrollTop = 0;
    });
  }

  function focusedEntry(focusId) {
    const root = overlay();
    if (!root || focusId == null) return null;
    return root.querySelector(
      `[data-offline-id="${selectorEscape(String(focusId))}"]`
    );
  }

  function finishFocus(focusId, attempts = 0) {
    if (focusId == null) return;
    const entry = focusedEntry(focusId);
    const group = entry?.closest(".sa-offline-group");

    if (!entry || !group || !group.classList.contains("open")) {
      if (attempts < 18) setTimeout(() => finishFocus(focusId, attempts + 1), 35);
      return;
    }

    collapseOtherSubjects(group);
    try {
      entry.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    } catch (_) {
      try { group.scrollIntoView({ block: "center", behavior: "auto" }); } catch (_) {}
    }
  }

  function focusRequestedSubject(focusId) {
    if (focusId == null) return;
    const entry = focusedEntry(focusId);
    const group = entry?.closest(".sa-offline-group");

    if (!entry || !group) {
      finishFocus(focusId, 0);
      return;
    }

    if (!group.classList.contains("open")) {
      group.querySelector("[data-sa-toggle-subject]")?.click();
    } else {
      collapseOtherSubjects(group);
    }
    requestAnimationFrame(() => finishFocus(focusId, 0));
  }

  function wrapOfflineOpener() {
    const current = window.openOfflineLibrary;
    if (typeof current !== "function" || current.__saSubjectFocusWrapped) return;

    const wrapped = async function (...args) {
      const focusId = args[0] ?? null;
      const result = await Promise.resolve(current.apply(this, args));
      if (focusId != null) requestAnimationFrame(() => focusRequestedSubject(focusId));
      return result;
    };

    wrapped.__saSubjectFocusWrapped = true;
    wrapped.__saOriginal = current;
    window.openOfflineLibrary = wrapped;
    try { openOfflineLibrary = wrapped; } catch (_) {}
  }

  function installSingleOpenGuard() {
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      const toggle = target?.closest(
        "#offlineLibraryOverlay #offlineLibraryList [data-sa-toggle-subject]"
      );
      if (!toggle) return;
      const group = toggle.closest(".sa-offline-group");
      if (group) collapseOtherSubjects(group);
    }, true);
  }

  function install() {
    wrapOfflineOpener();
    installSingleOpenGuard();
    [100, 350, 900, 1800, 3200].forEach(ms => setTimeout(wrapOfflineOpener, ms));
    window.addEventListener("pageshow", wrapOfflineOpener);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* Interaction corrections:
   1) ✓ Offline opens the already-saved copy without showing a false save status.
   2) More / Show less keep the current page position instead of visually jumping.
   3) Remove mobile/WebView tap/press impressions from action/menu/preview controls.
   4) Activity counters switch to compact notation from 1,000 onward. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_MORE_INTERACTION_FIX__) return;
  window.__STAT_ARCHIVE_OFFLINE_MORE_INTERACTION_FIX__ = "2";

  function hideActionStatus() {
    const status = document.getElementById("statArchiveActionStatus");
    if (!status) return;
    status.classList.remove("is-visible", "show", "has-progress", "success", "error");
    status.setAttribute("aria-hidden", "true");
  }

  function installNoPressImpressionStyle() {
    document.getElementById("saNoPressImpressionStyle")?.remove();
    const style = document.createElement("style");
    style.id = "saNoPressImpressionStyle";
    style.textContent = `
#mainSideMenu button,
#mainSideMenu [role="button"],
.card .action-btn,
.entry-subject-more-btn,
#previewOverlay button,
#previewModal button,
.preview-modal button,
.sa-reader button,
#offlineLibraryOverlay button{
  -webkit-tap-highlight-color:transparent !important;
  -webkit-touch-callout:none !important;
}
#mainSideMenu button:active,
#mainSideMenu [role="button"]:active,
.card .action-btn:active,
.entry-subject-more-btn:active,
#previewOverlay button:active,
#previewModal button:active,
.preview-modal button:active,
.sa-reader button:active,
#offlineLibraryOverlay button:active{
  transform:none !important;
  filter:none !important;
}
#mainSideMenu button:focus:not(:focus-visible),
#mainSideMenu [role="button"]:focus:not(:focus-visible),
.card .action-btn:focus:not(:focus-visible),
.entry-subject-more-btn:focus:not(:focus-visible),
#previewOverlay button:focus:not(:focus-visible),
#previewModal button:focus:not(:focus-visible),
.preview-modal button:focus:not(:focus-visible),
.sa-reader button:focus:not(:focus-visible),
#offlineLibraryOverlay button:focus:not(:focus-visible){
  outline:none !important;
  box-shadow:none !important;
}
`;
    document.head.appendChild(style);
  }

  function compactActivityNumber(value) {
    const raw = String(value ?? "").trim();
    if (!raw || raw === "—" || /[KMB]$/i.test(raw)) return raw;
    const number = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(number) || number < 1000) return raw;

    const units = [
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ];
    const pair = units.find(([size]) => number >= size);
    if (!pair) return raw;
    const [size, suffix] = pair;
    const scaled = number / size;
    const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 1;
    return `${scaled.toFixed(digits).replace(/\.0$/, "")}${suffix}`;
  }

  function formatActivityElement(el) {
    if (!el) return;
    const next = compactActivityNumber(el.textContent);
    if (next && next !== el.textContent) el.textContent = next;
  }

  function installActivityFormatting() {
    const ids = ["summaryPreviewCount", "summaryDownloadCount"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      formatActivityElement(el);
      const observer = new MutationObserver(() => formatActivityElement(el));
      observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const savedOffline = target.closest(".card .offline-btn.is-saved");
    if (savedOffline) {
      const card = savedOffline.closest(".card");
      const id = card?.dataset?.id || card?.getAttribute("data-entry-id") || "";
      if (id && typeof window.openOfflineLibrary === "function") {
        event.preventDefault();
        event.stopImmediatePropagation();
        hideActionStatus();
        savedOffline.blur?.();
        void Promise.resolve(window.openOfflineLibrary(String(id)));
      }
      return;
    }

    const moreButton = target.closest(".entry-subject-more-btn");
    if (!moreButton) return;

    const label = (moreButton.textContent || "").trim().toLowerCase();
    if (label !== "more" && label !== "show less") return;

    const x = window.scrollX;
    const y = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const rootAnchor = root.style.overflowAnchor;
    const bodyAnchor = body?.style.overflowAnchor || "";

    moreButton.blur?.();
    root.style.setProperty("overflow-anchor", "none", "important");
    body?.style.setProperty("overflow-anchor", "none", "important");

    const restore = () => window.scrollTo({ left: x, top: y, behavior: "auto" });
    const release = () => {
      if (rootAnchor) root.style.overflowAnchor = rootAnchor;
      else root.style.removeProperty("overflow-anchor");
      if (body) {
        if (bodyAnchor) body.style.overflowAnchor = bodyAnchor;
        else body.style.removeProperty("overflow-anchor");
      }
    };

    queueMicrotask(() => {
      restore();
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(() => {
          restore();
          release();
        });
      });
    });
  }, true);

  function install() {
    installNoPressImpressionStyle();
    installActivityFormatting();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
