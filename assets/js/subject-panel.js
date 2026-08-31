/* application section */

document.addEventListener("pointerdown", (e) => {
  const panel = document.getElementById("subjectFilterExpanded");
  if (!panel || !panel.classList.contains("open")) return;
  const row = document.getElementById("subjectFilterRow");
  if (row && row.contains(e.target)) return;

  panel.remove();
  const more = row?.querySelector(".subject-more-pill");
  if (more) more.textContent = "More";
}, {passive:true});

/* Desktop hero visual polish. Injected here so it loads after the CSS files
   and cleanly wins over the older desktop hero experiments. */
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

  .hero-probability .axis-mid{
    bottom:1px !important;
  }

  .main-menu-btn{
    top:34px !important;
    right:66px !important;
    background:
      linear-gradient(145deg, rgba(18,28,40,.34), rgba(8,14,22,.22)) !important;
    border:1px solid rgba(148,163,184,.20) !important;
    color:#f5f7fb !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      0 6px 16px rgba(0,0,0,.055) !important;
  }

  .main-menu-btn:hover{
    background:
      linear-gradient(145deg, rgba(25,38,52,.42), rgba(10,18,28,.28)) !important;
    border-color:rgba(94,231,247,.28) !important;
    color:#ffffff !important;
  }

  body[data-theme="light"] .hero-probability{
    background:
      radial-gradient(circle at 52% 58%, rgba(52,125,115,.055), transparent 52%),
      linear-gradient(145deg, rgba(255,255,255,.42), rgba(244,240,230,.22)) !important;
    border-color:rgba(67,73,69,.14) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.68),
      inset 0 0 0 1px rgba(52,125,115,.025),
      0 9px 22px rgba(58,53,42,.045) !important;
  }

  body[data-theme="light"] .main-menu-btn{
    background:
      linear-gradient(145deg, rgba(255,255,255,.48), rgba(244,240,230,.28)) !important;
    border-color:rgba(67,73,69,.14) !important;
    color:#4b365f !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.62),
      0 5px 14px rgba(58,53,42,.035) !important;
  }

  body[data-theme="light"] .main-menu-btn:hover{
    background:
      linear-gradient(145deg, rgba(255,255,255,.62), rgba(244,240,230,.38)) !important;
    border-color:rgba(52,125,115,.24) !important;
    color:#4b365f !important;
  }
}

@media (max-width:700px){
  .hero-probability .curve-note.note-one{
    display:none !important;
  }
}
`;
  document.head.appendChild(style);
})();

/* Mobile side-menu redesign + course level controls. */
(() => {
  function initMobileMenuPolish(){
    const menu = document.getElementById("mainSideMenu");
    if (!menu) return;

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

      if (appearanceSection?.parentNode) {
        appearanceSection.parentNode.insertBefore(levelSection, appearanceSection.nextSibling);
      } else {
        menu.appendChild(levelSection);
      }
    }

    const mscMenuBtn = document.getElementById("menuMscLevelBtn");
    const bscMenuBtn = document.getElementById("menuBscLevelBtn");
    const mscSourceBtn = document.getElementById("levelMscBtn");
    const bscSourceBtn = document.getElementById("levelBscBtn");

    function syncLevelButtons(){
      let current = "";
      if (mscSourceBtn?.getAttribute("aria-pressed") === "true") current = "msc";
      if (bscSourceBtn?.getAttribute("aria-pressed") === "true") current = "bsc";
      if (!current) {
        current = new URLSearchParams(location.search).get("level") || "msc";
      }
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
      const observer = new MutationObserver(syncLevelButtons);
      if (mscSourceBtn) observer.observe(mscSourceBtn, {attributes:true, attributeFilter:["aria-pressed"]});
      if (bscSourceBtn) observer.observe(bscSourceBtn, {attributes:true, attributeFilter:["aria-pressed"]});
    }

    syncLevelButtons();
  }

  const style = document.createElement("style");
  style.id = "statArchiveMobileMenuPolish";
  style.textContent = `
#mobileMenuLevelSection{display:none;}

