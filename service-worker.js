const CACHE_NAME = 'shopping-list-cache-v2';
const OFFLINE_URLS = [
  '/Shopping-List/',
  '/Shopping-List/index.html',
  '/Shopping-List/icon-192.png',
  '/Shopping-List/manifest.json',
  '/Shopping-List/service-worker.js',
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

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Do not cache non-HTTP(S) requests (e.g. chrome-extension://)
  if (!request.url.startsWith('http')) return;

  // Avoid caching the service worker script
  if (request.url.includes('service-worker.js')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network and cache response for future use
      return fetch(request)
        .then(networkResponse => {
          // Cache valid responses only
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // If the network is unavailable and there's no cached response
          // Serve the cached index.html for navigations
          if (request.mode === 'navigate') {
            return caches.match('/Shopping-List/index.html');
          }

          // Optionally, return an empty fallback or a cached API response
          if (request.url.includes('/list')) {
            return new Response(
              JSON.stringify({ message: 'Offline: Cannot fetch shopping list' }),
              { status: 503, statusText: 'Service Unavailable' }
            );
          }
        });
    })
  );
});
