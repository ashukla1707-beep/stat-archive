/* Stat Archive — phone landscape hero guard v1
   Keep the APK/normal mobile hero in its mobile visual language after rotation.
   Desktop/laptop and browser Desktop-site mode keep their existing layouts. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_PHONE_LANDSCAPE_HERO_V1__) return;
  window.__STAT_ARCHIVE_PHONE_LANDSCAPE_HERO_V1__ = true;

  const ROOT_CLASS = "stat-phone-landscape";
  const STYLE_ID = "statArchivePhoneLandscapeHeroStyle";

  function isPhoneLandscape() {
    const touch = (navigator.maxTouchPoints || 0) > 0;
    const ua = String(navigator.userAgent || "");
    const appLike =
      /(?:;\s*wv\)|\bwv\b|Version\/4\.0)/i.test(ua) ||
      !!window.matchMedia?.("(display-mode: standalone)").matches ||
      !!window.matchMedia?.("(display-mode: fullscreen)").matches;
    const normalPhoneBrowser = /Android/i.test(ua) && /Mobile/i.test(ua);

    return touch &&
      window.innerWidth > 700 &&
      window.innerHeight <= 700 &&
      (appLike || normalPhoneBrowser);
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
html.${ROOT_CLASS} body .header{
  display:block !important;
  position:relative !important;
  width:auto !important;
  height:auto !important;
  min-height:0 !important;
  padding:22px 28px 26px !important;
  overflow:visible !important;
}

html.${ROOT_CLASS} body .header .hero-copy{
  position:relative !important;
  inset:auto !important;
  width:100% !important;
  max-width:none !important;
  min-width:0 !important;
  transform:none !important;
  z-index:4 !important;
}

html.${ROOT_CLASS} body .header .eyebrow{
  width:calc(100% - 64px) !important;
  max-width:100% !important;
  margin:0 0 12px !important;
  white-space:normal !important;
}

html.${ROOT_CLASS} body .header h1{
  margin:0 !important;
  max-width:calc(100% - 64px) !important;
  font-size:clamp(44px,7vw,68px) !important;
  line-height:.98 !important;
  letter-spacing:-.055em !important;
  white-space:nowrap !important;
}

html.${ROOT_CLASS} body .header .hero-line{
  display:flex !important;
  align-items:flex-start !important;
  width:100% !important;
  max-width:none !important;
  margin:16px 0 0 !important;
  gap:12px !important;
  transform:none !important;
  overflow:visible !important;
}

html.${ROOT_CLASS} body .header .hero-line > span{
  flex:0 0 34px !important;
  width:34px !important;
  margin-top:8px !important;
}

html.${ROOT_CLASS} body .header .hero-line .sub{
  display:block !important;
  position:static !important;
  width:auto !important;
  max-width:min(700px,calc(100% - 46px)) !important;
  height:auto !important;
  max-height:none !important;
  margin:0 !important;
  padding:0 !important;
  font-size:clamp(13px,2.2vw,17px) !important;
  line-height:1.55 !important;
  white-space:normal !important;
  overflow:visible !important;
}

html.${ROOT_CLASS} body .header .hero-sub-lead,
html.${ROOT_CLASS} body .header .hero-sub-tail{
  display:inline !important;
  position:static !important;
  white-space:normal !important;
  line-height:inherit !important;
}

html.${ROOT_CLASS} body .header .hero-probability{
  position:relative !important;
  inset:auto !important;
  width:100% !important;
  height:280px !important;
  max-width:none !important;
  margin:24px 0 0 !important;
  transform:none !important;
  overflow:hidden !important;
}

html.${ROOT_CLASS} body .header .hero-probability .probability-svg{
  display:block !important;
  position:absolute !important;
  left:18px !important;
  right:18px !important;
  top:34px !important;
  width:calc(100% - 36px) !important;
  height:225px !important;
  max-width:none !important;
  transform:none !important;
  visibility:visible !important;
  opacity:1 !important;
}

html.${ROOT_CLASS} body .header #statTouchDesktopGraph{
  display:none !important;
  visibility:hidden !important;
  opacity:0 !important;
}

html.${ROOT_CLASS} body .header .hero-probability .axis-mid{
  display:block !important;
  position:absolute !important;
  left:50% !important;
  right:auto !important;
  top:auto !important;
  bottom:7px !important;
  margin:0 !important;
  transform:translateX(-50%) !important;
  visibility:visible !important;
  opacity:1 !important;
}

html.${ROOT_CLASS} body .header .formula-chip,
html.${ROOT_CLASS} body .header .curve-note{
  display:none !important;
}

html.${ROOT_CLASS} body .header #mainMenuBtn.main-menu-btn{
  position:absolute !important;
  top:22px !important;
  right:24px !important;
  left:auto !important;
  bottom:auto !important;
  width:42px !important;
  min-width:42px !important;
  max-width:42px !important;
  height:42px !important;
  min-height:42px !important;
  max-height:42px !important;
  margin:0 !important;
  transform:none !important;
}

html.${ROOT_CLASS} body .header .hero-copy,
html.${ROOT_CLASS} body .header .hero-probability,
html.${ROOT_CLASS} body .header .probability-svg{
  transition:none !important;
}
`;
    document.head.appendChild(style);
  }

  function removeDesktopReplacement() {
    if (!isPhoneLandscape()) return;
    const replacement = document.getElementById("statTouchDesktopGraph");
    if (replacement) replacement.remove();

    const hero = document.querySelector(".hero-probability");
    hero?.querySelector(".probability-svg")?.style.removeProperty("display");
    hero?.querySelector(".axis-mid")?.style.removeProperty("display");
  }

  function sync() {
    const active = isPhoneLandscape();
    document.documentElement.classList.toggle(ROOT_CLASS, active);
    if (active) removeDesktopReplacement();
  }

  installStyle();
  sync();

  const observer = new MutationObserver(() => {
    if (!isPhoneLandscape()) return;
    removeDesktopReplacement();
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });

  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    sync();
    timer = window.setTimeout(sync, 80);
    window.setTimeout(sync, 220);
  }

  window.addEventListener("resize", schedule, { passive:true });
  window.addEventListener("orientationchange", schedule, { passive:true });
  window.visualViewport?.addEventListener("resize", schedule, { passive:true });
})();

/* Stat Archive — Android app integration v2 */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ANDROID_WEB_INTEGRATION_V2__) return;
  window.__STAT_ARCHIVE_ANDROID_WEB_INTEGRATION_V2__ = true;

  const FALLBACK_APK = "./downloads/stat-archive.apk";
  const VERSION_URL = "./version.json";
  const STYLE_ID = "statArchiveAndroidIntegrationStyle";
  let appMeta = {
    versionName: "1.5.19",
    versionCode: 26,
    apkUrl: FALLBACK_APK,
    message: "Install the Android app for a dedicated Stat Archive experience."
  };

  const androidIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.1h9.6c1.1 0 2 .9 2 2v7.2c0 .7-.6 1.3-1.3 1.3h-.8v2.1c0 .7-.5 1.3-1.2 1.3s-1.2-.6-1.2-1.3v-2.1H9.7v2.1c0 .7-.5 1.3-1.2 1.3s-1.2-.6-1.2-1.3v-2.1h-.8c-.7 0-1.3-.6-1.3-1.3v-7.2c0-1.1.9-2 2-2Z"></path><path d="M8.2 7.7 6.8 5.3M15.8 7.7l1.4-2.4M8 8c.3-2 1.9-3.4 4-3.4S15.7 6 16 8M9 11.4h.01M15 11.4h.01"></path></svg>`;

  function isAndroid() {
    return /Android/i.test(String(navigator.userAgent || ""));
  }

  function installStyles() {
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
.stat-android-section{padding-top:0!important;}
.stat-android-card{width:100%!important;min-height:68px!important;margin:0!important;padding:11px 13px!important;border:1px solid rgba(94,231,247,.18)!important;border-radius:17px!important;background:linear-gradient(135deg,rgba(94,231,247,.07),rgba(74,222,165,.035))!important;display:grid!important;grid-template-columns:40px minmax(0,1fr) 18px!important;align-items:center!important;justify-items:stretch!important;justify-content:stretch!important;gap:11px!important;text-align:left!important;box-shadow:none!important;}
.stat-android-card:hover{background:linear-gradient(135deg,rgba(94,231,247,.11),rgba(74,222,165,.055))!important;border-color:rgba(94,231,247,.31)!important;}
.stat-android-icon{width:38px;height:38px;display:grid;place-items:center;justify-self:start;border-radius:12px;background:rgba(74,222,165,.10);color:#64e8b3;}
.stat-android-icon svg{width:21px!important;height:21px!important;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;}
.stat-android-copy{min-width:0;display:flex!important;flex-direction:column;align-items:flex-start!important;justify-content:center;gap:2px;text-align:left!important;}
.stat-android-copy strong{font:700 13px/1.3 Inter,sans-serif;color:var(--text);text-align:left!important;}
.stat-android-copy small{font:500 10.5px/1.35 Inter,sans-serif;color:var(--muted);text-align:left!important;}
.stat-android-card .main-menu-arrow{color:var(--muted-2);font-size:22px;justify-self:end;}
body[data-theme='light'] .stat-android-card{background:linear-gradient(135deg,rgba(75,54,95,.055),rgba(40,130,100,.035))!important;border-color:rgba(75,54,95,.14)!important;}
body[data-theme='light'] .stat-android-icon{background:rgba(40,130,100,.08);color:#347f67;}
body[data-theme='light'] .stat-android-copy strong{color:#27302d;}body[data-theme='light'] .stat-android-copy small{color:#817d77;}

.stat-android-overlay{position:fixed;inset:0;z-index:10120;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,12,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility .18s ease;}
.stat-android-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto;}
.stat-android-dialog{width:min(470px,calc(100vw - 36px));max-height:min(700px,84dvh);overflow-y:auto;overscroll-behavior:contain;border:1px solid rgba(148,163,184,.20);border-radius:24px;padding:20px;background:#0d141e;color:#eef3f8;box-shadow:0 30px 90px rgba(0,0,0,.55);}
.stat-android-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:15px;}
.stat-android-title-row{display:flex;align-items:center;gap:12px;min-width:0;}.stat-android-app-icon{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,rgba(94,231,247,.14),rgba(74,222,165,.12));color:#72ead0;border:1px solid rgba(94,231,247,.17);}.stat-android-app-icon svg{width:26px!important;height:26px!important;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;}
.stat-android-title{min-width:0;}.stat-android-title h2{margin:0 0 4px;font:800 22px/1.12 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.035em;}.stat-android-title p{margin:0;color:#8491a2;font:500 11px/1.4 Inter,sans-serif;}
.stat-android-close{width:38px;height:38px;flex:0 0 38px;border:1px solid rgba(148,163,184,.18);border-radius:50%;background:#111a25;color:#eef3f8;font-size:21px;cursor:pointer;}
.stat-android-hero{padding:14px;border:1px solid rgba(94,231,247,.13);border-radius:16px;background:rgba(94,231,247,.035);}.stat-android-hero strong{display:block;margin-bottom:5px;font:750 14px/1.35 Inter,sans-serif;}.stat-android-hero p{margin:0;color:#91a0b1;font:500 11.5px/1.5 Inter,sans-serif;}
.stat-android-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:11px 0;}.stat-android-meta div{padding:9px 10px;border:1px solid rgba(148,163,184,.13);border-radius:12px;background:rgba(255,255,255,.018);}.stat-android-meta span{display:block;margin-bottom:4px;color:#728094;font:600 8.5px/1.2 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;}.stat-android-meta strong{font:700 11px/1.3 Inter,sans-serif;color:#eef3f8;}
.stat-android-features{display:grid;gap:7px;margin:12px 0 14px;}.stat-android-feature{display:flex;gap:9px;align-items:flex-start;color:#aab4c0;font:500 11px/1.42 Inter,sans-serif;}.stat-android-feature::before{content:'✓';flex:0 0 18px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:rgba(74,222,165,.10);color:#64e8b3;font:800 10px/1 Inter,sans-serif;}
.stat-android-download{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px;width:auto!important;min-width:150px!important;max-width:100%!important;min-height:46px!important;height:46px!important;padding:0 18px!important;margin:0 auto!important;border:1px solid rgba(94,231,247,.30);border-radius:12px;background:linear-gradient(135deg,rgba(94,231,247,.16),rgba(74,222,165,.11));color:#dffcff;text-decoration:none;font:800 12px/1 Inter,sans-serif;cursor:pointer;box-sizing:border-box;}
.stat-android-download svg{display:block!important;width:19px!important;height:19px!important;min-width:19px!important;max-width:19px!important;min-height:19px!important;max-height:19px!important;fill:none!important;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;}
.stat-android-download:hover{transform:translateY(-1px);filter:brightness(1.06);}.stat-android-download-wrap{display:flex;justify-content:center;}.stat-android-note{margin:9px 2px 0;color:#718094;font:500 9.6px/1.45 Inter,sans-serif;text-align:center;}
body[data-theme='light'] .stat-android-overlay{background:rgba(52,48,42,.34);}body[data-theme='light'] .stat-android-dialog{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 24px 70px rgba(58,53,42,.18);}body[data-theme='light'] .stat-android-title p,body[data-theme='light'] .stat-android-hero p,body[data-theme='light'] .stat-android-feature,body[data-theme='light'] .stat-android-note{color:#7b7771;}body[data-theme='light'] .stat-android-close{background:rgba(255,255,255,.8);color:#27302d;border-color:rgba(75,54,95,.14);}body[data-theme='light'] .stat-android-hero,body[data-theme='light'] .stat-android-meta div{background:rgba(255,255,255,.55);border-color:rgba(75,54,95,.11);}body[data-theme='light'] .stat-android-meta strong{color:#27302d;}body[data-theme='light'] .stat-android-download{color:#3d3150;border-color:rgba(75,54,95,.22);background:rgba(75,54,95,.08);}
@media(max-width:700px){.stat-android-card{min-height:63px!important;padding:9px 11px!important;grid-template-columns:36px minmax(0,1fr) 16px!important;gap:10px!important;}.stat-android-icon{width:34px;height:34px;border-radius:10px;}.stat-android-overlay{padding:14px!important;}.stat-android-dialog{width:min(440px,calc(100vw - 28px));max-height:82dvh;padding:16px 14px;border-radius:20px;}.stat-android-meta{grid-template-columns:1fr 1fr;}.stat-android-meta div:last-child{grid-column:1/-1;}.stat-android-title h2{font-size:20px;}.stat-android-download{min-width:148px!important;height:44px!important;min-height:44px!important;padding:0 16px!important;}}
`;
    document.head.appendChild(style);
  }

  function closeMainMenu() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    document.getElementById("mainSideMenu")?.classList.remove("is-open");
    document.getElementById("mainMenuBackdrop")?.classList.remove("is-open");
    document.getElementById("mainMenuBtn")?.setAttribute("aria-expanded", "false");
  }

  function openMainMenu() {
    try { window.statArchiveOpenMenu?.(); } catch (_) {}
    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");
    menu?.classList.add("is-open");
    backdrop?.classList.add("is-open");
    menu?.setAttribute("aria-hidden", "false");
    backdrop?.setAttribute("aria-hidden", "false");
    button?.setAttribute("aria-expanded", "true");
  }

  async function loadVersion() {
    try {
      const response = await fetch(VERSION_URL, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (data && typeof data === "object") {
        appMeta = {
          ...appMeta,
          versionName: String(data.versionName || appMeta.versionName),
          versionCode: Number(data.versionCode || appMeta.versionCode),
          apkUrl: String(data.apkUrl || appMeta.apkUrl),
          message: String(data.message || appMeta.message)
        };
      }
    } catch (_) {}
  }

  function ensureOverlay() {
    let overlay = document.getElementById("statAndroidAppOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "statAndroidAppOverlay";
    overlay.className = "stat-android-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section class="stat-android-dialog" role="dialog" aria-modal="true" aria-labelledby="statAndroidTitle">
        <div class="stat-android-head">
          <div class="stat-android-title-row">
            <span class="stat-android-app-icon" aria-hidden="true">${androidIcon}</span>
            <div class="stat-android-title"><h2 id="statAndroidTitle">Stat Archive for Android</h2><p id="statAndroidSubtitle">Official Android build</p></div>
          </div>
          <button type="button" class="stat-android-close" id="statAndroidClose" aria-label="Close">×</button>
        </div>
        <div class="stat-android-hero"><strong>Carry the archive like an app.</strong><p id="statAndroidMessage"></p></div>
        <div class="stat-android-meta">
          <div><span>Version</span><strong id="statAndroidVersion">—</strong></div>
          <div><span>Platform</span><strong>Android</strong></div>
          <div><span>APK size</span><strong>~4.5 MB</strong></div>
        </div>
        <div class="stat-android-features">
          <div class="stat-android-feature">Dedicated Stat Archive app experience on Android.</div>
          <div class="stat-android-feature">Uses the same archive and study resources as the website.</div>
          <div class="stat-android-feature">The download button always follows the current APK URL from version.json.</div>
        </div>
        <div class="stat-android-download-wrap"><a class="stat-android-download" id="statAndroidDownload" href="${FALLBACK_APK}" download="stat-archive.apk">${androidIcon}<span>Download APK</span></a></div>
        <p class="stat-android-note">Android may ask you to allow installation from your browser for APK files downloaded outside Google Play.</p>
      </section>`;
    document.body.appendChild(overlay);

    const close = () => closeOverlay(true);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector("#statAndroidClose")?.addEventListener("click", close);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
    return overlay;
  }

  function syncOverlayMeta(overlay) {
    const version = overlay.querySelector("#statAndroidVersion");
    const message = overlay.querySelector("#statAndroidMessage");
    const link = overlay.querySelector("#statAndroidDownload");
    const subtitle = overlay.querySelector("#statAndroidSubtitle");
    if (version) version.textContent = `v${appMeta.versionName}`;
    if (message) message.textContent = appMeta.message;
    if (subtitle) subtitle.textContent = isAndroid() ? "Ready to install on this Android device" : "Official Android build";
    if (link) {
      link.href = appMeta.apkUrl || FALLBACK_APK;
      link.setAttribute("download", "stat-archive.apk");
    }
  }

  async function openOverlay(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    closeMainMenu();
    const overlay = ensureOverlay();
    syncOverlayMeta(overlay);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    await loadVersion();
    syncOverlayMeta(overlay);
    requestAnimationFrame(() => overlay.querySelector("#statAndroidClose")?.focus());
  }

  function closeOverlay(returnToMenu = false) {
    const overlay = document.getElementById("statAndroidAppOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (returnToMenu) requestAnimationFrame(openMainMenu);
  }

  function installMenuEntry() {
    if (document.getElementById("menuAndroidAppBtn")) return true;
    const menu = document.getElementById("mainSideMenu");
    if (!menu) return false;

    const supportSection = document.getElementById("statSupportSection");
    const feedbackSection = document.getElementById("statFeedbackSection");
    const footer = menu.querySelector(".main-menu-footer");
    const section = document.createElement("section");
    section.id = "statAndroidSection";
    section.className = "main-menu-section stat-android-section";
    section.innerHTML = `
      <div class="main-menu-label">Android App</div>
      <button type="button" class="main-menu-action stat-android-card" id="menuAndroidAppBtn">
        <span class="stat-android-icon" aria-hidden="true">${androidIcon}</span>
        <span class="stat-android-copy"><strong>Install Android App</strong><small id="menuAndroidAppMeta">Official APK · checking version…</small></span>
        <span class="main-menu-arrow" aria-hidden="true">›</span>
      </button>`;

    if (supportSection?.parentNode === menu) menu.insertBefore(section, supportSection);
    else if (feedbackSection?.parentNode === menu) menu.insertBefore(section, feedbackSection);
    else if (footer?.parentNode === menu) menu.insertBefore(section, footer);
    else menu.appendChild(section);

    section.querySelector("#menuAndroidAppBtn")?.addEventListener("click", openOverlay);
    loadVersion().then(() => {
      const meta = document.getElementById("menuAndroidAppMeta");
      if (meta) meta.textContent = `Official APK · v${appMeta.versionName}`;
    });
    return true;
  }

  function init() {
    installStyles();
    ensureOverlay();
    if (installMenuEntry()) return;
    const observer = new MutationObserver(() => {
      if (installMenuEntry()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }

  window.openStatArchiveAndroidApp = openOverlay;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();