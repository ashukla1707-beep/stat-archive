function setupCardTilt() {
  // Disabled for performance: thousands of cards do not need individual
  // pointermove listeners. CSS hover supplies the lightweight interaction.
}

function filteredEntries() {
  const searchTerms = searchQ ? searchQ.split(/\s+/).filter(Boolean) : null;
  return entries.filter(e => {
    if (filterSubjects.size > 0 && !filterSubjects.has(e.subject)) return false;
    if (filterTypes.size > 0 && !filterTypes.has(e.type)) return false;
    if (searchTerms) {
      const meta = subjectMeta(e.subject);
      const hay = `${e.title} ${e.filename} ${e.year || ""} ${meta.name} ${e.type}`.toLowerCase();
      if (!searchTerms.every(term => hay.includes(term))) return false;
    }
    return true;
  });
}

// Entries are always filed in this exact order inside each subject/row:
// Book -> Notes -> latest-year Mid-Term -> latest-year Previous Year ->
// next-year Mid-Term -> next-year Previous Year -> ... -> Others.
// Normalize backend/legacy type names before sorting. The upload API uses
// "Books" while the UI uses "Book", which previously caused Notes to appear
// before Books because "Books" was not present in TYPE_ORDER.
function canonicalEntryType(type) {
  const t = String(type || "").trim().toLowerCase();
  if (t === "book" || t === "books") return "Book";
  if (t === "note" || t === "notes") return "Notes";
  if (t === "mid-term question" || t === "mid term question" || t === "midterm question") return "Mid-Term Question";
  if (t === "previous year question" || t === "previous-year question" || t === "previous year questions") return "Previous Year Question";
  return "Others";
}

const TYPE_ORDER = {
  "Book": 0,
  "Notes": 1,
  "Mid-Term Question": 2,
  "Previous Year Question": 2,
  "Others": 3
};

const QUESTION_TYPE_ORDER = {
  "Mid-Term Question": 0,
  "Previous Year Question": 1
};

function entryYear(entry) {
  // Prefer the database year. If it is missing/invalid, recover a year from
  // the title or filename so old records still sort correctly.
  const sources = [entry.year, entry.title, entry.filename];
  for (const source of sources) {
    const text = String(source || "");
    const match = text.match(/(?:19|20)\d{2}/);
    if (match) return Number(match[0]);
  }
  return -Infinity;
}

function sortEntriesForDisplay(list) {
  return [...list].sort((a, b) => {
    const typeA = canonicalEntryType(a.type);
    const typeB = canonicalEntryType(b.type);
    const ta = TYPE_ORDER[typeA] ?? 3;
    const tb = TYPE_ORDER[typeB] ?? 3;

    // Book first, then Notes, regardless of upload date.
    if (ta !== tb) return ta - tb;

    // For question papers, sort by year first (newest to oldest), then
    // Mid-Term before Previous Year for the same year.
    if (ta === 2) {
      const ya = entryYear(a);
      const yb = entryYear(b);
      if (ya !== yb) return yb - ya;

      const qa = QUESTION_TYPE_ORDER[typeA] ?? 99;
      const qb = QUESTION_TYPE_ORDER[typeB] ?? 99;
      if (qa !== qb) return qa - qb;
    }

    const titleA = String(a.title || a.filename || "").toLowerCase();
    const titleB = String(b.title || b.filename || "").toLowerCase();
    return titleA.localeCompare(titleB);
  });
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const offlineEntryIds = new Set();
/* =========================================================
   REMEMBER PREVIEWED / DOWNLOADED ENTRIES ON THIS DEVICE
   ========================================================= */

function readEntryActionHistory(key) {

  try {

    const stored =
      JSON.parse(
        localStorage.getItem(key) || "[]"
      );

    return new Set(
      Array.isArray(stored)
        ? stored.map(String)
        : []
    );

  } catch {

    return new Set();
  }
}


function saveEntryActionHistory(
  key,
  set
) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(
        [...set]
      )
    );

  } catch {}
}


const previewedEntryIds =
  readEntryActionHistory(
    "statArchivePreviewedEntries"
  );


