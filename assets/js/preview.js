(function(){
  "use strict";

  const MIN_ZOOM=0.5;
  const MAX_ZOOM=3;
  const STEP=0.25;
  const GAP=12;
  const PAD=12;

  let state=null;
  let previewToken=0;
  let printToken=0;

  const escMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const escapeHtml=v=>String(v||"").replace(/[&<>"']/g,c=>escMap[c]);

  function isPdf(entry,blob){
    const name=String(entry?.filename||"").toLowerCase();
    return name.endsWith(".pdf")||String(blob?.type||"").toLowerCase().includes("pdf");
  }

  function safeName(entry){
    const t=String(entry?.title||"Document").trim()||"Document";
    return (t.replace(/[\\/:*?"<>|]/g,"_").replace(/\.+$/g,"").trim()||"Document")+".pdf";
  }

  async function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
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
      if(!res.ok)throw new Error(`PDF request failed (${res.status})`);
      const raw=await res.blob();
      const blob=raw.type==="application/pdf"?raw:new Blob([raw],{type:"application/pdf"});
      if(window.AndroidBridge&&typeof window.AndroidBridge.openFile==="function"){
        window.AndroidBridge.openFile(await blobToBase64(blob),filename||"document.pdf","application/pdf");
        return;
      }
      const u=URL.createObjectURL(blob);
      const w=window.open(u,"_blank","noopener");
      if(!w)alert("Popup blocked. Please allow popups for this site.");
      setTimeout(()=>URL.revokeObjectURL(u),300000);
    }catch(err){
      console.error("Open PDF failed",err);
      alert("Couldn't open the PDF.");
    }
  }

  function printPdfBlob(blob,btn,filename){
    const t=++printToken;
    const old=btn?.innerHTML;
    if(btn){btn.textContent="…";btn.disabled=true;}
    try{
      document.getElementById("pdf-print-frame")?.remove();
      const u=URL.createObjectURL(blob.type==="application/pdf"?blob:new Blob([blob],{type:"application/pdf"}));
      const f=document.createElement("iframe");
      f.id="pdf-print-frame";
      f.style.cssText="position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
      f.src=u;
      f.onload=()=>{
        try{if(filename)f.contentDocument.title=filename;f.contentWindow.focus();f.contentWindow.print();}catch(e){console.error(e);}
        if(t===printToken&&btn){btn.innerHTML=old;btn.disabled=false;}
        setTimeout(()=>{try{f.remove();URL.revokeObjectURL(u);}catch(_){}},300000);
      };
      document.body.appendChild(f);
    }catch(err){
      if(btn){btn.innerHTML=old;btn.disabled=false;}
      console.error(err);
    }
  }

  function cleanup(){
    const s=state;
    state=null;
    if(!s)return;
    try{s.abort?.abort();}catch(_){}
    if(s.inertiaRaf)cancelAnimationFrame(s.inertiaRaf);
    if(s.renderTimer)clearTimeout(s.renderTimer);
    for(const t of s.tasks?.values?.()||[]){try{t.cancel();}catch(_){}}
    try{s.pdf?.destroy?.();}catch(_){}
  }

  function closePreview(){
    previewToken++;
    cleanup();
    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    if(overlay)overlay.style.display="none";
    if(body)body.innerHTML="";
    document.querySelector("#previewOverlay .preview-card")?.classList.remove("pdf-preview-active");
    document.body.classList.remove("no-scroll");
  }

  function installCss(){
    document.querySelectorAll('[id^="statPreviewV"]').forEach(n=>n.remove());
    const style=document.createElement("style");
    style.id="statPreviewV57Css";
    style.textContent=`
#previewOverlay .pdf-preview-shell{height:100%;min-height:0;display:flex;flex-direction:column;background:#0b0f16}
#previewOverlay .sp57-viewport{position:relative;flex:1;min-height:0;overflow:hidden!important;touch-action:none!important;overscroll-behavior:none;background:#080c12;user-select:none;-webkit-user-select:none}
#previewOverlay .sp57-surface{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;contain:layout style}
#previewOverlay .sp57-page{position:absolute;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.28);overflow:hidden;contain:layout paint}
#previewOverlay .sp57-page canvas{display:block;width:100%;height:100%}
#previewOverlay .sp57-placeholder:after{content:'Loading page…';position:absolute;inset:0;display:grid;place-items:center;color:#8793a6;background:#eef1f4;font:600 10px 'JetBrains Mono',monospace}
#previewOverlay .sp57-loading{padding:40px 18px;text-align:center;color:#aab5c5;font:600 11px 'JetBrains Mono',monospace}
`;
    document.head.appendChild(style);
  }

  async function buildPdf(entry,fileUrl,blob,myToken){
    const body=document.getElementById("previewBody");
    const pdfjsLib=await loadPdfJs();
    const pdf=await pdfjsLib.getDocument({
      data:await blob.arrayBuffer(),
      cMapUrl:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked:true
    }).promise;
    if(myToken!==previewToken){pdf.destroy();return;}

    body.innerHTML=`
      <div class="pdf-preview-shell">
        <div class="pdf-preview-toolbar">
          <div class="pdf-page-controls">
            <button type="button" class="pdf-page-btn" id="sp57Prev" aria-label="Previous page">‹</button>
            <span class="pdf-page-info" id="sp57Info">Page 1 / ${pdf.numPages}</span>
            <button type="button" class="pdf-page-btn" id="sp57Next" aria-label="Next page">›</button>
          </div>
          <div class="pdf-toolbar-actions">
            <div class="pdf-zoom-controls" aria-label="Zoom controls">
              <button type="button" class="pdf-page-btn" id="sp57Out" aria-label="Zoom out">−</button>
              <span class="pdf-zoom-level" id="sp57Zoom">100%</span>
              <button type="button" class="pdf-page-btn" id="sp57In" aria-label="Zoom in">+</button>
              <button type="button" class="pdf-page-btn" id="sp57Reset" aria-label="Reset zoom">1:1</button>
            </div>
            <button type="button" class="pdf-page-btn" id="sp57Download" aria-label="Download" title="Download"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg></button>
            <button type="button" class="pdf-page-btn" id="sp57Print" aria-label="Print" title="Print"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 14H4a1 1 0 0 1-1-1v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-2"/></svg></button>
          </div>
        </div>
        <div class="sp57-viewport" id="sp57Viewport"><div class="sp57-surface" id="sp57Surface"></div></div>
        <div class="pdf-open-new-tab-bottom"><button type="button" class="submit-btn pdf-open-new-tab-btn" id="sp57Open">↗ Open PDF</button></div>
      </div>`;

    const viewport=document.getElementById("sp57Viewport");
    const surface=document.getElementById("sp57Surface");
    const info=document.getElementById("sp57Info");
    const zoomText=document.getElementById("sp57Zoom");
    const prev=document.getElementById("sp57Prev");
    const next=document.getElementById("sp57Next");
    const zin=document.getElementById("sp57In");
    const zout=document.getElementById("sp57Out");
    const reset=document.getElementById("sp57Reset");
    const open=document.getElementById("sp57Open");
    const download=document.getElementById("sp57Download");
    const print=document.getElementById("sp57Print");

    const fitWidth=Math.max(220,viewport.clientWidth-PAD*2);
    const metas=new Array(pdf.numPages);
    const tasks=new Map();
    let y=PAD;
    const worldW=fitWidth+PAD*2;
    const s={pdf,abort:new AbortController(),tasks,metas,viewport,surface,zoom:1,x:0,y:0,current:1,gesture:null,inertiaRaf:0,renderTimer:0,worldH:0,worldW};
    state=s;

    const prep=document.createElement("div");
    prep.className="sp57-loading";
    prep.textContent="Preparing pages…";
    body.querySelector(".pdf-preview-shell").prepend(prep);
    viewport.style.visibility="hidden";

    for(let start=1;start<=pdf.numPages;start+=20){
      if(myToken!==previewToken)return;
      const end=Math.min(pdf.numPages,start+19);
      const rows=await Promise.all(Array.from({length:end-start+1},(_,i)=>{
        const n=start+i;
        return pdf.getPage(n).then(page=>({n,vp:page.getViewport({scale:1})}));
      }));
      for(const row of rows){
        const fit=fitWidth/row.vp.width;
        const w=row.vp.width*fit;
        const h=row.vp.height*fit;
        metas[row.n-1]={num:row.n,fit,baseW:w,baseH:h,x:PAD,y,el:null,canvas:null,renderedZoom:0};
        y+=h+GAP;
      }
      prep.textContent=`Preparing pages… ${end}/${pdf.numPages}`;
      await new Promise(r=>requestAnimationFrame(r));
    }

    s.worldH=y+PAD-GAP;
    for(const m of metas){
      const el=document.createElement("div");
      el.className="sp57-page sp57-placeholder";
      el.dataset.page=String(m.num);
      el.style.cssText=`left:${m.x}px;top:${m.y}px;width:${m.baseW}px;height:${m.baseH}px`;
      surface.appendChild(el);
      m.el=el;
    }
    surface.style.width=`${s.worldW}px`;
    surface.style.height=`${s.worldH}px`;
    prep.remove();
    viewport.style.visibility="visible";

    function clampCamera(){
      const vw=viewport.clientWidth,vh=viewport.clientHeight;
      const cw=s.worldW*s.zoom,ch=s.worldH*s.zoom;
      s.x=cw<=vw?(vw-cw)/2:clamp(s.x,vw-cw,0);
      s.y=ch<=vh?(vh-ch)/2:clamp(s.y,vh-ch,0);
    }

    function paint(){
      clampCamera();
      surface.style.transform=`translate3d(${s.x}px,${s.y}px,0) scale(${s.zoom})`;
      zoomText.textContent=`${Math.round(s.zoom*100)}%`;
      zout.disabled=s.zoom<=MIN_ZOOM+.001;
      zin.disabled=s.zoom>=MAX_ZOOM-.001;
    }

    function pageForWorldY(worldY){
      let lo=0,hi=metas.length-1,best=0;
      while(lo<=hi){
        const mid=(lo+hi)>>1;
        if(worldY>=metas[mid].y){best=mid;lo=mid+1;}else hi=mid-1;
      }
      return best+1;
    }

    function updateCurrent(force){
      const wy=(viewport.clientHeight*.45-s.y)/s.zoom;
      s.current=force||pageForWorldY(wy);
      info.textContent=`Page ${s.current} / ${pdf.numPages}`;
      prev.disabled=s.current<=1;
      next.disabled=s.current>=pdf.numPages;
    }

    async function renderPage(m,target=s.zoom){
      if(!m||Math.abs(m.renderedZoom-target)<.08)return;
      const old=tasks.get(m.num);
      if(old){try{old.cancel();}catch(_){}tasks.delete(m.num);}
      try{
        const page=await pdf.getPage(m.num);
        const vp=page.getViewport({scale:m.fit*target});
        const dpr=Math.min(window.devicePixelRatio||1,1.8);
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.floor(vp.width*dpr));
        canvas.height=Math.max(1,Math.floor(vp.height*dpr));
        canvas.style.width=`${m.baseW}px`;
        canvas.style.height=`${m.baseH}px`;
        const ctx=canvas.getContext("2d",{alpha:false});
        const task=page.render({canvasContext:ctx,viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});
        tasks.set(m.num,task);
        await task.promise;
        tasks.delete(m.num);
        if(myToken!==previewToken||Math.abs(target-s.zoom)>.12)return;
        m.el.replaceChildren(canvas);
        m.el.classList.remove("sp57-placeholder");
        m.canvas=canvas;
        m.renderedZoom=target;
      }catch(err){if(err?.name!=="RenderingCancelledException")console.warn("PDF render failed",m?.num,err);}
    }

    function renderVisible(){
      const top=(-s.y-viewport.clientHeight*1.5)/s.zoom;
      const bottom=(-s.y+viewport.clientHeight*2.5)/s.zoom;
      for(const m of metas){
        if(m.y+m.baseH>=top&&m.y<=bottom)renderPage(m,s.zoom);
        else if(m.canvas&&Math.abs(m.num-s.current)>14){
          m.canvas.width=0;m.canvas.height=0;m.el.replaceChildren();m.el.classList.add("sp57-placeholder");m.canvas=null;m.renderedZoom=0;
        }
      }
    }

    function scheduleRender(delay=70){
      if(s.renderTimer)clearTimeout(s.renderTimer);
      s.renderTimer=setTimeout(()=>{updateCurrent();renderVisible();},delay);
    }

    function zoomAround(next,vx,vy){
      next=clamp(next,MIN_ZOOM,MAX_ZOOM);
      const wx=(vx-s.x)/s.zoom;
      const wy=(vy-s.y)/s.zoom;
      s.zoom=next;
      s.x=vx-wx*next;
      s.y=vy-wy*next;
      paint();
      updateCurrent();
      scheduleRender(40);
    }

    function goToPage(n){
      s.current=clamp(n,1,pdf.numPages);
      s.y=PAD-metas[s.current-1].y*s.zoom;
      paint();
      updateCurrent(s.current);
      scheduleRender(20);
    }

    prev.onclick=()=>goToPage(s.current-1);
    next.onclick=()=>goToPage(s.current+1);
    zout.onclick=()=>zoomAround(s.zoom-STEP,viewport.clientWidth/2,viewport.clientHeight/2);
    zin.onclick=()=>zoomAround(s.zoom+STEP,viewport.clientWidth/2,viewport.clientHeight/2);
    reset.onclick=()=>zoomAround(1,viewport.clientWidth/2,viewport.clientHeight/2);
    open.onclick=()=>openPdfInNewTab(fileUrl,safeName(entry));
    download.onclick=()=>{try{if(typeof downloadEntry==="function")downloadEntry(entry,download);}catch(e){console.error(e);}};
    print.onclick=()=>printPdfBlob(blob,print,safeName(entry));

    function stopInertia(){
      if(s.inertiaRaf){cancelAnimationFrame(s.inertiaRaf);s.inertiaRaf=0;}
    }

    function startInertia(vx,vy){
      stopInertia();
      let last=performance.now();
      const tick=now=>{
        const dt=Math.min(32,now-last);last=now;
        s.x+=vx*dt;
        s.y+=vy*dt;
        paint();
        const decay=Math.pow(0.92,dt/16.67);
        vx*=decay;vy*=decay;
        if(Math.hypot(vx,vy)<0.025){s.inertiaRaf=0;updateCurrent();renderVisible();return;}
        s.inertiaRaf=requestAnimationFrame(tick);
      };
      s.inertiaRaf=requestAnimationFrame(tick);
    }

    const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const midpoint=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});
    const localPoint=t=>{const r=viewport.getBoundingClientRect();return{x:t.clientX-r.left,y:t.clientY-r.top};};

    viewport.addEventListener("touchstart",e=>{
      stopInertia();
      if(e.touches.length===1){
        const p=localPoint(e.touches[0]);
        s.gesture={mode:"pan",id:e.touches[0].identifier,lastX:p.x,lastY:p.y,lastT:performance.now(),vx:0,vy:0};
        e.preventDefault();
        return;
      }
      if(e.touches.length===2){
        const d=distance(e.touches);if(!d)return;
        const r=viewport.getBoundingClientRect();
        const mid=midpoint(e.touches);
        const mx=mid.x-r.left,my=mid.y-r.top;
        const wx=(mx-s.x)/s.zoom,wy=(my-s.y)/s.zoom;
        s.gesture={mode:"pinch",startD:d,startZoom:s.zoom,worldX:wx,worldY:wy,lastMX:mx,lastMY:my};
        e.preventDefault();
      }
    },{passive:false,capture:true});

    viewport.addEventListener("touchmove",e=>{
      const g=s.gesture;if(!g)return;
      e.preventDefault();
      e.stopPropagation();

      if(e.touches.length===2){
        const d=distance(e.touches);if(!d)return;
        const r=viewport.getBoundingClientRect();
        const mid=midpoint(e.touches);
        const mx=mid.x-r.left,my=mid.y-r.top;
        if(g.mode!=="pinch"){
          const wx=(mx-s.x)/s.zoom,wy=(my-s.y)/s.zoom;
          s.gesture={mode:"pinch",startD:d,startZoom:s.zoom,worldX:wx,worldY:wy,lastMX:mx,lastMY:my};
          return;
        }
        const next=clamp(g.startZoom*(d/g.startD),MIN_ZOOM,MAX_ZOOM);
        s.zoom=next;
        s.x=mx-g.worldX*next;
        s.y=my-g.worldY*next;
        g.lastMX=mx;g.lastMY=my;
        paint();
        updateCurrent();
        return;
      }

      if(e.touches.length===1){
        const p=localPoint(e.touches[0]);
        if(g.mode!=="pan"){
          s.gesture={mode:"pan",id:e.touches[0].identifier,lastX:p.x,lastY:p.y,lastT:performance.now(),vx:0,vy:0};
          return;
        }
        const now=performance.now();
        const dt=Math.max(1,now-g.lastT);
        const dx=p.x-g.lastX,dy=p.y-g.lastY;
        s.x+=dx;s.y+=dy;
        g.vx=dx/dt;g.vy=dy/dt;
        g.lastX=p.x;g.lastY=p.y;g.lastT=now;
        paint();
        updateCurrent();
      }
    },{passive:false,capture:true});

    viewport.addEventListener("touchend",e=>{
      const g=s.gesture;if(!g)return;
      e.preventDefault();
      if(e.touches.length===1){
        const p=localPoint(e.touches[0]);
        s.gesture={mode:"pan",id:e.touches[0].identifier,lastX:p.x,lastY:p.y,lastT:performance.now(),vx:0,vy:0};
        scheduleRender(90);
        return;
      }
      if(e.touches.length===0){
        s.gesture=null;
        if(g.mode==="pan")startInertia(g.vx,g.vy);else scheduleRender(35);
      }
    },{passive:false,capture:true});

    viewport.addEventListener("touchcancel",()=>{s.gesture=null;stopInertia();scheduleRender(20);},{passive:true,capture:true});

    viewport.addEventListener("wheel",e=>{
      e.preventDefault();
      if(e.ctrlKey){
        const r=viewport.getBoundingClientRect();
        zoomAround(s.zoom*(e.deltaY<0?1.08:0.92),e.clientX-r.left,e.clientY-r.top);
      }else{
        s.x-=e.deltaX;
        s.y-=e.deltaY;
        paint();updateCurrent();scheduleRender(60);
      }
    },{passive:false});

    paint();
    updateCurrent(1);
    renderVisible();
  }

  async function previewEntry(entry){
    closePreview();
    installCss();
    const myToken=++previewToken;
    const overlay=document.getElementById("previewOverlay");
    const body=document.getElementById("previewBody");
    const title=document.getElementById("previewTitle");
    if(!overlay||!body||!title)return;

    overlay.style.display="flex";
    document.body.classList.add("no-scroll");
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");
    title.textContent=entry?.title||entry?.filename||"Preview";
    body.innerHTML='<div class="sp57-loading">Loading preview…</div>';
    try{if(typeof incrementActivity==="function")incrementActivity("preview");}catch(_){}

    const fileUrl=`${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
    const abort=new AbortController();
    state={abort,tasks:new Map()};

    try{
      const res=await fetch(fileUrl,{cache:"no-store",signal:abort.signal});
      if(!res.ok)throw new Error(`File request failed (${res.status})`);
      const blob=await res.blob();
      if(myToken!==previewToken)return;

      if(isPdf(entry,blob)){await buildPdf(entry,fileUrl,blob,myToken);return;}
      if(blob.type.startsWith("image/")){
        const u=URL.createObjectURL(blob);
        body.innerHTML=`<div style="display:grid;place-items:center;min-height:55vh;background:#080c12"><img src="${u}" alt="${escapeHtml(entry?.title||"Preview")}" style="max-width:100%;max-height:75vh;object-fit:contain"></div>`;
        return;
      }
      body.innerHTML='<div class="sp57-loading">Preview is unavailable for this file type.</div>';
    }catch(err){
      if(err?.name==="AbortError")return;
      console.error("Preview failed",err);
      body.innerHTML='<div class="sp57-loading">Couldn\'t open this preview.</div>';
    }
  }

  function bindClose(){
    document.getElementById("closePreviewBtn")?.addEventListener("click",closePreview);
    document.getElementById("previewOverlay")?.addEventListener("click",e=>{if(e.target?.id==="previewOverlay")closePreview();});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindClose,{once:true});else bindClose();
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closePreview();});

  window.escapeHtml=window.escapeHtml||escapeHtml;
  window.previewEntry=previewEntry;
  window.closePreview=closePreview;
  window.openPdfInNewTab=openPdfInNewTab;
})();