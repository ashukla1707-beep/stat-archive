/* Stat Archive — legacy Download compatibility shim.
   Progress UI is owned exclusively by download-progress-canonical.js.
   This file intentionally creates no floating/lower progress panel.

   It also keeps the Android-download version shown on the website in sync
   with version.json. version.json is requested with a versioned query string
   so an older service-worker cache entry cannot keep showing the previous APK
   version after the APK itself has already been updated. */
(() => {
  "use strict";

  if (window.__statArchiveDownloadOfflineRepairV7) return;
  window.__statArchiveDownloadOfflineRepairV7 = true;

  /* Remove a legacy panel if an older cached runtime created one before this
     compatibility shim loaded. */
  document.getElementById("statDownloadProgressPanel")?.remove();
  document.getElementById("statDownloadProgressPanelStyle")?.remove();

  /* Do not register another Download click handler here. The canonical runtime
     owns Download transfer, percentage updates, and the single status UI. */

  const FALLBACK_META = {
    versionName: "1.5.20",
    versionCode: 27,
    apkUrl: "https://raw.githubusercontent.com/ashukla1707-beep/statarchive-android/main/downloads/stat-archive.apk"
  };

  let latestMeta = { ...FALLBACK_META };
  let syncScheduled = false;

  function applyAndroidVersionMeta() {
    const version = String(latestMeta.versionName || FALLBACK_META.versionName);
    const apkUrl = String(latestMeta.apkUrl || FALLBACK_META.apkUrl);

    const dialogVersion = document.getElementById("statAndroidVersion");
    if (dialogVersion) dialogVersion.textContent = `v${version}`;

    const menuMeta = document.getElementById("menuAndroidAppMeta");
    if (menuMeta) menuMeta.textContent = `Official APK · v${version}`;

    const download = document.getElementById("statAndroidDownload");
    if (download) {
      download.href = apkUrl;
      download.setAttribute("download", "stat-archive.apk");
    }

    const bannerInstall = document.querySelector("#statAndroidAutoBanner .stat-android-auto-install");
    if (bannerInstall) bannerInstall.href = apkUrl;
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
    applyAndroidVersionMeta();
    try {
      const response = await fetch("./version.json?v=1.5.20", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || typeof data !== "object") return;

      latestMeta = {
        versionName: String(data.versionName || latestMeta.versionName || FALLBACK_META.versionName),
        versionCode: Number(data.versionCode || latestMeta.versionCode || FALLBACK_META.versionCode),
        apkUrl: String(data.apkUrl || latestMeta.apkUrl || FALLBACK_META.apkUrl)
      };
      applyAndroidVersionMeta();
    } catch (_) {
      /* The 1.5.20 fallback remains correct even if metadata is temporarily unavailable. */
    }
  }

  const start = () => {
    applyAndroidVersionMeta();
    refreshAndroidVersionMeta();

    /* The Android dialog/menu entry is created dynamically, so keep the label
       correct when those nodes appear after this script has already loaded. */
    new MutationObserver(scheduleSync).observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
