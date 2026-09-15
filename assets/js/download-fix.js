/* Stat Archive — web Download progress UI aligned with Offline save progress. */
(() => {
  "use strict";
  if (window.__statArchiveDownloadOfflineRepairV5) return;
  window.__statArchiveDownloadOfflineRepairV5 = true;

  const originalDownloadEntry = typeof window.downloadEntry === "function" ? window.downloadEntry : null;
  const isAndroid = () => !!(window.AndroidBridge && typeof window.AndroidBridge === "object");
  function nativeFetch(){ if(window.fetch?.__native) return window.fetch.__native; return window.fetch.bind(window); }
  function cleanName(value){ return String(value||"Stat Archive file").replace(/[\\/:*?"<>|\r\n]+/g,"_").replace(/\.+$/g,"").trim()||"Stat Archive file"; }

  function ensureDownloadProgressPanel(){
    let panel=document.getElementById("statDownloadProgressPanel");
    if(panel) return panel;
    const style=document.createElement("style");
    style.id="statDownloadProgressPanelStyle";
    style.textContent=`
#statDownloadProgressPanel{position:fixed;z-index:12050;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translate(-50%,18px);width:min(770px,calc(100vw - 30px));padding:17px 24px 20px;border:1px solid rgba(120,105,145,.20);border-radius:27px;background:rgba(255,255,255,.96);box-shadow:0 14px 38px rgba(45,34,55,.18);color:#29252d;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease;font-family:Inter,sans-serif;box-sizing:border-box}
#statDownloadProgressPanel.show{opacity:1;transform:translate(-50%,0)}
#statDownloadProgressPanel .sa-dp-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:14px}
#statDownloadProgressPanel .sa-dp-ring{width:38px;height:38px;border-radius:50%;box-sizing:border-box;border:4px solid #ded5e9;border-top-color:#75509a;animation:saDpSpin .8s linear infinite}
#statDownloadProgressPanel .sa-dp-label{min-width:0;font-size:18px;font-weight:750;line-height:1.35;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#statDownloadProgressPanel .sa-dp-pct{font:800 19px/1 'JetBrains Mono',monospace;color:#70428e}
#statDownloadProgressPanel .sa-dp-track{height:9px;margin-top:15px;border-radius:999px;background:#eee8f1;overflow:hidden}
#statDownloadProgressPanel .sa-dp-fill{height:100%;width:0;border-radius:inherit;background:#75509a;transition:width .1s linear}
body:not([data-theme="light"]) #statDownloadProgressPanel{background:rgba(16,23,33,.97);border-color:rgba(148,163,184,.20);color:#f1f4f8;box-shadow:0 14px 38px rgba(0,0,0,.32)}
body:not([data-theme="light"]) #statDownloadProgressPanel .sa-dp-ring{border-color:#283646;border-top-color:#63efff}
body:not([data-theme="light"]) #statDownloadProgressPanel .sa-dp-pct{color:#63efff}
body:not([data-theme="light"]) #statDownloadProgressPanel .sa-dp-track{background:#202c39}
body:not([data-theme="light"]) #statDownloadProgressPanel .sa-dp-fill{background:#63efff}
@keyframes saDpSpin{to{transform:rotate(360deg)}}
@media(max-width:700px){#statDownloadProgressPanel{bottom:calc(14px + env(safe-area-inset-bottom,0px));width:calc(100vw - 28px);padding:16px 20px 18px;border-radius:25px}#statDownloadProgressPanel .sa-dp-row{grid-template-columns:42px minmax(0,1fr) auto;gap:11px}#statDownloadProgressPanel .sa-dp-ring{width:34px;height:34px}#statDownloadProgressPanel .sa-dp-label{font-size:16px}#statDownloadProgressPanel .sa-dp-pct{font-size:17px}}
`;
    document.head.appendChild(style);
    panel=document.createElement("div");
    panel.id="statDownloadProgressPanel";
    panel.setAttribute("role","status");
    panel.setAttribute("aria-live","polite");
    panel.innerHTML='<div class="sa-dp-row"><span class="sa-dp-ring" aria-hidden="true"></span><div class="sa-dp-label"></div><div class="sa-dp-pct">0%</div></div><div class="sa-dp-track"><div class="sa-dp-fill"></div></div>';
    document.body.appendChild(panel);
    return panel;
  }

  let hideTimer=0;
  function showDownloadProgress(entry,loaded,total){
    const panel=ensureDownloadProgressPanel();
    clearTimeout(hideTimer);
    const title=String(entry?.title||entry?.filename||"File").trim();
    const pct=total>0?Math.max(0,Math.min(100,Math.round(loaded/total*100))):0;
    panel.querySelector(".sa-dp-label").textContent=`Downloading · ${title}`;
    panel.querySelector(".sa-dp-pct").textContent=total>0?`${pct}%`:"…";
    panel.querySelector(".sa-dp-fill").style.width=total>0?`${pct}%`:"12%";
    panel.classList.add("show");
  }
  function finishDownloadProgress(entry){
    const panel=ensureDownloadProgressPanel();
    const title=String(entry?.title||entry?.filename||"File").trim();
    panel.querySelector(".sa-dp-label").textContent=`Downloaded · ${title}`;
    panel.querySelector(".sa-dp-pct").textContent="100%";
    panel.querySelector(".sa-dp-fill").style.width="100%";
    hideTimer=setTimeout(()=>panel.classList.remove("show"),900);
  }
  function failDownloadProgress(){ const panel=document.getElementById("statDownloadProgressPanel"); if(panel) panel.classList.remove("show"); }

  async function responseBlobWithProgress(response,entry,btn){
    if(!response.body||typeof response.body.getReader!=="function") return response.blob();
    const total=Number(response.headers.get("content-length"))||0;
    const reader=response.body.getReader(),chunks=[]; let loaded=0;
    showDownloadProgress(entry,0,total);
    while(true){
      const {done,value}=await reader.read(); if(done) break;
      if(value){chunks.push(value);loaded+=value.byteLength;showDownloadProgress(entry,loaded,total);if(btn&&total>0)btn.textContent=`Downloading… ${Math.max(0,Math.min(100,Math.round(loaded/total*100)))}%`;}
    }
    if(total>0) showDownloadProgress(entry,total,total);
    return new Blob(chunks,{type:response.headers.get("content-type")||"application/octet-stream"});
  }

  async function browserDownloadBlob(blob,filename){
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function markComplete(entry,btn){
    if(btn){btn.disabled=false;btn.classList.add("is-downloaded");btn.textContent="✓ Downloaded";btn.title="Already downloaded on this device";}
    try{if(typeof downloadedEntryIds!=="undefined"){downloadedEntryIds.add(String(entry.id));if(typeof saveEntryActionHistory==="function")saveEntryActionHistory("statArchiveDownloadedEntries",downloadedEntryIds);}}catch(_){}
  }
  async function webDownload(entry,btn){
    const old=btn?.innerHTML||"⬇ Download";
    if(btn){btn.disabled=true;btn.textContent="Downloading… 0%";}
    showDownloadProgress(entry,0,0);
    try{
      let url="";
      if(entry?.driveUrl) url=typeof window.statArchiveDriveStreamUrl==="function"?window.statArchiveDriveStreamUrl(entry,"inline"):entry.driveUrl;
      else {const worker=typeof WORKER_URL==="string"?WORKER_URL:"https://stat-archive-api.lustats.workers.dev";url=`${worker}/file?id=${encodeURIComponent(entry.id)}`;}
      const response=await nativeFetch()(url,{method:"GET",cache:"no-store",credentials:"omit"});
      if(!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob=await responseBlobWithProgress(response,entry,btn);
      let filename="";try{if(typeof window.archiveDownloadName==="function")filename=window.archiveDownloadName(entry);}catch(_){}
      if(!filename)filename=entry.filename||entry.title||"Stat Archive file";filename=cleanName(filename);
      const hinted=String(blob.type||entry.mime||"").toLowerCase();if((hinted.includes("pdf")||entry.driveUrl)&&!/\.pdf$/i.test(filename))filename+=".pdf";
      finishDownloadProgress(entry);
      await browserDownloadBlob(blob,filename);
      try{window.incrementActivity?.("download");}catch(_){}
      markComplete(entry,btn);
    }catch(err){
      console.error("Download failed:",err);failDownloadProgress();if(btn){btn.disabled=false;btn.innerHTML=old;}try{window.showError?.(err?.message||"Couldn't download that file.");}catch(_){}
    }
  }

  window.downloadEntry=function(entry,btn){
    if(isAndroid()&&originalDownloadEntry) return originalDownloadEntry(entry,btn);
    if(entry?._offlineBlob){
      const name=cleanName(entry._offlineFilename||entry.filename||entry.title||"Stat Archive file.pdf");
      showDownloadProgress(entry,0,entry._offlineBlob.size||1);showDownloadProgress(entry,entry._offlineBlob.size||1,entry._offlineBlob.size||1);finishDownloadProgress(entry);browserDownloadBlob(entry._offlineBlob,name).then(()=>markComplete(entry,btn));return;
    }
    return webDownload(entry,btn);
  };

  document.addEventListener("click",event=>{
    if(isAndroid())return;
    const btn=event.target instanceof Element?event.target.closest(".dl-btn,.download-btn"):null;if(!btn)return;
    const card=btn.closest(".card");if(!card)return;
    const source=Array.isArray(window.entries)?window.entries:(typeof entries!=="undefined"&&Array.isArray(entries)?entries:[]);
    const entry=source.find(item=>String(item.id)===String(card.dataset.id));if(!entry)return;
    event.preventDefault();event.stopImmediatePropagation();window.downloadEntry(entry,btn);
  },true);
})();
