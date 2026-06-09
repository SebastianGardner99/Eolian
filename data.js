// ===================================================================
// Aeolian Islands — Snorkel & Natural-Feature Atlas
// For catamaran cruising: every site is <= 20 m depth, snorkelable
// without scuba, and reachable by swimming from a moored/anchored
// boat (or from shore). Compiled from sailing/charter skipper guides,
// turismoeolie.com, UNESCO Smart Education Sicily, Navily, Smithsonian
// GVP, Wikipedia and first-hand travel/snorkel blogs (June 2026).
//
// COORDINATE NOTE: where exact GPS isn't published, coordinates are
// derived from the cove/stack/cape and marked approx:true (±0.2–1 km).
// ===================================================================

// Snorkel depth bands (m): how deep the interesting feature sits.
//   surface : 0–5    (wade-in / surface features, bubbles, shallow pools)
//   mid     : 5–10   (easy free-dive / clear shallows)
//   lower   : 10–20  (deeper free-dive; top of feature still within snorkel range)
const DEPTH_BANDS = {
  surface: { label: "0–5 m",   color: "#5ee0c6", min: 0,  max: 5 },
  mid:     { label: "5–10 m",  color: "#43c6e8", min: 5,  max: 10 },
  lower:   { label: "10–20 m", color: "#7c8cf0", min: 10, max: 20 }
};
function bandFor(d) { if (d <= 5) return "surface"; if (d <= 10) return "mid"; return "lower"; }

// Feature-type catalogue (for the type filter + marker glyphs).
const FEATURE_TYPES = {
  sea_cave:           { label: "Sea cave / grotto", glyph: "◗" },
  stack:              { label: "Stack / faraglione", glyph: "▲" },
  arch:               { label: "Natural arch", glyph: "⌒" },
  natural_pool:       { label: "Natural pool", glyph: "❉" },
  thermal_bubble:     { label: "Thermal bubbles", glyph: "✦" },
  reef_secca:         { label: "Reef / secca", glyph: "✷" },
  cove_snorkel:       { label: "Snorkel cove", glyph: "≈" },
  beach_snorkel:      { label: "Beach snorkel", glyph: "≋" },
  shallow_archaeology:{ label: "Shallow archaeology", glyph: "⌂" }
};

