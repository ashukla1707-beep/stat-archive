const CACHE = "stat-archive-shell-v20260910-optimized-v1";
const EXTERNAL_CACHE = "stat-archive-external-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
  "./assets/scanner.css",
  "./assets/scanner-base.css",
  "./assets/js/pdf.js",
  "./assets/js/core.js",
  "./assets/js/archive-ui.js",
  "./assets/js/preview.js",
  "./assets/js/preview-state-guard.js",
  "./assets/js/offline.js",
  "./assets/js/management.js",
  "./assets/js/speed-boost.js",
  "./assets/js/download-fix.js",
  "./assets/js/search-suggestions.js",
  "./assets/js/search-filter-fix.js",
  "./assets/js/runtime.js",
  "./assets/js/tooltips.js",
  "./assets/js/service-worker-register.js",
  "./assets/js/hero-animation.js",
  "./assets/js/hero-selection-guard.js",
  "./assets/js/subject-panel.js",
  "./assets/js/accessibility.js",
  "./assets/js/feature-polish.js",
  "./assets/js/hero-layout-fix.js",
  "./assets/js/action-spacing-fix.js",
  "./assets/js/entry-method-fix.js",
  "./assets/js/menu-polish.js",
  "./assets/js/menu-alignment-fix.js",
  "./assets/js/menu-header-reference.js",
  "./assets/js/offline-library-hybrid.js",
  "./assets/js/scroll-lock-coordinator.js",
  "./assets/js/offline-library-handoff.js",
  "./manuals/reader.html",
  "./manuals/contributor.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

const MENU_FLASH_GUARD = `
.main-side-menu:not(.is-open),
.main-menu-backdrop:not(.is-open){display:none !important;}
`;

const SPEED_SCRIPT_TAG =
  '<script src="./assets/js/speed-boost.js?v=20260905-2"></script>';
const RUNTIME_SCRIPT_TAG = '<script src="assets/js/runtime.js"></script>';

const CONDITIONAL_SCRIPT_INJECTIONS = [
  ["assets/js/feature-polish.js",
    '<script src="./assets/js/feature-polish.js?v=20260905-7"></script>'],
  ["assets/js/hero-layout-fix.js",
    '<script src="./assets/js/hero-layout-fix.js?v=20260909-5"></script>'],
  ["assets/js/hero-selection-guard.js",
    '<script src="./assets/js/hero-selection-guard.js?v=20260906-3"></script>'],
  ["assets/js/action-spacing-fix.js",
    '<script src="./assets/js/action-spacing-fix.js?v=20260910-mobile-reference-1"></script>'],
  ["assets/js/download-fix.js",
    '<script src="./assets/js/download-fix.js?v=20260905-1"></script>'],
  ["assets/js/search-suggestions.js",
    '<script src="./assets/js/search-suggestions.js?v=20260905-4"></script>'],
  ["assets/js/search-filter-fix.js",
    '<script src="./assets/js/search-filter-fix.js?v=20260905-1"></script>'],
  ["assets/js/entry-method-fix.js",
    '<script src="./assets/js/entry-method-fix.js?v=20260909-1"></script>'],
  ["assets/js/menu-polish.js",
    '<script src="./assets/js/menu-polish.js?v=20260909-websync-1"></script>'],
  ["assets/js/menu-alignment-fix.js",
    '<script src="./assets/js/menu-alignment-fix.js?v=20260909-navigation-fix-v2"></script>']
];

const ALWAYS_SCRIPT_TAGS = [
  '<script src="./assets/js/menu-header-reference.js?v=20260910-3"></script>',
  '<script src="./assets/js/offline-library-hybrid.js?v=20260910-canonical-15"></script>',
  '<script src="./assets/js/scroll-lock-coordinator.js?v=20260910-2"></script>',
  '<script src="./assets/js/offline-library-handoff.js?v=20260910-1"></script>'
];

const PREVIEW_STATE_GUARD_TAG =
  '<script src="./assets/js/preview-state-guard.js?v=20260909-1"></script>';

const LIVE_RUNTIME_SUFFIXES = [
  "/assets/js/preview.js",
  "/assets/js/pdf.js",
  "/assets/js/preview-state-guard.js",
  "/assets/js/hero-layout-fix.js",
  "/assets/js/action-spacing-fix.js",
  "/assets/js/tooltips.js",
  "/assets/js/service-worker-register.js",
  "/assets/js/menu-polish.js",
  "/assets/js/menu-alignment-fix.js",
  "/assets/js/menu-header-reference.js",
  "/assets/js/offline-library-hybrid.js",
  "/assets/js/scroll-lock-coordinator.js",
  "/assets/js/offline-library-handoff.js"
];

function injectBeforeBody(html, tag) {
  return html.replace("</body>", `${tag}\n</body>`);
}

function ensureInjected(html, needle, tag) {
  return html.includes(needle) ? html : injectBeforeBody(html, tag);
}

