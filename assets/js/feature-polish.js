/* Stat Archive feature polish: hero copy, centered desktop menu, web offline access, spacing, and extra filters. */
(() => {
  function installStyles(){
    if (document.getElementById('statArchiveFeaturePolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'statArchiveFeaturePolishStyles';
    style.textContent = `
/* Hero copy: exact two-line desktop composition requested. */
@media (min-width:901px){
  .hero-line .sub{max-width:none !important;}
  .hero-sub-lead{display:block !important;white-space:nowrap !important;}
  .hero-sub-tail{display:block !important;margin-top:2px !important;}
}
@media (max-width:900px){
  .hero-sub-lead,.hero-sub-tail{display:inline !important;white-space:normal !important;}
}

/* Desktop/web menu: centered modal rather than a right-side sheet. */
@media (min-width:701px){
  .main-side-menu.stat-menu-polished{
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
  .main-side-menu.stat-menu-polished.is-open{
    transform:translate(-50%,-50%) scale(1) !important;
  }
}

/* More breathing room between search and Subjects on web + APK. */
.toolbar .search-row{margin-bottom:14px !important;}
.stat-search-tools{margin:0 0 15px !important;}
.stat-search-tools + .archive-filter-section{margin-top:4px !important;}
@media(max-width:700px){
  .toolbar .search-row{margin-bottom:16px !important;}
  .stat-search-tools{margin-bottom:18px !important;}
}

/* Offline Library is a browser feature too: IndexedDB works in normal web mode. */
.card-actions .offline-btn{display:inline-flex !important;}
#menuOfflineLibraryBtn{display:flex !important;}

/* Additional search/filter controls. */
.stat-search-tools{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
}
.stat-filter-control,
.stat-filter-toggle,
.stat-filter-reset{
  min-height:34px;
  border:1px solid var(--line) !important;
  border-radius:999px !important;
  background:rgba(15,20,29,.55) !important;
  color:var(--muted) !important;
  font:600 10px 'JetBrains Mono',monospace !important;
  padding:0 11px !important;
}
.stat-filter-control{cursor:pointer;}
.stat-filter-toggle,.stat-filter-reset{cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
.stat-filter-toggle.is-active{
  color:#061016 !important;
  background:var(--cyan) !important;
  border-color:transparent !important;
}
.stat-filter-reset:hover{color:var(--text) !important;border-color:var(--line-strong) !important;}
body[data-theme='light'] .stat-filter-control,
body[data-theme='light'] .stat-filter-toggle,
body[data-theme='light'] .stat-filter-reset{
  background:rgba(255,255,255,.72) !important;
  color:#6e6872 !important;
  border-color:rgba(75,54,95,.14) !important;
}
body[data-theme='light'] .stat-filter-toggle.is-active{
  background:#4b365f !important;
  color:#fff !important;
}
@media(max-width:700px){
  .stat-search-tools{gap:7px;}
  .stat-filter-control,.stat-filter-toggle,.stat-filter-reset{
    min-height:33px;
    font-size:9.5px !important;
    padding:0 10px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function updateHeroCopy(){
    const sub = document.querySelector('.hero-line .sub');
    if (!sub) return;
    sub.innerHTML = '<span class="hero-sub-lead">A focused academic archive of notes and books, curated specifically for University of Lucknow</span><span class="hero-sub-tail"> — organized by subject and kept useful for everyone.</span>';
  }

  function enableWebOfflineLibrary(){
    const legacyBtn = document.getElementById('offlineLibraryBtn');
    const menuBtn = document.getElementById('menuOfflineLibraryBtn');

    document.querySelectorAll('.offline-btn').forEach(btn => {
      btn.style.removeProperty('display');
      btn.removeAttribute('aria-hidden');
    });

    if (menuBtn && legacyBtn && !menuBtn.dataset.webOfflineBound) {
      menuBtn.dataset.webOfflineBound = '1';
      menuBtn.addEventListener('click', () => {
        if (typeof window.statArchiveCloseMenu === 'function') window.statArchiveCloseMenu();
        setTimeout(() => legacyBtn.click(), 60);
      });
    }

    try {
      if (typeof loadOfflineLibraryState === 'function') loadOfflineLibraryState();
    } catch (_) {}
  }

  function installAdvancedFilters(){
    const searchForm = document.getElementById('searchForm');
    if (!searchForm || document.getElementById('statSearchTools')) return;

    let advancedYear = 'all';
    let exactPhrase = false;

    let originalFilteredEntries = null;
    try {
      if (typeof filteredEntries === 'function') originalFilteredEntries = filteredEntries;
    } catch (_) {}

    if (originalFilteredEntries) {
      try {
        filteredEntries = function(){
          let list = originalFilteredEntries();

          if (advancedYear !== 'all') {
            list = list.filter(entry => String(entry?.year || '').trim() === advancedYear);
          }

          if (exactPhrase) {
            const input = document.getElementById('searchInput');
            const phrase = String(input?.value || '').trim().toLowerCase();
            if (phrase) {
              list = list.filter(entry => {
                let subjectName = '';
                try { subjectName = subjectMeta(entry.subject)?.name || ''; } catch (_) {}
                const hay = [entry.title, entry.filename, entry.year, entry.type, entry.subject, subjectName]
                  .filter(Boolean).join(' ').toLowerCase();
                return hay.includes(phrase);
              });
            }
          }

          return list;
        };
      } catch (_) {}
    }

    const tools = document.createElement('div');
    tools.id = 'statSearchTools';
    tools.className = 'stat-search-tools';
    tools.setAttribute('aria-label','Additional archive filters');
    tools.innerHTML = `
      <select id="statYearFilter" class="stat-filter-control" aria-label="Filter by year">
        <option value="all">All years</option>
      </select>
      <button type="button" id="statExactSearch" class="stat-filter-toggle" aria-pressed="false">Exact phrase</button>
      <button type="button" id="statResetFilters" class="stat-filter-reset">Reset filters</button>
    `;
    searchForm.insertAdjacentElement('afterend', tools);

    const yearSelect = document.getElementById('statYearFilter');
    const exactBtn = document.getElementById('statExactSearch');
    const resetBtn = document.getElementById('statResetFilters');

    function forceRender(){
      try {
        if (typeof render === 'function') { render(); return; }
      } catch (_) {}
      document.getElementById('searchInput')?.dispatchEvent(new Event('input',{bubbles:true}));
    }

    function populateYears(){
      if (!yearSelect || !originalFilteredEntries) return;
      let list = [];
      try { list = originalFilteredEntries(); } catch (_) { return; }
      const years = [...new Set(list.map(e => String(e?.year || '').trim()).filter(y => /^(19|20)\d{2}$/.test(y)))]
        .sort((a,b) => Number(b)-Number(a));
      const current = yearSelect.value || advancedYear;
      yearSelect.innerHTML = '<option value="all">All years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
      if ([...yearSelect.options].some(o => o.value === current)) yearSelect.value = current;
    }

    yearSelect?.addEventListener('change', () => {
      advancedYear = yearSelect.value || 'all';
      forceRender();
    });

    exactBtn?.addEventListener('click', () => {
      exactPhrase = !exactPhrase;
      exactBtn.classList.toggle('is-active', exactPhrase);
      exactBtn.setAttribute('aria-pressed', String(exactPhrase));
      forceRender();
    });

    resetBtn?.addEventListener('click', () => {
      advancedYear = 'all';
      exactPhrase = false;
      if (yearSelect) yearSelect.value = 'all';
      exactBtn?.classList.remove('is-active');
      exactBtn?.setAttribute('aria-pressed','false');
      const search = document.getElementById('searchInput');
      if (search) search.value = '';
      document.getElementById('searchClear')?.click();
      try {
        if (typeof filterSubjects !== 'undefined') filterSubjects.clear();
        if (typeof filterTypes !== 'undefined') filterTypes.clear();
      } catch (_) {}
      forceRender();
    });

    const grid = document.getElementById('grid');
    if (grid) {
      const observer = new MutationObserver(() => {
        populateYears();
        enableWebOfflineLibrary();
      });
      observer.observe(grid,{childList:true,subtree:true});
    }

    populateYears();
  }

  function init(){
    installStyles();
    updateHeroCopy();
    enableWebOfflineLibrary();
    installAdvancedFilters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
