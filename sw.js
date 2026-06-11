// sw.js — Aeolian Atlas service worker
// Bump SHELL_VER to force a new install after changing app shell files.
const SHELL_VER = "atlas-shell-v2";
const TILE_VER  = "atlas-tiles-v1";
const TILE_MAX  = 2000; // max entries in tile cache (FIFO eviction)

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

// Hosts that must never be intercepted (live APIs, Firebase).
const BYPASS_HOSTS = [
  "open-meteo.com",
  "gstatic.com",
  "firestore.googleapis.com",
  "firebase"
];

function isBypass(url) {
  return BYPASS_HOSTS.some((h) => url.hostname.includes(h));
}

function isTile(url) {
  return url.hostname.includes("arcgisonline.com");
}

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_VER).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_VER && k !== TILE_VER)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for tiles; stale-while-revalidate for shell ────────────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (isBypass(url)) return; // let live requests pass through

  if (isTile(url)) {
    e.respondWith(tileStrategy(e.request));
    return;
  }

  // Shell assets: cache-first with network fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(SHELL_VER).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

async function tileStrategy(request) {
  const cache = await caches.open(TILE_VER);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      // FIFO eviction: if at cap, drop oldest key
      const keys = await cache.keys();
      if (keys.length >= TILE_MAX) {
        await cache.delete(keys[0]);
      }
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

  // Fetch with concurrency = 4
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
