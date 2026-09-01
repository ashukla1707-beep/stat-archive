const CACHE = "stat-archive-shell-v20260901-reader-polish-v1";

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
  "./assets/js/subject-panel.js",
  "./assets/js/accessibility.js",
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

const SITE_VISUAL_POLISH = `
/* =========================================================
   DESKTOP READER VISUAL POLISH
   ========================================================= */
@media (min-width:1101px){
  .hero-probability{
    right:28px !important;
  }
}

/* Reader-only: keep the Archive entries label, remove the long rule. */
body:has(#authDot.off) #archiveEntriesDivider i,
body:has(#authDot.off) .archive-entries-divider i,
body:has(#authDot.off) #archiveEntriesDivider::after,
body:has(#authDot.off) .archive-entries-divider::after{
  display:none !important;
  content:none !important;
}
body:has(#authDot.off) #archiveEntriesDivider,
body:has(#authDot.off) .archive-entries-divider{
  gap:0 !important;
}

/* Give the page a restrained statistical/ambient depth without clutter. */
body:not([data-theme="light"]){
  background:
    radial-gradient(850px 520px at 8% -6%,rgba(50,174,207,.14),transparent 62%),
    radial-gradient(720px 460px at 95% 8%,rgba(74,222,165,.075),transparent 64%),
    radial-gradient(900px 620px at 58% 88%,rgba(94,231,247,.038),transparent 68%),
    linear-gradient(180deg,#070a0f 0%,#060a0f 48%,#05080c 100%) !important;
}
body:not([data-theme="light"]) .grid-bg{
  opacity:.68 !important;
  background-image:
    linear-gradient(rgba(148,163,184,.032) 1px,transparent 1px),
    linear-gradient(90deg,rgba(148,163,184,.032) 1px,transparent 1px),
    radial-gradient(circle at 18% 22%,rgba(94,231,247,.055) 0 1px,transparent 1.5px),
    radial-gradient(circle at 78% 68%,rgba(74,222,165,.045) 0 1px,transparent 1.5px) !important;
  background-size:48px 48px,48px 48px,180px 180px,230px 230px !important;
}

body[data-theme="light"]{
  background:
    radial-gradient(900px 560px at 7% -5%,rgba(52,125,115,.11),transparent 64%),
    radial-gradient(760px 500px at 96% 10%,rgba(217,111,95,.075),transparent 64%),
    radial-gradient(900px 620px at 54% 92%,rgba(75,54,95,.04),transparent 68%),
    linear-gradient(180deg,#f7f3e9 0%,#f4f0e7 52%,#f2eee6 100%) !important;
}
body[data-theme="light"] .grid-bg{
  opacity:.42 !important;
  background-image:
    linear-gradient(rgba(39,48,45,.032) 1px,transparent 1px),
    linear-gradient(90deg,rgba(39,48,45,.032) 1px,transparent 1px),
    radial-gradient(circle at 20% 24%,rgba(52,125,115,.055) 0 1px,transparent 1.5px),
    radial-gradient(circle at 82% 70%,rgba(217,111,95,.05) 0 1px,transparent 1.5px) !important;
  background-size:48px 48px,48px 48px,190px 190px,240px 240px !important;
}
`;

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

    if (url.pathname.endsWith("/assets/scanner.css")) {
      const css = await response.text();
      finalResponse = new Response(css + MENU_FLASH_GUARD + SITE_VISUAL_POLISH, {
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
      return (await cache.match(request)) ||
             (await cache.match("./index.html")) ||
             (await cache.match("./")) ||
             Response.error();
    }

    const cached = await cache.match(request);
    if (!cached) return Response.error();

    if (url.pathname.endsWith("/assets/scanner.css")) {
      const css = await cached.text();
      return new Response(css + MENU_FLASH_GUARD + SITE_VISUAL_POLISH, {
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
