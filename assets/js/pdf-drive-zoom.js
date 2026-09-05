(function(){
  "use strict";

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const STEP = 0.25;

  const clamp = v => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v));

  function install(){
    const wrap = document.getElementById("pdfCanvasWrap");
    const pages = document.getElementById("pdfPages");
    const zoomOut = document.getElementById("pdfZoomOutBtn");
    const zoomIn = document.getElementById("pdfZoomInBtn");
    const zoomReset = document.getElementById("pdfZoomResetBtn");
    const zoomLabel = document.getElementById("pdfZoomLevel");

    if(!wrap || !pages || !zoomOut || !zoomIn || !zoomReset || !zoomLabel) return;
    if(wrap.dataset.driveZoomInstalled === "1") return;
    wrap.dataset.driveZoomInstalled = "1";

    let zoom = parseFloat(getComputedStyle(pages).getPropertyValue("--stat-pdf-zoom")) || 1;
    let pinch = null;
    let settleTimer = 0;

    wrap.style.overflow = "auto";
    wrap.style.webkitOverflowScrolling = "touch";
    wrap.style.touchAction = "pan-x pan-y";
    wrap.style.overscrollBehavior = "contain";
    wrap.style.overflowAnchor = "none";
    pages.style.overflowAnchor = "none";

    function updateLabel(){
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      zoomOut.disabled = zoom <= MIN_ZOOM + 0.001;
      zoomIn.disabled = zoom >= MAX_ZOOM - 0.001;
    }

    function findPageAt(clientX, clientY){
      const stack = document.elementsFromPoint(clientX, clientY);
      let page = stack.find(el => el?.classList?.contains("pdf-page"));

      if(!page){
        const list = Array.from(pages.querySelectorAll(".pdf-page"));
        let best = null;
        let bestDistance = Infinity;
        for(const el of list){
          const r = el.getBoundingClientRect();
          const dx = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
          const dy = clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
          const d = Math.hypot(dx, dy);
          if(d < bestDistance){ bestDistance = d; best = el; }
        }
        page = best;
      }

      if(!page) return null;

      const r = page.getBoundingClientRect();
      return {
        page,
        pageNum: Number(page.dataset.page || 1),
        xFrac: r.width ? clamp01((clientX - r.left) / r.width) : 0.5,
        yFrac: r.height ? clamp01((clientY - r.top) / r.height) : 0.5
      };
    }

    function clamp01(v){ return Math.max(0, Math.min(1, v)); }

    function captureAnchor(clientX, clientY){
      const wr = wrap.getBoundingClientRect();
      const x = Number.isFinite(clientX) ? clientX : wr.left + wrap.clientWidth / 2;
      const y = Number.isFinite(clientY) ? clientY : wr.top + wrap.clientHeight / 2;
      const hit = findPageAt(x, y);
      if(!hit) return null;
      return {
        ...hit,
        viewportX: x - wr.left,
        viewportY: y - wr.top
      };
    }

    function restoreAnchor(anchor){
      if(!anchor?.page?.isConnected) return;
      const wr = wrap.getBoundingClientRect();
      const r = anchor.page.getBoundingClientRect();
      const targetClientX = wr.left + anchor.viewportX;
      const targetClientY = wr.top + anchor.viewportY;
      const actualClientX = r.left + r.width * anchor.xFrac;
      const actualClientY = r.top + r.height * anchor.yFrac;
      wrap.scrollLeft += actualClientX - targetClientX;
      wrap.scrollTop += actualClientY - targetClientY;
    }

    function applyZoom(nextZoom, anchor){
      nextZoom = clamp(nextZoom);
      if(Math.abs(nextZoom - zoom) < 0.001) return;
      zoom = nextZoom;
      pages.style.setProperty("--stat-pdf-zoom", String(zoom));
      updateLabel();

      // CSS variable changes page layout synchronously in Chromium, but restore
      // over two frames as canvas/page dimensions can settle one frame later.
      restoreAnchor(anchor);
      requestAnimationFrame(() => {
        restoreAnchor(anchor);
        requestAnimationFrame(() => restoreAnchor(anchor));
      });

      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => restoreAnchor(anchor), 80);
    }

    function buttonZoom(next){
      const wr = wrap.getBoundingClientRect();
      const anchor = captureAnchor(wr.left + wrap.clientWidth/2, wr.top + wrap.clientHeight/2);
      applyZoom(next, anchor);
    }

    // Capture clicks before the built-in v2 viewer so only one zoom engine runs.
    document.addEventListener("click", event => {
      const btn = event.target.closest("#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn");
      if(!btn || !wrap.isConnected) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(btn.id === "pdfZoomInBtn") buttonZoom(zoom + STEP);
      else if(btn.id === "pdfZoomOutBtn") buttonZoom(zoom - STEP);
      else buttonZoom(1);
    }, true);

    const distance = t => Math.hypot(
      t[0].clientX - t[1].clientX,
      t[0].clientY - t[1].clientY
    );

    const center = t => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2
    });

    wrap.addEventListener("touchstart", event => {
      if(event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d) return;
      const c = center(event.touches);
      const anchor = captureAnchor(c.x, c.y);
      if(!anchor) return;
      pinch = {
        startDistance: d,
        startZoom: zoom,
        anchor
      };
      event.preventDefault();
      event.stopImmediatePropagation();
    }, {passive:false, capture:true});

    wrap.addEventListener("touchmove", event => {
      if(!pinch || event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d) return;
      const c = center(event.touches);

      // Keep the same PDF point under the moving finger midpoint, just like
      // Drive: the anchor page + fractional position never changes mid-gesture.
      const wr = wrap.getBoundingClientRect();
      pinch.anchor.viewportX = c.x - wr.left;
      pinch.anchor.viewportY = c.y - wr.top;

      event.preventDefault();
      event.stopImmediatePropagation();
      applyZoom(pinch.startZoom * (d / pinch.startDistance), pinch.anchor);
    }, {passive:false, capture:true});

    const finishPinch = event => {
      if(!pinch) return;
      if(event.touches && event.touches.length >= 2) return;
      const anchor = pinch.anchor;
      pinch = null;
      requestAnimationFrame(() => restoreAnchor(anchor));
      setTimeout(() => restoreAnchor(anchor), 100);
    };

    wrap.addEventListener("touchend", finishPinch, {passive:true, capture:true});
    wrap.addEventListener("touchcancel", finishPinch, {passive:true, capture:true});

    updateLabel();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();
