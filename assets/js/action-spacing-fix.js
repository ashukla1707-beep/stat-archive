(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;
  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* Keep only the Types divider above signed-in actions. */
html body .toolbar > .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:0 !important;
  position:relative !important;
}
html body .toolbar > .archive-action-row::before,
html body .toolbar > .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
}

/* Archive Entries: show label only, no horizontal rule. */
html body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:20px !important;
  margin-bottom:16px !important;
  display:block !important;
}

html body .archive-entries-divider > span{
  display:inline-block !important;
  padding:0 !important;
  margin:0 !important;
  line-height:1 !important;
  position:relative !important;
  top:0 !important;
  transform:none !important;
}

html body .archive-entries-divider > i{
  display:none !important;
}

/* Desktop/web menu fallback. Inline-important values below are the final authority. */
@media(min-width:701px){
  html body .main-side-menu,
  html body .main-side-menu.stat-menu-polished{
    position:fixed !important;
    top:50% !important;
    left:50% !important;
    right:auto !important;
    bottom:auto !important;
    width:min(440px,calc(100vw - 48px)) !important;
    max-width:calc(100vw - 48px) !important;
    height:auto !important;
    max-height:calc(100dvh - 48px) !important;
    transform:translate(-50%,-50%) scale(.985) !important;
    transform-origin:center center !important;
  }

  html body .main-side-menu.is-open,
  html body .main-side-menu.stat-menu-polished.is-open{
    transform:translate(-50%,-50%) scale(1) !important;
  }
}

@media(max-width:700px){
  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
}
`;
  document.head.appendChild(style);

  function forceDesktopMenuCenter(){
    if (!window.matchMedia('(min-width:701px)').matches) return;
    const menu = document.querySelector('.main-side-menu.stat-menu-polished, .main-side-menu');
    if (!menu) return;
    menu.style.setProperty('position','fixed','important');
    menu.style.setProperty('top','50%','important');
    menu.style.setProperty('left','50%','important');
    menu.style.setProperty('right','auto','important');
    menu.style.setProperty('bottom','auto','important');
    menu.style.setProperty('width','min(440px, calc(100vw - 48px))','important');
    menu.style.setProperty('max-width','calc(100vw - 48px)','important');
    menu.style.setProperty('height','auto','important');
    menu.style.setProperty('max-height','calc(100dvh - 48px)','important');
    menu.style.setProperty('transform', menu.classList.contains('is-open') ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(.985)','important');
    menu.style.setProperty('transform-origin','center center','important');
  }

  forceDesktopMenuCenter();
  window.addEventListener('resize', forceDesktopMenuCenter, {passive:true});
  document.addEventListener('click', () => requestAnimationFrame(forceDesktopMenuCenter), true);
  new MutationObserver(forceDesktopMenuCenter).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
})();
