/* application section */

// ====== CONFIGURE THESE VALUES ======
const SUPABASE_URL = "https://owjaazsilueottklxjug.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AiJVlfLg2zrT2S4Fv3Ha5Q_tL-SvZxH";
const WORKER_URL = "https://stat-archive-api.lustats.workers.dev";
// Separate Contributor and Admin accounts, one pair per course level.
// Create all four users once in Supabase Dashboard -> Authentication -> Users -> Add user.
// Then set RLS on storage.objects so only 'authenticated' can INSERT/UPDATE/DELETE,
// while SELECT stays open to anon so browsing/preview/download need no login.
// NOTE: the BSc accounts below are placeholder addresses/naming — create the
// real Supabase Auth users with whatever emails you prefer, and update these
// two lines to match before relying on the B.Sc login.
const LOGIN_EMAILS = {
  msc: {
    contributor: "archive@statarchive.local",
    admin: "admin@statarchive.local"
  },
  bsc: {
    contributor: "archive-bsc@statarchive.local",
    admin: "admin-bsc@statarchive.local"
  }
};
// =====================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TYPE_MAX_BYTES = {
  "Previous Year Question": 1 * 1024 * 1024,
  "Mid-Term Question": 1 * 1024 * 1024,
  "Notes": 20 * 1024 * 1024,
  "Book": 20 * 1024 * 1024,
  "Others": 10 * 1024 * 1024,
};
const MAX_BYTES = 20 * 1024 * 1024;
function maxBytesForType(type) {
  return TYPE_MAX_BYTES[type] || MAX_BYTES;
}

const DEFAULT_SUBJECTS_MSC = [
  { code: "AML", name: "Advanced Machine Learning", builtin: true },
  { code: "APT", name: "Advanced Probability Theory", builtin: true },
  { code: "AST", name: "Advanced Sampling Theory", builtin: true },
  { code: "BDES", name: "Block Design", builtin: true },
  { code: "ECON", name: "Econometrics", builtin: true },
  { code: "MISC", name: "Other", builtin: true },
];

// Placeholder starter list only — rename/replace these anytime from the
// admin "+ Subject" control once B.Sc is live; they do not need to match
// your actual paper names before you start using the toggle.
const DEFAULT_SUBJECTS_BSC = [
  { code: "DESC", name: "Descriptive Statistics", builtin: true },
  { code: "PROB", name: "Probability Theory", builtin: true },
  { code: "SAMP", name: "Sampling Theory", builtin: true },
  { code: "SQC", name: "Statistical Quality Control", builtin: true },
  { code: "OR", name: "Operations Research", builtin: true },
  { code: "MISC", name: "Other", builtin: true },
];

function defaultSubjectsForLevel(level) {
  return level === "bsc" ? DEFAULT_SUBJECTS_BSC : DEFAULT_SUBJECTS_MSC;
}

// Read synchronously (not inside a later DOMContentLoaded/IIFE) so that
// init(), further down, already sees the right level on the very first
// load instead of briefly fetching M.Sc data and swapping to B.Sc after.
let currentLevel = "msc";
try {
  const urlLevel = new URLSearchParams(window.location.search).get("level");
  if (urlLevel === "bsc" || urlLevel === "msc") {
    currentLevel = urlLevel;
    localStorage.setItem("statArchiveLevel", urlLevel);
  } else {
    currentLevel = localStorage.getItem("statArchiveLevel") === "bsc" ? "bsc" : "msc";
  }
} catch (e) {}

let entries = [];
let subjects = [...defaultSubjectsForLevel(currentLevel)];
let hiddenDefaults = [];
let filterSubjects = new Set(); // empty = "All subjects"
let latestEntriesMode = false; // Admin/Contributor: newest uploads in one combined row
let showAllSubjectPills = false;
let mobileSubjectListOpen = false;
let showAllEntrySubjects = false;
const VISIBLE_SUBJECT_LIMIT = 7;
const VISIBLE_ENTRY_SUBJECT_LIMIT = 6;
let filterTypes = new Set(); // empty = "All types"
let searchQ = "";
let session = null;
let archiveRole = "viewer"; // viewer | contributor | admin; enforced by Supabase too
let signingOut = false; // prevents auth refresh races from restoring stale privileges during sign-out
let isEditing = false; // prevents double-submit races on the edit-entry form
let isLoadingArchive = false;
// Tracks the "current" preview request. previewEntry() captures the token
// after bumping it; any async step that finishes once the token no longer
// matches (i.e. the preview was closed or a newer preview was opened)
// bails out instead of overwriting the (now stale or gone) preview area.
let currentPreviewToken = 0;
// The currently-open pdf.js document, kept so closePreview() can call
// .destroy() on it and free its memory instead of leaving rendering tasks
// running after the preview is closed.
let activePdfDoc = null;
// Tracks the object URL of an in-progress or displayed image preview so
// closePreview() can revoke it even if the image hasn't finished loading
// yet (otherwise closing early orphans the Blob URL).
let activeObjectUrl = null;
// Lets closePreview() abort an in-flight preview fetch instead of letting
// a large file keep downloading in the background after the user left.
let previewAbortController = null;
let justSignedIn = false; // true only right after the login form is submitted — used to
                           // distinguish a real sign-in from Supabase restoring a session
                           // from storage on page load (which also fires "SIGNED_IN").

/* ===== 14-day auto sign-out ===== */
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const LOGIN_AT_KEY = "statArchiveLoginAt";
let autoSignOutTimer = null;

function markLoginTime() {
  try {
    localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
  } catch (err) {
    console.error("Could not persist login time:", err);
  }
}

function clearLoginTime() {
  localStorage.removeItem(LOGIN_AT_KEY);
  if (autoSignOutTimer) {
    clearTimeout(autoSignOutTimer);
    autoSignOutTimer = null;
  }
}

// Returns true if the stored login is older than SESSION_MAX_AGE_MS (or malformed).
function isLoginExpired() {
  const raw = localStorage.getItem(LOGIN_AT_KEY);
  if (raw === null) return false;
  const at = Number(raw);
  if (!Number.isFinite(at) || at <= 0) return true;
  return Date.now() - at >= SESSION_MAX_AGE_MS;
}

