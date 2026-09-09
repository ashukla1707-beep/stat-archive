/* application section */

/* =========================================================
   SERVICE WORKER REGISTRATION

   updateViaCache:none + controllerchange reload are important for the
   Android WebView/PWA. An APK update does not clear an existing WebView
   service worker or CacheStorage, so an old page can otherwise keep running
   even after the repository has newer navigation code.
   ========================================================= */
(() => {
  if (!("serviceWorker" in navigator)) return;

  let reloadingForNewWorker = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForNewWorker) return;
    reloadingForNewWorker = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        updateViaCache: "none"
      });
      try { await registration.update(); } catch (_) {}
    } catch (_) {}
  });
})();

/* =========================================================
   SINGLE DIRECT NAVIGATION CORE

   This file is referenced directly by index.html, so the Menu history does
   not depend on a script being injected by the service worker.

   Required flows:
     Home -> Menu -> Back -> Home
     Home -> Menu -> Manual chooser -> Back -> Menu -> Back -> Home
     Home -> Menu -> Manual page -> Back -> Menu -> Back -> Home
     Home -> Menu -> About/Offline/Feedback -> Back -> Menu -> Back -> Home
   ========================================================= */
(() => {
  const NAV_KEY = "statArchiveNav";
  const CHILD_KEY = "statArchiveChild";
  const MENU_PARAM = "menu";

  const menu = document.getElementById("mainSideMenu");
  const menuBtn = document.getElementById("mainMenuBtn");
  const backdrop = document.getElementById("mainMenuBackdrop");

  if (!menu || !menuBtn) return;

  const navState = () => history.state?.[NAV_KEY] || "home";
  const childState = () => history.state?.[CHILD_KEY] || "";

  function withNav(state, child = "") {
    const next = { ...(history.state || {}), [NAV_KEY]: state };
    if (child) next[CHILD_KEY] = child;
    else delete next[CHILD_KEY];
    return next;
  }

  function menuUrl() {
    const url = new URL(location.href);
    url.searchParams.set(MENU_PARAM, "1");
    return url.href;
  }

  function homeUrl() {
    const url = new URL(location.href);
    url.searchParams.delete(MENU_PARAM);
    return url.href;
  }

  function openMenuUI() {
    try { window.statArchiveOpenMenu?.(); } catch (_) {}
    menu.classList.add("is-open");
    backdrop?.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    backdrop?.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenuUI() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    menu.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    backdrop?.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function closeManualChooserUI() {
    const overlay = document.getElementById("manualChooserOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");

    if (document.body?.dataset.manualScrollLock === "1") {
      const y = Number(document.body.dataset.manualScrollY || 0);
      delete document.body.dataset.manualScrollLock;
      delete document.body.dataset.manualScrollY;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }

  function closeAboutUI() {
    const overlay = document.getElementById("aboutArchiveOverlay");
    if (!overlay) return;
    try { document.getElementById("closeAboutArchiveBtn")?.click(); } catch (_) {}
    overlay.style.display = "none";
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function closeOfflineLibraryUI() {
    const overlay = document.getElementById("offlineLibraryOverlay");
    if (!overlay) return;
    try {
      if (typeof window.closeOfflineLibrary === "function") window.closeOfflineLibrary();
      else if (typeof closeOfflineLibrary === "function") closeOfflineLibrary();
    } catch (_) {}
  }

  function closeFeedbackUI() {
    const overlay = document.getElementById("statLocalFeedbackOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function closeAllMenuChildren() {
    closeManualChooserUI();
    closeAboutUI();
    closeOfflineLibraryUI();
    closeFeedbackUI();
  }

  function enterMenuState() {
    if (navState() === "menu") {
      history.replaceState(withNav("menu"), "", menuUrl());
      return;
    }
    history.pushState(withNav("menu"), "", menuUrl());
  }

  function enterChildState(child) {
    if (navState() === "child" && childState() === child) return;

    if (navState() !== "menu") {
      enterMenuState();
    }

    history.pushState(withNav("child", child), "", menuUrl());
  }

  /* Normalize the current entry first. The URL marker is a fallback for a
     history restoration where WebView loses the JS state object. */
  const initialUrl = new URL(location.href);
  if (initialUrl.searchParams.get(MENU_PARAM) === "1") {
    if (!history.state?.[NAV_KEY] || history.state?.[NAV_KEY] === "home") {
      history.replaceState(withNav("menu"), "", location.href);
    }
  } else if (!history.state?.[NAV_KEY]) {
    history.replaceState(withNav("home"), "", homeUrl());
  }

  /* Register this capture listener before accessibility.js. It normalizes the
     state before later menu handlers run, preventing duplicate history rows. */
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest("#mainMenuBtn")) {
      if (menu.classList.contains("is-open") && navState() === "menu") {
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
        return;
      }

      if (!menu.classList.contains("is-open")) {
        if (navState() === "home") enterMenuState();
        else if (navState() !== "menu") history.replaceState(withNav("menu"), "", menuUrl());
      }
      return;
    }

    if ((target.closest("#mainMenuCloseBtn") || target.closest("#mainMenuBackdrop")) &&
        menu.classList.contains("is-open") && navState() === "menu") {
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
      return;
    }

    const action = target.closest("#mainSideMenu .main-menu-action");
    if (!action) return;

    /* Always make the currently visible Menu an explicit history entry before
       a child closes it. */
    if (navState() !== "menu") {
      history.replaceState(withNav("menu"), "", menuUrl());
    } else {
      history.replaceState(withNav("menu"), "", menuUrl());
    }

    if (action.id === "menuManualsBtn") {
      /* The chooser itself pushes the child entry when it opens. */
      return;
    }

    if (action.id === "menuAboutBtn") enterChildState("about");
    else if (action.id === "menuOfflineLibraryBtn") enterChildState("offline-library");
    else if (action.id === "menuLocalFeedbackBtn") enterChildState("feedback");
  }, true);

  function restoreForCurrentState() {
    const state = navState();

    if (state === "menu") {
      closeAllMenuChildren();
      openMenuUI();
      return;
    }

    if (state === "home") {
      closeAllMenuChildren();
      closeMenuUI();
      return;
    }

    if (state === "child") {
      closeMenuUI();
    }
  }

  window.addEventListener("popstate", restoreForCurrentState);
  window.addEventListener("pageshow", restoreForCurrentState);

  /* Expose helpers for the Manual chooser and future native Back handling. */
  window.__statArchiveNavigation = {
    state: navState,
    child: childState,
    enterMenu: enterMenuState,
    enterChild: enterChildState,
    openMenu: openMenuUI,
    closeMenu: closeMenuUI,
    closeChildren: closeAllMenuChildren,
    menuUrl
  };

  restoreForCurrentState();
})();

/* =========================================================
   MANUAL CHOOSER
   ========================================================= */
(() => {
  let manualScrollY = 0;

  function contributorManualAllowed() {
    try { return !!session && archiveRole === "contributor"; }
    catch (_) { return false; }
  }

  function syncManualVisibility(overlay) {
    if (!overlay) return;
    const showContributor = contributorManualAllowed();
    const contributorChoice = overlay.querySelector('[data-manual-role="contributor"]');
    const title = overlay.querySelector("#manualChooserTitle");
    const intro = overlay.querySelector("[data-manual-intro]");
    if (contributorChoice) {
      contributorChoice.style.display = showContributor ? "" : "none";
      contributorChoice.setAttribute("aria-hidden", showContributor ? "false" : "true");
    }
    if (title) title.textContent = showContributor ? "Manuals" : "Manual";
    if (intro) intro.textContent = showContributor ? "Choose the guide you want to open." : "Open the reader guide.";
  }

  function lockManualBackground() {
    manualScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.dataset.manualScrollLock = "1";
    document.body.dataset.manualScrollY = String(manualScrollY);
    document.body.style.position = "fixed";
    document.body.style.top = `-${manualScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function unlockManualBackground() {
    if (document.body?.dataset.manualScrollLock !== "1") return;
    const y = Number(document.body.dataset.manualScrollY || manualScrollY || 0);
    delete document.body.dataset.manualScrollLock;
    delete document.body.dataset.manualScrollY;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    requestAnimationFrame(() => window.scrollTo(0, y));
  }

  function closeManualChooserUI() {
    const overlay = document.getElementById("manualChooserOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    unlockManualBackground();
  }

  function closeManualChooser() {
    const nav = window.__statArchiveNavigation;
    if (nav?.state?.() === "child" && nav?.child?.() === "manual-chooser") {
      history.back();
    } else {
      closeManualChooserUI();
      nav?.openMenu?.();
    }
  }

  function ensureManualChooser() {
    let overlay = document.getElementById("manualChooserOverlay");
    if (overlay) {
      syncManualVisibility(overlay);
      return overlay;
    }

    overlay = document.createElement("div");
    overlay.id = "manualChooserOverlay";
    overlay.className = "manual-chooser-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section class="manual-chooser-card" role="dialog" aria-modal="true" aria-labelledby="manualChooserTitle">
        <div class="manual-chooser-head">
          <div>
            <div class="manual-chooser-kicker">SUPPORT</div>
            <h2 id="manualChooserTitle">Manual</h2>
            <p data-manual-intro>Open the reader guide.</p>
          </div>
          <button type="button" class="manual-chooser-close" id="manualChooserCloseBtn" aria-label="Close manuals">×</button>
        </div>
        <div class="manual-chooser-options">
          <button type="button" class="manual-choice" data-manual-href="./manuals/reader.html">
            <span class="manual-choice-icon" aria-hidden="true">◫</span>
            <span class="manual-choice-copy"><strong>Reader Manual</strong><small>Browsing, search, preview, download and Offline Library</small></span>
            <span class="manual-choice-arrow" aria-hidden="true">›</span>
          </button>
          <button type="button" class="manual-choice" data-manual-role="contributor" data-manual-href="./manuals/contributor.html">
            <span class="manual-choice-icon" aria-hidden="true">＋</span>
            <span class="manual-choice-copy"><strong>Contributor Manual</strong><small>Filing, editing, subjects, limits and contributor permissions</small></span>
            <span class="manual-choice-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </section>`;

    document.body.appendChild(overlay);
    syncManualVisibility(overlay);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeManualChooser();
    });
    overlay.querySelector("#manualChooserCloseBtn")?.addEventListener("click", closeManualChooser);

    overlay.querySelectorAll("[data-manual-href]").forEach(button => {
      button.addEventListener("click", event => {
        const href = button.getAttribute("data-manual-href");
        if (!href) return;
        event.preventDefault();
        event.stopPropagation();

        closeManualChooserUI();

        /* Current entry is child/manual-chooser. Replace only that entry with
           the Manual document. The entry directly below remains Menu. */
        window.location.replace(href);
      });
    });

    return overlay;
  }

  function openManualChooser() {
    const nav = window.__statArchiveNavigation;
    const overlay = ensureManualChooser();
    syncManualVisibility(overlay);
    if (overlay.classList.contains("is-open")) return;

    if (nav?.state?.() !== "menu") nav?.enterMenu?.();
    nav?.enterChild?.("manual-chooser");
    nav?.closeMenu?.();

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    lockManualBackground();
    requestAnimationFrame(() => overlay.querySelector("#manualChooserCloseBtn")?.focus());
  }

  function bindManualButton() {
    const button = document.getElementById("menuManualsBtn");
    if (!button || button.dataset.manualChooserBound === "1") return;
    button.dataset.manualChooserBound = "1";

    button.addEventListener("click", event => {
      event.preventDefault();
      window.setTimeout(openManualChooser, 120);
    });
  }

  window.addEventListener("popstate", () => {
    const nav = window.__statArchiveNavigation;
    if (nav?.state?.() !== "child" || nav?.child?.() !== "manual-chooser") {
      closeManualChooserUI();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.getElementById("manualChooserOverlay")?.classList.contains("is-open")) {
      event.preventDefault();
      closeManualChooser();
    }
  });

  const style = document.createElement("style");
  style.id = "statArchiveManualChooserStyle";
  style.textContent = `
.manual-chooser-overlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));background:rgba(2,6,12,.68);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,visibility .16s ease;}
.manual-chooser-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto;}
.manual-chooser-card{width:min(520px,100%);max-height:calc(100dvh - 28px);overflow:auto;border:1px solid rgba(148,163,184,.20);border-radius:22px;padding:22px;background:#0d141e;color:#eef3f8;box-shadow:0 28px 80px rgba(0,0,0,.48);transform:translateY(8px) scale(.992);transition:transform .16s ease;}
.manual-chooser-overlay.is-open .manual-chooser-card{transform:none;}
.manual-chooser-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px;}
.manual-chooser-kicker{color:#5ee7f7;font:700 10px/1.2 'JetBrains Mono',monospace;letter-spacing:.14em;}
.manual-chooser-head h2{margin:5px 0 4px;font:800 28px/1.05 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.035em;}
.manual-chooser-head p{margin:0;color:#8491a2;font:500 12.5px/1.5 Inter,sans-serif;}
.manual-chooser-close{flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:1px solid rgba(148,163,184,.18);background:#111a25;color:#eef3f8;font-size:22px;line-height:1;cursor:pointer;}
.manual-chooser-options{display:grid;gap:10px;}
.manual-choice{width:100%;min-height:78px;display:grid;grid-template-columns:38px 1fr 20px;align-items:center;gap:12px;text-align:left;padding:13px 14px;border:1px solid rgba(148,163,184,.16);border-radius:15px;background:#111a25;color:#eef3f8;cursor:pointer;}
.manual-choice:hover{border-color:rgba(94,231,247,.32);background:rgba(94,231,247,.065);}
.manual-choice-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(94,231,247,.09);color:#5ee7f7;font-size:18px;}
.manual-choice-copy{min-width:0;display:flex;flex-direction:column;gap:4px;}
.manual-choice-copy strong{font:700 14px/1.3 Inter,sans-serif;}
.manual-choice-copy small{color:#8491a2;font:500 11px/1.45 Inter,sans-serif;}
.manual-choice-arrow{color:#8491a2;font-size:25px;}
body[data-theme="light"] .manual-chooser-overlay{background:rgba(52,48,42,.30);}
body[data-theme="light"] .manual-chooser-card{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 24px 70px rgba(58,53,42,.18);}
body[data-theme="light"] .manual-chooser-kicker{color:#4b365f;}
body[data-theme="light"] .manual-chooser-head p,body[data-theme="light"] .manual-choice-copy small,body[data-theme="light"] .manual-choice-arrow{color:#817d77;}
body[data-theme="light"] .manual-chooser-close,body[data-theme="light"] .manual-choice{background:rgba(255,255,255,.78);color:#27302d;border-color:rgba(75,54,95,.14);}
body[data-theme="light"] .manual-choice:hover{border-color:rgba(75,54,95,.28);background:rgba(75,54,95,.055);}
body[data-theme="light"] .manual-choice-icon{background:rgba(75,54,95,.085);color:#4b365f;}
@media(max-width:700px){.manual-chooser-overlay{align-items:center;padding:12px}.manual-chooser-card{width:100%;max-height:calc(100dvh - 24px);border-radius:20px;padding:19px 16px}.manual-chooser-head h2{font-size:24px}.manual-choice{min-height:72px;padding:12px;grid-template-columns:36px 1fr 18px;gap:10px}.manual-choice-copy strong{font-size:13px}.manual-choice-copy small{font-size:10.5px}}
`;
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindManualButton, { once:true });
  else bindManualButton();
})();

/* =========================================================
   OFFLINE LIBRARY HYBRID UI LOADER
   ========================================================= */
(() => {
  function loadOfflineHybrid() {
    if (document.querySelector('script[data-sa-offline-hybrid="1"]')) return;
    const script = document.createElement("script");
    script.src = "./assets/js/offline-library-hybrid.js?v=20260909-1";
    script.async = false;
    script.dataset.saOfflineHybrid = "1";
    document.body.appendChild(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadOfflineHybrid, { once:true });
  else loadOfflineHybrid();
})();
