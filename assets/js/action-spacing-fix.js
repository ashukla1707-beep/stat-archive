(() => {
  "use strict";

  if (document.getElementById("statArchiveActionSpacingFix")) return;

  const style = document.createElement("style");
  style.id = "statArchiveActionSpacingFix";
  style.textContent = `
/* One separator only: the Types section owns the divider. */
html body .toolbar > .archive-type-filter-section{
  border-top:0 !important;
  border-bottom:1px solid var(--line) !important;
  box-shadow:none !important;
}

/* The signed-in action row must never draw a second separator. */
html body .toolbar > .archive-action-row,
html body .toolbar > .archive-type-filter-section + .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:0 !important;
  position:relative !important;
}

html body .toolbar > .archive-action-row::before,
html body .toolbar > .archive-action-row::after,
html body .toolbar > .archive-type-filter-section + .archive-action-row::before,
html body .toolbar > .archive-type-filter-section + .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

/* Archive Entries: show label only, no horizontal rule. */
html body .archive-entries-divider{
  border:0 !important;
  border-top:0 !important;
  box-shadow:none !important;
  margin-top:0 !important;
  padding-top:20px !important;
  margin-bottom:16px !important;
  display:block !important;
}

html body .archive-entries-divider > span{
  display:inline-block !important;
  padding:0 !important;
  margin:0 !important;
  line-height:1 !important;
  position:relative !important;
  top:0 !important;
  transform:none !important;
}

html body .archive-entries-divider > i,
html body .archive-entries-divider::before,
html body .archive-entries-divider::after{
  display:none !important;
  content:none !important;
  border:0 !important;
  width:0 !important;
  height:0 !important;
  background:none !important;
  box-shadow:none !important;
}

@media(max-width:700px){
  html body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:18px !important;
    margin-bottom:12px !important;
  }
}

/* Card-action sizing is owned by menu-alignment-fix.js. */
`;
  document.head.appendChild(style);

  const CENTER_PROPS = [
    "position", "top", "left", "right", "bottom", "width", "max-width",
    "height", "max-height", "transform", "transform-origin"
  ];

  function clearOldWrongTarget(el) {
    if (!el) return;
    CENTER_PROPS.forEach(prop => el.style.removeProperty(prop));
  }

  function findActualMenuPanel() {
    const marker =
      document.getElementById("menuOfflineLibraryBtn") ||
      document.getElementById("mainMenuCloseBtn") ||
      Array.from(document.querySelectorAll("button,div,a"))
        .find(el => /About Stat Archive/i.test(el.textContent || ""));

    return marker?.closest(".main-side-menu")
      || document.getElementById("mainSideMenu")
      || null;
  }

  function centerActualDesktopMenu() {
    if (!window.matchMedia("(min-width:701px)").matches) return;

    const actual = findActualMenuPanel();
    if (!actual) return;

    document.querySelectorAll(".main-side-menu").forEach(el => {
      if (el !== actual) clearOldWrongTarget(el);
    });

    actual.style.setProperty("position", "fixed", "important");
    actual.style.setProperty("top", "50%", "important");
    actual.style.setProperty("left", "50%", "important");
    actual.style.setProperty("right", "auto", "important");
    actual.style.setProperty("bottom", "auto", "important");
    actual.style.setProperty(
      "width",
      "min(440px, calc(100vw - 48px))",
      "important"
    );
    actual.style.setProperty("max-width", "calc(100vw - 48px)", "important");
    actual.style.setProperty("height", "auto", "important");
    actual.style.setProperty("max-height", "calc(100dvh - 48px)", "important");
    actual.style.setProperty("transform", "translate(-50%, -50%)", "important");
    actual.style.setProperty("transform-origin", "center center", "important");
  }

  let frame = 0;
  function scheduleCenter() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      centerActualDesktopMenu();
    });
  }

  scheduleCenter();
  window.addEventListener("resize", scheduleCenter, { passive: true });
  window.addEventListener("pageshow", scheduleCenter);

  document.getElementById("mainMenuBtn")?.addEventListener("click", () => {
    scheduleCenter();
    setTimeout(scheduleCenter, 80);
  });

  const menu = document.getElementById("mainSideMenu");
  if (menu) {
    new MutationObserver(scheduleCenter).observe(menu, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
})();
