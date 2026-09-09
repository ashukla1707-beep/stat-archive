/* Stat Archive — scroll lock coordinator v1
   Event-driven cleanup for Menu / Offline Library navigation.
   No MutationObserver: Android/native Back may hide a child overlay without
   calling the normal close handler, so stale locks are reconciled on real
   navigation/focus/touch events only. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR__) return;
  window.__STAT_ARCHIVE_SCROLL_LOCK_COORDINATOR__ = "1";

  const body = () => document.body;
  const root = () => document.documentElement;

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

    /* A visible Manual chooser legitimately owns fixed-body scrolling. */
    if (manualOpen() && b.dataset.manualScrollLock === "1") return false;

    const hasMenuLock =
      b.dataset.statMenuLocked === "1" ||
      b.classList.contains("stat-menu-scroll-locked") ||
      r.classList.contains("stat-menu-scroll-locked") ||
      b.style.position === "fixed";

    if (!hasMenuLock) return false;

    const y = restoreYFromFixedBody();

    /* Prefer the canonical navigation release when it is available. */
    try {
      const release = window.__statArchiveNavigation?.releaseMenuScrollLock;
      if (typeof release === "function") release();
    } catch (_) {}

    delete b.dataset.statMenuLocked;
    r.classList.remove("stat-menu-scroll-locked");
    b.classList.remove("stat-menu-scroll-locked");

    /* The legacy menu guard could create a fixed lock without the private
       subject-panel snapshot. Always normalize those inline properties after
       the Menu is actually closed. */
    if (!menuOpen() && !(manualOpen() && b.dataset.manualScrollLock === "1")) {
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      if (b.style.overflow === "hidden") b.style.overflow = "";
      requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" }));
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
    /* Offline Library must never inherit the Menu's fixed-body lock. */
    if (offlineOpen() && !menuOpen()) releaseMenuFixedLock();

    /* Once the Offline Library / modal is gone, no-scroll must not survive. */
    if (!offlineOpen()) releaseStaleNoScroll();

    /* Home/child background must not remain fixed after the Menu has closed. */
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
    if (typeof rawOpen === "function" && !rawOpen.__saScrollLockWrapped) {
      const wrappedOpen = function(...args) {
        /* The menu visual handler runs before the delayed Offline Library open.
           Clear any legacy fixed-body residue before showing the library. */
        releaseMenuFixedLock();
        const result = rawOpen.apply(this, args);
        requestAnimationFrame(normalizeScrollLocks);
        return result;
      };
      wrappedOpen.__saScrollLockWrapped = true;
      wrappedOpen.__saOriginal = rawOpen;
      window.openOfflineLibrary = wrappedOpen;
      try { openOfflineLibrary = wrappedOpen; } catch (_) {}
    }

    const rawClose = window.closeOfflineLibrary;
    if (typeof rawClose === "function" && !rawClose.__saScrollLockWrapped) {
      const wrappedClose = function(...args) {
        const result = rawClose.apply(this, args);
        const overlay = document.getElementById("offlineLibraryOverlay");
        if (overlay) overlay.setAttribute("aria-hidden", "true");
        scheduleNormalize();
        return result;
      };
      wrappedClose.__saScrollLockWrapped = true;
      wrappedClose.__saOriginal = rawClose;
      window.closeOfflineLibrary = wrappedClose;
      try { closeOfflineLibrary = wrappedClose; } catch (_) {}
    }
  }

  function init() {
    wrapOfflineFunctions();
    scheduleNormalize();

    window.addEventListener("popstate", scheduleNormalize);
    window.addEventListener("pageshow", scheduleNormalize);
    window.addEventListener("focus", scheduleNormalize);
    window.addEventListener("hashchange", scheduleNormalize);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleNormalize();
    });

    /* If Android native Back hides an overlay without dispatching a useful
       navigation event, the first new touch/wheel on Home repairs the stale
       lock synchronously before the user tries to scroll. */
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();