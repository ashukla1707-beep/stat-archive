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

  /* runtime.js already owns keyboard trapping for these overlays. Keep this
     accessibility layer responsible for the remaining dialogs only so one
     key press cannot be processed by two independent close/trap handlers. */
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

/* Respect the platform's reduced-motion preference even though older mobile
   overrides in styles.css force the probability animation with !important. */
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

/* Preserve the canonical navigation keys when setLevelUI updates ?level=.
   The legacy implementation replaced history.state with {level} and could
   erase Menu/child state during a cross-tab level change. */
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
      history.replaceState({ ...previous, ...current }, "", window.location.href);
    } catch (_) {}
    return result;
  };

  wrapped.__saStateMergeWrapped = true;
  wrapped.__saOriginal = originalSetLevelUI;
  window.setLevelUI = wrapped;
})();

/* Revoke non-PDF Preview Blob URLs when the image is replaced/closed. The PDF
   engine owns its own Blob URLs; this tracker only observes blob: image srcs
   inside previewBody. */
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
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"]
  });
  sync();

  window.addEventListener("pagehide", () => {
    for (const url of tracked) {
      try { URL.revokeObjectURL(url); } catch (_) {}
    }
    tracked.clear();
  }, { once: true });
})();

/* Load feature polish last, after archive data/filter/menu scripts exist. */
(() => {
  if (window.__statArchiveFeaturePolishLoadedV2) return;
  if (document.querySelector('script[data-stat-feature-polish]')) return;
  const script = document.createElement('script');
  script.src = 'assets/js/feature-polish.js?v=20260910-bugfix-1';
  script.dataset.statFeaturePolish = '1';
  script.async = false;
  document.body.appendChild(script);
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
   This connects the visible side-menu option to it and keeps its count live.

   Navigation history is intentionally NOT handled here. The single canonical
   owner is service-worker-register.js.
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

  if (menuButton.dataset.saOfflineVisualBound === "1") return;
  menuButton.dataset.saOfflineVisualBound = "1";

  menuButton.addEventListener("click", event => {
    event.preventDefault();
    if (!supported) return;

    /* The canonical navigation core has already changed the logical state to
       child/offline-library. This code only performs the visual transition. */
    try { window.__statArchiveNavigation?.closeMenu?.(); } catch (_) {}
    document.getElementById("mainSideMenu")?.classList.remove("is-open");
    document.getElementById("mainMenuBackdrop")?.classList.remove("is-open");
    document.getElementById("mainSideMenu")?.setAttribute("aria-hidden", "true");
    document.getElementById("mainMenuBackdrop")?.setAttribute("aria-hidden", "true");
    document.getElementById("mainMenuBtn")?.setAttribute("aria-expanded", "false");

    window.setTimeout(() => {
      if (typeof window.openOfflineLibrary === "function") {
        window.openOfflineLibrary();
      } else if (typeof openOfflineLibrary === "function") {
        openOfflineLibrary();
      }
    }, 120);

    try { navigator.storage?.persist?.(); } catch (_) {}
  });
})();
