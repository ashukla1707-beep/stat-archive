/* Stat Archive: always open PDFs using the archive entry title. */
(() => {
  function sanitizePdfTitle(value) {
    let name = String(value || "").trim();
    if (!name) return "document.pdf";

    name = name
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim();

    if (!/\.pdf$/i.test(name)) name += ".pdf";
    return name;
  }

  function installFix() {
    const original = window.openPdfInNewTab;
    if (typeof original !== "function" || original.__statArchiveEntryTitleFix) return false;

    function fixedOpenPdfInNewTab(pdfUrl, fallbackFilename) {
      const entryTitle = document.getElementById("previewTitle")?.textContent || "";
      const filename = entryTitle.trim()
        ? sanitizePdfTitle(entryTitle)
        : sanitizePdfTitle(fallbackFilename);

      return original.call(this, pdfUrl, filename);
    }

    fixedOpenPdfInNewTab.__statArchiveEntryTitleFix = true;
    window.openPdfInNewTab = fixedOpenPdfInNewTab;
    return true;
  }

  if (!installFix()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installFix() || attempts >= 40) clearInterval(timer);
    }, 250);
  }
})();
