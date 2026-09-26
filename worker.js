const SUPABASE_URL = "https://owjaazsilueottklxjug.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AiJVlfLg2zrT2S4Fv3Ha5Q_tL-SvZxH";
const ADMIN_EMAILS = new Set(["admin@statarchive.local", "admin-bsc@statarchive.local"]);

function cleanFilename(value) {
  const raw = String(value || "Stat Archive file.pdf").replace(/[\\/:*?"<>|\r\n]+/g, "_").trim();
  return raw || "Stat Archive file.pdf";
}

function driveId(raw) {
  const value = String(raw || "").trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) return value;
  const match = value.match(/\/file\/d\/([A-Za-z0-9_-]+)/i) || value.match(/[?&]id=([A-Za-z0-9_-]+)/i) || value.match(/\/d\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : "";
}

async function fetchDriveFile(id, request) {
  const headers = new Headers();
  headers.set("Accept", "application/pdf,application/octet-stream,*/*");
  headers.set("User-Agent", request.headers.get("User-Agent") || "Mozilla/5.0");
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&confirm=t`,
    `https://drive.google.com/uc?id=${encodeURIComponent(id)}&export=download`
  ];
  let lastResponse = null;
  for (const target of candidates) {
    try {
      const response = await fetch(target, { method: "GET", headers, redirect: "follow" });
      lastResponse = response;
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (response.ok && !contentType.includes("text/html")) return response;
    } catch (_) {}
  }
  return lastResponse;
}

function outputContentType(upstream, requestedName) {
  const raw = String(upstream.headers.get("Content-Type") || "").trim();
  const lower = raw.toLowerCase();
  const generic = !raw || lower.includes("application/octet-stream") || lower.includes("binary/octet-stream");
  if (/\.pdf$/i.test(requestedName) && generic) return "application/pdf";
  return raw || (/\.pdf$/i.test(requestedName) ? "application/pdf" : "application/octet-stream");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

async function isAdminRequest(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY } });
    if (!response.ok) return false;
    const user = await response.json();
    return ADMIN_EMAILS.has(String(user?.email || "").toLowerCase());
  } catch (_) { return false; }
}

function cleanClientId(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
}

function normalizeIdentityName(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isProtectedReviewName(value) {
  const normalized = normalizeIdentityName(value);
  const compact = normalized.replace(/\s+/g, "");
  return normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "stat archive admin" ||
    normalized === "statarchive admin" ||
    normalized === "stat archive" ||
    normalized === "adarsh shukla" ||
    compact === "adarshshukla";
}

function normalizeModerationText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAbusiveContent(value) {
  const text = normalizeModerationText(value);
  if (!text) return false;
  const compact = text.replace(/\s+/g, "");

  const wordPatterns = [
    /\bf+u+c+k+(?:er|ing|ed|s)?\b/,
    /\bsh+i+t+(?:ty|ting|s)?\b/,
    /\bb+i+t+c+h+(?:es)?\b/,
    /\ba+s+s+h+o+l+e+s?\b/,
    /\bb+a+s+t+a+r+d+s?\b/,
    /\bc+u+n+t+s?\b/,
    /\bd+i+c+k+h+e+a+d+s?\b/,
    /\bm+o+t+h+e+r+f+u+c+k+e+r+s?\b/,
    /\bch+u+t+i+y+a+s?\b/,
    /\bch+u+t+i+y+e\b/,
    /\bk+u+t+t?i+y+a+s?\b/,
    /\bk+u+t+i+y+a+s?\b/,
    /\bk+u+t+t?i+\b/,
    /\bm+a+d+a+r+c+h+o+d+s?\b/,
    /\bb+a+h+e+n+c+h+o+d+s?\b/,
    /\bb+h+e+n+c+h+o+d+s?\b/,
    /\bg+a+n+d+u+s?\b/,
    /\bh+a+r+a+m+i+s?\b/,
    /\br+a+n+d+i+s?\b/,
    /\bb+h+o+s+d+i+k+e+s?\b/,
    /\bb+h+o+s+d+i+k+a+s?\b/,
    /\bb+h+o+s+d+i+w+a+l[ae]\b/,
    /\bbs+d+k+e?\b/,
    /\bbh+o+s+d+k+e?\b/,
    /\bbsh+d+k+e?\b/,
    /चू+तिया/u,
    /कुतिया/u,
    /कुत्ती/u,
    /मादरचोद/u,
    /मदरचोद/u,
    /बहनचोद/u,
    /भोसड़ी/u,
    /भोसडी/u,
    /गांडू/u,
    /रंडी/u
  ];

  if (wordPatterns.some(pattern => pattern.test(text))) return true;

  const compactPatterns = [
    /b+h+o+s+d+i+k+e/,
    /b+h+o+s+d+k+e?/,
    /b+s+d+k+e?/,
    /b+s+h+d+k+e?/,
    /m+a+d+a+r+c+h+o+d/,
    /b+a+h+e+n+c+h+o+d/,
    /b+h+e+n+c+h+o+d/,
    /c+h+u+t+i+y+[ae]/,
    /k+u+t+t?i+y+a/,
    /g+a+n+d+u/,
    /r+a+n+d+i/,
    /m+o+t+h+e+r+f+u+c+k+e+r/,
    /a+s+s+h+o+l+e/
  ];
  return compactPatterns.some(pattern => pattern.test(compact));
}

function moderationError() {
  return json({
    error: "Please keep reviews respectful. Constructive criticism is welcome, but abusive or offensive language is not allowed."
  }, 400);
}

function publicReview(item, clientId = "") {
  const likedBy = Array.isArray(item?.likedBy) ? item.likedBy : [];
  const replies = (Array.isArray(item?.replies) ? item.replies : [])
    .filter(reply => !hasAbusiveContent(reply?.name) && !hasAbusiveContent(reply?.reply));
  const orderedReplies = replies
    .map((reply, index) => ({ reply, index }))
    .sort((a, b) => {
      const aAdmin = !!a.reply?.isAdmin;
      const bAdmin = !!b.reply?.isAdmin;
      if (aAdmin !== bAdmin) return aAdmin ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ reply }) => reply);
  return {
    id: item.id,
    name: item.name,
    rating: item.rating,
    review: item.review,
    createdAt: item.createdAt,
    isAdmin: !!item.isAdmin,
    likes: likedBy.length,
    likedByMe: !!clientId && likedBy.includes(clientId),
    replies: orderedReplies
  };
}

