/* Stat Archive — Offline Library canonical v13
   Single owner for Offline Library layout, rendering and interactions.
   Subject groups show one entry at a time; pinned entries sort first. */
(() => {
  "use strict";

  const RECENT_KEY = "statArchiveOfflineRecentlyOpened";
  const CANONICAL_VERSION = "13";
  const LEGACY_STYLE_IDS = [
    "saOfflineEntryFormatStyle",
    "saOfflineStableShellOverrides",
    "saOfflineHeadingSearchStyle",
    "saOfflineHeadingSearchFixStyle"
  ];

  const state = {
    subject: "All",
    query: "",
    openSubject: ""
  };

  let expandFirstOnOpen = true;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[ch]);

  function fmt(bytes) {
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

  function titleOf(record) {
    return String(record?.title || record?.filename || record?.name || "Untitled").trim() || "Untitled";
  }

  function typeOf(record) {
    return String(record?.type || "File").trim() || "File";
  }

  function yearOf(record) {
    const direct = String(record?.year || "").trim();
    if (/^(?:19|20)\d{2}$/.test(direct)) return direct;
    const source = [record?.title, record?.filename, record?.name].filter(Boolean).join(" ");
    const match = source.match(/\b(?:19|20)\d{2}\b/);
    return match ? match[0] : "";
  }

  function normalized(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[–—]/g, "-")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function displayTitleOf(record) {
    let title = titleOf(record);
    const subject = subjectOf(record);
    const type = typeOf(record);

    if (subject) {
      const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      title = title.replace(new RegExp(`^${escaped}\\s*(?:[-–—:|]\\s*)?`, "i"), "").trim();
    }

    title = title.replace(/\s*[:\-–—]?\s*(?:19|20)\d{2}\s*$/i, "").trim();
    if (!title || normalized(title) === normalized(type)) return "";
    return title;
  }

  function isPinned(record) {
    try {
      if (typeof offlinePinned === "function") return !!offlinePinned(record);
    } catch (_) {}
    return record?.pinned === true;
  }

  function readRecent() {
    try {
      const value = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) {
      return {};
    }
  }

  function writeRecent(map) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(map || {})); } catch (_) {}
  }

  function markRecent(id) {
    const map = readRecent();
    map[String(id)] = Date.now();
    writeRecent(Object.fromEntries(
      Object.entries(map)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 30)
    ));
  }

  function cleanRecent(records) {
    const ids = new Set((records || []).map(record => String(record.id)));
    const map = readRecent();
    let changed = false;
    Object.keys(map).forEach(id => {
      if (!ids.has(id)) {
        delete map[id];
        changed = true;
      }
    });
    if (changed) writeRecent(map);
  }

  function removeLegacyPresentation() {
    LEGACY_STYLE_IDS.forEach(id => document.getElementById(id)?.remove());
  }

  function ensureStyle() {
    removeLegacyPresentation();

    const existing = document.getElementById("saOfflineHybridStyle");
    if (existing?.dataset?.canonicalVersion === CANONICAL_VERSION) return;
    existing?.remove();

    const style = document.createElement("style");
    style.id = "saOfflineHybridStyle";
    style.dataset.canonicalVersion = CANONICAL_VERSION;
    style.textContent = `
#offlineLibraryOverlay{
  padding:12px !important;
  align-items:center !important;
  justify-content:center !important;
  background:rgba(2,6,12,.54) !important;
  -webkit-backdrop-filter:blur(4px) !important;
  backdrop-filter:blur(4px) !important;
}
#offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
  width:min(860px,100%) !important;
  max-width:860px !important;
  height:min(92dvh,900px) !important;
  max-height:92dvh !important;
  padding:0 !important;
  overflow:hidden !important;
  border-radius:28px !important;
  border:1px solid rgba(148,163,184,.22) !important;
  background:linear-gradient(180deg,#111a26,#0b1119) !important;
  box-shadow:0 30px 90px rgba(0,0,0,.5) !important;
  color:#f4f7fb !important;
}
#offlineLibraryOverlay .sa-offline-shell{
  height:100%;
  display:flex;
  flex-direction:column;
  min-height:0;
}
#offlineLibraryOverlay .sa-offline-head{
  padding:22px 24px 8px;
  flex:0 0 auto;
}

/* Header owns two areas only: title | compact actions. */
#offlineLibraryOverlay .sa-offline-title-row{
  display:grid !important;
  grid-template-columns:minmax(0,1fr) auto !important;
  align-items:center !important;
  gap:12px !important;
  width:100% !important;
  min-width:0 !important;
  min-height:40px !important;
  position:static !important;
}
#offlineLibraryOverlay .sa-offline-title-wrap{
  min-width:0 !important;
  width:100% !important;
  padding:0 !important;
  margin:0 !important;
  overflow:hidden !important;
}
#offlineLibraryOverlay .sa-offline-title{
  display:block !important;
  width:100% !important;
  max-width:100% !important;
  margin:0 !important;
  padding:0 !important;
  font:700 clamp(31px,5vw,46px)/1.05 'JetBrains Mono',monospace !important;
  letter-spacing:.01em !important;
  color:#f4f7fb !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:clip !important;
  transform:none !important;
}
#offlineLibraryOverlay .sa-offline-head-actions{
  position:static !important;
  inset:auto !important;
  display:grid !important;
  grid-auto-flow:column !important;
  grid-auto-columns:36px !important;
  align-items:center !important;
  justify-content:end !important;
  gap:4px !important;
  width:auto !important;
  height:36px !important;
  margin:0 !important;
  padding:0 !important;
  pointer-events:auto !important;
}
#offlineLibraryOverlay .sa-offline-icon-btn,
#offlineLibraryOverlay #saOfflineMenuBtn,
#offlineLibraryOverlay #closeOfflineLibraryBtn{
  position:static !important;
  inset:auto !important;
  width:36px !important;
  min-width:36px !important;
  height:36px !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  border-radius:50% !important;
  background:transparent !important;
  color:#8f9aae !important;
  font:500 22px/1 Inter,sans-serif !important;
  display:grid !important;
  place-items:center !important;
  transform:none !important;
  opacity:1 !important;
  visibility:visible !important;
  pointer-events:auto !important;
  cursor:pointer !important;
}
#offlineLibraryOverlay .sa-offline-icon-btn:hover{
  background:rgba(255,255,255,.045) !important;
  color:#eef4fa !important;
}
#offlineLibraryOverlay .sa-offline-subtitle,
#offlineLibraryOverlay .sa-offline-tabs,
#offlineLibraryOverlay #saOfflineContinueLabel{
  display:none !important;
}

/* Filters */
#offlineLibraryOverlay .sa-offline-filterbar{
  display:grid !important;
  grid-template-columns:1fr !important;
  gap:7px !important;
  margin-top:8px !important;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
}
#offlineLibraryOverlay .sa-offline-search{
  height:45px !important;
  display:grid !important;
  grid-template-columns:21px minmax(0,1fr) !important;
  align-items:center !important;
  column-gap:7px !important;
  min-width:0 !important;
  padding:0 13px !important;
  border:1px solid rgba(148,163,184,.20) !important;
  border-radius:13px !important;
  background:rgba(255,255,255,.018) !important;
  color:#7f8da2 !important;
  outline:0 !important;
  box-shadow:none !important;
}
#offlineLibraryOverlay .sa-offline-search > span{
  width:21px !important;
  min-width:21px !important;
  display:grid !important;
  place-items:center !important;
  font-size:17px !important;
  line-height:1 !important;
}
#offlineLibraryOverlay #offlineSearchInput,
#offlineLibraryOverlay #offlineSearchInput:hover,
#offlineLibraryOverlay #offlineSearchInput:focus,
#offlineLibraryOverlay #offlineSearchInput:focus-visible,
#offlineLibraryOverlay #offlineSearchInput:active{
  width:100% !important;
  min-width:0 !important;
  height:100% !important;
  margin:0 !important;
  padding:0 !important;
  text-indent:0 !important;
  border:0 !important;
  border-radius:0 !important;
  outline:0 !important;
  box-shadow:none !important;
  background:transparent !important;
  color:#f4f7fb !important;
  font:500 13.5px/1.2 Inter,sans-serif !important;
  appearance:none !important;
  -webkit-appearance:none !important;
}
#offlineLibraryOverlay #offlineSearchInput::placeholder{
  color:#677589 !important;
}
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-decoration,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-cancel-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-decoration{
  -webkit-appearance:none !important;
}
#offlineLibraryOverlay #offlineSubjectSelect{
  width:100% !important;
  height:45px !important;
  min-width:0 !important;
  border:1px solid rgba(148,163,184,.20) !important;
  outline:0 !important;
  color:#edf3f8 !important;
  border-radius:13px !important;
  padding:0 42px 0 14px !important;
  font:600 12px Inter,sans-serif !important;
  -webkit-appearance:none !important;
  appearance:none !important;
  background-color:#0e1620 !important;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238f9aae' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
  background-repeat:no-repeat !important;
  background-position:right 16px center !important;
  background-size:14px 14px !important;
}

#offlineLibraryOverlay .sa-offline-scroll{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:0 24px 28px;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
}
#offlineLibraryOverlay .sa-offline-section{
  margin-top:15px !important;
}
#offlineLibraryOverlay .sa-offline-section-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
#offlineLibraryOverlay .sa-offline-section-head strong{
  font:800 14px Inter,sans-serif;
  color:#f4f7fb;
}

/* Continue studying */
#offlineLibraryOverlay .sa-offline-shelf{
  display:flex;
  gap:8px;
  align-items:flex-start;
  overflow-x:auto;
  scrollbar-width:none;
  padding-bottom:3px;
}
#offlineLibraryOverlay .sa-offline-shelf::-webkit-scrollbar{
  display:none;
}
#offlineLibraryOverlay .sa-offline-shelf-card{
  flex:0 0 134px !important;
  width:134px !important;
  min-height:92px !important;
  border:1px solid rgba(148,163,184,.18) !important;
  border-radius:15px !important;
  padding:9px 10px !important;
  background:radial-gradient(circle at 86% 8%,rgba(94,231,247,.12),transparent 38%),linear-gradient(145deg,#172330,#111923) !important;
  display:flex !important;
  flex-direction:column !important;
  justify-content:flex-start !important;
  text-align:left !important;
  color:#f4f7fb !important;
  overflow:hidden !important;
  cursor:pointer !important;
}
#offlineLibraryOverlay .sa-recent-subject{
  display:-webkit-box;
  -webkit-box-orient:vertical;
  -webkit-line-clamp:2;
  overflow:hidden;
  color:#f4f7fb;
  font:800 10.4px/1.22 Inter,sans-serif;
}
#offlineLibraryOverlay .sa-recent-type{
  margin-top:5px;
  color:#8d99aa;
  font:600 9.1px/1.18 Inter,sans-serif;
}
#offlineLibraryOverlay .sa-recent-title{
  display:-webkit-box;
  -webkit-box-orient:vertical;
  -webkit-line-clamp:2;
  overflow:hidden;
  margin-top:3px;
  color:#d6dee8;
  font:650 9px/1.2 Inter,sans-serif;
}
#offlineLibraryOverlay .sa-recent-title.is-empty{
  display:none !important;
}
#offlineLibraryOverlay .sa-recent-year{
  margin-top:4px;
  color:#7f8da1;
  font:600 8.9px/1.15 'JetBrains Mono',monospace;
}
#offlineLibraryOverlay .sa-recent-year:empty{
  display:none !important;
}

/* Subject accordion. The open body's height is set in JS to exactly one card. */
#offlineLibraryOverlay .sa-offline-accordions{
  display:grid;
  gap:9px;
}
#offlineLibraryOverlay .sa-offline-group{
  border:1px solid rgba(148,163,184,.17);
  border-radius:16px;
  background:rgba(255,255,255,.012);
  overflow:hidden;
}
#offlineLibraryOverlay .sa-offline-group-head{
  width:100%;
  border:0;
  background:transparent;
  color:#f4f7fb;
  display:grid;
  grid-template-columns:14px minmax(0,1fr) auto;
  gap:7px;
  align-items:center;
  text-align:left;
  padding:14px 15px;
  cursor:pointer;
}
#offlineLibraryOverlay .sa-offline-group-head .chev{
  font-size:12px;
  color:#c9d2dc;
}
#offlineLibraryOverlay .sa-offline-group-head .name{
  font:800 13px/1.35 Inter,sans-serif;
  min-width:0;
}
#offlineLibraryOverlay .sa-offline-group-head .count{
  color:#8f9aae;
  font:800 12px 'JetBrains Mono',monospace;
}
#offlineLibraryOverlay .sa-offline-group-body{
  display:none;
  border-top:1px solid rgba(148,163,184,.14);
  padding:9px;
}
#offlineLibraryOverlay .sa-offline-group.open .sa-offline-group-body{
  display:block;
  overflow-y:auto;
  overflow-x:hidden;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:thin;
  scroll-snap-type:y proximity;
}
#offlineLibraryOverlay .sa-offline-file{
  border:1px solid rgba(148,163,184,.15);
  border-radius:14px;
  background:rgba(255,255,255,.016);
  padding:12px;
  scroll-snap-align:start;
}
#offlineLibraryOverlay .sa-offline-file + .sa-offline-file{
  margin-top:8px;
}
#offlineLibraryOverlay .sa-offline-file-main{
  display:grid;
  grid-template-columns:28px minmax(0,1fr);
  gap:9px;
  align-items:center;
}
#offlineLibraryOverlay .sa-offline-pin{
  width:28px;
  height:28px;
  border:0;
  background:transparent;
  color:#7d899b;
  font-size:19px;
  line-height:1;
  padding:0;
  cursor:pointer;
  display:grid;
  place-items:center;
}
#offlineLibraryOverlay .sa-offline-pin.is-pinned{
  color:#f6bd4c;
}
#offlineLibraryOverlay .sa-offline-file-title{
  font:800 11.5px/1.34 Inter,sans-serif;
  color:#f4f7fb;
  overflow-wrap:anywhere;
}
#offlineLibraryOverlay .sa-offline-file-title:empty{
  display:none !important;
}
#offlineLibraryOverlay .sa-offline-file-meta{
  margin-top:4px;
  color:#7e8b9e;
  font:500 10px/1.32 Inter,sans-serif;
}
#offlineLibraryOverlay .sa-offline-file-title:empty + .sa-offline-file-meta{
  margin-top:0;
}
#offlineLibraryOverlay .sa-offline-file-actions{
  display:grid;
  grid-template-columns:1.05fr 1fr .9fr;
  gap:7px;
  margin-top:11px;
}
#offlineLibraryOverlay .sa-offline-action{
  border:1px solid rgba(148,163,184,.20);
  background:#0f1822;
  color:#e8eef4;
  border-radius:10px;
  padding:9px 7px;
  font:800 10.5px Inter,sans-serif;
  cursor:pointer;
}
#offlineLibraryOverlay .sa-offline-action.open{
  color:#5ee7f7;
  border-color:rgba(94,231,247,.27);
  background:rgba(94,231,247,.08);
}
#offlineLibraryOverlay .sa-offline-action.delete{
  color:#ff8a96;
  border-color:rgba(255,138,150,.22);
  background:rgba(255,138,150,.055);
}
#offlineLibraryOverlay .sa-offline-empty{
  padding:26px 16px;
  text-align:center;
  border:1px dashed rgba(148,163,184,.19);
  border-radius:14px;
  color:#7e8b9e;
  font:500 12px/1.6 Inter,sans-serif;
}

/* Three-dot menu: only summary, Clear and Cancel. */
#offlineLibraryOverlay .sa-offline-utility{
  position:fixed;
  inset:0;
  z-index:12050;
  display:none;
  align-items:flex-end;
  background:rgba(0,0,0,.58);
  padding:0 12px max(10px,env(safe-area-inset-bottom));
}
#offlineLibraryOverlay .sa-offline-utility.show{
  display:flex;
}
#offlineLibraryOverlay .sa-offline-utility-card{
  width:min(520px,100%);
  margin:0 auto;
  border:1px solid rgba(148,163,184,.22);
  border-radius:22px;
  background:#131d29;
  padding:14px;
  box-shadow:0 25px 70px rgba(0,0,0,.5);
}
#offlineLibraryOverlay .sa-offline-utility-info{
  padding:9px 10px 13px;
  color:#8f9aae;
  font:500 11.5px/1.5 Inter,sans-serif;
}
#offlineLibraryOverlay .sa-offline-utility-card button{
  width:100%;
  border:0;
  background:transparent;
  color:#eef4fa;
  text-align:left;
  padding:12px;
  border-radius:10px;
  font:700 12px Inter,sans-serif;
  cursor:pointer;
}
#offlineLibraryOverlay .sa-offline-utility-card button:hover{
  background:rgba(255,255,255,.045);
}
#offlineLibraryOverlay .sa-offline-utility-card button.danger{
  color:#ff8a96;
}
#offlineLibraryOverlay .sa-offline-hidden-legacy{
  display:none !important;
}

/* Light theme */
body[data-theme="light"] #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
  background:linear-gradient(180deg,#fbfaf7,#f5f1e9) !important;
  color:#27302d !important;
  border-color:rgba(75,54,95,.15) !important;
  box-shadow:0 28px 70px rgba(58,53,42,.22) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-section-head strong,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-group-head,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title,
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-subject{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-search,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-group,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file{
  background:rgba(255,255,255,.58) !important;
  border-color:rgba(75,54,95,.13) !important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSubjectSelect{
  background-color:#fff !important;
  color:#27302d !important;
  border-color:rgba(75,54,95,.16) !important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSearchInput{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-title{
  color:#4b514e !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-type,
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-year{
  color:#817d77 !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-shelf-card{
  background:radial-gradient(circle at 86% 8%,rgba(75,54,95,.09),transparent 38%),linear-gradient(145deg,#fff,#f2eee6) !important;
  color:#27302d !important;
  border-color:rgba(75,54,95,.14) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-action{
  background:#fff !important;
  color:#27302d !important;
  border-color:rgba(75,54,95,.15) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-action.open{
  color:#347d73 !important;
  background:rgba(52,125,115,.07) !important;
  border-color:rgba(52,125,115,.18) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-utility-card{
  background:#fbfaf7 !important;
  border-color:rgba(75,54,95,.15) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-utility-card button{
  color:#27302d !important;
}

@media(max-width:700px){
  #offlineLibraryOverlay{
    padding:12px !important;
    align-items:center !important;
  }
  #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
    width:100% !important;
    height:calc(100dvh - 24px) !important;
    max-height:calc(100dvh - 24px) !important;
    border-radius:22px !important;
  }
  #offlineLibraryOverlay .sa-offline-head{
    padding:18px 14px 8px !important;
  }
  #offlineLibraryOverlay .sa-offline-title-row{
    gap:8px !important;
    min-height:36px !important;
  }
  #offlineLibraryOverlay .sa-offline-title{
    font-size:clamp(20px,6.3vw,30px) !important;
    line-height:1.05 !important;
    letter-spacing:-.7px !important;
  }
  #offlineLibraryOverlay .sa-offline-head-actions{
    grid-auto-columns:34px !important;
    height:34px !important;
    gap:3px !important;
  }
  #offlineLibraryOverlay .sa-offline-icon-btn,
  #offlineLibraryOverlay #saOfflineMenuBtn,
  #offlineLibraryOverlay #closeOfflineLibraryBtn{
    width:34px !important;
    min-width:34px !important;
    height:34px !important;
    font-size:21px !important;
  }
  #offlineLibraryOverlay .sa-offline-scroll{
    padding:0 14px max(26px,env(safe-area-inset-bottom)) !important;
  }
  #offlineLibraryOverlay .sa-offline-search,
  #offlineLibraryOverlay #offlineSubjectSelect{
    height:45px !important;
  }
  #offlineLibraryOverlay .sa-offline-shelf-card{
    flex-basis:128px !important;
    width:128px !important;
    padding:8px 9px !important;
  }
  #offlineLibraryOverlay .sa-recent-subject{font-size:10px !important;}
  #offlineLibraryOverlay .sa-recent-type{font-size:8.9px !important;}
  #offlineLibraryOverlay .sa-recent-title{font-size:8.8px !important;}
  #offlineLibraryOverlay .sa-recent-year{font-size:8.7px !important;}
  #offlineLibraryOverlay .sa-offline-file-title{font-size:11px !important;}
}
@media(max-width:340px){
  #offlineLibraryOverlay .sa-offline-head{
    padding-left:12px !important;
    padding-right:12px !important;
  }
  #offlineLibraryOverlay .sa-offline-title{
    font-size:19px !important;
    letter-spacing:-.8px !important;
  }
  #offlineLibraryOverlay .sa-offline-title-row{
    gap:6px !important;
  }
  #offlineLibraryOverlay .sa-offline-head-actions{
    grid-auto-columns:32px !important;
    height:32px !important;
    gap:2px !important;
  }
  #offlineLibraryOverlay .sa-offline-icon-btn,
  #offlineLibraryOverlay #saOfflineMenuBtn,
  #offlineLibraryOverlay #closeOfflineLibraryBtn{
    width:32px !important;
    min-width:32px !important;
    height:32px !important;
    font-size:20px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function buildShell() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    const card = overlay?.querySelector(".offline-library-card");
    if (!overlay || !card) return false;

    if (card.dataset.offlineCanonical === CANONICAL_VERSION) return true;

    card.dataset.offlineCanonical = CANONICAL_VERSION;
    card.dataset.hybridReady = "1";
    card.classList.add("sa-offline-hybrid");
    card.innerHTML = `
      <div class="sa-offline-shell">
        <header class="sa-offline-head">
          <div class="sa-offline-title-row">
            <div class="sa-offline-title-wrap">
              <h2 class="sa-offline-title" id="offlineLibraryTitle">Offline Library</h2>
            </div>
            <div class="sa-offline-head-actions" aria-label="Offline Library controls">
              <button type="button" class="sa-offline-icon-btn" id="saOfflineMenuBtn" aria-label="Offline Library options">⋮</button>
              <button type="button" class="sa-offline-icon-btn" id="closeOfflineLibraryBtn" aria-label="Close Offline Library">×</button>
            </div>
          </div>

          <div class="sa-offline-filterbar">
            <label class="sa-offline-search">
              <span aria-hidden="true">⌕</span>
              <input id="offlineSearchInput" type="search" autocomplete="off"
                placeholder="Search saved files, subjects, year..."
                aria-label="Search saved files, subjects, year">
            </label>
            <select id="offlineSubjectSelect" aria-label="Filter Offline Library by subject">
              <option value="All">All subjects</option>
            </select>
          </div>

          <div class="sa-offline-hidden-legacy" aria-hidden="true">
            <span id="offlineSavedCount">0</span>
            <span id="offlineSubjectCount">0</span>
            <span id="offlineStoredSize">0 B</span>
            <span id="offlineStorageInfo"></span>
            <div id="offlineSubjectFilters"></div>
            <div id="offlineTypeFilters"></div>
          </div>
        </header>

        <div class="sa-offline-scroll">
          <section class="sa-offline-section" id="saOfflineContinueSection">
            <div class="sa-offline-section-head">
              <strong>Continue studying</strong>
              <span id="saOfflineContinueLabel">Recently opened</span>
            </div>
            <div class="sa-offline-shelf" id="saOfflineShelf"></div>
          </section>

          <section class="sa-offline-section">
            <div class="sa-offline-section-head">
              <strong>Your subjects</strong>
            </div>
            <div class="sa-offline-accordions" id="offlineLibraryList"></div>
          </section>
        </div>
      </div>

      <div class="sa-offline-utility" id="saOfflineUtility" aria-hidden="true">
        <div class="sa-offline-utility-card">
          <div class="sa-offline-utility-info" id="saOfflineUtilityInfo">Offline Library</div>
          <button type="button" class="danger" id="clearOfflineLibraryBtn">Clear Offline Library</button>
          <button type="button" id="saOfflineUtilityClose">Cancel</button>
        </div>
      </div>
    `;

    bindShellEvents(overlay, card);
    return true;
  }

  function filterRecords(records) {
    const q = state.query.trim().toLowerCase();
    return (records || []).filter(record => {
      if (state.subject !== "All" && subjectOf(record) !== state.subject) return false;
      if (!q) return true;

      const haystack = [
        titleOf(record),
        subjectOf(record),
        typeOf(record),
        yearOf(record),
        record?.filename,
        record?.level
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(q);
    });
  }

  function populateSubjectSelect(records) {
    const select = document.getElementById("offlineSubjectSelect");
    if (!select) return;

    const subjects = [...new Set((records || []).map(subjectOf))]
      .sort((a, b) => a.localeCompare(b, undefined, {
        sensitivity: "base",
        numeric: true
      }));

    if (state.subject !== "All" && !subjects.includes(state.subject)) {
      state.subject = "All";
    }

    select.innerHTML =
      `<option value="All">All subjects</option>` +
      subjects.map(subject => `<option value="${esc(subject)}">${esc(subject)}</option>`).join("");

    select.value = state.subject;
  }

  function equalizeShelfCards() {
    const cards = [...document.querySelectorAll(
      "#offlineLibraryOverlay .sa-offline-shelf-card[data-sa-open-id]"
    )];
    if (!cards.length) return;

    cards.forEach(card => {
      card.style.height = "auto";
      card.style.minHeight = "";
    });

    const tallest = Math.max(...cards.map(card => Math.ceil(card.scrollHeight)));
    cards.forEach(card => {
      card.style.height = `${tallest}px`;
      card.style.minHeight = `${tallest}px`;
    });
  }

  function buildShelf(records) {
    const shelf = document.getElementById("saOfflineShelf");
    const section = document.getElementById("saOfflineContinueSection");
    if (!shelf || !section) return;

    const recent = readRecent();
    const shelfRecords = filterRecords(records)
      .filter(record => Number(recent[String(record.id)] || 0) > 0)
      .sort((a, b) => Number(recent[String(b.id)] || 0) - Number(recent[String(a.id)] || 0))
      .slice(0, 5);

    section.style.display = shelfRecords.length ? "block" : "none";

    shelf.innerHTML = shelfRecords.map(record => {
      const title = displayTitleOf(record);
      return `
        <button type="button" class="sa-offline-shelf-card"
          data-sa-open-id="${esc(String(record.id))}">
          <span class="sa-recent-subject">${esc(subjectOf(record))}</span>
          <span class="sa-recent-type">${esc(typeOf(record))}</span>
          <span class="sa-recent-title${title ? "" : " is-empty"}">${esc(title)}</span>
          <span class="sa-recent-year">${esc(yearOf(record))}</span>
        </button>`;
    }).join("");

    requestAnimationFrame(equalizeShelfCards);
  }

  function fileMarkup(record) {
    const id = esc(String(record.id));
    const pinned = isPinned(record);
    const title = displayTitleOf(record);
    const meta = [typeOf(record), yearOf(record)].filter(Boolean).join(" · ");

    return `
      <article class="sa-offline-file${pinned ? " is-pinned" : ""}"
        data-offline-id="${id}">
        <div class="sa-offline-file-main">
          <button type="button"
            class="sa-offline-pin${pinned ? " is-pinned" : ""}"
            data-sa-pin-id="${id}"
            aria-label="${pinned ? "Unpin" : "Pin"}">${pinned ? "★" : "☆"}</button>
          <div>
            <div class="sa-offline-file-title">${esc(title)}</div>
            <div class="sa-offline-file-meta">${esc(meta)}</div>
          </div>
        </div>
        <div class="sa-offline-file-actions">
          <button type="button" class="sa-offline-action open"
            data-sa-open-id="${id}">⊙ Open</button>
          <button type="button" class="sa-offline-action"
            data-sa-share-id="${id}">↗ Share</button>
          <button type="button" class="sa-offline-action delete"
            data-sa-delete-id="${id}">Delete</button>
        </div>
      </article>`;
  }

  function sortSubjectItems(a, b) {
    const pinDiff = Number(isPinned(b)) - Number(isPinned(a));
    if (pinDiff) return pinDiff;

    return titleOf(a).localeCompare(titleOf(b), undefined, {
      sensitivity: "base",
      numeric: true
    });
  }

  function sizeOpenGroupBodies() {
    requestAnimationFrame(() => {
      document.querySelectorAll(
        "#offlineLibraryOverlay .sa-offline-group"
      ).forEach(group => {
        const body = group.querySelector(".sa-offline-group-body");
        if (!body) return;

        body.style.maxHeight = "";
        body.style.overflowY = "";

        if (!group.classList.contains("open")) return;

        const cards = [...body.querySelectorAll(".sa-offline-file")];
        const first = cards[0];
        if (!first) return;

        const bodyStyle = getComputedStyle(body);
        const padTop = parseFloat(bodyStyle.paddingTop) || 0;
        const padBottom = parseFloat(bodyStyle.paddingBottom) || 0;
        const oneEntryHeight = Math.ceil(
          first.getBoundingClientRect().height + padTop + padBottom
        );

        body.style.maxHeight = `${oneEntryHeight}px`;
        body.style.overflowY = cards.length > 1 ? "auto" : "hidden";
        body.scrollTop = 0;
      });
    });
  }

  function buildGroups(records) {
    const list = document.getElementById("offlineLibraryList");
    if (!list) return;

    const visible = filterRecords(records);
    if (!visible.length) {
      list.innerHTML =
        `<div class="sa-offline-empty">No offline files match your current search or filter.</div>`;
      return;
    }

    const groups = new Map();
    visible.forEach(record => {
      const subject = subjectOf(record);
      if (!groups.has(subject)) groups.set(subject, []);
      groups.get(subject).push(record);
    });

    const subjects = [...groups.keys()].sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
        numeric: true
      })
    );

    if (state.openSubject && !subjects.includes(state.openSubject)) {
      state.openSubject = "";
    }
    if (expandFirstOnOpen && !state.openSubject) {
      state.openSubject = subjects[0] || "";
      expandFirstOnOpen = false;
    }

    list.innerHTML = subjects.map(subject => {
      const items = groups.get(subject).sort(sortSubjectItems);
      const open = state.openSubject === subject;

      return `
        <section class="sa-offline-group${open ? " open" : ""}"
          data-sa-subject="${esc(subject)}">
          <button type="button" class="sa-offline-group-head"
            data-sa-toggle-subject="${esc(subject)}">
            <span class="chev">${open ? "▼" : "›"}</span>
            <span class="name">${esc(subject)}</span>
            <span class="count">${items.length}</span>
          </button>
          <div class="sa-offline-group-body">
            ${items.map(fileMarkup).join("")}
          </div>
        </section>`;
    }).join("");

    sizeOpenGroupBodies();
  }

  function updateSummary(records) {
    const count = (records || []).length;
    const bytes = (records || []).reduce(
      (sum, record) => sum + Number(record?.blob?.size || record?.size || 0),
      0
    );
    const subjects = new Set((records || []).map(subjectOf)).size;

    document.getElementById("offlineSavedCount")
      ?.replaceChildren(document.createTextNode(String(count)));
    document.getElementById("offlineSubjectCount")
      ?.replaceChildren(document.createTextNode(String(subjects)));
    document.getElementById("offlineStoredSize")
      ?.replaceChildren(document.createTextNode(fmt(bytes)));

    const utilityInfo = document.getElementById("saOfflineUtilityInfo");
    if (utilityInfo) {
      utilityInfo.textContent =
        `${count} ${count === 1 ? "file" : "files"} · ` +
        `${subjects} ${subjects === 1 ? "subject" : "subjects"} · ${fmt(bytes)} stored`;
    }
  }

  async function getRecords() {
    if (typeof getOfflineFiles !== "function") return [];
    return await getOfflineFiles();
  }

  async function renderCanonical() {
    ensureStyle();
    if (!buildShell()) return;

    const list = document.getElementById("offlineLibraryList");
    let records = [];

    try {
      records = await getRecords();
    } catch (err) {
      if (list) {
        list.innerHTML =
          `<div class="sa-offline-empty">Offline storage could not be opened on this device.</div>`;
      }
      return;
    }

    cleanRecent(records);

    try {
      if (typeof offlineEntryIds !== "undefined") {
        offlineEntryIds.clear();
        records.forEach(record => offlineEntryIds.add(String(record.id)));
      }
      if (typeof updateOfflineLibraryCount === "function") {
        updateOfflineLibraryCount(records.length);
      }
    } catch (_) {}

    populateSubjectSelect(records);
    updateSummary(records);
    buildShelf(records);
    buildGroups(records);

    try {
      if (typeof updateOfflineStorageInfo === "function") {
        await updateOfflineStorageInfo(records);
      }
    } catch (_) {}
  }

  async function doOpen(id) {
    markRecent(id);

    try {
      const records = await getRecords();
      buildShelf(records);
    } catch (_) {}

    try {
      if (typeof openOfflineFile === "function") {
        await openOfflineFile(id);
      }
    } catch (err) {
      try {
        showError(err?.message || "Could not open that offline file.");
      } catch (_) {}
    }
  }

  async function doShare(id) {
    try {
      if (typeof shareOfflineFile === "function") {
        await shareOfflineFile(id);
      }
    } catch (err) {
      try {
        showError(err?.message || "Could not share that offline file.");
      } catch (_) {}
    }
  }

  async function doPin(id) {
    try {
      if (typeof getOfflineFile !== "function" ||
          typeof putOfflineFile !== "function") return;

      const record = await getOfflineFile(id);
      if (!record) return;

      record.pinned = !isPinned(record);
      await putOfflineFile(record);

      /* Only rebuild subject entries. This both avoids a full-popup flash and
         immediately moves pinned entries to the top of their subject. */
      const records = await getRecords();
      buildGroups(records);
    } catch (err) {
      try {
        showError(err?.message || "Could not update that offline file.");
      } catch (_) {}
    }
  }

  async function doDelete(id) {
    let record = null;
    try {
      if (typeof getOfflineFile === "function") {
        record = await getOfflineFile(id);
      }
    } catch (_) {}

    const name = record ? titleOf(record) : "this file";
    if (!window.confirm(`Remove “${name}” from Offline Library?`)) return;

    try {
      if (typeof deleteOfflineFile === "function") {
        await deleteOfflineFile(id);
      } else if (typeof removeOfflineFile === "function") {
        await removeOfflineFile(id);
      }

      const recent = readRecent();
      delete recent[String(id)];
      writeRecent(recent);

      await renderCanonical();
    } catch (err) {
      try {
        showError(err?.message || "Could not remove that offline file.");
      } catch (_) {}
    }
  }

  function showUtility(show) {
    const utility = document.getElementById("saOfflineUtility");
    if (!utility) return;

    utility.classList.toggle("show", !!show);
    utility.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function bindShellEvents(overlay, card) {
    try { overlay.__saOfflineCanonicalController?.abort(); } catch (_) {}

    const controller = new AbortController();
    overlay.__saOfflineCanonicalController = controller;
    const options = { signal: controller.signal };

    card.querySelector("#closeOfflineLibraryBtn")?.addEventListener(
      "click",
      () => {
        try {
          if (typeof closeOfflineLibrary === "function") {
            closeOfflineLibrary();
          }
        } catch (_) {
          overlay.style.display = "none";
          document.body.classList.remove("no-scroll");
        }
      },
      options
    );

    card.querySelector("#saOfflineMenuBtn")?.addEventListener(
      "click",
      () => showUtility(true),
      options
    );

    card.querySelector("#saOfflineUtilityClose")?.addEventListener(
      "click",
      () => showUtility(false),
      options
    );

    card.querySelector("#clearOfflineLibraryBtn")?.addEventListener(
      "click",
      async () => {
        if (!window.confirm("Remove every file from Offline Library on this device?")) return;

        try {
          if (typeof clearOfflineFiles === "function") {
            await clearOfflineFiles();
          }

          try {
            if (typeof offlineEntryIds !== "undefined") offlineEntryIds.clear();
            if (typeof updateOfflineLibraryCount === "function") {
              updateOfflineLibraryCount(0);
            }
          } catch (_) {}

          try { localStorage.removeItem(RECENT_KEY); } catch (_) {}

          state.subject = "All";
          state.query = "";
          state.openSubject = "";
          expandFirstOnOpen = true;
          showUtility(false);
          await renderCanonical();
        } catch (err) {
          try {
            showError(err?.message || "Could not clear Offline Library.");
          } catch (_) {}
        }
      },
      options
    );

    card.querySelector("#saOfflineUtility")?.addEventListener(
      "click",
      event => {
        if (event.target.id === "saOfflineUtility") showUtility(false);
      },
      options
    );

    card.querySelector("#offlineSearchInput")?.addEventListener(
      "input",
      event => {
        state.query = event.target.value || "";
        state.openSubject = "";
        expandFirstOnOpen = true;

        getRecords()
          .then(records => {
            buildShelf(records);
            buildGroups(records);
          })
          .catch(() => {});
      },
      options
    );

    card.querySelector("#offlineSubjectSelect")?.addEventListener(
      "change",
      event => {
        state.subject = event.target.value || "All";
        state.openSubject = "";
        expandFirstOnOpen = true;

        getRecords()
          .then(records => {
            buildShelf(records);
            buildGroups(records);
          })
          .catch(() => {});
      },
      options
    );

    card.querySelector("#offlineLibraryList")?.addEventListener(
      "click",
      event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const toggle = target.closest("[data-sa-toggle-subject]");
        if (toggle) {
          const subject = toggle.dataset.saToggleSubject || "";
          expandFirstOnOpen = false;
          state.openSubject = state.openSubject === subject ? "" : subject;

          getRecords()
            .then(buildGroups)
            .catch(() => {});
          return;
        }

        const pin = target.closest("[data-sa-pin-id]");
        if (pin) {
          void doPin(pin.dataset.saPinId);
          return;
        }

        const open = target.closest("[data-sa-open-id]");
        if (open) {
          void doOpen(open.dataset.saOpenId);
          return;
        }

        const share = target.closest("[data-sa-share-id]");
        if (share) {
          void doShare(share.dataset.saShareId);
          return;
        }

        const del = target.closest("[data-sa-delete-id]");
        if (del) {
          void doDelete(del.dataset.saDeleteId);
        }
      },
      options
    );

    card.querySelector("#saOfflineShelf")?.addEventListener(
      "click",
      event => {
        const target = event.target instanceof Element ? event.target : null;
        const open = target?.closest("[data-sa-open-id]");
        if (open) void doOpen(open.dataset.saOpenId);
      },
      options
    );

    overlay.addEventListener(
      "click",
      event => {
        if (event.target === overlay) {
          try {
            if (typeof closeOfflineLibrary === "function") {
              closeOfflineLibrary();
            }
          } catch (_) {}
        }
      },
      options
    );
  }

  async function openCanonical(focusId = null) {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    try { window.statArchiveCloseMenu?.(); } catch (_) {}

    ensureStyle();
    buildShell();
    showUtility(false);

    state.openSubject = "";
    expandFirstOnOpen = true;

    /* Render while hidden so opening from Menu never shows an intermediate
       library state. */
    overlay.style.visibility = "hidden";
    overlay.style.display = "flex";
    document.body.classList.add("no-scroll");

    await renderCanonical();

    overlay.style.visibility = "visible";

    if (focusId != null) {
      const el = overlay.querySelector(
        `[data-offline-id="${CSS.escape(String(focusId))}"]`
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
  openCanonical.__saOfflineCanonical = true;

  function closeCanonical() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    overlay.style.visibility = "";
    overlay.style.display = "none";
    document.body.classList.remove("no-scroll");
    showUtility(false);
  }

  function install() {
    ensureStyle();
    buildShell();

    try { window.renderOfflineLibrary = renderCanonical; } catch (_) {}
    try { renderOfflineLibrary = renderCanonical; } catch (_) {}

    try { window.openOfflineLibrary = openCanonical; } catch (_) {}
    try { openOfflineLibrary = openCanonical; } catch (_) {}

    try { window.closeOfflineLibrary = closeCanonical; } catch (_) {}
    try { closeOfflineLibrary = closeCanonical; } catch (_) {}

    window.__STAT_ARCHIVE_OFFLINE_CANONICAL__ = CANONICAL_VERSION;

    if (document.getElementById("offlineLibraryOverlay")?.style.display === "flex") {
      void renderCanonical();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();