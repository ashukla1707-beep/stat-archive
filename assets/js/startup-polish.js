/* Stat Archive — startup + interaction polish v2
   Coordinates the first Home paint without owning archive rendering.
   - suppresses the legacy service-worker takeover reload
   - keeps summary metrics visually stable until the first data pass settles
   - signals the hero to start only after that first settled render
   - restores the intended right-side Menu on web/desktop layouts
   - keeps About -> close as one Back level to Menu
   - standardizes close controls across Stat Archive dialogs
*/
(() => {
  "use strict";

  /* Keep the v1 guard name so an older cached copy and this v2 copy can never
     both install listeners/styles in the same page instance. */
  if (window.__STAT_ARCHIVE_STARTUP_POLISH_V1__) return;
  window.__STAT_ARCHIVE_STARTUP_POLISH_V1__ = "2";

  const READY_EVENT = "statarchive:startup-ready";
  const SUMMARY_CACHE_PREFIX = "statArchiveHomeSummaryV1:";
  const READY_TIMEOUT_MS = 3200;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", event => {
      event.stopImmediatePropagation();
    }, true);
  }

  function currentLevel() {
    try {
      const url = new URL(location.href);
      const fromUrl = url.searchParams.get("level");
      if (fromUrl === "bsc" || fromUrl === "msc") return fromUrl;
      return localStorage.getItem("statArchiveLevel") === "bsc" ? "bsc" : "msc";
    } catch (_) {
      return "msc";
    }
  }

  function installStyles() {
    const old = document.getElementById("statArchiveStartupPolishStyle");
    old?.remove();

    const style = document.createElement("style");
    style.id = "statArchiveStartupPolishStyle";
    style.dataset.version = "2";
    style.textContent = `
html{background:#070a0f;}
html[data-theme="light"]{background:#f6f2e9;}

#archiveSummary.stat-summary-pending .stat-startup-summary-value{
  position:relative !important;
  color:transparent !important;
  min-height:1.05em;
}
#archiveSummary.stat-summary-pending .stat-startup-summary-value[data-startup-display]:not([data-startup-display=""])::after{
  content:attr(data-startup-display);
  position:absolute;
  inset:0;
  color:#f5f7fb;
  font:inherit;
  letter-spacing:inherit;
  white-space:nowrap;
}
body[data-theme="light"] #archiveSummary.stat-summary-pending .stat-startup-summary-value[data-startup-display]:not([data-startup-display=""])::after{
  color:#27302d;
}
#archiveSummary.stat-summary-pending .stat-startup-summary-value[data-startup-display=""]::after{
  content:"";
  position:absolute;
  left:0;
  top:50%;
  width:min(52px,72%);
  height:.72em;
  transform:translateY(-50%);
  border-radius:999px;
  background:linear-gradient(90deg,rgba(148,163,184,.09),rgba(148,163,184,.20),rgba(148,163,184,.09));
  background-size:220% 100%;
  animation:statSummarySheen 1.15s ease-in-out infinite;
}
@keyframes statSummarySheen{
  0%{background-position:100% 0}
  100%{background-position:-100% 0}
}
#archiveSummary.stat-summary-ready .stat-startup-summary-value{
  transition:opacity .14s ease;
}

/* Menu motion. The older feature-polish.js centered the desktop Menu. The
   current Menu design is a right-side inset panel, so own that placement here
   with stronger specificity while leaving the phone layout untouched. */
html body #mainSideMenu.main-side-menu.stat-menu-polished{
  transform:translateY(5px) scale(.997) !important;
  transition:
    opacity .22s ease,
    transform .24s cubic-bezier(.22,.61,.36,1),
    visibility 0s linear .24s !important;
}
html body #mainSideMenu.main-side-menu.stat-menu-polished.is-open{
  transform:translateY(0) scale(1) !important;
  transition:
    opacity .20s ease,
    transform .24s cubic-bezier(.22,.61,.36,1),
    visibility 0s linear 0s !important;
}
@media (min-width:701px){
  html body #mainSideMenu.main-side-menu,
  html body #mainSideMenu.main-side-menu.stat-menu-polished{
    position:fixed !important;
    top:18px !important;
    right:18px !important;
    bottom:18px !important;
    left:auto !important;
    width:min(390px,calc(100vw - 36px)) !important;
    height:auto !important;
    max-height:calc(100dvh - 36px) !important;
    transform:translateY(5px) scale(.997) !important;
    transform-origin:right top !important;
  }
  html body #mainSideMenu.main-side-menu.is-open,
  html body #mainSideMenu.main-side-menu.stat-menu-polished.is-open{
    transform:translateY(0) scale(1) !important;
  }
}
html body #mainMenuBackdrop.main-menu-backdrop{
  transition:opacity .22s ease,visibility 0s linear .22s !important;
}
html body #mainMenuBackdrop.main-menu-backdrop.is-open{
  transition:opacity .22s ease,visibility 0s linear 0s !important;
}

/* One close-button language everywhere: same circle, same glyph sizing and
   same hover/focus treatment. Position is intentionally NOT overridden, so
   each dialog keeps its own header layout. */
html body button.close-btn,
html body #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn,
html body #manualChooserCloseBtn,
html body button.stat-feedback-close,
html body #offlineLibraryOverlay #closeOfflineLibraryBtn{
  width:34px !important;
  min-width:34px !important;
  max-width:34px !important;
  height:34px !important;
  min-height:34px !important;
  max-height:34px !important;
  padding:0 !important;
  border:1px solid rgba(148,163,184,.15) !important;
  border-radius:50% !important;
  background:rgba(255,255,255,.012) !important;
  color:#9eabba !important;
  box-shadow:none !important;
  display:grid !important;
  place-items:center !important;
  flex:0 0 34px !important;
  font:400 21px/1 Inter,sans-serif !important;
  text-align:center !important;
  text-indent:0 !important;
  cursor:pointer !important;
  -webkit-tap-highlight-color:transparent !important;
  transition:background .16s ease,border-color .16s ease,color .16s ease !important;
}
html body button.close-btn:hover,
html body button.close-btn:focus-visible,
html body #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
html body #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible,
html body #manualChooserCloseBtn:hover,
html body #manualChooserCloseBtn:focus-visible,
html body button.stat-feedback-close:hover,
html body button.stat-feedback-close:focus-visible,
html body #offlineLibraryOverlay #closeOfflineLibraryBtn:hover,
html body #offlineLibraryOverlay #closeOfflineLibraryBtn:focus-visible{
  border-color:rgba(94,231,247,.28) !important;
  background:rgba(94,231,247,.045) !important;
  color:#eef8fa !important;
  outline:none !important;
}
body[data-theme="light"] button.close-btn,
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn,
body[data-theme="light"] #manualChooserCloseBtn,
body[data-theme="light"] button.stat-feedback-close,
body[data-theme="light"] #offlineLibraryOverlay #closeOfflineLibraryBtn{
  border-color:rgba(75,54,95,.11) !important;
  background:rgba(255,255,255,.48) !important;
  color:#726c67 !important;
}
body[data-theme="light"] button.close-btn:hover,
body[data-theme="light"] button.close-btn:focus-visible,
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible,
body[data-theme="light"] #manualChooserCloseBtn:hover,
body[data-theme="light"] #manualChooserCloseBtn:focus-visible,
body[data-theme="light"] button.stat-feedback-close:hover,
body[data-theme="light"] button.stat-feedback-close:focus-visible,
body[data-theme="light"] #offlineLibraryOverlay #closeOfflineLibraryBtn:hover,
body[data-theme="light"] #offlineLibraryOverlay #closeOfflineLibraryBtn:focus-visible{
  border-color:rgba(75,54,95,.22) !important;
  background:rgba(75,54,95,.055) !important;
  color:#4b365f !important;
}

html body .entry-subject-more-wrap{
  margin:22px 0 10px !important;
  padding:2px 0 !important;
}
html body button.entry-subject-more-btn{
  min-width:136px !important;
  min-height:42px !important;
  padding:9px 20px !important;
  border:1px solid rgba(94,231,247,.20) !important;
  border-radius:999px !important;
  background:rgba(94,231,247,.055) !important;
  color:#b8eaf0 !important;
  box-shadow:0 7px 20px rgba(0,0,0,.10) !important;
  font:700 11.5px/1 'Inter',sans-serif !important;
  letter-spacing:.01em !important;
  transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease !important;
}
html body button.entry-subject-more-btn:hover,
html body button.entry-subject-more-btn:focus-visible{
  transform:translateY(-1px) !important;
  background:rgba(94,231,247,.09) !important;
  border-color:rgba(94,231,247,.32) !important;
  box-shadow:0 10px 24px rgba(0,0,0,.13) !important;
  outline:none !important;
}
html body button.entry-subject-more-btn:active{
  transform:translateY(0) scale(.985) !important;
}
body[data-theme="light"] button.entry-subject-more-btn{
  background:rgba(52,125,115,.075) !important;
  border-color:rgba(52,125,115,.22) !important;
  color:#347d73 !important;
  box-shadow:0 6px 16px rgba(58,53,42,.07) !important;
}
body[data-theme="light"] button.entry-subject-more-btn:hover,
body[data-theme="light"] button.entry-subject-more-btn:focus-visible{
  background:rgba(52,125,115,.11) !important;
  border-color:rgba(52,125,115,.32) !important;
}

@media (prefers-reduced-motion:reduce){
  #archiveSummary.stat-summary-pending .stat-startup-summary-value[data-startup-display=""]::after{animation:none !important;}
  html body #mainSideMenu.main-side-menu.stat-menu-polished,
  html body #mainSideMenu.main-side-menu.stat-menu-polished.is-open,
  html body #mainMenuBackdrop.main-menu-backdrop,
  html body #mainMenuBackdrop.main-menu-backdrop.is-open,
  html body button.entry-subject-more-btn,
  html body button.close-btn,
  html body #mainMenuCloseBtn,
  html body #manualChooserCloseBtn,
  html body button.stat-feedback-close,
  html body #offlineLibraryOverlay #closeOfflineLibraryBtn{transition:none !important;}
}
`;
    document.head.appendChild(style);
  }

  function normalizeCloseGlyphs() {
    document.querySelectorAll(
      "button.close-btn,#mainMenuCloseBtn,#manualChooserCloseBtn,button.stat-feedback-close,#closeOfflineLibraryBtn"
    ).forEach(button => {
      if (!(button instanceof HTMLButtonElement) || button.querySelector("svg")) return;
      const text = String(button.textContent || "").trim();
      if (/^[×✕xX]$/.test(text)) button.textContent = "×";
    });
  }

  /* About is a Menu child, so its close control must pop only the child history
     entry. Capturing the click before the legacy handler hides the overlay
     prevents the old child-close synchronizer from issuing an extra Back. */
  function installAboutCloseNavigation() {
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const overlay = document.getElementById("aboutArchiveOverlay");
      const closePressed = !!target.closest("#closeAboutArchiveBtn");
      const backdropPressed = !!overlay && target === overlay;
      if (!closePressed && !backdropPressed) return;

      const nav = window.__statArchiveNavigation;

      /* restoreForCurrentState() closes About with a synthetic button.click()
         after history has already moved back to Menu. Stop that synthetic click
         before any legacy close handler can issue another history.back(); the
         navigation core hides the overlay directly immediately afterwards. */
      if (closePressed && event.isTrusted === false && nav?.state?.() === "menu") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (nav?.state?.() !== "child" || nav?.child?.() !== "about") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
    }, true);
  }

  function readCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SUMMARY_CACHE_PREFIX + currentLevel()) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function textReady(value) {
    const text = String(value || "").trim();
    if (!text || text === "—") return false;
    return /\d/.test(text);
  }

  function visible(el) {
    if (!el) return false;
    const css = getComputedStyle(el);
    return css.display !== "none" && css.visibility !== "hidden";
  }

  function markReady() {
    if (document.documentElement.dataset.statStartupReady === "1") return;
    document.documentElement.dataset.statStartupReady = "1";
    document.dispatchEvent(new CustomEvent(READY_EVENT));
  }

  function beginSummaryCoordination() {
    const summary = document.getElementById("archiveSummary");
    if (!summary) {
      markReady();
      return;
    }

    const els = {
      subjects: document.getElementById("summarySubjects"),
      entries: document.getElementById("summaryEntries"),
      preview: document.getElementById("summaryPreviewCount"),
      download: document.getElementById("summaryDownloadCount")
    };

    const cached = readCache() || {};
    Object.entries(els).forEach(([key, el]) => {
      if (!el) return;
      el.classList.add("stat-startup-summary-value");
      const cachedValue = cached[key];
      el.dataset.startupDisplay = textReady(cachedValue) ? String(cachedValue) : "";
    });

    summary.classList.add("stat-summary-pending");

    const startedAt = performance.now();
    let finished = false;

    function persistActual() {
      try {
        const payload = {
          subjects: els.subjects?.textContent?.trim() || "",
          entries: els.entries?.textContent?.trim() || "",
          preview: els.preview?.textContent?.trim() || "",
          download: els.download?.textContent?.trim() || "",
          savedAt: Date.now()
        };
        if (textReady(payload.subjects) && textReady(payload.entries)) {
          localStorage.setItem(SUMMARY_CACHE_PREFIX + currentLevel(), JSON.stringify(payload));
        }
      } catch (_) {}
    }

    function activityReady() {
      const activity = document.getElementById("summaryActivity");
      if (!visible(activity)) return true;
      return textReady(els.preview?.textContent) && textReady(els.download?.textContent);
    }

    function allReady() {
      return textReady(els.subjects?.textContent) &&
        textReady(els.entries?.textContent) &&
        activityReady();
    }

    function finish(force = false) {
      if (finished) return;
      if (!force && !allReady()) return;
      finished = true;

      Object.entries(els).forEach(([key, el]) => {
        if (!el) return;
        if (!textReady(el.textContent) && textReady(cached[key])) {
          el.textContent = String(cached[key]);
        }
      });

      persistActual();
      requestAnimationFrame(() => {
        summary.classList.remove("stat-summary-pending");
        summary.classList.add("stat-summary-ready");
        markReady();
      });
    }

    function check() {
      if (finished) return;
      if (allReady()) {
        finish();
        return;
      }
      if (performance.now() - startedAt >= READY_TIMEOUT_MS) {
        finish(true);
        return;
      }
      window.setTimeout(check, 45);
    }

    check();
  }

  function init() {
    installStyles();
    normalizeCloseGlyphs();
    beginSummaryCoordination();
  }

  /* Install navigation capture immediately; it does not depend on the About
     element existing yet because it resolves the target at click time. */
  installAboutCloseNavigation();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else {
    init();
  }

  window.addEventListener("pageshow", normalizeCloseGlyphs);
})();
