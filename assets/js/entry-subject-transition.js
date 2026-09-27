/* Stat Archive — legacy More/Show less compatibility shim
   V2–V7 are retired. This file exists only because older cached HTML/loaders
   still request entry-subject-transition.js. It deliberately registers no
   click/scroll/animation handler of its own and loads the new clean runtime.
*/
(() => {
  "use strict";

  // Mark every historical runtime as satisfied so any stale dynamic loader that
  // executes later cannot install an old capture-phase handler.
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V2__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V3__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V4__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V5__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V6__ = true;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TRANSITION_V7__ = true;

  if (window.__STAT_ARCHIVE_ENTRY_SUBJECT_TOGGLE_CLEAN_LOADER_V1__) return;
  window.__STAT_ARCHIVE_ENTRY_SUBJECT_TOGGLE_CLEAN_LOADER_V1__ = true;

  if (document.querySelector('script[data-entry-subject-toggle-clean="1"]')) return;

  const script = document.createElement("script");
  script.src = "assets/js/entry-subject-toggle.js?v=20260927-clean1";
  script.async = false;
  script.dataset.entrySubjectToggleClean = "1";
  document.body.appendChild(script);
})();
