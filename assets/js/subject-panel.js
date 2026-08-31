/* application section */

document.addEventListener("pointerdown", (e) => {
  const panel = document.getElementById("subjectFilterExpanded");
  if (!panel || !panel.classList.contains("open")) return;
  const row = document.getElementById("subjectFilterRow");
  if (row && row.contains(e.target)) return;

  panel.remove();
  const more = row?.querySelector(".subject-more-pill");
  if (more) more.textContent = "More";
}, { passive: true });

/* Desktop hero visual polish. */
(() => {
  const style = document.createElement("style");
  style.id = "statArchiveHeroFinalPolish";
  style.textContent = `
@media (min-width:901px){
  .hero-probability{
    background:
      radial-gradient(circle at 52% 58%, rgba(94,231,247,.075), transparent 52%),
      linear-gradient(145deg, rgba(18,28,40,.36), rgba(8,14,22,.20)) !important;
    border:1px solid rgba(148,163,184,.20) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.045),
      inset 0 0 0 1px rgba(94,231,247,.018),
      0 10px 28px rgba(0,0,0,.075) !important;
    backdrop-filter:none !important;
    -webkit-backdrop-filter:none !important;
  }

  .hero-probability .probability-svg{
    position:absolute !important;
    left:-16px !important;
    right:auto !important;
    top:16px !important;
    width:488px !important;
    height:189px !important;
    max-width:none !important;
    transform:none !important;
  }

  .hero-probability .dot-baseline{
    transform:none !important;
    transform-origin:center center !important;
    stroke:rgba(94,231,247,.55) !important;
    stroke-width:1.25 !important;
  }

  .hero-probability .gaussian-curve{
    transform-box:fill-box !important;
    transform-origin:center bottom !important;
    transform:translateY(-11px) scaleY(1.18) !important;
  }

  .hero-probability .axis-mid{bottom:1px !important;}

  .main-menu-btn{
    top:34px !important;
    right:66px !important;
    background:linear-gradient(145deg, rgba(18,28,40,.34), rgba(8,14,22,.22)) !important;
    border:1px solid rgba(148,163,184,.20) !important;
    color:#f5f7fb !important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 6px 16px rgba(0,0,0,.055) !important;
  }

  .main-menu-btn:hover{
    background:linear-gradient(145deg, rgba(25,38,52,.42), rgba(10,18,28,.28)) !important;
    border-color:rgba(94,231,247,.28) !important;
    color:#fff !important;
  }

  body[data-theme="light"] .hero-probability{
    background:
      radial-gradient(circle at 52% 58%, rgba(52,125,115,.055), transparent 52%),
      linear-gradient(145deg, rgba(255,255,255,.42), rgba(244,240,230,.22)) !important;
    border-color:rgba(67,73,69,.14) !important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.68),inset 0 0 0 1px rgba(52,125,115,.025),0 9px 22px rgba(58,53,42,.045) !important;
  }

  body[data-theme="light"] .main-menu-btn{
    background:linear-gradient(145deg, rgba(255,255,255,.48), rgba(244,240,230,.28)) !important;
    border-color:rgba(67,73,69,.14) !important;
    color:#4b365f !important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.62),0 5px 14px rgba(58,53,42,.035) !important;
  }
}

@media (max-width:700px){
  .hero-probability .curve-note.note-one{display:none !important;}
}
`;
  document.head.appendChild(style);
})();

