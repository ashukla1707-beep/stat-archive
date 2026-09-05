/* Stat Archive performance boost
 * Fast cached archive boot + background refresh
 * Fast repeat PDF/file access
 * Network warm-up without blocking first paint
 * Lightweight mobile/PWA/APK rendering mode
 */
(() => {
  if (window.__statArchiveSpeedBoostV2) return;
  window.__statArchiveSpeedBoostV2 = true;

  const ENTRY_CACHE_KEY = 'statArchiveFastEntriesV2';
  const SUBJECT_CACHE_KEY = 'statArchiveFastSubjectsV2';
  const PDF_CACHE = 'stat-archive-pdf-files-v2';
  const SNAPSHOT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  const safeParse = raw => {
    try { return JSON.parse(raw); } catch (_) { return null; }
  };

  const currentLevelKey = () => {
    try { return String(typeof currentLevel !== 'undefined' ? currentLevel : 'msc'); }
    catch (_) { return 'msc'; }
  };

  function readSnapshot(key) {
    try {
      const value = safeParse(localStorage.getItem(key));
      if (!value || value.level !== currentLevelKey() || !Array.isArray(value.data)) return null;
      if (!Number.isFinite(value.at) || Date.now() - value.at > SNAPSHOT_MAX_AGE) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function writeSnapshot(key, data) {
    if (!Array.isArray(data)) return;
    try {
      localStorage.setItem(key, JSON.stringify({ level: currentLevelKey(), at: Date.now(), data }));
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

  /* Remove desktop-only pointer effects on touch/low-power devices. They add
     continuous paint/compositing work in Android WebView/PWA but provide no
     useful interaction on a coarse pointer. */
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
    const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
    if (coarse || lowCpu || lowMemory) {
      document.documentElement.dataset.statPerf = 'lite';
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

  /* Instant archive boot from the last successful snapshot, then silently
     revalidate in the background. */
  if (typeof loadEntries === 'function' && !loadEntries.__statFastWrapped) {
    const originalLoadEntries = loadEntries;
    let backgroundEntriesPromise = null;

    const wrapped = async function fastLoadEntries(...args) {
      const snapshot = readSnapshot(ENTRY_CACHE_KEY);
      if (snapshot) {
        if (!backgroundEntriesPromise) {
          backgroundEntriesPromise = Promise.resolve()
            .then(() => originalLoadEntries.apply(this, args))
            .then(fresh => {
              if (Array.isArray(fresh)) {
                writeSnapshot(ENTRY_CACHE_KEY, fresh);
                entries = fresh;
                refreshUiAfterBackgroundData();
              }
              return fresh;
            })
            .catch(err => {
              console.warn('Fast background entry refresh failed:', err);
              return null;
            })
            .finally(() => { backgroundEntriesPromise = null; });
        }
        return snapshot.data;
      }

      const fresh = await originalLoadEntries.apply(this, args);
      writeSnapshot(ENTRY_CACHE_KEY, fresh);
      return fresh;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadEntries;
    loadEntries = wrapped;
  }

  if (typeof loadSubjectsFromWorker === 'function' && !loadSubjectsFromWorker.__statFastWrapped) {
    const originalLoadSubjects = loadSubjectsFromWorker;
    let backgroundSubjectsPromise = null;

    const wrapped = async function fastLoadSubjects(...args) {
      const snapshot = readSnapshot(SUBJECT_CACHE_KEY);
      if (snapshot) {
        subjects = snapshot.data;
        if (!backgroundSubjectsPromise) {
          backgroundSubjectsPromise = Promise.resolve()
            .then(() => originalLoadSubjects.apply(this, args))
            .then(result => {
              writeSnapshot(SUBJECT_CACHE_KEY, subjects);
              refreshUiAfterBackgroundData();
              return result;
            })
            .catch(err => {
              console.warn('Fast background subject refresh failed:', err);
              return null;
            })
            .finally(() => { backgroundSubjectsPromise = null; });
        }
        return subjects;
      }

      const result = await originalLoadSubjects.apply(this, args);
      writeSnapshot(SUBJECT_CACHE_KEY, subjects);
      return result;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadSubjects;
    loadSubjectsFromWorker = wrapped;
  }

  /* Cache complete archive-file responses. Repeat previews/downloads then
     open from local storage instead of downloading the same PDF again. */
  if (typeof window.fetch === 'function' && !window.fetch.__statFastWrapped) {
    const nativeFetch = window.fetch.bind(window);

    const fastFetch = async function(input, init = undefined) {
      let url = '';
      let method = 'GET';
      try {
        url = typeof input === 'string' ? input : String(input?.url || '');
        method = String(init?.method || input?.method || 'GET').toUpperCase();
      } catch (_) {}

      let workerBase = '';
      try { workerBase = typeof WORKER_URL === 'string' ? WORKER_URL : ''; } catch (_) {}

      const headers = init?.headers || input?.headers || null;
      const hasRange = !!(headers && ((typeof headers.get === 'function' && headers.get('range')) || headers.Range || headers.range));
      const isArchiveFile = method === 'GET' && workerBase && url.startsWith(`${workerBase}/file?id=`) && !hasRange;

      if (!isArchiveFile || !('caches' in window)) return nativeFetch(input, init);

      try {
        const cache = await caches.open(PDF_CACHE);
        const hit = await cache.match(url);
        if (hit) return hit.clone();

        const response = await nativeFetch(input, init);
        if (response?.ok) cache.put(url, response.clone()).catch(() => {});
        return response;
      } catch (_) {
        return nativeFetch(input, init);
      }
    };

    fastFetch.__statFastWrapped = true;
    fastFetch.__native = nativeFetch;
    window.fetch = fastFetch;
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