function scheduleAutoSignOut() {
  if (autoSignOutTimer) clearTimeout(autoSignOutTimer);
  if (!session) return; // Abort for read-only users
  const raw = localStorage.getItem(LOGIN_AT_KEY);
  const at = Number(raw);
  if (!Number.isFinite(at) || at <= 0) {
    clearLoginTime();
    autoSignOut();
    return;
  }
  const remaining = SESSION_MAX_AGE_MS - (Date.now() - at);
  if (remaining <= 0) {
    autoSignOut();
    return;
  }
  // setTimeout is capped in practice by tab lifetime; also re-checked on
  // visibility change below as a safety net for sleeping/backgrounded tabs.
  autoSignOutTimer = setTimeout(autoSignOut, remaining);
}

async function autoSignOut() {
  clearLoginTime();
  if (session) {
    try { await sb.auth.signOut(); }
    catch (err) { console.warn("Network failed, clearing local session.", err); }
    finally {
      session = null;
      showError("You've been signed out after 14 days. Please sign in again.");
      updateAuthUI();
    }
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && session) {
    if (isLoginExpired()) {
      autoSignOut();
    } else {
      scheduleAutoSignOut();
    }
  }
});

function showError(msg) {
  const el = document.getElementById("errorBanner");
  el.textContent = msg;
  el.style.display = msg ? "flex" : "none";
  if (msg) requestAnimationFrame(() => {
    if (el.offsetParent !== null) el.scrollIntoView({block:"nearest", behavior:"smooth"});
  });
}

