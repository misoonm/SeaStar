
// service-worker.js
const CACHE_NAME = 'qrcode-generator-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/database.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('جاري حذف الكاش القديم', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا كان الملف موجود في الكاش نرجعه
        if (response) {
          return response;
        }

        // إذا لم يكن موجود نحمله من الشبكة
        return fetch(event.request).then((response) => {
          // نتحقق من أن الرد صالح
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // ننسخ الرد
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
