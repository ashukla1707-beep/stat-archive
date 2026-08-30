(function () {
  "use strict";

  let replayed = false;

  function restartHeroAnimation() {
    if (replayed) return;

    const curve =
      document.querySelector(".gaussian-curve");

    const dots =
      document.querySelectorAll(".data-dot");

    if (
      !curve ||
      typeof curve.getTotalLength !== "function"
    ) {
      return;
    }

    replayed = true;

    const length =
      Math.ceil(curve.getTotalLength());

    /*
     * Remove old inline values.
     */
    curve.style.removeProperty("animation");
    curve.style.removeProperty("transition");
    curve.style.removeProperty("stroke-dasharray");
    curve.style.removeProperty("stroke-dashoffset");
    curve.style.removeProperty("opacity");

    /*
     * Use the real SVG path length.
     * This prevents the last part of the right tail
     * from remaining hidden.
     */
    curve.style.setProperty(
      "stroke-dasharray",
      `${length} ${length}`,
      "important"
    );

    curve.style.setProperty(
      "stroke-dashoffset",
      String(length),
      "important"
    );

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
     * Force WebView to paint the completely hidden curve.
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
     * After drawing, remove the dash completely.
     * This guarantees the full right tail stays visible.
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

      curve.style.setProperty(
        "opacity",
        "1",
        "important"
      );

    }, 3800);
  }


  function start() {
    setTimeout(
      restartHeroAnimation,
      250
    );
  }


  if (
    document.readyState === "complete"
  ) {
    start();
  } else {

    window.addEventListener(
      "load",
      start,
      {
        once: true
      }
    );
  }

})();
