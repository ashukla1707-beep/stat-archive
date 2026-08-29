const CACHE = "stat-archive-shell-v20260829-share-offline-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
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
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

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
    url.pathname.endsWith("/manifest.json");

  if (isNavigation || isMutableAppAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);

          if (isNavigation) {
            return (await cache.match(request)) ||
                   (await cache.match("./index.html")) ||
                   (await cache.match("./")) ||
                   Response.error();
          }

          return (await cache.match(request)) || Response.error();
        })
    );
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
