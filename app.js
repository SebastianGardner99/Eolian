// ============================================================
// Alonissos — Gardner's Guide
// Application logic (catamaran edition)
// ============================================================

// ---- State ----
const state = {
  depth: { surface: true, mid: true, lower: true },
  type: new Set(Object.keys(FEATURE_TYPES)), // all feature types on by default
  access: "all", // all | shore | boat
  showAnchorages: true,
  showPois: true,
  showProximity: false,
  reachableOnly: false
};

// ---- Map setup ----
const map = L.map("map", {
  center: [38.55, 14.92],
  zoom: 11,
  zoomControl: true,
  minZoom: 9,
  maxZoom: 18
});
map.zoomControl.setPosition("topright");

L.control.locate({
  position: "topright",
  flyTo: true,
  keepCurrentZoomLevel: false,
  locateOptions: { enableHighAccuracy: true, maxZoom: 16 },
  strings: { title: "Show my location" }
}).addTo(map);

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
const anchorLayer    = L.layerGroup().addTo(map);
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
const proximityLayer = L.layerGroup().addTo(map);

// Keep marker refs by site id for list<->map interaction
const markerById = {};

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
function depthIcon(site, dragging = false) {
  const color = DEPTH_BANDS[site._band].color;
  const glyph = FEATURE_TYPES[site.type].glyph;
  const size  = 26;
  return L.divIcon({
    className: "",
    html: `<div class="depth-marker${dragging ? " drag-active" : ""}" style="--mk:${color}">
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
    const m = L.marker([site.lat, site.lng], {
      icon:  depthIcon(site),
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
function poiIcon(poi) {
  const pt = POI_TYPES[poi.type];
  return L.divIcon({
    className: "",
    html: `<div class="poi-marker" style="--pt:${pt.color}">${pt.glyph}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
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
  POIS.forEach((poi) => {
    const m = L.marker([poi.lat, poi.lng], {
      icon: poiIcon(poi),
      title: poi.name
    });
    m.bindPopup(poiPopupHtml(poi), { maxWidth: 300 });
    poiLayer.addLayer(m);
  });
}

// ---- Proximity rings ----
function buildProximity(visibleSites) {
  proximityLayer.clearLayers();
  if (!state.showProximity) return;
  visibleSites.forEach((site) => {
    if (site._reach.level === "swim") {
      proximityLayer.addLayer(
        L.circle([site.lat, site.lng], {
          radius: PROXIMITY.swim, color: "#5ee0c6", weight: 1.5,
          fillColor: "#5ee0c6", fillOpacity: 0.08
        })
      );
    } else if (site._reach.level === "tender") {
      proximityLayer.addLayer(
        L.circle([site.lat, site.lng], {
          radius: PROXIMITY.tender, color: "#6fa8ff", weight: 1.5,
          dashArray: "4 6", fillColor: "#6fa8ff", fillOpacity: 0.05
        })
      );
      const a = site._reach.near.anchorage;
      proximityLayer.addLayer(
        L.polyline([[site.lat, site.lng], [a.lat, a.lng]], {
          color: "#6fa8ff", weight: 1, opacity: 0.5, dashArray: "2 5"
        })
      );
    }
  });
}

// ---- Filtering ----
function siteVisible(site) {
  if (!state.depth[site._band])                             return false;
  if (!state.type.has(site.type))                           return false;
  if (state.access !== "all" && site.access !== state.access) return false;
  if (state.reachableOnly && site._reach.level === "none")  return false;
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
  buildProximity(visible);
  renderList(visible);
  document.getElementById("site-count").textContent = visible.length;
}

// ---- Site list ----
function renderList(visible) {
  const ul = document.getElementById("site-list");
  ul.innerHTML = "";
  const sorted = [...visible].sort((a, b) =>
    (a.depth - b.depth) || a.name.localeCompare(b.name)
  );
  sorted.forEach((site) => {
    const ft = FEATURE_TYPES[site.type];
    const li = document.createElement("li");
    li.className = "site-li";
    li.style.borderLeftColor = DEPTH_BANDS[site._band].color;
    const reach =
      site._reach.level === "swim"   ? `<span class="reach">⊙ short swim</span>`  :
      site._reach.level === "tender" ? `<span class="reach">⛵ tender ride</span>` : "";
    li.innerHTML = `<h3><span class="li-glyph">${ft.glyph}</span> ${site.name}</h3>
      <div class="meta"><span>${site.island}</span><span>${DEPTH_BANDS[site._band].label}</span>${reach}</div>`;
    li.addEventListener("click", () => {
      const m = markerById[site.id];
      if (m && siteLayer.hasLayer(m)) {
        siteLayer.zoomToShowLayer(m, () => m.openPopup());
      } else {
        map.flyTo([site.lat, site.lng], 14, { duration: 0.8 });
      }
    });
    ul.appendChild(li);
  });
  if (!sorted.length) {
    ul.innerHTML = `<li style="color:var(--ink-mute);font-size:.82rem;padding:10px 2px">No sites match these filters.</li>`;
  }
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

  // Show a toast with copyable coordinates
  showDragToast(site, lat, lng);
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
    </table>

    <div class="d-section-h">Sources</div>
    <ul class="d-sources">
      ${site.sources.map((s) => `<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]} ↗</a></li>`).join("")}
    </ul>

    ${site.approx ? `
    <div class="d-section-h">Adjust Position</div>
    <div class="d-gps">
      <div class="gps-btn-row">
        <button class="gps-btn" id="gps-update-btn">📍 Set to My GPS</button>
        <button class="gps-btn drag-btn" id="drag-reposition-btn">✥ Drag to Reposition</button>
      </div>
      <div class="gps-output" id="gps-output" hidden></div>
    </div>` : ""}
  `;
  document.getElementById("drawer-body").innerHTML = body;

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
          const msg = err.code === 1 ? "Location access denied — check browser permissions." :
                      err.code === 2 ? "Position unavailable — are you outdoors with signal?" :
                                       "Location request timed out. Try again.";
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

// ---- Build the feature-type filter UI ----
function buildTypeFilters() {
  const wrap = document.getElementById("type-filter");
  wrap.innerHTML = "";
  const counts = {};
  SITES.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });

  Object.entries(FEATURE_TYPES).forEach(([key, ft]) => {
    if (!counts[key]) return;
    const div = document.createElement("div");
    div.className = "type-chip";
    div.dataset.type = key;
    div.innerHTML = `<span class="tc-glyph">${ft.glyph}</span>
      <span class="tc-label">${ft.label}</span>
      <span class="tc-count">${counts[key]}</span>`;
    div.addEventListener("click", () => {
      if (state.type.has(key)) {
        state.type.delete(key);
        div.classList.add("off");
      } else {
        state.type.add(key);
        div.classList.remove("off");
      }
      applyFilters();
    });
    wrap.appendChild(div);
  });

  const ctrls = document.createElement("div");
  ctrls.className = "type-ctrls";
  ctrls.innerHTML = `<button type="button" data-act="all">All</button>
    <button type="button" data-act="none">None</button>`;
  ctrls.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const on = btn.dataset.act === "all";
    wrap.querySelectorAll(".type-chip").forEach((c) => {
      const key = c.dataset.type;
      if (on) { state.type.add(key); c.classList.remove("off"); }
      else    { state.type.delete(key); c.classList.add("off"); }
    });
    applyFilters();
  });
  wrap.appendChild(ctrls);
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

// ---- Init ----
function init() {
  loadCoordOverrides();
  buildDepthFilters();
  buildTypeFilters();
  buildSiteMarkers();
  buildAnchorages();
  buildPois();

  wireSegments("access-filter", "access");

  document.getElementById("tog-anchorages").addEventListener("change", (e) => {
    state.showAnchorages = e.target.checked;
    if (e.target.checked) anchorLayer.addTo(map); else map.removeLayer(anchorLayer);
  });
  document.getElementById("tog-pois").addEventListener("change", (e) => {
    state.showPois = e.target.checked;
    if (e.target.checked) poiLayer.addTo(map); else map.removeLayer(poiLayer);
  });
  document.getElementById("tog-proximity").addEventListener("change", (e) => {
    state.showProximity = e.target.checked;
    document.getElementById("prox-legend").hidden = !e.target.checked;
    applyFilters();
  });
  document.getElementById("tog-reachable").addEventListener("change", (e) => {
    state.reachableOnly = e.target.checked;
    applyFilters();
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
      if (_dragState) { cancelDrag(); return; }
      closeDrawer();
    }
  });

  // Drag banner buttons
  document.getElementById("drag-confirm-btn").addEventListener("click", confirmDrag);
  document.getElementById("drag-cancel-btn").addEventListener("click", cancelDrag);

  applyFilters();
}

init();
