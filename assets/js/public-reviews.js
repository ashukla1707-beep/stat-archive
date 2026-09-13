(() => {
  if (window.__statArchivePublicReviewsV1) return;
  window.__statArchivePublicReviewsV1 = true;

  const NAME_KEY = 'statArchiveReviewNameV1';
  let rating = 0;
  let reviews = [];

  function isAdmin() {
    try { return typeof archiveRole !== 'undefined' && archiveRole === 'admin'; }
    catch (_) { return false; }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function installStyle() {
    if (document.getElementById('statPublicReviewsStyle')) return;
    const style = document.createElement('style');
    style.id = 'statPublicReviewsStyle';
    style.textContent = `
.stat-public-review-overlay{position:fixed;inset:0;z-index:10150;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(2,6,12,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;visibility:hidden;pointer-events:none;transition:.16s ease}.stat-public-review-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto}.stat-public-review-dialog{width:min(520px,100%);max-height:min(90vh,760px);overflow:auto;border:1px solid rgba(148,163,184,.2);border-radius:22px;padding:21px;background:#0d141e;color:#eef3f8;box-shadow:0 28px 80px rgba(0,0,0,.48)}.stat-public-review-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:15px}.stat-public-review-head h2{margin:0 0 5px;font:800 24px/1.1 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-.03em}.stat-public-review-head p{margin:0;color:#8491a2;font:500 12px/1.45 Inter,sans-serif}.stat-public-review-close{width:38px;height:38px;border:1px solid rgba(148,163,184,.18);border-radius:50%;background:#111a25;color:#eef3f8;font-size:21px}.stat-public-review-stars{display:flex;justify-content:center;gap:8px;margin:4px 0 17px}.stat-public-review-star{width:48px;height:48px;border:1px solid rgba(148,163,184,.17);border-radius:13px;background:#111a25;color:#6f7b8b;font-size:27px;cursor:pointer}.stat-public-review-star.is-selected{color:#e8b54d;border-color:rgba(232,181,77,.38);background:rgba(232,181,77,.09)}.stat-public-review-label{display:block;margin:0 0 7px;color:#b9c3ce;font:700 11px/1.3 Inter,sans-serif}.stat-public-review-input,.stat-public-review-textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid rgba(148,163,184,.17);border-radius:12px;background:#111a25;color:#eef3f8;font:500 12px/1.5 Inter,sans-serif;outline:none}.stat-public-review-input{height:44px;margin-bottom:14px}.stat-public-review-textarea{min-height:92px;resize:vertical}.stat-public-review-input:focus,.stat-public-review-textarea:focus{border-color:rgba(94,231,247,.42);box-shadow:0 0 0 3px rgba(94,231,247,.06)}.stat-public-review-status{min-height:18px;margin:9px 0 0;color:#8491a2;font:500 10.5px/1.4 Inter,sans-serif}.stat-public-review-actions{display:flex;gap:9px;margin-top:13px}.stat-public-review-actions button{flex:1;min-height:43px;border-radius:11px;font:700 11px Inter,sans-serif}.stat-public-review-cancel{border:1px solid rgba(148,163,184,.17);background:transparent;color:#c4ccd6}.stat-public-review-save{border:1px solid rgba(94,231,247,.28);background:rgba(94,231,247,.11);color:#8aebf7}.stat-public-review-community{margin-top:22px;padding-top:18px;border-top:1px solid rgba(148,163,184,.14)}.stat-public-review-community-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:11px}.stat-public-review-community-head strong{font:800 13px Inter,sans-serif}.stat-public-review-average{color:#e8b54d;font:700 12px Inter,sans-serif}.stat-public-review-list{display:grid;gap:9px}.stat-public-review-item{position:relative;padding:12px 13px;border:1px solid rgba(148,163,184,.13);border-radius:13px;background:rgba(255,255,255,.018)}.stat-public-review-item-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.stat-public-review-name{font:700 12px Inter,sans-serif}.stat-public-review-rating{color:#e8b54d;font-size:13px;letter-spacing:1px}.stat-public-review-text{margin:7px 0 0;color:#b8c2cd;font:500 11.5px/1.5 Inter,sans-serif;white-space:pre-wrap;word-break:break-word}.stat-public-review-date{margin-top:7px;color:#667386;font:500 9.5px Inter,sans-serif}.stat-public-review-delete{margin-top:9px;border:1px solid rgba(255,120,120,.24);background:rgba(255,120,120,.06);color:#ff9b9b;border-radius:9px;padding:7px 10px;font:700 10px Inter,sans-serif}.stat-public-review-empty{color:#8491a2;font:500 11px/1.5 Inter,sans-serif;padding:8px 2px}.stat-public-review-loading{opacity:.7}
body[data-theme='light'] .stat-public-review-overlay{background:rgba(52,48,42,.3)}body[data-theme='light'] .stat-public-review-dialog{background:#fbfaf7;color:#27302d;border-color:rgba(75,54,95,.15);box-shadow:0 24px 70px rgba(58,53,42,.18)}body[data-theme='light'] .stat-public-review-head p,body[data-theme='light'] .stat-public-review-status,body[data-theme='light'] .stat-public-review-empty{color:#817d77}body[data-theme='light'] .stat-public-review-close,body[data-theme='light'] .stat-public-review-star,body[data-theme='light'] .stat-public-review-input,body[data-theme='light'] .stat-public-review-textarea{background:rgba(255,255,255,.78);color:#27302d;border-color:rgba(75,54,95,.14)}body[data-theme='light'] .stat-public-review-star{color:#aaa39b}body[data-theme='light'] .stat-public-review-star.is-selected{color:#9a701f;border-color:rgba(154,112,31,.28);background:rgba(184,128,20,.08)}body[data-theme='light'] .stat-public-review-label{color:#4f5753}body[data-theme='light'] .stat-public-review-cancel{color:#5f625f;border-color:rgba(75,54,95,.14)}body[data-theme='light'] .stat-public-review-save{color:#4b365f;border-color:rgba(75,54,95,.24);background:rgba(75,54,95,.07)}body[data-theme='light'] .stat-public-review-item{background:rgba(255,255,255,.6);border-color:rgba(75,54,95,.1)}body[data-theme='light'] .stat-public-review-text{color:#5f625f}
@media(max-width:700px){.stat-public-review-dialog{padding:18px 16px;border-radius:20px}.stat-public-review-head h2{font-size:22px}.stat-public-review-stars{gap:6px}.stat-public-review-star{width:44px;height:44px;font-size:25px}}
`;
    document.head.appendChild(style);
  }

  function ensureDialog() {
    let overlay = document.getElementById('statPublicReviewOverlay');
    if (overlay) return overlay;
    installStyle();
    overlay = document.createElement('div');
    overlay.id = 'statPublicReviewOverlay';
    overlay.className = 'stat-public-review-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
      <section class="stat-public-review-dialog" role="dialog" aria-modal="true" aria-labelledby="statPublicReviewTitle">
        <div class="stat-public-review-head"><div><h2 id="statPublicReviewTitle">Rate Stat Archive</h2><p>Your rating and review will be visible publicly.</p></div><button class="stat-public-review-close" type="button" aria-label="Close">×</button></div>
        <div class="stat-public-review-stars" role="group" aria-label="Choose rating">${[1,2,3,4,5].map(n=>`<button type="button" class="stat-public-review-star" data-public-rating="${n}" aria-label="${n} stars">★</button>`).join('')}</div>
        <label class="stat-public-review-label" for="statPublicReviewName">Your name</label>
        <input class="stat-public-review-input" id="statPublicReviewName" maxlength="50" autocomplete="name" placeholder="Enter your name">
        <label class="stat-public-review-label" for="statPublicReviewText">Tell us what you think (optional)</label>
        <textarea class="stat-public-review-textarea" id="statPublicReviewText" maxlength="500" placeholder="What do you like, or what should be improved?"></textarea>
        <div class="stat-public-review-status" id="statPublicReviewStatus"></div>
        <div class="stat-public-review-actions"><button type="button" class="stat-public-review-cancel">Not now</button><button type="button" class="stat-public-review-save">Publish review</button></div>
        <div class="stat-public-review-community"><div class="stat-public-review-community-head"><strong>Community reviews</strong><span class="stat-public-review-average" id="statPublicReviewAverage"></span></div><div class="stat-public-review-list" id="statPublicReviewList"><div class="stat-public-review-empty">Loading reviews…</div></div></div>
      </section>`;
    document.body.appendChild(overlay);

    const close = () => closeDialog();
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.stat-public-review-close')?.addEventListener('click', close);
    overlay.querySelector('.stat-public-review-cancel')?.addEventListener('click', close);
    overlay.querySelectorAll('[data-public-rating]').forEach(btn => btn.addEventListener('click', () => {
      rating = Number(btn.dataset.publicRating || 0);
      syncStars();
      setStatus('');
    }));
    overlay.querySelector('.stat-public-review-save')?.addEventListener('click', submitReview);
    return overlay;
  }

  function setStatus(text) {
    const el = document.getElementById('statPublicReviewStatus');
    if (el) el.textContent = text || '';
  }

  function syncStars() {
    document.querySelectorAll('[data-public-rating]').forEach(btn => {
      const selected = Number(btn.dataset.publicRating) <= rating;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', Number(btn.dataset.publicRating) === rating ? 'true' : 'false');
    });
  }

  function renderReviews() {
    const list = document.getElementById('statPublicReviewList');
    const average = document.getElementById('statPublicReviewAverage');
    if (!list || !average) return;
    if (!reviews.length) {
      average.textContent = '';
      list.innerHTML = '<div class="stat-public-review-empty">No public reviews yet. Be the first.</div>';
      return;
    }
    const avg = reviews.reduce((s,r)=>s+Number(r.rating||0),0)/reviews.length;
    average.textContent = `★ ${avg.toFixed(1)} · ${reviews.length}`;
    list.innerHTML = reviews.map(item => {
      const stars = '★'.repeat(Number(item.rating||0)) + '☆'.repeat(Math.max(0,5-Number(item.rating||0)));
      const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
      return `<article class="stat-public-review-item" data-review-id="${esc(item.id)}"><div class="stat-public-review-item-head"><span class="stat-public-review-name">${esc(item.name)}</span><span class="stat-public-review-rating">${stars}</span></div>${item.review ? `<p class="stat-public-review-text">${esc(item.review)}</p>` : ''}<div class="stat-public-review-date">${esc(date)}</div>${isAdmin() ? `<button type="button" class="stat-public-review-delete" data-delete-review="${esc(item.id)}">Delete review</button>` : ''}</article>`;
    }).join('');
    list.querySelectorAll('[data-delete-review]').forEach(btn => btn.addEventListener('click', () => deleteReview(btn.dataset.deleteReview, btn)));
  }

  async function loadReviews() {
    const list = document.getElementById('statPublicReviewList');
    if (list) list.classList.add('stat-public-review-loading');
    try {
      const res = await fetch('/api/reviews', { cache:'no-store' });
      if (!res.ok) throw new Error(`Could not load reviews (${res.status})`);
      const data = await res.json();
      reviews = Array.isArray(data.reviews) ? data.reviews : [];
      renderReviews();
    } catch (err) {
      if (list) list.innerHTML = `<div class="stat-public-review-empty">${esc(err.message || 'Could not load reviews.')}</div>`;
    } finally {
      list?.classList.remove('stat-public-review-loading');
    }
  }

  async function submitReview() {
    const name = String(document.getElementById('statPublicReviewName')?.value || '').trim();
    const review = String(document.getElementById('statPublicReviewText')?.value || '').trim();
    if (name.length < 2) return setStatus('Please enter your name.');
    if (rating < 1 || rating > 5) return setStatus('Choose a star rating first.');
    const save = document.querySelector('.stat-public-review-save');
    if (save) { save.disabled = true; save.textContent = 'Publishing…'; }
    setStatus('');
    try {
      const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,rating,review}) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Could not publish review.');
      try { localStorage.setItem(NAME_KEY, name); } catch (_) {}
      document.getElementById('statPublicReviewText').value = '';
      rating = 0;
      syncStars();
      setStatus('Published — your review is now public.');
      await loadReviews();
    } catch (err) {
      setStatus(err.message || 'Could not publish review.');
    } finally {
      if (save) { save.disabled = false; save.textContent = 'Publish review'; }
    }
  }

  async function deleteReview(id, btn) {
    if (!id || !isAdmin()) return;
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      let token = '';
      try {
        if (typeof sb !== 'undefined') {
          const result = await sb.auth.getSession();
          token = result?.data?.session?.access_token || '';
        }
      } catch (_) {}
      const res = await fetch(`/api/reviews/${encodeURIComponent(id)}`, { method:'DELETE', headers: token ? {Authorization:`Bearer ${token}`} : {} });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete review.');
      reviews = reviews.filter(item => item.id !== id);
      renderReviews();
    } catch (err) {
      setStatus(err.message || 'Could not delete review.');
      btn.disabled = false;
      btn.textContent = 'Delete review';
    }
  }

  function openDialog() {
    try { window.statArchiveCloseMenu?.(); } catch (_) {}
    document.getElementById('statLocalFeedbackOverlay')?.remove();
    const overlay = ensureDialog();
    try { document.getElementById('statPublicReviewName').value = localStorage.getItem(NAME_KEY) || ''; } catch (_) {}
    rating = 0;
    syncStars();
    setStatus('');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
    loadReviews();
  }

  function closeDialog() {
    const overlay = document.getElementById('statPublicReviewOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }

  function wire() {
    const btn = document.getElementById('menuLocalFeedbackBtn');
    if (btn) {
      const small = btn.querySelector('.stat-menu-row-copy small');
      if (small) small.textContent = 'Public ratings and reviews';
    }
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#menuLocalFeedbackBtn') : null;
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDialog();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, {once:true});
  else wire();
})();
