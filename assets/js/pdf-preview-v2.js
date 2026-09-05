(function(){
  "use strict";

  if(typeof window.previewEntry!=="function") return;
  const originalPreviewEntry=window.previewEntry;

  function isPdfEntry(entry){
    const name=String(entry?.filename||"").toLowerCase();
    return name.endsWith(".pdf")||String(entry?.type||"").toLowerCase().includes("pdf");
  }

  function safePdfName(entry){
    const title=String(entry?.title||"Document").trim()||"Document";
    const clean=title.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim();
    return (clean||"Document")+".pdf";
  }

  window.previewEntry=async function(entry){
    if(!isPdfEntry(entry)) return originalPreviewEntry(entry);

    try{window.closePreview?.();}catch(_){}

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
            <div id="pdfZoomSizer" style="position:relative;min-width:100%;">
              <div class="pdf-pages stat-pdf-v2-pages" id="pdfPages"></div>
            </div>
          </div>
          <div class="pdf-open-new-tab-bottom"><button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button></div>
        </div>`;

      const wrap=document.getElementById("pdfCanvasWrap");
      const sizer=document.getElementById("pdfZoomSizer");
      const pagesHost=document.getElementById("pdfPages");
      const pageInfo=document.getElementById("pdfPageInfo");
      const prevBtn=document.getElementById("pdfPrevBtn");
      const nextBtn=document.getElementById("pdfNextBtn");
      const zoomOut=document.getElementById("pdfZoomOutBtn");
      const zoomIn=document.getElementById("pdfZoomInBtn");
      const zoomReset=document.getElementById("pdfZoomResetBtn");
      const zoomLabel=document.getElementById("pdfZoomLevel");

      const MIN_ZOOM=.5,MAX_ZOOM=3,STEP=.25;
      let zoom=1,currentPage=1,rafScroll=0,pinch=null,gestureRaf=0,pendingGesture=null;
      const metas=[],renderTasks=new Map();

      wrap.style.overflow="auto";
      wrap.style.webkitOverflowScrolling="touch";
      wrap.style.touchAction="pan-x pan-y";
      wrap.style.overscrollBehavior="contain";
      wrap.style.overflowAnchor="none";
      sizer.style.overflowAnchor="none";
      pagesHost.style.position="absolute";
      pagesHost.style.left="0";
      pagesHost.style.top="0";
      pagesHost.style.width=`${Math.max(1,wrap.clientWidth)}px`;
      pagesHost.style.transformOrigin="0 0";
      pagesHost.style.willChange="transform";
      pagesHost.style.overflowAnchor="none";

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
        el.style.width=`${defaultW}px`;
        el.style.height=`${defaultH}px`;
        el.style.margin="0 auto 12px";
        el.style.overflowAnchor="none";
        pagesHost.appendChild(el);
        metas.push({num:i,el,renderedZoom:0,canvas:null});
      }

      const baseStageWidth=Math.max(wrap.clientWidth,pagesHost.scrollWidth);
      const baseStageHeight=Math.max(1,pagesHost.scrollHeight);

      function updateControls(displayZoom=zoom){
        pageInfo.textContent=`Page ${currentPage} / ${pdf.numPages}`;
        prevBtn.disabled=currentPage<=1;
        nextBtn.disabled=currentPage>=pdf.numPages;
        zoomLabel.textContent=`${Math.round(displayZoom*100)}%`;
        zoomOut.disabled=zoom<=MIN_ZOOM+.001;
        zoomIn.disabled=zoom>=MAX_ZOOM-.001;
      }

      function setSurfaceScale(next){
        pagesHost.style.transform=`scale(${next})`;
        sizer.style.width=`${Math.max(wrap.clientWidth,baseStageWidth*next)}px`;
        sizer.style.height=`${Math.max(1,baseStageHeight*next)}px`;
      }

      setSurfaceScale(1);

      function nearestPage(){
        const baseY=(wrap.scrollTop+wrap.clientHeight*.45)/zoom;
        let lo=0,hi=metas.length-1,best=0;
        while(lo<=hi){
          const mid=(lo+hi)>>1;
          const el=metas[mid].el;
          if(el.offsetTop<=baseY){best=mid;lo=mid+1;}else hi=mid-1;
        }
        return Math.max(1,Math.min(pdf.numPages,best+1));
      }

      async function renderPage(meta){
        const targetZoom=zoom;
        if(!meta||Math.abs(meta.renderedZoom-targetZoom)<.01) return;
        const old=renderTasks.get(meta.num);
        if(old){try{old.cancel();}catch(_){} renderTasks.delete(meta.num);}
        try{
          const page=await pdf.getPage(meta.num);
          const base=page.getViewport({scale:1});
          const localFit=fitW/base.width;
          const viewport=page.getViewport({scale:localFit*targetZoom});
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
          if(Math.abs(targetZoom-zoom)>.01) return;
          meta.el.replaceChildren(canvas);
          meta.el.classList.remove("pdf-page-placeholder");
          meta.canvas=canvas;
          meta.renderedZoom=targetZoom;
        }catch(err){
          if(err?.name!=="RenderingCancelledException") console.warn("PDF render failed",meta?.num,err);
        }
      }

      function renderNeighborhood(){
        const start=Math.max(1,currentPage-2),end=Math.min(pdf.numPages,currentPage+3);
        for(let p=start;p<=end;p++) renderPage(metas[p-1]);
        for(const meta of metas){
          if(Math.abs(meta.num-currentPage)>8&&meta.canvas){
            meta.canvas.width=0;
            meta.canvas.height=0;
            meta.el.replaceChildren();
            meta.el.classList.add("pdf-page-placeholder");
            meta.canvas=null;
            meta.renderedZoom=0;
          }
        }
      }

      function syncCurrentFromScroll(){
        if(pinch) return;
        currentPage=nearestPage();
        updateControls();
        renderNeighborhood();
      }

      wrap.addEventListener("scroll",()=>{
        if(pinch||rafScroll) return;
        rafScroll=requestAnimationFrame(()=>{rafScroll=0;syncCurrentFromScroll();});
      },{passive:true});

      function clampZoom(v){return Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,v));}

      function applyAnchoredZoom(next,anchorX,anchorY,viewportX,viewportY,renderAfter){
        next=clampZoom(next);
        setSurfaceScale(next);
        wrap.scrollLeft=Math.max(0,anchorX*next-viewportX);
        wrap.scrollTop=Math.max(0,anchorY*next-viewportY);
        zoom=next;
        updateControls();
        if(renderAfter){
          currentPage=nearestPage();
          updateControls();
          metas.forEach(m=>m.renderedZoom=0);
          renderNeighborhood();
        }
      }

      function zoomAtCenter(next){
        const vx=wrap.clientWidth/2,vy=wrap.clientHeight/2;
        const ax=(wrap.scrollLeft+vx)/zoom;
        const ay=(wrap.scrollTop+vy)/zoom;
        applyAnchoredZoom(next,ax,ay,vx,vy,true);
      }

      prevBtn.onclick=()=>{
        if(pinch) return;
        currentPage=Math.max(1,currentPage-1);
        wrap.scrollTo({top:metas[currentPage-1].el.offsetTop*zoom,behavior:"smooth"});
        updateControls();renderNeighborhood();
      };
      nextBtn.onclick=()=>{
        if(pinch) return;
        currentPage=Math.min(pdf.numPages,currentPage+1);
        wrap.scrollTo({top:metas[currentPage-1].el.offsetTop*zoom,behavior:"smooth"});
        updateControls();renderNeighborhood();
      };
      zoomOut.onclick=()=>zoomAtCenter(zoom-STEP);
      zoomIn.onclick=()=>zoomAtCenter(zoom+STEP);
      zoomReset.onclick=()=>zoomAtCenter(1);

      const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const midpoint=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

      wrap.addEventListener("touchstart",e=>{
        if(e.touches.length!==2) return;
        const d=distance(e.touches);if(!d)return;
        const wr=wrap.getBoundingClientRect();
        const mid=midpoint(e.touches);
        const vx=mid.x-wr.left,vy=mid.y-wr.top;
        pinch={
          startD:d,
          startZoom:zoom,
          anchorX:(wrap.scrollLeft+vx)/zoom,
          anchorY:(wrap.scrollTop+vy)/zoom,
          pendingZoom:zoom
        };
        if(rafScroll){cancelAnimationFrame(rafScroll);rafScroll=0;}
        e.preventDefault();
      },{passive:false});

      wrap.addEventListener("touchmove",e=>{
        if(!pinch||e.touches.length!==2)return;
        e.preventDefault();
        const d=distance(e.touches);if(!d)return;
        const wr=wrap.getBoundingClientRect();
        const mid=midpoint(e.touches);
        const vx=Math.max(0,Math.min(wrap.clientWidth,mid.x-wr.left));
        const vy=Math.max(0,Math.min(wrap.clientHeight,mid.y-wr.top));
        const next=clampZoom(pinch.startZoom*(d/pinch.startD));
        pinch.pendingZoom=next;
        pendingGesture={next,vx,vy};
        if(!gestureRaf){
          gestureRaf=requestAnimationFrame(()=>{
            gestureRaf=0;
            if(!pinch||!pendingGesture)return;
            const g=pendingGesture;pendingGesture=null;
            applyAnchoredZoom(g.next,pinch.anchorX,pinch.anchorY,g.vx,g.vy,false);
          });
        }
      },{passive:false});

      function finishPinch(){
        if(!pinch)return;
        if(gestureRaf){cancelAnimationFrame(gestureRaf);gestureRaf=0;}
        if(pendingGesture){
          const g=pendingGesture;pendingGesture=null;
          applyAnchoredZoom(g.next,pinch.anchorX,pinch.anchorY,g.vx,g.vy,false);
        }
        pinch=null;
        currentPage=nearestPage();
        updateControls();
        metas.forEach(m=>m.renderedZoom=0);
        renderNeighborhood();
      }

      wrap.addEventListener("touchend",e=>{if(e.touches.length<2)finishPinch();},{passive:true});
      wrap.addEventListener("touchcancel",finishPinch,{passive:true});

      const openBtn=body.querySelector(".pdf-open-new-tab-btn");
      if(openBtn)openBtn.onclick=()=>openPdfInNewTab(fileUrl,safePdfName(entry));

      updateControls();
      renderNeighborhood();

      body._statPdfV2Cleanup=()=>{
        if(gestureRaf)cancelAnimationFrame(gestureRaf);
        if(rafScroll)cancelAnimationFrame(rafScroll);
        for(const task of renderTasks.values()){try{task.cancel();}catch(_){}}
        renderTasks.clear();
      };
    }catch(err){
      console.error("PDF preview v2 failed",err);
      try{if(pdf&&activePdfDoc===pdf){await pdf.destroy();activePdfDoc=null;}}catch(_){}
      body.innerHTML='<div class="preview-fallback">Couldn\'t open the PDF preview.<br><small>Use Open PDF instead.</small></div>';
    }
  };
})();