function formatSize(bytes) {
  if (isNaN(bytes)) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Short labels for the type-breakdown chips (keeps the card compact).
const TYPE_ABBR = {
  "Notes": "Notes",
  "Book": "Book",
  "Previous Year Question": "PYQ",
  "Mid-Term Question": "Mid-Term",
  "Others": "Others"
};

async function loadActivityStats() {
  try {
    // Activity totals are loaded from Supabase. For true all-time totals,
    // the get_archive_activity RPC must not reset its counters by month.
    const { data, error } = await sb.rpc("get_archive_activity");

    if (error) throw error;

    const previewEl = document.getElementById("summaryPreviewCount");
    const downloadEl = document.getElementById("summaryDownloadCount");
    if (previewEl) previewEl.textContent = Number(data?.preview_count || 0).toLocaleString();
    if (downloadEl) downloadEl.textContent = Number(data?.download_count || 0).toLocaleString();
  } catch (err) {
    console.warn("Could not load activity stats:", err);
    const previewEl = document.getElementById("summaryPreviewCount");
    const downloadEl = document.getElementById("summaryDownloadCount");
    if (previewEl) previewEl.textContent = "—";
    if (downloadEl) downloadEl.textContent = "—";
  }
}

async function incrementActivity(kind) {
  try {
    await sb.rpc("increment_archive_activity", { p_event: kind });
    await loadActivityStats();
  } catch (err) {
    // Activity tracking must never block preview/download.
    console.warn("Could not record activity:", err);
  }
}

function updateStorageUI() {
  const card = document.getElementById("adminStorageCard");
  const label = document.getElementById("summaryStorageLabel");
  const value = document.getElementById("summaryStorage");
  const meta = document.getElementById("summaryStorageMeta");
  const activity = document.getElementById("summaryActivity");
  if (!card) return;

  card.style.display = "block";

  if (archiveRole === "admin" || archiveRole === "contributor") {
    if (activity) activity.style.display = "none";
    value.style.display = "block";
    if (meta) meta.style.display = "block";

    if (label) label.textContent = "Storage used";
    value.textContent = formatSize(totalStorageBytes);
    if (meta) {
      const count = entries.length;
      meta.textContent = `${count} archived ${count === 1 ? "file" : "files"} · R2 archive`;
    }
    return;
  }

  // Public/read-only visitors see global preview/download activity.
  if (label) label.textContent = "Activity";
  if (activity) activity.style.display = "flex";
  value.style.display = "none";
  if (meta) meta.style.display = "none";
  // loadActivityStats() used to be called here, but updateStorageUI() runs
  // on every render() — i.e. on every search keystroke and filter change —
  // which fired a database RPC call each time even though the activity
  // numbers hadn't changed. It's now loaded once in init() and refreshed
  // after an actual preview/download via incrementActivity().
}

// Cached code/id -> subject lookup, rebuilt only when the `subjects` array
// reference actually changes (it's reassigned, not mutated, everywhere in
// this app). Avoids re-scanning the whole subjects list for every single
// entry on every render() and every search keystroke.
let totalStorageBytes = 0;
let subjectIndexCache = null;
let subjectIndexCacheSource = null;
function getSubjectIndex() {
  if (subjectIndexCacheSource !== subjects) {
    subjectIndexCache = new Map();
    subjects.forEach(s => {
      if (s.code) subjectIndexCache.set(s.code, s);
      if (s.id) subjectIndexCache.set(s.id, s);
    });
    subjectIndexCacheSource = subjects;
  }
  return subjectIndexCache;
}

function subjectMeta(codeOrId) {
  if (!codeOrId) return { name: "Other", code: "MISC" };
  const idx = getSubjectIndex();
  return idx.get(codeOrId) || idx.get("MISC") || { name: "Other", code: "MISC" };
}

function updateAuthUI() {
  // Never let a stale role survive without a live session.
  if (!session) archiveRole = "viewer";
  const dot = document.getElementById("authDot");
  const access = document.getElementById("summaryAccess");
  const label = document.getElementById("authLabel");
  const authBtn = document.getElementById("authBtn");
  const openFormBtn = document.getElementById("openFormBtn");
  const latestEntriesBtn = document.getElementById("latestEntriesBtn");
  const permissionHint = document.getElementById("permissionHint");

  document.documentElement.dataset.authenticated = session ? "true" : "false";

  if (session) {
    dot.className = "dot on";
    if (access) {
      access.textContent =
        archiveRole === "admin" ? "ADMIN" :
        archiveRole === "contributor" ? "CONTRIBUTOR" :
        "SIGNED IN";
    }

    label.textContent = archiveRole === "admin"
      ? "Signed in as admin"
      : archiveRole === "contributor"
        ? "Signed in - You can upload files"
        : "Signed in - Upload permission only";

    authBtn.textContent = "Sign out";
    const canFileEntry = archiveRole === "admin" || archiveRole === "contributor";
    openFormBtn.disabled = !canFileEntry;
    openFormBtn.style.display = canFileEntry ? "inline-flex" : "none";
    openFormBtn.title = canFileEntry ? "" : "This account cannot upload";
    const canUseLatestEntries = archiveRole === "admin" || archiveRole === "contributor";
    if (latestEntriesBtn) {
      latestEntriesBtn.style.display = canUseLatestEntries ? "inline-flex" : "none";
      latestEntriesBtn.classList.toggle("active", latestEntriesMode);
    }

    // Keep the contributor interface clean: no permission-rules text below
    // the “File a new entry” button.
    if (permissionHint) {
      permissionHint.textContent = "";
      permissionHint.style.display = "none";
    }
  } else {
    dot.className = "dot off";
    if (access) access.textContent = "READ ONLY";
    label.textContent = "Read-only — sign in to file or remove entries";
    authBtn.textContent = "Sign in";
    openFormBtn.disabled = true;
    openFormBtn.style.display = "none";
    openFormBtn.title = "Sign in to file a new entry";
    latestEntriesMode = false;
    if (latestEntriesBtn) {
      latestEntriesBtn.style.display = "none";
      latestEntriesBtn.classList.remove("active");
    }
    if (permissionHint) {
      permissionHint.textContent = "";
      permissionHint.style.display = "none";
    }
  }

  updateStorageUI();
}

function applySignedOutUI() {
  // Do not rebuild thousands of cards just to remove privileged controls.
  // Remove them directly so sign-out stays responsive even on large archives.
  document.querySelectorAll("#grid .edit-btn, #grid .del-btn, .subject-edit, .subject-delete")
    .forEach(el => el.remove());

  const formBtn = document.getElementById("openFormBtn");
  if (formBtn) {
    formBtn.disabled = true;
    formBtn.style.display = "none";
  }

  const latestBtn = document.getElementById("latestEntriesBtn");
  if (latestBtn) {
    latestBtn.style.display = "none";
    latestBtn.classList.remove("active");
  }

  const addSubject = document.getElementById("addSubjectForm");
  if (addSubject) addSubject.remove();

  const addSubjectButton = document.querySelector("#subjectFilterRow .pill-dashed");
  if (addSubjectButton) addSubjectButton.remove();

  latestEntriesMode = false;
  document.documentElement.dataset.authenticated = "false";
}

async function getArchiveRole() {
  if (!session) {
    archiveRole = "viewer";
    return;
  }
  try {
    const { data, error } = await sb.rpc("get_my_archive_role");
    if (error) throw error;
    archiveRole = data === "admin" || data === "contributor" ? data : "viewer";
  } catch {
    archiveRole = "viewer";
  }
}

function mapDbEntry(e) {
  return {
    id: e.id,
    title: e.title || "Untitled",
    subject: e.subjects?.code || e.subject || "MISC",
    type: e.type || "Notes",
    year: e.year || "",
    filename: e.file_name || e.filename || "file",
    path: e.r2_key || "",
    size: Number(e.size || 0),
    uploadedAt: e.uploaded_at,
    uploadedBy: e.uploaded_by || e.user_id || null,
    level: e.level || currentLevel,
    // Backend-calculated permission. The frontend also independently computes
    // the latest 3 entries below so the Edit button still appears if an older
    // Worker response does not include contributor_editable. The backend remains
    // the final security authority and rejects unauthorized PATCH requests.
    contributorEditable: Boolean(e.contributor_editable),
    // Large files (>20MB) are hosted on Google Drive instead of R2 — the
    // Worker/DB return a drive_url for these instead of an r2_key. When
    // present, cards link out to Drive instead of hitting /file.
    driveUrl: e.drive_url || null
  };
}

async function workerFetch(path, options = {}, requireAuth = false) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (requireAuth) {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const token = data?.session?.access_token;
    if (!token) throw new Error("Please sign in first.");
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    if (contentType.includes("application/json")) {
      const body = await response.json().catch(() => null);
      if (body?.error) message = body.error;

      // The Worker often attaches a raw Supabase/Postgres error under
      // `details` (e.g. RLS policy denials, missing grants, FK violations)
      // that was previously swallowed here. Append it (truncated) so the
      // real cause is visible in the UI instead of just the generic
      // wrapper message like "Supabase rejected the deletion."
      if (body?.details) {
        const detailText =
          typeof body.details === "string"
            ? body.details
            : JSON.stringify(body.details);
        message += ` — ${detailText.slice(0, 300)}`;
      }
    } else {
      const text = await response.text().catch(() => "");
      if (text) message = text.slice(0, 300);
    }

    throw new Error(message);
  }

  return contentType.includes("application/json")
    ? response.json()
    : response;
}

async function loadEntries() {
  const data = await workerFetch(`/entries?level=${encodeURIComponent(currentLevel)}`);
  return Array.isArray(data?.entries)
    ? data.entries.map(mapDbEntry)
    : [];
}

async function loadSubjectsFromWorker() {
  // Public subject list comes from the Worker.
  // When signed in, also fetch created_by directly so the UI can show
  // the edit control only for subjects owned by the current contributor.
  const data = await workerFetch(`/subjects?level=${encodeURIComponent(currentLevel)}`);

  let dbSubjects = Array.isArray(data?.subjects)
    ? data.subjects.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        created_by: null,
        builtin: false
      }))
    : [];

  if (session) {
    try {
      const { data: ownedRows, error } = await sb
        .from("subjects")
        .select("id,name,code,created_by")
        .eq("level", currentLevel)
        .order("name", { ascending: true });

      if (!error && Array.isArray(ownedRows)) {
        dbSubjects = ownedRows.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          created_by: s.created_by || null,
          builtin: false
        }));
      }
    } catch (err) {
      console.warn("Could not load subject ownership:", err);
    }
  }

  // A successful Worker/database response is always the source of truth,
  // even when it contains ZERO subjects. Treating [] as "missing data" used
  // to resurrect legacy default subjects after the last real subject was
  // deleted, creating ghost pills that had no database record.
  subjects = dbSubjects.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

