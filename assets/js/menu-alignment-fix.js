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
