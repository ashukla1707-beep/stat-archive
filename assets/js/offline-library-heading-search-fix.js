/* Stat Archive — Offline Library heading/search visual match */
(() => {
  "use strict";

  function installStyle() {
    if (document.getElementById("saOfflineHeadingSearchFixStyle")) return;

    const style = document.createElement("style");
    style.id = "saOfflineHeadingSearchFixStyle";
    style.textContent = `
#offlineLibraryOverlay .sa-offline-head{
  padding:34px 28px 14px !important;
}

#offlineLibraryOverlay .sa-offline-title-row{
  align-items:flex-start !important;
  gap:20px !important;
}

#offlineLibraryOverlay .sa-offline-title{
  margin:0 !important;
  font-family:'JetBrains Mono',monospace !important;
  font-size:clamp(42px,6vw,58px) !important;
  font-weight:700 !important;
  line-height:1.04 !important;
  letter-spacing:.015em !important;
}

#offlineLibraryOverlay .sa-offline-subtitle{
  max-width:720px !important;
  margin:22px 0 0 !important;
  font-size:16px !important;
  font-weight:500 !important;
  line-height:1.65 !important;
  color:#8f9aae !important;
}

#offlineLibraryOverlay .sa-offline-head-actions{
  padding-top:3px !important;
}

#offlineLibraryOverlay .sa-offline-icon-btn{
  width:44px !important;
  height:44px !important;
  font-size:28px !important;
}

#offlineLibraryOverlay .sa-offline-tabs{
  margin-top:28px !important;
}

/* Search and subject are separate controls. Search deliberately mirrors the
   older Offline Library search style the user selected. */
#offlineLibraryOverlay .sa-offline-filterbar{
  display:grid !important;
  grid-template-columns:1fr !important;
  gap:12px !important;
  margin-top:22px !important;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
}

#offlineLibraryOverlay .sa-offline-search{
  width:100% !important;
  height:72px !important;
  display:grid !important;
  grid-template-columns:34px minmax(0,1fr) !important;
  align-items:center !important;
  gap:14px !important;
  padding:0 20px !important;
  border:1px solid rgba(148,163,184,.20) !important;
  border-radius:21px !important;
  background:rgba(255,255,255,.018) !important;
  color:#8f9aae !important;
}

#offlineLibraryOverlay .sa-offline-search span{
  display:grid !important;
  place-items:center !important;
  width:28px !important;
  font-size:22px !important;
  line-height:1 !important;
  color:#8f9aae !important;
}

#offlineLibraryOverlay .sa-offline-search input{
  width:100% !important;
  height:100% !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  outline:0 !important;
  background:transparent !important;
  color:#f4f7fb !important;
  font:500 16px/1.2 Inter,sans-serif !important;
}

#offlineLibraryOverlay .sa-offline-search input::placeholder{
  color:#68768a !important;
  opacity:1 !important;
}

#offlineLibraryOverlay #offlineSubjectSelect{
  width:100% !important;
  height:54px !important;
  margin:0 !important;
  border-radius:15px !important;
  padding:0 42px 0 16px !important;
  font-size:13px !important;
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

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-head{
    padding:30px 20px 13px !important;
  }

  #offlineLibraryOverlay .sa-offline-title{
    font-size:clamp(36px,10vw,46px) !important;
    line-height:1.04 !important;
  }

  #offlineLibraryOverlay .sa-offline-subtitle{
    margin-top:20px !important;
    font-size:15px !important;
    line-height:1.62 !important;
  }

  #offlineLibraryOverlay .sa-offline-tabs{
    margin-top:26px !important;
  }

  #offlineLibraryOverlay .sa-offline-filterbar{
    gap:11px !important;
    margin-top:20px !important;
  }

  #offlineLibraryOverlay .sa-offline-search{
    height:68px !important;
    grid-template-columns:30px minmax(0,1fr) !important;
    gap:12px !important;
    padding:0 17px !important;
    border-radius:20px !important;
  }

  #offlineLibraryOverlay .sa-offline-search span{
    width:25px !important;
    font-size:21px !important;
  }

  #offlineLibraryOverlay .sa-offline-search input{
    font-size:15px !important;
  }

  #offlineLibraryOverlay #offlineSubjectSelect{
    height:52px !important;
    border-radius:15px !important;
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
  }

  function installObserver() {
    syncShell();
    if (document.documentElement.dataset.saOfflineHeadingSearchObserver === "1") return;
    document.documentElement.dataset.saOfflineHeadingSearchObserver = "1";

    const observer = new MutationObserver(() => syncShell());
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
