(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;
  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* Keep exactly ONE divider below Types. */
body .archive-type-filter-section,
body .toolbar > .archive-type-filter-section{
  border-top:0 !important;
  border-bottom:1px solid var(--line) !important;
  padding-bottom:16px !important;
  margin-bottom:0 !important;
}

/* Signed-in action row must never draw another horizontal line. */
body .archive-action-row,
body .toolbar > .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  outline:0 !important;
  box-shadow:none !important;
  background-image:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:16px !important;
  margin-bottom:0 !important;
  position:relative !important;
}
body .archive-action-row::before,
body .archive-action-row::after,
body .toolbar > .archive-action-row::before,
body .toolbar > .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
  box-shadow:none !important;
}

body #permissionHint{
  border:0 !important;
  box-shadow:none !important;
  margin:0 !important;
  padding:0 !important;
}

/* Put Archive Entries back down with a clean gap after the action row. */
body .archive-entries-divider{
  border-top:0 !important;
  padding-top:0 !important;
  margin-top:20px !important;
  margin-bottom:14px !important;
}
body .archive-entries-divider > span{
  display:block !important;
  padding-top:0 !important;
}

@media(max-width:700px){
  body .archive-type-filter-section,
  body .toolbar > .archive-type-filter-section{
    padding-bottom:14px !important;
  }
  body .archive-action-row,
  body .toolbar > .archive-action-row{
    margin-top:14px !important;
  }
  body .archive-entries-divider{
    margin-top:18px !important;
    margin-bottom:12px !important;
  }
}
`;
  document.head.appendChild(style);
})();
