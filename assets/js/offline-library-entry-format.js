/* Stat Archive — Offline Library compatibility + light-theme action polish. */
(() => {
  "use strict";
  document.getElementById("saOfflineEntryFormatStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_ENTRY_FORMAT_LEGACY_DISABLED__ = true;

  const id = "saOfflineLightDeleteFix";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-action.delete{
  color:#d94b5b!important;
  border-color:rgba(217,75,91,.30)!important;
  background:rgba(217,75,91,.065)!important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-utility-card button.danger{
  color:#d94b5b!important;
}
`;
  document.head.appendChild(style);
})();
