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
    if(wrap.dataset.statTransformZoom === "1") return;
    wrap.dataset.statTransformZoom = "1";

    let zoom = 1;
    let pinchActive = false;
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let shell = pages.parentElement?.classList.contains("stat-pdf-zoom-shell")
      ? pages.parentElement
      : null;

    if(!shell){
      shell = document.createElement("div");
      shell.className = "stat-pdf-zoom-shell";
      shell.style.position = "relative";
      shell.style.width = "100%";
      shell.style.minWidth = "100%";
      shell.style.overflow = "visible";
      pages.parentNode.insertBefore(shell, pages);
      shell.appendChild(pages);
    }

    wrap.style.overflow = "auto";
    wrap.style.webkitOverflowScrolling = "touch";
    wrap.style.touchAction = "pan-x pan-y";
    wrap.style.overscrollBehavior = "contain";
    wrap.style.overflowAnchor = "none";
    shell.style.overflowAnchor = "none";
    pages.style.overflowAnchor = "none";
    pages.style.transformOrigin = "0 0";
    pages.style.willChange = "transform";

    function updateControls(){
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      zoomOut.disabled = zoom <= MIN_ZOOM + 0.001;
      zoomIn.disabled = zoom >= MAX_ZOOM - 0.001;
    }

    function naturalSize(){
      const oldTransform = pages.style.transform;
      pages.style.transform = "none";
      const width = Math.max(pages.scrollWidth, pages.getBoundingClientRect().width, wrap.clientWidth);
      const height = Math.max(pages.scrollHeight, pages.getBoundingClientRect().height, 1);
      pages.style.transform = oldTransform;
      return { width, height };
    }

    function syncShell(){
      const size = naturalSize();
      shell.style.width = `${Math.max(wrap.clientWidth, size.width * zoom)}px`;
      shell.style.height = `${Math.max(1, size.height * zoom)}px`;
      shell.style.minWidth = "100%";
    }

    function pageAnchor(clientX, clientY){
      const pageList = Array.from(pages.querySelectorAll(".pdf-page"));
      if(!pageList.length) return null;
      let best = null;
      let bestDist = Infinity;
      for(const page of pageList){
        const r = page.getBoundingClientRect();
        const insideY = clientY >= r.top && clientY <= r.bottom;
        const dy = insideY ? 0 : Math.min(Math.abs(clientY-r.top), Math.abs(clientY-r.bottom));
        if(dy < bestDist){
          bestDist = dy;
          best = page;
        }
      }
      if(!best) return null;
      const r = best.getBoundingClientRect();
      return {
        page: best,
        x: r.width ? (clientX-r.left)/r.width : 0.5,
        y: r.height ? (clientY-r.top)/r.height : 0.5
      };
    }

    function restoreAnchor(anchor, clientX, clientY){
      if(!anchor?.page?.isConnected) return;
      const r = anchor.page.getBoundingClientRect();
      const actualX = r.left + r.width * anchor.x;
      const actualY = r.top + r.height * anchor.y;
      wrap.scrollLeft += actualX - clientX;
      wrap.scrollTop += actualY - clientY;
    }

    function applyZoom(nextZoom, clientX, clientY){
      nextZoom = clamp(nextZoom);
      if(Math.abs(nextZoom-zoom) < 0.002) return;

      const wr = wrap.getBoundingClientRect();
      const ax = Number.isFinite(clientX) ? clientX : wr.left + wrap.clientWidth/2;
      const ay = Number.isFinite(clientY) ? clientY : wr.top + wrap.clientHeight/2;
      const anchor = pageAnchor(ax, ay);

      zoom = nextZoom;
      pages.style.transform = `scale(${zoom})`;
      syncShell();
      updateControls();

      requestAnimationFrame(()=>{
        restoreAnchor(anchor, ax, ay);
        requestAnimationFrame(()=>restoreAnchor(anchor, ax, ay));
      });
    }

    const buttonHandler = event => {
      const btn = event.target.closest("#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn");
      if(!btn) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(btn.id === "pdfZoomInBtn") applyZoom(zoom + STEP);
      else if(btn.id === "pdfZoomOutBtn") applyZoom(zoom - STEP);
      else applyZoom(1);
    };
    document.addEventListener("click", buttonHandler, true);

    const distance = touches => {
      if(!touches || touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx,dy);
    };

    const center = touches => ({
      x:(touches[0].clientX+touches[1].clientX)/2,
      y:(touches[0].clientY+touches[1].clientY)/2
    });

    wrap.addEventListener("touchstart", event => {
      if(event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d) return;
      pinchActive = true;
      pinchStartDistance = d;
      pinchStartZoom = zoom;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, {passive:false, capture:true});

    wrap.addEventListener("touchmove", event => {
      if(!pinchActive || event.touches.length !== 2) return;
      const d = distance(event.touches);
      if(!d || !pinchStartDistance) return;
      const c = center(event.touches);
      event.preventDefault();
      event.stopImmediatePropagation();
      applyZoom(pinchStartZoom * (d/pinchStartDistance), c.x, c.y);
    }, {passive:false, capture:true});

    const endPinch = event => {
      if(!pinchActive) return;
      if(event.touches && event.touches.length >= 2) return;
      pinchActive = false;
      pinchStartDistance = 0;
    };

    wrap.addEventListener("touchend", endPinch, {passive:true, capture:true});
    wrap.addEventListener("touchcancel", endPinch, {passive:true, capture:true});

    wrap.addEventListener("wheel", event => {
      if(!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      applyZoom(zoom + (event.deltaY < 0 ? STEP : -STEP), event.clientX, event.clientY);
    }, {passive:false, capture:true});

    const observer = new MutationObserver(()=>{
      requestAnimationFrame(syncShell);
    });
    observer.observe(pages,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});

    syncShell();
    updateControls();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
