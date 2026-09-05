(function () {
  "use strict";

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const STEP = 0.25;

  function clamp(value) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  }

  function installViewerFix() {
    const wrap = document.getElementById("pdfCanvasWrap");
    const pages = document.getElementById("pdfPages");
    const zoomOut = document.getElementById("pdfZoomOutBtn");
    const zoomIn = document.getElementById("pdfZoomInBtn");
    const zoomReset = document.getElementById("pdfZoomResetBtn");
    const zoomLabel = document.getElementById("pdfZoomLevel");

    if (!wrap || !pages || !zoomOut || !zoomIn || !zoomReset || !zoomLabel) return;
    if (wrap.dataset.statZoomFixed === "2") return;
    wrap.dataset.statZoomFixed = "2";

    let zoom = 1;
    let pinchActive = false;
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let applying = false;

    wrap.style.overflow = "auto";
    wrap.style.webkitOverflowScrolling = "touch";
    wrap.style.touchAction = "pan-x pan-y";
    wrap.style.overscrollBehavior = "contain";
    wrap.style.overflowAnchor = "none";
    pages.style.overflowAnchor = "none";
    pages.style.minWidth = "100%";

    const getDistance = touches => {
      if (!touches || touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const getCenter = touches => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    });

    function captureBaseSize(page) {
      if (!(page instanceof HTMLElement)) return;
      const rect = page.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (!page.dataset.statBaseWidth || !page.dataset.statBaseHeight) {
        page.dataset.statBaseWidth = String(rect.width / zoom);
        page.dataset.statBaseHeight = String(rect.height / zoom);
      }
    }

    function captureAllBaseSizes() {
      pages.querySelectorAll(".pdf-page").forEach(captureBaseSize);
    }

    function updateControls() {
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      zoomOut.disabled = zoom <= MIN_ZOOM + 0.001;
      zoomIn.disabled = zoom >= MAX_ZOOM - 0.001;
    }

    function findAnchor(viewportX, viewportY) {
      const wrapRect = wrap.getBoundingClientRect();
      const clientX = wrapRect.left + viewportX;
      const clientY = wrapRect.top + viewportY;

      let page = document.elementFromPoint(clientX, clientY)?.closest?.(".pdf-page");
      if (!page || !pages.contains(page)) {
        const candidates = Array.from(pages.querySelectorAll(".pdf-page"));
        page = candidates.find(el => {
          const r = el.getBoundingClientRect();
          return r.bottom >= clientY && r.top <= clientY;
        }) || candidates[0] || null;
      }

      if (!page) return null;

      const pageTop = page.offsetTop;
      const pageLeft = page.offsetLeft;
      const pageHeight = Math.max(1, page.offsetHeight);
      const pageWidth = Math.max(1, page.offsetWidth);
      const contentY = wrap.scrollTop + viewportY;
      const contentX = wrap.scrollLeft + viewportX;

      return {
        page,
        yFraction: Math.max(0, Math.min(1, (contentY - pageTop) / pageHeight)),
        xFraction: Math.max(0, Math.min(1, (contentX - pageLeft) / pageWidth))
      };
    }

    function resizePages(nextZoom, anchorClientX, anchorClientY) {
      nextZoom = clamp(nextZoom);
      if (Math.abs(nextZoom - zoom) < 0.003) return;

      captureAllBaseSizes();

      const rect = wrap.getBoundingClientRect();
      const viewportX = Number.isFinite(anchorClientX)
        ? Math.max(0, Math.min(wrap.clientWidth, anchorClientX - rect.left))
        : wrap.clientWidth / 2;
      const viewportY = Number.isFinite(anchorClientY)
        ? Math.max(0, Math.min(wrap.clientHeight, anchorClientY - rect.top))
        : wrap.clientHeight / 2;

      const anchor = findAnchor(viewportX, viewportY);

      zoom = nextZoom;
      applying = true;

      pages.querySelectorAll(".pdf-page").forEach(page => {
        const baseW = parseFloat(page.dataset.statBaseWidth || "0");
        const baseH = parseFloat(page.dataset.statBaseHeight || "0");
        if (!baseW || !baseH) return;
        page.style.width = `${Math.max(1, Math.round(baseW * zoom))}px`;
        page.style.height = `${Math.max(1, Math.round(baseH * zoom))}px`;
      });

      pages.style.width = zoom > 1 ? "max-content" : "100%";
      pages.style.minWidth = "100%";
      updateControls();

      requestAnimationFrame(() => {
        if (anchor && anchor.page?.isConnected) {
          const newTop = anchor.page.offsetTop;
          const newLeft = anchor.page.offsetLeft;
          const newHeight = Math.max(1, anchor.page.offsetHeight);
          const newWidth = Math.max(1, anchor.page.offsetWidth);

          wrap.scrollTop = Math.max(0, newTop + anchor.yFraction * newHeight - viewportY);
          wrap.scrollLeft = Math.max(0, newLeft + anchor.xFraction * newWidth - viewportX);
        }
        applying = false;
      });
    }

    zoomOut.onclick = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      resizePages(zoom - STEP);
    };

    zoomIn.onclick = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      resizePages(zoom + STEP);
    };

    zoomReset.onclick = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      resizePages(1);
    };

    const onTouchStartCapture = event => {
      if (event.touches.length !== 2) return;
      const distance = getDistance(event.touches);
      if (!distance) return;

      pinchActive = true;
      pinchStartDistance = distance;
      pinchStartZoom = zoom;

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onTouchMoveCapture = event => {
      if (!pinchActive || event.touches.length !== 2) return;
      const distance = getDistance(event.touches);
      if (!distance || !pinchStartDistance) return;

      const center = getCenter(event.touches);
      const nextZoom = clamp(pinchStartZoom * (distance / pinchStartDistance));

      event.preventDefault();
      event.stopImmediatePropagation();
      resizePages(nextZoom, center.x, center.y);
    };

    const finishPinch = event => {
      if (!pinchActive) return;
      if (event.touches && event.touches.length >= 2) return;
      pinchActive = false;
      pinchStartDistance = 0;
    };

    wrap.addEventListener("touchstart", onTouchStartCapture, { passive: false, capture: true });
    wrap.addEventListener("touchmove", onTouchMoveCapture, { passive: false, capture: true });
    wrap.addEventListener("touchend", finishPinch, { passive: true, capture: true });
    wrap.addEventListener("touchcancel", finishPinch, { passive: true, capture: true });

    wrap.addEventListener("wheel", event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      resizePages(zoom + (event.deltaY < 0 ? STEP : -STEP), event.clientX, event.clientY);
    }, { passive: false, capture: true });

    document.addEventListener("keydown", event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (!wrap.isConnected) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        event.stopImmediatePropagation();
        resizePages(zoom + STEP);
      } else if (event.key === "-") {
        event.preventDefault();
        event.stopImmediatePropagation();
        resizePages(zoom - STEP);
      } else if (event.key === "0") {
        event.preventDefault();
        event.stopImmediatePropagation();
        resizePages(1);
      }
    }, true);

    const pageObserver = new MutationObserver(() => {
      if (applying) return;
      requestAnimationFrame(() => {
        pages.querySelectorAll(".pdf-page").forEach(page => {
          const rect = page.getBoundingClientRect();
          if (!rect.width || !rect.height) return;

          const baseW = parseFloat(page.dataset.statBaseWidth || "0");
          const baseH = parseFloat(page.dataset.statBaseHeight || "0");
          const expectedW = baseW * zoom;
          const expectedH = baseH * zoom;

          if (!baseW || !baseH || Math.abs(rect.width - expectedW) > 4 || Math.abs(rect.height - expectedH) > 4) {
            page.dataset.statBaseWidth = String(rect.width / zoom);
            page.dataset.statBaseHeight = String(rect.height / zoom);
          }

          const updatedBaseW = parseFloat(page.dataset.statBaseWidth || "0");
          const updatedBaseH = parseFloat(page.dataset.statBaseHeight || "0");
          if (updatedBaseW && updatedBaseH && Math.abs(zoom - 1) > 0.003) {
            page.style.width = `${Math.max(1, Math.round(updatedBaseW * zoom))}px`;
            page.style.height = `${Math.max(1, Math.round(updatedBaseH * zoom))}px`;
          }
        });
      });
    });

    pageObserver.observe(pages, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"]
    });

    captureAllBaseSizes();
    updateControls();
  }

  const rootObserver = new MutationObserver(installViewerFix);

  function start() {
    rootObserver.observe(document.documentElement, { childList: true, subtree: true });
    installViewerFix();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
