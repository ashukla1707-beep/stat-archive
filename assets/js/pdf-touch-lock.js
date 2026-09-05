/* Stat Archive PDF touch coordinator.
 * One finger uses Android/WebView native scrolling for fast, natural fling.
 * Two fingers are reserved for the custom PDF pinch engine.
 */
(function(){
  "use strict";

  const installed=new WeakSet();
  let observer=null;

  function install(wrap){
    if(!wrap||installed.has(wrap)) return;
    installed.add(wrap);

    /* pan-x pan-y keeps native one-finger scrolling and momentum, while
       excluding browser pinch-zoom because pinch-zoom is not listed. */
    wrap.style.setProperty("touch-action","pan-x pan-y","important");
    wrap.style.setProperty("overscroll-behavior","contain","important");
    wrap.style.setProperty("overflow-anchor","none","important");
    wrap.style.setProperty("-webkit-overflow-scrolling","touch","important");
    wrap.style.setProperty("-webkit-user-select","none","important");
    wrap.style.setProperty("user-select","none","important");

    let twoFinger=false;
    let frozenTop=0;
    let frozenLeft=0;

    wrap.addEventListener("touchstart",e=>{
      if(e.touches.length>=2){
        twoFinger=true;
        frozenTop=wrap.scrollTop;
        frozenLeft=wrap.scrollLeft;
        e.preventDefault();
      }
    },{capture:true,passive:false});

    wrap.addEventListener("touchmove",e=>{
      if(e.touches.length>=2){
        twoFinger=true;
        e.preventDefault();

        /* If WebView had already begun a pan from the first finger before the
           second finger landed, cancel that residual movement immediately.
           The custom pinch engine will then move scrollTop itself as needed. */
        if(Math.abs(wrap.scrollTop-frozenTop)>1) wrap.scrollTop=frozenTop;
        if(Math.abs(wrap.scrollLeft-frozenLeft)>1) wrap.scrollLeft=frozenLeft;
      }
    },{capture:true,passive:false});

    wrap.addEventListener("touchend",e=>{
      if(twoFinger && e.touches.length<2){
        twoFinger=false;
      }
    },{capture:true,passive:true});

    wrap.addEventListener("touchcancel",()=>{
      twoFinger=false;
    },{capture:true,passive:true});
  }

  function scan(){
    const wrap=document.getElementById("pdfCanvasWrap");
    if(wrap) install(wrap);
  }

  scan();
  observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("pageshow",scan);
})();
