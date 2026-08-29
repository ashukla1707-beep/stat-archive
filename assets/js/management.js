let editingEntryId = null;
let editingOriginalTitle = "";
let editingOriginalSubjectCode = "";

function showEditEntryError(msg) {
  const el = document.getElementById("editEntryErrorBanner");
  el.textContent = msg;
  el.style.display = msg ? "flex" : "none";
}

/* ===== Drive-link mode for the Edit form ===== */
let editDriveLinkMode = false;

(function setupEditDriveToggle(){
  const onBtn = document.getElementById("editDriveToggleBtn");
  const offBtn = document.getElementById("editDriveToggleOffBtn");
  const driveField = document.getElementById("editDriveLinkField");
  const driveInput = document.getElementById("editDriveLinkInput");
  const fileInput = document.getElementById("editFileInput");
  const fileLabel = document.getElementById("editFileLabel");
  const fileHint = document.getElementById("editFileHint");
  const typeSelect = document.getElementById("editTypeSelect");

  if (!onBtn || !offBtn || !driveField || !driveInput || !fileInput) return;

  const DRIVE_ALLOWED_TYPES = ["Notes", "Book", "Others"];

  function isAllowedType() {
    return typeSelect ? DRIVE_ALLOWED_TYPES.includes(typeSelect.value) : true;
  }

  function setEditDriveMode(on, value = "") {
    editDriveLinkMode = !!on;
    if (editDriveLinkMode) {
      driveInput.value = value || driveInput.value || "";
    }
    driveField.style.display = editDriveLinkMode ? "block" : "none";
    onBtn.style.display = (!editDriveLinkMode && isAllowedType()) ? "inline-flex" : "none";
    offBtn.style.display = editDriveLinkMode ? "inline-flex" : "none";
    fileInput.style.display = editDriveLinkMode ? "none" : "";
    if (fileLabel) fileLabel.style.display = editDriveLinkMode ? "none" : "";
    if (fileHint) fileHint.style.display = editDriveLinkMode ? "none" : "";

    if (editDriveLinkMode) {
      fileInput.value = "";
    }
  }

  function syncForType() {
    const allowed = isAllowedType();
    if (!allowed && editDriveLinkMode) {
      // A Drive-backed entry cannot silently remain a Drive entry after the
      // user changes it to a type that does not support Drive links. Switch
      // to file mode and require a replacement file on submit.
      setEditDriveMode(false);
      showEditEntryError("Google Drive links are only available for Notes, Book, and Others. Choose a replacement file for this type.");
    } else {
      onBtn.style.display = (!editDriveLinkMode && allowed) ? "inline-flex" : "none";
      offBtn.style.display = editDriveLinkMode ? "inline-flex" : "none";
    }
  }

  onBtn.addEventListener("click", () => setEditDriveMode(true));
  offBtn.addEventListener("click", () => {
    driveInput.value = "";
    setEditDriveMode(false);
  });
  typeSelect?.addEventListener("change", syncForType);

  // Expose a tiny internal API for open/close/reset without creating
  // duplicate listeners every time an entry is edited.
  window.__statArchiveEditDrive = {
    setMode: setEditDriveMode,
    sync: syncForType,
    allowedTypes: DRIVE_ALLOWED_TYPES,
    clear: () => {
      editDriveLinkMode = false;
      driveInput.value = "";
      setEditDriveMode(false);
    }
  };
})();

function populateEditSubjectOptions(selectedCode) {
  const sel = document.getElementById("editSubjectSelect");
  if (!sel) return;
  sel.innerHTML = "";
  [...subjects].sort((a,b) => a.name.localeCompare(b.name, undefined, {sensitivity:"base"})).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id || s.code;
    opt.dataset.code = s.code || "";
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
  const match = [...sel.options].find(o => (o.dataset.code || o.value) === selectedCode);
  if (match) sel.value = match.value;
}

function updateEditEntryFields() {
  const type = document.getElementById("editTypeSelect").value;
  const yearField = document.getElementById("editYearField");
  const yearLabel = document.getElementById("editYearLabel");
  const titleField = document.getElementById("editTitleField");
  const titleLabel = document.getElementById("editTitleLabel");
  const titleInput = document.getElementById("editTitleInput");
  if (YEAR_VISIBLE_TYPES.includes(type)) {
    yearField.style.display = "block";
    if (yearLabel) {
      yearLabel.textContent = YEAR_REQUIRED_TYPES.includes(type) ? "Year (required)" : "Year (optional)";
    }
  } else {
    yearField.style.display = "none";
  }
  // Question cards do not display a title, but keeping the existing title is
  // useful if the type is later changed back, so the field remains editable.
  titleField.style.display = "block";
  titleLabel.textContent = "Name / title";
  titleInput.placeholder = "Entry name";
  if (type === "Notes") {
    titleLabel.textContent = "Title (Preserve the 'Subject — Notes:' prefix)";
    titleInput.placeholder = "e.g., Probability Theory — Notes: Module 1";
  }
  document.getElementById("editFileHint").textContent =
    `Leave empty to keep the current file. New ${type} files must be under ${formatSize(maxBytesForType(type))}.`;

  const fileInput = document.getElementById("editFileInput");
  if (fileInput.files.length > 0 && fileInput.files[0].size > maxBytesForType(type)) {
    showEditEntryError(`The selected replacement file is too large for ${type}. Choose a smaller file or change the type back.`);
  }
}

