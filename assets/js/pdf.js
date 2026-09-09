(function(){
  "use strict";

  /* Preview is a temporary action. Older builds remembered every previewed
     file in localStorage and added .is-previewed, which made the button stay
     teal even after the preview/app was closed. Clear that history before
     archive-ui.js initializes, then strip any class an old click handler
     tries to add during this session. */
  const PREVIEW_HISTORY_KEY="statArchivePreviewedEntries";

  function clearPreviewHistory(){
    try{ localStorage.removeItem(PREVIEW_HISTORY_KEY); }catch(e){}
  }

  function resetPreviewButton(button){
    if(!button) return;
    button.classList.remove("is-previewed");
    if(document.activeElement===button){
      try{ button.blur(); }catch(e){}
    }
  }

  function resetPreviewButtons(root=document){
    clearPreviewHistory();
    root.querySelectorAll?.(".pv-btn.is-previewed").forEach(resetPreviewButton);
  }

  clearPreviewHistory();

  function installPreviewButtonReset(){
    resetPreviewButtons();

    const root=document.getElementById("grid")||document.body;
    if(root && root.dataset.previewButtonResetObserver!=="1"){
      root.dataset.previewButtonResetObserver="1";
      const observer=new MutationObserver((mutations)=>{
        let changed=false;
        for(const mutation of mutations){
          if(mutation.type==="attributes"){
            const target=mutation.target;
            if(target instanceof Element && target.matches(".pv-btn.is-previewed")){
              resetPreviewButton(target);
              changed=true;
            }
            continue;
          }

          mutation.addedNodes.forEach((node)=>{
            if(!(node instanceof Element)) return;
            if(node.matches?.(".pv-btn.is-previewed")){
              resetPreviewButton(node);
              changed=true;
            }
            node.querySelectorAll?.(".pv-btn.is-previewed").forEach((button)=>{
              resetPreviewButton(button);
              changed=true;
            });
          });
        }
        if(changed) clearPreviewHistory();
      });

      observer.observe(root,{
        subtree:true,
        childList:true,
        attributes:true,
        attributeFilter:["class"]
      });
    }

    document.addEventListener("click",(event)=>{
      const button=event.target?.closest?.(".pv-btn");
      if(!button) return;
      setTimeout(()=>{
        resetPreviewButton(button);
        clearPreviewHistory();
      },0);
    },true);

    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible") resetPreviewButtons();
    });
    window.addEventListener("pageshow",()=>resetPreviewButtons());
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",installPreviewButtonReset,{once:true});
  }else{
    installPreviewButtonReset();
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