const downloadedEntryIds =
  readEntryActionHistory(
    "statArchiveDownloadedEntries"
  );
function buildCard(entry) {
  const meta = subjectMeta(entry.subject);
  // Entry deletion is Admin-only. Contributors may edit their allowed
  // recent entries, but must never be shown a delete action.
  const canDelete = !!session && archiveRole === "admin";
  const canEdit = canEditEntry(entry);
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.tilt = "true";
  card.dataset.id = entry.id;
  const questionWithoutTitle =
    entry.type === "Mid-Term Question" || entry.type === "Previous Year Question";

  // Notes are stored as "Subject — Notes" (or "Subject — Notes: Subtitle").
  // Showing that as a separate bold card title duplicated the "Notes" type
  // badge right below it. Instead, treat Notes like question papers (no
  // separate title) and fold any subtitle into the type badge itself:
  // "Notes" or "Notes - Subtitle".
  const isNotes = entry.type === "Notes";
  const isBook = entry.type === "Book";
  const notesBaseTitle = `${meta.name} — Notes`;
  let notesSubtitle = "";
  if (isNotes) {
    const raw = entry.title || "";
    const notesPrefix = new RegExp(`^${escapeRegExp(notesBaseTitle)}\s*[:：-]?\s*`, "i");
    if (notesPrefix.test(raw)) notesSubtitle = raw.replace(notesPrefix, "").trim();
  }
  const displayTitle = (isNotes || isBook) ? "" : (entry.title || "");
  const typeLabel = isNotes && notesSubtitle
    ? `Notes - ${notesSubtitle}`
    : isBook && entry.title
      ? `Book - ${entry.title}`
      : entry.type;

  const hideTitle = questionWithoutTitle || isNotes || isBook || !displayTitle;
  if (hideTitle) card.classList.add("card-no-title");

  card.innerHTML = `
    <div class="stamp">${escapeHtml(meta.name)}</div>
    ${hideTitle ? "" : `<div class="card-title" title="${escapeHtml(displayTitle)}" data-full-title="${escapeHtml(displayTitle)}" tabindex="0">${escapeHtml(displayTitle)}</div>`}
    <div class="card-meta-row">
      <span class="card-type"${isBook && entry.title ? ` data-full-title="${escapeHtml(typeLabel)}" tabindex="0"` : ""}>${escapeHtml(typeLabel)}</span>
      ${entry.year ? `<span class="card-year">${escapeHtml(entry.year)}</span>` : ""}
    </div>

    <div class="card-actions">
      ${entry.driveUrl
      ? `<button class="action-btn drive-btn">↗ Open in Drive</button>`
: `
  <button
    class="action-btn pv-btn${previewedEntryIds.has(String(entry.id)) ? " is-previewed" : ""}"
  >
    ⊙ Preview
  </button>

  <button
    class="action-btn dl-btn${downloadedEntryIds.has(String(entry.id)) ? " is-downloaded" : ""}"
  >
    ⬇ Download
  </button>

  <button
    class="action-btn offline-btn${offlineEntryIds.has(String(entry.id)) ? " is-saved" : ""}"
    title="${offlineEntryIds.has(String(entry.id)) ? "Already saved offline — open Offline library" : "Save inside Stat Archive for offline access"}"
  >
    ${offlineEntryIds.has(String(entry.id)) ? "✓ Offline" : "⇩ Offline"}
  </button>
`
      }
      ${canEdit ? `<button class="action-btn edit-btn" title="${archiveRole === "admin" ? "Edit entry" : "Edit one of the 3 newest entries"}" aria-label="${archiveRole === "admin" ? "Edit entry" : "Edit one of the 3 newest entries"}">✎ Edit</button>` : ""}
      ${canDelete ? `<button class="action-btn del-btn" style="color:#FF8A8A;" title="Delete entry" aria-label="Delete entry">🗑</button>` : ""}
    </div>
  `;
  // Action buttons are wired via a single delegated listener on #grid
  // (see setup below) instead of per-card onclick handlers, which used to
  // attach thousands of listeners to the DOM as more entries were rendered.
  return card;
}

