/* Stat Archive — Offline Library compact presentation v4 */
(() => {
  "use strict";

  const STUDY_VAULT_TEXT = "Your study vault. Saved files stay on this device and can be opened without internet.";
  let syncingEntries = false;
  let syncQueued = false;

  function formatSizeLocal(bytes) {
    try {
      if (typeof formatSize === "function") return formatSize(Number(bytes || 0));
    } catch (_) {}
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

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
    const old = document.getElementById("saOfflineHeadingSearchFixStyle");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "saOfflineHeadingSearchFixStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-head{
  position:relative!important;
  padding:26px 26px 12px!important;
}
#offlineLibraryOverlay .sa-offline-title-row{display:block!important;}
#offlineLibraryOverlay .sa-offline-title-row>div:first-child{
  min-width:0!important;
  padding-right:88px!important;
}
#offlineLibraryOverlay .sa-offline-title{
  margin:0!important;
  white-space:nowrap!important;
  font-family:'JetBrains Mono',monospace!important;
  font-size:clamp(30px,4.6vw,42px)!important;
  font-weight:700!important;
  line-height:1.05!important;
  letter-spacing:.008em!important;
  color:#f4f7fb!important;
}
#offlineLibraryOverlay .sa-offline-head-actions{
  position:absolute!important;
  top:21px!important;
  right:20px!important;
  z-index:4!important;
  display:flex!important;
  align-items:center!important;
  gap:1px!important;
  margin:0!important;
  padding:0!important;
}
#offlineLibraryOverlay .sa-offline-icon-btn{
  width:36px!important;
  height:36px!important;
  font-size:24px!important;
}
#offlineLibraryOverlay .sa-offline-subtitle{
  width:100%!important;
  max-width:650px!important;
  margin:15px 0 0!important;
  color:#8f9aae!important;
  font:500 13px/1.5 Inter,sans-serif!important;
  letter-spacing:0!important;
}
#offlineLibraryOverlay .sa-offline-tabs{display:none!important;}
#offlineLibraryOverlay .sa-offline-filterbar{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:9px!important;
  margin-top:18px!important;
  padding:0!important;
  border:0!important;
  background:transparent!important;
}
#offlineLibraryOverlay .sa-offline-search{
  width:100%!important;
  height:50px!important;
  display:grid!important;
  grid-template-columns:24px minmax(0,1fr)!important;
  align-items:center!important;
  gap:9px!important;
  padding:0 14px!important;
  border:1px solid rgba(148,163,184,.20)!important;
  border-radius:14px!important;
  background:rgba(255,255,255,.018)!important;
  color:#8f9aae!important;
  outline:0!important;
  box-shadow:none!important;
}
#offlineLibraryOverlay .sa-offline-search:focus,
#offlineLibraryOverlay .sa-offline-search:focus-within{
  outline:0!important;
  box-shadow:none!important;
}
#offlineLibraryOverlay .sa-offline-search span{
  width:22px!important;
  display:grid!important;
  place-items:center!important;
  color:#8f9aae!important;
  font-size:18px!important;
  line-height:1!important;
}
#offlineLibraryOverlay #offlineSearchInput,
#offlineLibraryOverlay #offlineSearchInput:hover,
#offlineLibraryOverlay #offlineSearchInput:focus,
#offlineLibraryOverlay #offlineSearchInput:focus-visible,
#offlineLibraryOverlay #offlineSearchInput:active{
  width:100%!important;
  min-width:0!important;
  height:100%!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  outline:0!important;
  box-shadow:none!important;
  background:transparent!important;
  color:#f4f7fb!important;
  font:500 13.5px/1.2 Inter,sans-serif!important;
  appearance:none!important;
  -webkit-appearance:none!important;
}
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-decoration,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-cancel-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-decoration{
  -webkit-appearance:none!important;
}
#offlineLibraryOverlay #offlineSearchInput::placeholder{
  color:#68768a!important;
  opacity:1!important;
}
#offlineLibraryOverlay #offlineSubjectSelect{
  width:100%!important;
  height:50px!important;
  margin:0!important;
  padding:0 40px 0 14px!important;
  border:1px solid rgba(148,163,184,.20)!important;
  border-radius:14px!important;
  background:#0e1620!important;
  color:#edf3f8!important;
  font:600 13.5px/1 Inter,sans-serif!important;
}
#offlineLibraryOverlay #saOfflineContinueLabel{display:none!important;}

