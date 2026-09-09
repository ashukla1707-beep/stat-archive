/* Stat Archive — Offline Library shell polish v11
   Header alignment + pinned-files utility. No additional open wrapper. */
(() => {
  "use strict";

  const RECENT_KEY = "statArchiveOfflineRecentlyOpened";
  let pinnedEventsBound = false;

  function installStableOverrides() {
    document.getElementById("saOfflineStableShellOverrides")?.remove();
    const style = document.createElement("style");
    style.id = "saOfflineStableShellOverrides";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-title{
  font-family:'JetBrains Mono',monospace !important;
  font-size:clamp(34px,5.2vw,46px) !important;
  font-weight:700 !important;
  line-height:1.05 !important;
  letter-spacing:.01em !important;
}
#offlineLibraryOverlay .sa-offline-search{
  display:grid !important;
  grid-template-columns:22px minmax(0,1fr) !important;
  align-items:center !important;
  column-gap:7px !important;
  padding:0 13px !important;
}
#offlineLibraryOverlay .sa-offline-search > span{
  width:22px !important;min-width:22px !important;margin:0 !important;padding:0 !important;
  display:grid !important;place-items:center !important;
}
#offlineLibraryOverlay #offlineSearchInput,
#offlineLibraryOverlay #offlineSearchInput:hover,
#offlineLibraryOverlay #offlineSearchInput:focus,
#offlineLibraryOverlay #offlineSearchInput:focus-visible,
#offlineLibraryOverlay #offlineSearchInput:active{
  width:100% !important;min-width:0 !important;height:100% !important;
  margin:0 !important;padding:0 !important;text-indent:0 !important;
  border:0 !important;border-radius:0 !important;outline:0 !important;box-shadow:none !important;
  background:transparent !important;font:500 14px/1.2 Inter,sans-serif !important;
  appearance:none !important;-webkit-appearance:none !important;
}
#offlineLibraryOverlay .sa-offline-section:nth-of-type(2) .sa-offline-section-head > span{display:none !important;}

