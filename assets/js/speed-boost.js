/* Stat Archive performance boost
 * - instant stale-while-revalidate archive boot from localStorage
 * - background network refresh so cached UI never stays stale
 * - warm pdf.js during idle time
 * - Cache API reuse for PDF/file responses
 */
(() => {
  const ENTRY_CACHE_KEY = 'statArchiveFastEntriesV1';
  const SUBJECT_CACHE_KEY = 'statArchiveFastSubjectsV1';
  const PDF_CACHE = 'stat-archive-pdf-files-v1';

  const safeParse = (raw) => {
    try { return JSON.parse(raw); } catch (_) { return null; }
  };

  const currentLevelKey = () => {
    try { return String(typeof currentLevel !== 'undefined' ? currentLevel : 'msc'); }
    catch (_) { return 'msc'; }
  };

  function readSnapshot(key) {
    try {
      const value = safeParse(localStorage.getItem(key));
      if (!value || value.level !== currentLevelKey()) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function writeSnapshot(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        level: currentLevelKey(),
        at: Date.now(),
        data
      }));
    } catch (_) {}
  }

  function updateStorageTotal() {
    try {
      if (typeof entries === 'undefined' || typeof totalStorageBytes === 'undefined') return;
      totalStorageBytes = entries.reduce((sum, entry) => {
        const n = Number(entry?.size);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0);
    } catch (_) {}
  }

  function refreshUiAfterBackgroundData() {
    try {
      updateStorageTotal();
      if (typeof renderSubjectFilters === 'function') renderSubjectFilters();
      if (typeof renderTypeFilters === 'function') renderTypeFilters();
      if (typeof renderSubjectOptions === 'function') renderSubjectOptions();
      if (typeof render === 'function') render();
    } catch (_) {}
  }

  /* Wrap entries loader before runtime.js calls init(). */
  if (typeof loadEntries === 'function' && !loadEntries.__statFastWrapped) {
    const originalLoadEntries = loadEntries;
    let backgroundEntriesPromise = null;

    const wrapped = async function fastLoadEntries(...args) {
      const snapshot = readSnapshot(ENTRY_CACHE_KEY);

      if (snapshot && Array.isArray(snapshot.data)) {
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
      if (Array.isArray(fresh)) writeSnapshot(ENTRY_CACHE_KEY, fresh);
      return fresh;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadEntries;
    loadEntries = wrapped;
  }

  /* Same idea for subjects. loadSubjectsFromWorker mutates global subjects. */
  if (typeof loadSubjectsFromWorker === 'function' && !loadSubjectsFromWorker.__statFastWrapped) {
    const originalLoadSubjects = loadSubjectsFromWorker;
    let backgroundSubjectsPromise = null;

    const wrapped = async function fastLoadSubjects(...args) {
      const snapshot = readSnapshot(SUBJECT_CACHE_KEY);

      if (snapshot && Array.isArray(snapshot.data)) {
        subjects = snapshot.data;

        if (!backgroundSubjectsPromise) {
          backgroundSubjectsPromise = Promise.resolve()
            .then(() => originalLoadSubjects.apply(this, args))
            .then(result => {
              if (Array.isArray(subjects)) {
                writeSnapshot(SUBJECT_CACHE_KEY, subjects);
                refreshUiAfterBackgroundData();
              }
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
      if (Array.isArray(subjects)) writeSnapshot(SUBJECT_CACHE_KEY, subjects);
      return result;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadSubjects;
    loadSubjectsFromWorker = wrapped;
  }

  /* Reuse downloaded archive files. This especially speeds repeat previews,
     reopening a PDF, print-after-preview and APK revisits. */
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
      const hasRange = !!(
        headers &&
        ((typeof headers.get === 'function' && headers.get('range')) || headers.Range || headers.range)
      );

      const isArchiveFile = method === 'GET' &&
        workerBase &&
        url.startsWith(`${workerBase}/file?id=`) &&
        !hasRange;

      if (!isArchiveFile || !('caches' in window)) {
        return nativeFetch(input, init);
      }

      try {
        const cache = await caches.open(PDF_CACHE);
        const hit = await cache.match(url);
        if (hit) return hit.clone();

        const response = await nativeFetch(input, {
          ...init,
          cache: init?.cache === 'no-store' ? 'default' : (init?.cache || 'default')
        });

        if (response?.ok) {
          cache.put(url, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return nativeFetch(input, init);
      }
    };

    fastFetch.__statFastWrapped = true;
    fastFetch.__native = nativeFetch;
    window.fetch = fastFetch;
  }

  /* Remove pdf.js CDN/setup latency from the first Preview click. */
  const warmPdf = () => {
    try {
      if (typeof loadPdfJs === 'function') {
        Promise.resolve(loadPdfJs()).catch(() => {});
      }
    } catch (_) {}
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warmPdf, { timeout: 1800 });
  } else {
    setTimeout(warmPdf, 700);
  }
})();