function getContributorLatest3Ids() {
  if (!session || archiveRole !== "contributor") return new Set();

  const userId = String(session.user?.id || "");
  if (!userId) return new Set();

  // Work from the full entries list for the currently selected course level.
  // A contributor may edit only their own three newest entries.
  const ownEntries = entries
    .filter(entry =>
      entry &&
      String(entry.uploadedBy || "") === userId &&
      String(entry.level || currentLevel) === String(currentLevel)
    )
    .sort((a, b) => {
      const ta = Date.parse(a.uploadedAt || "") || 0;
      const tb = Date.parse(b.uploadedAt || "") || 0;
      if (tb !== ta) return tb - ta;
      return String(b.id || "").localeCompare(String(a.id || ""));
    })
    .slice(0, 3);

  return new Set(ownEntries.map(entry => String(entry.id)));
}

function canEditEntry(entry) {
  // Never expose or allow entry editing without an active signed-in session.
  // archiveRole can briefly remain stale while Supabase finishes SIGNED_OUT.
  if (!session || !entry) return false;

  if (archiveRole === "admin") return true;
  if (archiveRole !== "contributor") return false;

  // Prefer the backend permission when present, while also calculating the
  // same rule locally. This keeps the UI correct with both the current Worker
  // and an older Worker response that omitted contributor_editable.
  if (entry.contributorEditable === true) return true;
  return getContributorLatest3Ids().has(String(entry.id));
}

function openEditEntry(entry) {
  if (!(session && canEditEntry(entry))) {
    showError("Contributors can edit only the 3 newest entries. Older entries require Admin permission.");
    return;
  }
  editingEntryId = entry.id;
  editingOriginalTitle = entry.title || "";
  editingOriginalSubjectCode = entry.subject || "";
  showEditEntryError("");
  document.getElementById("editEntryForm").reset();
  populateEditSubjectOptions(editingOriginalSubjectCode);
  document.getElementById("editTypeSelect").value = canonicalEntryType(entry.type);
  document.getElementById("editTitleInput").value = entry.title || "";
  document.getElementById("editYearInput").value = entry.year || "";

  // Existing Drive-backed entries reopen in Drive mode with their current
  // link already populated. Normal R2/file entries reopen in file mode.
  if (window.__statArchiveEditDrive) {
    if (entry.driveUrl && window.__statArchiveEditDrive.allowedTypes.includes(canonicalEntryType(entry.type))) {
      window.__statArchiveEditDrive.setMode(true, entry.driveUrl);
    } else {
      window.__statArchiveEditDrive.clear();
      window.__statArchiveEditDrive.sync();
    }
  }
  updateEditEntryFields();
  document.getElementById("editEntryOverlay").style.display = "flex";
  document.body.classList.add("no-scroll");
}

function closeEditEntry() {
  if (isEditing) return;
  document.getElementById("editEntryOverlay").style.display = "none";
  document.body.classList.remove("no-scroll");
  document.getElementById("editEntryForm").reset();
  if (window.__statArchiveEditDrive) window.__statArchiveEditDrive.clear();
  editingEntryId = null;
  editingOriginalTitle = "";
  editingOriginalSubjectCode = "";
  showEditEntryError("");
}

document.getElementById("closeEditEntryBtn").onclick = closeEditEntry;
document.getElementById("editEntryOverlay").addEventListener("click", (e) => {
  if (e.target.id === "editEntryOverlay") closeEditEntry();
});
document.getElementById("editSubjectSelect").addEventListener("change", () => {
  const input = document.getElementById("editTitleInput");
  const selected = document.getElementById("editSubjectSelect").selectedOptions[0];
  const newSubjectName = selected?.textContent || "";
  const oldSubjectName = subjectMeta(editingOriginalSubjectCode).name;
  const currentType = document.getElementById("editTypeSelect").value;
  if (input && (
      input.value.trim() === editingOriginalTitle.trim() ||
      input.value.trim() === `${oldSubjectName} — ${canonicalEntryType(entries.find(item => String(item.id) === String(editingEntryId))?.type || "")}`
    )) {
    input.value = `${newSubjectName} — ${currentType}`;
  }
});

document.getElementById("editTypeSelect").addEventListener("change", () => {
  const input = document.getElementById("editTitleInput");
  const oldEntry = entries.find(item => String(item.id) === String(editingEntryId));
  const oldType = canonicalEntryType(oldEntry?.type || "");
  const newType = document.getElementById("editTypeSelect").value;
  const selectedSubject = document.getElementById("editSubjectSelect")?.selectedOptions?.[0];
  const subjectName = selectedSubject?.textContent || subjectMeta(editingOriginalSubjectCode).name;
  if (input && (input.value.trim() === editingOriginalTitle.trim() ||
      input.value.trim() === `${subjectName} — ${oldType}`)) {
    input.value = `${subjectName} — ${newType}`;
  }
  updateEditEntryFields();
  window.__statArchiveEditDrive?.sync();
});
document.getElementById("editEntryForm").addEventListener("input", () => showEditEntryError(""));

// Fix: give immediate feedback on oversized replacement files instead of
// waiting until the user hits submit.
document.getElementById("editFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const selectedType = document.getElementById("editTypeSelect").value;
  const typeLimit = maxBytesForType(selectedType);
  if (file.size > typeLimit) {
    showEditEntryError(`That file is ${formatSize(file.size)}. ${selectedType} files must be under ${formatSize(typeLimit)}.`);
    e.target.value = "";
  } else {
    showEditEntryError("");
  }
});

