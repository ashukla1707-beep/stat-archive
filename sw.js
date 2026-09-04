const CACHE = "stat-archive-shell-v20260905-mobile-spacing-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
  "./assets/scanner.css",
  "./assets/js/pdf.js",
  "./assets/js/core.js",
  "./assets/js/archive-ui.js",
  "./assets/js/preview.js",
  "./assets/js/offline.js",
  "./assets/js/management.js",
  "./assets/js/runtime.js",
  "./assets/js/tooltips.js",
  "./assets/js/service-worker-register.js",
  "./assets/js/hero-animation.js",
  "./assets/js/hero-selection-guard.js",
  "./assets/js/subject-panel.js",
  "./assets/js/accessibility.js",
  "./assets/js/feature-polish.js",
  "./assets/js/hero-layout-fix.js",
  "./manuals/reader.html",
  "./manuals/contributor.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const MENU_FLASH_GUARD = `
/* startup menu hard guard */
.main-side-menu:not(.is-open),
.main-menu-backdrop:not(.is-open){display:none !important;}
`;

const FEATURE_SCRIPT_TAG = '<script src="./assets/js/feature-polish.js?v=20260905-1"></script>';
const HERO_FIX_SCRIPT_TAG = '<script src="./assets/js/hero-layout-fix.js?v=20260901-4"></script>';
const HERO_SELECTION_GUARD_TAG = '<script src="./assets/js/hero-selection-guard.js?v=20260901-3"></script>';

function decorateNavigationHtml(html) {
  let out = html;
  out = out.replace(
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for every batch.',
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for everyone.'
  );
  if (!out.includes('assets/js/feature-polish.js')) {
    out = out.replace('</body>', `${FEATURE_SCRIPT_TAG}\n</body>`);
  }
  if (!out.includes('assets/js/hero-layout-fix.js')) {
    out = out.replace('</body>', `${HERO_FIX_SCRIPT_TAG}\n</body>`);
  }
  if (!out.includes('assets/js/hero-selection-guard.js')) {
    out = out.replace('</body>', `${HERO_SELECTION_GUARD_TAG}\n</body>`);
  }
  return out;
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function fetchMutable(request, url, isNavigation) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return response;

    let finalResponse = response;

    if (isNavigation) {
      const html = await response.text();
      finalResponse = new Response(decorateNavigationHtml(html), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } else if (url.pathname.endsWith("/assets/scanner.css")) {
      const css = await response.text();
      finalResponse = new Response(css + MENU_FLASH_GUARD, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    const copy = finalResponse.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy));
    return finalResponse;
  } catch (_) {
    const cache = await caches.open(CACHE);

    if (isNavigation) {
      const cached = (await cache.match(request)) ||
                     (await cache.match("./index.html")) ||
                     (await cache.match("./"));
      if (!cached) return Response.error();
      const html = await cached.text();
      return new Response(decorateNavigationHtml(html), {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers
      });
    }

    const cached = await cache.match(request);
    if (!cached) return Response.error();

    if (url.pathname.endsWith("/assets/scanner.css")) {
      const css = await cached.text();
      return new Response(css + MENU_FLASH_GUARD, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers
      });
    }

    return cached;
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  const isNavigation =
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html");

  const isMutableAppAsset =
    url.pathname.includes("/assets/js/") ||
    url.pathname.endsWith("/assets/styles.css") ||
    url.pathname.endsWith("/assets/scanner.css") ||
    url.pathname.endsWith("/manifest.json");

  if (isNavigation || isMutableAppAsset) {
    event.respondWith(fetchMutable(request, url, isNavigation));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
