/* ═══════════════════════════════════════
   k4niissg Game Store — Service Worker
   https://k4niissg.vercel.app
   ═══════════════════════════════════════ */

const CACHE_NAME   = 'k4niissg-v2';
const OFFLINE_PAGE = '/index.html';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ─── INSTALL ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => console.log('Cache install error:', err))
  );
});

/* ─── ACTIVATE ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ─── FETCH: Network First ─── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.destination === 'document') return caches.match(OFFLINE_PAGE);
          if (request.destination === 'image') {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200">
                <rect width="150" height="200" fill="#111"/>
                <text x="75" y="110" text-anchor="middle" font-size="40" fill="#333">🎮</text>
              </svg>`,
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        })
      )
  );
});
