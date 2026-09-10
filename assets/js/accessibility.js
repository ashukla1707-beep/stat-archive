/* application section */

(() => {
  const modalSelectors = [
    "#overlay",
    "#authOverlay",
    "#editOverlay",
    "#subjectOverlay",
    "#offlineLibraryOverlay",
    "#pdfViewerOverlay",
    ".modal-overlay",
    "[role='dialog']"
  ];

  /* runtime.js already owns keyboard trapping/escape behavior for these
     overlays. Do not process the same key twice in two independent layers. */
  const runtimeHandledIds = new Set([
    "loginOverlay",
    "contributorDisclaimerOverlay",
    "overlay",
    "previewOverlay",
    "editEntryOverlay"
  ]);

  let lastFocused = null;
  let activeModal = null;

  const visible = el => !!el && (
    el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== "hidden"
  );

  const focusables = root => [...root.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(visible);

  function findOpenModal() {
    const candidates = [...document.querySelectorAll(modalSelectors.join(","))];
    return candidates.reverse().find(el => visible(el) &&
      getComputedStyle(el).display !== "none" &&
      el.getAttribute("aria-hidden") !== "true");
  }

  function enhanceModal(modal) {
    if (!modal) return;
    if (!modal.hasAttribute("role")) modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const title = modal.querySelector("h1,h2,h3,.modal-title,.offline-library-title");
    if (title) {
      if (!title.id) title.id = "dialog-title-" + Math.random().toString(36).slice(2,9);
      if (!modal.hasAttribute("aria-labelledby")) {
        modal.setAttribute("aria-labelledby", title.id);
      }
    }
  }

  function syncModalFocus() {
    const modal = findOpenModal();
    if (modal === activeModal) return;

    if (modal) {
      lastFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement : null;
      activeModal = modal;
      enhanceModal(modal);
      requestAnimationFrame(() => {
        const items = focusables(modal);
        const preferred = modal.querySelector(
          '[autofocus], input:not([type="hidden"]), select, textarea, button'
        );
        (preferred && visible(preferred) ? preferred : items[0] || modal).focus?.();
      });
    } else if (activeModal) {
      activeModal = null;
      if (lastFocused && document.contains(lastFocused)) {
        requestAnimationFrame(() => lastFocused.focus());
      }
    }
  }

  const observer = new MutationObserver(syncModalFocus);
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "aria-hidden"]
  });

  document.addEventListener("keydown", e => {
    const modal = findOpenModal();
    if (!modal || runtimeHandledIds.has(modal.id)) return;

    if (e.key === "Tab") {
      const items = focusables(modal);
      if (!items.length) {
        e.preventDefault();
        modal.tabIndex = -1;
        modal.focus();
        return;
      }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      } else if (!modal.contains(document.activeElement)) {
        e.preventDefault(); first.focus();
      }
      return;
    }

    if (e.key === "Escape") {
      const close = modal.querySelector(
        '[data-close], .modal-close, .close-btn, .offline-close, ' +
        'button[aria-label*="Close" i], button[title*="Close" i]'
      );
      if (close && !close.disabled) {
        e.preventDefault();
        close.click();
      }
    }
  }, true);

  function labelIconButtons(root = document) {
    root.querySelectorAll("button").forEach(btn => {
      if (btn.hasAttribute("aria-label")) return;
      const text = (btn.textContent || "").trim();
      const title = (btn.getAttribute("title") || "").trim();
      if (title) {
        btn.setAttribute("aria-label", title);
      } else if (text === "×" || text === "✕") {
        btn.setAttribute("aria-label", "Close");
      } else if (text === "✎") {
        btn.setAttribute("aria-label", "Edit");
      }
    });
  }

  function enhanceForms(root = document) {
    root.querySelectorAll("input,select,textarea").forEach(el => {
      if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby")) return;
      if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return;
      }
      const placeholder = el.getAttribute("placeholder");
      const name = el.getAttribute("name");
      if (placeholder) el.setAttribute("aria-label", placeholder);
      else if (name) el.setAttribute("aria-label", name.replace(/[-_]+/g, " "));
    });
  }

  document.querySelectorAll(
    ".toast, #toast, .status-message, #statusMessage, .upload-status"
  ).forEach(el => {
    if (!el.hasAttribute("role")) el.setAttribute("role", "status");
    if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
  });

  labelIconButtons();
  enhanceForms();

  const dynamicObserver = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        labelIconButtons(node);
        enhanceForms(node);
      });
    }
    syncModalFocus();
  });
  dynamicObserver.observe(document.body, {subtree:true, childList:true});

  syncModalFocus();
})();

