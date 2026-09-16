/* Stat Archive — legacy Download compatibility shim.
   Progress UI is owned exclusively by download-progress-canonical.js.
   This file intentionally creates no floating/lower progress panel. */
(() => {
  "use strict";

  if (window.__statArchiveDownloadOfflineRepairV6) return;
  window.__statArchiveDownloadOfflineRepairV6 = true;

  /* Remove a legacy panel if an older cached runtime created one before this
     compatibility shim loaded. */
  document.getElementById("statDownloadProgressPanel")?.remove();
  document.getElementById("statDownloadProgressPanelStyle")?.remove();

  /* Do not register another click handler here. The canonical runtime owns
     Download transfer, percentage updates, and the single inline card bar. */
})();
