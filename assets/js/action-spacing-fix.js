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

/* Keep the Archive Entries wrapper compact and move the whole row down
   together so the label and horizontal rule stay vertically aligned. */
body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:20px !important;
  margin-bottom:16px !important;
}

body .archive-entries-divider > span{
  display:block !important;
  padding-top:0 !important;
}

@media(max-width:700px){
  body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
  body .archive-entries-divider > span{
    padding-top:0 !important;
  }
}
`;
  document.head.appendChild(style);
})();
