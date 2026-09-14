/* Stat Archive preview viewport guard.
   Keeps PDF pinch zoom inside the reader.
   Page scroll position is owned exclusively by scroll-lock-coordinator.js. */
(() => {
  "use strict";

  const LOCKED_VIEWPORT = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";
  let snapshot = null;
  let restoring = false;

  function getViewportMeta() {
    let meta = document.getElementById("viewportMeta") || document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    return meta;
  }

  function previewIsOpen() {
    const overlay = document.getElementById("previewOverlay");
    if (!overlay) return false;
    const style = getComputedStyle(overlay);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function captureArchiveState() {
    if (snapshot) return;

    const meta = getViewportMeta();
    const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

    snapshot = {
      viewportContent: meta.getAttribute("content") || "width=device-width, initial-scale=1.0",
      scrollX,
      scrollY
    };

    /* Capture the true archive position before changing viewport metadata.
       The global scroll coordinator consumes this value when Preview acquires
       its page lock, so closing returns to the exact same entry. */
    window.__statArchivePreviewReturnPosition = { x: scrollX, y: scrollY };

    /* Android/WebView must not use browser-level pinch zoom here.
       The PDF viewer already implements its own pinch zoom. */
    meta.setAttribute("content", LOCKED_VIEWPORT);
    document.documentElement.classList.add("sa-preview-viewport-locked");
  }

  function restoreArchiveState() {
    if (!snapshot || restoring) return;
    restoring = true;

    const saved = snapshot;
    snapshot = null;
    const meta = getViewportMeta();

    /* Keep browser zoom fixed while the shared scroll coordinator releases
       the fixed-body lock. Do not restore body/html overflow or scroll here. */
    meta.setAttribute("content", LOCKED_VIEWPORT);
    document.documentElement.classList.remove("sa-preview-viewport-locked");
    document.querySelector("#previewOverlay .preview-card")?.classList.remove("sa-reader-active");

    try { window.statArchiveSyncGlobalScrollLock?.(); } catch (_) {}

    requestAnimationFrame(() => {
      meta.setAttribute("content", saved.viewportContent);
      requestAnimationFrame(() => {
        try { window.statArchiveNormalizeScrollLocks?.(); } catch (_) {}
        restoring = false;
      });
    });
  }

  function wrapPreviewEntry() {
    const original = window.previewEntry;
    if (typeof original !== "function" || original.__saStateGuardWrapped) return;

    const wrapped = function (...args) {
      captureArchiveState();
      return original.apply(this, args);
    };
    wrapped.__saStateGuardWrapped = true;
    wrapped.__saOriginal = original;
    window.previewEntry = wrapped;
  }

  function watchPreviewOverlay() {
    const overlay = document.getElementById("previewOverlay");
    if (!overlay || overlay.dataset.saStateGuardObserver === "1") return;
    overlay.dataset.saStateGuardObserver = "1";

    const observer = new MutationObserver(() => {
      if (!previewIsOpen()) restoreArchiveState();
    });
    observer.observe(overlay, {
      attributes: true,
      attributeFilter: ["style", "class", "aria-hidden"]
    });
  }

  function bindCloseSafety() {
    document.getElementById("closePreviewBtn")?.addEventListener("click", () => {
      setTimeout(() => {
        if (!previewIsOpen()) restoreArchiveState();
      }, 0);
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setTimeout(() => {
        if (!previewIsOpen()) restoreArchiveState();
      }, 0);
    }, true);

    window.addEventListener("pagehide", restoreArchiveState);
  }

  function install() {
    wrapPreviewEntry();
    watchPreviewOverlay();
    bindCloseSafety();

    let last = window.previewEntry;
    setInterval(() => {
      if (window.previewEntry !== last) {
        wrapPreviewEntry();
        last = window.previewEntry;
      }
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* Load the selected Offline Library heading/search visual treatment.
   This loader lives in a network-first runtime so PWA/APK installs receive
   the visual update without waiting on an old app-shell cache. */
(() => {
  "use strict";

  function loadOfflineHeadingSearchFix() {
    if (document.querySelector('script[data-sa-offline-heading-search-fix="1"]')) return;
    const script = document.createElement("script");
    script.src = "./assets/js/offline-library-heading-search-fix.js?v=20260909-1";
    script.async = false;
    script.dataset.saOfflineHeadingSearchFix = "1";
    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadOfflineHeadingSearchFix, { once:true });
  } else {
    loadOfflineHeadingSearchFix();
  }
})();
