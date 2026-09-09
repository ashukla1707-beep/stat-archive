/* Hero layout is now controlled directly by assets/js/hero-animation.js.
   This file intentionally remains inert so older cached HTML/service-worker
   references cannot introduce a second competing set of hero rules. */

/* =========================================================
   OFFLINE BUTTON — ENABLE IN WEB + PWA
   Older CSS intentionally hid .offline-btn in normal browser mode.
   Offline storage now uses IndexedDB in both browser and installed PWA,
   so make the per-entry save action visible everywhere it is supported.
   ========================================================= */
(() => {
  const style = document.createElement("style");
  style.id = "statArchiveOfflineWebPwaStyle";
  style.textContent = `
html .card-actions .offline-btn{
  display:flex !important;
}
`;
  document.head.appendChild(style);
})();