/* Compact section headings. */
#offlineLibraryOverlay .sa-offline-section-head{margin-bottom:9px!important;}
#offlineLibraryOverlay .sa-offline-section-head strong{
  font:800 13px/1.3 Inter,sans-serif!important;
}
#offlineLibraryOverlay .sa-offline-section-head span{
  font:500 10.5px/1.3 Inter,sans-serif!important;
}

/* Continue Studying cards: subject -> type/year -> size. */
#offlineLibraryOverlay .sa-offline-shelf-card{
  flex:0 0 150px!important;
  min-height:150px!important;
  padding:12px!important;
  border-radius:16px!important;
  justify-content:flex-start!important;
}
#offlineLibraryOverlay .sa-offline-shelf-badge{display:none!important;}
#offlineLibraryOverlay .sa-offline-shelf-title{
  margin:0!important;
  color:#f4f7fb!important;
  font:800 12px/1.35 Inter,sans-serif!important;
  -webkit-line-clamp:3!important;
}
#offlineLibraryOverlay .sa-offline-shelf-meta{
  margin-top:10px!important;
  color:#8290a3!important;
  font:500 10.5px/1.45 Inter,sans-serif!important;
}
#offlineLibraryOverlay .sa-entry-size{
  display:block;
  margin-top:5px;
  color:#8d99aa;
  font-weight:600;
}

/* Subject-group headers and file entries are intentionally smaller. */
#offlineLibraryOverlay .sa-offline-group-head .name{
  font:800 12.5px/1.32 Inter,sans-serif!important;
}
#offlineLibraryOverlay .sa-offline-file-title{
  color:#f4f7fb!important;
  font:800 11.8px/1.35 Inter,sans-serif!important;
  overflow-wrap:anywhere!important;
}
#offlineLibraryOverlay .sa-offline-file-meta{
  margin-top:4px!important;
  color:#7e8b9e!important;
  font:500 10.3px/1.35 Inter,sans-serif!important;
}
#offlineLibraryOverlay .sa-offline-file-size{
  color:#8a96a8!important;
  font:600 10.3px/1.2 Inter,sans-serif!important;
}

