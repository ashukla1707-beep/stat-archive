/* Stat Archive menu polish: account status icon, compact support panel, and rate action. */
(() => {
  const PLAY_PACKAGE = 'com.statarchive.app';
  const PLAY_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;

  const icons = {
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M4.8 20c.9-3.4 3.4-5.3 7.2-5.3s6.3 1.9 7.2 5.3"></path></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H20v17H7.8A2.8 2.8 0 0 0 5 21.8V4.8Z"></path><path d="M5 19a2.8 2.8 0 0 1 2.8-2.8H20"></path></svg>`,
    info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 10.5v6"></path><path d="M12 7.2h.01"></path></svg>`,
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"></path></svg>`
  };

  function installStyles() {
    if (document.getElementById('statArchiveMenuPolishStyle')) return;
    const style = document.createElement('style');
    style.id = 'statArchiveMenuPolishStyle';
    style.textContent = `
/* Account status: replace the glowing square with a clear profile state. */
.main-menu-account-status{gap:12px !important;}
.main-menu-account-dot.stat-account-icon{
  width:38px !important;height:38px !important;min-width:38px !important;
  display:grid !important;place-items:center !important;position:relative !important;
  border-radius:12px !important;border:1px solid rgba(148,163,184,.18) !important;
  background:rgba(148,163,184,.07) !important;color:var(--muted) !important;
  box-shadow:none !important;
}
.main-menu-account-dot.stat-account-icon svg{
  width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round;
}
.main-menu-account-dot.stat-account-icon.is-signed-in{
  color:var(--green) !important;background:rgba(74,222,165,.08) !important;
  border-color:rgba(74,222,165,.28) !important;box-shadow:none !important;
}
.main-menu-account-dot.stat-account-icon.is-signed-in::after{
  content:'✓';position:absolute;right:-4px;bottom:-4px;width:16px;height:16px;
  display:grid;place-items:center;border-radius:50%;background:var(--green);color:#07110d;
  border:2px solid var(--panel-solid);font:800 9px/1 Inter,sans-serif;
}
body[data-theme='light'] .main-menu-account-dot.stat-account-icon{
  background:rgba(75,54,95,.055) !important;border-color:rgba(75,54,95,.15) !important;color:#77726d !important;
}
body[data-theme='light'] .main-menu-account-dot.stat-account-icon.is-signed-in{
  color:#4b365f !important;background:rgba(75,54,95,.075) !important;border-color:rgba(75,54,95,.22) !important;
}
body[data-theme='light'] .main-menu-account-dot.stat-account-icon.is-signed-in::after{
  background:#4b365f;color:#fff;border-color:#fbfaf7;
}

/* Cleaner Support area: one compact settings-style panel, not two large blocks. */
.stat-support-section,.stat-rate-section{padding-top:0 !important;}
.stat-support-panel,.stat-rate-panel{
  overflow:hidden;border:1px solid rgba(148,163,184,.14);border-radius:17px;
  background:rgba(255,255,255,.018);
}
.stat-support-panel .main-menu-action,
.stat-rate-panel .main-menu-action{
  min-height:64px !important;margin:0 !important;padding:10px 13px !important;
  border:0 !important;border-radius:0 !important;background:transparent !important;
  display:grid !important;grid-template-columns:38px minmax(0,1fr) 18px !important;
  align-items:center !important;gap:11px !important;text-align:left !important;
  box-shadow:none !important;transform:none !important;
}
.stat-support-panel .main-menu-action + .main-menu-action{
  border-top:1px solid rgba(148,163,184,.11) !important;
}
.stat-support-panel .main-menu-action:hover,
.stat-rate-panel .main-menu-action:hover{
  background:rgba(94,231,247,.045) !important;color:var(--text) !important;
}
.stat-menu-row-icon{
  width:36px;height:36px;display:grid;place-items:center;border-radius:11px;
  background:rgba(94,231,247,.075);color:var(--cyan);
}
.stat-menu-row-icon svg{
  width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;
  stroke-linecap:round;stroke-linejoin:round;
}
.stat-menu-row-icon.stat-about-icon{background:rgba(148,163,184,.075);color:var(--muted);}
.stat-menu-row-icon.stat-rate-icon{background:rgba(250,190,70,.10);color:#e8b54d;}
.stat-menu-row-copy{min-width:0;display:flex;flex-direction:column;gap:2px;}
.stat-menu-row-copy strong{color:var(--text);font:700 13px/1.3 Inter,sans-serif;}
.stat-menu-row-copy small{color:var(--muted);font:500 10.5px/1.35 Inter,sans-serif;}
.stat-support-panel .main-menu-arrow,.stat-rate-panel .main-menu-arrow{
  color:var(--muted-2);font-size:22px;justify-self:end;
}
body[data-theme='light'] .stat-support-panel,
body[data-theme='light'] .stat-rate-panel{
  background:rgba(255,255,255,.52);border-color:rgba(75,54,95,.12);
}
body[data-theme='light'] .stat-support-panel .main-menu-action + .main-menu-action{
  border-top-color:rgba(75,54,95,.09) !important;
}
body[data-theme='light'] .stat-support-panel .main-menu-action:hover,
body[data-theme='light'] .stat-rate-panel .main-menu-action:hover{
  background:rgba(75,54,95,.04) !important;
}
body[data-theme='light'] .stat-menu-row-icon{background:rgba(75,54,95,.075);color:#4b365f;}
body[data-theme='light'] .stat-menu-row-icon.stat-about-icon{background:rgba(39,48,45,.055);color:#6f716d;}
body[data-theme='light'] .stat-menu-row-icon.stat-rate-icon{background:rgba(184,128,20,.09);color:#9a701f;}
body[data-theme='light'] .stat-menu-row-copy strong{color:#27302d;}
body[data-theme='light'] .stat-menu-row-copy small{color:#817d77;}

@media(max-width:700px){
  .main-menu-account-dot.stat-account-icon{width:36px !important;height:36px !important;min-width:36px !important;border-radius:11px !important;}
  .stat-support-panel .main-menu-action,.stat-rate-panel .main-menu-action{min-height:61px !important;padding:9px 11px !important;grid-template-columns:36px minmax(0,1fr) 16px !important;gap:10px !important;}
  .stat-menu-row-icon{width:34px;height:34px;border-radius:10px;}
  .stat-menu-row-copy strong{font-size:12.5px;}.stat-menu-row-copy small{font-size:10px;}
}
`;
    document.head.appendChild(style);
  }

  function decorateAccountStatus() {
    const statusIcon = document.getElementById('menuAccountDot');
    if (!statusIcon || statusIcon.dataset.polishedAccount === '1') return;
    statusIcon.dataset.polishedAccount = '1';
    statusIcon.classList.add('stat-account-icon');
    statusIcon.innerHTML = icons.user;
  }

  function rowMarkup(iconClass, icon, title, subtitle) {
    return `
      <span class="stat-menu-row-icon ${iconClass}" aria-hidden="true">${icon}</span>
      <span class="stat-menu-row-copy">
        <strong>${title}</strong>
        <small>${subtitle}</small>
      </span>
      <span class="main-menu-arrow" aria-hidden="true">›</span>`;
  }

  function buildSupportSection() {
    if (document.getElementById('statSupportSection')) return;

    const manualBtn = document.getElementById('menuManualsBtn');
    const aboutBtn = document.getElementById('menuAboutBtn');
    if (!manualBtn || !aboutBtn) return;

    const manualSection = manualBtn.closest('.main-menu-section');
    const aboutSection = aboutBtn.closest('.main-menu-section');
    if (!manualSection || !aboutSection) return;

    const supportSection = document.createElement('section');
    supportSection.id = 'statSupportSection';
    supportSection.className = 'main-menu-section stat-support-section';
    supportSection.innerHTML = `
      <div class="main-menu-label">Support</div>
      <div class="stat-support-panel"></div>`;

    manualSection.parentNode.insertBefore(supportSection, manualSection);
    const panel = supportSection.querySelector('.stat-support-panel');

    manualBtn.classList.add('stat-support-row');
    aboutBtn.classList.add('stat-support-row');
    manualBtn.innerHTML = rowMarkup('', icons.book, 'Manual', 'Guides for using Stat Archive');
    aboutBtn.innerHTML = rowMarkup('stat-about-icon', icons.info, 'About Stat Archive', 'Purpose and archive information');
    panel.append(manualBtn, aboutBtn);

    if (manualSection !== supportSection && manualSection.isConnected) manualSection.remove();
    if (aboutSection !== manualSection && aboutSection.isConnected) aboutSection.remove();

    const rateSection = document.createElement('section');
    rateSection.id = 'statRateSection';
    rateSection.className = 'main-menu-section stat-rate-section';
    rateSection.innerHTML = `
      <div class="main-menu-label">Feedback</div>
      <div class="stat-rate-panel">
        <button type="button" class="main-menu-action" id="menuRateBtn" aria-label="Rate Stat Archive">
          ${rowMarkup('stat-rate-icon', icons.star, 'Rate Stat Archive', 'Leave a rating on Google Play')}
        </button>
      </div>`;

    supportSection.insertAdjacentElement('afterend', rateSection);
    rateSection.querySelector('#menuRateBtn')?.addEventListener('click', openRatePage);
  }

  function closeMenu() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    document.getElementById('mainSideMenu')?.classList.remove('is-open');
    document.getElementById('mainMenuBackdrop')?.classList.remove('is-open');
    document.getElementById('mainMenuBtn')?.setAttribute('aria-expanded', 'false');
  }

  function openRatePage() {
    closeMenu();

    const isAndroid = /Android/i.test(navigator.userAgent || '');
    if (!isAndroid) {
      window.open(PLAY_WEB_URL, '_blank', 'noopener');
      return;
    }

    const marketUrl = `market://details?id=${PLAY_PACKAGE}`;
    let fallbackTimer = null;

    const stopFallback = () => {
      if (document.hidden && fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    document.addEventListener('visibilitychange', stopFallback, { once: true });
    window.location.href = marketUrl;

    fallbackTimer = window.setTimeout(() => {
      if (!document.hidden) window.location.href = PLAY_WEB_URL;
    }, 900);
  }

  function init() {
    installStyles();
    decorateAccountStatus();
    buildSupportSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
