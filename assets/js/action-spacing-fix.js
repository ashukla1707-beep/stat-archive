(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;

  const PURGE_KEY = 'statArchiveCardUiCachePurge20260915ExactDownloadOfflineV4';
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
html body .toolbar > .archive-action-row::before,html body .toolbar > .archive-action-row::after,html body .toolbar > .archive-type-filter-section + .archive-action-row::before,html body .toolbar > .archive-type-filter-section + .archive-action-row::after{content:none!important;display:none!important;border:0!important;width:0!important;height:0!important;background:none!important;box-shadow:none!important}
html body .archive-entries-divider{border:0!important;border-top:0!important;box-shadow:none!important;margin-top:0!important;padding-top:20px!important;margin-bottom:16px!important;display:block!important}
html body .archive-entries-divider>span{display:inline-block!important;padding:0!important;margin:0!important;line-height:1!important;position:relative!important;top:0!important;transform:none!important}
html body .archive-entries-divider>i,html body .archive-entries-divider::before,html body .archive-entries-divider::after{display:none!important;content:none!important;border:0!important;width:0!important;height:0!important;background:none!important;box-shadow:none!important}
html.stat-theme-settling *,html.stat-theme-settling *::before,html.stat-theme-settling *::after{transition:none!important}
html body .header .hero-probability .axis-mid{color:#5ee7f7!important;fill:#5ee7f7!important}
html[data-theme="light"] body .header .hero-probability .axis-mid,html body[data-theme="light"] .header .hero-probability .axis-mid{color:#347d73!important;fill:#347d73!important}
/* Entry carousel range is intentionally left to the canonical archive CSS. Do not hide it here: the APK/mobile UI uses it as the visible sliding bar. */
html body .card-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;width:100%!important;min-width:0!important;overflow:hidden!important}
html body .card-actions>*{min-width:0!important;flex-shrink:1!important}
html body .card-actions .action-btn{white-space:nowrap!important;flex:1 1 0!important;min-width:0!important;max-width:none!important;justify-content:center!important;overflow:hidden!important;text-overflow:clip!important}
html body .card-actions .edit-btn,html body .card-actions .del-btn{flex:0 1 auto!important}

html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{box-sizing:border-box!important;height:32px!important;min-height:32px!important;padding:0 8px!important;border-radius:8px!important;font-size:11.5px!important;font-weight:650!important;line-height:1!important;gap:4px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
@media(max-width:700px){html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{flex:1 1 0!important;width:0!important;min-width:0!important;max-width:none!important;height:32px!important;min-height:32px!important;padding:0 6px!important;font-size:11px!important;font-weight:700!important;border-radius:8px!important}}
@media(max-width:390px){html body .card .card-actions .dl-btn,html body .card .card-actions .download-btn,html body .card .card-actions .offline-btn{height:30px!important;min-height:30px!important;padding:0 4px!important;font-size:9.5px!important}}
html body:not([data-theme="light"]) .card .card-actions .dl-btn:not(.is-downloaded),html body:not([data-theme="light"]) .card .card-actions .download-btn:not(.is-downloaded),html body:not([data-theme="light"]) .card .card-actions .offline-btn:not(.is-saved){color:#f1f4f8!important;background:#111722!important;border:1px solid rgba(255,255,255,.035)!important;box-shadow:none!important;opacity:1!important}
html body[data-theme="light"] .card .card-actions .dl-btn:not(.is-downloaded),html body[data-theme="light"] .card .card-actions .download-btn:not(.is-downloaded),html body[data-theme="light"] .card .card-actions .offline-btn:not(.is-saved){color:#27302d!important;background:#eee9f4!important;border:1px solid #ddd4e4!important;box-shadow:none!important;opacity:1!important}
html body .card .card-actions .dl-btn.is-downloading,html body .card .card-actions .download-btn.is-downloading,html body .card .card-actions .offline-btn:disabled:not(.is-saved){opacity:1!important}
html body:not([data-theme="light"]) .card .card-actions .dl-btn.is-downloaded,html body:not([data-theme="light"]) .card .card-actions .download-btn.is-downloaded,html body:not([data-theme="light"]) .card .card-actions .offline-btn.is-saved{color:var(--cyan)!important;background:rgba(94,231,247,.10)!important;border:1px solid rgba(94,231,247,.15)!important;box-shadow:inset 0 0 0 1px rgba(94,231,247,.15)!important;opacity:1!important}
html body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded,html body[data-theme="light"] .card .card-actions .download-btn.is-downloaded,html body[data-theme="light"] .card .card-actions .offline-btn.is-saved{color:#fff!important;background:#4b365f!important;border:1px solid #4b365f!important;box-shadow:none!important;opacity:1!important}
@media(max-width:700px){html body .card-actions{gap:4px!important}html body .card-actions .action-btn{padding-left:4px!important;padding-right:4px!important;font-size:clamp(9.5px,2.75vw,11.5px)!important;gap:3px!important}html body .card-actions .edit-btn{flex-basis:56px!important}html body .card-actions .del-btn{flex:0 1 42px!important}html body .archive-entries-divider{margin-top:0!important;padding-top:18px!important;margin-bottom:12px!important}}
@media(max-width:390px){html body .card-actions{gap:3px!important}html body .card-actions .edit-btn{flex-basis:50px!important}html body .card-actions .del-btn{flex-basis:36px!important}}
@media (hover:none),(pointer:coarse){html body #mainMenuBtn.main-menu-btn:hover,html body #mainMenuBtn.main-menu-btn:active,html body #mainMenuBtn.main-menu-btn:focus:not(:focus-visible){transform:none!important;filter:none!important;box-shadow:none!important;outline:none!important}}
`;
  document.head.appendChild(style);

  const markThemeSettling=()=>{document.documentElement.classList.add('stat-theme-settling');requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('stat-theme-settling')))};
  ['themeDarkBtn','themeLightBtn','menuDarkBtn','menuLightBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',markThemeSettling,true));
  function syncThemeAndMu(){
    const bodyTheme=document.body?.getAttribute('data-theme');const htmlTheme=document.documentElement.getAttribute('data-theme');const value=bodyTheme==='light'||bodyTheme==='dark'?bodyTheme:(htmlTheme==='light'?'light':'dark');const isLight=value==='light';
    if(document.body&&document.body.getAttribute('data-theme')!==value)document.body.setAttribute('data-theme',value);if(document.documentElement.getAttribute('data-theme')!==value)document.documentElement.setAttribute('data-theme',value);
    const color=isLight?'#347d73':'#5ee7f7';document.querySelectorAll('.hero-probability .axis-mid').forEach(mu=>{mu.style.setProperty('color',color,'important');mu.style.setProperty('fill',color,'important')});
    const touchGraph=document.getElementById('statTouchDesktopGraph');touchGraph?.querySelectorAll('[data-stat-touch-color]').forEach(node=>{if(node.hasAttribute('stroke'))node.setAttribute('stroke',color);if(node.hasAttribute('fill')&&node.getAttribute('fill')!=='none')node.setAttribute('fill',color)});const curve=touchGraph?.querySelector('[data-stat-touch-curve]');if(curve)curve.style.filter=isLight?'none':'drop-shadow(0 0 7px rgba(94,231,247,.34))';try{document.dispatchEvent(new CustomEvent('statarchive:theme-change',{detail:{theme:value}}))}catch(_){}
  }
  let syncingTheme=false;const themeObserver=new MutationObserver(()=>{if(syncingTheme)return;syncingTheme=true;try{syncThemeAndMu()}finally{syncingTheme=false}});if(document.body)themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme']});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncThemeAndMu();

  function syncDownloadStatus(root=document){root.querySelectorAll?.('.dl-btn,.download-btn').forEach(btn=>{if(btn.classList.contains('is-downloaded')&&!btn.disabled){if(btn.textContent.trim()!=='✓ Downloaded')btn.textContent='✓ Downloaded';btn.setAttribute('title','Downloaded on this device')}})}
  syncDownloadStatus();
  const downloadStatusObserver=new MutationObserver(mutations=>{for(const mutation of mutations){const target=mutation.target instanceof Element?mutation.target:mutation.target?.parentElement;const btn=target?.closest?.('.dl-btn,.download-btn');if(btn&&btn.classList.contains('is-downloaded')&&!btn.disabled){if(btn.textContent.trim()!=='✓ Downloaded')btn.textContent='✓ Downloaded';btn.setAttribute('title','Downloaded on this device')}if(mutation.type==='childList')mutation.addedNodes.forEach(node=>{if(node instanceof Element)syncDownloadStatus(node)})}});downloadStatusObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  try {
    if (typeof switchLevel === 'function' && !window.__statArchiveAtomicLevelSwitchV1) {
      window.__statArchiveAtomicLevelSwitchV1 = true;
      switchLevel = async function statArchiveAtomicSwitchLevel(level) {
        const value = level === 'bsc' ? 'bsc' : 'msc';
        if (value === currentLevel || levelSwitchInProgress) return;
        const previous = {level:currentLevel,entries,subjects,totalStorageBytes,filterSubjects,filterTypes,latestEntriesMode,showAllEntrySubjects,searchQ};
        const savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        mobileSubjectListOpen=false;showAllSubjectPills=false;document.getElementById('subjectFilterExpanded')?.remove();levelSwitchInProgress=true;currentLevel=value;
        try{localStorage.setItem('statArchiveLevel',value)}catch(_){}setLevelUI(value);
        const searchInput=document.getElementById('searchInput');const searchClear=document.getElementById('searchClear');
        try {
          if(session){try{await sb.auth.signOut()}catch(_){}}
          const [loadedEntries]=await Promise.all([loadEntries(),loadSubjectsFromWorker()]);entries=loadedEntries;totalStorageBytes=entries.reduce((sum,entry)=>sum+(Number.isFinite(Number(entry.size))&&Number(entry.size)>0?Number(entry.size):0),0);
          filterSubjects=new Set();filterTypes=new Set();latestEntriesMode=false;showAllEntrySubjects=false;searchQ='';if(searchInput)searchInput.value='';if(searchClear)searchClear.style.display='none';isLoadingArchive=false;renderSubjectFilters();renderTypeFilters();renderSubjectOptions();render();requestAnimationFrame(()=>window.scrollTo({top:savedScrollY,left:0,behavior:'auto'}));
        } catch(err) {
          console.error('Level switch load failed:',err);currentLevel=previous.level;entries=previous.entries;subjects=previous.subjects;totalStorageBytes=previous.totalStorageBytes;filterSubjects=previous.filterSubjects;filterTypes=previous.filterTypes;latestEntriesMode=previous.latestEntriesMode;showAllEntrySubjects=previous.showAllEntrySubjects;searchQ=previous.searchQ;try{localStorage.setItem('statArchiveLevel',previous.level)}catch(_){}setLevelUI(previous.level);isLoadingArchive=false;renderSubjectFilters();renderTypeFilters();renderSubjectOptions();render();showError(`Could not load ${value==='bsc'?'B.Sc':'M.Sc'} data.`);requestAnimationFrame(()=>window.scrollTo({top:savedScrollY,left:0,behavior:'auto'}));
        } finally {levelSwitchInProgress=false}
      };
    }
  } catch(err){console.warn('Could not install atomic level switching:',err)}

  const releaseMenuButtonState=()=>{const btn=document.getElementById('mainMenuBtn');if(!btn)return;try{btn.blur()}catch(_){}btn.classList.remove('is-pressed','is-active','active')};const isTouchLike=()=>!!window.matchMedia?.('(hover:none), (pointer:coarse)').matches;
  document.addEventListener('pointerup',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn'))return;requestAnimationFrame(releaseMenuButtonState)},true);
  document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn,#mainMenuCloseBtn,#mainMenuBackdrop'))return;setTimeout(releaseMenuButtonState,0)},true);
  document.addEventListener('click',event=>{const btn=event.target instanceof Element?event.target.closest('.entry-subject-more-btn'):null;if(!btn)return;const grid=document.getElementById('grid');if(!grid||typeof render!=='function')return;event.preventDefault();event.stopImmediatePropagation();const rows=grid.querySelectorAll('.subject-row[data-subject-code]');const anchorRow=rows.length?rows[rows.length-1]:null;const anchorCode=anchorRow?.dataset.subjectCode||'';const anchorTop=anchorRow?anchorRow.getBoundingClientRect().top:null;try{btn.blur()}catch(_){}showAllEntrySubjects=!showAllEntrySubjects;render();if(!anchorCode||!Number.isFinite(anchorTop))return;requestAnimationFrame(()=>{const replacement=Array.from(grid.querySelectorAll('.subject-row[data-subject-code]')).find(row=>row.dataset.subjectCode===anchorCode);if(!replacement)return;const delta=replacement.getBoundingClientRect().top-anchorTop;if(Math.abs(delta)>.5)window.scrollBy({top:delta,left:0,behavior:'auto'})})},true);
})();