async function init() {
  try {
    let data;
    try {
      ({ data } = await sb.auth.getSession());
    } catch (authErr) {
      console.error("getSession failed:", authErr);
      archiveRole = "viewer";
      data = null;
    }
    // Optional chaining: if the Supabase client is unreachable it can
    // resolve with a null `data`, and `data.session` would throw.
    session = data?.session || null;

    if (session && isLoginExpired()) {
      await sb.auth.signOut();
      session = null;
      clearLoginTime();
      showError("You've been signed out after 14 days. Please sign in again.");
    } else if (session) {
      // Existing session with no recorded login time (e.g. from before this
      // feature, or a page refresh) — start the session clock now.
      if (!localStorage.getItem(LOGIN_AT_KEY)) markLoginTime();
      scheduleAutoSignOut();
    }

    await getArchiveRole();
    updateAuthUI();

    // Loaded once here instead of on every render() (see updateStorageUI).
    if (archiveRole === "viewer") {
      loadActivityStats();
    }

    const [loadedEntries] = await Promise.all([
      loadEntries(),
      loadSubjectsFromWorker()
    ]);
    entries = loadedEntries;
    totalStorageBytes = entries.reduce((sum, entry) => sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0);
  } catch (err) {
    // If the Worker connection drops during startup, fail gracefully
    // instead of throwing an unhandled rejection and leaving a blank screen.
    console.error("Init failed:", err);
    entries = entries || [];
    subjects = subjects && subjects.length ? subjects : [...defaultSubjectsForLevel(currentLevel)];
    showError("Could not connect to the archive.");
  }

  await loadOfflineLibraryState();
  renderSubjectFilters();
  renderTypeFilters();
  renderSubjectOptions();
  render();
}

// Supabase fires an INITIAL_SESSION event shortly after onAuthStateChange is
// registered, on top of init() also loading data itself — without this flag
// both ran the full entries/subjects/role fetch and render() on every page
// load, doubling the startup requests.
let isInitialLoad = true;
sb.auth.onAuthStateChange(async (event, s) => {
  // During a manual sign-out, TOKEN_REFRESHED can arrive before Supabase
  // emits SIGNED_OUT. Ignore that stale session instead of restoring Edit/Delete.
  if (signingOut && event !== "SIGNED_OUT") {
    return;
  }

  session = s;

  if (event === "INITIAL_SESSION" || isInitialLoad) {
    isInitialLoad = false;
    return; // Let init() handle the first data fetch.
  }

  // TOKEN_REFRESHED fires whenever the tab regains focus — including right
  // after the native file picker closes. It doesn't represent an actual
  // sign-in/out, so skip the full reload here; otherwise it rebuilds the
  // upload form's Subject dropdown mid-entry and wipes what was chosen.
  if (event === "TOKEN_REFRESHED") {
    return;
  }

  if (event === "SIGNED_OUT") {
    // The manual sign-out path already removed privileged controls. For an
    // automatic/external sign-out, do the same lightweight cleanup here.
    clearLoginTime();
    session = null;
    archiveRole = "viewer";
    latestEntriesMode = false;
    applySignedOutUI();
    updateAuthUI();
    if (!signingOut) render();
    signingOut = false;
    return;
  }

  try {
    await getArchiveRole();
    updateAuthUI();
    entries = await loadEntries();
    await loadSubjectsFromWorker();
    renderSubjectFilters();
    renderTypeFilters();
    renderSubjectOptions();
    render();
    if (event === "SIGNED_IN" && archiveRole === "contributor" && justSignedIn) {
      document.getElementById("contributorDisclaimerOverlay").style.display = "flex";
      document.body.classList.add("no-scroll");
    }
  } catch (err) {
    console.error("Auth state update failed:", err);
    showError("Network error while syncing your account. Please refresh.");
  } finally {
    justSignedIn = false;
  }
});

// Updates the toggle buttons, page title, and hero eyebrow to match the
// given level. Purely visual — does not touch data or the signed-in state.
function setLevelUI(level) {
  const value = level === "bsc" ? "bsc" : "msc";
  const mscBtn = document.getElementById("levelMscBtn");
  const bscBtn = document.getElementById("levelBscBtn");
  if (mscBtn && bscBtn) {
    mscBtn.classList.toggle("active", value === "msc");
    bscBtn.classList.toggle("active", value === "bsc");
    mscBtn.setAttribute("aria-pressed", value === "msc" ? "true" : "false");
    bscBtn.setAttribute("aria-pressed", value === "bsc" ? "true" : "false");
  }
  // Keep the shared/browser title neutral for both course levels.
  // The B.Sc / M.Sc selection is still controlled by the level parameter.
  document.title = "Stat Archive";
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("level", value);
    window.history.replaceState({ level: value }, "", url.href);
  } catch (e) {}
}

// Switches the whole app to the other level: signs out (each level has its
// own contributor/admin accounts, so a session from one means nothing under
// the other), swaps in that level's placeholder subjects immediately for a
// snappy toggle, then reloads the real level-scoped entries/subjects.
let levelSwitchInProgress = false;

