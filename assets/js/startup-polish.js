/* Stat Archive — startup + interaction polish v1
   Coordinates the first Home paint without owning archive rendering.
   - suppresses the legacy service-worker takeover reload
   - keeps summary metrics visually stable until the first data pass settles
   - signals the hero to start only after that first settled render
   - smooths Menu motion and promotes the archive More/Show less control
*/
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_STARTUP_POLISH_V1__) return;
  window.__STAT_ARCHIVE_STARTUP_POLISH_V1__ = true;

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
    if (document.getElementById("statArchiveStartupPolishStyle")) return;
    const style = document.createElement("style");
    style.id = "statArchiveStartupPolishStyle";
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
html body #mainMenuBackdrop.main-menu-backdrop{
  transition:opacity .22s ease,visibility 0s linear .22s !important;
}
html body #mainMenuBackdrop.main-menu-backdrop.is-open{
  transition:opacity .22s ease,visibility 0s linear 0s !important;
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
  html body button.entry-subject-more-btn{transition:none !important;}
}
`;
    document.head.appendChild(style);
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
    beginSummaryCoordination();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else {
    init();
  }
})();
