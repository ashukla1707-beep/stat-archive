const CACHE = "stat-archive-shell-v20260828-2";

const APP_SHELL = [
  "./",
  "./index.html",
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
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /*
    For page navigation:
    Try the network first so new deployments are picked up.
    If internet is unavailable, load the cached Stat Archive page.
  */
  if (
    request.mode === "navigate" ||
    (
      url.origin === self.location.origin &&
      (
        url.pathname === "/" ||
        url.pathname.endsWith("/index.html")
      )
    )
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE).then(cache => {
              cache.put("./index.html", copy);
            });
          }

          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);

          return (
            await cache.match("./index.html")
          ) || (
            await cache.match("./")
          ) || Response.error();
        })
    );

    return;
  }

  /*
    Same-origin static assets:
    Use the cache when available.
    Otherwise fetch from the network and save a copy.
  */
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        });
      })
    );

    return;
  }

  /*
    Supabase / Worker / external API requests:
    Keep these network-only.
  */
  event.respondWith(fetch(request));
});
