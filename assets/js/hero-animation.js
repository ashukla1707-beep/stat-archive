(function () {
  "use strict";

  let hasAnimated = false;
  let animationTimer = null;

  function isPhoneLayout() {
    return (
      window.innerWidth <= 700 ||
      window.matchMedia("(max-width: 700px)").matches
    );
  }

  function prepareCurve(curve) {
    if (!curve || typeof curve.getTotalLength !== "function") {
      return false;
    }

    const length = Math.max(
      1,
      Math.ceil(curve.getTotalLength())
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

    return true;
  }

  function finishCurve(curve) {
    if (!curve) return;

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
      "stroke-dashoffset",
      "0",
      "important"
    );

    curve.style.setProperty(
      "opacity",
      "1",
      "important"
    );
  }

  function animateDots() {
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
              `transform 1s cubic-bezier(.22,.61,.36,1) ${delay},
               opacity .25s ease ${delay}`,
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
  }

  function runAnimation() {
    if (!isPhoneLayout()) {
      return;
    }

    if (hasAnimated) {
      const curve =
        document.querySelector(".gaussian-curve");

      finishCurve(curve);
      return;
    }

    const curve =
      document.querySelector(".gaussian-curve");

    if (!prepareCurve(curve)) {
      return;
    }

    hasAnimated = true;

    void curve.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curve.style.setProperty(
          "transition",
          "stroke-dashoffset 3s cubic-bezier(.22,.61,.36,1)",
          "important"
        );

        curve.style.setProperty(
          "stroke-dashoffset",
          "0",
          "important"
        );
      });
    });

    animateDots();

    clearTimeout(animationTimer);

    animationTimer = setTimeout(() => {
      finishCurve(curve);
    }, 3300);
  }

  function startWhenReady() {
    if (document.readyState === "complete") {
      setTimeout(runAnimation, 120);
    } else {
      window.addEventListener(
        "load",
        () => {
          setTimeout(runAnimation, 120);
        },
        { once: true }
      );
    }
  }

  startWhenReady();

  window.addEventListener(
    "pageshow",
    () => {
      if (!isPhoneLayout()) return;

      const curve =
        document.querySelector(".gaussian-curve");

      if (hasAnimated) {
        finishCurve(curve);
      } else {
        setTimeout(
          runAnimation,
          120
        );
      }
    }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState === "visible" &&
        isPhoneLayout()
      ) {
        const curve =
          document.querySelector(".gaussian-curve");

        if (hasAnimated) {
          finishCurve(curve);
        }
      }
    }
  );

})();
