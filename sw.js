const SHELL = 'shell-v4';          // bump this number to force every visitor to refresh
const TILES = 'carto-tiles-v1';
const MAX_TILES = 300;
const PRECACHE = ['/', '/research/', '/awards/', '/radio/', '/news/', '/404.html', '/assets/css/style.css', '/assets/css/pages.css', '/assets/js/script.js', '/assets/images/IMG_9921-400.webp'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== TILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const c = await caches.open(name), keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

function swr(req, name) {
  return caches.open(name).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((r) => {
      if (r.ok || r.type === 'opaque') c.put(req, r.clone());
      return r;
    }).catch(() => hit || Response.error());
    return hit || net;
  }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); return r; })
        .catch(() => caches.match(req).then((h) => h || caches.match('/')))
    );
    return;
  }

  if (url.hostname.endsWith('basemaps.cartocdn.com')) {
    e.respondWith(swr(req, TILES).then((r) => { trim(TILES, MAX_TILES); return r; }));
    return;
  }

  if (url.origin === self.location.origin) e.respondWith(swr(req, SHELL));
});