async function switchLevel(level) {
  const value = level === "bsc" ? "bsc" : "msc";
  if (value === currentLevel || levelSwitchInProgress) return;

  // Close the mobile subject expansion BEFORE changing level. The expanded
  // panel belongs to the old level; if it stays mounted, renderSubjectFilters()
  // intentionally preserves it and the new B.Sc/M.Sc subjects never appear.
  mobileSubjectListOpen = false;
  showAllSubjectPills = false;
  const staleSubjectPanel = document.getElementById("subjectFilterExpanded");
  if (staleSubjectPanel) staleSubjectPanel.remove();

  levelSwitchInProgress = true;

  if (session) {
    try { await sb.auth.signOut(); } catch (e) {}
  }

  currentLevel = value;
  try { localStorage.setItem("statArchiveLevel", value); } catch (e) {}
  setLevelUI(value);

  subjects = [...defaultSubjectsForLevel(value)];
  filterSubjects = new Set();
  filterTypes = new Set();
  latestEntriesMode = false;
  showAllEntrySubjects = false;
  entries = [];
  isLoadingArchive = true;

  // Clear lingering search state
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  if (searchInput) searchInput.value = "";
  if (searchClear) searchClear.style.display = "none";
  searchQ = "";

  render();

  try {
    const [loadedEntries] = await Promise.all([
      loadEntries(),
      loadSubjectsFromWorker()
    ]);
    entries = loadedEntries;
    totalStorageBytes = entries.reduce((sum, entry) => sum + (Number.isFinite(Number(entry.size)) && Number(entry.size) > 0 ? Number(entry.size) : 0), 0);
  } catch (err) {
    console.error("Level switch load failed:", err);
    showError(`Could not load ${value === "bsc" ? "B.Sc" : "M.Sc"} data.`);
  }

  isLoadingArchive = false;
  renderSubjectFilters();
  renderTypeFilters();
  renderSubjectOptions();
  render();
  levelSwitchInProgress = false;
}

window.addEventListener("popstate", () => {
  let value = currentLevel;
  try {
    const level = new URL(window.location.href).searchParams.get("level");
    if (level === "bsc" || level === "msc") value = level;
  } catch {}
  if (value !== currentLevel) switchLevel(value);
});

