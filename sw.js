const CACHE = "stat-archive-shell-v20260829-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
  "./assets/app.js",
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
  const sameOrigin = url.origin === self.location.origin;

  // Never cache API/Supabase/external requests as application assets.
  if (!sameOrigin) {
    event.respondWith(fetch(request));
    return;
  }

  const isNavigation =
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html");

  const isMutableAppAsset =
    url.pathname.endsWith("/assets/app.js") ||
    url.pathname.endsWith("/assets/styles.css") ||
    url.pathname.endsWith("/manifest.json");

  // HTML + mutable application assets are NETWORK FIRST.
  // This is important now that Stat Archive is modular: a cache-first app.js
  // would otherwise keep old JavaScript indefinitely after future deployments.
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

  // Stable same-origin assets such as icons: cache first.
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
