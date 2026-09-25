(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;

  const PURGE_KEY = 'statArchiveCardUiCachePurge20260925DownloadEffectV1';
  try {
    if (navigator.onLine && !localStorage.getItem(PURGE_KEY) && 'caches' in window) {
      caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('stat-archive-shell-')).map(key => caches.delete(key)))).then(() => localStorage.setItem(PURGE_KEY, '1')).catch(() => {});
    }
  } catch (_) {}

  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
html body .toolbar > .archive-type-filter-section{border-top:0!important;border-bottom:1px solid var(--line)!important;box-shadow:none!important}
html body .toolbar > .archive-action-row,html body .toolbar > .archive-type-filter-section + .archive-action-row{border:0!important;border-top:0!important;border-bottom:0!important;box-shadow:none!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;position:relative!important}
html body .toolbar > .archive-action-row::before,html body .toolbar > .archive-action-row::after,html body .toolbar > .archive-type-filter-section + .archive-action-row::before,html body .toolbar > .archive-type-filter-section + .archive-action-row::after{content:none!important;display:none!important}
html body .archive-entries-divider{border:0!important;margin-top:0!important;padding-top:20px!important;margin-bottom:16px!important;display:block!important}
html body .archive-entries-divider>i,html body .archive-entries-divider::before,html body .archive-entries-divider::after{display:none!important;content:none!important}
html.stat-theme-settling *,html.stat-theme-settling *::before,html.stat-theme-settling *::after{transition:none!important}
html body .header .hero-probability .axis-mid{color:#5ee7f7!important;fill:#5ee7f7!important}
html[data-theme="light"] body .header .hero-probability .axis-mid,html body[data-theme="light"] .header .hero-probability .axis-mid{color:#347d73!important;fill:#347d73!important}
html body .card-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;width:100%!important;min-width:0!important;overflow:hidden!important}
html body .card-actions>*{min-width:0!important;flex-shrink:1!important}
html body .card-actions .action-btn{white-space:nowrap!important;flex:1 1 0!important;min-width:0!important;max-width:none!important;justify-content:center!important;overflow:hidden!important;text-overflow:clip!important}
html body .card-actions .edit-btn,html body .card-actions .del-btn{flex:0 1 auto!important}

/* Offline is the canonical action. Download is deliberately given no independent visual skin here. */
html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{box-sizing:border-box!important;height:32px!important;min-height:32px!important;padding:0 8px!important;border-radius:8px!important;font-size:11.5px!important;font-weight:650!important;line-height:1!important;gap:4px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
@media(max-width:700px){html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{flex:1 1 0!important;width:0!important;min-width:0!important;max-width:none!important;height:32px!important;min-height:32px!important;padding:0 6px!important;font-size:11px!important;font-weight:700!important;border-radius:8px!important}}
@media(max-width:390px){html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{height:30px!important;min-height:30px!important;padding:0 4px!important;font-size:9.5px!important}}

/* Copy the browser-computed Offline appearance to Download. This makes Offline itself the single source of truth even if another stylesheet changes it later. */
html body .card .card-actions .dl-btn.sa-offline-style,html body .card .card-actions .download-btn.sa-offline-style{color:var(--sa-offline-color)!important;background:var(--sa-offline-background)!important;border:var(--sa-offline-border)!important;box-shadow:var(--sa-offline-shadow)!important;opacity:var(--sa-offline-opacity)!important;border-radius:var(--sa-offline-radius)!important;font-family:var(--sa-offline-font-family)!important;font-size:var(--sa-offline-font-size)!important;font-weight:var(--sa-offline-font-weight)!important;height:var(--sa-offline-height)!important;min-height:var(--sa-offline-min-height)!important;padding:var(--sa-offline-padding)!important}
@media(max-width:700px){html body .card-actions{gap:4px!important}html body .card-actions .action-btn{padding-left:4px!important;padding-right:4px!important;font-size:clamp(9.5px,2.75vw,11.5px)!important;gap:3px!important}html body .card-actions .edit-btn{flex-basis:56px!important}html body .card-actions .del-btn{flex:0 1 42px!important}html body .archive-entries-divider{margin-top:0!important;padding-top:18px!important;margin-bottom:12px!important}}
@media(max-width:390px){html body .card-actions{gap:3px!important}html body .card-actions .edit-btn{flex-basis:50px!important}html body .card-actions .del-btn{flex-basis:36px!important}}
@media (hover:none),(pointer:coarse){html body #mainMenuBtn.main-menu-btn:hover,html body #mainMenuBtn.main-menu-btn:active,html body #mainMenuBtn.main-menu-btn:focus:not(:focus-visible){transform:none!important;filter:none!important;box-shadow:none!important;outline:none!important}}
`;
  document.head.appendChild(style);

  function copyOfflineStyle(card){
    if(!card) return;
    const offline=card.querySelector('.offline-btn');
    const download=card.querySelector('.dl-btn,.download-btn');
    if(!offline||!download) return;
    const cs=getComputedStyle(offline);
    download.style.setProperty('--sa-offline-color',cs.color);
    download.style.setProperty('--sa-offline-background',cs.background);
    download.style.setProperty('--sa-offline-border',cs.border);
    download.style.setProperty('--sa-offline-shadow',cs.boxShadow);
    download.style.setProperty('--sa-offline-opacity',cs.opacity);
    download.style.setProperty('--sa-offline-radius',cs.borderRadius);
    download.style.setProperty('--sa-offline-font-family',cs.fontFamily);
    download.style.setProperty('--sa-offline-font-size',cs.fontSize);
    download.style.setProperty('--sa-offline-font-weight',cs.fontWeight);
    download.style.setProperty('--sa-offline-height',cs.height);
    download.style.setProperty('--sa-offline-min-height',cs.minHeight);
    download.style.setProperty('--sa-offline-padding',cs.padding);
    download.classList.add('sa-offline-style');
  }
  function syncOfflineStyles(root=document){
    root.querySelectorAll?.('.card').forEach(copyOfflineStyle);
    if(root.matches?.('.card')) copyOfflineStyle(root);
  }

  let offlineSyncFrame=0;
  function scheduleOfflineStyleSync(root=document){
    if(offlineSyncFrame) return;
    offlineSyncFrame=requestAnimationFrame(()=>{
      offlineSyncFrame=0;
      syncOfflineStyles(root);
    });
  }
  syncOfflineStyles();

  /* Performance: never observe inline style mutations here. copyOfflineStyle()
     writes CSS variables to Download, so observing style caused a feedback loop:
     write -> mutation -> rAF -> write -> mutation. On entry sliders this could
     keep the main thread busy continuously. Only structural/state changes need
     a resync, and all of them are coalesced to one animation frame. */
  const styleObserver=new MutationObserver(mutations=>{
    let needsSync=false;
    for(const mutation of mutations){
      if(mutation.type==='childList'&&mutation.addedNodes.length){needsSync=true;break;}
      if(mutation.type==='attributes'){
        const el=mutation.target instanceof Element?mutation.target:null;
        if(el?.closest?.('.card')){needsSync=true;break;}
      }
    }
    if(needsSync) scheduleOfflineStyleSync(document);
  });
  styleObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  const markThemeSettling=()=>{document.documentElement.classList.add('stat-theme-settling');requestAnimationFrame(()=>requestAnimationFrame(()=>{document.documentElement.classList.remove('stat-theme-settling');syncOfflineStyles()}))};
  ['themeDarkBtn','themeLightBtn','menuDarkBtn','menuLightBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',markThemeSettling,true));
  function syncThemeAndMu(){
    const bodyTheme=document.body?.getAttribute('data-theme');const htmlTheme=document.documentElement.getAttribute('data-theme');const value=bodyTheme==='light'||bodyTheme==='dark'?bodyTheme:(htmlTheme==='light'?'light':'dark');const isLight=value==='light';
    if(document.body&&document.body.getAttribute('data-theme')!==value)document.body.setAttribute('data-theme',value);if(document.documentElement.getAttribute('data-theme')!==value)document.documentElement.setAttribute('data-theme',value);
    const color=isLight?'#347d73':'#5ee7f7';document.querySelectorAll('.hero-probability .axis-mid').forEach(mu=>{mu.style.setProperty('color',color,'important');mu.style.setProperty('fill',color,'important')});
    try{document.dispatchEvent(new CustomEvent('statarchive:theme-change',{detail:{theme:value}}))}catch(_){}
    scheduleOfflineStyleSync(document);
  }
  let syncingTheme=false;const themeObserver=new MutationObserver(()=>{if(syncingTheme)return;syncingTheme=true;try{syncThemeAndMu()}finally{syncingTheme=false}});if(document.body)themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme']});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncThemeAndMu();

  /* Keep the action label as Download. Completion is communicated by the
     existing checkmark/state styling only, so the pill width never jumps. */
  function syncDownloadStatus(root=document){
    root.querySelectorAll?.('.dl-btn,.download-btn').forEach(btn=>{
      if(btn.classList.contains('is-downloaded')&&!btn.disabled){
        if(btn.textContent.trim()!=='✓ Download') btn.textContent='✓ Download';
        btn.setAttribute('title','Downloaded on this device');
      }
    });
  }
  syncDownloadStatus();
  const downloadStatusObserver=new MutationObserver(mutations=>{for(const mutation of mutations){const target=mutation.target instanceof Element?mutation.target:mutation.target?.parentElement;const btn=target?.closest?.('.dl-btn,.download-btn');if(btn&&btn.classList.contains('is-downloaded')&&!btn.disabled){if(btn.textContent.trim()!=='✓ Download')btn.textContent='✓ Download';btn.setAttribute('title','Downloaded on this device')}if(mutation.type==='childList')mutation.addedNodes.forEach(node=>{if(node instanceof Element)syncDownloadStatus(node)})}});downloadStatusObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  const releaseMenuButtonState=()=>{const btn=document.getElementById('mainMenuBtn');if(!btn)return;try{btn.blur()}catch(_){}btn.classList.remove('is-pressed','is-active','active')};const isTouchLike=()=>!!window.matchMedia?.('(hover:none), (pointer:coarse)').matches;
  document.addEventListener('pointerup',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn'))return;requestAnimationFrame(releaseMenuButtonState)},true);
  document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn,#mainMenuCloseBtn,#mainMenuBackdrop'))return;setTimeout(releaseMenuButtonState,0)},true);
})();
