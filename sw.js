const CACHE_NAME = 'anubandh-v52';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './profile.html',
  './biodata.html',
  './styles.css',
  './config.js',
  './messages.js',
  './card-generator.js',
  './share-utils.js',
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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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

// Stale-While-Revalidate strategy: Serve instantly from cache (<10ms) while fetching freshest in background
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

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
    })
  );
});
