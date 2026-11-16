const CACHE_NAME = 'matrimonial-tracker-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './matrimonial-tracker-app.html',
  './datalab-convert-Suchi-SHortlist.html',
  './manifest.json',
  './icon.svg',
  './shubham_kharche_biodata.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
