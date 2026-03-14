// CACHE_VERSION di-inject otomatis oleh GitHub Actions saat deploy
// Jangan edit manual — nilai ini berubah sendiri setiap push
const CACHE = "vault-v4-__CACHE_VERSION__";

const ASSETS = [
  "/vault-private-offline/",
  "/vault-private-offline/index.html",
  "/vault-private-offline/manifest.json",
  "/vault-private-offline/icon-192.png",
  "/vault-private-offline/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document'
              || url.pathname.endsWith('.html')
              || url.pathname.endsWith('/');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request)
          .then(r => r || caches.match("/vault-private-offline/index.html"))
        )
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        });
      }).catch(() => caches.match("/vault-private-offline/index.html"))
    );
  }
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
