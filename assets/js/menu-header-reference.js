/* Stat Archive — compact fixed Menu header v2
   Uses the same structure as Offline Library: the header never scrolls;
   only the Menu body beneath it owns vertical scrolling. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_HEADER_V2__) return;
  window.__STAT_ARCHIVE_MENU_HEADER_V2__ = "2";

  const archiveIcon = `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 24.5h18" />
      <rect x="8.5" y="16.5" width="4.5" height="8" rx="1" />
      <rect x="14.2" y="9" width="4.5" height="15.5" rx="1" />
      <rect x="20" y="13" width="4.5" height="11.5" rx="1" />
    </svg>`;

  function installStyle() {
    document.getElementById("statArchiveReferenceMenuHeaderStyle")?.remove();

    const style = document.createElement("style");
    style.id = "statArchiveReferenceMenuHeaderStyle";
    style.textContent = `
/* The Menu itself is no longer the scroller. This mirrors Offline Library:
   fixed header + one dedicated scroll area below it. */
#mainSideMenu{
  display:flex !important;
  flex-direction:column !important;
  overflow:hidden !important;
}

#mainSideMenu > .stat-menu-reference-head{
  position:relative !important;
  inset:auto !important;
  flex:0 0 auto !important;
  z-index:20 !important;
  width:100% !important;
  min-height:78px !important;
  margin:0 !important;
  padding:14px 15px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) 40px !important;
  align-items:center !important;
  gap:12px !important;
  border:0 !important;
  border-bottom:1px solid rgba(148,163,184,.13) !important;
  border-radius:0 !important;
  background:rgba(13,20,30,.98) !important;
  box-shadow:none !important;
  backdrop-filter:blur(14px) !important;
  -webkit-backdrop-filter:blur(14px) !important;
  box-sizing:border-box !important;
}

#mainSideMenu > .stat-menu-scroll-body{
  flex:1 1 auto !important;
  min-height:0 !important;
  width:100% !important;
  overflow-x:hidden !important;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch !important;
  overscroll-behavior-y:contain !important;
  scrollbar-width:thin;
}

#mainSideMenu .stat-menu-reference-brand{
  min-width:0 !important;
  display:grid !important;
  grid-template-columns:42px minmax(0,1fr) !important;
  align-items:center !important;
  gap:11px !important;
}

#mainSideMenu .stat-menu-reference-icon{
  width:42px !important;
  height:42px !important;
  display:grid !important;
  place-items:center !important;
  border:1px solid rgba(94,231,247,.13) !important;
  border-radius:12px !important;
  background:linear-gradient(145deg,rgba(94,231,247,.10),rgba(94,231,247,.045)) !important;
  color:#69dbe9 !important;
  box-shadow:inset 0 1px rgba(255,255,255,.035) !important;
}

#mainSideMenu .stat-menu-reference-icon svg{
  width:24px !important;
  height:24px !important;
  fill:none !important;
  stroke:currentColor !important;
  stroke-width:2.25 !important;
  stroke-linecap:round !important;
  stroke-linejoin:round !important;
}

#mainSideMenu .stat-menu-reference-copy{
  min-width:0 !important;
  display:flex !important;
  flex-direction:column !important;
  align-items:flex-start !important;
  justify-content:center !important;
  gap:2px !important;
}

#mainSideMenu .stat-menu-reference-title{
  margin:0 !important;
  padding:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
  color:#f4f7fb !important;
  font:750 22px/1.08 'Plus Jakarta Sans',Inter,sans-serif !important;
  letter-spacing:-.035em !important;
  text-transform:none !important;
}

#mainSideMenu .stat-menu-reference-kicker{
  margin:0 !important;
  padding:0 !important;
  color:#79879a !important;
  font:600 9.5px/1.2 'JetBrains Mono',Inter,sans-serif !important;
  letter-spacing:.10em !important;
  text-transform:uppercase !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  position:static !important;
  inset:auto !important;
  transform:none !important;
  justify-self:end !important;
  align-self:center !important;
  width:38px !important;
  height:38px !important;
  min-width:38px !important;
  min-height:38px !important;
  margin:0 !important;
  padding:0 !important;
  display:grid !important;
  place-items:center !important;
  border:1px solid rgba(148,163,184,.17) !important;
  border-radius:12px !important;
  background:rgba(255,255,255,.018) !important;
  color:#aab5c5 !important;
  font:400 23px/1 Inter,sans-serif !important;
  box-shadow:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible{
  border-color:rgba(94,231,247,.30) !important;
  background:rgba(94,231,247,.055) !important;
  color:#edf8fa !important;
  outline:none !important;
}

