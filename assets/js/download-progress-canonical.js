/* Stat Archive — canonical Download transfer/progress runtime.
   Owns Download clicks before legacy handlers, on web/PWA and Android WebView. */
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_CANONICAL_DOWNLOAD_PROGRESS_V1__) return;
  window.__STAT_ARCHIVE_CANONICAL_DOWNLOAD_PROGRESS_V1__ = true;

  const isAndroid = () => !!(window.AndroidBridge && typeof window.AndroidBridge === "object");
  const hasStreamBridge = () => !!(window.AndroidStreamBridge && typeof window.AndroidStreamBridge === "object");
  const cleanName = value => String(value || "Stat Archive file").replace(/[\\/:*?"<>|\r\n]+/g,"_").replace(/\.+$/g,"").trim() || "Stat Archive file";
  const fetchNative = (...args) => fetch(...args);

  function titleOf(entry){ return String(entry?.title || entry?.filename || "File").trim(); }
  function filenameOf(entry,mime){
    let name="";
    try { if(typeof window.archiveDownloadName === "function") name=window.archiveDownloadName(entry); } catch(_) {}
    if(!name) name=entry?.filename || entry?.title || "Stat Archive file";
    name=cleanName(name);
    if((String(mime||"").toLowerCase().includes("pdf") || entry?.driveUrl) && !/\.pdf$/i.test(name)) name += ".pdf";
    return name;
  }

  function ensurePanel(){
    let panel=document.getElementById("statCanonicalTransferProgress");
    if(panel) return panel;
    if(!document.getElementById("statCanonicalTransferProgressStyle")){
      const style=document.createElement("style");
      style.id="statCanonicalTransferProgressStyle";
      style.textContent=`
#statCanonicalTransferProgress{position:fixed!important;z-index:2147483000!important;left:50%!important;bottom:calc(16px + env(safe-area-inset-bottom,0px))!important;transform:translate(-50%,18px)!important;width:min(760px,calc(100vw - 28px))!important;padding:16px 20px 18px!important;box-sizing:border-box!important;border:1px solid rgba(148,163,184,.22)!important;border-radius:24px!important;background:rgba(14,21,31,.97)!important;color:#f3f6fa!important;box-shadow:0 16px 42px rgba(0,0,0,.34)!important;font-family:Inter,sans-serif!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:opacity .15s ease,transform .15s ease,visibility .15s!important}
#statCanonicalTransferProgress.is-visible{opacity:1!important;visibility:visible!important;transform:translate(-50%,0)!important}
#statCanonicalTransferProgress .sa-cp-row{display:grid!important;grid-template-columns:36px minmax(0,1fr) auto!important;align-items:center!important;gap:11px!important}
#statCanonicalTransferProgress .sa-cp-spinner{width:30px!important;height:30px!important;border:3px solid #293746!important;border-top-color:#63efff!important;border-radius:50%!important;animation:saCanonicalSpin .8s linear infinite!important;box-sizing:border-box!important}
#statCanonicalTransferProgress .sa-cp-label{min-width:0!important;font-size:15px!important;font-weight:700!important;line-height:1.3!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#statCanonicalTransferProgress .sa-cp-pct{font:800 16px/1 'JetBrains Mono',monospace!important;color:#63efff!important}
#statCanonicalTransferProgress .sa-cp-track{height:7px!important;margin-top:12px!important;border-radius:999px!important;background:#202c39!important;overflow:hidden!important}
#statCanonicalTransferProgress .sa-cp-fill{height:100%!important;width:0;border-radius:inherit!important;background:#63efff!important;transition:width .08s linear!important}
body[data-theme='light'] #statCanonicalTransferProgress{background:rgba(255,255,255,.98)!important;color:#29252d!important;border-color:rgba(75,54,95,.18)!important;box-shadow:0 14px 36px rgba(60,45,70,.18)!important}
body[data-theme='light'] #statCanonicalTransferProgress .sa-cp-spinner{border-color:#e5ddeb!important;border-top-color:#67457f!important}body[data-theme='light'] #statCanonicalTransferProgress .sa-cp-pct{color:#67457f!important}body[data-theme='light'] #statCanonicalTransferProgress .sa-cp-track{background:#eee8f1!important}body[data-theme='light'] #statCanonicalTransferProgress .sa-cp-fill{background:#67457f!important}
@keyframes saCanonicalSpin{to{transform:rotate(360deg)}}
`;
      document.head.appendChild(style);
    }
    panel=document.createElement("div");
    panel.id="statCanonicalTransferProgress";
    panel.setAttribute("role","status"); panel.setAttribute("aria-live","polite");
    panel.innerHTML='<div class="sa-cp-row"><span class="sa-cp-spinner"></span><div class="sa-cp-label"></div><div class="sa-cp-pct">0%</div></div><div class="sa-cp-track"><div class="sa-cp-fill"></div></div>';
    document.body.appendChild(panel);
    return panel;
  }

  let hideTimer=0;
  function paint(entry,loaded,total,done=false){
    const panel=ensurePanel(); clearTimeout(hideTimer);
    const pct=total>0 ? Math.max(0,Math.min(100,Math.round(loaded/total*100))) : null;
    panel.querySelector(".sa-cp-label").textContent=`${done?"Downloaded":"Downloading"} · ${titleOf(entry)}`;
    panel.querySelector(".sa-cp-pct").textContent=done?"100%":(pct==null?"…":`${pct}%`);
    panel.querySelector(".sa-cp-fill").style.width=done?"100%":(pct==null?"10%":`${pct}%`);
    panel.classList.add("is-visible");
    if(done) hideTimer=setTimeout(()=>panel.classList.remove("is-visible"),1100);
  }
  function hidePanel(){ document.getElementById("statCanonicalTransferProgress")?.classList.remove("is-visible"); }

  async function readResponse(response,entry,btn){
    const total=Number(response.headers.get("content-length")) || Number(entry?.size) || 0;
    if(!response.body || typeof response.body.getReader !== "function"){
      paint(entry,0,total);
      const blob=await response.blob(); paint(entry,blob.size,total||blob.size); return blob;
    }
    const reader=response.body.getReader(),chunks=[]; let loaded=0; paint(entry,0,total);
    while(true){
      const {done,value}=await reader.read(); if(done) break;
      if(value){ chunks.push(value); loaded+=value.byteLength; paint(entry,loaded,total); if(btn&&total>0) btn.textContent=`Downloading… ${Math.min(100,Math.round(loaded/total*100))}%`; }
    }
    const mime=response.headers.get("content-type") || "application/octet-stream";
    const blob=new Blob(chunks,{type:mime}); paint(entry,blob.size,total||blob.size); return blob;
  }

  function blobToBase64(blob){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onerror=()=>reject(r.error||new Error("Could not read file")); r.onload=()=>{const s=String(r.result||"");resolve(s.slice(s.indexOf(",")+1));}; r.readAsDataURL(blob); }); }
  async function saveAndroid(blob,name,mime){
    if(hasStreamBridge()){
      const b=window.AndroidStreamBridge;
      if(typeof b.beginBlobTransfer==="function"&&typeof b.appendBlobChunk==="function"&&typeof b.finishBlobTransfer==="function"&&b.beginBlobTransfer(name,mime,"save")){
        const step=256*1024;
        for(let i=0;i<blob.size;i+=step){ if(!b.appendBlobChunk(await blobToBase64(blob.slice(i,Math.min(i+step,blob.size))))) throw new Error("Android transfer interrupted"); }
        if(!b.finishBlobTransfer()) throw new Error("Android transfer could not finish"); return;
      }
    }
    if(typeof window.AndroidBridge?.saveFile === "function"){ window.AndroidBridge.saveFile(await blobToBase64(blob),name,mime); return; }
    throw new Error("Android file saving is unavailable");
  }
  function saveBrowser(blob,name){ const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000); }

  function markComplete(entry,btn){
    if(btn){btn.disabled=false;btn.classList.add("is-downloaded");btn.textContent="✓ Downloaded";btn.title="Already downloaded on this device";}
    try{ downloadedEntryIds.add(String(entry.id)); saveEntryActionHistory("statArchiveDownloadedEntries",downloadedEntryIds); }catch(_){}
  }

  async function transfer(entry,btn){
    if(!entry) return;
    const original=btn?.innerHTML || "⬇ Download";
    if(btn){btn.disabled=true;btn.textContent="Downloading… 0%";}
    try{
      let blob,mime;
      if(entry._offlineBlob){ blob=entry._offlineBlob; mime=entry._offlineMime||blob.type||"application/octet-stream"; paint(entry,0,blob.size); paint(entry,blob.size,blob.size); }
      else {
        const url=entry.driveUrl ? (typeof window.statArchiveDriveStreamUrl==="function"?window.statArchiveDriveStreamUrl(entry,"inline"):entry.driveUrl) : `${typeof WORKER_URL==="string"?WORKER_URL:"https://stat-archive-api.lustats.workers.dev"}/file?id=${encodeURIComponent(entry.id)}`;
        const response=await fetchNative(url,{method:"GET",cache:"no-store",credentials:"omit"});
        if(!response.ok) throw new Error(`Download failed (${response.status})`);
        blob=await readResponse(response,entry,btn); mime=blob.type||response.headers.get("content-type")||"application/octet-stream";
      }
      const name=filenameOf(entry,mime);
      if(isAndroid()) await saveAndroid(blob,name,mime); else saveBrowser(blob,name);
      paint(entry,blob.size,blob.size,true); markComplete(entry,btn);
      try{ window.incrementActivity?.("download"); }catch(_){}
    }catch(err){
      console.error("Canonical Download failed:",err); hidePanel(); if(btn){btn.disabled=false;btn.innerHTML=original;} try{window.showError?.(err?.message||"Couldn't download that file.");}catch(_){}
    }
  }

  window.statArchiveCanonicalDownload=transfer;
  document.addEventListener("click",event=>{
    const target=event.target instanceof Element?event.target:null;
    const btn=target?.closest(".card .dl-btn,.card .download-btn"); if(!btn) return;
    const card=btn.closest(".card"); if(!card) return;
    let source=[]; try{source=Array.isArray(entries)?entries:[];}catch(_){}
    const entry=source.find(item=>String(item.id)===String(card.dataset.id)); if(!entry) return;
    event.preventDefault(); event.stopImmediatePropagation(); transfer(entry,btn);
  },true);
})();
