// === CuCu SW: cambia SOLO questa riga per forzare un refresh completo ===
const CACHE = 'cucu-7-11-2025';
// ========================================================================

// Asset principali da mettere in cache (percorsi assoluti)
const ASSETS = [
  '/CuCu-PWA/',
  '/CuCu-PWA/index.html',
  '/CuCu-PWA/styles.css',
  '/CuCu-PWA/script.js',
  '/CuCu-PWA/jszip.min.js',
  '/CuCu-PWA/manifest.json',
  '/CuCu-PWA/cucu-16.png',
  '/CuCu-PWA/cucu-32.png',
  '/CuCu-PWA/cucu-192.png',
  '/CuCu-PWA/cucu-512.png',
  '/CuCu-PWA/cucu-1024.png'
];

// Installazione: precache e attivazione immediata
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

// Attivazione: elimina cache vecchie e prendi controllo subito
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Messaggi dalla pagina (solo refresh manuale)
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach(client => client.navigate(client.url));
    })());
  }
});

// Fetch: network-first per HTML/manifest/SW, cache-first per il resto
self.addEventListener('fetch', event => {
  const req = event.request;

  // Non gestire richieste non-GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigazioni/documenti
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  // Manifest e service worker
  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Risorse statiche
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
