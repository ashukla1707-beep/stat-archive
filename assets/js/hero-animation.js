(function () {
  "use strict";

  function restartHeroAnimation() {
    const curve = document.querySelector(".gaussian-curve");
    const dots = document.querySelectorAll(".data-dot");

    if (!curve) return;

    curve.style.animation = "none";
    curve.style.strokeDasharray = "";
    curve.style.strokeDashoffset = "";
    curve.style.opacity = "";

    void curve.getBoundingClientRect();

    curve.style.animation = "";

    dots.forEach(dot => {
      dot.style.animation = "none";

      void dot.getBoundingClientRect();

      dot.style.animation = "";
    });
  }

  function start() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restartHeroAnimation();
      });
    });
  }

  if (document.readyState === "loading") {
    window.addEventListener("load", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      restartHeroAnimation();
    }
  });
})();
