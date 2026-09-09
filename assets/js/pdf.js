(function () {
  "use strict";

  const CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  let loaderPromise = null;

  function syncStandaloneMode() {
    try {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.matchMedia?.("(display-mode: minimal-ui)")?.matches ||
        window.navigator.standalone === true;
      document.documentElement.classList.toggle("stat-archive-pwa", !!standalone);
    } catch (_) {}
  }

  syncStandaloneMode();
  window.addEventListener("pageshow", syncStandaloneMode);
  try {
    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq?.addEventListener) mq.addEventListener("change", syncStandaloneMode);
    else if (mq?.addListener) mq.addListener(syncStandaloneMode);
  } catch (_) {}

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-stat-pdfjs="${src}"]`);
      if (existing) {
        if (window.pdfjsLib) return resolve(window.pdfjsLib);
        existing.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load PDF.js")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.statPdfjs = src;
      script.onload = () => {
        if (!window.pdfjsLib) {
          reject(new Error("PDF.js loaded but window.pdfjsLib is unavailable"));
          return;
        }
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Could not load PDF.js"));
      document.head.appendChild(script);
    });
  }

  window.loadPdfJs = function loadPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_BASE + "pdf.worker.min.js";
      return Promise.resolve(window.pdfjsLib);
    }

    if (loaderPromise) return loaderPromise;

    loaderPromise = loadScript(CDN_BASE + "pdf.min.js")
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = CDN_BASE + "pdf.worker.min.js";
        return lib;
      })
      .catch((err) => {
        loaderPromise = null;
        throw err;
      });

    return loaderPromise;
  };
})();
