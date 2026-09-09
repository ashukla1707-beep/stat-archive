(function(){
  "use strict";

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