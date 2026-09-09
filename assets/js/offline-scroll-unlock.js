/* Stat Archive — Offline Library stale scroll-lock guard.
   Android/native Back can hide the Offline Library before closeOfflineLibrary()
   gets a chance to remove body.no-scroll. Clear only that stale lock once the
   library is no longer visible. */
(() => {
  "use strict";

  function offlineLibraryVisible() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return false;
    const style = getComputedStyle(overlay);
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      overlay.getAttribute("aria-hidden") !== "true" &&
      overlay.getClientRects().length > 0;
  }

  function clearStaleOfflineLock() {
    const body = document.body;
    if (!body || offlineLibraryVisible()) return;

    /* no-scroll belongs to modal/Offline Library presentation. When none of
       those UI layers is visible, it must not survive into Menu or Home. */
    const manualOpen = document.getElementById("manualChooserOverlay")?.classList.contains("is-open");
    const feedbackOpen = document.getElementById("statLocalFeedbackOverlay")?.classList.contains("is-open");
    const about = document.getElementById("aboutArchiveOverlay");
    const aboutOpen = !!about && getComputedStyle(about).display !== "none" && about.getClientRects().length > 0;

    if (manualOpen || feedbackOpen || aboutOpen) return;

    body.classList.remove("no-scroll");

    /* If the Menu itself is not open, no fixed-body menu lock should remain
       after leaving Offline Library either. */
    const menuOpen = document.getElementById("mainSideMenu")?.classList.contains("is-open");
    if (!menuOpen) {
      delete body.dataset.statMenuLocked;
      document.documentElement.classList.remove("stat-menu-scroll-locked");
      body.classList.remove("stat-menu-scroll-locked");

      if (body.style.position === "fixed") {
        let y = window.scrollY || window.pageYOffset || 0;
        const top = String(body.style.top || "").trim();
        const match = top.match(/^(-?\d+(?:\.\d+)?)px$/);
        if (match) {
          const n = Number(match[1]);
          if (Number.isFinite(n) && n < 0) y = Math.abs(n);
        }

        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        body.style.overflow = "";
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
  }

  function scheduleCleanup() {
    requestAnimationFrame(() => {
      clearStaleOfflineLock();
      setTimeout(clearStaleOfflineLock, 180);
    });
  }

  window.addEventListener("popstate", scheduleCleanup);
  window.addEventListener("pageshow", scheduleCleanup);

  const observer = new MutationObserver(scheduleCleanup);
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "aria-hidden", "hidden"]
  });

  scheduleCleanup();
})();
