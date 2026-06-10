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

// Feature types for snorkel sites (beaches distinguished for the parasol icon).
const FEATURE_TYPES = {
  snorkel: { label: "Snorkel site", glyph: "≈" },
  beach:   { label: "Beach",        glyph: "⛱" }
};

// Access model: shore = walk-in possible; boat = anchor & swim only.
const SITES = [
  // ---------------- PANAREA ----------------
  {
    id: "cala-junco", name: "Cala Junco", island: "Panarea",
    lat: 38.625685, lng: 15.063242, approx: false,
    type: "snorkel", depth: 8, depthText: "5–12 m — volcanic basalt seabed",
    access: "shore", anchorage: "Outside the cove in 5–10 m sand; swim in",
    see: "Volcanic amphitheatre of dark basalt forming a natural pool; dense sea bream and wrasse; octopus and moray eels; exceptional underwater light.",
    notes: "30-min walk from San Pietro pier. Go before 9am or after 5pm to beat crowds. No restrictions; enter by swimming only — no boat entry.",
    desc: "The jewel of Panarea — a volcanic amphitheatre bay with emerald water over a stony seabed and some of the best snorkelling in the archipelago.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["Lonely Planet — Cala Junco", "https://www.lonelyplanet.com/italy/sicily/panarea/attractions/cala-junco/a/poi-sig/1397095/359996"]]
  },
  {
    id: "cala-zimmari", name: "Cala Zimmari", island: "Panarea",
    lat: 38.628801, lng: 15.066016, approx: false,
    type: "beach", depth: 5, depthText: "3–8 m — distinctive red sand",
    access: "shore", anchorage: "Just off the beach in 5–8 m",
    see: "Distinctive red volcanic sand; calm sheltered water; sea bream and wrasse; easy entry for snorkelling over sandy seabed.",
    notes: "Only sandy beach on Panarea. 20-min walk from San Pietro port. No restrictions.",
    desc: "Panarea's only sandy beach — distinctive red volcanic sand, calm sheltered water and easy snorkelling, 20 minutes' walk from the port.",
    sources: [["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"], ["Lonely Planet — Panarea", "https://www.lonelyplanet.com/italy/sicily/panarea"]]
  },
  {
    id: "calcara-fumaroles", name: "Spiaggia della Calcara", island: "Panarea",
    lat: 38.645653, lng: 15.074647, approx: false,
    type: "snorkel", depth: 2, depthText: "0–3 m — shore fumaroles",
    access: "shore", anchorage: "Ditella dock / Panarea Nord buoy field",
    see: "Volcanic gases bubbling up through the seabed and rock cracks; hot steam venting from beach fissures; eerie and unique.",
    notes: "Active fumarole beach — 20-min walk from San Pietro towards Ditella. Don't dig into vent sediment or touch vent centres.",
    desc: "An active fumarole beach where volcanic gases bubble up through the seabed and rock cracks — eerie and unique, 20 minutes from San Pietro.",
    sources: [["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"], ["Smithsonian GVP — Panarea", "https://volcano.si.edu/showreport.cfm?doi=10.5479%2Fsi.GVP.BGVN200210-211041"]]
  },

  // ---------------- PANAREA ISLETS ----------------
  {
    id: "lisca-bianca-bottaro", name: "Lisca Bianca / Bottaro Fumaroles", island: "Panarea islets",
    lat: 38.638300, lng: 15.110300, approx: true,
    type: "snorkel", depth: 9, depthText: "5–13 m — volcanic gas vents",
    access: "boat", anchorage: "Between the two islets (5–13 m sand)",
    see: "Volcanic CO₂ vents bubbling vigorously from the sandy seabed; milky water near vent centres; the Grotta degli Innamorati (Lovers' Arch) swim-through on Lisca Bianca.",
    notes: "Anchor between the two islets. No landing on either. Limit time at vent centres. Gas caution: sulphur present. Note: a 19th-century English merchant ship lies at ~43 m on the east side of the anchorage — bow, propeller and large groupers; scuba only.",
    desc: "The most spectacular underwater fumarole field in the archipelago — CO₂ vents cascade bubbles between two islets, plus a Lovers' Arch swim-through.",
    sources: [["UNESCO Smart Education — Lisca Bianca", "https://www.smarteducationunescosicilia.it/en/isole-eolie/the-underwater-fumarolic-activity-of-lisca-bianca/"], ["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"]]
  },
  {
    id: "dattilo", name: "Dattilo", island: "Panarea islets",
    lat: 38.638400, lng: 15.099500, approx: false,
    type: "snorkel", depth: 10, depthText: "5–15 m — volcanic rock formations",
    access: "boat", anchorage: "Off the east coast (5–13 m sand)",
    see: "Tall narrow volcanic islet; interesting rock formations and cave passages below the waterline; colourful sponges and algae in clear water.",
    notes: "No landing; navigate carefully around shallow rocks. Best combined with Lisca Bianca in a single boat day.",
    desc: "A tall narrow volcanic islet east of San Pietro with rock formations below the waterline — best combined with Lisca Bianca fumaroles in one day.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },
  {
    id: "basiluzzo", name: "Basiluzzo", island: "Panarea islets",
    lat: 38.663690, lng: 15.113470, approx: false,
    type: "snorkel", depth: 7.5, depthText: "7.5 m — Roman navalia ruins",
    access: "boat", anchorage: "East coast (9–14 m sand/stone)",
    see: "Roman boathouse (navalia) ruins at 7.5 m encrusted with gorgonians and sponges; visible from the surface on calm days; sheer cliffs above emerald water.",
    notes: "Uninhabited volcanic islet. Landing on the east beach only — path is landslide-prone. No formal dive ban on surrounding water.",
    desc: "Uninhabited volcanic islet with Roman ruins and an ancient boat-house visible on the seabed at 7.5 m — the only snorkelable Roman archaeology in the archipelago.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },

  // ---------------- LIPARI ----------------
  {
    id: "spiaggia-asino", name: "Spiaggia dell'Asino", island: "Vulcano",
    lat: 38.370390, lng: 14.997942, approx: false,
    type: "snorkel", depth: 8, depthText: "5–12 m — rocky seabed under black cliffs",
    access: "shore", anchorage: "Off the cove in 8–14 m",
    see: "Crystal-clear water over a rocky volcanic seabed under black cliffs; sea bream and wrasse; extraordinary isolation for a Lipari beach.",
    notes: "Steep descent on foot from the road above (Vulcano's south side, near Cannitello) or by boat/water taxi from Porto Levante. No restrictions.",
    desc: "A secluded cove under black cliffs on Vulcano's southern shore — crystal-clear water over a rocky seabed, reachable on foot (steep descent) or by boat.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["sicilia.info — Lipari", "https://www.sicilia.info/en/aeolian-islands/lipari/"]]
  },
  {
    id: "valle-muria", name: "Valle Muria", island: "Lipari",
    lat: 38.460500, lng: 14.933837, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — dark volcanic sand and tuff caves",
    access: "shore", anchorage: "Valle Muria bay (8–15 m sand)",
    see: "Dark volcanic beach flanked by Pietra Lunga and Pietra Menalda sea stacks; fumaroles; small tuff caves to explore; extraordinary volcanic geology.",
    notes: "25-min hike from Quattrocchi viewpoint. Confirm land access before visiting — path intermittently closed. Boat access always reliable.",
    desc: "A dark volcanic beach between two iconic sea stacks on Lipari's wild west coast, with fumaroles and tuff caves to snorkel.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["GetYourGuide — Aeolian snorkeling", "https://www.getyourguide.com/aeolian-islands-l3446/snorkeling-tc57/"]]
  },
  {
    id: "pumice-canyon", name: "Pumice Canyon (Punta Castagna)", island: "Lipari",
    lat: 38.512566, lng: 14.959444, approx: false,
    type: "beach", depth: 8, depthText: "5–12 m — white pumice seabed",
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
    type: "snorkel", depth: 2, depthText: "0–3 m — volcanic fumaroles from below",
    access: "shore", anchorage: "Porto di Levante (5–6 m sand/mud)",
    see: "Volcanic fumaroles heating the sea from below; milky-coloured water near shore; curtains of CO₂ bubbles rising from the black sand seabed.",
    notes: "Do not wear silver jewellery — it tarnishes instantly. Water near vent centres can be very hot. Easy walk from Porto Levante. Free.",
    desc: "Volcanic fumaroles heat the sea from below at this otherworldly black-sand beach — a natural warm jacuzzi a short walk from Porto Levante.",
    sources: [["HotSpringsGuides — Vulcano", "https://www.hotspringsguides.com/hot-springs/thermal-springs-vulcano-island-italy"], ["Tripadvisor — Acque Calde", "https://www.tripadvisor.com/Attraction_Review-g642173-d21169876-Reviews-Spiaggia_delle_Acque_Calde-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "grotta-cavallo", name: "Grotta del Cavallo", island: "Vulcano",
    lat: 38.402622, lng: 14.939964, approx: false,
    type: "snorkel", depth: 5, depthText: "2–8 m in cave",
    access: "boat", anchorage: "Bay south of the cave (5–12 m sand)",
    see: "Spectacular sea cave on Vulcano's NW coast; light refracts through a natural siphon creating dazzling colour effects; adjacent to the Piscina di Venere.",
    notes: "Depart from Porto Levante or Spiagge Nere. Exposed west coast — calm weather essential. Boat only.",
    desc: "A spectacular sea cave on Vulcano's NW coast where light refracts through a natural siphon, creating dazzling colour effects — adjacent to the Piscina di Venere.",
    sources: [["Loveolie — Grotta del Cavallo", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-del-cavallo"], ["Tripadvisor — Piscina di Venere", "https://www.tripadvisor.com/Attraction_Review-g642173-d17727014-Reviews-Piscina_Di_Venere-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "piscina-venere", name: "Piscina di Venere (Venus Pool)", island: "Vulcano",
    lat: 38.403700, lng: 14.938900, approx: true,
    type: "snorkel", depth: 3, depthText: "1–5 m — completely enclosed rock pool",
    access: "boat", anchorage: "Bay south of the caves (5–12 m sand)",
    see: "A natural tuff-and-basalt rock pool completely enclosed from the sea; extraordinary turquoise colour; one of Italy's most beautiful natural pools.",
    notes: "Boat access only from Porto Levante or Spiagge Nere. Calm weather essential on this exposed west coast.",
    desc: "One of Italy's most beautiful natural pools — a completely enclosed turquoise rock pool of tuff and basalt on Vulcano's wild NW coast.",
    sources: [["Tripadvisor — Piscina di Venere", "https://www.tripadvisor.com/Attraction_Review-g642173-d17727014-Reviews-Piscina_Di_Venere-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"], ["Loveolie — Grotta del Cavallo", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-del-cavallo"]]
  },
  {
    id: "spiaggia-gelso", name: "Spiaggia di Gelso", island: "Vulcano",
    lat: 38.369544, lng: 14.994758, approx: false,
    type: "beach", depth: 8, depthText: "5–15 m — drops quickly to vivid blue",
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
    type: "snorkel", depth: 8, depthText: "5–10 m — submerged crater walls",
    access: "shore", anchorage: "Between Punta Perciato & the Faraglione (5–10 m)",
    see: "Submerged volcanic crater topography; volcanic sconcassi gas seeps; Il Postino filmset cliffs above; swim right to reach the Arco del Perciato sea arch.",
    notes: "150 steps down from Pollara village. Exposed to W/NW swell — fair-weather only. Richest underwater landscape on Salina.",
    desc: "Il Postino beach inside a collapsed volcanic crater — Salina's richest underwater landscape, with submerged crater walls and volcanic gas seeps.",
    sources: [["Navily — Spiaggia della Pollara", "https://www.navily.com/mouillage/spiaggia-della-pollara/7621"], ["turismoeolie — Boating Salina", "http://aeolianislands.turismoeolie.com/boating-salina/"]]
  },
  {
    id: "arco-perciato", name: "Arco del Perciato", island: "Salina",
    lat: 38.582725, lng: 14.806819, approx: false,
    type: "snorkel", depth: 2, depthText: "1–3 m at arch base",
    access: "boat", anchorage: "Pollara Bay (immediately south)",
    see: "Dramatic lava arch at water level; algae and anemones on the base; frames Pollara Bay behind; swimmable from the beach.",
    notes: "Reachable from the Balate steps or by boat from Pollara Bay. A recent rockfall may have reduced clearance — check locally.",
    desc: "A dramatic lava arch at the north end of Pollara Bay — swimmable and reachable from the Balate steps or by dinghy from the anchorage.",
    sources: [["Tripadvisor — Arco di Punta Perciato", "https://www.tripadvisor.com/Attraction_Review-g12161917-d18148393-Reviews-Arco_Naturale_DI_Punta_Perciato-Pollara_Malfa_Isola_di_Salina_Aeolian_Islands_.html"], ["Mammasantina — Salina by boat", "https://mammasantina.it/en/salina-aeolian-islands/around-the-salina-by-boat.html"]]
  },
  {
    id: "spiaggia-rinella", name: "Spiaggia di Rinella", island: "Salina",
    lat: 38.547960, lng: 14.829794, approx: false,
    type: "beach", depth: 8, depthText: "5–12 m — large fish in good visibility",
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
    type: "snorkel", depth: 10, depthText: "5–15 m around the base",
    access: "boat", anchorage: "Ficogrande buoy field (~1.5 km dinghy ride)",
    see: "Ancient basalt volcanic chimney; vertical walls colonised by gorgonians, sponges and bryozoans; rich marine life; deep blue clarity.",
    notes: "Integral Nature Reserve — landing PROHIBITED. Snorkelling the surrounding water is permitted. Boat trips depart May–Oct.",
    desc: "Ancient volcanic sea stack 2 km NE of Stromboli — rich marine life around its base in exceptional visibility. Landing prohibited; snorkel from the boat.",
    sources: [["Wikipedia — Strombolicchio", "https://en.wikipedia.org/wiki/Strombolicchio"], ["italia.it — Strombolicchio", "https://www.italia.it/en/sicily/strombolicchio"]]
  },
  {
    id: "sciara-fuoco", name: "Sciara del Fuoco", island: "Stromboli",
    lat: 38.801253, lng: 15.205180, approx: false,
    type: "snorkel", depth: 10, depthText: "5–15 m — volcanic rocky seabed",
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
    type: "snorkel", depth: 6, depthText: "0–10 m inside; seabed visible",
    access: "boat", anchorage: "Pecorini a Mare buoy field",
    see: "Largest sea cave in the Aeolians — 20m high, 30m wide; spectacular light effects and stalactites; extraordinary colour inside.",
    notes: "SW coast of Filicudi. Watch the current on the way back out. Inner chamber was restricted 2021–22 for rockfall risk — confirm locally before entering.",
    desc: "The largest sea cave in the Aeolians — 20m high and 30m wide on Filicudi's SW coast, with spectacular light effects and stalactites.",
    sources: [["Loveolie — Grotta del Bue Marino", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-bue-marino"], ["Tripadvisor — Grotta del Bue Marino", "https://www.tripadvisor.com/Attraction_Review-g675109-d15683279-Reviews-Grotta_del_bue_marino-Filicudi_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "la-canna", name: "La Canna", island: "Filicudi",
    lat: 38.582405, lng: 14.521094, approx: false,
    type: "snorkel", depth: 17, depthText: "5–20 m around the base",
    access: "boat", anchorage: "Off Montenassari rock (12–16 m); 1.6 km offshore",
    see: "71 m volcanic sea stack; crystal-clear water with groupers, amberjacks and lobster at the base; walls vanishing into deep blue.",
    notes: "Protected nature reserve — landing prohibited. Snorkel from the boat. Seas can be rough — assess from anchorage before going.",
    desc: "A 71 m volcanic sea stack NW of Filicudi — crystal-clear water at the base with groupers, amberjacks and lobster. Landing prohibited; snorkel from the boat.",
    sources: [["Loveolie — La Canna", "https://www.loveolie.com/en/attractions/mare-eolie/la-canna"], ["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"]]
  },
  {
    id: "capo-graziano", name: "Capo Graziano / Secca", island: "Filicudi",
    lat: 38.557313, lng: 14.588502, approx: false,
    type: "snorkel", depth: 15, depthText: "5–20 m — 7 shipwrecks Bronze Age to 17th C",
    access: "boat", anchorage: "Filicudi Porto buoy field (~100 m)",
    see: "At least 9 Greek and Roman ships plus 2 early-20th-century wrecks on this shallow — finds spanning the 2nd century BC to a 17th-century Spanish galleon; clouds of fish; sea-whips and shrimps in caves; snorkelable reef crest at 5–10 m.",
    notes: "The most important underwater archaeological site in the Aeolians. Snorkelling the outer reef crest (5–10 m) is free; formal dives are guided/scuba. Advanced certification required for the deeper Roman wreck. Reef is a boat hazard — approach by dinghy.",
    desc: "The most important underwater archaeological site in the Aeolians — at least 9 Greek and Roman wrecks plus 2 early-20th-century vessels, with finds from the 2nd century BC to a Spanish galleon.",
    sources: [["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"], ["VisitSicily — Underwater Archaeology", "https://www.visitsicily.info/en/itinerario/underwater-archaeology-routes/"]]
  },
  {
    id: "grotta-gamberi", name: "Grotta dei Gamberi", island: "Filicudi",
    lat: 38.554500, lng: 14.552000, approx: true,
    type: "snorkel", depth: 20, depthText: "Entrance walls ~18–20 m — freedive territory",
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
    type: "snorkel", depth: 10, depthText: "5–15 m; drops off quickly",
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

// Proximity thresholds (metres) for swim vs tender classification.
const PROXIMITY = { swim: 400, tender: 1500 };

// ===================================================================
// Travel-tip POIs — restaurants, bars, beaches, attractions, island
// overviews. Compiled from Adventurous Kate and Google Maps.
// (Snorkel sites are in SITES above; these are general travel tips.)
// ===================================================================
const POI_TYPES = {
  island:         { label: "Island overview",  glyph: "⊙", color: "#64748b" },
  restaurant:     { label: "Restaurant",        glyph: "⊕", color: "#e07832" },
  bar_hotel:      { label: "Bar & hotel",        glyph: "◈", color: "#9b59b6" },
  bar_cafe:       { label: "Bar & café",         glyph: "◈", color: "#9b59b6" },
  bar_restaurant: { label: "Bar & restaurant",   glyph: "⊕", color: "#e07832" },
  winery:         { label: "Winery",             glyph: "◆", color: "#8e44ad" },
  bakery:         { label: "Bakery",             glyph: "◇", color: "#e07832" },
  ice_cream:      { label: "Ice cream",          glyph: "◇", color: "#e07832" },
  beach:               { label: "Beach",              glyph: "⛱", color: "#0ea5e9" },
  attraction:          { label: "Attraction",         glyph: "★", color: "#f59e0b" },
  viewpoint_swim:      { label: "Viewpoint / swim",   glyph: "◉", color: "#10b981" },
  sport:               { label: "Sport facility",     glyph: "◎", color: "#3b82f6" },
  cliff_jump:          { label: "Cliff / rock jump",  glyph: "▼", color: "#ef4444" },
  shipwreck:           { label: "Shipwreck",          glyph: "⊗", color: "#78716c" },
  restaurant_michelin: { label: "Michelin restaurant",glyph: "⊕", color: "#f59e0b" }
};

const POIS = [
  // ---- Island overviews ----
  { id: "ov-salina", name: "Salina", island: "Salina",
    lat: 38.565280, lng: 14.833330, type: "island",
    notes: "The green island and best base for the Aeolians. Upscale feel with excellent boutique hotels and Malvasia vineyards. Easy to explore by scooter. Several distinct towns — Malfa is the recommended base, also worth visiting Lingua, Pollara, Rinella and Santa Marina. Not overcrowded. Most convenient island for day trips across the archipelago.",
    source: "Adventurous Kate" },
  { id: "ov-stromboli", name: "Stromboli", island: "Stromboli",
    lat: 38.798900, lng: 15.213800, type: "island",
    notes: "The active volcano island. Car-free with black sand beaches that are the best in the Aeolians. Lava eruptions visible nightly. Small restaurant selection. The remote village of Ginostra on the far side has only 15–30 year-round residents. Best visited for 2–3 nights.",
    source: "Adventurous Kate" },
  { id: "ov-panarea", name: "Panarea", island: "Panarea",
    lat: 38.635200, lng: 15.064500, type: "island",
    notes: "The smallest and most expensive island — a longtime celebrity retreat. Very quiet even in high season. Best as a day trip from Stromboli (30 min ferry). The main activity worth doing is hiking to the Bronze Age Prehistoric Village at Punta Milazzese. Beaches are disappointing — Cala Junco is all boulders despite the widespread hype.",
    source: "Adventurous Kate" },
  { id: "ov-lipari", name: "Lipari", island: "Lipari",
    lat: 38.467200, lng: 14.953700, type: "island",
    notes: "Largest island with the most extensive day tour connections. Overtouristed in high season. The main walking street (Corso Vittorio Emanuele II) is pleasant. Worth visiting for logistics and the cat sanctuary, but Salina is a far nicer base.",
    source: "Adventurous Kate" },
  { id: "ov-vulcano", name: "Vulcano", island: "Vulcano",
    lat: 38.404000, lng: 14.962300, type: "island",
    notes: "The sulfurous island — the smell is pervasive and can be overwhelming. Worth visiting for the crater climb (free, views of all 7 islands) and natural swimming spots like Piscina di Venere. Best as a day trip only — not recommended for overnight stays.",
    source: "Adventurous Kate" },
  { id: "ov-alicudi", name: "Alicudi", island: "Alicudi",
    lat: 38.540000, lng: 14.355000, type: "island",
    notes: "The most remote island — no roads, just stairs. No cars, not even golf carts. Transport by donkey. Minimal facilities. Best visited as a day trip paired with Filicudi from Salina or Lipari. Genuinely off-grid.",
    source: "Adventurous Kate" },
  { id: "ov-filicudi", name: "Filicudi", island: "Filicudi",
    lat: 38.571400, lng: 14.581600, type: "island",
    notes: "Second most remote island but more developed than Alicudi — a few settlements and cars allowed. Known for exceptional water clarity. Outstanding for diving and swimming. Good bakery by the port. Worth a multi-night stay for those wanting real peace and quiet.",
    source: "Adventurous Kate" },

  // ---- Restaurants & bars ----
  { id: "rest-il-gambero", name: "Il Gambero", island: "Salina",
    lat: 38.538895, lng: 14.870337, type: "restaurant",
    notes: "Best pane cunzatu and granita in the Aeolians — the locals' pick over the tourist-trap Da Alfredo next door. Also excellent for stuffed calamari alla Malvasia, mixed antipasti and swordfish pasta. The caffè granita con panna with liquid cream is unmissable. Sea-view tables.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-ravesi", name: "Hotel Ravesi Aperitivo", island: "Salina",
    lat: 38.578906, lng: 14.835385, type: "bar_hotel",
    notes: "The best aperitivo in the Aeolians — draws visitors from across the island. Craft cocktails paired with Aeolian snacks including arancini and mini savoury cannolis. Infinity pool overlooking Panarea and Stromboli. Also offers sunset aperitivo cruises for hotel guests.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-fenech", name: "Fenech Winery", island: "Salina",
    lat: 38.577221, lng: 14.843311, type: "winery",
    notes: "Informal and convivial Malvasia wine tasting run by the eccentric Francesco Fenech. Served with Aeolian salad of potatoes, capers, tomatoes and olives. Outstanding Malvasia wines, grappas and limoncello. Just walk in — no reservation needed.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-bar-malvasia", name: "Bar Malvasia", island: "Salina",
    lat: 38.578488, lng: 14.836085, type: "bar_cafe",
    notes: "Casual all-day bar and cafe in Malfa's main square. Good granita, pane cunzatu, seafood plates and house wine. Reliable and affordable, popular with locals. Open 7am–midnight.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-pinnata", name: "La Pinnata del Monsú", island: "Salina",
    lat: 38.580299, lng: 14.830816, type: "restaurant",
    notes: "Quirky high-end dining with sea views run by a local family. Creative Aeolian cuisine — crunchy octopus, tuna with peach and escarole, lemonmisu, caper semifreddo. Intimate and inventive. Book ahead.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-cucunciu", name: "U Cucunciu", island: "Salina",
    lat: 38.578979, lng: 14.835223, type: "restaurant",
    notes: "Pizza and seafood restaurant next to Hotel Ravesi. Excellent pizza including the best gluten-free option on the island. Strong tuna main and prawn pasta. Reliable and well-priced.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-malandrino", name: "Il Malandrino", island: "Stromboli",
    lat: 38.798664, lng: 15.239307, type: "bar_cafe",
    notes: "Granita and coffee right by the port — the first stop after the ferry. Good for breakfast, a quick bite or post-boat-trip drinks. Open from 6am.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-bar-ingrid", name: "Bar Ingrid", island: "Stromboli",
    lat: 38.803227, lng: 15.238224, type: "bar_cafe",
    notes: "Casual bar and terrace with an outstanding view of the sea and Strombolicchio. Good Neapolitan pizza (evenings only), granita and croissants. Popular with locals. Open until 2am.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-da-carola", name: "Bar Da Carola", island: "Panarea",
    lat: 38.637735, lng: 15.076770, type: "bar_cafe",
    notes: "Best granita on Panarea with artisanal flavours including the signature pesca Malvasia (peach and local wine). Right by the port. Note: expensive even by Aeolian standards — expect around €6 per granita. The quality justifies it.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-panarea-bakery", name: "Panarea Bakery", island: "Panarea",
    lat: 38.636462, lng: 15.075970, type: "bakery",
    notes: "Try the pane disgraziata — a sandwich piled with meats and cheeses. Also good arancini, cannoli and pastries. Off the main tourist drag and popular with locals for lunch.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-giardino-lipari", name: "Il Giardino di Lipari", island: "Lipari",
    lat: 38.465473, lng: 14.955079, type: "bar_restaurant",
    notes: "Hidden garden bar in a courtyard off the main street. Interesting craft cocktails are the highlight — the Italian vermouth with orange foam is excellent. Best visited for drinks rather than a full meal. Evenings only.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-officina-mare", name: "Officina di Mare", island: "Lipari",
    lat: 38.469699, lng: 14.954658, type: "restaurant",
    notes: "Best cannoli in Lipari — order to go. Also excellent for swordfish, squid salad and tuna tartare if dining in. On the main Corso Vittorio Emanuele II.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-gelato-antonio", name: "Il Gelato di Antonio", island: "Vulcano",
    lat: 38.412609, lng: 14.958559, type: "ice_cream",
    notes: "The one gelato spot in the Aeolians genuinely worth visiting — a rarity in a region dominated by granita. On the road to the crater. Perfect post-hike stop. Pistachio is the standout.",
    source: "Adventurous Kate / Google Maps" },
  { id: "rest-club-lea", name: "Il Club di Lea", island: "Alicudi",
    lat: 38.534889, lng: 14.360450, type: "restaurant",
    notes: "Home-cooked 4-course meals on a terrace with sea views, steps from the harbour. Run by Lea who also rents rooms. The best food on Alicudi. Reserve ahead — the island has very few options.",
    source: "Adventurous Kate / Google Maps" },

  // ---- Beaches ----
  { id: "beach-spiaggia-lunga", name: "Spiaggia Lunga", island: "Stromboli",
    lat: 38.810701, lng: 15.224417, type: "beach",
    notes: "The best beach in the Aeolian Islands — a long expanse of sparkling black volcanic sand. Kate's top pick overall. Shimmers like diamonds. Not to be confused with the rockier Ficogrande by the port.",
    source: "Adventurous Kate / Google Maps" },

  // ---- Attractions ----
  { id: "poi-prehistoric-village", name: "Prehistoric Village Punta Milazzese", island: "Panarea",
    lat: 38.625536, lng: 15.063662, type: "attraction",
    notes: "Bronze Age ruins (14th century BC) with Mycenaean pottery finds suggesting ancient trade links with Crete. Free to visit. 45-min walk from the port via Cala Zimmari. The view of the peninsula from the top is one of the best in the Aeolians.",
    source: "Adventurous Kate / Google Maps" },

  // ---- Restaurants (Lonely Planet / Michelin picks) ----
  { id: "rest-da-pina", name: "Trattoria da Pina", island: "Vulcano",
    lat: 38.369386, lng: 14.993981, type: "restaurant",
    notes: "Family-run trattoria on the sea at Gelso, Vulcano's remote southern tip — Lonely Planet pick. Superb fresh fish, crudo and tagliata di tonno. The jetty in front is a popular low-height jump spot between courses. Reservation recommended; lunch and dinner only.",
    source: "Lonely Planet / Google Maps (verified)" },
  { id: "rest-la-canna-filicudi", name: "Ristorante La Canna", island: "Filicudi",
    lat: 38.562219, lng: 14.578200, type: "restaurant",
    notes: "Lonely Planet's top pick for Filicudi — the restaurant at Hotel La Canna, perched above the port with panoramic views across the archipelago. Pistachio and shrimp pasta, stuffed calamari. Stunning swimming pool next to your table. 15–20 min walk up from the port.",
    source: "Lonely Planet / Google Maps (verified)" },
  { id: "rest-porto-bello", name: "Porto Bello", island: "Salina",
    lat: 38.558361, lng: 14.871652, type: "restaurant",
    notes: "Long-standing Santa Marina Salina institution overlooking the harbour — Lonely Planet pick. Pistachio-crusted swordfish and pasta al fuoco are the signatures. Views to Lipari. Reviews more mixed in recent years; locals also rate Nni Lausta and Didyme nearby.",
    source: "Lonely Planet / Google Maps (verified)" },
  { id: "rest-le-macine", name: "Ristorante Le Macine", island: "Lipari",
    lat: 38.473874, lng: 14.928601, type: "restaurant",
    notes: "Family-run at Pianoconte in the hills of inland Lipari — Lonely Planet pick. They grow their own wheat for pasta, bottle their own wine and brew their own craft beer. Tuna tartare and pistachio-cream fillet are exceptional. Worth the trip out of town; book ahead.",
    source: "Lonely Planet / Google Maps (verified)" },
  { id: "rest-punta-lena", name: "Ristorante Punta Lena", island: "Stromboli",
    lat: 38.805127, lng: 15.240729, type: "restaurant",
    notes: "Stromboli's finest dining — Lonely Planet pick with a sea-view pergola at Ficogrande. Exceptional seafood risotto, local cheeses and pistachio semifreddo with Malvasia. Pricier than the island's casual spots but the setting and quality justify it. Reservation essential.",
    source: "Lonely Planet / Google Maps (verified)" },
  { id: "rest-filippino", name: "Ristorante da Filippino", island: "Lipari",
    lat: 38.468703, lng: 14.956356, type: "restaurant",
    notes: "Lipari institution since 1910 — Michelin-recommended with a shaded pergola in the heart of town. Classic old-school service, comprehensive Sicilian wine list, excellent grilled fish and the famous Risotto Angel. The grande dame of Aeolian dining.",
    source: "Michelin Guide / Google Maps (verified)" },
  { id: "rest-signum", name: "Hotel Signum Restaurant", island: "Salina",
    lat: 38.579196, lng: 14.834199, type: "restaurant_michelin",
    notes: "Salina's Michelin-starred restaurant in Malfa, with chef Martina Caruso. Refined Aeolian tasting menus plus a more casual bistro option. Excellent spa on site. The splurge meal of the archipelago — book well ahead.",
    source: "Michelin Guide / Google Maps (verified)" },

  // ---- Sport ----
  { id: "sport-padel-capofaro", name: "Padel at Tenuta Capofaro", island: "Salina",
    lat: 38.579516, lng: 14.871525, type: "sport",
    notes: "Possibly the most scenic padel court in Italy — surrounded by Malvasia vineyards on the Tasca d'Almerita wine estate at Capo Faro, with the mountain behind and the sea below. Open to non-guests by reservation. Combine with a wine tasting at the estate.",
    source: "Google Maps (verified)" },
  { id: "sport-tennis-lipari", name: "Campo da Tennis Lipari", island: "Lipari",
    lat: 38.475924, lng: 14.951294, type: "sport",
    notes: "Municipal tennis court on Via Borsellino e Falcone — the only publicly listed court in the archipelago. Court management has been subject to local political dispute; check locally that it's open for hire before planning around it.",
    source: "Google Maps (verified)" },

  // ---- Shipwrecks (scuba / technical diving) ----
  { id: "wreck-lisca-bianca", name: "Lisca Bianca Merchant Wreck", island: "Panarea islets",
    lat: 38.639000, lng: 15.113500, type: "shipwreck",
    notes: "19th-century English merchant ship between Lisca Bianca and Bottaro islets — bow at ~43 m with the propeller visible, considered one of Italy's most beautiful wrecks. Large groupers, moray eels and lobsters. Scuba only at depth. The shallow fumarole field in the same anchorage is excellent for snorkellers.",
    source: "Dive centres (exact buoy position on request)" },
  { id: "wreck-capistello", name: "Capistello Wreck (4th-C BC)", island: "Lipari",
    lat: 38.447000, lng: 14.954000, type: "shipwreck",
    notes: "4th-century BC Greek wreck off Punta Capistello on Lipari's south coast, lying at 60–120 m. Its Campanian amphorae (some still corked) are on display in the Lipari Archaeological Museum. Technical divers only — for most visitors this is a museum visit, not a dive.",
    source: "VisitSicily / Google Maps (estimated)" },

  // ---- Cliff / rock jumps ----
  { id: "jump-sirene", name: "Scoglio delle Sirene", island: "Vulcano",
    lat: 38.419500, lng: 14.952500, type: "cliff_jump",
    notes: "Dark rock outcrop just off Spiaggia delle Sabbie Nere in Porto Ponente bay — the easy warm-up jump (3–5 m). Swim out from the beach, scramble up, jump. Low height, deep enough water. Busy in summer — check below before jumping.",
    source: "Google Maps (estimated)" },
  { id: "jump-gelso", name: "Gelso Jetty", island: "Vulcano",
    lat: 38.369300, lng: 14.994200, type: "cliff_jump",
    notes: "Small jetty in front of Trattoria da Pina at Gelso — a popular low-height jump spot with deep clear water, used freely by restaurant guests between courses. Safe and easy. Check below before jumping.",
    source: "Google Maps (estimated)" },
  { id: "jump-channel", name: "Open-Water Boat Jump (Milazzo–Vulcano)", island: "Vulcano",
    lat: 38.330000, lng: 15.000000, type: "cliff_jump",
    notes: "Not a cliff but a 'leap into the void' offered by some boat tours crossing the Milazzo–Vulcano channel — jumping from the upper deck into hundreds of metres of open blue water. A different kind of thrill; varies by skipper and conditions.",
    source: "Approximate — mid-channel; varies by skipper" },
  { id: "jump-praia-vinci", name: "Praia di Vinci Faraglioni", island: "Lipari",
    lat: 38.450000, lng: 14.937000, type: "cliff_jump",
    notes: "Boat-only cove on Lipari's west coast below the faraglioni. Volcanic rock ledges of varying heights (5–10 m) with deep crystal-clear water below — reviewers call it the best swimming and diving area on this coast. Boat access only.",
    source: "Google Maps (estimated)" },
  { id: "jump-pietra-menalda", name: "Pietra Menalda (Faraglione)", island: "Lipari",
    lat: 38.440500, lng: 14.942000, type: "cliff_jump",
    notes: "The smaller (20 m) of Lipari's two famous faraglioni, off the island's SW tip near Punta Perciato — its 80 m sibling Pietra Lunga stands immediately seaward (pair verified on Google Maps at 38.4394, 14.9431). Boat tours anchor here; jumpers use the lower shoulders and ledges (5–15 m depending on route) with deep water all around. The full summit is loose volcanic rock — climbing to the top is genuinely dangerous.",
    source: "Google Maps (Faraglioni di Lipari verified; Menalda offset estimated)" },
  { id: "jump-pietra-bagno", name: "Pietra del Bagno", island: "Lipari",
    lat: 38.474722, lng: 14.895833, type: "cliff_jump",
    notes: "Large isolated rock off Lipari's NW coast facing Salina — a classic boat-trip jump and swim stop. Rock walls drop straight to 25–30 m so the water is deep all around. Boat access only.",
    source: "Google Maps (verified)" },
  { id: "jump-pollara-balate", name: "Le Balate Rocks, Pollara", island: "Salina",
    lat: 38.580500, lng: 14.806500, type: "cliff_jump",
    notes: "Lava rocks and old fishermen's ramps at Le Balate below Pollara village — informal jumping points of varying heights into deep clear water inside the collapsed crater bay. Assess depth and swell on the day; no supervision.",
    source: "Google Maps (estimated)" },
  { id: "jump-faraglione-pollara", name: "Faraglione di Pollara", island: "Salina",
    lat: 38.584800, lng: 14.800500, type: "cliff_jump",
    notes: "The fortress-like stack guarding Pollara bay — deep water on its seaward side with climbable lower ledges (5–12 m). Boat or long swim from Le Balate. The rock is friable tuff — stick to the low ledges locals use.",
    source: "Google Maps (estimated)" },
  { id: "jump-perciato-arch", name: "Arco del Perciato — Top Jump", island: "Salina",
    lat: 38.582700, lng: 14.806800, type: "cliff_jump",
    notes: "Some jumpers leap from the top of the lava arch (8–10 m) into the channel below. Deep water but the landing zone is narrow and the top exposed — only with someone who has done it before and in flat calm conditions. Most visitors just swim through the arch instead.",
    source: "Google Maps — arch verified; jump is informal" },

  // ---- Additional beaches ----
  { id: "spiaggia-canneto", name: "Spiaggia di Canneto", island: "Lipari",
    lat: 38.487022, lng: 14.966370, approx: false,
    type: "beach", depth: 4, depthText: "0–6 m — gentle pebble shelf",
    access: "shore", anchorage: "Canneto / Porticello",
    see: "Long pebble beach with easy entry; pier to jump from; views of Stromboli and the old pumice factory.",
    notes: "Lipari's main beach town — lidos, rentals, shops and restaurants behind. Busy in season; more a local scene than a destination beach.",
    desc: "Lipari's main beach — a long pebble strand at Canneto with lidos, a jumping pier and easy access.",
    sources: [["Google Maps — Spiaggia di Canneto", "https://maps.google.com/?cid=canneto"]] },
  { id: "spiagge-bianche", name: "Spiagge Bianche (Papesca)", island: "Lipari",
    lat: 38.499033, lng: 14.961764, approx: false,
    type: "beach", depth: 4, depthText: "0–6 m — pale pumice seabed",
    access: "shore", anchorage: "Canneto / Porticello",
    see: "Pale pumice pebbles and seabed giving tropical water colour; the old pumice-mining beach.",
    notes: "Also called Spiaggia della Popesca. Steep stair descent from the SP180, or boat shuttle from Canneto (~€8). Lido with loungers; free section too. The 'white' is pale grey.",
    desc: "The former pumice-mining beach north of Canneto, where the pale seabed turns the water turquoise.",
    sources: [["Google Maps — Spiaggia della Popesca", "https://maps.google.com/?cid=popesca"]] },
  { id: "spiaggia-porticello", name: "Spiaggia di Porticello", island: "Lipari",
    lat: 38.517620, lng: 14.960323, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — pebbles below the quarries",
    access: "shore", anchorage: "Canneto / Porticello",
    see: "Pebble beach with crystal-clear water directly below the abandoned pumice quarry works — surreal industrial-archaeology backdrop; obsidian chunks wash up.",
    notes: "Setting is divisive: derelict conveyor belts and quarry buildings loom over the beach. Combine with the Pumice Canyon snorkel just offshore.",
    desc: "Clear-water pebble beach beneath Lipari's abandoned pumice quarries — eerie, photogenic and divisive.",
    sources: [["Google Maps — Porticello Beach", "https://maps.google.com/?cid=porticello"]] },
  { id: "spiaggia-acquacalda", name: "Spiaggia di Acquacalda", island: "Lipari",
    lat: 38.519967, lng: 14.933454, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — wide pebble beach, calm water",
    access: "shore", anchorage: "Canneto / Porticello (around the point)",
    see: "Long, quiet pebble beach on the north shore facing Salina, Panarea and Stromboli; lovely sunsets; small bar-restaurant.",
    notes: "Much quieter than Canneto. Reachable by bus from Lipari town (stop in front). Exposed to N winds — check conditions. Reef shoes recommended.",
    desc: "Lipari's quiet north-shore beach with views to three islands — wide, wild and rarely crowded.",
    sources: [["Google Maps — Spiaggia Acquacalda", "https://maps.google.com/?cid=acquacalda"]] },
  { id: "sabbie-nere", name: "Spiaggia delle Sabbie Nere", island: "Vulcano",
    lat: 38.418600, lng: 14.955500, approx: true,
    type: "beach", depth: 4, depthText: "0–6 m — black sand, gentle shelf",
    access: "shore", anchorage: "Porto di Ponente",
    see: "The Aeolians' signature black-sand crescent; Scoglio delle Sirene just offshore; sunset side of the isthmus.",
    notes: "Vulcano's most famous beach in Porto Ponente bay. Easy walk from Porto Levante. Busy but spacious. Position derived from the beachfront (±50 m).",
    desc: "The iconic black-sand crescent of Porto Ponente — the symbol beach of the Aeolians.",
    sources: [["Lonely Planet Italia — Eolie beaches", "https://www.lonelyplanetitalia.it/articoli/mare-e-spiagge/isole-eolie-spiagge-piu-belle"]] },
  { id: "spiaggia-cannitello", name: "Spiaggia del Cannitello", island: "Vulcano",
    lat: 38.374002, lng: 15.006473, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — black sand, shallow bay",
    access: "shore", anchorage: "Gelso",
    see: "Black-sand half-moon cove east of Gelso; superb seabed for swimming.",
    notes: "CAVEAT: recent visitors report the beach is now run as a paid/private concession with a fee even to walk down, and winter storms have shrunk it badly. The sea is still superb but consider Gelso beach 2 km west instead.",
    desc: "A black-sand cove east of Gelso with a superb seabed — but now fee-charging and storm-shrunk; Gelso may be the better stop.",
    sources: [["Google Maps — Spiaggia del Cannitello", "https://maps.google.com/?cid=cannitello"]] },
  { id: "spiaggia-faro-gelso", name: "Spiaggetta del Faro di Gelso", island: "Vulcano",
    lat: 38.367300, lng: 14.992200, approx: true,
    type: "beach", depth: 5, depthText: "0–8 m — smooth boulders",
    access: "shore", anchorage: "Gelso",
    see: "Tiny, rarely visited cove by the Gelso lighthouse; large sea-smoothed boulders as natural seats.",
    notes: "Small and uncrowded even in August. Rocky entry — reef shoes help. Lighthouse verified at 38.36714, 14.99169; cove adjacent.",
    desc: "A tiny boulder cove beneath the Gelso lighthouse — one of Vulcano's quietest corners.",
    sources: [["Lonely Planet Italia — Eolie beaches", "https://www.lonelyplanetitalia.it/articoli/mare-e-spiagge/isole-eolie-spiagge-piu-belle"]] },
  { id: "spiaggia-ficogrande", name: "Spiaggia di Ficogrande", island: "Stromboli",
    lat: 38.806248, lng: 15.238680, approx: false,
    type: "beach", depth: 4, depthText: "0–6 m — black sand and pebbles",
    access: "shore", anchorage: "Ficogrande / Punta Lena",
    see: "Black volcanic beach facing Strombolicchio; hot black sand; crystal-clear water (jellyfish possible early season).",
    notes: "Rockier entry than Spiaggia Lunga — water shoes useful. Lidos and kayak rental in season.",
    desc: "Stromboli's main black beach at Ficogrande, looking straight out at Strombolicchio.",
    sources: [["Google Maps — Ficogrande", "https://maps.google.com/?cid=ficogrande"]] },
  { id: "spiaggia-lingua", name: "Spiaggia di Lingua", island: "Salina",
    lat: 38.539400, lng: 14.870000, approx: false,
    type: "beach", depth: 4, depthText: "0–6 m — pebbles and natural rock pools",
    access: "shore", anchorage: "Santa Marina Salina (2.5 km)",
    see: "Pebble beach along the car-free lungomare by the lighthouse and old salt lagoon; natural rock-pool swimming; birdlife on the lagoon.",
    notes: "Flat walk or cycle from Santa Marina. Free umbrellas on part of the beach. Granita at Il Gambero afterwards is mandatory.",
    desc: "Pebble beach and natural rock pools beside Lingua's salt lagoon — pair a swim with the Aeolians' best granita.",
    sources: [["Google Maps — Lungomare di Lingua", "https://maps.google.com/?cid=lingua"]] },
  { id: "spiaggia-pecorini", name: "Pecorini a Mare", island: "Filicudi",
    lat: 38.558900, lng: 14.565400, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — pebbles, very clear water",
    access: "shore", anchorage: "Pecorini a Mare buoy field",
    see: "Pebble shore of Filicudi's prettiest hamlet; exceptionally clear water; fishing boats pulled up on the stones.",
    notes: "Sleepy and beautiful. A couple of restaurants behind the beach.",
    desc: "The pebble waterfront of Pecorini a Mare — Filicudi's prettiest hamlet with glass-clear water.",
    sources: [["Google Maps — Pecorini a Mare", "https://maps.google.com/?cid=pecorini"]] },
  { id: "spiaggia-bazzina", name: "Spiaggia di Bazzina", island: "Alicudi",
    lat: 38.548052, lng: 14.366282, approx: false,
    type: "beach", depth: 5, depthText: "0–8 m — wild pebble cove",
    access: "shore", anchorage: "Alicudi (N of the port)",
    see: "Alicudi's only real beach — medium pebbles, clear water, near-total solitude even in season.",
    notes: "~1 km walk north from the port on a clear stepped path past the church (~50 min), or by boat. No facilities at all. Seabed slightly silty.",
    desc: "A wild, facility-free pebble cove on Alicudi's NE coast — you'll likely have it to yourself.",
    sources: [["Google Maps — Spiaggia Bazzina", "https://maps.google.com/?cid=bazzina"]] }
];
