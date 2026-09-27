/* Stat Archive — More / Show less V7
   Rebuilt around the browser compositor instead of document scrolling.

   Rules:
   - More never scrolls the document.
   - Show less stays after the final expanded subject.
   - Collapse does not animate card heights and does not scroll through subjects.
   - Modern Chrome/Android WebView uses the View Transition API so the current
     viewport is snapshotted by the compositor, the compact DOM is rendered at
     its natural bottom position, and the two visual states are blended/moved
     smoothly without exposing the intermediate page travel.
*/
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V7__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V7__ = true;

  // Block every older cached runtime from registering after V7.
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V6__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V5__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;

  const TRANSITION_MS = 320;
  let busy = false;
  let token = 0;

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function host() {
    return document.getElementById("grid");
  }

  function toggleWrap() {
    return host()?.querySelector(":scope > .entry-subject-more-wrap") || null;
  }

  function toggleButton() {
    return toggleWrap()?.querySelector(".entry-subject-more-btn") || null;
  }

  function currentY() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function maxY() {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(
      0,
      Math.max(root?.scrollHeight || 0, body?.scrollHeight || 0) - window.innerHeight
    );
  }

  function forceY(y) {
    const root = document.documentElement;
    const old = root.style.scrollBehavior;
    root.style.setProperty("scroll-behavior", "auto", "important");
    window.scrollTo(0, Math.max(0, Math.min(y, maxY())));
    if (old) root.style.scrollBehavior = old;
    else root.style.removeProperty("scroll-behavior");
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntrySubjectTransitionV7Style")) return;
    const style = document.createElement("style");
    style.id = "statArchiveEntrySubjectTransitionV7Style";
    style.textContent = `
html.sa-entry-more-layout-lock,
html.sa-entry-more-layout-lock body,
html.sa-entry-more-layout-lock #grid,
html.sa-entry-more-layout-lock #grid > *{
  overflow-anchor:none !important;
}

html.sa-entry-more-transitioning .entry-subject-more-btn{
  pointer-events:none !important;
}

@keyframes sa-entry-vt-old{
  from{opacity:1;transform:translateY(0) scale(1);}
  to{opacity:0;transform:translateY(-10px) scale(.997);}
}
@keyframes sa-entry-vt-new{
  from{opacity:0;transform:translateY(10px) scale(.997);}
  to{opacity:1;transform:translateY(0) scale(1);}
}

::view-transition-old(root){
  animation:${TRANSITION_MS}ms cubic-bezier(.2,.7,.2,1) both sa-entry-vt-old !important;
}
::view-transition-new(root){
  animation:${TRANSITION_MS}ms cubic-bezier(.2,.7,.2,1) both sa-entry-vt-new !important;
}
`;
    document.head.appendChild(style);
  }

  function pinExpansion(savedY, localToken) {
    forceY(savedY);
    requestAnimationFrame(() => {
      if (localToken !== token) return;
      forceY(savedY);
      requestAnimationFrame(() => {
        if (localToken !== token) return;
        forceY(savedY);
        document.documentElement.classList.remove("sa-entry-more-layout-lock");
      });
    });
  }

  function expand(button) {
    if (busy) return;
    token += 1;
    const localToken = token;
    const savedY = currentY();

    button.blur();
    document.documentElement.classList.add("sa-entry-more-layout-lock");

    showAllEntrySubjects = true;
    render();

    const replacement = toggleButton();
    if (replacement) {
      replacement.textContent = "Show less";
      replacement.setAttribute("aria-expanded", "true");
    }

    // Adding rows below the viewport must never move the reader.
    pinExpansion(savedY, localToken);
  }

  function renderCollapsedAtNaturalBottom() {
    document.documentElement.classList.add("sa-entry-more-layout-lock");

    showAllEntrySubjects = false;
    render();

    // The reader pressed Show less at the natural end of the expanded list.
    // After collapse, keep the equivalent natural end position: More at the
    // bottom of the compact list. This happens while the old viewport snapshot
    // is still covering the page, so no travel through intermediate subjects
    // is ever shown.
    forceY(maxY());

    const replacement = toggleButton();
    if (replacement) {
      replacement.textContent = "More";
      replacement.setAttribute("aria-expanded", "false");
      replacement.removeAttribute("aria-busy");
    }
  }

  function finishCollapse(localToken) {
    if (localToken !== token) return;
    requestAnimationFrame(() => {
      if (localToken !== token) return;
      forceY(maxY());
      requestAnimationFrame(() => {
        if (localToken !== token) return;
        forceY(maxY());
        document.documentElement.classList.remove("sa-entry-more-layout-lock");
        document.documentElement.classList.remove("sa-entry-more-transitioning");
        busy = false;
      });
    });
  }

  async function collapse(button) {
    if (busy) return;
    busy = true;
    token += 1;
    const localToken = token;

    button.blur();
    button.setAttribute("aria-busy", "true");
    document.documentElement.classList.add("sa-entry-more-transitioning");

    // Reduced-motion users and very old WebViews get a direct state change.
    if (prefersReducedMotion() || typeof document.startViewTransition !== "function") {
      renderCollapsedAtNaturalBottom();
      finishCollapse(localToken);
      return;
    }

    try {
      const transition = document.startViewTransition(() => {
        if (localToken !== token) return;
        renderCollapsedAtNaturalBottom();
      });

      // ready means the new-state snapshot exists; finished means the compositor
      // animation is fully complete. Ignore transient API errors and still leave
      // the DOM in the correct compact state.
      await transition.finished.catch(() => {});
    } catch (_) {
      if (localToken === token) renderCollapsedAtNaturalBottom();
    }

    finishCollapse(localToken);
  }

  ensureStyle();

  // Single owner in capture phase. This prevents archive-ui.js's historical
  // inline scroll-compensation onclick from executing at all.
  window.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest?.(".entry-subject-more-btn");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    let expanded = false;
    try { expanded = !!showAllEntrySubjects; } catch (_) {}

    if (expanded) void collapse(button);
    else expand(button);
  }, true);
})();
