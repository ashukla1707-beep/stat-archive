(() => {
  if (window.__statArchiveSearchSuggestionsLoadedV3) return;
  window.__statArchiveSearchSuggestionsLoadedV3 = true;

  const esc = value => String(value ?? "").replace(/[&<>"]/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  }[ch]));

  function findInput() {
    return Array.from(document.querySelectorAll('input[type="search"], input'))
      .find(el => /search by title/i.test(el.placeholder || ""));
  }

  function subjectName(code) {
    try {
      if (typeof subjectMeta === "function") return subjectMeta(code)?.name || code || "";
    } catch (_) {}
    return code || "";
  }

  function dataEntries() {
    try {
      if (typeof entries !== "undefined" && Array.isArray(entries)) return entries;
    } catch (_) {}
    try {
      if (Array.isArray(window.entries)) return window.entries;
    } catch (_) {}
    return [];
  }

  function labelFor(entry) {
    const type = String(entry?.type || "").trim();
    const title = String(entry?.title || entry?.filename || "Untitled").trim();
    if (/^book$/i.test(type) && !/^book\s*[-–—]/i.test(title)) return `Book - ${title}`;
    return title;
  }

  function entryHay(entry) {
    return [labelFor(entry), entry?.title, entry?.filename, entry?.year, entry?.type,
      entry?.subject, subjectName(entry?.subject)].filter(Boolean).join(" ").toLowerCase();
  }

  function entryMatches(query) {
    const q = query.toLowerCase();
    return dataEntries()
      .filter(e => entryHay(e).includes(q))
      .sort((a,b) => {
        const la = labelFor(a).toLowerCase();
        const lb = labelFor(b).toLowerCase();
        const sa = la.startsWith(q) ? 0 : la.includes(q) ? 1 : 2;
        const sb = lb.startsWith(q) ? 0 : lb.includes(q) ? 1 : 2;
        return sa - sb || la.localeCompare(lb);
      })
      .slice(0, 8)
      .map(e => ({
        id: String(e.id ?? ""),
        label: labelFor(e),
        meta: [subjectName(e.subject), e.type, e.year].filter(Boolean).join(" · ")
      }));
  }

  function domMatches(query) {
    const q = query.toLowerCase();
    return Array.from(document.querySelectorAll(".card[data-id]"))
      .map(card => {
        const title = card.querySelector(".card-title")?.dataset.fullTitle ||
                      card.querySelector(".card-title")?.textContent || "";
        const type = card.querySelector(".card-type")?.dataset.fullTitle ||
                     card.querySelector(".card-type")?.textContent || "";
        const subject = card.closest(".subject-row")?.querySelector(".subject-title,.subject-name,h2,h3")?.textContent ||
                        card.querySelector(".stamp")?.textContent || "";
        const year = card.querySelector(".card-year")?.textContent || "";
        const label = type.toLowerCase().startsWith("book -") ? type : (title || type);
        return {
          id: card.dataset.id || "",
          label: label.trim(),
          meta: [subject.trim(), year.trim()].filter(Boolean).join(" · "),
          hay: `${label} ${title} ${type} ${subject} ${year}`.toLowerCase()
        };
      })
      .filter(x => x.label && x.hay.includes(q))
      .sort((a,b) => {
        const la=a.label.toLowerCase(), lb=b.label.toLowerCase();
        const sa=la.startsWith(q)?0:la.includes(q)?1:2;
        const sb=lb.startsWith(q)?0:lb.includes(q)?1:2;
        return sa-sb || la.localeCompare(lb);
      })
      .slice(0,8);
  }

  function setup() {
    const input = findInput();
    if (!input || input.dataset.searchSuggestionsV3 === "1") return;
    input.dataset.searchSuggestionsV3 = "1";

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
      @media(max-width:700px){.archive-search-suggestions-v2{max-height:45vh}.archive-search-suggestion-v2{padding:10px}.archive-search-suggestion-v2-title{font-size:12px}}
    `;
    document.head.appendChild(style);

    let matches = [];
    let active = -1;

    function positionPanel() {
      if (panel.hidden) return;
      const r = input.getBoundingClientRect();
      panel.style.left = `${Math.max(8,r.left)}px`;
      panel.style.width = `${Math.max(240,Math.min(r.width,window.innerWidth-16))}px`;
      panel.style.top = `${Math.min(window.innerHeight-80,r.bottom+8)}px`;
    }

    function close() {
      panel.hidden = true;
      panel.innerHTML = "";
      matches = [];
      active = -1;
    }

    function renderSuggestions() {
      const q = input.value.trim();
      if (!q) return close();

      matches = entryMatches(q);
      if (!matches.length) matches = domMatches(q);
      if (!matches.length) return close();

      panel.innerHTML = matches.map((m,i) => `
        <button type="button" class="archive-search-suggestion-v2" data-i="${i}" role="option">
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

    function applyLiveArchiveFilter() {
      const q = input.value.trim().toLowerCase();
      try {
        if (typeof searchQ !== "undefined") searchQ = q;
        const clearBtn = document.getElementById("searchClear");
        if (clearBtn) clearBtn.style.display = q ? "inline-flex" : "none";
        if (typeof render === "function") render();
      } catch (_) {}
    }

    function updateActive() {
      panel.querySelectorAll(".archive-search-suggestion-v2").forEach((b,i)=>b.classList.toggle("is-active",i===active));
    }

    function choose(m) {
      input.value = m.label;
      applyLiveArchiveFilter();
      input.dispatchEvent(new Event("input",{bubbles:true}));
      close();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const card = document.querySelector(`.card[data-id="${CSS.escape(m.id)}"]`);
        if (!card) return;
        card.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
        card.animate([
          {boxShadow:"0 0 0 0 rgba(94,231,247,0)"},
          {boxShadow:"0 0 0 3px rgba(94,231,247,.58),0 12px 32px rgba(94,231,247,.14)"},
          {boxShadow:""}
        ],{duration:1300,easing:"ease-out"});
      }));
    }

    input.addEventListener("input", () => {
      applyLiveArchiveFilter();
      requestAnimationFrame(renderSuggestions);
    });
    input.addEventListener("focus", renderSuggestions);
    input.addEventListener("keydown", e => {
      if (panel.hidden || !matches.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active=(active+1)%matches.length; updateActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active=(active-1+matches.length)%matches.length; updateActive(); }
      else if (e.key === "Enter" && active>=0) { e.preventDefault(); choose(matches[active]); }
      else if (e.key === "Escape") close();
    });

    panel.addEventListener("mousedown",e=>e.preventDefault());
    panel.addEventListener("click",e=>{
      const b=e.target.closest("[data-i]");
      if (b) choose(matches[Number(b.dataset.i)]);
    });
    document.addEventListener("click",e=>{ if(e.target!==input && !panel.contains(e.target)) close(); });
    window.addEventListener("resize",positionPanel,{passive:true});
    window.addEventListener("scroll",positionPanel,{passive:true,capture:true});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",setup,{once:true});
  else setup();
  setTimeout(setup,1000);
})();
