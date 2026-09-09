/* Stat Archive — legacy Offline Library entry-format compatibility shim.
   Offline Library presentation and entry formatting are now owned only by offline-library-hybrid.js. */
(() => {
  "use strict";
  document.getElementById("saOfflineEntryFormatStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_ENTRY_FORMAT_LEGACY_DISABLED__ = true;
})();
