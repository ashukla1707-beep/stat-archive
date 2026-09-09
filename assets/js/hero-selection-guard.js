(() => {
  "use strict";

  const STYLE_ID = "statArchiveHeroSelectionGuardStyle";
  const HERO_SELECTOR = ".hero-line .sub";

  function clearHeroSelection() {
    const selection = window.getSelection?.();
    if (!selection?.rangeCount) return;

    const sub = document.querySelector(HERO_SELECTOR);
    if (!sub) return;

    try {
      const ancestor = selection.getRangeAt(0).commonAncestorContainer;
      const node = ancestor.nodeType === Node.ELEMENT_NODE
        ? ancestor
        : ancestor.parentElement;
      if (node && (node === sub || sub.contains(node))) {
        selection.removeAllRanges();
      }
    } catch (_) {}
  }

  function installGuard() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
html body .header .hero-line .sub,
html body .header .hero-line .sub *{
  -webkit-user-select:none !important;
  user-select:none !important;
  -webkit-touch-callout:none !important;
  -webkit-tap-highlight-color:transparent !important;
}

html body .header .hero-line .hero-sub-lead,
html body .header .hero-line .hero-sub-tail{
  width:auto !important;
  min-width:0 !important;
  height:auto !important;
  min-height:0 !important;
  background:none !important;
  background-image:none !important;
  box-shadow:none !important;
}

html body .header .hero-line .sub::selection,
html body .header .hero-line .sub *::selection,
html body .header .hero-line .sub::-moz-selection,
html body .header .hero-line .sub *::-moz-selection{
  background:transparent !important;
  color:inherit !important;
  text-shadow:none !important;
}
`;
      document.head.appendChild(style);
    }

    clearHeroSelection();
    requestAnimationFrame(clearHeroSelection);
    setTimeout(clearHeroSelection, 120);
  }

  document.addEventListener("selectionchange", clearHeroSelection);
  window.addEventListener("pageshow", installGuard);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installGuard, { once: true });
  } else {
    installGuard();
  }
})();
