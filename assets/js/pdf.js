(function(){
  "use strict";

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