document.getElementById("editEntryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isEditing) return;
  isEditing = true;
  try {
  const entry = entries.find(item => String(item.id) === String(editingEntryId));
  if (!(session && canEditEntry(entry))) {
    showEditEntryError("Contributors can edit only the 3 newest entries. Older entries require Admin permission.");
    return;
  }
  if (!entry) {
    showEditEntryError("Entry not found. Refresh and try again.");
    return;
  }
  const type = document.getElementById("editTypeSelect").value;
  const title = document.getElementById("editTitleInput").value.trim();
  let year = document.getElementById("editYearInput").value.trim();
  const file = document.getElementById("editFileInput").files[0];
  const subjectSelect = document.getElementById("editSubjectSelect");
  const selectedSubject = subjectSelect?.selectedOptions?.[0];
  if (!selectedSubject?.value) {
    showEditEntryError("Choose a subject.");
    return;
  }

  // A few legacy/built-in subjects are represented only by their code in the
  // UI and therefore do not yet have a Supabase UUID. Before PATCHing the
  // entry, create the real subject row and use its generated UUID.
  let selectedSubjectId = selectedSubject.value;
  const selectedSubjectCode = selectedSubject.dataset.code || selectedSubject.value;
  const selectedSubjectMeta = subjects.find(s => s.code === selectedSubjectCode || s.id === selectedSubjectId);
  if (selectedSubjectMeta && !selectedSubjectMeta.id) {
    try {
      const { data: createdSubject, error: subjectError } = await sb.from("subjects").insert({
        name: selectedSubjectMeta.name,
        code: selectedSubjectMeta.code,
        created_by: session.user.id,
        level: currentLevel
      }).select("id,name,code,created_by").single();
      if (subjectError) throw subjectError;
      selectedSubjectId = createdSubject.id;
      selectedSubjectMeta.id = createdSubject.id;
      selectedSubjectMeta.created_by = createdSubject.created_by || selectedSubjectMeta.created_by;
      await loadSubjectsFromWorker();
      populateEditSubjectOptions(selectedSubjectCode);
    } catch (err) {
      showEditEntryError(err?.message || "Could not prepare that subject for editing.");
      return;
    }
  }

  const editDriveUrl = normalizeDriveUrl(document.getElementById("editDriveLinkInput")?.value || "");
  if (editDriveLinkMode) {
    if (!editDriveUrl) {
      showEditEntryError("Paste the Google Drive share link.");
      return;
    }
    if (!isLikelyDriveLink(editDriveUrl)) {
      showEditEntryError("That doesn't look like a Google Drive link. Copy the \"Share\" link from Drive.");
      return;
    }
    if (!window.__statArchiveEditDrive.allowedTypes.includes(type)) {
      showEditEntryError("Google Drive links are only available for Notes, Book, and Others.");
      return;
    }
  }

  if (!editDriveLinkMode && entry.driveUrl && !file) {
    showEditEntryError("This entry currently uses Google Drive. Keep the Drive link or choose a replacement file.");
    return;
  }

  if ((type === "Others" || type === "Book") && !title) {
    showEditEntryError(type === "Book" ? "Add a title for the book." : "Add a title describing the file.");
    return;
  }
  if (YEAR_REQUIRED_TYPES.includes(type)) {
    if (!/^\d{4}$/.test(year)) {
      showEditEntryError("Enter a valid 4-digit year.");
      return;
    }
  } else if (YEAR_OPTIONAL_TYPES.includes(type) && year && !/^\d{4}$/.test(year)) {
    showEditEntryError("Enter a valid 4-digit year, or leave the year blank.");
    return;
  }

  // Editing must not create a second PYQ or MTQ for the same subject and year.
  if (
    YEAR_REQUIRED_TYPES.includes(type) &&
    hasDuplicateQuestionEntry(selectedSubjectCode, type, year, entry.id)
  ) {
    showEditEntryError(`A ${type} for ${year} already exists for this subject.`);
    return;
  }

  if (file) {
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"];
    if (!allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      showEditEntryError("Invalid file type. Only PDF and standard image files are allowed.");
      return;
    }
    if (file.size > maxBytesForType(type)) {
      showEditEntryError(`That file is ${formatSize(file.size)}. ${type} files must be under ${formatSize(maxBytesForType(type))}.`);
      return;
    }
  }

  const btn = document.getElementById("editEntrySubmitBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  showEditEntryError("");
  try {
    const form = new FormData();
    if (!YEAR_VISIBLE_TYPES.includes(type)) year = "";
    form.append("title", title);
    form.append("type", type);
    form.append("year", year);
    form.append("subject_id", selectedSubjectId);
    if (editDriveLinkMode) {
      form.append("drive_url", editDriveUrl);
    } else if (file) {
      // The Worker clears an old Drive URL automatically when a replacement
      // file is supplied, so no stale Drive link survives the switch.
      form.append("file", file);
    }
    await workerFetch(`/entries?id=${encodeURIComponent(entry.id)}`, {
      method: "PATCH",
      body: form
    }, true);
    pendingCarouselPositions = captureCarouselPositions();
    entries = await loadEntries();
    totalStorageBytes = entries.reduce((sum, entry) => sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0);
    isEditing = false;
    closeEditEntry();
    render();
  } catch (err) {
    console.error(err);
    showEditEntryError(err?.message || "Couldn't save changes.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save changes";
  }
  } finally {
    isEditing = false;
  }
});

async function deleteEntry(entry, btn) {
  if (!session) {
    showError("Sign in to remove entries.");
    return;
  }

  const allowedByUi = !!session && archiveRole === "admin";

  if (!allowedByUi) {
    showError("Only an Admin can delete archive entries.");
    return;
  }

  if (
    !confirm(
      `Delete "${entry.title}"? This permanently removes the stored file.`
    )
  ) {
    return;
  }

  const original = btn.textContent;
  btn.textContent = "…";
  btn.disabled = true;
  document.body.classList.remove("cursor-hover");
  showError("");

  try {
    await workerFetch(
      `/entries?id=${encodeURIComponent(entry.id)}`,
      { method: "DELETE" },
      true
    );

    // Preserve the current horizontal position so deleting one card does not
    // force you to slide back to the last card again.
    pendingCarouselPositions = captureCarouselPositions();
    entries = entries.filter(e => e.id !== entry.id);
    totalStorageBytes = entries.reduce((sum, item) => sum + (Number.isFinite(Number(item.size)) && Number(item.size) > 0 ? Number(item.size) : 0), 0);
    render();

  } catch (err) {
    console.error(err);
    showError(
      err?.message ||
      "Couldn't delete that entry."
    );

    btn.textContent = original;
    btn.disabled = false;
  }
}

let searchTimeout;
function handleSearchInputEvent(e) {
  // Moved out of the debounce below and based on the raw (un-trimmed) value:
  // previously, typing only spaces trimmed to "" and hid the ✕ button even
  // though the input still had text, and the button also used to only
  // update once the 250ms debounce fired, which felt sluggish.
  document.getElementById("searchClear").style.display = e.target.value.length ? "block" : "none";

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQ = e.target.value.trim().toLowerCase();
    render();
  }, 250);
}
document.getElementById("searchInput").addEventListener("input", handleSearchInputEvent);
// type="search" inputs fire a native "search" event (e.g. clicking the
// built-in clear icon or pressing Escape) that does NOT also fire "input"
// in some browsers, leaving searchQ and the ✕ button out of sync.
document.getElementById("searchInput").addEventListener("search", handleSearchInputEvent);
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("searchInput");
  clearTimeout(searchTimeout);
  searchQ = input.value.trim().toLowerCase();
  input.blur();
  render();
});
document.getElementById("searchClear").onclick = () => {
  clearTimeout(searchTimeout);
  const input = document.getElementById("searchInput");
  input.value = ""; searchQ = "";
  document.getElementById("searchClear").style.display = "none";
  render(); input.focus();
};

