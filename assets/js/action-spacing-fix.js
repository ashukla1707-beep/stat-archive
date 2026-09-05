(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;
  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* Keep only the Types divider above signed-in actions. */
body .toolbar > .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:0 !important;
  position:relative !important;
}
body .toolbar > .archive-action-row::before,
body .toolbar > .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
}

/* Move the actual horizontal divider downward.
   The visible line is the bottom border of the Types section, so adding
   bottom padding here moves the LINE itself, not only the heading below it. */
body .toolbar > .archive-type-filter-section{
  padding-bottom:30px !important;
  border-bottom:1px solid var(--line) !important;
}

/* Keep a modest, clean gap from the moved line to ARCHIVE ENTRIES. */
body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:0 !important;
  margin-bottom:16px !important;
}
body .archive-entries-divider > span{
  display:block !important;
  padding-top:14px !important;
}

@media(max-width:700px){
  body .toolbar > .archive-type-filter-section{
    padding-bottom:24px !important;
  }
  body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:0 !important;
    margin-bottom:12px !important;
  }
  body .archive-entries-divider > span{
    padding-top:12px !important;
  }
}
`;
  document.head.appendChild(style);
})();
