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

/* Leave a little breathing room before Archive Entries when signed in. */
body .archive-action-row + #permissionHint,
body .archive-action-row + #permissionHint + .archive-entries-divider,
body .archive-action-row + .archive-entries-divider{
  margin-top:0 !important;
}
body .archive-entries-divider{
  border-top:0 !important;
  padding-top:0 !important;
  margin-top:14px !important;
  margin-bottom:10px !important;
}

@media(max-width:700px){
  body .archive-entries-divider{
    margin-top:12px !important;
    margin-bottom:8px !important;
  }
}
`;
  document.head.appendChild(style);
})();
