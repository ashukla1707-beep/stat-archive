(() => {
  if (window.__statArchiveSearchFilterFixLoadedV2) return;
  window.__statArchiveSearchFilterFixLoadedV2 = true;

  function normalizeSearchText(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[–—−]/g, "-")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .toLowerCase();
  }

  function installRobustArchiveSearch() {
    try {
      if (window.__statArchiveRobustFilteredEntriesV2) return;
      if (typeof filteredEntries !== "function" || typeof entries === "undefined") return;

      const originalFilteredEntries = filteredEntries;

      filteredEntries = function () {
        const q = normalizeSearchText(typeof searchQ !== "undefined" ? searchQ : "");
        if (!q) return originalFilteredEntries();

        const terms = q.split(/\s+/).filter(Boolean);

        return entries.filter(entry => {
          const meta = typeof subjectMeta === "function"
            ? subjectMeta(entry.subject)
            : { name: entry.subject || "" };

          const title = String(entry.title || "");
          const type = String(entry.type || "");
          const filename = String(entry.filename || "");
          const year = String(entry.year || "");
          const subjectCode = String(entry.subject || "");
          const subjectName = String(meta?.name || "");

          // Match the exact text users see on cards too. Books are rendered as
          // “Book - <title>”, so author surnames such as Chakrabarti must be
          // searchable even when the visible title is folded into the type row.
          const visibleLabel = /^books?$/i.test(type)
            ? `Book - ${title}`
            : title;

          const haystack = normalizeSearchText([
            visibleLabel,
            title,
            filename,
            year,
            type,
            subjectCode,
            subjectName
          ].join(" "));

          return terms.every(term => haystack.includes(term));
        });
      };

      window.__statArchiveRobustFilteredEntriesV2 = true;
    } catch (_) {}
  }

  function setupSearchFilterFix() {
    installRobustArchiveSearch();

    const input = document.getElementById("searchInput");
    if (!input || input.dataset.searchFilterFixReadyV2 === "1") return;
    input.dataset.searchFilterFixReadyV2 = "1";

    const apply = () => {
      const q = input.value.trim().toLowerCase();

      try {
        searchQ = q;
      } catch (_) {}

      // A text search is global across the archive. Do not let a previously
      // selected subject/type pill hide a valid title/author match.
      if (q) {
        try { filterSubjects = new Set(); } catch (_) {}
        try { filterTypes = new Set(); } catch (_) {}
      }

      try {
        showAllEntrySubjects = !!q;
      } catch (_) {}

      const clearBtn = document.getElementById("searchClear");
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";

      try {
        if (typeof renderSubjectFilters === "function" && q) renderSubjectFilters();
        if (typeof renderTypeFilters === "function" && q) renderTypeFilters();
        if (typeof render === "function") render();
      } catch (_) {}
    };

    input.addEventListener("input", apply, { capture: true });
    input.addEventListener("search", apply, { capture: true });

    const clearBtn = document.getElementById("searchClear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        requestAnimationFrame(() => {
          try { showAllEntrySubjects = false; } catch (_) {}
          try { searchQ = ""; } catch (_) {}
          try { if (typeof render === "function") render(); } catch (_) {}
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSearchFilterFix, { once: true });
  } else {
    setupSearchFilterFix();
  }

  setTimeout(setupSearchFilterFix, 1000);
})();

/* Stat Archive — keep the Android install/version UI synchronized with the
   current APK metadata even when an older service worker has version.json
   cached. This file is a network-first runtime asset, so the repair reaches
   already-installed web clients without waiting for the old shell cache. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ANDROID_VERSION_UI_FIX_1520__) return;
  window.__STAT_ARCHIVE_ANDROID_VERSION_UI_FIX_1520__ = true;

  const FALLBACK = {
    versionName: "1.5.20",
    versionCode: 27,
    apkUrl: "https://raw.githubusercontent.com/ashukla1707-beep/statarchive-android/main/downloads/stat-archive.apk"
  };

  let meta = { ...FALLBACK };
  let paintQueued = false;
  let refreshPromise = null;

  function setTextIfDifferent(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function paint() {
    const versionName = String(meta.versionName || FALLBACK.versionName);
    const apkUrl = String(meta.apkUrl || FALLBACK.apkUrl);

    setTextIfDifferent(document.getElementById("statAndroidVersion"), `v${versionName}`);
    setTextIfDifferent(document.getElementById("menuAndroidAppMeta"), `Official APK · v${versionName}`);

    document.querySelectorAll("#statAndroidDownload, #statAndroidAutoBanner .stat-android-auto-install").forEach(link => {
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.href !== apkUrl) link.href = apkUrl;
      if (link.id === "statAndroidDownload") link.setAttribute("download", "stat-archive.apk");
    });
  }

  function schedulePaint() {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      paintQueued = false;
      paint();
    });
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      paint();
      try {
        // Unique query string deliberately bypasses stale cache entries created
        // by an older service worker that cached /version.json by request URL.
        const url = `./version.json?v=${encodeURIComponent(FALLBACK.versionName)}&t=${Date.now()}`;
        const response = await fetch(url, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!data || typeof data !== "object") return;

        meta = {
          versionName: String(data.versionName || meta.versionName || FALLBACK.versionName),
          versionCode: Number(data.versionCode || meta.versionCode || FALLBACK.versionCode),
          apkUrl: String(data.apkUrl || meta.apkUrl || FALLBACK.apkUrl)
        };
      } catch (_) {
        // FALLBACK is the current official release, so the UI remains correct
        // even if metadata cannot be reached temporarily.
      } finally {
        paint();
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  function start() {
    paint();
    refresh();

    const observer = new MutationObserver(schedulePaint);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("#menuAndroidAppBtn, #statAndroidDownload")) return;
      setTimeout(paint, 0);
      setTimeout(refresh, 60);
      setTimeout(paint, 220);
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("focus", refresh, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
