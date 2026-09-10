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

@media(max-width:700px){
  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
}

/* IMPORTANT: card action buttons are intentionally NOT styled here anymore.
   mobile-card-actions.js is the only final owner of Preview / Download /
   Offline / Edit / Delete sizing and visibility.

   Desktop Menu placement is intentionally NOT handled here either.
   menu-header-reference.js + startup-polish.js own Menu presentation. Keeping
   this file spacing-only avoids inline !important transforms and a page-wide
   MutationObserver fighting the canonical Menu layout. */
`;
  document.head.appendChild(style);
})();
