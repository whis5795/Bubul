/* Bubul · service worker: funciona sin conexión y se actualiza solo.
   Al publicar una versión nueva, sube el número de VERSION. */
var VERSION = 'bubul-v1';
var CORE = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
            'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  /* pagina: red primero (para recibir actualizaciones), cache si no hay conexion */
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(function (res) {
      var cp = res.clone(); caches.open(VERSION).then(function (c) { c.put('index.html', cp); });
      return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  /* resto (iconos, fuentes de Google): cache primero y se guarda lo nuevo */
  if (u.origin === location.origin || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(r).then(function (hit) {
      return hit || fetch(r).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { var cp = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, cp); }); }
        return res;
      });
    }));
  }
});
