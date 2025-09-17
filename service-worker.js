// service-worker.js — aggiornamenti automatici senza bump
const CACHE_NAME = 'cucu-pwa';
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './jszip.min.js',
  './manifest.json',
  './192x192.png',
  './512x512.png'
];

// Attiva subito appena installato (su richiesta dalla pagina)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  // precache di base, ignora errori singoli
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(u)));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // tieni solo questa cache
    const names = await caches.keys();
    await Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : undefined));
    await self.clients.claim();
  })());
});

// Regola: per tutte le GET dello stesso origin → network-first.
// Se la rete risponde: restituisci e metti in cache.
// Se la rete fallisce: prova la cache (offline).
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;

  if (sameOrigin) {
    event.respondWith((async () => {
      try {
        // forza una richiesta fresca dal server, non dalla HTTP cache
        const net = await fetch(req, { cache: 'no-store' });
        if (net && net.ok && net.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, net.clone()); // aggiorna la cache in background
        }
        return net;
      } catch {
        const cached = await caches.match(req);
        // fallback: se è una navigazione e non hai cache, torna index.html
        if (req.mode === 'navigate') return caches.match('./index.html');
        if (cached) return cached;
        throw new Error('Offline e risorsa non in cache');
      }
    })());
  }
  // per richieste terze parti lascia passare (nessuna cache)
});
