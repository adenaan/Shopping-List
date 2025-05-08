const CACHE_NAME = "shopping-list-cache-v1";
const urlsToCache = ["/", "/index.html", "/Shopping-List/manifest.json", "/Shopping-List/icon-192.png", "/Shopping-List/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (response) => response || fetch(event.request)
    )
  );
});
