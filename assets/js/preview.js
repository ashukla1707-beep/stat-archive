(function(){
  "use strict";

  const MIN_ZOOM=0.5;
  const MAX_ZOOM=3;
  const STEP=0.25;
  const GAP=12;
  const PAD=12;

  let state=null;
  let previewToken=0;

  const escMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>escMap[c]);}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
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

  function cleanup(){
    const s=state;
    state=null;
    if(!s)return;
    try{s.abort?.abort();}catch(_){}
    if(s.scrollRaf)cancelAnimationFrame(s.scrollRaf);
    if(s.renderTimer)clearTimeout(s.renderTimer);
    if(s.overlay?.isConnected)s.overlay.remove();
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
    if(document.getElementById("statPreviewV50Css"))return;
    const style=document.createElement("style");
    style.id="statPreviewV50Css";
    style.textContent=`
#previewOverlay .sp50-shell{height:100%;min-height:0;display:flex;flex-direction:column;background:#0b0f16}
#previewOverlay .sp50-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;border-bottom:1px solid rgba(148,163,184,.15);background:#0d131c;position:relative;z-index:5}
#previewOverlay .sp50-group{display:flex;align-items:center;gap:6px}
#previewOverlay .sp50-btn{border:1px solid rgba(148,163,184,.22);background:#141c27;color:#e7edf5;border-radius:8px;min-width:34px;height:32px;padding:0 9px;font:700 11px 'JetBrains Mono',monospace}
#previewOverlay .sp50-btn:disabled{opacity:.35}
#previewOverlay .sp50-info,#previewOverlay .sp50-zoom{font:700 10px 'JetBrains Mono',monospace;color:#cbd5e1;white-space:nowrap}
#previewOverlay .sp50-wrap{position:relative;flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior:contain;background:#080c12;overflow-anchor:none}
#previewOverlay .sp50-sizer{position:relative;min-width:100%;min-height:100%;overflow-anchor:none}
#previewOverlay .sp50-surface{position:absolute;left:0;top:0;transform-origin:0 0;overflow-anchor:none}
#previewOverlay .sp50-page{position:absolute;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.28);overflow:hidden;contain:layout paint;overflow-anchor:none}
#previewOverlay .sp50-page canvas{display:block;width:100%;height:100%}
#previewOverlay .sp50-placeholder:after{content:'Loading page…';position:absolute;inset:0;display:grid;place-items:center;color:#8793a6;background:#eef1f4;font:600 10px 'JetBrains Mono',monospace}
#previewOverlay .sp50-bottom{padding:7px;border-top:1px solid rgba(148,163,184,.15);background:#0d131c;display:flex;justify-content:center}
#previewOverlay .sp50-open{min-width:180px}
#previewOverlay .sp50-loading{padding:40px 18px;text-align:center;color:#aab5c5;font:600 11px 'JetBrains Mono',monospace}
.sp50-gesture-overlay{position:fixed;overflow:hidden;pointer-events:none;z-index:2147483000;background:#080c12;touch-action:none}
.sp50-gesture-shot{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
@media(max-width:700px){#previewOverlay .sp50-toolbar{padding:6px;gap:5px;flex-wrap:wrap}#previewOverlay .sp50-btn{min-width:32px;height:31px;padding:0 8px}}
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
      <div class="sp50-shell">
        <div class="sp50-toolbar">
          <div class="sp50-group"><button class="sp50-btn" id="sp50Prev">‹</button><span class="sp50-info" id="sp50Info">Page 1 / ${pdf.numPages}</span><button class="sp50-btn" id="sp50Next">›</button></div>
          <div class="sp50-group"><button class="sp50-btn" id="sp50Out">−</button><span class="sp50-zoom" id="sp50Zoom">100%</span><button class="sp50-btn" id="sp50In">+</button><button class="sp50-btn" id="sp50Reset">1:1</button></div>
        </div>
        <div class="sp50-wrap" id="sp50Wrap"><div class="sp50-sizer" id="sp50Sizer"><div class="sp50-surface" id="sp50Surface"></div></div></div>
        <div class="sp50-bottom"><button class="submit-btn sp50-open" id="sp50Open">↗ Open PDF</button></div>
      </div>`;

    const wrap=document.getElementById("sp50Wrap");
    const sizer=document.getElementById("sp50Sizer");
    const surface=document.getElementById("sp50Surface");
    const info=document.getElementById("sp50Info");
    const zoomText=document.getElementById("sp50Zoom");
    const prev=document.getElementById("sp50Prev");
    const next=document.getElementById("sp50Next");
    const zin=document.getElementById("sp50In");
    const zout=document.getElementById("sp50Out");
    const reset=document.getElementById("sp50Reset");
    const open=document.getElementById("sp50Open");

    const fitWidth=Math.max(220,wrap.clientWidth-PAD*2);
    const metas=new Array(pdf.numPages);
    const tasks=new Map();
    let y=PAD;
    const worldW=fitWidth+PAD*2;

    const s={pdf,abort:new AbortController(),tasks,metas,wrap,sizer,surface,zoom:1,current:1,pinch:null,handoff:null,scrollRaf:0,renderTimer:0,worldH:0,worldW,overlay:null};
    state=s;

    const prep=document.createElement("div");
    prep.className="sp50-loading";
    prep.textContent="Preparing pages…";
    body.querySelector(".sp50-shell").prepend(prep);
    wrap.style.visibility="hidden";

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
      el.className="sp50-page sp50-placeholder";
      el.dataset.page=String(m.num);
      el.style.cssText=`left:${m.x}px;top:${m.y}px;width:${m.baseW}px;height:${m.baseH}px`;
      surface.appendChild(el);
      m.el=el;
    }
    surface.style.width=`${s.worldW}px`;
    surface.style.height=`${s.worldH}px`;
    prep.remove();
    wrap.style.visibility="visible";

    function applyCommittedZoom(z){
      s.zoom=clamp(z,MIN_ZOOM,MAX_ZOOM);
      surface.style.transform=`scale(${s.zoom})`;
      sizer.style.width=`${Math.max(wrap.clientWidth,s.worldW*s.zoom)}px`;
      sizer.style.height=`${Math.max(wrap.clientHeight,s.worldH*s.zoom)}px`;
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
      s.current=force||pageForWorldY((wrap.scrollTop+wrap.clientHeight*.45)/s.zoom);
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
        if(myToken!==previewToken||s.pinch||Math.abs(target-s.zoom)>.12)return;
        m.el.replaceChildren(canvas);
        m.el.classList.remove("sp50-placeholder");
        m.canvas=canvas;
        m.renderedZoom=target;
      }catch(err){if(err?.name!=="RenderingCancelledException")console.warn("PDF render failed",m?.num,err);}
    }

    function renderVisible(){
      if(s.pinch)return;
      const top=(wrap.scrollTop-wrap.clientHeight*1.5)/s.zoom;
      const bottom=(wrap.scrollTop+wrap.clientHeight*2.5)/s.zoom;
      for(const m of metas){
        if(m.y+m.baseH>=top&&m.y<=bottom)renderPage(m,s.zoom);
        else if(m.canvas&&Math.abs(m.num-s.current)>14){m.canvas.width=0;m.canvas.height=0;m.el.replaceChildren();m.el.classList.add("sp50-placeholder");m.canvas=null;m.renderedZoom=0;}
      }
    }

    function commitZoomAround(z,vx,vy,wx,wy){
      applyCommittedZoom(z);
      wrap.scrollLeft=Math.max(0,wx*s.zoom-vx);
      wrap.scrollTop=Math.max(0,wy*s.zoom-vy);
    }

    function centerZoom(z){
      if(s.pinch)return;
      const vx=wrap.clientWidth/2,vy=wrap.clientHeight/2;
      const wx=(wrap.scrollLeft+vx)/s.zoom,wy=(wrap.scrollTop+vy)/s.zoom;
      commitZoomAround(z,vx,vy,wx,wy);
      updateCurrent();
      renderVisible();
    }

    function makeGestureOverlay(vx,vy){
      const wr=wrap.getBoundingClientRect();
      const layer=document.createElement("div");
      layer.className="sp50-gesture-overlay";
      layer.style.left=`${wr.left}px`;
      layer.style.top=`${wr.top}px`;
      layer.style.width=`${wrap.clientWidth}px`;
      layer.style.height=`${wrap.clientHeight}px`;

      const dpr=Math.min(window.devicePixelRatio||1,2);
      const shot=document.createElement("canvas");
      shot.className="sp50-gesture-shot";
      shot.width=Math.max(1,Math.floor(wrap.clientWidth*dpr));
      shot.height=Math.max(1,Math.floor(wrap.clientHeight*dpr));
      shot.style.width=`${wrap.clientWidth}px`;
      shot.style.height=`${wrap.clientHeight}px`;
      shot.style.transformOrigin=`${vx}px ${vy}px`;
      const ctx=shot.getContext("2d",{alpha:false});
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle="#080c12";
      ctx.fillRect(0,0,wrap.clientWidth,wrap.clientHeight);

      for(const m of metas){
        const r=m.el.getBoundingClientRect();
        if(r.bottom<=wr.top||r.top>=wr.bottom||r.right<=wr.left||r.left>=wr.right)continue;
        const x=r.left-wr.left;
        const yy=r.top-wr.top;
        ctx.fillStyle="#fff";
        ctx.fillRect(x,yy,r.width,r.height);
        if(m.canvas&&m.canvas.width&&m.canvas.height){
          try{ctx.drawImage(m.canvas,x,yy,r.width,r.height);}catch(_){}
        }
      }
      layer.appendChild(shot);
      document.body.appendChild(layer);
      s.overlay=layer;
      return {layer,shot};
    }

    wrap.addEventListener("scroll",()=>{
      if(s.pinch||s.scrollRaf)return;
      s.scrollRaf=requestAnimationFrame(()=>{s.scrollRaf=0;updateCurrent();renderVisible();});
    },{passive:true});

    prev.onclick=()=>{s.current=Math.max(1,s.current-1);wrap.scrollTo({top:metas[s.current-1].y*s.zoom,behavior:"smooth"});updateCurrent(s.current);renderVisible();};
    next.onclick=()=>{s.current=Math.min(pdf.numPages,s.current+1);wrap.scrollTo({top:metas[s.current-1].y*s.zoom,behavior:"smooth"});updateCurrent(s.current);renderVisible();};
    zout.onclick=()=>centerZoom(s.zoom-STEP);
    zin.onclick=()=>centerZoom(s.zoom+STEP);
    reset.onclick=()=>centerZoom(1);
    open.onclick=()=>openPdfInNewTab(fileUrl,safeName(entry));

    const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const midpoint=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});

    wrap.addEventListener("touchstart",e=>{
      if(e.touches.length!==2)return;
      const d=distance(e.touches);if(!d)return;
      const rect=wrap.getBoundingClientRect();
      const mid=midpoint(e.touches);
      const vx=clamp(mid.x-rect.left,0,wrap.clientWidth);
      const vy=clamp(mid.y-rect.top,0,wrap.clientHeight);
      const startLeft=wrap.scrollLeft;
      const startTop=wrap.scrollTop;
      const wx=(startLeft+vx)/s.zoom;
      const wy=(startTop+vy)/s.zoom;
      const overlay=makeGestureOverlay(vx,vy);
      s.pinch={startD:d,startZoom:s.zoom,pending:s.zoom,wx,wy,startVX:vx,startVY:vy,lastVX:vx,lastVY:vy,page:pageForWorldY(wy),shot:overlay.shot};
      s.handoff=null;
      if(s.scrollRaf){cancelAnimationFrame(s.scrollRaf);s.scrollRaf=0;}
      e.preventDefault();
      e.stopPropagation();
    },{capture:true,passive:false});

    wrap.addEventListener("touchmove",e=>{
      if(s.pinch&&e.touches.length===2){
        e.preventDefault();
        e.stopPropagation();
        const d=distance(e.touches);if(!d)return;
        const rect=wrap.getBoundingClientRect();
        const mid=midpoint(e.touches);
        const p=s.pinch;
        p.lastVX=clamp(mid.x-rect.left,0,wrap.clientWidth);
        p.lastVY=clamp(mid.y-rect.top,0,wrap.clientHeight);
        p.pending=clamp(p.startZoom*(d/p.startD),MIN_ZOOM,MAX_ZOOM);
        const scale=p.pending/p.startZoom;
        const dx=p.lastVX-p.startVX;
        const dy=p.lastVY-p.startVY;
        p.shot.style.transform=`translate3d(${dx}px,${dy}px,0) scale(${scale})`;
        zoomText.textContent=`${Math.round(p.pending*100)}%`;
        updateCurrent(p.page);
        return;
      }

      if(s.handoff&&e.touches.length===1){
        e.preventDefault();
        const t=e.touches[0];
        const h=s.handoff;
        wrap.scrollLeft=h.startLeft-(t.clientX-h.startX);
        wrap.scrollTop=h.startTop-(t.clientY-h.startY);
        return;
      }
    },{capture:true,passive:false});

    function finishPinch(remainingTouch){
      const p=s.pinch;if(!p)return;
      const finalZoom=p.pending;
      const finalVX=p.lastVX;
      const finalVY=p.lastVY;
      commitZoomAround(finalZoom,finalVX,finalVY,p.wx,p.wy);
      s.pinch=null;
      if(s.overlay?.isConnected)s.overlay.remove();
      s.overlay=null;
      updateCurrent();
      if(remainingTouch){
        s.handoff={startX:remainingTouch.clientX,startY:remainingTouch.clientY,startLeft:wrap.scrollLeft,startTop:wrap.scrollTop};
      }else{
        s.handoff=null;
      }
      if(s.renderTimer)clearTimeout(s.renderTimer);
      s.renderTimer=setTimeout(renderVisible,60);
    }

    wrap.addEventListener("touchend",e=>{
      if(s.pinch&&e.touches.length<2){
        finishPinch(e.touches.length===1?e.touches[0]:null);
        return;
      }
      if(s.handoff&&e.touches.length===0){
        s.handoff=null;
        updateCurrent();
        renderVisible();
      }
    },{capture:true,passive:false});

    wrap.addEventListener("touchcancel",()=>{
      if(s.pinch)finishPinch(null);
      s.handoff=null;
    },{capture:true,passive:true});

    applyCommittedZoom(1);
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
    body.innerHTML='<div class="sp50-loading">Loading preview…</div>';
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
      body.innerHTML='<div class="sp50-loading">Preview is unavailable for this file type.</div>';
    }catch(err){
      if(err?.name==="AbortError")return;
      console.error("Preview failed",err);
      body.innerHTML='<div class="sp50-loading">Couldn\'t open this preview.</div>';
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