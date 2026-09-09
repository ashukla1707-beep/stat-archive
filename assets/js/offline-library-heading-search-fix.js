/* Stat Archive — Offline Library stable loader v9
   No MutationObserver. Keeps stable CSS, search copy and formatter loader. */
(() => {
  "use strict";

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
  width:22px !important;
  min-width:22px !important;
  margin:0 !important;
  padding:0 !important;
  display:grid !important;
  place-items:center !important;
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
  font:500 14px/1.2 Inter,sans-serif !important;
  appearance:none !important;
  -webkit-appearance:none !important;
}

/* Remove the helper copy beside Your subjects. */
#offlineLibraryOverlay .sa-offline-section:nth-of-type(2) .sa-offline-section-head > span{
  display:none !important;
}

@media(max-width:700px){
  #offlineLibraryOverlay .sa-offline-head{
    padding-left:12px !important;
    padding-right:12px !important;
  }

  /* Mobile header: large title + fixed action area. */
  #offlineLibraryOverlay .sa-offline-title-row{
    display:grid !important;
    grid-template-columns:minmax(0,1fr) 68px !important;
    column-gap:6px !important;
    align-items:center !important;
    position:relative !important;
    width:100% !important;
    min-height:42px !important;
    overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-title-row > div:first-child{
    display:block !important;
    min-width:0 !important;
    width:100% !important;
    padding:0 !important;
    margin:0 !important;
    overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-title{
    display:inline-block !important;
    width:max-content !important;
    max-width:none !important;
    margin:0 !important;
    padding:0 !important;
    font-size:34px !important;
    line-height:1.04 !important;
    letter-spacing:-.55px !important;
    white-space:nowrap !important;
    transform:scaleX(.84) !important;
    transform-origin:left center !important;
    overflow:visible !important;
  }
  #offlineLibraryOverlay .sa-offline-head-actions{
    position:static !important;
    inset:auto !important;
    width:68px !important;
    height:auto !important;
    display:grid !important;
    grid-template-columns:30px 30px !important;
    gap:4px !important;
    align-items:center !important;
    justify-content:end !important;
    padding:0 !important;
    margin:0 !important;
    pointer-events:auto !important;
    z-index:5 !important;
  }
  #offlineLibraryOverlay .sa-offline-icon-btn,
  #offlineLibraryOverlay #saOfflineMenuBtn,
  #offlineLibraryOverlay #closeOfflineLibraryBtn{
    position:static !important;
    top:auto !important;
    left:auto !important;
    right:auto !important;
    transform:none !important;
    width:30px !important;
    min-width:30px !important;
    height:34px !important;
    margin:0 !important;
    padding:0 !important;
    font-size:22px !important;
    line-height:1 !important;
    display:grid !important;
    place-items:center !important;
    opacity:1 !important;
    visibility:visible !important;
    pointer-events:auto !important;
    z-index:6 !important;
  }
  #offlineLibraryOverlay #saOfflineMenuBtn{
    grid-column:1 !important;
  }
  #offlineLibraryOverlay #closeOfflineLibraryBtn{
    grid-column:2 !important;
  }

  #offlineLibraryOverlay .sa-offline-search{
    grid-template-columns:21px minmax(0,1fr) !important;
    column-gap:6px !important;
    padding:0 12px !important;
  }
  #offlineLibraryOverlay .sa-offline-search > span{
    width:21px !important;
    min-width:21px !important;
  }
  #offlineLibraryOverlay #offlineSearchInput{
    font-size:13.5px !important;
  }
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

  function loadStableFormatter() {
    const existing = document.querySelector('script[data-sa-offline-entry-format="1"]');
    if (existing) {
      requestAnimationFrame(() => requestAnimationFrame(installStableOverrides));
      return;
    }

    const script = document.createElement("script");
    script.src = "./assets/js/offline-library-entry-format.js?v=20260909-5";
    script.async = false;
    script.dataset.saOfflineEntryFormat = "1";
    script.addEventListener("load", () => {
      requestAnimationFrame(() => installStableOverrides());
    }, { once:true });
    document.body.appendChild(script);
  }

  function install() {
    installStableOverrides();
    loadStableFormatter();
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const found = syncSearchCopy();
      if (found) installStableOverrides();
      if (found || tries >= 30) window.clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
