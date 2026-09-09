/* Stat Archive — legacy Offline Library heading patch compatibility shim.
   The Offline Library header/search layout is now owned only by offline-library-hybrid.js. */
(() => {
  "use strict";
  document.getElementById("saOfflineStableShellOverrides")?.remove();
  document.getElementById("saOfflineHeadingSearchStyle")?.remove();
  document.getElementById("saOfflineHeadingSearchFixStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_HEADING_LEGACY_DISABLED__ = true;
})();

/* =========================================================
   OFFLINE LIBRARY / MENU VISUAL HANDOFF

   Offline Library opens after the side-menu click handler on a short delay.
   Several legacy menu observers still exist for scroll-lock compatibility.
   In some restore/order combinations they can leave the menu visually open
   above the Offline Library even though navigation state is already the
   offline-library child.

   Do not touch history here. When Offline Library becomes visible, only close
   the Menu UI/backdrop. Browser/Android Back can then restore Menu through the
   canonical navigation state normally.
   ========================================================= */
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

      /* Run immediately and once more after menu animation/legacy observers
         have had a frame to react. */
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
