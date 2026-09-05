(function(){
  "use strict";

  if(typeof window.previewEntry !== "function") return;
  const originalPreviewEntry = window.previewEntry;

  function isPdfEntry(entry){
    const name=String(entry?.filename||"").toLowerCase();
    return name.endsWith(".pdf") || String(entry?.type||"").toLowerCase().includes("pdf");
  }

  function safePdfName(entry){
    const title=String(entry?.title||"Document").trim()||"Document";
    const clean=title.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim();
    return (clean||"Document")+".pdf";
  }

  window.previewEntry=async function(entry){
    if(!isPdfEntry(entry)) return originalPreviewEntry(entry);

    try{ window.closePreview?.(); }catch(_){}

    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    const titleEl=document.getElementById("previewTitle");
    if(!overlay||!body||!titleEl) return originalPreviewEntry(entry);

    const fileUrl=`${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
    titleEl.textContent=entry.title||"PDF";
    body.innerHTML='<div class="pdf-preview-loading">Loading preview…</div>';
    overlay.style.display="flex";
    document.body.classList.add("no-scroll");
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");

    let pdf=null;
    try{
      const response=await fetch(fileUrl,{cache:"no-store"});
      if(!response.ok) throw new Error("Could not load the PDF.");
      const blob=await response.blob();
      const pdfjsLib=await loadPdfJs();
      pdf=await pdfjsLib.getDocument({
        data:await blob.arrayBuffer(),
        cMapUrl:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked:true
      }).promise;
      activePdfDoc=pdf;

      body.innerHTML=`
        <div class="pdf-preview-shell stat-pdf-v2">
          <div class="pdf-preview-toolbar">
            <div class="pdf-page-controls">
              <button type="button" class="pdf-page-btn" id="pdfPrevBtn">‹</button>
              <span class="pdf-page-info" id="pdfPageInfo">Page 1 / ${pdf.numPages}</span>
              <button type="button" class="pdf-page-btn" id="pdfNextBtn">›</button>
            </div>
            <div class="pdf-toolbar-actions"><div class="pdf-zoom-controls">
              <button type="button" class="pdf-page-btn" id="pdfZoomOutBtn">−</button>
              <span class="pdf-zoom-level" id="pdfZoomLevel">100%</span>
              <button type="button" class="pdf-page-btn" id="pdfZoomInBtn">+</button>
              <button type="button" class="pdf-page-btn" id="pdfZoomResetBtn">1:1</button>
            </div></div>
          </div>
          <div class="pdf-canvas-wrap stat-pdf-v2-wrap" id="pdfCanvasWrap">
            <div class="pdf-pages stat-pdf-v2-pages" id="pdfPages"></div>
          </div>
          <div class="pdf-open-new-tab-bottom"><button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button></div>
        </div>`;

      const wrap=document.getElementById("pdfCanvasWrap");
      const pagesHost=document.getElementById("pdfPages");
      const pageInfo=document.getElementById("pdfPageInfo");
      const prevBtn=document.getElementById("pdfPrevBtn");
      const nextBtn=document.getElementById("pdfNextBtn");
      const zoomOut=document.getElementById("pdfZoomOutBtn");
      const zoomIn=document.getElementById("pdfZoomInBtn");
      const zoomReset=document.getElementById("pdfZoomResetBtn");
      const zoomLabel=document.getElementById("pdfZoomLevel");

      const MIN_ZOOM=.5,MAX_ZOOM=3,STEP=.25;
      let zoom=1,currentPage=1,rafScroll=0,pinch=null,zoomLock=false,unlockTimer=0;
      const metas=[],renderTasks=new Map();

      wrap.style.overflow="auto";
      wrap.style.webkitOverflowScrolling="touch";
      wrap.style.touchAction="pan-x pan-y";
      wrap.style.overscrollBehavior="contain";
      wrap.style.overflowAnchor="none";
      pagesHost.style.setProperty("--stat-pdf-zoom","1");
      pagesHost.style.overflowAnchor="none";
      pagesHost.style.transformOrigin="0 0";
      pagesHost.style.willChange="transform";

      const first=await pdf.getPage(1);
      const firstVp=first.getViewport({scale:1});
      const fitW=Math.max(220,wrap.clientWidth-24);
      const fitScale=fitW/firstVp.width;
      const defaultW=firstVp.width*fitScale;
      const defaultH=firstVp.height*fitScale;

      for(let i=1;i<=pdf.numPages;i++){
        const el=document.createElement("div");
        el.className="pdf-page pdf-page-placeholder stat-pdf-v2-page";
        el.dataset.page=String(i);
        el.style.setProperty("--stat-pw",`${defaultW}px`);
        el.style.setProperty("--stat-ph",`${defaultH}px`);
        el.style.width="calc(var(--stat-pw) * var(--stat-pdf-zoom))";
        el.style.height="calc(var(--stat-ph) * var(--stat-pdf-zoom))";
        el.style.margin="0 auto 12px";
        el.style.overflowAnchor="none";
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

      function pageContentRect(el){
        const wr=wrap.getBoundingClientRect();
        const r=el.getBoundingClientRect();
        return {
          top:wrap.scrollTop+(r.top-wr.top),
          left:wrap.scrollLeft+(r.left-wr.left),
          width:Math.max(1,r.width),
          height:Math.max(1,r.height)
        };
      }

      function pageAtClient(clientX,clientY){
        let el=document.elementFromPoint(clientX,clientY)?.closest?.(".pdf-page");
        if(el&&pagesHost.contains(el)) return el;
        for(const meta of metas){
          const r=meta.el.getBoundingClientRect();
          if(clientY>=r.top&&clientY<=r.bottom) return meta.el;
        }
        return metas[Math.max(0,currentPage-1)]?.el||metas[0]?.el||null;
      }

      function nearestPage(){
        const wr=wrap.getBoundingClientRect();
        const y=wr.top+wrap.clientHeight*.45;
        const el=pageAtClient(wr.left+wrap.clientWidth/2,y);
        return Math.max(1,Math.min(pdf.numPages,Number(el?.dataset?.page)||1));
      }

      function captureAnchor(clientX,clientY){
        const wr=wrap.getBoundingClientRect();
        const x=Number.isFinite(clientX)?clientX:wr.left+wrap.clientWidth/2;
        const y=Number.isFinite(clientY)?clientY:wr.top+wrap.clientHeight/2;
        const viewportX=Math.max(0,Math.min(wrap.clientWidth,x-wr.left));
        const viewportY=Math.max(0,Math.min(wrap.clientHeight,y-wr.top));
        const el=pageAtClient(x,y);
        const pageNum=Math.max(1,Math.min(pdf.numPages,Number(el?.dataset?.page)||currentPage));
        const rect=pageContentRect(el);
        const contentX=wrap.scrollLeft+viewportX;
        const contentY=wrap.scrollTop+viewportY;
        return {
          pageNum,viewportX,viewportY,
          fracX:Math.max(0,Math.min(1,(contentX-rect.left)/rect.width)),
          fracY:Math.max(0,Math.min(1,(contentY-rect.top)/rect.height))
        };
      }

      function restoreAnchor(a){
        const el=metas[a.pageNum-1]?.el;
        if(!el) return;
        const rect=pageContentRect(el);
        wrap.scrollLeft=Math.max(0,rect.left+rect.width*a.fracX-a.viewportX);
        wrap.scrollTop=Math.max(0,rect.top+rect.height*a.fracY-a.viewportY);
        currentPage=a.pageNum;
        updateControls();
      }

      async function renderPage(meta){
        if(!meta||Math.abs(meta.renderedZoom-zoom)<.01) return;
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
          canvas.style.width="100%"; canvas.style.height="100%";
          const ctx=canvas.getContext("2d",{alpha:false});
          const task=page.render({canvasContext:ctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
          renderTasks.set(meta.num,task);
          await task.promise;
          renderTasks.delete(meta.num);
          meta.el.replaceChildren(canvas);
          meta.el.classList.remove("pdf-page-placeholder");
          meta.canvas=canvas; meta.renderedZoom=zoom;
        }catch(err){ if(err?.name!=="RenderingCancelledException") console.warn("PDF render failed",meta?.num,err); }
      }

      function renderNeighborhood(){
        const start=Math.max(1,currentPage-2),end=Math.min(pdf.numPages,currentPage+3);
        for(let p=start;p<=end;p++) renderPage(metas[p-1]);
        for(const meta of metas){
          if(Math.abs(meta.num-currentPage)>8&&meta.canvas){
            meta.canvas.width=0; meta.canvas.height=0;
            meta.el.replaceChildren();
            meta.el.classList.add("pdf-page-placeholder");
            meta.canvas=null; meta.renderedZoom=0;
          }
        }
      }

      wrap.addEventListener("scroll",()=>{
        if(zoomLock||rafScroll) return;
        rafScroll=requestAnimationFrame(()=>{
          rafScroll=0;
          currentPage=nearestPage();
          updateControls();
          renderNeighborhood();
        });
      },{passive:true});

      function lockZoom(){
        zoomLock=true;
        if(rafScroll){cancelAnimationFrame(rafScroll);rafScroll=0;}
        if(unlockTimer){clearTimeout(unlockTimer);unlockTimer=0;}
      }

      function unlockSoon(anchorPage){
        if(unlockTimer) clearTimeout(unlockTimer);
        unlockTimer=setTimeout(()=>{
          unlockTimer=0; zoomLock=false;
          currentPage=anchorPage||nearestPage();
          updateControls(); renderNeighborhood();
        },260);
      }

      function commitZoom(next,a){
        next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,next));
        pagesHost.style.transform="";
        if(Math.abs(next-zoom)<.003){ updateControls(); unlockSoon(a?.pageNum); return; }
        lockZoom();
        zoom=next;
        pagesHost.style.setProperty("--stat-pdf-zoom",String(zoom));
        void pagesHost.offsetHeight;
        metas.forEach(m=>m.renderedZoom=0);
        restoreAnchor(a||captureAnchor());
        renderNeighborhood();
        requestAnimationFrame(()=>restoreAnchor(a||captureAnchor()));
        unlockSoon(a?.pageNum);
      }

      function setZoom(next){
        const wr=wrap.getBoundingClientRect();
        const a=captureAnchor(wr.left+wrap.clientWidth/2,wr.top+wrap.clientHeight/2);
        commitZoom(next,a);
      }

      prevBtn.onclick=()=>{
        if(zoomLock) return;
        currentPage=Math.max(1,currentPage-1);
        wrap.scrollTo({top:pageContentRect(metas[currentPage-1].el).top,behavior:"smooth"});
        updateControls(); renderNeighborhood();
      };
      nextBtn.onclick=()=>{
        if(zoomLock) return;
        currentPage=Math.min(pdf.numPages,currentPage+1);
        wrap.scrollTo({top:pageContentRect(metas[currentPage-1].el).top,behavior:"smooth"});
        updateControls(); renderNeighborhood();
      };
      zoomOut.onclick=()=>setZoom(zoom-STEP);
      zoomIn.onclick=()=>setZoom(zoom+STEP);
      zoomReset.onclick=()=>setZoom(1);

      const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const midpoint=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

      wrap.addEventListener("touchstart",e=>{
        if(e.touches.length!==2) return;
        const d=distance(e.touches); if(!d) return;
        const mid=midpoint(e.touches);
        const hostRect=pagesHost.getBoundingClientRect();
        const anchor=captureAnchor(mid.x,mid.y);
        pinch={
          startD:d,startZoom:zoom,pendingZoom:zoom,anchor,
          baseScrollTop:wrap.scrollTop,baseScrollLeft:wrap.scrollLeft,
          hostLeft:hostRect.left,hostTop:hostRect.top,
          localX:mid.x-hostRect.left,localY:mid.y-hostRect.top
        };
        lockZoom();
        pagesHost.style.transformOrigin="0 0";
        e.preventDefault();
      },{passive:false});

      wrap.addEventListener("touchmove",e=>{
        if(!pinch||e.touches.length!==2) return;
        e.preventDefault();
        const d=distance(e.touches); if(!d) return;
        const mid=midpoint(e.touches);
        const next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,pinch.startZoom*(d/pinch.startD)));
        pinch.pendingZoom=next;
        const ratio=next/pinch.startZoom;

        // Freeze the underlying scroll position during the gesture. Any two-
        // finger movement is represented by the compositor transform instead,
        // so Android WebView cannot momentarily scroll to an earlier page.
        if(Math.abs(wrap.scrollTop-pinch.baseScrollTop)>.5) wrap.scrollTop=pinch.baseScrollTop;
        if(Math.abs(wrap.scrollLeft-pinch.baseScrollLeft)>.5) wrap.scrollLeft=pinch.baseScrollLeft;

        // Exact finger anchor: transform from the host's top-left and add a
        // compensating translation. The content point that began under the
        // pinch midpoint stays under the moving midpoint throughout the pinch.
        const tx=mid.x-pinch.hostLeft-pinch.localX*ratio;
        const ty=mid.y-pinch.hostTop-pinch.localY*ratio;
        pagesHost.style.transform=`translate3d(${tx}px,${ty}px,0) scale(${ratio})`;
        updateControls(next);
      },{passive:false});

      function finishPinch(){
        if(!pinch) return;
        const done=pinch; pinch=null;
        wrap.scrollTop=done.baseScrollTop;
        wrap.scrollLeft=done.baseScrollLeft;
        commitZoom(done.pendingZoom,done.anchor);
      }

      wrap.addEventListener("touchend",e=>{ if(e.touches.length<2) finishPinch(); },{passive:true});
      wrap.addEventListener("touchcancel",finishPinch,{passive:true});

      const openBtn=body.querySelector(".pdf-open-new-tab-btn");
      if(openBtn) openBtn.onclick=()=>openPdfInNewTab(fileUrl,safePdfName(entry));

      updateControls(); renderNeighborhood();

      body._statPdfV2Cleanup=()=>{
        if(unlockTimer) clearTimeout(unlockTimer);
        pagesHost.style.transform="";
        for(const task of renderTasks.values()){try{task.cancel();}catch(_){}}
        renderTasks.clear();
      };
    }catch(err){
      console.error("PDF preview failed",err);
      try{if(pdf&&activePdfDoc===pdf){await pdf.destroy();activePdfDoc=null;}}catch(_){}
      body.innerHTML='<div class="preview-fallback">Couldn\'t open the PDF preview.<br><small>Use Open PDF instead.</small></div>';
    }
  };
})();