/* Stat Archive — Offline Library compatibility + light-theme action polish. */
(() => {
  "use strict";
  document.getElementById("saOfflineEntryFormatStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_ENTRY_FORMAT_LEGACY_DISABLED__ = true;

  const id = "saOfflineLightDeleteFix";
  if (!document.getElementById(id)) {
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
  }

  function removeUnwantedStartupCopy() {
    document.querySelectorAll(".curve-note.note-one").forEach(el => el.remove());
    document.getElementById("permissionHint")?.remove();
  }

  removeUnwantedStartupCopy();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeUnwantedStartupCopy, { once:true });
  }
  window.addEventListener("pageshow", removeUnwantedStartupCopy);
})();
