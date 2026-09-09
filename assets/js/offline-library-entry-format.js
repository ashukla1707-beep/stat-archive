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

  function titleOf(record) {
    return String(record?.title || record?.filename || record?.name || "Untitled").trim() || "Untitled";
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
    const old = document.getElementById("saOfflineEntryFormatStyle");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "saOfflineEntryFormatStyle";
    style.textContent = `
/* Let the subtitle use the whole row. Only the title itself reserves room
   for the menu and close controls. */
#offlineLibraryOverlay .sa-offline-title-row > div:first-child{
  padding-right:0 !important;
  width:100% !important;
}
#offlineLibraryOverlay .sa-offline-title{
  box-sizing:border-box !important;
  padding-right:88px !important;
}
#offlineLibraryOverlay .sa-offline-subtitle{
  width:100% !important;
  max-width:none !important;
  padding-right:0 !important;
  margin-top:12px !important;
  font:500 12px/1.45 Inter,sans-serif !important;
  letter-spacing:0 !important;
}

/* Continue studying: compact horizontal cards with subject, real file title,
   then Type · Year. */
#offlineLibraryOverlay .sa-offline-shelf{
  gap:8px !important;
}
#offlineLibraryOverlay .sa-offline-shelf-card{
  flex:0 0 142px !important;
  min-height:118px !important;
  padding:10px !important;
  border-radius:14px !important;
  justify-content:flex-start !important;
}
#offlineLibraryOverlay .sa-offline-shelf-badge{
  display:none !important;
}
#offlineLibraryOverlay .sa-offline-shelf-title{
  margin:0 !important;
  font:800 10.8px/1.3 Inter,sans-serif !important;
  -webkit-line-clamp:2 !important;
}
#offlineLibraryOverlay .sa-offline-shelf-meta{
  margin-top:7px !important;
  color:#8290a3 !important;
  font:500 9.5px/1.32 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-shelf-file-title{
  display:-webkit-box !important;
  -webkit-box-orient:vertical !important;
  -webkit-line-clamp:2 !important;
  overflow:hidden !important;
  color:#d8e0e9 !important;
  font-weight:650 !important;
  line-height:1.3 !important;
}
#offlineLibraryOverlay .sa-offline-shelf-type-year{
  display:block !important;
  margin-top:5px !important;
  color:#8290a3 !important;
}

/* Expanded subject entries: actual file title, then Type · Year. */
#offlineLibraryOverlay .sa-offline-file-main{
  grid-template-columns:28px minmax(0,1fr) !important;
  gap:9px !important;
}
#offlineLibraryOverlay .sa-offline-file-title{
  font:800 11.5px/1.34 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-meta{
  margin-top:4px !important;
  font:500 10px/1.32 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-size{
  display:none !important;
}

body[data-theme="light"] #offlineLibraryOverlay .sa-offline-shelf-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-shelf-file-title{
  color:#454d49 !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-subtitle{
  color:#817d77 !important;
}

@media(max-width:700px){
  /* Match the menu-panel feel: inset from the screen with rounded corners,
     instead of making Offline Library edge-to-edge. */
  #offlineLibraryOverlay{
    padding:12px !important;
    align-items:center !important;
    justify-content:center !important;
    background:rgba(2,6,12,.52) !important;
    -webkit-backdrop-filter:blur(4px) !important;
    backdrop-filter:blur(4px) !important;
  }
  #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
    width:100% !important;
    height:calc(100dvh - 24px) !important;
    max-height:calc(100dvh - 24px) !important;
    border-radius:28px !important;
    border:1px solid rgba(148,163,184,.22) !important;
    box-shadow:0 26px 72px rgba(0,0,0,.42) !important;
    overflow:hidden !important;
  }

  #offlineLibraryOverlay .sa-offline-title{
    padding-right:78px !important;
  }
  #offlineLibraryOverlay .sa-offline-subtitle{
    margin-top:11px !important;
    font-size:11.5px !important;
    line-height:1.42 !important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-card{
    flex-basis:132px !important;
    min-height:112px !important;
    padding:9px !important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-title{
    font-size:10.3px !important;
    line-height:1.28 !important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-meta{
    margin-top:6px !important;
    font-size:9.2px !important;
  }
  #offlineLibraryOverlay .sa-offline-file-title{
    font-size:11px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function fillShelfMeta(meta, record) {
    if (!meta) return;
    meta.textContent = "";

    const fileTitle = document.createElement("span");
    fileTitle.className = "sa-offline-shelf-file-title";
    fileTitle.textContent = titleOf(record);

    const typeYear = document.createElement("span");
    typeYear.className = "sa-offline-shelf-type-year";
    typeYear.textContent = metaOf(record);

    meta.append(fileTitle, typeYear);
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

      /* Continue studying: Subject -> actual title -> Type · Year. */
      overlay.querySelectorAll(".sa-offline-shelf-card[data-sa-open-id]").forEach(card => {
        const record = map.get(String(card.dataset.saOpenId || ""));
        if (!record) return;

        const title = card.querySelector(".sa-offline-shelf-title");
        const meta = card.querySelector(".sa-offline-shelf-meta");
        const badge = card.querySelector(".sa-offline-shelf-badge");

        if (badge) badge.style.display = "none";
        if (title) title.textContent = subjectOf(record);
        fillShelfMeta(meta, record);
      });

      /* Subject already appears in the accordion heading, so each file shows its own title. */
      overlay.querySelectorAll(".sa-offline-file[data-offline-id]").forEach(card => {
        const record = map.get(String(card.dataset.offlineId || ""));
        if (!record) return;

        const title = card.querySelector(".sa-offline-file-title");
        const meta = card.querySelector(".sa-offline-file-meta");
        const size = card.querySelector(".sa-offline-file-size");

        if (title) title.textContent = titleOf(record);
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
