/* Stat Archive — legacy Offline Library heading patch compatibility shim.
   The Offline Library header/search layout is now owned only by offline-library-hybrid.js. */
(() => {
  "use strict";
  document.getElementById("saOfflineStableShellOverrides")?.remove();
  document.getElementById("saOfflineHeadingSearchStyle")?.remove();
  document.getElementById("saOfflineHeadingSearchFixStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_HEADING_LEGACY_DISABLED__ = true;
})();