function decorateNavigationHtml(html) {
  let out = html.replace(
    "A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for every batch.",
    "A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for everyone."
  );

  out = out.replace(
    /<script[^>]+assets\/js\/(?:pdf-preview-v\d+|pdf-title-fix|pdf-touch-lock|pdf-zoom-fix|pdf-anchor-fix|pdf-drive-zoom)\.js[^>]*><\/script>/gi,
    ""
  );
  out = out.replace(
    /<script[^>]+assets\/js\/offline-library-(?:hybrid|heading-search-fix|entry-format|handoff)\.js[^>]*><\/script>/gi,
    ""
  );
  out = out.replace(
    /<script[^>]+assets\/js\/scroll-lock-coordinator\.js[^>]*><\/script>/gi,
    ""
  );
  out = out.replace(
    /<script[^>]+assets\/js\/menu-header-reference\.js[^>]*><\/script>/gi,
    ""
  );
  out = out.replace('<script src="assets/js/runtime.js"></script>', "");

  const pdfLibTag =
    '<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>';

  if (out.includes(pdfLibTag)) {
    out = out.replace(
      pdfLibTag,
      `${SPEED_SCRIPT_TAG}\n${RUNTIME_SCRIPT_TAG}\n` +
      '<script defer src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>'
    );
  } else if (!out.includes("assets/js/speed-boost.js")) {
    out = injectBeforeBody(out, `${SPEED_SCRIPT_TAG}\n${RUNTIME_SCRIPT_TAG}`);
  }

  out = out.replace(
    '<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>',
    '<script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>'
  );
  out = out.replace(
    '<script src="assets/js/scanner.js"></script>',
    '<script defer src="assets/js/scanner.js"></script>'
  );

  for (const [needle, tag] of CONDITIONAL_SCRIPT_INJECTIONS) {
    out = ensureInjected(out, needle, tag);
  }
  for (const tag of ALWAYS_SCRIPT_TAGS) {
    out = injectBeforeBody(out, tag);
  }

  return ensureInjected(
    out,
    "assets/js/preview-state-guard.js",
    PREVIEW_STATE_GUARD_TAG
  );
}

function rewrittenResponse(response, body) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function normalizeSameOriginResponse(response, url, isNavigation) {
  if (!response || !response.ok) return response;

  if (isNavigation) {
    return rewrittenResponse(
      response,
      decorateNavigationHtml(await response.text())
    );
  }

  if (url.pathname.endsWith("/assets/scanner.css")) {
    return rewrittenResponse(
      response,
      (await response.text()) + MENU_FLASH_GUARD
    );
  }

  return response;
}

async function cacheFreshResponse(cache, request, response, url, isNavigation) {
  if (!response || !response.ok) return null;
  const normalized = await normalizeSameOriginResponse(
    response,
    url,
    isNavigation
  );
  await cache.put(request, normalized.clone());
  return normalized;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(APP_SHELL.map(async asset => {
      try {
        const request = new Request(asset, { cache: "reload" });
        const response = await fetch(request);
        const url = new URL(request.url);
        const isNavigation = asset === "./" || asset === "./index.html";
        await cacheFreshResponse(cache, request, response, url, isNavigation);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key !== CACHE && key !== EXTERNAL_CACHE)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function updateSameOriginInBackground(request, url, isNavigation) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return;
    const cache = await caches.open(CACHE);
    await cacheFreshResponse(cache, request, response, url, isNavigation);
  } catch (_) {}
}

async function serveAppShellFast(request, url, isNavigation, event) {
  const cache = await caches.open(CACHE);
  let cached = await cache.match(request);

  if (!cached && isNavigation) {
    cached = (await cache.match("./index.html")) || (await cache.match("./"));
  }

  if (cached) {
    event.waitUntil(
      updateSameOriginInBackground(request, url, isNavigation)
    );
    return cached;
  }

  try {
    const response = await fetch(request);
    if (!response || !response.ok) return response;
    return await cacheFreshResponse(
      cache,
      request,
      response,
      url,
      isNavigation
    );
  } catch (_) {
    return Response.error();
  }
}

async function serveNavigationNetworkFirst(request, url) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response && response.ok) {
      return await cacheFreshResponse(cache, request, response, url, true);
    }
  } catch (_) {}

  return (await cache.match(request))
    || (await cache.match("./index.html"))
    || (await cache.match("./"))
    || Response.error();
}

async function serveRuntimeNetworkFirst(request) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    return (await cache.match(request)) || response;
  } catch (_) {
    return (await cache.match(request)) || Response.error();
  }
}

async function fetchExternalFast(request, event) {
  const cache = await caches.open(EXTERNAL_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    event.waitUntil(
      fetch(request)
        .then(response => {
          if (response && (response.ok || response.type === "opaque")) {
            return cache.put(request, response.clone());
          }
        })
        .catch(() => {})
    );
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    const cacheableExternal =
      url.hostname === "cdn.jsdelivr.net"
      || url.hostname === "cdnjs.cloudflare.com"
      || url.hostname === "fonts.googleapis.com"
      || url.hostname === "fonts.gstatic.com";

    event.respondWith(
      cacheableExternal ? fetchExternalFast(request, event) : fetch(request)
    );
    return;
  }

  const isNavigation =
    request.mode === "navigate" || url.pathname.endsWith("/index.html");
  if (isNavigation) {
    event.respondWith(serveNavigationNetworkFirst(request, url));
    return;
  }

  if (LIVE_RUNTIME_SUFFIXES.some(suffix => url.pathname.endsWith(suffix))) {
    event.respondWith(serveRuntimeNetworkFirst(request));
    return;
  }

  const isMutableAppAsset =
    url.pathname.includes("/assets/js/")
    || url.pathname.endsWith("/assets/styles.css")
    || url.pathname.endsWith("/assets/scanner.css")
    || url.pathname.endsWith("/assets/scanner-base.css")
    || url.pathname.endsWith("/manifest.json");

  if (isMutableAppAsset) {
    event.respondWith(serveAppShellFast(request, url, false, event));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
