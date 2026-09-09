/* Stat Archive preview state guard.
   Keeps PDF pinch zoom inside the reader and restores the archive viewport after close. */
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
    snapshot = {
      viewportContent: meta.getAttribute("content") || "width=device-width, initial-scale=1.0",
      scrollX: window.scrollX || document.documentElement.scrollLeft || 0,
      scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      bodyOverflow: document.body?.style.overflow || "",
      bodyOverflowX: document.body?.style.overflowX || "",
      bodyOverflowY: document.body?.style.overflowY || "",
      htmlOverflow: document.documentElement.style.overflow || "",
      htmlOverflowX: document.documentElement.style.overflowX || "",
      htmlOverflowY: document.documentElement.style.overflowY || ""
    };

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

    /* Force the visual viewport back to 1:1 before restoring the page's
       normal viewport settings. */
    meta.setAttribute("content", LOCKED_VIEWPORT);

    document.body?.classList.remove("no-scroll");
    document.documentElement.classList.remove("sa-preview-viewport-locked");

    if (document.body) {
      document.body.style.overflow = saved.bodyOverflow;
      document.body.style.overflowX = saved.bodyOverflowX;
      document.body.style.overflowY = saved.bodyOverflowY;
    }
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.documentElement.style.overflowX = saved.htmlOverflowX;
    document.documentElement.style.overflowY = saved.htmlOverflowY;

    document.querySelector("#previewOverlay .preview-card")?.classList.remove("sa-reader-active");

    requestAnimationFrame(() => {
      window.scrollTo(saved.scrollX, saved.scrollY);
      requestAnimationFrame(() => {
        meta.setAttribute("content", saved.viewportContent);
        window.scrollTo(saved.scrollX, saved.scrollY);
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

    /* Re-wrap if preview.js is replaced by the app shell at runtime. */
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

  const SHIM_PATH = "assets/js/offline-library-heading-search-fix.js";

  function shimAlreadyLoaded() {
    return Array.from(document.scripts).some(script =>
      (script.src || "").includes(SHIM_PATH)
    );
  }

  function loadOfflineHeadingSearchFix() {
    if (shimAlreadyLoaded()) return;
    const script = document.createElement("script");
    script.src = `./${SHIM_PATH}?v=20260909-1`;
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