function codeFromName(name, existingCodes) {
  const normalizedName = String(name || "").trim().toLowerCase();
  // MISC is the legacy/reserved code used by the built-in "Other" subject.
  // If an admin creates "Other" in a level whose database already reserves
  // MISC, use OTHER instead so the insert does not fail on subjects_code_unique.
  let base = normalizedName === "other"
    ? "OTHER"
    : String(name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
  if (!base) base = "SUBJ";
  let code = base, i = 1;
  while (existingCodes.includes(code) || (normalizedName === "other" && code === "MISC")) {
    const suffix = String(i++);
    code = (base.slice(0, Math.max(1, 5 - suffix.length)) + suffix).slice(0, 5);
  }
  return code;
}

function renderSubjectFilters() {
  const row = document.getElementById("subjectFilterRow");
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const openPanel = document.getElementById("subjectFilterExpanded");

  // Do not rebuild the mobile subject row while the expanded list is open.
  // Android Chrome/PWA can trigger font/viewport refreshes while scrolling;
  // rebuilding the row there destroys the open panel and makes it collapse.
  if (isMobile && mobileSubjectListOpen && openPanel) {
    openPanel.querySelectorAll("[data-subject-code]").forEach(btn => {
      btn.classList.toggle("active", filterSubjects.has(btn.dataset.subjectCode));
    });
    row.querySelectorAll(".subject-pill[data-subject-code]").forEach(pill => {
      pill.classList.toggle("active", filterSubjects.has(pill.dataset.subjectCode));
    });
    const more = row.querySelector(".subject-more-pill");
    if (more) more.textContent = "Show less";
    return;
  }

  row.innerHTML = "";

  const allPill = document.createElement("button");
  allPill.type = "button";
  allPill.className = "pill" + (filterSubjects.size === 0 ? " active" : "");
  allPill.textContent = "All subjects";
  allPill.onclick = () => {
    latestEntriesMode = false;
    filterSubjects.clear();
    renderSubjectFilters();
    updateAuthUI();
    render();
  };
  row.appendChild(allPill);


  // Keep the special "Other" subject at the very end when all subjects are shown.
  const sortedSubjects = [...subjects]
    .sort((a, b) => {
      const aIsOther = a.code === "MISC" || a.name.trim().toLowerCase() === "other";
      const bIsOther = b.code === "MISC" || b.name.trim().toLowerCase() === "other";
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  // Active filters bypass the visible-count limit so filtering by a
  // subject that's currently hidden under "Others" doesn't make its pill
  // (and the fact that it's still filtering) disappear on "Show less".
  // Render all subjects first. In the compact state, the row below automatically
  // keeps only as many as fit on the current monitor and moves the rest into Others.
  const visibleSubjects = sortedSubjects;

  visibleSubjects.forEach(s => {
      const pill = document.createElement("span");
      pill.className = "pill subject-pill" + (filterSubjects.has(s.code) ? " active" : "");
      pill.dataset.subjectCode = s.code;

      const label = document.createElement("button");
      label.type = "button";
      label.textContent = s.name;
      label.title = s.name;
      label.onclick = () => {
        if (filterSubjects.has(s.code)) {
          filterSubjects.delete(s.code);
        } else {
          filterSubjects.add(s.code);
        }
        renderSubjectFilters();
        render();
      };
      pill.appendChild(label);

      // Contributor: edit ONLY subjects created by this contributor.
      // Admin: edit any subject and delete any subject.
      const canEdit =
        !!session && (
        archiveRole === "admin" ||
        (
          archiveRole === "contributor" &&
          session &&
          s.created_by === session.user.id
        ));

      if (canEdit) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "subject-delete subject-edit";
        editBtn.textContent = "✎";
        editBtn.title = `Rename ${s.name}`;
        editBtn.setAttribute("aria-label", `Rename ${s.name}`);
        editBtn.onclick = async (e) => {
          e.stopPropagation();
          await renameSubject(s);
        };
        pill.appendChild(editBtn);
      }

      if (session && archiveRole === "admin") {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "subject-delete";
        deleteBtn.textContent = "×";
        deleteBtn.title = `Delete ${s.name}`;
        deleteBtn.setAttribute("aria-label", `Delete ${s.name}`);
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm(
            `Delete the subject "${s.name}"?\n\nThis cannot be done while entries are filed under it.`
          )) return;
          await removeSubject(s.code);
        };
        pill.appendChild(deleteBtn);
      }

      row.appendChild(pill);
    });

  const othersPill = document.createElement("button");
  othersPill.type = "button";
  othersPill.className = "pill subject-more-pill";
  othersPill.textContent = showAllSubjectPills ? "Show less" : "More";
  othersPill.onclick = () => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      othersPill.blur();

      const existingPanel = document.getElementById("subjectFilterExpanded");
      if (existingPanel) {
        // Collapse only on an explicit tap of Show less.
        mobileSubjectListOpen = false;
        existingPanel.remove();
        othersPill.textContent = "More";
        renderSubjectFilters();
        return;
      }

      mobileSubjectListOpen = true;

      // The compact view already contains Other. Remove that single pill before
      // expanding so Other can be placed exactly once at the end of the list.
      const otherCode = sortedSubjects.find(s =>
        s.code === "MISC" || s.name.trim().toLowerCase() === "other"
      )?.code;
      const compactOther = otherCode
        ? row.querySelector(`.subject-pill[data-subject-code="${CSS.escape(otherCode)}"]`)
        : null;
      if (compactOther) compactOther.remove();

      const hiddenPills = Array.from(row.querySelectorAll(".subject-pill"))
        .filter(p => p.style.display === "none")
        .map(p => p.dataset.subjectCode);

      const hiddenSubjects = sortedSubjects.filter(s =>
        hiddenPills.includes(s.code)
      );
      const otherSubject = sortedSubjects.find(s =>
        s.code === "MISC" || s.name.trim().toLowerCase() === "other"
      );

      const panel = document.createElement("div");
      panel.id = "subjectFilterExpanded";

      // Expanded order: hidden subjects -> Other -> Show less.
      // Mobile/PWA previously rendered only a plain subject button here,
      // so admin edit/delete controls disappeared for subjects revealed
      // under "More". Build the same controls that desktop uses.
      [...hiddenSubjects, ...(otherSubject ? [otherSubject] : [])].forEach(s => {
        const pill = document.createElement("span");
        pill.className = "pill subject-pill" + (filterSubjects.has(s.code) ? " active" : "");
        pill.dataset.subjectCode = s.code;

        const label = document.createElement("button");
        label.type = "button";
        label.textContent = s.name;
        label.title = s.name;
        label.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (filterSubjects.has(s.code)) filterSubjects.delete(s.code);
          else filterSubjects.add(s.code);
          latestEntriesMode = false;
          pill.classList.toggle("active", filterSubjects.has(s.code));
          render();
        };
        pill.appendChild(label);

        const canEdit =
          !!session && (
            archiveRole === "admin" ||
            (
              archiveRole === "contributor" &&
              s.created_by === session.user.id
            )
          );

        if (canEdit) {
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "subject-delete subject-edit";
          editBtn.textContent = "✎";
          editBtn.title = `Rename ${s.name}`;
          editBtn.setAttribute("aria-label", `Rename ${s.name}`);
          editBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await renameSubject(s);
          };
          pill.appendChild(editBtn);
        }

        if (session && archiveRole === "admin") {
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "subject-delete";
          deleteBtn.textContent = "×";
          deleteBtn.title = `Delete ${s.name}`;
          deleteBtn.setAttribute("aria-label", `Delete ${s.name}`);
          deleteBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm(
              `Delete the subject "${s.name}"?\n\nThis cannot be done while entries are filed under it.`
            )) return;
            await removeSubject(s.code);
          };
          pill.appendChild(deleteBtn);
        }

        panel.appendChild(pill);
      });

      // Insert the expanded list, keep Show less after the subjects,
      // and always keep + Subject as the final control.
      row.appendChild(panel);
      row.appendChild(othersPill);

      const addSubjectControl = row.querySelector(".pill-dashed");
      if (addSubjectControl) row.appendChild(addSubjectControl);

      othersPill.textContent = "Show less";
      return;
    }

    showAllSubjectPills = !showAllSubjectPills;
    mobileSubjectListOpen = false;
    renderSubjectFilters();
  };
  row.appendChild(othersPill);

  // Only contributors and admins can see the + Subject control.
  if (archiveRole === "contributor" || archiveRole === "admin") {
  const addPill = document.createElement("button");
  addPill.type = "button";
  addPill.className = "pill pill-dashed";
  addPill.textContent = "+ Subject";
  addPill.onclick = () => {
    const form = document.getElementById("addSubjectForm");
    if (form) {
      form.remove();
      return;
    }

    const f = document.createElement("form");
    f.id = "addSubjectForm";
    f.className = "add-subject-form";
    f.style.display = "inline-flex";
    f.innerHTML =
      `<input type="text" placeholder="New subject name" autofocus />` +
      `<button type="submit">Add</button>`;

    f.onsubmit = async (e) => {
      e.preventDefault();

      const input = f.querySelector("input");
      const button = f.querySelector("button");
      const name = input.value.trim();

      if (!name) {
        input.focus();
        return;
      }

      if (name.length > 100) {
        showError("Subject name must be 100 characters or less.");
        return;
      }

      const nameLower = name.toLowerCase();
      if (subjects.some(s => s.name.toLowerCase() === nameLower)) {
        showError("A subject with this name already exists.");
        return;
      }

      isSubmitting = true;
      button.disabled = true;
      button.textContent = "…";
      showError("");

      try {
        await createSubject(name);
        f.remove();
      } catch (err) {
        console.error(err);
        showError(
          err?.message
            ? `Couldn't create subject: ${err.message}`
            : "Couldn't create subject."
        );
        button.disabled = false;
        button.textContent = "Add";
      } finally {
        isSubmitting = false;
      }
    };

    // Allow users to back out of the form via Escape or by clicking away,
    // instead of it being stuck open with no way to close it.
    let isSubmitting = false;
    const cancelForm = () => {
      if (isSubmitting) return;
      if (document.body.contains(f)) {
        filterSubjects.delete("");
        renderSubjectFilters();
      }
    };
    f.querySelector("input").addEventListener("keydown", (e) => { if (e.key === "Escape") cancelForm(); });
    // Keep the form alive across focus changes, tab switches, and mobile keyboard resize events.

    row.appendChild(f);
    f.querySelector("input").focus();
  };

  row.appendChild(addPill);
  }

  // Desktop keeps the adaptive "fit as many as possible" behavior.
  // Mobile is intentionally simpler: show at most 3 real subjects in the
  // compact state, followed by the More button. This prevents 5 long subject
  // pills from taking several lines on a phone.
  const isMobileSubjectLayout = window.matchMedia("(max-width: 700px)").matches;
  const DESKTOP_MIN_VISIBLE_SUBJECTS = 5;

  row.classList.toggle("show-all-subjects", showAllSubjectPills);
  row.classList.remove("wrap-needed");

  if (!showAllSubjectPills) {
    const subjectPills = Array.from(row.querySelectorAll(".subject-pill"));

    // Reset to natural state before measuring.
    subjectPills.forEach(p => { p.style.display = ""; });
    othersPill.style.display = "inline-flex";
    othersPill.textContent = "More";

    if (isMobileSubjectLayout) {
      /* Mobile remains adaptive, but the compact state is capped at TWO
         visual rows. We measure the actual rendered pill widths, so a wider
         phone can show more subjects while a narrower phone shows fewer. */
      const styles = getComputedStyle(row);
      const gap = parseFloat(styles.columnGap || styles.gap) || 5;
      const available = Math.max(1, row.clientWidth);
      const allWidth = allPill.getBoundingClientRect().width;
      const moreWidth = othersPill.getBoundingClientRect().width;
      const widths = subjectPills.map(p => p.getBoundingClientRect().width);

      // Hide everything first, then add pills only while they fit in the
      // two-row packing model. "More" permanently reserves room on row 2.
      subjectPills.forEach(p => { p.style.display = "none"; });

      let row1Used = allWidth;
      let row2Used = moreWidth;
      let hiddenCount = subjectPills.length;
      let activePill = null;

      // Keep the active subject visible whenever possible.
      subjectPills.forEach(p => {
        if (p.classList.contains("active")) activePill = p;
      });

      const tryPlace = (pill, width) => {
        // Prefer filling row 1 first.
        if (row1Used + gap + width <= available) {
          pill.style.display = "";
          row1Used += gap + width;
          hiddenCount--;
          return true;
        }
        // Then fill row 2, preserving space already occupied by More.
        if (row2Used + gap + width <= available) {
          pill.style.display = "";
          row2Used += gap + width;
          hiddenCount--;
          return true;
        }
        return false;
      };

      // If a non-first active subject exists, reserve/show it first so the
      // current selection never disappears behind More.
      if (activePill) {
        const ai = subjectPills.indexOf(activePill);
        if (ai >= 0) tryPlace(activePill, widths[ai]);
      }

      subjectPills.forEach((pill, i) => {
        if (pill === activePill) return;
        tryPlace(pill, widths[i]);
      });

      // If every subject fitted in two rows, remove More and try once more
      // using the newly freed second-row space.
      if (hiddenCount === 0) {
        othersPill.style.display = "none";
      } else {
        othersPill.style.display = "inline-flex";
      }

      // Natural flex wrapping is now safe because only pills that mathematically
      // fit within two rows remain visible.
      row.classList.add("wrap-needed");
    } else {
      const styles = getComputedStyle(row);
      const gap = parseFloat(styles.columnGap || styles.gap) || 5;
      const available = row.clientWidth;
      const allPillWidth = allPill.getBoundingClientRect().width;
      const othersWidth = othersPill.getBoundingClientRect().width;
      const pillWidths = subjectPills.map(p => p.getBoundingClientRect().width);

      const totalWithoutOthers =
        allPillWidth + pillWidths.reduce((sum, w) => sum + w + gap, 0);

      if (totalWithoutOthers <= available) {
        othersPill.style.display = "none";
      } else {
        const budget = available - othersWidth - gap;
        let used = allPillWidth;
        let visibleCount = 0;
        let hiddenCount = 0;

        subjectPills.forEach((pill, i) => {
          const isActive = pill.classList.contains("active");
          const mustShow = isActive || visibleCount < DESKTOP_MIN_VISIBLE_SUBJECTS;
          const projected = used + gap + pillWidths[i];

          if (mustShow || projected <= budget) {
            pill.style.display = "";
            used = projected;
            visibleCount++;
          } else {
            pill.style.display = "none";
            hiddenCount++;
          }
        });

        othersPill.style.display = hiddenCount > 0 ? "inline-flex" : "none";

        if (row.scrollWidth > row.clientWidth) {
          row.classList.add("wrap-needed");
        }
      }
    }
  } else {
    othersPill.textContent = "Show less";
  }
}

