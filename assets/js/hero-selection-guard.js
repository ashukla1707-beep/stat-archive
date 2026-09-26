(function(){
  "use strict";

  function clearHeroSelection(){
    const sub=document.querySelector('.hero-line .sub');
    if(!sub) return;

    sub.style.userSelect='none';
    sub.style.webkitUserSelect='none';
    sub.style.webkitTouchCallout='none';
    sub.style.webkitTapHighlightColor='transparent';

    sub.querySelectorAll('*').forEach(el=>{
      el.style.userSelect='none';
      el.style.webkitUserSelect='none';
      el.style.webkitTouchCallout='none';
      el.style.webkitTapHighlightColor='transparent';
    });

    const sel=window.getSelection?.();
    if(sel && sel.rangeCount){
      try{
        const range=sel.getRangeAt(0);
        const node=range.commonAncestorContainer.nodeType===1
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
        if(node && (sub===node || sub.contains(node))) sel.removeAllRanges();
      }catch(_){ }
    }
  }

  function installGuard(){
    if(!document.getElementById('statArchiveHeroSelectionGuardStyle')){
      const style=document.createElement('style');
      style.id='statArchiveHeroSelectionGuardStyle';
      style.textContent=`
html body .header .hero-line .sub,
html body .header .hero-line .sub *{
  -webkit-user-select:none !important;
  user-select:none !important;
  -webkit-touch-callout:none !important;
  -webkit-tap-highlight-color:transparent !important;
}

html body .header .hero-line .hero-sub-lead,
html body .header .hero-line .hero-sub-tail{
  width:auto !important;
  min-width:0 !important;
  height:auto !important;
  min-height:0 !important;
  background:none !important;
  background-image:none !important;
  box-shadow:none !important;
}

html body .header .hero-line .sub::selection,
html body .header .hero-line .sub *::selection,
html body .header .hero-line .sub::-moz-selection,
html body .header .hero-line .sub *::-moz-selection{
  background:transparent !important;
  color:inherit !important;
  text-shadow:none !important;
}
`;
      document.head.appendChild(style);
    }

    clearHeroSelection();
    requestAnimationFrame(clearHeroSelection);
    setTimeout(clearHeroSelection,120);
  }

  function boot(){ installGuard(); }

  document.addEventListener('selectionchange',clearHeroSelection,true);
  window.addEventListener('pageshow',boot);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();

/* =========================================================
   GLOBAL ACTION STATUS NOTIFICATIONS
   Download / Offline save / App update + real byte progress
   ========================================================= */
(function(){
  "use strict";

  if(window.__STAT_ARCHIVE_ACTION_STATUS_V2__) return;
  window.__STAT_ARCHIVE_ACTION_STATUS_V2__=true;

  let hideTimer=null;
  let activeTransfer=null;
  const nativeFetch=window.fetch.bind(window);

  function installStatusStyle(){
    if(document.getElementById('statArchiveActionStatusStyle')) return;
    const style=document.createElement('style');
    style.id='statArchiveActionStatusStyle';
    style.textContent=`
#statArchiveActionStatus{position:fixed;left:50%;bottom:max(18px,calc(env(safe-area-inset-bottom,0px) + 14px));z-index:30000;display:grid;grid-template-columns:18px minmax(0,1fr) auto;align-items:center;column-gap:10px;row-gap:8px;min-width:min(330px,calc(100vw - 28px));max-width:min(560px,calc(100vw - 28px));box-sizing:border-box;padding:12px 13px;border:1px solid rgba(148,163,184,.22);border-radius:14px;background:rgba(11,17,26,.96);color:#eef3f8;box-shadow:0 16px 42px rgba(0,0,0,.36);font:600 11.5px/1.35 Inter,sans-serif;transform:translate(-50%,18px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s ease;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
#statArchiveActionStatus.is-visible{opacity:1;visibility:visible;transform:translate(-50%,0)}
#statArchiveActionStatus .sa-status-icon{width:18px;height:18px;flex:0 0 18px;display:grid;place-items:center;border-radius:50%;border:2px solid rgba(94,231,247,.32);color:#7ce9f5;font-size:10px;box-sizing:border-box}
#statArchiveActionStatus[data-state="loading"] .sa-status-icon{border-top-color:#7ce9f5;animation:saStatusSpin .8s linear infinite;color:transparent}
#statArchiveActionStatus[data-state="success"] .sa-status-icon{border-color:rgba(92,214,144,.46);color:#75dfa4}
#statArchiveActionStatus[data-state="error"] .sa-status-icon{border-color:rgba(255,120,120,.45);color:#ff9a9a}
#statArchiveActionStatus .sa-status-text{min-width:0;white-space:normal;overflow-wrap:anywhere}
#statArchiveActionStatus .sa-status-percent{min-width:42px;text-align:right;color:#67e8f9;font:800 13px/1 'JetBrains Mono',monospace;display:none}
#statArchiveActionStatus.has-progress .sa-status-percent{display:block}
#statArchiveActionStatus .sa-status-track{grid-column:1/-1;height:4px;border-radius:99px;background:rgba(148,163,184,.16);overflow:hidden;display:none}
#statArchiveActionStatus.has-progress .sa-status-track{display:block}
#statArchiveActionStatus .sa-status-bar{display:block;width:0%;height:100%;border-radius:inherit;background:currentColor;color:#5ee7f7;transition:width .12s linear}
@keyframes saStatusSpin{to{transform:rotate(360deg)}}
body[data-theme="light"] #statArchiveActionStatus{background:rgba(251,249,247,.98);color:#332b38;border-color:rgba(92,55,120,.18);box-shadow:0 16px 36px rgba(68,45,84,.16)}
body[data-theme="light"] #statArchiveActionStatus .sa-status-icon{border-color:rgba(108,62,143,.32);color:#70428f}
body[data-theme="light"] #statArchiveActionStatus[data-state="loading"] .sa-status-icon{border-color:rgba(108,62,143,.24);border-top-color:#70428f;color:transparent}
body[data-theme="light"] #statArchiveActionStatus[data-state="success"] .sa-status-icon{border-color:rgba(72,138,96,.36);color:#4c8f64}
body[data-theme="light"] #statArchiveActionStatus[data-state="error"] .sa-status-icon{border-color:rgba(184,76,76,.34);color:#b34d4d}
body[data-theme="light"] #statArchiveActionStatus .sa-status-percent{color:#70428f}
body[data-theme="light"] #statArchiveActionStatus .sa-status-track{background:rgba(92,55,120,.12)}
body[data-theme="light"] #statArchiveActionStatus .sa-status-bar{color:#70428f}
@media(max-width:700px){#statArchiveActionStatus{min-width:calc(100vw - 24px);max-width:calc(100vw - 24px);bottom:max(12px,calc(env(safe-area-inset-bottom,0px) + 10px));padding:12px}}
@media(prefers-reduced-motion:reduce){#statArchiveActionStatus{transition:none}#statArchiveActionStatus[data-state="loading"] .sa-status-icon{animation:none}#statArchiveActionStatus .sa-status-bar{transition:none}}
`;
    document.head.appendChild(style);
  }

  function statusEl(){
    installStatusStyle();
    let el=document.getElementById('statArchiveActionStatus');
    if(el) return el;
    el=document.createElement('div');
    el.id='statArchiveActionStatus';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.setAttribute('aria-atomic','true');
    el.innerHTML='<span class="sa-status-icon" aria-hidden="true">✓</span><span class="sa-status-text"></span><span class="sa-status-percent"></span><span class="sa-status-track" aria-hidden="true"><i class="sa-status-bar"></i></span>';
    document.body.appendChild(el);
    return el;
  }

  function clampPercent(value){
    const n=Number(value);
    if(!Number.isFinite(n)) return null;
    return Math.max(0,Math.min(100,Math.round(n)));
  }

  function showActionStatus(text,state='loading',duration=0,progress=null){
    const el=statusEl();
    const icon=el.querySelector('.sa-status-icon');
    const copy=el.querySelector('.sa-status-text');
    const pct=el.querySelector('.sa-status-percent');
    const bar=el.querySelector('.sa-status-bar');
    const p=clampPercent(progress);

    if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
    el.dataset.state=state;
    if(icon) icon.textContent=state==='success'?'✓':state==='error'?'!':'•';
    if(copy) copy.textContent=String(text||'Working…');

    el.classList.toggle('has-progress',p!==null);
    if(pct) pct.textContent=p===null?'':`${p}%`;
    if(bar) bar.style.width=p===null?'0%':`${p}%`;

    el.classList.add('is-visible');
    if(duration>0){
      hideTimer=setTimeout(()=>{
        el.classList.remove('is-visible');
        hideTimer=null;
      },duration);
    }
  }

  window.statArchiveActionStatus=showActionStatus;

  function entryName(entry){
    return String(entry?.title||entry?.filename||'file').trim();
  }

  function entryExpectedSize(entry){
    const values=[entry?.size,entry?.fileSize,entry?.bytes,entry?.file_size,entry?.metadata?.size];
    for(const value of values){
      const n=Number(value);
      if(Number.isFinite(n)&&n>0) return n;
    }
    return 0;
  }

  function formatBytes(bytes){
    const n=Number(bytes)||0;
    if(n<1024) return `${n} B`;
    if(n<1024*1024) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/(1024*1024)).toFixed(n>=10*1024*1024?1:2)} MB`;
  }

  function beginTransfer(entry,label){
    activeTransfer={
      entry,
      label,
      expected:entryExpectedSize(entry),
      startedAt:performance.now(),
      lastPercent:-1
    };
    showActionStatus(`${label} · ${entryName(entry)}`,'loading',0,0);
  }

  function endTransfer(){ activeTransfer=null; }

  /* Intercept only response bodies while one Stat Archive file transfer is
     active. The reconstructed Response is byte-for-byte equivalent, so the
     existing offline/download code can keep calling response.blob(). */
  window.fetch=async function(...args){
    const response=await nativeFetch(...args);
    const transfer=activeTransfer;
    if(!transfer||!response?.ok||!response.body||typeof response.body.getReader!=='function') return response;

    const headerTotal=Number(response.headers.get('content-length'))||0;
    const total=headerTotal||transfer.expected||0;
    if(!total) return response;

    const reader=response.body.getReader();
    const chunks=[];
    let received=0;

    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      if(value){
        chunks.push(value);
        received+=value.byteLength||value.length||0;
        const p=Math.max(0,Math.min(99,Math.floor((received/total)*100)));
        if(p!==transfer.lastPercent){
          transfer.lastPercent=p;
          showActionStatus(`${transfer.label} · ${entryName(transfer.entry)} · ${formatBytes(received)} / ${formatBytes(total)}`,'loading',0,p);
        }
      }
    }

    if(activeTransfer===transfer){
      transfer.lastPercent=100;
      showActionStatus(`${transfer.label} · ${entryName(transfer.entry)}`,'loading',0,100);
    }

    const blob=new Blob(chunks,{type:response.headers.get('content-type')||''});
    return new Response(blob,{
      status:response.status,
      statusText:response.statusText,
      headers:response.headers
    });
  };
  window.fetch.__native=nativeFetch;

  function wrapDownload(){
    const fn=window.downloadEntry;
    if(typeof fn!=='function'||fn.__saStatusWrappedV2) return false;
    const wrapped=async function(entry,btn,...rest){
      beginTransfer(entry,'Downloading');
      try{
        const result=await fn.call(this,entry,btn,...rest);
        showActionStatus('Download started successfully','success',2600,100);
        return result;
      }catch(err){
        showActionStatus(err?.message||'Download failed','error',4200,null);
        throw err;
      }finally{
        endTransfer();
      }
    };
    wrapped.__saStatusWrappedV2=true;
    wrapped.__saOriginal=fn;
    window.downloadEntry=wrapped;
    try{ downloadEntry=wrapped; }catch(_){}
    return true;
  }

  function wrapOfflineSave(){
    const fn=window.saveEntryOffline;
    if(typeof fn!=='function'||fn.__saStatusWrappedV2) return false;
    const wrapped=async function(entry,btn,...rest){
      const id=String(entry?.id??'');
      beginTransfer(entry,'Saving offline');
      try{
        const result=await fn.call(this,entry,btn,...rest);
        let saved=true;
        try{
          if(id&&typeof window.getOfflineFile==='function'){
            const record=await window.getOfflineFile(id);
            saved=!!record?.blob;
          }
        }catch(_){}
        showActionStatus(saved?'Saved for offline use':'Offline save finished',saved?'success':'error',saved?2800:4200,saved?100:null);
        return result;
      }catch(err){
        showActionStatus(err?.message||'Could not save this file offline','error',4200,null);
        throw err;
      }finally{
        endTransfer();
      }
    };
    wrapped.__saStatusWrappedV2=true;
    wrapped.__saOriginal=fn;
    window.saveEntryOffline=wrapped;
    try{ saveEntryOffline=wrapped; }catch(_){}
    return true;
  }

  function keepWrappersCurrent(){
    wrapDownload();
    wrapOfflineSave();
  }

  let tries=0;
  const wrapperTimer=setInterval(()=>{
    keepWrappersCurrent();
    tries+=1;
    if(tries>80) clearInterval(wrapperTimer);
  },125);
  keepWrappersCurrent();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      showActionStatus('Update installed · reloading Stat Archive…','success');
    });

    window.addEventListener('load',async()=>{
      try{
        const reg=await navigator.serviceWorker.getRegistration();
        if(!reg) return;

        const watch=worker=>{
          if(!worker||worker.__saStatusWatched) return;
          worker.__saStatusWatched=true;
          showActionStatus('Updating Stat Archive…','loading');
          worker.addEventListener('statechange',()=>{
            if(worker.state==='installed'){
              if(navigator.serviceWorker.controller){
                showActionStatus('Update ready · applying changes…','success',2400,100);
              }
            }else if(worker.state==='redundant'){
              showActionStatus('Update could not be installed','error',4200);
            }
          });
        };

        if(reg.installing) watch(reg.installing);
        reg.addEventListener('updatefound',()=>watch(reg.installing));
      }catch(_){}
    },{once:true});
  }
})();