// Fix: on browser back/forward navigation the input value can be restored
// by the browser (bfcache) without an "input" event firing, leaving the
// clear (✕) button hidden even though there's text in the field.
document.getElementById("searchClear").style.display =
  document.getElementById("searchInput").value.length ? "block" : "none";

// Add event listener for grid actions using delegation (Fix: memory bloat).
document.getElementById("grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  const card = btn.closest(".card");
  const entry = entries.find(ent => String(ent.id) === card.dataset.id);
  if (!entry) return;
  if (btn.classList.contains("pv-btn")) previewEntry(entry);
  else if (btn.classList.contains("dl-btn")) downloadEntry(entry, btn);
  else if (btn.classList.contains("offline-btn")) saveEntryOffline(entry, btn);
  else if (btn.classList.contains("drive-btn")) {
    incrementActivity("preview");
    window.open(entry.driveUrl, "_blank", "noopener");
  }
  else if (btn.classList.contains("edit-btn")) openEditEntry(entry);
  else if (btn.classList.contains("del-btn")) deleteEntry(entry, btn);
});

document.getElementById("latestEntriesBtn").onclick = () => {
  if (!(session && (archiveRole === "admin" || archiveRole === "contributor"))) return;
  latestEntriesMode = !latestEntriesMode;
  if (latestEntriesMode) filterSubjects.clear();
  renderSubjectFilters();
  updateAuthUI();
  render();
};

document.getElementById("openFormBtn").onclick = () => {
  if (!session) { showError("Sign in to file a new entry."); return; }
  showFormError("");
  document.getElementById("overlay").style.display = "flex";
  document.body.classList.add("no-scroll");
};
function closeAndResetUploadForm() {
  if (isUploading) return;
  document.getElementById("overlay").style.display = "none";
  document.body.classList.remove("no-scroll");
  showFormError("");
  document.getElementById("uploadForm").reset();
  updateFileSizeHint();

  // Also drop back to file-upload mode (Drive-link mode should not
  // persist across separate "File a new entry" sessions).
  if (typeof driveLinkMode !== "undefined") {
    driveLinkMode = false;
    const driveField = document.getElementById("driveLinkField");
    const onBtn = document.getElementById("driveToggleBtn");
    const fileInput = document.getElementById("fileInput");
    const fileLabel = document.querySelector('label[for="fileInput"]');
    const fileSizeHint = document.getElementById("fileSizeHint");
    if (driveField) driveField.style.display = "none";
    if (onBtn) onBtn.style.display = "inline-flex";
    if (fileInput) fileInput.style.display = "";
    if (fileLabel) fileLabel.style.display = "";
    if (fileSizeHint) fileSizeHint.style.display = "";
  }
}
document.getElementById("closeFormBtn").onclick = closeAndResetUploadForm;
document.getElementById("overlay").addEventListener("click", (e) => {
  if (e.target.id === "overlay") { closeAndResetUploadForm(); }
});

