(function(){
  "use strict";

  if(typeof window.previewEntry !== "function") return;
  const originalPreviewEntry = window.previewEntry;

  function isPdfEntry(entry){
    const name = String(entry?.filename || "").toLowerCase();
    return name.endsWith(".pdf") || String(entry?.type || "").toLowerCase().includes("pdf");
  }

  function safePdfName(entry){
    const title = String(entry?.title || "Document").trim() || "Document";
    const clean = title.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim();
    return (clean || "Document") + ".pdf";
  }

  window.previewEntry = async function(entry){
    if(!isPdfEntry(entry)) return originalPreviewEntry(entry);

    try { window.closePreview?.(); } catch(_) {}

    const overlay = document.getElementById("previewOverlay");
    const body = document.getElementById("previewBody");
    const titleEl = document.getElementById("previewTitle");
    if(!overlay || !body || !titleEl) return originalPreviewEntry(entry);

    const fileUrl = `${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
    titleEl.textContent = entry.title || "PDF";
    body.innerHTML = '<div class="pdf-preview-loading">Loading preview…</div>';
    overlay.style.display = "flex";
    document.body.classList.add("no-scroll");
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");

    let pdf = null;

    try{
      const response = await fetch(fileUrl,{cache:"no-store"});
      if(!response.ok) throw new Error("Could not load the PDF.");
      const blob = await response.blob();
      const pdfjsLib = await loadPdfJs();
      const data = await blob.arrayBuffer();
      pdf = await pdfjsLib.getDocument({
        data,
        cMapUrl:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked:true
      }).promise;

      activePdfDoc = pdf;

      body.innerHTML = `
        <div class="pdf-preview-shell stat-pdf-v2">
          <div class="pdf-preview-toolbar">
            <div class="pdf-page-controls">
              <button type="button" class="pdf-page-btn" id="pdfPrevBtn" aria-label="Previous page">‹</button>
              <span class="pdf-page-info" id="pdfPageInfo">Page 1 / ${pdf.numPages}</span>
              <button type="button" class="pdf-page-btn" id="pdfNextBtn" aria-label="Next page">›</button>
            </div>
            <div class="pdf-toolbar-actions">
              <div class="pdf-zoom-controls" aria-label="Zoom controls">
                <button type="button" class="pdf-page-btn" id="pdfZoomOutBtn" aria-label="Zoom out">−</button>
                <span class="pdf-zoom-level" id="pdfZoomLevel">100%</span>
                <button type="button" class="pdf-page-btn" id="pdfZoomInBtn" aria-label="Zoom in">+</button>
                <button type="button" class="pdf-page-btn" id="pdfZoomResetBtn" aria-label="Reset zoom">1:1</button>
              </div>
            </div>
          </div>
          <div class="pdf-canvas-wrap stat-pdf-v2-wrap" id="pdfCanvasWrap">
            <div class="pdf-pages stat-pdf-v2-pages" id="pdfPages"></div>
          </div>
          <div class="pdf-open-new-tab-bottom">
            <button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button>
          </div>
        </div>`;

      const wrap = document.getElementById("pdfCanvasWrap");
      const pagesHost = document.getElementById("pdfPages");
      const pageInfo = document.getElementById("pdfPageInfo");
      const prevBtn = document.getElementById("pdfPrevBtn");
      const nextBtn = document.getElementById("pdfNextBtn");
      const zoomOut = document.getElementById("pdfZoomOutBtn");
      const zoomIn = document.getElementById("pdfZoomInBtn");
      const zoomReset = document.getElementById("pdfZoomResetBtn");
      const zoomLabel = document.getElementById("pdfZoomLevel");

      const MIN_ZOOM=.5, MAX_ZOOM=3, STEP=.25;
      let zoom=1;
      let currentPage=1;
      let rafScroll=0;
      let pinch=null;
      let zoomLock=false;
      let zoomUnlockTimer=0;
      const metas=[];
      const renderTasks=new Map();

      wrap.style.overflow="auto";
      wrap.style.webkitOverflowScrolling="touch";
      wrap.style.touchAction="pan-x pan-y";
      wrap.style.overscrollBehavior="contain";
      wrap.style.overflowAnchor="none";
      pagesHost.style.setProperty("--stat-pdf-zoom","1");
      pagesHost.style.overflowAnchor="none";
      pagesHost.style.willChange="transform";

      const first = await pdf.getPage(1);
      const firstVp = first.getViewport({scale:1});
      const fitW = Math.max(220, wrap.clientWidth - 24);
      const fitScale = fitW / firstVp.width;
      const defaultW = firstVp.width * fitScale;
      const defaultH = firstVp.height * fitScale;

      for(let i=1;i<=pdf.numPages;i++){
        const el=document.createElement("div");
        el.className="pdf-page pdf-page-placeholder stat-pdf-v2-page";
        el.dataset.page=String(i);
        el.style.setProperty("--stat-pw",`${defaultW}px`);
        el.style.setProperty("--stat-ph",`${defaultH}px`);
        el.style.width="calc(var(--stat-pw) * var(--stat-pdf-zoom))";
        el.style.height="calc(var(--stat-ph) * var(--stat-pdf-zoom))";
        el.style.margin="0 auto 12px";
        pagesHost.appendChild(el);
        metas.push({num:i,el,baseW:defaultW,baseH:defaultH,renderedZoom:0,canvas:null});
      }

      function updateControls(displayZoom=zoom){
        pageInfo.textContent=`Page ${currentPage} / ${pdf.numPages}`;
        prevBtn.disabled=currentPage<=1;
        nextBtn.disabled=currentPage>=pdf.numPages;
        zoomLabel.textContent=`${Math.round(displayZoom*100)}%`;
        zoomOut.disabled=zoom<=MIN_ZOOM+.001;
        zoomIn.disabled=zoom>=MAX_ZOOM-.001;
      }

      function nearestPage(){
        const center=wrap.scrollTop + wrap.clientHeight*.45;
        let lo=0, hi=metas.length-1, best=0;
        while(lo<=hi){
          const mid=(lo+hi)>>1;
          const el=metas[mid].el;
          const top=el.offsetTop;
          if(top<=center){best=mid;lo=mid+1;} else hi=mid-1;
        }
        return Math.max(1,Math.min(pdf.numPages,best+1));
      }

      async function renderPage(meta){
        if(!meta || Math.abs(meta.renderedZoom-zoom)<.01) return;
        const old=renderTasks.get(meta.num);
        if(old){try{old.cancel();}catch(_){} renderTasks.delete(meta.num);}
        try{
          const page=await pdf.getPage(meta.num);
          const base=page.getViewport({scale:1});
          const localFit=fitW/base.width;
          meta.baseW=base.width*localFit;
          meta.baseH=base.height*localFit;
          meta.el.style.setProperty("--stat-pw",`${meta.baseW}px`);
          meta.el.style.setProperty("--stat-ph",`${meta.baseH}px`);

          const viewport=page.getViewport({scale:localFit*zoom});
          const dpr=Math.min(window.devicePixelRatio||1,1.75);
          const canvas=document.createElement("canvas");
          canvas.className="pdf-page-canvas";
          canvas.width=Math.max(1,Math.floor(viewport.width*dpr));
          canvas.height=Math.max(1,Math.floor(viewport.height*dpr));
          canvas.style.width="100%";
          canvas.style.height="100%";
          const ctx=canvas.getContext("2d",{alpha:false});
          const task=page.render({canvasContext:ctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
          renderTasks.set(meta.num,task);
          await task.promise;
          renderTasks.delete(meta.num);
          meta.el.innerHTML="";
          meta.el.classList.remove("pdf-page-placeholder");
          meta.el.appendChild(canvas);
          meta.canvas=canvas;
          meta.renderedZoom=zoom;
        }catch(err){
          if(err?.name!=="RenderingCancelledException") console.warn("PDF page render failed",meta?.num,err);
        }
      }

      function renderNeighborhood(){
        const start=Math.max(1,currentPage-2), end=Math.min(pdf.numPages,currentPage+3);
        for(let p=start;p<=end;p++) renderPage(metas[p-1]);
        for(const meta of metas){
          if(Math.abs(meta.num-currentPage)>8 && meta.canvas){
            meta.canvas.width=0; meta.canvas.height=0;
            meta.el.innerHTML="";
            meta.el.classList.add("pdf-page-placeholder");
            meta.canvas=null; meta.renderedZoom=0;
          }
        }
      }

      function syncCurrentFromScroll(){
        if(zoomLock) return;
        currentPage=nearestPage();
        updateControls();
        renderNeighborhood();
      }

      wrap.addEventListener("scroll",()=>{
        if(zoomLock || rafScroll) return;
        rafScroll=requestAnimationFrame(()=>{rafScroll=0;syncCurrentFromScroll();});
      },{passive:true});

      function anchorState(clientY){
        const wrapRect=wrap.getBoundingClientRect();
        const y=Number.isFinite(clientY)?clientY:wrapRect.top+wrap.clientHeight/2;
        const viewportY=Math.max(0,Math.min(wrap.clientHeight,y-wrapRect.top));
        const pageNum=Math.max(1,Math.min(pdf.numPages,currentPage));
        const el=metas[pageNum-1].el;
        const top=el.offsetTop;
        const h=Math.max(1,el.offsetHeight);
        const absoluteY=wrap.scrollTop+viewportY;
        const frac=Math.max(0,Math.min(1,(absoluteY-top)/h));
        return {pageNum,viewportY,frac};
      }

      function restoreAnchor(a){
        const el=metas[a.pageNum-1]?.el;
        if(!el) return;
        const target=Math.max(0,el.offsetTop + el.offsetHeight*a.frac - a.viewportY);
        wrap.scrollTop=target;
        currentPage=a.pageNum;
        updateControls();
      }

      function lockZoomPage(){
        zoomLock=true;
        if(rafScroll){ cancelAnimationFrame(rafScroll); rafScroll=0; }
        if(zoomUnlockTimer){ clearTimeout(zoomUnlockTimer); zoomUnlockTimer=0; }
      }

      function unlockZoomPageSoon(){
        if(zoomUnlockTimer) clearTimeout(zoomUnlockTimer);
        zoomUnlockTimer=setTimeout(()=>{
          zoomUnlockTimer=0;
          zoomLock=false;
          currentPage=nearestPage();
          updateControls();
          renderNeighborhood();
        },180);
      }

      function commitZoom(next,anchor){
        next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,next));
        if(Math.abs(next-zoom)<.003){
          pagesHost.style.transform="";
          pagesHost.style.transformOrigin="";
          updateControls();
          return;
        }

        lockZoomPage();
        const a=anchor || anchorState();
        zoom=next;

        // Apply the final layout zoom and remove the temporary gesture
        // transform in the SAME JS turn. The browser therefore never paints
        // the intermediate scrolled layout that caused page 7 -> 5 -> 7.
        pagesHost.style.setProperty("--stat-pdf-zoom",String(zoom));
        pagesHost.style.transform="";
        pagesHost.style.transformOrigin="";
        metas.forEach(m=>{m.renderedZoom=0;});
        restoreAnchor(a);
        renderNeighborhood();
        unlockZoomPageSoon();
      }

      function setZoom(next,clientY){
        const a=anchorState(clientY);
        commitZoom(next,a);
      }

      prevBtn.onclick=()=>{
        if(zoomLock) return;
        currentPage=Math.max(1,currentPage-1);
        const el=metas[currentPage-1].el;
        wrap.scrollTo({top:el.offsetTop,behavior:"smooth"});
        updateControls(); renderNeighborhood();
      };
      nextBtn.onclick=()=>{
        if(zoomLock) return;
        currentPage=Math.min(pdf.numPages,currentPage+1);
        const el=metas[currentPage-1].el;
        wrap.scrollTo({top:el.offsetTop,behavior:"smooth"});
        updateControls(); renderNeighborhood();
      };
      zoomOut.onclick=()=>setZoom(zoom-STEP);
      zoomIn.onclick=()=>setZoom(zoom+STEP);
      zoomReset.onclick=()=>setZoom(1);

      const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      wrap.addEventListener("touchstart",e=>{
        if(e.touches.length!==2) return;
        const d=dist(e.touches); if(!d) return;
        const wrapRect=wrap.getBoundingClientRect();
        const centerX=(e.touches[0].clientX+e.touches[1].clientX)/2;
        const centerY=(e.touches[0].clientY+e.touches[1].clientY)/2;
        const viewportX=Math.max(0,Math.min(wrap.clientWidth,centerX-wrapRect.left));
        const viewportY=Math.max(0,Math.min(wrap.clientHeight,centerY-wrapRect.top));
        const anchor=anchorState(centerY);
        pinch={
          startD:d,
          startZoom:zoom,
          pendingZoom:zoom,
          anchor,
          originX:wrap.scrollLeft+viewportX,
          originY:wrap.scrollTop+viewportY
        };
        lockZoomPage();
        pagesHost.style.transformOrigin=`${pinch.originX}px ${pinch.originY}px`;
        e.preventDefault();
      },{passive:false});

      wrap.addEventListener("touchmove",e=>{
        if(!pinch || e.touches.length!==2) return;
        e.preventDefault();
        const d=dist(e.touches); if(!d) return;
        const next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,pinch.startZoom*(d/pinch.startD)));
        pinch.pendingZoom=next;

        // During the gesture use compositor-only scaling. No page heights,
        // offsets or scrollTop values change, so the viewer cannot auto-scroll
        // to previous pages and then jump back.
        const ratio=next/pinch.startZoom;
        pagesHost.style.transform=`scale(${ratio})`;
        updateControls(next);
      },{passive:false});

      function finishPinch(){
        if(!pinch) return;
        const done=pinch;
        pinch=null;
        commitZoom(done.pendingZoom,done.anchor);
      }

      wrap.addEventListener("touchend",e=>{
        if(e.touches.length<2) finishPinch();
      },{passive:true});
      wrap.addEventListener("touchcancel",finishPinch,{passive:true});

      const openBtn=body.querySelector(".pdf-open-new-tab-btn");
      if(openBtn) openBtn.onclick=()=>openPdfInNewTab(fileUrl,safePdfName(entry));

      updateControls();
      renderNeighborhood();

      body._statPdfV2Cleanup=()=>{
        if(zoomUnlockTimer) clearTimeout(zoomUnlockTimer);
        pagesHost.style.transform="";
        pagesHost.style.transformOrigin="";
        for(const task of renderTasks.values()){try{task.cancel();}catch(_){}}
        renderTasks.clear();
      };
    }catch(err){
      console.error("PDF preview v2 failed",err);
      try{ if(pdf && activePdfDoc===pdf){ await pdf.destroy(); activePdfDoc=null; } }catch(_){}
      body.innerHTML='<div class="preview-fallback">Couldn\'t open the PDF preview.<br><small>Use Open PDF instead.</small></div>';
    }
  };
})();
