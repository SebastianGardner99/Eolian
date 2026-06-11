// ============================================================
// Alonissos — Gardner's Guide
// Application logic (catamaran edition)
// ============================================================
// ---- State ----
const state = {
  depth:        { surface: true, mid: true, lower: true },
  type:         new Set(Object.keys(FEATURE_TYPES)),
  poiTypes:     new Set(Object.keys(POI_TYPES).filter((k) => k !== "island")),
  showAnchorages: false
};

// ---- Map setup ----
const map = L.map("map", {
  center: [38.55, 14.92],
  zoom: 11,
  zoomControl: false,   // manually positioned below
  minZoom: 9,
  maxZoom: 18
});

// Zoom control goes bottom-right so it never overlaps the add-site HUD (top-right)
L.control.zoom({ position: "bottomright" }).addTo(map);

L.control.locate({
  position: "topright",
  flyTo: true,
  keepCurrentZoomLevel: false,
  locateOptions: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, maxZoom: 16 },
  strings: { title: "Show my location" }
}).addTo(map);

// Friendly geolocation error banner for the locate button
map.on("locationerror", (e) => {
  const code = e.code;
  let msg;
  if (code === 1) {
    msg = "Location access denied. On iPhone/iPad: Settings → Privacy & Security → Location Services → Safari Websites → set to \"While Using\". Reload the page after changing it.";
  } else if (code === 2) {
    msg = "Position unavailable — try again outdoors with a clear sky view.";
  } else {
    msg = "Location request timed out. Move to an area with better signal and try again.";
  }
  _showGeoBanner(msg);
});

function _showGeoBanner(msg) {
  const existing = document.getElementById("geo-error-banner");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "geo-error-banner";
  el.className = "geo-error-banner";
  el.textContent = msg;
  document.getElementById("map-wrap").appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 8000);
}

// Esri World Imagery (satellite) base
const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18
  }
).addTo(map);

// Labels overlay — sits above markers so place names stay readable
map.createPane("labels");
map.getPane("labels").style.zIndex = 650;
map.getPane("labels").style.pointerEvents = "none";
const labels = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  {
    subdomains: "abcd",
    maxZoom: 19,
    opacity: 0.92,
    pane: "labels",
    attribution: "Labels &copy; OpenStreetMap contributors &copy; CARTO"
  }
).addTo(map);

// Island label pane — z350, below overlay (400) + marker (600) panes so labels never obscure pins
map.createPane("labelPane");
map.getPane("labelPane").style.zIndex = 350;

// Spearfishing circle pane — z380, above tiles, below markers; hidden at zoom-far via CSS
map.createPane("spearfishPane");
map.getPane("spearfishPane").style.zIndex = 380;

// ---- Layer groups ----
const siteLayer = L.markerClusterGroup({
  maxClusterRadius: 38,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  disableClusteringAtZoom: 14,
  iconCreateFunction: (cluster) => {
    const n = cluster.getChildCount();
    return L.divIcon({
      className: "",
      html: `<div class="cluster-icon">${n}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }
}).addTo(map);
const anchorLayer    = L.layerGroup(); // not added to map by default (checkbox starts unchecked)
const poiLayer       = L.markerClusterGroup({
  maxClusterRadius: 35,
  showCoverageOnHover: false,
  iconCreateFunction: (cluster) => {
    const n = cluster.getChildCount();
    return L.divIcon({
      className: "",
      html: `<div class="poi-cluster-icon">${n}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }
}).addTo(map);

// Keep marker refs by id for list<->map interaction
const markerById    = {};
const poiMarkerById = {};
const _posOverrides = new Map();  // siteId/poiId/communityId → {lat,lng,author,updatedAt}

// ---- Helpers ----
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestAnchorage(site) {
  let best = null;
  for (const a of ANCHORAGES) {
    const d = haversine(site.lat, site.lng, a.lat, a.lng);
    if (!best || d < best.dist) best = { anchorage: a, dist: d };
  }
  return best;
}

function reachability(site) {
  const near = nearestAnchorage(site);
  if (!near) return { level: "none", near: null };
  if (near.dist <= PROXIMITY.swim)   return { level: "swim",   near };
  if (near.dist <= PROXIMITY.tender) return { level: "tender", near };
  return { level: "none", near };
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const ACCESS_LABEL = { shore: "Shore entry", boat: "Anchor & swim" };

// Precompute band + reachability for every site
SITES.forEach((s) => {
  s._band  = bandFor(s.depth);
  s._reach = reachability(s);
});

// ---- Marker rendering ----
function depthIcon(site, dragging = false, adjusted = false) {
  const color = DEPTH_BANDS[site._band].color;
  const glyph = FEATURE_TYPES[site.type].glyph;
  const size  = 22;
  return L.divIcon({
    className: "",
    html: `<div class="depth-marker${dragging ? " drag-active" : ""}${adjusted ? " pos-adjusted" : ""}" style="--mk:${color}">
             <span class="mk-glyph">${glyph}</span>
           </div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function chip(text, cls) {
  return `<span class="chip ${cls}">${text}</span>`;
}

function reachChip(reach) {
  if (reach.level === "swim")   return chip("Short swim",   "reach");
  if (reach.level === "tender") return chip("Tender ride",  "reach");
  return "";
}

function popupHtml(site) {
  const band = DEPTH_BANDS[site._band];
  const ft   = FEATURE_TYPES[site.type];
  return `<div class="pop">
    <h3>${site.name}</h3>
    <div class="pop-sub">${site.island} · ${site.depthText.split(/[;—]/)[0].trim()}</div>
    <div class="pop-chips">
      ${chip(band.label, "depth-" + site._band)}
      ${chip(ft.glyph + " " + ft.label, "type")}
      ${chip(ACCESS_LABEL[site.access], "access-" + site.access)}
      ${reachChip(site._reach)}
    </div>
    <button class="pop-btn" onclick="openDrawer('${site.id}')">Full details &amp; sources →</button>
  </div>`;
}

function buildSiteMarkers() {
  siteLayer.clearLayers();
  for (const id in markerById) delete markerById[id];

  SITES.forEach((site) => {
    const ovr = _posOverrides.get(site.id);
    const m = L.marker([ovr?.lat ?? site.lat, ovr?.lng ?? site.lng], {
      icon:  depthIcon(site, false, !!ovr),
      title: site.name
    });
    m.bindPopup(popupHtml(site), { maxWidth: 280 });
    m.siteId = site.id;
    markerById[site.id] = m;
    siteLayer.addLayer(m);
  });
}

// ---- Anchorages ----
function buildAnchorages() {
  anchorLayer.clearLayers();
  ANCHORAGES.forEach((a) => {
    const icon = L.divIcon({
      className: "",
      html: `<div class="anchor-icon">⚓</div>`,
      iconSize:   [18, 18],
      iconAnchor: [9, 9]
    });
    const m = L.marker([a.lat, a.lng], { icon, title: a.name });
    m.bindPopup(
      `<div class="pop"><h3>${a.name}</h3><div class="pop-sub">${a.island} · anchorage</div>
       <div class="pop-chips">${chip(a.type, "type")}${chip(a.use, "reach")}</div></div>`,
      { maxWidth: 240 }
    );
    anchorLayer.addLayer(m);
  });
}

// ---- Travel-tip POIs ----
function poiIcon(poi, adjusted = false) {
  const pt = POI_TYPES[poi.type];
  return L.divIcon({
    className: "",
    html: `<div class="poi-marker${adjusted ? " pos-adjusted" : ""}" style="--pt:${pt.color}">${pt.glyph}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
}

function poiPopupHtml(poi) {
  const pt = POI_TYPES[poi.type];
  return `<div class="pop">
    <h3>${poi.name}</h3>
    <div class="pop-sub">${poi.island} · ${pt.label}</div>
    <p class="pop-poi-notes">${poi.notes}</p>
    <div class="pop-poi-src">${poi.source}</div>
  </div>`;
}

function buildPois() {
  poiLayer.clearLayers();
  for (const id in poiMarkerById) delete poiMarkerById[id];
  POIS.forEach((poi) => {
    if (poi.type === "island") return; // island overviews handled by buildIslandLabels
    const ovr = _posOverrides.get(poi.id);
    const m = L.marker([ovr?.lat ?? poi.lat, ovr?.lng ?? poi.lng], {
      icon: poiIcon(poi, !!ovr),
      title: poi.name
    });
    m.bindPopup(poiPopupHtml(poi), { maxWidth: 300 });
    poiMarkerById[poi.id] = m;
    poiLayer.addLayer(m);
  });
}

function buildIslandLabels() {
  POIS.filter((p) => p.type === "island").forEach((poi) => {
    const icon = L.divIcon({
      className: "",
      html: `<div class="island-label-wrap"><span class="island-label-inner">${poi.name.toUpperCase()}</span></div>`,
      iconSize: [130, 24],
      iconAnchor: [65, 12]
    });
    const m = L.marker([poi.lat, poi.lng], { icon, pane: "labelPane", interactive: false });
    m.addTo(map);
    const el = m.getElement();
    el?.querySelector(".island-label-inner")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (map.getZoom() >= 10 && map.getZoom() < 12) openIslandDrawer(poi.id);
    });
  });
}

function openIslandDrawer(id) {
  const poi = POIS.find((p) => p.id === id && p.type === "island");
  if (!poi) return;
  document.getElementById("drawer-body").innerHTML = `
    <h2 class="d-title">${poi.name}</h2>
    <div class="d-island">ISLAND OVERVIEW</div>
    <p class="d-desc" style="margin-top:14px">${poi.notes || ""}</p>
  `;
  document.getElementById("drawer").classList.add("open");
  const scrim = document.getElementById("drawer-scrim");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("show"));
}
window.openIslandDrawer = openIslandDrawer;


// ---- Filtering ----
function siteVisible(site) {
  if (!state.depth[site._band])   return false;
  if (!state.type.has(site.type)) return false;
  return true;
}

function applyFilters() {
  const visible = [];
  SITES.forEach((site) => {
    const m = markerById[site.id];
    if (siteVisible(site)) {
      if (!siteLayer.hasLayer(m)) siteLayer.addLayer(m);
      visible.push(site);
    } else {
      if (siteLayer.hasLayer(m)) siteLayer.removeLayer(m);
    }
  });

  const visiblePois = [];
  POIS.forEach((poi) => {
    const m = poiMarkerById[poi.id];
    if (!m) return;
    if (state.poiTypes.has(poi.type)) {
      if (!poiLayer.hasLayer(m)) poiLayer.addLayer(m);
      visiblePois.push(poi);
    } else {
      if (poiLayer.hasLayer(m)) poiLayer.removeLayer(m);
    }
  });
  if (!map.hasLayer(poiLayer)) poiLayer.addTo(map);
}

// ---- Search ----
function _searchItems(q) {
  q = q.toLowerCase().trim();
  if (!q) return [];

  const results = [];

  function score(item) {
    const n = (item.name || "").toLowerCase();
    const i = (item.island || "").toLowerCase();
    const t = (item._typeLabel || "").toLowerCase();
    if (n.startsWith(q))        return 1;
    if (n.includes(q))          return 2;
    if (i.includes(q))          return 3;
    if (t.includes(q))          return 4;
    return 0;
  }

  SITES.forEach((site) => {
    const ft = FEATURE_TYPES[site.type];
    const item = { ...site, _typeLabel: ft ? ft.label : site.type, _kind: "site" };
    const s = score(item);
    if (s) results.push({ item, s });
  });

  POIS.forEach((poi) => {
    if (poi.type === "island") return;
    const pt = POI_TYPES[poi.type];
    const item = { ...poi, _typeLabel: pt ? pt.label : poi.type, _kind: "poi" };
    const s = score(item);
    if (s) results.push({ item, s });
  });

  _communityDocs.forEach((cdoc) => {
    const ft = FEATURE_TYPES[cdoc.type];
    const pt = POI_TYPES[cdoc.type];
    const item = { ...cdoc, _typeLabel: ft ? ft.label : (pt ? pt.label : (cdoc.otherType || cdoc.type)), _kind: "community" };
    const s = score(item);
    if (s) results.push({ item, s });
  });

  results.sort((a, b) => a.s - b.s || (a.item.name || "").localeCompare(b.item.name || ""));
  return results.slice(0, 10).map((r) => r.item);
}

let _flashTimer = null;
function _flashOffToggleMarker(m, lat, lng) {
  if (_flashTimer) { clearTimeout(_flashTimer); _flashTimer = null; }
  if (!map.hasLayer(m)) m.addTo(map);
  map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  m.openPopup();
  _flashTimer = setTimeout(() => { if (map.hasLayer(m)) map.removeLayer(m); _flashTimer = null; }, 2500);
}

function _renderSearchResults(items) {
  const ul  = document.getElementById("search-results");
  const inp = document.getElementById("search-input");
  ul.innerHTML = "";
  if (!items.length) {
    if (inp.value.trim()) {
      const li = document.createElement("li");
      li.className = "search-result-empty";
      li.textContent = "No results";
      ul.appendChild(li);
    }
    ul.hidden = !inp.value.trim();
    return;
  }
  ul.hidden = false;

  items.forEach((item) => {
    const li  = document.createElement("li");
    li.className = "search-result-li";
    const ft  = FEATURE_TYPES[item.type];
    const pt  = POI_TYPES[item.type];
    const glyph = ft ? ft.glyph : (pt ? pt.glyph : "◎");
    const color = ft ? DEPTH_BANDS[item._band]?.color : (pt ? pt.color : "#64748b");
    li.innerHTML = `<span class="sr-glyph" style="color:${color || "#64748b"}">${glyph}</span>
      <span class="sr-name">${item.name}</span>
      <span class="sr-meta">${item.island || ""}</span>`;

    li.addEventListener("click", () => {
      if (item._kind === "site") {
        const m = markerById[item.id];
        if (m && siteLayer.hasLayer(m)) {
          siteLayer.zoomToShowLayer(m, () => m.openPopup());
        } else if (m) {
          _flashOffToggleMarker(m, item.lat, item.lng);
        } else {
          map.flyTo([item.lat, item.lng], 14, { duration: 0.8 });
        }
      } else if (item._kind === "poi") {
        const m = poiMarkerById[item.id];
        if (m && poiLayer.hasLayer(m)) {
          poiLayer.zoomToShowLayer(m, () => m.openPopup());
        } else if (m) {
          _flashOffToggleMarker(m, item.lat, item.lng);
        } else {
          map.flyTo([item.lat, item.lng], 15, { duration: 0.8 });
        }
      } else {
        const m = _communityMarkers?.get(item.id);
        map.flyTo([item.lat, item.lng], 15, { duration: 0.8 });
        if (m) m.openPopup();
      }
    });
    ul.appendChild(li);
  });
}

function initSearch() {
  const inp   = document.getElementById("search-input");
  const clear = document.getElementById("search-clear");
  const ul    = document.getElementById("search-results");

  inp.addEventListener("input", () => {
    const q = inp.value.trim();
    clear.hidden = !q;
    if (!q) { ul.hidden = true; return; }
    _renderSearchResults(_searchItems(q));
  });

  clear.addEventListener("click", () => {
    inp.value = "";
    clear.hidden = true;
    ul.hidden = true;
    inp.focus();
  });
}

// ================================================================
// ---- Drag-to-Reposition ----------------------------------------
// ================================================================

// Shared helper: update the in-memory dataset + marker after a coord change
function commitNewCoords(site, lat, lng) {
  site.lat    = lat;
  site.lng    = lng;
  site._reach = reachability(site);
  site.approx = false;

  const m = markerById[site.id];
  if (m) {
    m.setLatLng([lat, lng]);
    m.setPopupContent(popupHtml(site));
  }
  saveCoordOverride(site.id, lat, lng);
  applyFilters();
}

// Active drag state — kept outside closures so cancel can reach it
let _dragState = null;

function startDragMode(site) {
  // Close any open popup first
  map.closePopup();

  const m = markerById[site.id];
  if (!m) return;

  // Make sure the marker is visible and remove from cluster temporarily
  siteLayer.removeLayer(m);
  m.addTo(map);

  // Fly to the marker so it's centred
  map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });

  // Swap to a drag-active icon (pulsing ring via CSS)
  m.setIcon(depthIcon(site, true));

  // Enable Leaflet drag on the marker
  m.dragging.enable();

  // Show the drag banner overlay
  const banner = document.getElementById("drag-banner");
  const bannerName = document.getElementById("drag-banner-name");
  bannerName.textContent = site.name;
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add("visible"));

  // Set cursor on the map container
  document.getElementById("map").classList.add("drag-mode");

  // Store state so cancel / confirm can clean up
  _dragState = { site, marker: m };

  // Live coord readout while dragging
  m.on("drag", onMarkerDrag);
  m.on("dragend", onMarkerDragEnd);
}

