/* File-a-new-entry method chooser behavior fix.
 * Upload PDF selects the upload method and reveals the native file input.
 * The system picker opens only from the actual Choose file control.
 */
(() => {
  "use strict";

  const byId = id => document.getElementById(id);

  if (!byId("statEntryMethodFixStyles")) {
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
  #overlay{align-items:flex-start !important;padding:8px !important;}
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
      input: byId("fileInput"),
      label: document.querySelector('label[for="fileInput"]'),
      hint: byId("fileSizeHint")
    };
  }

  function showFileControls(show) {
    const display = show ? "" : "none";
    const { input, label, hint } = fileParts();
    if (label) label.style.display = display;
    if (input) input.style.display = display;
    if (hint) hint.style.display = display;
  }

  function setActive(method) {
    const methods = {
      scan: byId("entryScanMethod"),
      upload: byId("entryUploadMethod"),
      drive: byId("entryDriveMethod")
    };

    for (const [key, button] of Object.entries(methods)) {
      if (!button) continue;
      const active = key === method;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function closeDriveIfOpen() {
    const field = byId("driveLinkField");
    if (field && getComputedStyle(field).display !== "none") {
      byId("driveToggleOffBtn")?.click();
    }
  }

  function revealUploadControls() {
    closeDriveIfOpen();
    showFileControls(true);
    setActive("upload");
    requestAnimationFrame(() => {
      fileParts().label?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "auto"
      });
    });
  }

  /* scanner.js calls fileInput.click() from this card. Intercept only the card
     before its handler; the native <input type=file> remains untouched. */
  document.addEventListener("click", event => {
    const upload = event.target.closest?.("#entryUploadMethod");
    if (!upload) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    revealUploadControls();
  }, true);

  /* One delegated listener keeps the remaining method state synchronized. */
  document.addEventListener("click", event => {
    const target = event.target;

    if (target.closest?.("#entryScanMethod")) {
      setActive("scan");
    } else if (target.closest?.("#entryDriveMethod")) {
      showFileControls(false);
      setActive("drive");
    } else if (target.closest?.("#driveToggleOffBtn")) {
      setTimeout(revealUploadControls, 0);
    } else if (target.closest?.("#openFormBtn")) {
      setTimeout(() => setActive(null), 0);
    }
  });

  document.addEventListener("change", event => {
    if (event.target?.id === "typeSelect") setActive(null);
  });
})();
