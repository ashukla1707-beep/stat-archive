/* Stat Archive — Offline Library stable loader v4
   No MutationObserver. Keeps only the search copy and formatter loader. */
(() => {
  "use strict";

  function syncSearchCopy() {
    const input = document.getElementById("offlineSearchInput");
    if (!input) return false;
    input.placeholder = "Search saved files, subjects, year...";
    input.setAttribute("aria-label", "Search saved files, subjects, year");
    return true;
  }

  function loadStableFormatter() {
    if (document.querySelector('script[data-sa-offline-entry-format="1"]')) return;
    const script = document.createElement("script");
    script.src = "./assets/js/offline-library-entry-format.js?v=20260909-4";
    script.async = false;
    script.dataset.saOfflineEntryFormat = "1";
    document.body.appendChild(script);
  }

  function install() {
    loadStableFormatter();
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (syncSearchCopy() || tries >= 30) window.clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
