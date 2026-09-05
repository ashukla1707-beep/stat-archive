(() => {
  if (document.getElementById('statArchiveActionSpacingFix')) return;
  const style = document.createElement('style');
  style.id = 'statArchiveActionSpacingFix';
  style.textContent = `
/* Keep only the Types divider above signed-in actions. */
html body .toolbar > .archive-action-row{
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
html body .toolbar > .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
}

/* Archive Entries: label and rule must share one exact centerline. */
html body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:20px !important;
  margin-bottom:16px !important;
  display:flex !important;
  align-items:center !important;
  gap:14px !important;
}

html body .archive-entries-divider > span{
  display:inline-flex !important;
  align-items:center !important;
  padding:0 !important;
  margin:0 !important;
  line-height:1 !important;
  transform:none !important;
  position:relative !important;
  top:0 !important;
}

html body .archive-entries-divider > i{
  display:block !important;
  flex:1 1 auto !important;
  height:1px !important;
  margin:0 !important;
  padding:0 !important;
  align-self:center !important;
  transform:none !important;
  position:relative !important;
  top:0 !important;
}

@media(max-width:700px){
  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
}
`;
  document.head.appendChild(style);
})();
