(function () {
  "use strict";

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;
  const PAGE_GAP = 14;
  const PAGE_PAD = 12;
  const DPR_MAX = 1.75;
  const ENGINE_ID = "native-scroll-pinch-v2";

  let state = null;
  let serial = 0;
  let printSerial = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const escMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapeHtml = (v) => String(v || "").replace(/[&<>"']/g, (c) => escMap[c]);

  function isPdf(entry, blob) {
    const name = String(entry?.filename || entry?.title || "").toLowerCase();
    return name.endsWith(".pdf") || String(blob?.type || "").toLowerCase().includes("pdf");
  }

  function pdfName(entry) {
    const raw = String(entry?.title || entry?.filename || "Document")
      .replace(/\.pdf$/i, "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\.+$/g, "")
      .trim();
    return (raw || "Document") + ".pdf";
  }

  function installCss() {
    let style = document.getElementById("statArchivePreviewNativeV2Css");
    if (style) return;

    style = document.createElement("style");
    style.id = "statArchivePreviewNativeV2Css";
    style.textContent = `
#previewOverlay .preview-card.sa-reader-active{
  width:min(1120px,calc(100vw - 24px))!important;
  height:min(900px,calc(100dvh - 24px))!important;
  max-width:none!important;
  max-height:none!important;
  padding:16px!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
#previewOverlay .preview-card.sa-reader-active>.form-header{
  flex:0 0 auto!important;
  margin-bottom:10px!important;
}
#previewOverlay .preview-card.sa-reader-active #previewBody{
  flex:1 1 auto!important;
  min-height:0!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  display:block!important;
}
.sa-reader{
  width:100%;height:100%;min-height:0;
  display:flex;flex-direction:column;
  background:var(--bg,#070a0f);color:var(--text,#f5f7fb);
}
.sa-reader-toolbar{
  flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  gap:8px;flex-wrap:wrap;padding:8px 10px;
  border:1px solid var(--line,rgba(148,163,184,.14));border-radius:10px 10px 0 0;
  background:var(--panel-solid,#0f141d);
}
.sa-reader-group{display:flex;align-items:center;gap:6px;min-width:0}
.sa-reader-btn{
  min-width:34px;height:34px;padding:0 9px;
  border:1px solid var(--line-strong,rgba(148,163,184,.24));border-radius:8px;
  background:var(--panel-2,#121925);color:var(--text,#f5f7fb);
  font:700 12px 'JetBrains Mono',monospace;line-height:1;
  display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.sa-reader-btn:disabled{opacity:.35;cursor:default}
.sa-reader-info,.sa-reader-zoom{
  white-space:nowrap;color:var(--muted,#8b97aa);
  font:600 11px 'JetBrains Mono',monospace;
}
.sa-reader-zoom{min-width:48px;text-align:center}
.sa-reader-viewport{
  position:relative;flex:1 1 auto;min-height:0;width:100%;
  overflow:auto!important;-webkit-overflow-scrolling:touch!important;
  overscroll-behavior:contain!important;
  touch-action:pan-x pan-y!important;
  border-left:1px solid var(--line,rgba(148,163,184,.14));
  border-right:1px solid var(--line,rgba(148,163,184,.14));
  background:#080c12;
  scrollbar-gutter:stable both-edges;
  overflow-anchor:none!important;
}
.sa-reader-sizer{position:relative;min-width:100%;min-height:100%;overflow-anchor:none!important}
.sa-reader-surface{
  position:absolute;left:0;top:0;transform-origin:0 0;
  will-change:transform;overflow-anchor:none!important;
}
.sa-reader-page{
  position:absolute;background:#fff;overflow:hidden;
  box-shadow:0 2px 12px rgba(0,0,0,.28);overflow-anchor:none!important;
}
.sa-reader-page canvas{display:block;width:100%;height:100%;pointer-events:none}
.sa-reader-page.is-placeholder:after{
  content:'Loading page…';position:absolute;inset:0;display:grid;place-items:center;
  color:#8793a6;background:#eef1f4;font:600 10px 'JetBrains Mono',monospace;
}
.sa-reader-status{
  position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:5;
  max-width:calc(100% - 24px);padding:6px 10px;border-radius:999px;
  background:rgba(8,12,18,.78);color:#aab5c5;
  font:600 10px 'JetBrains Mono',monospace;pointer-events:none;
  opacity:0;transition:opacity .18s ease;
}
.sa-reader-status.show{opacity:1}
.sa-reader-bottom{
  flex:0 0 auto;padding:8px 10px;
  border:1px solid var(--line,rgba(148,163,184,.14));border-radius:0 0 10px 10px;
  background:var(--panel-solid,#0f141d);
}
.sa-reader-open{width:100%;min-height:40px;margin:0!important}
.sa-reader-loading{height:100%;display:grid;place-items:center;padding:28px;color:var(--muted,#8b97aa);font:600 11px 'JetBrains Mono',monospace}
body[data-theme="light"] .sa-reader-viewport{background:#e9e4da}
body[data-theme="light"] .sa-reader-toolbar,body[data-theme="light"] .sa-reader-bottom{background:#f7f3e9}
body[data-theme="light"] .sa-reader-btn{background:#fffaf1;color:#27302d;border-color:#ddd6c8}
body[data-theme="light"] .sa-reader-info,body[data-theme="light"] .sa-reader-zoom{color:#59635e}
body[data-theme="light"] .sa-reader-status{background:rgba(255,250,241,.88);color:#59635e}
@media(max-width:700px){
  #previewOverlay{padding:0!important;align-items:stretch!important}
  #previewOverlay .preview-card.sa-reader-active{
    width:100vw!important;height:100dvh!important;max-height:none!important;
    margin:0!important;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom))!important;
    border-radius:0!important;
  }
  .sa-reader-toolbar{padding:7px 7px;gap:5px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
  .sa-reader-toolbar::-webkit-scrollbar{display:none}
  .sa-reader-group{flex:0 0 auto}
  .sa-reader-btn{min-width:32px;height:32px;padding:0 7px}
  .sa-reader-info,.sa-reader-zoom{font-size:10px}
  .sa-reader-bottom{padding:7px}
}
`;
    document.head.appendChild(style);
  }

  function setReaderActive(on) {
    document.querySelector("#previewOverlay .preview-card")?.classList.toggle("sa-reader-active", !!on);
  }

  function cleanup() {
    const s = state;
    state = null;
    if (!s) return;

    try { s.abort?.abort(); } catch (_) {}
    try { s.resizeObserver?.disconnect(); } catch (_) {}
    if (s.scrollRaf) cancelAnimationFrame(s.scrollRaf);
    if (s.renderTimer) clearTimeout(s.renderTimer);
    if (s.statusTimer) clearTimeout(s.statusTimer);
    if (s.mousePan?.raf) cancelAnimationFrame(s.mousePan.raf);
    for (const task of s.tasks?.values?.() || []) {
      try { task.cancel(); } catch (_) {}
    }
    try { s.pdf?.destroy?.(); } catch (_) {}
  }

  function closePreview() {
    serial++;
    cleanup();
    const overlay = document.getElementById("previewOverlay");
    const body = document.getElementById("previewBody");
    if (overlay) overlay.style.display = "none";
    if (body) body.innerHTML = "";
    setReaderActive(false);
    document.body.classList.remove("no-scroll");
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        const comma = value.indexOf(",");
        comma >= 0 ? resolve(value.slice(comma + 1)) : reject(new Error("Could not encode PDF"));
      };
      reader.onerror = () => reject(reader.error || new Error("Could not read PDF"));
      reader.readAsDataURL(blob);
    });
  }

  async function openBlob(blob, name) {
    if (window.AndroidBridge && typeof window.AndroidBridge.openFile === "function") {
      window.AndroidBridge.openFile(await blobToBase64(blob), name, "application/pdf");
      return;
    }
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener");
    if (!win) alert("Popup blocked. Please allow popups for this site.");
    setTimeout(() => URL.revokeObjectURL(url), 300000);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function printBlob(blob, button, name) {
    const token = ++printSerial;
    const old = button?.innerHTML;
    if (button) { button.disabled = true; button.textContent = "…"; }
    try {
      document.getElementById("saPreviewPrintFrame")?.remove();
      const url = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      frame.id = "saPreviewPrintFrame";
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
      frame.src = url;
      frame.onload = () => {
        try {
          if (name) frame.contentDocument.title = name;
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch (err) { console.error(err); }
        if (token === printSerial && button) { button.disabled = false; button.innerHTML = old; }
        setTimeout(() => {
          try { frame.remove(); URL.revokeObjectURL(url); } catch (_) {}
        }, 300000);
      };
      document.body.appendChild(frame);
    } catch (err) {
      if (button) { button.disabled = false; button.innerHTML = old; }
      console.error(err);
    }
  }

  async function buildPdf(entry, blob, token) {
    const body = document.getElementById("previewBody");
    if (!body) return;

    const lib = await window.loadPdfJs();
    const pdf = await lib.getDocument({
      data: await blob.arrayBuffer(),
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true
    }).promise;

    if (token !== serial) {
      try { pdf.destroy(); } catch (_) {}
      return;
    }

    body.innerHTML = `
      <div class="sa-reader" data-preview-engine="${ENGINE_ID}">
        <div class="sa-reader-toolbar">
          <div class="sa-reader-group">
            <button type="button" class="sa-reader-btn" id="saReaderPrev" aria-label="Previous page">‹</button>
            <span class="sa-reader-info" id="saReaderInfo">Page 1 / ${pdf.numPages}</span>
            <button type="button" class="sa-reader-btn" id="saReaderNext" aria-label="Next page">›</button>
          </div>
          <div class="sa-reader-group">
            <button type="button" class="sa-reader-btn" id="saReaderOut" aria-label="Zoom out">−</button>
            <span class="sa-reader-zoom" id="saReaderZoom">100%</span>
            <button type="button" class="sa-reader-btn" id="saReaderIn" aria-label="Zoom in">+</button>
            <button type="button" class="sa-reader-btn" id="saReaderReset" aria-label="Reset zoom">1:1</button>
            <button type="button" class="sa-reader-btn" id="saReaderDownload" aria-label="Download" title="Download">↓</button>
            <button type="button" class="sa-reader-btn" id="saReaderPrint" aria-label="Print" title="Print">⎙</button>
          </div>
        </div>
        <div class="sa-reader-viewport" id="saReaderViewport">
          <div class="sa-reader-status" id="saReaderStatus">Preparing document…</div>
          <div class="sa-reader-sizer" id="saReaderSizer">
            <div class="sa-reader-surface" id="saReaderSurface"></div>
          </div>
        </div>
        <div class="sa-reader-bottom">
          <button type="button" class="submit-btn sa-reader-open" id="saReaderOpen">↗ Open PDF</button>
        </div>
      </div>`;

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const viewport = document.getElementById("saReaderViewport");
    const sizer = document.getElementById("saReaderSizer");
    const surface = document.getElementById("saReaderSurface");
    const info = document.getElementById("saReaderInfo");
    const zoomLabel = document.getElementById("saReaderZoom");
    const status = document.getElementById("saReaderStatus");
    const prev = document.getElementById("saReaderPrev");
    const next = document.getElementById("saReaderNext");
    const zoomOut = document.getElementById("saReaderOut");
    const zoomIn = document.getElementById("saReaderIn");
    const reset = document.getElementById("saReaderReset");
    const download = document.getElementById("saReaderDownload");
    const print = document.getElementById("saReaderPrint");
    const open = document.getElementById("saReaderOpen");

    if (!viewport || !sizer || !surface || !info || !zoomLabel || !status || !prev || !next || !zoomOut || !zoomIn || !reset || !download || !print || !open) {
      throw new Error("Preview UI initialization failed");
    }

    const firstPage = await pdf.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1 });
    const tasks = new Map();
    const rendered = new Set();
    let fitWidth = Math.max(220, viewport.clientWidth - PAGE_PAD * 2);
    const firstHeight = fitWidth * firstViewport.height / firstViewport.width;
    const metas = new Array(pdf.numPages);
    let worldY = PAGE_PAD;

    for (let i = 0; i < pdf.numPages; i++) {
      metas[i] = {
        index: i,
        num: i + 1,
        rawW: firstViewport.width,
        rawH: firstViewport.height,
        known: i === 0,
        x: PAGE_PAD,
        y: worldY,
        w: fitWidth,
        h: firstHeight,
        el: null,
        canvas: null,
        renderedAt: 0
      };
      worldY += firstHeight + PAGE_GAP;
    }

    const s = {
      pdf,
      blob,
      abort: state?.abort || new AbortController(),
      viewport,
      sizer,
      surface,
      info,
      zoomLabel,
      status,
      prev,
      next,
      zoomOut,
      zoomIn,
      reset,
      download,
      print,
      open,
      metas,
      tasks,
      rendered,
      fitWidth,
      worldW: fitWidth + PAGE_PAD * 2,
      worldH: worldY + PAGE_PAD - PAGE_GAP,
      zoom: 1,
      current: 1,
      pinch: null,
      handoff: null,
      scrollRaf: 0,
      renderTimer: 0,
      statusTimer: 0,
      resizeObserver: null,
      mousePan: null,
      lastViewportWidth: viewport.clientWidth
    };
    state = s;

    function viewportSize() {
      return { w: Math.max(1, viewport.clientWidth), h: Math.max(1, viewport.clientHeight) };
    }

    function offsetX(z = s.zoom) {
      return Math.max(0, (viewportSize().w - s.worldW * z) / 2);
    }

    function maxScrollLeft(z = s.zoom) {
      return Math.max(0, Math.max(viewportSize().w, s.worldW * z) - viewportSize().w);
    }

    function maxScrollTop(z = s.zoom) {
      return Math.max(0, Math.max(viewportSize().h, s.worldH * z) - viewportSize().h);
    }

    function pageIndexAt(worldTop) {
      let lo = 0;
      let hi = metas.length - 1;
      let best = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (worldTop >= metas[mid].y) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return best;
    }

    function captureAnchor(localY = viewportSize().h * 0.45) {
      const world = (viewport.scrollTop + localY) / s.zoom;
      const index = pageIndexAt(world);
      const m = metas[index];
      const frac = clamp((world - m.y) / Math.max(1, m.h), 0, 1);
      return { index, frac, localY };
    }

    function restoreAnchor(anchor) {
      if (!anchor) return;
      const m = metas[clamp(anchor.index, 0, metas.length - 1)];
      const world = m.y + m.h * anchor.frac;
      viewport.scrollTop = clamp(world * s.zoom - anchor.localY, 0, maxScrollTop());
    }

    function updateSizerAndTransform() {
      const size = viewportSize();
      sizer.style.width = Math.max(size.w, s.worldW * s.zoom) + "px";
      sizer.style.height = Math.max(size.h, s.worldH * s.zoom) + "px";
      surface.style.width = s.worldW + "px";
      surface.style.height = s.worldH + "px";
      surface.style.transform = `matrix(${s.zoom},0,0,${s.zoom},${offsetX()},0)`;
      zoomLabel.textContent = Math.round(s.zoom * 100) + "%";
      zoomOut.disabled = s.zoom <= MIN_ZOOM + 0.001;
      zoomIn.disabled = s.zoom >= MAX_ZOOM - 0.001;
    }

    function reflow(startIndex = 0, anchor = null) {
      let y = startIndex > 0 ? metas[startIndex - 1].y + metas[startIndex - 1].h + PAGE_GAP : PAGE_PAD;
      for (let i = startIndex; i < metas.length; i++) {
        const m = metas[i];
        m.y = y;
        if (m.el) {
          m.el.style.top = m.y + "px";
          m.el.style.width = m.w + "px";
          m.el.style.height = m.h + "px";
        }
        y += m.h + PAGE_GAP;
      }
      s.worldH = y + PAGE_PAD - PAGE_GAP;
      updateSizerAndTransform();
      restoreAnchor(anchor);
    }

    function updateCurrent(force) {
      s.current = force || pageIndexAt((viewport.scrollTop + viewportSize().h * 0.45) / s.zoom) + 1;
      info.textContent = `Page ${s.current} / ${pdf.numPages}`;
      prev.disabled = s.current <= 1;
      next.disabled = s.current >= pdf.numPages;
    }

    function showStatus(text, ms = 900) {
      if (!status) return;
      if (s.statusTimer) clearTimeout(s.statusTimer);
      status.textContent = text;
      status.classList.add("show");
      s.statusTimer = setTimeout(() => status.classList.remove("show"), ms);
    }

    const fragment = document.createDocumentFragment();
    for (const m of metas) {
      const el = document.createElement("div");
      el.className = "sa-reader-page is-placeholder";
      el.dataset.page = String(m.num);
      el.style.cssText = `left:${m.x}px;top:${m.y}px;width:${m.w}px;height:${m.h}px`;
      m.el = el;
      fragment.appendChild(el);
    }
    surface.appendChild(fragment);
    updateSizerAndTransform();
    updateCurrent(1);

    function setMetaFromViewport(m, rawViewport) {
      const newW = s.fitWidth;
      const newH = newW * rawViewport.height / rawViewport.width;
      const changed = !m.known || Math.abs(newH - m.h) > 0.75 || Math.abs(newW - m.w) > 0.75;
      if (!changed) {
        m.known = true;
        m.rawW = rawViewport.width;
        m.rawH = rawViewport.height;
        return false;
      }
      const anchor = captureAnchor();
      m.known = true;
      m.rawW = rawViewport.width;
      m.rawH = rawViewport.height;
      m.w = newW;
      m.h = newH;
      reflow(m.index, anchor);
      return true;
    }

    async function renderPage(m) {
      if (!m || token !== serial || state !== s) return;
      const target = clamp(Math.max(1, s.zoom), 1, MAX_ZOOM);
      if (m.canvas && m.renderedAt >= target * 0.88) return;
      if (tasks.has(m.num)) return;

      try {
        const page = m.num === 1 ? firstPage : await pdf.getPage(m.num);
        if (token !== serial || state !== s) return;
        const rawViewport = page.getViewport({ scale: 1 });
        setMetaFromViewport(m, rawViewport);

        const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
        const fit = s.fitWidth / rawViewport.width;
        const renderViewport = page.getViewport({ scale: fit * target * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(renderViewport.width));
        canvas.height = Math.max(1, Math.floor(renderViewport.height));
        canvas.style.width = m.w + "px";
        canvas.style.height = m.h + "px";

        const ctx = canvas.getContext("2d", { alpha: false });
        const task = page.render({ canvasContext: ctx, viewport: renderViewport });
        tasks.set(m.num, task);
        await task.promise;
        tasks.delete(m.num);

        if (token !== serial || state !== s) return;
        m.el.replaceChildren(canvas);
        m.el.classList.remove("is-placeholder");
        m.canvas = canvas;
        m.renderedAt = target;
        rendered.add(m.num);
      } catch (err) {
        tasks.delete(m.num);
        if (err?.name !== "RenderingCancelledException") console.warn("PDF page render failed", m?.num, err);
      }
    }

    function renderVisible() {
      if (token !== serial || state !== s || s.pinch) return;
      const size = viewportSize();
      const top = Math.max(0, (viewport.scrollTop - size.h * 1.25) / s.zoom);
      const bottom = (viewport.scrollTop + size.h * 2.25) / s.zoom;
      let i = Math.max(0, pageIndexAt(top) - 2);
      for (; i < metas.length; i++) {
        const m = metas[i];
        if (m.y > bottom) break;
        if (m.y + m.h >= top) renderPage(m);
      }

      for (const num of Array.from(rendered)) {
        const m = metas[num - 1];
        if (!m?.canvas) { rendered.delete(num); continue; }
        if (Math.abs(num - s.current) > 18) {
          m.canvas.width = 0;
          m.canvas.height = 0;
          m.el.replaceChildren();
          m.el.classList.add("is-placeholder");
          m.canvas = null;
          m.renderedAt = 0;
          rendered.delete(num);
        }
      }
    }

    function scheduleRender(ms = 60) {
      if (s.renderTimer) clearTimeout(s.renderTimer);
      s.renderTimer = setTimeout(renderVisible, ms);
    }

    function worldAt(localX, localY, z = s.zoom) {
      return {
        x: (viewport.scrollLeft + localX - offsetX(z)) / z,
        y: (viewport.scrollTop + localY) / z
      };
    }

    function commitZoom(localX, localY, nextZoom, anchorWorld = null) {
      const anchor = anchorWorld || worldAt(localX, localY, s.zoom);
      s.zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      updateSizerAndTransform();
      viewport.scrollLeft = clamp(offsetX(s.zoom) + anchor.x * s.zoom - localX, 0, maxScrollLeft());
      viewport.scrollTop = clamp(anchor.y * s.zoom - localY, 0, maxScrollTop());
      updateCurrent();
      scheduleRender(30);
    }

    function localMid(touches) {
      const rect = viewport.getBoundingClientRect();
      const a = touches[0];
      const b = touches[1];
      return {
        x: (a.clientX + b.clientX) / 2 - rect.left,
        y: (a.clientY + b.clientY) / 2 - rect.top,
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      };
    }

    function beginPinch(touches) {
      if (!touches || touches.length < 2) return;
      const mid = localMid(touches);
      if (!mid.d) return;
      s.pinch = {
        startDistance: mid.d,
        startZoom: s.zoom,
        pendingZoom: s.zoom,
        anchorWorld: worldAt(mid.x, mid.y),
        lastX: mid.x,
        lastY: mid.y
      };
      s.handoff = null;
      showStatus(Math.round(s.zoom * 100) + "%", 1200);
    }

    function updatePinch(touches) {
      if (!s.pinch || !touches || touches.length < 2) return;
      const mid = localMid(touches);
      if (!mid.d) return;
      const p = s.pinch;
      p.lastX = mid.x;
      p.lastY = mid.y;
      p.pendingZoom = clamp(p.startZoom * (mid.d / p.startDistance), MIN_ZOOM, MAX_ZOOM);

      const tx = viewport.scrollLeft + mid.x - p.anchorWorld.x * p.pendingZoom;
      const ty = viewport.scrollTop + mid.y - p.anchorWorld.y * p.pendingZoom;
      surface.style.transform = `matrix(${p.pendingZoom},0,0,${p.pendingZoom},${tx},${ty})`;
      zoomLabel.textContent = Math.round(p.pendingZoom * 100) + "%";
      status.textContent = Math.round(p.pendingZoom * 100) + "%";
      status.classList.add("show");
    }

    function finishPinch(remainingTouch = null) {
      const p = s.pinch;
      if (!p) return;
      s.pinch = null;
      commitZoom(p.lastX, p.lastY, p.pendingZoom, p.anchorWorld);
      showStatus(Math.round(s.zoom * 100) + "%", 650);

      if (remainingTouch) {
        s.handoff = {
          id: remainingTouch.identifier,
          lastX: remainingTouch.clientX,
          lastY: remainingTouch.clientY
        };
      } else {
        s.handoff = null;
      }
    }

    viewport.addEventListener("touchstart", (event) => {
      if (event.touches.length >= 2) {
        event.preventDefault();
        beginPinch(event.touches);
      }
    }, { passive: false });

    viewport.addEventListener("touchmove", (event) => {
      if (s.pinch && event.touches.length >= 2) {
        event.preventDefault();
        updatePinch(event.touches);
        return;
      }

      if (s.handoff && event.touches.length === 1) {
        const t = event.touches[0];
        if (t.identifier !== s.handoff.id) return;
        event.preventDefault();
        const dx = t.clientX - s.handoff.lastX;
        const dy = t.clientY - s.handoff.lastY;
        s.handoff.lastX = t.clientX;
        s.handoff.lastY = t.clientY;
        viewport.scrollLeft = clamp(viewport.scrollLeft - dx, 0, maxScrollLeft());
        viewport.scrollTop = clamp(viewport.scrollTop - dy, 0, maxScrollTop());
      }
    }, { passive: false });

    viewport.addEventListener("touchend", (event) => {
      if (s.pinch && event.touches.length < 2) {
        event.preventDefault();
        finishPinch(event.touches.length === 1 ? event.touches[0] : null);
        return;
      }
      if (s.handoff && event.touches.length === 0) s.handoff = null;
    }, { passive: false });

    viewport.addEventListener("touchcancel", (event) => {
      if (s.pinch) finishPinch(null);
      s.handoff = null;
    }, { passive: true });

    viewport.addEventListener("scroll", () => {
      if (s.scrollRaf) return;
      s.scrollRaf = requestAnimationFrame(() => {
        s.scrollRaf = 0;
        updateCurrent();
        scheduleRender(50);
      });
    }, { passive: true });

    viewport.addEventListener("wheel", (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      commitZoom(x, y, s.zoom * Math.exp(-event.deltaY * 0.002));
    }, { passive: false });

    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const pan = {
        id: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY
      };
      s.mousePan = pan;
      viewport.style.cursor = "grabbing";
      try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
      event.preventDefault();
    });

    viewport.addEventListener("pointermove", (event) => {
      const pan = s.mousePan;
      if (!pan || pan.id !== event.pointerId) return;
      const dx = event.clientX - pan.lastX;
      const dy = event.clientY - pan.lastY;
      pan.lastX = event.clientX;
      pan.lastY = event.clientY;
      viewport.scrollLeft = clamp(viewport.scrollLeft - dx, 0, maxScrollLeft());
      viewport.scrollTop = clamp(viewport.scrollTop - dy, 0, maxScrollTop());
      event.preventDefault();
    });

    function endMousePan(event) {
      if (!s.mousePan || s.mousePan.id !== event.pointerId) return;
      try { viewport.releasePointerCapture(event.pointerId); } catch (_) {}
      s.mousePan = null;
      viewport.style.cursor = "";
      scheduleRender(20);
    }
    viewport.addEventListener("pointerup", endMousePan);
    viewport.addEventListener("pointercancel", endMousePan);

    prev.onclick = () => {
      const pageNum = Math.max(1, s.current - 1);
      const m = metas[pageNum - 1];
      viewport.scrollTo({ top: m.y * s.zoom, left: viewport.scrollLeft, behavior: "smooth" });
      updateCurrent(pageNum);
      scheduleRender(10);
    };

    next.onclick = () => {
      const pageNum = Math.min(pdf.numPages, s.current + 1);
      const m = metas[pageNum - 1];
      viewport.scrollTo({ top: m.y * s.zoom, left: viewport.scrollLeft, behavior: "smooth" });
      updateCurrent(pageNum);
      scheduleRender(10);
    };

    zoomOut.onclick = () => {
      const size = viewportSize();
      commitZoom(size.w / 2, size.h / 2, s.zoom - ZOOM_STEP);
    };
    zoomIn.onclick = () => {
      const size = viewportSize();
      commitZoom(size.w / 2, size.h / 2, s.zoom + ZOOM_STEP);
    };
    reset.onclick = () => {
      const size = viewportSize();
      commitZoom(size.w / 2, size.h / 2, 1);
    };

    download.onclick = () => {
      try {
        if (typeof window.downloadEntry === "function") window.downloadEntry(entry, download);
        else downloadBlob(blob, pdfName(entry));
      } catch (err) {
        console.error(err);
        downloadBlob(blob, pdfName(entry));
      }
    };
    print.onclick = () => printBlob(blob, print, pdfName(entry));
    open.onclick = () => openBlob(blob, pdfName(entry));

    if ("ResizeObserver" in window) {
      s.resizeObserver = new ResizeObserver(() => {
        if (state !== s || token !== serial) return;
        const newWidth = viewport.clientWidth;
        if (Math.abs(newWidth - s.lastViewportWidth) < 2) return;
        const anchor = captureAnchor();
        s.lastViewportWidth = newWidth;
        s.fitWidth = Math.max(220, newWidth - PAGE_PAD * 2);
        s.worldW = s.fitWidth + PAGE_PAD * 2;
        for (const m of metas) {
          m.w = s.fitWidth;
          m.h = s.fitWidth * m.rawH / m.rawW;
          if (m.el) {
            m.el.style.left = PAGE_PAD + "px";
            m.el.style.width = m.w + "px";
            m.el.style.height = m.h + "px";
          }
          if (m.canvas) {
            m.canvas.style.width = m.w + "px";
            m.canvas.style.height = m.h + "px";
          }
        }
        reflow(0, anchor);
        updateCurrent();
        scheduleRender(30);
      });
      s.resizeObserver.observe(viewport);
    }

    console.info(`[Stat Archive Preview] ${ENGINE_ID} ready`, { pages: pdf.numPages });
    showStatus("Ready", 550);
    renderVisible();
  }

  async function previewEntry(entry) {
    closePreview();
    installCss();
    const token = ++serial;
    const overlay = document.getElementById("previewOverlay");
    const body = document.getElementById("previewBody");
    const title = document.getElementById("previewTitle");
    if (!overlay || !body || !title) return;

    overlay.style.display = "flex";
    document.body.classList.add("no-scroll");
    setReaderActive(true);
    title.textContent = entry?.title || entry?.filename || "Preview";
    body.innerHTML = '<div class="sa-reader-loading">Loading preview…</div>';

    try {
      if (typeof window.incrementActivity === "function") window.incrementActivity("preview");
    } catch (_) {}

    const abort = new AbortController();
    state = { abort, tasks: new Map() };

    try {
      const fileUrl = `${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`;
      const response = await fetch(fileUrl, { cache: "no-store", signal: abort.signal });
      if (!response.ok) throw new Error(`File request failed (${response.status})`);
      const raw = await response.blob();
      if (token !== serial) return;

      if (isPdf(entry, raw)) {
        const pdfBlob = raw.type === "application/pdf" ? raw : new Blob([raw], { type: "application/pdf" });
        await buildPdf(entry, pdfBlob, token);
        return;
      }

      if (raw.type.startsWith("image/")) {
        const url = URL.createObjectURL(raw);
        body.innerHTML = `<div style="height:100%;display:grid;place-items:center;background:#080c12"><img src="${url}" alt="${escapeHtml(entry?.title || "Preview")}" style="max-width:100%;max-height:100%;object-fit:contain"></div>`;
        return;
      }

      body.innerHTML = '<div class="sa-reader-loading">Preview is unavailable for this file type.</div>';
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Preview failed", err);
      body.innerHTML = '<div class="sa-reader-loading">Couldn\'t open this preview.</div>';
    }
  }

  function bindClose() {
    document.getElementById("closePreviewBtn")?.addEventListener("click", closePreview);
    document.getElementById("previewOverlay")?.addEventListener("click", (event) => {
      if (event.target?.id === "previewOverlay") closePreview();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindClose, { once: true });
  } else {
    bindClose();
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePreview();
  });

  window.previewEntry = previewEntry;
  window.closePreview = closePreview;
  window.escapeHtml = window.escapeHtml || escapeHtml;
})();
