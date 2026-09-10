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
   MANUAL CHOICE NAVIGATION RACE FIX

   The Manual chooser's older bubble handler hides the chooser before calling
   location.replace(). menu-alignment-fix.js watches child overlays and can
   interpret that hide as a Back action before the manual page navigation
   commits. Intercept the actual Reader/Contributor choice in capture phase,
   leave the chooser visible during navigation, and replace only the current
   child history entry. The Menu entry underneath remains intact for Back.
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V1__) return;
  window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V1__ = true;

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const choice = target?.closest?.("#manualChooserOverlay [data-manual-href]");
    if (!choice) return;

    const href = choice.getAttribute("data-manual-href");
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    /* Do not hide the chooser first. Keeping the child visibly open prevents
       the child-close synchronizer from issuing a competing history.back(). */
    window.location.replace(href);
  }, true);
})();
