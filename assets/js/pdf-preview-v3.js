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
    let gestureOverlay=null;

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
        <div class="pdf-preview-shell stat-pdf-v3">
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
          <div class="pdf-canvas-wrap stat-pdf-v3-wrap" id="pdfCanvasWrap">
            <div class="pdf-pages stat-pdf-v3-pages" id="pdfPages"></div>
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

      const MIN_ZOOM=.5,MAX_ZOOM=3,STEP=.25,GAP=12;
      let zoom=1,currentPage=1,pinch=null,scrollRaf=0,gestureRaf=0,commitBusy=false;
      const metas=[],renderTasks=new Map();

      wrap.style.overflow="auto";
      wrap.style.webkitOverflowScrolling="touch";
      wrap.style.touchAction="pan-x pan-y";
      wrap.style.overscrollBehavior="contain";
      wrap.style.overflowAnchor="none";
      pagesHost.style.position="relative";
      pagesHost.style.overflowAnchor="none";
      pagesHost.style.margin="0 auto";

      const first=await pdf.getPage(1);
      const firstVp=first.getViewport({scale:1});
      const fitW=Math.max(220,wrap.clientWidth-24);
      const fitScale=fitW/firstVp.width;
      const baseW=firstVp.width*fitScale;
      const baseH=firstVp.height*fitScale;

      for(let i=1;i<=pdf.numPages;i++){
        const el=document.createElement("div");
        el.className="pdf-page pdf-page-placeholder stat-pdf-v3-page";
        el.dataset.page=String(i);
        el.style.width=`${baseW}px`;
        el.style.height=`${baseH}px`;
        el.style.margin=`0 auto ${GAP}px`;
        el.style.position="relative";
        el.style.overflow="hidden";
        el.style.overflowAnchor="none";
        pagesHost.appendChild(el);
        metas.push({num:i,el,renderedZoom:0,canvas:null});
      }

      function clampZoom(v){return Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,v));}

      function applyHostSize(next){
        const pageW=baseW*next;
        pagesHost.style.width=`${Math.max(wrap.clientWidth,pageW)}px`;
        for(const meta of metas){
          meta.el.style.width=`${pageW}px`;
          meta.el.style.height=`${baseH*next}px`;
        }
      }
      applyHostSize(1);

      function updateControls(displayZoom=zoom){
        pageInfo.textContent=`Page ${currentPage} / ${pdf.numPages}`;
        prevBtn.disabled=currentPage<=1;
        nextBtn.disabled=currentPage>=pdf.numPages;
        zoomLabel.textContent=`${Math.round(displayZoom*100)}%`;
        zoomOut.disabled=zoom<=MIN_ZOOM+.001;
        zoomIn.disabled=zoom>=MAX_ZOOM-.001;
      }

      function pageAt(clientX,clientY){
        let el=document.elementFromPoint(clientX,clientY)?.closest?.(".pdf-page");
        if(el&&pagesHost.contains(el)) return el;
        let best=metas[0]?.el||null,bestD=Infinity;
        for(const meta of metas){
          const r=meta.el.getBoundingClientRect();
          if(clientY>=r.top&&clientY<=r.bottom) return meta.el;
          const d=Math.min(Math.abs(clientY-r.top),Math.abs(clientY-r.bottom));
          if(d<bestD){bestD=d;best=meta.el;}
        }
        return best;
      }

      function captureAnchor(clientX,clientY){
        const wr=wrap.getBoundingClientRect();
        const x=Number.isFinite(clientX)?clientX:wr.left+wrap.clientWidth/2;
        const y=Number.isFinite(clientY)?clientY:wr.top+wrap.clientHeight/2;
        const el=pageAt(x,y);
        const pageNum=Math.max(1,Math.min(pdf.numPages,Number(el?.dataset?.page)||currentPage));
        const r=metas[pageNum-1].el.getBoundingClientRect();
        return {
          pageNum,
          fracX:Math.max(0,Math.min(1,(x-r.left)/Math.max(1,r.width))),
          fracY:Math.max(0,Math.min(1,(y-r.top)/Math.max(1,r.height))),
          viewportX:Math.max(0,Math.min(wrap.clientWidth,x-wr.left)),
          viewportY:Math.max(0,Math.min(wrap.clientHeight,y-wr.top))
        };
      }

      function restoreAnchor(a){
        const el=metas[a.pageNum-1]?.el;
        if(!el) return;
        const wr=wrap.getBoundingClientRect();
        const r=el.getBoundingClientRect();
        const pageLeft=wrap.scrollLeft+(r.left-wr.left);
        const pageTop=wrap.scrollTop+(r.top-wr.top);
        wrap.scrollLeft=Math.max(0,pageLeft+r.width*a.fracX-a.viewportX);
        wrap.scrollTop=Math.max(0,pageTop+r.height*a.fracY-a.viewportY);
        currentPage=a.pageNum;
      }

      function nearestPage(){
        const wr=wrap.getBoundingClientRect();
        const el=pageAt(wr.left+wrap.clientWidth/2,wr.top+wrap.clientHeight*.45);
        return Math.max(1,Math.min(pdf.numPages,Number(el?.dataset?.page)||1));
      }

      async function renderPage(meta,targetZoom=zoom){
        if(!meta||Math.abs(meta.renderedZoom-targetZoom)<.015) return;
        const old=renderTasks.get(meta.num);
        if(old){try{old.cancel();}catch(_){} renderTasks.delete(meta.num);}
        try{
          const page=await pdf.getPage(meta.num);
          const vp=page.getViewport({scale:fitScale*targetZoom});
          const dpr=Math.min(window.devicePixelRatio||1,1.75);
          const canvas=document.createElement("canvas");
          canvas.className="pdf-page-canvas";
          canvas.width=Math.max(1,Math.floor(vp.width*dpr));
          canvas.height=Math.max(1,Math.floor(vp.height*dpr));
          canvas.style.width="100%";
          canvas.style.height="100%";
          canvas.style.display="block";
          const ctx=canvas.getContext("2d",{alpha:false});
          const task=page.render({canvasContext:ctx,viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
          renderTasks.set(meta.num,task);
          await task.promise;
          renderTasks.delete(meta.num);
          if(Math.abs(targetZoom-zoom)>.025) return;
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
        for(let p=start;p<=end;p++) renderPage(metas[p-1],zoom);
        for(const meta of metas){
          if(Math.abs(meta.num-currentPage)>10&&meta.canvas){
            meta.canvas.width=0;meta.canvas.height=0;
            meta.el.replaceChildren();
            meta.el.classList.add("pdf-page-placeholder");
            meta.canvas=null;meta.renderedZoom=0;
          }
        }
      }

      function removeGestureOverlay(){
        if(gestureOverlay){
          gestureOverlay.remove();
          gestureOverlay=null;
        }
      }

      function makeGestureOverlay(anchor){
        removeGestureOverlay();
        const wr=wrap.getBoundingClientRect();
        const layer=document.createElement("div");
        layer.style.position="fixed";
        layer.style.left=`${wr.left}px`;
        layer.style.top=`${wr.top}px`;
        layer.style.width=`${wrap.clientWidth}px`;
        layer.style.height=`${wrap.clientHeight}px`;
        layer.style.overflow="hidden";
        layer.style.pointerEvents="none";
        layer.style.zIndex="2147483000";
        layer.style.background=getComputedStyle(wrap).backgroundColor||"#111";

        const shot=document.createElement("canvas");
        const dpr=Math.min(window.devicePixelRatio||1,2);
        shot.width=Math.max(1,Math.round(wrap.clientWidth*dpr));
        shot.height=Math.max(1,Math.round(wrap.clientHeight*dpr));
        shot.style.width="100%";
        shot.style.height="100%";
        shot.style.display="block";
        shot.style.transformOrigin=`${anchor.viewportX}px ${anchor.viewportY}px`;
        shot.style.willChange="transform";
        const ctx=shot.getContext("2d",{alpha:false});
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.fillStyle=getComputedStyle(wrap).backgroundColor||"#111";
        ctx.fillRect(0,0,wrap.clientWidth,wrap.clientHeight);

        for(const meta of metas){
          const r=meta.el.getBoundingClientRect();
          if(r.bottom<=wr.top||r.top>=wr.bottom) continue;
          const x=r.left-wr.left,y=r.top-wr.top;
          ctx.fillStyle="#fff";
          ctx.fillRect(x,y,r.width,r.height);
          if(meta.canvas&&meta.canvas.width&&meta.canvas.height){
            try{ctx.drawImage(meta.canvas,x,y,r.width,r.height);}catch(_){}
          }
        }

        layer.appendChild(shot);
        document.body.appendChild(layer);
        gestureOverlay=layer;
        return shot;
      }

      function commitZoom(next,a,done){
        if(commitBusy) return;
        next=clampZoom(next);
        commitBusy=true;

        pagesHost.style.visibility="hidden";
        wrap.scrollTop=done?.startScrollTop??wrap.scrollTop;
        wrap.scrollLeft=done?.startScrollLeft??wrap.scrollLeft;
        zoom=next;
        applyHostSize(zoom);
        void pagesHost.offsetHeight;
        restoreAnchor(a);
        updateControls();

        requestAnimationFrame(()=>{
          restoreAnchor(a);
          pagesHost.style.visibility="visible";
          wrap.style.overflow="auto";
          wrap.style.webkitOverflowScrolling="touch";
          wrap.style.touchAction="pan-x pan-y";
          removeGestureOverlay();
          metas.forEach(m=>m.renderedZoom=0);
          renderNeighborhood();
          commitBusy=false;
        });
      }

      function zoomAtCenter(next){
        if(pinch||commitBusy) return;
        const wr=wrap.getBoundingClientRect();
        const a=captureAnchor(wr.left+wrap.clientWidth/2,wr.top+wrap.clientHeight/2);
        const shot=makeGestureOverlay(a);
        pagesHost.style.visibility="hidden";
        wrap.style.overflow="hidden";
        wrap.style.touchAction="none";
        commitZoom(next,a,{startScrollTop:wrap.scrollTop,startScrollLeft:wrap.scrollLeft,shot});
      }

      wrap.addEventListener("scroll",()=>{
        if(pinch||commitBusy||scrollRaf) return;
        scrollRaf=requestAnimationFrame(()=>{
          scrollRaf=0;
          currentPage=nearestPage();
          updateControls();
          renderNeighborhood();
        });
      },{passive:true});

      prevBtn.onclick=()=>{
        if(pinch||commitBusy) return;
        currentPage=Math.max(1,currentPage-1);
        wrap.scrollTo({top:metas[currentPage-1].el.offsetTop,behavior:"smooth"});
        updateControls();renderNeighborhood();
      };
      nextBtn.onclick=()=>{
        if(pinch||commitBusy) return;
        currentPage=Math.min(pdf.numPages,currentPage+1);
        wrap.scrollTo({top:metas[currentPage-1].el.offsetTop,behavior:"smooth"});
        updateControls();renderNeighborhood();
      };
      zoomOut.onclick=()=>zoomAtCenter(zoom-STEP);
      zoomIn.onclick=()=>zoomAtCenter(zoom+STEP);
      zoomReset.onclick=()=>zoomAtCenter(1);

      const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const midpoint=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

      wrap.addEventListener("touchstart",e=>{
        if(e.touches.length!==2||commitBusy) return;
        const d=distance(e.touches);if(!d)return;
        const mid=midpoint(e.touches);
        const wr=wrap.getBoundingClientRect();
        const anchor=captureAnchor(mid.x,mid.y);
        const shot=makeGestureOverlay(anchor);
        pinch={
          startD:d,
          startZoom:zoom,
          pendingZoom:zoom,
          anchor,
          shot,
          startMidX:mid.x,
          startMidY:mid.y,
          lastMidX:mid.x,
          lastMidY:mid.y,
          startScrollTop:wrap.scrollTop,
          startScrollLeft:wrap.scrollLeft
        };
        if(scrollRaf){cancelAnimationFrame(scrollRaf);scrollRaf=0;}
        pagesHost.style.visibility="hidden";
        wrap.style.overflow="hidden";
        wrap.style.webkitOverflowScrolling="auto";
        wrap.style.touchAction="none";
        e.preventDefault();
      },{capture:true,passive:false});

      wrap.addEventListener("touchmove",e=>{
        if(!pinch||e.touches.length!==2) return;
        e.preventDefault();
        const d=distance(e.touches);if(!d)return;
        const mid=midpoint(e.touches);
        pinch.lastMidX=mid.x;pinch.lastMidY=mid.y;
        pinch.pendingZoom=clampZoom(pinch.startZoom*(d/pinch.startD));
        const s=pinch.pendingZoom/pinch.startZoom;
        const dx=mid.x-pinch.startMidX;
        const dy=mid.y-pinch.startMidY;
        if(!gestureRaf){
          gestureRaf=requestAnimationFrame(()=>{
            gestureRaf=0;
            if(!pinch) return;
            pinch.shot.style.transform=`translate(${dx}px,${dy}px) scale(${s})`;
            updateControls(pinch.pendingZoom);
          });
        }
      },{capture:true,passive:false});

      function finishPinch(){
        if(!pinch) return;
        if(gestureRaf){cancelAnimationFrame(gestureRaf);gestureRaf=0;}
        const done=pinch;pinch=null;
        const wr=wrap.getBoundingClientRect();
        done.anchor.viewportX=Math.max(0,Math.min(wrap.clientWidth,done.lastMidX-wr.left));
        done.anchor.viewportY=Math.max(0,Math.min(wrap.clientHeight,done.lastMidY-wr.top));
        commitZoom(done.pendingZoom,done.anchor,done);
      }

      wrap.addEventListener("touchend",e=>{if(pinch&&e.touches.length<2) finishPinch();},{capture:true,passive:true});
      wrap.addEventListener("touchcancel",finishPinch,{capture:true,passive:true});

      const openBtn=body.querySelector(".pdf-open-new-tab-btn");
      if(openBtn) openBtn.onclick=()=>openPdfInNewTab(fileUrl,safePdfName(entry));

      updateControls();
      renderNeighborhood();

      body._statPdfV3Cleanup=()=>{
        removeGestureOverlay();
        if(gestureRaf)cancelAnimationFrame(gestureRaf);
        if(scrollRaf)cancelAnimationFrame(scrollRaf);
        for(const task of renderTasks.values()){try{task.cancel();}catch(_){}}
        renderTasks.clear();
      };
    }catch(err){
      removeGestureOverlay();
      console.error("PDF preview v3 failed",err);
      try{if(pdf&&activePdfDoc===pdf){await pdf.destroy();activePdfDoc=null;}}catch(_){}
      body.innerHTML='<div class="preview-fallback">Couldn\'t open the PDF preview.<br><small>Use Open PDF instead.</small></div>';
    }
  };
})();