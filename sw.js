const CACHE = "stat-archive-shell-v20260910-audit-bugfix-v1";
const EXTERNAL_CACHE = "stat-archive-external-v2";

const APP_SHELL = [
  "./","./index.html","./assets/styles.css","./assets/scanner.css",
  "./assets/js/pdf.js","./assets/js/core.js","./assets/js/archive-ui.js",
  "./assets/js/preview.js","./assets/js/preview-state-guard.js","./assets/js/offline.js",
  "./assets/js/management.js","./assets/js/speed-boost.js","./assets/js/download-fix.js",
  "./assets/js/search-suggestions.js","./assets/js/search-filter-fix.js","./assets/js/runtime.js",
  "./assets/js/tooltips.js","./assets/js/startup-polish.js","./assets/js/service-worker-register.js","./assets/js/hero-animation.js",
  "./assets/js/hero-selection-guard.js","./assets/js/subject-panel.js","./assets/js/accessibility.js",
  "./assets/js/feature-polish.js","./assets/js/hero-layout-fix.js","./assets/js/action-spacing-fix.js",
  "./assets/js/entry-method-fix.js","./assets/js/menu-polish.js","./assets/js/menu-alignment-fix.js",
  "./assets/js/menu-header-reference.js","./assets/js/offline-library-hybrid.js","./assets/js/scroll-lock-coordinator.js",
  "./assets/js/offline-library-handoff.js","./manuals/reader.html","./manuals/contributor.html",
  "./manifest.json","./icons/icon-192.png","./icons/icon-512.png"
];

const MENU_FLASH_GUARD = `
.main-side-menu:not(.is-open),
.main-menu-backdrop:not(.is-open){display:none !important;}
`;

const FEATURE_SCRIPT_TAG = '<script src="./assets/js/feature-polish.js?v=20260910-bugfix-2"></script>';
const HERO_FIX_SCRIPT_TAG = '<script src="./assets/js/hero-layout-fix.js?v=20260909-5"></script>';
const HERO_SELECTION_GUARD_TAG = '<script src="./assets/js/hero-selection-guard.js?v=20260906-3"></script>';
const ACTION_SPACING_FIX_TAG = '<script src="./assets/js/action-spacing-fix.js?v=20260910-mobile-reference-1"></script>';
const SPEED_SCRIPT_TAG = '<script src="./assets/js/speed-boost.js?v=20260910-bugfix-3"></script>';
const DOWNLOAD_FIX_TAG = '<script src="./assets/js/download-fix.js?v=20260905-1"></script>';
const SEARCH_SUGGESTIONS_TAG = '<script src="./assets/js/search-suggestions.js?v=20260910-bugfix-1"></script>';
const SEARCH_FILTER_FIX_TAG = '<script src="./assets/js/search-filter-fix.js?v=20260905-1"></script>';
const ENTRY_METHOD_FIX_TAG = '<script src="./assets/js/entry-method-fix.js?v=20260909-1"></script>';
const MENU_POLISH_TAG = '<script src="./assets/js/menu-polish.js?v=20260909-websync-1"></script>';
const MENU_ALIGNMENT_FIX_TAG = '<script src="./assets/js/menu-alignment-fix.js?v=20260909-navigation-fix-v2"></script>';
const MENU_HEADER_REFERENCE_TAG = '<script src="./assets/js/menu-header-reference.js?v=20260910-5"></script>';
const PREVIEW_STATE_GUARD_TAG = '<script src="./assets/js/preview-state-guard.js?v=20260909-1"></script>';
const OFFLINE_HYBRID_TAG = '<script src="./assets/js/offline-library-hybrid.js?v=20260910-canonical-15"></script>';
const SCROLL_LOCK_COORDINATOR_TAG = '<script src="./assets/js/scroll-lock-coordinator.js?v=20260910-2"></script>';
const OFFLINE_HANDOFF_TAG = '<script src="./assets/js/offline-library-handoff.js?v=20260910-3"></script>';
const STARTUP_POLISH_TAG = '<script data-stat-startup-polish="1" src="./assets/js/startup-polish.js?v=20260910-2"></script>';