/* Ensure reduced-motion is honored even though an older mobile rule forces
   the probability animation with !important. Normal-motion visuals are not
   changed. */
(() => {
  if (document.getElementById("statArchiveReducedMotionFix")) return;
  const style = document.createElement("style");
  style.id = "statArchiveReducedMotionFix";
  style.textContent = `
@media (prefers-reduced-motion: reduce){
  .gaussian-curve{
    animation:none !important;
    transition:none !important;
    stroke-dasharray:none !important;
    stroke-dashoffset:0 !important;
    opacity:1 !important;
  }
  .data-dot{
    animation:none !important;
    transition:none !important;
    opacity:.95 !important;
    transform:translateY(var(--fall)) !important;
  }
}
`;
  document.head.appendChild(style);
})();

/* Preserve navigation metadata when the M.Sc/B.Sc UI updates ?level=. The
   original setLevelUI replaces history.state with only {level}. */
(() => {
  const originalSetLevelUI = window.setLevelUI;
  if (typeof originalSetLevelUI !== "function" || originalSetLevelUI.__saStateMergeWrapped) return;

  const wrapped = function(level) {
    const previous = history.state && typeof history.state === "object"
      ? { ...history.state }
      : {};
    const result = originalSetLevelUI.call(this, level);
    try {
      const current = history.state && typeof history.state === "object"
        ? history.state
        : {};
      history.replaceState({ ...previous, ...current }, "", location.href);
    } catch (_) {}
    return result;
  };

  wrapped.__saStateMergeWrapped = true;
  wrapped.__saOriginal = originalSetLevelUI;
  window.setLevelUI = wrapped;
})();

/* preview.js creates Blob URLs for non-PDF image previews. Track only those
   image URLs and revoke them as soon as the preview DOM stops using them. */
(() => {
  const previewBody = document.getElementById("previewBody");
  if (!previewBody || previewBody.dataset.saBlobCleanup === "1") return;
  previewBody.dataset.saBlobCleanup = "1";

  const tracked = new Set();
  const sync = () => {
    const live = new Set(
      [...previewBody.querySelectorAll('img[src^="blob:"]')]
        .map(img => img.src)
        .filter(Boolean)
    );

    for (const url of tracked) {
      if (!live.has(url)) {
        try { URL.revokeObjectURL(url); } catch (_) {}
        tracked.delete(url);
      }
    }
    for (const url of live) tracked.add(url);
  };

  new MutationObserver(sync).observe(previewBody, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:["src"]
  });
  sync();

  window.addEventListener("pagehide", () => {
    for (const url of tracked) {
      try { URL.revokeObjectURL(url); } catch (_) {}
    }
    tracked.clear();
  }, { once:true });
})();

/*
 * Normal web and installed APK/PWA must use the same final Menu stack.
 *
 * Keep correctness-sensitive modules ahead of feature-polish. speed-boost V3
 * can safely unwrap an already-running V2 after a service-worker update, and
 * search-suggestions establishes the canonical autocomplete before the legacy
 * fallback in feature-polish initializes.
 */