// Access model: shore = walk-in possible; boat = anchor & swim only.
const SITES = [
  // ---------------- PANAREA ----------------
  {
    id: "cala-junco", name: "Cala Junco", island: "Panarea",
    lat: 38.625685, lng: 15.063242, approx: false,
    type: "cove_snorkel", depth: 8, depthText: "5–12 m — volcanic basalt seabed",
    access: "shore", anchorage: "Outside the cove in 5–10 m sand; swim in",
    see: "Volcanic amphitheatre of dark basalt forming a natural pool; dense sea bream and wrasse; octopus and moray eels; exceptional underwater light.",
    notes: "30-min walk from San Pietro pier. Go before 9am or after 5pm to beat crowds. No restrictions; enter by swimming only — no boat entry.",
    desc: "The jewel of Panarea — a volcanic amphitheatre bay with emerald water over a stony seabed and some of the best snorkelling in the archipelago.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["Lonely Planet — Cala Junco", "https://www.lonelyplanet.com/italy/sicily/panarea/attractions/cala-junco/a/poi-sig/1397095/359996"]]
  },
  {
    id: "cala-zimmari", name: "Cala Zimmari", island: "Panarea",
    lat: 38.628801, lng: 15.066016, approx: false,
    type: "beach_snorkel", depth: 5, depthText: "3–8 m — distinctive red sand",
    access: "shore", anchorage: "Just off the beach in 5–8 m",
    see: "Distinctive red volcanic sand; calm sheltered water; sea bream and wrasse; easy entry for snorkelling over sandy seabed.",
    notes: "Only sandy beach on Panarea. 20-min walk from San Pietro port. No restrictions.",
    desc: "Panarea's only sandy beach — distinctive red volcanic sand, calm sheltered water and easy snorkelling, 20 minutes' walk from the port.",
    sources: [["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"], ["Lonely Planet — Panarea", "https://www.lonelyplanet.com/italy/sicily/panarea"]]
  },
  {
    id: "calcara-fumaroles", name: "Spiaggia della Calcara", island: "Panarea",
    lat: 38.645653, lng: 15.074647, approx: false,
    type: "thermal_bubble", depth: 2, depthText: "0–3 m — shore fumaroles",
    access: "shore", anchorage: "Ditella dock / Panarea Nord buoy field",
    see: "Volcanic gases bubbling up through the seabed and rock cracks; hot steam venting from beach fissures; eerie and unique.",
    notes: "Active fumarole beach — 20-min walk from San Pietro towards Ditella. Don't dig into vent sediment or touch vent centres.",
    desc: "An active fumarole beach where volcanic gases bubble up through the seabed and rock cracks — eerie and unique, 20 minutes from San Pietro.",
    sources: [["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"], ["Smithsonian GVP — Panarea", "https://volcano.si.edu/showreport.cfm?doi=10.5479%2Fsi.GVP.BGVN200210-211041"]]
  },

  // ---------------- PANAREA ISLETS ----------------
  {
    id: "lisca-bianca-bottaro", name: "Lisca Bianca / Bottaro Fumaroles", island: "Panarea islets",
    lat: 38.637000, lng: 15.082000, approx: true,
    type: "thermal_bubble", depth: 9, depthText: "5–13 m — volcanic gas vents",
    access: "boat", anchorage: "Between the two islets (5–13 m sand)",
    see: "Volcanic CO₂ vents bubbling vigorously from the sandy seabed; milky water near vent centres; the Grotta degli Innamorati (Lovers' Arch) swim-through on Lisca Bianca.",
    notes: "Anchor between the two islets. No landing on either. Limit time at vent centres. Gas caution: sulphur present.",
    desc: "The most spectacular underwater fumarole field in the archipelago — CO₂ vents cascade bubbles between two islets, plus a Lovers' Arch swim-through.",
    sources: [["UNESCO Smart Education — Lisca Bianca", "https://www.smarteducationunescosicilia.it/en/isole-eolie/the-underwater-fumarolic-activity-of-lisca-bianca/"], ["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"]]
  },
  {
    id: "dattilo", name: "Dattilo", island: "Panarea islets",
    lat: 38.637000, lng: 15.077000, approx: true,
    type: "stack", depth: 10, depthText: "5–15 m — volcanic rock formations",
    access: "boat", anchorage: "Off the east coast (5–13 m sand)",
    see: "Tall narrow volcanic islet; interesting rock formations and cave passages below the waterline; colourful sponges and algae in clear water.",
    notes: "No landing; navigate carefully around shallow rocks. Best combined with Lisca Bianca in a single boat day.",
    desc: "A tall narrow volcanic islet east of San Pietro with rock formations below the waterline — best combined with Lisca Bianca fumaroles in one day.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },
  {
    id: "basiluzzo", name: "Basiluzzo", island: "Panarea islets",
    lat: 38.663690, lng: 15.113470, approx: false,
    type: "shallow_archaeology", depth: 7.5, depthText: "7.5 m — Roman navalia ruins",
    access: "boat", anchorage: "East coast (9–14 m sand/stone)",
    see: "Roman boathouse (navalia) ruins at 7.5 m encrusted with gorgonians and sponges; visible from the surface on calm days; sheer cliffs above emerald water.",
    notes: "Uninhabited volcanic islet. Landing on the east beach only — path is landslide-prone. No formal dive ban on surrounding water.",
    desc: "Uninhabited volcanic islet with Roman ruins and an ancient boat-house visible on the seabed at 7.5 m — the only snorkelable Roman archaeology in the archipelago.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },

  // ---------------- LIPARI ----------------
  {
    id: "spiaggia-asino", name: "Spiaggia dell'Asino", island: "Lipari",
    lat: 38.370390, lng: 14.997942, approx: false,
    type: "cove_snorkel", depth: 8, depthText: "5–12 m — rocky seabed under black cliffs",
    access: "shore", anchorage: "Off the cove in 8–14 m",
    see: "Crystal-clear water over a rocky volcanic seabed under black cliffs; sea bream and wrasse; extraordinary isolation for a Lipari beach.",
    notes: "200m steep descent on foot or water taxi from Lipari town. No restrictions.",
    desc: "A secluded cove under black cliffs on Lipari's SW shore — crystal-clear water over a rocky seabed, reachable on foot (steep descent) or by water taxi.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["sicilia.info — Lipari", "https://www.sicilia.info/en/aeolian-islands/lipari/"]]
  },
  {
    id: "valle-muria", name: "Valle Muria", island: "Lipari",
    lat: 38.460500, lng: 14.933837, approx: false,
    type: "beach_snorkel", depth: 5, depthText: "0–8 m — dark volcanic sand and tuff caves",
    access: "shore", anchorage: "Valle Muria bay (8–15 m sand)",
    see: "Dark volcanic beach flanked by Pietra Lunga and Pietra Menalda sea stacks; fumaroles; small tuff caves to explore; extraordinary volcanic geology.",
    notes: "25-min hike from Quattrocchi viewpoint. Confirm land access before visiting — path intermittently closed. Boat access always reliable.",
    desc: "A dark volcanic beach between two iconic sea stacks on Lipari's wild west coast, with fumaroles and tuff caves to snorkel.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["GetYourGuide — Aeolian snorkeling", "https://www.getyourguide.com/aeolian-islands-l3446/snorkeling-tc57/"]]
  },
  {
    id: "pumice-canyon", name: "Pumice Canyon (Punta Castagna)", island: "Lipari",
    lat: 38.512566, lng: 14.959444, approx: false,
    type: "beach_snorkel", depth: 8, depthText: "5–12 m — white pumice seabed",
    access: "shore", anchorage: "Porticello / Canneto bay",
    see: "White pumice cliffs meeting vivid blue sea near Porticello; otherworldly contrast; white pumice seabed shimmering below; viewable from both land and sea.",
    notes: "Walk from Porticello or approach by boat. No restrictions.",
    desc: "White pumice cliffs meeting vivid blue sea near Porticello — an otherworldly contrast you can explore by snorkelling along the pumice seabed.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["turismoeolie — Lipari", "http://aeolianislands.turismoeolie.com/boating-lipari/"]]
  },

  // ---------------- VULCANO ----------------
  {
    id: "acque-calde", name: "Acque Calde (Fumarole Beach)", island: "Vulcano",
    lat: 38.417609, lng: 14.959443, approx: false,
    type: "thermal_bubble", depth: 2, depthText: "0–3 m — volcanic fumaroles from below",
    access: "shore", anchorage: "Porto di Levante (5–6 m sand/mud)",
    see: "Volcanic fumaroles heating the sea from below; milky-coloured water near shore; curtains of CO₂ bubbles rising from the black sand seabed.",
    notes: "Do not wear silver jewellery — it tarnishes instantly. Water near vent centres can be very hot. Easy walk from Porto Levante. Free.",
    desc: "Volcanic fumaroles heat the sea from below at this otherworldly black-sand beach — a natural warm jacuzzi a short walk from Porto Levante.",
    sources: [["HotSpringsGuides — Vulcano", "https://www.hotspringsguides.com/hot-springs/thermal-springs-vulcano-island-italy"], ["Tripadvisor — Acque Calde", "https://www.tripadvisor.com/Attraction_Review-g642173-d21169876-Reviews-Spiaggia_delle_Acque_Calde-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "grotta-cavallo", name: "Grotta del Cavallo", island: "Vulcano",
    lat: 38.402622, lng: 14.939964, approx: false,
    type: "sea_cave", depth: 5, depthText: "2–8 m in cave",
    access: "boat", anchorage: "Bay south of the cave (5–12 m sand)",
    see: "Spectacular sea cave on Vulcano's NW coast; light refracts through a natural siphon creating dazzling colour effects; adjacent to the Piscina di Venere.",
    notes: "Depart from Porto Levante or Spiagge Nere. Exposed west coast — calm weather essential. Boat only.",
    desc: "A spectacular sea cave on Vulcano's NW coast where light refracts through a natural siphon, creating dazzling colour effects — adjacent to the Piscina di Venere.",
    sources: [["Loveolie — Grotta del Cavallo", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-del-cavallo"], ["Tripadvisor — Piscina di Venere", "https://www.tripadvisor.com/Attraction_Review-g642173-d17727014-Reviews-Piscina_Di_Venere-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "piscina-venere", name: "Piscina di Venere (Venus Pool)", island: "Vulcano",
    lat: 38.402900, lng: 14.938000, approx: true,
    type: "natural_pool", depth: 3, depthText: "1–5 m — completely enclosed rock pool",
    access: "boat", anchorage: "Bay south of the caves (5–12 m sand)",
    see: "A natural tuff-and-basalt rock pool completely enclosed from the sea; extraordinary turquoise colour; one of Italy's most beautiful natural pools.",
    notes: "Boat access only from Porto Levante or Spiagge Nere. Calm weather essential on this exposed west coast.",
    desc: "One of Italy's most beautiful natural pools — a completely enclosed turquoise rock pool of tuff and basalt on Vulcano's wild NW coast.",
    sources: [["Tripadvisor — Piscina di Venere", "https://www.tripadvisor.com/Attraction_Review-g642173-d17727014-Reviews-Piscina_Di_Venere-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"], ["Loveolie — Grotta del Cavallo", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-del-cavallo"]]
  },
  {
    id: "spiaggia-gelso", name: "Spiaggia di Gelso", island: "Vulcano",
    lat: 38.369544, lng: 14.994758, approx: false,
    type: "beach_snorkel", depth: 8, depthText: "5–15 m — drops quickly to vivid blue",
    access: "shore", anchorage: "Gelso (12–18 m off beach)",
    see: "Black volcanic sand dropping quickly to vivid blue depths; large grouper and sea bream; far fewer crowds than Vulcano's north coast.",
    notes: "Remote — spectacular drive across the island or boat from Porto Levante. No restrictions.",
    desc: "A remote black-sand beach on Vulcano's southern tip where the seabed drops quickly to vivid blue — far fewer crowds than the north.",
    sources: [["sicilia.info — Vulcano", "https://www.sicilia.info/en/aeolian-islands/vulcano/"], ["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"]]
  },

  // ---------------- SALINA ----------------
  {
    id: "pollara", name: "Pollara Bay", island: "Salina",
    lat: 38.579933, lng: 14.807069, approx: false,
    type: "cove_snorkel", depth: 8, depthText: "5–10 m — submerged crater walls",
    access: "shore", anchorage: "Between Punta Perciato & the Faraglione (5–10 m)",
    see: "Submerged volcanic crater topography; volcanic sconcassi gas seeps; Il Postino filmset cliffs above; swim right to reach the Arco del Perciato sea arch.",
    notes: "150 steps down from Pollara village. Exposed to W/NW swell — fair-weather only. Richest underwater landscape on Salina.",
    desc: "Il Postino beach inside a collapsed volcanic crater — Salina's richest underwater landscape, with submerged crater walls and volcanic gas seeps.",
    sources: [["Navily — Spiaggia della Pollara", "https://www.navily.com/mouillage/spiaggia-della-pollara/7621"], ["turismoeolie — Boating Salina", "http://aeolianislands.turismoeolie.com/boating-salina/"]]
  },
  {
    id: "arco-perciato", name: "Arco del Perciato", island: "Salina",
    lat: 38.582725, lng: 14.806819, approx: false,
    type: "arch", depth: 2, depthText: "1–3 m at arch base",
    access: "boat", anchorage: "Pollara Bay (immediately south)",
    see: "Dramatic lava arch at water level; algae and anemones on the base; frames Pollara Bay behind; swimmable from the beach.",
    notes: "Reachable from the Balate steps or by boat from Pollara Bay. A recent rockfall may have reduced clearance — check locally.",
    desc: "A dramatic lava arch at the north end of Pollara Bay — swimmable and reachable from the Balate steps or by dinghy from the anchorage.",
    sources: [["Tripadvisor — Arco di Punta Perciato", "https://www.tripadvisor.com/Attraction_Review-g12161917-d18148393-Reviews-Arco_Naturale_DI_Punta_Perciato-Pollara_Malfa_Isola_di_Salina_Aeolian_Islands_.html"], ["Mammasantina — Salina by boat", "https://mammasantina.it/en/salina-aeolian-islands/around-the-salina-by-boat.html"]]
  },
  {
    id: "spiaggia-rinella", name: "Spiaggia di Rinella", island: "Salina",
    lat: 38.547960, lng: 14.829794, approx: false,
    type: "beach_snorkel", depth: 8, depthText: "5–12 m — large fish in good visibility",
    access: "shore", anchorage: "Rinella anchorage (8–12 m off beach)",
    see: "Black pebble seabed; large grouper and sea bream to the left of the beach; good visibility; locals' favourite.",
    notes: "Most accessible beach on Salina's south coast. Black-pebble — bring reef shoes. No restrictions.",
    desc: "Salina's most accessible beach — a locals' favourite on the south coast with good snorkelling to the left of the beach and large fish.",
    sources: [["turismoeolie — Boating Salina", "http://aeolianislands.turismoeolie.com/boating-salina/"], ["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"]]
  },

  // ---------------- STROMBOLI ----------------
  {
    id: "strombolicchio", name: "Strombolicchio", island: "Stromboli",
    lat: 38.817300, lng: 15.251853, approx: false,
    type: "stack", depth: 10, depthText: "5–15 m around the base",
    access: "boat", anchorage: "Ficogrande buoy field (~1.5 km dinghy ride)",
    see: "Ancient basalt volcanic chimney; vertical walls colonised by gorgonians, sponges and bryozoans; rich marine life; deep blue clarity.",
    notes: "Integral Nature Reserve — landing PROHIBITED. Snorkelling the surrounding water is permitted. Boat trips depart May–Oct.",
    desc: "Ancient volcanic sea stack 2 km NE of Stromboli — rich marine life around its base in exceptional visibility. Landing prohibited; snorkel from the boat.",
    sources: [["Wikipedia — Strombolicchio", "https://en.wikipedia.org/wiki/Strombolicchio"], ["italia.it — Strombolicchio", "https://www.italia.it/en/sicily/strombolicchio"]]
  },
  {
    id: "sciara-fuoco", name: "Sciara del Fuoco", island: "Stromboli",
    lat: 38.801253, lng: 15.205180, approx: false,
    type: "reef_secca", depth: 10, depthText: "5–15 m — volcanic rocky seabed",
    access: "boat", anchorage: "Stand off — approach by dinghy from Ficogrande",
    see: "Active lava flow scar on Stromboli's NW flank; rocky seabed covered in sponges and soft corals; best at sunset to watch eruptions overhead.",
    notes: "Do not approach the shore closely — active lava entry can occur. Watch eruptions from the boat. Boat only.",
    desc: "Stromboli's active lava flow scar — rocky seabed covered in sponges and soft corals, best visited by boat at sunset to watch eruptions overhead.",
    sources: [["Wikipedia — Sciara del Fuoco", "https://en.wikipedia.org/wiki/Sciara_del_Fuoco"], ["WTP Travel — Stromboli", "https://wtp.travel/travel-guides/italy/stromboli/activities/"]]
  },

  // ---------------- FILICUDI ----------------
  {
    id: "bue-marino", name: "Grotta del Bue Marino", island: "Filicudi",
    lat: 38.571656, lng: 14.542465, approx: false,
    type: "sea_cave", depth: 6, depthText: "0–10 m inside; seabed visible",
    access: "boat", anchorage: "Pecorini a Mare buoy field",
    see: "Largest sea cave in the Aeolians — 20m high, 30m wide; spectacular light effects and stalactites; extraordinary colour inside.",
    notes: "SW coast of Filicudi. Watch the current on the way back out. Inner chamber was restricted 2021–22 for rockfall risk — confirm locally before entering.",
    desc: "The largest sea cave in the Aeolians — 20m high and 30m wide on Filicudi's SW coast, with spectacular light effects and stalactites.",
    sources: [["Loveolie — Grotta del Bue Marino", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-bue-marino"], ["Tripadvisor — Grotta del Bue Marino", "https://www.tripadvisor.com/Attraction_Review-g675109-d15683279-Reviews-Grotta_del_bue_marino-Filicudi_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "la-canna", name: "La Canna", island: "Filicudi",
    lat: 38.582405, lng: 14.521094, approx: false,
    type: "stack", depth: 17, depthText: "5–20 m around the base",
    access: "boat", anchorage: "Off Montenassari rock (12–16 m); 1.6 km offshore",
    see: "71 m volcanic sea stack; crystal-clear water with groupers, amberjacks and lobster at the base; walls vanishing into deep blue.",
    notes: "Protected nature reserve — landing prohibited. Snorkel from the boat. Seas can be rough — assess from anchorage before going.",
    desc: "A 71 m volcanic sea stack NW of Filicudi — crystal-clear water at the base with groupers, amberjacks and lobster. Landing prohibited; snorkel from the boat.",
    sources: [["Loveolie — La Canna", "https://www.loveolie.com/en/attractions/mare-eolie/la-canna"], ["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"]]
  },
  {
    id: "capo-graziano", name: "Capo Graziano / Secca", island: "Filicudi",
    lat: 38.557313, lng: 14.588502, approx: false,
    type: "shallow_archaeology", depth: 15, depthText: "5–20 m — 7 shipwrecks Bronze Age to 17th C",
    access: "boat", anchorage: "Filicudi Porto buoy field (~100 m)",
    see: "7 shipwrecks from the Bronze Age to a 17th-century Spanish galleon; clouds of fish; sea-whips and shrimps in caves; snorkelable reef crest at 5–10 m.",
    notes: "Snorkelling the outer reef crest (5–10 m) is free; formal shipwreck dives are guided/scuba. Reef is a boat hazard — approach by dinghy.",
    desc: "An underwater archaeological site with 7 shipwrecks spanning the Bronze Age to a 17th-century Spanish galleon — clouds of fish and sea-whips.",
    sources: [["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"], ["VisitSicily — Underwater Archaeology", "https://www.visitsicily.info/en/itinerario/underwater-archaeology-routes/"]]
  },
  {
    id: "grotta-gamberi", name: "Grotta dei Gamberi", island: "Filicudi",
    lat: 38.558000, lng: 14.545000, approx: true,
    type: "sea_cave", depth: 20, depthText: "Entrance walls ~18–20 m — freedive territory",
    access: "boat", anchorage: "Pecorini a Mare buoy field",
    see: "Thousands of Plesionika narval shrimps coating the cave walls; sponges and moray eels; deep cave descending to 33–39 m — only the entrance walls are snorkelable.",
    notes: "Deep cave (33–39 m full depth) — freedive/scuba territory for the main chamber. For confident freedivers only at entrance walls. Boat from Filicudi Porto.",
    desc: "A deep cave packed with thousands of shrimps coating its walls, plus sponges and moray eels — freedive territory from the boat at Filicudi Porto.",
    sources: [["vacanzeinbarca — Filicudi", "https://www.vacanzeinbarca.it/en/destinazioni/filicudi-alicudi.php"], ["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"]]
  },

  // ---------------- ALICUDI ----------------
  {
    id: "alicudi-harbour", name: "Alicudi Harbour", island: "Alicudi",
    lat: 38.532301, lng: 14.359834, approx: false,
    type: "cove_snorkel", depth: 10, depthText: "5–15 m; drops off quickly",
    access: "shore", anchorage: "Buoys off the village / 10–15 m by the dock",
    see: "Reportedly the clearest water in the archipelago — 20–30 m visibility; multicoloured seaweed and posidonia; urchins, grouper and octopus; basalt column formations.",
    notes: "Remotest island in the Aeolians — virtually no tourists. No equipment rental on island — bring everything.",
    desc: "The remotest Aeolian island with 20–30 m visibility — reportedly the clearest water in the archipelago. Virtually no tourists; bring all your own equipment.",
    sources: [["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"], ["Apartment in Catania — Alicudi", "https://www.apartmentincatania.com/en/alicudi-island/"]]
  }
];

// ===================================================================
// Anchorages & popular boat-route stops (unchanged set, used for the
// swim-proximity overlay).
// ===================================================================
const ANCHORAGES = [
  { name: "Cala Junco", island: "Panarea", lat: 38.62133, lng: 15.05633, type: "Free anchorage", use: "Swim / lunch stop" },
  { name: "Cala dei Zimmari", island: "Panarea", lat: 38.62533, lng: 15.06750, type: "Free anchorage", use: "Overnight / swim" },
  { name: "Cala Milazzese", island: "Panarea", lat: 38.62700, lng: 15.06867, type: "Free anchorage", use: "Swim stop" },
  { name: "Scalo Ditella (San Pietro)", island: "Panarea", lat: 38.63768, lng: 15.07653, type: "Port / buoy field", use: "Main port" },
  { name: "Panarea Nord buoy field", island: "Panarea", lat: 38.64000, lng: 15.07883, type: "Mooring buoys (31)", use: "Overnight" },
  { name: "Lisca Bianca anchorage", island: "Panarea islets", lat: 38.63890, lng: 15.11280, type: "Day stop", use: "Snorkel / bubbles" },
  { name: "Bottaro anchorage", island: "Panarea islets", lat: 38.63795, lng: 15.11025, type: "Day stop", use: "Snorkel / hydrothermal" },
  { name: "Dattilo", island: "Panarea islets", lat: 38.63860, lng: 15.09990, type: "Day stop", use: "Diving / snorkel" },
  { name: "Basiluzzo (E coast)", island: "Panarea islets", lat: 38.66498, lng: 15.11052, type: "Buoy field", use: "Day stop" },
  { name: "Filicudi Porto", island: "Filicudi", lat: 38.56167, lng: 14.58567, type: "Port / anchorage + buoys", use: "Main overnight" },
  { name: "Pecorini a Mare", island: "Filicudi", lat: 38.55800, lng: 14.56500, type: "Mooring buoys (15)", use: "Overnight" },
  { name: "Montenassari (Filicudi W)", island: "Filicudi", lat: 38.55700, lng: 14.54900, type: "Day anchorage", use: "Snorkel stop" },
  { name: "Marina Lunga / Pignataro", island: "Lipari", lat: 38.47333, lng: 14.95733, type: "Marina / full services", use: "Main marina" },
  { name: "Marina Corta", island: "Lipari", lat: 38.46508, lng: 14.95858, type: "Port / outer anchorage", use: "Town stop" },
  { name: "Valle Muria / Praia di Vinci", island: "Lipari", lat: 38.45000, lng: 14.93800, type: "Free anchorage", use: "Swim / snorkel stop" },
  { name: "Punta Perciato e Formiche", island: "Lipari", lat: 38.44612, lng: 14.94183, type: "Free anchorage", use: "Best SW Lipari stop" },
  { name: "Canneto / Porticello", island: "Lipari", lat: 38.50000, lng: 14.96400, type: "Free anchorage", use: "Snorkeling" },
  { name: "Porto di Levante", island: "Vulcano", lat: 38.41730, lng: 14.96127, type: "Marina + buoy field", use: "Main port" },
  { name: "Porto di Ponente", island: "Vulcano", lat: 38.41967, lng: 14.95383, type: "Anchorage + buoys", use: "Beach / swim" },
  { name: "Vulcano W coast (Cavallo)", island: "Vulcano", lat: 38.39300, lng: 14.94300, type: "Day anchorage", use: "Cave / pool snorkel" },
  { name: "Santa Marina Salina", island: "Salina", lat: 38.55283, lng: 14.87233, type: "Marina + anchorage", use: "Main port" },
  { name: "Pollara Bay", island: "Salina", lat: 38.58000, lng: 14.80470, type: "Free anchorage", use: "Calm-weather / iconic" },
  { name: "Malfa", island: "Salina", lat: 38.57300, lng: 14.83800, type: "Anchorage + buoys", use: "Day stop" },
  { name: "Scari (San Vincenzo)", island: "Stromboli", lat: 38.79717, lng: 15.24083, type: "Port / temp mooring", use: "Main stop" },
  { name: "Ficogrande / Punta Lena", island: "Stromboli", lat: 38.80767, lng: 15.23850, type: "Anchorage + buoys", use: "Overnight" },
  { name: "Alicudi Porto", island: "Alicudi", lat: 38.53900, lng: 14.35100, type: "Buoys + anchorage", use: "Main stop" }
];

// Popular recreational boat routes (classic Aeolian charter loops).
const BOAT_ROUTES = [
  {
    name: "Lipari – Vulcano – Salina loop", color: "#7cc4ff",
    points: [
      [38.47333, 14.95733], [38.46508, 14.95858], [38.45000, 14.93800],
      [38.44612, 14.94183], [38.41967, 14.95383], [38.41730, 14.96127],
      [38.55283, 14.87233], [38.58000, 14.80470], [38.47333, 14.95733]
    ]
  },
  {
    name: "Panarea & islets day route", color: "#c4a6ff",
    points: [
      [38.63768, 15.07653], [38.62133, 15.05633], [38.62533, 15.06750],
      [38.63860, 15.09990], [38.63795, 15.11025], [38.63890, 15.11280],
      [38.66498, 15.11052], [38.63768, 15.07653]
    ]
  },
  {
    name: "Filicudi western route", color: "#ffcf8f",
    points: [
      [38.56167, 14.58567], [38.55800, 14.56500], [38.55700, 14.54900],
      [38.582405, 14.521094], [38.557313, 14.588502]
    ]
  },
  {
    name: "Stromboli evening route", color: "#ff9f9f",
    points: [
      [38.79717, 15.24083], [38.80767, 15.23850], [38.8173, 15.2519]
    ]
  }
];

// Proximity thresholds (metres) for swim vs tender classification.
const PROXIMITY = { swim: 400, tender: 1500 };
