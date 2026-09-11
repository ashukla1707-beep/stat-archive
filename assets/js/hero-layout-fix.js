/* Stat Archive — late card-action compatibility fixes. */
(() => {
  "use strict";

  const STYLE_ID = "statArchiveOfflineWebPwaFix";

  function install() {
    document.documentElement.classList.add("stat-archive-pwa");

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

/* =========================================================
   MEAN SYMBOL — exactly centred below the SVG x-axis
   ========================================================= */
(() => {
  "use strict";

  function installMeanSymbol() {
    const hero = document.querySelector(".hero-probability");
    const svg = hero?.querySelector(".probability-svg");
    const label = hero?.querySelector(".axis-mid");
    if (!hero || !svg || !label) return;

    hero.querySelector("#statArchiveMeanSymbol")?.remove();

    const heroRect = hero.getBoundingClientRect();
    const ctm = svg.getScreenCTM?.();
    let x = heroRect.width / 2;
    let y = heroRect.height - 16;

    if (ctm) {
      const point = svg.createSVGPoint();
      point.x = 260;
      point.y = 258;
      const screenPoint = point.matrixTransform(ctm);
      x = screenPoint.x - heroRect.left;
      y = screenPoint.y - heroRect.top;
    }

    const isLight = document.body?.dataset.theme === "light";
    label.textContent = "μ";
    label.style.setProperty("display", "block", "important");
    label.style.setProperty("position", "absolute", "important");
    label.style.setProperty("left", `${x}px`, "important");
    label.style.setProperty("top", `${y + 3}px`, "important");
    label.style.setProperty("bottom", "auto", "important");
    label.style.setProperty("transform", "translateX(-50%)", "important");
    label.style.setProperty("z-index", "8", "important");
    label.style.setProperty("width", "auto", "important");
    label.style.setProperty("height", "auto", "important");
    label.style.setProperty("font-family", "Arial, Helvetica, sans-serif", "important");
    label.style.setProperty("font-size", "14px", "important");
    label.style.setProperty("font-style", "normal", "important");
    label.style.setProperty("font-weight", "500", "important");
    label.style.setProperty("line-height", "1", "important");
    label.style.setProperty("letter-spacing", "0", "important");
    label.style.setProperty("color", isLight ? "#2f8f5b" : "#5ee7f7", "important");
    label.style.setProperty("opacity", "1", "important");
    label.style.setProperty("visibility", "visible", "important");
    label.style.setProperty("pointer-events", "none", "important");
  }

  function run() {
    installMeanSymbol();
    requestAnimationFrame(installMeanSymbol);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once:true });
  } else {
    run();
  }

  window.addEventListener("load", run, { once:true });
  window.addEventListener("pageshow", run);
  window.addEventListener("resize", run);
  document.addEventListener("statarchive:startup-ready", run);
  document.addEventListener("statarchive:theme-change", run);

  const themeObserver = new MutationObserver(run);
  function observeTheme() {
    if (document.body) themeObserver.observe(document.body, { attributes:true, attributeFilter:["data-theme"] });
  }
  if (document.body) observeTheme();
  else document.addEventListener("DOMContentLoaded", observeTheme, { once:true });
})();