// Recompute the subject-pill overflow whenever the viewport actually
// changes width, and once webfonts finish loading. Previously this was
// only calculated once at render time, so a resize (or a late webfont
// swap shifting pill widths) could leave the fit calculation stale --
// which is why "Others" could end up positioned past the edge of the
// screen on desktop.
let subjectFilterResizeTimer = null;
let subjectFilterLastViewportWidth = Math.round(window.innerWidth);

window.addEventListener("resize", () => {
  // On Android Chrome/PWA, scrolling hides/shows the browser UI and fires
  // resize events because the viewport HEIGHT changes. Rebuilding the
  // subject-filter row on those height-only resizes caused the page to jump.
  const currentWidth = Math.round(window.innerWidth);
  if (Math.abs(currentWidth - subjectFilterLastViewportWidth) < 2) return;

  subjectFilterLastViewportWidth = currentWidth;

  clearTimeout(subjectFilterResizeTimer);
  subjectFilterResizeTimer = setTimeout(() => {
    if (document.getElementById("addSubjectForm")) return;
    if (document.getElementById("subjectFilterRow")) renderSubjectFilters();
  }, 150);
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    if (document.getElementById("subjectFilterRow")) renderSubjectFilters();
  });
}

async function createSubject(name) {
  if (!session || !["admin", "contributor"].includes(archiveRole)) {
    throw new Error("You do not have permission to create subjects.");
  }

  const code = codeFromName(
    name,
    subjects.map(s => s.code)
  );

  const { data, error } = await sb
    .from("subjects")
    .insert({
      name,
      code,
      created_by: session.user.id,
      level: currentLevel
    })
    .select("id,name,code,created_by")
    .single();

  if (error) {
    console.error("Create subject error:", error);
    throw new Error(
      error.message ||
      "Supabase rejected the new subject. Check the subjects RLS policies."
    );
  }

  await loadSubjectsFromWorker();

  // Mobile/PWA keeps the expanded subject panel mounted while it is open.
  // After adding a subject, renderSubjectFilters() would otherwise return
  // early and the newly created subject would not appear until a manual refresh.
  // Close the expanded panel first, then rebuild from the freshly loaded list.
  mobileSubjectListOpen = false;
  document.getElementById("subjectFilterExpanded")?.remove();

  renderSubjectFilters();
  renderSubjectOptions();
  render();
}

