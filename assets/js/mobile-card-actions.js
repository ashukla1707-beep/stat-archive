(() => {
  if (document.getElementById('statArchiveMobileCardActionsFinal')) return;

  const style = document.createElement('style');
  style.id = 'statArchiveMobileCardActionsFinal';
  style.textContent = `
/* Contributor/admin cards: keep all five actions on one desktop-web row,
   but reserve most of the width for the three reader actions. */
@media (min-width:701px){
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    display:grid !important;
    grid-template-columns:minmax(78px,1.05fr) minmax(92px,1.25fr) minmax(78px,1.05fr) 34px 34px !important;
    align-items:stretch !important;
    justify-content:stretch !important;
    gap:4px !important;
    width:100% !important;
    max-width:100% !important;
    overflow:hidden !important;
  }

  html body .card .card-actions:has(.edit-btn) .action-btn,
  html body .card .card-actions:has(.del-btn) .action-btn{
    display:flex !important;
    flex-direction:row !important;
    align-items:center !important;
    justify-content:center !important;
    width:100% !important;
    min-width:0 !important;
    max-width:100% !important;
    height:30px !important;
    min-height:30px !important;
    padding:0 5px !important;
    margin:0 !important;
    gap:3px !important;
    border-radius:8px !important;
    font-size:10.5px !important;
    line-height:1 !important;
    white-space:nowrap !important;
    word-break:keep-all !important;
    overflow:hidden !important;
    text-overflow:clip !important;
    text-align:center !important;
    box-sizing:border-box !important;
  }

  html body .card .card-actions:has(.edit-btn) .pv-btn,
  html body .card .card-actions:has(.del-btn) .pv-btn,
  html body .card .card-actions:has(.edit-btn) .dl-btn,
  html body .card .card-actions:has(.del-btn) .dl-btn,
  html body .card .card-actions:has(.edit-btn) .download-btn,
  html body .card .card-actions:has(.del-btn) .download-btn,
  html body .card .card-actions:has(.edit-btn) .offline-btn,
  html body .card .card-actions:has(.del-btn) .offline-btn{
    min-width:0 !important;
    width:100% !important;
    padding-left:5px !important;
    padding-right:5px !important;
  }

  /* Edit and Delete are compact management controls on desktop web.
     Keep the original accessible button text in the DOM; only hide it visually. */
  html body .card .card-actions:has(.edit-btn) .edit-btn,
  html body .card .card-actions:has(.del-btn) .edit-btn{
    width:34px !important;
    min-width:34px !important;
    max-width:34px !important;
    padding:0 !important;
    gap:0 !important;
    font-size:0 !important;
    overflow:hidden !important;
  }

  html body .card .card-actions:has(.edit-btn) .edit-btn::before,
  html body .card .card-actions:has(.del-btn) .edit-btn::before{
    content:"✎" !important;
    font-size:13px !important;
    line-height:1 !important;
  }

  html body .card .card-actions:has(.edit-btn) .del-btn,
  html body .card .card-actions:has(.del-btn) .del-btn{
    width:34px !important;
    min-width:34px !important;
    max-width:34px !important;
    padding:0 !important;
    gap:0 !important;
  }
}

@media (max-width:700px){
  html body .subject-track .card .card-actions,
  html body .subject-row .card .card-actions,
  html body .card .card-actions{
    display:flex !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:space-between !important;
    gap:14px !important;
    grid-template-columns:none !important;
    padding-top:10px !important;
  }

  html body .subject-track .card .card-actions .action-btn,
  html body .subject-row .card .card-actions .action-btn,
  html body .card .card-actions .action-btn{
    display:inline-flex !important;
    flex:0 0 auto !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:center !important;
    width:auto !important;
    max-width:none !important;
    min-width:0 !important;
    height:32px !important;
    min-height:32px !important;
    padding:0 12px !important;
    margin:0 !important;
    gap:5px !important;
    border-radius:10px !important;
    white-space:nowrap !important;
    word-break:keep-all !important;
    overflow-wrap:normal !important;
    line-height:1 !important;
    text-align:center !important;
    font-size:11.5px !important;
    font-weight:700 !important;
    box-sizing:border-box !important;
  }

  html body .card .card-actions .pv-btn{
    min-width:96px !important;
  }

  html body .card .card-actions .dl-btn,
  html body .card .card-actions .download-btn{
    min-width:112px !important;
    padding-left:14px !important;
    padding-right:14px !important;
  }

  html body .card .card-actions .offline-btn{
    min-width:96px !important;
    display:inline-flex !important;
    visibility:visible !important;
    opacity:1 !important;
  }

  html body .card .card-actions .action-btn br,
  html body .card .card-actions .dl-btn br,
  html body .card .card-actions .download-btn br{
    display:none !important;
  }

  /* Preview is neutral by default. It turns teal only after being used in the
     current open page/app session. Closing the preview does not remove it. */
  body:not([data-theme="light"]) .card .card-actions .pv-btn{
    color:#f1f4f8 !important;
    background:#111722 !important;
    border:1px solid rgba(255,255,255,.035) !important;
    box-shadow:none !important;
  }

  body:not([data-theme="light"]) .card .card-actions .pv-btn.sa-preview-used,
  body:not([data-theme="light"]) .card .card-actions .offline-btn{
    color:#63efff !important;
    background:rgba(18,52,64,.76) !important;
    border:1px solid rgba(99,239,255,.38) !important;
    box-shadow:inset 0 0 0 1px rgba(99,239,255,.07) !important;
  }

  body:not([data-theme="light"]) .card .card-actions .dl-btn,
  body:not([data-theme="light"]) .card .card-actions .download-btn{
    color:#f1f4f8 !important;
    background:#111722 !important;
    border:1px solid rgba(255,255,255,.035) !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .pv-btn{
    color:#27302d !important;
    background:#eee9f4 !important;
    border:1px solid #ddd4e4 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .pv-btn.sa-preview-used,
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

  /* Contributor/admin cards: keep every action on ONE line.
     Management controls make the five-pill row compact enough for phones,
     while ordinary viewer cards retain the larger three-button proportions. */
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    flex-wrap:nowrap !important;
    justify-content:space-between !important;
    align-items:center !important;
    gap:4px !important;
    overflow:visible !important;
  }

  html body .card .card-actions:has(.edit-btn) .action-btn,
  html body .card .card-actions:has(.del-btn) .action-btn{
    flex:0 1 auto !important;
    width:auto !important;
    min-width:0 !important;
    height:28px !important;
    min-height:28px !important;
    padding:0 5px !important;
    gap:3px !important;
    border-radius:8px !important;
    font-size:9.5px !important;
    line-height:1 !important;
    white-space:nowrap !important;
  }

  html body .card .card-actions:has(.edit-btn) .pv-btn,
  html body .card .card-actions:has(.del-btn) .pv-btn,
  html body .card .card-actions:has(.edit-btn) .dl-btn,
  html body .card .card-actions:has(.del-btn) .dl-btn,
  html body .card .card-actions:has(.edit-btn) .download-btn,
  html body .card .card-actions:has(.del-btn) .download-btn,
  html body .card .card-actions:has(.edit-btn) .offline-btn,
  html body .card .card-actions:has(.del-btn) .offline-btn,
  html body .card .card-actions:has(.edit-btn) .edit-btn,
  html body .card .card-actions:has(.del-btn) .edit-btn,
  html body .card .card-actions:has(.edit-btn) .del-btn,
  html body .card .card-actions:has(.del-btn) .del-btn{
    min-width:0 !important;
    padding-left:5px !important;
    padding-right:5px !important;
  }
}

@media (max-width:380px){
  html body .card .card-actions{
    gap:8px !important;
  }

  html body .card .card-actions .action-btn{
    height:30px !important;
    min-height:30px !important;
    padding:0 9px !important;
    font-size:10.5px !important;
    border-radius:9px !important;
    gap:4px !important;
  }

  html body .card .card-actions .pv-btn,
  html body .card .card-actions .offline-btn{
    min-width:88px !important;
  }

  html body .card .card-actions .dl-btn,
  html body .card .card-actions .download-btn{
    min-width:102px !important;
    padding-left:10px !important;
    padding-right:10px !important;
  }

  /* Re-assert contributor/admin one-row compact sizing after the general
     narrow-phone rules above. */
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    flex-wrap:nowrap !important;
    gap:3px !important;
  }

  html body .card .card-actions:has(.edit-btn) .action-btn,
  html body .card .card-actions:has(.del-btn) .action-btn{
    min-width:0 !important;
    height:27px !important;
    min-height:27px !important;
    padding:0 4px !important;
    gap:2px !important;
    border-radius:7px !important;
    font-size:8.8px !important;
  }

  html body .card .card-actions:has(.edit-btn) .pv-btn,
  html body .card .card-actions:has(.del-btn) .pv-btn,
  html body .card .card-actions:has(.edit-btn) .dl-btn,
  html body .card .card-actions:has(.del-btn) .dl-btn,
  html body .card .card-actions:has(.edit-btn) .download-btn,
  html body .card .card-actions:has(.del-btn) .download-btn,
  html body .card .card-actions:has(.edit-btn) .offline-btn,
  html body .card .card-actions:has(.del-btn) .offline-btn,
  html body .card .card-actions:has(.edit-btn) .edit-btn,
  html body .card .card-actions:has(.del-btn) .edit-btn,
  html body .card .card-actions:has(.edit-btn) .del-btn,
  html body .card .card-actions:has(.del-btn) .del-btn{
    min-width:0 !important;
    padding-left:4px !important;
    padding-right:4px !important;
  }
}
`;

  document.head.appendChild(style);

  /* Session-only preview highlight.
     This is intentionally DOM-only: no localStorage, sessionStorage or IndexedDB.
     A hard refresh / full app restart recreates the page and clears the state. */
  document.querySelectorAll('.card .card-actions .pv-btn').forEach(btn => {
    btn.classList.remove('sa-preview-used');
  });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const previewBtn = target?.closest('.card .card-actions .pv-btn');
    if (!previewBtn) return;
    previewBtn.classList.add('sa-preview-used');
  }, true);
})();