@media(max-width:700px){
  .main-side-menu{
    --mm-bg:#0b1119;
    --mm-card:#111923;
    --mm-card-soft:rgba(255,255,255,.025);
    --mm-line:rgba(148,163,184,.16);
    --mm-text:#f1f5f9;
    --mm-muted:#8290a3;
    --mm-accent:#5ee7f7;
    --mm-accent-soft:rgba(94,231,247,.11);

    width:min(392px,94vw) !important;
    max-width:none !important;
    height:100dvh !important;
    padding:max(18px,env(safe-area-inset-top)) 18px max(22px,env(safe-area-inset-bottom)) !important;
    overflow-y:auto !important;
    background:var(--mm-bg) !important;
    color:var(--mm-text) !important;
    border-left:1px solid var(--mm-line) !important;
    box-shadow:-22px 0 60px rgba(0,0,0,.32) !important;
  }

  body[data-theme="light"] .main-side-menu{
    --mm-bg:#fbfaf7;
    --mm-card:rgba(255,255,255,.82);
    --mm-card-soft:rgba(75,54,95,.025);
    --mm-line:rgba(75,54,95,.14);
    --mm-text:#27302d;
    --mm-muted:#817d77;
    --mm-accent:#4b365f;
    --mm-accent-soft:rgba(75,54,95,.09);
    box-shadow:-18px 0 54px rgba(58,53,42,.16) !important;
  }

  .main-side-menu-head{
    display:flex !important;
    align-items:flex-start !important;
    justify-content:space-between !important;
    padding:2px 0 20px !important;
    margin:0 !important;
    border:0 !important;
  }

  .main-side-menu-brand{display:flex !important;flex-direction:column !important;gap:3px !important;}
  .main-side-menu-brand strong{
    color:var(--mm-text) !important;
    font:800 29px/1.05 'Plus Jakarta Sans',Inter,sans-serif !important;
    letter-spacing:-.035em !important;
  }
  .main-side-menu-brand span{
    color:var(--mm-muted) !important;
    font:500 14px/1.2 Inter,sans-serif !important;
  }

  .main-side-menu-close{
    width:42px !important;
    height:42px !important;
    border-radius:50% !important;
    border:1px solid var(--mm-line) !important;
    background:transparent !important;
    color:var(--mm-text) !important;
    font-size:19px !important;
  }

  .main-menu-section{
    padding:0 !important;
    margin:0 0 19px !important;
    border:0 !important;
    background:transparent !important;
  }

  .main-menu-label{
    margin:0 0 8px !important;
    color:var(--mm-muted) !important;
    font:500 13px/1.2 Inter,sans-serif !important;
    letter-spacing:0 !important;
    text-transform:none !important;
  }

  .mobile-menu-account-section > .main-menu-label{display:none !important;}

  .main-menu-account-status{
    position:relative !important;
    display:flex !important;
    align-items:center !important;
    min-height:72px !important;
    margin:0 0 11px !important;
    padding:14px 15px 14px 48px !important;
    border-radius:15px !important;
    border:1px solid color-mix(in srgb,var(--mm-accent) 28%,transparent) !important;
    background:var(--mm-accent-soft) !important;
    color:var(--mm-text) !important;
    font:500 14px/1.45 Inter,sans-serif !important;
  }
  .main-menu-account-status::before{
    content:'▣';
    position:absolute;left:17px;top:50%;transform:translateY(-50%);
    color:var(--mm-accent);font-size:19px;
  }
  .main-menu-account-dot{display:none !important;}

  .main-menu-action,
  .main-menu-theme-btn,
  .mobile-menu-level-btn{
    border:1px solid var(--mm-line) !important;
    background:var(--mm-card) !important;
    color:var(--mm-text) !important;
    box-shadow:none !important;
  }

  .main-menu-action{
    position:relative !important;
    width:100% !important;
    min-height:56px !important;
    padding:0 16px 0 48px !important;
    border-radius:14px !important;
    display:flex !important;
    align-items:center !important;
    justify-content:space-between !important;
    font:600 14px Inter,sans-serif !important;
  }

  #menuAuthBtn::before,#menuOfflineLibraryBtn::before,#menuManualsBtn::before,#menuAboutBtn::before{
    position:absolute;left:17px;top:50%;transform:translateY(-50%);
    color:var(--mm-muted);font-size:18px;font-weight:500;
  }
  #menuAuthBtn::before{content:'↪';}
  #menuOfflineLibraryBtn::before{content:'⇩';}
  #menuManualsBtn::before{content:'▣';}
  #menuAboutBtn::before{content:'ⓘ';}

  .main-menu-arrow{color:var(--mm-muted) !important;font-size:22px !important;}

  .main-menu-theme-row,.mobile-menu-level-row{
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
    gap:10px !important;
  }

  .main-menu-theme-btn,.mobile-menu-level-btn{
    min-height:54px !important;
    border-radius:14px !important;
    padding:0 12px !important;
    font:600 14px Inter,sans-serif !important;
  }

  .main-menu-theme-btn[aria-pressed="true"],
  .mobile-menu-level-btn.is-active{
    background:var(--mm-accent-soft) !important;
    border-color:color-mix(in srgb,var(--mm-accent) 38%,transparent) !important;
    color:var(--mm-accent) !important;
  }

  #mobileMenuLevelSection{display:block !important;}

  .mobile-menu-library-section .main-menu-side-meta{display:flex !important;align-items:center !important;gap:9px !important;}
  #menuOfflineLibraryCount{
    min-width:28px !important;height:28px !important;padding:0 8px !important;
    display:inline-flex !important;align-items:center !important;justify-content:center !important;
    border-radius:999px !important;background:var(--mm-accent-soft) !important;
    color:var(--mm-accent) !important;font:700 12px 'JetBrains Mono',monospace !important;
  }

  .mobile-menu-manual-section{margin-bottom:0 !important;}
  .mobile-menu-about-section{margin-top:0 !important;}
  .mobile-menu-manual-section .main-menu-action{
    border-radius:14px 14px 0 0 !important;border-bottom:0 !important;
  }
  .mobile-menu-about-section .main-menu-action{
    border-radius:0 0 14px 14px !important;
  }

  .main-menu-footer{
    margin-top:25px !important;
    padding:18px 4px 4px !important;
    border-top:1px solid var(--mm-line) !important;
    text-align:center !important;
    color:var(--mm-muted) !important;
  }
  .main-menu-footer strong{color:var(--mm-text) !important;font-size:12px !important;}
  .main-menu-footer span{font-size:11px !important;}
}
`;
  document.head.appendChild(style);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileMenuPolish, {once:true});
  } else {
    initMobileMenuPolish();
  }
})();