#offlineLibraryOverlay .sa-pinned-panel{display:none;}
#offlineLibraryOverlay .sa-pinned-panel.show{display:block;}
#offlineLibraryOverlay .sa-pinned-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 8px 10px;}
#offlineLibraryOverlay .sa-pinned-panel-head strong{font:800 14px Inter,sans-serif;}
#offlineLibraryOverlay .sa-pinned-list{display:grid;gap:8px;max-height:min(55vh,420px);overflow:auto;padding:0 2px 4px;}
#offlineLibraryOverlay .sa-pinned-row{border:1px solid rgba(148,163,184,.17);border-radius:12px;padding:10px;background:rgba(255,255,255,.018);}
#offlineLibraryOverlay .sa-pinned-title{font:750 11.5px/1.35 Inter,sans-serif;color:#eef4fa;overflow-wrap:anywhere;}
#offlineLibraryOverlay .sa-pinned-meta{margin-top:3px;font:500 9.5px/1.3 Inter,sans-serif;color:#8794a6;}
#offlineLibraryOverlay .sa-pinned-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px;}
#offlineLibraryOverlay .sa-pinned-actions button{padding:9px 8px !important;text-align:center !important;border:1px solid rgba(148,163,184,.18) !important;}
#offlineLibraryOverlay .sa-pinned-empty{padding:18px 10px;color:#8794a6;font:500 11px/1.5 Inter,sans-serif;text-align:center;}
body[data-theme="light"] #offlineLibraryOverlay .sa-pinned-title{color:#27302d !important;}
body[data-theme="light"] #offlineLibraryOverlay .sa-pinned-row{background:rgba(255,255,255,.45);border-color:rgba(75,54,95,.13);}

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-head{padding-left:12px !important;padding-right:12px !important;}
  #offlineLibraryOverlay .sa-offline-title-row{
    display:grid !important;
    grid-template-columns:minmax(0,1fr) 50px !important;
    column-gap:2px !important;
    align-items:center !important;
    position:relative !important;
    width:100% !important;
    min-height:42px !important;
    overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-title-row > div:first-child{
    display:block !important;min-width:0 !important;width:100% !important;
    padding:0 !important;margin:0 !important;overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-title{
    display:block !important;width:auto !important;max-width:100% !important;
    margin:0 !important;padding:0 !important;
    font-size:34px !important;line-height:1.04 !important;letter-spacing:-1.2px !important;
    white-space:nowrap !important;transform:none !important;overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-head-actions{
    position:static !important;inset:auto !important;
    width:50px !important;height:36px !important;
    display:grid !important;grid-template-columns:24px 26px !important;gap:0 !important;
    align-items:center !important;justify-content:end !important;justify-self:end !important;
    padding:0 !important;margin:0 !important;pointer-events:auto !important;z-index:5 !important;
  }
  #offlineLibraryOverlay .sa-offline-icon-btn,
  #offlineLibraryOverlay #saOfflineMenuBtn,
  #offlineLibraryOverlay #closeOfflineLibraryBtn{
    position:static !important;top:auto !important;left:auto !important;right:auto !important;
    transform:none !important;margin:0 !important;padding:0 !important;
    height:36px !important;min-width:0 !important;
    font-size:22px !important;line-height:1 !important;
    display:grid !important;place-items:center !important;
    opacity:1 !important;visibility:visible !important;pointer-events:auto !important;z-index:6 !important;
  }
  #offlineLibraryOverlay #saOfflineMenuBtn{grid-column:1 !important;width:24px !important;}
  #offlineLibraryOverlay #closeOfflineLibraryBtn{grid-column:2 !important;width:26px !important;}

  #offlineLibraryOverlay .sa-offline-search{
    grid-template-columns:21px minmax(0,1fr) !important;
    column-gap:6px !important;padding:0 12px !important;
  }
  #offlineLibraryOverlay .sa-offline-search > span{width:21px !important;min-width:21px !important;}
  #offlineLibraryOverlay #offlineSearchInput{font-size:13.5px !important;}
}
`;
    document.head.appendChild(style);
  }

  function syncSearchCopy() {
    const input = document.getElementById("offlineSearchInput");
    if (!input) return false;
    input.placeholder = "Search saved files, subjects, year...";
    input.setAttribute("aria-label", "Search saved files, subjects, year");
    return true;
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
  function isPinned(record) {
    try { if (typeof offlinePinned === "function") return !!offlinePinned(record); } catch (_) {}
    return record?.pinned === true;
  }

  function ensurePinnedSection() {
    const card = document.querySelector("#offlineLibraryOverlay .sa-offline-utility-card");
    const clear = document.getElementById("clearOfflineLibraryBtn");
    const cancel = document.getElementById("saOfflineUtilityClose");
    if (!card || !clear || !cancel) return false;

    document.getElementById("saOfflineStorageBtn")?.remove();

    let pinnedBtn = document.getElementById("saOfflinePinnedBtn");
    if (!pinnedBtn) {
      pinnedBtn = document.createElement("button");
      pinnedBtn.type = "button";
      pinnedBtn.id = "saOfflinePinnedBtn";
      pinnedBtn.textContent = "Pinned files";
      card.insertBefore(pinnedBtn, clear);
    }

    if (!document.getElementById("saOfflinePinnedPanel")) {
      const panel = document.createElement("div");
      panel.id = "saOfflinePinnedPanel";
      panel.className = "sa-pinned-panel";
      panel.innerHTML = `
        <div class="sa-pinned-panel-head">
          <strong>Pinned files</strong>
          <button type="button" id="saOfflinePinnedBack">Back</button>
        </div>
        <div class="sa-pinned-list" id="saOfflinePinnedList"></div>`;
      card.appendChild(panel);
    }

    void refreshPinnedCount();
    return true;
  }

  async function getPinnedRecords() {
    if (typeof getOfflineFiles !== "function") return [];
    try {
      const records = await getOfflineFiles();
      return (records || []).filter(isPinned);
    } catch (_) {
      return [];
    }
  }

  async function refreshPinnedCount() {
    const button = document.getElementById("saOfflinePinnedBtn");
    if (!button) return;
    const pinned = await getPinnedRecords();
    button.textContent = pinned.length ? `Pinned files (${pinned.length})` : "Pinned files";
  }

  async function renderPinnedPanel() {
    const list = document.getElementById("saOfflinePinnedList");
    if (!list) return;
    const pinned = await getPinnedRecords();
    const button = document.getElementById("saOfflinePinnedBtn");
    if (button) button.textContent = pinned.length ? `Pinned files (${pinned.length})` : "Pinned files";

    if (!pinned.length) {
      list.innerHTML = `<div class="sa-pinned-empty">No pinned files yet. Tap ☆ beside an entry to pin it.</div>`;
      return;
    }

    list.innerHTML = "";
    pinned.forEach(record => {
      const row = document.createElement("div");
      row.className = "sa-pinned-row";
      row.dataset.saPinnedRow = String(record.id);

      const title = document.createElement("div");
      title.className = "sa-pinned-title";
      title.textContent = titleOf(record);

      const meta = document.createElement("div");
      meta.className = "sa-pinned-meta";
      meta.textContent = [subjectOf(record), typeOf(record), yearOf(record)].filter(Boolean).join(" · ");

      const actions = document.createElement("div");
      actions.className = "sa-pinned-actions";
      const open = document.createElement("button");
      open.type = "button";
      open.dataset.saPinnedOpen = String(record.id);
      open.textContent = "Open";
      const unpin = document.createElement("button");
      unpin.type = "button";
      unpin.dataset.saPinnedUnpin = String(record.id);
      unpin.textContent = "Unpin";
      actions.append(open, unpin);
      row.append(title, meta, actions);
      list.appendChild(row);
    });
  }

  function setPinnedPanelOpen(open) {
    ensurePinnedSection();
    const card = document.querySelector("#offlineLibraryOverlay .sa-offline-utility-card");
    const panel = document.getElementById("saOfflinePinnedPanel");
    if (!card || !panel) return;
    [...card.children].forEach(child => {
      if (child !== panel) child.style.display = open ? "none" : "";
    });
    panel.classList.toggle("show", open);
    if (open) void renderPinnedPanel();
  }

  function rememberRecent(id) {
    try {
      const map = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
      map[String(id)] = Date.now();
      localStorage.setItem(RECENT_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  async function openPinned(id) {
    rememberRecent(id);
    try { if (typeof openOfflineFile === "function") await openOfflineFile(id); } catch (_) {}
  }

  async function unpin(id) {
    try {
      if (typeof getOfflineFile !== "function" || typeof putOfflineFile !== "function") return;
      const record = await getOfflineFile(id);
      if (!record) return;
      record.pinned = false;
      await putOfflineFile(record);
      document.querySelectorAll(`#offlineLibraryOverlay [data-sa-pin-id="${CSS.escape(String(id))}"]`).forEach(button => {
        button.classList.remove("is-pinned");
        button.textContent = "☆";
        button.setAttribute("aria-label", "Pin");
        button.closest(".sa-offline-file")?.classList.remove("is-pinned");
      });
      await renderPinnedPanel();
    } catch (_) {}
  }

  function bindPinnedEvents() {
    if (pinnedEventsBound) return;
    pinnedEventsBound = true;
    document.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest("#saOfflineMenuBtn")) {
        window.setTimeout(() => {
          ensurePinnedSection();
          void refreshPinnedCount();
        }, 0);
        return;
      }
      if (target.closest("#saOfflinePinnedBtn")) {
        event.preventDefault();
        event.stopPropagation();
        setPinnedPanelOpen(true);
        return;
      }
      if (target.closest("#saOfflinePinnedBack")) {
        event.preventDefault();
        event.stopPropagation();
        setPinnedPanelOpen(false);
        return;
      }

      const open = target.closest("#saOfflinePinnedPanel [data-sa-pinned-open]");
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        void openPinned(open.dataset.saPinnedOpen || "");
        return;
      }
      const unpinBtn = target.closest("#saOfflinePinnedPanel [data-sa-pinned-unpin]");
      if (unpinBtn) {
        event.preventDefault();
        event.stopPropagation();
        void unpin(unpinBtn.dataset.saPinnedUnpin || "");
      }
    }, true);
  }

  function loadStableFormatter() {
    const existing = document.querySelector('script[data-sa-offline-entry-format="1"]');
    if (existing) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        installStableOverrides();
        ensurePinnedSection();
      }));
      return;
    }
    const script = document.createElement("script");
    script.src = "./assets/js/offline-library-entry-format.js?v=20260909-9";
    script.async = false;
    script.dataset.saOfflineEntryFormat = "1";
    script.addEventListener("load", () => {
      requestAnimationFrame(() => {
        installStableOverrides();
        ensurePinnedSection();
      });
    }, { once:true });
    document.body.appendChild(script);
  }

  function install() {
    installStableOverrides();
    bindPinnedEvents();
    loadStableFormatter();

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const foundSearch = syncSearchCopy();
      const foundPinned = ensurePinnedSection();
      installStableOverrides();
      if ((foundSearch && foundPinned) || tries >= 40) window.clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();