/* Stat Archive: stationary More / Show less transition.
   The toggle stays immediately after the compact subject set. Expanding adds
   extra subject rows below it; collapsing removes only content below it.
   This avoids document-height scroll jumps and long interaction locks. */
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;

  const OUT_MS = 150;
  let collapseTimer = 0;
  let transitionId = 0;

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function limit() {
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

  function directRows() {
    const host = grid();
    if (!host) return [];
    return Array.from(host.querySelectorAll(":scope > .subject-row[data-subject-code]"));
  }

  function layoutExpandedToggle() {
    const host = grid();
    if (!host) return { button:null, extras:[] };

    const rows = directRows();
    const extras = rows.slice(limit());
    const wrap = host.querySelector(":scope > .entry-subject-more-wrap");

    /* render() appends the toggle after every row. Move it synchronously in
       the same task, before the browser paints, so its compact position never
       visibly changes when More is pressed. */
    if (wrap && extras[0] && wrap.nextElementSibling !== extras[0]) {
      host.insertBefore(wrap, extras[0]);
    }

    return {
      button: wrap?.querySelector(".entry-subject-more-btn") || null,
      extras
    };
  }

  function keepButtonAtViewportTop(previousTop, button) {
    if (!button || !Number.isFinite(previousTop)) return;
    const nextTop = button.getBoundingClientRect().top;
    const correction = nextTop - previousTop;
    if (Math.abs(correction) > 0.5) {
      /* This should normally be zero because the same six rows precede the
         button in both states. The instant correction is only a sub-layout
         guard; there is deliberately no animated/automatic page travel. */
      window.scrollBy({ top: correction, left: 0, behavior: "auto" });
    }
  }

  function animateIn(rows) {
    if (prefersReducedMotion()) return;
    rows.forEach((row, index) => {
      try {
        row.animate(
          [
            { opacity: 0, transform: "translateY(7px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 210,
            delay: Math.min(index * 24, 96),
            easing: "cubic-bezier(.22,.8,.24,1)"
          }
        );
      } catch (_) {}
    });
  }

  function animateOut(rows) {
    if (prefersReducedMotion()) return;
    rows.forEach(row => {
      try {
        row.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-4px)" }
          ],
          {
            duration: OUT_MS,
            easing: "ease-out",
            fill: "forwards"
          }
        );
      } catch (_) {}
    });
  }

  function expand(button) {
    transitionId += 1;
    const id = transitionId;
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = 0;
    }

    const top = button.getBoundingClientRect().top;
    button.blur();

    showAllEntrySubjects = true;
    render();

    if (id !== transitionId) return;
    const state = layoutExpandedToggle();
    keepButtonAtViewportTop(top, state.button);

    if (state.button) {
      state.button.textContent = "Show less";
      state.button.setAttribute("aria-expanded", "true");
    }
    animateIn(state.extras);
  }

  function collapse(button) {
    transitionId += 1;
    const id = transitionId;
    if (collapseTimer) clearTimeout(collapseTimer);

    const top = button.getBoundingClientRect().top;
    const state = layoutExpandedToggle();

    /* Give immediate visual/tactile feedback on the first tap. The short
       fade runs only on the rows below the stationary control; the button is
       temporarily non-interactive so a second tap can never be required. */
    button.textContent = "More";
    button.setAttribute("aria-expanded", "false");
    button.style.pointerEvents = "none";
    animateOut(state.extras);

    const finish = () => {
      if (id !== transitionId) return;
      collapseTimer = 0;
      showAllEntrySubjects = false;
      render();
      const replacement = grid()?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn");
      keepButtonAtViewportTop(top, replacement);
      if (replacement) {
        replacement.textContent = "More";
        replacement.setAttribute("aria-expanded", "false");
      }
    };

    if (prefersReducedMotion() || !state.extras.length) {
      finish();
      return;
    }

    collapseTimer = window.setTimeout(finish, OUT_MS);
  }

  /* Capture at window level so the legacy inline onclick in archive-ui.js
     never gets a chance to run its old scroll-compensation code. */
  window.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest?.(".entry-subject-more-btn");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    let expanded = false;
    try { expanded = !!showAllEntrySubjects; } catch (_) {}

    if (expanded) collapse(button);
    else expand(button);
  }, true);
})();
