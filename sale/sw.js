// sw.js - Service Worker للتخزين المؤقت والتحديث
const CACHE_NAME = 'store-management-v1';
const urlsToCache = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/products.html',
  '/pos.html',
  '/suppliers.html',
  '/credit.html',
  '/database.js',
  '/css/style.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
