/* Stat Archive — late card-action compatibility fixes. */
(() => {
  "use strict";

  const STYLE_ID = "statArchiveOfflineWebPwaFix";

  function install() {
    document.documentElement.classList.add("stat-archive-pwa");

    /* Android WebView scales the page differently from the normal browser.
       Mark only the real WebView so the mu can be visually matched to web. */
    const ua = navigator.userAgent || "";
    const isAndroidWebView = /Android/i.test(ua) && (/;\s*wv\)/i.test(ua) || /Version\/4\.0/i.test(ua));
    document.documentElement.classList.toggle("stat-archive-android-webview", isAndroidWebView);

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
/* Offline Library is enabled in both normal HTTPS web mode and installed PWA. */
html body .card .card-actions .offline-btn,
html:not(.stat-archive-pwa) body .card .card-actions .offline-btn,
html.stat-archive-pwa body .card .card-actions .offline-btn{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

/* Preview + Download + Offline must all fit on a reader card. */
html body .card .card-actions{
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:8px !important;
}
html body .card .card-actions .action-btn{
  width:100% !important;
  min-width:0 !important;
}

/* Access card value only. */
html body #summaryAccess{
  font-size:16px !important;
  line-height:1.08 !important;
}

/* Browser/raw HTML: this is the reference size that already looks correct. */
html body .header .hero-probability .axis-mid{
  font-family:Arial,Helvetica,sans-serif !important;
  font-size:14px !important;
  font-style:normal !important;
  font-weight:500 !important;
  line-height:1 !important;
  letter-spacing:0 !important;
}

/* The Android WebView renders the same CSS px smaller after page scaling.
   Compensate only inside the APK so it visually matches the 14px web label. */
html.stat-archive-android-webview body .header .hero-probability .axis-mid{
  font-size:22px !important;
}

@media(max-width:700px){
  html body .card .card-actions{
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    gap:6px !important;
  }
  html body .card .card-actions .action-btn{
    padding-left:5px !important;
    padding-right:5px !important;
    font-size:10px !important;
  }
  html body #summaryAccess{
    font-size:16px !important;
  }
  html body .header .hero-probability .axis-mid{
    font-size:14px !important;
  }
  html.stat-archive-android-webview body .header .hero-probability .axis-mid{
    font-size:22px !important;
  }
}
`;
      document.head.appendChild(style);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();

/* =========================================================
   MANUAL -> HOME HISTORY FLOW v3
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V2__) return;
  window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V2__ = "3";

  function homeUrl() {
    const url = new URL(location.href);
    url.searchParams.delete("menu");
    return url.href;
  }

  function normalizeCurrentEntryToHome() {
    const next = { ...(history.state || {}), statArchiveNav:"home" };
    delete next.statArchiveChild;
    delete next.statArchiveMenuOpen;

    try {
      history.replaceState(next, "", homeUrl());
    } catch (_) {
      try { history.replaceState(next, "", location.href); } catch (_) {}
    }

    try { window.__statArchiveNavigation?.closeMenu?.(); } catch (_) {}
    try { window.__statArchiveNavigation?.releaseMenuScrollLock?.(); } catch (_) {}
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const choice = target?.closest?.("#manualChooserOverlay [data-manual-href]");
    if (!choice) return;

    const href = choice.getAttribute("data-manual-href");
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const destination = new URL(href, location.href).href;
    normalizeCurrentEntryToHome();
    window.location.assign(destination);
  }, true);
})();

/* =========================================================
   DETERMINISTIC MENU CLOSE
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_CLOSE_SETTLER_V1__) return;
  window.__STAT_ARCHIVE_MENU_CLOSE_SETTLER_V1__ = true;

  let settling = false;
  let backAttempts = 0;
  let settleTimer = 0;

  function isMenuState() {
    try {
      if (history.state?.statArchiveNav === "menu") return true;
      return new URL(location.href).searchParams.get("menu") === "1";
    } catch (_) {
      return history.state?.statArchiveNav === "menu";
    }
  }

  function closeMenuVisuals() {
    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
  }

  function releaseMenuLock() {
    try { window.__statArchiveNavigation?.releaseMenuScrollLock?.(); } catch (_) {}

    if (!document.body) return;
    if (history.state?.statArchiveNav === "menu") return;

    delete document.body.dataset.statMenuLocked;
    document.documentElement.classList.remove("stat-menu-scroll-locked");
    document.body.classList.remove("stat-menu-scroll-locked");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
  }

  function settle() {
    clearTimeout(settleTimer);
    closeMenuVisuals();

    if (isMenuState() && backAttempts < 3) {
      backAttempts += 1;
      history.back();
      settleTimer = window.setTimeout(settle, 90);
      return;
    }

    settling = false;
    backAttempts = 0;
    releaseMenuLock();
    requestAnimationFrame(() => {
      closeMenuVisuals();
      releaseMenuLock();
    });
  }

  window.addEventListener("click", event => {
    if (settling) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const menu = document.getElementById("mainSideMenu");
    if (!menu?.classList.contains("is-open")) return;

    if (!target.closest("#mainMenuCloseBtn") && !target.closest("#mainMenuBackdrop")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    settling = true;
    backAttempts = 0;
    closeMenuVisuals();

    if (isMenuState()) {
      backAttempts = 1;
      history.back();
      settleTimer = window.setTimeout(settle, 90);
    } else {
      settle();
    }
  }, true);

  window.addEventListener("popstate", () => {
    if (!settling) return;
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 0);
  });
})();

/*
  hero-animation.js owns the mu position and theme colour. Browser/raw HTML
  keeps the 14px reference size; Android WebView gets a visual-size correction
  so the APK matches the web appearance after WebView page scaling.
*/
