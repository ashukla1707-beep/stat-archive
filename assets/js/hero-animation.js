(function () {
  "use strict";

  let replayed = false;

  function restartHeroAnimation() {
    if (replayed) return;

    const curve =
      document.querySelector(".gaussian-curve");

    const dots =
      document.querySelectorAll(".data-dot");

    if (!curve) return;

    replayed = true;

    /*
     * Remove any old inline curve-animation state that
     * previous versions may have left behind.
     */
    curve.style.removeProperty("animation");
    curve.style.removeProperty("transition");
    curve.style.removeProperty("stroke-dasharray");
    curve.style.removeProperty("stroke-dashoffset");
    curve.style.removeProperty("opacity");

    /*
     * Temporarily disable animation with !important.
     * This is necessary because the mobile CSS animation
     * declaration itself uses !important.
     */
    curve.style.setProperty(
      "animation",
      "none",
      "important"
    );

    dots.forEach(dot => {
      dot.style.setProperty(
        "animation",
        "none",
        "important"
      );
    });

    /*
     * Force WebView to paint the reset state.
     */
    void curve.getBoundingClientRect();

    /*
     * Remove our temporary override.
     * The normal CSS curveDrawOnce animation now starts.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curve.style.removeProperty(
          "animation"
        );

        dots.forEach(dot => {
          dot.style.removeProperty(
            "animation"
          );
        });
      });
    });
  }


  function scheduleStart() {
    /*
     * Small startup delay helps ensure the animation remains
     * visible after the Android launch screen disappears.
     */
    setTimeout(
      restartHeroAnimation,
      250
    );
  }


  if (
    document.readyState ===
    "complete"
  ) {
    scheduleStart();
  } else {
    window.addEventListener(
      "load",
      scheduleStart,
      {
        once: true
      }
    );
  }


  /*
   * Do not restart on resize, scrolling, orientation changes,
   * or ordinary visibility changes.
   */
})();
