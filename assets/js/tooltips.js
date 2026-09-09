/* application section */

(function(){
  let tooltip = null;
  let activeTitle = null;

  function ensureTooltip(){
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.id = "entry-full-title-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function positionTooltip(target){
    if (!tooltip || !target) return;
    const r = target.getBoundingClientRect();
    const gap = 10;
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    tooltip.style.maxWidth = Math.min(420, window.innerWidth - 24) + "px";

    const tr = tooltip.getBoundingClientRect();
    let left = Math.max(12, Math.min(r.left, window.innerWidth - tr.width - 12));
    let top = r.top - tr.height - gap;

    if (top < 12) top = Math.min(window.innerHeight - tr.height - 12, r.bottom + gap);

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  document.addEventListener("pointerover", function(e){
    const title = e.target.closest(".card-title[data-full-title], .card-type[data-full-title]");
    if (!title || title === activeTitle) return;
    activeTitle = title;
    const full = title.dataset.fullTitle || title.textContent.trim();
    if (!full) return;
    ensureTooltip().textContent = full;
    tooltip.classList.add("show");
    positionTooltip(title);
  });

  document.addEventListener("pointermove", function(e){
    if (!activeTitle || !tooltip) return;
    if (!activeTitle.isConnected) { activeTitle = null; tooltip.classList.remove("show"); return; }
    const title = e.target.closest(".card-title[data-full-title], .card-type[data-full-title]");
    if (title === activeTitle) positionTooltip(activeTitle);
  });

  document.addEventListener("pointerout", function(e){
    if (!activeTitle) return;
    const leaving = e.target.closest(".card-title[data-full-title], .card-type[data-full-title]");
    if (!leaving || leaving !== activeTitle) return;
    if (e.relatedTarget && leaving.contains(e.relatedTarget)) return;
    activeTitle = null;
    if (tooltip) tooltip.classList.remove("show");
  });

  document.addEventListener("focusin", function(e){
    const title = e.target.closest(".card-title[data-full-title], .card-type[data-full-title]");
    if (!title) return;
    activeTitle = title;
    const full = title.dataset.fullTitle || title.textContent.trim();
    ensureTooltip().textContent = full;
    tooltip.classList.add("show");
    positionTooltip(title);
  });

  document.addEventListener("focusout", function(e){
    if (e.target.matches(".card-title[data-full-title], .card-type[data-full-title]")) {
      activeTitle = null;
      if (tooltip) tooltip.classList.remove("show");
    }
  });

  window.addEventListener("scroll", function(){
    if (activeTitle) positionTooltip(activeTitle);
  }, true);

  window.addEventListener("resize", function(){
    if (activeTitle) positionTooltip(activeTitle);
  });
})();

/* =========================================================
   OFFLINE ACTION — HARD ENABLE FOR WEB + PWA
   styles.css contains an older PWA-only !important hide rule.
   Use inline !important so no author stylesheet can hide the action.
   ========================================================= */
(function(){
  "use strict";

  function forceOfflineActions(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".card .card-actions .offline-btn").forEach(btn => {
      btn.style.setProperty("display", "inline-flex", "important");
      btn.style.setProperty("visibility", "visible", "important");
      btn.style.setProperty("opacity", "1", "important");
      btn.style.setProperty("pointer-events", "auto", "important");
      btn.removeAttribute("aria-hidden");
      btn.tabIndex = 0;
    });

    scope.querySelectorAll(".card .card-actions").forEach(row => {
      const offline = row.querySelector(".offline-btn");
      if (!offline) return;
      row.style.setProperty("display", "grid", "important");
      row.style.setProperty("grid-template-columns", "repeat(3,minmax(0,1fr))", "important");
      row.style.setProperty("gap", window.innerWidth <= 700 ? "6px" : "8px", "important");
      row.querySelectorAll(".action-btn").forEach(btn => {
        btn.style.setProperty("width", "100%", "important");
        btn.style.setProperty("min-width", "0", "important");
      });
    });
  }

  forceOfflineActions(document);

  const grid = document.getElementById("grid");
  if (grid) {
    new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) forceOfflineActions(node);
        });
      }
      forceOfflineActions(grid);
    }).observe(grid, { childList:true, subtree:true });
  }

  document.addEventListener("DOMContentLoaded", () => forceOfflineActions(document), { once:true });
  window.addEventListener("pageshow", () => forceOfflineActions(document));
})();