function onMarkerDrag(e) {
  const { lat, lng } = e.target.getLatLng();
  document.getElementById("drag-coords").textContent =
    `${lat.toFixed(5)}°N  ${lng.toFixed(5)}°E`;
}

function onMarkerDragEnd(e) {
  if (!_dragState) return;
  const { lat, lng } = e.target.getLatLng();
  document.getElementById("drag-coords").textContent =
    `${lat.toFixed(5)}°N  ${lng.toFixed(5)}°E`;
  // Enable the confirm button
  document.getElementById("drag-confirm-btn").disabled = false;
}

function confirmDrag() {
  if (!_dragState) return;
  const { site, marker } = _dragState;
  const { lat, lng } = marker.getLatLng();

  commitNewCoords(site, lat, lng);
  exitDragMode();

  function _shareOverride() {
    if (!window.AtlasSync?.setOverride) {
      // Firebase not ready — position saved locally for this session only
      _toast("Offline — position change won't be shared until reload with connection");
      showDragToast(site, lat, lng);
      return;
    }
    const author = localStorage.getItem("atlas_author") || "Anonymous";
    window.AtlasSync.setOverride(site.id, { lat, lng, author })
      .then(() => {
        if (!navigator.onLine) {
          _toast("Saved — will sync when back online");
        } else {
          _toast("Position update shared");
        }
      })
      .catch((err) => _toast("Override failed: " + err.message));
  }

  if (window.AtlasSync && !localStorage.getItem("atlas_author")) {
    _showAuthorModal(_shareOverride);
  } else {
    _shareOverride();
  }
}

function cancelDrag() {
  if (!_dragState) return;
  const { site, marker } = _dragState;

  // Snap the marker back to its original data coords
  marker.setLatLng([site.lat, site.lng]);
  exitDragMode();
}

function exitDragMode() {
  if (!_dragState) return;
  const { site, marker } = _dragState;

  marker.dragging.disable();
  marker.off("drag",    onMarkerDrag);
  marker.off("dragend", onMarkerDragEnd);

  // Restore normal icon
  marker.setIcon(depthIcon(site, false));

  // Move marker back into the cluster group
  map.removeLayer(marker);
  siteLayer.addLayer(marker);

  // Hide banner
  const banner = document.getElementById("drag-banner");
  banner.classList.remove("visible");
  setTimeout(() => { banner.hidden = true; }, 300);

  // Remove drag cursor
  document.getElementById("map").classList.remove("drag-mode");

  // Reset confirm button
  document.getElementById("drag-confirm-btn").disabled = true;
  document.getElementById("drag-coords").textContent = "Drag the pin to its true location";

  _dragState = null;
}

// Toast notification after a successful drag-commit
function showDragToast(site, lat, lng) {
  // Remove any existing toast
  const old = document.getElementById("drag-toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.id = "drag-toast";
  toast.className = "drag-toast";
  toast.innerHTML = `
    <div class="drag-toast-title">📍 ${site.name}</div>
    <div class="drag-toast-sub">Position saved — persists on this device. Copy to update data.js:</div>
    <code class="drag-toast-coords" title="Click to select">${lat.toFixed(6)}, ${lng.toFixed(6)}</code>
    <button class="drag-toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById("map-wrap").appendChild(toast);

  // Auto-dismiss after 12 s
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }
  }, 12000);
}

// ================================================================
// ---- Detail drawer ---------------------------------------------
// ================================================================

function openDrawer(id) {
  const site = SITES.find((s) => s.id === id);
  if (!site) return;
  const band = DEPTH_BANDS[site._band];
  const ft   = FEATURE_TYPES[site.type];
  const r    = site._reach;

  let proxHtml;
  if (r.level === "swim") {
    proxHtml = `<div class="d-prox swim">Within a <b>short surface swim</b> of <b>${r.near.anchorage.name}</b>
      (${r.near.anchorage.island}) — about <b>${fmtDist(r.near.dist)}</b> away.</div>`;
  } else if (r.level === "tender") {
    proxHtml = `<div class="d-prox tender">Within a <b>short tender / dinghy ride</b> of <b>${r.near.anchorage.name}</b>
      (${r.near.anchorage.island}) — about <b>${fmtDist(r.near.dist)}</b> away.</div>`;
  } else {
    proxHtml = `<div class="d-prox none">Nearest anchorage is <b>${r.near ? r.near.anchorage.name : "—"}</b>,
      about <b>${r.near ? fmtDist(r.near.dist) : "—"}</b> away — beyond an easy swim or tender ride.</div>`;
  }

  const accessText = site.access === "shore"
    ? "Shore entry possible — you can wade or walk in, or anchor and swim."
    : "Anchor & swim only — no land access; reach it from a moored boat, tender or kayak.";

  const body = `
    <h2 class="d-title">${site.name}</h2>
    <div class="d-island">${site.island.toUpperCase()}</div>
    <div class="d-chips">
      ${chip(band.label, "depth-" + site._band)}
      ${chip(ft.glyph + " " + ft.label, "type")}
      ${chip(ACCESS_LABEL[site.access], "access-" + site.access)}
      ${reachChip(r)}
    </div>
    <p class="d-desc">${site.desc}</p>

    <div class="d-section-h">Proximity to boat anchorages</div>
    ${proxHtml}

    <div class="d-section-h">Sea state now</div>
    <div id="d-sea-row"></div>

    ${(() => {
      const sp = _spearMap?.get(site.id);
      if (!sp) return "";
      const st = _SPEAR_STATUS[sp.status];
      return `<div class="d-section-h">Spearfishing</div>
    <div class="d-spear-row">
      <span class="d-spear-pill spear-${sp.status}">${st.label}</span>
      <p class="d-spear-reason">${sp.reason}</p>
    </div>`;
    })()}

    <div class="d-section-h">Details</div>
    <table class="d-table">
      <tr><th>Feature type</th><td>${ft.glyph} ${ft.label}</td></tr>
      <tr><th>Depth</th><td>${site.depthText}</td></tr>
      <tr><th>What you'll see</th><td>${site.see}</td></tr>
      <tr><th>Access</th><td>${accessText}<div class="d-anchor">Suggested anchorage / approach: <b>${site.anchorage}</b></div></td></tr>
      <tr><th>Notes</th><td>${site.notes}</td></tr>
      <tr><th>Coordinates</th><td>${site.lat.toFixed(4)}°N, ${site.lng.toFixed(4)}°E
        ${site.approx
          ? '<div class="approx-flag">⚠ Approximate — derived from the cove/cape (±0.2–1 km)</div>'
          : '<div class="approx-flag" style="color:var(--swim)">✓ Precise</div>'}</td></tr>
      ${_posOverrides.has(site.id) ? (() => {
          const ovr = _posOverrides.get(site.id);
          return `<tr id="d-override-row"><th>Position</th><td>
            Adjusted by <strong>${ovr.author}</strong> · ${_relTime(ovr.updatedAt)}
            <button class="pop-btn" id="d-reset-pos-btn">Reset to original</button>
          </td></tr>`;
        })() : ""}
    </table>

    <div class="d-section-h">Sources</div>
    <ul class="d-sources">
      ${site.sources.map((s) => `<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]} ↗</a></li>`).join("")}
    </ul>

    ${site.approx ? `
    <div class="d-section-h">Adjust position</div>
    <div class="d-gps">
      <div class="gps-btn-row">
        <button class="gps-btn" id="gps-update-btn">📍 Set to My GPS</button>
        <button class="gps-btn drag-btn" id="drag-reposition-btn">✥ Drag to Reposition</button>
      </div>
      <div class="gps-output" id="gps-output" hidden></div>
    </div>` : ""}
  `;
  document.getElementById("drawer-body").innerHTML = body;
  const resetPosBtn = document.getElementById("d-reset-pos-btn");
  if (resetPosBtn) {
    resetPosBtn.addEventListener("click", () => {
      window.AtlasSync?.clearOverride(site.id)
        .then(() => _toast("Position reset"))
        .catch((err) => _toast("Reset failed: " + err.message));
    });
  }
  _renderSiteSeaStateRow(site);
  if (_wxFetchTime && Date.now() - _wxFetchTime > 60 * 60 * 1000) {
    fetchWeather().then((d) => {
      renderWeather(d);
      if (document.getElementById("drawer").classList.contains("open")) _renderSiteSeaStateRow(site);
    }).catch(() => {});
  }

  if (site.approx) {
    // GPS button
    document.getElementById("gps-update-btn").addEventListener("click", function () {
      const btn    = this;
      const output = document.getElementById("gps-output");
      btn.textContent = "Locating…";
      btn.disabled    = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          commitNewCoords(site, lat, lng);
          output.hidden    = false;
          output.className = "gps-output";
          output.innerHTML = `<div class="gps-coords">Saved — persists on this device. Copy to update data.js:</div>
            <code class="gps-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</code>`;
          btn.textContent = "📍 Update Again";
          btn.disabled    = false;
        },
        (err) => {
          const msg = err.code === 1
            ? "Location access denied. On iPhone/iPad: Settings → Privacy & Security → Location Services → Safari Websites → set to \"While Using\". Reload the page after changing it."
            : err.code === 2 ? "Position unavailable — try again outdoors with a clear sky view."
                             : "Location request timed out. Move outside and try again.";
          output.hidden    = false;
          output.className = "gps-output gps-error-state";
          output.textContent = msg;
          btn.textContent = "📍 Set to My GPS";
          btn.disabled    = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    // Drag-to-reposition button: close drawer, enter drag mode
    document.getElementById("drag-reposition-btn").addEventListener("click", () => {
      closeDrawer();
      // Short delay so the drawer finishes sliding out before we start drag mode
      setTimeout(() => startDragMode(site), 420);
    });
  }

  document.getElementById("drawer").classList.add("open");
  const scrim = document.getElementById("drawer-scrim");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("show"));
}
window.openDrawer = openDrawer;

function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
  const scrim = document.getElementById("drawer-scrim");
  scrim.classList.remove("show");
  setTimeout(() => (scrim.hidden = true), 350);
}

