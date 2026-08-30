/* Single global resize listener for all subject carousels' arrow visibility,
   instead of one listener per carousel per render() call. */
let carouselLastViewportWidth = Math.round(window.innerWidth);
window.addEventListener("resize", () => {
  const currentWidth = Math.round(window.innerWidth);
  if (Math.abs(currentWidth - carouselLastViewportWidth) < 2) return;
  carouselLastViewportWidth = currentWidth;

  document.querySelectorAll(".subject-carousel").forEach(wrap => {
    refreshCarouselNav(wrap);

    // Recalculate mobile slider dimensions only on a real width change
    // (rotation / desktop-mode change), not while the browser chrome moves.
    const track = wrap.querySelector(".subject-track");
    const mobileRange = wrap.querySelector(".subject-mobile-scroll-range");
    const mobileScrollbar = wrap.querySelector(".subject-mobile-scrollbar");

    if (track && mobileRange) {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      mobileRange.max = String(Math.max(1, Math.round(max)));
      mobileRange.disabled = max <= 4;
      if (mobileScrollbar) mobileScrollbar.classList.toggle("is-disabled", max <= 4);
    }
  });
});

// Fonts swapping in after the initial paint can change card widths slightly,
// which can flip a row from "no overflow" to "has overflow" (or back). Re-run
// the same check once fonts are ready so an arrow that should appear isn't
// stuck hidden until the next manual resize.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    document.querySelectorAll(".subject-carousel").forEach(refreshCarouselNav);
  }).catch(() => {});
}

let archiveRefreshInFlight = false;
async function refreshArchiveSilently() {
  if (archiveRefreshInFlight || document.visibilityState !== "visible" || isLoadingArchive) return;
  const uploadOverlay = document.getElementById("overlay");
  if (uploadOverlay && getComputedStyle(uploadOverlay).display !== "none") return;
  archiveRefreshInFlight = true;
  try {
    const entrySignature = list => list.map(e => [
      e.id,
      e.title,
      e.subject,
      e.type,
      e.year,
      e.filename,
      e.size,
      e.uploadedAt,
      e.driveUrl || ""
    ].join(":")).join("|");

    const subjectSignature = list => list.map(s => [
      s.id || "",
      s.code || "",
      s.name || "",
      s.created_by || ""
    ].join(":")).join("|");

    const oldEntrySignature = entrySignature(entries);
    const oldSubjectSignature = subjectSignature(subjects);

    const freshEntries = await loadEntries();
    await loadSubjectsFromWorker();

    const newEntrySignature = entrySignature(freshEntries);
    const newSubjectSignature = subjectSignature(subjects);
    const entriesChanged = oldEntrySignature !== newEntrySignature;
    const subjectsChanged = oldSubjectSignature !== newSubjectSignature;

    entries = freshEntries;
    totalStorageBytes = entries.reduce((sum, entry) => sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0);

    // If subjects changed while the mobile "More" panel is open, that panel
    // contains a snapshot of the old subject DOM. Remove it before rebuilding.
    if (subjectsChanged) {
      mobileSubjectListOpen = false;
      document.getElementById("subjectFilterExpanded")?.remove();
    }

    renderSubjectFilters();
    renderSubjectOptions();

    if (entriesChanged || subjectsChanged) {
      // Background sync must never throw the reader back to the top.
      const savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      render();

      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
      });
    }
  } catch (err) {
    console.warn("Background archive refresh failed:", err);
  } finally {
    archiveRefreshInFlight = false;
  }
}
// Hard-refresh when connectivity returns. A full reload is intentional here:
// it re-runs the app boot, picks up the newest deployed HTML through the
// network-first service worker, and restores live archive/activity data.
let statArchiveWasOffline = !navigator.onLine;
window.addEventListener("offline", () => {
  statArchiveWasOffline = true;
});
window.addEventListener("online", () => {
  if (!statArchiveWasOffline) return;
  statArchiveWasOffline = false;
  setTimeout(() => window.location.reload(), 180);
});

