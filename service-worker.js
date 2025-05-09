const CACHE_NAME = 'shopping-list-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/Shopping-List/', // adjust this if hosted at a subdirectory
  'https://adenaan.github.io/Shopping-List/index.html',
  '/Shopping-List/icon-192.png',
  '/Shopping-List/manifest.json',
  '/Shopping-List/service-worker.js',
  // add other necessary files like CSS, JS, etc.
];

// Install event: cache the offline assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const request = event.request;

  // Handle only GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          // Optionally cache new resources
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // fallback for navigations
          if (request.mode === 'navigate') {
            return caches.match('/Shopping-List/index.html');
          }
        });
    })
  );
});
