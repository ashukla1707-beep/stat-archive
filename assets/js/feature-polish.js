/* Stat Archive feature polish: centered desktop menu, web offline access,
 * compact spacing, and filing-card rounding.
 * Search autocomplete is owned exclusively by search-suggestions.js.
 * Offline Library menu navigation is owned by service-worker-register.js /
 * accessibility.js; this file only exposes the already-existing controls.
 */
(() => {
  if (window.__statArchiveFeaturePolishLoadedV2) return;
  window.__statArchiveFeaturePolishLoadedV2 = true;

  function installStyles() {
    if (document.getElementById('statArchiveFeaturePolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'statArchiveFeaturePolishStyles';
    style.textContent = `
@media (min-width:701px){
  body .main-side-menu,
  body .main-side-menu.stat-menu-polished{
    position:fixed !important;
    top:50% !important;
    left:50% !important;
    right:auto !important;
    bottom:auto !important;
    width:min(440px,calc(100vw - 48px)) !important;
    max-height:min(760px,calc(100dvh - 48px)) !important;
    transform:translate(-50%,-50%) scale(.985) !important;
    transform-origin:center center !important;
  }
  body .main-side-menu.is-open,
  body .main-side-menu.stat-menu-polished.is-open{
    transform:translate(-50%,-50%) scale(1) !important;
  }
}

body .archive-summary{margin-bottom:18px !important;}
body .toolbar{display:flex !important;flex-direction:column !important;gap:18px !important;margin-bottom:0 !important;}
body .toolbar > .search-row,
body .toolbar > .archive-filter-section,
body .toolbar > .archive-action-row,
body .toolbar > #permissionHint{margin:0 !important;}
body .toolbar > .search-row{padding:0 !important;position:relative !important;z-index:30 !important;}
body .toolbar > .archive-filter-section{padding:0 0 16px !important;border-bottom:1px solid var(--line) !important;}
body .toolbar > .archive-type-filter-section{border-top:0 !important;}
body .archive-filter-label{margin:0 0 10px !important;padding:0 !important;}
body #subjectFilterRow,body #typeFilterRow{margin:0 !important;padding:0 !important;}
body .archive-action-row:not(:has(> button:not([style*="display:none"]))){display:none !important;}
body .archive-entries-divider{border-top:0 !important;padding-top:0 !important;margin:8px auto 10px !important;}
body .archive-entries-divider + .empty-state,
body .archive-entries-divider + .empty-state + .grid,
body .archive-entries-divider + .grid{margin-top:0 !important;}
@media(max-width:700px){
  body .archive-summary{margin-bottom:16px !important;}
  body .toolbar{gap:16px !important;}
  body .toolbar > .archive-filter-section{padding-bottom:14px !important;}
  body .archive-filter-label{margin-bottom:9px !important;}
  body .archive-entries-divider{margin:6px auto 8px !important;}
}
#statSearchTools,.stat-search-tools,#statYearFilter,#statExactSearch,#statResetFilters{display:none !important;}
.card-actions .offline-btn{display:inline-flex !important;}
#menuOfflineLibraryBtn{display:flex !important;}
.stat-filing-card{border-radius:24px !important;overflow:hidden !important;}
@media(max-width:700px){.stat-filing-card{border-radius:22px !important;}}
`;
    document.head.appendChild(style);
  }

  function enableWebOfflineLibrary() {
    document.querySelectorAll('.offline-btn').forEach(btn => {
      btn.style.removeProperty('display');
      btn.removeAttribute('aria-hidden');
    });
    try {
      if (typeof loadOfflineLibraryState === 'function') loadOfflineLibraryState();
    } catch (_) {}
  }

  function removeOldAdvancedControls() {
    document.getElementById('statSearchTools')?.remove();
  }

  function roundFilingPopup() {
    const mark = () => document.querySelectorAll('.form-title').forEach(title => {
      if (/file a new entry/i.test(String(title.textContent || ''))) {
        title.closest('.form-card')?.classList.add('stat-filing-card');
      }
    });

    mark();
    const observer = new MutationObserver(mark);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    installStyles();
    removeOldAdvancedControls();
    enableWebOfflineLibrary();
    roundFilingPopup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
