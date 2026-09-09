const CACHE = "stat-archive-shell-v20260909-web-redesign-sync-v1";
const EXTERNAL_CACHE = "stat-archive-external-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
  "./assets/scanner.css",
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
  "./assets/js/offline-library-hybrid.js",
  "./assets/js/offline-library-heading-search-fix.js",
  "./assets/js/offline-library-entry-format.js",
  "./manuals/reader.html",
  "./manuals/contributor.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const MENU_FLASH_GUARD = `
.main-side-menu:not(.is-open),
.main-menu-backdrop:not(.is-open){display:none !important;}
`;

const FEATURE_SCRIPT_TAG = '<script src="./assets/js/feature-polish.js?v=20260905-7"></script>';
const HERO_FIX_SCRIPT_TAG = '<script src="./assets/js/hero-layout-fix.js?v=20260909-5"></script>';
const HERO_SELECTION_GUARD_TAG = '<script src="./assets/js/hero-selection-guard.js?v=20260906-3"></script>';
const ACTION_SPACING_FIX_TAG = '<script src="./assets/js/action-spacing-fix.js?v=20260909-15"></script>';
const SPEED_SCRIPT_TAG = '<script src="./assets/js/speed-boost.js?v=20260905-2"></script>';
const DOWNLOAD_FIX_TAG = '<script src="./assets/js/download-fix.js?v=20260905-1"></script>';
const SEARCH_SUGGESTIONS_TAG = '<script src="./assets/js/search-suggestions.js?v=20260905-4"></script>';
const SEARCH_FILTER_FIX_TAG = '<script src="./assets/js/search-filter-fix.js?v=20260905-1"></script>';
const ENTRY_METHOD_FIX_TAG = '<script src="./assets/js/entry-method-fix.js?v=20260909-1"></script>';
const MENU_POLISH_TAG = '<script src="./assets/js/menu-polish.js?v=20260909-websync-1"></script>';
const MENU_ALIGNMENT_FIX_TAG = '<script src="./assets/js/menu-alignment-fix.js?v=20260909-websync-1"></script>';
const PREVIEW_STATE_GUARD_TAG = '<script src="./assets/js/preview-state-guard.js?v=20260909-1"></script>';
const OFFLINE_HYBRID_TAG = '<script src="./assets/js/offline-library-hybrid.js?v=20260909-websync-1"></script>';
const OFFLINE_HEADING_TAG = '<script src="./assets/js/offline-library-heading-search-fix.js?v=20260909-websync-1"></script>';

function decorateNavigationHtml(html) {
  let out = html;

  out = out.replace(
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for every batch.',
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for everyone.'
  );

  out = out.replace(/<script[^>]+assets\/js\/(?:pdf-preview-v\d+|pdf-title-fix|pdf-touch-lock|pdf-zoom-fix|pdf-anchor-fix|pdf-drive-zoom)\.js[^>]*><\/script>/gi, '');

  out = out.replace('<script src="assets/js/runtime.js"></script>', '');

  const pdfLibTag = '<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>';
  if (out.includes(pdfLibTag)) {
    out = out.replace(
      pdfLibTag,
      `${SPEED_SCRIPT_TAG}\n<script src="assets/js/runtime.js"></script>\n<script defer src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>`
    );
  } else if (!out.includes('assets/js/speed-boost.js')) {
    out = out.replace('</body>', `${SPEED_SCRIPT_TAG}\n<script src="assets/js/runtime.js"></script>\n</body>`);
  }

  out = out.replace(
    '<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>',
    '<script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>'
  );
  out = out.replace(
    '<script src="assets/js/scanner.js"></script>',
    '<script defer src="assets/js/scanner.js"></script>'
  );

  if (!out.includes('assets/js/feature-polish.js')) out = out.replace('</body>', `${FEATURE_SCRIPT_TAG}\n</body>`);
  if (!out.includes('assets/js/hero-layout-fix.js')) out = out.replace('</body>', `${HERO_FIX_SCRIPT_TAG}\n</body>`);
  if (!out.includes('assets/js/hero-selection-guard.js')) out = out.replace('</body>', `${HERO_SELECTION_GUARD_TAG}\n</body>`);
  if (!out.includes('assets/js/action-spacing-fix.js')) out = out.replace('</body>', `${ACTION_SPACING_FIX_TAG}\n</body>`);
  if (!out.includes('assets/js/download-fix.js')) out = out.replace('</body>', `${DOWNLOAD_FIX_TAG}\n</body>`);
  if (!out.includes('assets/js/search-suggestions.js')) out = out.replace('</body>', `${SEARCH_SUGGESTIONS_TAG}\n</body>`);
  if (!out.includes('assets/js/search-filter-fix.js')) out = out.replace('</body>', `${SEARCH_FILTER_FIX_TAG}\n</body>`);
  if (!out.includes('assets/js/entry-method-fix.js')) out = out.replace('</body>', `${ENTRY_METHOD_FIX_TAG}\n</body>`);
  if (!out.includes('assets/js/menu-polish.js')) out = out.replace('</body>', `${MENU_POLISH_TAG}\n</body>`);
  if (!out.includes('assets/js/menu-alignment-fix.js')) out = out.replace('</body>', `${MENU_ALIGNMENT_FIX_TAG}\n</body>`);
  if (!out.includes('assets/js/offline-library-hybrid.js')) out = out.replace('</body>', `${OFFLINE_HYBRID_TAG}\n</body>`);
  if (!out.includes('assets/js/offline-library-heading-search-fix.js')) out = out.replace('</body>', `${OFFLINE_HEADING_TAG}\n</body>`);
  if (!out.includes('assets/js/preview-state-guard.js')) out = out.replace('</body>', `${PREVIEW_STATE_GUARD_TAG}\n</body>`);
  return out;
}

async function normalizeSameOriginResponse(response, url, isNavigation) {
  if (!response || !response.ok) return response;

  if (isNavigation) {
    const html = await response.text();
    return new Response(decorateNavigationHtml(html), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  if (url.pathname.endsWith('/assets/scanner.css')) {
    const css = await response.text();
    return new Response(css + MENU_FLASH_GUARD, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  return response;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(APP_SHELL.map(async asset => {
      try {
        const request = new Request(asset, { cache: 'reload' });
        const response = await fetch(request);
        if (!response || !response.ok) return;
        const url = new URL(request.url);
        const isNavigation = asset === './' || asset === './index.html';
        const finalResponse = await normalizeSameOriginResponse(response, url, isNavigation);
        await cache.put(request, finalResponse.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key !== CACHE && key !== EXTERNAL_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function updateSameOriginInBackground(request, url, isNavigation) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return;
    const finalResponse = await normalizeSameOriginResponse(response, url, isNavigation);
    const cache = await caches.open(CACHE);
    await cache.put(request, finalResponse.clone());
  } catch (_) {}
}

async function serveAppShellFast(request, url, isNavigation, event) {
  const cache = await caches.open(CACHE);
  let cached = await cache.match(request);

  if (!cached && isNavigation) {
    cached = (await cache.match('./index.html')) || (await cache.match('./'));
  }

  if (cached) {
    event.waitUntil(updateSameOriginInBackground(request, url, isNavigation));
    return cached;
  }

  try {
    const response = await fetch(request);
    if (!response || !response.ok) return response;
    const finalResponse = await normalizeSameOriginResponse(response, url, isNavigation);
    cache.put(request, finalResponse.clone()).catch(() => {});
    return finalResponse;
  } catch (_) {
    return Response.error();
  }
}

async function serveRuntimeNetworkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const freshRequest = new Request(request, { cache: 'no-store' });
    const response = await fetch(freshRequest);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    const cached = await cache.match(request);
    return cached || response;
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
          if (response && (response.ok || response.type === 'opaque')) {
            return cache.put(request, response.clone());
          }
        })
        .catch(() => {})
    );
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
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
      url.hostname === 'cdn.jsdelivr.net' ||
      url.hostname === 'cdnjs.cloudflare.com' ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com';

    event.respondWith(cacheableExternal ? fetchExternalFast(request, event) : fetch(request));
    return;
  }

  const isLiveRuntime =
    url.pathname.endsWith('/assets/js/preview.js') ||
    url.pathname.endsWith('/assets/js/pdf.js') ||
    url.pathname.endsWith('/assets/js/preview-state-guard.js') ||
    url.pathname.endsWith('/assets/js/hero-layout-fix.js') ||
    url.pathname.endsWith('/assets/js/action-spacing-fix.js') ||
    url.pathname.endsWith('/assets/js/tooltips.js') ||
    url.pathname.endsWith('/assets/js/menu-polish.js') ||
    url.pathname.endsWith('/assets/js/menu-alignment-fix.js') ||
    url.pathname.endsWith('/assets/js/offline-library-hybrid.js') ||
    url.pathname.endsWith('/assets/js/offline-library-heading-search-fix.js') ||
    url.pathname.endsWith('/assets/js/offline-library-entry-format.js');

  if (isLiveRuntime) {
    event.respondWith(serveRuntimeNetworkFirst(request));
    return;
  }

  const isNavigation = request.mode === "navigate" || url.pathname.endsWith('/index.html');
  const isMutableAppAsset =
    url.pathname.includes('/assets/js/') ||
    url.pathname.endsWith('/assets/styles.css') ||
    url.pathname.endsWith('/assets/scanner.css') ||
    url.pathname.endsWith('/manifest.json');

  if (isNavigation || isMutableAppAsset) {
    event.respondWith(serveAppShellFast(request, url, isNavigation, event));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  })());
});