// Treat reopening the app after it has been in the background as a fresh launch.
// The flag exists only in this page instance, so the reload does not loop.
let statArchiveWentToBackground = false;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    statArchiveWentToBackground = true;
    return;
  }

  if (document.visibilityState === "visible" && statArchiveReturningFromOfflineFile) {
    statArchiveWentToBackground = false;
    statArchiveReturningFromOfflineFile = false;

    const returnId = statArchiveReturnOfflineId;
    statArchiveReturnOfflineId = null;

    // Keep/reopen the library exactly where the user came from.
    setTimeout(() => openOfflineLibrary(returnId), 40);
    return;
  }

  if (document.visibilityState === "visible" && window.statArchiveNativePickerActive) {
    // Returning from Android's file chooser is not an app reopen.
    // Preserve the upload modal and selected subject/type.
    statArchiveWentToBackground = false;
    setTimeout(() => {
      window.statArchiveNativePickerActive = false;
    }, 900);
    return;
  }

  if (document.visibilityState === "visible" && statArchiveWentToBackground && navigator.onLine) {
    // Reopening/resuming the app should update live data without reloading
    // the whole page. Mobile browsers can trigger viewport/visibility changes
    // while scrolling; a hard reload here made the page appear to refresh.
    statArchiveWentToBackground = false;
    refreshArchiveSilently();
    loadActivityStats().catch(() => {});
  }
});

// If Android/Chrome restores the PWA from the back-forward cache,
// refresh live data without reloading the whole page.
window.addEventListener("pageshow", (event) => {
  if (event.persisted && navigator.onLine) {
    refreshArchiveSilently();
    loadActivityStats().catch(() => {});
  }
});


/* Offline library controls */
document.getElementById("offlineLibraryBtn")?.addEventListener("click", () => openOfflineLibrary());
document.getElementById("closeOfflineLibraryBtn")?.addEventListener("click", closeOfflineLibrary);
document.getElementById("offlineLibraryOverlay")?.addEventListener("click", (e) => {
  if (e.target.id === "offlineLibraryOverlay") closeOfflineLibrary();
});
document.getElementById("offlineLibraryList")?.addEventListener("click", async (e) => {
  const file = e.target.closest(".offline-file");
  if (!file) return;
  const id = file.dataset.offlineId;
  try {
    if (e.target.closest(".offline-pin-btn")) await toggleOfflinePin(id);
    else if (e.target.closest(".offline-open-btn")) await openOfflineFile(id);
    else if (e.target.closest(".offline-share-btn")) await shareOfflineFile(id);
    else if (e.target.closest(".offline-remove-btn")) await removeOfflineFile(id);
  } catch (err) {
    showError(err?.message || "Offline file action failed.");
  }
});

document.getElementById("offlineSearchInput")?.addEventListener("input", (e) => {
  offlineSearchTerm = e.target.value || "";
  renderOfflineLibrary();
});
document.getElementById("offlineSubjectFilters")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-offline-subject]");
  if (!btn) return;
  offlineSubjectFilter = btn.dataset.offlineSubject || "All";
  renderOfflineLibrary();
});
document.getElementById("offlineTypeFilters")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-offline-filter]");
  if (!btn) return;
  offlineTypeFilter = btn.dataset.offlineFilter || "All";
  renderOfflineLibrary();
});
document.getElementById("clearOfflineLibraryBtn")?.addEventListener("click", async () => {
  if (!confirm("Remove every file saved inside the Offline library on this device?")) return;
  try {
    await clearOfflineFiles();
    offlineEntryIds.clear();
    updateOfflineLibraryCount(0);
    await renderOfflineLibrary();
    render();
  } catch (err) {
    showError(err?.message || "Couldn't clear the Offline library.");
  }
});

/* Bootstraps the application data */
init();

/* ===== Subtle mouse spotlight ===== */


