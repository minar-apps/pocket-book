// Offline cache for Ahmadiyya Pocket Book.
// The page and the search index are fetched from the network first (so updates show at once) and fall back to the cache offline.
// Answer texts and scans are served from the cache first. Bump VERSION when publishing new data.
const VERSION = "pb-v5";
const SHELL = ["./", "index.html", "data/index.json", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const own = url.origin === location.origin;
  if (!own && !/fonts\.(googleapis|gstatic)\.com/.test(url.host)) return;
  const fresh = own && (e.request.mode === "navigate" || /\/(index\.html|sw\.js|data\/index\.json)$/.test(url.pathname) || url.pathname.endsWith("/"));
  e.respondWith(caches.open(VERSION).then(async c => {
    if (fresh) {
      try { const r = await fetch(e.request, { cache: "no-cache" }); if (r.ok) c.put(e.request, r.clone()); return r; }
      catch { return (await c.match(e.request, { ignoreSearch: true })) || Response.error(); }
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r;
  }));
});
