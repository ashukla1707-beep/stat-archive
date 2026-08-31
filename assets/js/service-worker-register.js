/* application section */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

/* =========================================================
   MANUAL CHOOSER
   Reader + Contributor only. Admin manual is intentionally
   not exposed on the public website/PWA/APK.
   ========================================================= */
(() => {
  let manualScrollY = 0;
  let manualHistoryActive = false;
  let closingFromPopState = false;

  function ensureManualChooser() {
    let overlay = document.getElementById('manualChooserOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'manualChooserOverlay';
    overlay.className = 'manual-chooser-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <section class="manual-chooser-card" role="dialog" aria-modal="true" aria-labelledby="manualChooserTitle">
        <div class="manual-chooser-head">
          <div>
            <div class="manual-chooser-kicker">SUPPORT</div>
            <h2 id="manualChooserTitle">Manuals</h2>
            <p>Choose the guide you want to open.</p>
          </div>
          <button type="button" class="manual-chooser-close" id="manualChooserCloseBtn" aria-label="Close manuals">×</button>
        </div>

        <div class="manual-chooser-options">
          <button type="button" class="manual-choice" data-manual-href="./manuals/reader.html">
            <span class="manual-choice-icon" aria-hidden="true">◫</span>
            <span class="manual-choice-copy">
              <strong>Reader Manual</strong>
              <small>Browsing, search, preview, download and Offline Library</small>
            </span>
            <span class="manual-choice-arrow" aria-hidden="true">›</span>
          </button>

          <button type="button" class="manual-choice" data-manual-href="./manuals/contributor.html">
            <span class="manual-choice-icon" aria-hidden="true">＋</span>
            <span class="manual-choice-copy">
              <strong>Contributor Manual</strong>
              <small>Filing, editing, subjects, limits and contributor permissions</small>
            </span>
            <span class="manual-choice-arrow" aria-hidden="true">›</span>
          </button>
        </div>

        <div class="manual-chooser-note">Admin maintenance manual is not published here.</div>
      </section>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeManualChooser();
    });

    overlay.querySelector('#manualChooserCloseBtn')?.addEventListener('click', closeManualChooser);

    overlay.querySelectorAll('[data-manual-href]').forEach((button) => {
      button.addEventListener('click', () => {
        const href = button.getAttribute('data-manual-href');
        if (!href) return;
        closeManualChooser(false);
        window.location.href = href;
      });
    });

    return overlay;
  }

  function lockManualBackground() {
    manualScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.dataset.manualScrollLock = '1';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${manualScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function unlockManualBackground() {
    if (document.body?.dataset.manualScrollLock !== '1') return;
    delete document.body.dataset.manualScrollLock;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    const y = manualScrollY;
    requestAnimationFrame(() => window.scrollTo(0, y));
  }

  function openManualChooser() {
    const overlay = ensureManualChooser();
    if (overlay.classList.contains('is-open')) return;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    lockManualBackground();

    if (!manualHistoryActive && !closingFromPopState) {
      history.pushState({ ...(history.state || {}), statArchiveManualChooser: true }, '', location.href);
      manualHistoryActive = true;
    }

    requestAnimationFrame(() => overlay.querySelector('#manualChooserCloseBtn')?.focus());
  }

  function closeManualChooser(useHistory = true) {
    const overlay = document.getElementById('manualChooserOverlay');
    if (!overlay?.classList.contains('is-open')) return;

    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    unlockManualBackground();

    if (useHistory && manualHistoryActive && !closingFromPopState && history.state?.statArchiveManualChooser) {
      manualHistoryActive = false;
      history.back();
    } else if (!useHistory) {
      manualHistoryActive = false;
    }
  }

  function bindManualButton() {
    const button = document.getElementById('menuManualsBtn');
    if (!button || button.dataset.manualChooserBound === '1') return;

    button.dataset.manualChooserBound = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();

      /* Let the existing menu close cleanly first. */
      try { window.statArchiveCloseMenu?.(); } catch (_) {}
      document.getElementById('mainSideMenu')?.classList.remove('is-open');
      document.getElementById('mainMenuBackdrop')?.classList.remove('is-open');
      document.getElementById('mainMenuBtn')?.setAttribute('aria-expanded', 'false');

      window.setTimeout(openManualChooser, 190);
    });
  }

  window.addEventListener('popstate', () => {
    const overlay = document.getElementById('manualChooserOverlay');
    if (!overlay?.classList.contains('is-open')) {
      manualHistoryActive = false;
      return;
    }

    closingFromPopState = true;
    manualHistoryActive = false;
    closeManualChooser(false);
    requestAnimationFrame(() => { closingFromPopState = false; });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeManualChooser();
  });

  const style = document.createElement('style');
  style.id = 'statArchiveManualChooserStyle';
  style.textContent = `
.manual-chooser-overlay{
  position:fixed;inset:0;z-index:10050;
  display:flex;align-items:center;justify-content:center;
  padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));
  background:rgba(2,6,12,.68);
  backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
  opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity .16s ease,visibility .16s ease;
}
.manual-chooser-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto;}
.manual-chooser-card{
  width:min(520px,100%);max-height:calc(100dvh - 28px);overflow:auto;
  border:1px solid rgba(148,163,184,.20);border-radius:22px;
  padding:22px;background:#0d141e;color:#eef3f8;
  box-shadow:0 28px 80px rgba(0,0,0,.48);
  transform:translateY(8px) scale(.992);transition:transform .16s ease;
}
.manual-chooser-overlay.is-open .manual-chooser-card{transform:none;}
.manual-chooser-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px;}
.manual-chooser-kicker{color:#5ee7f7;font:700 10px/1.2 'JetBrains Mono',monospace;letter-spacing:.14em;}
.manual-chooser-head h2{margin:5px 0 4px;font:800 28px/1.05 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.035em;}
.manual-chooser-head p{margin:0;color:#8491a2;font:500 12.5px/1.5 Inter,sans-serif;}
.manual-chooser-close{flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:1px solid rgba(148,163,184,.18);background:#111a25;color:#eef3f8;font-size:22px;line-height:1;cursor:pointer;}
.manual-chooser-options{display:grid;gap:10px;}
.manual-choice{width:100%;min-height:78px;display:grid;grid-template-columns:38px 1fr 20px;align-items:center;gap:12px;text-align:left;padding:13px 14px;border:1px solid rgba(148,163,184,.16);border-radius:15px;background:#111a25;color:#eef3f8;cursor:pointer;}
.manual-choice:hover{border-color:rgba(94,231,247,.32);background:rgba(94,231,247,.065);}
.manual-choice-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(94,231,247,.09);color:#5ee7f7;font-size:18px;}
.manual-choice-copy{min-width:0;display:flex;flex-direction:column;gap:4px;}
.manual-choice-copy strong{font:700 14px/1.3 Inter,sans-serif;}
.manual-choice-copy small{color:#8491a2;font:500 11px/1.45 Inter,sans-serif;}
.manual-choice-arrow{color:#8491a2;font-size:25px;}
.manual-chooser-note{margin-top:14px;padding-top:13px;border-top:1px solid rgba(148,163,184,.13);color:#687487;font:500 10.5px/1.45 Inter,sans-serif;text-align:center;}
body[data-theme="light"] .manual-chooser-overlay{background:rgba(52,48,42,.30);}
body[data-theme="light"] .manual-chooser-card{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 24px 70px rgba(58,53,42,.18);}
body[data-theme="light"] .manual-chooser-kicker{color:#4b365f;}
body[data-theme="light"] .manual-chooser-head p,
body[data-theme="light"] .manual-choice-copy small,
body[data-theme="light"] .manual-choice-arrow{color:#817d77;}
body[data-theme="light"] .manual-chooser-close,
body[data-theme="light"] .manual-choice{background:rgba(255,255,255,.78);color:#27302d;border-color:rgba(75,54,95,.14);}
body[data-theme="light"] .manual-choice:hover{border-color:rgba(75,54,95,.28);background:rgba(75,54,95,.055);}
body[data-theme="light"] .manual-choice-icon{background:rgba(75,54,95,.085);color:#4b365f;}
body[data-theme="light"] .manual-chooser-note{border-color:rgba(75,54,95,.12);color:#817d77;}
@media(max-width:700px){
  .manual-chooser-overlay{align-items:center;padding:12px;}
  .manual-chooser-card{width:100%;max-height:calc(100dvh - 24px);border-radius:20px;padding:19px 16px;}
  .manual-chooser-head h2{font-size:24px;}
  .manual-choice{min-height:72px;padding:12px;grid-template-columns:36px 1fr 18px;gap:10px;}
  .manual-choice-copy strong{font-size:13px;}.manual-choice-copy small{font-size:10.5px;}
}
`;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindManualButton, { once: true });
  } else {
    bindManualButton();
  }
})();
