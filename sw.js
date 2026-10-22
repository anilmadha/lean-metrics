/* Lean Metrics — service worker
   Bumps its cache name so a redeploy of index.html can invalidate old
   assets; increment CACHE_NAME whenever core assets change. */
var CACHE_NAME = 'lean-metrics-v24e';
var RUNTIME_CACHE = 'lean-metrics-runtime-v1';
var CORE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png',
  'icon-1024.png'
];
var NAV_TIMEOUT_MS = 3500;
var RUNTIME_MAX = 120;

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
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME && n !== RUNTIME_CACHE; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// Tapping a reminder notification focuses the app (or opens it).
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
      for(var i=0;i<list.length;i++){ if('focus' in list[i]) return list[i].focus(); }
      if(self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Only store real successes — never a 404/500 page or a redirect.
function cacheable(res){ return res && res.ok && res.type !== 'opaqueredirect'; }

function trimRuntime(){
  caches.open(RUNTIME_CACHE).then(function(cache){
    cache.keys().then(function(keys){
      if(keys.length > RUNTIME_MAX) Promise.all(keys.slice(0, keys.length - RUNTIME_MAX).map(function(k){ return cache.delete(k); }));
    });
  });
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;

  // Cross-origin: cache images and fonts (exercise photos, Google Fonts)
  // so they show offline; everything else goes straight to the network.
  if(!sameOrigin){
    var dest = req.destination;
    var isFont = dest === 'font' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if(dest !== 'image' && !isFont) return;
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(function(cache){
        return cache.match(req).then(function(cached){
          var net = fetch(req).then(function(res){
            // opaque (no-cors) images can't be inspected; keep them anyway
            if(cacheable(res) || res.type === 'opaque'){ cache.put(req, res.clone()); trimRuntime(); }
            return res;
          }).catch(function(){ return cached || Response.error(); });
          return cached || net;
        });
      })
    );
    return;
  }

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1;

  if(isHTML){
    // Network-first for the app shell so a live deploy is picked up on the
    // next load; a slow or failed network falls back to the cached copy
    // after a short timeout instead of hanging on a blank screen.
    event.respondWith(new Promise(function(resolve){
      var settled = false;
      function fromCache(){
        return caches.match(req).then(function(c){ return c || caches.match('index.html'); });
      }
      var timer = setTimeout(function(){
        fromCache().then(function(c){ if(c && !settled){ settled = true; resolve(c); } });
      }, NAV_TIMEOUT_MS);
      fetch(req).then(function(res){
        if(cacheable(res)){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
          clearTimeout(timer);
          if(!settled){ settled = true; resolve(res); }
          return;
        }
        // server error: prefer the last good copy if there is one
        fromCache().then(function(c){ clearTimeout(timer); if(!settled){ settled = true; resolve(c || res); } });
      }).catch(function(){
        fromCache().then(function(c){
          clearTimeout(timer);
          if(!settled){ settled = true; resolve(c || new Response('Offline', {status:503, headers:{'Content-Type':'text/plain'}})); }
        });
      });
    }));
    return;
  }

  // Cache-first for same-origin static assets (icons, manifest).
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        if(cacheable(res)){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
