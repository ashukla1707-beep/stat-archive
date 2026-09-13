/* Stat Archive — download/offline reliability layer.
 *
 * Goals:
 * - Browser/PWA downloads stay reliable.
 * - Drive-backed downloads work inside the Android WebView too.
 * - Offline PDFs are type/filename-normalized so Android sees a PDF, not .bin.
 * - Offline PDFs open in Stat Archive's own pdf.js preview, so very large files
 *   do not have to be base64-copied into another Android app just to read them.
 */
(() => {
  "use strict";

  if (window.__statArchiveDownloadOfflineRepairV3) return;
  window.__statArchiveDownloadOfflineRepairV3 = true;

  const originalDownloadEntry =
    typeof window.downloadEntry === "function" ? window.downloadEntry : null;
  const originalSaveEntryOffline =
    typeof window.saveEntryOffline === "function" ? window.saveEntryOffline : null;
  const originalOpenOfflineFile =
    typeof window.openOfflineFile === "function" ? window.openOfflineFile : null;
  const originalShareOfflineFile =
    typeof window.shareOfflineFile === "function" ? window.shareOfflineFile : null;

  const isAndroid = () => !!(
    window.AndroidBridge &&
    typeof window.AndroidBridge === "object"
  );

  function nativeFetch() {
    if (window.fetch?.__native) return window.fetch.__native;
    return window.fetch.bind(window);
  }

  function cleanName(value) {
    return String(value || "Stat Archive file")
      .replace(/[\\/:*?"<>|\r\n]+/g, "_")
      .replace(/\.+$/g, "")
      .trim() || "Stat Archive file";
  }

  function hasUsefulExtension(name) {
    return /\.[A-Za-z0-9]{1,8}$/.test(String(name || ""));
  }

  async function looksLikePdf(blob, record) {
    const hinted = [
      record?.mime,
      blob?.type,
      record?.filename,
      record?.title
    ].filter(Boolean).join(" ").toLowerCase();

    if (hinted.includes("application/pdf") || /\.pdf(?:\s|$)/i.test(hinted)) {
      return true;
    }

    try {
      const bytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
      return bytes.length >= 5 &&
        bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 &&
        bytes[3] === 0x46 && bytes[4] === 0x2d; // %PDF-
    } catch (_) {
      return false;
    }
  }

  async function normalizeRecordBlob(record, sourceEntry = null) {
    if (!record?.blob) throw new Error("Offline file could not be found.");

    const pdf = await looksLikePdf(record.blob, sourceEntry || record);
    let mime = String(record.mime || record.blob.type || "").trim();

    if (pdf) mime = "application/pdf";
    if (!mime) mime = "application/octet-stream";

    let filename = "";
    try {
      if (sourceEntry && typeof window.archiveDownloadName === "function") {
        filename = window.archiveDownloadName(sourceEntry);
      }
    } catch (_) {}

    if (!filename) {
      try {
        if (typeof window.safeOfflineShareFilename === "function") {
          filename = window.safeOfflineShareFilename(record);
        }
      } catch (_) {}
    }

    if (!filename) filename = record.filename || record.title || "Stat Archive file";
    filename = cleanName(filename);

    if (pdf && !/\.pdf$/i.test(filename)) {
      filename = hasUsefulExtension(filename)
        ? filename.replace(/\.[A-Za-z0-9]{1,8}$/, ".pdf")
        : filename + ".pdf";
    }

    const blob = record.blob.type === mime
      ? record.blob
      : new Blob([record.blob], { type: mime });

    return { blob, mime, filename, pdf };
  }

  async function persistNormalizedOfflineRecord(record, normalized, sourceEntry = null) {
    if (!record || typeof window.putOfflineFile !== "function") return;

    const next = {
      ...record,
      filename: normalized.filename,
      mime: normalized.mime,
      blob: normalized.blob
    };
    if (sourceEntry?.driveUrl) next.driveUrl = sourceEntry.driveUrl;

    const changed =
      next.filename !== record.filename ||
      next.mime !== record.mime ||
      next.blob.type !== record.blob?.type ||
      (!!sourceEntry?.driveUrl && next.driveUrl !== record.driveUrl);

    if (changed) {
      try { await window.putOfflineFile(next); } catch (_) {}
    }
  }

  async function saveBlobWithAndroid(blob, filename, mime) {
    if (!isAndroid() || typeof window.AndroidBridge.saveFile !== "function") {
      throw new Error("Android file saving is unavailable.");
    }
    if (typeof window.blobToBase64 !== "function") {
      throw new Error("Could not prepare that file for Android.");
    }

    const base64 = await window.blobToBase64(blob);
    window.AndroidBridge.saveFile(base64, filename, mime);
  }

  async function browserDownloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function downloadDriveEntry(entry, btn) {
    const originalHtml = btn ? btn.innerHTML : "";
    const originalText = btn ? btn.textContent : "";

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Downloading…";
    }

    try {
      const inlineUrl = typeof window.statArchiveDriveStreamUrl === "function"
        ? window.statArchiveDriveStreamUrl(entry, "inline")
        : entry.driveUrl;

      /* APK downloads must behave like every other Stat Archive file: open
         Android's Save As / folder picker first. Newer APKs stream the URL
         straight into the chosen document; older APKs fall back to saveFile. */
      if (isAndroid() && typeof window.AndroidBridge.saveUrl === "function") {
        let nativeName = "";
        try {
          if (typeof window.archiveDownloadName === "function") {
            nativeName = window.archiveDownloadName(entry);
          }
        } catch (_) {}
        if (!nativeName) nativeName = entry.title || entry.filename || "Stat Archive file.pdf";
        nativeName = cleanName(nativeName);
        if (!/\.pdf$/i.test(nativeName)) nativeName += ".pdf";
        window.AndroidBridge.saveUrl(inlineUrl, nativeName, "application/pdf");
        try { window.incrementActivity?.("download"); } catch (_) {}
        return;
      }

      const response = await nativeFetch()(inlineUrl, {
        method: "GET",
        cache: "no-store",
        credentials: "omit"
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);

      const raw = await response.blob();
      const pdf = await looksLikePdf(raw, entry);
      const mime = pdf ? "application/pdf" : (
        raw.type || response.headers.get("content-type") || "application/octet-stream"
      );
      const blob = raw.type === mime ? raw : new Blob([raw], { type: mime });

      let filename = "";
      try {
        if (typeof window.archiveDownloadName === "function") {
          filename = window.archiveDownloadName(entry);
        }
      } catch (_) {}
      if (!filename) filename = entry.title || entry.filename || "Stat Archive file";
      filename = cleanName(filename);
      if (pdf && !/\.pdf$/i.test(filename)) filename += ".pdf";

      if (isAndroid()) {
        await saveBlobWithAndroid(blob, filename, mime);
      } else {
        await browserDownloadBlob(blob, filename);
      }

      try { window.incrementActivity?.("download"); } catch (_) {}
    } catch (err) {
      console.error("Drive download failed:", err);
      try { window.showError?.(err?.message || "Couldn't download that file."); }
      catch (_) { alert("Couldn't download that file."); }
    } finally {
      if (btn) {
        btn.disabled = false;
        if (originalHtml) btn.innerHTML = originalHtml;
        else btn.textContent = originalText || "⬇ Download";
      }
    }
  }

  async function downloadOfflinePreviewBlob(entry, btn) {
    const blob = entry?._offlineBlob;
    if (!blob) return false;

    const filename = entry?._offlineFilename || entry?.filename || "Stat Archive file.pdf";
    const mime = entry?._offlineMime || blob.type || "application/pdf";

    if (isAndroid()) await saveBlobWithAndroid(blob, filename, mime);
    else await browserDownloadBlob(blob, filename);
    return true;
  }

  async function reliableDownloadEntry(entry, btn) {
    if (entry?._offlineBlob) {
      try { await downloadOfflinePreviewBlob(entry, btn); }
      catch (err) { window.showError?.(err?.message || "Couldn't download that file."); }
      return;
    }

    if (entry?.driveUrl) return downloadDriveEntry(entry, btn);

    if (isAndroid() && originalDownloadEntry) {
      return originalDownloadEntry(entry, btn);
    }

    const originalHtml = btn ? btn.innerHTML : "";
    const originalText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Downloading…"; }

    try {
      const workerUrl = typeof WORKER_URL === "string"
        ? WORKER_URL
        : "https://stat-archive-api.lustats.workers.dev";
      const fileUrl = `${workerUrl}/file?id=${encodeURIComponent(entry.id)}`;
      const response = await nativeFetch()(fileUrl, {
        method: "GET",
        credentials: "omit",
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const filename = cleanName(entry.filename || entry.title || "stat-archive-file.pdf");
      await browserDownloadBlob(blob, filename);
      try { window.incrementActivity?.("download"); } catch (_) {}
    } catch (err) {
      console.error("Download failed:", err);
      try { window.showError?.(err?.message || "Couldn't download that file."); }
      catch (_) { alert("Couldn't download that file."); }
    } finally {
      if (btn) {
        btn.disabled = false;
        if (originalHtml) btn.innerHTML = originalHtml;
        else btn.textContent = originalText || "⬇ Download";
      }
    }
  }

  window.downloadEntry = reliableDownloadEntry;

  /* Repair metadata immediately after a Drive file is saved offline. This also
     repairs a previously-saved Drive record the next time its Offline button is tapped. */
  if (originalSaveEntryOffline) {
    window.saveEntryOffline = async function repairedSaveEntryOffline(entry, btn) {
      await originalSaveEntryOffline(entry, btn);
      if (!entry?.driveUrl || typeof window.getOfflineFile !== "function") return;

      try {
        const record = await window.getOfflineFile(String(entry.id));
        if (!record?.blob) return;
        const normalized = await normalizeRecordBlob(record, entry);
        await persistNormalizedOfflineRecord(record, normalized, entry);
      } catch (err) {
        console.warn("Offline metadata repair failed:", err);
      }
    };
  }

  /* Open an offline file through the existing Stat Archive pdf.js reader.
     A temporary fetch shim feeds previewEntry() the IndexedDB Blob directly.
     This avoids copying a 100+ MB PDF through the Android Javascript bridge. */
  if (originalOpenOfflineFile) {
    window.openOfflineFile = async function repairedOpenOfflineFile(id) {
      if (typeof window.getOfflineFile !== "function" || typeof window.previewEntry !== "function") {
        return originalOpenOfflineFile(id);
      }

      const record = await window.getOfflineFile(String(id));
      if (!record?.blob) throw new Error("Offline file could not be found.");
      const normalized = await normalizeRecordBlob(record);
      await persistNormalizedOfflineRecord(record, normalized);

      /* In the Android APK, Offline > Open must hand the saved file to
         Android so the user can choose a PDF app instead of opening Stat
         Archive's internal reader. */
      if (isAndroid()) return originalOpenOfflineFile(id);

      if (!normalized.pdf) return originalOpenOfflineFile(id);

      try { window.closeOfflineLibrary?.(); } catch (_) {}

      const marker = `__offline_pdf_${String(id)}_${Date.now()}`;
      const entry = {
        id: marker,
        title: record.title || normalized.filename,
        filename: normalized.filename,
        type: record.type || "",
        year: record.year || "",
        _offlineBlob: normalized.blob,
        _offlineFilename: normalized.filename,
        _offlineMime: normalized.mime
      };

      const previousFetch = window.fetch;
      const expected = `${typeof WORKER_URL === "string" ? WORKER_URL : "https://stat-archive-api.lustats.workers.dev"}/file?id=${encodeURIComponent(marker)}`;
      window.fetch = function(input, init) {
        const url = typeof input === "string" ? input : String(input?.url || input || "");
        if (url === expected) {
          return Promise.resolve(new Response(normalized.blob, {
            status: 200,
            headers: { "Content-Type": normalized.mime }
          }));
        }
        return previousFetch.call(this, input, init);
      };

      try {
        await window.previewEntry(entry);
      } finally {
        window.fetch = previousFetch;
      }
    };
  }

  /* Repair old .bin/octet-stream records before sharing. The existing share
     implementation can then hand Android a real .pdf filename + application/pdf. */
  if (originalShareOfflineFile) {
    window.shareOfflineFile = async function repairedShareOfflineFile(id) {
      if (typeof window.getOfflineFile !== "function") return originalShareOfflineFile(id);
      const record = await window.getOfflineFile(String(id));
      if (!record?.blob) throw new Error("Offline file could not be found.");

      const normalized = await normalizeRecordBlob(record);
      await persistNormalizedOfflineRecord(record, normalized);

      return originalShareOfflineFile(id);
    };
  }

  /* The card grid already has a delegated listener. In browser/PWA, intercept
     Download in capture phase so only this path runs. Android is intentionally
     left to the normal card listener, which now resolves to reliableDownloadEntry. */
  document.addEventListener("click", event => {
    if (isAndroid()) return;

    const btn = event.target instanceof Element ? event.target.closest(".dl-btn") : null;
    if (!btn) return;
    const card = btn.closest(".card");
    if (!card) return;

    const source = Array.isArray(window.entries)
      ? window.entries
      : (typeof entries !== "undefined" && Array.isArray(entries) ? entries : []);
    const entry = source.find(item => String(item.id) === String(card.dataset.id));
    if (!entry) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      btn.classList.add("is-downloaded");
      if (typeof downloadedEntryIds !== "undefined") {
        downloadedEntryIds.add(String(entry.id));
        if (typeof saveEntryActionHistory === "function") {
          saveEntryActionHistory("statArchiveDownloadedEntries", downloadedEntryIds);
        }
      }
    } catch (_) {}

    reliableDownloadEntry(entry, btn);
  }, true);
})();
