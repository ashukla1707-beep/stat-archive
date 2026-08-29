const HTML_ESCAPE_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => HTML_ESCAPE_MAP[c]);
}

function guessMime(filename, fallback) {
  const parts = (filename || "").split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
  const map = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" };
  return map[ext] || fallback || "application/octet-stream";
}


/*
 * Open a PDF in a real browser tab without triggering the server's
 * Content-Disposition: attachment download flow.
 *
 * IMPORTANT: window.open() happens synchronously inside the user's click
 * event. We then fetch the PDF and navigate that already-open tab to a
 * blob: URL. This avoids Android Chrome/Brave sending the user to
 * content://downloads/all.
 */
async function openPdfInNewTab(pdfUrl) {
  const popup = window.open("about:blank", "_blank");

  if (!popup) {
    // Popup was blocked. Navigating window.location away would wipe all
    // in-memory SPA state (filters, open forms, etc.), so just inform the
    // user instead of forcing a full-page navigation.
    alert("Popup blocked. Please allow popups for this site, or use the Download button instead.");
    return;
  }

  try {
    popup.document.title = "Opening PDF…";
    popup.document.body.style.cssText =
      "margin:0;display:flex;align-items:center;justify-content:center;" +
      "height:100vh;background:#0b0f18;color:#cbd5e1;font-family:system-ui;";
    popup.document.body.textContent = "Opening PDF…";

    const response = await fetch(pdfUrl, {
      method: "GET",
      credentials: "omit",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`PDF request failed (${response.status})`);
    }

    const blob = await response.blob();

    // Force the browser-side MIME type to PDF. The server may send
    // application/octet-stream together with Content-Disposition: attachment.
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const blobUrl = popup.URL.createObjectURL(pdfBlob);

    popup.location.replace(blobUrl);

    // Do not revoke the object URL on a timer: a 10-minute expiry killed
    // the PDF out from under students who kept a study tab open longer
    // than that. The blob URL is released naturally when the tab closes
    // or reloads (or the browser reclaims it), so no revoke here.
  } catch (err) {
    console.error("Could not open PDF in new tab:", err);
    try {
      popup.document.body.textContent = "Couldn't open the PDF.";
    } catch {}
  }
}

/*
 * Print a PDF we've already fetched (as a Blob) without re-downloading it or
 * navigating away from the page. Loads it into a hidden iframe and invokes
 * the browser's native print dialog once it's rendered.
 */
let printRequestToken = 0;
function printPdfBlob(blob, btn, filename) {
  const requestToken = ++printRequestToken;
  const original = btn ? btn.innerHTML : null;
  if (btn) {
    btn.textContent = "…";
    btn.disabled = true;
  }

  const resetBtn = () => {
    if (requestToken !== printRequestToken) return;
    if (btn) {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  };

  try {
    // Destroy any existing print iframe first. Without this, clicking
    // "Print" multiple times rapidly loads the same PDF blob into memory
    // over and over and can crash the tab.
    const existing = document.getElementById("pdf-print-frame");
    if (existing) {
      URL.revokeObjectURL(existing.src);
      existing.remove();
    }

    const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(pdfBlob);

    const iframe = document.createElement("iframe");
    iframe.id = "pdf-print-frame";
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
    iframe.src = blobUrl;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (iframe.isConnected) iframe.remove();
      URL.revokeObjectURL(blobUrl);
      resetBtn();
    };

    iframe.onload = () => {
      try {
        // Use the entry's own filename instead of the messy blob:https://...
        // URL as the print dialog's document title / default save name.
        if (filename) iframe.contentDocument.title = filename;
        iframe.contentWindow.focus();

        // Clean up as soon as the native print dialog closes, instead of
        // relying only on a fixed timeout — a slow printer or a user who
        // leaves the dialog open shouldn't have the PDF yanked out from
        // under them mid-print.
        iframe.contentWindow.addEventListener("afterprint", cleanup);

        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print failed, opening PDF in a new tab instead:", err);
        const popup = window.open(blobUrl, "_blank", "noopener");
        if (!popup) alert("Printing was blocked by the browser. Please allow popups or use Open PDF.");
      }
      resetBtn();
      // Fallback in case "afterprint" never fires (some browsers don't
      // support it inside an iframe). Extended from 60s to 5 minutes so a
      // print dialog left open for a while doesn't get cleaned up under it.
      setTimeout(cleanup, 300000);
    };
    iframe.onerror = cleanup;

    document.body.appendChild(iframe);
    // Guaranteed fallback: if the browser or an adblocker silently blocks
    // the load (neither onload nor onerror fires), this still frees the
    // iframe and blob instead of leaking them forever.
    setTimeout(cleanup, 305000);
  } catch (err) {
    console.error("Could not prepare PDF for printing:", err);
    resetBtn();
  }
}

