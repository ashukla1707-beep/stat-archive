/* Single-source hero text layout repair. Loaded after feature-polish.js. */
(() => {
  function applyHeroCopy(){
    const sub = document.querySelector('.hero-line .sub');
    if (!sub) return;
    sub.innerHTML = '<span class="hero-sub-lead">A focused academic archive of notes and books, curated specifically for University of Lucknow</span><span class="hero-sub-tail">— organized by subject and kept useful for everyone.</span>';
  }

  const old = document.getElementById('statArchiveHeroLayoutFix');
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = 'statArchiveHeroLayoutFix';
  style.textContent = `
@media (min-width:1101px){
  html body .header .hero-copy{
    width:60% !important;
    max-width:680px !important;
    position:relative !important;
    z-index:3 !important;
    transform:translateY(-18px) !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    display:flex !important;
    align-items:flex-start !important;
    gap:14px !important;
    width:100% !important;
    margin-top:18px !important;
    padding:0 !important;
    position:relative !important;
    overflow:visible !important;
  }

  html body .header .hero-line > span[aria-hidden="true"]{
    position:static !important;
    display:block !important;
    flex:0 0 44px !important;
    width:44px !important;
    min-width:44px !important;
    height:1px !important;
    margin:10px 0 0 !important;
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
    white-space:normal !important;
    transform:none !important;
    font-size:12.5px !important;
    line-height:1.58 !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:block !important;
    position:static !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    transform:none !important;
    line-height:1.58 !important;
  }

  html body .header .hero-sub-lead{
    white-space:nowrap !important;
  }

  html body .header .hero-sub-tail{
    white-space:nowrap !important;
    margin-top:1px !important;
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
    line-height:1.6 !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:inline !important;
    position:static !important;
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    white-space:normal !important;
    line-height:1.6 !important;
  }

  html body .header .hero-sub-tail::before{
    content:' ';
  }
}

@media (max-width:700px){
  html body .header .hero-line .sub{
    padding-bottom:10px !important;
  }
}
`;
  document.head.appendChild(style);
  applyHeroCopy();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyHeroCopy, {once:true});
})();
