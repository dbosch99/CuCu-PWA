// === CuCu SW: cambia SOLO questa riga per forzare un refresh completo ===
const CACHE = 'cucu-21-01-2026-3';
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
// nessuno skipWaiting: aggiornamento solo al riavvio o via CLEAR_CACHE
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

// Messaggi dalla pagina (refresh manuale dal bottone)
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

  if (req.method !== 'GET') return;

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
