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

/* The visible horizontal line is the Types section's bottom border.
   Add real internal space before the Archive Entries label so the
   line-to-heading gap matches the breathing room above Types. */
body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:22px !important;
  margin-bottom:16px !important;
}

/* Prevent adjacent sibling rules from collapsing that gap. */
body .toolbar + .archive-entries-divider,
body .archive-action-row + .archive-entries-divider,
body #permissionHint + .archive-entries-divider{
  padding-top:22px !important;
  margin-top:0 !important;
}

@media(max-width:700px){
  body .archive-entries-divider,
  body .toolbar + .archive-entries-divider,
  body .archive-action-row + .archive-entries-divider,
  body #permissionHint + .archive-entries-divider{
    padding-top:18px !important;
    margin-top:0 !important;
    margin-bottom:12px !important;
  }
}
`;
  document.head.appendChild(style);
})();
