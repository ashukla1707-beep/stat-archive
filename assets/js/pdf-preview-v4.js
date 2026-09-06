(function(){
  "use strict";
  if(typeof window.previewEntry!=="function") return;
  const originalPreviewEntry=window.previewEntry;

  function isPdf(entry){
    const n=String(entry?.filename||"").toLowerCase();
    return n.endsWith(".pdf")||String(entry?.type||"").toLowerCase().includes("pdf");
  }
  function safeName(entry){
    const t=String(entry?.title||"Document").trim()||"Document";
    return (t.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim()||"Document")+".pdf";
  }

  window.previewEntry=async function(entry){
    if(!isPdf(entry)) return originalPreviewEntry(entry);
    try{window.closePreview?.();}catch(_){}

    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    const title=document.getElementById("previewTitle");
    if(!overlay||!body||!title) return originalPreviewEntry(entry);

    const fileUrl=`${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
    title.textContent=entry.title||"PDF";
    body.innerHTML='<div class="pdf-preview-loading">Loading preview…</div>';
    overlay.style.display="flex";
    document.body.classList.add("no-scroll");
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");

    let pdf=null;
    try{
      const res=await fetch(fileUrl,{cache:"no-store"});
      if(!res.ok) throw new Error("Could not load PDF");
      const pdfjsLib=await loadPdfJs();
      pdf=await pdfjsLib.getDocument({
        data:await (await res.blob()).arrayBuffer(),
        cMapUrl:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked:true
      }).promise;
      activePdfDoc=pdf;

      body.innerHTML=`
        <div class="pdf-preview-shell stat-pdf-v4">
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
          <div class="pdf-canvas-wrap stat-pdf-v4-wrap" id="pdfCanvasWrap">
            <div id="pdfViewportSizer" style="position:relative;min-width:100%;">
              <div class="pdf-pages stat-pdf-v4-pages" id="pdfPages"></div>
            </div>
          </div>
          <div class="pdf-open-new-tab-bottom"><button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button></div>
        </div>`;

      const wrap=document.getElementById("pdfCanvasWrap");
      const sizer=document.getElementById("pdfViewportSizer");
      const host=document.getElementById("pdfPages");
      const info=document.getElementById("pdfPageInfo");
      const prev=document.getElementById("pdfPrevBtn");
      const next=document.getElementById("pdfNextBtn");
      const out=document.getElementById("pdfZoomOutBtn");
      const inc=document.getElementById("pdfZoomInBtn");
      const reset=document.getElementById("pdfZoomResetBtn");
      const label=document.getElementById("pdfZoomLevel");

      const MIN=.5,MAX=3,STEP=.25,GAP=12;
      let zoom=1,current=1,pinch=null,gestureRaf=0,scrollRaf=0,geometryQueueRaf=0;
      const metas=[],tasks=new Map(),geometryPromises=new Map();

      wrap.style.overflow="auto";
      wrap.style.webkitOverflowScrolling="touch";
      wrap.style.touchAction="pan-x pan-y";
      wrap.style.overscrollBehavior="contain";
      wrap.style.overflowAnchor="none";
      host.style.position="absolute";
      host.style.left="0";
      host.style.top="0";
      host.style.transformOrigin="0 0";
      host.style.willChange="transform";
      host.style.overflowAnchor="none";

      const p1=await pdf.getPage(1);
      const vp1=p1.getViewport({scale:1});
      const fitW=Math.max(220,wrap.clientWidth-24);
      const firstFit=fitW/vp1.width;
      const fallbackW=vp1.width*firstFit;
      const fallbackH=vp1.height*firstFit;

      host.style.width=`${Math.max(wrap.clientWidth,fallbackW)}px`;
      for(let i=1;i<=pdf.numPages;i++){
        const el=document.createElement("div");
        el.className="pdf-page pdf-page-placeholder stat-pdf-v4-page";
        el.dataset.page=String(i);
        el.style.width=`${fallbackW}px`;
        el.style.height=`${fallbackH}px`;
        el.style.margin=`0 auto ${GAP}px`;
        el.style.position="relative";
        el.style.overflow="hidden";
        el.style.overflowAnchor="none";
        host.appendChild(el);
        metas.push({
          num:i,
          el,
          canvas:null,
          renderedZoom:0,
          geometryReady:false,
          baseW:fallbackW,
          baseH:fallbackH,
          fit:firstFit
        });
      }

      function clamp(v){return Math.max(MIN,Math.min(MAX,v));}

      function refreshStageSize(){
        const baseW=Math.max(wrap.clientWidth,host.scrollWidth);
        const baseH=Math.max(1,host.scrollHeight);
        sizer.style.width=`${Math.max(wrap.clientWidth,baseW*zoom)}px`;
        sizer.style.height=`${Math.max(1,baseH*zoom)}px`;
      }

      function updateControls(display=zoom){
        info.textContent=`Page ${current} / ${pdf.numPages}`;
        prev.disabled=current<=1;
        next.disabled=current>=pdf.numPages;
        label.textContent=`${Math.round(display*100)}%`;
        out.disabled=zoom<=MIN+.001;
        inc.disabled=zoom>=MAX-.001;
      }

      function applyView(z){
        zoom=clamp(z);
        host.style.transform=`scale(${zoom})`;
        refreshStageSize();
      }
      applyView(1);

      function pageFromScroll(){
        const baseY=(wrap.scrollTop+wrap.clientHeight*.45)/zoom;
        let lo=0,hi=metas.length-1,best=0;
        while(lo<=hi){
          const mid=(lo+hi)>>1;
          if(metas[mid].el.offsetTop<=baseY){best=mid;lo=mid+1;}else hi=mid-1;
        }
        return Math.max(1,Math.min(pdf.numPages,best+1));
      }

      function pageAt(clientX,clientY){
        let el=document.elementFromPoint(clientX,clientY)?.closest?.(".pdf-page");
        if(el&&host.contains(el)) return el;
        const wr=wrap.getBoundingClientRect();
        const baseY=(wrap.scrollTop+(clientY-wr.top))/zoom;
        let best=metas[0]?.el||null,bestD=Infinity;
        for(const m of metas){
          const top=m.el.offsetTop,bottom=top+m.el.offsetHeight;
          if(baseY>=top&&baseY<=bottom) return m.el;
          const d=Math.min(Math.abs(baseY-top),Math.abs(baseY-bottom));
          if(d<bestD){bestD=d;best=m.el;}
        }
        return best;
      }

      function capturePageAnchor(clientX,clientY){
        const wr=wrap.getBoundingClientRect();
        const vx=Math.max(0,Math.min(wrap.clientWidth,clientX-wr.left));
        const vy=Math.max(0,Math.min(wrap.clientHeight,clientY-wr.top));
        const el=pageAt(clientX,clientY);
        const pageNum=Math.max(1,Math.min(pdf.numPages,Number(el?.dataset?.page)||current));
        const m=metas[pageNum-1];
        const baseX=(wrap.scrollLeft+vx)/zoom;
        const baseY=(wrap.scrollTop+vy)/zoom;
        return {
          pageNum,
          fracX:Math.max(0,Math.min(1,(baseX-m.el.offsetLeft)/Math.max(1,m.el.offsetWidth))),
          fracY:Math.max(0,Math.min(1,(baseY-m.el.offsetTop)/Math.max(1,m.el.offsetHeight)))
        };
      }

      function keepPageAnchor(a,vx,vy){
        const m=metas[a.pageNum-1];
        if(!m) return;
        const baseX=m.el.offsetLeft+a.fracX*m.el.offsetWidth;
        const baseY=m.el.offsetTop+a.fracY*m.el.offsetHeight;
        wrap.scrollLeft=Math.max(0,baseX*zoom-vx);
        wrap.scrollTop=Math.max(0,baseY*zoom-vy);
        current=a.pageNum;
      }

      async function ensureGeometry(meta,preserveViewport=true){
        if(!meta||meta.geometryReady) return meta;
        if(geometryPromises.has(meta.num)) return geometryPromises.get(meta.num);

        const promise=(async()=>{
          try{
            let anchor=null,vx=0,vy=0;
            if(preserveViewport&&!pinch){
              const wr=wrap.getBoundingClientRect();
              vx=wrap.clientWidth/2;
              vy=wrap.clientHeight*.45;
              anchor=capturePageAnchor(wr.left+vx,wr.top+vy);
            }

            const page=await pdf.getPage(meta.num);
            const vp=page.getViewport({scale:1});
            const localFit=fitW/vp.width;
            const newW=vp.width*localFit;
            const newH=vp.height*localFit;

            meta.baseW=newW;
            meta.baseH=newH;
            meta.fit=localFit;
            meta.geometryReady=true;

            meta.el.style.width=`${newW}px`;
            meta.el.style.height=`${newH}px`;
            refreshStageSize();

            if(anchor&&!pinch){
              keepPageAnchor(anchor,vx,vy);
              updateControls();
            }
            return meta;
          }finally{
            geometryPromises.delete(meta.num);
          }
        })();

        geometryPromises.set(meta.num,promise);
        return promise;
      }

      async function renderPage(meta,target=zoom){
        if(!meta||Math.abs(meta.renderedZoom-target)<.08) return;
        const old=tasks.get(meta.num);
        if(old){try{old.cancel();}catch(_){} tasks.delete(meta.num);}
        try{
          await ensureGeometry(meta,true);
          const page=await pdf.getPage(meta.num);
          const vp=page.getViewport({scale:meta.fit*target});
          const dpr=Math.min(window.devicePixelRatio||1,1.8);
          const canvas=document.createElement("canvas");
          canvas.className="pdf-page-canvas";
          canvas.width=Math.max(1,Math.floor(vp.width*dpr));
          canvas.height=Math.max(1,Math.floor(vp.height*dpr));
          canvas.style.width=`${meta.baseW}px`;
          canvas.style.height=`${meta.baseH}px`;
          canvas.style.display="block";
          const ctx=canvas.getContext("2d",{alpha:false});
          const task=page.render({
            canvasContext:ctx,
            viewport:vp,
            transform:dpr!==1?[dpr,0,0,dpr,0,0]:null
          });
          tasks.set(meta.num,task);
          await task.promise;
          tasks.delete(meta.num);
          if(Math.abs(target-zoom)>.12) return;
          meta.el.replaceChildren(canvas);
          meta.el.classList.remove("pdf-page-placeholder");
          meta.canvas=canvas;
          meta.renderedZoom=target;
        }catch(e){
          if(e?.name!=="RenderingCancelledException") console.warn("PDF render failed",meta?.num,e);
        }
      }

      function queueGeometryAround(pageNum){
        if(geometryQueueRaf) return;
        geometryQueueRaf=requestAnimationFrame(()=>{
          geometryQueueRaf=0;
          const order=[];
          for(let d=0;d<=8;d++){
            const a=pageNum-d,b=pageNum+d;
            if(a>=1) order.push(a);
            if(d&&b<=pdf.numPages) order.push(b);
          }
          let i=0;
          const pump=()=>{
            if(i>=order.length) return;
            const p=order[i++];
            ensureGeometry(metas[p-1],true).finally(()=>setTimeout(pump,0));
          };
          pump();
        });
      }

      function renderNear(){
        queueGeometryAround(current);
        const a=Math.max(1,current-3),b=Math.min(pdf.numPages,current+4);
        for(let p=a;p<=b;p++) renderPage(metas[p-1],zoom);
        if(pinch) return;
        for(const m of metas){
          if(Math.abs(m.num-current)>14&&m.canvas){
            m.canvas.width=0;
            m.canvas.height=0;
            m.el.replaceChildren();
            m.el.classList.add("pdf-page-placeholder");
            m.canvas=null;
            m.renderedZoom=0;
          }
        }
      }

      wrap.addEventListener("scroll",()=>{
        if(pinch||scrollRaf) return;
        scrollRaf=requestAnimationFrame(()=>{
          scrollRaf=0;
          current=pageFromScroll();
          updateControls();
          renderNear();
        });
      },{passive:true});

      function centerZoom(z){
        if(pinch) return;
        const wr=wrap.getBoundingClientRect();
        const vx=wrap.clientWidth/2,vy=wrap.clientHeight/2;
        const a=capturePageAnchor(wr.left+vx,wr.top+vy);
        applyView(z);
        keepPageAnchor(a,vx,vy);
        updateControls();
        renderNear();
      }

      prev.onclick=()=>{
        current=Math.max(1,current-1);
        ensureGeometry(metas[current-1],false).finally(()=>{
          wrap.scrollTo({top:metas[current-1].el.offsetTop*zoom,behavior:"smooth"});
          updateControls();renderNear();
        });
      };
      next.onclick=()=>{
        current=Math.min(pdf.numPages,current+1);
        ensureGeometry(metas[current-1],false).finally(()=>{
          wrap.scrollTo({top:metas[current-1].el.offsetTop*zoom,behavior:"smooth"});
          updateControls();renderNear();
        });
      };
      out.onclick=()=>centerZoom(zoom-STEP);
      inc.onclick=()=>centerZoom(zoom+STEP);
      reset.onclick=()=>centerZoom(1);

      const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
      const mid=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

      wrap.addEventListener("touchstart",e=>{
        if(e.touches.length!==2) return;
        const d=dist(e.touches); if(!d) return;
        const wr=wrap.getBoundingClientRect();
        const m=mid(e.touches);
        const vx=Math.max(0,Math.min(wrap.clientWidth,m.x-wr.left));
        const vy=Math.max(0,Math.min(wrap.clientHeight,m.y-wr.top));
        const anchor=capturePageAnchor(m.x,m.y);
        pinch={startD:d,startZoom:zoom,pendingZoom:zoom,anchor,lastVX:vx,lastVY:vy};
        current=anchor.pageNum;
        if(scrollRaf){cancelAnimationFrame(scrollRaf);scrollRaf=0;}
        const sx=wrap.scrollLeft,sy=wrap.scrollTop;
        wrap.style.webkitOverflowScrolling="auto";
        wrap.style.touchAction="none";
        wrap.scrollLeft=sx;
        wrap.scrollTop=sy;
        renderNear();
        updateControls();
        e.preventDefault();
      },{capture:true,passive:false});

      wrap.addEventListener("touchmove",e=>{
        if(!pinch||e.touches.length!==2) return;
        e.preventDefault();
        const d=dist(e.touches); if(!d) return;
        const wr=wrap.getBoundingClientRect();
        const m=mid(e.touches);
        pinch.lastVX=Math.max(0,Math.min(wrap.clientWidth,m.x-wr.left));
        pinch.lastVY=Math.max(0,Math.min(wrap.clientHeight,m.y-wr.top));
        pinch.pendingZoom=clamp(pinch.startZoom*(d/pinch.startD));
        if(!gestureRaf){
          gestureRaf=requestAnimationFrame(()=>{
            gestureRaf=0;
            if(!pinch) return;
            applyView(pinch.pendingZoom);
            keepPageAnchor(pinch.anchor,pinch.lastVX,pinch.lastVY);
            updateControls(pinch.pendingZoom);
          });
        }
      },{capture:true,passive:false});

      function finishPinch(){
        if(!pinch) return;
        if(gestureRaf){cancelAnimationFrame(gestureRaf);gestureRaf=0;}
        const p=pinch;
        applyView(p.pendingZoom);
        keepPageAnchor(p.anchor,p.lastVX,p.lastVY);
        pinch=null;
        wrap.style.webkitOverflowScrolling="touch";
        wrap.style.touchAction="pan-x pan-y";
        current=p.anchor.pageNum;
        updateControls();
        renderNear();
      }

      wrap.addEventListener("touchend",e=>{if(pinch&&e.touches.length<2)finishPinch();},{capture:true,passive:true});
      wrap.addEventListener("touchcancel",finishPinch,{capture:true,passive:true});

      const openBtn=body.querySelector(".pdf-open-new-tab-btn");
      if(openBtn) openBtn.onclick=()=>openPdfInNewTab(fileUrl,safeName(entry));

      await ensureGeometry(metas[0],false);
      updateControls();
      renderNear();

      body._statPdfV4Cleanup=()=>{
        if(gestureRaf) cancelAnimationFrame(gestureRaf);
        if(scrollRaf) cancelAnimationFrame(scrollRaf);
        if(geometryQueueRaf) cancelAnimationFrame(geometryQueueRaf);
        for(const t of tasks.values()){try{t.cancel();}catch(_){}}
        tasks.clear();
        geometryPromises.clear();
      };
    }catch(err){
      console.error("PDF preview v4 failed",err);
      try{if(pdf&&activePdfDoc===pdf){await pdf.destroy();activePdfDoc=null;}}catch(_){}
      body.innerHTML='<div class="preview-fallback">Couldn\'t open the PDF preview.<br><small>Use Open PDF instead.</small></div>';
    }
  };
})();
