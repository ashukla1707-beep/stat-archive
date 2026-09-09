/* Stat Archive — Offline Library compact header/search refinement */
(() => {
  "use strict";

  function installStyle() {
    const old = document.getElementById("saOfflineHeadingSearchFixStyle");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "saOfflineHeadingSearchFixStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-head{
  padding:28px 26px 13px !important;
}

/* Keep title + menu + close on ONE row. */
#offlineLibraryOverlay .sa-offline-title-row{
  display:flex !important;
  align-items:flex-start !important;
  justify-content:space-between !important;
  gap:12px !important;
}

#offlineLibraryOverlay .sa-offline-title-row > div:first-child{
  min-width:0 !important;
  flex:1 1 auto !important;
}

#offlineLibraryOverlay .sa-offline-title{
  margin:0 !important;
  white-space:nowrap !important;
  font-family:'JetBrains Mono',monospace !important;
  font-size:clamp(30px,4.8vw,44px) !important;
  font-weight:700 !important;
  line-height:1.05 !important;
  letter-spacing:.012em !important;
  color:#f4f7fb !important;
}

#offlineLibraryOverlay .sa-offline-head-actions{
  flex:0 0 auto !important;
  display:flex !important;
  align-items:center !important;
  gap:3px !important;
  padding-top:0 !important;
}

#offlineLibraryOverlay .sa-offline-icon-btn{
  width:38px !important;
  height:38px !important;
  font-size:25px !important;
}

/* Study-vault sentence stays immediately below the title row. */
#offlineLibraryOverlay .sa-offline-subtitle{
  max-width:720px !important;
  margin:18px 0 0 !important;
  color:#8f9aae !important;
  font:500 14px/1.58 Inter,sans-serif !important;
}

/* Remove file-type pills completely. Subject selector is enough. */
#offlineLibraryOverlay .sa-offline-tabs{
  display:none !important;
}

/* Normal controls: search and subject have the same visual weight. */
#offlineLibraryOverlay .sa-offline-filterbar{
  display:grid !important;
  grid-template-columns:1fr !important;
  gap:10px !important;
  margin-top:20px !important;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
}

#offlineLibraryOverlay .sa-offline-search{
  width:100% !important;
  height:52px !important;
  display:grid !important;
  grid-template-columns:26px minmax(0,1fr) !important;
  align-items:center !important;
  gap:10px !important;
  padding:0 15px !important;
  border:1px solid rgba(148,163,184,.20) !important;
  border-radius:15px !important;
  background:rgba(255,255,255,.018) !important;
  color:#8f9aae !important;
}

#offlineLibraryOverlay .sa-offline-search span{
  width:24px !important;
  display:grid !important;
  place-items:center !important;
  color:#8f9aae !important;
  font-size:19px !important;
  line-height:1 !important;
}

#offlineLibraryOverlay .sa-offline-search input{
  width:100% !important;
  min-width:0 !important;
  height:100% !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  outline:0 !important;
  background:transparent !important;
  color:#f4f7fb !important;
  font:500 14px/1.2 Inter,sans-serif !important;
}

#offlineLibraryOverlay .sa-offline-search input::placeholder{
  color:#68768a !important;
  opacity:1 !important;
}

#offlineLibraryOverlay #offlineSubjectSelect{
  width:100% !important;
  height:52px !important;
  margin:0 !important;
  padding:0 42px 0 15px !important;
  border:1px solid rgba(148,163,184,.20) !important;
  border-radius:15px !important;
  background:#0e1620 !important;
  color:#edf3f8 !important;
  font:600 14px/1 Inter,sans-serif !important;
}

body[data-theme="light"] #offlineLibraryOverlay .sa-offline-title{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-subtitle{
  color:#817d77 !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-search{
  background:rgba(255,255,255,.72) !important;
  border-color:rgba(75,54,95,.14) !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-search input{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay .sa-offline-search input::placeholder{
  color:#8a8580 !important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSubjectSelect{
  background:#fff !important;
  color:#27302d !important;
  border-color:rgba(75,54,95,.16) !important;
}

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-head{
    padding:24px 18px 11px !important;
  }

  #offlineLibraryOverlay .sa-offline-title-row{
    gap:7px !important;
    align-items:center !important;
  }

  #offlineLibraryOverlay .sa-offline-title{
    font-size:clamp(25px,7.2vw,31px) !important;
    line-height:1.05 !important;
    letter-spacing:0 !important;
  }

  #offlineLibraryOverlay .sa-offline-head-actions{
    gap:0 !important;
  }

  #offlineLibraryOverlay .sa-offline-icon-btn{
    width:34px !important;
    height:34px !important;
    font-size:23px !important;
  }

  #offlineLibraryOverlay .sa-offline-subtitle{
    margin-top:17px !important;
    font-size:13.5px !important;
    line-height:1.55 !important;
  }

  #offlineLibraryOverlay .sa-offline-filterbar{
    gap:9px !important;
    margin-top:18px !important;
  }

  #offlineLibraryOverlay .sa-offline-search,
  #offlineLibraryOverlay #offlineSubjectSelect{
    height:50px !important;
    border-radius:14px !important;
  }

  #offlineLibraryOverlay .sa-offline-search{
    grid-template-columns:24px minmax(0,1fr) !important;
    gap:9px !important;
    padding:0 14px !important;
  }

  #offlineLibraryOverlay .sa-offline-search span{
    width:22px !important;
    font-size:18px !important;
  }

  #offlineLibraryOverlay .sa-offline-search input,
  #offlineLibraryOverlay #offlineSubjectSelect{
    font-size:13.5px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function syncShell() {
    const input = document.getElementById("offlineSearchInput");
    if (input) {
      input.placeholder = "Search saved files, subjects, year...";
      input.setAttribute("aria-label", "Search saved files, subjects, year");
    }

    /* Also force the type-filter state back to All because the pills are removed. */
    const allTab = document.querySelector('#saOfflineTypeTabs [data-sa-offline-type="All"]');
    if (allTab && !allTab.classList.contains("active")) allTab.click();
  }

  function installObserver() {
    syncShell();
    if (document.documentElement.dataset.saOfflineHeadingSearchObserverV2 === "1") return;
    document.documentElement.dataset.saOfflineHeadingSearchObserverV2 = "1";
    const observer = new MutationObserver(syncShell);
    observer.observe(document.body || document.documentElement, { childList:true, subtree:true });
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
