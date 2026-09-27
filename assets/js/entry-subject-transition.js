/* Stat Archive — More / Show less V6
   Clean rebuild for Android/WebView smoothness.

   Rules:
   - More never scrolls the document.
   - Show less stays after the final expanded subject.
   - No subject-row fade-out, no spacer, no height animation.
   - On collapse, the expanded content stays fully visible while the browser's
     native smooth scroll returns to the collapsed boundary. Only then are the
     extra rows removed, below the viewport, so there is no blank frame/jump.
*/
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V6__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V6__ = true;

  // Prevent any older cached transition runtime from registering afterwards.
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V5__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;

  let busy = false;
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

  function host() {
    return document.getElementById("grid");
  }

  function rows() {
    const grid = host();
    if (!grid) return [];
    return Array.from(grid.querySelectorAll(":scope > .subject-row[data-subject-code]"));
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
    const doc = document.documentElement;
    return Math.max(0, Math.max(doc.scrollHeight, document.body?.scrollHeight || 0) - window.innerHeight);
  }

  function forceY(y) {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.setProperty("scroll-behavior", "auto", "important");
    window.scrollTo(0, Math.max(0, Math.min(y, maxY())));
    if (previous) root.style.scrollBehavior = previous;
    else root.style.removeProperty("scroll-behavior");
  }

  function ensureStyle() {
    if (document.getElementById("statArchiveEntrySubjectTransitionV6Style")) return;
    const style = document.createElement("style");
    style.id = "statArchiveEntrySubjectTransitionV6Style";
    style.textContent = `
html.sa-entry-more-layout-lock,
html.sa-entry-more-layout-lock body,
html.sa-entry-more-layout-lock #grid,
html.sa-entry-more-layout-lock #grid > *{
  overflow-anchor:none !important;
}

html.sa-entry-more-native-scroll .entry-subject-more-btn{
  pointer-events:none !important;
}
`;
    document.head.appendChild(style);
  }

  function pinExpansionY(savedY, token) {
    forceY(savedY);
    requestAnimationFrame(() => {
      if (token !== transitionToken) return;
      forceY(savedY);
      requestAnimationFrame(() => {
        if (token !== transitionToken) return;
        forceY(savedY);
        document.documentElement.classList.remove("sa-entry-more-layout-lock");
      });
    });
  }

  function expand(button) {
    if (busy) return;
    transitionToken += 1;
    const token = transitionToken;
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

    // Rendering inserts subjects below the current viewport. Pin the exact
    // pre-click position across two paints to defeat delayed WebView anchoring.
    pinExpansionY(savedY, token);
  }

  function waitForNativeScroll(targetY, token) {
    return new Promise(resolve => {
      const started = performance.now();
      let nearFrames = 0;

      function frame(now) {
        if (token !== transitionToken) {
          resolve(false);
          return;
        }

        const distance = Math.abs(currentY() - targetY);
        if (distance <= 2) nearFrames += 1;
        else nearFrames = 0;

        if (nearFrames >= 3) {
          resolve(true);
          return;
        }

        if (now - started > 1300) {
          // A tiny WebView rounding remainder is safe to correct instantly.
          if (distance <= 40) {
            forceY(targetY);
            resolve(true);
          } else {
            resolve(false);
          }
          return;
        }

        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    });
  }

  function collapsedBoundaryTarget(allRows) {
    const limit = visibleLimit();
    const firstExtra = allRows[limit];
    if (!firstExtra) return currentY();

    // The first extra subject begins almost exactly where the collapsed More
    // control belongs. Bring that boundary near the lower part of the viewport,
    // leaving enough breathing room for the More button after the final render.
    const boundaryDocumentY = currentY() + firstExtra.getBoundingClientRect().top;
    const desiredViewportY = Math.max(110, window.innerHeight - 170);
    const target = boundaryDocumentY - desiredViewportY;

    // Collapse must never push the reader farther down the page.
    return Math.max(0, Math.min(currentY(), Math.min(target, maxY())));
  }

  function commitCollapsedState(token) {
    if (token !== transitionToken) return;

    const savedY = currentY();
    document.documentElement.classList.add("sa-entry-more-layout-lock");

    showAllEntrySubjects = false;
    render();
    forceY(savedY);

    const replacement = toggleButton();
    if (replacement) {
      replacement.textContent = "More";
      replacement.setAttribute("aria-expanded", "false");
      replacement.removeAttribute("aria-busy");
    }

    // The removed rows were below the viewport at this point. Re-pin for the
    // delayed WebView layout pass, then restore normal scroll anchoring.
    requestAnimationFrame(() => {
      if (token !== transitionToken) return;
      forceY(savedY);
      requestAnimationFrame(() => {
        if (token !== transitionToken) return;
        forceY(savedY);
        document.documentElement.classList.remove("sa-entry-more-layout-lock");
        document.documentElement.classList.remove("sa-entry-more-native-scroll");
        busy = false;
      });
    });
  }

  async function collapse(button) {
    if (busy) return;
    busy = true;
    transitionToken += 1;
    const token = transitionToken;
    const allRows = rows();

    if (allRows.length <= visibleLimit()) {
      showAllEntrySubjects = false;
      render();
      busy = false;
      return;
    }

    button.blur();
    button.setAttribute("aria-busy", "true");

    const targetY = collapsedBoundaryTarget(allRows);
    const distance = Math.abs(currentY() - targetY);

    if (prefersReducedMotion() || distance < 12) {
      if (distance >= 1) forceY(targetY);
      commitCollapsedState(token);
      return;
    }

    document.documentElement.classList.add("sa-entry-more-native-scroll");

    // Keep every real subject visible while the browser/WebView performs its
    // compositor-native smooth scroll. We only alter the DOM after arrival.
    window.scrollTo({ top: targetY, left: 0, behavior: "smooth" });
    const arrived = await waitForNativeScroll(targetY, token);

    if (!arrived || token !== transitionToken) {
      document.documentElement.classList.remove("sa-entry-more-native-scroll");
      button.removeAttribute("aria-busy");
      busy = false;
      return;
    }

    commitCollapsedState(token);
  }

  ensureStyle();

  // Own this control in capture phase so archive-ui.js's older inline
  // scroll-compensation handler never runs.
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