// ---- Build the depth legend filter UI ----
function buildDepthFilters() {
  const wrap = document.getElementById("depth-filters");
  wrap.innerHTML = "";
  Object.entries(DEPTH_BANDS).forEach(([key, b]) => {
    const div = document.createElement("div");
    div.className = "leg-item";
    div.dataset.band = key;
    div.innerHTML = `<span class="leg-swatch" style="background:${b.color}"></span>
      <span class="leg-label">${labelForBand(key)}</span>
      <span class="leg-band">${b.label}</span>`;
    div.addEventListener("click", () => {
      state.depth[key] = !state.depth[key];
      div.classList.toggle("off", !state.depth[key]);
      applyFilters();
    });
    wrap.appendChild(div);
  });
}
function labelForBand(key) {
  return { surface: "Surface / wade", mid: "Easy free-dive", lower: "Deeper free-dive" }[key];
}

// ---- Build unified layer-toggle chips (site types + POI types) ----
function buildLayerToggles() {
  const wrap = document.getElementById("layer-toggles");
  wrap.innerHTML = "";
  const siteCounts = {};
  SITES.forEach((s) => { siteCounts[s.type] = (siteCounts[s.type] || 0) + 1; });
  const poiCounts = {};
  POIS.forEach((p) => { poiCounts[p.type] = (poiCounts[p.type] || 0) + 1; });

  // Site-type chips (snorkel, beach) — snorkel chip also syncs shipwrecks
  Object.entries(FEATURE_TYPES).forEach(([key, ft]) => {
    if (!siteCounts[key]) return;
    const div = document.createElement("div");
    div.className = "type-chip";
    div.dataset.type = key;
    div.innerHTML = `<span class="tc-glyph">${ft.glyph}</span>
      <span class="tc-label">${ft.label}</span>
      <span class="tc-count">${siteCounts[key]}</span>`;
    div.addEventListener("click", () => {
      const turningOn = !state.type.has(key);
      if (turningOn) { state.type.add(key); div.classList.remove("off"); }
      else            { state.type.delete(key); div.classList.add("off"); }
      // Snorkel and shipwrecks travel together
      if (key === "snorkel") {
        const wreckChip = document.querySelector('[data-poitype="shipwreck"]');
        if (turningOn) { state.poiTypes.add("shipwreck");    if (wreckChip) wreckChip.classList.remove("off"); }
        else           { state.poiTypes.delete("shipwreck"); if (wreckChip) wreckChip.classList.add("off"); }
      }
      applyFilters();
    });
    wrap.appendChild(div);
  });

  // POI-type chips — restaurant_michelin merged into restaurant; island excluded entirely
  Object.entries(POI_TYPES).forEach(([key, pt]) => {
    if (key === "restaurant_michelin") return;
    if (key === "island") return; // no chip rendered; ov-* markers not shown
    const count = (poiCounts[key] || 0) + (key === "restaurant" ? (poiCounts["restaurant_michelin"] || 0) : 0);
    if (!count) return;
    const div = document.createElement("div");
    div.className = "type-chip";
    div.dataset.poitype = key;
    div.innerHTML = `<span class="tc-glyph" style="color:${pt.color}">${pt.glyph}</span>
      <span class="tc-label">${pt.label}</span>
      <span class="tc-count">${count}</span>`;
    div.addEventListener("click", () => {
      const isOn = state.poiTypes.has(key);
      if (isOn) {
        state.poiTypes.delete(key);
        if (key === "restaurant") state.poiTypes.delete("restaurant_michelin");
        div.classList.add("off");
      } else {
        state.poiTypes.add(key);
        if (key === "restaurant") state.poiTypes.add("restaurant_michelin");
        div.classList.remove("off");
      }
      applyFilters();
    });
    wrap.appendChild(div);
  });

  // Collapse: show only Snorkel site, Beach, Restaurant by default
  const DEFAULT_CHIPS = new Set(["snorkel", "beach", "restaurant"]);
  const allChips  = Array.from(wrap.querySelectorAll(".type-chip"));
  const extraChips = allChips.filter(
    (c) => !DEFAULT_CHIPS.has(c.dataset.type) && !DEFAULT_CHIPS.has(c.dataset.poitype)
  );
  if (extraChips.length > 0) {
    extraChips.forEach((c) => c.classList.add("chips-hidden"));
    const moreChip = document.createElement("div");
    moreChip.className = "type-chip chip-more";
    moreChip.innerHTML = `<span class="tc-label">… see more</span>`;

    const selRow = document.createElement("div");
    selRow.className = "sel-all-row chips-hidden";
    selRow.innerHTML = `<button class="sel-btn">Select all</button><button class="sel-btn sel-btn-desel">Deselect all</button>`;
    selRow.querySelector(".sel-btn").addEventListener("click", () => {
      allChips.forEach((c) => c.classList.remove("off"));
      state.types    = new Set(Object.keys(FEATURE_TYPES));
      state.poiTypes = new Set(Object.keys(POI_TYPES));
      applyFilters();
    });
    selRow.querySelector(".sel-btn-desel").addEventListener("click", () => {
      allChips.forEach((c) => c.classList.add("off"));
      state.types    = new Set();
      state.poiTypes = new Set();
      applyFilters();
    });

    moreChip.addEventListener("click", () => {
      const expanding = moreChip.classList.toggle("chip-expanded");
      extraChips.forEach((c) => c.classList.toggle("chips-hidden", !expanding));
      selRow.classList.toggle("chips-hidden", !expanding);
      moreChip.querySelector(".tc-label").textContent = expanding ? "see less" : "… see more";
    });
    wrap.appendChild(moreChip);
    wrap.appendChild(selRow);
  }
}

// ---- Coordinate overrides (localStorage) ----
function loadCoordOverrides() {
  try {
    const overrides = JSON.parse(localStorage.getItem("aeolian_coord_overrides") || "{}");
    SITES.forEach((site) => {
      if (overrides[site.id]) {
        const { lat, lng } = overrides[site.id];
        site.lat    = lat;
        site.lng    = lng;
        site._reach = reachability(site);
        site.approx = false;
      }
    });
  } catch (_) {}
}

function saveCoordOverride(siteId, lat, lng) {
  try {
    const overrides = JSON.parse(localStorage.getItem("aeolian_coord_overrides") || "{}");
    overrides[siteId] = { lat, lng };
    localStorage.setItem("aeolian_coord_overrides", JSON.stringify(overrides));
  } catch (_) {}
}

// ---- Wire up segmented controls ----
function wireSegments(containerId, key) {
  const c = document.getElementById(containerId);
  c.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    c.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state[key] = btn.dataset[key];
    applyFilters();
  });
}

// ================================================================
// ---- Wind & Sea conditions ------------------------------------
// ================================================================
const WX_LAT = 38.48;  // wind-only fetch (Lipari land point — fine for direction)
const WX_LNG = 14.95;
// Two open-water marine fetch points — the on-land Lipari point returns null for
// wave data and the ?? 0 masking was showing false "flat calm" readings.
// Basin assignment: west = [Alicudi, Filicudi]; east = [Stromboli, Panarea, Panarea islets];
// central islands (Lipari, Vulcano, Salina) use whichever basin is rougher (conservative).
const MARINE_POINTS = {
  west: { lat: 38.57, lng: 14.45, label: "west basin" },
  east: { lat: 38.75, lng: 15.20, label: "east basin" }
};
const windArrowLayer = L.layerGroup();
let _wxData      = null;
let _wxFetchTime = null;

function beaufortLabel(knots) {
  if (knots < 1)  return { label: "Calm",          color: "#5ee0c6", score: 0 };
  if (knots < 4)  return { label: "Light air",      color: "#5ee0c6", score: 1 };
  if (knots < 7)  return { label: "Light breeze",   color: "#5ee0c6", score: 2 };
  if (knots < 11) return { label: "Gentle breeze",  color: "#43c6e8", score: 3 };
  if (knots < 16) return { label: "Mod. breeze",    color: "#43c6e8", score: 4 };
  if (knots < 22) return { label: "Fresh breeze",   color: "#ffd76a", score: 5 };
  if (knots < 28) return { label: "Strong breeze",  color: "#ffd76a", score: 6 };
  if (knots < 34) return { label: "Near gale",      color: "#e07832", score: 7 };
  return               { label: "Gale+",            color: "#e05050", score: 8 };
}

function snorkelVerdict(windKnots, waveM) {
  if (waveM == null) return { text: "⚠ Sea state unavailable", cls: "wx-warn" };
  if (windKnots <= 10 && waveM <= 0.3) return { text: "✓ Excellent conditions",   cls: "wx-good" };
  if (windKnots <= 15 && waveM <= 0.6) return { text: "◐ Decent — check spots",   cls: "wx-ok"   };
  if (windKnots <= 20 && waveM <= 1.0) return { text: "⚠ Marginal — shore spots", cls: "wx-warn" };
  return                                      { text: "✕ Poor — wait it out",      cls: "wx-bad"  };
}

function degToCompass(deg) {
  if (deg == null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Angular helpers used by the per-site exposure engine and siteSeaState().
function _bearingBin(deg) {
  if (deg == null) return 0;
  return Math.round(((deg % 360) + 360) % 360 / 5) % 72;
}
function _angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

async function fetchWeather() {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  const marF  = "wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction";
  try {
    const [wxRes, marWRes, marERes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${WX_LAT}&longitude=${WX_LNG}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=Europe%2FRome&forecast_days=3`, { signal: ctrl.signal }),
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${MARINE_POINTS.west.lat}&longitude=${MARINE_POINTS.west.lng}&current=${marF}&timezone=Europe%2FRome`, { signal: ctrl.signal }),
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${MARINE_POINTS.east.lat}&longitude=${MARINE_POINTS.east.lng}&current=${marF}&timezone=Europe%2FRome`, { signal: ctrl.signal })
    ]);
    if (!wxRes.ok)   throw new Error(`Weather API ${wxRes.status}`);
    if (!marWRes.ok) throw new Error(`Marine W API ${marWRes.status}`);
    if (!marERes.ok) throw new Error(`Marine E API ${marERes.status}`);
    const [wx, marW, marE] = await Promise.all([wxRes.json(), marWRes.json(), marERes.json()]);
    return { wx: wx.current, marWest: marW.current, marEast: marE.current, forecast: wx.hourly };
  } finally {
    clearTimeout(timer);
  }
}

function windArrowSvg(deg, color, size = 14) {
  if (deg == null) return "";
  const rot = (deg + 180) % 360;
  return `<svg width="${size}" height="${size}" viewBox="0 0 14 14" style="transform:rotate(${rot}deg);flex-shrink:0" fill="${color}"><path d="M7 1 L4 10 L7 7.5 L10 10 Z"/></svg>`;
}

// Returns whichever basin object reports higher wave_height, with a _basinLabel field added.
function _worseBasin(marWest, marEast) {
  const wW = marWest ? marWest.wave_height : null;
  const wE = marEast ? marEast.wave_height : null;
  if (wW == null && wE == null) return { ...(marWest || marEast || {}), _basinLabel: "" };
  if (wW == null) return { ...marEast,  _basinLabel: MARINE_POINTS.east.label };
  if (wE == null) return { ...marWest,  _basinLabel: MARINE_POINTS.west.label };
  return wW >= wE
    ? { ...marWest, _basinLabel: MARINE_POINTS.west.label }
    : { ...marEast, _basinLabel: MARINE_POINTS.east.label };
}

function renderWeather(data) {
  const wx  = data.wx;
  const mar = _worseBasin(data.marWest, data.marEast);

  const windKnots  = wx.wind_speed_10m     ?? 0;
  const windDir    = wx.wind_direction_10m ?? null;
  const gustKnots  = wx.wind_gusts_10m     ?? windKnots;
  const waveM      = mar.wave_height          ?? null;
  const waveDir    = mar.wave_direction       ?? null;
  const wavePeriod = mar.wave_period          ?? null;
  const swellM     = mar.swell_wave_height    ?? null;
  const swellDir   = mar.swell_wave_direction ?? null;

  const bf      = beaufortLabel(windKnots);
  const verdict = snorkelVerdict(windKnots, waveM);
  const now     = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const waveFmt  = waveM      != null ? waveM.toFixed(1) + " m"       : "—";
  const swellFmt = swellM     != null ? swellM.toFixed(1) + " m"      : "—";
  const perFmt   = wavePeriod != null ? wavePeriod.toFixed(0) + " s"  : "—";
  const basinSub = mar._basinLabel ? ` · ${mar._basinLabel}` : "";

  document.getElementById("wx-body").innerHTML = `
    <div class="wx-verdict ${verdict.cls}">${verdict.text}</div>
    <div class="wx-grid">
      <div class="wx-cell">
        <div class="wx-cell-label">Wind</div>
        <div class="wx-cell-val">${windArrowSvg(windDir, bf.color)}<span style="color:${bf.color}">${windKnots.toFixed(1)} kn</span></div>
        <div class="wx-cell-sub">${degToCompass(windDir)} · gusts ${gustKnots.toFixed(1)} kn</div>
      </div>
      <div class="wx-cell">
        <div class="wx-cell-label">Waves</div>
        <div class="wx-cell-val">${windArrowSvg(waveDir, "#6fa8ff")}<span style="color:#6fa8ff">${waveFmt}</span></div>
        <div class="wx-cell-sub">${degToCompass(waveDir)} · ${perFmt}${basinSub}</div>
      </div>
      <div class="wx-cell">
        <div class="wx-cell-label">Swell</div>
        <div class="wx-cell-val">${windArrowSvg(swellDir, "#7c8cf0")}<span style="color:#7c8cf0">${swellFmt}</span></div>
        <div class="wx-cell-sub">${degToCompass(swellDir)}</div>
      </div>
    </div>
    <div class="wx-updated">Updated ${now}</div>
  `;

  document.getElementById("wx-overlay-label").style.display = "";
  _wxData      = data;
  _wxFetchTime = Date.now();
  if (document.getElementById("tog-wind-overlay").checked) startWindAnimation();
  initForecast(data.forecast);
}

function buildWindArrows(d) {
  windArrowLayer.clearLayers();
  const mar = _worseBasin(d.marWest, d.marEast);
  const windRot = ((d.wx.wind_direction_10m ?? 0) + 180) % 360;
  const waveRot = ((mar.wave_direction      ?? 0) + 180) % 360;

  const points = [
    ...ANCHORAGES.map((a) => [a.lat, a.lng]),
    [38.50, 14.70], [38.70, 14.90], [38.65, 15.20], [38.37, 14.97]
  ];

  points.forEach(([lat, lng]) => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:none">
        <svg width="20" height="20" viewBox="0 0 20 20" style="transform:rotate(${windRot}deg)" fill="#ffd76a"><path d="M10 1 L5 15 L10 11 L15 15 Z"/></svg>
        <svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${waveRot}deg)" fill="#6fa8ff"><path d="M8 1 L4 12 L8 9 L12 12 Z"/></svg>
      </div>`,
      iconSize: [20, 40],
      iconAnchor: [10, 20]
    });
    L.marker([lat, lng], { icon, interactive: false }).addTo(windArrowLayer);
  });
}

