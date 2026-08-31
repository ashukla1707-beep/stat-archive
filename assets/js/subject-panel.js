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
  /* Give the probability card the same visible translucent block effect
     used by the mobile layout while still showing the hero background. */
  .hero-probability{
    background:
      radial-gradient(circle at 55% 58%, rgba(94,231,247,.065), transparent 54%),
      linear-gradient(145deg, rgba(18,28,40,.42), rgba(8,14,22,.24)) !important;
    border:1px solid rgba(148,163,184,.18) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.035),
      inset 0 -1px 0 rgba(94,231,247,.018),
      0 12px 30px rgba(0,0,0,.09) !important;
    backdrop-filter:none !important;
    -webkit-backdrop-filter:none !important;
  }

  /* The SVG already defines both the bell curve and x-axis from x=18 to
     x=502. Remove the previous x-axis stretching so both start and end at
     exactly the same horizontal positions. */
  .hero-probability .dot-baseline{
    transform:none !important;
    transform-origin:center center !important;
    stroke:rgba(94,231,247,.52) !important;
    stroke-width:1.25 !important;
  }

  /* Keep the menu inside the probability card with a clean right inset. */
  .main-menu-btn{
    top:32px !important;
    right:64px !important;
  }

  body[data-theme="light"] .hero-probability{
    background:
      radial-gradient(circle at 55% 58%, rgba(52,125,115,.05), transparent 54%),
      linear-gradient(145deg, rgba(255,255,255,.48), rgba(244,240,230,.24)) !important;
    border-color:rgba(67,73,69,.14) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.68),
      inset 0 -1px 0 rgba(52,125,115,.025),
      0 10px 24px rgba(58,53,42,.05) !important;
  }
}
`;
  document.head.appendChild(style);
})();
