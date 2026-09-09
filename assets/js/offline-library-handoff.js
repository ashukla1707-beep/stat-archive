/* Stat Archive — seamless Menu -> Offline Library handoff v2
   Keeps Menu visible while Offline Library finishes rendering, then swaps the
   two UIs in one paint. Resets Offline Library scroll on fresh opens and hands
   nested subject scrolling back to the main library at top/bottom boundaries. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_HANDOFF_V2__) return;
  window.__STAT_ARCHIVE_OFFLINE_HANDOFF_V2__ = "2";

  let opening = false;
  let activeTouchBody = null;
  let lastTouchY = 0;

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

  function mainScrollFor(body) {
    return body?.closest(".sa-offline-scroll") ||
      document.querySelector("#offlineLibraryOverlay .sa-offline-scroll");
  }

  function atBoundary(body, delta) {
    if (!body) return false;
    const max = Math.max(0, body.scrollHeight - body.clientHeight);
    if (max <= 1) return true;
    if (delta > 0) return body.scrollTop >= max - 1;
    if (delta < 0) return body.scrollTop <= 1;
    return false;
  }

  function canMainScroll(main, delta) {
    if (!main || !delta) return false;
    const max = Math.max(0, main.scrollHeight - main.clientHeight);
    if (delta > 0) return main.scrollTop < max - 1;
    return main.scrollTop > 1;
  }

  function transferToMain(body, delta) {
    const main = mainScrollFor(body);
    if (!main || !canMainScroll(main, delta)) return false;

    const max = Math.max(0, main.scrollHeight - main.clientHeight);
    main.scrollTop = Math.max(0, Math.min(max, main.scrollTop + delta));
    return true;
  }

  function installBoundaryScrollHandoff() {
    if (document.getElementById("saOfflineBoundaryHandoffStyle")) return;

    const style = document.createElement("style");
    style.id = "saOfflineBoundaryHandoffStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-group.open .sa-offline-group-body{
  overscroll-behavior-y:auto!important;
}
`;
    document.head.appendChild(style);

    document.addEventListener("touchstart", event => {
      const target = event.target instanceof Element ? event.target : null;
      activeTouchBody = target?.closest("#offlineLibraryOverlay .sa-offline-group.open .sa-offline-group-body") || null;
      if (!activeTouchBody || !event.touches?.length) return;
      lastTouchY = event.touches[0].clientY;
    }, { capture:true, passive:true });

    document.addEventListener("touchmove", event => {
      if (!activeTouchBody || !event.touches?.length) return;
      if (!document.contains(activeTouchBody)) {
        activeTouchBody = null;
        return;
      }

      const y = event.touches[0].clientY;
      const delta = lastTouchY - y;
      lastTouchY = y;

      if (Math.abs(delta) < 0.5) return;
      if (!atBoundary(activeTouchBody, delta)) return;

      if (transferToMain(activeTouchBody, delta)) {
        /* Once the nested subject reaches its edge, keep the same finger gesture
           moving the main Offline Library so the next/previous subject becomes
           reachable without lifting the finger. */
        event.preventDefault();
      }
    }, { capture:true, passive:false });

    const endTouch = () => {
      activeTouchBody = null;
      lastTouchY = 0;
    };
    document.addEventListener("touchend", endTouch, { capture:true, passive:true });
    document.addEventListener("touchcancel", endTouch, { capture:true, passive:true });

    document.addEventListener("wheel", event => {
      const target = event.target instanceof Element ? event.target : null;
      const body = target?.closest("#offlineLibraryOverlay .sa-offline-group.open .sa-offline-group-body");
      if (!body || !event.deltaY) return;
      if (!atBoundary(body, event.deltaY)) return;

      if (transferToMain(body, event.deltaY)) {
        event.preventDefault();
      }
    }, { capture:true, passive:false });
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

  installBoundaryScrollHandoff();
})();