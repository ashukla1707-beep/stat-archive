(() => {
  if (document.getElementById('statArchiveMobileCardActionsFinal')) return;

  const style = document.createElement('style');
  style.id = 'statArchiveMobileCardActionsFinal';
  style.textContent = `
html body .card .card-actions{box-sizing:border-box!important}
html:not([data-authenticated="true"]) body .card .card-actions{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}
html:not([data-authenticated="true"]) body .card .card-actions .action-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0!important;min-width:0!important;width:auto!important;white-space:nowrap!important}
html[data-authenticated="true"] body .card .card-actions{display:grid!important;grid-template-columns:minmax(0,1.05fr) minmax(0,1.22fr) minmax(0,1.05fr) 34px 34px!important;align-items:stretch!important;justify-content:stretch!important;gap:4px!important;width:100%!important;max-width:100%!important;overflow:visible!important}
html[data-authenticated="true"] body .card .card-actions .action-btn{display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;max-width:100%!important;width:100%!important;margin:0!important;padding:0 5px!important;gap:3px!important;white-space:nowrap!important;word-break:keep-all!important;overflow:hidden!important;text-overflow:clip!important;box-sizing:border-box!important}
html[data-authenticated="true"] body .card .card-actions .edit-btn,html[data-authenticated="true"] body .card .card-actions .del-btn{display:flex!important;visibility:visible!important;opacity:1!important;width:34px!important;min-width:34px!important;max-width:34px!important;padding:0!important;gap:0!important;overflow:hidden!important}
html[data-authenticated="true"] body .card .card-actions .edit-btn{font-size:0!important}
html[data-authenticated="true"] body .card .card-actions .edit-btn::before{content:"✎"!important;font-size:14px!important;line-height:1!important}
html body .card .card-actions .offline-btn{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
@media(min-width:701px){
  html[data-authenticated="true"] body .card .card-actions{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:stretch!important;gap:5px!important;overflow:hidden!important}
  html[data-authenticated="true"] body .card .card-actions .action-btn{display:inline-flex!important;width:auto!important;max-width:none!important;height:32px!important;min-height:32px!important;border-radius:9px!important;font-size:11.5px!important;font-weight:650!important}
  html[data-authenticated="true"] body .card .card-actions .pv-btn,html[data-authenticated="true"] body .card .card-actions .dl-btn,html[data-authenticated="true"] body .card .card-actions .download-btn,html[data-authenticated="true"] body .card .card-actions .offline-btn{flex:1 1 0!important;width:auto!important;min-width:0!important;max-width:none!important;padding-left:6px!important;padding-right:6px!important}
  html[data-authenticated="true"] body .card .card-actions .edit-btn,html[data-authenticated="true"] body .card .card-actions .del-btn{display:inline-flex!important;flex:0 0 36px!important;width:36px!important;min-width:36px!important;max-width:36px!important;padding:0!important}
  html[data-authenticated="true"] body .card .card-actions .edit-btn{font-size:0!important}
}
@media(max-width:700px){
  html body .card .card-actions{padding-top:8px!important}
  html:not([data-authenticated="true"]) body .card .card-actions{justify-content:space-between!important;gap:0!important}
  html:not([data-authenticated="true"]) body .card .card-actions .action-btn{flex:0 0 auto!important;width:auto!important;max-width:none!important;height:32px!important;min-height:32px!important;padding:0 10px!important;border-radius:9px!important;font-size:12.5px!important;font-weight:700!important;gap:4px!important}
  html:not([data-authenticated="true"]) body .card .card-actions .pv-btn{min-width:clamp(88px,27vw,104px)!important}
  html:not([data-authenticated="true"]) body .card .card-actions .dl-btn,html:not([data-authenticated="true"]) body .card .card-actions .download-btn{min-width:clamp(103px,31vw,122px)!important}
  html:not([data-authenticated="true"]) body .card .card-actions .offline-btn{min-width:clamp(86px,26vw,102px)!important}
  html[data-authenticated="true"] body .card .card-actions{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:stretch!important;gap:4px!important;width:100%!important;max-width:100%!important;overflow:hidden!important}
  html[data-authenticated="true"] body .card .card-actions .action-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:0!important;max-width:none!important;height:34px!important;min-height:34px!important;padding:0 5px!important;border-radius:9px!important;font-size:10.5px!important;font-weight:700!important;gap:3px!important}
  html[data-authenticated="true"] body .card .card-actions .pv-btn,html[data-authenticated="true"] body .card .card-actions .dl-btn,html[data-authenticated="true"] body .card .card-actions .download-btn,html[data-authenticated="true"] body .card .card-actions .offline-btn{flex:1 1 0!important;width:auto!important;min-width:0!important;max-width:none!important}
  html[data-authenticated="true"] body .card .card-actions .edit-btn{flex:0 0 52px!important;width:52px!important;min-width:52px!important;max-width:52px!important;padding:0 4px!important;font-size:10.5px!important;gap:2px!important}
  html[data-authenticated="true"] body .card .card-actions .edit-btn::before{content:none!important;display:none!important}
  html[data-authenticated="true"] body .card .card-actions .del-btn{flex:0 0 34px!important;width:34px!important;min-width:34px!important;max-width:34px!important;padding:0!important}
  html body .card .card-actions .action-btn br{display:none!important}
}
html body:not([data-theme="light"]) .card .card-actions .pv-btn:not(.is-previewed):not(.sa-preview-used),html body:not([data-theme="light"]) .card .card-actions .dl-btn:not(.is-downloaded),html body:not([data-theme="light"]) .card .card-actions .download-btn:not(.is-downloaded),html body:not([data-theme="light"]) .card .card-actions .offline-btn:not(.is-saved){color:#f1f4f8!important;background:#111722!important;border:1px solid rgba(255,255,255,.035)!important;box-shadow:none!important}
html body:not([data-theme="light"]) .card .card-actions .pv-btn.is-previewed,html body:not([data-theme="light"]) .card .card-actions .pv-btn.sa-preview-used,html body:not([data-theme="light"]) .card .card-actions .dl-btn.is-downloaded,html body:not([data-theme="light"]) .card .card-actions .download-btn.is-downloaded,html body:not([data-theme="light"]) .card .card-actions .offline-btn.is-saved{color:#63efff!important;background:rgba(18,52,64,.76)!important;border:1px solid rgba(99,239,255,.38)!important;box-shadow:inset 0 0 0 1px rgba(99,239,255,.07)!important}
html body[data-theme="light"] .card .card-actions .pv-btn:not(.is-previewed):not(.sa-preview-used),html body[data-theme="light"] .card .card-actions .dl-btn:not(.is-downloaded),html body[data-theme="light"] .card .card-actions .download-btn:not(.is-downloaded),html body[data-theme="light"] .card .card-actions .offline-btn:not(.is-saved){color:#27302d!important;background:#eee9f4!important;border:1px solid #ddd4e4!important;box-shadow:none!important}
html body[data-theme="light"] .card .card-actions .pv-btn.is-previewed,html body[data-theme="light"] .card .card-actions .pv-btn.sa-preview-used,html body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded,html body[data-theme="light"] .card .card-actions .download-btn.is-downloaded,html body[data-theme="light"] .card .card-actions .offline-btn.is-saved{color:#fff!important;background:#5a3a73!important;border:1px solid #5a3a73!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)!important}
@media(max-width:380px){
  html:not([data-authenticated="true"]) body .card .card-actions .action-btn{height:30px!important;min-height:30px!important;padding:0 7px!important;font-size:11.5px!important;border-radius:8px!important;gap:3px!important}
  html:not([data-authenticated="true"]) body .card .card-actions .pv-btn{min-width:82px!important}
  html:not([data-authenticated="true"]) body .card .card-actions .dl-btn,html:not([data-authenticated="true"]) body .card .card-actions .download-btn{min-width:96px!important}
  html:not([data-authenticated="true"]) body .card .card-actions .offline-btn{min-width:80px!important}
  html[data-authenticated="true"] body .card .card-actions{gap:3px!important}
  html[data-authenticated="true"] body .card .card-actions .action-btn{height:32px!important;min-height:32px!important;padding:0 3px!important;font-size:9.5px!important;border-radius:8px!important;gap:2px!important}
  html[data-authenticated="true"] body .card .card-actions .edit-btn{flex-basis:46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;font-size:9.5px!important}
  html[data-authenticated="true"] body .card .card-actions .del-btn{flex-basis:30px!important;width:30px!important;min-width:30px!important;max-width:30px!important}
}`;

  document.head.appendChild(style);
  document.querySelectorAll('.card .card-actions .pv-btn').forEach(btn => btn.classList.remove('sa-preview-used'));
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const previewBtn = target?.closest('.card .card-actions .pv-btn');
    if (previewBtn) previewBtn.classList.add('sa-preview-used');
  }, true);
})();

