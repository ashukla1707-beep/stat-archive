/* Stat Archive — More / Show less clean runtime
   Single-owner replacement for the old V2–V7 transition chain.

   Interaction model:
   - More never scrolls the document.
   - Show less remains after the final expanded subject.
   - No animated height, no spacer, no scripted multi-screen scroll.
   - State changes are hidden inside a short compositor crossfade.
*/
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TOGGLE_CLEAN_V1__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TOGGLE_CLEAN_V1__ = true;

  const OUT_MS = 105;
  const IN_MS = 185;
  const VIEW_MS = 250;
  let busy = false;

  function grid() {
    return document.getElementById("grid");
  }

  function toggleButton() {
    return grid()?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn") || null;
  }

  function currentY() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function maxY() {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(0, Math.max(root?.scrollHeight || 0, body?.scrollHeight || 0) - window.innerHeight);
  }

  function forceY(y) {
    const root = document.documentElement;
    const old = root.style.scrollBehavior;
    root.style.setProperty("scroll-behavior", "auto", "important");
    window.scrollTo(0, Math.max(0, Math.min(y, maxY())));
    if (old) root.style.scrollBehavior = old;
    else root.style.removeProperty("scroll-behavior");
  }

  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntryToggleCleanStyle")) return;
    const style = document.createElement("style");
    style.id = "statArchiveEntryToggleCleanStyle";
    style.textContent = `
html.sa-entry-toggle-swap,
html.sa-entry-toggle-swap body,
html.sa-entry-toggle-swap #grid,
html.sa-entry-toggle-swap #grid > *{
  overflow-anchor:none !important;
}

html.sa-entry-toggle-busy .entry-subject-more-btn{
  pointer-events:none !important;
}

@keyframes sa-entry-old-fade{
  from{opacity:1;}
  to{opacity:0;}
}
@keyframes sa-entry-new-fade{
  from{opacity:0;}
  to{opacity:1;}
}

::view-transition-old(root){
  animation:${VIEW_MS}ms ease-out both sa-entry-old-fade !important;
}
::view-transition-new(root){
  animation:${VIEW_MS}ms ease-in both sa-entry-new-fade !important;
}
`;
    document.head.appendChild(style);
  }

  function markButton(expanded) {
    const button = toggleButton();
    if (!button) return;
    button.textContent = expanded ? "Show less" : "More";
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    button.removeAttribute("aria-busy");
  }

  function applyState(expanded, savedY) {
    document.documentElement.classList.add("sa-entry-toggle-swap");

    showAllEntrySubjects = expanded;
    render();

    if (expanded) forceY(savedY);
    else forceY(maxY());

    markButton(expanded);
  }

  function settle(expanded, savedY) {
    requestAnimationFrame(() => {
      if (expanded) forceY(savedY);
      else forceY(maxY());

      requestAnimationFrame(() => {
        if (expanded) forceY(savedY);
        else forceY(maxY());

        document.documentElement.classList.remove("sa-entry-toggle-swap");
        document.documentElement.classList.remove("sa-entry-toggle-busy");
        busy = false;
      });
    });
  }

  async function fallbackFade(expanded, savedY) {
    const before = grid();

    if (!before || reducedMotion()) {
      applyState(expanded, savedY);
      settle(expanded, savedY);
      return;
    }

    try {
      const out = before.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: OUT_MS, easing: "ease-out", fill: "forwards" }
      );
      await out.finished.catch(() => {});
    } catch (_) {}

    applyState(expanded, savedY);

    const after = grid();
    if (after) {
      try {
        const incoming = after.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: IN_MS, easing: "ease-out", fill: "both" }
        );
        await incoming.finished.catch(() => {});
      } catch (_) {}
    }

    settle(expanded, savedY);
  }

  async function swap(expanded, button) {
    if (busy) return;
    busy = true;

    const savedY = currentY();
    button.blur();
    button.setAttribute("aria-busy", "true");
    document.documentElement.classList.add("sa-entry-toggle-busy");

    if (!reducedMotion() && typeof document.startViewTransition === "function") {
      try {
        const transition = document.startViewTransition(() => {
          applyState(expanded, savedY);
        });
        await transition.finished.catch(() => {});
        settle(expanded, savedY);
        return;
      } catch (_) {
        // Fall through to the explicit fade implementation.
      }
    }

    await fallbackFade(expanded, savedY);
  }

  ensureStyle();

  // One capture-phase owner. This prevents archive-ui.js's historical inline
  // handler from running, so no legacy scroll compensation can occur.
  window.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest?.(".entry-subject-more-btn");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (busy) return;

    let expanded = false;
    try { expanded = !!showAllEntrySubjects; } catch (_) {}

    void swap(!expanded, button);
  }, true);
})();