body[data-theme="light"] #mainSideMenu > .stat-menu-reference-head{
  border-bottom-color:rgba(75,54,95,.10) !important;
  background:rgba(250,249,246,.985) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-icon{
  border-color:rgba(75,54,95,.10) !important;
  background:linear-gradient(145deg,rgba(75,54,95,.075),rgba(75,54,95,.035)) !important;
  color:#5c4771 !important;
  box-shadow:inset 0 1px rgba(255,255,255,.7) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-title{color:#27302d !important;}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-kicker{color:#8b8580 !important;}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  border-color:rgba(75,54,95,.12) !important;
  background:rgba(255,255,255,.58) !important;
  color:#69645f !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible{
  border-color:rgba(75,54,95,.23) !important;
  background:rgba(75,54,95,.05) !important;
  color:#27302d !important;
}

@media(max-width:700px){
  #mainSideMenu > .stat-menu-reference-head{
    min-height:72px !important;
    padding:12px 13px !important;
    grid-template-columns:minmax(0,1fr) 38px !important;
    gap:10px !important;
  }
  #mainSideMenu .stat-menu-reference-brand{
    grid-template-columns:38px minmax(0,1fr) !important;
    gap:10px !important;
  }
  #mainSideMenu .stat-menu-reference-icon{
    width:38px !important;
    height:38px !important;
    border-radius:11px !important;
  }
  #mainSideMenu .stat-menu-reference-icon svg{
    width:22px !important;
    height:22px !important;
  }
  #mainSideMenu .stat-menu-reference-title{font-size:20px !important;}
  #mainSideMenu .stat-menu-reference-kicker{font-size:8.5px !important;}
  #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
    width:36px !important;
    height:36px !important;
    min-width:36px !important;
    min-height:36px !important;
    border-radius:11px !important;
    font-size:21px !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function ensureScrollBody(menu, head) {
    let body = Array.from(menu.children).find(el => el.classList?.contains("stat-menu-scroll-body"));
    if (!body) {
      body = document.createElement("div");
      body.className = "stat-menu-scroll-body";

      /* Move existing Menu content, not the header, into the dedicated scroller.
         Existing nodes/listeners are preserved because nodes are moved, not cloned. */
      const content = Array.from(menu.children).filter(el => el !== head && el !== body);
      content.forEach(el => body.appendChild(el));
      menu.appendChild(body);
    }
    return body;
  }

  function buildHeader() {
    const menu = document.getElementById("mainSideMenu");
    const close = document.getElementById("mainMenuCloseBtn");
    if (!menu || !close) return false;

    let head = close.parentElement;
    if (!head || head === menu || head.classList.contains("stat-menu-scroll-body")) {
      head = document.createElement("div");
      menu.insertBefore(head, menu.firstChild);
      head.appendChild(close);
    }

    /* Restore a clean compact header even if v1 already decorated this DOM. */
    Array.from(head.children).forEach(child => {
      if (child !== close) child.remove();
    });

    head.className = "stat-menu-reference-head";
    head.dataset.statReferenceHeader = "2";

    const brand = document.createElement("div");
    brand.className = "stat-menu-reference-brand";
    brand.innerHTML = `
      <span class="stat-menu-reference-icon">${archiveIcon}</span>
      <span class="stat-menu-reference-copy">
        <strong class="stat-menu-reference-title">Stat Archive</strong>
        <span class="stat-menu-reference-kicker">Menu</span>
      </span>`;

    head.insertBefore(brand, close);
    close.textContent = "×";

    if (menu.firstElementChild !== head) menu.insertBefore(head, menu.firstElementChild);
    ensureScrollBody(menu, head);
    return true;
  }

  function init() {
    installStyle();
    if (buildHeader()) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (buildHeader() || tries >= 40) clearInterval(timer);
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else {
    init();
  }
})();