/* Preview remains a floating popup. On compact screens, secondary PDF tools
   expand into a clean second row instead of horizontally sliding the toolbar. */
(() => {
  if (window.__statArchivePreviewPopupPolishV2) return;
  window.__statArchivePreviewPopupPolishV2 = true;

  const style = document.createElement('style');
  style.id = 'statArchivePreviewPopupPolish';
  style.textContent = `
html body #previewOverlay.overlay{align-items:center!important;justify-content:center!important;padding:14px!important;background:rgba(3,7,12,.76)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important}
html body #previewOverlay.overlay .preview-card.sa-reader-active{width:min(1120px,calc(100vw - 28px))!important;height:min(900px,calc(100dvh - 28px))!important;max-width:1120px!important;max-height:900px!important;margin:auto!important;border-radius:18px!important;overflow:hidden!important;box-shadow:0 24px 70px rgba(0,0,0,.48)!important}
.sa-toolbar-expand-btn,.sa-toolbar-extra-row{display:none}
@media(max-width:700px){
  html body #previewOverlay.overlay{padding:max(12px,env(safe-area-inset-top)) 10px max(12px,env(safe-area-inset-bottom))!important;align-items:center!important;justify-content:center!important}
  html body #previewOverlay.overlay .preview-card.sa-reader-active{width:calc(100vw - 20px)!important;height:min(88dvh,820px)!important;max-width:680px!important;max-height:calc(100dvh - 24px)!important;margin:auto!important;padding:12px!important;border-radius:18px!important}
  html body #previewOverlay.overlay .preview-card.sa-reader-active>.form-header{margin-bottom:8px!important}
  html body #previewOverlay.overlay .sa-reader-toolbar{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto 34px!important;align-items:center!important;column-gap:8px!important;row-gap:6px!important;overflow:visible!important;padding:7px!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group{min-width:0!important;margin:0!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group:first-of-type{display:grid!important;grid-template-columns:34px minmax(70px,auto) 34px!important;align-items:center!important;gap:5px!important;justify-self:start!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group:nth-of-type(2){display:grid!important;grid-template-columns:34px minmax(46px,auto) 34px!important;align-items:center!important;gap:5px!important;justify-self:end!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-btn{margin:0!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-info,html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-zoom{text-align:center!important;min-width:0!important}
  .sa-toolbar-expand-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;justify-self:end!important;flex:0 0 34px!important;width:34px!important;height:34px!important;min-width:34px!important;padding:0!important;margin:0!important;border-radius:9px!important;font:800 18px/1 'JetBrains Mono',monospace!important;transition:transform .18s ease,background .18s ease!important}
  .sa-toolbar-expand-btn.is-open{transform:rotate(180deg)!important}
  .sa-toolbar-extra-row{position:absolute!important;left:7px!important;right:7px!important;top:calc(100% + 6px)!important;z-index:35!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;padding:0!important;max-height:0!important;opacity:0!important;transform:translateY(-6px)!important;overflow:hidden!important;pointer-events:none!important;transition:max-height .2s ease,opacity .16s ease,transform .2s ease,padding .2s ease!important;border:1px solid transparent!important;border-radius:10px!important;background:var(--panel-solid,#0f141d)!important;box-shadow:0 12px 28px rgba(0,0,0,.3)!important}
  .sa-toolbar-extra-row.is-open{max-height:52px!important;opacity:1!important;transform:translateY(0)!important;pointer-events:auto!important;padding:7px!important;border-color:var(--line-strong,rgba(148,163,184,.22))!important}
  .sa-toolbar-extra-row .sa-reader-btn{flex:1 1 0!important;min-width:0!important;height:34px!important;padding:0 8px!important;gap:5px!important;font-size:11px!important}
  .sa-toolbar-extra-row .sa-reader-btn::after{font-size:10px!important;font-weight:700!important;letter-spacing:.01em!important}
  .sa-toolbar-extra-row #saReaderReset::after{content:'Reset'}
  .sa-toolbar-extra-row #saReaderDownload::after{content:'Download'}
  .sa-toolbar-extra-row #saReaderPrint::after{content:'Print'}
  body[data-theme="light"] .sa-toolbar-extra-row{background:#f7f3e9!important;box-shadow:0 12px 26px rgba(74,59,39,.16)!important}
}
@media(max-width:430px){
  html body #previewOverlay.overlay .sa-reader-toolbar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 32px!important;column-gap:5px!important;padding:6px!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group:first-of-type{grid-template-columns:32px minmax(56px,1fr) 32px!important;gap:3px!important;width:100%!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group:nth-of-type(2){grid-template-columns:32px minmax(38px,1fr) 32px!important;gap:3px!important;width:100%!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-btn{min-width:32px!important;width:32px!important;padding:0!important}
  html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-info,html body #previewOverlay.overlay .sa-reader-toolbar>.sa-reader-group .sa-reader-zoom{font-size:9px!important;white-space:nowrap!important}
  .sa-toolbar-expand-btn{width:32px!important;min-width:32px!important;height:32px!important}
}
`;
  document.head.appendChild(style);

  function enhanceToolbar(toolbar){
    if (!toolbar || toolbar.dataset.saExpandEnhanced === '1') return;
    const groups = toolbar.querySelectorAll(':scope > .sa-reader-group');
    const tools = groups[1];
    if (!tools) return;

    const reset = tools.querySelector('#saReaderReset');
    const download = tools.querySelector('#saReaderDownload');
    const print = tools.querySelector('#saReaderPrint');
    if (!reset || !download || !print) return;

    toolbar.dataset.saExpandEnhanced = '1';

    const extra = document.createElement('div');
    extra.className = 'sa-toolbar-extra-row';
    extra.setAttribute('aria-hidden','true');
    extra.append(reset, download, print);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-reader-btn sa-toolbar-expand-btn';
    btn.setAttribute('aria-label','Show more preview controls');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('title','More controls');
    btn.textContent = '⌄';

    toolbar.append(btn, extra);

    const setOpen = open => {
      btn.classList.toggle('is-open', open);
      extra.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      extra.setAttribute('aria-hidden', open ? 'false' : 'true');
      btn.setAttribute('title', open ? 'Hide extra controls' : 'More controls');
      btn.setAttribute('aria-label', open ? 'Hide extra preview controls' : 'Show more preview controls');
    };

    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!extra.classList.contains('is-open'));
    });

    document.addEventListener('click', event => {
      if (!extra.classList.contains('is-open')) return;
      const node = event.target instanceof Node ? event.target : null;
      if (node && (extra.contains(node) || btn.contains(node))) return;
      setOpen(false);
    });

    extra.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('.sa-reader-btn')) setOpen(false);
    });
  }

  const enhance = () => document.querySelectorAll('#previewOverlay .sa-reader-toolbar').forEach(enhanceToolbar);
  const observer = new MutationObserver(enhance);
  const start = () => {
    enhance();
    if (document.body) observer.observe(document.body,{subtree:true,childList:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();