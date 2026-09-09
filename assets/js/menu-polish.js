/* Stat Archive menu polish: account profile status, separate support cards, and local feedback. */
(() => {
  const FEEDBACK_KEY = 'statArchiveLocalFeedbackV1';

  const icons = {
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M4.8 20c.9-3.4 3.4-5.3 7.2-5.3s6.3 1.9 7.2 5.3"></path></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H20v17H7.8A2.8 2.8 0 0 0 5 21.8V4.8Z"></path><path d="M5 19a2.8 2.8 0 0 1 2.8-2.8H20"></path></svg>`,
    info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 10.5v6"></path><path d="M12 7.2h.01"></path></svg>`,
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"></path></svg>`
  };

  function installStyles() {
    document.getElementById('statArchiveMenuPolishStyle')?.remove();

    const style = document.createElement('style');
    style.id = 'statArchiveMenuPolishStyle';
    style.textContent = `
#menuAccountDot{display:none !important;}
.main-menu-account-status::before,.main-menu-account-status::after{content:none !important;display:none !important;}
.main-menu-account-status{gap:12px !important;}
.stat-account-profile{width:38px;height:38px;min-width:38px;display:grid;place-items:center;position:relative;border-radius:12px;border:1px solid rgba(148,163,184,.18);background:rgba(148,163,184,.07);color:var(--muted);box-shadow:none;}
.stat-account-profile svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.stat-account-profile.is-signed-in{color:var(--green);background:rgba(74,222,165,.08);border-color:rgba(74,222,165,.28);}
.stat-account-profile.is-signed-in::after{content:'✓';position:absolute;right:-4px;bottom:-4px;width:16px;height:16px;display:grid;place-items:center;border-radius:50%;background:var(--green);color:#07110d;border:2px solid var(--panel-solid);font:800 9px/1 Inter,sans-serif;}
body[data-theme='light'] .stat-account-profile{background:rgba(75,54,95,.055);border-color:rgba(75,54,95,.15);color:#77726d;}
body[data-theme='light'] .stat-account-profile.is-signed-in{color:#4b365f;background:rgba(75,54,95,.075);border-color:rgba(75,54,95,.22);}
body[data-theme='light'] .stat-account-profile.is-signed-in::after{background:#4b365f;color:#fff;border-color:#fbfaf7;}

.stat-support-section,.stat-feedback-section{padding-top:0 !important;}
.stat-support-list{display:grid;gap:10px;}
.stat-support-card,.stat-feedback-card{width:100%;min-height:64px !important;margin:0 !important;padding:10px 13px !important;border:1px solid rgba(148,163,184,.14) !important;border-radius:17px !important;background:rgba(255,255,255,.018) !important;display:grid !important;grid-template-columns:38px minmax(0,1fr) 18px !important;align-items:center !important;gap:11px !important;text-align:left !important;box-shadow:none !important;transform:none !important;}
#menuManualsBtn::before,#menuManualsBtn::after,#menuAboutBtn::before,#menuAboutBtn::after,#menuLocalFeedbackBtn::before,#menuLocalFeedbackBtn::after{content:none !important;display:none !important;}
.stat-support-card:hover,.stat-feedback-card:hover{background:rgba(94,231,247,.045) !important;color:var(--text) !important;border-color:rgba(94,231,247,.24) !important;}
.stat-menu-row-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:rgba(94,231,247,.075);color:var(--cyan);}
.stat-menu-row-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
.stat-menu-row-icon.stat-about-icon{background:rgba(148,163,184,.075);color:var(--muted);}
.stat-menu-row-icon.stat-rate-icon{background:rgba(250,190,70,.10);color:#e8b54d;}
.stat-menu-row-copy{min-width:0;display:flex;flex-direction:column;gap:2px;}
.stat-menu-row-copy strong{color:var(--text);font:700 13px/1.3 Inter,sans-serif;}
.stat-menu-row-copy small{color:var(--muted);font:500 10.5px/1.35 Inter,sans-serif;}
.stat-support-card .main-menu-arrow,.stat-feedback-card .main-menu-arrow{color:var(--muted-2);font-size:22px;justify-self:end;}
body[data-theme='light'] .stat-support-card,body[data-theme='light'] .stat-feedback-card{background:rgba(255,255,255,.52) !important;border-color:rgba(75,54,95,.12) !important;}
body[data-theme='light'] .stat-support-card:hover,body[data-theme='light'] .stat-feedback-card:hover{background:rgba(75,54,95,.04) !important;border-color:rgba(75,54,95,.22) !important;}
body[data-theme='light'] .stat-menu-row-icon{background:rgba(75,54,95,.075);color:#4b365f;}
body[data-theme='light'] .stat-menu-row-icon.stat-about-icon{background:rgba(39,48,45,.055);color:#6f716d;}
body[data-theme='light'] .stat-menu-row-icon.stat-rate-icon{background:rgba(184,128,20,.09);color:#9a701f;}
body[data-theme='light'] .stat-menu-row-copy strong{color:#27302d;}
body[data-theme='light'] .stat-menu-row-copy small{color:#817d77;}

.stat-feedback-overlay{position:fixed;inset:0;z-index:10080;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(2,6,12,.66);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,visibility .16s ease;}
.stat-feedback-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto;}
.stat-feedback-dialog{width:min(460px,100%);border:1px solid rgba(148,163,184,.20);border-radius:22px;padding:21px;background:#0d141e;color:#eef3f8;box-shadow:0 28px 80px rgba(0,0,0,.48);}
.stat-feedback-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;}
.stat-feedback-head h2{margin:0 0 5px;font:800 24px/1.1 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.03em;}
.stat-feedback-head p{margin:0;color:#8491a2;font:500 12px/1.5 Inter,sans-serif;}
.stat-feedback-close{width:38px;height:38px;flex:0 0 auto;border:1px solid rgba(148,163,184,.18);border-radius:50%;background:#111a25;color:#eef3f8;font-size:21px;cursor:pointer;}
.stat-feedback-stars{display:flex;justify-content:center;gap:8px;margin:4px 0 17px;}
.stat-feedback-star{width:48px;height:48px;border:1px solid rgba(148,163,184,.17);border-radius:13px;background:#111a25;color:#6f7b8b;font-size:27px;line-height:1;cursor:pointer;transition:.14s ease;}
.stat-feedback-star.is-selected{color:#e8b54d;border-color:rgba(232,181,77,.38);background:rgba(232,181,77,.09);}
.stat-feedback-label{display:block;margin:0 0 7px;color:#b9c3ce;font:700 11px/1.3 Inter,sans-serif;}
.stat-feedback-textarea{width:100%;min-height:92px;resize:vertical;padding:11px 12px;border:1px solid rgba(148,163,184,.17);border-radius:12px;background:#111a25;color:#eef3f8;font:500 12px/1.55 Inter,sans-serif;outline:none;}
.stat-feedback-textarea:focus{border-color:rgba(94,231,247,.42);box-shadow:0 0 0 3px rgba(94,231,247,.06);}
.stat-feedback-status{min-height:18px;margin:9px 0 0;color:#8491a2;font:500 10.5px/1.4 Inter,sans-serif;}
.stat-feedback-actions{display:flex;gap:9px;margin-top:15px;}
.stat-feedback-actions button{flex:1;min-height:43px;border-radius:11px;font:700 11px Inter,sans-serif;cursor:pointer;}
.stat-feedback-cancel{border:1px solid rgba(148,163,184,.17);background:transparent;color:#c4ccd6;}
.stat-feedback-save{border:1px solid rgba(94,231,247,.28);background:rgba(94,231,247,.11);color:#8aebf7;}
body[data-theme='light'] .stat-feedback-overlay{background:rgba(52,48,42,.30);}
body[data-theme='light'] .stat-feedback-dialog{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 24px 70px rgba(58,53,42,.18);}
body[data-theme='light'] .stat-feedback-head p,body[data-theme='light'] .stat-feedback-status{color:#817d77;}
body[data-theme='light'] .stat-feedback-close,body[data-theme='light'] .stat-feedback-star,body[data-theme='light'] .stat-feedback-textarea{background:rgba(255,255,255,.78);color:#27302d;border-color:rgba(75,54,95,.14);}
body[data-theme='light'] .stat-feedback-star{color:#aaa39b;}
body[data-theme='light'] .stat-feedback-star.is-selected{color:#9a701f;border-color:rgba(154,112,31,.28);background:rgba(184,128,20,.08);}
body[data-theme='light'] .stat-feedback-label{color:#4f5753;}
body[data-theme='light'] .stat-feedback-cancel{color:#5f625f;border-color:rgba(75,54,95,.14);}
body[data-theme='light'] .stat-feedback-save{color:#4b365f;border-color:rgba(75,54,95,.24);background:rgba(75,54,95,.07);}

@media(max-width:700px){
  .stat-account-profile{width:36px;height:36px;min-width:36px;border-radius:11px;}
  .stat-support-card,.stat-feedback-card{min-height:61px !important;padding:9px 11px !important;grid-template-columns:36px minmax(0,1fr) 16px !important;gap:10px !important;}
  .stat-menu-row-icon{width:34px;height:34px;border-radius:10px;}
  .stat-menu-row-copy strong{font-size:12.5px;}.stat-menu-row-copy small{font-size:10px;}
  .stat-feedback-dialog{padding:18px 16px;border-radius:20px;}
  .stat-feedback-head h2{font-size:22px;}
  .stat-feedback-stars{gap:6px;}.stat-feedback-star{width:44px;height:44px;font-size:25px;}
}
`;
    document.head.appendChild(style);
  }

  function decorateAccountStatus() {
    const legacyDot = document.getElementById('menuAccountDot');
    const statusText = document.getElementById('menuAccountStatus');
    const statusWrap = statusText?.closest('.main-menu-account-status');
    if (!legacyDot || !statusText || !statusWrap) return;

    let profile = document.getElementById('menuAccountProfileIcon');
    if (!profile) {
      profile = document.createElement('span');
      profile.id = 'menuAccountProfileIcon';
      profile.className = 'stat-account-profile';
      profile.setAttribute('aria-hidden', 'true');
      profile.innerHTML = icons.user;
      statusWrap.insertBefore(profile, statusText);
    }

    const sync = () => {
      profile.classList.toggle('is-signed-in', legacyDot.classList.contains('is-signed-in'));
    };

    sync();
    if (legacyDot.dataset.profileObserverBound !== '1') {
      legacyDot.dataset.profileObserverBound = '1';
      new MutationObserver(sync).observe(legacyDot, { attributes: true, attributeFilter: ['class'] });
    }
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

  function buildSupportAndFeedback() {
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
    supportSection.innerHTML = `<div class="main-menu-label">Support</div><div class="stat-support-list"></div>`;

    manualSection.parentNode.insertBefore(supportSection, manualSection);
    const list = supportSection.querySelector('.stat-support-list');

    manualBtn.className = 'main-menu-action stat-support-card';
    aboutBtn.className = 'main-menu-action stat-support-card';
    manualBtn.innerHTML = rowMarkup('', icons.book, 'Manual', 'Guides for using Stat Archive');
    aboutBtn.innerHTML = rowMarkup('stat-about-icon', icons.info, 'About Stat Archive', 'Purpose and archive information');
    list.append(manualBtn, aboutBtn);

    if (manualSection.isConnected) manualSection.remove();
    if (aboutSection.isConnected) aboutSection.remove();

    const feedbackSection = document.createElement('section');
    feedbackSection.id = 'statFeedbackSection';
    feedbackSection.className = 'main-menu-section stat-feedback-section';
    feedbackSection.innerHTML = `
      <div class="main-menu-label">Feedback</div>
      <button type="button" class="main-menu-action stat-feedback-card" id="menuLocalFeedbackBtn" aria-label="Rate Stat Archive">
        ${rowMarkup('stat-rate-icon', icons.star, 'Rate Stat Archive', 'Share feedback inside the app')}
      </button>`;

    supportSection.insertAdjacentElement('afterend', feedbackSection);
    feedbackSection.querySelector('#menuLocalFeedbackBtn')?.addEventListener('click', openFeedback);
  }

  function closeMenu() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    document.getElementById('mainSideMenu')?.classList.remove('is-open');
    document.getElementById('mainMenuBackdrop')?.classList.remove('is-open');
    document.getElementById('mainMenuBtn')?.setAttribute('aria-expanded', 'false');
  }

  function getSavedFeedback() {
    try {
      const value = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || 'null');
      if (value && Number(value.rating) >= 1 && Number(value.rating) <= 5) return value;
    } catch (_) {}
    return null;
  }

  function ensureFeedbackDialog() {
    let overlay = document.getElementById('statLocalFeedbackOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'statLocalFeedbackOverlay';
    overlay.className = 'stat-feedback-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <section class="stat-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="statFeedbackTitle">
        <div class="stat-feedback-head">
          <div>
            <h2 id="statFeedbackTitle">Rate Stat Archive</h2>
            <p>This feedback is saved on this device for now.</p>
          </div>
          <button type="button" class="stat-feedback-close" id="statFeedbackClose" aria-label="Close feedback">×</button>
        </div>
        <div class="stat-feedback-stars" role="group" aria-label="Choose a rating from 1 to 5 stars">
          ${[1,2,3,4,5].map(n => `<button type="button" class="stat-feedback-star" data-rating="${n}" aria-label="${n} star${n === 1 ? '' : 's'}">★</button>`).join('')}
        </div>
        <label class="stat-feedback-label" for="statFeedbackComment">Tell us what you think (optional)</label>
        <textarea class="stat-feedback-textarea" id="statFeedbackComment" maxlength="500" placeholder="What do you like, or what should be improved?"></textarea>
        <div class="stat-feedback-status" id="statFeedbackStatus"></div>
        <div class="stat-feedback-actions">
          <button type="button" class="stat-feedback-cancel" id="statFeedbackCancel">Not now</button>
          <button type="button" class="stat-feedback-save" id="statFeedbackSave">Save feedback</button>
        </div>
      </section>`;

    document.body.appendChild(overlay);

    const close = () => closeFeedback();
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelector('#statFeedbackClose')?.addEventListener('click', close);
    overlay.querySelector('#statFeedbackCancel')?.addEventListener('click', close);

    overlay.querySelectorAll('[data-rating]').forEach(button => {
      button.addEventListener('click', () => {
        overlay.dataset.rating = button.dataset.rating || '';
        syncFeedbackStars(overlay);
        const status = overlay.querySelector('#statFeedbackStatus');
        if (status) status.textContent = '';
      });
    });

    overlay.querySelector('#statFeedbackSave')?.addEventListener('click', () => {
      const rating = Number(overlay.dataset.rating || 0);
      const comment = String(overlay.querySelector('#statFeedbackComment')?.value || '').trim();
      const status = overlay.querySelector('#statFeedbackStatus');

      if (rating < 1 || rating > 5) {
        if (status) status.textContent = 'Choose a star rating first.';
        return;
      }

      try {
        localStorage.setItem(FEEDBACK_KEY, JSON.stringify({ rating, comment, savedAt: new Date().toISOString() }));
        if (status) status.textContent = 'Thanks — your feedback has been saved on this device.';
        window.setTimeout(closeFeedback, 700);
      } catch (_) {
        if (status) status.textContent = 'Feedback could not be saved on this device.';
      }
    });

    return overlay;
  }

  function syncFeedbackStars(overlay) {
    const rating = Number(overlay?.dataset.rating || 0);
    overlay?.querySelectorAll('[data-rating]').forEach(button => {
      button.classList.toggle('is-selected', Number(button.dataset.rating) <= rating);
      button.setAttribute('aria-pressed', Number(button.dataset.rating) === rating ? 'true' : 'false');
    });
  }

  function openFeedback() {
    closeMenu();
    const overlay = ensureFeedbackDialog();
    const saved = getSavedFeedback();
    overlay.dataset.rating = saved ? String(saved.rating) : '';
    const comment = overlay.querySelector('#statFeedbackComment');
    if (comment) comment.value = saved?.comment || '';
    const status = overlay.querySelector('#statFeedbackStatus');
    if (status) status.textContent = saved ? 'You can update your saved feedback.' : '';
    syncFeedbackStars(overlay);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    window.setTimeout(() => overlay.querySelector('[data-rating]')?.focus(), 40);
  }

  function closeFeedback() {
    const overlay = document.getElementById('statLocalFeedbackOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function init() {
    installStyles();
    decorateAccountStatus();
    buildSupportAndFeedback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
