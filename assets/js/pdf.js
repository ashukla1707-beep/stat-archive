(function(){
  "use strict";

  /* =========================================================
     SERVICE-WORKER TAKEOVER GUARD

     service-worker-register.js historically reloads the whole page on every
     controllerchange. During an app update that makes the hero graph begin,
     then the new worker takes control, the page reloads, and the graph begins
     again. Keep worker updates enabled but suppress only that forced reload
     listener so the visible app is not restarted under the user.
     ========================================================= */
  try{
    const sw=navigator.serviceWorker;
    if(sw && !sw.__statArchiveControllerChangeGuard){
      sw.__statArchiveControllerChangeGuard=true;
      const nativeAdd=sw.addEventListener.bind(sw);
      sw.addEventListener=function(type,listener,options){
        if(type==="controllerchange") return;
        return nativeAdd(type,listener,options);
      };
    }
  }catch(e){}

  /* Preview highlight is session-only.
     archive-ui.js already keeps previewedEntryIds in memory and applies
     .is-previewed after a preview click. We only prevent that state from
     surviving a fresh app launch by clearing its localStorage copy.
     Result:
       - close Preview -> teal stays
       - keep using the same app session -> teal stays
       - close/reopen Stat Archive -> preview buttons start grey */
  const PREVIEW_HISTORY_KEY="statArchivePreviewedEntries";

  function clearPersistentPreviewHistory(){
    try{ localStorage.removeItem(PREVIEW_HISTORY_KEY); }catch(e){}
  }

  /* Runs before archive-ui.js, so a fresh launch always starts with an empty
     previewedEntryIds set. */
  clearPersistentPreviewHistory();

  function installPreviewSessionGuard(){
    /* Let the existing archive UI add .is-previewed normally. After it has
       done so, remove only the persistent localStorage copy — never the class
       and never the in-memory Set. */
    document.addEventListener("click",(event)=>{
      const button=event.target?.closest?.(".pv-btn");
      if(!button) return;

      /* The existing preview handler may write its history immediately or
         after a small async step. Clear a few times without touching UI. */
      [0,150,600,1500].forEach((delay)=>{
        setTimeout(clearPersistentPreviewHistory,delay);
      });
    },true);

    /* If the app is backgrounded and Android later kills the WebView, the
       stored copy has already been removed. Returning to the same live page
       still keeps teal because archive-ui.js retains its in-memory Set. */
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="hidden") clearPersistentPreviewHistory();
    });

    window.addEventListener("pagehide",clearPersistentPreviewHistory);
    window.addEventListener("beforeunload",clearPersistentPreviewHistory);

    const closeBtn=document.getElementById("closePreviewBtn");
    closeBtn?.addEventListener("click",clearPersistentPreviewHistory,true);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",installPreviewSessionGuard,{once:true});
  }else{
    installPreviewSessionGuard();
  }

  const BASE="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  let promise=null;

  function loadScript(){
    return new Promise((resolve,reject)=>{
      if(window.pdfjsLib) return resolve(window.pdfjsLib);

      const existing=document.querySelector('script[data-stat-pdfjs-loader="1"]');
      if(existing){
        existing.addEventListener("load",()=>resolve(window.pdfjsLib),{once:true});
        existing.addEventListener("error",()=>reject(new Error("Could not load PDF.js")),{once:true});
        return;
      }

      const script=document.createElement("script");
      script.src=BASE+"pdf.min.js";
      script.async=true;
      script.dataset.statPdfjsLoader="1";
      script.onload=()=>window.pdfjsLib?resolve(window.pdfjsLib):reject(new Error("PDF.js loaded without pdfjsLib"));
      script.onerror=()=>reject(new Error("Could not load PDF.js"));
      document.head.appendChild(script);
    });
  }

  window.loadPdfJs=function(){
    if(window.pdfjsLib){
      window.pdfjsLib.GlobalWorkerOptions.workerSrc=BASE+"pdf.worker.min.js";
      return Promise.resolve(window.pdfjsLib);
    }
    if(promise) return promise;
    promise=loadScript().then(lib=>{
      lib.GlobalWorkerOptions.workerSrc=BASE+"pdf.worker.min.js";
      return lib;
    }).catch(err=>{
      promise=null;
      throw err;
    });
    return promise;
  };
})();

/* =========================================================
   MANUAL MENU TAP GUARD

   pdf.js is one of the first local scripts loaded after the Menu markup.
   Register this capture handler here so Manual cannot be swallowed by later
   Menu capture/navigation layers. The existing service-worker-register.js
   still owns the shared navigation state and Manual chooser styling.
   ========================================================= */
