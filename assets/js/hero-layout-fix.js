/* Final hero layout repair: overrides only the subtitle/layout rules that were conflicting. */
(() => {
  const old = document.getElementById('statArchiveHeroLayoutFix');
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = 'statArchiveHeroLayoutFix';
  style.textContent = `
/* FULL DESKTOP */
@media (min-width:1101px){
  html body .header .hero-copy{
    width:62% !important;
    max-width:900px !important;
    transform:translateY(-18px) !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    display:grid !important;
    grid-template-columns:44px minmax(0,1fr) !important;
    column-gap:14px !important;
    align-items:start !important;
    width:100% !important;
    margin-top:18px !important;
    padding:0 !important;
    overflow:visible !important;
  }

  html body .header .hero-line > span[aria-hidden="true"]{
    position:static !important;
    display:block !important;
    width:44px !important;
    min-width:44px !important;
    height:1px !important;
    margin:11px 0 0 !important;
    padding:0 !important;
    transform:none !important;
  }

  html body .header .hero-line .sub{
    position:static !important;
    display:block !important;
    width:100% !important;
    min-width:0 !important;
    max-width:none !important;
    height:auto !important;
    max-height:none !important;
    margin:0 !important;
    padding:0 !important;
    overflow:visible !important;
    white-space:normal !important;
    transform:none !important;
    font-size:13.5px !important;
    line-height:1.55 !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    position:static !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    line-height:1.55 !important;
  }

  html body .header .hero-sub-lead{
    display:block !important;
    white-space:nowrap !important;
  }

  html body .header .hero-sub-tail{
    display:block !important;
    white-space:nowrap !important;
    margin:2px 0 0 !important;
  }
}

/* TABLET + PHONE: preserve the original mobile composition and only prevent clipping. */
@media (max-width:1100px){
  html body .header .hero-copy{
    transform:none !important;
    overflow:visible !important;
  }

  html body .header .hero-line,
  html body .header .hero-line .sub{
    overflow:visible !important;
    height:auto !important;
    max-height:none !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:inline !important;
    position:static !important;
    white-space:normal !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    line-height:inherit !important;
  }
}

@media (max-width:700px){
  html body .header{
    height:auto !important;
    min-height:0 !important;
    overflow:hidden !important;
  }

  html body .header .hero-copy{
    padding-bottom:0 !important;
  }

  html body .header .hero-line .sub{
    padding-bottom:8px !important;
  }
}
`;
  document.head.appendChild(style);
})();