const YEAR_REQUIRED_TYPES = ["Previous Year Question", "Mid-Term Question"];
const YEAR_OPTIONAL_TYPES = ["Notes", "Others"];
const YEAR_VISIBLE_TYPES = [...YEAR_REQUIRED_TYPES, ...YEAR_OPTIONAL_TYPES];

function updateFileSizeHint() {
  const type = document.getElementById("typeSelect").value;
  document.getElementById("fileSizeHint").textContent =
    `Up to ${formatSize(maxBytesForType(type))} for ${type}.`;

  const titleField = document.getElementById("titleField");
  const titleInput = document.getElementById("titleInput");
  if (type === "Others" || type === "Book") {
    titleField.style.display = "";
    titleInput.placeholder = type === "Book" ? "Name of the book" : "Describe what this file is";
  } else {
    titleField.style.display = "none";
  }

  const subtitleField = document.getElementById("subtitleField");
  if (type === "Notes") {
    subtitleField.style.display = "";
  } else {
    subtitleField.style.display = "none";
  }

  const yearField = document.getElementById("yearField");
  const yearLabel = document.getElementById("yearLabel");
  if (YEAR_VISIBLE_TYPES.includes(type)) {
    yearField.style.display = "";
    if (yearLabel) {
      yearLabel.textContent = YEAR_REQUIRED_TYPES.includes(type) ? "Year (required)" : "Year (optional)";
    }
  } else {
    yearField.style.display = "none";
  }

  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const typeLimit = maxBytesForType(type);
    if (file.size > typeLimit) {
      showFormError(`Current file is too large (${formatSize(file.size)}). Limit for ${type} is ${formatSize(typeLimit)}.`);
      fileInput.value = "";
    } else {
      showFormError("");
    }
  }
}
document.getElementById("typeSelect").addEventListener("change", updateFileSizeHint);
updateFileSizeHint();

// Android may temporarily background the PWA while the native file chooser is open.
// Keep a flag so the normal "app resumed" hard-refresh does not close the upload form.
window.statArchiveNativePickerActive = false;

const archiveFileInput = document.getElementById("fileInput");
archiveFileInput?.addEventListener("click", () => {
  window.statArchiveNativePickerActive = true;
});
archiveFileInput?.addEventListener("pointerdown", () => {
  window.statArchiveNativePickerActive = true;
});

// Fix: give immediate feedback on oversized files instead of waiting until
// the user hits submit.
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const selectedType = document.getElementById("typeSelect").value;
  const typeLimit = maxBytesForType(selectedType);
  if (file.size > typeLimit) {
    showFormError(`File is too large (${formatSize(file.size)}). Limit for ${selectedType} is ${formatSize(typeLimit)}.`);
    e.target.value = "";
  } else {
    showFormError("");
  }

  setTimeout(() => {
    window.statArchiveNativePickerActive = false;
  }, 700);
});