async function previewEntry(entry) {
  closePreview();
  const token = ++currentPreviewToken; // Capture the token for this specific preview request

  // Keep normal browser pinch zoom available on mobile, even while a preview
  // is open. The viewport meta tag must never lock user scaling.

  const overlay = document.getElementById("previewOverlay");
  const body = document.getElementById("previewBody");
  const fileUrl = `${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
  previewAbortController = new AbortController();

  document.getElementById("previewTitle").textContent = entry.title;
  body.innerHTML = `<div class="pdf-preview-loading">Loading preview…</div>`;
  overlay.style.display = "flex";
  document.body.classList.add("no-scroll");
  showError("");
  incrementActivity("preview");

  let mime = guessMime(entry.filename, "");
  // Some valid PDFs arrive with a filename that has no .pdf extension.
  // Ask the server for its content type before choosing the renderer.
  if (!mime) {
    try {
      const probe = await fetch(fileUrl, { method: "HEAD", signal: previewAbortController.signal });
      const contentType = probe.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("application/pdf")) mime = "application/pdf";
      else if (contentType) mime = contentType.split(";")[0].trim().toLowerCase();
    } catch (probeErr) {
      if (probeErr?.name === "AbortError") return;
    }
  }

  if (mime === "application/pdf") {
    document.querySelector("#previewOverlay .preview-card")?.classList.add("pdf-preview-active");
    try {
      const response = await fetch(fileUrl, {signal: previewAbortController.signal});
      if (!response.ok) throw new Error("Could not load the PDF.");
      // Bail out if the user closed this preview (or opened a different
      // one) while we were waiting on the network — otherwise this stale
      // response could still land in the (now different) preview area.
      if (token !== currentPreviewToken) return;

      const blob = await response.blob();
      const pdfjsLib = await loadPdfJs();
      const data = await blob.arrayBuffer();
      // Without cMapUrl, PDF.js can't render CID-keyed fonts often found in
      // LaTeX-produced PDFs (common for statistics notes/papers), which made
      // the math text in them invisible.
      const pdf = await pdfjsLib.getDocument({
        data,
        cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked: true
      }).promise;
      if (token !== currentPreviewToken) {
        pdf.destroy(); // The user clicked away while this was loading — free it immediately.
        return;
      }
      activePdfDoc = pdf; // Saved so closePreview() can destroy it later.

      body.innerHTML = `
        <div class="pdf-preview-shell">
          <div class="pdf-preview-toolbar">
            <div class="pdf-page-controls">
              <button type="button" class="pdf-page-btn" id="pdfPrevBtn" aria-label="Previous page">‹</button>
              <span class="pdf-page-info" id="pdfPageInfo">Page 1 / ${pdf.numPages}</span>
              <button type="button" class="pdf-page-btn" id="pdfNextBtn" aria-label="Next page">›</button>
            </div>
            <div class="pdf-toolbar-actions">
              <div class="pdf-zoom-controls" aria-label="Zoom controls">
                <button type="button" class="pdf-page-btn" id="pdfZoomOutBtn" aria-label="Zoom out" title="Zoom out">−</button>
                <span class="pdf-zoom-level" id="pdfZoomLevel">100%</span>
                <button type="button" class="pdf-page-btn" id="pdfZoomInBtn" aria-label="Zoom in" title="Zoom in">+</button>
                <button type="button" class="pdf-page-btn" id="pdfZoomResetBtn" aria-label="Reset zoom" title="Reset zoom">1:1</button>
              </div>
              <button type="button" class="pdf-page-btn" id="pdfDownloadBtn" aria-label="Download" title="Download">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>
              </button>
              <button type="button" class="pdf-page-btn" id="pdfPrintBtn" aria-label="Print" title="Print">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 14H4a1 1 0 0 1-1-1v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-2"/></svg>
              </button>
            </div>
          </div>
          <div class="pdf-canvas-wrap" id="pdfCanvasWrap" aria-label="Scrollable PDF preview">
            <div class="pdf-pages" id="pdfPages"></div>
          </div>
          <div class="pdf-open-new-tab-bottom">
            <button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button>
          </div>
        </div>`;

      const pageInfo = document.getElementById("pdfPageInfo");
      const prevBtn = document.getElementById("pdfPrevBtn");
      const nextBtn = document.getElementById("pdfNextBtn");
      const canvasWrap = document.getElementById("pdfCanvasWrap");
      const pagesHost = document.getElementById("pdfPages");
      const openNewTabBtn = body.querySelector(".pdf-open-new-tab-btn");
      if (openNewTabBtn) {
        openNewTabBtn.onclick = () => openPdfInNewTab(fileUrl);
      }
      const printBtn = document.getElementById("pdfPrintBtn");
      if (printBtn) {
        printBtn.onclick = () => printPdfBlob(blob, printBtn, entry.filename);
      }
      const downloadBtn = document.getElementById("pdfDownloadBtn");
      if (downloadBtn) {
        downloadBtn.onclick = () => downloadEntry(entry, downloadBtn);
      }
      const zoomOutBtn = document.getElementById("pdfZoomOutBtn");
      const zoomInBtn = document.getElementById("pdfZoomInBtn");
      const zoomResetBtn = document.getElementById("pdfZoomResetBtn");
      const zoomLevel = document.getElementById("pdfZoomLevel");
      let zoomFactor = 1;
      const ZOOM_MIN = 0.5;
      const ZOOM_MAX = 3;
      const ZOOM_STEP = 0.25;
      function updateZoomControls() {
        if (zoomLevel) zoomLevel.textContent = `${Math.round(zoomFactor * 100)}%`;
        if (zoomOutBtn) zoomOutBtn.disabled = zoomFactor <= ZOOM_MIN;
        if (zoomInBtn) zoomInBtn.disabled = zoomFactor >= ZOOM_MAX;
      }
      let currentPage = 1;
      let pageElements = [];
      let pageMeta = [];
      let resizeTimer = null;
      let rendering = false;
      const UNLOAD_DISTANCE = 6; // pages further than this from the current page get their canvas freed
      let loadObserver = null;
      let observer = null;
      body._pdfRenderTasks = new Set();

      function updateControls() {
        pageInfo.textContent = `Page ${currentPage} / ${pdf.numPages}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= pdf.numPages;
        pageElements.forEach((el, i) => el.classList.toggle("pdf-page-current", i + 1 === currentPage));
      }

      // Build lightweight placeholders for every page (no rendering yet) so the
      // scroll track has the right total height and swiping feels native.
      // Actual canvases are only painted in renderPage(), which the
      // IntersectionObserver below calls once a placeholder nears the viewport.
      async function renderAllPages() {
        if (rendering) {
          await new Promise(resolve => {
            const wait = () => rendering ? setTimeout(wait, 20) : resolve();
            wait();
          });
        }
        rendering = true;

        // Cancel any render tasks still tracked from the *previous* call
        // before wiping pageMeta/pagesHost out from under them. The wait
        // above only guarantees the last renderAllPages() call's own
        // (synchronous) setup phase finished — individual per-page
        // render tasks kicked off via the IntersectionObserver run
        // independently and could still be active. body._pdfRenderTasks
        // was previously only ever cleared in closePreview(), so zooming
        // or resizing while the preview stayed open left those old tasks
        // running in the background, burning CPU/GPU against canvases
        // that no longer existed in the DOM, for as long as the preview
        // stayed open at the new zoom level.
        if (body._pdfRenderTasks) {
          for (const task of body._pdfRenderTasks) {
            try { task.cancel(); } catch (e) {}
          }
          body._pdfRenderTasks.clear();
        }

        pagesHost.innerHTML = "";
        pageElements = [];
        pageMeta = [];

        try {
          const availableWidth = Math.max(220, canvasWrap.clientWidth - 26);

          // Most PDFs use a uniform page size, so size every placeholder off
          // page 1's dimensions. If an individual page turns out to differ,
          // renderPage() corrects that page's box once it actually renders.
          const firstPage = await pdf.getPage(1);
          if (!pagesHost.isConnected) return; // Prevent detached rendering
          const firstBase = firstPage.getViewport({ scale: 1 });
          const placeholderScale = Math.min(3, (availableWidth / firstBase.width) * zoomFactor);
          const placeholderW = Math.floor(firstBase.width * placeholderScale);
          const placeholderH = Math.floor(firstBase.height * placeholderScale);

          for (let num = 1; num <= pdf.numPages; num++) {
            const container = document.createElement("div");
            container.className = "pdf-page pdf-page-placeholder";
            container.dataset.page = String(num);
            container.style.width = `${placeholderW}px`;
            container.style.height = `${placeholderH}px`;
            pagesHost.appendChild(container);
            pageElements.push(container);
            pageMeta.push({ num, container, canvas: null, rendered: false, rendering: false });
          }

          updateControls();
        } catch (err) {
          console.error("Could not prepare PDF pages:", err);
          if (activePdfDoc === pdf) {
            try { await pdf.destroy(); } catch {}
            activePdfDoc = null;
          }
          throw err;
        } finally {
          rendering = false;
        }
      }

      // Paints a single page's canvas into its placeholder. Safe to call
      // repeatedly; no-ops once rendered or while already rendering.
      async function renderPage(meta) {
        if (!meta || meta.rendered || meta.rendering) return;
        meta.rendering = true;
        try {
          const page = await pdf.getPage(meta.num);
          const availableWidth = Math.max(220, canvasWrap.clientWidth - 26);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(3, (availableWidth / baseViewport.width) * zoomFactor);
          const viewport = page.getViewport({ scale });
          const rawDpr = window.devicePixelRatio || 1;
          const isSmallViewport = window.innerWidth <= 700;
          const maxDimension = isSmallViewport ? 2048 : 4096;
          const maxPixels = isSmallViewport ? 6_000_000 : 16_000_000;
          let outputScale = Math.min(rawDpr, 2, maxDimension / Math.max(viewport.width, viewport.height));
          const estimatedPixels = viewport.width * viewport.height * outputScale * outputScale;
          if (estimatedPixels > maxPixels) outputScale *= Math.sqrt(maxPixels / estimatedPixels);
          outputScale = Math.max(1, Math.min(2, outputScale));

          const canvas = document.createElement("canvas");
          canvas.className = "pdf-page-canvas";
          canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
          canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.setAttribute("aria-label", `PDF page ${meta.num}`);

          const ctx = canvas.getContext("2d", { alpha: false });
          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
          });
          meta.renderTask = renderTask;
          body._pdfRenderTasks?.add(renderTask);
          await renderTask.promise;
          body._pdfRenderTasks?.delete(renderTask);

          meta.container.style.width = `${Math.floor(viewport.width)}px`;
          meta.container.style.height = `${Math.floor(viewport.height)}px`;
          meta.container.classList.remove("pdf-page-placeholder");
          meta.container.innerHTML = "";
          meta.container.appendChild(canvas);
          const textLayer = document.createElement("div");
          textLayer.className = "pdf-text-layer";
          textLayer.setAttribute("aria-label", `Selectable text for PDF page ${meta.num}`);
          meta.container.appendChild(textLayer);
          try {
            const textContent = await page.getTextContent();
            if (pdfjsLib.renderTextLayer) {
              pdfjsLib.renderTextLayer({textContent, container:textLayer, viewport, textDivs:[]});
            }
          } catch (textErr) {
            console.warn(`Could not build text layer for PDF page ${meta.num}:`, textErr);
          }
          meta.canvas = canvas;
          meta.rendered = true;
        } catch (err) {
          if (err?.name === "RenderingCancelledException") {
            // Expected during normal memory sweeping (unloadPage() cancels
            // in-flight renders); not a real error.
            meta.rendering = false;
            return;
          }
          console.error(`Could not render PDF page ${meta.num}:`, err);
          if (token === currentPreviewToken && meta.container?.isConnected) {
            meta.container.classList.remove("pdf-page-placeholder");
            meta.container.innerHTML = `<div class="preview-fallback" style="padding:24px 12px;">Page ${meta.num} could not be rendered.<br/><small>The PDF may be damaged.</small></div>`;
          }
          meta.rendering = false;
        } finally {
          meta.rendering = false;
        }
      }

      // Frees a rendered page's canvas memory and swaps it back to an empty
      // placeholder of the same size, so scroll position doesn't jump.
      function unloadPage(meta) {
        if (meta.renderTask) {
          try { meta.renderTask.cancel(); } catch (e) {}
          body._pdfRenderTasks?.delete(meta.renderTask);
          meta.renderTask = null;
        }
        if (meta.canvas) {
          meta.canvas.width = 0;
          meta.canvas.height = 0;
        }
        meta.container.innerHTML = "";
        meta.container.classList.add("pdf-page-placeholder");
        meta.canvas = null;
        meta.rendered = false;
        meta.rendering = false;
      }

      // Keeps memory bounded on long documents: only pages within
      // UNLOAD_DISTANCE of the current page stay painted.
      function sweepUnrendered() {
        for (const meta of pageMeta) {
          if (meta.rendered && Math.abs(meta.num - currentPage) > UNLOAD_DISTANCE) {
            unloadPage(meta);
          }
        }
      }

      async function applyZoom(nextZoom) {
        const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom));
        if (Math.abs(clamped - zoomFactor) < 0.001) return;
        zoomFactor = clamped;
        updateZoomControls();
        const keepPage = currentPage;
        loadObserver?.disconnect();
        observer?.disconnect();
        if (body._pdfZoomTimer) clearTimeout(body._pdfZoomTimer);
        body._pdfZoomTimer = setTimeout(async () => {
          body._pdfZoomTimer = null;
          await renderAllPages();
          pageElements.forEach(el => {
            loadObserver.observe(el);
            observer.observe(el);
          });
          setTimeout(() => goToPage(Math.min(keepPage, pageElements.length)), 0);
        }, 150);
      }

      function goToPage(num) {
        const meta = pageMeta[num - 1];
        if (!meta) return;
        currentPage = num;
        updateControls();
        renderPage(meta); // in case it's outside the preload margin (e.g. jumping via buttons)
        meta.container.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      updateZoomControls();
      if (zoomOutBtn) zoomOutBtn.onclick = () => applyZoom(zoomFactor - ZOOM_STEP);
      if (zoomInBtn) zoomInBtn.onclick = () => applyZoom(zoomFactor + ZOOM_STEP);
      if (zoomResetBtn) zoomResetBtn.onclick = () => applyZoom(1);

      prevBtn.onclick = () => goToPage(Math.max(1, currentPage - 1));
      nextBtn.onclick = () => goToPage(Math.min(pageElements.length, currentPage + 1));

      // Lazily paints pages once they scroll near the viewport, instead of
      // rendering the whole document up front. rootMargin gives a generous
      // preload buffer above/below so pages are ready just before they're seen.
      loadObserver = new IntersectionObserver((entries) => {
        for (const item of entries) {
          if (!item.isIntersecting) continue;
          const meta = pageMeta[Number(item.target.dataset.page) - 1];
          renderPage(meta);
        }
      }, { root: canvasWrap, rootMargin: "1000px 0px 1000px 0px", threshold: 0.01 });

      // Tracks which page is centered for the toolbar indicator, and triggers
      // freeing far-away pages so long PDFs don't keep growing memory use.
      observer = new IntersectionObserver((entries) => {
        let best = null;
        for (const item of entries) {
          if (!item.isIntersecting) continue;
          if (!best || item.intersectionRatio > best.intersectionRatio) best = item;
        }
        if (best) {
          currentPage = Number(best.target.dataset.page);
          updateControls();
          sweepUnrendered();
        }
      }, { root: canvasWrap, threshold: [0.15, 0.4, 0.65, 0.9] });

      const onPdfKeydown = (event) => {
        if (!document.getElementById("previewOverlay")?.contains(body)) return;
        if (!(event.ctrlKey || event.metaKey)) return;
        if (event.key === "+" || event.key === "=") { event.preventDefault(); applyZoom(zoomFactor + ZOOM_STEP); }
        else if (event.key === "-") { event.preventDefault(); applyZoom(zoomFactor - ZOOM_STEP); }
        else if (event.key === "0") { event.preventDefault(); applyZoom(1); }
      };
      document.addEventListener("keydown", onPdfKeydown);
      body._pdfKeydownHandler = onPdfKeydown;

      // Mouse-wheel zoom inside the PDF preview.
      // Ctrl/Cmd + wheel follows the normal browser zoom gesture without
      // interfering with ordinary vertical/horizontal PDF scrolling.
      const onPdfWheel = (event) => {
        if (!document.getElementById("previewOverlay")?.contains(body)) return;
        if (!(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        applyZoom(zoomFactor + direction * ZOOM_STEP);
      };
      canvasWrap.addEventListener("wheel", onPdfWheel, { passive: false });
      body._pdfWheelHandler = onPdfWheel;

      await renderAllPages();
      pageElements.forEach(el => {
        loadObserver.observe(el);
        observer.observe(el);
      });

      let lastWidth = canvasWrap.clientWidth;
      const onResize = () => {
        if (canvasWrap.clientWidth === lastWidth) return; // Ignore vertical-only resizing (mobile URL bar)
        lastWidth = canvasWrap.clientWidth;
        clearTimeout(body._pdfResizeTimer);
        body._pdfResizeTimer = setTimeout(async () => {
          const keepPage = currentPage;
          loadObserver.disconnect();
          observer.disconnect();
          await renderAllPages();
          pageElements.forEach(el => {
            loadObserver.observe(el);
            observer.observe(el);
          });
          setTimeout(() => goToPage(Math.min(keepPage, pageElements.length)), 0);
        }, 180);
      };
      window.addEventListener("resize", onResize);
      body._pdfResizeHandler = onResize;
      body._pdfObserver = observer;
      body._pdfLoadObserver = loadObserver;
    } catch (err) {
      console.error("PDF preview error:", err);
      body.innerHTML = `
        <div class="preview-fallback">
          Couldn't render this PDF inside the preview.
          <br/>
          <div class="preview-pdf-actions">
            <button type="button" class="submit-btn pdf-open-new-tab-btn">↗ Open PDF</button>
            <button class="submit-btn" id="fallbackDlBtn" style="width:auto;padding:9px 18px;">⬇ Download</button>
          </div>
        </div>`;
      const fallbackBtnGeneric = document.getElementById("fallbackDlBtn");
      if (fallbackBtnGeneric) fallbackBtnGeneric.onclick = () => downloadEntry(entry, fallbackBtnGeneric);
      const openNewTabBtn = body.querySelector(".pdf-open-new-tab-btn");
      if (openNewTabBtn) {
        openNewTabBtn.onclick = () => openPdfInNewTab(fileUrl);
      }
    }
    return;
  }

  if (previewAbortController) previewAbortController.abort();
  previewAbortController = new AbortController();

  try {
    const response = await fetch(fileUrl, { signal: previewAbortController.signal });
    if (!response.ok) throw new Error("Could not load a preview for this file.");
    const blob = await response.blob();
    if (token !== currentPreviewToken) return; // closed while downloading
    const actualMime = guessMime(entry.filename, blob.type);
    const url = URL.createObjectURL(blob);

    if (actualMime.startsWith("image/")) {
      body.innerHTML = `
        <div class="image-preview-shell">
          <div class="image-preview-toolbar" aria-label="Image zoom controls">
            <button type="button" class="pdf-page-btn" id="imageZoomOutBtn" aria-label="Zoom out" title="Zoom out">−</button>
            <span class="image-zoom-level" id="imageZoomLevel">100%</span>
            <button type="button" class="pdf-page-btn" id="imageZoomInBtn" aria-label="Zoom in" title="Zoom in">+</button>
            <button type="button" class="pdf-page-btn" id="imageZoomResetBtn" aria-label="Reset zoom" title="Reset zoom">1:1</button>
          </div>
          <div class="image-preview-wrap" id="imagePreviewWrap"></div>
        </div>`;
      const img = document.createElement("img");
      img.src = url;
      img.alt = entry.title || entry.filename || "Preview";
      document.getElementById("imagePreviewWrap").appendChild(img);
      let imageZoom = 1;
      const imageZoomLevel = document.getElementById("imageZoomLevel");
      const imageZoomOut = document.getElementById("imageZoomOutBtn");
      const imageZoomIn = document.getElementById("imageZoomInBtn");
      const imageZoomReset = document.getElementById("imageZoomResetBtn");
      const updateImageZoom = () => {
        img.style.transform = `scale(${imageZoom})`;
        if (imageZoomLevel) imageZoomLevel.textContent = `${Math.round(imageZoom * 100)}%`;
        if (imageZoomOut) imageZoomOut.disabled = imageZoom <= 0.5;
        if (imageZoomIn) imageZoomIn.disabled = imageZoom >= 3;
      };
      const setImageZoom = (value) => { imageZoom = Math.max(0.5, Math.min(3, value)); updateImageZoom(); };
      imageZoomOut.onclick = () => setImageZoom(imageZoom - 0.25);
      imageZoomIn.onclick = () => setImageZoom(imageZoom + 0.25);

      // Mouse-wheel zoom for image previews.
      const imagePreviewWrap = document.getElementById("imagePreviewWrap");
      const onImageWheel = (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        setImageZoom(imageZoom + direction * 0.25);
      };
      imagePreviewWrap.addEventListener("wheel", onImageWheel, { passive: false });
      body._imageWheelHandler = onImageWheel;
      imageZoomReset.onclick = () => setImageZoom(1);
      updateImageZoom();
      activeObjectUrl = url;
      img.onload = () => { URL.revokeObjectURL(url); if (activeObjectUrl === url) activeObjectUrl = null; };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (activeObjectUrl === url) activeObjectUrl = null;
        if (token !== currentPreviewToken) return;
        body.innerHTML = `
          <div class="preview-fallback">
            Couldn't display this image.<br/>
            <button class="submit-btn" id="fallbackDlBtn" style="width:auto;padding:9px 18px;">⬇ Download instead</button>
          </div>`;
        const fallbackBtnGeneric = document.getElementById("fallbackDlBtn");
        if (fallbackBtnGeneric) fallbackBtnGeneric.onclick = () => downloadEntry(entry, fallbackBtnGeneric);
      };
    } else {
      URL.revokeObjectURL(url);
      body.innerHTML = `
        <div class="preview-fallback">
          Preview isn't supported for this file type yet.<br/>
          <button class="submit-btn" id="fallbackDlBtn" style="width:auto;padding:9px 18px;">⬇ Download instead</button>
        </div>`;
      const fallbackBtnGeneric = document.getElementById("fallbackDlBtn");
      if (fallbackBtnGeneric) fallbackBtnGeneric.onclick = () => downloadEntry(entry, fallbackBtnGeneric);
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // preview was closed; nothing to show
    body.innerHTML = `
      <div class="preview-fallback">
        Couldn't load a preview for this file.<br/>
        <button class="submit-btn" id="fallbackDlBtn" style="width:auto;padding:9px 18px;">⬇ Download instead</button>
      </div>`;
    const fallbackBtnGeneric = document.getElementById("fallbackDlBtn");
      if (fallbackBtnGeneric) fallbackBtnGeneric.onclick = () => downloadEntry(entry, fallbackBtnGeneric);
  }
}

