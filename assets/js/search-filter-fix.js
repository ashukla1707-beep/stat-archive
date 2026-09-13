(() => {
  if (window.__statArchiveSearchFilterFixLoadedV2) return;
  window.__statArchiveSearchFilterFixLoadedV2 = true;

  function normalizeSearchText(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[–—−]/g, "-")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .toLowerCase();
  }

  function installRobustArchiveSearch() {
    try {
      if (window.__statArchiveRobustFilteredEntriesV2) return;
      if (typeof filteredEntries !== "function" || typeof entries === "undefined") return;

      const originalFilteredEntries = filteredEntries;

      filteredEntries = function () {
        const q = normalizeSearchText(typeof searchQ !== "undefined" ? searchQ : "");
        if (!q) return originalFilteredEntries();

        const terms = q.split(/\s+/).filter(Boolean);

        return entries.filter(entry => {
          const meta = typeof subjectMeta === "function"
            ? subjectMeta(entry.subject)
            : { name: entry.subject || "" };

          const title = String(entry.title || "");
          const type = String(entry.type || "");
          const filename = String(entry.filename || "");
          const year = String(entry.year || "");
          const subjectCode = String(entry.subject || "");
          const subjectName = String(meta?.name || "");

          // Match the exact text users see on cards too. Books are rendered as
          // “Book - <title>”, so author surnames such as Chakrabarti must be
          // searchable even when the visible title is folded into the type row.
          const visibleLabel = /^books?$/i.test(type)
            ? `Book - ${title}`
            : title;

          const haystack = normalizeSearchText([
            visibleLabel,
            title,
            filename,
            year,
            type,
            subjectCode,
            subjectName
          ].join(" "));

          return terms.every(term => haystack.includes(term));
        });
      };

      window.__statArchiveRobustFilteredEntriesV2 = true;
    } catch (_) {}
  }

  function setupSearchFilterFix() {
    installRobustArchiveSearch();

    const input = document.getElementById("searchInput");
    if (!input || input.dataset.searchFilterFixReadyV2 === "1") return;
    input.dataset.searchFilterFixReadyV2 = "1";

    const apply = () => {
      const q = input.value.trim().toLowerCase();

      try {
        searchQ = q;
      } catch (_) {}

      // A text search is global across the archive. Do not let a previously
      // selected subject/type pill hide a valid title/author match.
      if (q) {
        try { filterSubjects = new Set(); } catch (_) {}
        try { filterTypes = new Set(); } catch (_) {}
      }

      try {
        showAllEntrySubjects = !!q;
      } catch (_) {}

      const clearBtn = document.getElementById("searchClear");
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";

      try {
        if (typeof renderSubjectFilters === "function" && q) renderSubjectFilters();
        if (typeof renderTypeFilters === "function" && q) renderTypeFilters();
        if (typeof render === "function") render();
      } catch (_) {}
    };

    input.addEventListener("input", apply, { capture: true });
    input.addEventListener("search", apply, { capture: true });

    const clearBtn = document.getElementById("searchClear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        requestAnimationFrame(() => {
          try { showAllEntrySubjects = false; } catch (_) {}
          try { searchQ = ""; } catch (_) {}
          try { if (typeof render === "function") render(); } catch (_) {}
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSearchFilterFix, { once: true });
  } else {
    setupSearchFilterFix();
  }

  setTimeout(setupSearchFilterFix, 1000);
})();