function cardsPerView(track) {
  const w = track.clientWidth;
  if (w <= 0) return 1;
  const first = track.querySelector(".card");
  if (!first) return 1;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
  const cardWidth = first.getBoundingClientRect().width + gap;
  return Math.max(1, Math.round((w + gap) / cardWidth));
}

function refreshCarouselNav(wrap) {
  const track = wrap.querySelector(".subject-track");
  const prev = wrap.querySelector(".subject-nav-prev");
  const next = wrap.querySelector(".subject-nav-next");
  if (!track || !prev || !next) return;

  const overflow = track.scrollWidth - track.clientWidth > 4;
  if (!overflow) {
    prev.classList.remove("show");
    next.classList.remove("show");
    return;
  }
  prev.classList.toggle("show", track.scrollLeft > 4);
  next.classList.toggle("show", track.scrollLeft < track.scrollWidth - track.clientWidth - 4);
}

function wireSubjectCarousel(wrap) {
  const track = wrap.querySelector(".subject-track");
  const prev = wrap.querySelector(".subject-nav-prev");
  const next = wrap.querySelector(".subject-nav-next");
  const mobileRange = wrap.querySelector(".subject-mobile-scroll-range");
  const mobileScrollbar = wrap.querySelector(".subject-mobile-scrollbar");

  function syncMobileRange() {
    if (!mobileRange || !track) return;
    if (document.activeElement === mobileRange) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    mobileRange.max = String(Math.max(1, Math.round(max)));
    mobileRange.value = String(Math.min(Math.max(0, Math.round(track.scrollLeft)), Math.max(1, Math.round(max))));
    mobileRange.disabled = max <= 4;
    if (mobileScrollbar) mobileScrollbar.classList.toggle("is-disabled", max <= 4);
  }

  function scrollByPage(dir) {
    const perView = cardsPerView(track);
    const first = track.querySelector(".card");
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const rawStep = first ? (first.getBoundingClientRect().width + gap) * perView : track.clientWidth;
    // Round to a whole pixel before scrolling. getBoundingClientRect()
    // can return sub-pixel widths (cards are sized via a CSS calc() that
    // doesn't always divide evenly), and multiplying that fractional
    // width by perView compounds the error. A fractional scroll target
    // could land scrollLeft just off of a scroll-snap-align boundary,
    // occasionally making it snap to the wrong (sometimes previous) card.
    const step = Math.round(rawStep);
    // Removed the explicit "smooth" behavior option: it fights the
    // .subject-track CSS scroll-snap-type on Safari and causes jank.
    // The CSS already sets scroll-behavior:smooth, so motion stays smooth.
    track.scrollBy({ left: dir * step });
  }

  if (mobileRange) {
    mobileRange.oninput = () => {
      track.scrollLeft = Number(mobileRange.value) || 0;
    };
    mobileRange.addEventListener("pointerdown", () => {
      track.style.scrollBehavior = "auto";
      track.style.scrollSnapType = "none";
    });
    mobileRange.addEventListener("pointerup", () => {
      track.style.scrollBehavior = "";
      track.style.scrollSnapType = "";
    });
  }

  prev.onclick = () => scrollByPage(-1);
  next.onclick = () => scrollByPage(1);
  track.addEventListener("scroll", () => {
    refreshCarouselNav(wrap);
    syncMobileRange();
  }, { passive: true });
  // Note: no per-carousel window resize listener here anymore — see the
  // single global listener registered near the bottom of this script.
  // Attaching one every time render() runs (i.e. on every keystroke while
  // searching) used to pile up hundreds of duplicate listeners and could
  // freeze the tab on resize.
  //
  // Fix: don't check overflow synchronously here. .subject-track uses
  // content-visibility:auto, and right after the row is inserted the
  // browser hasn't yet decided whether it intersects the viewport — until
  // it does, scrollWidth/clientWidth can reflect the contain-intrinsic-size
  // placeholder instead of the real card layout, so the overflow check
  // silently comes back false and the arrow never gets its "show" class.
  // A double rAF waits for that first real layout/paint before measuring.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshCarouselNav(wrap);
      syncMobileRange();
    });
  });
}

