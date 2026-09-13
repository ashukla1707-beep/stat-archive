(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;

  /* One-time cleanup for the old card-action UI cache. The previous versions
     of this file contained mobile/card button sizing rules, so a stale shell
     could temporarily restore that older view. Purge the old shell once while
     online; the active service worker immediately repopulates fresh assets. */
  const PURGE_KEY = 'statArchiveCardUiCachePurge20260910v2';
  try {
    if (navigator.onLine && !localStorage.getItem(PURGE_KEY) && 'caches' in window) {
      caches.keys()
        .then(keys => Promise.all(
          keys
            .filter(key => key.startsWith('stat-archive-shell-'))
            .map(key => caches.delete(key))
        ))
        .then(() => localStorage.setItem(PURGE_KEY, '1'))
        .catch(() => {});
    }
  } catch (_) {}

  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* One separator only: the Types section owns the divider. */
html body .toolbar > .archive-type-filter-section{
  border-top:0 !important;
  border-bottom:1px solid var(--line) !important;
  box-shadow:none !important;
}

/* The signed-in action row must never draw a second separator. */
html body .toolbar > .archive-action-row,
html body .toolbar > .archive-type-filter-section + .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:0 !important;
  position:relative !important;
}

html body .toolbar > .archive-action-row::before,
html body .toolbar > .archive-action-row::after,
html body .toolbar > .archive-type-filter-section + .archive-action-row::before,
html body .toolbar > .archive-type-filter-section + .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

/* Archive Entries: show label only, no horizontal rule. */
html body .archive-entries-divider{
  border:0 !important;
  border-top:0 !important;
  box-shadow:none !important;
  margin-top:0 !important;
  padding-top:20px !important;
  margin-bottom:16px !important;
  display:block !important;
}

html body .archive-entries-divider > span{
  display:inline-block !important;
  padding:0 !important;
  margin:0 !important;
  line-height:1 !important;
  position:relative !important;
  top:0 !important;
  transform:none !important;
}