(() => {
  const runtime = [
    "assets/js/speed-boost.js?v=20260910-bugfix-3",
    "assets/js/startup-polish.js?v=20260910-2",
    "assets/js/search-suggestions.js?v=20260910-bugfix-1",
    "assets/js/feature-polish.js?v=20260910-bugfix-2",
    "assets/js/menu-polish.js?v=20260909-websync-1",
    "assets/js/menu-alignment-fix.js?v=20260909-navigation-fix-v2",
    "assets/js/menu-header-reference.js?v=20260910-5",
    "assets/js/offline-library-hybrid.js?v=20260910-canonical-15",
    "assets/js/scroll-lock-coordinator.js?v=20260910-2",
    "assets/js/offline-library-handoff.js?v=20260910-3"
  ];

  function baseName(src) {
    return src.split("?")[0].split("/").pop();
  }

  function alreadyPresent(src) {
    const name = baseName(src);
    return [...document.scripts].some(script => {
      const value = script.getAttribute("src") || "";
      return value.split("?")[0].endsWith(`/assets/js/${name}`) ||
        value.split("?")[0].endsWith(`assets/js/${name}`);
    });
  }

  function load(src) {
    return new Promise(resolve => {
      if (alreadyPresent(src)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.statWebApkMenuRuntime = "1";
      script.addEventListener("load", resolve, { once:true });
      script.addEventListener("error", resolve, { once:true });
      document.body.appendChild(script);
    });
  }

  async function syncWebMenuRuntime() {
    for (const src of runtime) await load(src);
    document.documentElement.dataset.statMenuRuntime = "apk";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncWebMenuRuntime, { once:true });
  } else {
    void syncWebMenuRuntime();
  }
})();

/*
 * When a PDF is opened from Preview, use the archive entry title as the
 * visible filename instead of the original uploaded filename.
 */
(() => {
  const originalOpenPdfInNewTab = window.openPdfInNewTab;
  if (typeof originalOpenPdfInNewTab !== "function") return;

  window.openPdfInNewTab = function (pdfUrl, fallbackFilename) {
    const rawTitle = (document.getElementById("previewTitle")?.textContent || "").trim();

    const safeTitle = rawTitle
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "")
      .trim();

    const entryFilename = safeTitle
      ? `${safeTitle.replace(/\.pdf$/i, "")}.pdf`
      : (fallbackFilename || "document.pdf");

    return originalOpenPdfInNewTab(pdfUrl, entryFilename);
  };
})();

/* =========================================================
   OFFLINE LIBRARY — WEB + PWA ENABLEMENT
   The IndexedDB implementation already works in normal browsers/PWAs.
   This block owns only capability + count synchronization.

   Opening is intentionally handled by offline-library-handoff.js so web and
   APK/PWA use the same click, history and Menu-to-Library transition path.
   ========================================================= */
(() => {
  const menuButton = document.getElementById("menuOfflineLibraryBtn");
  const menuCount = document.getElementById("menuOfflineLibraryCount");
  const legacyCount = document.getElementById("offlineLibraryCount");

  if (!menuButton) return;

  const supported = "indexedDB" in window;
  menuButton.disabled = !supported;
  menuButton.setAttribute("aria-disabled", supported ? "false" : "true");
  menuButton.title = supported
    ? "Open files saved on this device for offline use"
    : "Offline Library is not supported by this browser";

  function mirrorCount() {
    if (!menuCount) return;
    const value = legacyCount?.textContent?.trim();
    if (value != null && value !== "") menuCount.textContent = value;
  }

  mirrorCount();

  if (legacyCount) {
    new MutationObserver(mirrorCount).observe(legacyCount, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (supported && typeof window.getOfflineFiles === "function") {
    window.getOfflineFiles()
      .then(records => {
        const count = Array.isArray(records) ? records.length : 0;
        if (menuCount) menuCount.textContent = String(count);
        try { window.updateOfflineLibraryCount?.(count); } catch (_) {}
      })
      .catch(() => {});
  }
})();
