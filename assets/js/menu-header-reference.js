/* Stat Archive — reference-style sticky Menu header */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_REFERENCE_HEADER__) return;
  window.__STAT_ARCHIVE_MENU_REFERENCE_HEADER__ = "1";

  const chartIcon = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M9 36.5h30" />
      <rect x="11" y="24" width="7" height="12" rx="1.5" />
      <rect x="21" y="14" width="7" height="22" rx="1.5" />
      <rect x="31" y="20" width="7" height="16" rx="1.5" />
    </svg>`;

  function installStyle() {
    document.getElementById("statArchiveReferenceMenuHeaderStyle")?.remove();

    const style = document.createElement("style");
    style.id = "statArchiveReferenceMenuHeaderStyle";
    style.textContent = `
#mainSideMenu{
  overflow-y:auto !important;
  overflow-x:hidden !important;
  -webkit-overflow-scrolling:touch !important;
}

#mainSideMenu .stat-menu-reference-head{
  position:sticky !important;
  top:0 !important;
  z-index:120 !important;
  width:100% !important;
  min-height:126px !important;
  margin:0 !important;
  padding:22px 22px 20px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) 54px !important;
  align-items:center !important;
  gap:14px !important;
  border:0 !important;
  border-bottom:1px solid rgba(148,163,184,.16) !important;
  border-radius:0 !important;
  background:rgba(13,20,30,.985) !important;
  box-shadow:0 8px 22px rgba(0,0,0,.10) !important;
  backdrop-filter:blur(18px) !important;
  -webkit-backdrop-filter:blur(18px) !important;
  box-sizing:border-box !important;
}

#mainSideMenu .stat-menu-reference-brand{
  min-width:0 !important;
  display:grid !important;
  grid-template-columns:58px minmax(0,1fr) !important;
  align-items:center !important;
  gap:17px !important;
}

#mainSideMenu .stat-menu-reference-icon{
  width:58px !important;
  height:58px !important;
  display:grid !important;
  place-items:center !important;
  flex:0 0 58px !important;
  border:1px solid rgba(94,231,247,.18) !important;
  border-radius:18px !important;
  background:rgba(45,117,177,.16) !important;
  color:#68dfee !important;
  box-shadow:none !important;
}

#mainSideMenu .stat-menu-reference-icon svg{
  width:34px !important;
  height:34px !important;
  fill:none !important;
  stroke:currentColor !important;
  stroke-width:3 !important;
  stroke-linecap:round !important;
  stroke-linejoin:round !important;
}

#mainSideMenu .stat-menu-reference-copy{
  min-width:0 !important;
  display:flex !important;
  flex-direction:column !important;
  align-items:flex-start !important;
  justify-content:center !important;
  gap:5px !important;
}

#mainSideMenu .stat-menu-reference-title{
  margin:0 !important;
  padding:0 !important;
  color:#f5f7fb !important;
  font:800 30px/1.03 'Plus Jakarta Sans',Inter,sans-serif !important;
  letter-spacing:-.045em !important;
  white-space:nowrap !important;
  text-transform:none !important;
}

#mainSideMenu .stat-menu-reference-kicker{
  margin:0 !important;
  padding:0 !important;
  color:#8b97aa !important;
  font:500 13px/1.1 Inter,sans-serif !important;
  letter-spacing:.12em !important;
  text-transform:uppercase !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  position:static !important;
  inset:auto !important;
  transform:none !important;
  justify-self:end !important;
  align-self:center !important;
  width:52px !important;
  height:52px !important;
  min-width:52px !important;
  min-height:52px !important;
  margin:0 !important;
  padding:0 !important;
  display:grid !important;
  place-items:center !important;
  border:1px solid rgba(148,163,184,.22) !important;
  border-radius:50% !important;
  background:rgba(255,255,255,.02) !important;
  color:#e7edf5 !important;
  font:300 32px/1 Inter,sans-serif !important;
  box-shadow:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover{
  border-color:rgba(94,231,247,.38) !important;
  background:rgba(94,231,247,.055) !important;
  color:#fff !important;
}

body[data-theme="light"] #mainSideMenu .stat-menu-reference-head{
  border-bottom-color:rgba(75,54,95,.13) !important;
  background:rgba(251,250,247,.985) !important;
  box-shadow:0 8px 20px rgba(58,53,42,.055) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-icon{
  border-color:rgba(36,92,158,.08) !important;
  background:#dcecff !important;
  color:#245c9e !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-title{color:#111 !important;}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-kicker{color:#8e8b86 !important;}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  border-color:rgba(39,48,45,.16) !important;
  background:rgba(255,255,255,.70) !important;
  color:#111 !important;
}

@media(max-width:700px){
  #mainSideMenu .stat-menu-reference-head{
    min-height:116px !important;
    padding:18px 18px 17px !important;
    grid-template-columns:minmax(0,1fr) 48px !important;
    gap:12px !important;
  }
  #mainSideMenu .stat-menu-reference-brand{
    grid-template-columns:52px minmax(0,1fr) !important;
    gap:14px !important;
  }
  #mainSideMenu .stat-menu-reference-icon{
    width:52px !important;
    height:52px !important;
    flex-basis:52px !important;
    border-radius:16px !important;
  }
  #mainSideMenu .stat-menu-reference-icon svg{
    width:30px !important;
    height:30px !important;
  }
  #mainSideMenu .stat-menu-reference-title{
    font-size:27px !important;
    letter-spacing:-.04em !important;
  }
  #mainSideMenu .stat-menu-reference-kicker{
    font-size:11px !important;
    letter-spacing:.12em !important;
  }
  #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
    width:46px !important;
    height:46px !important;
    min-width:46px !important;
    min-height:46px !important;
    font-size:28px !important;
  }
}

@media(max-width:360px){
  #mainSideMenu .stat-menu-reference-head{
    padding-left:15px !important;
    padding-right:15px !important;
  }
  #mainSideMenu .stat-menu-reference-brand{
    grid-template-columns:48px minmax(0,1fr) !important;
    gap:11px !important;
  }
  #mainSideMenu .stat-menu-reference-icon{
    width:48px !important;
    height:48px !important;
  }
  #mainSideMenu .stat-menu-reference-title{font-size:24px !important;}
}
`;
    document.head.appendChild(style);
  }

  function buildReferenceHeader() {
    const menu = document.getElementById("mainSideMenu");
    const close = document.getElementById("mainMenuCloseBtn");
    if (!menu || !close) return false;

    let head = close.parentElement;
    if (!head || head === menu) {
      head = document.createElement("div");
      menu.insertBefore(head, menu.firstChild);
      head.appendChild(close);
    }

    if (head.dataset.statReferenceHeader !== "1") {
      Array.from(head.children).forEach(child => {
        if (child !== close) child.remove();
      });

      head.className = "stat-menu-reference-head";
      head.dataset.statReferenceHeader = "1";

      const brand = document.createElement("div");
      brand.className = "stat-menu-reference-brand";
      brand.innerHTML = `
        <span class="stat-menu-reference-icon">${chartIcon}</span>
        <span class="stat-menu-reference-copy">
          <strong class="stat-menu-reference-title">Stat archive</strong>
          <span class="stat-menu-reference-kicker">MENU</span>
        </span>`;

      head.insertBefore(brand, close);
      close.textContent = "×";
    }

    return true;
  }

  function init() {
    installStyle();
    if (buildReferenceHeader()) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (buildReferenceHeader() || tries >= 40) clearInterval(timer);
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else {
    init();
  }
})();
