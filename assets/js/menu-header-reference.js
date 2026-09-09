/* Stat Archive — simple fixed Menu header v3
   Fixed header + dedicated scroll body, matching the Offline Library structure. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_HEADER_V3__) return;
  window.__STAT_ARCHIVE_MENU_HEADER_V3__ = "3";

  function installStyle() {
    document.getElementById("statArchiveReferenceMenuHeaderStyle")?.remove();

    const style = document.createElement("style");
    style.id = "statArchiveReferenceMenuHeaderStyle";
    style.textContent = `
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
  min-height:96px !important;
  margin:0 !important;
  padding:17px 18px 16px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) 46px !important;
  align-items:center !important;
  gap:16px !important;
  border:0 !important;
  border-bottom:1px solid rgba(148,163,184,.13) !important;
  border-radius:0 !important;
  background:rgba(13,20,30,.985) !important;
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
  position:relative !important;
  min-width:0 !important;
  display:flex !important;
  flex-direction:column !important;
  align-items:flex-start !important;
  justify-content:center !important;
  gap:5px !important;
  padding-left:16px !important;
}

#mainSideMenu .stat-menu-reference-brand::before{
  content:"" !important;
  position:absolute !important;
  left:0 !important;
  top:2px !important;
  bottom:2px !important;
  width:3px !important;
  border-radius:999px !important;
  background:#4da3ff !important;
}

#mainSideMenu .stat-menu-reference-kicker{
  order:1 !important;
  margin:0 !important;
  padding:0 !important;
  color:#63aef6 !important;
  font:700 10px/1.1 'JetBrains Mono',Inter,sans-serif !important;
  letter-spacing:.13em !important;
  text-transform:uppercase !important;
}

#mainSideMenu .stat-menu-reference-title{
  order:2 !important;
  margin:0 !important;
  padding:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
  color:#f5f7fb !important;
  font:750 28px/1.02 'Plus Jakarta Sans',Inter,sans-serif !important;
  letter-spacing:-.045em !important;
  text-transform:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  position:static !important;
  inset:auto !important;
  transform:none !important;
  justify-self:end !important;
  align-self:center !important;
  width:44px !important;
  height:44px !important;
  min-width:44px !important;
  min-height:44px !important;
  margin:0 !important;
  padding:0 !important;
  display:grid !important;
  place-items:center !important;
  border:1px solid rgba(148,163,184,.20) !important;
  border-radius:50% !important;
  background:transparent !important;
  color:#d6dde7 !important;
  font:300 27px/1 Inter,sans-serif !important;
  box-shadow:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible{
  border-color:rgba(94,231,247,.32) !important;
  background:rgba(94,231,247,.045) !important;
  color:#fff !important;
  outline:none !important;
}

body[data-theme="light"] #mainSideMenu > .stat-menu-reference-head{
  border-bottom-color:rgba(75,54,95,.10) !important;
  background:rgba(250,249,246,.988) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-brand::before{
  background:#2f86db !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-kicker{
  color:#2869a5 !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-title{
  color:#151515 !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  border-color:rgba(39,48,45,.16) !important;
  background:rgba(255,255,255,.42) !important;
  color:#171717 !important;
}

@media(max-width:700px){
  #mainSideMenu > .stat-menu-reference-head{
    min-height:88px !important;
    padding:14px 14px 13px !important;
    grid-template-columns:minmax(0,1fr) 42px !important;
    gap:12px !important;
  }
  #mainSideMenu .stat-menu-reference-brand{
    gap:4px !important;
    padding-left:13px !important;
  }
  #mainSideMenu .stat-menu-reference-brand::before{
    width:3px !important;
  }
  #mainSideMenu .stat-menu-reference-kicker{
    font-size:9px !important;
  }
  #mainSideMenu .stat-menu-reference-title{
    font-size:25px !important;
  }
  #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
    width:40px !important;
    height:40px !important;
    min-width:40px !important;
    min-height:40px !important;
    font-size:25px !important;
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

    Array.from(head.children).forEach(child => {
      if (child !== close) child.remove();
    });

    head.className = "stat-menu-reference-head";
    head.dataset.statReferenceHeader = "3";

    const brand = document.createElement("div");
    brand.className = "stat-menu-reference-brand";
    brand.innerHTML = `
      <span class="stat-menu-reference-kicker">Menu</span>
      <strong class="stat-menu-reference-title">Stat archive</strong>`;

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
