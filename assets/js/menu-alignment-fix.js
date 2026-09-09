/* Stat Archive: final alignment guard for account, support and feedback menu rows. */
(() => {
  function installMenuAlignmentFix() {
    if (document.getElementById('statArchiveMenuAlignmentFix')) return;

    const style = document.createElement('style');
    style.id = 'statArchiveMenuAlignmentFix';
    style.textContent = `
/* Account status: keep the profile icon at the left instead of centering the group. */
body #mainSideMenu .main-menu-account-status{
  display:flex !important;
  align-items:center !important;
  justify-content:flex-start !important;
  gap:12px !important;
  padding-left:14px !important;
  padding-right:14px !important;
  text-align:left !important;
}
body #mainSideMenu #menuAccountDot{
  display:none !important;
  width:0 !important;
  height:0 !important;
  margin:0 !important;
  padding:0 !important;
  flex:0 0 0 !important;
}
body #mainSideMenu #menuAccountProfileIcon{
  flex:0 0 38px !important;
  margin:0 !important;
}
body #mainSideMenu #menuAccountStatus{
  flex:1 1 auto !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
  text-align:left !important;
}

/* Manual / About / Feedback: force a simple left-to-right row.
   This beats older generic .main-menu-action flex spacing rules. */
body #mainSideMenu #menuManualsBtn.stat-support-card,
body #mainSideMenu #menuAboutBtn.stat-support-card,
body #mainSideMenu #menuLocalFeedbackBtn.stat-feedback-card{
  display:flex !important;
  flex-direction:row !important;
  align-items:center !important;
  justify-content:flex-start !important;
  gap:12px !important;
  padding:10px 13px !important;
  text-align:left !important;
  text-indent:0 !important;
}
body #mainSideMenu .stat-support-list{
  margin:0 !important;
  padding:0 !important;
}
body #mainSideMenu #menuManualsBtn > .stat-menu-row-icon,
body #mainSideMenu #menuAboutBtn > .stat-menu-row-icon,
body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-icon{
  flex:0 0 36px !important;
  width:36px !important;
  height:36px !important;
  margin:0 !important;
  padding:0 !important;
}
body #mainSideMenu #menuManualsBtn > .stat-menu-row-copy,
body #mainSideMenu #menuAboutBtn > .stat-menu-row-copy,
body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-copy{
  flex:1 1 auto !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
}
body #mainSideMenu #menuManualsBtn > .main-menu-arrow,
body #mainSideMenu #menuAboutBtn > .main-menu-arrow,
body #mainSideMenu #menuLocalFeedbackBtn > .main-menu-arrow{
  flex:0 0 auto !important;
  margin-left:auto !important;
  margin-right:0 !important;
  padding:0 !important;
}

@media(max-width:700px){
  body #mainSideMenu .main-menu-account-status{
    gap:11px !important;
    padding-left:12px !important;
    padding-right:12px !important;
  }
  body #mainSideMenu #menuAccountProfileIcon{
    flex-basis:36px !important;
  }
  body #mainSideMenu #menuManualsBtn.stat-support-card,
  body #mainSideMenu #menuAboutBtn.stat-support-card,
  body #mainSideMenu #menuLocalFeedbackBtn.stat-feedback-card{
    gap:10px !important;
    padding:9px 11px !important;
  }
  body #mainSideMenu #menuManualsBtn > .stat-menu-row-icon,
  body #mainSideMenu #menuAboutBtn > .stat-menu-row-icon,
  body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-icon{
    flex-basis:34px !important;
    width:34px !important;
    height:34px !important;
  }
}
`;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installMenuAlignmentFix, { once:true });
  } else {
    installMenuAlignmentFix();
  }
})();

/* =========================================================
   Reliable side-menu Back stack.
   This file is served network-first by the Stat Archive service worker,
   so this navigation fix does not get stuck behind an older cached script.

   Required flow:
   Home -> Menu -> Manual -> Back -> Menu -> Back -> Home
   ========================================================= */
(() => {
  const NAV_KEY = 'statArchiveNav';
  const MENU_PARAM = 'menu';

  const menu = document.getElementById('mainSideMenu');
  const menuBtn = document.getElementById('mainMenuBtn');
  const backdrop = document.getElementById('mainMenuBackdrop');
  if (!menu || !menuBtn) return;

  const readState = () => history.state?.[NAV_KEY] || 'home';
  const withState = value => ({ ...(history.state || {}), [NAV_KEY]: value });

  function urlWithMenuMarker() {
    const url = new URL(location.href);
    url.searchParams.set(MENU_PARAM, '1');
    return url.href;
  }

  function urlWithoutMenuMarker() {
    const url = new URL(location.href);
    url.searchParams.delete(MENU_PARAM);
    return url.href;
  }

  function openMenu() {
    try { window.statArchiveOpenMenu?.(); } catch (_) {}
    menu.classList.add('is-open');
    backdrop?.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    backdrop?.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    menu.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    backdrop?.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  const initialUrl = new URL(location.href);
  const returningToMenu = initialUrl.searchParams.get(MENU_PARAM) === '1';

  if (returningToMenu) {
    history.replaceState(withState('menu'), '', location.href);
    requestAnimationFrame(openMenu);
  } else if (!history.state?.[NAV_KEY]) {
    history.replaceState(withState('home'), '', location.href);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#mainMenuBtn')) {
      if (menu.classList.contains('is-open') && readState() === 'menu') {
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
        return;
      }

      if (!menu.classList.contains('is-open') && readState() === 'home') {
        history.pushState(withState('menu'), '', urlWithMenuMarker());
      }
      return;
    }

    if ((target.closest('#mainMenuCloseBtn') || target.closest('#mainMenuBackdrop')) &&
        menu.classList.contains('is-open') && readState() === 'menu') {
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
      return;
    }

    const manual = target.closest('#menuManualsBtn');
    if (manual && menu.classList.contains('is-open')) {
      // Make the current homepage history entry an explicit Menu destination
      // before the existing Manual click handler navigates away. Therefore
      // Android/browser Back and the Manual's own history.back() both restore
      // the menu first, while the previous entry remains the plain homepage.
      if (readState() !== 'menu') {
        history.pushState(withState('menu'), '', urlWithMenuMarker());
      } else {
        history.replaceState(withState('menu'), '', urlWithMenuMarker());
      }
      return;
    }
  }, true);

  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    const state = history.state?.[NAV_KEY] ||
      (url.searchParams.get(MENU_PARAM) === '1' ? 'menu' : 'home');

    if (state === 'menu') {
      openMenu();
    } else {
      closeMenu();
    }
  });

  window.addEventListener('pageshow', () => {
    const url = new URL(location.href);
    if (history.state?.[NAV_KEY] === 'menu' || url.searchParams.get(MENU_PARAM) === '1') {
      openMenu();
    }
  });
})();
