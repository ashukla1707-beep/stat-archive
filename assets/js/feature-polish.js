/* Stat Archive feature polish: centered desktop menu, web offline access, compact spacing, search suggestions, and filing-card rounding. */
(() => {
  function installStyles(){
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
.stat-search-suggestions{position:absolute;left:0;right:0;top:calc(100% + 7px);z-index:1000;display:none;overflow:hidden;border:1px solid var(--line-strong);border-radius:14px;background:#0d141e;box-shadow:0 18px 45px rgba(0,0,0,.28);}
.stat-search-suggestions.is-open{display:block;}
.stat-search-suggestion{width:100%;border:0;border-bottom:1px solid rgba(148,163,184,.10);background:transparent;color:var(--text);padding:10px 13px;text-align:left;cursor:pointer;font:600 11px/1.35 'JetBrains Mono',monospace;}
.stat-search-suggestion:last-child{border-bottom:0;}
.stat-search-suggestion:hover,.stat-search-suggestion.is-active{background:rgba(94,231,247,.08);color:var(--cyan);}
.stat-search-suggestion small{display:block;margin-top:2px;color:var(--muted);font:500 9px Inter,sans-serif;}
body[data-theme='light'] .stat-search-suggestions{background:#fffdf8;border-color:rgba(75,54,95,.16);box-shadow:0 16px 40px rgba(58,53,42,.14);}
body[data-theme='light'] .stat-search-suggestion{color:#27302d;border-bottom-color:rgba(75,54,95,.09);}
body[data-theme='light'] .stat-search-suggestion:hover,body[data-theme='light'] .stat-search-suggestion.is-active{background:rgba(75,54,95,.07);color:#4b365f;}
.stat-filing-card{border-radius:24px !important;overflow:hidden !important;}
@media(max-width:700px){.stat-filing-card{border-radius:22px !important;}}
`;
    document.head.appendChild(style);
  }

  function enableWebOfflineLibrary(){
    const legacyBtn = document.getElementById('offlineLibraryBtn');
    const menuBtn = document.getElementById('menuOfflineLibraryBtn');
    document.querySelectorAll('.offline-btn').forEach(btn => {btn.style.removeProperty('display');btn.removeAttribute('aria-hidden');});
    if (menuBtn && legacyBtn && !menuBtn.dataset.webOfflineBound) {
      menuBtn.dataset.webOfflineBound = '1';
      menuBtn.addEventListener('click', () => {try { window.statArchiveCloseMenu?.(); } catch (_) {} setTimeout(() => legacyBtn.click(), 70);});
    }
    try { if (typeof loadOfflineLibraryState === 'function') loadOfflineLibraryState(); } catch (_) {}
  }

  function removeOldAdvancedControls(){document.getElementById('statSearchTools')?.remove();}

  function safeHtml(value){
    try { if (typeof escapeHtml === 'function') return escapeHtml(value); } catch (_) {}
    return String(value || '').replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function isQuestionPaperType(type){
    const t = String(type || '').trim().toLowerCase();
    return t === 'previous year question' || t === 'previous-year question' || t === 'previous year questions' ||
           t === 'mid-term question' || t === 'mid term question' || t === 'midterm question';
  }

  function collectSuggestions(query){
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const found = new Map();

    const matchRank = label => {
      const text = String(label || '').trim().toLowerCase();
      if (!text) return 99;
      if (text.startsWith(q)) return 0;
      const words = text.split(/[^a-z0-9]+/i).filter(Boolean);
      if (words.some(word => word.startsWith(q))) return 1;
      if (text.includes(q)) return 2;
      return 99;
    };

    const add = (value, kind, detail='') => {
      const label = String(value || '').trim();
      const rank = matchRank(label);
      if (!label || rank === 99) return;
      const key = `${kind}:${label.toLowerCase()}`;
      const next = {value:label,kind,detail,rank};
      const prev = found.get(key);
      if (!prev || rank < prev.rank) found.set(key,next);
    };

    try {
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          let subjectName = '';
          try { subjectName = subjectMeta(entry.subject)?.name || entry.subject || ''; }
          catch (_) { subjectName = entry?.subject || ''; }
          add(subjectName,'Subject');

          const type = String(entry?.type || '').trim().toLowerCase();
          const title = String(entry?.title || entry?.filename || '').trim();

          // Question papers stay searchable in the Archive Entries results,
          // but are intentionally excluded from the autocomplete dropdown.
          if (isQuestionPaperType(type)) return;

          if (type === 'book' || type === 'books') {
            if (title) add(title,'Book',subjectName);
          } else if (title) {
            add(title, entry?.type || 'Entry', subjectName);
          }
        });
      }
    } catch (_) {}

    document.querySelectorAll('#subjectFilterRow .pill, #subjectFilterExpanded .pill, .subject-row-name').forEach(el => {
      const text = String(el.textContent || '').trim();
      if (!/^all subjects$/i.test(text) && !/^more$/i.test(text)) add(text,'Subject');
    });

    return [...found.values()].sort((a,b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.kind !== b.kind) return a.kind === 'Subject' ? -1 : b.kind === 'Subject' ? 1 : 0;
      return a.value.localeCompare(b.value,undefined,{sensitivity:'base'});
    }).slice(0,10);
  }

  function installSearchSuggestions(){
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    if (!form || !input) return;
    document.getElementById('statSearchSuggestions')?.remove();

    const box = document.createElement('div');
    box.id = 'statSearchSuggestions';
    box.className = 'stat-search-suggestions';
    box.setAttribute('role','listbox');
    box.setAttribute('aria-label','Archive suggestions');
    form.appendChild(box);

    let activeIndex = -1;
    let currentMatches = [];

    function close(){activeIndex=-1;currentMatches=[];box.classList.remove('is-open');box.innerHTML='';input.removeAttribute('aria-activedescendant');}
    function choose(item){if(!item)return;input.value=item.value;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();close();}
    function renderSuggestions(){
      const q = String(input.value || '').trim();
      if (!q) { close(); return; }
      currentMatches = collectSuggestions(q);
      if (!currentMatches.length) { close(); return; }
      activeIndex=-1;
      box.innerHTML=currentMatches.map((item,index)=>`<button type="button" class="stat-search-suggestion" role="option" id="statSuggestion${index}" data-index="${index}">${safeHtml(item.value)}<small>${item.kind}${item.detail ? ` · ${safeHtml(item.detail)}` : ''}</small></button>`).join('');
      box.classList.add('is-open');
      box.querySelectorAll('.stat-search-suggestion').forEach(btn=>{btn.addEventListener('mousedown',e=>e.preventDefault());btn.addEventListener('click',()=>choose(currentMatches[Number(btn.dataset.index)]));});
    }

    input.addEventListener('input',renderSuggestions);
    input.addEventListener('focus',()=>{if(input.value.trim())renderSuggestions();});
    input.addEventListener('keydown',event=>{
      if(!box.classList.contains('is-open')||!currentMatches.length)return;
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const dir=event.key==='ArrowDown'?1:-1;
        activeIndex=(activeIndex+dir+currentMatches.length)%currentMatches.length;
        box.querySelectorAll('.stat-search-suggestion').forEach((btn,index)=>btn.classList.toggle('is-active',index===activeIndex));
        input.setAttribute('aria-activedescendant',`statSuggestion${activeIndex}`);
      }else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();choose(currentMatches[activeIndex]);}
      else if(event.key==='Escape'){close();}
    });
    document.addEventListener('pointerdown',event=>{if(!form.contains(event.target))close();},{passive:true});
  }

  function roundFilingPopup(){
    const mark=()=>document.querySelectorAll('.form-title').forEach(title=>{if(/file a new entry/i.test(String(title.textContent||'')))title.closest('.form-card')?.classList.add('stat-filing-card');});
    mark();
    new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});
  }

  function init(){
    installStyles();
    removeOldAdvancedControls();
    enableWebOfflineLibrary();
    installSearchSuggestions();
    roundFilingPopup();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
