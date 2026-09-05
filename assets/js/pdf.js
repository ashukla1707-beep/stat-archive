(function () {
  function isStandalonePWA() {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.matchMedia?.("(display-mode: minimal-ui)")?.matches ||
      window.navigator.standalone === true
    );
  }

  function syncPwaMode() {
    document.documentElement.classList.toggle("stat-archive-pwa", isStandalonePWA());
  }

  syncPwaMode();

  try {
    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq?.addEventListener) mq.addEventListener("change", syncPwaMode);
    else if (mq?.addListener) mq.addListener(syncPwaMode);
  } catch (_) {}

  window.addEventListener("pageshow", syncPwaMode);
})();

/* application section */

/* PDF.js is loaded only when a PDF preview is requested. This avoids relying
   on the browser's built-in mobile PDF iframe viewer.

   Self-hosted first: if pdfjs previously relied solely on the cdnjs CDN, a
   CDN outage or a network firewall blocking it would break preview
   entirely. We now try a locally-served copy first (place pdf.min.js and
   pdf.worker.min.js from pdf.js v3.11.174 at /vendor/pdfjs/ on your
   server/Worker), and only fall back to the CDN copy if that 404s or
   otherwise fails to load. */
const PDFJS_LOCAL_BASE = "/vendor/pdfjs/";
const PDFJS_CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";

let pdfJsPromise = null;
function loadPdfJsScript(baseUrl) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = baseUrl + "pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF preview library failed to load."));
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = baseUrl + "pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("Could not load the PDF preview library."));
    document.head.appendChild(script);
  });
}

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = loadPdfJsScript(PDFJS_LOCAL_BASE)
    .catch((err) => {
      console.warn("Local PDF.js copy unavailable, falling back to CDN:", err);
      return loadPdfJsScript(PDFJS_CDN_BASE);
    })
    .catch((err) => {
      // Never cache a rejected loader promise permanently. A transient
      // network/CDN failure should be retryable on the next preview.
      pdfJsPromise = null;
      throw err;
    });

  return pdfJsPromise;
}

/* =========================================================
   ARCHIVE ACTION SPACING — AUTH-STATE STABILITY FIX
   Keep the signed-in layout identical before and after reload.
   ========================================================= */
(() => {
  if (document.getElementById("statArchiveActionSpacingFix")) return;

  const style = document.createElement("style");
  style.id = "statArchiveActionSpacingFix";
  style.textContent = `
body .toolbar > .archive-action-row{
  border:0 !important;
  border-top:0 !important;
  border-bottom:0 !important;
  box-shadow:none !important;
  padding-top:0 !important;
  padding-bottom:0 !important;
  margin-top:0 !important;
  position:relative !important;
}

body .toolbar > .archive-action-row::before,
body .toolbar > .archive-action-row::after{
  content:none !important;
  display:none !important;
  border:0 !important;
}

body .archive-entries-divider{
  border-top:0 !important;
  margin-top:0 !important;
  padding-top:0 !important;
  margin-bottom:16px !important;
}

body .archive-entries-divider > span{
  display:block !important;
  padding-top:20px !important;
}

@media(max-width:700px){
  body .archive-entries-divider{
    margin-top:0 !important;
    padding-top:0 !important;
    margin-bottom:12px !important;
  }

  body .archive-entries-divider > span{
    padding-top:18px !important;
  }
}
`;

  document.head.appendChild(style);
})();
