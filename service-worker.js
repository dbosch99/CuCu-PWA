// === CuCu SW: cambia SOLO questa riga per forzare un refresh completo ===
const CACHE = 'cucu-7-04-2026-4';
// ========================================================================

// Asset principali da mettere in cache (percorsi dalla root del sito)
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './jszip.min.js',
  './manifest.json',
  './cucu-192.png',
  './cucu-512.png',
  './cucu-1024.png'
];

// Installazione: precache (niente auto-reload)
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

// Attivazione: elimina cache vecchie e prendi controllo
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim(); // controlla subito le pagine aperte
  })());
});

// Fetch: network-first per HTML/manifest/SW e per qualsiasi hard refresh, cache-first per il resto
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Se la richiesta contiene _refresh, forza sempre la rete
  if (url.searchParams.has('_refresh')) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/service-worker.js') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/script.js') ||
    url.pathname.endsWith('/jszip.min.js')
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh.ok) cache.put(req, fresh.clone());
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
  if (fresh.ok) cache.put(req, fresh.clone());
  return fresh;
}

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'GET_APP_VERSION') return;

  event.source?.postMessage({
    type: 'APP_VERSION',
    version: CACHE
  });
});
