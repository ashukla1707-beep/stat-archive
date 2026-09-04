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

  const currentLevelKey = () => String(window.currentLevel || 'msc');

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
      window.totalStorageBytes = (window.entries || []).reduce((sum, entry) => {
        const n = Number(entry?.size);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0);
    } catch (_) {}
  }

  function refreshUiAfterBackgroundData() {
    try {
      updateStorageTotal();
      window.renderSubjectFilters?.();
      window.renderTypeFilters?.();
      window.renderSubjectOptions?.();
      window.render?.();
    } catch (_) {}
  }

  /* Wrap entries loader before runtime.js calls init(). */
  if (typeof window.loadEntries === 'function' && !window.loadEntries.__statFastWrapped) {
    const originalLoadEntries = window.loadEntries;
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
                window.entries = fresh;
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
    window.loadEntries = wrapped;
  }

  /* Same idea for subjects. loadSubjectsFromWorker mutates global subjects. */
  if (typeof window.loadSubjectsFromWorker === 'function' && !window.loadSubjectsFromWorker.__statFastWrapped) {
    const originalLoadSubjects = window.loadSubjectsFromWorker;
    let backgroundSubjectsPromise = null;

    const wrapped = async function fastLoadSubjects(...args) {
      const snapshot = readSnapshot(SUBJECT_CACHE_KEY);

      if (snapshot && Array.isArray(snapshot.data)) {
        window.subjects = snapshot.data;

        if (!backgroundSubjectsPromise) {
          backgroundSubjectsPromise = Promise.resolve()
            .then(() => originalLoadSubjects.apply(this, args))
            .then(result => {
              if (Array.isArray(window.subjects)) {
                writeSnapshot(SUBJECT_CACHE_KEY, window.subjects);
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

        return window.subjects;
      }

      const result = await originalLoadSubjects.apply(this, args);
      if (Array.isArray(window.subjects)) writeSnapshot(SUBJECT_CACHE_KEY, window.subjects);
      return result;
    };

    wrapped.__statFastWrapped = true;
    wrapped.__original = originalLoadSubjects;
    window.loadSubjectsFromWorker = wrapped;
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

      const isArchiveFile = method === 'GET' &&
        typeof window.WORKER_URL === 'string' &&
        url.startsWith(`${window.WORKER_URL}/file?id=`) &&
        !init?.headers?.Range && !init?.headers?.range;

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
    if (typeof window.loadPdfJs === 'function') {
      Promise.resolve(window.loadPdfJs()).catch(() => {});
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warmPdf, { timeout: 1800 });
  } else {
    setTimeout(warmPdf, 700);
  }
})();
