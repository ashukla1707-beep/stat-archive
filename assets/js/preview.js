(function(){
  "use strict";

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;
  const PAGE_GAP = 12;
  const SIDE_PAD = 12;

  let session = null;
  let token = 0;

  const HTML_ESCAPE_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  function escapeHtml(s){ return String(s || "").replace(/[&<>"']/g,c=>HTML_ESCAPE_MAP[c]); }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function isPdf(entry){
    const n=String(entry?.filename||"").toLowerCase();
    return n.endsWith(".pdf") || String(entry?.type||"").toLowerCase().includes("pdf");
  }
  function safePdfName(entry){
    const t=String(entry?.title||"Document").trim()||"Document";
    return (t.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim()||"Document")+".pdf";
  }

  async function blobToBase64(blob){
    return await new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>{
        const s=String(r.result||"");
        const i=s.indexOf(",");
        i>=0?resolve(s.slice(i+1)):reject(new Error("Could not encode PDF"));
      };
      r.onerror=()=>reject(r.error||new Error("Could not read PDF"));
      r.readAsDataURL(blob);
    });
  }

  async function openPdfInNewTab(url,filename="document.pdf"){
    try{
      const res=await fetch(url,{cache:"no-store",credentials:"omit"});
      if(!res.ok) throw new Error(`PDF request failed (${res.status})`);
      const raw=await res.blob();
      const blob=raw.type==="application/pdf"?raw:new Blob([raw],{type:"application/pdf"});
      if(window.AndroidBridge&&typeof window.AndroidBridge.openFile==="function"){
        window.AndroidBridge.openFile(await blobToBase64(blob),filename||"document.pdf","application/pdf");
        return;
      }
      const objectUrl=URL.createObjectURL(blob);
      const w=window.open(objectUrl,"_blank","noopener");
      if(!w) alert("Popup blocked. Please allow popups for this site.");
      setTimeout(()=>URL.revokeObjectURL(objectUrl),300000);
    }catch(err){
      console.error("Open PDF failed",err);
      alert("Couldn't open the PDF.");
    }
  }

  function clearSession(){
    const s=session;
    session=null;
    if(!s) return;
    try{s.abort?.abort();}catch(_){}
    if(s.scrollRaf) cancelAnimationFrame(s.scrollRaf);
    if(s.gestureRaf) cancelAnimationFrame(s.gestureRaf);
    for(const task of s.tasks?.values?.()||[]){ try{task.cancel();}catch(_){} }
    try{s.pdf?.destroy?.();}catch(_){}
  }

  function closePreview(){
    token++;
    clearSession();
    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    const card=document.querySelector("#previewOverlay .preview-card");
    if(overlay) overlay.style.display="none";
    if(body) body.innerHTML="";
    card?.classList.remove("pdf-preview-active");
    document.body.classList.remove("no-scroll");
  }

  function installViewerCss(){
    if(document.getElementById("statPreviewFreshCss")) return;
    const style=document.createElement("style");
    style.id="statPreviewFreshCss";
    style.textContent=`
#previewOverlay .stat-preview-shell{display:flex;flex-direction:column;min-height:0;height:100%;background:#0b0f16}
#previewOverlay .stat-preview-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border-bottom:1px solid rgba(148,163,184,.15);background:#0d131c;position:relative;z-index:5}
#previewOverlay .stat-preview-group{display:flex;align-items:center;gap:6px;min-width:0}
#previewOverlay .stat-preview-btn{border:1px solid rgba(148,163,184,.22);background:#141c27;color:#e7edf5;border-radius:8px;min-width:34px;height:32px;padding:0 9px;font:700 11px 'JetBrains Mono',monospace}
#previewOverlay .stat-preview-btn:disabled{opacity:.35}
#previewOverlay .stat-preview-info,#previewOverlay .stat-preview-zoom{font:700 10px 'JetBrains Mono',monospace;color:#cbd5e1;white-space:nowrap}
#previewOverlay .stat-preview-wrap{position:relative;flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior:contain;background:#080c12;overflow-anchor:none}
#previewOverlay .stat-preview-sizer{position:relative;min-width:100%;min-height:100%;overflow-anchor:none}
#previewOverlay .stat-preview-surface{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;overflow-anchor:none}
#previewOverlay .stat-preview-page{position:absolute;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.28);overflow:hidden;contain:layout paint;overflow-anchor:none}
#previewOverlay .stat-preview-page canvas{display:block;width:100%;height:100%}
#previewOverlay .stat-preview-placeholder:after{content:'Loading page…';position:absolute;inset:0;display:grid;place-items:center;color:#8793a6;background:#eef1f4;font:600 10px 'JetBrains Mono',monospace}
#previewOverlay .stat-preview-bottom{padding:8px;border-top:1px solid rgba(148,163,184,.15);background:#0d131c;display:flex;justify-content:center}
#previewOverlay .stat-preview-open{min-width:180px}
#previewOverlay .stat-preview-loading{padding:40px 18px;text-align:center;color:#aab5c5;font:600 11px 'JetBrains Mono',monospace}
@media(max-width:700px){
  #previewOverlay .stat-preview-toolbar{padding:6px;gap:5px;flex-wrap:wrap}
  #previewOverlay .stat-preview-btn{min-width:32px;height:31px;padding:0 8px}
  #previewOverlay .stat-preview-bottom{padding:7px}
}
`;
    document.head.appendChild(style);
  }

  async function buildPdfViewer(entry,fileUrl,blob,myToken){
    const body=document.getElementById("previewBody");
    if(!body) return;
    const pdfjsLib=await loadPdfJs();
    const pdf=await pdfjsLib.getDocument({
      data:await blob.arrayBuffer(),
      cMapUrl:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked:true
    }).promise;
    if(myToken!==token){ pdf.destroy(); return; }

    body.innerHTML=`
      <div class="stat-preview-shell">
        <div class="stat-preview-toolbar">
          <div class="stat-preview-group">
            <button class="stat-preview-btn" id="spPrev" type="button">‹</button>
            <span class="stat-preview-info" id="spInfo">Page 1 / ${pdf.numPages}</span>
            <button class="stat-preview-btn" id="spNext" type="button">›</button>
          </div>
          <div class="stat-preview-group">
            <button class="stat-preview-btn" id="spOut" type="button">−</button>
            <span class="stat-preview-zoom" id="spZoom">100%</span>
            <button class="stat-preview-btn" id="spIn" type="button">+</button>
            <button class="stat-preview-btn" id="spReset" type="button">1:1</button>
          </div>
        </div>
        <div class="stat-preview-wrap" id="spWrap">
          <div class="stat-preview-sizer" id="spSizer">
            <div class="stat-preview-surface" id="spSurface"></div>
          </div>
        </div>
        <div class="stat-preview-bottom">
          <button class="submit-btn stat-preview-open" id="spOpen" type="button">↗ Open PDF</button>
        </div>
      </div>`;

    const wrap=document.getElementById("spWrap");
    const sizer=document.getElementById("spSizer");
    const surface=document.getElementById("spSurface");
    const info=document.getElementById("spInfo");
    const zoomText=document.getElementById("spZoom");
    const prev=document.getElementById("spPrev");
    const next=document.getElementById("spNext");
    const zin=document.getElementById("spIn");
    const zout=document.getElementById("spOut");
    const reset=document.getElementById("spReset");
    const open=document.getElementById("spOpen");

    const fitWidth=Math.max(220,wrap.clientWidth-(SIDE_PAD*2));
    const metas=new Array(pdf.numPages);
    const tasks=new Map();
    let worldHeight=SIDE_PAD;
    let worldWidth=fitWidth+(SIDE_PAD*2);

    const s={pdf,abort:new AbortController(),tasks,metas,wrap,sizer,surface,zoom:1,current:1,pinch:null,scrollRaf:0,gestureRaf:0,worldHeight,worldWidth};
    session=s;

    body.querySelector(".stat-preview-shell").insertAdjacentHTML("afterbegin",`<div class="stat-preview-loading" id="spPreparing">Preparing pages…</div>`);
    const preparing=document.getElementById("spPreparing");
    wrap.style.visibility="hidden";

    for(let start=1;start<=pdf.numPages;start+=16){
      if(myToken!==token) return;
      const end=Math.min(pdf.numPages,start+15);
      const batch=[];
      for(let n=start;n<=end;n++) batch.push(pdf.getPage(n).then(page=>({n,page,vp:page.getViewport({scale:1})})));
      const rows=await Promise.all(batch);
      for(const row of rows){
        const fit=fitWidth/row.vp.width;
        const w=row.vp.width*fit;
        const h=row.vp.height*fit;
        const meta={num:row.n,fit,baseW:w,baseH:h,x:SIDE_PAD,y:worldHeight,canvas:null,renderedZoom:0,el:null};
        metas[row.n-1]=meta;
        worldHeight+=h+PAGE_GAP;
      }
      if(preparing) preparing.textContent=`Preparing pages… ${end}/${pdf.numPages}`;
      await new Promise(r=>requestAnimationFrame(r));
    }
    worldHeight+=SIDE_PAD-PAGE_GAP;
    s.worldHeight=worldHeight;
    s.worldWidth=worldWidth;

    for(const meta of metas){
      const el=document.createElement("div");
      el.className="stat-preview-page stat-preview-placeholder";
      el.dataset.page=String(meta.num);
      el.style.left=`${meta.x}px`;
      el.style.top=`${meta.y}px`;
      el.style.width=`${meta.baseW}px`;
      el.style.height=`${meta.baseH}px`;
      surface.appendChild(el);
      meta.el=el;
    }
    surface.style.width=`${worldWidth}px`;
    surface.style.height=`${worldHeight}px`;
    preparing?.remove();
    wrap.style.visibility="visible";

    function setZoom(z){
      s.zoom=clamp(z,MIN_ZOOM,MAX_ZOOM);
      surface.style.transform=`scale(${s.zoom})`;
      sizer.style.width=`${Math.max(wrap.clientWidth,worldWidth*s.zoom)}px`;
      sizer.style.height=`${Math.max(wrap.clientHeight,worldHeight*s.zoom)}px`;
      zoomText.textContent=`${Math.round(s.zoom*100)}%`;
      zout.disabled=s.zoom<=MIN_ZOOM+.001;
      zin.disabled=s.zoom>=MAX_ZOOM-.001;
    }

    function pageForWorldY(y){
      let lo=0,hi=metas.length-1,best=0;
      while(lo<=hi){
        const mid=(lo+hi)>>1;
        const m=metas[mid];
        if(y>=m.y){best=mid;lo=mid+1;}else hi=mid-1;
      }
      const m=metas[best];
      if(y>m.y+m.baseH+PAGE_GAP&&best<metas.length-1) return best+2;
      return best+1;
    }

    function updateCurrent(forcePage){
      s.current=forcePage||pageForWorldY((wrap.scrollTop+wrap.clientHeight*.45)/s.zoom);
      info.textContent=`Page ${s.current} / ${pdf.numPages}`;
      prev.disabled=s.current<=1;
      next.disabled=s.current>=pdf.numPages;
    }

    async function renderPage(meta,targetZoom=s.zoom){
      if(!meta||Math.abs(meta.renderedZoom-targetZoom)<.08) return;
      const old=tasks.get(meta.num);
      if(old){try{old.cancel();}catch(_){} tasks.delete(meta.num);}
      try{
        const page=await pdf.getPage(meta.num);
        const vp=page.getViewport({scale:meta.fit*targetZoom});
        const dpr=Math.min(window.devicePixelRatio||1,1.8);
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.floor(vp.width*dpr));
        canvas.height=Math.max(1,Math.floor(vp.height*dpr));
        canvas.style.width=`${meta.baseW}px`;
        canvas.style.height=`${meta.baseH}px`;
        const ctx=canvas.getContext("2d",{alpha:false});
        const task=page.render({canvasContext:ctx,viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
        tasks.set(meta.num,task);
        await task.promise;
        tasks.delete(meta.num);
        if(myToken!==token||Math.abs(targetZoom-s.zoom)>.15) return;
        meta.el.replaceChildren(canvas);
        meta.el.classList.remove("stat-preview-placeholder");
        meta.canvas=canvas;
        meta.renderedZoom=targetZoom;
      }catch(err){
        if(err?.name!=="RenderingCancelledException") console.warn("PDF render failed",meta?.num,err);
      }
    }

    function renderVisible(){
      const top=(wrap.scrollTop-2*wrap.clientHeight)/s.zoom;
      const bottom=(wrap.scrollTop+3*wrap.clientHeight)/s.zoom;
      for(const m of metas){
        if(m.y+m.baseH>=top&&m.y<=bottom) renderPage(m,s.zoom);
        else if(!s.pinch&&m.canvas&&Math.abs(m.num-s.current)>14){
          m.canvas.width=0;m.canvas.height=0;m.el.replaceChildren();m.el.classList.add("stat-preview-placeholder");m.canvas=null;m.renderedZoom=0;
        }
      }
    }

    function zoomAround(nextZoom,vx,vy,wx,wy){
      setZoom(nextZoom);
      wrap.scrollLeft=Math.max(0,wx*s.zoom-vx);
      wrap.scrollTop=Math.max(0,wy*s.zoom-vy);
    }

    function centerZoom(nextZoom){
      if(s.pinch) return;
      const vx=wrap.clientWidth/2,vy=wrap.clientHeight/2;
      const wx=(wrap.scrollLeft+vx)/s.zoom,wy=(wrap.scrollTop+vy)/s.zoom;
      zoomAround(nextZoom,vx,vy,wx,wy);
      updateCurrent();renderVisible();
    }

    wrap.addEventListener("scroll",()=>{
      if(s.pinch||s.scrollRaf) return;
      s.scrollRaf=requestAnimationFrame(()=>{s.scrollRaf=0;updateCurrent();renderVisible();});
    },{passive:true});

    prev.onclick=()=>{s.current=Math.max(1,s.current-1);wrap.scrollTo({top:metas[s.current-1].y*s.zoom,behavior:"smooth"});updateCurrent(s.current);renderVisible();};
    next.onclick=()=>{s.current=Math.min(pdf.numPages,s.current+1);wrap.scrollTo({top:metas[s.current-1].y*s.zoom,behavior:"smooth"});updateCurrent(s.current);renderVisible();};
    zout.onclick=()=>centerZoom(s.zoom-ZOOM_STEP);
    zin.onclick=()=>centerZoom(s.zoom+ZOOM_STEP);
    reset.onclick=()=>centerZoom(1);
    open.onclick=()=>openPdfInNewTab(fileUrl,safePdfName(entry));

    const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const mid=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

    wrap.addEventListener("touchstart",e=>{
      if(e.touches.length!==2) return;
      const d=dist(e.touches);if(!d)return;
      const r=wrap.getBoundingClientRect(),m=mid(e.touches);
      const vx=clamp(m.x-r.left,0,wrap.clientWidth),vy=clamp(m.y-r.top,0,wrap.clientHeight);
      s.pinch={startD:d,startZoom:s.zoom,wx:(wrap.scrollLeft+vx)/s.zoom,wy:(wrap.scrollTop+vy)/s.zoom,lastVX:vx,lastVY:vy,pending:s.zoom,page:pageForWorldY((wrap.scrollTop+vy)/s.zoom)};
      if(s.scrollRaf){cancelAnimationFrame(s.scrollRaf);s.scrollRaf=0;}
      wrap.style.touchAction="none";
      e.preventDefault();
    },{capture:true,passive:false});

    wrap.addEventListener("touchmove",e=>{
      if(!s.pinch||e.touches.length!==2) return;
      e.preventDefault();
      const d=dist(e.touches);if(!d)return;
      const r=wrap.getBoundingClientRect(),m=mid(e.touches);
      s.pinch.lastVX=clamp(m.x-r.left,0,wrap.clientWidth);
      s.pinch.lastVY=clamp(m.y-r.top,0,wrap.clientHeight);
      s.pinch.pending=clamp(s.pinch.startZoom*(d/s.pinch.startD),MIN_ZOOM,MAX_ZOOM);
      if(!s.gestureRaf){
        s.gestureRaf=requestAnimationFrame(()=>{
          s.gestureRaf=0;if(!s.pinch)return;
          zoomAround(s.pinch.pending,s.pinch.lastVX,s.pinch.lastVY,s.pinch.wx,s.pinch.wy);
          zoomText.textContent=`${Math.round(s.pinch.pending*100)}%`;
          updateCurrent(s.pinch.page);
        });
      }
    },{capture:true,passive:false});

    function finishPinch(){
      if(!s.pinch) return;
      if(s.gestureRaf){cancelAnimationFrame(s.gestureRaf);s.gestureRaf=0;}
      const p=s.pinch;
      zoomAround(p.pending,p.lastVX,p.lastVY,p.wx,p.wy);
      s.pinch=null;
      wrap.style.touchAction="pan-x pan-y";
      updateCurrent();renderVisible();
    }
    wrap.addEventListener("touchend",e=>{if(s.pinch&&e.touches.length<2)finishPinch();},{capture:true,passive:true});
    wrap.addEventListener("touchcancel",finishPinch,{capture:true,passive:true});

    setZoom(1);
    updateCurrent(1);
    renderVisible();
  }

  async function previewEntry(entry){
    closePreview();
    installViewerCss();
    const myToken=++token;
    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    const title=document.getElementById("previewTitle");
    if(!overlay||!body||!title) return;

    overlay.style.display="flex";
    document.body.classList.add("no-scroll");
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");
    title.textContent=entry?.title||entry?.filename||"Preview";
    body.innerHTML='<div class="stat-preview-loading">Loading preview…</div>';
    try{ if(typeof incrementActivity==="function") incrementActivity("preview"); }catch(_){}

    const fileUrl=`${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
    const abort=new AbortController();
    session={abort,tasks:new Map()};

    try{
      const res=await fetch(fileUrl,{cache:"no-store",signal:abort.signal});
      if(!res.ok) throw new Error(`File request failed (${res.status})`);
      const blob=await res.blob();
      if(myToken!==token) return;

      const pdfLike=isPdf(entry)||blob.type.toLowerCase().includes("pdf");
      if(pdfLike){
        await buildPdfViewer(entry,fileUrl,blob,myToken);
        return;
      }

      if(blob.type.startsWith("image/")){
        const url=URL.createObjectURL(blob);
        body.innerHTML=`<div style="display:grid;place-items:center;min-height:55vh;background:#080c12"><img src="${url}" alt="${escapeHtml(entry?.title||"Preview")}" style="max-width:100%;max-height:75vh;object-fit:contain"></div>`;
        return;
      }

      body.innerHTML='<div class="stat-preview-loading">Preview is unavailable for this file type.</div>';
    }catch(err){
      if(err?.name==="AbortError") return;
      console.error("Preview failed",err);
      body.innerHTML='<div class="stat-preview-loading">Couldn\'t open this preview.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("closePreviewBtn")?.addEventListener("click",closePreview);
    document.getElementById("previewOverlay")?.addEventListener("click",e=>{if(e.target?.id==="previewOverlay")closePreview();});
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closePreview();});

  window.escapeHtml=window.escapeHtml||escapeHtml;
  window.previewEntry=previewEntry;
  window.closePreview=closePreview;
  window.openPdfInNewTab=openPdfInNewTab;
})();
