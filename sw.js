const CACHE_NAME = 'agenda-fineblock-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Pour les appels API Anthropic, toujours réseau
  if (e.request.url.includes('anthropic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Pour les polices Google, réseau puis cache
  if (e.request.url.includes('fonts.googleapis') || e.request.url.includes('fonts.gstatic')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(resp => { cache.put(e.request, resp.clone()); return resp; })
        )
      )
    );
    return;
  }
  // Pour le reste : cache d'abord, réseau si absent
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
