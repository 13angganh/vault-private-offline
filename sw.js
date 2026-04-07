/* ════════════════════════════════════════════
   VAULT v4 — SERVICE WORKER
   Path relatif (./) agar bisa jalan di:
   - Firebase Hosting : vault-private-offline.web.app
   - GitHub Pages     : 13angganh.github.io/vault-private-offline/
   ════════════════════════════════════════════ */

const CACHE_NAME   = 'vault-v4-cache-v2';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/sidebar.css',
  './css/components.css',
  './js/crypto.js',
  './js/state.js',
  './js/storage.js',
  './js/auth.js',
  './js/render.js',
  './js/entry.js',
  './js/features.js',
  './js/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ── INSTALL: cache semua asset ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache error:', err))
  );
});

/* ── ACTIVATE: hapus cache lama ── */
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

/* ── FETCH: Cache First untuk assets, Network First untuk HTML ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin (Google Fonts, CDN, dll)
  if (url.origin !== self.location.origin) return;

  // Navigasi (HTML) → Network First, fallback cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request)
            .then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Assets (CSS, JS, img) → Cache First, fallback network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

/* ── MESSAGE: SKIP_WAITING dari app ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