async function loadWeather() {
  const body = document.getElementById("wx-body");
  body.innerHTML = '<div class="wx-loading" id="wx-loading">Fetching conditions…</div>';
  try {
    const data = await fetchWeather();
    renderWeather(data);
  } catch (err) {
    body.innerHTML = `<div class="wx-error">Could not load conditions — check your connection.<br><small>${err.message}</small></div>`;
  }
}

// ================================================================
// ---- PART B — Computed exposure profiles (geometry layer) -----
// ================================================================
//
// computeExposureProfile(lat, lng) → Float32Array(72)
//   One entry per 5° bearing bin; 1.0 = fully exposed, 0.0 = fully blocked.
//
// Decay table (blocking distance d to shelter factor):
//   d ≤ 1 000 m → 0.15  (immediate lee)
//   d ≤ 4 000 m → 0.40  (strong shadow)
//   d ≤ 8 000 m → 0.65  (partial — swell diffracts around)
//   d ≤ 15 000 m→ 0.85  (weak — wind chop regenerates)
//   no hit      → 1.00  (open fetch)
//
// NOTE: the 1/4/8/15 km breakpoints are defensible rules of thumb from
// fetch-limited wave growth (15–20 kn wind needs ~10+ km fetch to rebuild
// ~0.5 m chop) and from the diffraction behaviour of 6–10 s Mediterranean
// swell — not a textbook table. They are TUNABLE; the __exposureDebug hook
// exists to calibrate them on the water. LAND_MASSES radii are estimates
// (Lipari and Salina are elongated); a future upgrade swaps circles for
// 8-point polygons while the ray-cast interface stays identical.

const _exposureCache = new Map();

function computeExposureProfile(lat, lng) {
  const cosLat = Math.cos(lat * Math.PI / 180);
  const mLat   = 111320;
  const mLng   = 111320 * cosLat;
  const raw    = new Float32Array(72);

  for (let i = 0; i < 72; i++) {
    const theta = i * 5 * Math.PI / 180;
    const dx = Math.sin(theta);  // east component
    const dy = Math.cos(theta);  // north component
    let minFactor = 1.0;

    for (const lm of LAND_MASSES) {
      // Circle centre in local metres (east=x, north=y), site at origin.
      const cx = (lm.lng - lng) * mLng;
      const cy = (lm.lat - lat) * mLat;
      // v = site – circle_centre = (-cx, -cy)
      const vx = -cx, vy = -cy;
      const len2 = cx * cx + cy * cy;
      const c    = len2 - lm.r * lm.r;
      const dot  = vx * dx + vy * dy;  // v · D
      const disc = dot * dot - c;

      if (disc < 0) continue;  // ray misses circle

      // Site inside circle (c < 0) and ray going away from centre: the ray
      // exits on the seaward side — skip so shore sites read exposed outward.
      if (c < 0 && dot > 0) continue;

      const sqD = Math.sqrt(disc);
      const t1  = -dot - sqD;
      const t2  = -dot + sqD;

      // Smallest intersection ahead of the site, beyond the 50 m shoreline buffer.
      let t = -1;
      if      (t1 > 50)    t = t1;
      else if (t2 > 50)    t = t2;
      if (t < 0 || t > 15000) continue;

      let factor;
      if      (t <= 1000)  factor = 0.15;
      else if (t <= 4000)  factor = 0.40;
      else if (t <= 8000)  factor = 0.65;
      else                 factor = 0.85;

      // Small obstacle (r < 300 m) can't reduce below 0.70 — waves wrap around.
      if (lm.r < 300) factor = Math.max(factor, 0.70);

      if (factor < minFactor) minFactor = factor;
    }
    raw[i] = minFactor;
  }

  // Diffraction smear: shelter leaks sideways because waves bend into shadows.
  // smoothed[i] = max over j in [i-4..i+4] of raw[j] × (j===i ? 1 : 0.85)
  const smoothed = new Float32Array(72);
  for (let i = 0; i < 72; i++) {
    let best = raw[i];
    for (let j = -4; j <= 4; j++) {
      if (j === 0) continue;
      const ni = ((i + j) % 72 + 72) % 72;
      const candidate = raw[ni] * 0.85;
      if (candidate > best) best = candidate;
    }
    smoothed[i] = best;
  }
  return smoothed;
}

// Compute profiles for every water SITE and every POI type that matters.
const _POI_PROFILE_TYPES = new Set(["cliff_jump", "shipwreck", "beach"]);
function _buildExposureCache() {
  SITES.forEach((s) => _exposureCache.set(s.id, computeExposureProfile(s.lat, s.lng)));
  POIS.forEach((p) => {
    if (_POI_PROFILE_TYPES.has(p.type)) _exposureCache.set(p.id, computeExposureProfile(p.lat, p.lng));
  });
}

// ================================================================
// ---- PART C — Site-level verdict logic ------------------------
// ================================================================

// Which basin to use for a given site's island.
function _basinForSite(site) {
  if (!_wxData) return null;
  const isl = site.island;
  if (isl === "Alicudi" || isl === "Filicudi")
    return _wxData.marWest;
  if (isl === "Stromboli" || isl === "Panarea" || isl === "Panarea islets")
    return _wxData.marEast;
  // Lipari, Vulcano, Salina — use the rougher basin (conservative).
  const wW = _wxData.marWest ? _wxData.marWest.wave_height : null;
  const wE = _wxData.marEast ? _wxData.marEast.wave_height : null;
  if (wW == null && wE == null) return _wxData.marWest || _wxData.marEast;
  if (wW == null) return _wxData.marEast;
  if (wE == null) return _wxData.marWest;
  return wW >= wE ? _wxData.marWest : _wxData.marEast;
}

function siteSeaState(site, basin) {
  if (!basin || basin.wave_height == null) {
    return { level: "unknown", label: "Sea state unavailable — check conditions visually",
             factorW: null, factorS: null, effective: null, driveDir: null };
  }
  const profile = _exposureCache.get(site.id);
  if (!profile) {
    return { level: "unknown", label: "Exposure data unavailable",
             factorW: null, factorS: null, effective: null, driveDir: null };
  }

  const binW    = _bearingBin(basin.wave_direction);
  const binS    = _bearingBin(basin.swell_wave_direction);
  const factorW = profile[binW];
  let   factorS = profile[binS];
  if ((basin.wave_period ?? 0) > 8) factorS = Math.min(1.0, factorS + 0.15);

  const effectiveW = basin.wave_height * factorW;
  const effectiveS = (basin.swell_wave_height ?? 0) * factorS;
  const effective  = Math.max(effectiveW, effectiveS);
  const domFactor  = effectiveW >= effectiveS ? factorW : factorS;
  const driveDir   = effectiveW >= effectiveS
                   ? (basin.wave_direction       ?? null)
                   : (basin.swell_wave_direction ?? null);

  const level      = effective <= 0.3 ? "calm" : effective <= 0.7 ? "moderate" : "rough";
  const exposure   = domFactor >= 0.85 ? "fully exposed"
                   : domFactor >= 0.40 ? "partially sheltered" : "well sheltered";
  const expect     = domFactor >= 0.85 ? "expect full sea state"
                   : domFactor >= 0.40 ? "some chop likely" : "likely calm";

  const wStr  = basin.wave_height.toFixed(1) + " m";
  const eStr  = effective.toFixed(1);
  const label = `Regional waves ${wStr} from ${degToCompass(basin.wave_direction)} · ${site.name} is ${exposure} from that direction — ${expect} (~${eStr} m)`;
  return { level, label, factorW, factorS, effective, domFactor, driveDir };
}

// ================================================================
// ---- PART D (helpers) — Exposure rose + drawer row ------------
// ================================================================

