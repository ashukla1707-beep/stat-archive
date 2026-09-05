/* Stat Archive PDF touch controller.
 * One finger: direct, responsive manual pan with native-like fling.
 * Two fingers: reserved exclusively for the PDF pinch engine so Android
 * WebView cannot fight the custom zoom with its own gesture scrolling.
 */
(function(){
  "use strict";

  const installed=new WeakSet();
  let observer=null;

  function install(wrap){
    if(!wrap||installed.has(wrap)) return;
    installed.add(wrap);

    wrap.style.setProperty("touch-action","none","important");
    wrap.style.setProperty("overscroll-behavior","contain","important");
    wrap.style.setProperty("overflow-anchor","none","important");
    wrap.style.setProperty("-webkit-user-select","none","important");
    wrap.style.setProperty("user-select","none","important");

    let mode="none";
    let lastX=0,lastY=0,lastT=0;
    let velocityX=0,velocityY=0;
    let inertia=0;

    const DRAG_GAIN=1.08;
    const FLING_GAIN=1.75;
    const FRICTION=0.955;
    const MAX_SPEED=85;

    function cancelInertia(){
      if(inertia){cancelAnimationFrame(inertia);inertia=0;}
      velocityX=velocityY=0;
    }

    function beginPan(t){
      mode="pan";
      lastX=t.clientX;
      lastY=t.clientY;
      lastT=performance.now();
      velocityX=velocityY=0;
    }

    function startFling(){
      let fx=Math.max(-MAX_SPEED,Math.min(MAX_SPEED,velocityX*FLING_GAIN));
      let fy=Math.max(-MAX_SPEED,Math.min(MAX_SPEED,velocityY*FLING_GAIN));

      if(Math.abs(fx)<1.2&&Math.abs(fy)<1.2) return;

      function frame(){
        fx*=FRICTION;
        fy*=FRICTION;

        if(Math.abs(fx)<0.35&&Math.abs(fy)<0.35){
          inertia=0;
          return;
        }

        const beforeX=wrap.scrollLeft;
        const beforeY=wrap.scrollTop;
        wrap.scrollLeft-=fx;
        wrap.scrollTop-=fy;

        if(Math.abs(wrap.scrollLeft-beforeX)<0.1) fx=0;
        if(Math.abs(wrap.scrollTop-beforeY)<0.1) fy=0;

        inertia=requestAnimationFrame(frame);
      }

      inertia=requestAnimationFrame(frame);
    }

    wrap.addEventListener("touchstart",e=>{
      cancelInertia();

      if(e.touches.length>=2){
        mode="pinch";
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

      if(e.touches.length!==1) return;

      const t=e.touches[0];
      if(mode!=="pan") beginPan(t);

      const now=performance.now();
      const dt=Math.max(6,Math.min(34,now-lastT||16));
      const dx=(t.clientX-lastX)*DRAG_GAIN;
      const dy=(t.clientY-lastY)*DRAG_GAIN;

      wrap.scrollLeft-=dx;
      wrap.scrollTop-=dy;

      /* Convert current motion to approximately pixels-per-frame. Using
         px/frame rather than px/ms gives a much more natural Android-style
         fling after a short finger swipe. */
      const frameScale=16.67/dt;
      const instantX=dx*frameScale;
      const instantY=dy*frameScale;
      velocityX=velocityX*0.35+instantX*0.65;
      velocityY=velocityY*0.35+instantY*0.65;

      lastX=t.clientX;
      lastY=t.clientY;
      lastT=now;
      e.preventDefault();
    },{capture:true,passive:false});

    wrap.addEventListener("touchend",e=>{
      if(mode==="pinch"){
        if(e.touches.length===1) beginPan(e.touches[0]);
        else mode="none";
        return;
      }

      if(mode==="pan"){
        if(e.touches.length===0){
          mode="none";
          startFling();
        }else if(e.touches.length===1){
          beginPan(e.touches[0]);
        }
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
