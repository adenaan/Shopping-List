const CACHE_NAME = 'shopping-list-cache-v3';  // Updated cache version
const OFFLINE_URLS = [
  '/Shopping-List/',
  '/Shopping-List/index.html',
  '/Shopping-List/icon-192.png',
  '/Shopping-List/manifest.json',
  '/Shopping-List/service-worker.js',
  '/Shopping-List/styles.css',  // Add CSS for offline viewing
  '/Shopping-List/scripts.js',  // Add JS for offline functionality
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

  // Handle cached response for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        // Serve fallback for offline navigation
        return caches.match('/Shopping-List/index.html');
      })
    );
    return;
  }

  // API Request handling for offline fallback
  if (request.url.includes('/list')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {
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
            // Return offline message when the network is unavailable
            return new Response(
              JSON.stringify({ message: 'Offline: Cannot fetch shopping list' }),
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
      })
    );
    return;
  }

  // Default response: serve from cache if available
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request);
    })
  );
});

// Optionally add background sync support if desired
self.addEventListener('sync', event => {
  if (event.tag === 'sync-shopping-list') {
    event.waitUntil(syncShoppingListData());
  }
});

// Example background sync function to sync items when online
async function syncShoppingListData() {
  const offlineData = await getOfflineShoppingList();
  if (offlineData && offlineData.length > 0) {
    try {
      const response = await fetch('/Shopping-List/list/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlineData),
      });
      if (response.ok) {
        console.log('Shopping list synced successfully.');
      } else {
        console.error('Failed to sync shopping list');
      }
    } catch (err) {
      console.error('Error during sync:', err);
    }
  }
}

// Helper function to retrieve offline data
async function getOfflineShoppingList() {
  // Implement logic to retrieve offline cached data
  // This can be done using IndexedDB or localStorage
  const cachedList = JSON.parse(localStorage.getItem('cachedList') || '[]');
  return cachedList;
}
