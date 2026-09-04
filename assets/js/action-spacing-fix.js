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

/* Archive Entries: restore a little breathing room after Types/actions. */
body .archive-action-row + #permissionHint,
body .archive-action-row + #permissionHint + .archive-entries-divider,
body .archive-action-row + .archive-entries-divider{
  margin-top:0 !important;
}
body .archive-entries-divider{
  border-top:0 !important;
  padding-top:0 !important;
  margin-top:22px !important;
  margin-bottom:18px !important;
}

/* Give the first subject group a little separation from the ARCHIVE ENTRIES label. */
body .archive-entries-divider + .empty-state,
body .archive-entries-divider + .grid{
  margin-top:4px !important;
}

/* Slightly soften the page block/grid effect without removing it. */
body:not([data-theme='light']) .grid-bg{
  opacity:.80 !important;
}
body[data-theme='light'] .grid-bg{
  opacity:.52 !important;
}

@media(max-width:700px){
  body .archive-entries-divider{
    margin-top:18px !important;
    margin-bottom:14px !important;
  }
  body .archive-entries-divider + .empty-state,
  body .archive-entries-divider + .grid{
    margin-top:2px !important;
  }
  body:not([data-theme='light']) .grid-bg{
    opacity:.78 !important;
  }
  body[data-theme='light'] .grid-bg{
    opacity:.50 !important;
  }
}
`;
  document.head.appendChild(style);
})();
