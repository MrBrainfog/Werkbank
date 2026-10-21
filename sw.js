// Offline-Speicher der Werkbank.
// Eigene Dateien: erst Netz (damit Updates sofort ankommen), sonst die gespeicherte Kopie.
// Schriften von Google: einmal laden, danach aus dem Speicher.
const CACHE = "werkbank-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png", "data.enc.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            const key = url.pathname.endsWith("/") ? "./" : req;
            caches.open(CACHE).then(c => c.put(key, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("./"))
        )
    );
    return;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