/* ===== Cursor from uploaded reference ===== */
(function setupReferenceCursor(){
  const ring=document.getElementById("cursorRing");
  const dot=document.getElementById("cursorDot");

  if(!ring || !dot) return;

  const finePointer=window.matchMedia("(pointer: fine)");
  const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");

  if(!finePointer.matches || reducedMotion.matches){
    ring.style.display="none";
    dot.style.display="none";
    return;
  }

  let mx=innerWidth/2;
  let my=innerHeight/2;
  let rx=mx;
  let ry=my;
  let lastSpark=0;

  const spotlight = document.getElementById("mouseSpotlight");
  let cursorActive = false;
  let lastY=innerHeight*.7;
  let nudgeCooldown=0;

  // Perf note: this used to be three separate pointermove listeners, each
  // writing dot/ring position independently (the dot's left/top was even
  // written twice per move). Position via left/top also forces a layout
  // pass on a position:fixed element every single mouse pixel of movement.
  // Merged into one listener, and dot/ring now move via transform (like
  // the spotlight already did) so the browser can handle it on the
  // compositor thread instead of running layout on every move.
  window.addEventListener("pointermove",e=>{
    mx=e.clientX;
    my=e.clientY;

    const dotTransform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    dot.style.transform = dotTransform;
    ring.style.transform = dotTransform;
    if (!cursorActive) { cursorActive = true; }

    if (!document.body.classList.contains("mouse-active")) {
      document.body.classList.add("mouse-active");
    }
    if (spotlight) {
      spotlight.style.transform = dotTransform;
    }

    const darkTheme =
      document.body.getAttribute("data-theme") !== "light";

    const sparkInterval = darkTheme ? 38 : 55;

    if(performance.now()-lastSpark>sparkInterval){
      lastSpark=performance.now();

      const s=document.createElement("i");
      s.className="cursor-spark";
      s.style.left=mx+"px";
      s.style.top=my+"px";

      const a=Math.random()*Math.PI*2;
      const d=darkTheme
        ? 14+Math.random()*24
        : 10+Math.random()*20;

      s.style.setProperty(
        "--dx",
        Math.cos(a)*d+"px"
      );

      s.style.setProperty(
        "--dy",
        Math.sin(a)*d+"px"
      );

      const colors = darkTheme
        ? ["#63f3ff","#8c7cff","#b88cff","#48d8ff"]
        : ["var(--mint-dark)","var(--peach)","var(--butter)"];

      s.style.background =
        colors[Math.floor(Math.random()*colors.length)];

      s.style.color=s.style.background;

      document.body.appendChild(s);
      if (document.querySelectorAll(".cursor-spark").length > 30) document.querySelector(".cursor-spark")?.remove();
      s.addEventListener("animationend", () => s.remove(), {once:true});
      setTimeout(()=>s.remove(), darkTheme ? 1200 : 1400);
    }

    if(
      e.clientY<90 &&
      lastY>180 &&
      performance.now()>nudgeCooldown
    ){
      nudgeCooldown=
        performance.now()+5000;

      const pulse=
        document.getElementById("statPulse");

      if(pulse){
        pulse.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-4px) rotate(.2deg)" },
            { transform: "translateY(0)" }
          ],
          { duration:500, easing:"ease-out" }
        );
      }
    }
    lastY=e.clientY;
  },{passive:true});

  document.addEventListener("pointerover",e=>{
    if(
      e.target.closest(
        "button,.pill,.action-btn,a"
      )
    ){
      document.body.classList.add("cursor-hover");
    }
  });

  document.addEventListener("pointerout",e=>{
    const btn = e.target.closest("button,.pill,.action-btn,a");
    if(btn && (!e.relatedTarget || !btn.contains(e.relatedTarget))){
      document.body.classList.remove("cursor-hover");
    }
  });

})();


/* Prevent file drops from navigating away and block background touch scrolling on iOS Safari while a modal is open. */
document.querySelectorAll(".overlay").forEach(overlay => {
  overlay.addEventListener("dragover", e => e.preventDefault());
  overlay.addEventListener("drop", e => e.preventDefault());
  overlay.addEventListener("touchmove", e => {
    if (!e.target.closest(".form-card,.preview-card")) e.preventDefault();
  }, {passive:false});
});

/* ===== Modal focus trapping (accessibility) =====
   Without this, tabbing through the Sign In / Upload / Preview modals falls
   through to the background page. If a user hits Enter after tabbing onto a
   background element, it could trigger unrelated actions and corrupt UI
   state. This keeps Tab/Shift+Tab cycling within whichever modal is open. */
