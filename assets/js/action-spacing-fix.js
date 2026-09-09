(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;
  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* One separator only: the Types section owns the divider. */
html body .toolbar > .archive-type-filter-section{
  border-top:0 !important;
  border-bottom:1px solid var(--line) !important;
  box-shadow:none !important;
}

/* The signed-in action row must never draw a second separator. */
html body .toolbar > .archive-action-row,
html body .toolbar > .archive-type-filter-section + .archive-action-row{
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
html body .toolbar > .archive-action-row::after,
html body .toolbar > .archive-type-filter-section + .archive-action-row::before,
html body .toolbar > .archive-type-filter-section + .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

/* Archive Entries: show label only, no horizontal rule. */
html body .archive-entries-divider{
  border:0 !important;
  border-top:0 !important;
  box-shadow:none !important;
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

html body .archive-entries-divider > i,
html body .archive-entries-divider::before,
html body .archive-entries-divider::after{
  display:none !important;
  content:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

/* Desktop card sizing remains owned by tooltips.js. */

@media(max-width:700px){
  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }

  /* FINAL MOBILE OWNER: proportions matched to the supplied reference. */
  html body .subject-track .card{
    padding:14px 15px 12px !important;
    border-radius:15px !important;
  }

  html body .card .card-meta-row{
    margin-bottom:7px !important;
  }

  html body .card.card-no-title .card-meta-row{
    min-height:40px !important;
  }

  html body .card .card-actions,
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    display:flex !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:space-between !important;
    gap:0 !important;
    padding-top:8px !important;
    grid-template-columns:none !important;
  }

  html body .card .card-actions .action-btn,
  html body .card .card-actions > button,
  html body .card .card-actions > a{
    display:inline-flex !important;
    flex:0 0 auto !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:center !important;
    width:auto !important;
    max-width:none !important;
    height:32px !important;
    min-height:32px !important;
    padding:0 10px !important;
    margin:0 !important;
    border-radius:9px !important;
    white-space:nowrap !important;
    word-break:keep-all !important;
    overflow-wrap:normal !important;
    text-align:center !important;
    line-height:1 !important;
    font-size:12.5px !important;
    font-weight:700 !important;
    box-sizing:border-box !important;
    gap:4px !important;
  }

  html body .card .card-actions .pv-btn{
    min-width:clamp(88px,27vw,104px) !important;
  }

  html body .card .card-actions .dl-btn,
  html body .card .card-actions .download-btn{
    min-width:clamp(103px,31vw,122px) !important;
  }

  html body .card .card-actions .offline-btn{
    min-width:clamp(86px,26vw,102px) !important;
  }

  html body .card .card-actions .action-btn br,
  html body .card .card-actions .dl-btn br,
  html body .card .card-actions .download-btn br{
    display:none !important;
  }

  html body .card .card-actions .action-btn > *,
  html body .card .card-actions > button > *,
  html body .card .card-actions > a > *{
    display:inline-flex !important;
    align-items:center !important;
    justify-content:center !important;
    width:auto !important;
    height:auto !important;
    min-width:0 !important;
    min-height:0 !important;
    margin:0 !important;
    padding:0 !important;
    line-height:1 !important;
    white-space:nowrap !important;
  }

  /* Dark mobile appearance from the reference. */
  body:not([data-theme="light"]) .card .card-actions .pv-btn,
  body:not([data-theme="light"]) .card .card-actions .offline-btn{
    color:#63efff !important;
    background:rgba(18,52,63,.78) !important;
    border:1px solid rgba(99,239,255,.34) !important;
    box-shadow:inset 0 0 0 1px rgba(99,239,255,.08) !important;
  }

  body:not([data-theme="light"]) .card .card-actions .dl-btn,
  body:not([data-theme="light"]) .card .card-actions .download-btn{
    color:#eef2f8 !important;
    background:rgba(17,24,36,.92) !important;
    border:1px solid rgba(255,255,255,.035) !important;
    box-shadow:none !important;
  }

  /* Preserve Stat Archive light palette while using the same geometry. */
  body[data-theme="light"] .card .card-actions .pv-btn,
  body[data-theme="light"] .card .card-actions .offline-btn{
    color:#4b365f !important;
    background:#f1ebf6 !important;
    border:1px solid #d8cce2 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .dl-btn,
  body[data-theme="light"] .card .card-actions .download-btn{
    color:#27302d !important;
    background:#eee9f4 !important;
    border:1px solid #ddd4e4 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .offline-btn.is-saved,
  body[data-theme="light"] .card .card-actions .pv-btn.is-previewed,
  body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded{
    color:#fff !important;
    background:#4b365f !important;
    border-color:#4b365f !important;
  }

  /* Contributor/admin controls move to a clean second row. */
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    flex-wrap:wrap !important;
    justify-content:flex-start !important;
    column-gap:7px !important;
    row-gap:7px !important;
  }

  html body .card .card-actions .edit-btn,
  html body .card .card-actions .del-btn{
    height:30px !important;
    min-height:30px !important;
    min-width:72px !important;
    padding:0 9px !important;
    border-radius:8px !important;
    font-size:11px !important;
  }
}

@media(max-width:380px){
  html body .subject-track .card{
    padding-left:12px !important;
    padding-right:12px !important;
  }

  html body .card .card-actions .action-btn,
  html body .card .card-actions > button,
  html body .card .card-actions > a{
    height:30px !important;
    min-height:30px !important;
    padding:0 7px !important;
    border-radius:8px !important;
    font-size:11.5px !important;
    gap:3px !important;
  }

  html body .card .card-actions .pv-btn{min-width:82px !important;}
  html body .card .card-actions .dl-btn,
  html body .card .card-actions .download-btn{min-width:96px !important;}
  html body .card .card-actions .offline-btn{min-width:80px !important;}
}
`;
  document.head.appendChild(style);

  const CENTER_PROPS = ['position','top','left','right','bottom','width','max-width','height','max-height','transform','transform-origin'];

  function clearOldWrongTarget(el){
    if (!el) return;
    CENTER_PROPS.forEach(prop => el.style.removeProperty(prop));
  }

  function findActualMenuPanel(){
    const marker = document.getElementById('menuOfflineLibraryBtn') ||
                   document.getElementById('mainMenuCloseBtn') ||
                   Array.from(document.querySelectorAll('button,div,a')).find(el => /About Stat Archive/i.test(el.textContent || ''));
    if (!marker) return null;

    let node = marker;
    let best = null;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const looksLikePanel =
        (cs.position === 'fixed' || cs.position === 'absolute') &&
        rect.width >= 280 && rect.width <= 650 &&
        rect.height >= 300 && rect.height <= window.innerHeight;
      if (looksLikePanel) best = node;
      node = node.parentElement;
    }
    return best;
  }

  function centerActualDesktopMenu(){
    if (!window.matchMedia('(min-width:701px)').matches) return;
    const actual = findActualMenuPanel();
    if (!actual) return;

    document.querySelectorAll('.main-side-menu').forEach(el => {
      if (el !== actual) clearOldWrongTarget(el);
    });

    actual.style.setProperty('position','fixed','important');
    actual.style.setProperty('top','50%','important');
    actual.style.setProperty('left','50%','important');
    actual.style.setProperty('right','auto','important');
    actual.style.setProperty('bottom','auto','important');
    actual.style.setProperty('width','min(440px, calc(100vw - 48px))','important');
    actual.style.setProperty('max-width','calc(100vw - 48px)','important');
    actual.style.setProperty('height','auto','important');
    actual.style.setProperty('max-height','calc(100dvh - 48px)','important');
    actual.style.setProperty('transform','translate(-50%, -50%)','important');
    actual.style.setProperty('transform-origin','center center','important');
  }

  requestAnimationFrame(centerActualDesktopMenu);
  window.addEventListener('resize', centerActualDesktopMenu, {passive:true});
  document.getElementById('mainMenuBtn')?.addEventListener('click', () => {
    setTimeout(centerActualDesktopMenu, 0);
    setTimeout(centerActualDesktopMenu, 80);
  });
  new MutationObserver(() => requestAnimationFrame(centerActualDesktopMenu))
    .observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
})();
