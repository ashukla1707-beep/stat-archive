/* Stat Archive: final alignment guard for account, support and feedback menu rows. */
(() => {
  function installMenuAlignmentFix() {
    if (document.getElementById('statArchiveMenuAlignmentFix')) return;

    const style = document.createElement('style');
    style.id = 'statArchiveMenuAlignmentFix';
    style.textContent = `
body #mainSideMenu .main-menu-account-status{
  display:flex !important;align-items:center !important;justify-content:flex-start !important;
  gap:12px !important;padding-left:14px !important;padding-right:14px !important;text-align:left !important;
}
body #mainSideMenu #menuAccountDot{display:none !important;width:0 !important;height:0 !important;margin:0 !important;padding:0 !important;flex:0 0 0 !important;}
body #mainSideMenu #menuAccountProfileIcon{flex:0 0 38px !important;margin:0 !important;}
body #mainSideMenu #menuAccountStatus{flex:1 1 auto !important;min-width:0 !important;margin:0 !important;padding:0 !important;text-align:left !important;}
body #mainSideMenu #menuManualsBtn.stat-support-card,
body #mainSideMenu #menuAboutBtn.stat-support-card,
body #mainSideMenu #menuLocalFeedbackBtn.stat-feedback-card{
  display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:flex-start !important;
  gap:12px !important;padding:10px 13px !important;text-align:left !important;text-indent:0 !important;
}
body #mainSideMenu .stat-support-list{margin:0 !important;padding:0 !important;}
body #mainSideMenu #menuManualsBtn > .stat-menu-row-icon,
body #mainSideMenu #menuAboutBtn > .stat-menu-row-icon,
body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-icon{flex:0 0 36px !important;width:36px !important;height:36px !important;margin:0 !important;padding:0 !important;}
body #mainSideMenu #menuManualsBtn > .stat-menu-row-copy,
body #mainSideMenu #menuAboutBtn > .stat-menu-row-copy,
body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-copy{flex:1 1 auto !important;min-width:0 !important;margin:0 !important;padding:0 !important;}
body #mainSideMenu #menuManualsBtn > .main-menu-arrow,
body #mainSideMenu #menuAboutBtn > .main-menu-arrow,
body #mainSideMenu #menuLocalFeedbackBtn > .main-menu-arrow{flex:0 0 auto !important;margin-left:auto !important;margin-right:0 !important;padding:0 !important;}
@media(max-width:700px){
  body #mainSideMenu .main-menu-account-status{gap:11px !important;padding-left:12px !important;padding-right:12px !important;}
  body #mainSideMenu #menuAccountProfileIcon{flex-basis:36px !important;}
  body #mainSideMenu #menuManualsBtn.stat-support-card,
  body #mainSideMenu #menuAboutBtn.stat-support-card,
  body #mainSideMenu #menuLocalFeedbackBtn.stat-feedback-card{gap:10px !important;padding:9px 11px !important;}
  body #mainSideMenu #menuManualsBtn > .stat-menu-row-icon,
  body #mainSideMenu #menuAboutBtn > .stat-menu-row-icon,
  body #mainSideMenu #menuLocalFeedbackBtn > .stat-menu-row-icon{flex-basis:34px !important;width:34px !important;height:34px !important;}
}
`;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installMenuAlignmentFix, { once:true });
  else installMenuAlignmentFix();
})();

/* =========================================================
   Navigation owner for Menu -> Manual -> Back.

   Desired stack after opening a Manual:
   Home -> Menu -> Manual page

   The Manual chooser is a temporary child history entry. When a manual is
   selected we REPLACE that chooser entry with the Manual document instead
   of adding another entry. Therefore the very next Back lands on Menu.
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

  function menuUrl() {
    const url = new URL(location.href);
    url.searchParams.set(MENU_PARAM, '1');
    return url.href;
  }

  function homeUrl() {
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

  const initial = new URL(location.href);
  if (initial.searchParams.get(MENU_PARAM) === '1') {
    history.replaceState(withState('menu'), '', location.href);
    requestAnimationFrame(openMenu);
  } else if (!history.state?.[NAV_KEY]) {
    history.replaceState(withState('home'), '', homeUrl());
  }

  /* Capture early so older cached click handlers cannot add an extra
     Manual-page history entry after the chooser. */
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const manualChoice = target.closest('[data-manual-href]');
    if (manualChoice) {
      const href = manualChoice.getAttribute('data-manual-href');
      if (!href) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const overlay = document.getElementById('manualChooserOverlay');
      overlay?.classList.remove('is-open');
      overlay?.setAttribute('aria-hidden', 'true');
      if (document.body?.dataset.manualScrollLock === '1') {
        delete document.body.dataset.manualScrollLock;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
      }

      /* Critical fix: replace chooser, don't push another page. */
      window.location.replace(href);
      return;
    }

    if (target.closest('#mainMenuBtn')) {
      if (menu.classList.contains('is-open') && readState() === 'menu') {
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
        return;
      }
      if (!menu.classList.contains('is-open') && readState() === 'home') {
        history.pushState(withState('menu'), '', menuUrl());
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

    const manualButton = target.closest('#menuManualsBtn');
    if (manualButton && menu.classList.contains('is-open')) {
      /* Guarantee a real Menu entry even if an older cached navigation helper
         did not create one when the hamburger was opened. */
      if (readState() !== 'menu') history.pushState(withState('menu'), '', menuUrl());
      else history.replaceState(withState('menu'), '', menuUrl());
    }
  }, true);

  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    const state = history.state?.[NAV_KEY] || (url.searchParams.get(MENU_PARAM) === '1' ? 'menu' : 'home');
    if (state === 'menu') openMenu();
    else closeMenu();
  });

  function restore() {
    const url = new URL(location.href);
    if (history.state?.[NAV_KEY] === 'menu' || url.searchParams.get(MENU_PARAM) === '1') openMenu();
    else closeMenu();
  }

  window.addEventListener('pageshow', restore);
  restore();
})();
