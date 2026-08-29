/* application section */

(function(){
  let replayTimer = null;

  function isPhoneLayout(){
    return window.innerWidth <= 700 ||
           window.matchMedia("(max-width: 700px)").matches;
  }

  function replayMobileHero(){
    if (!isPhoneLayout()) return;

    const curve = document.querySelector(".gaussian-curve");
    if (!curve || typeof curve.getTotalLength !== "function") return;

    try {
      const length = Math.max(1, Math.ceil(curve.getTotalLength()));

      // Kill every competing CSS/keyframe animation first.
      curve.style.setProperty("animation", "none", "important");
      curve.style.setProperty("transition", "none", "important");
      curve.style.setProperty("stroke-dasharray", `${length} ${length}`, "important");
      curve.style.setProperty("stroke-dashoffset", String(length), "important");
      curve.style.setProperty("opacity", "1", "important");

      // Force Android/Chrome to paint the fully-hidden stroke before starting.
      void curve.getBoundingClientRect();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          curve.style.setProperty(
            "transition",
            "stroke-dashoffset 3.2s cubic-bezier(.22,.61,.36,1)",
            "important"
          );
          curve.style.setProperty("stroke-dashoffset", "0", "important");
        });
      });

      // Replay dots independently using transitions too.
      document.querySelectorAll(".data-dot").forEach((dot) => {
        const cs = getComputedStyle(dot);
        const fall = cs.getPropertyValue("--fall").trim() || "0px";
        const delayText = cs.getPropertyValue("--delay").trim() || "0s";

        dot.style.setProperty("animation", "none", "important");
        dot.style.setProperty("transition", "none", "important");
        dot.style.setProperty("transform", "translateY(0)", "important");
        dot.style.setProperty("opacity", "0", "important");

        void dot.getBoundingClientRect();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            dot.style.setProperty(
              "transition",
              `transform 1.05s cubic-bezier(.22,.61,.36,1) ${delayText}, opacity .28s ease ${delayText}`,
              "important"
            );
            dot.style.setProperty("transform", `translateY(${fall})`, "important");
            dot.style.setProperty("opacity", ".95", "important");
          });
        });
      });
    } catch (err) {
      console.warn("Hero animation failed:", err);
    }
  }

  function scheduleReplay(delay){
    clearTimeout(replayTimer);
    replayTimer = setTimeout(replayMobileHero, delay);
  }

  // Run only on a genuine page load/refresh.
  // Do not replay on resize, scroll-driven mobile viewport changes,
  // pageshow, or app resume.
  if (document.readyState === "complete") {
    scheduleReplay(100);
  } else {
    window.addEventListener("load", () => scheduleReplay(100), {once:true});
  }
})();

