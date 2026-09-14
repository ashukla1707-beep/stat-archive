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
   Download / Offline save / App update
   ========================================================= */
(function(){
  "use strict";

  if(window.__STAT_ARCHIVE_ACTION_STATUS_V1__) return;
  window.__STAT_ARCHIVE_ACTION_STATUS_V1__=true;

  let hideTimer=null;

  function installStatusStyle(){
    if(document.getElementById('statArchiveActionStatusStyle')) return;
    const style=document.createElement('style');
    style.id='statArchiveActionStatusStyle';
    style.textContent=`
#statArchiveActionStatus{position:fixed;left:50%;bottom:max(18px,calc(env(safe-area-inset-bottom,0px) + 14px));z-index:30000;display:flex;align-items:center;gap:10px;min-width:min(330px,calc(100vw - 28px));max-width:min(520px,calc(100vw - 28px));box-sizing:border-box;padding:11px 13px;border:1px solid rgba(148,163,184,.22);border-radius:13px;background:rgba(11,17,26,.96);color:#eef3f8;box-shadow:0 16px 42px rgba(0,0,0,.36);font:600 11.5px/1.35 Inter,sans-serif;transform:translate(-50%,18px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s ease;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
#statArchiveActionStatus.is-visible{opacity:1;visibility:visible;transform:translate(-50%,0)}
#statArchiveActionStatus .sa-status-icon{width:18px;height:18px;flex:0 0 18px;display:grid;place-items:center;border-radius:50%;border:2px solid rgba(94,231,247,.32);color:#7ce9f5;font-size:10px;box-sizing:border-box}
#statArchiveActionStatus[data-state="loading"] .sa-status-icon{border-top-color:#7ce9f5;animation:saStatusSpin .8s linear infinite;color:transparent}
#statArchiveActionStatus[data-state="success"] .sa-status-icon{border-color:rgba(92,214,144,.46);color:#75dfa4}
#statArchiveActionStatus[data-state="error"] .sa-status-icon{border-color:rgba(255,120,120,.45);color:#ff9a9a}
#statArchiveActionStatus .sa-status-text{min-width:0;flex:1;white-space:normal;overflow-wrap:anywhere}
@keyframes saStatusSpin{to{transform:rotate(360deg)}}
body[data-theme="light"] #statArchiveActionStatus{background:rgba(251,250,247,.97);color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 16px 36px rgba(50,40,30,.18)}
@media(max-width:700px){#statArchiveActionStatus{min-width:calc(100vw - 24px);max-width:calc(100vw - 24px);bottom:max(12px,calc(env(safe-area-inset-bottom,0px) + 10px));padding:11px 12px}}
@media(prefers-reduced-motion:reduce){#statArchiveActionStatus{transition:none}#statArchiveActionStatus[data-state="loading"] .sa-status-icon{animation:none}}
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
    el.innerHTML='<span class="sa-status-icon" aria-hidden="true">✓</span><span class="sa-status-text"></span>';
    document.body.appendChild(el);
    return el;
  }

  function showActionStatus(text,state='loading',duration=0){
    const el=statusEl();
    const icon=el.querySelector('.sa-status-icon');
    const copy=el.querySelector('.sa-status-text');
    if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
    el.dataset.state=state;
    if(icon) icon.textContent=state==='success'?'✓':state==='error'?'!':'•';
    if(copy) copy.textContent=String(text||'Working…');
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

  function wrapDownload(){
    const fn=window.downloadEntry;
    if(typeof fn!=='function'||fn.__saStatusWrapped) return false;
    const wrapped=async function(entry,btn,...rest){
      showActionStatus(`Preparing download · ${entryName(entry)}`,'loading');
      try{
        const result=await fn.call(this,entry,btn,...rest);
        showActionStatus('Download started successfully','success',2600);
        return result;
      }catch(err){
        showActionStatus(err?.message||'Download failed','error',4200);
        throw err;
      }
    };
    wrapped.__saStatusWrapped=true;
    wrapped.__saOriginal=fn;
    window.downloadEntry=wrapped;
    try{ downloadEntry=wrapped; }catch(_){}
    return true;
  }

  function wrapOfflineSave(){
    const fn=window.saveEntryOffline;
    if(typeof fn!=='function'||fn.__saStatusWrapped) return false;
    const wrapped=async function(entry,btn,...rest){
      const id=String(entry?.id??'');
      showActionStatus(`Saving offline · ${entryName(entry)}`,'loading');
      try{
        const result=await fn.call(this,entry,btn,...rest);
        let saved=true;
        try{
          if(id&&typeof window.getOfflineFile==='function'){
            const record=await window.getOfflineFile(id);
            saved=!!record?.blob;
          }
        }catch(_){}
        showActionStatus(saved?'Saved for offline use':'Offline save finished',saved?'success':'error',saved?2800:4200);
        return result;
      }catch(err){
        showActionStatus(err?.message||'Could not save this file offline','error',4200);
        throw err;
      }
    };
    wrapped.__saStatusWrapped=true;
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
                showActionStatus('Update ready · applying changes…','success',2400);
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
