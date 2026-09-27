/* Stat Archive — More / Show less V5
   Rebuilt from scratch around one lightweight DOM transition.

   Design:
   - More never scrolls the document.
   - Show less always remains after the final expanded subject.
   - The legacy archive render still owns subject/card construction.
   - Collapse never animates the heavy subject/card DOM. Extra rows fade once,
     are replaced by one empty spacer of the same measured height, and only that
     spacer is animated closed. There is no scripted page-scroll animation.
*/
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V5__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V5__ = true;

  // Stop any older cached transition runtime from registering after V5.
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;

  const ENTER_MS = 210;
  const FADE_OUT_MS = 115;
  const COLLAPSE_MS = 460;

  let collapsing = false;
  let transitionToken = 0;

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function visibleLimit() {
    try {
      return typeof VISIBLE_ENTRY_SUBJECT_LIMIT === "number"
        ? VISIBLE_ENTRY_SUBJECT_LIMIT
        : 6;
    } catch (_) {
      return 6;
    }
  }

  function grid() {
    return document.getElementById("grid");
  }

  function subjectRows() {
    const host = grid();
    if (!host) return [];
    return Array.from(
      host.querySelectorAll(":scope > .subject-row[data-subject-code]")
    );
  }

  function extraRows() {
    return subjectRows().slice(visibleLimit());
  }

  function toggleWrap() {
    return grid()?.querySelector(":scope > .entry-subject-more-wrap") || null;
  }

  function toggleButton() {
    return toggleWrap()?.querySelector(".entry-subject-more-btn") || null;
  }

  function currentY() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function setInstantScroll(y) {
    const root = document.documentElement;
    const old = root.style.scrollBehavior;
    root.style.setProperty("scroll-behavior", "auto", "important");
    window.scrollTo(0, y);
    if (old) root.style.scrollBehavior = old;
    else root.style.removeProperty("scroll-behavior");
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntrySubjectTransitionV5Style")) return;

    const style = document.createElement("style");
    style.id = "statArchiveEntrySubjectTransitionV5Style";
    style.textContent = `
html.sa-entry-more-expanding,
html.sa-entry-more-expanding body,
html.sa-entry-more-expanding #grid,
html.sa-entry-more-expanding #grid > *{
  overflow-anchor:none !important;
}

#grid > .sa-entry-collapse-spacer{
  display:block !important;
  width:100% !important;
  min-height:0 !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  overflow:hidden !important;
  pointer-events:none !important;
  contain:layout style paint !important;
  will-change:height !important;
}

html.sa-entry-more-collapsing #grid > .subject-row[data-subject-code]{
  overflow-anchor:none !important;
}
html.sa-entry-more-collapsing #grid > .sa-entry-collapse-spacer{
  overflow-anchor:none !important;
}
html.sa-entry-more-collapsing #grid > .entry-subject-more-wrap{
  overflow-anchor:auto !important;
}
`;
    document.head.appendChild(style);
  }

  function animateExtrasIn(rows) {
    if (prefersReducedMotion()) return;

    rows.forEach((row, index) => {
      try {
        row.animate(
          [
            { opacity: 0, transform: "translateY(7px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: ENTER_MS,
            delay: Math.min(index * 18, 90),
            easing: "cubic-bezier(.2,.75,.2,1)"
          }
        );
      } catch (_) {}
    });
  }

  function fadeExtrasOut(rows) {
    if (prefersReducedMotion()) return Promise.resolve();

    const animations = rows.map(row => {
      try {
        return row.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-3px)" }
          ],
          {
            duration: FADE_OUT_MS,
            easing: "ease-out",
            fill: "forwards"
          }
        ).finished.catch(() => {});
      } catch (_) {
        return Promise.resolve();
      }
    });

    return Promise.all(animations);
  }

  function expand(button) {
    transitionToken += 1;
    collapsing = false;
    const token = transitionToken;
    const savedY = currentY();

    button.blur();
    document.documentElement.classList.add("sa-entry-more-expanding");

    // Rendering all subjects is instantaneous from the user's current point.
    // The replacement Show less button remains in the natural final position.
    showAllEntrySubjects = true;
    render();
    setInstantScroll(savedY);

    if (token !== transitionToken) return;

    const replacement = toggleButton();
    if (replacement) {
      replacement.textContent = "Show less";
      replacement.setAttribute("aria-expanded", "true");
    }

    animateExtrasIn(extraRows());

    // Android WebView may apply delayed scroll anchoring one frame after the
    // DOM grows. Pin the exact pre-click Y once more, then return anchoring to
    // normal. This is not a visible scroll animation.
    requestAnimationFrame(() => {
      if (token !== transitionToken) return;
      setInstantScroll(savedY);
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("sa-entry-more-expanding");
      });
    });
  }

  async function collapse(button) {
    if (collapsing) return;
    collapsing = true;
    transitionToken += 1;
    const token = transitionToken;

    const host = grid();
    const rows = extraRows();
    const wrap = toggleWrap();

    if (!host || !wrap || !rows.length) {
      showAllEntrySubjects = false;
      render();
      collapsing = false;
      return;
    }

    button.blur();
    button.textContent = "More";
    button.setAttribute("aria-expanded", "false");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");

    document.documentElement.classList.add("sa-entry-more-collapsing");

    // Measure the exact document space occupied by all extra subjects. We keep
    // the real rows completely static during the short fade; no layout property
    // on a card/carousel is animated.
    const firstTop = rows[0].getBoundingClientRect().top;
    const buttonTopBefore = wrap.getBoundingClientRect().top;
    const occupiedHeight = Math.max(0, buttonTopBefore - firstTop);

    await fadeExtrasOut(rows);
    if (token !== transitionToken) return;

    // One empty block takes over the exact space of the removed heavy rows.
    // Removing those rows therefore does not move the button or viewport.
    const spacer = document.createElement("div");
    spacer.className = "sa-entry-collapse-spacer";
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = `${occupiedHeight}px`;
    host.insertBefore(spacer, rows[0]);
    rows.forEach(row => row.remove());

    // Correct for margins/gaps peculiar to the live grid so the Show less/More
    // control remains pixel-stable at the handoff from rows to spacer.
    const buttonTopAfterSwap = wrap.getBoundingClientRect().top;
    const correction = buttonTopBefore - buttonTopAfterSwap;
    const correctedHeight = Math.max(0, occupiedHeight + correction);
    spacer.style.height = `${correctedHeight}px`;
    spacer.getBoundingClientRect();

    showAllEntrySubjects = false;

    if (prefersReducedMotion() || correctedHeight < 1) {
      spacer.remove();
      button.disabled = false;
      button.removeAttribute("aria-busy");
      document.documentElement.classList.remove("sa-entry-more-collapsing");
      collapsing = false;
      return;
    }

    // Animate only this empty spacer. Browser scroll anchoring keeps the toggle
    // stable when possible; at the document bottom, normal scroll-range clamping
    // follows the shrinking page naturally. There is no scrollTo/scrollBy loop.
    let animation;
    try {
      animation = spacer.animate(
        [
          { height: `${correctedHeight}px` },
          { height: "0px" }
        ],
        {
          duration: COLLAPSE_MS,
          easing: "cubic-bezier(.22,.72,.2,1)",
          fill: "forwards"
        }
      );
      await animation.finished.catch(() => {});
    } catch (_) {
      spacer.style.height = "0px";
    }

    if (token !== transitionToken) return;

    spacer.remove();
    button.disabled = false;
    button.removeAttribute("aria-busy");
    document.documentElement.classList.remove("sa-entry-more-collapsing");
    collapsing = false;
  }

  ensureStyle();

  // Capture at window level. This is the single owner of the control and stops
  // archive-ui.js's older inline scroll-compensation onclick before it runs.
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
