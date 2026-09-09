/* Stat Archive — Offline Library presentation refinement v5
   Event-driven only. No MutationObserver. */
(() => {
  "use strict";

  const STUDY_LINE_1 = "Your study vault. Saved files stay on this device";
  const STUDY_LINE_2 = "and can be opened without internet.";

  let refreshTimer = 0;
  let refreshing = false;
  let openWrapped = false;
  let renderWrapped = false;
  let expandedSubject = "";

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

    const source = [record?.title, record?.filename, record?.name]
      .filter(Boolean)
      .join(" ");
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

    title = title
      .replace(/\s*[:\-–—]?\s*(?:19|20)\d{2}\s*$/i, "")
      .trim();

    if (!title || normalized(title) === normalized(type)) return "";
    return title;
  }

  function installStyle() {
    document.getElementById("saOfflineEntryFormatStyle")?.remove();

    const style = document.createElement("style");
    style.id = "saOfflineEntryFormatStyle";
    style.textContent = `
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
  margin:10px 0 0 !important;
  font:500 12px/1.42 Inter,sans-serif !important;
  letter-spacing:0 !important;
}
#offlineLibraryOverlay .sa-study-line{display:inline;}
#offlineLibraryOverlay .sa-study-line + .sa-study-line::before{content:" ";}

#offlineLibraryOverlay .sa-offline-filterbar{
  gap:7px !important;
  margin-top:13px !important;
}
#offlineLibraryOverlay .sa-offline-search,
#offlineLibraryOverlay #offlineSubjectSelect{
  height:46px !important;
  border-radius:13px !important;
}
#offlineLibraryOverlay .sa-offline-search{
  padding:0 13px !important;
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

/* Continue studying cards: equal width, natural content height.
   JS equalizes all visible cards to only the tallest content. */
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
#offlineLibraryOverlay .sa-recent-title.is-empty{
  display:none !important;
}
#offlineLibraryOverlay .sa-recent-year{
  display:block;
  margin-top:4px;
  color:#7f8da1;
  font:600 8.9px/1.15 'JetBrains Mono',monospace;
}
#offlineLibraryOverlay .sa-recent-year:empty{
  display:none !important;
}

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

body[data-theme="light"] #offlineLibraryOverlay .sa-recent-subject,
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-file-title{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-title{
  color:#4b514e !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-type,
body[data-theme="light"] #offlineLibraryOverlay .sa-recent-year{
  color:#817d77 !important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSubjectSelect{
  background-color:#fff !important;
}

@media(max-width:700px){
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

  #offlineLibraryOverlay .sa-offline-head{padding-bottom:7px !important;}
  #offlineLibraryOverlay .sa-offline-title{padding-right:78px !important;}
  #offlineLibraryOverlay .sa-offline-subtitle{
    margin-top:9px !important;
    font-size:10.8px !important;
    line-height:1.35 !important;
  }
  #offlineLibraryOverlay .sa-study-line{
    display:block !important;
    white-space:nowrap !important;
  }
  #offlineLibraryOverlay .sa-study-line + .sa-study-line::before{content:"" !important;}

  #offlineLibraryOverlay .sa-offline-filterbar{
    gap:7px !important;
    margin-top:12px !important;
  }
  #offlineLibraryOverlay .sa-offline-search,
  #offlineLibraryOverlay #offlineSubjectSelect{
    height:45px !important;
  }
  #offlineLibraryOverlay #offlineSubjectSelect{
    background-position:right 15px center !important;
  }

  #offlineLibraryOverlay .sa-offline-scroll{padding-top:0 !important;}
  #offlineLibraryOverlay .sa-offline-section{margin-top:17px !important;}
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

  function formatSubtitle() {
    const subtitle = document.getElementById("saOfflineSummary");
    if (!subtitle) return;
    subtitle.innerHTML = `<span class="sa-study-line">${STUDY_LINE_1}</span><span class="sa-study-line">${STUDY_LINE_2}</span>`;
  }

  function metaOf(record) {
    const type = typeOf(record);
    const year = yearOf(record);
    return year ? `${type} · ${year}` : type;
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
    card.querySelector(".sa-recent-title").textContent = title || "";
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
    const available = new Set(groups.map(group => group.dataset.saSubject || ""));
    if (expandedSubject && !available.has(expandedSubject)) expandedSubject = "";

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
    if (!overlay || overlay.style.display === "none") return;
    if (typeof getOfflineFiles !== "function") return;

    refreshing = true;
    try {
      const records = await getOfflineFiles();
      const map = new Map((records || []).map(record => [String(record.id), record]));

      formatSubtitle();

      overlay.querySelectorAll(".sa-offline-shelf-card[data-sa-open-id]").forEach(card => {
        const record = map.get(String(card.dataset.saOpenId || ""));
        if (record) formatShelfCard(card, record);
      });

      requestAnimationFrame(equalizeShelfCards);

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

      applyAccordionState();
    } catch (_) {
      /* Presentation must never block the Offline Library. */
    } finally {
      refreshing = false;
    }
  }

  function scheduleRefresh(delay = 0) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      requestAnimationFrame(() => void refreshPresentation());
    }, delay);
  }

  function wrapFunctions() {
    if (!openWrapped && typeof window.openOfflineLibrary === "function") {
      const originalOpen = window.openOfflineLibrary;
      if (!originalOpen.__saEntryFormatV5Wrapped) {
        const wrappedOpen = function(...args) {
          expandedSubject = "";
          const result = originalOpen.apply(this, args);
          scheduleRefresh(0);
          scheduleRefresh(60);
          scheduleRefresh(220);
          return result;
        };
        wrappedOpen.__saEntryFormatV5Wrapped = true;
        window.openOfflineLibrary = wrappedOpen;
        try { openOfflineLibrary = wrappedOpen; } catch (_) {}
      }
      openWrapped = true;
    }

    if (!renderWrapped && typeof window.renderOfflineLibrary === "function") {
      const originalRender = window.renderOfflineLibrary;
      if (!originalRender.__saEntryFormatV5Wrapped) {
        const wrappedRender = function(...args) {
          const result = originalRender.apply(this, args);
          Promise.resolve(result).finally(() => scheduleRefresh(0));
          return result;
        };
        wrappedRender.__saEntryFormatV5Wrapped = true;
        window.renderOfflineLibrary = wrappedRender;
        try { renderOfflineLibrary = wrappedRender; } catch (_) {}
      }
      renderWrapped = true;
    }
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest("#offlineLibraryOverlay [data-sa-toggle-subject]");
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();
        expandedSubject = expandedSubject === (toggle.dataset.saToggleSubject || "")
          ? ""
          : (toggle.dataset.saToggleSubject || "");
        applyAccordionState();
        return;
      }

      if (target.closest("#offlineLibraryOverlay [data-sa-pin-id], #offlineLibraryOverlay [data-sa-delete-id], #offlineLibraryOverlay [data-sa-open-id]")) {
        scheduleRefresh(80);
        scheduleRefresh(240);
      }
    }, true);

    document.addEventListener("input", event => {
      if (event.target?.id === "offlineSearchInput") {
        expandedSubject = "";
        scheduleRefresh(45);
      }
    }, true);

    document.addEventListener("change", event => {
      if (event.target?.id === "offlineSubjectSelect") {
        expandedSubject = "";
        scheduleRefresh(45);
      }
    }, true);

    window.addEventListener("resize", () => scheduleRefresh(80), { passive:true });
  }

  function install() {
    installStyle();
    bindEvents();
    wrapFunctions();

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
