/* Smooth accordion transition for the archive entry-subject More / Show less control. */
(() => {
  "use strict";
  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V1__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V1__ = true;

  const EXTRA_CLASS = "entry-subject-extra-transition";
  const OPEN_MS = 420;
  const CLOSE_MS = 360;
  const EASE = "cubic-bezier(.22,.8,.24,1)";
  let busy = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  function wrapExtraRows() {
    const grid = getGrid();
    if (!grid) return null;

    let wrap = grid.querySelector(`:scope > .${EXTRA_CLASS}`);
    if (wrap) return wrap;

    const rows = Array.from(
      grid.querySelectorAll(":scope > .subject-row[data-subject-code]")
    );
    const extraRows = rows.slice(limit());
    if (!extraRows.length) return null;

    wrap = document.createElement("div");
    wrap.className = EXTRA_CLASS;
    wrap.style.overflow = "visible";

    const more = grid.querySelector(":scope > .entry-subject-more-wrap");
    grid.insertBefore(wrap, more || null);
    extraRows.forEach(row => wrap.appendChild(row));
    return wrap;
  }

  function cleanup(wrap) {
    if (!wrap) return;
    wrap.style.height = "auto";
    wrap.style.opacity = "1";
    wrap.style.transform = "";
    wrap.style.transition = "";
    wrap.style.overflow = "visible";
    wrap.style.willChange = "";
  }

  function expand() {
    busy = true;
    showAllEntrySubjects = true;
    render();

    const wrap = wrapExtraRows();
    if (!wrap || prefersReducedMotion()) {
      cleanup(wrap);
      busy = false;
      return;
    }

    wrap.style.transition = "none";
    wrap.style.overflow = "hidden";
    wrap.style.height = "0px";
    wrap.style.opacity = "0";
    wrap.style.transform = "translateY(-8px)";
    wrap.style.willChange = "height, opacity, transform";

    const targetHeight = wrap.scrollHeight;
    wrap.getBoundingClientRect();

    requestAnimationFrame(() => {
      wrap.style.transition =
        `height ${OPEN_MS}ms ${EASE}, opacity 220ms ease-out, transform ${OPEN_MS}ms ${EASE}`;
      wrap.style.height = `${targetHeight}px`;
      wrap.style.opacity = "1";
      wrap.style.transform = "translateY(0)";
    });

    window.setTimeout(() => {
      cleanup(wrap);
      busy = false;
    }, OPEN_MS + 70);
  }

  function collapse() {
    busy = true;
    const wrap = wrapExtraRows();

    if (!wrap || prefersReducedMotion()) {
      showAllEntrySubjects = false;
      render();
      busy = false;
      return;
    }

    const startHeight = wrap.getBoundingClientRect().height || wrap.scrollHeight;
    wrap.style.transition = "none";
    wrap.style.overflow = "hidden";
    wrap.style.height = `${startHeight}px`;
    wrap.style.opacity = "1";
    wrap.style.transform = "translateY(0)";
    wrap.style.willChange = "height, opacity, transform";
    wrap.getBoundingClientRect();

    requestAnimationFrame(() => {
      wrap.style.transition =
        `height ${CLOSE_MS}ms ${EASE}, opacity 180ms ease-in, transform ${CLOSE_MS}ms ${EASE}`;
      wrap.style.height = "0px";
      wrap.style.opacity = "0";
      wrap.style.transform = "translateY(-6px)";
    });

    window.setTimeout(() => {
      showAllEntrySubjects = false;
      render();
      busy = false;
    }, CLOSE_MS + 40);
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest?.(".entry-subject-more-btn");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.blur();

    if (busy) return;

    let expanded = false;
    try { expanded = !!showAllEntrySubjects; } catch (_) {}
    if (expanded) collapse();
    else expand();
  }, true);
})();