(function installManualMenuTapGuard(){
  "use strict";

  if(window.__STAT_ARCHIVE_MANUAL_TAP_GUARD_V1__) return;
  window.__STAT_ARCHIVE_MANUAL_TAP_GUARD_V1__=true;

  let manualScrollY=0;

  function contributorManualAllowed(){
    try{return !!session && archiveRole==="contributor";}
    catch(_){return false;}
  }

  function syncManualVisibility(overlay){
    if(!overlay) return;
    const showContributor=contributorManualAllowed();
    const contributorChoice=overlay.querySelector('[data-manual-role="contributor"]');
    const title=overlay.querySelector("#manualChooserTitle");
    const intro=overlay.querySelector("[data-manual-intro]");

    if(contributorChoice){
      contributorChoice.style.display=showContributor?"":"none";
      contributorChoice.setAttribute("aria-hidden",showContributor?"false":"true");
    }
    if(title) title.textContent=showContributor?"Manuals":"Manual";
    if(intro) intro.textContent=showContributor
      ?"Choose the guide you want to open."
      :"Open the reader guide.";
  }

  function lockManualBackground(){
    manualScrollY=window.scrollY||window.pageYOffset||0;
    if(!document.body) return;
    document.body.dataset.manualScrollLock="1";
    document.body.dataset.manualScrollY=String(manualScrollY);
    document.body.style.position="fixed";
    document.body.style.top=`-${manualScrollY}px`;
    document.body.style.left="0";
    document.body.style.right="0";
    document.body.style.width="100%";
    document.body.style.overflow="hidden";
  }

  function unlockManualBackground(){
    if(document.body?.dataset.manualScrollLock!=="1") return;
    const y=Number(document.body.dataset.manualScrollY||manualScrollY||0);
    delete document.body.dataset.manualScrollLock;
    delete document.body.dataset.manualScrollY;
    document.body.style.position="";
    document.body.style.top="";
    document.body.style.left="";
    document.body.style.right="";
    document.body.style.width="";
    document.body.style.overflow="";
    requestAnimationFrame(()=>window.scrollTo(0,y));
  }

  function hideManualChooser(){
    const overlay=document.getElementById("manualChooserOverlay");
    if(!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden","true");
    unlockManualBackground();
  }

  function closeManualChooser(){
    const nav=window.__statArchiveNavigation;
    if(nav?.state?.()==="child" && nav?.child?.()==="manual-chooser"){
      history.back();
      return;
    }
    hideManualChooser();
    try{nav?.openMenu?.();}catch(_){}
  }

  function bindChooser(overlay){
    if(!overlay || overlay.dataset.manualTapGuardBound==="1") return;
    overlay.dataset.manualTapGuardBound="1";

    overlay.addEventListener("click",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(!target) return;

      const choice=target.closest("[data-manual-href]");
      if(choice){
        const href=choice.getAttribute("data-manual-href");
        if(!href) return;
        event.preventDefault();
        event.stopPropagation();
        hideManualChooser();
        window.location.replace(href);
        return;
      }

      if(event.target===overlay) closeManualChooser();
    });

    overlay.querySelector("#manualChooserCloseBtn")?.addEventListener("click",event=>{
      event.preventDefault();
      closeManualChooser();
    });
  }

  function ensureManualChooser(){
    let overlay=document.getElementById("manualChooserOverlay");

    if(!overlay){
      overlay=document.createElement("div");
      overlay.id="manualChooserOverlay";
      overlay.className="manual-chooser-overlay";
      overlay.setAttribute("aria-hidden","true");
      overlay.innerHTML=`
        <section class="manual-chooser-card" role="dialog" aria-modal="true" aria-labelledby="manualChooserTitle">
          <div class="manual-chooser-head">
            <div>
              <div class="manual-chooser-kicker">SUPPORT</div>
              <h2 id="manualChooserTitle">Manual</h2>
              <p data-manual-intro>Open the reader guide.</p>
            </div>
            <button type="button" class="manual-chooser-close" id="manualChooserCloseBtn" aria-label="Close manuals">×</button>
          </div>
          <div class="manual-chooser-options">
            <button type="button" class="manual-choice" data-manual-href="./manuals/reader.html">
              <span class="manual-choice-icon" aria-hidden="true">◫</span>
              <span class="manual-choice-copy"><strong>Reader Manual</strong><small>Browsing, search, preview, download and Offline Library</small></span>
              <span class="manual-choice-arrow" aria-hidden="true">›</span>
            </button>
            <button type="button" class="manual-choice" data-manual-role="contributor" data-manual-href="./manuals/contributor.html">
              <span class="manual-choice-icon" aria-hidden="true">＋</span>
              <span class="manual-choice-copy"><strong>Contributor Manual</strong><small>Filing, editing, subjects, limits and contributor permissions</small></span>
              <span class="manual-choice-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </section>`;
      document.body.appendChild(overlay);
    }

    syncManualVisibility(overlay);
    bindChooser(overlay);
    return overlay;
  }

  function openManualChooser(){
    const overlay=ensureManualChooser();
    if(!overlay || overlay.classList.contains("is-open")) return;

    const nav=window.__statArchiveNavigation;
    if(nav){
      try{
        if(nav.state?.()!=="menu") nav.enterMenu?.();
        nav.enterChild?.("manual-chooser");
        nav.closeMenu?.();
      }catch(_){}
    }else{
      try{window.statArchiveCloseMenu?.();}catch(_){}
      document.getElementById("mainSideMenu")?.classList.remove("is-open");
      document.getElementById("mainMenuBackdrop")?.classList.remove("is-open");
    }

    syncManualVisibility(overlay);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden","false");
    lockManualBackground();
    requestAnimationFrame(()=>overlay.querySelector("#manualChooserCloseBtn")?.focus());
  }

  /* This listener is intentionally installed immediately, before the later
     Menu/navigation scripts are parsed. It owns only the Manual button. */
  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest("#menuManualsBtn")) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openManualChooser();
  },true);

  document.addEventListener("keydown",event=>{
    const overlay=document.getElementById("manualChooserOverlay");
    if(event.key!=="Escape" || !overlay?.classList.contains("is-open")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeManualChooser();
  },true);

  window.addEventListener("popstate",()=>{
    const nav=window.__statArchiveNavigation;
    if(nav?.state?.()!=="child" || nav?.child?.()!=="manual-chooser"){
      hideManualChooser();
    }
  });
})();