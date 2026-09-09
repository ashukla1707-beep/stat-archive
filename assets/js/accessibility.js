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

  // Observe existing app modals instead of changing their visual behavior.
  const observer = new MutationObserver(syncModalFocus);
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "aria-hidden"]
  });

  document.addEventListener("keydown", e => {
    const modal = findOpenModal();
    if (!modal) return;

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

  // Announce existing status/toast regions when their content changes.
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

/* Load feature polish last, after archive data/filter/menu scripts exist. */
(() => {
  if (document.querySelector('script[data-stat-feature-polish]')) return;
  const script = document.createElement('script');
  script.src = 'assets/js/feature-polish.js?v=20260901-3';
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

  menuButton.addEventListener("click", event => {
    event.preventDefault();
    if (!supported) return;

    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    document.getElementById("mainSideMenu")?.classList.remove("is-open");
    document.getElementById("mainMenuBackdrop")?.classList.remove("is-open");
    document.getElementById("mainMenuBtn")?.setAttribute("aria-expanded", "false");

    // Allow the menu close animation to finish before opening the library.
    window.setTimeout(() => {
      if (typeof window.openOfflineLibrary === "function") {
        window.openOfflineLibrary();
      } else if (typeof openOfflineLibrary === "function") {
        openOfflineLibrary();
      }
    }, 120);

    // Ask the browser to make saved study files less likely to be evicted.
    try { navigator.storage?.persist?.(); } catch (_) {}
  });
})();

/* =========================================================
   SIDE-MENU HISTORY
   Browser/Android Back now follows the visible navigation hierarchy:
   Home -> Menu -> Menu child -> Menu -> Home.
   ========================================================= */
(() => {
  const NAV_KEY = "statArchiveNav";
  const CHILD_OVERLAY_BUTTONS = new Set([
    "menuAboutBtn",
    "menuOfflineLibraryBtn",
    "menuLocalFeedbackBtn"
  ]);

  const menu = document.getElementById("mainSideMenu");
  const menuBtn = document.getElementById("mainMenuBtn");
  const backdrop = document.getElementById("mainMenuBackdrop");
  const closeBtn = document.getElementById("mainMenuCloseBtn");

  if (!menu || !menuBtn) return;

  const navState = () => history.state?.[NAV_KEY] || "home";

  function stateWith(value) {
    return { ...(history.state || {}), [NAV_KEY]: value };
  }

  function openMenuOnly() {
    closeChildOverlay();
    try { window.statArchiveOpenMenu?.(); } catch (_) {}
    menu.classList.add("is-open");
    backdrop?.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    backdrop?.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenuOnly() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    menu.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function closeChildOverlay() {
    const closeTargets = [
      document.getElementById("closeAboutArchiveBtn"),
      document.querySelector("#offlineLibraryOverlay .offline-close"),
      document.querySelector("#offlineLibraryOverlay [aria-label*='Close' i]"),
      document.getElementById("statFeedbackClose")
    ].filter(Boolean);

    for (const button of closeTargets) {
      const host = button.closest(".overlay, .modal-overlay, #offlineLibraryOverlay, #statLocalFeedbackOverlay");
      if (host && host.getClientRects().length && getComputedStyle(host).display !== "none") {
        try { button.click(); } catch (_) {}
      }
    }

    const feedback = document.getElementById("statLocalFeedbackOverlay");
    if (feedback?.classList.contains("is-open")) {
      feedback.classList.remove("is-open");
      feedback.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
    }
  }

  function enterMenuHistory() {
    if (navState() === "home") {
      history.pushState(stateWith("menu"), "", location.href);
    }
  }

  // Tag the current entry as the plain Home state without changing the URL.
  if (!history.state || !history.state[NAV_KEY]) {
    history.replaceState(stateWith("home"), "", location.href);
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const clickedMenuButton = target.closest("#mainMenuBtn");
    if (clickedMenuButton) {
      if (menu.classList.contains("is-open") && navState() === "menu") {
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
      } else if (!menu.classList.contains("is-open")) {
        enterMenuHistory();
      }
      return;
    }

    if ((target.closest("#mainMenuCloseBtn") || target.closest("#mainMenuBackdrop")) &&
        menu.classList.contains("is-open") && navState() === "menu") {
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
      return;
    }

    const action = target.closest("#mainSideMenu .main-menu-action");
    if (!action) return;

    // Manual is allowed to navigate normally while the current history entry
    // remains the Menu state. Browser Back therefore returns directly to Menu.
    if (action.id === "menuManualsBtn") return;

    // In-app child screens get one extra history level so Back returns to Menu.
    if (CHILD_OVERLAY_BUTTONS.has(action.id) && navState() === "menu") {
      history.pushState(stateWith("child"), "", location.href);
    }
  }, true);

  window.addEventListener("popstate", () => {
    const state = navState();
    if (state === "menu") {
      openMenuOnly();
    } else if (state === "home") {
      closeChildOverlay();
      closeMenuOnly();
    }
  });

  // When returning from a separate Manual page, the restored homepage entry
  // is the Menu entry. Re-open the menu immediately so the first Back lands
  // there instead of appearing to jump straight to Home.
  const restoreFromHistory = () => {
    if (navState() === "menu") {
      requestAnimationFrame(openMenuOnly);
    } else if (navState() === "home") {
      closeMenuOnly();
    }
  };

  window.addEventListener("pageshow", restoreFromHistory);
  restoreFromHistory();
})();