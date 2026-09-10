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

   The chooser itself is a Menu child. Older code tried to walk backward
   through Menu history before opening the standalone Manual. On normal web,
   other popstate/Menu restorers could win that race and leave the user back
   at Menu instead of navigating.

   Make the current chooser entry Home in-place, then navigate to Manual.
   This is synchronous, creates no popstate race, and produces the required
   Manual -> Back -> Home behavior.
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

    /* Do not hide the chooser before navigation. Keeping it visible prevents
       any legacy child-close observer from seeing a disappearing child during
       this transition. The standalone page navigation removes it naturally. */
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

   After returning from a standalone Manual page, older Menu history code can
   leave two adjacent Menu entries. A normal single history.back() therefore
   closes the panel, lands on another Menu entry and reopens it a moment later.

   Capture the close action at window level (before the document navigation
   handlers), close the visual panel immediately, then keep stepping Back only
   while the destination is still logically a Menu entry. Stop as soon as Home
   is reached. This preserves the normal one-level Home -> Menu -> Home flow and
   also cleans an already-existing duplicate Menu row without a second tap.
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
   MEAN SYMBOL — upright mu attached to the dotted line
   ========================================================= */
(() => {
  "use strict";

  function installMeanSymbol() {
    const svg = document.querySelector(".hero-probability .probability-svg");
    if (!svg) return;

    document.querySelector(".hero-probability .axis-mid")?.style.setProperty("display", "none", "important");

    let symbol = svg.querySelector("#statArchiveMeanSymbol");
    if (!symbol) {
      symbol = document.createElementNS("http://www.w3.org/2000/svg", "text");
      symbol.id = "statArchiveMeanSymbol";
      symbol.textContent = "μ";
      symbol.setAttribute("x", "260");
      symbol.setAttribute("y", "281");
      symbol.setAttribute("text-anchor", "middle");
      symbol.setAttribute("aria-hidden", "true");
      svg.appendChild(symbol);
    }

    const isLight = document.body?.dataset.theme === "light";
    symbol.setAttribute("fill", isLight ? "#4b365f" : "#5ee7f7");
    symbol.setAttribute("font-family", "Arial, Helvetica, sans-serif");
    symbol.setAttribute("font-size", "28");
    symbol.setAttribute("font-style", "normal");
    symbol.setAttribute("font-weight", "500");
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

  window.addEventListener("pageshow", run);
  document.addEventListener("statarchive:theme-change", run);

  const themeObserver = new MutationObserver(run);
  function observeTheme() {
    if (document.body) themeObserver.observe(document.body, { attributes:true, attributeFilter:["data-theme"] });
  }
  if (document.body) observeTheme();
  else document.addEventListener("DOMContentLoaded", observeTheme, { once:true });
})();
