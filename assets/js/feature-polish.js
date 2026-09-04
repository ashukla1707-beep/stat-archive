/* Stat Archive feature polish: centered desktop menu, web offline access, spacing, search suggestions, and filing-card rounding. */
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

.toolbar .search-row{margin-bottom:22px !important;position:relative !important;z-index:30 !important;}

/* One real 24px gap between mobile blocks. Do not stack margin + padding. */
@media(max-width:700px){
  body .archive-summary{
    margin-bottom:24px !important;
  }

  body .toolbar{
    gap:0 !important;
    margin-bottom:0 !important;
  }

  body .toolbar > .search-row{
    margin:0 0 24px !important;
    padding:0 !important;
  }

  body .toolbar > .archive-filter-section{
    margin:0 !important;
    padding:0 !important;
  }

  body .toolbar > .archive-filter-section + .archive-filter-section{
    margin-top:24px !important;
    padding-top:0 !important;
  }

  body .archive-filter-label{
    margin:0 0 12px !important;
    padding:0 !important;
  }

  body #subjectFilterRow,
  body #typeFilterRow{
    margin:0 !important;
    padding-top:0 !important;
    padding-bottom:0 !important;
  }

  body .archive-action-row{
    margin:24px 0 0 !important;
  }

  body #permissionHint{
    margin:12px 0 0 !important;
  }

  body .archive-entries-divider{
    margin:24px auto 24px !important;
  }

  body .archive-entries-divider + .empty-state,
  body .archive-entries-divider + .empty-state + .grid,
  body .archive-entries-divider + .grid{
    margin-top:0 !important;
  }
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

  function removeOldAdvancedControls(){
    document.getElementById('statSearchTools')?.remove();
  }

  function safeHtml(value){
    try { if (typeof escapeHtml === 'function') return escapeHtml(value); } catch (_) {}
    return String(value || '').replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function collectSuggestions(query){
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const found = new Map();
    const add = (value, kind, detail='') => {
      const label = String(value || '').trim();
      if (!label || !label.toLowerCase().startsWith(q)) return;
      const key = `${kind}:${label.toLowerCase()}`;
      if (!found.has(key)) found.set(key,{value:label,kind,detail});
    };

    try {
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          let subjectName = '';
          try { subjectName = subjectMeta(entry.subject)?.name || entry.subject || ''; }
          catch (_) { subjectName = entry?.subject || ''; }
          add(subjectName,'Subject');
          const type = String(entry?.type || '').trim().toLowerCase();
          if (type === 'book' || type === 'books') {
            const title = String(entry?.title || '').trim();
            if (title) add(title,'Book',subjectName);
          }
        });
      }
    } catch (_) {}

    document.querySelectorAll('#subjectFilterRow .pill, #subjectFilterExpanded .pill, .subject-row-name').forEach(el => {
      const text = String(el.textContent || '').trim();
      if (!/^all subjects$/i.test(text) && !/^more$/i.test(text)) add(text,'Subject');
    });

    return [...found.values()].sort((a,b) => {
      if (a.kind !== b.kind) return a.kind === 'Subject' ? -1 : 1;
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