function closePreview() {
  currentPreviewToken++; // Invalidate any in-flight asynchronous loads
  printRequestToken++;   // Invalidate stale print UI callbacks

  const previewBody = document.getElementById("previewBody");
  if (previewBody?._pdfRenderTasks) {
    for (const task of previewBody._pdfRenderTasks) {
      try { task.cancel(); } catch {}
    }
    previewBody._pdfRenderTasks.clear();
    previewBody._pdfRenderTasks = null;
  }
  if (activePdfDoc) {
    try { activePdfDoc.destroy(); } catch (e) { console.warn("PDF destroy failed:", e); }
    activePdfDoc = null;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  if (previewAbortController) {
    previewAbortController.abort();
    previewAbortController = null;
  }

  const body = document.getElementById("previewBody");
  if (body?._pdfResizeHandler) {
    window.removeEventListener("resize", body._pdfResizeHandler);
    body._pdfResizeHandler = null;
  }
  if (body?._pdfResizeTimer) {
    clearTimeout(body._pdfResizeTimer);
    body._pdfResizeTimer = null;
  }
  if (body?._pdfZoomTimer) {
    clearTimeout(body._pdfZoomTimer);
    body._pdfZoomTimer = null;
  }
  if (body?._pdfObserver) {
    body._pdfObserver.disconnect();
    body._pdfObserver = null;
  }
  if (body?._pdfLoadObserver) {
    body._pdfLoadObserver.disconnect();
    body._pdfLoadObserver = null;
  }
  if (body?._pdfKeydownHandler) {
    document.removeEventListener("keydown", body._pdfKeydownHandler);
    body._pdfKeydownHandler = null;
  }
  if (body?._pdfWheelHandler) {
    const canvasWrap = document.getElementById("pdfCanvasWrap");
    canvasWrap?.removeEventListener("wheel", body._pdfWheelHandler);
    body._pdfWheelHandler = null;
  }
  if (body?._imageWheelHandler) {
    const imagePreviewWrap = document.getElementById("imagePreviewWrap");
    imagePreviewWrap?.removeEventListener("wheel", body._imageWheelHandler);
    body._imageWheelHandler = null;
  }
  document.getElementById("previewOverlay").style.display = "none";
  document.querySelector("#previewOverlay .preview-card")?.classList.remove("pdf-preview-active");
  document.body.classList.remove("no-scroll");
  body.innerHTML = "";

  // Restore normal pinch-zoom for the rest of the site.
  const viewportMeta = document.getElementById("viewportMeta");
  if (viewportMeta) {
    viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0");
  }
}

document.getElementById("closePreviewBtn").onclick = closePreview;
document.getElementById("previewOverlay").addEventListener("click", (e) => {
  if (e.target.id === "previewOverlay") closePreview();
});

function showLoginError(msg) {
  const el = document.getElementById("loginErrorBanner");
  el.textContent = msg;
  el.style.display = msg ? "flex" : "none";
}

function showFormError(msg) {
  const el = document.getElementById("formErrorBanner");
  el.textContent = msg;
  el.style.display = msg ? "flex" : "none";
}

document.getElementById("loginForm").addEventListener("input", () => showLoginError(""));
document.getElementById("togglePasscodeBtn")?.addEventListener("click", () => {
  const input = document.getElementById("passcodeInput");
  const btn = document.getElementById("togglePasscodeBtn");
  if (!input || !btn) return;

  const visible = input.type === "text";
  const eyeIcon = `
    <svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
      <circle cx="12" cy="12" r="2.7"></circle>
    </svg>`;
  const eyeOffIcon = `
    <svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3 3 18 18"></path>
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3.1 3.8"></path>
      <path d="M6.3 6.4C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"></path>
      <path d="M9.9 9.9a2.7 2.7 0 0 0 3.8 3.8"></path>
    </svg>`;

  input.type = visible ? "password" : "text";
  // Reversed visual state: hidden = eye-off, visible = eye.
  btn.innerHTML = visible ? eyeOffIcon : eyeIcon;
  btn.setAttribute("aria-label", visible ? "Show passcode" : "Hide passcode");
  btn.setAttribute("title", visible ? "Show passcode" : "Hide passcode");
});
const initialPasscodeToggle = document.getElementById("togglePasscodeBtn");
if (initialPasscodeToggle) {
  initialPasscodeToggle.innerHTML = `
    <svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3 3 18 18"></path>
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3.1 3.8"></path>
      <path d="M6.3 6.4A10.9 10.9 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"></path>
      <path d="M9.9 9.9a2.7 2.7 0 0 0 3.8 3.8"></path>
    </svg>`;
}
document.getElementById("uploadForm").addEventListener("input", () => showFormError(""));

document.getElementById("authBtn").onclick = async () => {
  if (session) {
    const btn = document.getElementById("authBtn");

    // Make the browser read-only immediately. Do not rebuild the archive grid;
    // removing the few privileged controls is much cheaper on large archives.
    signingOut = true;
    session = null;
    archiveRole = "viewer";
    latestEntriesMode = false;
    clearLoginTime();
    applySignedOutUI();
    updateAuthUI();

    btn.disabled = true;
    let signOutSucceeded = false;
    try {
      const { error } = await sb.auth.signOut();
      signOutSucceeded = !error;
      if (error) console.warn("Sign out returned an error.", error);
    } catch (err) {
      console.warn("Network failed during manual sign out.", err);
    } finally {
      btn.disabled = false;
      signingOut = false;

      // Fully reload the page after a successful sign-out so every piece of
      // authenticated/archive UI is rebuilt from a clean signed-out session.
      if (signOutSucceeded) {
        window.location.reload();
      }
    }
  } else {
    showLoginError("");
    document.getElementById("loginOverlay").style.display = "flex";
    document.body.classList.add("no-scroll");
    document.getElementById("passcodeInput").focus();
  }
};
function clearLoginModalState() {
  const form = document.getElementById("loginForm");
  const input = document.getElementById("passcodeInput");
  const error = document.getElementById("loginErrorBanner");
  if (form) form.reset();
  if (input) input.value = "";
  if (error) { error.textContent = ""; error.style.display = "none"; }

  // form.reset() only restores default *values*, not the passcode
  // field's type — if the previous person had clicked the eye icon to
  // reveal it, the field (and its eye-icon button) stayed in "visible"
  // mode here even after the value itself was cleared, so the next
  // person to open this modal on a shared device would land on an
  // already-revealed (if currently empty) passcode field instead of a
  // masked one.
  if (input) input.type = "password";
  const toggleBtn = document.getElementById("togglePasscodeBtn");
  if (toggleBtn) {
    toggleBtn.innerHTML = `
    <svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3 3 18 18"></path>
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3.1 3.8"></path>
      <path d="M6.3 6.4A10.9 10.9 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"></path>
      <path d="M9.9 9.9a2.7 2.7 0 0 0 3.8 3.8"></path>
    </svg>`;
    toggleBtn.setAttribute("aria-label", "Show passcode");
    toggleBtn.setAttribute("title", "Show passcode");
  }
}
document.getElementById("closeLoginBtn").onclick = () => {
  clearLoginModalState();
  document.getElementById("loginOverlay").style.display = "none";
  document.body.classList.remove("no-scroll");
};
document.getElementById("loginOverlay").addEventListener("click", (e) => {
  if (e.target.id === "loginOverlay") { clearLoginModalState(); document.getElementById("loginOverlay").style.display = "none"; document.body.classList.remove("no-scroll"); }
});
document.getElementById("closeContributorDisclaimerBtn").onclick = () => { document.getElementById("contributorDisclaimerOverlay").style.display = "none"; document.body.classList.remove("no-scroll"); };
document.getElementById("ackContributorDisclaimerBtn").onclick = () => { document.getElementById("contributorDisclaimerOverlay").style.display = "none"; document.body.classList.remove("no-scroll"); };
document.getElementById("contributorDisclaimerOverlay").addEventListener("click", (e) => {
  if (e.target.id === "contributorDisclaimerOverlay") { document.getElementById("contributorDisclaimerOverlay").style.display = "none"; document.body.classList.remove("no-scroll"); }
});
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoginError("");
  const passcode = document.getElementById("passcodeInput").value;
  if (!passcode) { showLoginError("Enter the passcode first."); return; }
  const roleChoice = document.getElementById("loginRoleSelect").value;
  const loginEmail = (LOGIN_EMAILS[currentLevel] || LOGIN_EMAILS.msc)[roleChoice] || (LOGIN_EMAILS[currentLevel] || LOGIN_EMAILS.msc).contributor;
  const btn = document.getElementById("loginSubmitBtn");
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    justSignedIn = true;
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: passcode });
    if (error) throw error;
    markLoginTime();
    scheduleAutoSignOut();
    document.getElementById("loginOverlay").style.display = "none";
    document.body.classList.remove("no-scroll");
    // Clear any stale page-level banner (e.g. "You've been signed out
    // after..." from an earlier auto-sign-out) now that the user has
    // successfully re-authenticated — this is a different banner from
    // the login modal's own error banner, which clearLoginModalState()
    // below already handles, so it was never being cleared on sign-in.
    showError("");
    // Same reset as the cancel paths (clearLoginModalState) — otherwise
    // a passcode revealed via the eye icon right before submitting would
    // still be showing in "visible" mode the next time this modal opens.
    clearLoginModalState();
    // No manual render() here: the global sb.auth.onAuthStateChange listener
    // fires right after sign-in, reloads fresh data, and calls render()
    // itself. Calling it again here caused a visible UI stutter.
  } catch (err) {
    justSignedIn = false;
    showLoginError(err?.message ? `Sign-in failed: ${err.message}` : "Incorrect passcode. Ask your senior batch for the current one.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
});

