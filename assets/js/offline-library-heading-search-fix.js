/* Stat Archive — Offline Library compact header/search refinement v3 */
(() => {
  "use strict";

  function installStyle() {
    const old = document.getElementById("saOfflineHeadingSearchFixStyle");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "saOfflineHeadingSearchFixStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-head{
  position:relative !important;
  padding:28px 26px 13px !important;
}

/* Title stays on one line; utility controls are pinned to the real top-right. */
#offlineLibraryOverlay .sa-offline-title-row{
  display:block !important;
}

#offlineLibraryOverlay .sa-offline-title-row > div:first-child{
  min-width:0 !important;
  padding-right:88px !important;
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
  position:absolute !important;
  top:24px !important;
  right:22px !important;
  z-index:3 !important;
  display:flex !important;
  align-items:center !important;
  gap:2px !important;
  padding:0 !important;
  margin:0 !important;
}

#offlineLibraryOverlay .sa-offline-icon-btn{
  width:38px !important;
  height:38px !important;
  font-size:25px !important;
}

#offlineLibraryOverlay .sa-offline-subtitle{
  max-width:720px !important;
  margin:18px 0 0 !important;
  color:#8f9aae !important;
  font:500 14px/1.58 Inter,sans-serif !important;
}

/* File-type pills remain removed. */
#offlineLibraryOverlay .sa-offline-tabs{
  display:none !important;
}

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
  outline:0 !important;
  box-shadow:none !important;
}

/* Do not draw a second inner focus box when the search field is tapped. */
#offlineLibraryOverlay .sa-offline-search:focus,
#offlineLibraryOverlay .sa-offline-search:focus-within{
  outline:0 !important;
  box-shadow:none !important;
}

#offlineLibraryOverlay .sa-offline-search span{
  width:24px !important;
  display:grid !important;
  place-items:center !important;
  color:#8f9aae !important;
  font-size:19px !important;
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
  border:0 !important;
  border-radius:0 !important;
  outline:0 !important;
  box-shadow:none !important;
  background:transparent !important;
  color:#f4f7fb !important;
  font:500 14px/1.2 Inter,sans-serif !important;
  appearance:none !important;
  -webkit-appearance:none !important;
}

#offlineLibraryOverlay #offlineSearchInput::-webkit-search-decoration,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-cancel-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-button,
#offlineLibraryOverlay #offlineSearchInput::-webkit-search-results-decoration{
  -webkit-appearance:none !important;
}

#offlineLibraryOverlay #offlineSearchInput::placeholder{
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

/* Keep Continue studying, but remove the redundant right-side label. */
#offlineLibraryOverlay #saOfflineContinueLabel{
  display:none !important;
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
body[data-theme="light"] #offlineLibraryOverlay #offlineSearchInput{
  color:#27302d !important;
}
body[data-theme="light"] #offlineLibraryOverlay #offlineSearchInput::placeholder{
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

  #offlineLibraryOverlay .sa-offline-title-row > div:first-child{
    padding-right:78px !important;
  }

  #offlineLibraryOverlay .sa-offline-title{
    font-size:clamp(25px,7.2vw,31px) !important;
    line-height:1.05 !important;
    letter-spacing:0 !important;
  }

  #offlineLibraryOverlay .sa-offline-head-actions{
    top:20px !important;
    right:14px !important;
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

  #offlineLibraryOverlay #offlineSearchInput,
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
      input.style.boxShadow = "none";
      input.style.outline = "none";
    }

    const recentLabel = document.getElementById("saOfflineContinueLabel");
    if (recentLabel) recentLabel.textContent = "";

    /* Type pills are removed, so always keep the hidden state on All. */
    const allTab = document.querySelector('#saOfflineTypeTabs [data-sa-offline-type="All"]');
    if (allTab && !allTab.classList.contains("active")) allTab.click();
  }

  function installObserver() {
    syncShell();
    if (document.documentElement.dataset.saOfflineHeadingSearchObserverV3 === "1") return;
    document.documentElement.dataset.saOfflineHeadingSearchObserverV3 = "1";
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
