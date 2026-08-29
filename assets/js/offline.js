/* ===== Offline Library (IndexedDB) =====
   This is not download history. It stores actual file blobs inside the PWA
   so saved files can be opened again without an internet connection. */
const OFFLINE_DB_NAME = "statArchiveOfflineLibrary";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_STORE = "files";

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Offline storage is not supported by this browser."));
      return;
    }
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open offline storage."));
  });
}

async function offlineDbAction(mode, action) {
  const db = await openOfflineDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, mode);
      const store = tx.objectStore(OFFLINE_STORE);
      let result;
      try { result = action(store); } catch (err) { reject(err); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("Offline storage operation failed."));
      tx.onabort = () => reject(tx.error || new Error("Offline storage operation was cancelled."));
    });
  } finally {
    db.close();
  }
}

async function getOfflineFiles() {
  const db = await openOfflineDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readonly");
      const req = tx.objectStore(OFFLINE_STORE).getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function getOfflineFile(id) {
  const db = await openOfflineDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readonly");
      const req = tx.objectStore(OFFLINE_STORE).get(String(id));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function putOfflineFile(record) {
  return offlineDbAction("readwrite", store => store.put(record));
}

async function deleteOfflineFile(id) {
  return offlineDbAction("readwrite", store => store.delete(String(id)));
}

async function clearOfflineFiles() {
  return offlineDbAction("readwrite", store => store.clear());
}

async function loadOfflineLibraryState() {
  try {
    const records = await getOfflineFiles();
    offlineEntryIds.clear();
    records.forEach(r => offlineEntryIds.add(String(r.id)));
    updateOfflineLibraryCount(records.length);
  } catch (err) {
    console.warn("Offline library unavailable:", err);
    updateOfflineLibraryCount(0);
  }
}

function updateOfflineLibraryCount(count = offlineEntryIds.size) {
  const badge = document.getElementById("offlineLibraryCount");
  if (badge) badge.textContent = String(count);
  const saved = document.getElementById("offlineSavedCount");
  if (saved) saved.textContent = String(count);
}

async function updateOfflineStorageInfo(records) {
  const el = document.getElementById("offlineStorageInfo");
  if (!el) return;
  const bytes = (records || []).reduce((sum, r) => sum + Number(r?.blob?.size || r?.size || 0), 0);
  let text = `${formatSize(bytes)} stored`;
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate?.quota) {
        const pct = estimate.usage ? Math.min(100, (estimate.usage / estimate.quota) * 100) : 0;
        text += ` · ${pct.toFixed(pct >= 10 ? 0 : 1)}% browser storage used`;
      }
    }
  } catch (_) {}
  el.textContent = text;
}

function offlineRecordLabel(record) {
  const subject = record.subjectName || record.subject || "Other";
  return [subject, record.type, record.year].filter(Boolean).join(" · ");
}

let offlineSearchTerm = "";
let offlineSubjectFilter = "All";
let offlineTypeFilter = "All";

function offlinePinned(record) {
  return record?.pinned === true;
}

function offlineSavedDate(record) {
  const n = Number(record?.savedAt || 0);
  if (!n) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { day:"numeric", month:"short", year:"numeric" }).format(new Date(n));
  } catch (_) {
    return "";
  }
}

function renderOfflineSubjectFilters(records) {
  const wrap = document.getElementById("offlineSubjectFilters");
  if (!wrap) return;

  const subjects = [...new Set(
    (records || [])
      .map(r => String(r.subjectName || r.subject || "Other").trim())
      .filter(Boolean)
  )].sort((a,b) => a.localeCompare(b));

  const options = ["All", ...subjects];
  if (!options.includes(offlineSubjectFilter)) offlineSubjectFilter = "All";

  wrap.innerHTML = options.map(subject => `
    <button type="button"
      class="offline-filter${offlineSubjectFilter === subject ? " active" : ""}"
      data-offline-subject="${escapeHtml(subject)}">
      ${escapeHtml(subject === "All" ? "All subjects" : subject)}
    </button>
  `).join("");
}

function renderOfflineTypeFilters(records) {
  const wrap = document.getElementById("offlineTypeFilters");
  if (!wrap) return;
  const types = [...new Set((records || []).map(r => String(r.type || "").trim()).filter(Boolean))];
  const typeRank = (type) => {
    const t = String(type || "").trim().toLowerCase();
    if (t === "book") return 0;
    if (t === "notes" || t === "note") return 1;
    if (t === "previous year question" || t === "pyq") return 2;
    if (t === "mid-term question" || t === "mid term question" || t === "mtq") return 3;
    return 100;
  };
  types.sort((a,b) => typeRank(a) - typeRank(b) || a.localeCompare(b));
  const options = ["All", ...types];
  if (!options.includes(offlineTypeFilter)) offlineTypeFilter = "All";
  wrap.innerHTML = options.map(type => `
    <button type="button" class="offline-filter${offlineTypeFilter === type ? " active" : ""}"
      data-offline-filter="${escapeHtml(type)}">${escapeHtml(type === "All" ? "All types" : type)}</button>
  `).join("");
}


