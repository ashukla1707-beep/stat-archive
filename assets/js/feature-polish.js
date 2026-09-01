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
.toolbar .search-row{margin-bottom:14px !important;position:relative !important;z-index:30 !important;}
.stat-search-tools{margin:0 0 16px !important;}
.stat-search-tools + .archive-filter-section{margin-top:7px !important;}
@media(max-width:700px){
  .toolbar .search-row{margin-bottom:18px !important;}
  .stat-search-tools{margin-bottom:20px !important;}
  .stat-search-tools + .archive-filter-section{margin-top:8px !important;}
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

/* Search suggestions */
.stat-search-suggestions{
  position:absolute;
  left:0;
  right:0;
  top:calc(100% + 7px);
  z-index:1000;
  display:none;
  overflow:hidden;
  border:1px solid var(--line-strong);
  border-radius:13px;
  background:#0d141e;
  box-shadow:0 18px 45px rgba(0,0,0,.28);
}
.stat-search-suggestions.is-open{display:block;}
.stat-search-suggestion{
  width:100%;
  border:0;
  border-bottom:1px solid rgba(148,163,184,.10);
  background:transparent;
  color:var(--text);
  padding:10px 13px;
  text-align:left;
  cursor:pointer;
  font:600 11px/1.35 'JetBrains Mono',monospace;
}
.stat-search-suggestion:last-child{border-bottom:0;}
.stat-search-suggestion:hover,
.stat-search-suggestion.is-active{background:rgba(94,231,247,.08);color:var(--cyan);}
.stat-search-suggestion small{display:block;margin-top:2px;color:var(--muted);font:500 9px Inter,sans-serif;}
body[data-theme='light'] .stat-search-suggestions{
  background:#fffdf8;
  border-color:rgba(75,54,95,.16);
  box-shadow:0 16px 40px rgba(58,53,42,.14);
}
body[data-theme='light'] .stat-search-suggestion{color:#27302d;border-bottom-color:rgba(75,54,95,.09);}
body[data-theme='light'] .stat-search-suggestion:hover,
body[data-theme='light'] .stat-search-suggestion.is-active{background:rgba(75,54,95,.07);color:#4b365f;}
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

  function getSubjectSuggestionNames(){
    const names = new Set();

    try {
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          try {
            const name = subjectMeta(entry.subject)?.name || entry.subject || '';
            if (name) names.add(String(name).trim());
          } catch (_) {
            if (entry?.subject) names.add(String(entry.subject).trim());
          }
        });
      }
    } catch (_) {}

    document.querySelectorAll('#subjectFilterRow .pill, #subjectFilterExpanded .pill, .subject-row-name').forEach(el => {
      const text = String(el.textContent || '').trim();
      if (text && !/^all subjects$/i.test(text) && !/^more$/i.test(text)) names.add(text);
    });

    return [...names].filter(Boolean).sort((a,b) => a.localeCompare(b, undefined, {sensitivity:'base'}));
  }

  function installSubjectSuggestions(){
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    if (!form || !input || document.getElementById('statSearchSuggestions')) return;

    const box = document.createElement('div');
    box.id = 'statSearchSuggestions';
    box.className = 'stat-search-suggestions';
    box.setAttribute('role','listbox');
    box.setAttribute('aria-label','Subject suggestions');
    form.appendChild(box);

    let activeIndex = -1;
    let currentMatches = [];

    function close(){
      activeIndex = -1;
      currentMatches = [];
      box.classList.remove('is-open');
      box.innerHTML = '';
      input.removeAttribute('aria-activedescendant');
    }

    function choose(name){
      input.value = name;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus();
      close();
    }

    function renderSuggestions(){
      const q = String(input.value || '').trim().toLowerCase();
      if (!q) { close(); return; }

      currentMatches = getSubjectSuggestionNames()
        .filter(name => name.toLowerCase().startsWith(q))
        .slice(0,8);

      if (!currentMatches.length) { close(); return; }

      activeIndex = -1;
      box.innerHTML = currentMatches.map((name,index) => `
        <button type="button" class="stat-search-suggestion" role="option" id="statSuggestion${index}" data-index="${index}">
          ${name}
          <small>Subject</small>
        </button>
      `).join('');
      box.classList.add('is-open');

      box.querySelectorAll('.stat-search-suggestion').forEach(btn => {
        btn.addEventListener('mousedown', event => event.preventDefault());
        btn.addEventListener('click', () => choose(currentMatches[Number(btn.dataset.index)]));
      });
    }

    input.addEventListener('input', renderSuggestions);
    input.addEventListener('focus', () => { if (input.value.trim()) renderSuggestions(); });
    input.addEventListener('keydown', event => {
      if (!box.classList.contains('is-open') || !currentMatches.length) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const dir = event.key === 'ArrowDown' ? 1 : -1;
        activeIndex = (activeIndex + dir + currentMatches.length) % currentMatches.length;
        box.querySelectorAll('.stat-search-suggestion').forEach((btn,index) => btn.classList.toggle('is-active', index === activeIndex));
        input.setAttribute('aria-activedescendant', `statSuggestion${activeIndex}`);
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        choose(currentMatches[activeIndex]);
      } else if (event.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('pointerdown', event => {
      if (!form.contains(event.target)) close();
    }, {passive:true});
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
    installSubjectSuggestions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
