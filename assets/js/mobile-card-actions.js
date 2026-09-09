(() => {
  if (document.getElementById('statArchiveMobileCardActionsFinal')) return;

  const style = document.createElement('style');
  style.id = 'statArchiveMobileCardActionsFinal';
  style.textContent = `
/* Stable card-action layout. No DOM rewriting / MutationObserver. */
html body .card .card-actions{
  box-sizing:border-box !important;
}

/* Public/read-only cards: three clear reader actions. */
html:not([data-authenticated="true"]) body .card .card-actions{
  display:flex !important;
  flex-direction:row !important;
  flex-wrap:nowrap !important;
  align-items:center !important;
  justify-content:space-between !important;
  gap:8px !important;
}

html:not([data-authenticated="true"]) body .card .card-actions .action-btn{
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  flex:1 1 0 !important;
  min-width:0 !important;
  width:auto !important;
  white-space:nowrap !important;
}

/* Baseline signed-in layout. */
html[data-authenticated="true"] body .card .card-actions{
  display:grid !important;
  grid-template-columns:minmax(0,1.05fr) minmax(0,1.22fr) minmax(0,1.05fr) 34px 34px !important;
  align-items:stretch !important;
  justify-content:stretch !important;
  gap:4px !important;
  width:100% !important;
  max-width:100% !important;
  overflow:visible !important;
}

html[data-authenticated="true"] body .card .card-actions .action-btn{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  min-width:0 !important;
  max-width:100% !important;
  width:100% !important;
  margin:0 !important;
  padding:0 5px !important;
  gap:3px !important;
  white-space:nowrap !important;
  word-break:keep-all !important;
  overflow:hidden !important;
  text-overflow:clip !important;
  box-sizing:border-box !important;
}

html[data-authenticated="true"] body .card .card-actions .edit-btn,
html[data-authenticated="true"] body .card .card-actions .del-btn{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
  width:34px !important;
  min-width:34px !important;
  max-width:34px !important;
  padding:0 !important;
  gap:0 !important;
  overflow:hidden !important;
}

html[data-authenticated="true"] body .card .card-actions .edit-btn{
  font-size:0 !important;
}
html[data-authenticated="true"] body .card .card-actions .edit-btn::before{
  content:"✎" !important;
  font-size:14px !important;
  line-height:1 !important;
}

html body .card .card-actions .offline-btn{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

/* WEB ONLY: contributor/admin rows adapt to 4 or 5 actions. */
@media (min-width:701px){
  html[data-authenticated="true"] body .card .card-actions{
    display:flex !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:stretch !important;
    gap:5px !important;
    overflow:hidden !important;
  }

  html[data-authenticated="true"] body .card .card-actions .action-btn{
    display:inline-flex !important;
    width:auto !important;
    max-width:none !important;
    height:32px !important;
    min-height:32px !important;
    border-radius:9px !important;
    font-size:11.5px !important;
    font-weight:650 !important;
  }

  html[data-authenticated="true"] body .card .card-actions .pv-btn,
  html[data-authenticated="true"] body .card .card-actions .dl-btn,
  html[data-authenticated="true"] body .card .card-actions .download-btn,
  html[data-authenticated="true"] body .card .card-actions .offline-btn{
    flex:1 1 0 !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    padding-left:6px !important;
    padding-right:6px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn,
  html[data-authenticated="true"] body .card .card-actions .del-btn{
    display:inline-flex !important;
    flex:0 0 36px !important;
    width:36px !important;
    min-width:36px !important;
    max-width:36px !important;
    padding:0 !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn{
    font-size:0 !important;
  }
}

/* MOBILE / APK */
@media (max-width:700px){
  html body .card .card-actions{
    padding-top:8px !important;
  }

  /* Exact three-pill geometry from the supplied reference. */
  html:not([data-authenticated="true"]) body .card .card-actions{
    justify-content:space-between !important;
    gap:0 !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .action-btn{
    flex:0 0 auto !important;
    width:auto !important;
    max-width:none !important;
    height:32px !important;
    min-height:32px !important;
    padding:0 10px !important;
    border-radius:9px !important;
    font-size:12.5px !important;
    font-weight:700 !important;
    gap:4px !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .pv-btn{
    min-width:clamp(88px,27vw,104px) !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .dl-btn,
  html:not([data-authenticated="true"]) body .card .card-actions .download-btn{
    min-width:clamp(103px,31vw,122px) !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .offline-btn{
    min-width:clamp(86px,26vw,102px) !important;
  }

  /* Signed-in mobile layout intentionally unchanged. */
  html[data-authenticated="true"] body .card .card-actions{
    grid-template-columns:minmax(0,1.05fr) minmax(0,1.22fr) minmax(0,1.05fr) 30px 30px !important;
    gap:4px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .action-btn{
    height:32px !important;
    min-height:32px !important;
    padding:0 4px !important;
    border-radius:9px !important;
    font-size:10.5px !important;
    font-weight:700 !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn,
  html[data-authenticated="true"] body .card .card-actions .del-btn{
    width:30px !important;
    min-width:30px !important;
    max-width:30px !important;
    padding:0 !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn{
    font-size:0 !important;
  }

  html body .card .card-actions .action-btn br{
    display:none !important;
  }

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
}

@media (max-width:380px){
  html:not([data-authenticated="true"]) body .card .card-actions .action-btn{
    height:30px !important;
    min-height:30px !important;
    padding:0 7px !important;
    font-size:11.5px !important;
    border-radius:8px !important;
    gap:3px !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .pv-btn{
    min-width:82px !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .dl-btn,
  html:not([data-authenticated="true"]) body .card .card-actions .download-btn{
    min-width:96px !important;
  }

  html:not([data-authenticated="true"]) body .card .card-actions .offline-btn{
    min-width:80px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .action-btn{
    height:30px !important;
    min-height:30px !important;
    padding:0 3px !important;
    font-size:10px !important;
    border-radius:8px !important;
  }

  html[data-authenticated="true"] body .card .card-actions{
    grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr) 28px 28px !important;
    gap:3px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn,
  html[data-authenticated="true"] body .card .card-actions .del-btn{
    width:28px !important;
    min-width:28px !important;
    max-width:28px !important;
  }
}
`;

  document.head.appendChild(style);

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
