const CACHE = "green-ledger-v1";
const FILES = [
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key =>
          key.startsWith("green-ledger-") &&
          key !== CACHE
        ).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache =>
          cache.put(event.request, copy)
        );
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(
        event.request,
        { ignoreSearch: true }
      );
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const page = await caches.match("./index.html");
        if (page) return page;
      }
      return new Response("Offline", { status: 503 });
    })
  );
});
