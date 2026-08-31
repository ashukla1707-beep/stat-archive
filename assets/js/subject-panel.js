/* application section */

document.addEventListener("pointerdown", (e) => {
  const panel = document.getElementById("subjectFilterExpanded");
  if (!panel || !panel.classList.contains("open")) return;
  const row = document.getElementById("subjectFilterRow");
  if (row && row.contains(e.target)) return;

  panel.remove();
  const more = row?.querySelector(".subject-more-pill");
  if (more) more.textContent = "More";
}, {passive:true});

/* Desktop hero visual polish. Injected here so it loads after the CSS files
   and cleanly wins over the older desktop hero experiments. */
(() => {
  const style = document.createElement("style");
  style.id = "statArchiveHeroFinalPolish";
  style.textContent = `
@media (min-width:901px){
  /* Mobile-like translucent block effect: visible outline, subtle inner
     highlight and enough transparency for the hero grid/background. */
  .hero-probability{
    background:
      radial-gradient(circle at 52% 58%, rgba(94,231,247,.075), transparent 52%),
      linear-gradient(145deg, rgba(18,28,40,.36), rgba(8,14,22,.20)) !important;
    border:1px solid rgba(148,163,184,.20) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.045),
      inset 0 0 0 1px rgba(94,231,247,.018),
      0 10px 28px rgba(0,0,0,.075) !important;
    backdrop-filter:none !important;
    -webkit-backdrop-filter:none !important;
  }

  /* Curve and x-axis use the same native SVG span: x=18 through x=502.
     No horizontal scaling is applied, so their start/end positions match. */
  .hero-probability .dot-baseline{
    transform:none !important;
    transform-origin:center center !important;
    stroke:rgba(94,231,247,.55) !important;
    stroke-width:1.25 !important;
  }

  .hero-probability .gaussian-curve{
    transform-box:fill-box !important;
    transform-origin:center bottom !important;
    transform:translateY(-6px) scaleY(1.12) !important;
  }

  /* Menu stays inside the graph card with even right/top spacing. */
  .main-menu-btn{
    top:34px !important;
    right:66px !important;
    background:rgba(94,231,247,.10) !important;
    border:1px solid rgba(94,231,247,.48) !important;
    color:#ffffff !important;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.025),
      0 0 18px rgba(94,231,247,.08) !important;
  }

  .main-menu-btn:hover{
    background:rgba(94,231,247,.16) !important;
    border-color:rgba(94,231,247,.72) !important;
    color:#ffffff !important;
  }

  body[data-theme="light"] .hero-probability{
    background:
      radial-gradient(circle at 52% 58%, rgba(52,125,115,.055), transparent 52%),
      linear-gradient(145deg, rgba(255,255,255,.42), rgba(244,240,230,.22)) !important;
    border-color:rgba(67,73,69,.14) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.68),
      inset 0 0 0 1px rgba(52,125,115,.025),
      0 9px 22px rgba(58,53,42,.045) !important;
  }

  body[data-theme="light"] .main-menu-btn{
    background:rgba(52,125,115,.10) !important;
    border-color:rgba(52,125,115,.42) !important;
    color:#4b365f !important;
    box-shadow:0 0 14px rgba(52,125,115,.06) !important;
  }
}
`;
  document.head.appendChild(style);
})();
