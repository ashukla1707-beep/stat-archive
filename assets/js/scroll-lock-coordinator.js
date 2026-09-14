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
  let lockedX = 0;
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

  function previewOpen() {
    return visible(document.getElementById("previewOverlay"));
  }

  function offlineChildState() {
    const nav = window.__statArchiveNavigation;
    return nav?.state?.() === "child" && nav?.child?.() === "offline-library";
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

    const previewReturn = previewOpen() ? window.__statArchivePreviewReturnPosition : null;
    if (previewReturn && Number.isFinite(Number(previewReturn.y))) {
      lockedY = Math.max(0, Number(previewReturn.y));
      lockedX = Number.isFinite(Number(previewReturn.x)) ? Math.max(0, Number(previewReturn.x)) : 0;
    } else {
      lockedY = currentScrollY();
      lockedX = window.scrollX || window.pageXOffset || 0;
    }

    lockOwned = true;

    b.dataset.statGlobalScrollLock = "1";
    r.classList.add("stat-global-scroll-locked");
    b.classList.add("stat-global-scroll-locked");

    b.style.position = "fixed";
    b.style.top = `-${lockedY}px`;
    b.style.left = `-${lockedX}px`;
    b.style.right = "0";
    b.style.width = "100%";
    b.style.overflow = "hidden";
    r.style.overflow = "hidden";
    r.style.overscrollBehavior = "none";
  }

  function restoreScrollInstantly(x, y) {
    const b = body();
    const r = root();
    if (!b || !r) return;

    /* The site intentionally uses html{scroll-behavior:smooth}. During an
       overlay release that would animate scrollTo() and make Preview appear
       to scroll back to the clicked card. Temporarily force AUTO on both
       scrolling roots, restore synchronously in the same JS turn, then put
       the original inline values back before the next normal interaction. */
    const oldRootScrollBehavior = r.style.scrollBehavior;
    const oldBodyScrollBehavior = b.style.scrollBehavior;
    r.style.setProperty("scroll-behavior", "auto", "important");
    b.style.setProperty("scroll-behavior", "auto", "important");

    window.scrollTo(x, y);

    /* Keep the override through the current paint. This prevents WebView and
       Chromium from reinterpreting the restoration as a smooth scroll when
       fixed positioning is removed. */
    requestAnimationFrame(() => {
      if (oldRootScrollBehavior) r.style.scrollBehavior = oldRootScrollBehavior;
      else r.style.removeProperty("scroll-behavior");

      if (oldBodyScrollBehavior) b.style.scrollBehavior = oldBodyScrollBehavior;
      else b.style.removeProperty("scroll-behavior");
    });
  }

  function releaseGlobalLock() {
    const b = body();
    const r = root();
    if (!b || !r || !lockOwned || blockerOpen()) return;

    const restoreY = lockedY;
    const restoreX = lockedX;
    lockOwned = false;

    delete b.dataset.statGlobalScrollLock;
    r.classList.remove("stat-global-scroll-locked");
    b.classList.remove("stat-global-scroll-locked");

    /* Remove fixed positioning and restore the saved coordinates in the SAME
       frame. Never defer the actual position restore to rAF: doing that lets
       one frame of scrollY=0 become visible after the overlay disappears. */
    b.style.position = "";
    b.style.top = "";
    b.style.left = "";
    b.style.right = "";
    b.style.width = "";
    if (b.style.overflow === "hidden") b.style.overflow = "";
    if (r.style.overflow === "hidden") r.style.overflow = "";
    if (r.style.overscrollBehavior === "none") r.style.overscrollBehavior = "";

    restoreScrollInstantly(restoreX, restoreY);
    delete window.__statArchivePreviewReturnPosition;
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
    window.statArchiveRestoreScrollInstantly = restoreScrollInstantly;

    scheduleNormalize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();