body[data-theme="light"] #offlineLibraryOverlay .sa-offline-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-shelf-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title{
  color:#27302d!important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-subtitle{
  color:#817d77!important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-search{
  background:rgba(255,255,255,.72)!important;
  border-color:rgba(75,54,95,.14)!important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSearchInput{
  color:#27302d!important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSearchInput::placeholder{
  color:#8a8580!important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSubjectSelect{
  background:#fff!important;
  color:#27302d!important;
  border-color:rgba(75,54,95,.16)!important;
}

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-head{padding:22px 18px 10px!important;}
  #offlineLibraryOverlay .sa-offline-title-row>div:first-child{padding-right:76px!important;}
  #offlineLibraryOverlay .sa-offline-title{
    font-size:clamp(24px,7vw,30px)!important;
    line-height:1.05!important;
  }
  #offlineLibraryOverlay .sa-offline-head-actions{
    top:17px!important;
    right:12px!important;
  }
  #offlineLibraryOverlay .sa-offline-icon-btn{
    width:33px!important;
    height:33px!important;
    font-size:22px!important;
  }
  #offlineLibraryOverlay .sa-offline-subtitle{
    margin-top:14px!important;
    font-size:12.5px!important;
    line-height:1.48!important;
  }
  #offlineLibraryOverlay .sa-offline-filterbar{margin-top:16px!important;}
  #offlineLibraryOverlay .sa-offline-search,
  #offlineLibraryOverlay #offlineSubjectSelect{
    height:48px!important;
    border-radius:13px!important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-card{
    flex-basis:142px!important;
    min-height:142px!important;
  }
  #offlineLibraryOverlay .sa-offline-section-head strong{font-size:12.5px!important;}
  #offlineLibraryOverlay .sa-offline-group-head .name{font-size:12px!important;}
  #offlineLibraryOverlay .sa-offline-file-title{font-size:11.5px!important;}
}
`;
    document.head.appendChild(style);
  }

  async function rewriteShelfCard(card) {
    const id = card?.dataset?.saOpenId;
    if (!id || typeof getOfflineFile !== "function") return;
    try {
      const record = await getOfflineFile(id);
      if (!record || !card.isConnected) return;
      const title = card.querySelector(".sa-offline-shelf-title");
      const meta = card.querySelector(".sa-offline-shelf-meta");
      if (title) title.textContent = subjectOf(record);
      if (meta) {
        meta.innerHTML = "";
        const line = document.createElement("span");
        line.textContent = metaOf(record);
        const size = document.createElement("span");
        size.className = "sa-entry-size";
        size.textContent = formatSizeLocal(record?.blob?.size || record?.size || 0);
        meta.append(line, size);
      }
    } catch (_) {}
  }

  async function rewriteFileCard(card) {
    const id = card?.dataset?.offlineId;
    if (!id || typeof getOfflineFile !== "function") return;
    try {
      const record = await getOfflineFile(id);
      if (!record || !card.isConnected) return;
      const title = card.querySelector(".sa-offline-file-title");
      const meta = card.querySelector(".sa-offline-file-meta");
      const size = card.querySelector(".sa-offline-file-size");
      if (title) title.textContent = subjectOf(record);
      if (meta) meta.textContent = metaOf(record);
      if (size) size.textContent = formatSizeLocal(record?.blob?.size || record?.size || 0);
    } catch (_) {}
  }

  async function syncEntryContent() {
    if (syncingEntries) return;
    syncingEntries = true;
    try {
      const shelfCards = [...document.querySelectorAll("#offlineLibraryOverlay .sa-offline-shelf-card[data-sa-open-id]")];
      const fileCards = [...document.querySelectorAll("#offlineLibraryOverlay .sa-offline-file[data-offline-id]")];
      await Promise.all([
        ...shelfCards.map(rewriteShelfCard),
        ...fileCards.map(rewriteFileCard)
      ]);
    } finally {
      syncingEntries = false;
    }
  }

  function syncShell() {
    const summary = document.getElementById("saOfflineSummary");
    if (summary) summary.textContent = STUDY_VAULT_TEXT;

    const input = document.getElementById("offlineSearchInput");
    if (input) {
      input.placeholder = "Search saved files, subjects, year...";
      input.setAttribute("aria-label", "Search saved files, subjects, year");
      input.style.boxShadow = "none";
      input.style.outline = "none";
    }

    const recentLabel = document.getElementById("saOfflineContinueLabel");
    if (recentLabel) recentLabel.textContent = "";

    const allTab = document.querySelector('#saOfflineTypeTabs [data-sa-offline-type="All"]');
    if (allTab && !allTab.classList.contains("active")) allTab.click();

    if (!syncQueued) {
      syncQueued = true;
      requestAnimationFrame(() => {
        syncQueued = false;
        syncEntryContent();
      });
    }
  }

  function installObserver() {
    syncShell();
    if (document.documentElement.dataset.saOfflinePresentationV4 === "1") return;
    document.documentElement.dataset.saOfflinePresentationV4 = "1";
    const observer = new MutationObserver(syncShell);
    observer.observe(document.body || document.documentElement, {
      childList:true,
      subtree:true
    });
  }

  function install() {
    installStyle();
    installObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();