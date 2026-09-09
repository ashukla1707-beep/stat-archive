(() => {
  if (document.getElementById('statArchiveMobileCardActionsFinal')) return;

  const style = document.createElement('style');
  style.id = 'statArchiveMobileCardActionsFinal';
  style.textContent = `
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

  body:not([data-theme="light"]) .card .card-actions .pv-btn,
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

  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    flex-wrap:wrap !important;
    justify-content:flex-start !important;
    row-gap:7px !important;
  }

  html body .card .card-actions .edit-btn,
  html body .card .card-actions .del-btn{
    height:30px !important;
    min-height:30px !important;
    min-width:72px !important;
    padding:0 10px !important;
    border-radius:9px !important;
    font-size:11px !important;
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
}
`;

  document.head.appendChild(style);
})();
