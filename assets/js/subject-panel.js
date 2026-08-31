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

  /* Use essentially the entire graph card. The card dimensions are not
     changed; only the SVG canvas is enlarged to the card edges. */
  .hero-probability .probability-svg{
    position:absolute !important;
    left:-16px !important;
    right:auto !important;
    top:16px !important;
    width:488px !important;
    height:189px !important;
    max-width:none !important;
    transform:none !important;
  }

  /* Curve and x-axis keep the same native horizontal span (x=18..502),
     so their visible start/end points remain aligned. */
  .hero-probability .dot-baseline{
    transform:none !important;
    transform-origin:center center !important;
    stroke:rgba(94,231,247,.55) !important;
    stroke-width:1.25 !important;
  }

  /* Lift the curve tails clearly above the x-axis while making the bell
     taller, so it occupies the maximum useful vertical area. */
  .hero-probability .gaussian-curve{
    transform-box:fill-box !important;
    transform-origin:center bottom !important;
    transform:translateY(-11px) scaleY(1.18) !important;
  }

  .hero-probability .axis-mid{
    bottom:1px !important;
  }

  /* Menu uses the same visual material as the graph card, so it blends
     into the surrounding panel instead of looking like a separate box. */
  .main-menu-btn{
    top:34px !important;
    right:66px !important;
    background:
      linear-gradient(145deg, rgba(18,28,40,.34), rgba(8,14,22,.22)) !important;
    border:1px solid rgba(148,163,184,.20) !important;
    color:#f5f7fb !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      0 6px 16px rgba(0,0,0,.055) !important;
  }

  .main-menu-btn:hover{
    background:
      linear-gradient(145deg, rgba(25,38,52,.42), rgba(10,18,28,.28)) !important;
    border-color:rgba(94,231,247,.28) !important;
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
    background:
      linear-gradient(145deg, rgba(255,255,255,.48), rgba(244,240,230,.28)) !important;
    border-color:rgba(67,73,69,.14) !important;
    color:#4b365f !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.62),
      0 5px 14px rgba(58,53,42,.035) !important;
  }

  body[data-theme="light"] .main-menu-btn:hover{
    background:
      linear-gradient(145deg, rgba(255,255,255,.62), rgba(244,240,230,.38)) !important;
    border-color:rgba(52,125,115,.24) !important;
    color:#4b365f !important;
  }
}

@media (max-width:700px){
  .hero-probability .curve-note.note-one{
    display:none !important;
  }
}
`;
  document.head.appendChild(style);
})();
