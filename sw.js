const CACHE_NAME = 'anubandh-v57';
const ASSETS_TO_CACHE = [
  '/',
  './',
  './profile.html',
  './biodata.html',
  './styles.css',
  './config.js',
  './messages.js',
  './card-generator.js',
  './share-utils.js',
  './storage.js',
  './modals.js',
  './candidate-renderer.js',
  './voice-logger.js',
  './auth-pwa.js',
  './shubham_biodata_redesigned.html',
  './shubham_biodata_redesigned.png',
  './html2canvas.min.js',
  './candidates.json',
  './profile_data.json',
  './manifest.json',
  './icon.svg',
  './shubham_kharche_biodata.jpg'
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
