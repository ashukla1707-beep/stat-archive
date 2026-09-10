/* Stat Archive performance boost
 * Fast cached archive boot + background refresh
 * Network warm-up without blocking first paint
 * Lightweight mobile/PWA/APK rendering mode
 *
 * Correctness rules:
 * - archive files are never intercepted here; Preview/Download must see fresh files
 * - subject loading is never snapshot-wrapped because its loader mutates global state
 * - entry background refreshes are scoped to the course level that started them
 */
(() => {
  if (window.__statArchiveSpeedBoostV3) return;
  window.__statArchiveSpeedBoostV3 = true;

  const ENTRY_CACHE_KEY = 'statArchiveFastEntriesV2';
  const SUBJECT_CACHE_KEY = 'statArchiveFastSubjectsV2';
  const LEGACY_PDF_CACHE = 'stat-archive-pdf-files-v2';
  const SNAPSHOT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  const safeParse = raw => {
    try { return JSON.parse(raw); } catch (_) { return null; }
  };

  const currentLevelKey = () => {
    try { return String(typeof currentLevel !== 'undefined' ? currentLevel : 'msc'); }
    catch (_) { return 'msc'; }
  };

  function readSnapshot(key, level = currentLevelKey()) {
    try {
      const value = safeParse(localStorage.getItem(key));
      if (!value || value.level !== level || !Array.isArray(value.data)) return null;
      if (!Number.isFinite(value.at) || Date.now() - value.at > SNAPSHOT_MAX_AGE) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function writeSnapshotForLevel(key, level, data) {
    if (!Array.isArray(data)) return;
    try {
      localStorage.setItem(key, JSON.stringify({ level, at: Date.now(), data }));
    } catch (_) {}
  }

  function addConnectionHint(rel, href, crossOrigin = false) {
    try {
      if (!href || document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch (_) {}
  }

  function warmConnections() {
    try {
      const worker = typeof WORKER_URL === 'string' ? new URL(WORKER_URL).origin : '';
      const supabase = typeof SUPABASE_URL === 'string' ? new URL(SUPABASE_URL).origin : '';
      if (worker) {
        addConnectionHint('dns-prefetch', worker);
        addConnectionHint('preconnect', worker, true);
      }
      if (supabase) {
        addConnectionHint('dns-prefetch', supabase);
        addConnectionHint('preconnect', supabase, true);
      }
    } catch (_) {}
  }

  warmConnections();

  /* Remove desktop-only pointer effects on touch/low-power devices. */
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
    const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
    if (coarse || lowCpu || lowMemory) {
      document.documentElement.dataset.statPerf = 'lite';
      if (!document.getElementById('statArchiveLitePerfStyles')) {
        const style = document.createElement('style');
        style.id = 'statArchiveLitePerfStyles';
        style.textContent = `
          html[data-stat-perf="lite"] .cursor-ring,
          html[data-stat-perf="lite"] .cursor-dot,
          html[data-stat-perf="lite"] .mouse-spotlight{display:none!important;}
          html[data-stat-perf="lite"] .card{will-change:auto!important;transform:none;}
          @media (hover:none){html[data-stat-perf="lite"] .card:hover{transform:none!important;}}
        `;
        document.head.appendChild(style);
      }
    }
  } catch (_) {}

  function updateStorageTotal() {
    try {
      if (typeof entries === 'undefined' || typeof totalStorageBytes === 'undefined') return;
      let sum = 0;
      for (const entry of entries) {
        const n = Number(entry?.size);
        if (Number.isFinite(n) && n > 0) sum += n;
      }
      totalStorageBytes = sum;
    } catch (_) {}
  }

  let uiRefreshQueued = false;
  function refreshUiAfterBackgroundData() {
    if (uiRefreshQueued) return;
    uiRefreshQueued = true;
    requestAnimationFrame(() => {
      uiRefreshQueued = false;
      try {
        updateStorageTotal();
        if (typeof renderSubjectFilters === 'function') renderSubjectFilters();
        if (typeof renderTypeFilters === 'function') renderTypeFilters();
        if (typeof renderSubjectOptions === 'function') renderSubjectOptions();
        if (typeof render === 'function') render();
      } catch (_) {}
    });
  }

  /* If an older copy of this file already ran in this page, unwrap its
     correctness-sensitive hooks before installing the V3 behavior. */
  try {
    if (typeof loadEntries === 'function' && loadEntries.__statFastWrapped && loadEntries.__original) {
      loadEntries = loadEntries.__original;
    }
    if (typeof loadSubjectsFromWorker === 'function' && loadSubjectsFromWorker.__statFastWrapped && loadSubjectsFromWorker.__original) {
      loadSubjectsFromWorker = loadSubjectsFromWorker.__original;
    }
    if (window.fetch?.__statFastWrapped && window.fetch.__native) {
      window.fetch = window.fetch.__native;
    }
  } catch (_) {}

  /* The old subject snapshot wrapper could mutate the new level with a slow
     response from the old one. Do not use it anymore. */
  try { localStorage.removeItem(SUBJECT_CACHE_KEY); } catch (_) {}

  /* The old archive-file CacheStorage layer could serve a replaced PDF under
     the same entry id, even when Preview requested cache:'no-store'. Delete it
     and leave file freshness to the normal network/HTTP cache semantics. */
  try {
    if ('caches' in window) caches.delete(LEGACY_PDF_CACHE).catch(() => {});
  } catch (_) {}

  /* Instant entry-list boot from the last successful snapshot, then silently
     revalidate. Each level owns its own in-flight refresh and a late response
     may update the UI only if that same level is still active. */
  if (typeof loadEntries === 'function' && !loadEntries.__statFastWrapped) {
    const originalLoadEntries = loadEntries;
    const backgroundByLevel = new Map();

    const wrapped = async function fastLoadEntries(...args) {
      const requestLevel = currentLevelKey();
      const snapshot = readSnapshot(ENTRY_CACHE_KEY, requestLevel);

      if (snapshot) {
        if (!backgroundByLevel.has(requestLevel)) {
          let refresh;
          try {
            /* Calling the async loader now (instead of in a later microtask)
               ensures it reads the intended currentLevel before a fast switch. */
            refresh = Promise.resolve(originalLoadEntries.apply(this, args));
          } catch (err) {
            refresh = Promise.reject(err);
          }

          const tracked = refresh
            .then(fresh => {
              if (Array.isArray(fresh)) {
                writeSnapshotForLevel(ENTRY_CACHE_KEY, requestLevel, fresh);
                if (currentLevelKey() === requestLevel) {
                  entries = fresh;
                  refreshUiAfterBackgroundData();
                }
              }
              return fresh;
            })
            .catch(err => {
              console.warn('Fast background entry refresh failed:', err);
              return null;
            })
            .finally(() => {
              if (backgroundByLevel.get(requestLevel) === tracked) {
                backgroundByLevel.delete(requestLevel);
              }
            });

          backgroundByLevel.set(requestLevel, tracked);
        }
        return snapshot.data;
      }

      const fresh = await originalLoadEntries.apply(this, args);
      writeSnapshotForLevel(ENTRY_CACHE_KEY, requestLevel, fresh);
      return fresh;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadEntries;
    loadEntries = wrapped;
  }

  /* Warm pdf.js only after the critical UI has settled and only when the
     connection is not explicitly in data-saver mode. */
  const warmPdf = () => {
    try {
      if (navigator.connection?.saveData) return;
      if (typeof loadPdfJs === 'function') Promise.resolve(loadPdfJs()).catch(() => {});
    } catch (_) {}
  };

  if ('requestIdleCallback' in window) requestIdleCallback(warmPdf, { timeout: 2500 });
  else setTimeout(warmPdf, 1200);
})();
