const CACHE_NAME = "shopping-list-cache-v1";
const urlsToCache = [
  "/",
  "/Shopping-List/index.html",
  "/Shopping-List/manifest.json",
  "/Shopping-List/icon-192.png",
  "/Shopping-List/icon-512.png"
];

// Install the service worker and cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Failed to cache resources:", error);
      });
    })
  );
});

// Fetch event to serve cached resources and handle network requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If cached response exists, return it. Otherwise, fetch from the network.
      return (
        response ||
        fetch(event.request).catch(() => {
          // Optional: serve fallback offline page if network is unavailable
          return caches.match("/Shopping-List/offline.html");
        })
      );
    })
  );
});

// Optional: activate event to clear old caches when the service worker is updated
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
});
