/* Stat Archive performance boost
 * Fast cached archive boot + background refresh
 * Network warm-up without blocking first paint
 * Lightweight mobile/PWA/APK rendering mode
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

  function writeSnapshot(key, level, data) {
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

  /* Remove state left by an older V2 instance after a service-worker update. */
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

  /* Subject loading mutates the global subjects array internally. Snapshot
     wrapping it lets a slow request from the previous course overwrite the
     newly-selected course, so subjects are always loaded by the canonical
     loader. */
  try { localStorage.removeItem(SUBJECT_CACHE_KEY); } catch (_) {}

  /* Archive file responses are mutable when an entry is replaced. V2 cached
     them indefinitely by id and could therefore return an old PDF. Purge that
     cache and do not intercept file fetches here. */
  try {
    if ('caches' in window) caches.delete(LEGACY_PDF_CACHE).catch(() => {});
  } catch (_) {}

  /* Entry snapshots are safe as a fast first paint as long as each async
     refresh is tied to the level that started it. */
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
            refresh = Promise.resolve(originalLoadEntries.apply(this, args));
          } catch (err) {
            refresh = Promise.reject(err);
          }

          const tracked = refresh
            .then(fresh => {
              if (Array.isArray(fresh)) {
                writeSnapshot(ENTRY_CACHE_KEY, requestLevel, fresh);
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
      writeSnapshot(ENTRY_CACHE_KEY, requestLevel, fresh);
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