// _exposureRoseSvg — 16-segment donut ring.
// profile: Float32Array(72), driveDir: bearing in degrees (wave source), level: string
// Segment colour: < 0.4 teal (sheltered), 0.4–0.85 mid-blue (partial), ≥ 0.85 amber (exposed).
// Centre chevron tip touches inner ring at driveDir, coloured to match verdict dot.
// level='unknown' → no chevron, whole ring at 40% opacity.
function _exposureRoseSvg(profile, driveDir, level) {
  const cx = 44, cy = 44, rO = 40, rI = 26;
  // Gap of 1.5 px between segments at mid-radius
  const halfGapDeg = (180 / Math.PI) * Math.asin(0.75 / ((rO + rI) / 2));

  function ptB(r, bearingDeg) {
    const a = bearingDeg * Math.PI / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  // Quantise 72 bins → 16 segments: max factor within each 22.5° sector
  const segs = new Float32Array(16).fill(0);
  for (let s = 0; s < 16; s++) {
    const sc = s * 22.5;
    for (let k = 0; k < 72; k++) {
      let diff = ((k * 5 - sc) % 360 + 360) % 360;
      if (diff > 180) diff = 360 - diff;
      if (diff < 11.25 && profile[k] > segs[s]) segs[s] = profile[k];
    }
  }

  function segFill(f) {
    if (f < 0.40) return '#5ee0c6';  // sheltered
    if (f < 0.85) return '#3a4a63';  // partial
    return '#f0b34e';                 // exposed
  }

  let arcs = '';
  for (let s = 0; s < 16; s++) {
    const sc = s * 22.5;
    const sB = sc - 11.25 + halfGapDeg;
    const eB = sc + 11.25 - halfGapDeg;
    const [ox1, oy1] = ptB(rO, sB);
    const [ox2, oy2] = ptB(rO, eB);
    const [ix1, iy1] = ptB(rI, sB);
    const [ix2, iy2] = ptB(rI, eB);
    arcs += `<path d="M${ox1.toFixed(2)},${oy1.toFixed(2)} A${rO},${rO} 0 0,1 ${ox2.toFixed(2)},${oy2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${rI},${rI} 0 0,0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z" fill="${segFill(segs[s])}"/>`;
  }

  // N E S W labels outside ring
  const labelR = rO + 7;
  const labels = [['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([lbl, b]) => {
    const [x, y] = ptB(labelR, b);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="rgba(36,66,87,.45)">${lbl}</text>`;
  }).join('');

  // Chevron: tip kisses inner ring at wave source bearing; wings near centre
  const dotColors = { calm: '#5ee0c6', moderate: '#ffd76a', rough: '#e07046' };
  const arrowColor = dotColors[level] ?? null;
  let chevron = '';
  if (driveDir != null && arrowColor) {
    const [tx, ty] = ptB(rI - 1, driveDir);
    const [lx, ly] = ptB(9, driveDir + 30);
    const [rx, ry] = ptB(9, driveDir - 30);
    chevron = `<polygon points="${tx.toFixed(1)},${ty.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}" fill="${arrowColor}" opacity=".92"/>`;
  }

  const dim = level === 'unknown' ? ' opacity=".4"' : '';
  return `<svg width="88" height="88" viewBox="0 0 88 88" overflow="visible" style="flex-shrink:0"${dim}>${arcs}${labels}${chevron}</svg>`;
}

function _renderSiteSeaStateRow(site) {
  const rowEl = document.getElementById("d-sea-row");
  if (!rowEl) return;
  const basin = _basinForSite(site);
  if (!basin) {
    rowEl.innerHTML = `<div class="d-sea-state"><span class="sea-dot sea-dot-unknown"></span><span>Sea data loading…</span></div>`;
    return;
  }
  const ss      = siteSeaState(site, basin);
  const profile = _exposureCache.get(site.id);
  const roseSvg = profile ? _exposureRoseSvg(profile, ss.driveDir ?? null, ss.level) : "";
  rowEl.innerHTML = `
    <div class="d-sea-state">
      <span class="sea-dot sea-dot-${ss.level}"></span>
      <span>${ss.label}</span>
    </div>
    <div class="d-rose-row">${roseSvg}
      <span class="d-rose-caption">Model sea state + local exposure estimate — not a measurement.</span>
    </div>`;
}

// ================================================================
// ---- Wind particle animation engine ---------------------------
// ================================================================

let _wxCanvas = null;
let _wxCtx = null;
let _windAnimId = null;
let _windAnimActive = false;
const _windParticles = [];
const _PARTICLE_COUNT = 140;
const _TRAIL_LEN      = 14;

function _setupWindCanvas() {
  if (_wxCanvas) return;
  const mapEl = document.getElementById("map");
  _wxCanvas = document.createElement("canvas");
  _wxCanvas.id = "wind-canvas";
  mapEl.appendChild(_wxCanvas);
  _wxCtx = _wxCanvas.getContext("2d");
  _resizeWindCanvas();
}

function _resizeWindCanvas() {
  if (!_wxCanvas) return;
  const rect = document.getElementById("map").getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w > 0 && h > 0) { _wxCanvas.width = w; _wxCanvas.height = h; }
}

function _particleColor(kn) {
  if (kn < 11) return [94, 224, 198];
  if (kn < 22) return [255, 215, 106];
  if (kn < 34) return [224, 120, 50];
  return [224, 80, 80];
}

function _spawnRandom() {
  return {
    x: Math.random() * _wxCanvas.width,
    y: Math.random() * _wxCanvas.height,
    age: 0,
    maxAge: 60 + Math.random() * 90,
    sp: 0.7 + Math.random() * 0.5,
    trail: []
  };
}

function _initParticles(windDeg) {
  _windParticles.length = 0;
  const w = _wxCanvas ? _wxCanvas.width  : 800;
  const h = _wxCanvas ? _wxCanvas.height : 600;
  for (let i = 0; i < _PARTICLE_COUNT; i++) {
    _windParticles.push({
      x: Math.random() * w, y: Math.random() * h,
      age: Math.floor(Math.random() * 70),
      maxAge: 50 + Math.random() * 80,
      sp: 0.7 + Math.random() * 0.5,
      trail: []
    });
  }
}

function _currentForecastWind() {
  if (_forecastData && _forecastIndex != null) {
    return { deg: _forecastData.dirs[_forecastIndex] ?? 0, kn: _forecastData.speeds[_forecastIndex] ?? 0 };
  }
  if (_wxData) return { deg: _wxData.wx.wind_direction_10m ?? 0, kn: _wxData.wx.wind_speed_10m ?? 0 };
  return { deg: 0, kn: 4 };
}

function _animateWind() {
  if (!_windAnimActive || !_wxCanvas) return;
  const { deg, kn } = _currentForecastWind();
  const toward = ((deg + 180) % 360) * Math.PI / 180;
  const baseSpeed = Math.max(0.3, Math.min(kn * 0.35, 5.5));
  const [r, g, b] = _particleColor(kn);
  const sinT = Math.sin(toward), cosT = Math.cos(toward);

  _wxCtx.clearRect(0, 0, _wxCanvas.width, _wxCanvas.height);

  _windParticles.forEach((p, i) => {
    const speed = baseSpeed * p.sp;
    const px = p.x, py = p.y;
    p.trail.push([px, py]);
    if (p.trail.length > _TRAIL_LEN) p.trail.shift();
    p.x += sinT * speed;
    p.y -= cosT * speed;
    p.age++;

    const oob = p.x < -30 || p.x > _wxCanvas.width + 30 || p.y < -30 || p.y > _wxCanvas.height + 30;
    if (p.age > p.maxAge || oob) { _windParticles[i] = _spawnRandom(); return; }

    const alpha = Math.min(p.age / 12, 1) * (1 - p.age / p.maxAge) * 0.92;
    if (alpha < 0.01) return;

    _wxCtx.lineWidth = 2.5;
    const tlen = p.trail.length;
    for (let t = 0; t < tlen; t++) {
      const seg = p.trail[t];
      const nx = t + 1 < tlen ? p.trail[t + 1][0] : p.x;
      const ny = t + 1 < tlen ? p.trail[t + 1][1] : p.y;
      const a  = alpha * ((t + 1) / (tlen + 1));
      _wxCtx.strokeStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      _wxCtx.beginPath();
      _wxCtx.moveTo(seg[0], seg[1]);
      _wxCtx.lineTo(nx, ny);
      _wxCtx.stroke();
    }
  });

  _windAnimId = requestAnimationFrame(_animateWind);
}

function startWindAnimation() {
  _setupWindCanvas();
  _resizeWindCanvas();
  const { deg } = _currentForecastWind();
  _initParticles(deg);
  _windAnimActive = true;
  _animateWind();
}

function stopWindAnimation() {
  _windAnimActive = false;
  if (_windAnimId) { cancelAnimationFrame(_windAnimId); _windAnimId = null; }
  if (_wxCtx && _wxCanvas) _wxCtx.clearRect(0, 0, _wxCanvas.width, _wxCanvas.height);
}

// ================================================================
// ---- Forecast timeline ----------------------------------------
// ================================================================

let _forecastData  = null;
let _forecastIndex = 0;
let _playTimer     = null;

function initForecast(hourly) {
  if (!hourly || !hourly.time) return;
  _forecastData = {
    times:  hourly.time,
    speeds: hourly.wind_speed_10m,
    dirs:   hourly.wind_direction_10m
  };

  const now = Date.now();
  let closest = 0, minDiff = Infinity;
  _forecastData.times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  });
  _forecastIndex = closest;

  _buildTimeline();
  syncForecastUI();
  if (document.getElementById("tog-wind-overlay").checked) {
    document.getElementById("wx-timeline").hidden = false;
  }
}

function _buildTimeline() {
  const { times } = _forecastData;
  const n = times.length;
  const slider = document.getElementById("wxt-slider");
  slider.max   = n - 1;
  slider.value = _forecastIndex;

  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const daysDiv = document.getElementById("wxt-days");
  daysDiv.innerHTML = "";
  let lastDay = null;
  times.forEach((t, i) => {
    const dt  = new Date(t);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    if (key !== lastDay) {
      lastDay = key;
      const pct  = (i / (n - 1)) * 100;
      const span = document.createElement("span");
      span.className = "wxt-day-label";
      span.style.left = pct + "%";
      span.textContent = `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
      daysDiv.appendChild(span);
    }
  });

  const ticksDiv = document.getElementById("wxt-ticks");
  ticksDiv.innerHTML = "";
  times.forEach((t, i) => {
    const h = new Date(t).getHours();
    if (h % 3 !== 0) return;
    const pct  = (i / (n - 1)) * 100;
    const tick = document.createElement("span");
    tick.className = "wxt-tick" + (h % 6 === 0 ? " wxt-tick-major" : "");
    tick.style.left = pct + "%";
    if (h % 6 === 0) tick.dataset.label = h === 0 ? "0h" : `${h}h`;
    ticksDiv.appendChild(tick);
  });
}

function syncForecastUI() {
  if (!_forecastData) return;
  const t   = _forecastData.times[_forecastIndex];
  const kn  = _forecastData.speeds[_forecastIndex];
  const deg = _forecastData.dirs[_forecastIndex];
  const dt  = new Date(t);

  const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dayStr  = dt.toLocaleDateString("en-GB",  { weekday: "short", day: "numeric", month: "short" });

  const slider = document.getElementById("wxt-slider");
  slider.value = _forecastIndex;
  const pct = (_forecastIndex / Math.max(1, parseInt(slider.max))) * 100;
  slider.style.background = `linear-gradient(to right,#5ee0c6 ${pct.toFixed(1)}%,#244257 ${pct.toFixed(1)}%)`;

  document.getElementById("wxt-time-label").textContent = `${dayStr} · ${timeStr}`;
  document.getElementById("wxt-wind-label").textContent = kn != null
    ? `${kn.toFixed(1)} kn ${degToCompass(deg)}`
    : "";

}

function toggleForecastPlay() {
  const btn = document.getElementById("wxt-play");
  if (_playTimer) {
    clearInterval(_playTimer);
    _playTimer = null;
    btn.textContent = "▶";
  } else {
    btn.textContent = "⏸";
    _playTimer = setInterval(() => {
      if (!_forecastData) return;
      _forecastIndex = (_forecastIndex + 1) % _forecastData.times.length;
      syncForecastUI();
    }, 700);
  }
}

// ================================================================
// ---- Add-a-site (user-created pins) ----------------------------
// ================================================================

const _USER_SITES_KEY    = "aeolian_user_sites";
const _userSiteMarkers   = new Map();   // id → Leaflet marker
let   _userSites         = [];
let   _addSitePlacing    = false;
let   _addSitePlaceClean = null;        // cleanup fn for placement mode
let   _onUserSitesChanged = null;       // hook called after each save

function loadUserSites() {
  try { _userSites = JSON.parse(localStorage.getItem(_USER_SITES_KEY) || "[]"); }
  catch (_) { _userSites = []; }
  _userSites.forEach(_buildUserSiteMarker);
  if (_onUserSitesChanged) _onUserSitesChanged();
}

function _saveUserSites() {
  localStorage.setItem(_USER_SITES_KEY, JSON.stringify(_userSites));
  if (_onUserSitesChanged) _onUserSitesChanged();
}

function _userSiteIconInfo(site) {
  if (FEATURE_TYPES[site.type]) {
    return { glyph: FEATURE_TYPES[site.type].glyph, color: DEPTH_BANDS[bandFor(site.depth || 5)].color };
  }
  const pt = POI_TYPES[site.type];
  if (pt) return { glyph: pt.glyph, color: pt.color };
  return { glyph: "★", color: "#9b9b9b" }; // fallback for custom "other" types
}

function _buildUserSiteMarker(site) {
  const { glyph, color } = _userSiteIconInfo(site);
  const m = L.marker([site.lat, site.lng], {
    icon: L.divIcon({
      className: "",
      html: `<div class="depth-marker user-site-marker" style="--mk:${color}">
               <span class="mk-glyph">${glyph}</span>
             </div>`,
      iconSize: [26, 26], iconAnchor: [13, 13]
    })
  });

  m.bindPopup(() => {
    const displayType = site.otherType || (POI_TYPES[site.type] ? POI_TYPES[site.type].label : (FEATURE_TYPES[site.type] ? FEATURE_TYPES[site.type].label : site.type));
    const div = document.createElement("div");
    div.className = "pop";
    div.innerHTML = `
      <h3>${site.name}</h3>
      <div class="pop-sub">${site.island || "Aeolian Islands"} · <em>${displayType} — your site</em></div>
      ${site.notes ? `<p class="pop-poi-notes">${site.notes}</p>` : ""}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="pop-btn" data-action="copy" title="Copy formatted JS for pasting into data.js">📋 Copy code</button>
        <button class="pop-btn" data-action="remove" style="color:#e07070">Remove</button>
      </div>
      <p style="font-size:.66rem;color:var(--ink-mute);margin-top:6px;line-height:1.4">
        "Copy code" copies this entry as JS you can paste into data.js to make it permanent.
      </p>`;
    div.querySelector("[data-action=copy]").addEventListener("click", () => {
      const code = _formatSiteAsCode(site);
      navigator.clipboard.writeText(code).then(() => {
        div.querySelector("[data-action=copy]").textContent = "✓ Copied!";
        setTimeout(() => { div.querySelector("[data-action=copy]").textContent = "📋 Copy code"; }, 2000);
      }).catch(() => { prompt("Copy this code:", code); });
    });
    div.querySelector("[data-action=remove]").addEventListener("click", () => {
      if (confirm(`Remove "${site.name}"?`)) {
        _removeUserSite(site.id);
        m.closePopup();
      }
    });
    return div;
  });

  m.addTo(map);
  _userSiteMarkers.set(site.id, m);
}

// Format a user-added site as a JS object ready to paste into data.js
function _formatSiteAsCode(site) {
  const isWaterType = !!FEATURE_TYPES[site.type];
  const typeVal  = site.type === "other" ? (site.otherType || "attraction") : site.type;
  const indent   = "  ";
  if (isWaterType) {
    return `${indent}{ id: "${site.id}", name: ${JSON.stringify(site.name)}, island: ${JSON.stringify(site.island || "Aeolian Islands")},\n` +
      `${indent}  lat: ${site.lat.toFixed(6)}, lng: ${site.lng.toFixed(6)}, approx: true,\n` +
      `${indent}  type: ${JSON.stringify(site.type)}, depth: ${site.depth || 5}, depthText: "— user-added",\n` +
      `${indent}  access: ${JSON.stringify(site.access || "shore")}, anchorage: "",\n` +
      `${indent}  see: "", notes: ${JSON.stringify(site.notes || "")},\n` +
      `${indent}  desc: ${JSON.stringify(site.notes || site.name)},\n` +
      `${indent}  sources: [] },`;
  } else {
    return `${indent}{ id: "${site.id}", name: ${JSON.stringify(site.name)}, island: ${JSON.stringify(site.island || "Aeolian Islands")},\n` +
      `${indent}  lat: ${site.lat.toFixed(6)}, lng: ${site.lng.toFixed(6)}, type: ${JSON.stringify(typeVal)},\n` +
      `${indent}  notes: ${JSON.stringify(site.notes || "")}, source: "User-added" },`;
  }
}