function offlineCompactMeta(record) {
  const type = String(record?.type || "").trim();
  const yearRaw = String(record?.year || "").trim();
  const parts = [];

  // Offline cards always keep TYPE and YEAR together on the same line.
  // Example: Notes · 2026
  if (type) parts.push(type);
  if (/^(19|20)\d{2}$/.test(yearRaw)) parts.push(yearRaw);

  return parts.join(" · ");
}

async function renderOfflineLibrary() {
  const list = document.getElementById("offlineLibraryList");
  const clearBtn = document.getElementById("clearOfflineLibraryBtn");
  if (!list) return;

  let records = [];
  try {
    records = await getOfflineFiles();
  } catch (err) {
    list.innerHTML = `<div class="offline-empty">Offline storage could not be opened on this device.</div>`;
    return;
  }

  records.sort((a, b) => {
    const pinDiff = Number(offlinePinned(b)) - Number(offlinePinned(a));
    if (pinDiff) return pinDiff;
    return (Number(b.savedAt) || 0) - (Number(a.savedAt) || 0);
  });

  offlineEntryIds.clear();
  records.forEach(r => offlineEntryIds.add(String(r.id)));
  updateOfflineLibraryCount(records.length);
  updateOfflineStorageInfo(records);

  const subjectCount = new Set(records.map(r => r.subjectName || r.subject || "Other")).size;
  const subjectEl = document.getElementById("offlineSubjectCount");
  if (subjectEl) subjectEl.textContent = String(records.length ? subjectCount : 0);

  const totalBytes = records.reduce((sum, r) => sum + Number(r?.blob?.size || r?.size || 0), 0);
  const sizeEl = document.getElementById("offlineStoredSize");
  if (sizeEl) sizeEl.textContent = formatSize(totalBytes);

  renderOfflineSubjectFilters(records);
  renderOfflineTypeFilters(records);
  if (clearBtn) clearBtn.style.display = records.length ? "inline-block" : "none";

  if (!records.length) {
    list.innerHTML = `<div class="offline-empty"><strong style="color:var(--text)">No offline files yet.</strong><br/>Open any archive card and tap <b>⇩ Offline</b>. The actual file will be stored inside Stat Archive on this device.</div>`;
    return;
  }

  const q = offlineSearchTerm.trim().toLowerCase();
  const visible = records.filter(record => {
    const subjectName = String(record.subjectName || record.subject || "Other");
    if (offlineSubjectFilter !== "All" && subjectName !== offlineSubjectFilter) return false;
    if (offlineTypeFilter !== "All" && String(record.type || "") !== offlineTypeFilter) return false;
    if (!q) return true;
    const haystack = [
      record.title, record.filename, record.subjectName, record.subject,
      record.type, record.year, record.level
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });

  if (!visible.length) {
    list.innerHTML = `<div class="offline-no-results">No saved files match this search or filter.</div>`;
    return;
  }

  const groups = new Map();
  visible.forEach(record => {
    const subject = record.subjectName || record.subject || "Other";
    if (!groups.has(subject)) groups.set(subject, []);
    groups.get(subject).push(record);
  });

  list.innerHTML = [...groups.entries()].map(([subject, files]) => `
    <section class="offline-subject-group">
      <div class="offline-subject-head">
        <span>${escapeHtml(subject)}</span>
        <span>${files.length} ${files.length === 1 ? "file" : "files"}</span>
      </div>
      <div class="offline-subject-files">
        ${files.map(record => `
          <div class="offline-file${offlinePinned(record) ? " is-pinned" : ""}" data-offline-id="${escapeHtml(String(record.id))}">
            <div class="offline-file-head">
              <div>
                <div class="offline-file-title-row">
                  <button type="button" class="offline-pin-btn${offlinePinned(record) ? " is-pinned" : ""}"
                    title="${offlinePinned(record) ? "Unpin file" : "Pin file"}"
                    aria-label="${offlinePinned(record) ? "Unpin file" : "Pin file"}">${offlinePinned(record) ? "★" : "☆"}</button>
                  <div class="offline-file-title">${escapeHtml(record.title || record.filename || "Untitled")}${/^(19|20)\d{2}$/.test(String(record.year || "").trim()) ? ` : ${escapeHtml(String(record.year).trim())}` : ""}</div>
                </div>
                <div class="offline-file-meta">
                  ${offlineSavedDate(record) ? `<span class="offline-file-saved">· Saved ${escapeHtml(offlineSavedDate(record))}</span>` : ""}
                </div>
              </div>
              <span class="offline-file-size">${escapeHtml(formatSize(Number(record.blob?.size || record.size || 0)))}</span>
            </div>
            <div class="offline-file-actions">
              <button type="button" class="offline-open-btn">⊙ Open offline</button>
              <button type="button" class="offline-share-btn">↗ Share</button>
              <button type="button" class="offline-remove-btn">Remove</button>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
}

async function toggleOfflinePin(id) {
  const record = await getOfflineFile(id);
  if (!record) return;
  record.pinned = !offlinePinned(record);
  await putOfflineFile(record);
  await renderOfflineLibrary();
}

function openOfflineLibrary(focusId = null) {
  const overlay = document.getElementById("offlineLibraryOverlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  document.body.classList.add("no-scroll");
  renderOfflineLibrary().then(() => {
    if (focusId != null) {
      const el = overlay.querySelector(`[data-offline-id="${CSS.escape(String(focusId))}"]`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}

function closeOfflineLibrary() {
  const overlay = document.getElementById("offlineLibraryOverlay");
  if (!overlay) return;
  overlay.style.display = "none";
  document.body.classList.remove("no-scroll");
}

async function saveEntryOffline(entry, btn) {
  if (!entry || entry.driveUrl) return;

  if (offlineEntryIds.has(String(entry.id))) {
    openOfflineLibrary(entry.id);
    return;
  }

  const original = btn ? btn.innerHTML : "";
  if (btn) {
    btn.textContent = "Saving…";
    btn.disabled = true;
  }
  showError("");

  try {
    const response = await fetch(`${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`);
    if (!response.ok) throw new Error("Couldn't save that file for offline use.");

    const blob = await response.blob();
    const meta = subjectMeta(entry.subject);
    await putOfflineFile({
      id: String(entry.id),
      title: entry.title || entry.filename || "Untitled",
      subject: entry.subject || "",
      subjectName: meta?.name || entry.subject || "",
      type: entry.type || "",
      year: entry.year || "",
      filename: entry.filename || "file",
      size: Number(entry.size || blob.size || 0),
      level: entry.level || currentLevel,
      mime: blob.type || response.headers.get("content-type") || "application/octet-stream",
      savedAt: Date.now(),
      blob
    });

    offlineEntryIds.add(String(entry.id));
    // Saving a file into the Offline Library is a successful file download,
    // so it contributes to the global Downloads activity figure.
    incrementActivity("download");
    updateOfflineLibraryCount();
    if (btn) {
      btn.innerHTML = "✓ Offline";
      btn.classList.add("is-saved");
      btn.title = "Already saved offline — open Offline library";
    }

    // Ask the browser to make this site's storage less likely to be evicted.
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (_) {}
  } catch (err) {
    showError(err?.message || "Couldn't save that file for offline use.");
    if (btn) btn.innerHTML = original;
  } finally {
    if (btn) btn.disabled = false;
  }
}

let statArchiveReturningFromOfflineFile = false;
let statArchiveReturnOfflineId = null;

async function openOfflineFile(id) {
  const record = await getOfflineFile(id);
  if (!record?.blob) return;

  // Opening a PDF/image may temporarily background the PWA. Mark this so
  // Android's Back button returns to the Offline Library instead of causing
  // our normal "app resumed" hard refresh.
  statArchiveReturningFromOfflineFile = true;
  statArchiveReturnOfflineId = String(id);

  const url = URL.createObjectURL(record.blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600000);
}

function safeOfflineShareFilename(record) {
  const fallback = "stat-archive-file";
  const raw = String(record?.filename || record?.title || fallback).trim() || fallback;
  return raw.replace(/[\\/:*?"<>|]+/g, "_");
}

async function shareOfflineFile(id) {
  const record = await getOfflineFile(id);
  if (!record?.blob) throw new Error("Offline file could not be found.");

  if (typeof navigator.share !== "function") {
    throw new Error("File sharing is not supported on this device.");
  }

  const mime = record.mime || record.blob.type || "application/octet-stream";
  const file = new File(
    [record.blob],
    safeOfflineShareFilename(record),
    { type: mime, lastModified: Date.now() }
  );

  // Some browsers expose navigator.share() but do not support sharing files.
  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    throw new Error("This device cannot share this file type directly.");
  }

  try {
    await navigator.share({
      files: [file],
      title: record.title || record.filename || "Stat Archive file"
    });
  } catch (err) {
    // Closing the native share sheet is not an application error.
    if (err?.name === "AbortError") return;
    throw err;
  }
}

async function removeOfflineFile(id) {
  await deleteOfflineFile(id);
  offlineEntryIds.delete(String(id));
  updateOfflineLibraryCount();
  await renderOfflineLibrary();
  render(); // refresh card button labels
}


async function downloadEntry(entry, btn) {
  const original = btn ? btn.innerHTML : null;

  if (btn) {
    btn.textContent = "…";
    btn.disabled = true;
    document.body.classList.remove("cursor-hover");
  }

  showError("");

  try {
    const response = await fetch(
      `${WORKER_URL}/file?id=${encodeURIComponent(entry.id)}`
    );

    if (!response.ok) throw new Error("Couldn't download that file.");

    // Count only successful file fetches as downloads.
    incrementActivity("download");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = entry.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 600000);
  } catch (err) {
    showError(err?.message || "Couldn't download that file.");
  } finally {
    if (btn) {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  }
}

