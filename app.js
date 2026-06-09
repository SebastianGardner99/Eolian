// ============================================================
// Aeolian Islands — Snorkel & Natural-Feature Atlas
// Application logic (catamaran edition)
// ============================================================

// ---- State ----
const state = {
  depth: { surface: true, mid: true, lower: true },
  type: new Set(Object.keys(FEATURE_TYPES)), // all feature types on by default
  access: "all", // all | shore | boat
  showAnchorages: true,
  showRoutes: true,
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

// Labels overlay (place names) — placed in a dedicated pane that sits
// ABOVE the markers so island/town names stay readable.
map.createPane("labels");
map.getPane("labels").style.zIndex = 650;            // above marker pane (600)
map.getPane("labels").style.pointerEvents = "none"; // clicks pass through to markers
// CartoDB dark-matter labels-only overlay: a much sparser place-name set
// than the Esri reference tiles (only major towns/islands), designed to
// sit over a dark basemap — far less label crowding on densely-named islands.
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
// Sites use a cluster group so dense areas (Salina/Lipari/Vulcano) stay
// readable at low zoom; clusters split apart as you zoom in.
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
const anchorLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
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

// Nearest anchorage + distance for a site
function nearestAnchorage(site) {
  let best = null;
  for (const a of ANCHORAGES) {
    const d = haversine(site.lat, site.lng, a.lat, a.lng);
    if (!best || d < best.dist) best = { anchorage: a, dist: d };
  }
  return best;
}

// Classify reachability from nearest anchorage
function reachability(site) {
  const near = nearestAnchorage(site);
  if (!near) return { level: "none", near: null };
  if (near.dist <= PROXIMITY.swim) return { level: "swim", near };
  if (near.dist <= PROXIMITY.tender) return { level: "tender", near };
  return { level: "none", near };
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const ACCESS_LABEL = { shore: "Shore entry", boat: "Anchor & swim" };

// Precompute band + reachability for every site
SITES.forEach((s) => {
  s._band = bandFor(s.depth);
  s._reach = reachability(s);
});

// ---- Marker rendering ----
function depthIcon(site) {
  const color = DEPTH_BANDS[site._band].color;
  const glyph = FEATURE_TYPES[site.type].glyph;
  const size = 26;
  return L.divIcon({
    className: "",
    html: `<div class="depth-marker" style="--mk:${color}">
             <span class="mk-glyph">${glyph}</span>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function chip(text, cls) {
  return `<span class="chip ${cls}">${text}</span>`;
}

function reachChip(reach) {
  if (reach.level === "swim") return chip("Short swim", "reach");
  if (reach.level === "tender") return chip("Tender ride", "reach");
  return "";
}

function popupHtml(site) {
  const band = DEPTH_BANDS[site._band];
  const ft = FEATURE_TYPES[site.type];
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
      icon: depthIcon(site),
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
      iconSize: [18, 18],
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

// ---- Boat routes ----
function buildRoutes() {
  routeLayer.clearLayers();
  BOAT_ROUTES.forEach((r) => {
    const line = L.polyline(r.points, {
      color: r.color,
      weight: 2.5,
      opacity: 0.75,
      dashArray: "1 7",
      lineCap: "round"
    });
    line.bindTooltip(r.name, { sticky: true });
    routeLayer.addLayer(line);
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
  if (!state.depth[site._band]) return false;
  if (!state.type.has(site.type)) return false;
  if (state.access !== "all" && site.access !== state.access) return false;
  if (state.reachableOnly && site._reach.level === "none") return false;
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
  // group sort: by depth ascending, then name
  const sorted = [...visible].sort((a, b) =>
    (a.depth - b.depth) || a.name.localeCompare(b.name)
  );
  sorted.forEach((site) => {
    const ft = FEATURE_TYPES[site.type];
    const li = document.createElement("li");
    li.className = "site-li";
    li.style.borderLeftColor = DEPTH_BANDS[site._band].color;
    const reach =
      site._reach.level === "swim" ? `<span class="reach">⊙ short swim</span>` :
      site._reach.level === "tender" ? `<span class="reach">⛵ tender ride</span>` : "";
    li.innerHTML = `<h3><span class="li-glyph">${ft.glyph}</span> ${site.name}</h3>
      <div class="meta"><span>${site.island}</span><span>${DEPTH_BANDS[site._band].label}</span>${reach}</div>`;
    li.addEventListener("click", () => {
      const m = markerById[site.id];
      if (m && siteLayer.hasLayer(m)) {
        // zoomToShowLayer expands any cluster the marker sits in, then opens it
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

// ---- Detail drawer ----
let _draggableMarker = null;

function openDrawer(id) {
  if (_draggableMarker) {
    _draggableMarker.dragging.disable();
    _draggableMarker = null;
  }
  const site = SITES.find((s) => s.id === id);
  if (!site) return;
  const band = DEPTH_BANDS[site._band];
  const ft = FEATURE_TYPES[site.type];
  const r = site._reach;

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
        ${site.approx ? '<div class="approx-flag">⚠ Approximate — derived from the cove/cape (±0.2–1 km)</div>' : '<div class="approx-flag" style="color:var(--swim)">Precise</div>'}</td></tr>
    </table>

    <div class="d-section-h">Sources</div>
    <ul class="d-sources">
      ${site.sources.map((s) => `<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]} ↗</a></li>`).join("")}
    </ul>
    ${site.approx ? `
    <div class="d-section-h">GPS Update</div>
    <div class="d-gps">
      <div class="gps-btns">
        <button class="gps-btn" id="gps-update-btn">Set to Current GPS Location</button>
        <button class="gps-btn" id="gps-drag-btn">Drag to Adjust</button>
      </div>
      <div class="gps-output" id="gps-output" hidden></div>
    </div>` : ""}
  `;
  document.getElementById("drawer-body").innerHTML = body;

  if (site.approx) {
    const output = document.getElementById("gps-output");
    const m = markerById[site.id];

    document.getElementById("gps-update-btn").addEventListener("click", function () {
      const btn = this;
      btn.textContent = "Locating…";
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (m) m.setLatLng([lat, lng]);
          map.flyTo([lat, lng], Math.max(map.getZoom(), 16));
          output.hidden = false;
          output.className = "gps-output";
          output.innerHTML = `<div class="gps-coords">New Coordinates (Copy for data.js):</div>
            <code class="gps-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</code>`;
          btn.textContent = "Update Again";
          btn.disabled = false;
        },
        (err) => {
          const msg = err.code === 1 ? "Location access denied — check browser permissions." :
                      err.code === 2 ? "Position unavailable — are you outdoors with signal?" :
                      "Location request timed out. Try again.";
          output.hidden = false;
          output.className = "gps-output gps-error-state";
          output.textContent = msg;
          btn.textContent = "Set to Current GPS Location";
          btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    const dragBtn = document.getElementById("gps-drag-btn");

    function onMarkerDragEnd() {
      const { lat, lng } = m.getLatLng();
      output.hidden = false;
      output.className = "gps-output";
      output.innerHTML = `<div class="gps-coords">New Coordinates (Copy for data.js):</div>
        <code class="gps-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</code>`;
    }

    dragBtn.addEventListener("click", function () {
      if (!m) return;
      const active = dragBtn.classList.toggle("active");
      if (active) {
        _draggableMarker = m;
        m.dragging.enable();
        m.on("dragend", onMarkerDragEnd);
        dragBtn.textContent = "Lock Position";
      } else {
        m.dragging.disable();
        m.off("dragend", onMarkerDragEnd);
        _draggableMarker = null;
        dragBtn.textContent = "Drag to Adjust";
      }
    });
  }

  document.getElementById("drawer").classList.add("open");
  const scrim = document.getElementById("drawer-scrim");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("show"));
}
window.openDrawer = openDrawer;

function closeDrawer() {
  if (_draggableMarker) {
    _draggableMarker.dragging.disable();
    _draggableMarker = null;
  }
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
  // count sites per type so empty types can be hidden
  const counts = {};
  SITES.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });

  Object.entries(FEATURE_TYPES).forEach(([key, ft]) => {
    if (!counts[key]) return; // skip types with no sites
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

  // "All / None" quick controls
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
      else { state.type.delete(key); c.classList.add("off"); }
    });
    applyFilters();
  });
  wrap.appendChild(ctrls);
}

// ---- Wire up segmented controls (access only) ----
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
  buildDepthFilters();
  buildTypeFilters();
  buildSiteMarkers();
  buildAnchorages();
  buildRoutes();

  wireSegments("access-filter", "access");

  // overlay toggles
  document.getElementById("tog-anchorages").addEventListener("change", (e) => {
    state.showAnchorages = e.target.checked;
    if (e.target.checked) anchorLayer.addTo(map); else map.removeLayer(anchorLayer);
  });
  document.getElementById("tog-routes").addEventListener("change", (e) => {
    state.showRoutes = e.target.checked;
    if (e.target.checked) routeLayer.addTo(map); else map.removeLayer(routeLayer);
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

  // sidebar collapse
  document.getElementById("sb-toggle").addEventListener("click", () =>
    document.getElementById("app").classList.add("sb-collapsed")
  );
  document.getElementById("sb-open").addEventListener("click", () =>
    document.getElementById("app").classList.remove("sb-collapsed")
  );

  // drawer close
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  applyFilters();
}

init();