// Download all user-added sites as a JS snippet
function exportUserSites() {
  if (!_userSites.length) return;
  const water = _userSites.filter((s) => FEATURE_TYPES[s.type]);
  const pois  = _userSites.filter((s) => !FEATURE_TYPES[s.type]);
  let out = "// ---- User-added sites — paste into data.js ----\n\n";
  if (water.length) {
    out += "// Add these to the SITES array:\n";
    out += water.map(_formatSiteAsCode).join("\n") + "\n\n";
  }
  if (pois.length) {
    out += "// Add these to the POIS array:\n";
    out += pois.map(_formatSiteAsCode).join("\n") + "\n";
  }
  const blob = new Blob([out], { type: "text/javascript" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = "user-sites.js";
  a.click();
  URL.revokeObjectURL(a.href);
}

function _removeUserSite(id) {
  const m = _userSiteMarkers.get(id);
  if (m) { map.removeLayer(m); _userSiteMarkers.delete(id); }
  _userSites = _userSites.filter((s) => s.id !== id);
  _saveUserSites();
}

function _showAddSiteHUD() {
  document.getElementById("add-site-hud").hidden = false;
  setTimeout(() => document.getElementById("ash-name").focus(), 50);
}

function _hideAddSiteHUD() {
  document.getElementById("add-site-hud").hidden = true;
  const sbBtn = document.getElementById("add-site-sb-btn");
  if (sbBtn) sbBtn.classList.remove("active");
}

function cancelAddSitePlacement() {
  if (!_addSitePlacing) return;
  _addSitePlacing = false;
  if (_addSitePlaceClean) { _addSitePlaceClean(); _addSitePlaceClean = null; }
  document.getElementById("map").classList.remove("add-site-mode");
  const banner = document.getElementById("add-site-place-banner");
  if (banner) banner.remove();
}

function _enterPlacementMode(siteData) {
  _hideAddSiteHUD();
  _addSitePlacing = true;

  const banner = document.createElement("div");
  banner.id = "add-site-place-banner";
  banner.className = "add-site-place-banner";
  banner.innerHTML = `Click on the map to place the pin &nbsp;
    <button id="ash-place-cancel" style="background:none;border:none;color:inherit;font-size:1rem;cursor:pointer;padding:0 0 0 8px;line-height:1">&#215;</button>`;
  document.getElementById("map-wrap").appendChild(banner);
  banner.querySelector("#ash-place-cancel").addEventListener("click", cancelAddSitePlacement);

  document.getElementById("map").classList.add("add-site-mode");

  function onMapClick(e) {
    if (!_addSitePlacing) return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Reject pins clearly outside the archipelago
    if (lat < 38.2 || lat > 38.95 || lng < 14.2 || lng > 15.4) {
      _toast("Pin is outside the Aeolian archipelago — tap closer to the islands");
      return; // stay in placement mode so user can correct
    }

    _addSitePlacing = false;
    _addSitePlaceClean = null;
    document.getElementById("map").classList.remove("add-site-mode");
    banner.remove();

    const author = localStorage.getItem("atlas_author") || "Anonymous";
    window.AtlasSync.addSite({ ...siteData, author, lat, lng })
      .then(({ pending }) => {
        if (pending) _toast("Saved — will sync when back online");
      })
      .catch((err) => _toast("Error saving site: " + err.message));
  }

  map.once("click", onMapClick);
  _addSitePlaceClean = () => map.off("click", onMapClick);
}

const _WATER_TYPES = new Set(["snorkel", "beach", "cliff_jump"]);

function initAddSite() {
  const sbBtn = document.getElementById("add-site-sb-btn");
  sbBtn.addEventListener("click", () => {
    const hud = document.getElementById("add-site-hud");
    if (hud.hidden) { _showAddSiteHUD(); sbBtn.classList.add("active"); }
    else { _hideAddSiteHUD(); cancelAddSitePlacement(); }
  });

  document.getElementById("add-site-hud").addEventListener("click", (e) => e.stopPropagation());

  document.getElementById("ash-cancel").addEventListener("click", () => {
    _hideAddSiteHUD();
    cancelAddSitePlacement();
  });

  // Show/hide "Other" text field and depth field based on chosen type
  document.getElementById("ash-type").addEventListener("change", () => {
    const t = document.getElementById("ash-type").value;
    document.getElementById("ash-other-field").hidden = (t !== "other");
    document.getElementById("ash-depth-field").hidden = !_WATER_TYPES.has(t);
  });

  document.getElementById("ash-place-btn").addEventListener("click", () => {
    const nameEl = document.getElementById("ash-name");
    const name   = nameEl.value.trim();
    if (!name) {
      nameEl.focus();
      nameEl.style.borderColor = "rgba(239,68,68,.6)";
      nameEl.addEventListener("input", () => { nameEl.style.borderColor = ""; }, { once: true });
      return;
    }

    const typeVal  = document.getElementById("ash-type").value;
    const otherVal = document.getElementById("ash-other").value.trim();
    if (typeVal === "other" && !otherVal) {
      const otherEl = document.getElementById("ash-other");
      otherEl.focus();
      otherEl.style.borderColor = "rgba(239,68,68,.6)";
      otherEl.addEventListener("input", () => { otherEl.style.borderColor = ""; }, { once: true });
      return;
    }

    const siteData = {
      name,
      island:    document.getElementById("ash-island").value || "Aeolian Islands",
      type:      typeVal,
      otherType: typeVal === "other" ? otherVal : undefined,
      depth:     _WATER_TYPES.has(typeVal) ? parseFloat(document.getElementById("ash-depth").value) : 5,
      access:    document.getElementById("ash-access").value,
      notes:     document.getElementById("ash-notes").value.trim()
    };

    // Reset form
    document.getElementById("ash-name").value  = "";
    document.getElementById("ash-notes").value = "";
    document.getElementById("ash-other").value = "";
    document.getElementById("ash-island").selectedIndex = 0;
    document.getElementById("ash-type").selectedIndex   = 0;
    document.getElementById("ash-other-field").hidden   = true;
    document.getElementById("ash-depth-field").hidden   = false;

    // Require Firebase before proceeding
    if (!_firebaseReady) {
      _toast("Shared sites unavailable — check connection or configuration");
      return;
    }

    // Get or prompt for author identity, then enter placement mode
    const author = localStorage.getItem("atlas_author");
    if (!author) {
      _showAuthorModal(() => _enterPlacementMode(siteData));
    } else {
      _enterPlacementMode(siteData);
    }
  });

  document.getElementById("ash-change-author").addEventListener("click", () => {
    _showAuthorModal(null);
  });

  _updateAddSiteHudFirebaseState();
}

// ================================================================
// ---- Community sites (Firestore) --------------------------------
// ================================================================

let _communityLayer     = null;              // L.layerGroup, created in _initFirebaseSync
const _communityMarkers = new Map();         // docId → Leaflet marker
let   _communityDocs    = [];
const _seenCommunityIds = new Set();         // tracks known doc IDs for new-pin toasts
let   _firebaseReady    = false;
let   _openCommunityDocId = null;            // id of the community doc currently in the drawer

// ---- Toast ----
function _toast(msg, duration) {
  const ms = duration ?? 3500;
  const el = document.createElement("div");
  el.className  = "atlas-toast";
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("atlas-toast--show"));
  setTimeout(() => {
    el.classList.remove("atlas-toast--show");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, ms);
}

// ---- Relative time ----
function _relTime(ts) {
  if (!ts) return "—";
  const ms   = ts.toMillis ? ts.toMillis() : (typeof ts === "number" ? ts : Date.now());
  const secs = Math.round((Date.now() - ms) / 1000);
  if (secs < 90)     return "just now";
  if (secs < 3600)   return Math.floor(secs / 60)   + " min ago";
  if (secs < 86400)  return Math.floor(secs / 3600)  + " hr ago";
  return Math.floor(secs / 86400) + " d ago";
}

// ---- Add-site HUD Firebase state ----
function _updateAddSiteHudFirebaseState() {
  const authorRow  = document.getElementById("ash-author-row");
  const fbNote     = document.getElementById("ash-firebase-note");
  const placeBtn   = document.getElementById("ash-place-btn");
  if (!_firebaseReady) {
    if (authorRow) authorRow.hidden = true;
    if (fbNote)    fbNote.hidden    = false;
    if (placeBtn) { placeBtn.disabled = true; placeBtn.title = "Shared sites unavailable — check connection or config"; }
  } else {
    if (fbNote) fbNote.hidden = true;
    if (placeBtn) { placeBtn.disabled = false; placeBtn.title = ""; }
    const name = localStorage.getItem("atlas_author");
    if (authorRow) authorRow.hidden = !name;
    const nameEl = document.getElementById("ash-author-name");
    if (nameEl && name) nameEl.textContent = name;
  }
}

// ---- Author modal ----
function _showAuthorModal(onSave) {
  const modal     = document.getElementById("author-modal");
  const scrim     = document.getElementById("author-scrim");
  const input     = document.getElementById("author-name-input");
  const saveBtn   = document.getElementById("author-save-btn");
  const cancelBtn = document.getElementById("author-cancel-btn");
  if (!modal) return;

  const existing = localStorage.getItem("atlas_author");
  if (existing) input.value = existing;

  modal.hidden = false;
  scrim.hidden = false;
  setTimeout(() => input.focus(), 60);

  function cleanup() {
    modal.hidden = true;
    scrim.hidden = true;
    saveBtn.removeEventListener("click",   onSaveClick);
    cancelBtn.removeEventListener("click", onCancelClick);
  }

  function onSaveClick() {
    const name = input.value.trim();
    if (!name) {
      input.style.borderColor = "rgba(239,68,68,.6)";
      input.addEventListener("input", () => { input.style.borderColor = ""; }, { once: true });
      return;
    }
    localStorage.setItem("atlas_author", name);
    cleanup();
    _updateAddSiteHudFirebaseState();
    if (onSave) onSave();
  }

  function onCancelClick() { cleanup(); }

  saveBtn.addEventListener("click",   onSaveClick);
  cancelBtn.addEventListener("click", onCancelClick);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") onSaveClick(); }, { once: true });
}

// ---- Community marker ----
function _buildCommunityMarker(doc) {
  const { glyph, color } = _userSiteIconInfo(doc);
  const ovr = _posOverrides.get(doc.id);
  const m = L.marker([ovr?.lat ?? doc.lat, ovr?.lng ?? doc.lng], {
    icon: L.divIcon({
      className: "",
      html: `<div class="depth-marker community-site-marker${ovr ? " pos-adjusted" : ""}" style="--mk:${color}">
               <span class="mk-glyph">${glyph}</span>
             </div>`,
      iconSize: [22, 22], iconAnchor: [11, 11]
    })
  });

  m.bindPopup(() => {
    const div = document.createElement("div");
    div.className = "pop";
    const displayType = doc.otherType
      || (POI_TYPES[doc.type]    ? POI_TYPES[doc.type].label    : null)
      || (FEATURE_TYPES[doc.type] ? FEATURE_TYPES[doc.type].label : null)
      || doc.type || "site";
    const timeStr = _relTime(doc.createdAt);
    div.innerHTML = `
      <h3>${doc.name}</h3>
      <div class="pop-sub">${doc.island || "Aeolian Islands"} · <em>${displayType} — community</em></div>
      ${doc.notes ? `<p class="pop-poi-notes">${doc.notes}</p>` : ""}
      <div class="pop-community-meta">Added by <strong>${doc.author}</strong> · ${timeStr}</div>
      <button class="pop-btn" data-open-community>Full details →</button>`;
    div.querySelector("[data-open-community]").addEventListener("click", () => {
      m.closePopup();
      openCommunityDrawer(doc.id);
    });
    return div;
  });

  if (_communityLayer) m.addTo(_communityLayer);
  _communityMarkers.set(doc.id, m);
}

// ---- Community detail drawer ----
function openCommunityDrawer(id) {
  const cdoc = _communityDocs.find((d) => d.id === id);
  if (!cdoc) return;
  _openCommunityDocId = id;

  const ft          = FEATURE_TYPES[cdoc.type] || POI_TYPES[cdoc.type];
  const displayType = cdoc.otherType || (ft ? ft.label : cdoc.type || "Site");
  const timeStr     = _relTime(cdoc.createdAt);
  const dateStr     = cdoc.createdAt?.toDate
    ? cdoc.createdAt.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const isOwner = !!(cdoc.ownerUid && window.AtlasSync?.uid && cdoc.ownerUid === window.AtlasSync.uid);

  const body = `
    <div class="d-hero">
      <div class="d-chips">
        ${ft ? `<span class="d-chip access-shore">${ft.glyph} ${displayType}</span>` : ""}
        <span class="d-chip access-shore" style="background:rgba(99,179,237,.15);color:#2b6cb0">Community</span>
      </div>
      <h2 class="d-title">${cdoc.name}</h2>
      <div class="d-sub">${cdoc.island || "Aeolian Islands"}</div>
    </div>
    <div class="d-section-h">Added by</div>
    <div class="d-sea-state" style="margin-bottom:12px">
      <span style="font-size:.82rem">
        <strong>${cdoc.author}</strong> · ${timeStr}${dateStr ? " · " + dateStr : ""}
      </span>
    </div>
    <div class="d-section-h">Details</div>
    <table class="d-table">
      <tr><th>Type</th><td>${displayType}</td></tr>
      ${cdoc.depth != null ? `<tr><th>Depth</th><td>~${cdoc.depth} m</td></tr>` : ""}
      ${cdoc.access ? `<tr><th>Access</th><td>${ACCESS_LABEL[cdoc.access] || cdoc.access}</td></tr>` : ""}
      ${cdoc.notes  ? `<tr><th>Notes</th><td>${cdoc.notes}</td></tr>` : ""}
      <tr><th>Coordinates</th><td>${cdoc.lat.toFixed(4)}°N, ${cdoc.lng.toFixed(4)}°E
        <div class="approx-flag">Community-added — verify before visiting</div></td></tr>
      ${_posOverrides.has(cdoc.id) ? (() => {
          const ovr = _posOverrides.get(cdoc.id);
          return `<tr id="d-override-row"><th>Position</th><td>
            Adjusted by <strong>${ovr.author}</strong> · ${_relTime(ovr.updatedAt)}
            <button class="pop-btn" id="d-reset-pos-btn">Reset to original</button>
          </td></tr>`;
        })() : ""}
    </table>
    ${isOwner ? `<div id="d-delete-section" class="d-delete-section">
      <button id="d-delete-btn" class="d-delete-btn" type="button">Delete this site</button>
    </div>` : ""}`;

  document.getElementById("drawer-body").innerHTML = body;
  const resetPosBtnC = document.getElementById("d-reset-pos-btn");
  if (resetPosBtnC) {
    resetPosBtnC.addEventListener("click", () => {
      window.AtlasSync?.clearOverride(cdoc.id)
        .then(() => _toast("Position reset"))
        .catch((err) => _toast("Reset failed: " + err.message));
    });
  }
  if (isOwner) _wireDeleteSection(cdoc);

  const drawer = document.getElementById("drawer");
  drawer.classList.add("open");
  drawer.removeAttribute("aria-hidden");
  document.getElementById("drawer-scrim").hidden = false;
}
window.openCommunityDrawer = openCommunityDrawer;

// ---- Inline delete confirm (no window.confirm) ----
function _wireDeleteSection(cdoc) {
  function bind() {
    const btn = document.getElementById("d-delete-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const sec = document.getElementById("d-delete-section");
      if (!sec) return;
      sec.innerHTML = `
        <p class="d-delete-msg" id="d-delete-msg-text"></p>
        <div class="d-delete-btns">
          <button id="d-del-cancel"  class="ash-cancel-btn"       type="button">Cancel</button>
          <button id="d-del-confirm" class="d-delete-confirm-btn" type="button">Delete</button>
        </div>`;
      document.getElementById("d-delete-msg-text").textContent =
        `Delete "${cdoc.name}"? This removes it for everyone.`;
      document.getElementById("d-del-cancel").addEventListener("click", () => {
        sec.innerHTML = `<button id="d-delete-btn" class="d-delete-btn" type="button">Delete this site</button>`;
        bind();
      });
      document.getElementById("d-del-confirm").addEventListener("click", () => {
        if (!window.AtlasSync) return;
        const confirmBtn = document.getElementById("d-del-confirm");
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Deleting…";
        window.AtlasSync.deleteSite(cdoc.id)
          .then(() => {
            closeDrawer();
            _openCommunityDocId = null;
            _toast(`"${cdoc.name}" deleted`);
          })
          .catch((err) => _toast("Delete failed: " + err.message));
      });
    });
  }
  bind();
}

// ---- Snapshot handler ----
function _onCommunitySnapshot(docs, meta) {
  // Defensive read: skip docs missing essential fields
  const valid = docs.filter((d) =>
    d.name && typeof d.lat === "number" && typeof d.lng === "number"
  );
  _communityDocs = valid;

  // Update count badge
  const badge = document.getElementById("community-count");
  if (badge) badge.textContent = valid.length;

  // Remove markers for deleted docs; close drawer if the deleted doc is open
  _communityMarkers.forEach((m, id) => {
    if (!valid.find((d) => d.id === id)) {
      if (_communityLayer) _communityLayer.removeLayer(m);
      _communityMarkers.delete(id);
      if (_spearCircles.has(id)) {
        if (_spearLayer) _spearLayer.removeLayer(_spearCircles.get(id));
        _spearCircles.delete(id);
      }
      if (_openCommunityDocId === id) {
        closeDrawer();
        _openCommunityDocId = null;
      }
    }
  });

  // Add markers for new docs
  valid.forEach((doc) => {
    if (!_communityMarkers.has(doc.id)) {
      _buildCommunityMarker(doc);
      // Add a spear circle for new community water/beach sites (into layer group, shown when toggle is on)
      if (_spearLayer) {
        const cls = _classifyCommunityDoc(doc);
        if (cls) {
          const ovr = _posOverrides.get(doc.id);
          const circle = _makeSpearCircle(ovr?.lat ?? doc.lat, ovr?.lng ?? doc.lng, cls).addTo(_spearLayer);
          _spearCircles.set(doc.id, circle);
        }
      }
    }
  });

  // Pending-write toast (user just wrote while offline)
  if (meta.hasPendingWrites && !meta.fromCache) {
    _toast("Saved — will sync when back online");
  }

  // New-pin notification: doc arrived since we last loaded, by another author, ≤5 min old
  if (!meta.fromCache) {
    const now         = Date.now();
    const localAuthor = localStorage.getItem("atlas_author") || "";
    valid.forEach((doc) => {
      if (_seenCommunityIds.has(doc.id)) return;
      if (doc.author === localAuthor) return;
      const created = doc.createdAt?.toMillis ? doc.createdAt.toMillis() : 0;
      if (created && now - created < 5 * 60 * 1000) {
        _toast(`${doc.author} added ${doc.name} (${doc.island || "Aeolian"})`, 5000);
      }
    });
  }
  valid.forEach((doc) => _seenCommunityIds.add(doc.id));

}

// ---- Position overrides (shared drag repositioning) ----
function _applyOverrideToMarker(ovr) {
  const m = markerById[ovr.id] || poiMarkerById[ovr.id] || _communityMarkers.get(ovr.id);
  if (!m) return;
  m.setLatLng([ovr.lat, ovr.lng]);
  const site = SITES.find((s) => s.id === ovr.id);
  if (site) { m.setIcon(depthIcon(site, false, true)); }
  else {
    const poi = POIS.find((p) => p.id === ovr.id);
    if (poi) m.setIcon(poiIcon(poi, true));
    // community markers: position updated; icon class is in markup, won't auto-update after build
  }
  _spearCircles.get(ovr.id)?.setLatLng([ovr.lat, ovr.lng]);
}

function _restoreMarkerToOriginal(id) {
  const m = markerById[id] || poiMarkerById[id] || _communityMarkers.get(id);
  if (!m) return;
  const site = SITES.find((s) => s.id === id);
  if (site) {
    m.setLatLng([site.lat, site.lng]); m.setIcon(depthIcon(site, false, false));
    _spearCircles.get(id)?.setLatLng([site.lat, site.lng]); return;
  }
  const poi = POIS.find((p) => p.id === id);
  if (poi) {
    m.setLatLng([poi.lat, poi.lng]); m.setIcon(poiIcon(poi, false));
    _spearCircles.get(id)?.setLatLng([poi.lat, poi.lng]); return;
  }
  const cdoc = _communityDocs.find((d) => d.id === id);
  if (cdoc) {
    m.setLatLng([cdoc.lat, cdoc.lng]);
    _spearCircles.get(id)?.setLatLng([cdoc.lat, cdoc.lng]);
  }
}

function _onOverridesSnapshot(docs, meta) {
  // Remove overrides that have been cleared (deleted from Firestore)
  const incomingIds = new Set(docs.map((d) => d.id));
  _posOverrides.forEach((_, id) => {
    if (!incomingIds.has(id)) {
      _posOverrides.delete(id);
      _restoreMarkerToOriginal(id);
    }
  });

  // Apply new or updated overrides
  docs.forEach((d) => {
    if (typeof d.lat !== "number" || typeof d.lng !== "number") return;
    _posOverrides.set(d.id, d);
    _applyOverrideToMarker(d);
  });

  if (meta.hasPendingWrites) _toast("Saved — will sync when back online");
}

function _initOverridesSync() {
  if (window.AtlasSync?.onOverridesChanged) {
    window.AtlasSync.onOverridesChanged(_onOverridesSnapshot);
  }
}

// ---- Firebase sync init (called once AtlasSync is ready) ----
function _initFirebaseSync() {
  _firebaseReady  = true;
  _communityLayer = L.layerGroup().addTo(map);

  // Register snapshot listener
  window.AtlasSync.onSitesChanged(_onCommunitySnapshot);
  _initOverridesSync();

  // Update HUD state (enable place button, show author row)
  _updateAddSiteHudFirebaseState();
}

// ================================================================
// ---- Nearby ----
function _haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function initNearby() {
  const toggle = document.getElementById("nearby-toggle");
  const body   = document.getElementById("nearby-body");
  if (!toggle || !body) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.querySelector(".nearby-toggle-caret").textContent = expanded ? "▸" : "▾";
    body.hidden = expanded;
    if (!expanded && !_nearbyLoaded) _runNearby();
  });

  document.getElementById("nearby-refresh").addEventListener("click", _runNearby);
}

