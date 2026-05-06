/* ═══════════════════════════════════════
   k4niissg Game Store — Service Worker
   ═══════════════════════════════════════ */

const CACHE_NAME    = 'k4niissg-v1';
const OFFLINE_PAGE  = '/index.html';

/* الملفات التي تُحفظ فوراً عند التثبيت */
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ─── INSTALL: حفظ الملفات الأساسية ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

/* ─── ACTIVATE: حذف الكاش القديم ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─── FETCH: استراتيجية Network First ─── */
self.addEventListener('fetch', event => {
  const { request } = event;

  // تجاهل الطلبات غير HTTP
  if (!request.url.startsWith('http')) return;

  // تجاهل EmailJS وطلبات خارجية أخرى
  if (
    request.url.includes('emailjs.com') ||
    request.url.includes('googleapis.com') ||
    request.url.includes('api.')
  ) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // حفظ نسخة في الكاش
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // بدون إنترنت → ارجع من الكاش
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // إذا طلب صفحة → أرسل الصفحة الرئيسية
          if (request.destination === 'document') {
            return caches.match(OFFLINE_PAGE);
          }
          // صور غير محفوظة → أرسل placeholder
          if (request.destination === 'image') {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200" viewBox="0 0 150 200">
                <rect width="150" height="200" fill="#111"/>
                <text x="75" y="105" text-anchor="middle" font-size="40" fill="#333">🎮</text>
              </svg>`,
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});

/* ─── PUSH NOTIFICATIONS (مستقبلاً) ─── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'k4niissg', {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  });
});
