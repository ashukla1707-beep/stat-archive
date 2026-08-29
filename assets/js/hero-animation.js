(function () {
  "use strict";

  let replayTimer = null;
  let finishTimer = null;

  function isPhoneLayout() {
    return (
      window.innerWidth <= 700 ||
      window.matchMedia("(max-width: 700px)").matches
    );
  }

  function finishCurve(curve) {
    if (!curve) return;

    curve.style.setProperty("animation", "none", "important");
    curve.style.setProperty("transition", "none", "important");
    curve.style.setProperty("stroke-dashoffset", "0", "important");
    curve.style.setProperty("opacity", "1", "important");
  }

  function animateHero() {
    if (!isPhoneLayout()) return;

    const curve = document.querySelector(".gaussian-curve");

    if (!curve || typeof curve.getTotalLength !== "function") {
      return;
    }

    clearTimeout(finishTimer);

    try {
      const length = Math.max(
        1,
        Math.ceil(curve.getTotalLength())
      );

      /*
       * Reset the SVG completely.
       * This prevents the normal CSS animation and the
       * WebView animation from competing with one another.
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
        `${length} ${length}`,
        "important"
      );

      curve.style.setProperty(
        "stroke-dashoffset",
        String(length),
        "important"
      );

      curve.style.setProperty(
        "opacity",
        "1",
        "important"
      );

      /*
       * Force WebView to paint the hidden starting state.
       */
      void curve.getBoundingClientRect();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {

          curve.style.setProperty(
            "transition",
            "stroke-dashoffset 3.2s cubic-bezier(.22,.61,.36,1)",
            "important"
          );

          curve.style.setProperty(
            "stroke-dashoffset",
            "0",
            "important"
          );
        });
      });

      /*
       * CRITICAL WEBVIEW SAFETY NET
       *
       * Even if Android pauses/interferes with the transition,
       * force the curve into its completed state.
       */
      finishTimer = setTimeout(() => {
        finishCurve(curve);
      }, 3500);


      /* -----------------------------
         Falling dots
         ----------------------------- */

      document
        .querySelectorAll(".data-dot")
        .forEach((dot) => {

          const style = getComputedStyle(dot);

          const fall =
            style.getPropertyValue("--fall").trim() ||
            "0px";

          const delay =
            style.getPropertyValue("--delay").trim() ||
            "0s";

          dot.style.setProperty(
            "animation",
            "none",
            "important"
          );

          dot.style.setProperty(
            "transition",
            "none",
            "important"
          );

          dot.style.setProperty(
            "transform",
            "translateY(0)",
            "important"
          );

          dot.style.setProperty(
            "opacity",
            "0",
            "important"
          );

          void dot.getBoundingClientRect();

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {

              dot.style.setProperty(
                "transition",
                `transform 1.05s cubic-bezier(.22,.61,.36,1) ${delay},
                 opacity .28s ease ${delay}`,
                "important"
              );

              dot.style.setProperty(
                "transform",
                `translateY(${fall})`,
                "important"
              );

              dot.style.setProperty(
                "opacity",
                ".95",
                "important"
              );
            });
          });
        });

    } catch (error) {
      /*
       * If animation itself fails, showing the COMPLETE
       * curve is better than leaving a broken half-curve.
       */
      finishCurve(curve);

      console.warn(
        "StatArchive hero animation:",
        error
      );
    }
  }


  function scheduleAnimation(delay) {
    clearTimeout(replayTimer);

    replayTimer = setTimeout(
      animateHero,
      delay
    );
  }


  /* Normal first load */
  if (document.readyState === "complete") {
    scheduleAnimation(100);
  } else {
    window.addEventListener(
      "load",
      () => scheduleAnimation(100),
      { once: true }
    );
  }


  /* Returning to the WebView page */
  window.addEventListener(
    "pageshow",
    () => scheduleAnimation(150)
  );


  /*
   * WebView occasionally finishes calculating its viewport
   * after the document has already loaded.
   */
  setTimeout(() => {
    scheduleAnimation(0);
  }, 550);


  /* Orientation / viewport changes */
  window.addEventListener(
    "resize",
    () => {
      if (isPhoneLayout()) {
        scheduleAnimation(200);
      }
    }
  );


  /*
   * If Android temporarily backgrounds the WebView during
   * startup/resume, make certain the graph is complete when
   * the page becomes visible again.
   */
  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState === "visible" &&
        isPhoneLayout()
      ) {
        const curve =
          document.querySelector(".gaussian-curve");

        if (
          curve &&
          curve.style.strokeDashoffset !== "0"
        ) {
          scheduleAnimation(100);
        }
      }
    }
  );

})();
