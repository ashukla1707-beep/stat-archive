/* Stat Archive — compact fixed Menu header v4
   Header is fixed inside the Menu panel; only the body below it scrolls. */
(() => {
  "use strict";

  if (window.__STAT_ARCHIVE_MENU_HEADER_V4__) return;
  window.__STAT_ARCHIVE_MENU_HEADER_V4__ = "4";

  function installStyle() {
    document.getElementById("statArchiveReferenceMenuHeaderStyle")?.remove();

    const style = document.createElement("style");
    style.id = "statArchiveReferenceMenuHeaderStyle";
    style.textContent = `
/* Remove the old Menu padding from around the fixed header. The spacing now
   belongs to the scroll body, exactly like Offline Library. */
#mainSideMenu{
  display:flex !important;
  flex-direction:column !important;
  overflow:hidden !important;
  padding:0 !important;
  box-sizing:border-box !important;
}

#mainSideMenu > .stat-menu-reference-head{
  position:relative !important;
  inset:auto !important;
  flex:0 0 auto !important;
  z-index:20 !important;
  width:100% !important;
  min-height:72px !important;
  margin:0 !important;
  padding:11px 16px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) 36px !important;
  align-items:center !important;
  gap:12px !important;
  border:0 !important;
  border-bottom:1px solid rgba(148,163,184,.12) !important;
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
  margin:0 !important;
  padding:14px 18px 24px !important;
  overflow-x:hidden !important;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch !important;
  overscroll-behavior-y:contain !important;
  scrollbar-width:thin;
  box-sizing:border-box !important;
}

#mainSideMenu .stat-menu-reference-brand{
  position:relative !important;
  min-width:0 !important;
  display:flex !important;
  flex-direction:column !important;
  align-items:flex-start !important;
  justify-content:center !important;
  gap:2px !important;
  padding-left:12px !important;
}

#mainSideMenu .stat-menu-reference-brand::before{
  content:"" !important;
  position:absolute !important;
  left:0 !important;
  top:5px !important;
  bottom:5px !important;
  width:2px !important;
  border-radius:999px !important;
  background:rgba(94,231,247,.78) !important;
}

#mainSideMenu .stat-menu-reference-kicker{
  order:1 !important;
  margin:0 !important;
  padding:0 !important;
  color:#6fa9b8 !important;
  font:700 11px/1.15 'JetBrains Mono',Inter,sans-serif !important;
  letter-spacing:.12em !important;
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
  color:#f4f7fb !important;
  font:750 20px/1.08 'Plus Jakarta Sans',Inter,sans-serif !important;
  letter-spacing:-.035em !important;
  text-transform:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  position:static !important;
  inset:auto !important;
  transform:none !important;
  justify-self:end !important;
  align-self:center !important;
  width:34px !important;
  height:34px !important;
  min-width:34px !important;
  min-height:34px !important;
  margin:0 !important;
  padding:0 !important;
  display:grid !important;
  place-items:center !important;
  border:1px solid rgba(148,163,184,.15) !important;
  border-radius:50% !important;
  background:rgba(255,255,255,.012) !important;
  color:#9eabba !important;
  font:350 22px/1 Inter,sans-serif !important;
  box-shadow:none !important;
}

#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:hover,
#mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn:focus-visible{
  border-color:rgba(94,231,247,.28) !important;
  background:rgba(94,231,247,.045) !important;
  color:#eef8fa !important;
  outline:none !important;
}

body[data-theme="light"] #mainSideMenu > .stat-menu-reference-head{
  border-bottom-color:rgba(75,54,95,.09) !important;
  background:rgba(250,249,246,.99) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-brand::before{
  background:rgba(75,54,95,.58) !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-kicker{
  color:#77658a !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-title{
  color:#27302d !important;
}
body[data-theme="light"] #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
  border-color:rgba(75,54,95,.11) !important;
  background:rgba(255,255,255,.48) !important;
  color:#726c67 !important;
}

@media(max-width:700px){
  #mainSideMenu > .stat-menu-reference-head{
    min-height:68px !important;
    padding:10px 13px !important;
    grid-template-columns:minmax(0,1fr) 34px !important;
    gap:10px !important;
  }
  #mainSideMenu > .stat-menu-scroll-body{
    padding:12px 18px 22px !important;
  }
  #mainSideMenu .stat-menu-reference-brand{
    gap:2px !important;
    padding-left:11px !important;
  }
  #mainSideMenu .stat-menu-reference-brand::before{
    top:5px !important;
    bottom:5px !important;
    width:2px !important;
  }
  #mainSideMenu .stat-menu-reference-kicker{
    font-size:10px !important;
  }
  #mainSideMenu .stat-menu-reference-title{
    font-size:19px !important;
  }
  #mainSideMenu .stat-menu-reference-head #mainMenuCloseBtn{
    width:32px !important;
    height:32px !important;
    min-width:32px !important;
    min-height:32px !important;
    font-size:20px !important;
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
    head.dataset.statReferenceHeader = "4";

    const brand = document.createElement("div");
    brand.className = "stat-menu-reference-brand";
    brand.innerHTML = `
      <span class="stat-menu-reference-kicker">Menu</span>
      <strong class="stat-menu-reference-title">Stat Archive</strong>`;

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
