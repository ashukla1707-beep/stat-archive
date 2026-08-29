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