function decorateNavigationHtml(html) {
  let out = html;
  out = out.replace(
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for every batch.',
    'A focused academic archive of notes and books, curated specifically for University of Lucknow — organized by subject and kept useful for everyone.'
  );

  /* The source SVG historically contained its own SMIL clip-width animation,
     while hero-animation.js also drew the same curve. Remove the inline SMIL
     before the document is parsed so the graph has exactly one animation owner. */
  out = out.replace(
    /<animate\s+attributeName=["']width["'][\s\S]*?\/>/i,
    ''
  );

  /* Hold the hero visual still until hero-animation.js prepares it. This also
     prevents the data-dot CSS delays from starting before the single curve
     animation owner is ready. The hero script removes this guard on start. */
  if (!out.includes('id="statHeroPreloadGuard"')) {
    out = out.replace(
      '</head>',
      '<style id="statHeroPreloadGuard">.gaussian-curve{opacity:0!important}.data-dot{animation:none!important}</style>\n</head>'
    );
  }

  out = out.replace(/<script[^>]+assets\/js\/(?:pdf-preview-v\d+|pdf-title-fix|pdf-touch-lock|pdf-zoom-fix|pdf-anchor-fix|pdf-drive-zoom)\.js[^>]*><\/script>/gi, '');
  out = out.replace(/<script[^>]+assets\/js\/offline-library-(?:hybrid|heading-search-fix|entry-format|handoff)\.js[^>]*><\/script>/gi, '');
  out = out.replace(/<script[^>]+assets\/js\/scroll-lock-coordinator\.js[^>]*><\/script>/gi, '');
  out = out.replace(/<script[^>]+assets\/js\/menu-header-reference\.js[^>]*><\/script>/gi, '');
  out = out.replace(/<script[^>]+assets\/js\/startup-polish\.js[^>]*><\/script>/gi, '');

  out = out.replace('<script src="assets/js/runtime.js"></script>', '');

  const pdfLibTag = '<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>';
  if (out.includes(pdfLibTag)) {
    out = out.replace(pdfLibTag, `${SPEED_SCRIPT_TAG}\n<script src="assets/js/runtime.js"></script>\n<script defer src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>`);
  } else if (!out.includes('assets/js/speed-boost.js')) {
    out = out.replace('</body>', `${SPEED_SCRIPT_TAG}\n<script src="assets/js/runtime.js"></script>\n</body>`);
  }

  out = out.replace('<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>', '<script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>');
  out = out.replace('<script src="assets/js/scanner.js"></script>', '<script defer src="assets/js/scanner.js"></script>');

  /* In the installed shell, register startup coordination before the service
     worker registration code so takeover cannot cause a second visible page load. */
  out = out.replace(
    '<script src="assets/js/service-worker-register.js"></script>',
    `${STARTUP_POLISH_TAG}\n<script src="assets/js/service-worker-register.js"></script>`
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
  out = out.replace('</body>', `${MENU_HEADER_REFERENCE_TAG}\n</body>`);

  out = out.replace('</body>', `${OFFLINE_HYBRID_TAG}\n${SCROLL_LOCK_COORDINATOR_TAG}\n${OFFLINE_HANDOFF_TAG}\n</body>`);

  if (!out.includes('assets/js/preview-state-guard.js')) out = out.replace('</body>', `${PREVIEW_STATE_GUARD_TAG}\n</body>`);
  return out;
}

function isAppShellNavigation(url) {
  const path = url.pathname || "/";
  return path.endsWith("/") || path.endsWith("/index.html");
}

async function normalizeSameOriginResponse(response, url, isAppNavigation) {
  if (!response || !response.ok) return response;
  if (isAppNavigation) {
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

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(APP_SHELL.map(async asset => {
      try {
        const request = new Request(asset, { cache: 'reload' });
        const response = await fetch(request);
        if (!response || !response.ok) return;
        const url = new URL(request.url);
        const isAppNavigation = asset === './' || asset === './index.html';
        const finalResponse = await normalizeSameOriginResponse(response, url, isAppNavigation);
        await cache.put(request, finalResponse.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CACHE && key !== EXTERNAL_CACHE).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function updateSameOriginInBackground(request, url, isAppNavigation) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return;
    const finalResponse = await normalizeSameOriginResponse(response, url, isAppNavigation);
    const cache = await caches.open(CACHE);
    await cache.put(request, finalResponse.clone());
  } catch (_) {}
}

/*
 * Cold app launches must paint from the installed shell immediately. The old
 * network-first navigation waited for the network before returning any HTML,
 * which left the Android/PWA window completely black for several seconds.
 * Serve the cached page first and refresh it in the background instead.
 */
async function serveAppShellFast(request, url, isAppNavigation, event) {
  const cache = await caches.open(CACHE);
  let cached = await cache.match(request);
  if (!cached && isAppNavigation) {
    cached = (await cache.match('./index.html')) || (await cache.match('./'));
  }
  if (cached) {
    event.waitUntil(updateSameOriginInBackground(request, url, isAppNavigation));
    return cached;
  }
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return response;
    const finalResponse = await normalizeSameOriginResponse(response, url, isAppNavigation);
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

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
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

  const isDocumentNavigation = request.mode === 'navigate';
  const isAppNavigation = isDocumentNavigation && isAppShellNavigation(url);

  if (isAppNavigation) {
    event.respondWith(serveAppShellFast(request, url, true, event));
    return;
  }

  /* Standalone documents such as manuals must stay standalone. Previously all
     navigation HTML was passed through decorateNavigationHtml(), which injected
     the main Stat Archive runtime into reader.html/contributor.html. */
  if (isDocumentNavigation) {
    event.respondWith(serveAppShellFast(request, url, false, event));
    return;
  }

  const isLiveRuntime =
    url.pathname.endsWith('/assets/js/preview.js') ||
    url.pathname.endsWith('/assets/js/pdf.js') ||
    url.pathname.endsWith('/assets/js/preview-state-guard.js') ||
    url.pathname.endsWith('/assets/js/speed-boost.js') ||
    url.pathname.endsWith('/assets/js/search-suggestions.js') ||
    url.pathname.endsWith('/assets/js/feature-polish.js') ||
    url.pathname.endsWith('/assets/js/startup-polish.js') ||
    url.pathname.endsWith('/assets/js/hero-animation.js') ||
    url.pathname.endsWith('/assets/js/hero-layout-fix.js') ||
    url.pathname.endsWith('/assets/js/action-spacing-fix.js') ||
    url.pathname.endsWith('/assets/js/tooltips.js') ||
    url.pathname.endsWith('/assets/js/service-worker-register.js') ||
    url.pathname.endsWith('/assets/js/accessibility.js') ||
    url.pathname.endsWith('/assets/js/menu-polish.js') ||
    url.pathname.endsWith('/assets/js/menu-alignment-fix.js') ||
    url.pathname.endsWith('/assets/js/menu-header-reference.js') ||
    url.pathname.endsWith('/assets/js/offline-library-hybrid.js') ||
    url.pathname.endsWith('/assets/js/scroll-lock-coordinator.js') ||
    url.pathname.endsWith('/assets/js/offline-library-handoff.js');

  if (isLiveRuntime) {
    event.respondWith(serveRuntimeNetworkFirst(request));
    return;
  }

  const isMutableAppAsset =
    url.pathname.includes('/assets/js/') ||
    url.pathname.endsWith('/assets/styles.css') ||
    url.pathname.endsWith('/assets/scanner.css') ||
    url.pathname.endsWith('/manifest.json');

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