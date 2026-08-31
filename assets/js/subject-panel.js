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
  .hero-probability{
    background:
      radial-gradient(circle at 58% 56%, rgba(94,231,247,.045), transparent 56%),
      linear-gradient(145deg, rgba(18,28,40,.30), rgba(8,14,22,.17)) !important;
    border:1px solid rgba(148,163,184,.15) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.025),
      0 12px 30px rgba(0,0,0,.10) !important;
    backdrop-filter:none !important;
    -webkit-backdrop-filter:none !important;
  }

  .main-menu-btn{
    top:32px !important;
    right:64px !important;
  }

  body[data-theme="light"] .hero-probability{
    background:
      radial-gradient(circle at 58% 56%, rgba(52,125,115,.035), transparent 56%),
      linear-gradient(145deg, rgba(255,255,255,.34), rgba(244,240,230,.18)) !important;
    border-color:rgba(67,73,69,.12) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.55),
      0 10px 24px rgba(58,53,42,.055) !important;
  }
}
`;
  document.head.appendChild(style);
})();