async function renameSubject(subject) {
  if (!session || !["admin", "contributor"].includes(archiveRole)) {
    showError("Sign in with an archive account to rename a subject.");
    return;
  }

  const canEdit =
    archiveRole === "admin" ||
    (
      archiveRole === "contributor" &&
      subject.created_by === session.user.id
    );

  if (!canEdit) {
    showError("You can rename only subjects you created.");
    return;
  }

  const nextName = prompt("Rename subject:", subject.name);
  if (nextName === null) return;

  const name = nextName.trim();
  if (!name) {
    showError("Subject name cannot be empty.");
    return;
  }

  if (name.length > 100) {
    showError("Subject name must be 100 characters or less.");
    return;
  }

  if (name === subject.name) return;

  const nameLower = name.toLowerCase();
  if (subjects.some(s => s.id !== subject.id && s.name.toLowerCase() === nameLower)) {
    showError("A subject with this name already exists.");
    return;
  }

  showError("");

  try {
    let query = sb
      .from("subjects")
      .update({ name })
      .eq("id", subject.id);

    // This condition is the important security restriction for contributors.
    if (archiveRole === "contributor") {
      query = query.eq("created_by", session.user.id);
    }

    const { data, error } = await query
      .select("id,name,code,created_by")
      .single();

    if (error) {
      console.error("Rename subject error:", error);
      throw new Error(
        error.message ||
        "Supabase rejected the rename. Check the subjects RLS policies."
      );
    }

    const current = subjects.find(s => s.id === subject.id);
    if (current) {
      current.name = data.name;
      current.code = data.code;
      current.created_by = data.created_by || current.created_by;
    }

    // Mobile/PWA keeps the expanded subject panel mounted while it is open.
    // After renaming a subject, renderSubjectFilters() would otherwise return
    // early and leave the old subject name visible until a manual refresh.
    // Close the expanded panel first, then rebuild from the updated subjects.
    mobileSubjectListOpen = false;
    document.getElementById("subjectFilterExpanded")?.remove();

    renderSubjectFilters();
    renderSubjectOptions();
    render();
  } catch (err) {
    console.error(err);
    showError(
      err?.message
        ? `Couldn't rename subject: ${err.message}`
        : "Couldn't rename subject."
    );
  }
}

async function removeSubject(code) {
  if (archiveRole !== "admin") {
    showError("Only an Admin can delete subjects.");
    return;
  }

  if (entries.some(e => e.subject === code)) {
    showError("Move or delete entries filed under this subject before removing it.");
    return;
  }

  try {
    const subject = subjects.find(s => s.code === code);
    if (!subject) {
      throw new Error("Subject record not found.");
    }

    // Real database subjects have an id and must be removed from Supabase.
    // A legacy fallback subject has no id, so there is no database record to
    // delete; remove it from the current list instead. Because real database
    // data is now the source of truth when available, it will not reappear on
    // the next reload.
    if (subject.id) {
      const { error } = await sb
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (error) throw error;
    }

    subjects = subjects.filter(s => s.code !== code);
    filterSubjects.delete(code);

    // Mobile/PWA keeps the expanded subject panel mounted while it is open.
    // After deleting a subject, renderSubjectFilters() would otherwise return
    // early and leave that deleted subject visible in the stale panel.
    // Close/remove the mobile expanded panel first, then rebuild from the
    // updated subjects array so the deletion is reflected immediately.
    mobileSubjectListOpen = false;
    document.getElementById("subjectFilterExpanded")?.remove();

    renderSubjectFilters();
    renderSubjectOptions();
    render();
  } catch (err) {
    console.error(err);
    showError(
      err?.message
        ? `Couldn't remove that subject: ${err.message}`
        : "Couldn't remove that subject."
    );
  }
}

function renderTypeFilters() {
  const row = document.getElementById("typeFilterRow");
  row.innerHTML = "";
  const types = ["Previous Year Question", "Mid-Term Question", "Notes", "Book", "Others"];

  const allPill = document.createElement("button");
  allPill.type = "button";
  allPill.className = "pill" + (filterTypes.size === 0 ? " active" : "");
  allPill.textContent = "All types";
  allPill.onclick = () => { filterTypes.clear(); renderTypeFilters(); render(); };
  row.appendChild(allPill);

  types.forEach(t => {
    const pill = document.createElement("button");
    pill.type = "button";
    const active = filterTypes.has(t);
    pill.className = "pill" + (active ? " active" : "");
    pill.textContent = t;
    pill.onclick = () => {
      if (filterTypes.has(t)) {
        filterTypes.delete(t);
      } else {
        filterTypes.add(t);
      }
      renderTypeFilters();
      render();
    };
    row.appendChild(pill);
  });
}

function renderSubjectOptions() {
  const sel = document.getElementById("subjectSelect");
  const previouslySelected = sel.value;
  sel.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a subject";
  placeholder.disabled = true;
  placeholder.selected = true;
  sel.appendChild(placeholder);

  [...subjects]
    .filter(s => s.id || s.builtin)
    .sort((a, b) => {
      // Keep the special "Others" subject at the bottom of the filing dropdown.
      const aIsOther = a.name.trim().toLowerCase() === "other" || a.name.trim().toLowerCase() === "others";
      const bIsOther = b.name.trim().toLowerCase() === "other" || b.name.trim().toLowerCase() === "others";
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    })
    .forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id || s.code;
      opt.dataset.code = s.code || "";
      opt.textContent = s.name;
      sel.appendChild(opt);
    });

  if (previouslySelected && [...sel.options].some(o => o.value === previouslySelected)) {
    sel.value = previouslySelected;
  }
}


