/* Stat Archive — Offline Library entry format
   Stable, event-driven card formatting. No MutationObserver. */
(() => {
  "use strict";

  let refreshTimer = 0;
  let refreshing = false;
  let openWrapped = false;
  let renderWrapped = false;

  function subjectOf(record) {
    return String(record?.subjectName || record?.subject || "Other").trim() || "Other";
  }

  function typeOf(record) {
    return String(record?.type || "File").trim() || "File";
  }

  function yearOf(record) {
    const direct = String(record?.year || "").trim();
    if (direct) return direct;

    const source = [record?.title, record?.filename, record?.name]
      .filter(Boolean)
      .join(" ");
    const match = source.match(/\b(?:19|20)\d{2}\b/);
    return match ? match[0] : "";
  }

  function metaOf(record) {
    const type = typeOf(record);
    const year = yearOf(record);
    return year ? `${type} · ${year}` : type;
  }

  function installStyle() {
    if (document.getElementById("saOfflineEntryFormatStyle")) return;

    const style = document.createElement("style");
    style.id = "saOfflineEntryFormatStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-shelf-card{
  flex:0 0 148px !important;
  min-height:138px !important;
  padding:12px !important;
  justify-content:flex-start !important;
}
#offlineLibraryOverlay .sa-offline-shelf-badge{
  display:none !important;
}
#offlineLibraryOverlay .sa-offline-shelf-title{
  margin:0 !important;
  font:800 11.8px/1.35 Inter,sans-serif !important;
  -webkit-line-clamp:3 !important;
}
#offlineLibraryOverlay .sa-offline-shelf-meta{
  margin-top:10px !important;
  color:#8290a3 !important;
  font:500 10.3px/1.4 Inter,sans-serif !important;
}

#offlineLibraryOverlay .sa-offline-file-main{
  grid-template-columns:28px minmax(0,1fr) !important;
  gap:9px !important;
}
#offlineLibraryOverlay .sa-offline-file-title{
  font:800 11.8px/1.35 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-meta{
  margin-top:4px !important;
  font:500 10.3px/1.35 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-size{
  display:none !important;
}

body[data-theme="light"] #offlineLibraryOverlay .sa-offline-shelf-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title{
  color:#27302d !important;
}

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-shelf-card{
    flex-basis:140px !important;
    min-height:132px !important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-title,
  #offlineLibraryOverlay .sa-offline-file-title{
    font-size:11.3px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  async function refreshEntryCards() {
    if (refreshing) return;
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay || overlay.style.display === "none") return;
    if (typeof getOfflineFiles !== "function") return;

    refreshing = true;
    try {
      const records = await getOfflineFiles();
      const map = new Map((records || []).map(record => [String(record.id), record]));

      overlay.querySelectorAll(".sa-offline-shelf-card[data-sa-open-id]").forEach(card => {
        const record = map.get(String(card.dataset.saOpenId || ""));
        if (!record) return;

        const title = card.querySelector(".sa-offline-shelf-title");
        const meta = card.querySelector(".sa-offline-shelf-meta");
        const badge = card.querySelector(".sa-offline-shelf-badge");

        if (badge) badge.style.display = "none";
        if (title) title.textContent = subjectOf(record);
        if (meta) meta.textContent = metaOf(record);
      });

      overlay.querySelectorAll(".sa-offline-file[data-offline-id]").forEach(card => {
        const record = map.get(String(card.dataset.offlineId || ""));
        if (!record) return;

        const title = card.querySelector(".sa-offline-file-title");
        const meta = card.querySelector(".sa-offline-file-meta");
        const size = card.querySelector(".sa-offline-file-size");

        if (title) title.textContent = subjectOf(record);
        if (meta) meta.textContent = metaOf(record);
        if (size) size.style.display = "none";
      });
    } catch (_) {
      /* Presentation failure must never block the Offline Library. */
    } finally {
      refreshing = false;
    }
  }

  function scheduleRefresh(delay = 0) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      requestAnimationFrame(() => void refreshEntryCards());
    }, delay);
  }

  function wrapFunctions() {
    if (!openWrapped && typeof window.openOfflineLibrary === "function") {
      const originalOpen = window.openOfflineLibrary;
      if (!originalOpen.__saEntryFormatWrapped) {
        const wrappedOpen = function(...args) {
          const result = originalOpen.apply(this, args);
          scheduleRefresh(60);
          scheduleRefresh(220);
          return result;
        };
        wrappedOpen.__saEntryFormatWrapped = true;
        window.openOfflineLibrary = wrappedOpen;
        try { openOfflineLibrary = wrappedOpen; } catch (_) {}
      }
      openWrapped = true;
    }

    if (!renderWrapped && typeof window.renderOfflineLibrary === "function") {
      const originalRender = window.renderOfflineLibrary;
      if (!originalRender.__saEntryFormatWrapped) {
        const wrappedRender = function(...args) {
          const result = originalRender.apply(this, args);
          Promise.resolve(result).finally(() => scheduleRefresh(0));
          return result;
        };
        wrappedRender.__saEntryFormatWrapped = true;
        window.renderOfflineLibrary = wrappedRender;
        try { renderOfflineLibrary = wrappedRender; } catch (_) {}
      }
      renderWrapped = true;
    }
  }

  function bindEvents() {
    document.addEventListener("input", event => {
      if (event.target?.id === "offlineSearchInput") scheduleRefresh(45);
    }, true);

    document.addEventListener("change", event => {
      if (event.target?.id === "offlineSubjectSelect") scheduleRefresh(45);
    }, true);

    document.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest("#offlineLibraryOverlay [data-sa-toggle-subject], #offlineLibraryOverlay [data-sa-pin-id], #offlineLibraryOverlay [data-sa-delete-id], #offlineLibraryOverlay [data-sa-open-id]")) {
        scheduleRefresh(80);
        scheduleRefresh(240);
      }
    }, true);
  }

  function install() {
    installStyle();
    bindEvents();
    wrapFunctions();

    /* Hybrid UI may attach a moment after this script. Poll briefly, then stop. */
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      wrapFunctions();
      if ((openWrapped && renderWrapped) || tries >= 20) window.clearInterval(timer);
    }, 100);

    scheduleRefresh(120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
