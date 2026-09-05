/* Stat Archive PDF touch controller.
 * Android WebView was still allowed to perform its own pan while the custom
 * PDF pinch engine was running (touch-action: pan-x pan-y). That is what made
 * pages visibly run backwards/forwards during a pinch. This controller owns
 * touch scrolling inside #pdfCanvasWrap: one finger pans the scroll container,
 * two fingers are reserved for the existing PDF pinch engine.
 */
(function(){
  "use strict";

  const installed=new WeakSet();
  let observer=null;

  function install(wrap){
    if(!wrap||installed.has(wrap)) return;
    installed.add(wrap);

    // Critical: WebView must not start a compositor/native pan gesture here.
    // We implement one-finger panning ourselves; the existing pdf-preview-v2
    // listeners continue to handle two-finger pinch zoom.
    wrap.style.setProperty("touch-action","none","important");
    wrap.style.setProperty("overscroll-behavior","contain","important");
    wrap.style.setProperty("overflow-anchor","none","important");
    wrap.style.setProperty("-webkit-user-select","none","important");
    wrap.style.setProperty("user-select","none","important");

    let mode="none";
    let lastX=0,lastY=0,lastT=0;
    let vx=0,vy=0;
    let inertia=0;

    function cancelInertia(){
      if(inertia){ cancelAnimationFrame(inertia); inertia=0; }
      vx=vy=0;
    }

    function beginPan(t){
      mode="pan";
      lastX=t.clientX;
      lastY=t.clientY;
      lastT=performance.now();
      vx=vy=0;
    }

    function runInertia(){
      const friction=.92;
      function frame(){
        vx*=friction;
        vy*=friction;
        if(Math.abs(vx)<.12&&Math.abs(vy)<.12){ inertia=0; return; }
        const oldLeft=wrap.scrollLeft;
        const oldTop=wrap.scrollTop;
        wrap.scrollLeft-=vx*16;
        wrap.scrollTop-=vy*16;
        // Stop velocity on an axis if we hit an edge.
        if(Math.abs(wrap.scrollLeft-oldLeft)<.1) vx=0;
        if(Math.abs(wrap.scrollTop-oldTop)<.1) vy=0;
        inertia=requestAnimationFrame(frame);
      }
      if(Math.abs(vx)>.18||Math.abs(vy)>.18) inertia=requestAnimationFrame(frame);
    }

    wrap.addEventListener("touchstart",e=>{
      cancelInertia();
      if(e.touches.length>=2){
        mode="pinch";
        // Prevent Android/WebView native pan/zoom, but do NOT stop propagation:
        // pdf-preview-v2 must still receive the same two-finger event.
        e.preventDefault();
        return;
      }
      if(e.touches.length===1){
        beginPan(e.touches[0]);
        e.preventDefault();
      }
    },{capture:true,passive:false});

    wrap.addEventListener("touchmove",e=>{
      if(e.touches.length>=2){
        mode="pinch";
        e.preventDefault();
        return;
      }

      if(e.touches.length===1){
        const t=e.touches[0];
        if(mode!=="pan") beginPan(t);
        const now=performance.now();
        const dt=Math.max(8,Math.min(40,now-lastT||16));
        const dx=t.clientX-lastX;
        const dy=t.clientY-lastY;

        wrap.scrollLeft-=dx;
        wrap.scrollTop-=dy;

        const nvx=dx/dt;
        const nvy=dy/dt;
        vx=vx*.55+nvx*.45;
        vy=vy*.55+nvy*.45;
        lastX=t.clientX;
        lastY=t.clientY;
        lastT=now;
        e.preventDefault();
      }
    },{capture:true,passive:false});

    wrap.addEventListener("touchend",e=>{
      if(mode==="pinch"){
        // If one finger remains after a pinch, start a fresh pan baseline so
        // there is no jump when the user continues dragging.
        if(e.touches.length===1) beginPan(e.touches[0]);
        else mode="none";
        return;
      }
      if(mode==="pan"){
        if(e.touches.length===0){ mode="none"; runInertia(); }
        else if(e.touches.length===1) beginPan(e.touches[0]);
      }
    },{capture:true,passive:true});

    wrap.addEventListener("touchcancel",()=>{
      mode="none";
      cancelInertia();
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
