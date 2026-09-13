/* Stat Archive — late card-action compatibility fixes. */
(() => {
  "use strict";

  const STYLE_ID = "statArchiveOfflineWebPwaFix";

  function install() {
    document.documentElement.classList.add("stat-archive-pwa");

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
/* Offline Library is enabled in both normal HTTPS web mode and installed PWA. */
html body .card .card-actions .offline-btn,
html:not(.stat-archive-pwa) body .card .card-actions .offline-btn,
html.stat-archive-pwa body .card .card-actions .offline-btn{
  display:flex !important;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

/* Preview + Download + Offline must all fit on a reader card. */
html body .card .card-actions{
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:8px !important;
}
html body .card .card-actions .action-btn{
  width:100% !important;
  min-width:0 !important;
}

/* Access card value only. */
html body #summaryAccess{
  font-size:16px !important;
  line-height:1.08 !important;
}

/* Canonical mu appearance for the normal web/APK graph. */
html body .header .hero-probability .axis-mid{
  font-family:Arial,Helvetica,sans-serif !important;
  font-size:14px !important;
  font-style:normal !important;
  font-weight:500 !important;
  line-height:1 !important;
  letter-spacing:0 !important;
  text-shadow:none !important;
}

@media(max-width:700px){
  html body .card .card-actions{
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    gap:6px !important;
  }
  html body .card .card-actions .action-btn{
    padding-left:5px !important;
    padding-right:5px !important;
    font-size:10px !important;
  }
  html body #summaryAccess{
    font-size:16px !important;
  }
  html body .header .hero-probability .axis-mid{
    font-size:14px !important;
  }
}
`;
      document.head.appendChild(style);
    }
  }

  install();
})();

/* =========================================================
   MANUAL -> HOME HISTORY FLOW v3
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V2__) return;
  window.__STAT_ARCHIVE_MANUAL_CHOICE_NAV_V2__ = "3";

  function homeUrl() {
    const url = new URL(location.href);
    url.searchParams.delete("menu");
    return url.href;
  }

  function normalizeCurrentEntryToHome() {
    const next = { ...(history.state || {}), statArchiveNav:"home" };
    delete next.statArchiveChild;
    delete next.statArchiveMenuOpen;

    try {
      history.replaceState(next, "", homeUrl());
    } catch (_) {
      try { history.replaceState(next, "", location.href); } catch (_) {}
    }

    try { window.__statArchiveNavigation?.closeMenu?.(); } catch (_) {}
    try { window.__statArchiveNavigation?.releaseMenuScrollLock?.(); } catch (_) {}
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const choice = target?.closest?.("#manualChooserOverlay [data-manual-href]");
    if (!choice) return;

    const href = choice.getAttribute("data-manual-href");
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const destination = new URL(href, location.href).href;
    normalizeCurrentEntryToHome();
    window.location.assign(destination);
  }, true);
})();

/* =========================================================
   DETERMINISTIC MENU CLOSE
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_CLOSE_SETTLER_V1__) return;
  window.__STAT_ARCHIVE_MENU_CLOSE_SETTLER_V1__ = true;

  let settling = false;
  let backAttempts = 0;
  let settleTimer = 0;

  function isMenuState() {
    try {
      if (history.state?.statArchiveNav === "menu") return true;
      return new URL(location.href).searchParams.get("menu") === "1";
    } catch (_) {
      return history.state?.statArchiveNav === "menu";
    }
  }

  function closeMenuVisuals() {
    const menu = document.getElementById("mainSideMenu");
    const backdrop = document.getElementById("mainMenuBackdrop");
    const button = document.getElementById("mainMenuBtn");

    menu?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
  }

  function releaseMenuLock() {
    try { window.__statArchiveNavigation?.releaseMenuScrollLock?.(); } catch (_) {}

    if (!document.body) return;
    if (history.state?.statArchiveNav === "menu") return;

    delete document.body.dataset.statMenuLocked;
    document.documentElement.classList.remove("stat-menu-scroll-locked");
    document.body.classList.remove("stat-menu-scroll-locked");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
  }

  function settle() {
    clearTimeout(settleTimer);
    closeMenuVisuals();

    if (isMenuState() && backAttempts < 3) {
      backAttempts += 1;
      history.back();
      settleTimer = window.setTimeout(settle, 90);
      return;
    }

    settling = false;
    backAttempts = 0;
    releaseMenuLock();
    requestAnimationFrame(() => {
      closeMenuVisuals();
      releaseMenuLock();
    });
  }

  window.addEventListener("click", event => {
    if (settling) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const menu = document.getElementById("mainSideMenu");
    if (!menu?.classList.contains("is-open")) return;

    if (!target.closest("#mainMenuCloseBtn") && !target.closest("#mainMenuBackdrop")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    settling = true;
    backAttempts = 0;
    closeMenuVisuals();

    if (isMenuState()) {
      backAttempts = 1;
      history.back();
      settleTimer = window.setTimeout(settle, 90);
    } else {
      settle();
    }
  }, true);

  window.addEventListener("popstate", () => {
    if (!settling) return;
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 0);
  });
})();

/* =========================================================
   PHONE + BROWSER DESKTOP-SITE HERO GRAPH
   Rebuilt independently from the normal responsive graph so desktop-site
   scaling on a phone cannot clip, resize or misplace the curve or mu label.
   Normal desktop, normal mobile web and the APK layout are untouched.
   ========================================================= */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_TOUCH_DESKTOP_GRAPH_V1__) return;
  window.__STAT_ARCHIVE_TOUCH_DESKTOP_GRAPH_V1__ = true;

  const NS = "http://www.w3.org/2000/svg";
  const CURVE_DURATION = 8000;
  const DOT_DURATION = 4000;
  const X_MIN = 18;
  const X_MAX = 502;
  let raf = 0;
  let active = false;

  function isTouchDesktop() {
    const coarse = !!window.matchMedia?.("(pointer: coarse)").matches;
    return coarse && window.innerWidth > 700;
  }

  function easeOutCubic(t) {
    const c = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - c, 3);
  }

  function themeColor() {
    return document.body?.dataset.theme === "light" ? "#2f8f5b" : "#5ee7f7";
  }

  function removeTouchGraph() {
    cancelAnimationFrame(raf);
    raf = 0;
    active = false;
    document.getElementById("statTouchDesktopGraph")?.remove();

    const hero = document.querySelector(".hero-probability");
    hero?.querySelector(".probability-svg")?.style.removeProperty("display");
    hero?.querySelector(".axis-mid")?.style.removeProperty("display");
  }

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }

  function buildTouchGraph() {
    if (!isTouchDesktop()) {
      removeTouchGraph();
      return;
    }

    const hero = document.querySelector(".hero-probability");
    const sourceSvg = hero?.querySelector(".probability-svg");
    const sourceCurve = sourceSvg?.querySelector(".gaussian-curve");
    if (!hero || !sourceSvg || !sourceCurve) return;

    const curveD = sourceCurve.getAttribute("d");
    if (!curveD) return;

    cancelAnimationFrame(raf);
    document.getElementById("statTouchDesktopGraph")?.remove();

    sourceSvg.style.setProperty("display", "none", "important");
    hero.querySelector(".axis-mid")?.style.setProperty("display", "none", "important");

    const svg = svgEl("svg", {
      id: "statTouchDesktopGraph",
      viewBox: "0 0 520 300",
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true"
    });
    svg.style.cssText = [
      "position:absolute",
      "left:8px",
      "right:8px",
      "top:28px",
      "width:calc(100% - 16px)",
      "height:auto",
      "max-height:calc(100% - 32px)",
      "display:block",
      "overflow:visible",
      "z-index:3",
      "pointer-events:none"
    ].join(";");

    const color = themeColor();

    const baseline = svgEl("line", {
      x1: 18, y1: 258, x2: 502, y2: 258,
      stroke: color, "stroke-width": 1.15, opacity: 0.62
    });
    svg.appendChild(baseline);

    const mean = svgEl("line", {
      x1: 260, y1: 40, x2: 260, y2: 258,
      stroke: color, "stroke-width": 1,
      "stroke-dasharray": "6 8", opacity: 0.22
    });
    svg.appendChild(mean);

    const curve = svgEl("path", {
      d: curveD,
      fill: "none",
      stroke: color,
      "stroke-width": 7,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    curve.style.filter = document.body?.dataset.theme === "light"
      ? "none"
      : "drop-shadow(0 0 7px rgba(94,231,247,.34))";
    svg.appendChild(curve);

    let pathLength = 1000;
    try {
      const measured = curve.getTotalLength();
      if (Number.isFinite(measured) && measured > 1) pathLength = measured;
    } catch (_) {}
    curve.style.strokeDasharray = `${pathLength} ${pathLength}`;
    curve.style.strokeDashoffset = String(pathLength);

    const dotStates = Array.from(sourceSvg.querySelectorAll(".data-dot")).map(source => {
      const cx = parseFloat(source.getAttribute("cx") || "0");
      const cy = parseFloat(source.getAttribute("cy") || "0");
      const fall = parseFloat(getComputedStyle(source).getPropertyValue("--fall")) || 0;
      const dot = svgEl("circle", {
        cx, cy, r: 3.35,
        fill: color,
        stroke: color,
        "stroke-width": 0.8,
        opacity: 0
      });
      dot.style.transformBox = "fill-box";
      dot.style.transformOrigin = "center";
      svg.appendChild(dot);
      return {
        dot,
        fall,
        xProgress: Math.max(0, Math.min(1, (cx - X_MIN) / (X_MAX - X_MIN)))
      };
    });

    const mu = svgEl("text", {
      x: 260,
      y: 286,
      "text-anchor": "middle",
      fill: color,
      "font-family": "Arial, Helvetica, sans-serif",
      "font-size": 22,
      "font-style": "normal",
      "font-weight": 500
    });
    mu.textContent = "μ";
    svg.appendChild(mu);

    hero.appendChild(svg);
    active = true;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      curve.style.strokeDasharray = "none";
      curve.style.strokeDashoffset = "0";
      dotStates.forEach(({ dot, fall }) => {
        dot.style.opacity = ".95";
        dot.style.transform = `translateY(${fall}px)`;
      });
      return;
    }

    const startedAt = performance.now();
    function frame(now) {
      if (!active || !document.getElementById("statTouchDesktopGraph")) return;
      const elapsed = now - startedAt;
      const curveRaw = Math.max(0, Math.min(1, elapsed / CURVE_DURATION));
      const dotRaw = Math.max(0, Math.min(1, elapsed / DOT_DURATION));
      const curveProgress = easeOutCubic(curveRaw);
      const dotProgress = easeOutCubic(dotRaw);

      curve.style.strokeDashoffset = String(pathLength * (1 - curveProgress));

      dotStates.forEach(({ dot, fall, xProgress }) => {
        const start = Math.max(0, xProgress - 0.18);
        const local = Math.max(0, Math.min(1, (dotProgress - start) / Math.max(0.0001, xProgress - start)));
        if (dotProgress < start) {
          dot.style.opacity = "0";
          dot.style.transform = "translateY(0px)";
          return;
        }
        dot.style.opacity = String(Math.min(0.95, local * 4));
        dot.style.transform = `translateY(${fall * easeOutCubic(local)}px)`;
      });

      if (curveRaw < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        curve.style.strokeDasharray = "none";
        curve.style.strokeDashoffset = "0";
        dotStates.forEach(({ dot, fall }) => {
          dot.style.opacity = ".95";
          dot.style.transform = `translateY(${fall}px)`;
        });
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function syncTouchGraph() {
    if (isTouchDesktop()) buildTouchGraph();
    else removeTouchGraph();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(syncTouchGraph), { once:true });
  } else {
    requestAnimationFrame(syncTouchGraph);
  }

  window.addEventListener("load", syncTouchGraph, { once:true });
  window.addEventListener("pageshow", syncTouchGraph);
  window.addEventListener("resize", () => requestAnimationFrame(syncTouchGraph));
  window.visualViewport?.addEventListener("resize", () => requestAnimationFrame(syncTouchGraph));
  document.addEventListener("statarchive:theme-change", () => requestAnimationFrame(syncTouchGraph));
})();