let _nearbyLoaded = false;

function _nearbyItems(fromLat, fromLng) {
  const candidates = [];

  SITES.forEach((site) => {
    if (!siteVisible(site)) return;
    const ft = FEATURE_TYPES[site.type];
    candidates.push({
      kind: "site",
      id:   site.id,
      name: site.name,
      glyph: ft ? ft.glyph : "📍",
      sub:  (ft ? ft.label : site.type) + (site.island ? " · " + site.island : ""),
      lat:  site.lat,
      lng:  site.lng,
      dist: _haversineKm(fromLat, fromLng, site.lat, site.lng)
    });
  });

  POIS.forEach((poi) => {
    if (poi.type === "island") return;
    if (!state.poiTypes.has(poi.type)) return;
    const pt = POI_TYPES[poi.type];
    candidates.push({
      kind:  "poi",
      id:    poi.id,
      name:  poi.name,
      glyph: pt ? pt.glyph : "📌",
      sub:   (pt ? pt.label : poi.type) + (poi.island ? " · " + poi.island : ""),
      lat:   poi.lat,
      lng:   poi.lng,
      dist:  _haversineKm(fromLat, fromLng, poi.lat, poi.lng)
    });
  });

  {
    _communityDocs.forEach((cdoc) => {
      const ft = FEATURE_TYPES[cdoc.type] || POI_TYPES[cdoc.type];
      candidates.push({
        kind:  "community",
        id:    cdoc.id,
        name:  cdoc.name,
        glyph: ft ? ft.glyph : "🤿",
        sub:   (ft ? ft.label : cdoc.type || "Site") + (cdoc.island ? " · " + cdoc.island : ""),
        lat:   cdoc.lat,
        lng:   cdoc.lng,
        dist:  _haversineKm(fromLat, fromLng, cdoc.lat, cdoc.lng)
      });
    });
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, 12);
}

function _renderNearbyList(items, fromLabel) {
  const status = document.getElementById("nearby-status");
  const list   = document.getElementById("nearby-list");
  if (!status || !list) return;

  status.textContent = `Showing nearest to ${fromLabel}`;
  list.innerHTML = items.map((item) => {
    const distTxt = item.dist < 1
      ? Math.round(item.dist * 1000) + " m"
      : item.dist.toFixed(1) + " km";
    return `<li class="nearby-item" data-kind="${item.kind}" data-id="${item.id}" tabindex="0" role="button">
      <span class="nearby-glyph">${item.glyph}</span>
      <span class="nearby-info">
        <span class="nearby-name">${item.name}</span>
        <span class="nearby-sub">${item.sub}</span>
      </span>
      <span class="nearby-dist">${distTxt}</span>
    </li>`;
  }).join("");

  list.querySelectorAll(".nearby-item").forEach((li) => {
    li.addEventListener("click", () => _activateNearbyItem(li.dataset.kind, li.dataset.id));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") _activateNearbyItem(li.dataset.kind, li.dataset.id); });
  });
}

function _activateNearbyItem(kind, id) {
  if (kind === "site") {
    const m = markerById[id];
    if (m) siteLayer.zoomToShowLayer(m, () => { m.openPopup(); openDrawer(id); });
    else openDrawer(id);
  } else if (kind === "poi") {
    const m = poiMarkerById[id];
    if (m) poiLayer.zoomToShowLayer(m, () => m.openPopup());
  } else if (kind === "community") {
    const m = _communityMarkers.get(id);
    if (m && _communityLayer) _communityLayer.zoomToShowLayer
      ? _communityLayer.zoomToShowLayer(m, () => openCommunityDrawer(id))
      : openCommunityDrawer(id);
    else openCommunityDrawer(id);
  }
}

function _runNearby() {
  const status = document.getElementById("nearby-status");
  if (status) status.textContent = "Finding your location…";
  _nearbyLoaded = true;

  if (!navigator.geolocation) {
    const c = map.getCenter();
    _renderNearbyList(_nearbyItems(c.lat, c.lng), "map centre");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      _renderNearbyList(_nearbyItems(lat, lng), "your location");
    },
    () => {
      const c = map.getCenter();
      _renderNearbyList(_nearbyItems(c.lat, c.lng), "map centre (location unavailable)");
    },
    { timeout: 8000, maximumAge: 60000 }
  );
}

// ================================================================
// ================================================================
// ---- Spearfishing legality layer --------------------------------
// ================================================================

let _spearMap     = null;   // Map<siteId, {status, radius, reason}>
let _spearLayer   = null;   // L.layerGroup, built lazily on first enable
let _spearCircles = new Map(); // id → L.circle, for live position updates
let _spearToastShown = false;

const _SPEAR_STATUS = {
  banned:     { label: "Banned",        color: "#FF453A", fillOpacity: 0.16, weight: 1.5, dashArray: null },
  restricted: { label: "Restricted",    color: "#FF453A", fillOpacity: 0.16, weight: 1.5, dashArray: null },
  verify:     { label: "Verify locally",color: "#FFD60A", fillOpacity: 0.10, weight: 1,   dashArray: "4 5" }
};

