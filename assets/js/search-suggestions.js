(() => {
  if (window.__statArchiveSearchSuggestionsLoaded) return;
  window.__statArchiveSearchSuggestionsLoaded = true;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[ch]));

  function findMainSearchInput() {
    return Array.from(document.querySelectorAll('input[type="search"], input'))
      .find(input => /search by title/i.test(input.placeholder || ""));
  }

  function getEntries() {
    try {
      return Array.isArray(window.entries) ? window.entries : (typeof entries !== "undefined" && Array.isArray(entries) ? entries : []);
    } catch (_) {
      return [];
    }
  }

  function subjectName(code) {
    try {
      if (typeof subjectMeta === "function") return subjectMeta(code)?.name || code || "";
    } catch (_) {}
    return code || "";
  }

  function entryLabel(entry) {
    const type = String(entry?.type || "").trim();
    const title = String(entry?.title || entry?.filename || "Untitled").trim();
    if (/^book$/i.test(type) && !/^book\s*[-–—]/i.test(title)) return `Book - ${title}`;
    return title;
  }

  function searchableText(entry) {
    return [
      entryLabel(entry),
      entry?.title,
      entry?.filename,
      entry?.year,
      entry?.type,
      entry?.subject,
      subjectName(entry?.subject)
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function rankEntry(entry, query) {
    const q = query.toLowerCase().trim();
    const label = entryLabel(entry).toLowerCase();
    const title = String(entry?.title || "").toLowerCase();
    const hay = searchableText(entry);
    if (label === q || title === q) return 0;
    if (label.startsWith(q) || title.startsWith(q)) return 1;
    if (label.includes(q) || title.includes(q)) return 2;
    if (hay.includes(q)) return 3;
    return 99;
  }

  function setup() {
    const input = findMainSearchInput();
    if (!input || input.dataset.searchSuggestionsReady === "1") return;
    input.dataset.searchSuggestionsReady = "1";

    const host = input.parentElement || input;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    const panel = document.createElement("div");
    panel.className = "archive-search-suggestions";
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", "Search suggestions");
    panel.hidden = true;
    host.appendChild(panel);

    const style = document.createElement("style");
    style.textContent = `
      .archive-search-suggestions{
        position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:1200;
        max-height:min(420px,52vh);overflow:auto;padding:6px;
        background:rgba(10,16,24,.98);border:1px solid rgba(94,231,247,.2);
        border-radius:14px;box-shadow:0 18px 45px rgba(0,0,0,.36);backdrop-filter:blur(18px)
      }
      body[data-theme="light"] .archive-search-suggestions{
        background:rgba(250,248,242,.98);border-color:rgba(52,125,115,.22);box-shadow:0 18px 45px rgba(75,54,95,.14)
      }
      .archive-search-suggestion{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
        border:0;background:transparent;color:var(--text);padding:11px 12px;border-radius:10px;text-align:left;cursor:pointer}
      .archive-search-suggestion:hover,.archive-search-suggestion.is-active{background:rgba(94,231,247,.09)}
      body[data-theme="light"] .archive-search-suggestion:hover,body[data-theme="light"] .archive-search-suggestion.is-active{background:rgba(52,125,115,.09)}
      .archive-search-suggestion-main{min-width:0}.archive-search-suggestion-title{display:block;font:700 13px/1.35 'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .archive-search-suggestion-meta{display:block;margin-top:3px;color:var(--muted);font:600 10px/1.3 'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .archive-search-suggestion-arrow{flex:0 0 auto;color:var(--accent);font-size:16px}
      @media(max-width:700px){.archive-search-suggestions{max-height:45vh}.archive-search-suggestion{padding:10px}.archive-search-suggestion-title{font-size:12px}}
    `;
    document.head.appendChild(style);

    let matches = [];
    let activeIndex = -1;

    function closePanel() {
      panel.hidden = true;
      panel.innerHTML = "";
      activeIndex = -1;
      matches = [];
    }

    function focusEntry(entry) {
      const id = String(entry?.id ?? "");
      if (!id) return;
      requestAnimationFrame(() => {
        const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        card.animate([
          { boxShadow: "0 0 0 0 rgba(94,231,247,0)" },
          { boxShadow: "0 0 0 3px rgba(94,231,247,.55),0 12px 32px rgba(94,231,247,.12)" },
          { boxShadow: "" }
        ], { duration: 1300, easing: "ease-out" });
      });
    }

    function choose(entry) {
      input.value = entryLabel(entry);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      closePanel();
      focusEntry(entry);
    }

    function renderSuggestions() {
      const q = input.value.trim();
      if (!q) return closePanel();

      matches = getEntries()
        .map(entry => ({ entry, rank: rankEntry(entry, q) }))
        .filter(item => item.rank < 99)
        .sort((a, b) => a.rank - b.rank || entryLabel(a.entry).localeCompare(entryLabel(b.entry)))
        .slice(0, 8)
        .map(item => item.entry);

      if (!matches.length) return closePanel();
      activeIndex = -1;
      panel.innerHTML = matches.map((entry, index) => {
        const meta = [subjectName(entry.subject), entry.type, entry.year].filter(Boolean).join(" · ");
        return `<button type="button" class="archive-search-suggestion" role="option" data-suggestion-index="${index}">
          <span class="archive-search-suggestion-main">
            <span class="archive-search-suggestion-title">${escapeHtml(entryLabel(entry))}</span>
            <span class="archive-search-suggestion-meta">${escapeHtml(meta)}</span>
          </span>
          <span class="archive-search-suggestion-arrow" aria-hidden="true">↗</span>
        </button>`;
      }).join("");
      panel.hidden = false;
    }

    function updateActive() {
      panel.querySelectorAll(".archive-search-suggestion").forEach((btn, index) => {
        btn.classList.toggle("is-active", index === activeIndex);
      });
    }

    input.addEventListener("input", renderSuggestions);
    input.addEventListener("focus", renderSuggestions);
    input.addEventListener("keydown", event => {
      if (panel.hidden || !matches.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % matches.length;
        updateActive();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = (activeIndex - 1 + matches.length) % matches.length;
        updateActive();
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        choose(matches[activeIndex]);
      } else if (event.key === "Escape") {
        closePanel();
      }
    });

    panel.addEventListener("mousedown", event => event.preventDefault());
    panel.addEventListener("click", event => {
      const btn = event.target.closest("[data-suggestion-index]");
      if (!btn) return;
      const entry = matches[Number(btn.dataset.suggestionIndex)];
      if (entry) choose(entry);
    });

    document.addEventListener("click", event => {
      if (!host.contains(event.target)) closePanel();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }

  setTimeout(setup, 1200);
})();
