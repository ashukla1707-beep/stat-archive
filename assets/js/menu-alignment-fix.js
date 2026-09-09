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
   LEGACY MENU HISTORY GUARD

   subject-panel.js contains the original September 1 menu-history behavior.
   That was correct while it was the only navigation owner, but newer Manual /
   Offline / About navigation now lives in service-worker-register.js.

   Keep subject-panel.js for its styling, level/theme controls and scroll lock,
   but neutralize only its legacy statArchiveMenuOpen history writes and stop
   its old close-on-popstate behavior from defeating the canonical menu state.
   ========================================================= */
(() => {
  if (window.__statArchiveLegacyMenuGuardInstalled) return;
  window.__statArchiveLegacyMenuGuardInstalled = true;

  const rawPushState = history.pushState.bind(history);
  const rawReplaceState = history.replaceState.bind(history);

  history.pushState = function(state, title, url) {
    if (state?.statArchiveMenuOpen === true && window.__statArchiveNavigation) {
      const clean = { ...(state || {}) };
      delete clean.statArchiveMenuOpen;

      /* The canonical navigation core has already created the Menu row.
         Replacing the current row avoids the legacy observer creating a
         duplicate Menu entry. */
      return rawReplaceState(clean, title, url);
    }
    return rawPushState(state, title, url);
  };

  const rawCloseMenu = window.statArchiveCloseMenu;
  if (typeof rawCloseMenu === 'function' && !rawCloseMenu.__saLegacyGuardWrapped) {
    const guardedCloseMenu = function(...args) {
      /* On Back from a child/manual the canonical core restores state=menu.
         The old subject-panel popstate listener runs later and used to close
         that freshly restored Menu immediately. Ignore that obsolete close. */
      if (history.state?.statArchiveNav === 'menu') return;
      return rawCloseMenu.apply(this, args);
    };
    guardedCloseMenu.__saLegacyGuardWrapped = true;
    guardedCloseMenu.__saOriginal = rawCloseMenu;
    window.statArchiveCloseMenu = guardedCloseMenu;
  }

  function ensureMenuScrollLock() {
    if (history.state?.statArchiveNav !== 'menu') return;
    const menu = document.getElementById('mainSideMenu');
    if (!menu?.classList.contains('is-open')) return;

    /* subject-panel.js may unlock the body after its obsolete popstate close
       was blocked. Restore only the lock state; do not create history. */
    if (document.body?.dataset.statMenuLocked === '1') return;
    const y = window.scrollY || window.pageYOffset || 0;
    document.body.dataset.statMenuLocked = '1';
    document.documentElement.classList.add('stat-menu-scroll-locked');
    document.body.classList.add('stat-menu-scroll-locked');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  window.addEventListener('popstate', () => {
    requestAnimationFrame(ensureMenuScrollLock);
  });
  window.addEventListener('pageshow', () => {
    requestAnimationFrame(ensureMenuScrollLock);
  });
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

/* =========================================================
   MOBILE ENTRY ACTION PILLS — reference match
   Loads after tooltips.js, so these mobile-only rules are authoritative.
   Desktop remains unchanged.
   ========================================================= */
(() => {
  if (document.getElementById('statArchiveMobileReferenceActions')) return;

  const style = document.createElement('style');
  style.id = 'statArchiveMobileReferenceActions';
  style.textContent = `
@media(max-width:700px){
  html body .card .card-actions,
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    display:grid !important;
    grid-template-columns:1fr 1.12fr .95fr !important;
    align-items:center !important;
    gap:10px !important;
    padding-top:10px !important;
    flex-wrap:unset !important;
  }

  html body .card .card-actions .action-btn{
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    flex-direction:row !important;
    gap:6px !important;
    width:100% !important;
    min-width:0 !important;
    max-width:none !important;
    height:42px !important;
    min-height:42px !important;
    padding:0 10px !important;
    margin:0 !important;
    border-radius:12px !important;
    white-space:nowrap !important;
    word-break:keep-all !important;
    overflow-wrap:normal !important;
    text-align:center !important;
    line-height:1 !important;
    font-size:14px !important;
    font-weight:700 !important;
    letter-spacing:0 !important;
    box-sizing:border-box !important;
  }

  html body .card .card-actions .action-btn br{
    display:none !important;
  }

  body:not([data-theme="light"]) .card .card-actions .pv-btn,
  body:not([data-theme="light"]) .card .card-actions .offline-btn{
    color:#63efff !important;
    background:rgba(18,52,64,.82) !important;
    border:1px solid rgba(99,239,255,.38) !important;
    box-shadow:
      inset 0 0 0 1px rgba(99,239,255,.08),
      0 0 12px rgba(56,210,235,.06) !important;
  }

  body:not([data-theme="light"]) .card .card-actions .dl-btn{
    color:#eef2f8 !important;
    background:rgba(16,22,33,.96) !important;
    border:1px solid rgba(255,255,255,.045) !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .pv-btn,
  body[data-theme="light"] .card .card-actions .offline-btn{
    color:#4b365f !important;
    background:#f1ebf6 !important;
    border:1px solid #d8cce2 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .dl-btn{
    color:#27302d !important;
    background:#eee9f4 !important;
    border:1px solid #ddd4e4 !important;
    box-shadow:none !important;
  }

  body[data-theme="light"] .card .card-actions .offline-btn.is-saved,
  body[data-theme="light"] .card .card-actions .pv-btn.is-previewed,
  body[data-theme="light"] .card .card-actions .dl-btn.is-downloaded{
    color:#fff !important;
    background:#4b365f !important;
    border-color:#4b365f !important;
  }

  html body .card .card-actions .edit-btn,
  html body .card .card-actions .del-btn{
    height:38px !important;
    min-height:38px !important;
    font-size:12px !important;
    border-radius:11px !important;
  }
}

@media(max-width:380px){
  html body .card .card-actions,
  html body .card .card-actions:has(.edit-btn),
  html body .card .card-actions:has(.del-btn){
    gap:7px !important;
  }

  html body .card .card-actions .action-btn{
    height:39px !important;
    min-height:39px !important;
    padding:0 7px !important;
    border-radius:11px !important;
    font-size:12.5px !important;
    gap:4px !important;
  }
}
`;
  document.head.appendChild(style);
})();