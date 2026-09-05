(() => {
  if (window.__statArchiveSearchFilterFixLoaded) return;
  window.__statArchiveSearchFilterFixLoaded = true;

  function setupSearchFilterFix() {
    const input = document.getElementById("searchInput");
    if (!input || input.dataset.searchFilterFixReady === "1") return;
    input.dataset.searchFilterFixReady = "1";

    const apply = () => {
      const q = input.value.trim().toLowerCase();

      try {
        searchQ = q;
      } catch (_) {}

      try {
        showAllEntrySubjects = !!q;
      } catch (_) {}

      const clearBtn = document.getElementById("searchClear");
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";

      try {
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
