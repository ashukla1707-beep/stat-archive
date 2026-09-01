(function(){
  "use strict";

  function clearHeroSelection(){
    const sub=document.querySelector('.hero-line .sub');
    if(!sub) return;

    sub.style.userSelect='none';
    sub.style.webkitUserSelect='none';
    sub.style.webkitTouchCallout='none';
    sub.style.webkitTapHighlightColor='transparent';
    sub.style.pointerEvents='none';

    sub.querySelectorAll('*').forEach(el=>{
      el.style.userSelect='none';
      el.style.webkitUserSelect='none';
      el.style.webkitTouchCallout='none';
      el.style.webkitTapHighlightColor='transparent';
      el.style.pointerEvents='none';
    });

    const sel=window.getSelection?.();
    if(sel && sel.rangeCount){
      try{
        const range=sel.getRangeAt(0);
        const node=range.commonAncestorContainer.nodeType===1
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
        if(node && (sub===node || sub.contains(node))) sel.removeAllRanges();
      }catch(_){ }
    }
  }

  function installGuard(){
    if(!document.getElementById('statArchiveHeroSelectionGuardStyle')){
      const style=document.createElement('style');
      style.id='statArchiveHeroSelectionGuardStyle';
      style.textContent=`
html body .header .hero-line .sub,
html body .header .hero-line .sub *{
  -webkit-user-select:none !important;
  user-select:none !important;
  -webkit-touch-callout:none !important;
  -webkit-tap-highlight-color:transparent !important;
  pointer-events:none !important;
}
html body .header .hero-line .sub::selection,
html body .header .hero-line .sub *::selection,
html body .header .hero-line .sub::-moz-selection,
html body .header .hero-line .sub *::-moz-selection{
  background:transparent !important;
  color:inherit !important;
  text-shadow:none !important;
}
`;
      document.head.appendChild(style);
    }

    clearHeroSelection();
    requestAnimationFrame(clearHeroSelection);
    setTimeout(clearHeroSelection,120);
    setTimeout(clearHeroSelection,500);
  }

  document.addEventListener('selectionchange',clearHeroSelection,true);
  window.addEventListener('pageshow',installGuard);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',installGuard,{once:true});
  }else{
    installGuard();
  }
})();
