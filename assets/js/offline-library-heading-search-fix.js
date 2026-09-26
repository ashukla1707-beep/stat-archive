/* Stat Archive — legacy Offline Library heading patch compatibility shim.
   The Offline Library header/search layout is now owned only by offline-library-hybrid.js. */
(() => {
  "use strict";
  document.getElementById("saOfflineStableShellOverrides")?.remove();
  document.getElementById("saOfflineHeadingSearchStyle")?.remove();
  document.getElementById("saOfflineHeadingSearchFixStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_HEADING_LEGACY_DISABLED__ = true;
})();

/* =========================================================
   OFFLINE LIBRARY / MENU VISUAL HANDOFF

   Offline Library opens after the side-menu click handler on a short delay.
   Several legacy menu observers still exist for scroll-lock compatibility.
   In some restore/order combinations they can leave the menu visually open
   above the Offline Library even though navigation state is already the
   offline-library child.

   Do not touch history here. When Offline Library becomes visible, only close
   the Menu UI/backdrop. Browser/Android Back can then restore Menu through the
   canonical navigation state normally.
   ========================================================= */
(() => {
  "use strict";

  function offlineLibraryVisible() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return false;

    const style = getComputedStyle(overlay);
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      overlay.getClientRects().length > 0;
  }

  function closeMenuVisualOnly() {
    if (!offlineLibraryVisible()) return;

    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");

    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
  }

  function install() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;

    const observer = new MutationObserver(() => {
      if (!offlineLibraryVisible()) return;

      /* Run immediately and once more after menu animation/legacy observers
         have had a frame to react. */
      closeMenuVisualOnly();
      requestAnimationFrame(closeMenuVisualOnly);
    });

    observer.observe(overlay, {
      attributes: true,
      attributeFilter: ["style", "class", "aria-hidden", "hidden"]
    });

    closeMenuVisualOnly();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* =========================================================
   OFFLINE SUBJECT FOCUS + SINGLE-OPEN ACCORDION

   When a saved archive card's ✓ Offline button is pressed, offline.js opens
   the library with that entry id. The canonical Offline Library previously
   expanded the first alphabetical subject before trying to scroll to the
   requested entry, so a saved Econometrics entry could land on another
   subject instead.

   Keep the canonical renderer in charge. After it opens, find the requested
   entry in the already-rendered accordion, click that subject header through
   the canonical event handler, then scroll to the requested entry. This also
   preserves all current filtering, sizing and IndexedDB behaviour.

   Subject headers are also made visually exclusive immediately: opening a
   second subject collapses the currently-open one before the canonical async
   redraw completes, so only one subject's entries are visible at any time.
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__) return;
  window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__ = "1";

  const selectorEscape = value => {
    const text = String(value ?? "");
    try { return CSS.escape(text); }
    catch (_) { return text.replace(/["\\]/g, "\\$&"); }
  };

  function overlay() {
    return document.getElementById("offlineLibraryOverlay");
  }

  function collapseOtherSubjects(keepGroup = null) {
    const root = overlay();
    if (!root) return;

    root.querySelectorAll(".sa-offline-group.open").forEach(group => {
      if (keepGroup && group === keepGroup) return;
      group.classList.remove("open");
      const chev = group.querySelector(".sa-offline-group-head .chev");
      if (chev) chev.textContent = "›";
      const body = group.querySelector(".sa-offline-group-body");
      if (body) body.scrollTop = 0;
    });
  }

  function focusedEntry(focusId) {
    const root = overlay();
    if (!root || focusId == null) return null;
    return root.querySelector(
      `[data-offline-id="${selectorEscape(String(focusId))}"]`
    );
  }

  function finishFocus(focusId, attempts = 0) {
    const root = overlay();
    if (!root || focusId == null) return;

    const entry = focusedEntry(focusId);
    const group = entry?.closest(".sa-offline-group");

    if (!entry || !group || !group.classList.contains("open")) {
      if (attempts < 18) {
        setTimeout(() => finishFocus(focusId, attempts + 1), 35);
      }
      return;
    }

    collapseOtherSubjects(group);

    try {
      entry.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    } catch (_) {
      try { group.scrollIntoView({ block: "center", behavior: "auto" }); } catch (_) {}
    }
  }

  function focusRequestedSubject(focusId) {
    if (focusId == null) return;

    const entry = focusedEntry(focusId);
    const group = entry?.closest(".sa-offline-group");
    if (!entry || !group) {
      finishFocus(focusId, 0);
      return;
    }

    if (!group.classList.contains("open")) {
      /* Let offline-library-hybrid.js update its private openSubject state.
         That guarantees the old subject is collapsed and the requested subject
         remains the canonical open subject on the next redraw too. */
      group.querySelector("[data-sa-toggle-subject]")?.click();
    } else {
      collapseOtherSubjects(group);
    }

    requestAnimationFrame(() => finishFocus(focusId, 0));
  }

  function wrapOfflineOpener() {
    const current = window.openOfflineLibrary;
    if (typeof current !== "function" || current.__saSubjectFocusWrapped) return;

    const wrapped = async function (...args) {
      const focusId = args[0] ?? null;
      const result = await Promise.resolve(current.apply(this, args));

      if (focusId != null) {
        /* The canonical renderer has completed when its promise resolves, but
           give DOM sizing one frame before activating/scolling the subject. */
        requestAnimationFrame(() => focusRequestedSubject(focusId));
      }

      return result;
    };

    wrapped.__saSubjectFocusWrapped = true;
    wrapped.__saOriginal = current;
    window.openOfflineLibrary = wrapped;
    try { openOfflineLibrary = wrapped; } catch (_) {}
  }

  function installSingleOpenGuard() {
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      const toggle = target?.closest(
        "#offlineLibraryOverlay #offlineLibraryList [data-sa-toggle-subject]"
      );
      if (!toggle) return;

      const group = toggle.closest(".sa-offline-group");
      if (!group) return;

      /* Do not stop the event — the canonical listener must still update its
         private state. We only collapse the previous group immediately. */
      collapseOtherSubjects(group);
    }, true);
  }

  function install() {
    wrapOfflineOpener();
    installSingleOpenGuard();

    /* Protect against a late compatibility loader replacing the global opener
       after this shim executes. Stop retrying quickly once startup settles. */
    [100, 350, 900, 1800, 3200].forEach(ms => {
      setTimeout(wrapOfflineOpener, ms);
    });
    window.addEventListener("pageshow", wrapOfflineOpener);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
