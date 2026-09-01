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
