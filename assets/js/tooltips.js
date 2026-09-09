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

/* Offline action hard-enable for web + PWA. */
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

/* =========================================================
   FILTER DIVIDER — ONE LINE ONLY
   ========================================================= */
(function(){
  "use strict";

  const style = document.createElement("style");
  style.id = "statArchiveSingleTypesDivider";
  style.textContent = `
html body .toolbar > .archive-type-filter-section{
  border-bottom:1px solid var(--line) !important;
}
html body .toolbar > .archive-action-row,
html body .toolbar > .archive-type-filter-section + .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  outline:0 !important;
}
html body .toolbar > .archive-action-row::before,
html body .toolbar > .archive-action-row::after,
html body .toolbar > .archive-type-filter-section + .archive-action-row::before,
html body .toolbar > .archive-type-filter-section + .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
  background:none !important;
  box-shadow:none !important;
}
html body .archive-entries-divider,
html body .archive-entries-divider::before,
html body .archive-entries-divider::after,
html body .archive-entries-divider > i{
  border:0 !important;
  border-top:0 !important;
  background:none !important;
  box-shadow:none !important;
}
html body .archive-entries-divider::before,
html body .archive-entries-divider::after,
html body .archive-entries-divider > i{
  content:none !important;
  display:none !important;
}
`;
  document.head.appendChild(style);

  function enforce(){
    const typeSection = document.querySelector(".toolbar > .archive-type-filter-section");
    const actionRow = document.querySelector(".toolbar > .archive-action-row");
    const entriesDivider = document.querySelector(".archive-entries-divider");

    if (typeSection) typeSection.style.setProperty("border-bottom", "1px solid var(--line)", "important");
    if (actionRow) {
      actionRow.style.setProperty("border", "0", "important");
      actionRow.style.setProperty("border-top", "0", "important");
      actionRow.style.setProperty("border-bottom", "0", "important");
      actionRow.style.setProperty("box-shadow", "none", "important");
      actionRow.style.setProperty("outline", "0", "important");
    }
    if (entriesDivider) {
      entriesDivider.style.setProperty("border", "0", "important");
      entriesDivider.style.setProperty("border-top", "0", "important");
      entriesDivider.style.setProperty("box-shadow", "none", "important");
    }
  }

  enforce();
  document.addEventListener("DOMContentLoaded", enforce, {once:true});
  window.addEventListener("pageshow", enforce);
  new MutationObserver(enforce).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:["class","style"]});
})();

/* =========================================================
   WEB / PWA REDESIGN SYNC
   The APK packages these presentation files, while web index.html only
   loads the base stack. Load the same redesign files explicitly on web.
   ========================================================= */
(function(){
  "use strict";

  const scripts = [
    ["menu-polish", "./assets/js/menu-polish.js?v=20260909-websync-1"],
    ["menu-alignment", "./assets/js/menu-alignment-fix.js?v=20260909-websync-1"],
    ["offline-hybrid", "./assets/js/offline-library-hybrid.js?v=20260909-websync-1"],
    ["offline-heading", "./assets/js/offline-library-heading-search-fix.js?v=20260909-websync-1"]
  ];

  function alreadyLoaded(key, src){
    const bare = src.split("?")[0].replace(/^\.\//, "");
    return !!document.querySelector(`script[data-sa-web-redesign="${key}"]`) ||
      Array.from(document.scripts).some(s => (s.src || "").includes(bare));
  }

  function loadOne(key, src){
    return new Promise(resolve => {
      if (alreadyLoaded(key, src)) { resolve(); return; }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.saWebRedesign = key;
      script.addEventListener("load", resolve, {once:true});
      script.addEventListener("error", resolve, {once:true});
      document.body.appendChild(script);
    });
  }

  async function loadRedesign(){
    for (const [key, src] of scripts) await loadOne(key, src);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadRedesign, {once:true});
  } else {
    loadRedesign();
  }
})();