(function () {
  "use strict";

  let started = false;

  function startHeroAnimation() {
    if (started) return;

    const curve =
      document.querySelector(".gaussian-curve");

    const dots =
      document.querySelectorAll(".data-dot");

    if (!curve) return;

    started = true;

    /*
     * SVG pathLength="1" normalizes the entire curve.
     *
     * 1 = completely hidden
     * 0 = completely visible
     *
     * No getTotalLength(), no guessed 1000/1400 values.
     */

    curve.style.setProperty(
      "animation",
      "none",
      "important"
    );

    curve.style.setProperty(
      "transition",
      "none",
      "important"
    );

    curve.style.setProperty(
      "stroke-dasharray",
      "1",
      "important"
    );

    curve.style.setProperty(
      "stroke-dashoffset",
      "1",
      "important"
    );

    curve.style.setProperty(
      "opacity",
      "1",
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
     * Force initial hidden state to render.
     */
    void curve.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        curve.style.setProperty(
          "transition",
          "stroke-dashoffset 3.4s cubic-bezier(.22,.61,.36,1)",
          "important"
        );

        curve.style.setProperty(
          "stroke-dashoffset",
          "0",
          "important"
        );

        dots.forEach(dot => {
          dot.style.removeProperty(
            "animation"
          );
        });

      });
    });

    /*
     * Once drawing is complete, remove the dash mechanism.
     * The entire original SVG curve remains visible.
     */
    setTimeout(() => {

      curve.style.setProperty(
        "transition",
        "none",
        "important"
      );

      curve.style.setProperty(
        "stroke-dasharray",
        "none",
        "important"
      );

      curve.style.setProperty(
        "stroke-dashoffset",
        "0",
        "important"
      );

    }, 3800);
  }


  function scheduleStart() {
    setTimeout(
      startHeroAnimation,
      250
    );
  }


  if (document.readyState === "complete") {
    scheduleStart();
  } else {
    window.addEventListener(
      "load",
      scheduleStart,
      { once: true }
    );
  }

})();
