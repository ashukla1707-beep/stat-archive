/* Single final controller for the Stat Archive hero subtitle. */
(() => {
  function install(){
    const sub = document.querySelector('.header .hero-line .sub');
    if (!sub) return;

    sub.innerHTML = '<span class="hero-sub-line1">A focused academic archive of notes and books, curated specifically for University of Lucknow</span><span class="hero-sub-line2"> — organized by subject and kept useful for everyone.</span>';

    document.getElementById('statArchiveHeroLayoutFix')?.remove();
    const style = document.createElement('style');
    style.id = 'statArchiveHeroLayoutFix';
    style.textContent = `
@media (min-width:1101px){
  html body .header .hero-copy{
    position:relative !important;
    z-index:3 !important;
    width:64% !important;
    max-width:920px !important;
    transform:translateY(-16px) !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    display:flex !important;
    align-items:flex-start !important;
    gap:14px !important;
    width:100% !important;
    margin-top:18px !important;
    padding:0 !important;
    overflow:visible !important;
  }

  html body .header .hero-line > span[aria-hidden="true"]{
    position:static !important;
    flex:0 0 44px !important;
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
    flex:1 1 auto !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    height:auto !important;
    max-height:none !important;
    margin:0 !important;
    padding:0 !important;
    overflow:visible !important;
    transform:none !important;
    white-space:normal !important;
    font-size:12.8px !important;
    line-height:1.55 !important;
  }

  html body .header .hero-sub-line1,
  html body .header .hero-sub-line2{
    position:static !important;
    display:block !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    transform:none !important;
    line-height:1.55 !important;
  }

  html body .header .hero-sub-line1{
    white-space:nowrap !important;
  }

  html body .header .hero-sub-line2{
    white-space:nowrap !important;
    margin-top:2px !important;
  }
}

@media (max-width:1100px){
  html body .header .hero-copy{
    transform:none !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    overflow:visible !important;
  }

  html body .header .hero-line .sub{
    display:block !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    white-space:normal !important;
  }

  html body .header .hero-sub-line1,
  html body .header .hero-sub-line2{
    display:inline !important;
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
    overflow:visible !important;
    padding-bottom:28px !important;
  }

  html body .header .hero-copy{
    width:100% !important;
    max-width:none !important;
  }

  html body .header .hero-line .sub{
    padding-bottom:0 !important;
    margin-bottom:0 !important;
  }
}
`;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
