/* Stat Archive — legacy Download compatibility shim.
   Progress UI is owned exclusively by download-progress-canonical.js.
   This file intentionally creates no floating/lower progress panel.

   Android release metadata has one source of truth:
   statarchive-android/main/downloads/version.json.
   Every official Android build rewrites that file automatically, so the
   website never needs a manual version-number edit again. */
(() => {
  "use strict";

  if (window.__statArchiveDownloadOfflineRepairV8) return;
  window.__statArchiveDownloadOfflineRepairV8 = true;

  document.getElementById("statDownloadProgressPanel")?.remove();
  document.getElementById("statDownloadProgressPanelStyle")?.remove();

  const RELEASE_META_URL =
    "https://raw.githubusercontent.com/ashukla1707-beep/statarchive-android/main/downloads/version.json";

  const FALLBACK_META = {
    versionName: "1.5.25",
    versionCode: 32,
    apkUrl: "https://raw.githubusercontent.com/ashukla1707-beep/statarchive-android/main/downloads/stat-archive.apk",
    apkSizeBytes: 816652
  };

  let latestMeta = { ...FALLBACK_META };
  let syncScheduled = false;
  let refreshPromise = null;

  function formatBytes(bytes) {
    const n = Number(bytes);
    return Number.isFinite(n) && n > 0 ? `${(n / 1000000).toFixed(2)} MB` : null;
  }

  function setTextIfDifferent(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function applyAndroidVersionMeta() {
    const version = String(latestMeta.versionName || FALLBACK_META.versionName);
    const apkUrl = String(latestMeta.apkUrl || FALLBACK_META.apkUrl);
    const sizeText = formatBytes(latestMeta.apkSizeBytes || FALLBACK_META.apkSizeBytes);

    setTextIfDifferent(document.getElementById("statAndroidVersion"), `v${version}`);
    setTextIfDifferent(document.getElementById("menuAndroidAppMeta"), `Official APK · v${version}`);

    if (sizeText) {
      document.querySelectorAll("[data-stat-apk-size]").forEach(el => {
        setTextIfDifferent(el, sizeText);
      });
    }

    document.querySelectorAll("#statAndroidDownload, #statAndroidAutoBanner .stat-android-auto-install").forEach(link => {
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.href !== apkUrl) link.href = apkUrl;
      if (link.id === "statAndroidDownload") link.setAttribute("download", "stat-archive.apk");
    });

    window.__STAT_ARCHIVE_RELEASE_META__ = { ...latestMeta };
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      applyAndroidVersionMeta();
    });
  }

  async function refreshAndroidVersionMeta() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      applyAndroidVersionMeta();
      try {
        const response = await fetch(`${RELEASE_META_URL}?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!data || typeof data !== "object") return;

        latestMeta = {
          versionName: String(data.versionName || latestMeta.versionName || FALLBACK_META.versionName),
          versionCode: Number(data.versionCode || latestMeta.versionCode || FALLBACK_META.versionCode),
          apkUrl: String(data.apkUrl || latestMeta.apkUrl || FALLBACK_META.apkUrl),
          apkSizeBytes: Number(data.apkSizeBytes || latestMeta.apkSizeBytes || FALLBACK_META.apkSizeBytes)
        };
      } catch (_) {
        /* Keep the latest known official fallback if GitHub is temporarily unreachable. */
      } finally {
        applyAndroidVersionMeta();
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  const start = () => {
    applyAndroidVersionMeta();
    refreshAndroidVersionMeta();

    /* Older cached Android-card runtimes can still create/modify these nodes.
       Re-apply the canonical metadata whenever that happens. */
    new MutationObserver(scheduleSync).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href"]
    });

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("#menuAndroidAppBtn, #statAndroidDownload")) return;
      setTimeout(applyAndroidVersionMeta, 0);
      setTimeout(refreshAndroidVersionMeta, 60);
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshAndroidVersionMeta();
    });
    window.addEventListener("focus", refreshAndroidVersionMeta, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
