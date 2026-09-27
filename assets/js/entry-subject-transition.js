/* Stat Archive: natural More / Show less transition V4.
   - More never auto-scrolls the page.
   - Expanded subjects keep the natural document order.
   - Show less remains after the final expanded subject.
   - Collapsing uses one compositor-friendly scroll back to the compact control,
     then removes the hidden rows, avoiding the large layout snap. */
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__ = true;

  /* Prevent older cached runtimes from installing after this one. */
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;

  const COLLAPSE_MS = 390;
  let collapsing = false;
  let collapseToken = 0;

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

  function host() {
    return document.getElementById("grid");
  }

  function rows() {
    const grid = host();
    if (!grid) return [];
    return Array.from(grid.querySelectorAll(":scope > .subject-row[data-subject-code]"));
  }

  function extras() {
    return rows().slice(limit());
  }

  function currentY() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function maxY() {
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

  function clampY(value) {
    return Math.max(0, Math.min(maxY(), Number(value) || 0));
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntrySubjectTransitionV4Style")) return;
    const style = document.createElement("style");
    style.id = "statArchiveEntrySubjectTransitionV4Style";
    style.textContent = `
html.sa-entry-subject-mutating,
html.sa-entry-subject-mutating body,
html.sa-entry-subject-mutating #grid,
html.sa-entry-subject-mutating #grid > *{
  overflow-anchor:none !important;
}
`;
    document.head.appendChild(style);
  }

  function suppressAnchoring(on) {
    document.documentElement.classList.toggle("sa-entry-subject-mutating", on);
  }

  function animateIn(list) {
    if (prefersReducedMotion()) return;
    list.forEach((row, index) => {
      try {
        row.animate(
          [
            { opacity: 0, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 230,
            delay: Math.min(index * 22, 110),
            easing: "cubic-bezier(.22,.8,.24,1)"
          }
        );
      } catch (_) {}
    });
  }

  function animateOut(list) {
    if (prefersReducedMotion()) return;
    list.forEach(row => {
      try {
        row.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: .35, transform: "translateY(-3px)" }
          ],
          {
            duration: Math.min(COLLAPSE_MS, 260),
            easing: "ease-out",
            fill: "forwards"
          }
        );
      } catch (_) {}
    });
  }

  function easeInOutCubic(t) {
    return t < .5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateWindowScroll(targetY, duration) {
    const from = currentY();
    const to = clampY(targetY);
    if (Math.abs(to - from) < 1 || prefersReducedMotion()) {
      window.scrollTo(0, to);
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const started = performance.now();
      const token = collapseToken;

      const step = now => {
        if (token !== collapseToken) {
          resolve();
          return;
        }
        const p = Math.min(1, (now - started) / duration);
        const eased = easeInOutCubic(p);
        window.scrollTo(0, from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };

      requestAnimationFrame(step);
    });
  }

  function expand(button) {
    collapseToken += 1;
    collapsing = false;
    button.blur();

    /* Keep the exact viewport position. The newly revealed subjects are added
       below the six compact rows, while render() naturally leaves Show less at
       the very end of the expanded list. */
    const savedY = currentY();
    suppressAnchoring(true);
    showAllEntrySubjects = true;
    render();
    window.scrollTo(0, savedY);

    const newExtras = extras();
    const endButton = host()?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn");
    if (endButton) {
      endButton.textContent = "Show less";
      endButton.setAttribute("aria-expanded", "true");
    }
    animateIn(newExtras);

    requestAnimationFrame(() => {
      /* A second pin defeats delayed scroll anchoring in Android WebView without
         causing any visible page travel. */
      window.scrollTo(0, savedY);
      requestAnimationFrame(() => suppressAnchoring(false));
    });
  }

  async function collapse(button) {
    if (collapsing) return;
    collapsing = true;
    collapseToken += 1;
    const token = collapseToken;

    button.blur();
    button.disabled = true;
    button.setAttribute("aria-busy", "true");

    const list = extras();
    if (!list.length) {
      showAllEntrySubjects = false;
      render();
      collapsing = false;
      return;
    }

    suppressAnchoring(true);

    /* The compact More control will occupy the point immediately before the
       first extra subject. Scroll there while the expanded DOM still exists;
       only after that smooth movement do we remove the extra rows. */
    const buttonViewportTop = button.getBoundingClientRect().top;
    const compactDocTop = currentY() + list[0].getBoundingClientRect().top;
    const targetY = compactDocTop - buttonViewportTop;

    animateOut(list);
    await animateWindowScroll(targetY, COLLAPSE_MS);

    if (token !== collapseToken) return;

    showAllEntrySubjects = false;
    render();

    const replacement = host()?.querySelector(":scope > .entry-subject-more-wrap .entry-subject-more-btn");
    if (replacement) {
      replacement.textContent = "More";
      replacement.setAttribute("aria-expanded", "false");
      const correction = replacement.getBoundingClientRect().top - buttonViewportTop;
      if (Math.abs(correction) > .5) {
        window.scrollBy({ top: correction, left: 0, behavior: "auto" });
      }
    }

    requestAnimationFrame(() => {
      suppressAnchoring(false);
      collapsing = false;
    });
  }

  ensureStyle();

  /* Own the toggle before archive-ui.js's legacy inline onclick can run. */
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
