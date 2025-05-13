const CACHE_NAME = 'shopping-list-cache-v3'; // Updated cache version
const OFFLINE_URLS = [
  '/Shopping-List/',
  '/Shopping-List/index.html',
  '/Shopping-List/icon-192.png',
  '/Shopping-List/manifest.json',
  '/Shopping-List/service-worker.js',
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Fetch: serve cache first, fallback to network
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests over http(s)
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Always fetch service-worker.js fresh
  if (request.url.includes('service-worker.js')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cached => cached || caches.match('/Shopping-List/index.html'))
    );
    return;
  }

  // Handle API calls (e.g., /list endpoint)
  if (request.url.includes('/list')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then(networkResponse => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() =>
            new Response(
              JSON.stringify({ message: 'Offline: Cannot fetch shopping list' }),
              { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
            )
          );
      })
    );
    return;
  }

  // All other requests: try cache first, fallback to network
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// Background Sync: attempt to sync shopping list
self.addEventListener('sync', event => {
  if (event.tag === 'sync-shopping-list') {
    event.waitUntil(syncShoppingListData());
  }
});

// Background Sync logic (simplified for localStorage)
async function syncShoppingListData() {
  const offlineData = await getOfflineShoppingList();
  if (!offlineData || offlineData.length === 0) return;

  try {
    const response = await fetch('/Shopping-List/list/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offlineData),
    });

    if (response.ok) {
      console.log('Shopping list synced successfully.');
      // Optionally clear cachedList after successful sync
      localStorage.removeItem('cachedList');
    } else {
      console.error('Sync failed with server.');
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Get offline data (localStorage example)
async function getOfflineShoppingList() {
  try {
    const cached = localStorage.getItem('cachedList');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}