(function setupFocusTrap(){
  const overlayIds = ["loginOverlay", "contributorDisclaimerOverlay", "overlay", "previewOverlay", "editEntryOverlay"];

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openOverlay = overlayIds
        .map(id => document.getElementById(id))
        .find(el => el && getComputedStyle(el).display !== "none");

      if (openOverlay) {
        if (openOverlay.id === "previewOverlay") closePreview();
        else if (openOverlay.id === "loginOverlay") { clearLoginModalState(); document.getElementById("loginOverlay").style.display = "none"; document.body.classList.remove("no-scroll"); }
        else if (openOverlay.id === "overlay") closeAndResetUploadForm();
        else if (openOverlay.id === "editEntryOverlay") closeEditEntry();
        else if (openOverlay.id === "contributorDisclaimerOverlay") { openOverlay.style.display = "none"; document.body.classList.remove("no-scroll"); }
      }
      return;
    }

    if (e.key !== "Tab") return;

    const openOverlay = overlayIds
      .map(id => document.getElementById(id))
      .find(el => el && getComputedStyle(el).display !== "none");
    if (!openOverlay) return;

    const focusable = Array.from(
      openOverlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!openOverlay.contains(document.activeElement)) {
      // Focus somehow ended up outside the modal — pull it back in.
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ===== Functional Dark / Light theme buttons ===== */
(function setupThemeButtons(){
  const darkBtn = document.getElementById("themeDarkBtn");
  const lightBtn = document.getElementById("themeLightBtn");

  if (!darkBtn || !lightBtn) return;

  let savedTheme = "dark";

  try{
    savedTheme =
      localStorage.getItem("statArchiveTheme") || "dark";
  }catch(e){}

  function applyTheme(theme){
    const value = theme === "light" ? "light" : "dark";

    // Keep the theme attribute synchronized on both <html> and <body>.
    // The CSS contains theme variables on :root/html, so changing only
    // <body> could leave the light palette active after switching to Dark.
    document.documentElement.setAttribute("data-theme", value);
    document.body.setAttribute("data-theme", value);
    document.documentElement.setAttribute("data-active-theme", value);

    darkBtn.classList.toggle("active", value === "dark");
    lightBtn.classList.toggle("active", value === "light");

    darkBtn.setAttribute("aria-pressed", value === "dark" ? "true" : "false");
    lightBtn.setAttribute("aria-pressed", value === "light" ? "true" : "false");

    try{
      localStorage.setItem("statArchiveTheme", value);
    }catch(e){}
  }

  darkBtn.addEventListener("click", function(){
    applyTheme("dark");
  });

  lightBtn.addEventListener("click", function(){
    applyTheme("light");
  });

  // Fix: without this, changing the theme in one tab left other open tabs
  // on the stale theme until they were manually refreshed.
  window.addEventListener("storage", function(e){
    if (e.key === "statArchiveTheme" && e.newValue) {
      applyTheme(e.newValue);
    }
  });

  applyTheme(savedTheme);
})();

/* ===== Functional M.Sc / B.Sc level toggle ===== */
(function setupLevelButtons(){
  const mscBtn = document.getElementById("levelMscBtn");
  const bscBtn = document.getElementById("levelBscBtn");

  if (!mscBtn || !bscBtn) return;

  // currentLevel was already read from localStorage at script load time
  // (see its declaration near the top), so just sync the UI to it here.
  setLevelUI(currentLevel);

  mscBtn.addEventListener("click", function(){
    switchLevel("msc");
  });

  bscBtn.addEventListener("click", function(){
    switchLevel("bsc");
  });

  // Keep other open tabs in sync, same as the theme toggle does.
  window.addEventListener("storage", function(e){
    if (e.key === "statArchiveLevel" && e.newValue) {
      switchLevel(e.newValue);
    }
  });
})();
// ===== Desktop Offline Library horizontal mouse-wheel scrolling =====

document.addEventListener(
  "wheel",
  event => {

    const row =
      event.target.closest(
        ".offline-subject-files"
      );

    if (!row) return;

    /*
     * Do not interfere with touchpads that
     * already provide horizontal deltaX.
     */
    if (
      Math.abs(event.deltaX) >
      Math.abs(event.deltaY)
    ) {
      return;
    }

    /*
     * Nothing to scroll horizontally.
     */
    if (
      row.scrollWidth <=
      row.clientWidth
    ) {
      return;
    }

    event.preventDefault();

    row.scrollLeft +=
      event.deltaY;

  },
  {
    passive:false
  }
);
