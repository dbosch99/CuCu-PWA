// === CuCu SW: cambia SOLO questa riga per forzare un refresh completo ===
const CACHE = 'cucu-6-11-2025';
// ========================================================================

// Asset principali da mettere in cache
const ASSETS = [
  '/CuCu-PWA/',
  '/CuCu-PWA/index.html',
  '/CuCu-PWA/styles.css',
  '/CuCu-PWA/script.js',
  '/CuCu-PWA/jszip.min.js',
  '/CuCu-PWA/manifest.json',
  '/CuCu-PWA/cucu-16.png',
  '/CuCu-PWA/cucu-32.png',
  '/CuCu-PWA/cucu-180.png',
  '/CuCu-PWA/cucu-192.png',
  '/CuCu-PWA/cucu-256.png',
  '/CuCu-PWA/cucu-512.png'
];

// Installazione: aggiunge gli asset al cache
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

// Attivazione: rimuove vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Messaggi dalla pagina (usato dal pulsante Refresh)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // cancella la cache e ricarica
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach(client => client.navigate(client.url));
    })());
  }
});

// Gestione fetch: network-first per HTML, cache-first per risorse
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  cache.put(req, fresh.clone());
  return fresh;
}
