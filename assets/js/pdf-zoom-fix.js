/* Stat Archive PDF preview zoom stability fix.
 * Keeps the same logical PDF page anchored while preview.js rebuilds canvases
 * during +/- and pinch zoom. Also disables browser scroll anchoring inside the
 * PDF viewport, which otherwise causes large page jumps while placeholder
 * heights are replaced.
 */
(() => {
  let boundWrap = null;
  let anchorPage = null;
  let restoreTimers = [];

  const clearRestoreTimers = () => {
    restoreTimers.forEach(clearTimeout);
    restoreTimers = [];
  };

  const getCurrentPage = () => {
    const current = document.querySelector('#pdfPages .pdf-page-current');
    const fromCurrent = Number(current?.dataset?.page || 0);
    if (fromCurrent > 0) return fromCurrent;

    const text = document.getElementById('pdfPageInfo')?.textContent || '';
    const match = text.match(/Page\s+(\d+)/i);
    return match ? Number(match[1]) : 1;
  };

  const rememberAnchor = () => {
    anchorPage = Math.max(1, getCurrentPage() || 1);
  };

  const restoreAnchor = () => {
    if (!anchorPage) return;
    const wrap = document.getElementById('pdfCanvasWrap');
    const target = document.querySelector(`#pdfPages .pdf-page[data-page="${anchorPage}"]`);
    if (!wrap || !target) return;

    // Keep restoration inside the preview scroller, not the whole document.
    const targetTop = target.offsetTop;
    wrap.scrollTo({ top: Math.max(0, targetTop - 2), left: wrap.scrollLeft, behavior: 'auto' });
  };

  const scheduleRestore = () => {
    clearRestoreTimers();
    // preview.js currently debounces a zoom rebuild by 150 ms. Restore after
    // that rebuild and once more after lazy rendering settles.
    [180, 280, 480, 760].forEach(delay => {
      restoreTimers.push(setTimeout(restoreAnchor, delay));
    });
  };

  const bind = wrap => {
    if (!wrap || wrap === boundWrap) return;
    boundWrap = wrap;

    wrap.style.overflowAnchor = 'none';
    document.getElementById('pdfPages')?.style.setProperty('overflow-anchor', 'none');

    const captureZoomButton = event => {
      const button = event.target.closest('#pdfZoomInBtn,#pdfZoomOutBtn,#pdfZoomResetBtn');
      if (!button) return;
      rememberAnchor();
      scheduleRestore();
    };

    document.addEventListener('pointerdown', captureZoomButton, true);

    wrap.addEventListener('touchstart', event => {
      if (event.touches?.length === 2) rememberAnchor();
    }, { passive: true, capture: true });

    wrap.addEventListener('touchmove', event => {
      if (event.touches?.length === 2 && anchorPage) scheduleRestore();
    }, { passive: true, capture: true });

    wrap.addEventListener('touchend', () => {
      if (anchorPage) scheduleRestore();
    }, { passive: true, capture: true });
  };

  const scan = () => {
    const wrap = document.getElementById('pdfCanvasWrap');
    if (wrap) bind(wrap);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