/* ===== Drive-link mode toggle for large files ===== */
let driveLinkMode = false;

(function setupDriveToggle(){
  const onBtn = document.getElementById("driveToggleBtn");
  const offBtn = document.getElementById("driveToggleOffBtn");
  const driveField = document.getElementById("driveLinkField");
  const fileInput = document.getElementById("fileInput");
  const fileLabel = document.querySelector('label[for="fileInput"]');
  const fileSizeHint = document.getElementById("fileSizeHint");
  const typeSelect = document.getElementById("typeSelect");

  if (!onBtn || !offBtn || !driveField || !fileInput) return;

  // Google Drive links are available for every entry type, so users can
  // choose Drive instead of uploading a local file for any category.
  const DRIVE_ALLOWED_TYPES = ["Notes", "Book", "Others"];

  function isDriveAllowedForCurrentType() {
    return typeSelect ? DRIVE_ALLOWED_TYPES.includes(typeSelect.value) : true;
  }

  function setDriveMode(on) {
    driveLinkMode = on;
    driveField.style.display = on ? "block" : "none";
    onBtn.style.display = (on || !isDriveAllowedForCurrentType()) ? "none" : "inline-flex";

    // Hide (rather than just disable) the file input/label/hint in Drive
    // mode so the form doesn't look like it still wants a file too.
    fileInput.style.display = on ? "none" : "";
    if (fileLabel) fileLabel.style.display = on ? "none" : "";
    if (fileSizeHint) fileSizeHint.style.display = on ? "none" : "";

    if (on) {
      fileInput.value = "";
    } else {
      document.getElementById("driveLinkInput").value = "";
    }
  }

  // Keep the toggle link's visibility in sync with the selected Type, and
  // drop back to file-upload mode if the user switches to a type that
  // doesn't allow Drive links while Drive mode is active.
  function syncDriveToggleForType() {
    const allowed = isDriveAllowedForCurrentType();
    if (!allowed && driveLinkMode) {
      setDriveMode(false);
    } else {
      onBtn.style.display = (driveLinkMode || !allowed) ? "none" : "inline-flex";
    }
  }

  onBtn.addEventListener("click", () => setDriveMode(true));
  offBtn.addEventListener("click", () => setDriveMode(false));

  typeSelect?.addEventListener("change", syncDriveToggleForType);

  // Reset to file-upload mode whenever the form is (re)opened, then
  // re-check the toggle against whatever Type is currently selected.
  document.getElementById("openFormBtn")?.addEventListener("click", () => {
    setDriveMode(false);
    syncDriveToggleForType();
  });

  // Initial state on page load.
  syncDriveToggleForType();
})();

function normalizeDriveUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
}
function isLikelyDriveLink(url) {
  try {
    const u = new URL(normalizeDriveUrl(url));
    return /(^|\.)drive\.google\.com$/i.test(u.hostname) || /(^|\.)docs\.google\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function hasDuplicateQuestionEntry(subjectCode, type, year, excludeEntryId = null) {
  if (!YEAR_REQUIRED_TYPES.includes(type)) return false;

  const normalizedSubject = String(subjectCode || "").trim();
  const normalizedYear = String(year || "").trim();

  return entries.some(entry =>
    String(entry?.id || "") !== String(excludeEntryId || "") &&
    String(entry?.subject || "").trim() === normalizedSubject &&
    canonicalEntryType(entry?.type) === type &&
    String(entry?.year || "").trim() === normalizedYear &&
    String(entry?.level || currentLevel) === String(currentLevel)
  );
}

let isUploading = false;
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  // Mashing Enter can queue multiple submit events before the button gets
  // disabled; this lock makes sure only one upload ever runs at a time.
  if (isUploading) return;
  isUploading = true;
  showFormError("");

  if (!session) {
    showFormError("Sign in to file a new entry.");
    isUploading = false;
    return;
  }

  const file = document.getElementById("fileInput").files[0];
  const driveUrl = normalizeDriveUrl(document.getElementById("driveLinkInput").value);
  const selectedType = document.getElementById("typeSelect").value;

  if (driveLinkMode) {
    if (!driveUrl) {
      showFormError("Paste the Google Drive share link.");
      isUploading = false;
      return;
    }
    if (!isLikelyDriveLink(driveUrl)) {
      showFormError("That doesn't look like a Google Drive link. Copy the \"Share\" link from Drive.");
      isUploading = false;
      return;
    }
  } else {
    if (!file) {
      showFormError("Choose a file to file into the archive.");
      isUploading = false;
      return;
    }

    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const isValidType = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValidType) {
      showFormError("Invalid file type. Only PDF and standard image files are allowed.");
      isUploading = false;
      return;
    }

    const typeLimit = maxBytesForType(selectedType);

    if (file.size > typeLimit) {
      showFormError(
        `That file is ${formatSize(file.size)}. ${selectedType} files must be under ${formatSize(typeLimit)}. Use the Google Drive link option instead.`
      );
      isUploading = false;
      return;
    }
  }

  const selected = document.getElementById("subjectSelect").selectedOptions[0];

  if (!selected?.value) {
    showFormError("Choose a subject.");
    isUploading = false;
    return;
  }

  let selectedSubjectId = selected.value;
  const selectedSubjectCode = selected.dataset.code || selected.value;
  const selectedSubjectMeta = subjects.find(s => s.code === selectedSubjectCode || s.id === selectedSubjectId);
  if (selectedSubjectMeta && !selectedSubjectMeta.id) {
    try {
      const { data: createdSubject, error: subjectError } = await sb.from("subjects").insert({
        name: selectedSubjectMeta.name,
        code: selectedSubjectMeta.code,
        created_by: session.user.id,
        level: currentLevel
      }).select("id,name,code,created_by").single();
      if (subjectError) throw subjectError;
      selectedSubjectId = createdSubject.id;
      await loadSubjectsFromWorker();
      renderSubjectFilters();
      renderSubjectOptions();
    } catch (err) {
      showFormError(err?.message || "Could not prepare that subject for filing.");
      isUploading = false;
      return;
    }
  }

  if ((selectedType === "Others" || selectedType === "Book") && !document.getElementById("titleInput").value.trim()) {
    showFormError(
      selectedType === "Book"
        ? "Add a title for the book."
        : "Add a title describing the file when Type is \"Others\"."
    );
    isUploading = false;
    return;
  }

  const yearVal = document.getElementById("yearInput").value.trim();
  if (YEAR_REQUIRED_TYPES.includes(selectedType)) {
    if (!yearVal) {
      showFormError(`Add a year for ${selectedType}.`);
      isUploading = false;
      return;
    }
    // A year field that only checked for "non-empty" let text like "abcd"
    // through, which parses to NaN and breaks chronological sorting.
    if (!/^\d{4}$/.test(yearVal)) {
      showFormError("Enter a valid 4-digit year.");
      isUploading = false;
      return;
    }
  } else if (YEAR_OPTIONAL_TYPES.includes(selectedType) && yearVal && !/^\d{4}$/.test(yearVal)) {
    // Year is optional for these types, but if something was typed it should
    // still be a real year, not garbage that breaks chronological sorting.
    showFormError("Enter a valid 4-digit year, or leave the year blank.");
    isUploading = false;
    return;
  }

  // A subject can have only one PYQ and one MTQ for each year.
  if (
    YEAR_REQUIRED_TYPES.includes(selectedType) &&
    hasDuplicateQuestionEntry(selectedSubjectCode, selectedType, yearVal)
  ) {
    showFormError(`A ${selectedType} for ${yearVal} already exists for this subject.`);
    isUploading = false;
    return;
  }

  const submitBtn =
    document.getElementById("submitBtn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Filing…";

  try {
    if (
      archiveRole !== "admin" &&
      archiveRole !== "contributor"
    ) {
      throw new Error(
        "This account is not allowed to upload."
      );
    }

    const form = new FormData();

    if (driveLinkMode) {
      form.append("drive_url", driveUrl);
    } else {
      form.append("file", file);
    }

    const subjectName = selected.textContent;

    const subtitleValue = document
      .getElementById("subtitleInput")
      .value
      .trim();

    const baseTitle =
      document
        .getElementById("titleInput")
        .value
        .trim() ||
        `${subjectName} — ${selectedType}`;

    form.append(
      "title",
      selectedType === "Notes" && subtitleValue
        ? `${baseTitle}: ${subtitleValue}`
        : baseTitle
    );

    form.append(
      "subject_id",
      selectedSubjectId
    );

    form.append(
      "type",
      document.getElementById("typeSelect").value
    );

    let finalYear = document.getElementById("yearInput").value.trim();
    if (!YEAR_VISIBLE_TYPES.includes(selectedType)) {
      finalYear = "";
    }
    form.append(
      "year",
      finalYear
    );

    form.append(
      "level",
      currentLevel
    );

    await workerFetch(
      "/upload",
      {
        method: "POST",
        body: form
      },
      true
    );

    entries = await loadEntries();
    totalStorageBytes = entries.reduce((sum, entry) => sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0);

    isUploading = false;
    closeAndResetUploadForm();

    render();

  } catch (err) {
    console.error(err);

    showFormError(
      err?.message
        ? `Upload failed: ${err.message}`
        : "Upload failed."
    );

  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add to archive";
    isUploading = false;
  }

});

