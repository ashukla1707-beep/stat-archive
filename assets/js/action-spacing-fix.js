(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;

  const PURGE_KEY = 'statArchiveCardUiCachePurge20260915WebDownloadRedesignV7';
  try {
    if (navigator.onLine && !localStorage.getItem(PURGE_KEY) && 'caches' in window) {
      caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('stat-archive-shell-')).map(key => caches.delete(key)))).then(() => localStorage.setItem(PURGE_KEY, '1')).catch(() => {});
    }
  } catch (_) {}

  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
html body .toolbar > .archive-type-filter-section{border-top:0!important;border-bottom:1px solid var(--line)!important;box-shadow:none!important}
html body .toolbar > .archive-action-row,html body .toolbar > .archive-type-filter-section + .archive-action-row{border:0!important;box-shadow:none!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;position:relative!important}
html body .toolbar > .archive-action-row::before,html body .toolbar > .archive-action-row::after{content:none!important;display:none!important}
html body .archive-entries-divider{border:0!important;margin-top:0!important;padding-top:20px!important;margin-bottom:16px!important;display:block!important}
html body .archive-entries-divider>i,html body .archive-entries-divider::before,html body .archive-entries-divider::after{display:none!important;content:none!important}
html.stat-theme-settling *,html.stat-theme-settling *::before,html.stat-theme-settling *::after{transition:none!important}
html body .header .hero-probability .axis-mid{color:#5ee7f7!important;fill:#5ee7f7!important}
html[data-theme="light"] body .header .hero-probability .axis-mid,html body[data-theme="light"] .header .hero-probability .axis-mid{color:#347d73!important;fill:#347d73!important}
html body .subject-mobile-scrollbar{display:block!important;width:100%!important;margin-top:10px!important;padding:0 2px!important;box-sizing:border-box!important}
html body .subject-mobile-scrollbar.is-disabled{display:none!important}
html body .card-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;width:100%!important;min-width:0!important;overflow:hidden!important}
html body .card-actions>*{min-width:0!important;flex-shrink:1!important}
html body .card-actions .action-btn{white-space:nowrap!important;flex:1 1 0!important;min-width:0!important;max-width:none!important;justify-content:center!important;overflow:hidden!important;text-overflow:clip!important}
html body .card-actions .edit-btn,html body .card-actions .del-btn{flex:0 1 auto!important}

/* WEB DOWNLOAD REDESIGN — independent component, visually paired with Offline. */
html:not(.stat-android-runtime) body .card .card-actions .dl-btn,
html:not(.stat-android-runtime) body .card .card-actions .download-btn{
  box-sizing:border-box!important;position:relative!important;isolation:isolate!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  flex:1 1 0!important;min-width:0!important;max-width:none!important;height:32px!important;min-height:32px!important;
  padding:0 8px!important;margin:0!important;border-radius:8px!important;
  font-family:'Inter',sans-serif!important;font-size:11.5px!important;font-weight:650!important;line-height:1!important;letter-spacing:0!important;
  cursor:pointer!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:clip!important;
  transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease!important;
  opacity:1!important;
}
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .dl-btn,
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .download-btn{
  color:#f1f4f8!important;background:#111722!important;border:1px solid rgba(255,255,255,.035)!important;box-shadow:none!important;
}
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .dl-btn,
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .download-btn{
  color:#27302d!important;background:#eee9f4!important;border:1px solid #ddd4e4!important;box-shadow:none!important;
}
html:not(.stat-android-runtime) body .card .card-actions .dl-btn:hover:not(:disabled):not(.is-downloaded),
html:not(.stat-android-runtime) body .card .card-actions .download-btn:hover:not(:disabled):not(.is-downloaded){transform:translateY(-1px)!important}
html:not(.stat-android-runtime) body .card .card-actions .dl-btn.is-downloading,
html:not(.stat-android-runtime) body .card .card-actions .download-btn.is-downloading{
  cursor:progress!important;transform:none!important;opacity:1!important;
}
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .dl-btn.is-downloading,
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .download-btn.is-downloading{
  color:#63efff!important;background:linear-gradient(90deg,rgba(18,52,64,.88),rgba(17,23,34,.96))!important;border:1px solid rgba(99,239,255,.28)!important;box-shadow:inset 0 0 0 1px rgba(99,239,255,.05)!important;
}
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .dl-btn.is-downloading,
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .download-btn.is-downloading{
  color:#4b365f!important;background:#eee9f4!important;border:1px solid rgba(75,54,95,.34)!important;box-shadow:inset 0 0 0 1px rgba(75,54,95,.05)!important;
}
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .dl-btn.is-downloaded,
html:not(.stat-android-runtime) body:not([data-theme="light"]) .card .card-actions .download-btn.is-downloaded{
  color:#63efff!important;background:rgba(18,52,64,.76)!important;border:1px solid rgba(99,239,255,.38)!important;box-shadow:inset 0 0 0 1px rgba(99,239,255,.07)!important;cursor:default!important;transform:none!important;
}
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded,
html:not(.stat-android-runtime) body[data-theme="light"] .card .card-actions .download-btn.is-downloaded{
  color:#fff!important;background:#5a3a73!important;border:1px solid #5a3a73!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)!important;cursor:default!important;transform:none!important;
}
@media(max-width:700px){html:not(.stat-android-runtime) body .card .card-actions .dl-btn,html:not(.stat-android-runtime) body .card .card-actions .download-btn{width:0!important;height:32px!important;min-height:32px!important;padding:0 6px!important;font-size:11px!important;font-weight:700!important;border-radius:8px!important}html body .card-actions{gap:4px!important}html body .card-actions .action-btn{padding-left:4px!important;padding-right:4px!important;font-size:clamp(9.5px,2.75vw,11.5px)!important;gap:3px!important}html body .card-actions .edit-btn{flex-basis:56px!important}html body .card-actions .del-btn{flex:0 1 42px!important}}
@media(max-width:390px){html:not(.stat-android-runtime) body .card .card-actions .dl-btn,html:not(.stat-android-runtime) body .card .card-actions .download-btn{height:30px!important;min-height:30px!important;padding:0 4px!important;font-size:9.5px!important}html body .card-actions{gap:3px!important}}
@media (hover:none),(pointer:coarse){html body #mainMenuBtn.main-menu-btn:hover,html body #mainMenuBtn.main-menu-btn:active,html body #mainMenuBtn.main-menu-btn:focus:not(:focus-visible){transform:none!important;filter:none!important;box-shadow:none!important;outline:none!important}}
`;
  document.head.appendChild(style);

  const isAndroidRuntime=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge==='object');
  if(isAndroidRuntime()) document.documentElement.classList.add('stat-android-runtime');

  const markThemeSettling=()=>{document.documentElement.classList.add('stat-theme-settling');requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('stat-theme-settling')))};
  ['themeDarkBtn','themeLightBtn','menuDarkBtn','menuLightBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',markThemeSettling,true));
  function syncThemeAndMu(){
    const bodyTheme=document.body?.getAttribute('data-theme');const htmlTheme=document.documentElement.getAttribute('data-theme');const value=bodyTheme==='light'||bodyTheme==='dark'?bodyTheme:(htmlTheme==='light'?'light':'dark');const isLight=value==='light';
    if(document.body&&document.body.getAttribute('data-theme')!==value)document.body.setAttribute('data-theme',value);if(document.documentElement.getAttribute('data-theme')!==value)document.documentElement.setAttribute('data-theme',value);
    const color=isLight?'#347d73':'#5ee7f7';document.querySelectorAll('.hero-probability .axis-mid').forEach(mu=>{mu.style.setProperty('color',color,'important');mu.style.setProperty('fill',color,'important')});
    try{document.dispatchEvent(new CustomEvent('statarchive:theme-change',{detail:{theme:value}}))}catch(_){}
  }
  let syncingTheme=false;const themeObserver=new MutationObserver(()=>{if(syncingTheme)return;syncingTheme=true;try{syncThemeAndMu()}finally{syncingTheme=false}});if(document.body)themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme']});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncThemeAndMu();

  function syncDownloadStatus(root=document){root.querySelectorAll?.('.dl-btn,.download-btn').forEach(btn=>{btn.classList.remove('sa-offline-style');['--sa-offline-color','--sa-offline-background','--sa-offline-border','--sa-offline-shadow','--sa-offline-opacity','--sa-offline-radius','--sa-offline-font-family','--sa-offline-font-size','--sa-offline-font-weight','--sa-offline-height','--sa-offline-min-height','--sa-offline-padding'].forEach(p=>btn.style.removeProperty(p));if(btn.classList.contains('is-downloaded')&&!btn.disabled){if(btn.textContent.trim()!=='✓ Downloaded')btn.textContent='✓ Downloaded';btn.setAttribute('title','Downloaded on this device')}})}
  syncDownloadStatus();
  const downloadStatusObserver=new MutationObserver(mutations=>{for(const mutation of mutations){const target=mutation.target instanceof Element?mutation.target:mutation.target?.parentElement;const btn=target?.closest?.('.dl-btn,.download-btn');if(btn)syncDownloadStatus(btn.closest('.card')||document);if(mutation.type==='childList')mutation.addedNodes.forEach(node=>{if(node instanceof Element)syncDownloadStatus(node)})}});downloadStatusObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  const releaseMenuButtonState=()=>{const btn=document.getElementById('mainMenuBtn');if(!btn)return;try{btn.blur()}catch(_){}btn.classList.remove('is-pressed','is-active','active')};const isTouchLike=()=>!!window.matchMedia?.('(hover:none), (pointer:coarse)').matches;
  document.addEventListener('pointerup',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn'))return;requestAnimationFrame(releaseMenuButtonState)},true);
})();
