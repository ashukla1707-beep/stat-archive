/* Stat Archive — Offline Library stable presentation v9
   Event-driven only. No MutationObserver and no pin/unpin rerender. */
(() => {
  "use strict";

  const RECENT_KEY = "statArchiveOfflineRecentlyOpened";
  let refreshTimer = 0;
  let refreshing = false;
  let openWrapped = false;
  let expandedSubject = "";
  let expandFirstOnOpen = true;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

  function metaOf(record) {
    const type = typeOf(record);
    const year = yearOf(record);
    return year ? `${type} · ${year}` : type;
  }

  function installStyle() {
    document.getElementById("saOfflineEntryFormatStyle")?.remove();
    const style = document.createElement("style");
    style.id = "saOfflineEntryFormatStyle";
    style.textContent = `
#offlineLibraryOverlay{
  padding:12px !important;
  align-items:center !important;
  justify-content:center !important;
  background:rgba(2,6,12,.52) !important;
  -webkit-backdrop-filter:blur(4px) !important;
  backdrop-filter:blur(4px) !important;
}
#offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
  width:min(860px,100%) !important;
  height:min(92dvh,900px) !important;
  max-height:92dvh !important;
  border-radius:28px !important;
  border:1px solid rgba(148,163,184,.22) !important;
  box-shadow:0 26px 72px rgba(0,0,0,.42) !important;
  overflow:hidden !important;
}

/* Header: title + optically centered menu + close. */
#offlineLibraryOverlay .sa-offline-title-row{
  position:relative !important;
  display:flex !important;
  align-items:center !important;
  width:100% !important;
  min-height:38px !important;
}
#offlineLibraryOverlay .sa-offline-title-row > div:first-child{
  display:block !important;
  min-width:0 !important;
  padding-right:82px !important;
}
#offlineLibraryOverlay .sa-offline-title{
  margin:0 !important;
  padding:0 !important;
  white-space:nowrap !important;
}
#offlineLibraryOverlay .sa-offline-head-actions{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  display:block !important;
  padding:0 !important;
  margin:0 !important;
  pointer-events:none !important;
}
#offlineLibraryOverlay #saOfflineMenuBtn,
#offlineLibraryOverlay #closeOfflineLibraryBtn{
  position:absolute !important;
  top:50% !important;
  margin:0 !important;
  pointer-events:auto !important;
}
#offlineLibraryOverlay #saOfflineMenuBtn{
  left:var(--sa-offline-menu-left, calc(100% - 62px)) !important;
  right:auto !important;
  transform:translate(-50%,-50%) !important;
}
#offlineLibraryOverlay #closeOfflineLibraryBtn{
  right:0 !important;
  left:auto !important;
  transform:translateY(-50%) !important;
}

#offlineLibraryOverlay .sa-offline-subtitle,
#offlineLibraryOverlay .sa-offline-tabs,
#offlineLibraryOverlay #saOfflineContinueLabel,
#offlineLibraryOverlay #saOfflineStorageBtn{
  display:none !important;
}
#offlineLibraryOverlay .sa-offline-head{padding-bottom:6px !important;}

/* Compact filters and remove browser focus box. */
#offlineLibraryOverlay .sa-offline-filterbar{
  grid-template-columns:1fr !important;
  gap:7px !important;
  margin-top:8px !important;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
}
#offlineLibraryOverlay .sa-offline-search,
#offlineLibraryOverlay #offlineSubjectSelect{
  height:45px !important;
  border-radius:13px !important;
}
#offlineLibraryOverlay .sa-offline-search{
  padding:0 13px !important;
  outline:0 !important;
  box-shadow:none !important;
}
#offlineLibraryOverlay .sa-offline-search:focus,
#offlineLibraryOverlay .sa-offline-search:focus-within,
#offlineLibraryOverlay #offlineSearchInput,
#offlineLibraryOverlay #offlineSearchInput:focus,
#offlineLibraryOverlay #offlineSearchInput:focus-visible,
#offlineLibraryOverlay #offlineSearchInput:active{
  outline:0 !important;
  box-shadow:none !important;
  border:0 !important;
  background:transparent !important;
}
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-decoration,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-cancel-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-decoration{
  -webkit-appearance:none !important;
}
#offlineLibraryOverlay #offlineSubjectSelect{
  -webkit-appearance:none !important;
  appearance:none !important;
  padding:0 42px 0 14px !important;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238f9aae' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
  background-repeat:no-repeat !important;
  background-position:right 16px center !important;
  background-size:14px 14px !important;
}

#offlineLibraryOverlay .sa-offline-scroll{padding-top:0 !important;}
#offlineLibraryOverlay .sa-offline-section{margin-top:15px !important;}

/* Continue studying cards. */
#offlineLibraryOverlay .sa-offline-shelf{
  gap:8px !important;
  align-items:flex-start !important;
}
#offlineLibraryOverlay .sa-offline-shelf-card{
  flex:0 0 134px !important;
  width:134px !important;
  height:auto !important;
  min-height:0 !important;
  max-height:none !important;
  padding:9px 10px !important;
  border-radius:15px !important;
  display:flex !important;
  flex-direction:column !important;
  justify-content:flex-start !important;
  overflow:hidden !important;
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
#offlineLibraryOverlay .sa-recent-title.is-empty{display:none !important;}
#offlineLibraryOverlay .sa-recent-year{
  margin-top:4px;
  color:#7f8da1;
  font:600 8.9px/1.15 'JetBrains Mono',monospace;
}
#offlineLibraryOverlay .sa-recent-year:empty{display:none !important;}

/* Subject entries. */
#offlineLibraryOverlay .sa-offline-file-main{
  grid-template-columns:28px minmax(0,1fr) !important;
  gap:9px !important;
  align-items:start !important;
}
#offlineLibraryOverlay .sa-offline-file-title{
  font:800 11.5px/1.34 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-title:empty{display:none !important;}
#offlineLibraryOverlay .sa-offline-file-meta{
  margin-top:4px !important;
  font:500 10px/1.32 Inter,sans-serif !important;
}
#offlineLibraryOverlay .sa-offline-file-size{display:none !important;}
#offlineLibraryOverlay .sa-offline-file.sa-type-only .sa-offline-file-main{
  align-items:center !important;
}
#offlineLibraryOverlay .sa-offline-file.sa-type-only .sa-offline-pin{
  align-self:center !important;
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
}
#offlineLibraryOverlay .sa-offline-file.sa-type-only .sa-offline-file-meta{
  margin-top:0 !important;
  line-height:1.2 !important;
}

body[data-theme="light"] #offlineLibraryOverlay .sa-recent-subject,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title{color:#27302d !important;}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-title{color:#4b514e !important;}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-type,
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-year{color:#817d77 !important;}
body[data-theme="light"] #offlineLibraryOverlay #offlineSubjectSelect{background-color:#fff !important;}

@media(max-width:700px){
  #offlineLibraryOverlay .offline-library-card.sa-offline-hybrid{
    width:100% !important;
    height:calc(100dvh - 24px) !important;
    max-height:calc(100dvh - 24px) !important;
  }
  #offlineLibraryOverlay .sa-offline-title-row > div:first-child{padding-right:76px !important;}
  #offlineLibraryOverlay #offlineSubjectSelect{background-position:right 15px center !important;}
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
`;
    document.head.appendChild(style);
  }

  function formatHeader() {
    const subtitle = document.getElementById("saOfflineSummary");
    if (subtitle) {
      subtitle.textContent = "";
      subtitle.hidden = true;
    }
    document.getElementById("saOfflineStorageBtn")?.remove();
  }

  function alignHeaderMenu() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;
    const row = overlay.querySelector(".sa-offline-title-row");
    const title = overlay.querySelector(".sa-offline-title");
    const close = document.getElementById("closeOfflineLibraryBtn");
    if (!row || !title || !close) return;

    const rowRect = row.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const closeRect = close.getBoundingClientRect();
    if (!rowRect.width || !titleRect.width || !closeRect.width) return;

    const gap = closeRect.left - titleRect.right;
    if (gap <= 0) return;

    /* A small optical bias toward the close button makes the vertical ellipsis
       look centered between the wordmark and X, not crowded against the title. */
    const bias = window.innerWidth <= 700 ? Math.min(11, gap * 0.16) : Math.min(7, gap * 0.12);
    const targetCenter = titleRect.right + gap / 2 + bias;
    row.style.setProperty("--sa-offline-menu-left", `${targetCenter - rowRect.left}px`);
  }

  function formatShelfCard(card, record) {
    if (!card || !record) return;
    const subject = subjectOf(record);
    const type = typeOf(record);
    const title = displayTitleOf(record);
    const year = yearOf(record);

    card.innerHTML = `
      <span class="sa-recent-subject"></span>
      <span class="sa-recent-type"></span>
      <span class="sa-recent-title${title ? "" : " is-empty"}"></span>
      <span class="sa-recent-year"></span>`;
    card.querySelector(".sa-recent-subject").textContent = subject;
    card.querySelector(".sa-recent-type").textContent = type;
    card.querySelector(".sa-recent-title").textContent = title;
    card.querySelector(".sa-recent-year").textContent = year;
  }

  function equalizeShelfCards() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;
    const cards = [...overlay.querySelectorAll(".sa-offline-shelf-card[data-sa-open-id]")];
    if (!cards.length) return;

    cards.forEach(card => {
      card.style.setProperty("height", "auto", "important");
      card.style.setProperty("min-height", "0", "important");
      card.style.setProperty("max-height", "none", "important");
    });
    const tallest = Math.max(...cards.map(card => Math.ceil(card.scrollHeight)));
    cards.forEach(card => {
      card.style.setProperty("height", `${tallest}px`, "important");
      card.style.setProperty("min-height", `${tallest}px`, "important");
      card.style.setProperty("max-height", `${tallest}px`, "important");
    });
  }

  function applyAccordionState() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;
    const groups = [...overlay.querySelectorAll(".sa-offline-group[data-sa-subject]")];
    if (!groups.length) return;

    const available = new Set(groups.map(group => group.dataset.saSubject || ""));
    if (expandedSubject && !available.has(expandedSubject)) expandedSubject = "";
    if (expandFirstOnOpen && !expandedSubject) {
      expandedSubject = groups[0].dataset.saSubject || "";
      expandFirstOnOpen = false;
    }

    groups.forEach(group => {
      const subject = group.dataset.saSubject || "";
      const open = !!expandedSubject && subject === expandedSubject;
      group.classList.toggle("open", open);
      const chev = group.querySelector(".sa-offline-group-head .chev");
      if (chev) chev.textContent = open ? "▼" : "›";
    });
  }

  async function refreshPresentation() {
    if (refreshing) return;
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay || overlay.style.display === "none" || typeof getOfflineFiles !== "function") return;

    refreshing = true;
    try {
      const records = await getOfflineFiles();
      const map = new Map((records || []).map(record => [String(record.id), record]));

      formatHeader();
      overlay.querySelectorAll(".sa-offline-shelf-card[data-sa-open-id]").forEach(card => {
        const record = map.get(String(card.dataset.saOpenId || ""));
        if (record) formatShelfCard(card, record);
      });

      overlay.querySelectorAll(".sa-offline-file[data-offline-id]").forEach(card => {
        const record = map.get(String(card.dataset.offlineId || ""));
        if (!record) return;
        const distinctTitle = displayTitleOf(record);
        const title = card.querySelector(".sa-offline-file-title");
        const meta = card.querySelector(".sa-offline-file-meta");
        const size = card.querySelector(".sa-offline-file-size");

        card.classList.toggle("sa-type-only", !distinctTitle);
        if (title) {
          title.textContent = distinctTitle;
          title.style.display = distinctTitle ? "" : "none";
        }
        if (meta) meta.textContent = metaOf(record);
        if (size) size.style.display = "none";
      });

      applyAccordionState();
      requestAnimationFrame(() => {
        alignHeaderMenu();
        equalizeShelfCards();
      });
    } catch (_) {
      /* Presentation must never block Offline Library. */
    } finally {
      refreshing = false;
    }
  }

  function scheduleRefresh(delay = 0) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => void refreshPresentation(), delay);
  }

  function rememberRecentWithoutRerender(id) {
    try {
      const map = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
      map[String(id)] = Date.now();
      const trimmed = Object.fromEntries(
        Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 30)
      );
      localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
    } catch (_) {}
  }

  async function openWithoutBackgroundRefresh(id) {
    rememberRecentWithoutRerender(id);
    try {
      if (typeof openOfflineFile === "function") await openOfflineFile(id);
    } catch (err) {
      try { if (typeof showError === "function") showError(err?.message || "Could not open that offline file."); } catch (_) {}
    }
  }

  async function togglePinWithoutRerender(id) {
    try {
      if (typeof getOfflineFile !== "function" || typeof putOfflineFile !== "function") return;
      const record = await getOfflineFile(id);
      if (!record) return;

      let pinned = record.pinned === true;
      try { if (typeof offlinePinned === "function") pinned = !!offlinePinned(record); } catch (_) {}
      const next = !pinned;
      record.pinned = next;
      await putOfflineFile(record);

      document.querySelectorAll(`#offlineLibraryOverlay [data-sa-pin-id="${CSS.escape(String(id))}"]`).forEach(button => {
        button.classList.toggle("is-pinned", next);
        button.textContent = next ? "★" : "☆";
        button.setAttribute("aria-label", next ? "Unpin" : "Pin");
        button.closest(".sa-offline-file")?.classList.toggle("is-pinned", next);
      });
    } catch (err) {
      try { if (typeof showError === "function") showError(err?.message || "Could not update that offline file."); } catch (_) {}
    }
  }

  async function revealAfterStableRender() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    const card = overlay?.querySelector(".offline-library-card.sa-offline-hybrid");
    const list = document.getElementById("offlineLibraryList");
    if (!overlay || !card) return;

    for (let i = 0; i < 25; i += 1) {
      if (list && list.children.length) break;
      await sleep(20);
    }

    await refreshPresentation();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    alignHeaderMenu();
    card.style.opacity = "1";
    card.style.visibility = "visible";
  }

  function wrapOpenFunction() {
    if (openWrapped || typeof window.openOfflineLibrary !== "function") return;
    const originalOpen = window.openOfflineLibrary;
    if (originalOpen.__saStableV9Wrapped) {
      openWrapped = true;
      return;
    }

    const wrappedOpen = function(...args) {
      const overlay = document.getElementById("offlineLibraryOverlay");
      const card = overlay?.querySelector(".offline-library-card.sa-offline-hybrid");
      const list = document.getElementById("offlineLibraryList");
      const shelf = document.getElementById("saOfflineShelf");

      expandedSubject = "";
      expandFirstOnOpen = true;
      if (card) {
        card.style.transition = "none";
        card.style.opacity = "0";
        card.style.visibility = "hidden";
      }
      if (list) list.innerHTML = "";
      if (shelf) shelf.innerHTML = "";

      const result = originalOpen.apply(this, args);
      void revealAfterStableRender();
      return result;
    };

    wrappedOpen.__saStableV9Wrapped = true;
    window.openOfflineLibrary = wrappedOpen;
    try { openOfflineLibrary = wrappedOpen; } catch (_) {}
    openWrapped = true;
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest("#offlineLibraryOverlay [data-sa-toggle-subject]");
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();
        const subject = toggle.dataset.saToggleSubject || "";
        expandFirstOnOpen = false;
        expandedSubject = expandedSubject === subject ? "" : subject;
        applyAccordionState();
        return;
      }

      const pin = target.closest("#offlineLibraryOverlay [data-sa-pin-id]");
      if (pin) {
        event.preventDefault();
        event.stopPropagation();
        void togglePinWithoutRerender(pin.dataset.saPinId || "");
        return;
      }

      const open = target.closest("#offlineLibraryOverlay [data-sa-open-id]");
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        void openWithoutBackgroundRefresh(open.dataset.saOpenId || "");
        return;
      }

      if (target.closest("#offlineLibraryOverlay [data-sa-delete-id]")) scheduleRefresh(120);
    }, true);

    document.addEventListener("input", event => {
      if (event.target?.id === "offlineSearchInput") {
        expandedSubject = "";
        expandFirstOnOpen = false;
        scheduleRefresh(55);
      }
    }, true);

    document.addEventListener("change", event => {
      if (event.target?.id === "offlineSubjectSelect") {
        expandedSubject = "";
        expandFirstOnOpen = false;
        scheduleRefresh(55);
      }
    }, true);

    window.addEventListener("resize", () => requestAnimationFrame(alignHeaderMenu), { passive:true });
  }

  function install() {
    installStyle();
    bindEvents();
    wrapOpenFunction();

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      wrapOpenFunction();
      if (openWrapped || tries >= 30) window.clearInterval(timer);
    }, 100);

    scheduleRefresh(120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
