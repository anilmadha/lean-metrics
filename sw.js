/* Lean Metrics — service worker
   Bumps its cache name so a redeploy of index.html can invalidate old
   assets; increment CACHE_NAME whenever core assets change. */
var CACHE_NAME = 'lean-metrics-v3';
var CORE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png',
  'icon-1024.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS).catch(function(){ /* offline install — ignore */ });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1;

  if(isHTML){
    // Network-first for the app shell itself, so a live deploy is picked
    // up on the next load instead of being stuck on a cached copy —
    // falling back to the cache only when there's no connection.
    event.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){ return cached || caches.match('index.html'); });
      })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest, fonts).
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
