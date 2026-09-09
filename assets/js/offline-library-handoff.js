/* Stat Archive — seamless Menu -> Offline Library handoff v1
   Keeps Menu visible while Offline Library finishes rendering, then swaps the
   two UIs in one paint. Also resets the Offline Library scroll position on
   every fresh Menu open. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_HANDOFF__) return;
  window.__STAT_ARCHIVE_OFFLINE_HANDOFF__ = "1";

  let opening = false;

  function resetOfflineScrollPosition() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    const mainScroll = overlay.querySelector(".sa-offline-scroll");
    if (mainScroll) mainScroll.scrollTop = 0;

    overlay.querySelectorAll(".sa-offline-group-body").forEach(body => {
      body.scrollTop = 0;
    });
  }

  function closeMenuAfterLibraryIsReady() {
    try { window.__statArchiveNavigation?.closeMenu?.(); } catch (_) {}

    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");

    try { window.statArchiveNormalizeScrollLocks?.(); } catch (_) {}
  }

  async function openFromMenu() {
    if (opening) return;
    opening = true;

    const nav = window.__statArchiveNavigation;
    try {
      if (nav?.state?.() !== "child" || nav?.child?.() !== "offline-library") {
        nav?.enterChild?.("offline-library");
      }
    } catch (_) {}

    const rawMenuClose = window.statArchiveCloseMenu;

    try {
      /* offline-library-hybrid.js normally closes Menu before its async render.
         Temporarily neutralize only that one close call so Menu remains the
         visible background while IndexedDB/files are rendered invisibly. */
      if (typeof rawMenuClose === "function") {
        window.statArchiveCloseMenu = function() {};
      }

      const opener = window.openOfflineLibrary;
      if (typeof opener !== "function") throw new Error("Offline Library is not ready yet.");

      await Promise.resolve(opener());

      /* The canonical renderer is now complete and the overlay has been made
         visible. Reset old outer/inner scroll positions before the browser can
         paint the new screen, then remove Menu underneath it. */
      resetOfflineScrollPosition();
    } catch (error) {
      try { window.showError?.(error?.message || "Could not open Offline Library."); } catch (_) {}
      return;
    } finally {
      if (typeof rawMenuClose === "function") {
        window.statArchiveCloseMenu = rawMenuClose;
      }
      opening = false;
    }

    closeMenuAfterLibraryIsReady();
    requestAnimationFrame(resetOfflineScrollPosition);
    setTimeout(resetOfflineScrollPosition, 60);

    try { navigator.storage?.persist?.(); } catch (_) {}
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("#menuOfflineLibraryBtn");
    if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;

    /* service-worker-register.js is registered earlier and has already created
       the child history row by this point. Stop the older accessibility.js
       button listener from closing Menu and waiting 120 ms before opening. */
    event.preventDefault();
    event.stopImmediatePropagation();
    void openFromMenu();
  }, true);
})();