const CACHE_NAME = 'anubandh-v58';
const ASSETS_TO_CACHE = [
  '/',
  './',
  './profile.html',
  './biodata.html',
  './shubham_biodata_redesigned.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/messages.js',
  './js/card-generator.js',
  './js/share-utils.js',
  './js/storage.js',
  './js/modals.js',
  './js/candidate-renderer.js',
  './js/voice-logger.js',
  './js/auth-pwa.js',
  './js/html2canvas.min.js',
  './data/candidates.json',
  './data/profile_data.json',
  './assets/icon.svg',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './assets/shubham_kharche_biodata.jpg',
  './assets/shubham_biodata_redesigned.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Resilient cache loading: one failing asset never prevents SW installation
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[ServiceWorker] Optional cache skip for ${asset}:`, err.message);
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Resilient Navigation & Stale-While-Revalidate caching strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation requests (PWA opening, /index.html, root /)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return caches.match('/').then((rootCached) => {
          if (rootCached) return rootCached;
          return caches.match('./').then((dotCached) => {
            if (dotCached) return dotCached;
            return fetch(event.request).catch(() => {
              return caches.match('/') || caches.match('./');
            });
          });
        });
      }).then((resp) => {
        return resp || fetch(event.request);
      }).catch(() => {
        return caches.match('/') || caches.match('./');
      })
    );
    return;
  }

  // 2. Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }).catch(() => {
      return fetch(event.request);
    })
  );
});
