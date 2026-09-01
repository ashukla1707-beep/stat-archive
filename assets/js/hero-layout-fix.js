/* Final hero layout repair for desktop + mobile. */
(() => {
  const style = document.createElement('style');
  style.id = 'statArchiveHeroLayoutFix';
  style.textContent = `
/* Desktop: stable two-line subtitle, no overlap, aligned with decorative line. */
@media (min-width:1101px){
  .hero-copy{
    width:64% !important;
    max-width:860px !important;
    transform:none !important;
    position:relative !important;
    z-index:3 !important;
  }

  .hero-line{
    display:flex !important;
    align-items:flex-start !important;
    gap:14px !important;
    width:100% !important;
    padding:0 !important;
    margin:0 !important;
    position:relative !important;
  }

  .hero-line > span[aria-hidden="true"]{
    position:static !important;
    flex:0 0 44px !important;
    width:44px !important;
    margin:10px 0 0 !important;
    transform:none !important;
  }

  .hero-line .sub{
    position:static !important;
    display:block !important;
    flex:1 1 auto !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    margin:0 !important;
    padding:0 !important;
    font-size:13.5px !important;
    line-height:1.55 !important;
    white-space:normal !important;
    overflow:visible !important;
    height:auto !important;
    max-height:none !important;
    transform:none !important;
  }

  .hero-sub-lead{
    display:block !important;
    white-space:nowrap !important;
    line-height:1.55 !important;
  }

  .hero-sub-tail{
    display:block !important;
    white-space:nowrap !important;
    margin-top:2px !important;
    line-height:1.55 !important;
  }
}

/* Tablet / phone: allow natural wrapping and never clip final line. */
@media (max-width:1100px){
  .hero-copy{
    transform:none !important;
  }

  .hero-line{
    overflow:visible !important;
  }

  .hero-line .sub{
    display:block !important;
    overflow:visible !important;
    max-height:none !important;
    height:auto !important;
    line-height:1.55 !important;
  }

  .hero-sub-lead,
  .hero-sub-tail{
    display:inline !important;
    white-space:normal !important;
    line-height:1.55 !important;
  }
}

@media (max-width:700px){
  .header{
    overflow:visible !important;
  }

  .hero-line .sub{
    padding-bottom:4px !important;
  }
}
`;
  document.head.appendChild(style);
})();
