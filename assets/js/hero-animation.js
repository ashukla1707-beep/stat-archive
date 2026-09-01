(function () {
  "use strict";

  let started = false;

  function startHeroAnimation() {
    if (started) return;

    const curve = document.querySelector(".gaussian-curve");
    const dots = document.querySelectorAll(".data-dot");

    if (!curve) return;
    started = true;

    curve.style.setProperty("animation", "none", "important");
    curve.style.setProperty("transition", "none", "important");
    curve.style.setProperty("stroke-dasharray", "1", "important");
    curve.style.setProperty("stroke-dashoffset", "1", "important");
    curve.style.setProperty("opacity", "1", "important");

    dots.forEach(dot => {
      dot.style.setProperty("animation", "none", "important");
    });

    void curve.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curve.style.setProperty(
          "transition",
          "stroke-dashoffset 3.4s cubic-bezier(.22,.61,.36,1)",
          "important"
        );
        curve.style.setProperty("stroke-dashoffset", "0", "important");
        dots.forEach(dot => dot.style.removeProperty("animation"));
      });
    });

    setTimeout(() => {
      curve.style.setProperty("transition", "none", "important");
      curve.style.setProperty("stroke-dasharray", "none", "important");
      curve.style.setProperty("stroke-dashoffset", "0", "important");
    }, 3800);
  }

  function scheduleStart() {
    setTimeout(startHeroAnimation, 250);
  }

  if (document.readyState === "complete") {
    scheduleStart();
  } else {
    window.addEventListener("load", scheduleStart, { once: true });
  }

  /* =========================================================
     SINGLE AUTHORITATIVE HERO COPY/LAYOUT
     ========================================================= */

  function repairHeroCopy() {
    const sub = document.querySelector(".hero-line .sub");
    if (!sub) return;

    sub.innerHTML =
      '<span class="hero-sub-lead">A focused academic archive of notes and books, curated specifically for University of Lucknow</span>' +
      '<span class="hero-sub-tail"> — organized by subject and kept useful for everyone.</span>';
  }

  function installHeroLayout() {
    const old = document.getElementById("statArchiveDirectHeroFix");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "statArchiveDirectHeroFix";
    style.textContent = `
/* IMPORTANT: the original stylesheet uses .hero-line span for the small
   decorative line. These subtitle spans must never inherit that rule. */
html body .header .hero-line .sub .hero-sub-lead,
html body .header .hero-line .sub .hero-sub-tail{
  background:none !important;
  background-color:transparent !important;
  background-image:none !important;
  box-shadow:none !important;
  border:0 !important;
  width:auto !important;
  min-width:0 !important;
  height:auto !important;
  min-height:0 !important;
  max-height:none !important;
  padding:0 !important;
  color:inherit !important;
  -webkit-box-decoration-break:clone !important;
  box-decoration-break:clone !important;
}

html body .header .hero-line .sub,
html body .header .hero-line .sub *{
  user-select:none !important;
  -webkit-user-select:none !important;
  -webkit-touch-callout:none !important;
  -webkit-tap-highlight-color:transparent !important;
}

html body .header .hero-line .sub::selection,
html body .header .hero-line .sub *::selection{
  background:transparent !important;
  color:inherit !important;
}

html body .header .hero-line .sub::-moz-selection,
html body .header .hero-line .sub *::-moz-selection{
  background:transparent !important;
  color:inherit !important;
}

/* FULL DESKTOP */
@media (min-width:1101px){
  html body .header .hero-copy{
    width:58% !important;
    max-width:850px !important;
    position:relative !important;
    z-index:3 !important;
    transform:translateY(-18px) !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    display:flex !important;
    align-items:flex-start !important;
    gap:14px !important;
    width:100% !important;
    margin-top:18px !important;
    padding:0 !important;
    overflow:visible !important;
  }

  html body .header .hero-line > span[aria-hidden="true"]{
    position:static !important;
    flex:0 0 44px !important;
    width:44px !important;
    min-width:44px !important;
    height:1px !important;
    margin:10px 0 0 !important;
    padding:0 !important;
    transform:none !important;
  }

  html body .header .hero-line .sub{
    display:block !important;
    flex:1 1 auto !important;
    width:auto !important;
    max-width:none !important;
    min-width:0 !important;
    height:auto !important;
    max-height:none !important;
    margin:0 !important;
    padding:0 !important;
    overflow:visible !important;
    white-space:normal !important;
    font-size:13px !important;
    line-height:1.58 !important;
    transform:none !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:block !important;
    position:static !important;
    line-height:1.58 !important;
  }

  html body .header .hero-sub-lead{
    white-space:nowrap !important;
  }

  html body .header .hero-sub-tail{
    white-space:nowrap !important;
    margin-top:1px !important;
  }
}

/* TABLET / MOBILE BROWSER DESKTOP MODE */
@media (min-width:701px) and (max-width:1100px){
  html body .header .hero-copy{
    transform:none !important;
    overflow:visible !important;
  }

  html body .header .hero-line,
  html body .header .hero-line .sub{
    height:auto !important;
    max-height:none !important;
    overflow:visible !important;
    white-space:normal !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:inline !important;
    white-space:normal !important;
    line-height:inherit !important;
  }
}

/* PHONE / APK */
@media (max-width:700px){
  html body .header .hero-copy{
    transform:none !important;
    overflow:visible !important;
  }

  html body .header .hero-line{
    display:flex !important;
    align-items:flex-start !important;
    width:100% !important;
    overflow:visible !important;
  }

  html body .header .hero-line .sub{
    display:block !important;
    width:calc(100% - 41px) !important;
    max-width:none !important;
    height:auto !important;
    max-height:none !important;
    margin:0 !important;
    padding:0 0 8px !important;
    overflow:visible !important;
    white-space:normal !important;
    line-height:1.6 !important;
  }

  html body .header .hero-sub-lead,
  html body .header .hero-sub-tail{
    display:inline !important;
    position:static !important;
    white-space:normal !important;
    line-height:inherit !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function applyHeroFix() {
    repairHeroCopy();
    installHeroLayout();
  }

  applyHeroFix();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyHeroFix, { once: true });
  }

  window.addEventListener("pageshow", applyHeroFix);
})();