export class ReviewsStore {
  constructor(state) { this.state = state; }

  async findReview(id) {
    const map = await this.state.storage.list({ prefix: "review:" });
    const pair = [...map.entries()].find(([, value]) => value?.id === id);
    return pair ? { key: pair[0], item: pair[1] } : null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const parts = url.pathname.replace(/^\/api\/reviews\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    const reviewId = parts[0] || "";
    const action = parts[1] || "";
    const childId = parts[2] || "";
    const clientId = cleanClientId(request.headers.get("X-Review-Client"));
    const adminRequest = request.headers.get("X-Stat-Admin") === "1";

    if (method === "GET" && !reviewId) {
      const map = await this.state.storage.list({ prefix: "review:" });
      const reviews = [...map.values()]
        .filter(item => !hasAbusiveContent(item?.name) && !hasAbusiveContent(item?.review))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 100)
        .map(item => publicReview(item, clientId));
      return json({ reviews });
    }

    if (method === "POST" && !reviewId) {
      const ip = request.headers.get("X-Stat-Client") || "unknown";
      const throttleKey = `throttle:${ip}`;
      const last = Number(await this.state.storage.get(throttleKey) || 0);
      if (Date.now() - last < 30000) return json({ error: "Please wait a few seconds before posting another review." }, 429);
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: "Invalid review data." }, 400); }
      const submittedName = String(body?.name || "").trim().slice(0, 50);
      const name = adminRequest ? "Admin" : submittedName;
      const review = String(body?.review || "").trim().slice(0, 500);
      const rating = Number(body?.rating || 0);
      if (name.length < 2) return json({ error: "Please enter your name." }, 400);
      if (!adminRequest && isProtectedReviewName(name)) return json({ error: "This name is reserved for the verified Stat Archive Admin." }, 403);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Choose a rating from 1 to 5 stars." }, 400);
      if (hasAbusiveContent(name) || hasAbusiveContent(review)) return moderationError();
      const item = { id: crypto.randomUUID(), name, rating, review, createdAt: new Date().toISOString(), isAdmin: adminRequest, likedBy: [], replies: [] };
      await this.state.storage.put(`review:${item.createdAt}:${item.id}`, item);
      await this.state.storage.put(throttleKey, Date.now(), { expirationTtl: 120 });
      return json({ review: publicReview(item, clientId) }, 201);
    }

    if (method === "POST" && reviewId && action === "like") {
      if (!clientId) return json({ error: "Unable to identify this device." }, 400);
      const found = await this.findReview(reviewId);
      if (!found) return json({ error: "Review not found." }, 404);
      const likedBy = Array.isArray(found.item.likedBy) ? [...found.item.likedBy] : [];
      const index = likedBy.indexOf(clientId);
      if (index >= 0) likedBy.splice(index, 1); else likedBy.push(clientId);
      found.item.likedBy = likedBy;
      await this.state.storage.put(found.key, found.item);
      return json({ likes: likedBy.length, liked: index < 0 });
    }

    if (method === "POST" && reviewId && action === "reply") {
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: "Invalid reply data." }, 400); }
      const name = adminRequest ? "Admin" : String(body?.name || "").trim().slice(0, 50);
      const text = String(body?.reply || "").trim().slice(0, 500);
      if (name.length < 2) return json({ error: "Please enter your name." }, 400);
      if (!adminRequest && isProtectedReviewName(name)) return json({ error: "This name is reserved for the verified Stat Archive Admin." }, 403);
      if (!text) return json({ error: "Please enter a reply." }, 400);
      if (hasAbusiveContent(name) || hasAbusiveContent(text)) return moderationError();
      const found = await this.findReview(reviewId);
      if (!found) return json({ error: "Review not found." }, 404);
      const replies = Array.isArray(found.item.replies) ? [...found.item.replies] : [];
      const reply = { id: crypto.randomUUID(), name, reply: text, createdAt: new Date().toISOString(), isAdmin: adminRequest };
      replies.push(reply);
      found.item.replies = replies.slice(-50);
      await this.state.storage.put(found.key, found.item);
      return json({ reply }, 201);
    }

    if (method === "DELETE" && reviewId && action === "reply" && childId) {
      const found = await this.findReview(reviewId);
      if (!found) return json({ error: "Review not found." }, 404);
      const before = Array.isArray(found.item.replies) ? found.item.replies : [];
      const replies = before.filter(r => r?.id !== childId);
      if (replies.length === before.length) return json({ error: "Reply not found." }, 404);
      found.item.replies = replies;
      await this.state.storage.put(found.key, found.item);
      return json({ ok: true });
    }

    if (method === "DELETE" && reviewId) {
      const found = await this.findReview(reviewId);
      if (!found) return json({ error: "Review not found." }, 404);
      await this.state.storage.delete(found.key);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed." }, 405);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/reviews" || url.pathname.startsWith("/api/reviews/")) {
      const isAdmin = await isAdminRequest(request);
      if (request.method === "DELETE" && !isAdmin) return json({ error: "Admin permission required." }, 403);
      const id = env.REVIEWS.idFromName("public-stat-archive-reviews");
      const stub = env.REVIEWS.get(id);
      const headers = new Headers(request.headers);
      headers.set("X-Stat-Client", request.headers.get("CF-Connecting-IP") || "unknown");
      headers.set("X-Stat-Admin", isAdmin ? "1" : "0");
      return stub.fetch(new Request(request.url, { method: request.method, headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body }));
    }

    if (url.pathname === "/drive-file") {
      const id = driveId(url.searchParams.get("id"));
      if (!id) return new Response("Invalid Drive file", { status: 400 });
      const requestedName = cleanFilename(url.searchParams.get("name"));
      const mode = url.searchParams.get("mode") === "download" ? "attachment" : "inline";
      const upstream = await fetchDriveFile(id, request);
      if (!upstream || !upstream.ok) return new Response("Drive file unavailable", { status: upstream?.status || 502 });
      const upstreamType = (upstream.headers.get("content-type") || "").toLowerCase();
      if (upstreamType.includes("text/html")) return new Response("Drive returned a confirmation page instead of the file", { status: 502 });
      const headers = new Headers();
      headers.set("Content-Type", outputContentType(upstream, requestedName));
      const length = upstream.headers.get("Content-Length"); if (length) headers.set("Content-Length", length);
      const contentRange = upstream.headers.get("Content-Range"); if (contentRange) headers.set("Content-Range", contentRange);
      const acceptRanges = upstream.headers.get("Accept-Ranges"); if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);
      // PDF.js relies on byte ranges for fast first-page rendering. Google
      // commonly honors Range with 206 even when Accept-Ranges is omitted.
      if (contentRange || upstream.status === 206) headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "private, no-store");
      headers.set("Content-Disposition", `${mode}; filename*=UTF-8''${encodeURIComponent(requestedName)}`);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    return env.ASSETS.fetch(request);
  }
};