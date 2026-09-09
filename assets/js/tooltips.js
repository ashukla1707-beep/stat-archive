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

/* Desktop card actions stay compact. */
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

html body .card .card-actions:has(.edit-btn),
html body .card .card-actions:has(.del-btn){
  flex-wrap:wrap !important;
  justify-content:flex-start !important;
}

html body .card .card-actions .edit-btn,
html body .card .card-actions .del-btn{
  min-width:28px !important;
}

/* =========================================================
   MOBILE CARD ACTIONS — reference-style large touch pills
   ========================================================= */
@media(max-width:700px){
  html body .subject-track .card{
    padding:16px 16px 14px !important;
    border-radius:16px !important;
  }

  html body .card .card-meta-row{
    margin-bottom:10px !important;
  }

  html body .card.card-no-title .card-meta-row{
    min-height:50px !important;
  }

  html body .card .card-actions,
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    display:grid !important;
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    align-items:stretch !important;
    justify-content:stretch !important;
    gap:10px !important;
    padding-top:12px !important;
    flex-wrap:unset !important;
  }

  html body .card .card-actions .action-btn{
    display:flex !important;
    flex:1 1 auto !important;
    flex-direction:row !important;
    align-items:center !important;
    justify-content:center !important;
    gap:6px !important;
    width:100% !important;
    min-width:0 !important;
    max-width:none !important;
    height:48px !important;
    min-height:48px !important;
    padding:0 8px !important;
    margin:0 !important;
    border-radius:14px !important;
    white-space:nowrap !important;
    word-break:keep-all !important;
    overflow-wrap:normal !important;
    text-align:center !important;
    line-height:1 !important;
    font-size:14px !important;
    font-weight:700 !important;
    box-sizing:border-box !important;
  }

  html body .card .card-actions .action-btn br{
    display:none !important;
  }

  /* Dark theme — matches the supplied reference. */
  body:not([data-theme="light"]) .card .card-actions .pv-btn,
  body:not([data-theme="light"]) .card .card-actions .offline-btn{
    color:#63efff !important;
    background:rgba(21,56,68,.78) !important;
    border:1px solid rgba(99,239,255,.34) !important;
    box-shadow:
      inset 0 0 0 1px rgba(99,239,255,.08),
      0 0 18px rgba(56,210,235,.08) !important;
  }

  body:not([data-theme="light"]) .card .card-actions .dl-btn{
    color:#eef2f8 !important;
    background:rgba(17,24,36,.92) !important;
    border:1px solid rgba(255,255,255,.045) !important;
    box-shadow:0 8px 18px rgba(0,0,0,.12) !important;
  }

  /* Light theme — same geometry, existing Stat Archive palette. */
  body[data-theme="light"] .card .card-actions .pv-btn,
  body[data-theme="light"] .card .card-actions .offline-btn{
    color:#4b365f !important;
    background:#f1ebf6 !important;
    border:1px solid #d8cce2 !important;
    box-shadow:0 5px 14px rgba(75,54,95,.07) !important;
  }

  body[data-theme="light"] .card .card-actions .offline-btn.is-saved,
  body[data-theme="light"] .card .card-actions .pv-btn.is-previewed{
    color:#fff !important;
    background:#4b365f !important;
    border-color:#4b365f !important;
  }

  body[data-theme="light"] .card .card-actions .dl-btn{
    color:#27302d !important;
    background:#eee9f4 !important;
    border:1px solid #ddd4e4 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded{
    color:#fff !important;
    background:#4b365f !important;
    border-color:#4b365f !important;
  }

  /* Contributor controls continue on a clean second row when present. */
  html body .card .card-actions .edit-btn,
  html body .card .card-actions .del-btn{
    height:42px !important;
    min-height:42px !important;
    border-radius:12px !important;
    font-size:12.5px !important;
  }
}

/* Very narrow phones: retain the 3-column layout while trimming typography. */
@media(max-width:380px){
  html body .subject-track .card{
    padding-left:13px !important;
    padding-right:13px !important;
  }

  html body .card .card-actions,
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    gap:6px !important;
  }

  html body .card .card-actions .action-btn{
    height:44px !important;
    min-height:44px !important;
    padding:0 5px !important;
    border-radius:12px !important;
    font-size:12px !important;
    gap:4px !important;
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