/* Stat Archive — Hybrid Offline Library
   Combines clean top filters, Continue studying shelf and collapsible subjects.
   Uses the existing IndexedDB/offline actions from offline.js. */
(() => {
  "use strict";

  const RECENT_KEY = "statArchiveOfflineRecentlyOpened";
  const state = {
    type: "All",
    subject: "All",
    query: "",
    openSubject: ""
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[ch]);

  const fmt = (bytes) => {
    try {
      if (typeof formatSize === "function") return formatSize(Number(bytes || 0));
    } catch (_) {}
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  function readRecent() {
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  }

  function markRecent(id) {
    try {
      const map = readRecent();
      map[String(id)] = Date.now();
      const trimmed = Object.fromEntries(
        Object.entries(map)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .slice(0, 24)
      );
      localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
    } catch (_) {}
  }

  function cleanRecent(records) {
    try {
      const ids = new Set((records || []).map(r => String(r.id)));
      const map = readRecent();
      let changed = false;
      Object.keys(map).forEach(id => {
        if (!ids.has(id)) {
          delete map[id];
          changed = true;
        }
      });
      if (changed) localStorage.setItem(RECENT_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function ensureStyle() {
    if (document.getElementById("saOfflineHybridStyle")) return;
    const style = document.createElement("style");
    style.id = "saOfflineHybridStyle";
    style.textContent = `
#offlineLibraryOverlay{padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important;}
#offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
  width:min(860px,100%)!important;max-width:860px!important;height:min(92dvh,900px)!important;max-height:92dvh!important;
  padding:0!important;overflow:hidden!important;border-radius:28px!important;
  border:1px solid rgba(148,163,184,.22)!important;background:linear-gradient(180deg,#111a26,#0b1119)!important;
  box-shadow:0 30px 90px rgba(0,0,0,.5)!important;color:#f4f7fb!important;
}
.sa-offline-shell{height:100%;display:flex;flex-direction:column;min-height:0;}
.sa-offline-head{padding:25px 26px 12px;flex:0 0 auto;}
.sa-offline-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.sa-offline-title{margin:0;font:700 clamp(31px,5vw,46px)/1.05 'JetBrains Mono',monospace;letter-spacing:.01em;color:#f4f7fb;}
.sa-offline-subtitle{margin:10px 0 0;color:#8f9aae;font:500 13px/1.55 Inter,sans-serif;}
.sa-offline-head-actions{display:flex;align-items:center;gap:5px;}
.sa-offline-icon-btn{width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:#8f9aae;font-size:24px;line-height:1;display:grid;place-items:center;cursor:pointer;}
.sa-offline-icon-btn:hover{background:rgba(255,255,255,.045);color:#eef4fa;}
.sa-offline-tabs{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin-top:20px;padding-bottom:2px;}
.sa-offline-tabs::-webkit-scrollbar{display:none;}
.sa-offline-tab{flex:0 0 auto;border:1px solid rgba(148,163,184,.18);background:transparent;color:#8f9aae;border-radius:999px;padding:8px 13px;font:700 11.5px Inter,sans-serif;cursor:pointer;}
.sa-offline-tab.active{background:#5ee7f7;color:#061116;border-color:transparent;box-shadow:0 5px 17px rgba(94,231,247,.15);}
.sa-offline-filterbar{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:10px;margin-top:14px;padding:9px;border:1px solid rgba(148,163,184,.16);border-radius:15px;background:rgba(255,255,255,.015);}
.sa-offline-search{display:flex;align-items:center;gap:9px;min-width:0;padding:0 8px;color:#7f8da2;}
.sa-offline-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f4f7fb;padding:9px 0;font:500 13px Inter,sans-serif;}
.sa-offline-search input::placeholder{color:#677589;}
#offlineSubjectSelect{border:1px solid rgba(148,163,184,.20);outline:0;background:#0e1620;color:#edf3f8;border-radius:11px;padding:9px 11px;font:600 12px Inter,sans-serif;min-width:0;}
.sa-offline-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:0 26px 28px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
.sa-offline-section{margin-top:21px;}
.sa-offline-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;}
.sa-offline-section-head strong{font:800 14px Inter,sans-serif;color:#f4f7fb;}
.sa-offline-section-head span{font:500 11.5px Inter,sans-serif;color:#7f8da2;}
.sa-offline-shelf{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:3px;}
.sa-offline-shelf::-webkit-scrollbar{display:none;}
.sa-offline-shelf-card{flex:0 0 165px;min-height:188px;border:1px solid rgba(148,163,184,.18);border-radius:17px;padding:13px;background:radial-gradient(circle at 86% 8%,rgba(94,231,247,.12),transparent 38%),linear-gradient(145deg,#172330,#111923);display:flex;flex-direction:column;justify-content:space-between;text-align:left;color:#f4f7fb;cursor:pointer;}
.sa-offline-shelf-card:active{transform:scale(.992);}
.sa-offline-shelf-badge{font:800 9px 'JetBrains Mono',monospace;letter-spacing:.13em;color:#5ee7f7;}
.sa-offline-shelf-title{margin-top:13px;font:800 12.5px/1.4 Inter,sans-serif;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}
.sa-offline-shelf-meta{margin-top:13px;color:#8290a3;font:500 10.5px/1.45 Inter,sans-serif;}
.sa-offline-accordions{display:grid;gap:9px;}
.sa-offline-group{border:1px solid rgba(148,163,184,.17);border-radius:16px;background:rgba(255,255,255,.012);overflow:hidden;}
.sa-offline-group-head{width:100%;border:0;background:transparent;color:#f4f7fb;display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:7px;align-items:center;text-align:left;padding:14px 15px;cursor:pointer;}
.sa-offline-group-head .chev{font-size:12px;color:#c9d2dc;}
.sa-offline-group-head .name{font:800 13px/1.35 Inter,sans-serif;min-width:0;}
.sa-offline-group-head .count{color:#8f9aae;font:800 12px 'JetBrains Mono',monospace;}
.sa-offline-group-body{display:none;border-top:1px solid rgba(148,163,184,.14);padding:9px;}
.sa-offline-group.open .sa-offline-group-body{display:block;}
.sa-offline-file{border:1px solid rgba(148,163,184,.15);border-radius:14px;background:rgba(255,255,255,.016);padding:12px;}
.sa-offline-file+.sa-offline-file{margin-top:8px;}
.sa-offline-file-main{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:start;}
.sa-offline-pin{width:28px;height:28px;border:0;background:transparent;color:#7d899b;font-size:19px;line-height:1;padding:0;cursor:pointer;}
.sa-offline-pin.is-pinned{color:#f6bd4c;}
.sa-offline-file-title{font:800 12.5px/1.4 Inter,sans-serif;color:#f4f7fb;overflow-wrap:anywhere;}
.sa-offline-file-meta{margin-top:3px;color:#7e8b9e;font:500 10.5px/1.4 Inter,sans-serif;}
.sa-offline-file-size{color:#8a96a8;font:600 10.5px Inter,sans-serif;white-space:nowrap;}
.sa-offline-file-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px;}
.sa-offline-action{border:1px solid rgba(148,163,184,.20);background:#0f1822;color:#e8eef4;border-radius:10px;padding:9px 7px;font:800 10.5px Inter,sans-serif;cursor:pointer;}
.sa-offline-action.open{color:#5ee7f7;border-color:rgba(94,231,247,.27);background:rgba(94,231,247,.08);}
.sa-offline-action.delete{color:#ff8a96;border-color:rgba(255,138,150,.22);background:rgba(255,138,150,.055);}
.sa-offline-empty{padding:26px 16px;text-align:center;border:1px dashed rgba(148,163,184,.19);border-radius:14px;color:#7e8b9e;font:500 12px/1.6 Inter,sans-serif;}
.sa-offline-utility{position:fixed;inset:0;z-index:12050;display:none;align-items:flex-end;background:rgba(0,0,0,.58);padding:0 12px max(10px,env(safe-area-inset-bottom));}
.sa-offline-utility.show{display:flex;}
.sa-offline-utility-card{width:min(520px,100%);margin:0 auto;border:1px solid rgba(148,163,184,.22);border-radius:22px;background:#131d29;padding:14px;box-shadow:0 25px 70px rgba(0,0,0,.5);}
.sa-offline-utility-info{padding:9px 10px 13px;color:#8f9aae;font:500 11.5px/1.5 Inter,sans-serif;}
.sa-offline-utility-card button{width:100%;border:0;background:transparent;color:#eef4fa;text-align:left;padding:12px;border-radius:10px;font:700 12px Inter,sans-serif;cursor:pointer;}
.sa-offline-utility-card button:hover{background:rgba(255,255,255,.045);}
.sa-offline-utility-card button.danger{color:#ff8a96;}
.sa-offline-hidden-legacy{display:none!important;}
body[data-theme="light"] #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{background:linear-gradient(180deg,#fbfaf7,#f5f1e9)!important;color:#27302d!important;border-color:rgba(75,54,95,.15)!important;box-shadow:0 28px 70px rgba(58,53,42,.22)!important;}
body[data-theme="light"] .sa-offline-title,body[data-theme="light"] .sa-offline-section-head strong,body[data-theme="light"] .sa-offline-group-head,body[data-theme="light"] .sa-offline-file-title{color:#27302d!important;}
body[data-theme="light"] .sa-offline-subtitle,body[data-theme="light"] .sa-offline-section-head span,body[data-theme="light"] .sa-offline-file-meta,body[data-theme="light"] .sa-offline-file-size{color:#817d77!important;}
body[data-theme="light"] .sa-offline-filterbar,body[data-theme="light"] .sa-offline-group,body[data-theme="light"] .sa-offline-file{background:rgba(255,255,255,.58)!important;border-color:rgba(75,54,95,.13)!important;}
body[data-theme="light"] #offlineSubjectSelect{background:#fff;color:#27302d;border-color:rgba(75,54,95,.16);}
body[data-theme="light"] .sa-offline-search input{color:#27302d;}
body[data-theme="light"] .sa-offline-shelf-card{background:radial-gradient(circle at 86% 8%,rgba(75,54,95,.09),transparent 38%),linear-gradient(145deg,#fff,#f2eee6);color:#27302d;border-color:rgba(75,54,95,.14);}
body[data-theme="light"] .sa-offline-shelf-title{color:#27302d;}
body[data-theme="light"] .sa-offline-shelf-badge{color:#4b365f;}
body[data-theme="light"] .sa-offline-action{background:#fff;color:#27302d;border-color:rgba(75,54,95,.15);}
body[data-theme="light"] .sa-offline-action.open{color:#347d73;background:rgba(52,125,115,.07);border-color:rgba(52,125,115,.18);}
body[data-theme="light"] .sa-offline-utility-card{background:#fbfaf7;border-color:rgba(75,54,95,.15);}
body[data-theme="light"] .sa-offline-utility-card button{color:#27302d;}
@media(max-width:700px){
  #offlineLibraryOverlay{padding:0!important;align-items:stretch!important;}
  #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{width:100%!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;border-left:0!important;border-right:0!important;}
  .sa-offline-head{padding:22px 18px 10px;}
  .sa-offline-scroll{padding:0 18px max(30px,env(safe-area-inset-bottom));}
  .sa-offline-filterbar{grid-template-columns:1fr;}
  #offlineSubjectSelect{width:100%;}
  .sa-offline-shelf-card{flex-basis:150px;min-height:178px;}
  .sa-offline-file-main{grid-template-columns:28px minmax(0,1fr);}
  .sa-offline-file-size{grid-column:2;margin-top:-1px;}
  .sa-offline-file-actions{grid-template-columns:1.05fr 1fr .9fr;}
}
`;
    document.head.appendChild(style);
  }

  function buildShell() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    const card = overlay?.querySelector(".offline-library-card");
    if (!overlay || !card || card.dataset.hybridReady === "1") return !!card;

    card.dataset.hybridReady = "1";
    card.classList.add("sa-offline-hybrid");
    card.innerHTML = `
      <div class="sa-offline-shell">
        <header class="sa-offline-head">
          <div class="sa-offline-title-row">
            <div>
              <h2 class="sa-offline-title" id="offlineLibraryTitle">Offline Library</h2>
              <p class="sa-offline-subtitle" id="saOfflineSummary">Saved files stay on this device.</p>
            </div>
            <div class="sa-offline-head-actions">
              <button type="button" class="sa-offline-icon-btn" id="saOfflineMenuBtn" aria-label="Offline Library options">⋮</button>
              <button type="button" class="sa-offline-icon-btn" id="closeOfflineLibraryBtn" aria-label="Close Offline Library">×</button>
            </div>
          </div>

          <div class="sa-offline-tabs" id="saOfflineTypeTabs" role="tablist" aria-label="Offline file types">
            <button type="button" class="sa-offline-tab active" data-sa-offline-type="All">All</button>
            <button type="button" class="sa-offline-tab" data-sa-offline-type="Book">Books</button>
            <button type="button" class="sa-offline-tab" data-sa-offline-type="Notes">Notes</button>
            <button type="button" class="sa-offline-tab" data-sa-offline-type="Questions">Questions</button>
          </div>

          <div class="sa-offline-filterbar">
            <label class="sa-offline-search">
              <span aria-hidden="true">⌕</span>
              <input id="offlineSearchInput" type="search" autocomplete="off" placeholder="Search offline files">
            </label>
            <select id="offlineSubjectSelect" aria-label="Filter Offline Library by subject">
              <option value="All">All subjects</option>
            </select>
          </div>

          <div class="sa-offline-hidden-legacy" aria-hidden="true">
            <span id="offlineSavedCount">0</span><span id="offlineSubjectCount">0</span><span id="offlineStoredSize">0 B</span><span id="offlineStorageInfo"></span>
            <div id="offlineSubjectFilters"></div><div id="offlineTypeFilters"></div>
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
              <span>Tap a subject to expand</span>
            </div>
            <div class="sa-offline-accordions" id="offlineLibraryList"></div>
          </section>
        </div>
      </div>

      <div class="sa-offline-utility" id="saOfflineUtility" aria-hidden="true">
        <div class="sa-offline-utility-card">
          <div class="sa-offline-utility-info" id="saOfflineUtilityInfo">Offline Library</div>
          <button type="button" id="saOfflineStorageBtn">Storage details</button>
          <button type="button" class="danger" id="clearOfflineLibraryBtn">Clear Offline Library</button>
          <button type="button" id="saOfflineUtilityClose">Cancel</button>
        </div>
      </div>
    `;

    bindShellEvents(overlay, card);
    return true;
  }

  function recordSubject(record) {
    return String(record?.subjectName || record?.subject || "Other").trim() || "Other";
  }

  function recordTitle(record) {
    return String(record?.title || record?.filename || "Untitled").trim() || "Untitled";
  }

  function recordType(record) {
    return String(record?.type || "").trim();
  }

  function recordSaved(record) {
    try {
      if (typeof offlineSavedDate === "function") return offlineSavedDate(record) || "";
    } catch (_) {}
    return "";
  }

  function typeMatches(record) {
    const type = recordType(record).toLowerCase();
    if (state.type === "All") return true;
    if (state.type === "Book") return type === "book" || type === "books";
    if (state.type === "Notes") return type === "note" || type === "notes";
    if (state.type === "Questions") return type.includes("question") || type === "pyq" || type === "mtq";
    return true;
  }

  function filterRecords(records) {
    const q = state.query.trim().toLowerCase();
    return (records || []).filter(record => {
      if (!typeMatches(record)) return false;
      if (state.subject !== "All" && recordSubject(record) !== state.subject) return false;
      if (!q) return true;
      const hay = [recordTitle(record), recordSubject(record), recordType(record), record?.year, record?.filename]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function populateSubjectSelect(records) {
    const select = document.getElementById("offlineSubjectSelect");
    if (!select) return;
    const subjects = [...new Set((records || []).map(recordSubject))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
    if (state.subject !== "All" && !subjects.includes(state.subject)) state.subject = "All";
    select.innerHTML = `<option value="All">All subjects</option>` + subjects.map(subject => `<option value="${esc(subject)}">${esc(subject)}</option>`).join("");
    select.value = state.subject;
  }

  function buildShelf(records) {
    const shelf = document.getElementById("saOfflineShelf");
    const section = document.getElementById("saOfflineContinueSection");
    const label = document.getElementById("saOfflineContinueLabel");
    if (!shelf || !section) return;

    const visible = filterRecords(records);
    const recentMap = readRecent();
    let shelfRecords = visible
      .filter(record => recentMap[String(record.id)])
      .sort((a, b) => Number(recentMap[String(b.id)] || 0) - Number(recentMap[String(a.id)] || 0))
      .slice(0, 6);

    if (shelfRecords.length) {
      if (label) label.textContent = "Recently opened";
    } else {
      shelfRecords = [...visible]
        .sort((a, b) => Number(b?.savedAt || 0) - Number(a?.savedAt || 0))
        .slice(0, 4);
      if (label) label.textContent = shelfRecords.length ? "Recently saved" : "";
    }

    section.style.display = shelfRecords.length ? "block" : "none";
    shelf.innerHTML = shelfRecords.map(record => {
      const type = recordType(record);
      const badge = /book/i.test(type) ? "BOOK" : "PDF";
      return `
        <button type="button" class="sa-offline-shelf-card" data-sa-open-id="${esc(String(record.id))}">
          <div>
            <div class="sa-offline-shelf-badge">${badge}</div>
            <div class="sa-offline-shelf-title">${esc(recordTitle(record))}</div>
          </div>
          <div class="sa-offline-shelf-meta">${esc(recordSubject(record))}<br>${esc(fmt(record?.blob?.size || record?.size || 0))}</div>
        </button>`;
    }).join("");
  }

  function fileMarkup(record) {
    const id = esc(String(record.id));
    let pinned = false;
    try { pinned = typeof offlinePinned === "function" ? offlinePinned(record) : record?.pinned === true; } catch (_) { pinned = record?.pinned === true; }
    const saved = recordSaved(record);
    const meta = [recordType(record), saved ? `Saved ${saved}` : ""].filter(Boolean).join(" · ");
    return `
      <article class="sa-offline-file${pinned ? " is-pinned" : ""}" data-offline-id="${id}">
        <div class="sa-offline-file-main">
          <button type="button" class="sa-offline-pin${pinned ? " is-pinned" : ""}" data-sa-pin-id="${id}" aria-label="${pinned ? "Unpin" : "Pin"}">${pinned ? "★" : "☆"}</button>
          <div>
            <div class="sa-offline-file-title">${esc(recordTitle(record))}</div>
            <div class="sa-offline-file-meta">${esc(meta)}</div>
          </div>
          <span class="sa-offline-file-size">${esc(fmt(record?.blob?.size || record?.size || 0))}</span>
        </div>
        <div class="sa-offline-file-actions">
          <button type="button" class="sa-offline-action open" data-sa-open-id="${id}">⊙ Open</button>
          <button type="button" class="sa-offline-action" data-sa-share-id="${id}">↗ Share</button>
          <button type="button" class="sa-offline-action delete" data-sa-delete-id="${id}">Delete</button>
        </div>
      </article>`;
  }

  function buildGroups(records) {
    const list = document.getElementById("offlineLibraryList");
    if (!list) return;
    const visible = filterRecords(records);
    if (!visible.length) {
      list.innerHTML = `<div class="sa-offline-empty">No offline files match your current search or filter.</div>`;
      return;
    }

    const groups = new Map();
    visible.forEach(record => {
      const subject = recordSubject(record);
      if (!groups.has(subject)) groups.set(subject, []);
      groups.get(subject).push(record);
    });

    const subjects = [...groups.keys()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
    if (!state.openSubject || !subjects.includes(state.openSubject)) state.openSubject = subjects[0];

    list.innerHTML = subjects.map(subject => {
      const items = groups.get(subject).sort((a, b) => recordTitle(a).localeCompare(recordTitle(b), undefined, { sensitivity: "base", numeric: true }));
      const open = state.openSubject === subject;
      return `
        <section class="sa-offline-group${open ? " open" : ""}" data-sa-subject="${esc(subject)}">
          <button type="button" class="sa-offline-group-head" data-sa-toggle-subject="${esc(subject)}">
            <span class="chev">${open ? "▼" : "›"}</span>
            <span class="name">${esc(subject)}</span>
            <span class="count">${items.length}</span>
          </button>
          <div class="sa-offline-group-body">${items.map(fileMarkup).join("")}</div>
        </section>`;
    }).join("");
  }

  function updateSummary(records) {
    const summary = document.getElementById("saOfflineSummary");
    const count = (records || []).length;
    const bytes = (records || []).reduce((sum, r) => sum + Number(r?.blob?.size || r?.size || 0), 0);
    const subjects = new Set((records || []).map(recordSubject)).size;
    if (summary) summary.textContent = count
      ? `${count} ${count === 1 ? "file" : "files"} · ${fmt(bytes)} stored on this device`
      : "Saved files stay on this device and can be opened without internet.";

    const savedCount = document.getElementById("offlineSavedCount");
    const subjectCount = document.getElementById("offlineSubjectCount");
    const stored = document.getElementById("offlineStoredSize");
    if (savedCount) savedCount.textContent = String(count);
    if (subjectCount) subjectCount.textContent = String(subjects);
    if (stored) stored.textContent = fmt(bytes);

    const utilityInfo = document.getElementById("saOfflineUtilityInfo");
    if (utilityInfo) utilityInfo.textContent = `${count} ${count === 1 ? "file" : "files"} · ${subjects} ${subjects === 1 ? "subject" : "subjects"} · ${fmt(bytes)} stored`;
  }

  async function renderHybrid() {
    if (!buildShell()) return;
    const list = document.getElementById("offlineLibraryList");
    let records = [];
    try {
      records = await getOfflineFiles();
    } catch (err) {
      if (list) list.innerHTML = `<div class="sa-offline-empty">Offline storage could not be opened on this device.</div>`;
      return;
    }

    cleanRecent(records);
    try {
      offlineEntryIds.clear();
      records.forEach(record => offlineEntryIds.add(String(record.id)));
      updateOfflineLibraryCount(records.length);
    } catch (_) {}

    populateSubjectSelect(records);
    updateSummary(records);
    buildShelf(records);
    buildGroups(records);
    try { updateOfflineStorageInfo(records); } catch (_) {}
  }

  async function doOpen(id) {
    markRecent(id);
    buildShelf(await getOfflineFiles());
    try {
      await openOfflineFile(id);
    } catch (err) {
      try { showError(err?.message || "Could not open that offline file."); } catch (_) {}
    }
  }

  async function doShare(id) {
    try {
      await shareOfflineFile(id);
    } catch (err) {
      try { showError(err?.message || "Could not share that offline file."); } catch (_) {}
    }
  }

  async function doPin(id) {
    try {
      const record = await getOfflineFile(id);
      if (!record) return;
      record.pinned = !(record.pinned === true);
      await putOfflineFile(record);
      await renderHybrid();
    } catch (err) {
      try { showError(err?.message || "Could not update that offline file."); } catch (_) {}
    }
  }

  async function doDelete(id) {
    let record = null;
    try { record = await getOfflineFile(id); } catch (_) {}
    const name = record ? recordTitle(record) : "this file";
    if (!window.confirm(`Remove “${name}” from Offline Library?`)) return;
    try {
      await removeOfflineFile(id);
      const recent = readRecent();
      delete recent[String(id)];
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (_) {}
      await renderHybrid();
    } catch (err) {
      try { showError(err?.message || "Could not remove that offline file."); } catch (_) {}
    }
  }

  function showUtility(show) {
    const utility = document.getElementById("saOfflineUtility");
    if (!utility) return;
    utility.classList.toggle("show", !!show);
    utility.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function bindShellEvents(overlay, card) {
    card.querySelector("#closeOfflineLibraryBtn")?.addEventListener("click", () => {
      try { closeOfflineLibrary(); } catch (_) { overlay.style.display = "none"; document.body.classList.remove("no-scroll"); }
    });

    card.querySelector("#saOfflineMenuBtn")?.addEventListener("click", () => showUtility(true));
    card.querySelector("#saOfflineUtilityClose")?.addEventListener("click", () => showUtility(false));
    card.querySelector("#saOfflineStorageBtn")?.addEventListener("click", () => {
      const info = document.getElementById("saOfflineUtilityInfo")?.textContent || "Offline Library storage";
      window.alert(info);
      showUtility(false);
    });

    card.querySelector("#clearOfflineLibraryBtn")?.addEventListener("click", async () => {
      if (!window.confirm("Remove every file from Offline Library on this device?")) return;
      try {
        await clearOfflineFiles();
        try { offlineEntryIds.clear(); updateOfflineLibraryCount(0); } catch (_) {}
        try { localStorage.removeItem(RECENT_KEY); } catch (_) {}
        try { render(); } catch (_) {}
        state.subject = "All";
        state.openSubject = "";
        showUtility(false);
        await renderHybrid();
      } catch (err) {
        try { showError(err?.message || "Could not clear Offline Library."); } catch (_) {}
      }
    });

    card.querySelector("#saOfflineUtility")?.addEventListener("click", event => {
      if (event.target.id === "saOfflineUtility") showUtility(false);
    });

    card.querySelector("#saOfflineTypeTabs")?.addEventListener("click", event => {
      const button = event.target.closest("[data-sa-offline-type]");
      if (!button) return;
      state.type = button.dataset.saOfflineType || "All";
      card.querySelectorAll("[data-sa-offline-type]").forEach(btn => btn.classList.toggle("active", btn === button));
      getOfflineFiles().then(records => { buildShelf(records); buildGroups(records); });
    });

    card.querySelector("#offlineSearchInput")?.addEventListener("input", event => {
      state.query = event.target.value || "";
      getOfflineFiles().then(records => { buildShelf(records); buildGroups(records); });
    });

    card.querySelector("#offlineSubjectSelect")?.addEventListener("change", event => {
      state.subject = event.target.value || "All";
      getOfflineFiles().then(records => { buildShelf(records); buildGroups(records); });
    });

    card.querySelector("#offlineLibraryList")?.addEventListener("click", event => {
      const toggle = event.target.closest("[data-sa-toggle-subject]");
      if (toggle) {
        const subject = toggle.dataset.saToggleSubject || "";
        state.openSubject = state.openSubject === subject ? "" : subject;
        getOfflineFiles().then(buildGroups);
        return;
      }
      const pin = event.target.closest("[data-sa-pin-id]");
      if (pin) return void doPin(pin.dataset.saPinId);
      const open = event.target.closest("[data-sa-open-id]");
      if (open) return void doOpen(open.dataset.saOpenId);
      const share = event.target.closest("[data-sa-share-id]");
      if (share) return void doShare(share.dataset.saShareId);
      const del = event.target.closest("[data-sa-delete-id]");
      if (del) return void doDelete(del.dataset.saDeleteId);
    });

    card.querySelector("#saOfflineShelf")?.addEventListener("click", event => {
      const open = event.target.closest("[data-sa-open-id]");
      if (open) void doOpen(open.dataset.saOpenId);
    });

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        try { closeOfflineLibrary(); } catch (_) {}
      }
    });
  }

  function install() {
    ensureStyle();
    buildShell();

    /* Replace only the Offline Library renderer. The database and real file
       operations remain the original implementations from offline.js. */
    try { window.renderOfflineLibrary = renderHybrid; } catch (_) {}
    try { renderOfflineLibrary = renderHybrid; } catch (_) {}

    /* Ensure opening the library always uses the new renderer even on
       browsers that retain an older global function binding. */
    const originalOpen = window.openOfflineLibrary;
    if (typeof originalOpen === "function" && !originalOpen.__saHybridWrapped) {
      const wrapped = function(focusId = null) {
        const overlay = document.getElementById("offlineLibraryOverlay");
        if (!overlay) return;
        buildShell();
        overlay.style.display = "flex";
        document.body.classList.add("no-scroll");
        renderHybrid().then(() => {
          if (focusId != null) {
            const el = overlay.querySelector(`[data-offline-id="${CSS.escape(String(focusId))}"]`);
            el?.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        });
      };
      wrapped.__saHybridWrapped = true;
      window.openOfflineLibrary = wrapped;
      try { openOfflineLibrary = wrapped; } catch (_) {}
    }

    if (document.getElementById("offlineLibraryOverlay")?.style.display === "flex") renderHybrid();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
