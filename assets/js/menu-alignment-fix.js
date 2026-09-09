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
   MENU CHILD CLOSE SYNCHRONIZER

   Navigation history is owned by service-worker-register.js. This file no
   longer pushes/replaces history itself.

   Android's current native Back handler can directly hide some overlays
   (notably Offline Library) before WebView.goBack(). Watch those child UIs;
   if one disappears while the navigation state is still "child", pop that
   single child entry so Menu is restored immediately.
   ========================================================= */
(() => {
  let scheduled = false;
  let suppressUntil = 0;

  function isVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.classList.contains('stat-feedback-overlay') || el.classList.contains('manual-chooser-overlay')) {
      return el.classList.contains('is-open');
    }
    return el.getClientRects().length > 0;
  }

  function childStillOpen(child) {
    if (child === 'manual-chooser') {
      return isVisible(document.getElementById('manualChooserOverlay'));
    }
    if (child === 'about') {
      return isVisible(document.getElementById('aboutArchiveOverlay'));
    }
    if (child === 'offline-library') {
      return isVisible(document.getElementById('offlineLibraryOverlay'));
    }
    if (child === 'feedback') {
      return isVisible(document.getElementById('statLocalFeedbackOverlay'));
    }
    return true;
  }

  function checkClosedChild() {
    scheduled = false;
    if (performance.now() < suppressUntil) return;

    const nav = window.__statArchiveNavigation;
    if (!nav || nav.state?.() !== 'child') return;

    const child = nav.child?.() || '';
    if (!child || childStillOpen(child)) return;

    suppressUntil = performance.now() + 250;
    history.back();
  }

  function scheduleCheck() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(checkClosedChild);
  }

  const observer = new MutationObserver(scheduleCheck);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'aria-hidden', 'hidden']
  });

  window.addEventListener('popstate', () => {
    suppressUntil = performance.now() + 150;
  });
})();
