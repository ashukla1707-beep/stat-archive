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
html.${ROOT_CLASS} body .header{display:block!important;position:relative!important;width:auto!important;height:auto!important;min-height:0!important;padding:22px 28px 26px!important;overflow:visible!important;}
html.${ROOT_CLASS} body .header .hero-copy{position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;min-width:0!important;transform:none!important;z-index:4!important;}
html.${ROOT_CLASS} body .header .eyebrow{width:calc(100% - 64px)!important;max-width:100%!important;margin:0 0 12px!important;white-space:normal!important;}
html.${ROOT_CLASS} body .header h1{margin:0!important;max-width:calc(100% - 64px)!important;font-size:clamp(44px,7vw,68px)!important;line-height:.98!important;letter-spacing:-.055em!important;white-space:nowrap!important;}
html.${ROOT_CLASS} body .header .hero-line{display:flex!important;align-items:flex-start!important;width:100%!important;max-width:none!important;margin:16px 0 0!important;gap:12px!important;transform:none!important;overflow:visible!important;}
html.${ROOT_CLASS} body .header .hero-line>span{flex:0 0 34px!important;width:34px!important;margin-top:8px!important;}
html.${ROOT_CLASS} body .header .hero-line .sub{display:block!important;position:static!important;width:auto!important;max-width:min(700px,calc(100% - 46px))!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;font-size:clamp(13px,2.2vw,17px)!important;line-height:1.55!important;white-space:normal!important;overflow:visible!important;}
html.${ROOT_CLASS} body .header .hero-sub-lead,html.${ROOT_CLASS} body .header .hero-sub-tail{display:inline!important;position:static!important;white-space:normal!important;line-height:inherit!important;}
html.${ROOT_CLASS} body .header .hero-probability{position:relative!important;inset:auto!important;width:100%!important;height:280px!important;max-width:none!important;margin:24px 0 0!important;transform:none!important;overflow:hidden!important;}
html.${ROOT_CLASS} body .header .hero-probability .probability-svg{display:block!important;position:absolute!important;left:18px!important;right:18px!important;top:34px!important;width:calc(100% - 36px)!important;height:225px!important;max-width:none!important;transform:none!important;visibility:visible!important;opacity:1!important;}
html.${ROOT_CLASS} body .header #statTouchDesktopGraph{display:none!important;visibility:hidden!important;opacity:0!important;}
html.${ROOT_CLASS} body .header .hero-probability .axis-mid{display:block!important;position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:7px!important;margin:0!important;transform:translateX(-50%)!important;visibility:visible!important;opacity:1!important;}
html.${ROOT_CLASS} body .header .formula-chip,html.${ROOT_CLASS} body .header .curve-note{display:none!important;}
html.${ROOT_CLASS} body .header #mainMenuBtn.main-menu-btn{position:absolute!important;top:22px!important;right:24px!important;left:auto!important;bottom:auto!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:0!important;transform:none!important;}
html.${ROOT_CLASS} body .header .hero-copy,html.${ROOT_CLASS} body .header .hero-probability,html.${ROOT_CLASS} body .header .probability-svg{transition:none!important;}
`;
    document.head.appendChild(style);
  }

  function removeDesktopReplacement() {
    if (!isPhoneLandscape()) return;
    document.getElementById("statTouchDesktopGraph")?.remove();
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
    if (isPhoneLandscape()) removeDesktopReplacement();
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

/* Stat Archive — Android app integration v6
   The Android App section is anchored immediately after Library in browsers,
   and is not shown inside the installed Android APK/WebView. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_ANDROID_WEB_INTEGRATION_V6__) return;
  window.__STAT_ARCHIVE_ANDROID_WEB_INTEGRATION_V6__ = true;

  const FALLBACK_APK = "./downloads/stat-archive.apk";
  const VERSION_URL = "./version.json";
  const STYLE_ID = "statArchiveAndroidIntegrationStyle";
  let appMeta = { versionName:"1.5.19", versionCode:26, apkUrl:FALLBACK_APK, apkSizeBytes:null };

  const androidIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.1h9.6c1.1 0 2 .9 2 2v7.2c0 .7-.6 1.3-1.3 1.3h-.8v2.1c0 .7-.5 1.3-1.2 1.3s-1.2-.6-1.2-1.3v-2.1H9.7v2.1c0 .7-.5 1.3-1.2 1.3s-1.2-.6-1.2-1.3v-2.1h-.8c-.7 0-1.3-.6-1.3-1.3v-7.2c0-1.1.9-2 2-2Z"></path><path d="M8.2 7.7 6.8 5.3M15.8 7.7l1.4-2.4M8 8c.3-2 1.9-3.4 4-3.4S15.7 6 16 8M9 11.4h.01M15 11.4h.01"></path></svg>`;

  function isAndroid(){ return /Android/i.test(String(navigator.userAgent || "")); }
  function isInstalledApkRuntime(){
    const ua=String(navigator.userAgent||"");
    return /Android/i.test(ua) && /(?:;\s*wv\)|\bwv\b|Version\/4\.0)/i.test(ua);
  }
  function formatBytes(bytes){ const n=Number(bytes); return Number.isFinite(n)&&n>0 ? `${(n/1000000).toFixed(2)} MB` : "—"; }

  async function resolveApkSizeBytes(url){
    const target=String(url||"").trim();
    if(!target) return null;
    try{
      const raw=new URL(target,location.href);
      const match=raw.hostname==="raw.githubusercontent.com" ? raw.pathname.match(/^\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/) : null;
      if(match){
        const [,owner,repo,ref,path]=match;
        const apiUrl=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`;
        const response=await fetch(apiUrl,{cache:"no-store",headers:{Accept:"application/vnd.github+json"}});
        if(response.ok){ const data=await response.json(); const size=Number(data?.size); if(Number.isFinite(size)&&size>0) return size; }
      }
    }catch(_){}
    try{
      const response=await fetch(target,{method:"HEAD",cache:"no-store"});
      const size=Number(response.headers.get("content-length"));
      if(response.ok&&Number.isFinite(size)&&size>0) return size;
    }catch(_){}
    return null;
  }

  function installStyles(){
    document.getElementById(STYLE_ID)?.remove();
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
.stat-android-section{padding-top:0!important;}
html body #mainSideMenu #menuAndroidAppBtn.stat-android-card{width:100%!important;min-height:64px!important;margin:0!important;padding:10px 13px!important;border:1px solid rgba(148,163,184,.14)!important;border-radius:17px!important;background:rgba(255,255,255,.018)!important;display:grid!important;grid-template-columns:38px minmax(0,1fr) 18px!important;align-items:center!important;justify-items:stretch!important;justify-content:stretch!important;gap:11px!important;text-align:left!important;box-shadow:none!important;transform:none!important;}
html body #mainSideMenu #menuAndroidAppBtn.stat-android-card:hover{background:rgba(94,231,247,.045)!important;border-color:rgba(94,231,247,.24)!important;}
body[data-theme='light'] #mainSideMenu #menuAndroidAppBtn.stat-android-card:hover{background:rgba(75,54,95,.055)!important;border-color:rgba(75,54,95,.20)!important;}
html body #mainSideMenu #menuAndroidAppBtn .stat-android-icon{grid-column:1!important;width:36px!important;height:36px!important;margin:0!important;display:grid!important;place-items:center!important;justify-self:start!important;border-radius:11px;background:rgba(74,222,165,.10);color:#64e8b3;}
html body #mainSideMenu #menuAndroidAppBtn .stat-android-icon svg{width:18px!important;height:18px!important;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
html body #mainSideMenu #menuAndroidAppBtn .stat-android-copy{grid-column:2!important;min-width:0!important;margin:0!important;padding:0!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:2px!important;text-align:left!important;}
html body #mainSideMenu #menuAndroidAppBtn .stat-android-copy strong{margin:0!important;padding:0!important;color:var(--text);font:700 13px/1.3 Inter,sans-serif;text-align:left!important;}
html body #mainSideMenu #menuAndroidAppBtn .stat-android-copy small{margin:0!important;padding:0!important;color:var(--muted);font:500 10.5px/1.35 Inter,sans-serif;text-align:left!important;}
html body #mainSideMenu #menuAndroidAppBtn .main-menu-arrow{grid-column:3!important;margin:0!important;color:var(--muted-2);font-size:22px;justify-self:end!important;}
body[data-theme='light'] #menuAndroidAppBtn.stat-android-card{background:rgba(255,255,255,.52)!important;border-color:rgba(75,54,95,.12)!important;}
body[data-theme='light'] #menuAndroidAppBtn .stat-android-icon{background:rgba(40,130,100,.08);color:#347f67;}
.stat-android-auto-banner{position:fixed;z-index:10110;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;width:min(520px,calc(100vw - 20px));min-height:58px;padding:8px 9px 8px 10px;display:grid;grid-template-columns:36px minmax(0,1fr) auto 30px;align-items:center;gap:9px;border:1px solid rgba(148,163,184,.20);border-radius:16px;background:rgba(13,20,30,.96);color:#eef3f8;box-shadow:0 12px 34px rgba(0,0,0,.28);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;transform:translate(-50%,-12px);pointer-events:none;transition:opacity .18s ease,transform .18s ease;}
.stat-android-auto-banner.is-visible{opacity:1;transform:translate(-50%,0);pointer-events:auto;}
.stat-android-auto-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:rgba(74,222,165,.10);color:#64e8b3;}.stat-android-auto-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
.stat-android-auto-copy{min-width:0;display:flex;flex-direction:column;gap:2px;}.stat-android-auto-copy strong{font:700 12px/1.25 Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.stat-android-auto-copy small{color:#8d9aaa;font:500 10px/1.25 Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.stat-android-auto-install{min-width:62px;height:34px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(94,231,247,.28);border-radius:10px;background:rgba(94,231,247,.10);color:#dffcff;text-decoration:none;font:800 10.5px/1 Inter,sans-serif;-webkit-tap-highlight-color:transparent;}
.stat-android-auto-close{width:30px;height:30px;border:0;background:transparent;color:#8793a3;font-size:20px;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none;box-shadow:none;}.stat-android-auto-close:hover,.stat-android-auto-close:active,.stat-android-auto-close:focus,.stat-android-auto-close:focus-visible{background:transparent!important;color:#8793a3!important;outline:none!important;box-shadow:none!important;transform:none!important;}
body[data-theme='light'] .stat-android-auto-banner{background:rgba(251,250,247,.97);color:#27302d;border-color:rgba(75,54,95,.14);box-shadow:0 12px 30px rgba(72,60,48,.16);}body[data-theme='light'] .stat-android-auto-copy small{color:#7b7771;}body[data-theme='light'] .stat-android-auto-install{color:#3d3150;border-color:rgba(75,54,95,.20);background:rgba(75,54,95,.07);}body[data-theme='light'] .stat-android-auto-close{color:#77716d;}
@media(max-width:520px){.stat-android-auto-banner{top:calc(env(safe-area-inset-top,0px) + 8px);width:calc(100vw - 16px);grid-template-columns:34px minmax(0,1fr) auto 28px;gap:7px;padding:7px 7px 7px 9px;border-radius:14px;}.stat-android-auto-install{min-width:58px;height:32px;padding:0 10px;}.stat-android-auto-close{width:28px;height:28px;}}
.stat-android-overlay{position:fixed;inset:0;z-index:10120;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,12,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility .18s ease;}
.stat-android-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto;}
.stat-android-dialog{width:min(470px,calc(100vw - 36px));max-height:min(650px,84dvh);overflow-y:auto;overscroll-behavior:contain;border:1px solid rgba(148,163,184,.20);border-radius:24px;padding:20px;background:#0d141e;color:#eef3f8;box-shadow:0 30px 90px rgba(0,0,0,.55);}
.stat-android-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;}.stat-android-title-row{display:flex;align-items:center;gap:12px;min-width:0;}.stat-android-app-icon{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,rgba(94,231,247,.14),rgba(74,222,165,.12));color:#72ead0;border:1px solid rgba(94,231,247,.17);}.stat-android-app-icon svg{width:26px!important;height:26px!important;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;}.stat-android-title{min-width:0;}.stat-android-title h2{margin:0 0 4px;font:800 22px/1.12 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.035em;}.stat-android-title p{margin:0;color:#8491a2;font:500 11px/1.4 Inter,sans-serif;}.stat-android-close{width:38px;height:38px;flex:0 0 38px;border:1px solid rgba(148,163,184,.18);border-radius:50%;background:#111a25;color:#eef3f8;font-size:21px;cursor:pointer;-webkit-tap-highlight-color:transparent!important;-webkit-touch-callout:none!important;outline:none!important;box-shadow:none!important;filter:none!important;transition:none!important;user-select:none!important;}
.stat-android-close:hover,.stat-android-close:active,.stat-android-close:focus,.stat-android-close:focus-visible{background:#111a25!important;color:#eef3f8!important;border-color:rgba(148,163,184,.18)!important;outline:none!important;box-shadow:none!important;filter:none!important;transform:none!important;}
.stat-android-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 13px;}.stat-android-meta div{padding:10px;border:1px solid rgba(148,163,184,.13);border-radius:12px;background:rgba(255,255,255,.018);}.stat-android-meta span{display:block;margin-bottom:4px;color:#728094;font:600 8.5px/1.2 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;}.stat-android-meta strong{font:700 11px/1.3 Inter,sans-serif;color:#eef3f8;}.stat-android-features{display:grid;gap:8px;margin:0 0 15px;}.stat-android-feature{display:flex;gap:9px;align-items:flex-start;color:#aab4c0;font:500 11px/1.42 Inter,sans-serif;}.stat-android-feature::before{content:'✓';flex:0 0 18px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:rgba(74,222,165,.10);color:#64e8b3;font:800 10px/1 Inter,sans-serif;}.stat-android-download-wrap{display:flex;justify-content:center;}.stat-android-download{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px;width:auto!important;min-width:150px!important;max-width:100%!important;height:46px!important;padding:0 18px!important;margin:0 auto!important;border:1px solid rgba(94,231,247,.30);border-radius:12px;background:linear-gradient(135deg,rgba(94,231,247,.16),rgba(74,222,165,.11));color:#dffcff;text-decoration:none;font:800 12px/1 Inter,sans-serif;cursor:pointer;box-sizing:border-box;}.stat-android-download svg{display:block!important;width:19px!important;height:19px!important;min-width:19px!important;max-width:19px!important;min-height:19px!important;max-height:19px!important;fill:none!important;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;}.stat-android-note{margin:10px 2px 0;color:#718094;font:500 9.6px/1.45 Inter,sans-serif;text-align:center;}
body[data-theme='light'] .stat-android-overlay{background:rgba(52,48,42,.34);}body[data-theme='light'] .stat-android-dialog{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);}body[data-theme='light'] .stat-android-title p,body[data-theme='light'] .stat-android-feature,body[data-theme='light'] .stat-android-note{color:#7b7771;}body[data-theme='light'] .stat-android-close,body[data-theme='light'] .stat-android-close:hover,body[data-theme='light'] .stat-android-close:active,body[data-theme='light'] .stat-android-close:focus,body[data-theme='light'] .stat-android-close:focus-visible{background:rgba(255,255,255,.8)!important;color:#27302d!important;border-color:rgba(75,54,95,.14)!important;outline:none!important;box-shadow:none!important;filter:none!important;transform:none!important;}body[data-theme='light'] .stat-android-meta div{background:rgba(255,255,255,.55);border-color:rgba(75,54,95,.11);}body[data-theme='light'] .stat-android-meta strong{color:#27302d;}body[data-theme='light'] .stat-android-download{color:#3d3150;border-color:rgba(75,54,95,.22);background:rgba(75,54,95,.08);}
@media(max-width:700px){html body #mainSideMenu #menuAndroidAppBtn.stat-android-card{min-height:61px!important;padding:9px 11px!important;grid-template-columns:36px minmax(0,1fr) 16px!important;gap:10px!important;}html body #mainSideMenu #menuAndroidAppBtn .stat-android-icon{width:34px!important;height:34px!important;border-radius:10px;}.stat-android-overlay{padding:14px!important;}.stat-android-dialog{width:min(440px,calc(100vw - 28px));max-height:80dvh;padding:16px 14px;border-radius:20px;}.stat-android-meta{grid-template-columns:1fr 1fr;}.stat-android-meta div:last-child{grid-column:1/-1;}.stat-android-title h2{font-size:20px;}.stat-android-download{height:44px!important;padding:0 16px!important;}}
`;
    document.head.appendChild(style);
  }

  function closeMainMenu(){
    try{ window.statArchiveCloseMenu?.(); }catch(_){}
    document.getElementById("mainSideMenu")?.classList.remove("is-open");
    document.getElementById("mainMenuBackdrop")?.classList.remove("is-open");
    document.getElementById("mainMenuBtn")?.setAttribute("aria-expanded","false");
  }

  function openMainMenu(){
    try{ window.statArchiveOpenMenu?.(); }catch(_){}
    const menu=document.getElementById("mainSideMenu");
    const backdrop=document.getElementById("mainMenuBackdrop");
    const button=document.getElementById("mainMenuBtn");
    menu?.classList.add("is-open"); backdrop?.classList.add("is-open");
    menu?.setAttribute("aria-hidden","false"); backdrop?.setAttribute("aria-hidden","false"); button?.setAttribute("aria-expanded","true");
  }

  async function loadVersion(){
    try{
      const response=await fetch(VERSION_URL,{cache:"no-store"});
      if(!response.ok) return;
      const data=await response.json();
      if(data&&typeof data==="object") appMeta={...appMeta,versionName:String(data.versionName||appMeta.versionName),versionCode:Number(data.versionCode||appMeta.versionCode),apkUrl:String(data.apkUrl||appMeta.apkUrl)};
    }catch(_){}
  }

  async function refreshApkSize(){
    const bytes=await resolveApkSizeBytes(appMeta.apkUrl||FALLBACK_APK);
    if(bytes) appMeta.apkSizeBytes=bytes;
    document.querySelectorAll("[data-stat-apk-size]").forEach(el=>{ el.textContent=formatBytes(appMeta.apkSizeBytes); });
  }

  function ensureOverlay(){
    let overlay=document.getElementById("statAndroidAppOverlay");
    if(overlay) return overlay;
    overlay=document.createElement("div");
    overlay.id="statAndroidAppOverlay";
    overlay.className="stat-android-overlay";
    overlay.setAttribute("aria-hidden","true");
    overlay.innerHTML=`
      <section class="stat-android-dialog" role="dialog" aria-modal="true" aria-labelledby="statAndroidTitle">
        <div class="stat-android-head"><div class="stat-android-title-row"><span class="stat-android-app-icon" aria-hidden="true">${androidIcon}</span><div class="stat-android-title"><h2 id="statAndroidTitle">Stat Archive for Android</h2><p id="statAndroidSubtitle">Official Android build</p></div></div><button type="button" class="stat-android-close" id="statAndroidClose" aria-label="Close">×</button></div>
        <div class="stat-android-meta"><div><span>Version</span><strong id="statAndroidVersion">—</strong></div><div><span>Platform</span><strong>Android</strong></div><div><span>APK size</span><strong data-stat-apk-size>Checking…</strong></div></div>
        <div class="stat-android-features"><div class="stat-android-feature">Dedicated Stat Archive app experience on Android.</div><div class="stat-android-feature">Uses the same archive and study resources as the website.</div><div class="stat-android-feature">Download the current official Android APK directly.</div></div>
        <div class="stat-android-download-wrap"><a class="stat-android-download" id="statAndroidDownload" href="${FALLBACK_APK}" download="stat-archive.apk">${androidIcon}<span>Download APK</span></a></div>
        <p class="stat-android-note">Android may ask you to allow installation from your browser for APK files downloaded outside Google Play.</p>
      </section>`;
    document.body.appendChild(overlay);
    const close=()=>{ overlay.querySelector("#statAndroidClose")?.blur(); closeOverlay(true); };
    overlay.addEventListener("click",event=>{ if(event.target===overlay) close(); });
    overlay.querySelector("#statAndroidClose")?.addEventListener("click",close);
    document.addEventListener("keydown",event=>{ if(event.key==="Escape"&&overlay.classList.contains("is-open")) close(); });
    return overlay;
  }

  function syncOverlayMeta(overlay){
    const version=overlay.querySelector("#statAndroidVersion");
    const link=overlay.querySelector("#statAndroidDownload");
    const subtitle=overlay.querySelector("#statAndroidSubtitle");
    const size=overlay.querySelector("[data-stat-apk-size]");
    if(version) version.textContent=`v${appMeta.versionName}`;
    if(subtitle) subtitle.textContent=isAndroid()?"Ready to install on this Android device":"Official Android build";
    if(size) size.textContent=appMeta.apkSizeBytes?formatBytes(appMeta.apkSizeBytes):"Checking…";
    if(link){ link.href=appMeta.apkUrl||FALLBACK_APK; link.setAttribute("download","stat-archive.apk"); }
  }

  async function openOverlay(event){
    if(isInstalledApkRuntime()) return;
    event?.preventDefault?.(); event?.stopPropagation?.(); closeMainMenu();
    const overlay=ensureOverlay(); syncOverlayMeta(overlay); overlay.classList.add("is-open"); overlay.setAttribute("aria-hidden","false"); document.body.classList.add("no-scroll");
    await loadVersion(); syncOverlayMeta(overlay); await refreshApkSize(); requestAnimationFrame(()=>overlay.querySelector("#statAndroidClose")?.focus());
  }

  function closeOverlay(returnToMenu=false){
    const overlay=document.getElementById("statAndroidAppOverlay");
    if(!overlay) return;
    overlay.classList.remove("is-open"); overlay.setAttribute("aria-hidden","true"); document.body.classList.remove("no-scroll");
    if(returnToMenu) requestAnimationFrame(openMainMenu);
  }

  function placeAndroidSection(section){
    const menu=document.getElementById("mainSideMenu");
    if(!menu||!section) return false;

    const libraryBtn=document.getElementById("menuOfflineLibraryBtn");
    const librarySection=libraryBtn?.closest(".main-menu-section");
    const scrollBody=menu.querySelector(":scope > .stat-menu-scroll-body");
    const parent=librarySection?.parentElement || scrollBody || menu;

    if(librarySection && librarySection.parentElement===parent){
      if(librarySection.nextElementSibling!==section) librarySection.insertAdjacentElement("afterend",section);
      return true;
    }

    const supportSection=document.getElementById("statSupportSection");
    if(supportSection?.parentElement===parent){ parent.insertBefore(section,supportSection); return true; }
    parent.appendChild(section);
    return true;
  }

  function installMenuEntry(){
    if(isInstalledApkRuntime()){
      document.getElementById("statAndroidSection")?.remove();
      document.getElementById("statAndroidAppOverlay")?.remove();
      return true;
    }

    let section=document.getElementById("statAndroidSection");
    if(section){ placeAndroidSection(section); return true; }

    const menu=document.getElementById("mainSideMenu");
    if(!menu) return false;

    section=document.createElement("section");
    section.id="statAndroidSection";
    section.className="main-menu-section stat-android-section";
    section.innerHTML=`<div class="main-menu-label">Android App</div><button type="button" class="main-menu-action stat-android-card" id="menuAndroidAppBtn"><span class="stat-android-icon" aria-hidden="true">${androidIcon}</span><span class="stat-android-copy"><strong>Install Android App</strong><small id="menuAndroidAppMeta">Official APK · checking version…</small></span><span class="main-menu-arrow" aria-hidden="true">›</span></button>`;

    placeAndroidSection(section);
    section.querySelector("#menuAndroidAppBtn")?.addEventListener("click",openOverlay);
    loadVersion().then(()=>{ const meta=document.getElementById("menuAndroidAppMeta"); if(meta) meta.textContent=`Official APK · v${appMeta.versionName}`; refreshApkSize(); });
    return true;
  }

  function enforceMenuOrder(){
    if(isInstalledApkRuntime()){
      document.getElementById("statAndroidSection")?.remove();
      return;
    }
    const section=document.getElementById("statAndroidSection");
    if(section) placeAndroidSection(section);
  }

  function ensureAndroidAutoBanner(){
  let banner=document.getElementById("statAndroidAutoBanner");
  if(banner) return banner;
  banner=document.createElement("div");
  banner.id="statAndroidAutoBanner";
  banner.className="stat-android-auto-banner";
  banner.setAttribute("role","status");
  banner.innerHTML=`<span class="stat-android-auto-icon" aria-hidden="true">${androidIcon}</span><span class="stat-android-auto-copy"><strong>Get Stat Archive app</strong><small>Install the Android APK</small></span><a class="stat-android-auto-install" href="${appMeta.apkUrl||FALLBACK_APK}" download="stat-archive.apk">Install</a><button type="button" class="stat-android-auto-close" aria-label="Dismiss">×</button>`;
  document.body.appendChild(banner);
  banner.querySelector(".stat-android-auto-close")?.addEventListener("click",()=>banner.remove());
  banner.querySelector(".stat-android-auto-install")?.addEventListener("click",()=>{
    banner.classList.remove("is-visible");
    window.setTimeout(()=>banner.remove(),180);
  });
  return banner;
}

function scheduleAndroidAutoSuggestion(){
  if(!isAndroid() || isInstalledApkRuntime()) return;
  const key="statArchiveAndroidAutoPromptShown";
  try{
    if(sessionStorage.getItem(key)==="1") return;
    sessionStorage.setItem(key,"1");
  }catch(_){}
  window.setTimeout(async()=>{
    if(isInstalledApkRuntime() || document.visibilityState!=="visible") return;
    const blockingOverlay=document.querySelector(".is-open[role='dialog'], .manual-chooser-overlay.is-open, #offlineLibraryOverlay.is-open, #statLocalFeedbackOverlay.is-open");
    if(blockingOverlay) return;
    await loadVersion();
    const banner=ensureAndroidAutoBanner();
    const install=banner.querySelector(".stat-android-auto-install");
    if(install) install.href=appMeta.apkUrl||FALLBACK_APK;
    requestAnimationFrame(()=>banner.classList.add("is-visible"));
  },1200);
}

  function init(){
    installStyles();
    if(isInstalledApkRuntime()){
      document.getElementById("statAndroidSection")?.remove();
      document.getElementById("statAndroidAppOverlay")?.remove();
      return;
    }
    ensureOverlay(); installMenuEntry(); scheduleAndroidAutoSuggestion();
    const menu=document.getElementById("mainSideMenu");
    if(menu && menu.dataset.statAndroidOrderObserver!=="1"){
      menu.dataset.statAndroidOrderObserver="1";
      new MutationObserver(enforceMenuOrder).observe(menu,{childList:true,subtree:true});
    }
    window.setTimeout(enforceMenuOrder,50);
    window.setTimeout(enforceMenuOrder,250);
  }

  window.openStatArchiveAndroidApp=openOverlay;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();

/* Stat Archive — natural-height side menu */
(() => {
  "use strict";
  if (document.getElementById("statArchiveNaturalMenuHeight")) return;
  const style = document.createElement("style");
  style.id = "statArchiveNaturalMenuHeight";
  style.textContent = `
html body #mainSideMenu.main-side-menu{height:auto!important;min-height:0!important;max-height:100dvh!important;bottom:auto!important;overflow-y:auto!important;overscroll-behavior:contain;}
@supports not (height:100dvh){html body #mainSideMenu.main-side-menu{max-height:100vh!important;}}
`;
  document.head.appendChild(style);
})();
/* Web-only real download progress. Loaded before download-fix.js so the
   browser owns the transfer while the Android bridge remains untouched. */
(() => {
  "use strict";
  if (window.__statArchiveWebDownloadProgressV2) return;
  window.__statArchiveWebDownloadProgressV2 = true;
  if (window.AndroidBridge && typeof window.AndroidBridge === "object") return;

  const fmt = bytes => {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const setProgress = (btn, loaded, total) => {
    if (!btn) return;
    btn.disabled = true;
    btn.classList.add("is-downloading");
    btn.classList.remove("is-downloaded");
    if (total > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
      btn.textContent = `Downloading… ${pct}%`;
      btn.setAttribute("aria-label", `Downloading ${pct}%`);
    } else {
      btn.textContent = `Downloading… ${fmt(loaded)}`;
      btn.setAttribute("aria-label", `Downloading ${fmt(loaded)}`);
    }
  };

  async function responseBlobWithProgress(response, btn) {
    const total = Number(response.headers.get("content-length")) || 0;
    if (!response.body || typeof response.body.getReader !== "function") {
      setProgress(btn, 0, total);
      return response.blob();
    }
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    setProgress(btn, 0, total);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.byteLength;
        setProgress(btn, loaded, total);
      }
    }
    if (total > 0) setProgress(btn, total, total);
    return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
  }

  function cleanName(value) {
    return String(value || "stat-archive-file.pdf")
      .replace(/[\\/:*?"<>|\r\n]+/g, "_")
      .replace(/\.+$/g, "")
      .trim() || "stat-archive-file.pdf";
  }

  function saveBlob(blob, filename) {
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

  function complete(entry, btn) {
    btn.classList.remove("is-downloading");
    btn.classList.add("is-downloaded");
    btn.disabled = false;
    btn.textContent = "✓ Downloaded";
    btn.setAttribute("title", "Already downloaded on this device");
    btn.removeAttribute("aria-label");
    try {
      if (typeof downloadedEntryIds !== "undefined") {
        downloadedEntryIds.add(String(entry.id));
        if (typeof saveEntryActionHistory === "function") {
          saveEntryActionHistory("statArchiveDownloadedEntries", downloadedEntryIds);
        }
      }
      window.incrementActivity?.("download");
    } catch (_) {}
  }

  function fail(btn, wasDownloaded, oldHtml) {
    btn.classList.remove("is-downloading");
    btn.disabled = false;
    btn.removeAttribute("aria-label");
    if (wasDownloaded) {
      btn.classList.add("is-downloaded");
      btn.textContent = "✓ Downloaded";
    } else {
      btn.classList.remove("is-downloaded");
      if (oldHtml) btn.innerHTML = oldHtml;
      else btn.textContent = "⬇ Download";
    }
  }

  async function webDownload(entry, btn) {
    const wasDownloaded = btn.classList.contains("is-downloaded");
    const oldHtml = btn.innerHTML;
    try {
      let url;
      if (entry.driveUrl) {
        url = typeof window.statArchiveDriveStreamUrl === "function"
          ? window.statArchiveDriveStreamUrl(entry, "inline")
          : entry.driveUrl;
      } else {
        const workerUrl = typeof WORKER_URL === "string"
          ? WORKER_URL
          : "https://stat-archive-api.lustats.workers.dev";
        url = `${workerUrl}/file?id=${encodeURIComponent(entry.id)}`;
      }
      const response = await fetch(url, { method: "GET", credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await responseBlobWithProgress(response, btn);
      let filename = "";
      try { filename = window.archiveDownloadName?.(entry) || ""; } catch (_) {}
      if (!filename) filename = entry.filename || entry.title || "stat-archive-file.pdf";
      filename = cleanName(filename);
      if (entry.driveUrl && !/\.pdf$/i.test(filename)) filename += ".pdf";
      saveBlob(blob, filename);
      complete(entry, btn);
    } catch (err) {
      console.error("Web download failed:", err);
      fail(btn, wasDownloaded, oldHtml);
      try { window.showError?.(err?.message || "Couldn't download that file."); } catch (_) {}
    }
  }

  document.addEventListener("click", event => {
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
    webDownload(entry, btn);
  }, true);
})();
