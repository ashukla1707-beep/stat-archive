/* Stat Archive — scroll lock + Offline navigation coordinator v2
   One-level Back semantics for Menu -> Offline Library:
     Offline Library -> Back/× -> Menu -> Back -> Home.
   Also cleans stale Menu/no-scroll locks without a MutationObserver. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR_V2__) return;
  window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR_V2__ = "2";

  const body = () => document.body;
  const root = () => document.documentElement;
  const nativeHistoryBack = history.back.bind(history);
  let intentionalOfflineBack = false;

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

  function otherBlockingModalOpen() {
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
      "statLocalFeedbackOverlay"
    ];
    return ids.some(id => visible(document.getElementById(id)));
  }

  /* menu-alignment-fix.js has a legacy child-close observer. On Android Back,
     native code can hide Offline Library and then call WebView.goBack().
     The observer used to see the hidden overlay first and call history.back()
     itself, causing TWO back operations and skipping Menu. Suppress only that
     obsolete JS back: hidden Offline Library + still child state. */
  history.back = function(...args) {
    if (offlineChildState() && !offlineOpen() && !intentionalOfflineBack) {
      return;
    }
    return nativeHistoryBack(...args);
  };

  function goBackOneLevelFromOffline() {
    if (!offlineChildState()) return false;
    if (intentionalOfflineBack) return true;

    intentionalOfflineBack = true;
    nativeHistoryBack();

    setTimeout(() => {
      intentionalOfflineBack = false;
    }, 700);
    return true;
  }

  function restoreYFromFixedBody() {
    const b = body();
    if (!b) return window.scrollY || window.pageYOffset || 0;

    let y = window.scrollY || window.pageYOffset || 0;
    const top = String(b.style.top || "").trim();
    const match = top.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n < 0) y = Math.abs(n);
    }
    return y;
  }

  function releaseMenuFixedLock() {
    const b = body();
    const r = root();
    if (!b || !r || menuOpen()) return false;
    if (manualOpen() && b.dataset.manualScrollLock === "1") return false;

    const hasMenuLock =
      b.dataset.statMenuLocked === "1" ||
      b.classList.contains("stat-menu-scroll-locked") ||
      r.classList.contains("stat-menu-scroll-locked") ||
      b.style.position === "fixed";

    if (!hasMenuLock) return false;

    const y = restoreYFromFixedBody();

    try {
      const release = window.__statArchiveNavigation?.releaseMenuScrollLock;
      if (typeof release === "function") release();
    } catch (_) {}

    delete b.dataset.statMenuLocked;
    r.classList.remove("stat-menu-scroll-locked");
    b.classList.remove("stat-menu-scroll-locked");

    if (!menuOpen() && !(manualOpen() && b.dataset.manualScrollLock === "1")) {
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      if (b.style.overflow === "hidden") b.style.overflow = "";

      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      });
    }

    return true;
  }

  function releaseStaleNoScroll() {
    const b = body();
    if (!b || !b.classList.contains("no-scroll")) return false;
    if (offlineOpen() || otherBlockingModalOpen() || manualOpen()) return false;
    b.classList.remove("no-scroll");
    return true;
  }

  function normalizeScrollLocks() {
    if (offlineOpen() && !menuOpen()) releaseMenuFixedLock();
    if (!offlineOpen()) releaseStaleNoScroll();
    if (!menuOpen()) releaseMenuFixedLock();
  }

  function scheduleNormalize() {
    normalizeScrollLocks();
    requestAnimationFrame(normalizeScrollLocks);
    setTimeout(normalizeScrollLocks, 80);
    setTimeout(normalizeScrollLocks, 220);
  }

  function wrapOfflineFunctions() {
    const rawOpen = window.openOfflineLibrary;
    if (typeof rawOpen === "function" && !rawOpen.__saNavigationV2Wrapped) {
      const wrappedOpen = function(...args) {
        releaseMenuFixedLock();
        const result = rawOpen.apply(this, args);
        requestAnimationFrame(normalizeScrollLocks);
        return result;
      };
      wrappedOpen.__saNavigationV2Wrapped = true;
      wrappedOpen.__saOriginal = rawOpen;
      window.openOfflineLibrary = wrappedOpen;
      try { openOfflineLibrary = wrappedOpen; } catch (_) {}
    }

    const rawClose = window.closeOfflineLibrary;
    if (typeof rawClose === "function" && !rawClose.__saNavigationV2Wrapped) {
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
      wrappedClose.__saNavigationV2Wrapped = true;
      wrappedClose.__saOriginal = rawClose;
      window.closeOfflineLibrary = wrappedClose;
      try { closeOfflineLibrary = wrappedClose; } catch (_) {}
    }
  }

  function init() {
    wrapOfflineFunctions();
    scheduleNormalize();

    window.addEventListener("popstate", () => {
      intentionalOfflineBack = false;
      scheduleNormalize();
    });
    window.addEventListener("pageshow", scheduleNormalize);
    window.addEventListener("focus", scheduleNormalize);
    window.addEventListener("hashchange", scheduleNormalize);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleNormalize();
    });

    document.addEventListener("touchstart", normalizeScrollLocks, {
      passive: true,
      capture: true
    });
    document.addEventListener("pointerdown", normalizeScrollLocks, {
      passive: true,
      capture: true
    });
    window.addEventListener("wheel", normalizeScrollLocks, { passive: true });

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest("#menuOfflineLibraryBtn") ||
          target.closest("#closeOfflineLibraryBtn")) {
        setTimeout(scheduleNormalize, 0);
      }
    }, true);

    window.statArchiveNormalizeScrollLocks = scheduleNormalize;
    window.statArchiveOfflineBackToMenu = goBackOneLevelFromOffline;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();