const CACHE_NAME = "ding-tou-ji-hua-github-v2";
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const inScope = path => `${BASE_PATH}${path}` || "/";
const APP_SHELL = [inScope("/"), inScope("/manifest.webmanifest"), inScope("/icon-192.png"), inScope("/icon-512.png"), inScope("/index-catalog.json"), inScope("/market-data.json")];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(`${BASE_PATH}/`)) return;

  if (url.pathname === inScope("/market-data.json")) {
    const canonical = new Request(`${url.origin}${inScope("/market-data.json")}`);
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(canonical, response.clone()));
      return response;
    }).catch(() => caches.match(canonical)));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(inScope("/"), copy));
      return response;
    }).catch(() => caches.match(inScope("/"))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
