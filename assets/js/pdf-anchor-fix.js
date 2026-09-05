(function(){
  "use strict";

  let anchor = null;
  let activePinch = false;
  let restoreRaf = 0;
  let restoreTimer = 0;

  function getWrap(){ return document.getElementById("pdfCanvasWrap"); }
  function getPages(){ return Array.from(document.querySelectorAll("#pdfPages .pdf-page")); }

  function captureAnchor(clientY){
    const wrap = getWrap();
    if(!wrap) return null;
    const pages = getPages();
    if(!pages.length) return null;

    const wr = wrap.getBoundingClientRect();
    const viewportY = Number.isFinite(clientY) ? clientY - wr.top : wrap.clientHeight * 0.5;
    const contentY = wrap.scrollTop + viewportY;

    let chosen = null;
    let bestDistance = Infinity;

    for(const page of pages){
      const top = page.offsetTop;
      const height = Math.max(1, page.offsetHeight);
      const bottom = top + height;

      if(contentY >= top && contentY <= bottom){
        chosen = page;
        bestDistance = 0;
        break;
      }

      const d = contentY < top ? top - contentY : contentY - bottom;
      if(d < bestDistance){
        bestDistance = d;
        chosen = page;
      }
    }

    if(!chosen) return null;

    const top = chosen.offsetTop;
    const height = Math.max(1, chosen.offsetHeight);
    const fraction = Math.max(0, Math.min(1, (contentY - top) / height));

    return {
      page: Number(chosen.dataset.page || 1),
      fraction,
      viewportY: Math.max(0, viewportY)
    };
  }

  function restoreAnchor(){
    if(!anchor) return;
    const wrap = getWrap();
    const page = document.querySelector(`#pdfPages .pdf-page[data-page="${anchor.page}"]`);
    if(!wrap || !page) return;

    const target = page.offsetTop + page.offsetHeight * anchor.fraction - anchor.viewportY;
    wrap.scrollTop = Math.max(0, target);

    const info = document.getElementById("pdfPageInfo");
    if(info){
      const total = (info.textContent.match(/\/\s*(\d+)/) || [])[1];
      if(total) info.textContent = `Page ${anchor.page} / ${total}`;
    }
  }

  function scheduleRestore(){
    cancelAnimationFrame(restoreRaf);
    clearTimeout(restoreTimer);
    restoreRaf = requestAnimationFrame(() => {
      restoreAnchor();
      restoreRaf = requestAnimationFrame(restoreAnchor);
    });
    restoreTimer = setTimeout(restoreAnchor, 90);
  }

  document.addEventListener("pointerdown", event => {
    const btn = event.target.closest?.("#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn");
    if(!btn) return;
    anchor = captureAnchor();
  }, true);

  document.addEventListener("click", event => {
    const btn = event.target.closest?.("#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn");
    if(!btn) return;
    if(!anchor) anchor = captureAnchor();
    scheduleRestore();
  }, true);

  document.addEventListener("touchstart", event => {
    const wrap = getWrap();
    if(!wrap || !wrap.contains(event.target) || event.touches.length !== 2) return;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    anchor = captureAnchor(centerY);
    activePinch = !!anchor;
  }, {capture:true, passive:true});

  document.addEventListener("touchmove", event => {
    const wrap = getWrap();
    if(!activePinch || !wrap || !wrap.contains(event.target) || event.touches.length !== 2) return;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    if(anchor){
      const wr = wrap.getBoundingClientRect();
      anchor.viewportY = Math.max(0, centerY - wr.top);
    }
    scheduleRestore();
  }, {capture:true, passive:true});

  document.addEventListener("touchend", event => {
    if(!activePinch) return;
    if(event.touches.length >= 2) return;
    scheduleRestore();
    activePinch = false;
    setTimeout(() => { anchor = null; }, 140);
  }, {capture:true, passive:true});

  document.addEventListener("touchcancel", () => {
    if(activePinch) scheduleRestore();
    activePinch = false;
    setTimeout(() => { anchor = null; }, 140);
  }, {capture:true, passive:true});
})();
