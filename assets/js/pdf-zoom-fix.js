(function(){
  "use strict";

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const STEP = 0.25;

  const clamp = value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

  function install(){
    const wrap = document.getElementById("pdfCanvasWrap");
    const pages = document.getElementById("pdfPages");
    const zoomOut = document.getElementById("pdfZoomOutBtn");
    const zoomIn = document.getElementById("pdfZoomInBtn");
    const zoomReset = document.getElementById("pdfZoomResetBtn");
    const zoomLabel = document.getElementById("pdfZoomLevel");

    if(!wrap || !pages || !zoomOut || !zoomIn || !zoomReset || !zoomLabel) return;
    if(wrap.dataset.statStableZoom === "1") return;
    wrap.dataset.statStableZoom = "1";

    let zoom = 1;
    let pinchActive = false;
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let pinchCenterX = 0;
    let pinchCenterY = 0;

    wrap.style.overflow = "auto";
    wrap.style.webkitOverflowScrolling = "touch";
    wrap.style.touchAction = "pan-x pan-y";
    wrap.style.overscrollBehavior = "contain";
    wrap.style.overflowAnchor = "none";
    pages.style.overflowAnchor = "none";
    pages.style.transformOrigin = "0 0";

    function updateControls(){
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      zoomOut.disabled = zoom <= MIN_ZOOM + 0.001;
      zoomIn.disabled = zoom >= MAX_ZOOM - 0.001;
    }

    function pageAtViewportPoint(clientX, clientY){
      const list = Array.from(pages.querySelectorAll('.pdf-page'));
      let best = null;
      let bestDistance = Infinity;
      for(const page of list){
        const r = page.getBoundingClientRect();
        const inside = clientY >= r.top && clientY <= r.bottom;
        const distance = inside ? 0 : Math.min(Math.abs(clientY-r.top), Math.abs(clientY-r.bottom));
        if(distance < bestDistance){ bestDistance = distance; best = page; }
      }
      if(!best) return null;
      const r = best.getBoundingClientRect();
      return {
        page: best,
        xRatio: r.width ? (clientX-r.left)/r.width : 0.5,
        yRatio: r.height ? (clientY-r.top)/r.height : 0.5
      };
    }

    function restoreAnchor(anchor, viewportX, viewportY){
      if(!anchor?.page?.isConnected) return;
      const wrapRect = wrap.getBoundingClientRect();
      const r = anchor.page.getBoundingClientRect();
      const desiredClientX = wrapRect.left + viewportX;
      const desiredClientY = wrapRect.top + viewportY;
      const actualClientX = r.left + r.width * anchor.xRatio;
      const actualClientY = r.top + r.height * anchor.yRatio;
      wrap.scrollLeft += actualClientX - desiredClientX;
      wrap.scrollTop += actualClientY - desiredClientY;
    }

    function setZoom(nextZoom, clientX, clientY){
      nextZoom = clamp(nextZoom);
      if(Math.abs(nextZoom - zoom) < 0.002) return;

      const wrapRect = wrap.getBoundingClientRect();
      const anchorClientX = Number.isFinite(clientX) ? clientX : wrapRect.left + wrap.clientWidth/2;
      const anchorClientY = Number.isFinite(clientY) ? clientY : wrapRect.top + wrap.clientHeight/2;
      const viewportX = anchorClientX - wrapRect.left;
      const viewportY = anchorClientY - wrapRect.top;
      const anchor = pageAtViewportPoint(anchorClientX, anchorClientY);

      zoom = nextZoom;

      /* CSS zoom changes layout dimensions directly in Chromium/WebView,
         so the PDF remains scrollable without re-rendering hundreds of pages. */
      pages.style.zoom = String(zoom);
      pages.style.width = zoom > 1 ? "max-content" : "100%";
      pages.style.minWidth = "100%";

      updateControls();

      requestAnimationFrame(() => {
        restoreAnchor(anchor, viewportX, viewportY);
        requestAnimationFrame(() => restoreAnchor(anchor, viewportX, viewportY));
      });
    }

    /* Capture before preview.js handlers so only this zoom engine runs. */
    const buttonHandler = event => {
      const btn = event.target.closest('#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn');
      if(!btn) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(btn.id === 'pdfZoomInBtn') setZoom(zoom + STEP);
      else if(btn.id === 'pdfZoomOutBtn') setZoom(zoom - STEP);
      else setZoom(1);
    };
    document.addEventListener('click', buttonHandler, true);

    const distance = touches => {
      if(!touches || touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx,dy);
    };

    const center = touches => ({
      x:(touches[0].clientX + touches[1].clientX)/2,
      y:(touches[0].clientY + touches[1].clientY)/2
    });

    wrap.addEventListener('touchstart', event => {
      if(event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d) return;
      const c = center(event.touches);
      pinchActive = true;
      pinchStartDistance = d;
      pinchStartZoom = zoom;
      pinchCenterX = c.x;
      pinchCenterY = c.y;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, {passive:false, capture:true});

    wrap.addEventListener('touchmove', event => {
      if(!pinchActive || event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d || !pinchStartDistance) return;
      const c = center(event.touches);
      event.preventDefault();
      event.stopImmediatePropagation();
      setZoom(pinchStartZoom * (d/pinchStartDistance), c.x, c.y);
    }, {passive:false, capture:true});

    const finishPinch = event => {
      if(!pinchActive) return;
      if(event.touches && event.touches.length >= 2) return;
      pinchActive = false;
      pinchStartDistance = 0;
    };

    wrap.addEventListener('touchend', finishPinch, {passive:true, capture:true});
    wrap.addEventListener('touchcancel', finishPinch, {passive:true, capture:true});

    wrap.addEventListener('wheel', event => {
      if(!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setZoom(zoom + (event.deltaY < 0 ? STEP : -STEP), event.clientX, event.clientY);
    }, {passive:false, capture:true});

    updateControls();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
