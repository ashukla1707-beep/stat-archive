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
