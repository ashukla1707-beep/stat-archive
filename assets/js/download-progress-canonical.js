/* Stat Archive — canonical Download transfer/progress runtime. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_CANONICAL_DOWNLOAD_PROGRESS_V4__) return;
  window.__STAT_ARCHIVE_CANONICAL_DOWNLOAD_PROGRESS_V4__ = true;

  const isAndroid = () => !!(window.AndroidBridge && typeof window.AndroidBridge === "object");
  const hasStreamBridge = () => !!(window.AndroidStreamBridge && typeof window.AndroidStreamBridge === "object");
  const nativeFetch = window.fetch.bind(window);
  let hideTimer = null;

  function cleanName(value) {
    return String(value || "Stat Archive file")
      .replace(/[\\/:*?"<>|\r\n]+/g, "_")
      .replace(/\.+$/g, "")
      .trim() || "Stat Archive file";
  }

  function filenameOf(entry, mime) {
    let name = "";
    try {
      if (typeof window.archiveDownloadName === "function") {
        name = window.archiveDownloadName(entry);
      }
    } catch (_) {}

    if (!name) name = entry?.filename || entry?.title || "Stat Archive file";
    name = cleanName(name);

    if ((String(mime || "").toLowerCase().includes("pdf") || entry?.driveUrl) && !/\.pdf$/i.test(name)) {
      name += ".pdf";
    }
    return name;
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 1 : 2)} MB`;
  }

  function ensureStatusStyle() {
    if (document.getElementById("statArchiveCanonicalStatusStyle")) return;
    const style = document.createElement("style");
    style.id = "statArchiveCanonicalStatusStyle";
    style.textContent = `
#statArchiveActionStatus{
  position:fixed!important;
  left:50%!important;
  bottom:max(18px,calc(env(safe-area-inset-bottom,0px) + 14px))!important;
  z-index:2147483000!important;
  display:grid!important;
  grid-template-columns:18px minmax(0,1fr) auto!important;
  align-items:center!important;
  column-gap:10px!important;
  row-gap:8px!important;
  width:min(560px,calc(100vw - 28px))!important;
  min-width:0!important;
  box-sizing:border-box!important;
  padding:12px 13px!important;
  border:1px solid rgba(148,163,184,.22)!important;
  border-radius:14px!important;
  background:rgba(11,17,26,.96)!important;
  color:#eef3f8!important;
  box-shadow:0 16px 42px rgba(0,0,0,.36)!important;
  font:600 11.5px/1.35 Inter,sans-serif!important;
  transform:translate(-50%,18px)!important;
  opacity:0!important;
  visibility:hidden!important;
  pointer-events:none!important;
  transition:opacity .18s ease,transform .18s ease,visibility .18s ease!important;
  -webkit-backdrop-filter:blur(14px)!important;
  backdrop-filter:blur(14px)!important;
}
#statArchiveActionStatus.is-visible{
  opacity:1!important;
  visibility:visible!important;
  transform:translate(-50%,0)!important;
}
#statArchiveActionStatus .sa-status-icon{
  width:18px;height:18px;display:grid;place-items:center;border-radius:50%;
  border:2px solid rgba(94,231,247,.32);color:#7ce9f5;font-size:10px;box-sizing:border-box;
}
#statArchiveActionStatus[data-state="loading"] .sa-status-icon{
  border-top-color:#7ce9f5;color:transparent;animation:saCanonicalStatusSpin .8s linear infinite;
}
#statArchiveActionStatus[data-state="success"] .sa-status-icon{border-color:rgba(92,214,144,.46);color:#75dfa4;}
#statArchiveActionStatus[data-state="error"] .sa-status-icon{border-color:rgba(255,120,120,.45);color:#ff9a9a;}
#statArchiveActionStatus .sa-status-text{min-width:0;white-space:normal;overflow-wrap:anywhere;}
#statArchiveActionStatus .sa-status-percent{min-width:42px;text-align:right;color:#67e8f9;font:800 13px/1 'JetBrains Mono',monospace;display:none;}
#statArchiveActionStatus.has-progress .sa-status-percent{display:block;}
#statArchiveActionStatus .sa-status-track{grid-column:1/-1;height:4px;border-radius:99px;background:rgba(148,163,184,.16);overflow:hidden;display:none;}
#statArchiveActionStatus.has-progress .sa-status-track{display:block;}
#statArchiveActionStatus .sa-status-bar{display:block;width:0%;height:100%;border-radius:inherit;background:#5ee7f7;transition:width .12s linear;}
@keyframes saCanonicalStatusSpin{to{transform:rotate(360deg)}}
body[data-theme="light"] #statArchiveActionStatus{background:rgba(251,249,247,.98)!important;color:#332b38!important;border-color:rgba(92,55,120,.18)!important;box-shadow:0 16px 36px rgba(68,45,84,.16)!important;}
body[data-theme="light"] #statArchiveActionStatus .sa-status-percent{color:#70428f!important;}
body[data-theme="light"] #statArchiveActionStatus .sa-status-bar{background:#70428f!important;}
@media(max-width:700px){
  #statArchiveActionStatus{width:calc(100vw - 24px)!important;bottom:max(12px,calc(env(safe-area-inset-bottom,0px) + 10px))!important;padding:12px!important;}
}
@media(prefers-reduced-motion:reduce){
  #statArchiveActionStatus{transition:none!important;}
  #statArchiveActionStatus[data-state="loading"] .sa-status-icon{animation:none!important;}
  #statArchiveActionStatus .sa-status-bar{transition:none!important;}
}`;
    document.head.appendChild(style);
  }

  function statusElement() {
    ensureStatusStyle();
    let el = document.getElementById("statArchiveActionStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "statArchiveActionStatus";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      el.innerHTML = '<span class="sa-status-icon" aria-hidden="true">✓</span><span class="sa-status-text"></span><span class="sa-status-percent"></span><span class="sa-status-track" aria-hidden="true"><i class="sa-status-bar"></i></span>';
      document.body.appendChild(el);
    }
    return el;
  }

  function showStatus(text, state = "loading", duration = 0, progress = null) {
    const el = statusElement();
    const icon = el.querySelector(".sa-status-icon");
    const copy = el.querySelector(".sa-status-text");
    const pct = el.querySelector(".sa-status-percent");
    const bar = el.querySelector(".sa-status-bar");
    const p = Number.isFinite(Number(progress)) ? Math.max(0, Math.min(100, Math.round(Number(progress)))) : null;

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    el.dataset.state = state;
    if (icon) icon.textContent = state === "success" ? "✓" : state === "error" ? "!" : "•";
    if (copy) copy.textContent = String(text || "Working…");
    el.classList.toggle("has-progress", p !== null);
    if (pct) pct.textContent = p === null ? "" : `${p}%`;
    if (bar) bar.style.width = p === null ? "0%" : `${p}%`;
    el.classList.add("is-visible");
    el.setAttribute("aria-hidden", "false");

    if (duration > 0) {
      hideTimer = setTimeout(() => {
        el.classList.remove("is-visible");
        el.setAttribute("aria-hidden", "true");
        hideTimer = null;
      }, duration);
    }
  }

  window.statArchiveActionStatus = showStatus;

  async function readResponse(response, entry) {
    const total = Number(response.headers.get("content-length")) || Number(entry?.size) || 0;
    const label = entry?.title || entry?.filename || "file";

    if (!response.body || typeof response.body.getReader !== "function") {
      showStatus(`Downloading · ${label}`, "loading", 0, total ? 0 : null);
      const blob = await response.blob();
      showStatus(`Downloading · ${label} · ${formatBytes(blob.size)} / ${formatBytes(total || blob.size)}`, "loading", 0, 100);
      return blob;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    showStatus(`Downloading · ${label}`, "loading", 0, total ? 0 : null);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      loaded += value.byteLength || value.length || 0;
      const percent = total ? Math.min(99, Math.floor((loaded / total) * 100)) : null;
      showStatus(
        total
          ? `Downloading · ${label} · ${formatBytes(loaded)} / ${formatBytes(total)}`
          : `Downloading · ${label} · ${formatBytes(loaded)}`,
        "loading",
        0,
        percent
      );
    }

    return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("Could not read file"));
      reader.onload = () => {
        const data = String(reader.result || "");
        resolve(data.slice(data.indexOf(",") + 1));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function saveAndroid(blob, name, mime) {
    if (hasStreamBridge()) {
      const bridge = window.AndroidStreamBridge;
      if (
        typeof bridge.beginBlobTransfer === "function" &&
        typeof bridge.appendBlobChunk === "function" &&
        typeof bridge.finishBlobTransfer === "function" &&
        bridge.beginBlobTransfer(name, mime, "save")
      ) {
        const step = 256 * 1024;
        for (let i = 0; i < blob.size; i += step) {
          const ok = bridge.appendBlobChunk(
            await blobToBase64(blob.slice(i, Math.min(i + step, blob.size)))
          );
          if (!ok) throw new Error("Android transfer interrupted");
        }
        if (!bridge.finishBlobTransfer()) throw new Error("Android transfer could not finish");
        return;
      }
    }

    if (typeof window.AndroidBridge?.saveFile === "function") {
      window.AndroidBridge.saveFile(await blobToBase64(blob), name, mime);
      return;
    }

    throw new Error("Android file saving is unavailable");
  }

  function saveBrowser(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function markComplete(entry, btn) {
    if (btn) {
      btn.disabled = false;
      btn.classList.add("is-downloaded");
      if (btn.classList.contains("dl-btn") || btn.classList.contains("download-btn")) {
        btn.textContent = "✓ Downloaded";
        btn.title = "Already downloaded on this device";
      }
    }

    try {
      downloadedEntryIds.add(String(entry.id));
      saveEntryActionHistory("statArchiveDownloadedEntries", downloadedEntryIds);
    } catch (_) {}
  }

  async function transfer(entry, btn) {
    if (!entry) return;
    const original = btn?.innerHTML || "⬇ Download";
    const label = entry?.title || entry?.filename || "file";

    if (btn) {
      btn.disabled = true;
      if (btn.classList.contains("dl-btn") || btn.classList.contains("download-btn")) {
        btn.textContent = "Downloading…";
      }
    }

    showStatus(`Downloading · ${label}`, "loading", 0, 0);

    try {
      let blob;
      let mime;

      if (entry._offlineBlob) {
        blob = entry._offlineBlob;
        mime = entry._offlineMime || blob.type || "application/octet-stream";
        showStatus(`Downloading · ${label}`, "loading", 0, 100);
      } else {
        const url = entry.driveUrl
          ? (typeof window.statArchiveDriveStreamUrl === "function"
              ? window.statArchiveDriveStreamUrl(entry, "inline")
              : entry.driveUrl)
          : `${typeof WORKER_URL === "string" ? WORKER_URL : "https://stat-archive-api.lustats.workers.dev"}/file?id=${encodeURIComponent(entry.id)}`;

        const response = await nativeFetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "omit"
        });
        if (!response.ok) throw new Error(`Download failed (${response.status})`);

        blob = await readResponse(response, entry);
        mime = blob.type || response.headers.get("content-type") || "application/octet-stream";
      }

      const name = filenameOf(entry, mime);
      if (isAndroid()) await saveAndroid(blob, name, mime);
      else saveBrowser(blob, name);

      markComplete(entry, btn);
      showStatus("Download started successfully", "success", 2600, 100);

      try { window.incrementActivity?.("download"); } catch (_) {}
      return true;
    } catch (err) {
      console.error("Canonical Download failed:", err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
      showStatus(err?.message || "Download failed", "error", 4200, null);
      try { window.showError?.(err?.message || "Couldn't download that file."); } catch (_) {}
      return false;
    }
  }

  window.statArchiveCanonicalDownload = transfer;

  /* Preview toolbar and any older caller use window.downloadEntry. Keep one
     canonical implementation so desktop/mobile/APK all show the same status. */
  window.downloadEntry = transfer;
  try { downloadEntry = transfer; } catch (_) {}

  /* Wrap Offline save once. This fixes the missing desktop status without
     changing the existing IndexedDB/offline-library implementation. */
  const originalOfflineSave = window.saveEntryOffline;
  if (typeof originalOfflineSave === "function" && !originalOfflineSave.__saCanonicalStatusWrapped) {
    const wrappedOfflineSave = async function(entry, btn, ...rest) {
      const label = entry?.title || entry?.filename || "file";
      showStatus(`Saving offline · ${label}`, "loading", 0, 0);
      try {
        const result = await originalOfflineSave.call(this, entry, btn, ...rest);
        let saved = true;
        try {
          if (entry?.id != null && typeof window.getOfflineFile === "function") {
            const record = await window.getOfflineFile(String(entry.id));
            saved = !!record?.blob;
          }
        } catch (_) {}

        showStatus(
          saved ? "Saved for offline use" : "Offline save finished",
          saved ? "success" : "error",
          saved ? 2800 : 4200,
          saved ? 100 : null
        );
        return result;
      } catch (err) {
        showStatus(err?.message || "Could not save this file offline", "error", 4200, null);
        throw err;
      }
    };

    wrappedOfflineSave.__saCanonicalStatusWrapped = true;
    wrappedOfflineSave.__saOriginal = originalOfflineSave;
    window.saveEntryOffline = wrappedOfflineSave;
    try { saveEntryOffline = wrappedOfflineSave; } catch (_) {}
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const btn = target?.closest(".card .dl-btn,.card .download-btn");
    if (!btn) return;

    const card = btn.closest(".card");
    if (!card) return;

    let source = [];
    try { source = Array.isArray(entries) ? entries : []; } catch (_) {}
    const entry = source.find(item => String(item.id) === String(card.dataset.id));
    if (!entry) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    void transfer(entry, btn);
  }, true);
})();
