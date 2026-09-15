/* Stat Archive — download/offline reliability layer. */
(() => {
  "use strict";
  if (window.__statArchiveDownloadOfflineRepairV4) return;
  window.__statArchiveDownloadOfflineRepairV4 = true;

  const originalDownloadEntry = typeof window.downloadEntry === "function" ? window.downloadEntry : null;
  const originalSaveEntryOffline = typeof window.saveEntryOffline === "function" ? window.saveEntryOffline : null;
  const originalOpenOfflineFile = typeof window.openOfflineFile === "function" ? window.openOfflineFile : null;
  const originalShareOfflineFile = typeof window.shareOfflineFile === "function" ? window.shareOfflineFile : null;

  const isAndroid = () => !!(window.AndroidBridge && typeof window.AndroidBridge === "object");
  const hasStreamBridge = () => !!(window.AndroidStreamBridge && typeof window.AndroidStreamBridge === "object");
  function nativeFetch(){ if(window.fetch?.__native) return window.fetch.__native; return window.fetch.bind(window); }
  function cleanName(value){ return String(value||"Stat Archive file").replace(/[\\/:*?"<>|\r\n]+/g,"_").replace(/\.+$/g,"").trim()||"Stat Archive file"; }
  function hasUsefulExtension(name){ return /\.[A-Za-z0-9]{1,8}$/.test(String(name||"")); }

  async function looksLikePdf(blob,record){
    const hinted=[record?.mime,blob?.type,record?.filename,record?.title].filter(Boolean).join(" ").toLowerCase();
    if(hinted.includes("application/pdf")||/\.pdf(?:\s|$)/i.test(hinted)) return true;
    try{ const b=new Uint8Array(await blob.slice(0,5).arrayBuffer()); return b.length>=5&&b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46&&b[4]===0x2d; }catch(_){ return false; }
  }

  async function normalizeRecordBlob(record,sourceEntry=null){
    if(!record?.blob) throw new Error("Offline file could not be found.");
    const pdf=await looksLikePdf(record.blob,sourceEntry||record);
    let mime=String(record.mime||record.blob.type||"").trim(); if(pdf) mime="application/pdf"; if(!mime) mime="application/octet-stream";
    let filename="";
    try{ if(sourceEntry&&typeof window.archiveDownloadName==="function") filename=window.archiveDownloadName(sourceEntry); }catch(_){}
    if(!filename){ try{ if(typeof window.safeOfflineShareFilename==="function") filename=window.safeOfflineShareFilename(record); }catch(_){} }
    if(!filename) filename=record.filename||record.title||"Stat Archive file"; filename=cleanName(filename);
    if(pdf&&!/\.pdf$/i.test(filename)) filename=hasUsefulExtension(filename)?filename.replace(/\.[A-Za-z0-9]{1,8}$/,".pdf"):filename+".pdf";
    const blob=record.blob.type===mime?record.blob:new Blob([record.blob],{type:mime}); return {blob,mime,filename,pdf};
  }

  async function persistNormalizedOfflineRecord(record,normalized,sourceEntry=null){
    if(!record||typeof window.putOfflineFile!=="function") return;
    const next={...record,filename:normalized.filename,mime:normalized.mime,blob:normalized.blob}; if(sourceEntry?.driveUrl) next.driveUrl=sourceEntry.driveUrl;
    const changed=next.filename!==record.filename||next.mime!==record.mime||next.blob.type!==record.blob?.type||(!!sourceEntry?.driveUrl&&next.driveUrl!==record.driveUrl);
    if(changed){ try{ await window.putOfflineFile(next); }catch(_){} }
  }

  function blobSliceToBase64(blob){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onerror=()=>reject(reader.error||new Error("Could not read file chunk.")); reader.onload=()=>{ const v=String(reader.result||""); const c=v.indexOf(","); resolve(c>=0?v.slice(c+1):v); }; reader.readAsDataURL(blob); }); }

  async function transferBlobWithAndroid(blob,filename,mime,action){
    const bridge=window.AndroidStreamBridge;
    if(!hasStreamBridge()||typeof bridge.beginBlobTransfer!=="function"||typeof bridge.appendBlobChunk!=="function"||typeof bridge.finishBlobTransfer!=="function") return false;
    if(!bridge.beginBlobTransfer(filename,mime,action)) throw new Error("Android file transfer could not be started.");
    const CHUNK_BYTES=256*1024;
    for(let offset=0;offset<blob.size;offset+=CHUNK_BYTES){ const chunk=blob.slice(offset,Math.min(offset+CHUNK_BYTES,blob.size)); const base64=await blobSliceToBase64(chunk); if(!bridge.appendBlobChunk(base64)) throw new Error("Android file transfer was interrupted."); }
    if(!bridge.finishBlobTransfer()) throw new Error("Android file transfer could not be completed."); return true;
  }

  async function saveBlobWithAndroid(blob,filename,mime){
    if(!isAndroid()) throw new Error("Android file saving is unavailable.");
    if(await transferBlobWithAndroid(blob,filename,mime,"save")) return;
    if(typeof window.AndroidBridge.saveFile!=="function") throw new Error("Android file saving is unavailable.");
    if(typeof window.blobToBase64!=="function") throw new Error("Could not prepare that file for Android.");
    const base64=await window.blobToBase64(blob); window.AndroidBridge.saveFile(base64,filename,mime);
  }

  async function browserDownloadBlob(blob,filename){ const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.style.display="none"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); }

  /* Web Download changes only its label/state. Its visual shell stays owned by the common card-action CSS, just like Offline. */
  function formatProgressBytes(bytes){ const n=Number(bytes)||0; if(n<1024) return `${n} B`; if(n<1048576) return `${(n/1024).toFixed(1)} KB`; return `${(n/1048576).toFixed(1)} MB`; }
  function paintWebProgress(btn,loaded,total){
    if(!btn||isAndroid()) return;
    btn.disabled=true;
    if(total>0){ const pct=Math.max(0,Math.min(100,Math.round(loaded/total*100))); btn.textContent=`Downloading… ${pct}%`; btn.setAttribute("aria-label",`Downloading ${pct}%`); }
    else { const amount=formatProgressBytes(loaded); btn.textContent=`Downloading… ${amount}`; btn.setAttribute("aria-label",`Downloading ${amount}`); }
  }
  async function responseBlobWithWebProgress(response,btn){
    if(isAndroid()||!response.body||typeof response.body.getReader!=="function") return response.blob();
    const total=Number(response.headers.get("content-length"))||0; const reader=response.body.getReader(); const chunks=[]; let loaded=0; paintWebProgress(btn,0,total);
    while(true){ const {done,value}=await reader.read(); if(done) break; if(value){ chunks.push(value); loaded+=value.byteLength; paintWebProgress(btn,loaded,total); } }
    if(total>0) paintWebProgress(btn,total,total);
    return new Blob(chunks,{type:response.headers.get("content-type")||"application/octet-stream"});
  }

  function markDownloadComplete(entry,btn){
    try{ if(btn){ btn.classList.remove("is-downloading","sa-offline-style"); btn.classList.add("is-downloaded"); btn.disabled=false; btn.textContent="✓ Downloaded"; btn.setAttribute("title","Already downloaded on this device"); btn.removeAttribute("aria-label"); }
      if(typeof downloadedEntryIds!=="undefined"){ downloadedEntryIds.add(String(entry.id)); if(typeof saveEntryActionHistory==="function") saveEntryActionHistory("statArchiveDownloadedEntries",downloadedEntryIds); }
    }catch(_){}
  }

  async function downloadDriveEntry(entry,btn){
    const originalHtml=btn?btn.innerHTML:"", originalText=btn?btn.textContent:""; if(btn){ btn.disabled=true; btn.textContent="Downloading…"; }
    try{
      const inlineUrl=typeof window.statArchiveDriveStreamUrl==="function"?window.statArchiveDriveStreamUrl(entry,"inline"):entry.driveUrl;
      let nativeName=""; try{ if(typeof window.archiveDownloadName==="function") nativeName=window.archiveDownloadName(entry); }catch(_){}
      if(!nativeName) nativeName=entry.title||entry.filename||"Stat Archive file.pdf"; nativeName=cleanName(nativeName); if(!/\.pdf$/i.test(nativeName)) nativeName+=".pdf";
      if(isAndroid()&&hasStreamBridge()&&typeof window.AndroidStreamBridge.saveUrl==="function"&&window.AndroidStreamBridge.saveUrl(inlineUrl,nativeName,"application/pdf")){ try{window.incrementActivity?.("download");}catch(_){} markDownloadComplete(entry,btn); return; }
      if(isAndroid()&&typeof window.AndroidBridge.downloadUrl==="function"){ window.AndroidBridge.downloadUrl(inlineUrl,nativeName,"application/pdf"); try{window.incrementActivity?.("download");}catch(_){} markDownloadComplete(entry,btn); return; }
      const response=await nativeFetch()(inlineUrl,{method:"GET",cache:"no-store",credentials:"omit"}); if(!response.ok) throw new Error(`Download failed (${response.status})`);
      const raw=await responseBlobWithWebProgress(response,btn); const pdf=await looksLikePdf(raw,entry); const mime=pdf?"application/pdf":(raw.type||response.headers.get("content-type")||"application/octet-stream"); const blob=raw.type===mime?raw:new Blob([raw],{type:mime});
      let filename=""; try{ if(typeof window.archiveDownloadName==="function") filename=window.archiveDownloadName(entry); }catch(_){} if(!filename) filename=entry.title||entry.filename||"Stat Archive file"; filename=cleanName(filename); if(pdf&&!/\.pdf$/i.test(filename)) filename+=".pdf";
      if(isAndroid()) await saveBlobWithAndroid(blob,filename,mime); else await browserDownloadBlob(blob,filename);
      try{window.incrementActivity?.("download");}catch(_){} markDownloadComplete(entry,btn);
    }catch(err){ console.error("Drive download failed:",err); try{window.showError?.(err?.message||"Couldn't download that file.");}catch(_){alert("Couldn't download that file.");} }
    finally{ if(btn&&!btn.classList.contains("is-downloaded")){ btn.classList.remove("is-downloading"); btn.disabled=false; btn.removeAttribute("aria-label"); if(originalHtml) btn.innerHTML=originalHtml; else btn.textContent=originalText||"⬇ Download"; } }
  }

  async function downloadOfflinePreviewBlob(entry,btn){ const blob=entry?._offlineBlob; if(!blob) return false; const filename=entry?._offlineFilename||entry?.filename||"Stat Archive file.pdf"; const mime=entry?._offlineMime||blob.type||"application/pdf"; if(isAndroid()) await saveBlobWithAndroid(blob,filename,mime); else await browserDownloadBlob(blob,filename); return true; }

  async function reliableDownloadEntry(entry,btn){
    if(entry?._offlineBlob){ try{ await downloadOfflinePreviewBlob(entry,btn); markDownloadComplete(entry,btn); }catch(err){window.showError?.(err?.message||"Couldn't download that file.");} return; }
    if(entry?.driveUrl) return downloadDriveEntry(entry,btn);
    const originalHtml=btn?btn.innerHTML:"", originalText=btn?btn.textContent:""; if(btn){btn.disabled=true;btn.textContent="Downloading…";}
    try{
      const workerUrl=typeof WORKER_URL==="string"?WORKER_URL:"https://stat-archive-api.lustats.workers.dev"; const fileUrl=`${workerUrl}/file?id=${encodeURIComponent(entry.id)}`;
      const response=await nativeFetch()(fileUrl,{method:"GET",credentials:"omit",cache:"no-store"}); if(!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob=await responseBlobWithWebProgress(response,btn); const filename=cleanName(entry.filename||entry.title||"stat-archive-file.pdf"); const mime=blob.type||"application/octet-stream";
      if(isAndroid()) await saveBlobWithAndroid(blob,filename,mime); else await browserDownloadBlob(blob,filename);
      try{window.incrementActivity?.("download");}catch(_){} markDownloadComplete(entry,btn);
    }catch(err){ console.error("Download failed:",err); if(isAndroid()&&originalDownloadEntry&&!hasStreamBridge()){try{return originalDownloadEntry(entry,btn);}catch(_){}} try{window.showError?.(err?.message||"Couldn't download that file.");}catch(_){alert("Couldn't download that file.");} }
    finally{ if(btn&&!btn.classList.contains("is-downloaded")){btn.classList.remove("is-downloading");btn.disabled=false;btn.removeAttribute("aria-label");if(originalHtml)btn.innerHTML=originalHtml;else btn.textContent=originalText||"⬇ Download";} }
  }

  window.downloadEntry=reliableDownloadEntry;

  if(originalSaveEntryOffline){ window.saveEntryOffline=async function repairedSaveEntryOffline(entry,btn){ await originalSaveEntryOffline(entry,btn); if(!entry?.driveUrl||typeof window.getOfflineFile!=="function") return; try{const record=await window.getOfflineFile(String(entry.id));if(!record?.blob)return;const normalized=await normalizeRecordBlob(record,entry);await persistNormalizedOfflineRecord(record,normalized,entry);}catch(err){console.warn("Offline metadata repair failed:",err);} }; }
  if(originalOpenOfflineFile){ window.openOfflineFile=async function repairedOpenOfflineFile(id){ if(typeof window.getOfflineFile!=="function") return originalOpenOfflineFile(id); const record=await window.getOfflineFile(String(id));if(!record?.blob)throw new Error("Offline file could not be found.");const normalized=await normalizeRecordBlob(record);await persistNormalizedOfflineRecord(record,normalized);if(isAndroid()&&hasStreamBridge()){await transferBlobWithAndroid(normalized.blob,normalized.filename,normalized.mime,"open");return;}return originalOpenOfflineFile(id); }; }
  if(originalShareOfflineFile){ window.shareOfflineFile=async function repairedShareOfflineFile(id){ if(typeof window.getOfflineFile!=="function")return originalShareOfflineFile(id);const record=await window.getOfflineFile(String(id));if(!record?.blob)throw new Error("Offline file could not be found.");const normalized=await normalizeRecordBlob(record);await persistNormalizedOfflineRecord(record,normalized);if(isAndroid()&&hasStreamBridge()){await transferBlobWithAndroid(normalized.blob,normalized.filename,normalized.mime,"share");return;}return originalShareOfflineFile(id); }; }

  document.addEventListener("click",event=>{ if(isAndroid())return; const btn=event.target instanceof Element?event.target.closest(".dl-btn"):null;if(!btn)return;const card=btn.closest(".card");if(!card)return;const source=Array.isArray(window.entries)?window.entries:(typeof entries!=="undefined"&&Array.isArray(entries)?entries:[]);const entry=source.find(item=>String(item.id)===String(card.dataset.id));if(!entry)return;event.preventDefault();event.stopImmediatePropagation();reliableDownloadEntry(entry,btn); },true);
})();
