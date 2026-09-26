/* Stat Archive — Offline Library compatibility and navigation fixes. */
(() => {
  "use strict";
  document.getElementById("saOfflineStableShellOverrides")?.remove();
  document.getElementById("saOfflineHeadingSearchStyle")?.remove();
  document.getElementById("saOfflineHeadingSearchFixStyle")?.remove();
  window.__STAT_ARCHIVE_OFFLINE_HEADING_LEGACY_DISABLED__ = true;
})();

/* Keep the side menu visually out of the way once Offline Library is ready. */
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

/* Open Offline Library on the subject that owns the clicked saved entry and
   keep the subject accordion strictly single-open. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__) return;
  window.__STAT_ARCHIVE_OFFLINE_SUBJECT_FOCUS_FIX__ = "2";

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
    if (focusId == null) return;
    const entry = focusedEntry(focusId);
    const group = entry?.closest(".sa-offline-group");

    if (!entry || !group || !group.classList.contains("open")) {
      if (attempts < 18) setTimeout(() => finishFocus(focusId, attempts + 1), 35);
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
      if (focusId != null) requestAnimationFrame(() => focusRequestedSubject(focusId));
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
      if (group) collapseOtherSubjects(group);
    }, true);
  }

  function install() {
    wrapOfflineOpener();
    installSingleOpenGuard();
    [100, 350, 900, 1800, 3200].forEach(ms => setTimeout(wrapOfflineOpener, ms));
    window.addEventListener("pageshow", wrapOfflineOpener);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* Two small interaction corrections:
   1) ✓ Offline means "open the already-saved copy", not "save again".
      Intercept it before the older save/progress wrapper so no false
      "Saved for offline use" status is shown.
   2) Expanding More must reveal extra subjects without moving the reader's
      current viewport to the newly-created bottom of the list. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_OFFLINE_MORE_INTERACTION_FIX__) return;
  window.__STAT_ARCHIVE_OFFLINE_MORE_INTERACTION_FIX__ = "1";

  function hideActionStatus() {
    const status = document.getElementById("statArchiveActionStatus");
    if (!status) return;
    status.classList.remove("is-visible", "show", "has-progress", "success", "error");
    status.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const savedOffline = target.closest(".card .offline-btn.is-saved");
    if (savedOffline) {
      const card = savedOffline.closest(".card");
      const id = card?.dataset?.id || card?.getAttribute("data-entry-id") || "";
      if (id && typeof window.openOfflineLibrary === "function") {
        event.preventDefault();
        event.stopImmediatePropagation();
        hideActionStatus();
        void Promise.resolve(window.openOfflineLibrary(String(id)));
      }
      return;
    }

    const moreButton = target.closest(".entry-subject-more-btn");
    if (!moreButton) return;
    if ((moreButton.textContent || "").trim().toLowerCase() !== "more") return;

    const x = window.scrollX;
    const y = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const rootAnchor = root.style.overflowAnchor;
    const bodyAnchor = body?.style.overflowAnchor || "";

    root.style.setProperty("overflow-anchor", "none", "important");
    body?.style.setProperty("overflow-anchor", "none", "important");

    const restore = () => window.scrollTo({ left: x, top: y, behavior: "auto" });
    const release = () => {
      if (rootAnchor) root.style.overflowAnchor = rootAnchor;
      else root.style.removeProperty("overflow-anchor");
      if (body) {
        if (bodyAnchor) body.style.overflowAnchor = bodyAnchor;
        else body.style.removeProperty("overflow-anchor");
      }
    };

    queueMicrotask(() => {
      restore();
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(() => {
          restore();
          release();
        });
      });
    });
  }, true);
})();
