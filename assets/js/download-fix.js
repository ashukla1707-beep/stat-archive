/* Stat Archive download reliability fix.
 * Browser/PWA downloads use the original network fetch and a Blob URL.
 * Android keeps the existing native download path unchanged.
 */
(() => {
  const originalDownloadEntry =
    typeof window.downloadEntry === 'function'
      ? window.downloadEntry
      : null;

  async function browserDownloadEntry(entry, btn) {
    const originalHtml = btn ? btn.innerHTML : '';
    const originalText = btn ? btn.textContent : '';

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Downloading…';
    }

    try {
      const workerUrl =
        typeof WORKER_URL === 'string'
          ? WORKER_URL
          : 'https://stat-archive-api.lustats.workers.dev';

      const fileUrl = `${workerUrl}/file?id=${encodeURIComponent(entry.id)}`;

      /* speed-boost.js wraps window.fetch for preview caching. Downloads should
         bypass that wrapper so the browser receives a fresh, normal Response. */
      const nativeFetch = window.fetch?.__native || window.fetch.bind(window);

      const response = await nativeFetch(fileUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = entry.filename || entry.title || 'stat-archive-file.pdf';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60000);

      try { incrementActivity('download'); } catch (_) {}
    } catch (err) {
      console.error('Download failed:', err);
      try {
        showError(err?.message || "Couldn't download that file.");
      } catch (_) {
        alert("Couldn't download that file.");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        if (originalHtml) btn.innerHTML = originalHtml;
        else btn.textContent = originalText || '⬇ Download';
      }
    }
  }

  function reliableDownloadEntry(entry, btn) {
    /* Preserve the APK's existing native bridge behavior. */
    if (window.AndroidBridge && originalDownloadEntry) {
      return originalDownloadEntry(entry, btn);
    }

    return browserDownloadEntry(entry, btn);
  }

  window.downloadEntry = reliableDownloadEntry;

  /* The card grid already has a delegated click listener. In normal web/PWA,
     intercept Download in capture phase so only this reliable path runs. */
  document.addEventListener('click', event => {
    if (window.AndroidBridge) return;

    const btn = event.target.closest('.dl-btn');
    if (!btn) return;

    const card = btn.closest('.card');
    if (!card) return;

    const entry = Array.isArray(window.entries)
      ? window.entries.find(item => String(item.id) === String(card.dataset.id))
      : (typeof entries !== 'undefined' && Array.isArray(entries)
          ? entries.find(item => String(item.id) === String(card.dataset.id))
          : null);

    if (!entry) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      btn.classList.add('is-downloaded');
      if (typeof downloadedEntryIds !== 'undefined') {
        downloadedEntryIds.add(String(entry.id));
        if (typeof saveEntryActionHistory === 'function') {
          saveEntryActionHistory('statArchiveDownloadedEntries', downloadedEntryIds);
        }
      }
    } catch (_) {}

    reliableDownloadEntry(entry, btn);
  }, true);
})();
