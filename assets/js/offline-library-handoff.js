/* Stat Archive — seamless Menu -> Offline Library handoff v4
   Makes the first Offline Library tap respond immediately, keeps Menu/Offline
   navigation on one history level, resets Offline Library scroll on fresh
   opens, hands nested subject scrolling back to the main library at subject
   boundaries, returns Menu sign-out directly to Home, and keeps the desktop
   Menu only as tall as its content. */
(() => {
  "use strict";

  /* Keep the v3 guard name so an older cached copy and this v4 copy cannot
     both own the same click/navigation listeners in one page instance. */
  if (window.__STAT_ARCHIVE_OFFLINE_HANDOFF_V3__) return;
  window.__STAT_ARCHIVE_OFFLINE_HANDOFF_V3__ = "4";

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

  function setImmediateOfflineOpening(active) {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    overlay.classList.toggle("sa-offline-opening-immediate", !!active);
    if (active) {
      overlay.setAttribute("aria-busy", "true");
      overlay.setAttribute("aria-hidden", "false");
    } else {
      overlay.removeAttribute("aria-busy");
    }
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

  function isSignOutAction(button) {
    if (!button) return false;
    if (document.documentElement?.dataset?.authenticated === "true") return true;
    return /sign\s*out/i.test(button.textContent || "");
  }

  function returnHomeForSignOut() {
    const nav = window.__statArchiveNavigation;
    const nextState = { ...(history.state || {}), statArchiveNav: "home" };
    delete nextState.statArchiveChild;
    delete nextState.statArchiveMenuOpen;

    try {
      const url = new URL(location.href);
      url.searchParams.delete("menu");
      history.replaceState(nextState, "", url.href);
    } catch (_) {
      try { history.replaceState(nextState, "", location.href); } catch (_) {}
    }

    try { nav?.closeChildren?.(); } catch (_) {}
    try { nav?.closeMenu?.(); } catch (_) {}
    try { nav?.releaseMenuScrollLock?.(); } catch (_) {}

    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const menuButton = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    menuButton?.setAttribute("aria-expanded", "false");

    document.body?.classList.remove("no-scroll");
    try { window.statArchiveNormalizeScrollLocks?.(); } catch (_) {}
    requestAnimationFrame(() => {
      try { nav?.releaseMenuScrollLock?.(); } catch (_) {}
      try { window.statArchiveNormalizeScrollLocks?.(); } catch (_) {}
    });
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

    /* Show the already-built canonical shell in the same click frame. The
       canonical opener briefly assigns visibility:hidden while it refreshes
       IndexedDB; the class below intentionally overrides only that temporary
       hiding. This removes the Home flash / apparent failed first click. */
    setImmediateOfflineOpening(true);

    try {
      /* offline-library-hybrid.js normally closes Menu before its async render.
         Temporarily neutralize only that one close call so Menu remains the
         background while IndexedDB/files are refreshed. */
      if (typeof rawMenuClose === "function") {
        window.statArchiveCloseMenu = function() {};
      }

      const opener = window.openOfflineLibrary;
      if (typeof opener !== "function") throw new Error("Offline Library is not ready yet.");

      await Promise.resolve(opener());

      /* The canonical renderer is now complete. Reset old outer/inner scroll
         positions before the browser paints the refreshed content. */
      resetOfflineScrollPosition();
    } catch (error) {
      setImmediateOfflineOpening(false);
      const overlay = document.getElementById("offlineLibraryOverlay");
      if (overlay) {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true");
      }
      try { window.showError?.(error?.message || "Could not open Offline Library."); } catch (_) {}
      return;
    } finally {
      if (typeof rawMenuClose === "function") {
        window.statArchiveCloseMenu = rawMenuClose;
      }
      opening = false;
    }

    setImmediateOfflineOpening(false);
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
/* First Offline Library click must produce visible feedback immediately, even
   while the canonical renderer is refreshing IndexedDB in the background. */
#offlineLibraryOverlay.sa-offline-opening-immediate{
  display:flex!important;
  visibility:visible!important;
  pointer-events:auto!important;
}

#offlineLibraryOverlay .sa-offline-group.open .sa-offline-group-body{
  overscroll-behavior-y:auto!important;
}

/* Desktop/web: do not stretch the Menu to the bottom of the viewport. Its
   header stays fixed inside the panel and its body scrolls only when the
   content genuinely exceeds the available height. Phone layout is untouched. */
@media (min-width:701px){
  html body #mainSideMenu.main-side-menu,
  html body #mainSideMenu.main-side-menu.stat-menu-polished{
    bottom:auto!important;
    height:auto!important;
    max-height:calc(100dvh - 36px)!important;
  }
  html body #mainSideMenu > .stat-menu-scroll-body{
    flex:0 1 auto!important;
    max-height:calc(100dvh - 108px)!important;
    overflow-y:auto!important;
  }
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

    const accountButton = target?.closest("#menuAuthBtn");
    if (accountButton && isSignOutAction(accountButton)) {
      /* The single navigation core has already normalized this click to Menu.
         Convert that same entry to Home before the auth handler runs. Do not
         stop propagation: the real sign-out handler must still receive it. */
      returnHomeForSignOut();
      return;
    }

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
