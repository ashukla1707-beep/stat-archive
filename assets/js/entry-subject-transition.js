/* Stat Archive: compositor-friendly More / Show less transition. */
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;

  let busy = false;
  let compactButtonDocTop = null;

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

  function getGrid() {
    return document.getElementById("grid");
  }

  function currentScrollY() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function maxScrollY() {
    const doc = document.documentElement;
    const body = document.body;
    const height = Math.max(
      doc?.scrollHeight || 0,
      body?.scrollHeight || 0,
      doc?.offsetHeight || 0,
      body?.offsetHeight || 0
    );
    return Math.max(0, height - window.innerHeight);
  }

  function clampTarget(value) {
    return Math.max(0, Math.min(maxScrollY(), Number(value) || 0));
  }

  function setScrollAnchoringSuppressed(on) {
    document.documentElement.classList.toggle("sa-entry-more-transitioning", on);
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntrySubjectTransitionV2Style")) return;
    const style = document.createElement("style");
    style.id = "statArchiveEntrySubjectTransitionV2Style";
    style.textContent = `
html.sa-entry-more-transitioning,
html.sa-entry-more-transitioning body,
html.sa-entry-more-transitioning #grid,
html.sa-entry-more-transitioning #grid > *,
html.sa-entry-more-transitioning .entry-subject-more-wrap{
  overflow-anchor:none !important;
}
`;
    document.head.appendChild(style);
  }

  async function smoothScrollTo(targetY) {
    const target = clampTarget(targetY);
    const start = currentScrollY();
    if (Math.abs(target - start) < 1) {
      window.scrollTo(0, target);
      return;
    }

    if (prefersReducedMotion()) {
      window.scrollTo(0, target);
      return;
    }

    window.scrollTo({ top: target, left: 0, behavior: "smooth" });

    await new Promise(resolve => {
      const started = performance.now();
      const timeout = 1400;
      let stableFrames = 0;

      const check = () => {
        const distance = Math.abs(currentScrollY() - target);
        if (distance <= 2) stableFrames += 1;
        else stableFrames = 0;

        if (stableFrames >= 2 || performance.now() - started >= timeout) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    });
  }

  function extraRows() {
    const grid = getGrid();
    if (!grid) return [];
    return Array.from(
      grid.querySelectorAll(":scope > .subject-row[data-subject-code]")
    ).slice(limit());
  }

  function animateRowsIn(rows) {
    if (prefersReducedMotion()) return;
    rows.forEach((row, index) => {
      try {
        row.animate(
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 260,
            delay: Math.min(index * 34, 170),
            easing: "cubic-bezier(.22,.8,.24,1)",
            fill: "both"
          }
        );
      } catch (_) {}
    });
  }

  function animateRowsOut(rows) {
    if (prefersReducedMotion()) return;
    rows.forEach(row => {
      try {
        row.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0.18, transform: "translateY(-5px)" }
          ],
          {
            duration: 260,
            easing: "ease-in",
            fill: "both"
          }
        );
      } catch (_) {}
    });
  }

  async function expand(button) {
    busy = true;
    setScrollAnchoringSuppressed(true);

    try {
      button.blur();
      const anchorTop = button.getBoundingClientRect().top;
      compactButtonDocTop = currentScrollY() + anchorTop;

      showAllEntrySubjects = true;
      render();

      const grid = getGrid();
      const replacement = grid?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn");
      if (!replacement) return;

      const rows = extraRows();
      animateRowsIn(rows);

      const delta = replacement.getBoundingClientRect().top - anchorTop;
      const targetY = currentScrollY() + delta;
      await smoothScrollTo(targetY);
    } finally {
      setScrollAnchoringSuppressed(false);
      busy = false;
    }
  }

  async function collapse(button) {
    busy = true;
    setScrollAnchoringSuppressed(true);

    try {
      button.blur();
      const anchorTop = button.getBoundingClientRect().top;
      const rows = extraRows();

      let targetY;
      if (Number.isFinite(compactButtonDocTop)) {
        targetY = compactButtonDocTop - anchorTop;
      } else if (rows.length) {
        /* Fallback for a restored expanded view: move back toward the point
           where the first hidden subject begins, then render the compact list. */
        const firstExtraTop = rows[0].getBoundingClientRect().top;
        targetY = currentScrollY() + (firstExtraTop - anchorTop) - 18;
      } else {
        targetY = currentScrollY();
      }

      animateRowsOut(rows);
      await smoothScrollTo(targetY);

      showAllEntrySubjects = false;
      render();

      const replacement = getGrid()?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn");
      if (replacement) {
        const correction = replacement.getBoundingClientRect().top - anchorTop;
        if (Math.abs(correction) > 0.5) {
          window.scrollBy({ top: correction, left: 0, behavior: "auto" });
        }
        compactButtonDocTop = currentScrollY() + replacement.getBoundingClientRect().top;
      }
    } finally {
      setScrollAnchoringSuppressed(false);
      busy = false;
    }
  }

  ensureStyle();

  /* Window capture runs before the older document-level listener, so this V2
     path safely owns the control even if an older cached V1 script is present. */
  window.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest?.(".entry-subject-more-btn");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (busy) return;

    let expanded = false;
    try { expanded = !!showAllEntrySubjects; } catch (_) {}

    if (expanded) void collapse(button);
    else void expand(button);
  }, true);
})();
