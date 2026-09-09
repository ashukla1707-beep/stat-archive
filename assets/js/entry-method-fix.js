/* File-a-new-entry method chooser behavior fix.
 * Upload PDF selects the upload method and reveals the native file input.
 * The system picker opens only when the user presses the actual Choose file control.
 */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function installStyles() {
    if ($("statEntryMethodFixStyles")) return;
    const style = document.createElement("style");
    style.id = "statEntryMethodFixStyles";
    style.textContent = `
.entry-method-card.is-active{
  border-color:rgba(94,231,247,.68) !important;
  background:rgba(94,231,247,.065) !important;
  box-shadow:0 0 0 1px rgba(94,231,247,.10) inset !important;
}
body[data-theme="light"] .entry-method-card.is-active{
  border-color:rgba(54,185,210,.52) !important;
  background:rgba(54,185,210,.055) !important;
  box-shadow:0 0 0 1px rgba(54,185,210,.08) inset !important;
}
@media(max-width:700px){
  #overlay{
    align-items:flex-start !important;
    padding:8px !important;
  }
  #overlay .form-card{
    max-height:calc(100dvh - 16px) !important;
    overflow-y:auto !important;
    -webkit-overflow-scrolling:touch !important;
    overscroll-behavior:contain !important;
    padding-bottom:max(25px,env(safe-area-inset-bottom)) !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function fileParts() {
    return {
      input: $("fileInput"),
      label: document.querySelector('label[for="fileInput"]'),
      hint: $("fileSizeHint")
    };
  }

  function showFileControls(show) {
    const { input, label, hint } = fileParts();
    if (label) label.style.display = show ? "" : "none";
    if (input) input.style.display = show ? "" : "none";
    if (hint) hint.style.display = show ? "" : "none";
  }

  function setActive(method) {
    const map = {
      scan: $("entryScanMethod"),
      upload: $("entryUploadMethod"),
      drive: $("entryDriveMethod")
    };
    Object.keys(map).forEach((key) => {
      const button = map[key];
      if (!button) return;
      const active = key === method;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function closeDriveIfOpen() {
    const field = $("driveLinkField");
    if (!field || getComputedStyle(field).display === "none") return;
    $("driveToggleOffBtn")?.click();
  }

  function revealUploadControls() {
    closeDriveIfOpen();
    showFileControls(true);
    setActive("upload");

    requestAnimationFrame(() => {
      const { label } = fileParts();
      label?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    });
  }

  installStyles();

  /*
   * scanner.js currently calls fileInput.click() from the Upload PDF card.
   * Intercept that card before its onclick runs. This leaves the actual
   * <input type=file> untouched, so tapping Choose file still opens Android/
   * browser's native file picker normally.
   */
  document.addEventListener("click", (event) => {
    const upload = event.target.closest?.("#entryUploadMethod");
    if (!upload) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    revealUploadControls();
  }, true);

  /* Keep the selected card visually synchronized with the other methods. */
  document.addEventListener("click", (event) => {
    if (event.target.closest?.("#entryScanMethod")) {
      setActive("scan");
      return;
    }

    if (event.target.closest?.("#entryDriveMethod")) {
      showFileControls(false);
      setActive("drive");
      return;
    }

    /* The Drive panel's “Upload a file instead” link should return to the
       visible file field rather than leaving both methods hidden. */
    if (event.target.closest?.("#driveToggleOffBtn")) {
      setTimeout(revealUploadControls, 0);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target?.id !== "typeSelect") return;
    setActive(null);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("#openFormBtn")) return;
    setTimeout(() => setActive(null), 0);
  });
})();
