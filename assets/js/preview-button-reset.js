/* Stat Archive: Preview is an action, not a remembered state. */
(() => {
  "use strict";

  const PREVIEW_HISTORY_KEY = "statArchivePreviewedEntries";

  function clearStoredPreviewHistory() {
    try {
      localStorage.removeItem(PREVIEW_HISTORY_KEY);
    } catch (_) {}
  }

  function resetPreviewButton(button) {
    if (!button) return;
    button.classList.remove("is-previewed");
    if (document.activeElement === button) {
      try { button.blur(); } catch (_) {}
    }
  }

  function resetAllPreviewButtons(root = document) {
    clearStoredPreviewHistory();
    root.querySelectorAll?.(".pv-btn.is-previewed").forEach(resetPreviewButton);
  }

  function install() {
    /* Clear any preview history left by older Stat Archive versions. */
    resetAllPreviewButtons();

    const root = document.getElementById("grid") || document.body;
    if (root && root.dataset.previewButtonResetObserver !== "1") {
      root.dataset.previewButtonResetObserver = "1";

      const observer = new MutationObserver((mutations) => {
        let sawPreviewState = false;

        for (const mutation of mutations) {
          if (mutation.type === "attributes") {
            const target = mutation.target;
            if (target instanceof Element && target.matches(".pv-btn.is-previewed")) {
              resetPreviewButton(target);
              sawPreviewState = true;
            }
            continue;
          }

          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;

            if (node.matches?.(".pv-btn.is-previewed")) {
              resetPreviewButton(node);
              sawPreviewState = true;
            }

            node.querySelectorAll?.(".pv-btn.is-previewed").forEach((button) => {
              resetPreviewButton(button);
              sawPreviewState = true;
            });
          });
        }

        if (sawPreviewState) clearStoredPreviewHistory();
      });

      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    /* The old click handler may still add the remembered class/set during
       this page session. Remove it immediately after that click finishes. */
    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.(".pv-btn");
      if (!button) return;

      setTimeout(() => {
        resetPreviewButton(button);
        clearStoredPreviewHistory();
      }, 0);
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resetAllPreviewButtons();
    });

    window.addEventListener("pageshow", () => resetAllPreviewButtons());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
