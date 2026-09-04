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

/* Keep the Archive Entries wrapper itself compact. */
body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:0 !important;
  margin-bottom:16px !important;
}

/* IMPORTANT: create the visible gap on the heading itself.
   This guarantees clear space between the Types horizontal line
   and the ARCHIVE ENTRIES text, even if parent margins are collapsed
   or overridden elsewhere. */
body .archive-entries-divider > span{
  display:block !important;
  padding-top:20px !important;
}

@media(max-width:700px){
  body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:0 !important;
    margin-bottom:12px !important;
  }
  body .archive-entries-divider > span{
    padding-top:18px !important;
  }
}
`;
  document.head.appendChild(style);
})();
