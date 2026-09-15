(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;

  const PURGE_KEY = 'statArchiveCardUiCachePurge20260915DownloadStatus';
  try {
    if (navigator.onLine && !localStorage.getItem(PURGE_KEY) && 'caches' in window) {
      caches.keys()
        .then(keys => Promise.all(
          keys.filter(key => key.startsWith('stat-archive-shell-')).map(key => caches.delete(key))
        ))
        .then(() => localStorage.setItem(PURGE_KEY, '1'))
        .catch(() => {});
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
html body .subject-mobile-scrollbar,html body .subject-mobile-scroll-range{display:none!important}
html body .card-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;width:100%!important;min-width:0!important;overflow:hidden!important}
html body .card-actions>*{min-width:0!important;flex-shrink:1!important}
html body .card-actions .action-btn{white-space:nowrap!important;flex:1 1 0!important;min-width:0!important;max-width:none!important;justify-content:center!important;overflow:hidden!important;text-overflow:clip!important}
html body .card-actions .edit-btn,html body .card-actions .del-btn{flex:0 1 auto!important}
html body .card-actions .dl-btn.is-downloaded{color:var(--green)!important}
body[data-theme="light"] .card-actions .dl-btn.is-downloaded{color:#347d73!important}
@media(max-width:700px){html body .card-actions{gap:4px!important}html body .card-actions .action-btn{padding-left:4px!important;padding-right:4px!important;font-size:clamp(9.5px,2.75vw,11.5px)!important;gap:3px!important}html body .card-actions .edit-btn{flex-basis:56px!important}html body .card-actions .del-btn{flex:0 1 42px!important}html body .archive-entries-divider{margin-top:0!important;padding-top:18px!important;margin-bottom:12px!important}}
@media(max-width:390px){html body .card-actions{gap:3px!important}html body .card-actions .action-btn{padding-left:3px!important;padding-right:3px!important;font-size:9.5px!important;letter-spacing:-.01em!important}html body .card-actions .edit-btn{flex-basis:50px!important}html body .card-actions .del-btn{flex-basis:36px!important}}
@media (hover:none),(pointer:coarse){html body #mainMenuBtn.main-menu-btn:hover,html body #mainMenuBtn.main-menu-btn:active,html body #mainMenuBtn.main-menu-btn:focus:not(:focus-visible){transform:none!important;filter:none!important;box-shadow:none!important;outline:none!important}}
`;
  document.head.appendChild(style);

  const markThemeSettling=()=>{document.documentElement.classList.add('stat-theme-settling');requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('stat-theme-settling')))};
  ['themeDarkBtn','themeLightBtn','menuDarkBtn','menuLightBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',markThemeSettling,true));

  function syncThemeAndMu(){
    const bodyTheme=document.body?.getAttribute('data-theme');
    const htmlTheme=document.documentElement.getAttribute('data-theme');
    const value=bodyTheme==='light'||bodyTheme==='dark'?bodyTheme:(htmlTheme==='light'?'light':'dark');
    const isLight=value==='light';
    if(document.body&&document.body.getAttribute('data-theme')!==value)document.body.setAttribute('data-theme',value);
    if(document.documentElement.getAttribute('data-theme')!==value)document.documentElement.setAttribute('data-theme',value);
    const color=isLight?'#347d73':'#5ee7f7';
    document.querySelectorAll('.hero-probability .axis-mid').forEach(mu=>{mu.style.setProperty('color',color,'important');mu.style.setProperty('fill',color,'important')});
    const touchGraph=document.getElementById('statTouchDesktopGraph');
    touchGraph?.querySelectorAll('[data-stat-touch-color]').forEach(node=>{if(node.hasAttribute('stroke'))node.setAttribute('stroke',color);if(node.hasAttribute('fill')&&node.getAttribute('fill')!=='none')node.setAttribute('fill',color)});
    const curve=touchGraph?.querySelector('[data-stat-touch-curve]');if(curve)curve.style.filter=isLight?'none':'drop-shadow(0 0 7px rgba(94,231,247,.34))';
    try{document.dispatchEvent(new CustomEvent('statarchive:theme-change',{detail:{theme:value}}))}catch(_){}
  }
  let syncingTheme=false;
  const themeObserver=new MutationObserver(()=>{if(syncingTheme)return;syncingTheme=true;try{syncThemeAndMu()}finally{syncingTheme=false}});
  if(document.body)themeObserver.observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  syncThemeAndMu();

  /* Restore the persistent Downloaded impression on web/PWA cards. The download
     reliability layer restores the button's original HTML after a transfer,
     so class-only state could become invisible. Keep the label synchronized
     with the already-persisted is-downloaded class instead. */
  function syncDownloadStatus(root=document){
    root.querySelectorAll?.('.dl-btn').forEach(btn=>{
      if(btn.classList.contains('is-downloaded')&&!btn.disabled){
        if(btn.textContent.trim()!=='✓ Downloaded')btn.textContent='✓ Downloaded';
        btn.setAttribute('title','Downloaded on this device');
      }
    });
  }
  syncDownloadStatus();
  const downloadStatusObserver=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      const target=mutation.target instanceof Element?mutation.target:mutation.target?.parentElement;
      const btn=target?.closest?.('.dl-btn');
      if(btn&&btn.classList.contains('is-downloaded')&&!btn.disabled){
        if(btn.textContent.trim()!=='✓ Downloaded')btn.textContent='✓ Downloaded';
        btn.setAttribute('title','Downloaded on this device');
      }
      if(mutation.type==='childList')mutation.addedNodes.forEach(node=>{if(node instanceof Element)syncDownloadStatus(node)});
    }
  });
  downloadStatusObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  const releaseMenuButtonState=()=>{const btn=document.getElementById('mainMenuBtn');if(!btn)return;try{btn.blur()}catch(_){}btn.classList.remove('is-pressed','is-active','active')};
  const isTouchLike=()=>!!window.matchMedia?.('(hover:none), (pointer:coarse)').matches;
  document.addEventListener('pointerup',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn'))return;requestAnimationFrame(releaseMenuButtonState)},true);
  document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:null;if(!isTouchLike()||!target?.closest?.('#mainMenuBtn,#mainMenuCloseBtn,#mainMenuBackdrop'))return;setTimeout(releaseMenuButtonState,0)},true);

  document.addEventListener('click',event=>{
    const btn=event.target instanceof Element?event.target.closest('.entry-subject-more-btn'):null;
    if(!btn)return;
    const grid=document.getElementById('grid');if(!grid||typeof render!=='function')return;
    event.preventDefault();event.stopImmediatePropagation();
    const rows=grid.querySelectorAll('.subject-row[data-subject-code]');const anchorRow=rows.length?rows[rows.length-1]:null;const anchorCode=anchorRow?.dataset.subjectCode||'';const anchorTop=anchorRow?anchorRow.getBoundingClientRect().top:null;
    try{btn.blur()}catch(_){}showAllEntrySubjects=!showAllEntrySubjects;render();
    if(!anchorCode||!Number.isFinite(anchorTop))return;
    requestAnimationFrame(()=>{const replacement=Array.from(grid.querySelectorAll('.subject-row[data-subject-code]')).find(row=>row.dataset.subjectCode===anchorCode);if(!replacement)return;const delta=replacement.getBoundingClientRect().top-anchorTop;if(Math.abs(delta)>.5)window.scrollBy({top:delta,left:0,behavior:'auto'})});
  },true);
})();