/* Menu polish + behavior fixes for website, PWA and APK. */
(() => {
  let menuHistoryActive = false;
  let closingFromPopState = false;
  let lockedScrollY = 0;
  let bodyStyleSnapshot = null;

  function lockBackgroundScroll(){
    if (document.body?.dataset.statMenuLocked === "1") return;

    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    bodyStyleSnapshot = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.dataset.statMenuLocked = "1";
    document.documentElement.classList.add("stat-menu-scroll-locked");
    document.body.classList.add("stat-menu-scroll-locked");

    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function unlockBackgroundScroll(){
    if (document.body?.dataset.statMenuLocked !== "1") return;

    delete document.body.dataset.statMenuLocked;
    document.documentElement.classList.remove("stat-menu-scroll-locked");
    document.body.classList.remove("stat-menu-scroll-locked");

    if (bodyStyleSnapshot) {
      document.body.style.position = bodyStyleSnapshot.position;
      document.body.style.top = bodyStyleSnapshot.top;
      document.body.style.left = bodyStyleSnapshot.left;
      document.body.style.right = bodyStyleSnapshot.right;
      document.body.style.width = bodyStyleSnapshot.width;
      document.body.style.overflow = bodyStyleSnapshot.overflow;
    }

    const restoreY = lockedScrollY;
    bodyStyleSnapshot = null;
    requestAnimationFrame(() => window.scrollTo(0, restoreY));
  }

  function initMenuPolish(){
    const menu = document.getElementById("mainSideMenu");
    const menuBtn = document.getElementById("mainMenuBtn");
    const backdrop = document.getElementById("mainMenuBackdrop");
    if (!menu || !menuBtn || !backdrop) return;

    menu.classList.add("stat-menu-polished");

    const accountSection = document.getElementById("menuAuthBtn")?.closest(".main-menu-section");
    const appearanceSection = document.getElementById("menuDarkBtn")?.closest(".main-menu-section");
    const librarySection = document.getElementById("menuOfflineLibraryBtn")?.closest(".main-menu-section");
    const manualSection = document.getElementById("menuManualsBtn")?.closest(".main-menu-section");
    const aboutSection = document.getElementById("menuAboutBtn")?.closest(".main-menu-section");

    accountSection?.classList.add("mobile-menu-account-section");
    appearanceSection?.classList.add("mobile-menu-appearance-section");
    librarySection?.classList.add("mobile-menu-library-section");
    manualSection?.classList.add("mobile-menu-manual-section");
    aboutSection?.classList.add("mobile-menu-about-section");

    if (librarySection && !librarySection.querySelector(".mobile-menu-injected-label")) {
      const label = document.createElement("div");
      label.className = "main-menu-label mobile-menu-injected-label";
      label.textContent = "Library";
      librarySection.prepend(label);
    }

    if (manualSection && !manualSection.querySelector(".mobile-menu-injected-label")) {
      const label = document.createElement("div");
      label.className = "main-menu-label mobile-menu-injected-label";
      label.textContent = "Support";
      manualSection.prepend(label);
    }

    let levelSection = document.getElementById("mobileMenuLevelSection");
    if (!levelSection) {
      levelSection = document.createElement("section");
      levelSection.id = "mobileMenuLevelSection";
      levelSection.className = "main-menu-section mobile-menu-level-section";
      levelSection.innerHTML = `
        <div class="main-menu-label">Level</div>
        <div class="mobile-menu-level-row" role="group" aria-label="Course level">
          <button type="button" id="menuMscLevelBtn" class="mobile-menu-level-btn">M.Sc</button>
          <button type="button" id="menuBscLevelBtn" class="mobile-menu-level-btn">B.Sc</button>
        </div>`;
      appearanceSection?.parentNode?.insertBefore(levelSection, appearanceSection.nextSibling);
    }

    const mscMenuBtn = document.getElementById("menuMscLevelBtn");
    const bscMenuBtn = document.getElementById("menuBscLevelBtn");
    const mscSourceBtn = document.getElementById("levelMscBtn");
    const bscSourceBtn = document.getElementById("levelBscBtn");

    function syncLevelButtons(){
      let current = "";
      if (mscSourceBtn?.getAttribute("aria-pressed") === "true") current = "msc";
      if (bscSourceBtn?.getAttribute("aria-pressed") === "true") current = "bsc";
      if (!current) current = new URLSearchParams(location.search).get("level") || "msc";

      mscMenuBtn?.classList.toggle("is-active", current === "msc");
      bscMenuBtn?.classList.toggle("is-active", current === "bsc");
      mscMenuBtn?.setAttribute("aria-pressed", String(current === "msc"));
      bscMenuBtn?.setAttribute("aria-pressed", String(current === "bsc"));
    }

    if (mscMenuBtn && !mscMenuBtn.dataset.bound) {
      mscMenuBtn.dataset.bound = "1";
      mscMenuBtn.addEventListener("click", () => {
        mscSourceBtn?.click();
        setTimeout(syncLevelButtons, 0);
      });
    }

    if (bscMenuBtn && !bscMenuBtn.dataset.bound) {
      bscMenuBtn.dataset.bound = "1";
      bscMenuBtn.addEventListener("click", () => {
        bscSourceBtn?.click();
        setTimeout(syncLevelButtons, 0);
      });
    }

    if (mscSourceBtn || bscSourceBtn) {
      const levelObserver = new MutationObserver(syncLevelButtons);
      if (mscSourceBtn) levelObserver.observe(mscSourceBtn, { attributes:true, attributeFilter:["aria-pressed"] });
      if (bscSourceBtn) levelObserver.observe(bscSourceBtn, { attributes:true, attributeFilter:["aria-pressed"] });
    }
    syncLevelButtons();

    const menuDarkBtn = document.getElementById("menuDarkBtn");
    const menuLightBtn = document.getElementById("menuLightBtn");
    const sourceDarkBtn = document.getElementById("themeDarkBtn");
    const sourceLightBtn = document.getElementById("themeLightBtn");

    function currentTheme(){
      return document.body?.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    function syncThemeButtons(){
      const theme = currentTheme();
      menuDarkBtn?.classList.toggle("is-active", theme === "dark");
      menuLightBtn?.classList.toggle("is-active", theme === "light");
      menuDarkBtn?.setAttribute("aria-pressed", String(theme === "dark"));
      menuLightBtn?.setAttribute("aria-pressed", String(theme === "light"));
    }

    function forceTheme(theme){
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        document.body?.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
        document.body?.removeAttribute("data-theme");
      }
      try { localStorage.setItem("statArchiveTheme", theme); } catch (_) {}
      syncThemeButtons();
    }

    function chooseTheme(theme){
      const source = theme === "light" ? sourceLightBtn : sourceDarkBtn;
      source?.click();
      requestAnimationFrame(() => {
        if (currentTheme() !== theme) forceTheme(theme);
        else syncThemeButtons();
      });
    }

    if (menuDarkBtn && !menuDarkBtn.dataset.themeBound) {
      menuDarkBtn.dataset.themeBound = "1";
      menuDarkBtn.addEventListener("click", () => chooseTheme("dark"));
    }
    if (menuLightBtn && !menuLightBtn.dataset.themeBound) {
      menuLightBtn.dataset.themeBound = "1";
      menuLightBtn.addEventListener("click", () => chooseTheme("light"));
    }

    if (document.body) {
      new MutationObserver(syncThemeButtons)
        .observe(document.body, { attributes:true, attributeFilter:["data-theme"] });
    }
    syncThemeButtons();

    const accountStatus = document.querySelector(".main-menu-account-status");
    const accountDot = document.getElementById("menuAccountDot");
    const accountText = document.getElementById("menuAccountStatus");

    function syncAccountState(){
      const signedIn = !!accountDot?.classList.contains("is-signed-in") ||
        /contributor|admin|signed in/i.test(accountText?.textContent || "");
      accountStatus?.classList.toggle("is-signed-in-state", signedIn);
      accountStatus?.classList.toggle("is-readonly-state", !signedIn);
    }

    syncAccountState();
    if (accountDot) {
      new MutationObserver(syncAccountState)
        .observe(accountDot, { attributes:true, attributeFilter:["class"] });
    }
    if (accountText) {
      new MutationObserver(syncAccountState)
        .observe(accountText, { childList:true, subtree:true, characterData:true });
    }

    const menuObserver = new MutationObserver(() => {
      const open = menu.classList.contains("is-open");

      if (open) {
        lockBackgroundScroll();
        if (!menuHistoryActive && !closingFromPopState) {
          history.pushState({ ...(history.state || {}), statArchiveMenuOpen:true }, "", location.href);
          menuHistoryActive = true;
        }
      } else {
        unlockBackgroundScroll();
        if (menuHistoryActive && !closingFromPopState && history.state?.statArchiveMenuOpen) {
          menuHistoryActive = false;
          history.back();
        }
      }
    });
    menuObserver.observe(menu, { attributes:true, attributeFilter:["class"] });

    window.addEventListener("popstate", () => {
      if (!menu.classList.contains("is-open")) {
        menuHistoryActive = false;
        return;
      }

      closingFromPopState = true;
      menuHistoryActive = false;
      window.statArchiveCloseMenu?.();
      unlockBackgroundScroll();
      requestAnimationFrame(() => { closingFromPopState = false; });
    });

    /* Prevent touch/wheel events on the dimmed background from reaching the page. */
    backdrop.addEventListener("touchmove", (event) => {
      if (menu.classList.contains("is-open")) event.preventDefault();
    }, { passive:false });

    backdrop.addEventListener("wheel", (event) => {
      if (menu.classList.contains("is-open")) event.preventDefault();
    }, { passive:false });
  }

  const style = document.createElement("style");
  style.id = "statArchiveMenuPolish";
  style.textContent = `
#mobileMenuLevelSection{display:none;}
html.stat-menu-scroll-locked,body.stat-menu-scroll-locked{
  overflow:hidden !important;
  overscroll-behavior:none !important;
}

.main-menu-backdrop{
  background:rgba(2,6,12,.62) !important;
  backdrop-filter:blur(4px) !important;
  -webkit-backdrop-filter:blur(4px) !important;
}

.main-side-menu.stat-menu-polished{
  --mm-bg:#0d141e;
  --mm-card:#111a25;
  --mm-card-soft:rgba(255,255,255,.018);
  --mm-line:rgba(148,163,184,.17);
  --mm-text:#eef3f8;
  --mm-muted:#8491a2;
  --mm-accent:#5ee7f7;
  --mm-accent-soft:rgba(94,231,247,.10);

  top:18px !important;
  right:18px !important;
  bottom:18px !important;
  left:auto !important;
  width:min(390px,calc(100vw - 36px)) !important;
  height:auto !important;
  max-height:calc(100dvh - 36px) !important;
  padding:20px 18px max(20px,env(safe-area-inset-bottom)) !important;
  overflow-y:auto !important;
  overflow-x:hidden !important;
  overscroll-behavior:contain !important;
  touch-action:pan-y !important;

  background:var(--mm-bg) !important;
  color:var(--mm-text) !important;
  border:1px solid rgba(148,163,184,.22) !important;
  border-radius:22px !important;
  box-shadow:0 28px 80px rgba(0,0,0,.48) !important;

  opacity:0 !important;
  visibility:hidden !important;
  pointer-events:none !important;
  transform:translateY(8px) scale(.995) !important;
  transform-origin:center top !important;
  transition:opacity .16s ease,transform .16s ease,visibility .16s ease !important;
  will-change:opacity,transform;
}

.main-side-menu.stat-menu-polished.is-open{
  opacity:1 !important;
  visibility:visible !important;
  pointer-events:auto !important;
  transform:translateY(0) scale(1) !important;
}

body[data-theme="light"] .main-side-menu.stat-menu-polished{
  --mm-bg:#fbfaf7;
  --mm-card:rgba(255,255,255,.78);
  --mm-card-soft:rgba(75,54,95,.022);
  --mm-line:rgba(75,54,95,.14);
  --mm-text:#27302d;
  --mm-muted:#817d77;
  --mm-accent:#4b365f;
  --mm-accent-soft:rgba(75,54,95,.085);
  border-color:rgba(75,54,95,.15) !important;
  box-shadow:0 24px 70px rgba(58,53,42,.18) !important;
}

.main-side-menu.stat-menu-polished .main-side-menu-head{
  display:flex !important;align-items:flex-start !important;justify-content:space-between !important;
  padding:1px 0 18px !important;margin:0 !important;border:0 !important;
}
.main-side-menu.stat-menu-polished .main-side-menu-brand{display:flex !important;flex-direction:column !important;gap:2px !important;}
.main-side-menu.stat-menu-polished .main-side-menu-brand strong{
  color:var(--mm-text) !important;font:800 24px/1.08 'Plus Jakarta Sans',Inter,sans-serif !important;letter-spacing:-.03em !important;
}
.main-side-menu.stat-menu-polished .main-side-menu-brand span{
  color:var(--mm-muted) !important;font:500 11px/1.2 Inter,sans-serif !important;letter-spacing:.08em !important;text-transform:uppercase !important;
}
.main-side-menu.stat-menu-polished .main-side-menu-close{
  width:40px !important;height:40px !important;border-radius:50% !important;border:1px solid var(--mm-line) !important;
  background:transparent !important;color:var(--mm-text) !important;font-size:18px !important;
}
.main-side-menu.stat-menu-polished .main-menu-section{padding:0 !important;margin:0 0 16px !important;border:0 !important;background:transparent !important;}
.main-side-menu.stat-menu-polished .main-menu-label{
  margin:0 0 7px !important;color:var(--mm-muted) !important;font:500 11.5px/1.2 Inter,sans-serif !important;letter-spacing:0 !important;text-transform:none !important;
}
.main-side-menu.stat-menu-polished .mobile-menu-account-section>.main-menu-label{display:none !important;}

.main-side-menu.stat-menu-polished .main-menu-account-status{
  position:relative !important;display:flex !important;align-items:center !important;min-height:62px !important;
  margin:0 0 9px !important;padding:12px 14px 12px 44px !important;border-radius:14px !important;
  border:1px solid var(--mm-line) !important;background:var(--mm-card-soft) !important;color:var(--mm-text) !important;
  font:500 12.5px/1.42 Inter,sans-serif !important;box-shadow:none !important;
}
.main-side-menu.stat-menu-polished .main-menu-account-status::before{
  content:'▣';position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--mm-muted);font-size:17px;
}
.main-side-menu.stat-menu-polished .main-menu-account-status.is-signed-in-state{
  border-color:color-mix(in srgb,var(--mm-accent) 28%,transparent) !important;background:var(--mm-accent-soft) !important;
}
.main-side-menu.stat-menu-polished .main-menu-account-status.is-signed-in-state::before{color:var(--mm-accent) !important;}
.main-side-menu.stat-menu-polished .main-menu-account-dot{display:none !important;}

.main-side-menu.stat-menu-polished .main-menu-action,
.main-side-menu.stat-menu-polished .main-menu-theme-btn,
.main-side-menu.stat-menu-polished .mobile-menu-level-btn{
  border:1px solid var(--mm-line) !important;background:var(--mm-card) !important;color:var(--mm-text) !important;box-shadow:none !important;
}
.main-side-menu.stat-menu-polished .main-menu-action{
  position:relative !important;width:100% !important;min-height:50px !important;padding:0 14px 0 44px !important;
  border-radius:13px !important;display:flex !important;align-items:center !important;justify-content:space-between !important;
  font:600 12.75px Inter,sans-serif !important;
}
.main-side-menu.stat-menu-polished #menuAuthBtn::before,
.main-side-menu.stat-menu-polished #menuOfflineLibraryBtn::before,
.main-side-menu.stat-menu-polished #menuManualsBtn::before,
.main-side-menu.stat-menu-polished #menuAboutBtn::before{
  position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--mm-muted);font-size:16px;font-weight:500;
}
.main-side-menu.stat-menu-polished #menuAuthBtn::before{content:'↪';}
.main-side-menu.stat-menu-polished #menuOfflineLibraryBtn::before{content:'⇩';}
.main-side-menu.stat-menu-polished #menuManualsBtn::before{content:'▣';}
.main-side-menu.stat-menu-polished #menuAboutBtn::before{content:'ⓘ';}
.main-side-menu.stat-menu-polished .main-menu-arrow{color:var(--mm-muted) !important;font-size:20px !important;}

.main-side-menu.stat-menu-polished .main-menu-theme-row,
.main-side-menu.stat-menu-polished .mobile-menu-level-row{display:grid !important;grid-template-columns:1fr 1fr !important;gap:9px !important;}
.main-side-menu.stat-menu-polished .main-menu-theme-btn,
.main-side-menu.stat-menu-polished .mobile-menu-level-btn{
  min-height:48px !important;border-radius:13px !important;padding:0 10px !important;font:600 12.75px Inter,sans-serif !important;
}
.main-side-menu.stat-menu-polished .main-menu-theme-btn.is-active,
.main-side-menu.stat-menu-polished .main-menu-theme-btn[aria-pressed="true"],
.main-side-menu.stat-menu-polished .mobile-menu-level-btn.is-active{
  background:var(--mm-accent-soft) !important;border-color:color-mix(in srgb,var(--mm-accent) 38%,transparent) !important;color:var(--mm-accent) !important;
}
.main-side-menu.stat-menu-polished #mobileMenuLevelSection{display:block !important;}

.main-side-menu.stat-menu-polished .mobile-menu-library-section .main-menu-side-meta{display:flex !important;align-items:center !important;gap:8px !important;}
.main-side-menu.stat-menu-polished #menuOfflineLibraryCount{
  min-width:25px !important;height:25px !important;padding:0 7px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;
  border-radius:999px !important;background:var(--mm-accent-soft) !important;color:var(--mm-accent) !important;font:700 11px 'JetBrains Mono',monospace !important;
}
.main-side-menu.stat-menu-polished .mobile-menu-manual-section{margin-bottom:0 !important;}
.main-side-menu.stat-menu-polished .mobile-menu-about-section{margin-top:0 !important;}
.main-side-menu.stat-menu-polished .mobile-menu-manual-section .main-menu-action{border-radius:13px 13px 0 0 !important;border-bottom:0 !important;}
.main-side-menu.stat-menu-polished .mobile-menu-about-section .main-menu-action{border-radius:0 0 13px 13px !important;}
.main-side-menu.stat-menu-polished .main-menu-footer{
  margin-top:20px !important;padding:15px 4px 2px !important;border-top:1px solid var(--mm-line) !important;text-align:center !important;color:var(--mm-muted) !important;
}
.main-side-menu.stat-menu-polished .main-menu-footer strong{color:var(--mm-text) !important;font-size:10.5px !important;}
.main-side-menu.stat-menu-polished .main-menu-footer span{font-size:10px !important;}

@media(max-width:700px){
  .main-side-menu.stat-menu-polished{
    top:12px !important;right:12px !important;bottom:12px !important;left:12px !important;
    width:auto !important;max-width:none !important;height:auto !important;max-height:calc(100dvh - 24px) !important;
    padding:18px 16px max(18px,env(safe-area-inset-bottom)) !important;border-radius:20px !important;
  }
}
`;
  document.head.appendChild(style);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenuPolish, { once:true });
  } else {
    initMenuPolish();
  }
})();