html body .archive-entries-divider > i,
html body .archive-entries-divider::before,
html body .archive-entries-divider::after{
  display:none !important;
  content:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

/* Theme changes should be instantaneous. The old theme animation caused the
   whole Home screen/Menu to look like it was reloading. Only suppress visual
   transitions during the two paint frames in which the theme actually flips. */
html.stat-theme-settling *,
html.stat-theme-settling *::before,
html.stat-theme-settling *::after{
  transition:none !important;
}

/* Keep the normal hero mu explicitly theme-aware. A few legacy rules only set
   its font and left the color frozen at the previous theme. */
html body .header .hero-probability .axis-mid{
  color:#5ee7f7 !important;
  fill:#5ee7f7 !important;
}
html[data-theme="light"] body .header .hero-probability .axis-mid,
html body[data-theme="light"] .header .hero-probability .axis-mid{
  color:#2f8f5b !important;
  fill:#2f8f5b !important;
}

/* Do not show the extra range/scroll strip beneath subject cards on phones.
   Cards remain horizontally swipeable, without the stray little bar seen in
   the recording. */
@media(max-width:700px){
  html body .subject-mobile-scrollbar,
  html body .subject-mobile-scroll-range{
    display:none !important;
  }

  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
}

/* IMPORTANT: card action buttons are intentionally NOT styled here anymore.
   mobile-card-actions.js is the only final owner of Preview / Download /
   Offline / Edit / Delete sizing and visibility. */
`;
  document.head.appendChild(style);

  /* ---------- Theme / hero stability ---------- */
  const markThemeSettling = () => {
    document.documentElement.classList.add('stat-theme-settling');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove('stat-theme-settling');
    }));
  };

  ['themeDarkBtn','themeLightBtn','menuDarkBtn','menuLightBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', markThemeSettling, true);
  });

  function syncThemeAndMu() {
    const bodyTheme = document.body?.getAttribute('data-theme');
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const value = bodyTheme === 'light' || bodyTheme === 'dark'
      ? bodyTheme
      : (htmlTheme === 'light' ? 'light' : 'dark');
    const isLight = value === 'light';

    if (document.body && document.body.getAttribute('data-theme') !== value) {
      document.body.setAttribute('data-theme', value);
    }
    if (document.documentElement.getAttribute('data-theme') !== value) {
      document.documentElement.setAttribute('data-theme', value);
    }

    const color = isLight ? '#2f8f5b' : '#5ee7f7';
    document.querySelectorAll('.hero-probability .axis-mid').forEach(mu => {
      mu.style.setProperty('color', color, 'important');
      mu.style.setProperty('fill', color, 'important');
    });

    const touchGraph = document.getElementById('statTouchDesktopGraph');
    touchGraph?.querySelectorAll('[data-stat-touch-color]').forEach(node => {
      if (node.hasAttribute('stroke')) node.setAttribute('stroke', color);
      if (node.hasAttribute('fill') && node.getAttribute('fill') !== 'none') node.setAttribute('fill', color);
    });

    const curve = touchGraph?.querySelector('[data-stat-touch-curve]');
    if (curve) {
      curve.style.filter = isLight ? 'none' : 'drop-shadow(0 0 7px rgba(94,231,247,.34))';
    }

    /* hero-layout-fix listens to this event; dispatch it here as well because
       older theme handlers changed data-theme without emitting the event. */
    try {
      document.dispatchEvent(new CustomEvent('statarchive:theme-change', { detail:{ theme:value } }));
    } catch (_) {}
  }

  let syncingTheme = false;
  const themeObserver = new MutationObserver(() => {
    if (syncingTheme) return;
    syncingTheme = true;
    try { syncThemeAndMu(); }
    finally { syncingTheme = false; }
  });

  if (document.body) {
    themeObserver.observe(document.body, { attributes:true, attributeFilter:['data-theme'] });
  }
  themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  syncThemeAndMu();

  /* ---------- Atomic M.Sc / B.Sc switch ----------
     Keep the current archive on screen while the new level is fetched, then
     replace it once. The old implementation emptied the archive, rendered a
     Loading state, and rendered again when data arrived; that double rebuild
     caused the visible page jump/flicker in the recording. */
  try {
    if (typeof switchLevel === 'function' && !window.__statArchiveAtomicLevelSwitchV1) {
      window.__statArchiveAtomicLevelSwitchV1 = true;

      switchLevel = async function statArchiveAtomicSwitchLevel(level) {
        const value = level === 'bsc' ? 'bsc' : 'msc';
        if (value === currentLevel || levelSwitchInProgress) return;

        const previous = {
          level: currentLevel,
          entries,
          subjects,
          totalStorageBytes,
          filterSubjects,
          filterTypes,
          latestEntriesMode,
          showAllEntrySubjects,
          searchQ
        };
        const savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

        mobileSubjectListOpen = false;
        showAllSubjectPills = false;
        document.getElementById('subjectFilterExpanded')?.remove();
        levelSwitchInProgress = true;

        /* Change only the small level toggle immediately. Do not clear/rebuild
           the archive until replacement data is ready. */
        currentLevel = value;
        try { localStorage.setItem('statArchiveLevel', value); } catch (_) {}
        setLevelUI(value);

        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');

        try {
          if (session) {
            try { await sb.auth.signOut(); } catch (_) {}
          }

          const [loadedEntries] = await Promise.all([
            loadEntries(),
            loadSubjectsFromWorker()
          ]);

          entries = loadedEntries;
          totalStorageBytes = entries.reduce((sum, entry) =>
            sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0
          );

          filterSubjects = new Set();
          filterTypes = new Set();
          latestEntriesMode = false;
          showAllEntrySubjects = false;
          searchQ = '';
          if (searchInput) searchInput.value = '';
          if (searchClear) searchClear.style.display = 'none';

          isLoadingArchive = false;
          renderSubjectFilters();
          renderTypeFilters();
          renderSubjectOptions();
          render();

          requestAnimationFrame(() => {
            window.scrollTo({ top:savedScrollY, left:0, behavior:'auto' });
          });
        } catch (err) {
          console.error('Level switch load failed:', err);

          currentLevel = previous.level;
          entries = previous.entries;
          subjects = previous.subjects;
          totalStorageBytes = previous.totalStorageBytes;
          filterSubjects = previous.filterSubjects;
          filterTypes = previous.filterTypes;
          latestEntriesMode = previous.latestEntriesMode;
          showAllEntrySubjects = previous.showAllEntrySubjects;
          searchQ = previous.searchQ;
          try { localStorage.setItem('statArchiveLevel', previous.level); } catch (_) {}
          setLevelUI(previous.level);
          isLoadingArchive = false;

          renderSubjectFilters();
          renderTypeFilters();
          renderSubjectOptions();
          render();
          showError(`Could not load ${value === 'bsc' ? 'B.Sc' : 'M.Sc'} data.`);

          requestAnimationFrame(() => {
            window.scrollTo({ top:savedScrollY, left:0, behavior:'auto' });
          });
        } finally {
          levelSwitchInProgress = false;
        }
      };
    }
  } catch (err) {
    console.warn('Could not install atomic level switching:', err);
  }
})();
