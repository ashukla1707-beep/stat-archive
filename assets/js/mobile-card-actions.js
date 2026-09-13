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

  /* Signed-in contributor/admin mobile: restore the original one-line layout.
     Contributors naturally show 4 controls; admins show 5. */
  html[data-authenticated="true"] body .card .card-actions{
    display:flex !important;
    flex-direction:row !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
    justify-content:stretch !important;
    gap:4px !important;
    width:100% !important;
    max-width:100% !important;
    overflow:hidden !important;
  }

  html[data-authenticated="true"] body .card .card-actions .action-btn{
    display:inline-flex !important;
    align-items:center !important;
    justify-content:center !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    height:34px !important;
    min-height:34px !important;
    padding:0 5px !important;
    border-radius:9px !important;
    font-size:10.5px !important;
    font-weight:700 !important;
    gap:3px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .pv-btn,
  html[data-authenticated="true"] body .card .card-actions .dl-btn,
  html[data-authenticated="true"] body .card .card-actions .download-btn,
  html[data-authenticated="true"] body .card .card-actions .offline-btn{
    flex:1 1 0 !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
  }

  /* Edit text is visible again on mobile, matching the original screenshot. */
  html[data-authenticated="true"] body .card .card-actions .edit-btn{
    flex:0 0 52px !important;
    width:52px !important;
    min-width:52px !important;
    max-width:52px !important;
    padding:0 4px !important;
    font-size:10.5px !important;
    gap:2px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn::before{
    content:none !important;
    display:none !important;
  }

  html[data-authenticated="true"] body .card .card-actions .del-btn{
    flex:0 0 34px !important;
    width:34px !important;
    min-width:34px !important;
    max-width:34px !important;
    padding:0 !important;
  }

  html body .card .card-actions .action-btn br{
    display:none !important;
  }
}

/* Canonical action-button states across normal web, PWA and APK.
   Preview, Download and Offline are neutral until that action has happened.
   Offline is selected only after the file is actually saved locally. */
html body:not([data-theme="light"]) .card .card-actions .pv-btn:not(.is-previewed):not(.sa-preview-used),
html body:not([data-theme="light"]) .card .card-actions .dl-btn:not(.is-downloaded),
html body:not([data-theme="light"]) .card .card-actions .download-btn:not(.is-downloaded),
html body:not([data-theme="light"]) .card .card-actions .offline-btn:not(.is-saved){
  color:#f1f4f8 !important;
  background:#111722 !important;
  border:1px solid rgba(255,255,255,.035) !important;
  box-shadow:none !important;
}

html body:not([data-theme="light"]) .card .card-actions .pv-btn.is-previewed,
html body:not([data-theme="light"]) .card .card-actions .pv-btn.sa-preview-used,
html body:not([data-theme="light"]) .card .card-actions .dl-btn.is-downloaded,
html body:not([data-theme="light"]) .card .card-actions .download-btn.is-downloaded,
html body:not([data-theme="light"]) .card .card-actions .offline-btn.is-saved{
  color:#63efff !important;
  background:rgba(18,52,64,.76) !important;
  border:1px solid rgba(99,239,255,.38) !important;
  box-shadow:inset 0 0 0 1px rgba(99,239,255,.07) !important;
}

html body[data-theme="light"] .card .card-actions .pv-btn:not(.is-previewed):not(.sa-preview-used),
html body[data-theme="light"] .card .card-actions .dl-btn:not(.is-downloaded),
html body[data-theme="light"] .card .card-actions .download-btn:not(.is-downloaded),
html body[data-theme="light"] .card .card-actions .offline-btn:not(.is-saved){
  color:#27302d !important;
  background:#eee9f4 !important;
  border:1px solid #ddd4e4 !important;
  box-shadow:none !important;
}

html body[data-theme="light"] .card .card-actions .pv-btn.is-previewed,
html body[data-theme="light"] .card .card-actions .pv-btn.sa-preview-used,
html body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded,
html body[data-theme="light"] .card .card-actions .download-btn.is-downloaded,
html body[data-theme="light"] .card .card-actions .offline-btn.is-saved{
  color:#ffffff !important;
  background:#5a3a73 !important;
  border:1px solid #5a3a73 !important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06) !important;
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

  html[data-authenticated="true"] body .card .card-actions{
    gap:3px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .action-btn{
    height:32px !important;
    min-height:32px !important;
    padding:0 3px !important;
    font-size:9.5px !important;
    border-radius:8px !important;
    gap:2px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .edit-btn{
    flex-basis:46px !important;
    width:46px !important;
    min-width:46px !important;
    max-width:46px !important;
    font-size:9.5px !important;
  }

  html[data-authenticated="true"] body .card .card-actions .del-btn{
    flex-basis:30px !important;
    width:30px !important;
    min-width:30px !important;
    max-width:30px !important;
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

/* =========================================================
   PREVIEW POPUP + TOOLBAR SLIDE CONTROL
   Common behavior for browser, PWA and APK. On narrow screens the preview
   remains a floating dialog instead of becoming a full-screen page.
   ========================================================= */
(() => {
  if (window.__statArchivePreviewPopupPolishV1) return;
  window.__statArchivePreviewPopupPolishV1 = true;

  const style = document.createElement('style');
  style.id = 'statArchivePreviewPopupPolish';
  style.textContent = `
html body #previewOverlay.overlay{
  align-items:center !important;
  justify-content:center !important;
  padding:14px !important;
  background:rgba(3,7,12,.76) !important;
  backdrop-filter:blur(7px) !important;
  -webkit-backdrop-filter:blur(7px) !important;
}
html body #previewOverlay.overlay .preview-card.sa-reader-active{
  width:min(1120px,calc(100vw - 28px)) !important;
  height:min(900px,calc(100dvh - 28px)) !important;
  max-width:1120px !important;
  max-height:900px !important;
  margin:auto !important;
  border-radius:18px !important;
  overflow:hidden !important;
  box-shadow:0 24px 70px rgba(0,0,0,.48) !important;
}
html body #previewOverlay.overlay .preview-card.sa-reader-active .sa-reader-toolbar{
  position:relative !important;
  overflow-x:auto !important;
  overflow-y:hidden !important;
  flex-wrap:nowrap !important;
  scroll-behavior:smooth !important;
  scrollbar-width:none !important;
  padding-right:46px !important;
}
html body #previewOverlay.overlay .preview-card.sa-reader-active .sa-reader-toolbar::-webkit-scrollbar{
  display:none !important;
}
html body #previewOverlay.overlay .preview-card.sa-reader-active .sa-reader-group{
  flex:0 0 auto !important;
}
.sa-toolbar-slide-btn{
  position:sticky !important;
  right:2px !important;
  top:0 !important;
  z-index:20 !important;
  flex:0 0 34px !important;
  width:34px !important;
  min-width:34px !important;
  height:34px !important;
  margin-left:auto !important;
  padding:0 !important;
  border-radius:9px !important;
  border:1px solid var(--line-strong,rgba(148,163,184,.28)) !important;
  background:var(--panel-solid,#0f141d) !important;
  color:var(--text,#f5f7fb) !important;
  box-shadow:-10px 0 18px var(--panel-solid,#0f141d) !important;
  font:800 18px/1 'JetBrains Mono',monospace !important;
  display:none !important;
  align-items:center !important;
  justify-content:center !important;
  cursor:pointer !important;
  touch-action:manipulation !important;
}
.sa-toolbar-slide-btn.is-visible{display:inline-flex !important;}
body[data-theme="light"] .sa-toolbar-slide-btn{
  background:#f7f3e9 !important;
  color:#27302d !important;
  border-color:#d9d1c2 !important;
  box-shadow:-10px 0 18px #f7f3e9 !important;
}
@media(max-width:700px){
  html body #previewOverlay.overlay{
    padding:max(12px,env(safe-area-inset-top)) 10px max(12px,env(safe-area-inset-bottom)) !important;
    align-items:center !important;
    justify-content:center !important;
  }
  html body #previewOverlay.overlay .preview-card.sa-reader-active{
    width:calc(100vw - 20px) !important;
    height:min(88dvh,820px) !important;
    max-width:680px !important;
    max-height:calc(100dvh - 24px) !important;
    margin:auto !important;
    padding:12px !important;
    border-radius:18px !important;
  }
  html body #previewOverlay.overlay .preview-card.sa-reader-active>.form-header{
    margin-bottom:8px !important;
  }
  html body #previewOverlay.overlay .preview-card.sa-reader-active .sa-reader-toolbar{
    padding:7px 46px 7px 7px !important;
    gap:6px !important;
  }
  .sa-toolbar-slide-btn{
    position:absolute !important;
    right:7px !important;
    top:7px !important;
    box-shadow:-12px 0 18px var(--panel-solid,#0f141d) !important;
  }
  body[data-theme="light"] .sa-toolbar-slide-btn{
    box-shadow:-12px 0 18px #f7f3e9 !important;
  }
}
`;
  document.head.appendChild(style);

  function enhanceToolbar(toolbar){
    if (!toolbar || toolbar.dataset.saSlideEnhanced === '1') return;
    toolbar.dataset.saSlideEnhanced = '1';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-reader-btn sa-toolbar-slide-btn';
    btn.setAttribute('aria-label','Show more preview controls');
    btn.setAttribute('title','More controls');
    btn.textContent = '›';
    toolbar.appendChild(btn);

    const sync = () => {
      const max = Math.max(0, toolbar.scrollWidth - toolbar.clientWidth);
      const overflow = max > 6;
      btn.classList.toggle('is-visible', overflow);
      if (!overflow) return;
      const atEnd = toolbar.scrollLeft >= max - 8;
      btn.textContent = atEnd ? '‹' : '›';
      btn.setAttribute('aria-label', atEnd ? 'Show previous preview controls' : 'Show more preview controls');
      btn.setAttribute('title', atEnd ? 'Previous controls' : 'More controls');
    };

    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const max = Math.max(0, toolbar.scrollWidth - toolbar.clientWidth);
      const atEnd = toolbar.scrollLeft >= max - 8;
      toolbar.scrollTo({
        left: atEnd ? 0 : Math.min(max, toolbar.scrollLeft + Math.max(150, toolbar.clientWidth * .72)),
        behavior:'smooth'
      });
      setTimeout(sync, 320);
    });

    toolbar.addEventListener('scroll', () => requestAnimationFrame(sync), {passive:true});
    window.addEventListener('resize', sync, {passive:true});
    requestAnimationFrame(() => requestAnimationFrame(sync));
    setTimeout(sync, 250);
  }

  function enhancePreview(){
    document.querySelectorAll('#previewOverlay .sa-reader-toolbar').forEach(enhanceToolbar);
  }

  const observer = new MutationObserver(enhancePreview);
  const start = () => {
    enhancePreview();
    if (document.body) observer.observe(document.body,{subtree:true,childList:true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();