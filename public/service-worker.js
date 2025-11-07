// Blood Pressure Tracker Service Worker
// Simple cache-first strategy for offline functionality

const CACHE_NAME = 'bp-tracker-v4';
const STATIC_ASSETS = ['./', './index.html'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential assets');
        // Cache essential assets individually to avoid failing on missing files
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((error) => {
              console.warn('Service Worker: Failed to cache', url, error);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isHTMLRequest =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');

  if (isHTMLRequest) {
    // Network first for HTML files to get updates immediately
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            console.log(
              'Service Worker: Fetched fresh HTML from network',
              event.request.url
            );
            // Cache the fresh HTML
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          }
          throw new Error('Network response not ok');
        })
        .catch((error) => {
          console.log(
            'Service Worker: Network failed, serving cached HTML',
            event.request.url
          );
          // Fallback to cache for offline
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
  } else {
    // Cache first for assets (CSS, JS, images)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log(
            'Service Worker: Serving asset from cache',
            event.request.url
          );
          return cachedResponse;
        }

        console.log(
          'Service Worker: Fetching asset from network',
          event.request.url
        );
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (
              !response ||
              response.status !== 200 ||
              response.type !== 'basic'
            ) {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Asset fetch failed', error);
            throw error;
          });
      })
    );
  }
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received skip waiting message');
    self.skipWaiting();
  }
});
