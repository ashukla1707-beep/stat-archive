/* Stat Archive — global scroll lock + Offline navigation coordinator v3
   Locks the page behind every blocking overlay/dialog/menu while preserving
   the exact scroll position. Overlay contents remain independently scrollable.

   Also preserves one-level Back semantics for Menu -> Offline Library:
     Offline Library -> Back/× -> Menu -> Back -> Home.
*/
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR_V3__) return;
  window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR_V3__ = "3";

  const body = () => document.body;
  const root = () => document.documentElement;
  const nativeHistoryBack = history.back.bind(history);

  let intentionalOfflineBack = false;
  let lockOwned = false;
  let lockedY = 0;
  let syncQueued = false;

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;

    if (el.classList.contains("manual-chooser-overlay") ||
        el.classList.contains("stat-feedback-overlay")) {
      return el.classList.contains("is-open");
    }

    return el.getClientRects().length > 0;
  }

  function menuOpen() {
    const menu = document.getElementById("mainSideMenu");
    return !!menu && menu.classList.contains("is-open") && visible(menu);
  }

  function offlineOpen() {
    return visible(document.getElementById("offlineLibraryOverlay"));
  }

  function offlineChildState() {
    const nav = window.__statArchiveNavigation;
    return nav?.state?.() === "child" && nav?.child?.() === "offline-library";
  }

  function manualOpen() {
    return visible(document.getElementById("manualChooserOverlay"));
  }

  function explicitBlockingModalOpen() {
    const ids = [
      "overlay",
      "loginOverlay",
      "authOverlay",
      "contributorDisclaimerOverlay",
      "previewOverlay",
      "editEntryOverlay",
      "editOverlay",
      "subjectOverlay",
      "aboutArchiveOverlay",
      "statLocalFeedbackOverlay",
      "offlineLibraryOverlay",
      "manualChooserOverlay"
    ];
    return ids.some(id => visible(document.getElementById(id)));
  }

  function genericDialogOpen() {
    return [...document.querySelectorAll('[role="dialog"], .overlay, .modal-overlay')]
      .some(visible);
  }

  function blockerOpen() {
    return menuOpen() || explicitBlockingModalOpen() || genericDialogOpen();
  }

  function currentScrollY() {
    const b = body();
    if (b?.style.position === "fixed") {
      const match = String(b.style.top || "").trim().match(/^(-?\d+(?:\.\d+)?)px$/);
      if (match) {
        const n = Number(match[1]);
        if (Number.isFinite(n) && n <= 0) return Math.abs(n);
      }
    }
    return window.scrollY || window.pageYOffset || 0;
  }

  function acquireGlobalLock() {
    const b = body();
    const r = root();
    if (!b || !r || lockOwned) return;

    lockedY = currentScrollY();
    lockOwned = true;

    b.dataset.statGlobalScrollLock = "1";
    r.classList.add("stat-global-scroll-locked");
    b.classList.add("stat-global-scroll-locked");

    /* position:fixed is required for reliable touch-scroll locking on mobile.
       Keep the saved offset in top so closing restores the exact position. */
    b.style.position = "fixed";
    b.style.top = `-${lockedY}px`;
    b.style.left = "0";
    b.style.right = "0";
    b.style.width = "100%";
    b.style.overflow = "hidden";
    r.style.overflow = "hidden";
    r.style.overscrollBehavior = "none";
  }

  function releaseGlobalLock() {
    const b = body();
    const r = root();
    if (!b || !r || !lockOwned || blockerOpen()) return;

    const restoreY = lockedY;
    lockOwned = false;

    delete b.dataset.statGlobalScrollLock;
    r.classList.remove("stat-global-scroll-locked");
    b.classList.remove("stat-global-scroll-locked");

    /* Clear only the global lock values. Other components can immediately
       reapply their own styles if they need them. */
    b.style.position = "";
    b.style.top = "";
    b.style.left = "";
    b.style.right = "";
    b.style.width = "";
    if (b.style.overflow === "hidden") b.style.overflow = "";
    if (r.style.overflow === "hidden") r.style.overflow = "";
    if (r.style.overscrollBehavior === "none") r.style.overscrollBehavior = "";

    requestAnimationFrame(() => {
      window.scrollTo({ top: restoreY, left: 0, behavior: "auto" });
    });
  }

  function syncGlobalLock() {
    if (blockerOpen()) acquireGlobalLock();
    else releaseGlobalLock();
  }

  function queueGlobalLockSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      syncGlobalLock();
    });
  }

  /* menu-alignment-fix.js has a legacy child-close observer. On Android Back,
     native code can hide Offline Library and then call WebView.goBack().
     Suppress only the obsolete second JS back. */
  history.back = function(...args) {
    if (offlineChildState() && !offlineOpen() && !intentionalOfflineBack) return;
    return nativeHistoryBack(...args);
  };

  function goBackOneLevelFromOffline() {
    if (!offlineChildState()) return false;
    if (intentionalOfflineBack) return true;

    intentionalOfflineBack = true;
    nativeHistoryBack();
    setTimeout(() => { intentionalOfflineBack = false; }, 700);
    return true;
  }

  function releaseStaleLegacyNoScroll() {
    const b = body();
    if (!b || !b.classList.contains("no-scroll")) return false;
    if (blockerOpen()) return false;
    b.classList.remove("no-scroll");
    return true;
  }

  function normalizeScrollLocks() {
    releaseStaleLegacyNoScroll();
    syncGlobalLock();
  }

  function scheduleNormalize() {
    normalizeScrollLocks();
    requestAnimationFrame(normalizeScrollLocks);
    setTimeout(normalizeScrollLocks, 80);
    setTimeout(normalizeScrollLocks, 220);
  }

  function wrapOfflineFunctions() {
    const rawOpen = window.openOfflineLibrary;
    if (typeof rawOpen === "function" && !rawOpen.__saNavigationV3Wrapped) {
      const wrappedOpen = function(...args) {
        const result = rawOpen.apply(this, args);
        queueGlobalLockSync();
        return result;
      };
      wrappedOpen.__saNavigationV3Wrapped = true;
      wrappedOpen.__saOriginal = rawOpen;
      window.openOfflineLibrary = wrappedOpen;
      try { openOfflineLibrary = wrappedOpen; } catch (_) {}
    }

    const rawClose = window.closeOfflineLibrary;
    if (typeof rawClose === "function" && !rawClose.__saNavigationV3Wrapped) {
      const wrappedClose = function(...args) {
        if (offlineChildState()) {
          goBackOneLevelFromOffline();
          return;
        }

        const result = rawClose.apply(this, args);
        const overlay = document.getElementById("offlineLibraryOverlay");
        if (overlay) overlay.setAttribute("aria-hidden", "true");
        scheduleNormalize();
        return result;
      };
      wrappedClose.__saNavigationV3Wrapped = true;
      wrappedClose.__saOriginal = rawClose;
      window.closeOfflineLibrary = wrappedClose;
      try { closeOfflineLibrary = wrappedClose; } catch (_) {}
    }
  }

  function init() {
    wrapOfflineFunctions();

    /* Catch every current and future overlay without requiring each feature to
       remember to call lock/unlock. Class/style/aria changes are enough. */
    const observer = new MutationObserver(queueGlobalLockSync);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "open"]
    });

    window.addEventListener("popstate", () => {
      intentionalOfflineBack = false;
      scheduleNormalize();
    });
    window.addEventListener("pageshow", scheduleNormalize);
    window.addEventListener("hashchange", scheduleNormalize);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleNormalize();
    });

    document.addEventListener("click", () => queueGlobalLockSync(), true);
    document.addEventListener("pointerdown", queueGlobalLockSync, {
      passive: true,
      capture: true
    });

    window.statArchiveNormalizeScrollLocks = scheduleNormalize;
    window.statArchiveOfflineBackToMenu = goBackOneLevelFromOffline;
    window.statArchiveSyncGlobalScrollLock = syncGlobalLock;

    scheduleNormalize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();