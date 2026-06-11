// sw.js — Aeolian Atlas service worker
//
// ROUTING TABLE
//   open-meteo.com / gstatic.com / firestore.googleapis.com / firebase*
//                                          → BYPASS (network-only, never cached)
//   arcgisonline.com tiles                 → CACHE-FIRST  (atlas-tiles-v1, FIFO 2000)
//   everything else (shell + CDN assets)   → NETWORK-FIRST, 4 s timeout, cache fallback
//                                            (atlas-shell-v3)
//
// Bump SHELL_VER on every deploy so all clients pull fresh files on next load.
const SHELL_VER = "atlas-shell-v4";
const TILE_VER  = "atlas-tiles-v1";
const TILE_MAX  = 2000; // max tile cache entries (FIFO eviction)

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./styles.css",
  "./firebase-sync.js",
  "./firebase-config.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js",
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
  "https://cdn.jsdelivr.net/npm/leaflet.locatecontrol/dist/L.Control.Locate.min.js",
  "https://cdn.jsdelivr.net/npm/leaflet.locatecontrol/dist/L.Control.Locate.min.css"
];

// Hosts that must NEVER be intercepted — always pass straight to the network.
// Weather and Firebase/Firestore must not be cached or stale.
const BYPASS_HOSTS = [
  "open-meteo.com",            // weather + marine forecast APIs
  "gstatic.com",               // Firebase JS CDN (firebasejs bundles)
  "firestore.googleapis.com",  // Firestore REST/gRPC
  "firebase"                   // firebase.googleapis.com, firebaseapp.com, etc.
];

function isBypass(url) {
  return BYPASS_HOSTS.some((h) => url.hostname.includes(h));
}

function isTile(url) {
  return url.hostname.includes("arcgisonline.com");
}

// ── Install: pre-cache app shell, tolerating individual asset failures ─────────
// A single flaky CDN file must not block the entire install.
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL_VER);
    await Promise.all(
      SHELL_ASSETS.map(async (url) => {
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            await cache.put(url, res);
          } else {
            console.warn(`[SW] install: HTTP ${res.status} for ${url}`);
          }
        } catch (err) {
          console.warn(`[SW] install: failed to cache ${url} — ${err.message}`);
        }
      })
    );
    await self.skipWaiting(); // activate immediately; app.js shows an update toast
  })());
});

// ── Activate: delete stale caches, claim all clients ──────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_VER && k !== TILE_VER)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  // Cache API only supports GET; never intercept HEAD/POST/etc.
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // 1. Bypass: live APIs and Firebase — always network, never intercepted
  if (isBypass(url)) return;

  // 2. Tiles: immutable satellite imagery — cache-first, FIFO eviction
  if (isTile(url)) {
    e.respondWith(tileStrategy(e.request));
    return;
  }

  // 3. Shell assets (same-origin + CDN): network-first, cache fallback
  e.respondWith(shellStrategy(e.request));
});

// ── Shell strategy: network-first with 4 s timeout, write-through cache ───────
async function shellStrategy(request) {
  const cache = await caches.open(SHELL_VER);
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res && res.ok) {
      // Write-through: update cache on every successful fetch (not awaited —
      // the response is already on the wire, no need to block the page on the put).
      cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    clearTimeout(timer);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Offline — shell asset unavailable", { status: 503 });
  }
}

// ── Tile strategy: cache-first, FIFO eviction at TILE_MAX ─────────────────────
async function tileStrategy(request) {
  const cache  = await caches.open(TILE_VER);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const keys = await cache.keys();
      if (keys.length >= TILE_MAX) await cache.delete(keys[0]);
      await cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    return new Response("Tile unavailable offline", { status: 503 });
  }
}

// ── Pre-cache message: triggered by the app's "Download maps" button ──────────
self.addEventListener("message", async (e) => {
  if (e.data?.type !== "PRECACHE_TILES") return;

  const { urls } = e.data;
  if (!Array.isArray(urls) || !urls.length) return;

  const cache = await caches.open(TILE_VER);
  let done = 0;

  const CONCURRENCY = 4;
  async function worker(queue) {
    while (queue.length) {
      const url = queue.shift();
      try {
        const cached = await cache.match(url);
        if (!cached) {
          const res = await fetch(url);
          if (res.ok) {
            const keys = await cache.keys();
            if (keys.length >= TILE_MAX) await cache.delete(keys[0]);
            await cache.put(url, res);
          }
        }
      } catch (_) { /* skip failed tiles */ }
      done++;
      const port = e.ports[0];
      if (port) port.postMessage({ type: "PRECACHE_PROGRESS", done, total: urls.length });
    }
  }

  const queue = [...urls];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  const port = e.ports[0];
  if (port) port.postMessage({ type: "PRECACHE_DONE" });
});
