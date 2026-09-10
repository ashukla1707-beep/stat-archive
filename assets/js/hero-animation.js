/* Load the lightweight startup coordinator before the hero is armed. */
(() => {
  if (document.querySelector('script[data-stat-startup-polish]')) return;
  const script = document.createElement('script');
  script.src = 'assets/js/startup-polish.js?v=20260910-1';
  script.dataset.statStartupPolish = '1';
  script.async = false;
  document.head.appendChild(script);
})();

(function () {
  "use strict";

  if (window.__STAT_ARCHIVE_HERO_ANIMATION_V3__) return;
  window.__STAT_ARCHIVE_HERO_ANIMATION_V3__ = true;

  let started = false;
  let prepared = null;
  let startupFallbackTimer = 0;
  let frameId = 0;

  const HERO_DURATION = 8000;
  const FALL_WINDOW = 0.18;
  const CURVE_X_MIN = 18;
  const CURVE_X_MAX = 502;

  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function easeOutCubic(t) { const u = 1 - clamp01(t); return 1 - (u * u * u); }
  function readFallPx(dot) {
    const raw = getComputedStyle(dot).getPropertyValue("--fall").trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function prepareHeroAnimation() {
    if (prepared) return prepared;
    const curve = document.querySelector(".gaussian-curve");
    const dots = Array.from(document.querySelectorAll(".data-dot"));
    const revealRect = document.getElementById("gaussianRevealRect");
    if (!curve) return null;
    revealRect?.querySelectorAll("animate").forEach(animation => { try { animation.endElement?.(); } catch (_) {} animation.remove(); });
    revealRect?.setAttribute("width", "520");
    let pathLength = 1000;
    try { const measured = curve.getTotalLength(); if (Number.isFinite(measured) && measured > 1) pathLength = measured; } catch (_) {}
    curve.style.setProperty("animation", "none", "important");
    curve.style.setProperty("transition", "none", "important");
    curve.style.setProperty("stroke-dasharray", `${pathLength} ${pathLength}`, "important");
    curve.style.setProperty("stroke-dashoffset", String(pathLength), "important");
    curve.style.setProperty("opacity", "1", "important");
    const dotStates = dots.map(dot => {
      dot.style.setProperty("animation", "none", "important");
      dot.style.setProperty("transition", "none", "important");
      dot.style.setProperty("transform", "translateY(0px)", "important");
      dot.style.setProperty("opacity", "0", "important");
      const cx = parseFloat(dot.getAttribute("cx") || "0");
      return { dot, fall: readFallPx(dot), xProgress: clamp01((cx - CURVE_X_MIN) / (CURVE_X_MAX - CURVE_X_MIN)) };
    });
    prepared = { curve, revealRect, pathLength, dotStates };
    return prepared;
  }

  prepareHeroAnimation();

  function renderHeroFrame(state, rawProgress) {
    const { curve, pathLength, dotStates } = state;
    const curveProgress = easeOutCubic(rawProgress);
    curve.style.setProperty("stroke-dashoffset", String(pathLength * (1 - curveProgress)), "important");
    dotStates.forEach(({ dot, fall, xProgress }) => {
      const fallStart = Math.max(0, xProgress - FALL_WINDOW);
      const local = clamp01((curveProgress - fallStart) / Math.max(0.0001, xProgress - fallStart));
      const fallProgress = easeOutCubic(local);
      if (curveProgress < fallStart) {
        dot.style.setProperty("opacity", "0", "important");
        dot.style.setProperty("transform", "translateY(0px)", "important");
        return;
      }
      dot.style.setProperty("opacity", String(Math.min(0.95, local * 4)), "important");
      dot.style.setProperty("transform", `translateY(${fall * fallProgress}px)`, "important");
    });
  }

  function startHeroAnimation() {
    if (started) return;
    const state = prepareHeroAnimation();
    if (!state) return;
    started = true;
    clearTimeout(startupFallbackTimer);
    cancelAnimationFrame(frameId);
    state.revealRect?.setAttribute("width", "520");
    document.getElementById("statHeroPreloadGuard")?.remove();
    renderHeroFrame(state, 0);
    const startTime = performance.now();
    function tick(now) {
      const rawProgress = clamp01((now - startTime) / HERO_DURATION);
      renderHeroFrame(state, rawProgress);
      if (rawProgress < 1) { frameId = requestAnimationFrame(tick); return; }
      state.curve.style.setProperty("stroke-dasharray", "none", "important");
      state.curve.style.setProperty("stroke-dashoffset", "0", "important");
      state.dotStates.forEach(({ dot, fall }) => {
        dot.style.setProperty("opacity", ".95", "important");
        dot.style.setProperty("transform", `translateY(${fall}px)`, "important");
      });
    }
    frameId = requestAnimationFrame(tick);
  }

  function queueStart() { if (started) return; clearTimeout(startupFallbackTimer); window.setTimeout(startHeroAnimation, 90); }
  function armStart() {
    if (document.documentElement.dataset.statStartupReady === "1") { queueStart(); return; }
    document.addEventListener("statarchive:startup-ready", queueStart, { once:true });
    startupFallbackTimer = window.setTimeout(queueStart, 3500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", armStart, { once:true }); else armStart();

  function repairHeroCopy() {
    const sub = document.querySelector(".hero-line .sub");
    if (!sub) return;
    sub.innerHTML = '<span class="hero-sub-lead">A focused academic archive of notes and books, curated specifically for University of Lucknow</span>' + '<span class="hero-sub-tail"> — organized by subject and kept useful for everyone.</span>';
  }

  function installHeroLayout() {
    document.getElementById("statArchiveDirectHeroFix")?.remove();
    const style = document.createElement("style");
    style.id = "statArchiveDirectHeroFix";
    style.textContent = `
html body .header .hero-line .sub .hero-sub-lead,html body .header .hero-line .sub .hero-sub-tail{background:none!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border:0!important;width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;padding:0!important;color:inherit!important;-webkit-box-decoration-break:clone!important;box-decoration-break:clone!important}
html body .header .hero-line .sub,html body .header .hero-line .sub *{user-select:none!important;-webkit-user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important}
html body .header .hero-line .sub::selection,html body .header .hero-line .sub *::selection{background:transparent!important;color:inherit!important}
html body .header .hero-line .sub::-moz-selection,html body .header .hero-line .sub *::-moz-selection{background:transparent!important;color:inherit!important}
/* Hide obsolete hero annotation and archive permissions notice. */
html body .header .curve-note.note-one,html body #permissionHint{display:none!important}
/* Offline Library light-mode destructive action: must override generic light action styling. */
body[data-theme="light"] #offlineLibraryOverlay button.sa-offline-action.delete,body[data-theme="light"] #offlineLibraryOverlay button[data-sa-delete-id]{color:#d94b5b!important;border-color:rgba(217,75,91,.38)!important;background:rgba(217,75,91,.075)!important}
@media (min-width:1101px){html body .header .hero-copy{width:58%!important;max-width:850px!important;position:relative!important;z-index:3!important;transform:translateY(-18px)!important;overflow:visible!important}html body .header .hero-line{display:flex!important;align-items:flex-start!important;gap:14px!important;width:100%!important;margin-top:18px!important;padding:0!important;overflow:visible!important}html body .header .hero-line>span[aria-hidden="true"]{position:static!important;flex:0 0 44px!important;width:44px!important;min-width:44px!important;height:1px!important;margin:10px 0 0!important;padding:0!important;transform:none!important}html body .header .hero-line .sub{display:block!important;flex:1 1 auto!important;width:auto!important;max-width:none!important;min-width:0!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;white-space:normal!important;font-size:13px!important;line-height:1.58!important;transform:none!important}html body .header .hero-sub-lead,html body .header .hero-sub-tail{display:block!important;position:static!important;line-height:1.58!important}html body .header .hero-sub-lead{white-space:nowrap!important}html body .header .hero-sub-tail{white-space:nowrap!important;margin-top:1px!important}}
@media (min-width:701px) and (max-width:1100px){html body .header .hero-copy{transform:none!important;overflow:visible!important}html body .header .hero-line,html body .header .hero-line .sub{height:auto!important;max-height:none!important;overflow:visible!important;white-space:normal!important}html body .header .hero-sub-lead,html body .header .hero-sub-tail{display:inline!important;white-space:normal!important;line-height:inherit!important}}
@media (max-width:700px){html body .header .hero-copy{transform:none!important;overflow:visible!important}html body .header .hero-line{display:flex!important;align-items:flex-start!important;width:100%!important;overflow:visible!important}html body .header .hero-line .sub{display:block!important;width:calc(100% - 41px)!important;max-width:none!important;height:auto!important;max-height:none!important;margin:0!important;padding:0 0 8px!important;overflow:visible!important;white-space:normal!important;line-height:1.6!important}html body .header .hero-sub-lead,html body .header .hero-sub-tail{display:inline!important;position:static!important;white-space:normal!important;line-height:inherit!important}}
`;
    document.head.appendChild(style);
  }

  function applyHeroFix() {
    repairHeroCopy();
    installHeroLayout();
    document.querySelector(".curve-note.note-one")?.remove();
    document.getElementById("permissionHint")?.remove();
  }
  applyHeroFix();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyHeroFix, { once:true });
  window.addEventListener("pageshow", applyHeroFix);
})();

(() => {
  if (document.querySelector('script[data-stat-mobile-card-actions]')) return;
  const script = document.createElement('script');
  script.src = 'assets/js/mobile-card-actions.js?v=20260910-2';
  script.dataset.statMobileCardActions = '1';
  script.async = false;
  document.body.appendChild(script);
})();