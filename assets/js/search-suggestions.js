(() => {
  if (window.__statArchiveSearchSuggestionsLoadedV7) return;
  window.__statArchiveSearchSuggestionsLoadedV7 = true;

  // Disable the previous broad "share every book across both levels" policy.
  // Only books filed under Other are shared into both archive views now.
  window.__statArchiveSharedBooksLoadedV1 = true;

  const esc = value => String(value ?? "").replace(/[&<>"]/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  }[ch]));
  const norm = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const isBook = type => /^books?$/i.test(String(type || "").trim());
  const otherLevelFor = level => level === "bsc" ? "msc" : "bsc";
  const levelLabel = level => level === "bsc" ? "B.Sc" : "M.Sc";
  const remoteCache = new Map();

  function findInput() {
    return Array.from(document.querySelectorAll('input[type="search"], input'))
      .find(el => /search by title/i.test(el.placeholder || ""));
  }

  function ownEntries() {
    try {
      if (typeof entries !== "undefined" && Array.isArray(entries)) return entries;
    } catch (_) {}
    try {
      if (Array.isArray(window.entries)) return window.entries;
    } catch (_) {}
    return [];
  }

  function ownSubjects() {
    try {
      if (typeof subjects !== "undefined" && Array.isArray(subjects)) return subjects;
    } catch (_) {}
    try {
      if (Array.isArray(window.subjects)) return window.subjects;
    } catch (_) {}
    return [];
  }

  function subjectName(code) {
    try {
      if (typeof subjectMeta === "function") return subjectMeta(code)?.name || code || "";
    } catch (_) {}
    const hit = ownSubjects().find(s => String(s?.code || s?.id || "") === String(code || ""));
    return hit?.name || code || "";
  }

  function isOtherSubject(code, name) {
    const c = norm(code);
    const n = norm(name);
    return c === "misc" || c === "other" || c === "others" || n === "other" || n === "others";
  }

  function labelFor(entry) {
    const type = String(entry?.type || "").trim();
    const title = String(entry?.title || entry?.filename || entry?.file_name || "Untitled").trim();
    if (/^book$/i.test(type) && !/^book\s*[-–—]/i.test(title)) return `Book - ${title}`;
    return title;
  }

  function signature(entry) {
    return `${norm(entry?.title)}|${norm(entry?.filename || entry?.file_name)}`;
  }

  async function fetchLevelBundle(level) {
    const key = level === "bsc" ? "bsc" : "msc";
    const cached = remoteCache.get(key);
    if (cached && Date.now() - cached.at < 15000) return cached.promise;

    const promise = (async () => {
      const [entryData, subjectData] = await Promise.all([
        workerFetch(`/entries?level=${encodeURIComponent(key)}`),
        workerFetch(`/subjects?level=${encodeURIComponent(key)}`)
      ]);
      const rawEntries = Array.isArray(entryData?.entries) ? entryData.entries : [];
      const rawSubjects = Array.isArray(subjectData?.subjects) ? subjectData.subjects : [];
      const subjectNames = new Map();
      rawSubjects.forEach(s => {
        const code = String(s?.code || s?.id || "").trim();
        if (code) subjectNames.set(code, String(s?.name || code).trim());
      });
      return { level: key, entries: rawEntries, subjects: rawSubjects, subjectNames };
    })();

    remoteCache.set(key, { at: Date.now(), promise });
    try {
      return await promise;
    } catch (error) {
      remoteCache.delete(key);
      throw error;
    }
  }

  function currentOtherCode(bundle) {
    const list = Array.isArray(bundle?.subjects) ? bundle.subjects : [];
    const hit = list.find(s => isOtherSubject(s?.code, s?.name));
    return String(hit?.code || "MISC");
  }

  async function sharedOtherBooksFor(level) {
    const other = otherLevelFor(level);
    const [currentBundle, foreignBundle] = await Promise.all([
      fetchLevelBundle(level),
      fetchLevelBundle(other)
    ]);
    const targetOtherCode = currentOtherCode(currentBundle);

    return foreignBundle.entries
      .filter(raw => isBook(raw?.type))
      .filter(raw => {
        const code = String(raw?.subjects?.code || raw?.subject || "").trim();
        const name = String(raw?.subjects?.name || foreignBundle.subjectNames.get(code) || "").trim();
        return isOtherSubject(code, name);
      })
      .map(raw => {
        const mapped = typeof mapDbEntry === "function" ? mapDbEntry(raw) : {
          ...raw,
          filename: raw?.file_name || raw?.filename || "file",
          path: raw?.r2_key || "",
          driveUrl: raw?.drive_url || null
        };
        mapped.subject = targetOtherCode;
        mapped.level = raw?.level || other;
        mapped.contributorEditable = false;
        mapped.sharedAcrossLevels = true;
        mapped.sharedSourceLevel = other;
        return mapped;
      });
  }

  function mergeOnlyOtherBooks(baseEntries, foreignOtherBooks) {
    const own = Array.isArray(baseEntries)
      ? baseEntries.filter(entry => !entry?.sharedAcrossLevels)
      : [];
    const ids = new Set(own.map(e => String(e?.id ?? "")));
    const sigs = new Set(own.filter(e => isBook(e?.type)).map(signature).filter(s => s !== "|"));
    const extra = [];

    for (const book of foreignOtherBooks || []) {
      const id = String(book?.id ?? "");
      const sig = signature(book);
      if (id && ids.has(id)) continue;
      if (sig !== "|" && sigs.has(sig)) continue;
      if (id) ids.add(id);
      if (sig !== "|") sigs.add(sig);
      extra.push(book);
    }
    return [...own, ...extra];
  }

  // Keep normal M.Sc/B.Sc entries separate. The only automatic cross-level
  // cards are books that were deliberately filed under the Other subject.
  if (typeof loadEntries === "function") {
    const baseLoadEntries = loadEntries;
    loadEntries = async function loadEntriesWithSharedOtherBooks(...args) {
      const base = await baseLoadEntries.apply(this, args);
      try {
        const foreignOther = await sharedOtherBooksFor(currentLevel);
        return mergeOnlyOtherBooks(base, foreignOther);
      } catch (error) {
        console.warn("Could not load cross-level Other books:", error);
        return base;
      }
    };
  }

  async function reconcileSharedOtherBooks() {
    try {
      if (typeof entries === "undefined" || !Array.isArray(entries)) return;
      const foreignOther = await sharedOtherBooksFor(currentLevel);
      const merged = mergeOnlyOtherBooks(entries, foreignOther);
      const oldKey = entries.map(e => `${e?.id}|${e?.sharedAcrossLevels ? 1 : 0}`).join(",");
      const newKey = merged.map(e => `${e?.id}|${e?.sharedAcrossLevels ? 1 : 0}`).join(",");
      if (oldKey === newKey) return;
      entries = merged;
      try {
        totalStorageBytes = entries.reduce((sum, entry) =>
          sum + (Number.isFinite(Number(entry?.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0
        );
      } catch (_) {}
      try { if (typeof render === "function") render(); } catch (_) {}
    } catch (error) {
      console.warn("Could not reconcile cross-level Other books:", error);
    }
  }

  function localSubjectMatches(query) {
    const q = norm(query);
    if (!q) return [];
    const counts = new Map();
    ownEntries().forEach(entry => {
      const code = String(entry?.subject || "").trim();
      if (code) counts.set(code, (counts.get(code) || 0) + 1);
    });

    return ownSubjects()
      .map(subject => {
        const code = String(subject?.code || subject?.id || "").trim();
        const name = String(subject?.name || subjectName(code) || code).trim();
        return { code, name, count: counts.get(code) || 0, hay: norm(`${name} ${code}`) };
      })
      .filter(s => s.name && s.hay.includes(q))
      .sort((a,b) => {
        const an = norm(a.name), bn = norm(b.name);
        const ap = an.startsWith(q) ? 0 : an.includes(q) ? 1 : 2;
        const bp = bn.startsWith(q) ? 0 : bn.includes(q) ? 1 : 2;
        return ap - bp || an.localeCompare(bn);
      })
      .slice(0, 4)
      .map(s => ({
        kind: "subject",
        id: "",
        label: s.name,
        meta: `Subject · ${s.count} ${s.count === 1 ? "entry" : "entries"}`
      }));
  }

  function localEntryMatches(query) {
    const q = norm(query);
    if (!q) return [];
    return ownEntries()
      .filter(entry => {
        const hay = norm([
          labelFor(entry), entry?.title, entry?.filename, entry?.year, entry?.type,
          entry?.subject, subjectName(entry?.subject)
        ].filter(Boolean).join(" "));
        return hay.includes(q);
      })
      .sort((a,b) => labelFor(a).localeCompare(labelFor(b), undefined, { sensitivity: "base" }))
      .slice(0, 8)
      .map(entry => ({
        kind: "entry",
        id: String(entry?.id ?? ""),
        label: labelFor(entry),
        meta: [subjectName(entry?.subject), entry?.type, entry?.year].filter(Boolean).join(" · ")
      }));
  }

  async function foreignBookMatches(query) {
    const q = norm(query);
    if (!q) return [];
    const target = otherLevelFor(currentLevel);
    const bundle = await fetchLevelBundle(target);
    const localIds = new Set(ownEntries().map(e => String(e?.id ?? "")));
    const localSigs = new Set(ownEntries().filter(e => isBook(e?.type)).map(signature));

    return bundle.entries
      .filter(raw => isBook(raw?.type))
      .filter(raw => {
        const code = String(raw?.subjects?.code || raw?.subject || "").trim();
        const subject = String(raw?.subjects?.name || bundle.subjectNames.get(code) || code).trim();
        const title = String(raw?.title || raw?.file_name || raw?.filename || "Untitled").trim();
        const label = /^book\s*[-–—]/i.test(title) ? title : `Book - ${title}`;
        const hay = norm(`${label} ${title} ${raw?.file_name || ""} ${subject} ${raw?.year || ""}`);
        return hay.includes(q);
      })
      .filter(raw => {
        const id = String(raw?.id ?? "");
        const sig = `${norm(raw?.title)}|${norm(raw?.file_name || raw?.filename)}`;
        return !(id && localIds.has(id)) && !localSigs.has(sig);
      })
      .slice(0, 5)
      .map(raw => {
        const code = String(raw?.subjects?.code || raw?.subject || "").trim();
        const subject = String(raw?.subjects?.name || bundle.subjectNames.get(code) || code || "Other").trim();
        const title = String(raw?.title || raw?.file_name || raw?.filename || "Untitled").trim();
        const label = /^book\s*[-–—]/i.test(title) ? title : `Book - ${title}`;
        return {
          kind: "foreign-book",
          id: String(raw?.id ?? ""),
          label,
          targetLevel: target,
          meta: `Available in ${levelLabel(target)} · ${subject}${raw?.year ? ` · ${raw.year}` : ""}`
        };
      });
  }

  function setupSuggestions() {
    const input = findInput();
    if (!input || input.dataset.searchSuggestionsV7 === "1") return;
    input.dataset.searchSuggestionsV7 = "1";

    const panel = document.createElement("div");
    panel.className = "archive-search-suggestions-v2";
    panel.hidden = true;
    panel.setAttribute("role", "listbox");
    document.body.appendChild(panel);

    const style = document.createElement("style");
    style.textContent = `
      .archive-search-suggestions-v2{position:fixed;z-index:2147483000;max-height:min(420px,52vh);overflow:auto;padding:6px;background:rgba(10,16,24,.985);border:1px solid rgba(94,231,247,.28);border-radius:14px;box-shadow:0 18px 45px rgba(0,0,0,.44);backdrop-filter:blur(18px)}
      body[data-theme="light"] .archive-search-suggestions-v2{background:rgba(250,248,242,.99);border-color:rgba(52,125,115,.25);box-shadow:0 18px 45px rgba(75,54,95,.16)}
      .archive-search-suggestion-v2{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;border:0;background:transparent;color:var(--text);padding:11px 12px;border-radius:10px;text-align:left;cursor:pointer}
      .archive-search-suggestion-v2:hover,.archive-search-suggestion-v2.is-active{background:rgba(94,231,247,.10)}
      body[data-theme="light"] .archive-search-suggestion-v2:hover,body[data-theme="light"] .archive-search-suggestion-v2.is-active{background:rgba(52,125,115,.10)}
      .archive-search-suggestion-v2-main{min-width:0}.archive-search-suggestion-v2-title{display:block;font:700 13px/1.35 'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.archive-search-suggestion-v2-meta{display:block;margin-top:3px;color:var(--muted);font:600 10px/1.3 'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.archive-search-suggestion-v2-arrow{flex:0 0 auto;color:var(--accent);font-size:16px}
      .archive-search-suggestion-v2[data-kind="subject"] .archive-search-suggestion-v2-title{color:var(--accent)}
      .archive-search-suggestion-v2[data-kind="foreign-book"] .archive-search-suggestion-v2-meta{color:var(--accent)}
      @media(max-width:700px){.archive-search-suggestions-v2{max-height:45vh}.archive-search-suggestion-v2{padding:10px}.archive-search-suggestion-v2-title{font-size:12px}}
    `;
    document.head.appendChild(style);

    let matches = [];
    let active = -1;
    let renderToken = 0;
    let suppressUntilInput = false;

    function positionPanel() {
      if (panel.hidden) return;
      const r = input.getBoundingClientRect();
      panel.style.left = `${Math.max(8, r.left)}px`;
      panel.style.width = `${Math.max(240, Math.min(r.width, window.innerWidth - 16))}px`;
      panel.style.top = `${Math.min(window.innerHeight - 80, r.bottom + 8)}px`;
    }

    function close() {
      panel.hidden = true;
      panel.innerHTML = "";
      matches = [];
      active = -1;
    }

    function applyFilter() {
      const q = norm(input.value);
      try { if (typeof searchQ !== "undefined") searchQ = q; } catch (_) {}
      try { if (typeof showAllEntrySubjects !== "undefined") showAllEntrySubjects = !!q; } catch (_) {}
      const clearBtn = document.getElementById("searchClear");
      if (clearBtn) clearBtn.style.display = q ? "inline-flex" : "none";
      try { if (typeof render === "function") render(); } catch (_) {}
    }

    async function renderSuggestions() {
      if (suppressUntilInput) return close();
      const q = input.value.trim();
      if (!q) return close();
      const token = ++renderToken;

      const subjectsLocal = localSubjectMatches(q);
      const entriesLocal = localEntryMatches(q);
      let remoteBooks = [];
      try { remoteBooks = await foreignBookMatches(q); } catch (_) {}
      if (token !== renderToken || input.value.trim() !== q) return;

      const seen = new Set();
      matches = [...subjectsLocal, ...entriesLocal, ...remoteBooks]
        .filter(item => {
          const key = `${item.kind}|${norm(item.label)}|${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 12);

      if (!matches.length) return close();
      panel.innerHTML = matches.map((m,i) => `
        <button type="button" class="archive-search-suggestion-v2" data-i="${i}" data-kind="${esc(m.kind)}" role="option">
          <span class="archive-search-suggestion-v2-main">
            <span class="archive-search-suggestion-v2-title">${esc(m.label)}</span>
            <span class="archive-search-suggestion-v2-meta">${esc(m.meta)}</span>
          </span>
          <span class="archive-search-suggestion-v2-arrow">↗</span>
        </button>`).join("");
      panel.hidden = false;
      active = -1;
      positionPanel();
    }

    function choose(item) {
      suppressUntilInput = true;
      close();
      input.blur();

      if (item.kind === "foreign-book") {
        try {
          sessionStorage.setItem("statArchivePendingBookSearch", JSON.stringify({
            level: item.targetLevel,
            query: item.label,
            at: Date.now()
          }));
          localStorage.setItem("statArchiveLevel", item.targetLevel);
        } catch (_) {}
        const url = new URL(window.location.href);
        url.searchParams.set("level", item.targetLevel);
        window.location.assign(url.toString());
        return;
      }

      input.value = item.label;
      applyFilter();

      if (item.kind === "subject") {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const row = Array.from(document.querySelectorAll(".subject-row")).find(el => {
            const heading = el.querySelector(".subject-title,.subject-name,h2,h3")?.textContent || "";
            return norm(heading) === norm(item.label);
          });
          row?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        }));
        return;
      }

      requestAnimationFrame(() => requestAnimationFrame(() => {
        const card = document.querySelector(`.card[data-id="${CSS.escape(item.id)}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }));
    }

    input.addEventListener("input", () => {
      suppressUntilInput = false;
      applyFilter();
      renderSuggestions();
    });
    input.addEventListener("focus", () => {
      if (!suppressUntilInput) renderSuggestions();
    });
    input.addEventListener("keydown", e => {
      if (panel.hidden || !matches.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % matches.length; }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(matches[active]); return; }
      else if (e.key === "Escape") { close(); input.blur(); return; }
      panel.querySelectorAll(".archive-search-suggestion-v2").forEach((b,i) => b.classList.toggle("is-active", i === active));
    });

    panel.addEventListener("mousedown", e => e.preventDefault());
    panel.addEventListener("click", e => {
      const button = e.target.closest("[data-i]");
      if (!button) return;
      const item = matches[Number(button.dataset.i)];
      if (item) choose(item);
    });
    document.addEventListener("click", e => {
      if (e.target !== input && !panel.contains(e.target)) close();
    });
    window.addEventListener("resize", positionPanel, { passive: true });
    window.addEventListener("scroll", positionPanel, { passive: true, capture: true });

    // If a cross-level search suggestion moved the user to the other archive,
    // restore that exact book query once the new level has loaded.
    try {
      const pending = JSON.parse(sessionStorage.getItem("statArchivePendingBookSearch") || "null");
      if (pending && pending.level === currentLevel && Date.now() - Number(pending.at || 0) < 30000) {
        sessionStorage.removeItem("statArchivePendingBookSearch");
        setTimeout(() => {
          input.value = pending.query || "";
          suppressUntilInput = true;
          applyFilter();
          input.blur();
        }, 350);
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSuggestions, { once: true });
  } else {
    setupSuggestions();
  }
  setTimeout(setupSuggestions, 1000);
  setTimeout(reconcileSharedOtherBooks, 1200);
})();
