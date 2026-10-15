// Service Worker for Anugruja Arts Studio Admin Portal
// Intercepts /images/ requests to serve from the browser's Cache Storage when offline or waiting for deployment.

const CACHE_NAME = 'anugruja-artwork-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests for artwork images (/images/...)
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          // Try matching exact request, then pathname without query params, then filename
          const cleanPath = url.pathname;
          const filename = cleanPath.split('/').pop() || '';

          const cachedResponse =
            (await cache.match(event.request)) ||
            (await cache.match(cleanPath)) ||
            (filename ? await cache.match(filename) : undefined);

          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise fetch from network
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            // Clone and cache the successful network response for future offline/fast loading
            cache.put(cleanPath, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (err) {
          // If network failed, try cache fallback
          const cache = await caches.open(CACHE_NAME);
          const cached = (await cache.match(url.pathname)) || (await cache.match(event.request));
          if (cached) return cached;
          throw err;
        }
      })()
    );
  }
});