function _buildSpearClassification() {
  const result = new Map();
  const bannedIds = new Set(SPEAR_RULES.bannedZones.map((z) => z.id));

  SITES.forEach((site) => {
    if (bannedIds.has(site.id)) {
      const zone = SPEAR_RULES.bannedZones.find((z) => z.id === site.id);
      result.set(site.id, { status: "banned", radius: zone.radius, reason: zone.reason });
    } else if (site.type === "beach") {
      result.set(site.id, { status: "restricted", radius: SPEAR_RULES.beachRadius,
        reason: "Illegal within 500 m of bathing beaches (Italian maritime law)" });
    } else if (SPEAR_RULES.portIds.includes(site.id)) {
      result.set(site.id, { status: "restricted", radius: SPEAR_RULES.portRadius,
        reason: "Within 500 m of a port/harbour — prohibited" });
    } else if (FEATURE_TYPES[site.type]) {
      result.set(site.id, { status: "verify", radius: 300,
        reason: "Generally permitted under national rules — daylight only, no scuba, ≥500 m from bathers, ≥100 m from moored vessels and fishing gear. Local ordinances vary: verify before loading a speargun." });
    }
  });

  // Banned POIs (dive_site / shipwreck in bannedZones)
  POIS.forEach((poi) => {
    if (bannedIds.has(poi.id)) {
      const zone = SPEAR_RULES.bannedZones.find((z) => z.id === poi.id);
      result.set(poi.id, { status: "banned", radius: zone.radius, reason: zone.reason });
    }
  });

  return result;
}

function _classifyCommunityDoc(doc) {
  if (doc.type === "beach") {
    return { status: "restricted", radius: SPEAR_RULES.beachRadius,
      reason: "Illegal within 500 m of bathing beaches (Italian maritime law)" };
  }
  if (FEATURE_TYPES[doc.type]) {
    return { status: "verify", radius: 300,
      reason: "Generally permitted under national rules — daylight only, no scuba, ≥500 m from bathers, ≥100 m from moored vessels and fishing gear. Local ordinances vary: verify before loading a speargun." };
  }
  return null;
}

function _makeSpearCircle(lat, lng, cls) {
  const st = _SPEAR_STATUS[cls.status];
  return L.circle([lat, lng], {
    radius: cls.radius, pane: "spearfishPane", interactive: false,
    color: st.color, weight: st.weight, dashArray: st.dashArray,
    fillColor: st.color, fillOpacity: st.fillOpacity, opacity: 0.7
  });
}

function buildSpearfishingLayer() {
  if (_spearLayer) { _spearLayer.clearLayers(); } else { _spearLayer = L.layerGroup(); }
  _spearCircles.clear();

  _spearMap.forEach((cls, id) => {
    const src = SITES.find((s) => s.id === id) || POIS.find((p) => p.id === id);
    if (!src) return;
    const ovr = _posOverrides.get(id);
    const circle = _makeSpearCircle(ovr?.lat ?? src.lat, ovr?.lng ?? src.lng, cls).addTo(_spearLayer);
    _spearCircles.set(id, circle);
  });

  _communityDocs.forEach((doc) => {
    const cls = _classifyCommunityDoc(doc);
    if (!cls) return;
    const ovr = _posOverrides.get(doc.id);
    const circle = _makeSpearCircle(ovr?.lat ?? doc.lat, ovr?.lng ?? doc.lng, cls).addTo(_spearLayer);
    _spearCircles.set(doc.id, circle);
  });
}

function initSpear() {
  const tog = document.getElementById("tog-spear");
  if (!tog) return;
  tog.addEventListener("change", () => {
    if (tog.checked) {
      if (!_spearMap) _spearMap = _buildSpearClassification();
      if (!_spearLayer || !_spearLayer.getLayers().length) buildSpearfishingLayer();
      _spearLayer.addTo(map);
      if (!_spearToastShown) {
        _spearToastShown = true;
        _toast("Indicative only — always check current local ordinances. Fines for violations are severe.", 5500);
      }
    } else {
      if (_spearLayer) map.removeLayer(_spearLayer);
    }
  });
}

// ---- Zoom-band marker scaling ----
function _updateZoomBand() {
  const z  = map.getZoom();
  const el = document.getElementById("map");
  el.classList.toggle("zoom-far",  z < 10);
  el.classList.toggle("zoom-mid",  z >= 10 && z < 12);
  el.classList.toggle("zoom-near", z >= 12);
}

// ---- Offline pill ----
function initOffline() {
  const pill = document.getElementById("offline-pill");
  function update() { pill.hidden = navigator.onLine; }
  update();
  window.addEventListener("online",  update);
  window.addEventListener("offline", update);
}

// ---- Pre-cache tiles (zooms 11–13, Aeolian bbox) ----
function _tileCoord(lat, lng, z) {
  const n = Math.pow(2, z);
  const x = Math.floor((lng + 180) / 360 * n);
  const latR = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n);
  return { x, y, z };
}

function _tileBboxUrls(latMin, latMax, lngMin, lngMax, zooms) {
  const base = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
  const urls = [];
  zooms.forEach((z) => {
    const tl = _tileCoord(latMax, lngMin, z);
    const br = _tileCoord(latMin, lngMax, z);
    for (let x = tl.x; x <= br.x; x++) {
      for (let y = tl.y; y <= br.y; y++) {
        urls.push(`${base}/${z}/${y}/${x}`);
      }
    }
  });
  return urls;
}

function initPreCache() {
  if (!("serviceWorker" in navigator)) {
    const row = document.getElementById("precache-row");
    if (row) row.hidden = true;
    return;
  }

  const btn  = document.getElementById("precache-btn");
  const prog = document.getElementById("precache-progress");
  const bar  = document.getElementById("precache-bar");
  const lbl  = document.getElementById("precache-label");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const sw = await navigator.serviceWorker.ready;
    const urls = _tileBboxUrls(38.30, 38.90, 14.30, 15.30, [11, 12, 13]);
    btn.disabled = true;
    prog.hidden  = false;
    lbl.textContent = "0 %";

    const ch = new MessageChannel();
    ch.port1.onmessage = (ev) => {
      if (ev.data.type === "PRECACHE_PROGRESS") {
        const pct = Math.round(ev.data.done / ev.data.total * 100);
        bar.style.width = pct + "%";
        lbl.textContent = pct + " %";
      } else if (ev.data.type === "PRECACHE_DONE") {
        lbl.textContent = "Done";
        btn.textContent = "⬇ Maps saved";
        setTimeout(() => { prog.hidden = true; }, 2000);
      }
    };
    sw.active.postMessage({ type: "PRECACHE_TILES", urls }, [ch.port2]);
  });
}

// ================================================================
// ---- Init ----
function init() {
  loadCoordOverrides();
  buildDepthFilters();
  buildLayerToggles();
  buildSiteMarkers();
  buildAnchorages();
  buildPois();
  buildIslandLabels();

  document.getElementById("tog-anchorages").addEventListener("change", (e) => {
    state.showAnchorages = e.target.checked;
    if (e.target.checked) anchorLayer.addTo(map); else map.removeLayer(anchorLayer);
  });
  document.getElementById("tog-wind-overlay").addEventListener("change", (e) => {
    if (e.target.checked) {
      startWindAnimation();
      if (_forecastData) document.getElementById("wx-timeline").hidden = false;
    } else {
      stopWindAnimation();
      document.getElementById("wx-timeline").hidden = true;
      if (_playTimer) { clearInterval(_playTimer); _playTimer = null; document.getElementById("wxt-play").textContent = "▶"; }
    }
  });
  loadWeather();
  setInterval(loadWeather, 10 * 60 * 1000);

  // Forecast timeline controls
  document.getElementById("wxt-slider").addEventListener("input", (e) => {
    _forecastIndex = parseInt(e.target.value);
    syncForecastUI();
  });
  document.getElementById("wxt-prev").addEventListener("click", () => {
    if (_forecastIndex > 0) { _forecastIndex--; syncForecastUI(); }
  });
  document.getElementById("wxt-next").addEventListener("click", () => {
    if (_forecastData && _forecastIndex < _forecastData.times.length - 1) { _forecastIndex++; syncForecastUI(); }
  });
  document.getElementById("wxt-play").addEventListener("click", toggleForecastPlay);
  document.getElementById("wxt-close").addEventListener("click", () => {
    document.getElementById("wx-timeline").hidden = true;
    if (_playTimer) { clearInterval(_playTimer); _playTimer = null; document.getElementById("wxt-play").textContent = "▶"; }
  });

  // Zoom band for marker scaling + island labels visibility
  map.on("zoomend", _updateZoomBand);
  _updateZoomBand();

  // Keep canvas calibrated on map zoom/pan/resize
  map.on("zoomend moveend", () => {
    if (_windAnimActive) { _resizeWindCanvas(); _initParticles(_currentForecastWind().deg); }
  });
  window.addEventListener("resize", () => {
    _resizeWindCanvas();
    if (_windAnimActive) _initParticles(_currentForecastWind().deg);
  });

  // Sidebar collapse
  document.getElementById("sb-toggle").addEventListener("click", () =>
    document.getElementById("app").classList.add("sb-collapsed")
  );
  document.getElementById("sb-open").addEventListener("click", () =>
    document.getElementById("app").classList.remove("sb-collapsed")
  );

  // Drawer close
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (_addSitePlacing) { cancelAddSitePlacement(); return; }
      if (_dragState) { cancelDrag(); return; }
      closeDrawer();
    }
  });

  // Drag banner buttons
  document.getElementById("drag-confirm-btn").addEventListener("click", confirmDrag);
  document.getElementById("drag-cancel-btn").addEventListener("click", cancelDrag);

  _spearMap = _buildSpearClassification();
  initSpear();
  initAddSite();
  loadUserSites();
  initNearby();
  initSearch();
  initOffline();
  initPreCache();

  _buildExposureCache();
  applyFilters();

  // Wire Firebase when its module finishes loading (fires after classic scripts)
  if (window.AtlasSync) {
    _initFirebaseSync();
  } else {
    window.addEventListener("atlassync:ready", _initFirebaseSync, { once: true });
  }
}

// ---- PART E — Debug + validation spot-checks ----
window.__exposureDebug = function(id) {
  const profile = _exposureCache.get(id);
  if (!profile) return { error: "No profile cached for " + id };

  // Raw 72-bin polar blob — full resolution, not quantised
  function _raw72Svg(p) {
    const R = 36, cx = 40, cy = 40;
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const a = (i * 5 - 90) * Math.PI / 180;
      const r = p[i] * R;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    const ticks = [['N',270],['E',0],['S',90],['W',180]].map(([lbl, svgDeg]) => {
      const a = svgDeg * Math.PI / 180;
      const x = (cx + (R + 6) * Math.cos(a)).toFixed(1);
      const y = (cy + (R + 6) * Math.sin(a)).toFixed(1);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#555">${lbl}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="-8 -8 96 96"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ccc" stroke-width=".5"/><polygon points="${pts.join(' ')}" fill="rgba(94,224,198,.25)" stroke="#5ee0c6" stroke-width="1"/>${ticks}</svg>`;
  }

  const site = SITES.find((s) => s.id === id) || POIS.find((p) => p.id === id);
  if (!site) return { profile: Array.from(profile), svg: _raw72Svg(profile), error: "No site/POI with that id" };
  const basin = _basinForSite(site) || (_wxData ? _worseBasin(_wxData.marWest, _wxData.marEast) : null);
  if (!basin) return { profile: Array.from(profile), svg: _raw72Svg(profile), note: "No weather data loaded yet" };
  const ss = siteSeaState(site, basin);
  return { profile: Array.from(profile), svg: _raw72Svg(profile),
           factorW: ss.factorW, factorS: ss.factorS, effective: ss.effective,
           driveDir: ss.driveDir, level: ss.level, label: ss.label };
};

init();

// Spot-checks run after init() so _exposureCache is populated.
(function _runSpotChecks() {
  // Synthetic basin: 1.0 m swell from 290° (NW), period 8 s.
  const syn = { wave_height: 1.0, wave_direction: 290, wave_period: 8,
                swell_wave_height: 0.5, swell_wave_direction: 290 };
  const checks = [
    { id: "pollara",       test: (f) => f >= 0.85, expect: "≥0.85 open NW (Salina, no landmass blocking NW fetch)" },
    { id: "cala-zimmari",  test: (f) => f <= 0.40, expect: "≤0.40 sheltered NW (inside Panarea circle)"           },
    { id: "dattilo",       test: (f) => f >= 0.85, expect: "≥0.85 small-obstacle + diffraction smear"             },
    { id: "acque-calde",   test: (f) => f >= 0.40, expect: "≥0.40 (Vulcanello is NNE not NW — spec has geo error)" }
  ];
  checks.forEach(({ id, test, expect }) => {
    const profile = _exposureCache.get(id);
    const site    = SITES.find((s) => s.id === id);
    if (!profile || !site) { console.warn(`[exposure] ${id}: missing from cache`); return; }
    const ss = siteSeaState(site, syn);
    const ok = ss.factorW != null && test(ss.factorW);
    console.log(`[exposure] ${id}: factorW=${ss.factorW != null ? ss.factorW.toFixed(3) : "null"} eff=${ss.effective != null ? ss.effective.toFixed(2) : "null"} m  ${ok ? "✓" : "✗"}  (expect ${expect})`);
  });
})();