// Remember each subject carousel position when a render is triggered by an action
// such as deleting an entry. This prevents the row from jumping back to the
// first card after every deletion.
let pendingCarouselPositions = null;

function captureCarouselPositions() {
  const positions = new Map();
  document.querySelectorAll(".subject-row[data-subject-code]").forEach(row => {
    const track = row.querySelector(".subject-track");
    if (track) positions.set(row.dataset.subjectCode, track.scrollLeft);
  });
  return positions;
}

function restoreCarouselPositions(positions) {
  if (!positions || !positions.size) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".subject-row[data-subject-code]").forEach(row => {
        const saved = positions.get(row.dataset.subjectCode);
        const track = row.querySelector(".subject-track");
        if (track && Number.isFinite(saved)) {
          const max = Math.max(0, track.scrollWidth - track.clientWidth);
          track.scrollLeft = Math.min(saved, max);
          refreshCarouselNav(row.querySelector(".subject-carousel"));
        }
      });
    });
  });
}

function render() {
  document.getElementById("entry-full-title-tooltip")?.classList.remove("show");
  const carouselPositions = pendingCarouselPositions;
  pendingCarouselPositions = null;
  const grid = document.getElementById("grid");
  const summaryEntries = document.getElementById("summaryEntries");
  const summarySubjects = document.getElementById("summarySubjects");
  if (summaryEntries) summaryEntries.textContent = entries.length;

  // Count only subjects that actually have at least one archived file.
  // This is based on entries, not on the total subject list.
  const subjectsWithFiles = new Set(
    entries.map(entry => entry.subject).filter(Boolean)
  ).size;
  if (summarySubjects) summarySubjects.textContent = subjectsWithFiles;

  updateStorageUI();
  const empty = document.getElementById("emptyState");
  const list = filteredEntries();
  if (isLoadingArchive) {
    grid.innerHTML = "";
    empty.style.display = "flex";
    empty.innerHTML = `<p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:16px;color:var(--text);">Loading archive…</p><p style="margin:8px 0 0;font-size:13.5px;color:var(--muted);">Fetching the latest entries.</p>`;
    return;
  }
  grid.innerHTML = "";
  if (list.length === 0) {
    empty.style.display = "flex";
    if (entries.length === 0) {
      const promptText = session && archiveRole !== "viewer"
        ? "Click '+ File a new entry' above to get started."
        : "Sign in to file the first question paper or note.";
      empty.innerHTML = `<p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:16px;color:var(--text);">Nothing filed yet.</p><p style="margin:8px 0 0;font-size:13.5px;color:var(--muted);">${promptText}</p>`;
    } else {
      empty.innerHTML = `<p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:16px;color:var(--text);">No entries match these filters.</p><p style="margin:8px 0 0;font-size:13.5px;color:var(--muted);">Try a different subject or type.</p>`;
    }
    return;
  }
  empty.style.display = "none";

  // Normal view groups entries by subject. Latest Entries (available to
  // Contributors/Admins) combines every subject into one row and orders by
  // uploadedAt, newest first -- regardless of entry type (Book, Notes,
  // Mid-Term, Previous Year all mix together purely by recency).
  const bySubject = new Map();
  if (latestEntriesMode) {
    bySubject.set(
      "__latest__",
      [...list].sort((a, b) => {
        const da = new Date(a.uploadedAt).getTime() || 0;
        const db = new Date(b.uploadedAt).getTime() || 0;
        return db - da; // newest upload first, no type priority
      })
    );
  } else {
    const subjectIndex = getSubjectIndex();
    list.forEach(entry => {
      const isKnown = subjectIndex.has(entry.subject);
      const code = isKnown ? entry.subject : "__none__";
      if (!bySubject.has(code)) bySubject.set(code, []);
      bySubject.get(code).push(entry);
    });
  }

  // Entries section: show subjects alphabetically by subject name, with the
  // special Other/OTHERS subject always at the very end. This ordering is
  // shared by both desktop and mobile because both use the same render list.
  const orderedCodes = latestEntriesMode
    ? ["__latest__"]
    : [
        ...subjects
          .filter(s => bySubject.has(s.code))
          .sort((a, b) => {
            const aName = String(a.name || "").trim();
            const bName = String(b.name || "").trim();
            const aIsOther = a.code === "MISC" || /^(other|others)$/i.test(aName);
            const bIsOther = b.code === "MISC" || /^(other|others)$/i.test(bName);
            if (aIsOther && !bIsOther) return 1;
            if (!aIsOther && bIsOther) return -1;
            return aName.localeCompare(bName, undefined, { sensitivity: "base" });
          })
          .map(s => s.code),
        ...(bySubject.has("__none__") ? ["__none__"] : [])
      ];

  const wraps = [];
  const visibleCodes = latestEntriesMode || showAllEntrySubjects
    ? orderedCodes
    : orderedCodes.slice(0, VISIBLE_ENTRY_SUBJECT_LIMIT);

  const gridFragment = document.createDocumentFragment();
  visibleCodes.forEach(code => {
    const groupEntries = bySubject.get(code);
    const meta = subjectMeta(code === "__none__" ? undefined : code);

    const row = document.createElement("div");
    row.className = "subject-row";
    row.dataset.subjectCode = code;
    row.innerHTML = `
  <div class="subject-row-head">
    <div class="subject-row-title">

      <span class="subject-row-name">
        ${code === "__latest__" ? "Latest entries" : escapeHtml(meta.name)}
      </span>

      <span class="subject-row-count">
        ${groupEntries.length}
        ${groupEntries.length === 1 ? "entry" : "entries"}
      </span>

    </div>
  </div>
      <div class="subject-carousel">
        <div class="subject-track"></div>
        <div class="subject-nav-row">
          <button type="button" class="subject-nav subject-nav-prev" aria-label="Scroll left">‹</button>
          <button type="button" class="subject-nav subject-nav-next" aria-label="Scroll right">›</button>
        </div>
        <div class="subject-mobile-scrollbar" aria-hidden="true">
          <input type="range" class="subject-mobile-scroll-range" min="0" max="0" value="0" step="1" tabindex="-1" aria-label="Slide entries">
        </div>
      </div>
    `;
    const track = row.querySelector(".subject-track");
    const displayEntries = code === "__latest__" ? groupEntries : sortEntriesForDisplay(groupEntries);
    const trackFragment = document.createDocumentFragment();
    displayEntries.forEach(entry => trackFragment.appendChild(buildCard(entry)));
    track.appendChild(trackFragment);
    gridFragment.appendChild(row);
    wraps.push(row.querySelector(".subject-carousel"));
  });
  grid.appendChild(gridFragment);

  wraps.forEach(wireSubjectCarousel);

  if (!latestEntriesMode && orderedCodes.length > VISIBLE_ENTRY_SUBJECT_LIMIT) {
    const moreWrap = document.createElement("div");
    moreWrap.className = "entry-subject-more-wrap";
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "entry-subject-more-btn";
    moreBtn.textContent = showAllEntrySubjects ? "Show less" : "More";
    moreBtn.onclick = () => {
      // Preserve the viewport relative to this results control while render()
      // inserts/removes subject groups above it. This is the "More" shown
      // beneath the archive subject sections (not the filter-row More).
      const beforeTop = moreWrap.getBoundingClientRect().top;
      moreBtn.blur();

      showAllEntrySubjects = !showAllEntrySubjects;
      render();

      // Find the newly rendered More/Show less control and compensate only
      // for the layout displacement caused by inserting/removing groups.
      const replacement = grid.querySelector(".entry-subject-more-wrap");
      if (replacement) {
        const afterTop = replacement.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        if (Math.abs(delta) > 0.5) {
          window.scrollBy({ top: delta, left: 0, behavior: "auto" });
        }
      }
    };
    moreWrap.appendChild(moreBtn);
    grid.appendChild(moreWrap);
  }

  restoreCarouselPositions(carouselPositions);
  setupCardTilt();
}

