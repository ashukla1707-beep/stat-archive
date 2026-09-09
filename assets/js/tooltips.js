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
   WEB + PWA CARD ACTIONS
   Static CSS only. No MutationObserver or DOM rewriting.
   ========================================================= */
(function(){
  "use strict";
  if (document.getElementById("statArchiveStableCardActions")) return;

  const style = document.createElement("style");
  style.id = "statArchiveStableCardActions";
  style.textContent = `
/* Offline is available on both normal web and installed PWA. */
html body .card .card-actions .offline-btn,
html:not(.stat-archive-pwa) body .card .card-actions .offline-btn,
html.stat-archive-pwa body .card .card-actions .offline-btn{
  display:inline-flex !important;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

/* Card action row: compact content-width controls, never equal-width grid cells. */
html body .card .card-actions{
  display:flex !important;
  flex-direction:row !important;
  flex-wrap:nowrap !important;
  align-items:center !important;
  justify-content:space-between !important;
  gap:5px !important;
  grid-template-columns:none !important;
}

html body .card .card-actions .action-btn{
  display:inline-flex !important;
  flex:0 0 auto !important;
  flex-direction:row !important;
  align-items:center !important;
  justify-content:center !important;
  width:auto !important;
  min-width:0 !important;
  max-width:none !important;
  height:28px !important;
  min-height:28px !important;
  padding:0 7px !important;
  margin:0 !important;
  border-radius:7px !important;
  white-space:nowrap !important;
  word-break:keep-all !important;
  overflow-wrap:normal !important;
  text-align:center !important;
  line-height:1 !important;
  font-size:11.5px !important;
  box-sizing:border-box !important;
}

/* Contributor/admin cards may have more controls; let those wrap cleanly. */
html body .card .card-actions:has(.edit-btn),
html body .card .card-actions:has(.del-btn){
  flex-wrap:wrap !important;
  justify-content:flex-start !important;
}

html body .card .card-actions .edit-btn,
html body .card .card-actions .del-btn{
  min-width:28px !important;
}

/* Mobile: tighten the whole card and keep the three primary actions balanced. */
@media(max-width:700px){
  html body .subject-track .card{
    padding:14px 14px 12px !important;
    border-radius:13px !important;
  }

  html body .card .card-meta-row{
    margin-bottom:8px !important;
  }

  html body .card.card-no-title .card-meta-row{
    min-height:46px !important;
  }

  html body .card .card-actions{
    justify-content:center !important;
    gap:5px !important;
    padding-top:8px !important;
  }

  html body .card .card-actions .action-btn{
    height:26px !important;
    min-height:26px !important;
    padding:0 5px !important;
    border-radius:6px !important;
    font-size:10.5px !important;
    line-height:1 !important;
  }

  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    justify-content:center !important;
    row-gap:5px !important;
  }

  html body .card .card-actions .edit-btn,
  html body .card .card-actions .del-btn{
    min-width:26px !important;
  }
}

/* Extra-narrow phones: shave a little more space without wrapping labels. */
@media(max-width:380px){
  html body .subject-track .card{
    padding-left:12px !important;
    padding-right:12px !important;
  }

  html body .card .card-actions{
    gap:3px !important;
  }

  html body .card .card-actions .action-btn{
    height:25px !important;
    min-height:25px !important;
    padding:0 4px !important;
    font-size:10px !important;
  }
}
`;
  document.head.appendChild(style);
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