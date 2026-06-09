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
  // ---------------- LIPARI ----------------
  {
    id: "spiaggia-bianca", name: "Spiaggia Bianca (Pumice White Beach)", island: "Lipari",
    lat: 38.510, lng: 14.966, approx: true,
    type: "beach_snorkel", depth: 8, depthText: "5–10 m — white pumice seabed",
    access: "shore", anchorage: "Porticello / Canneto bay",
    see: "Brilliant white pumice-powder seabed turning the water vivid turquoise; old quarry loading pontoons to swim around; mullet and sea bream; water slightly warm from residual pumice.",
    notes: "Free public beach, no restrictions. Reachable on foot from Canneto or by boat.",
    desc: "The most distinctively coloured snorkel spot in Lipari, where centuries of pumice quarrying left a ghostly white seabed glowing through turquoise water.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["sicilia.info — Lipari", "https://www.sicilia.info/en/aeolian-islands/lipari/"]]
  },
  {
    id: "praia-vinci", name: "Spiaggia Praia di Vinci", island: "Lipari",
    lat: 38.440, lng: 14.940, approx: true,
    type: "cove_snorkel", depth: 12, depthText: "8–15 m — clear sandy bottom",
    access: "boat", anchorage: "Off the beach in 8–15 m sand",
    see: "Sandy/pebbly seabed in exceptional visibility, posidonia meadows, sea bream and mullet, a volcanic rock wall to the north; the Faraglioni stacks and Vulcano's crater frame the horizon.",
    notes: "No restrictions; reachable only by boat — no land access.",
    desc: "An unspoilt sandy cove at Lipari's south tip, reachable only by sea, with crystal-clear water and the Faraglioni towering nearby.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["SailScanner — Aeolian Islands", "https://sailscanner.ai/destinations/mediterranean/sailing-in-italy/sailing-in-the-aeolian-islands/"]]
  },
  {
    id: "faraglioni-lipari", name: "Faraglioni di Lipari (Pietra Lunga & Menalda)", island: "Lipari",
    lat: 38.435, lng: 14.930, approx: true,
    type: "stack", depth: 12, depthText: "5–15 m around the bases",
    access: "boat", anchorage: "Praia di Vinci (8–15 m sand)",
    see: "Two basalt sea stacks rising from the strait; bases encrusted with sponges and gorgonians; wrasse, blennies and sea bream in the crevices; dramatic upward views to the columns.",
    notes: "No landing on the stacks; channel current can be strong — assess from the boat.",
    desc: "Pietra Lunga and Pietra Menalda are among the most photogenic formations in the archipelago; snorkelling their bases reveals rich encrustation and volcanic boulder topography.",
    sources: [["GetYourGuide — Faraglioni di Lipari", "https://www.getyourguide.com/faraglioni-di-lipari-l203482/"], ["Airial Travel — Pietra Lunga & Menalda", "https://airial.travel/attractions/italy/faraglioni-pietra-lunga-and-menalda-PNKJ1TZi"]]
  },
  {
    id: "arco-angeli", name: "Arco degli Angeli & Valle Muria", island: "Lipari",
    lat: 38.453, lng: 14.903, approx: true,
    type: "arch", depth: 9, depthText: "5–12 m, sand & boulders",
    access: "boat", anchorage: "Valle Muria bay (8–15 m sand)",
    see: "A volcanic rock arch at water level; red/orange/black coloured walls; small caves and tunnels; gorgonians on the rock; the arch frames the open sea.",
    notes: "No restrictions; exposed west coast — calm weather essential.",
    desc: "Lipari's wild west coast, where the Arco degli Angeli natural arch — 'coloured walls, countless caves and passages' — is accessible only by sea.",
    sources: [["Sailogy — Best Shores in Lipari", "https://www.sailogy.com/en/blog/the-best-shores-in-lipari/"], ["GetYourGuide — Aeolian snorkeling", "https://www.getyourguide.com/aeolian-islands-l3446/snorkeling-tc57/"]]
  },

  // ---------------- VULCANO ----------------
  {
    id: "acque-calde", name: "Acque Calde (Spiaggia delle Fumarole)", island: "Vulcano",
    lat: 38.408, lng: 14.970, approx: true,
    type: "thermal_bubble", depth: 2, depthText: "0–3 m — wade in / surface vents",
    access: "shore", anchorage: "Porto di Levante (5–6 m sand/mud)",
    see: "Curtains of CO₂ and sulphur bubbles rising from the seabed metres from your feet — a natural jacuzzi; milky-turquoise warm water near vents; black sand.",
    notes: "Wear reef shoes — water near vent centres can be very hot; don't put your face under (sulphur). Mud-bath pool intermittently closed since 2020; the beach vents stay open. Free.",
    desc: "One of the easiest and most surreal thermal snorkels in the Mediterranean: wade into Baia di Levante amid a continuous curtain of volcanic bubbles. Best at dawn.",
    sources: [["HotSpringsGuides — Vulcano", "https://www.hotspringsguides.com/hot-springs/thermal-springs-vulcano-island-italy"], ["Tripadvisor — Acque Calde", "https://www.tripadvisor.com/Attraction_Review-g642173-d21169876-Reviews-Spiaggia_delle_Acque_Calde-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicil.html"]]
  },
  {
    id: "grotta-cavallo", name: "Grotta del Cavallo & Piscina di Venere", island: "Vulcano",
    lat: 38.393, lng: 14.942, approx: true,
    type: "sea_cave", depth: 5, depthText: "2–8 m in cave & pool",
    access: "boat", anchorage: "Bay to the south (5–12 m sand)",
    see: "A three-entrance sea cave with stalactites and dome vaults flooding with azure light; next door the Piscina di Venere — a vivid emerald natural lava pool, extraordinarily shallow.",
    notes: "Boat access only; exposed west coast, calm weather advised. Some safety notices on the pool — assess locally; tours routinely stop here.",
    desc: "The finest sea-cave + natural-pool combination in the archipelago: azure cave light beside a picture-perfect emerald lava swimming hole.",
    sources: [["Loveolie — Grotta del Cavallo", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-del-cavallo"], ["Tripadvisor — Piscina di Venere", "https://www.tripadvisor.com/Attraction_Review-g642173-d17727014-Reviews-Piscina_Di_Venere-Isola_Vulcano_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "grotta-lavica", name: "Grotta Lavica (Blue Grotto)", island: "Vulcano",
    lat: 38.397, lng: 14.983, approx: true,
    type: "sea_cave", depth: 3, depthText: "0–5 m — enter at surface",
    access: "boat", anchorage: "Porto di Levante / dinghy from sea",
    see: "A lava-formed sea cave glowing blue-turquoise from light entering below the waterline; walls encrusted with red and orange algae.",
    notes: "Dinghy access, calm seas required. No formal restrictions noted.",
    desc: "Vulcano's 'blue grotto': a lava sea cave on the east coast where submarine light turns the interior a glowing blue. Often paired with Grotta del Cavallo.",
    sources: [["GetYourGuide — Lipari & Vulcano snorkel", "https://www.getyourguide.com/lipari-l108622/snorkeling-tc57/"]]
  },

  // ---------------- SALINA ----------------
  {
    id: "pollara", name: "Pollara Bay (snorkel inside a crater)", island: "Salina",
    lat: 38.5800, lng: 14.8047, approx: false,
    type: "cove_snorkel", depth: 8, depthText: "5–10 m, rock & sand",
    access: "shore", anchorage: "Between Punta Perciato & the Faraglione (5–10 m)",
    see: "The submerged half of an ancient volcanic crater — unusual lava-rock topography; posidonia on sand patches; octopus and moray eels; the Il Postino filmset cliffs above.",
    notes: "Free public anchorage, open to W/NW swell — fair-weather only. Path down from Pollara village.",
    desc: "Snorkel literally inside the remains of a collapsed prehistoric volcano, with dramatic vertical crater walls above matched by lava formations below.",
    sources: [["Navily — Spiaggia della Pollara", "https://www.navily.com/mouillage/spiaggia-della-pollara/7621"], ["turismoeolie — Boating Salina", "http://aeolianislands.turismoeolie.com/boating-salina/"]]
  },
  {
    id: "punta-perciato-salina", name: "Punta Perciato — Natural Arch", island: "Salina",
    lat: 38.585, lng: 14.802, approx: true,
    type: "arch", depth: 2, depthText: "1–3 m at the arch base",
    access: "boat", anchorage: "Pollara Bay (immediately south)",
    see: "A sea-sculpted volcanic arch at sea level — once big enough for small boats to pass through; algae and anemones on the base; frames Pollara Bay behind.",
    notes: "Boat/kayak only; a recent rockfall reduced clearance — check locally.",
    desc: "Salina's most iconic coastal feature, a volcanic gateway at the NW tip; reaching it by kayak or dinghy from Pollara and swimming through is unforgettable.",
    sources: [["Tripadvisor — Arco di Punta Perciato", "https://www.tripadvisor.com/Attraction_Review-g12161917-d18148393-Reviews-Arco_Naturale_DI_Punta_Perciato-Pollara_Malfa_Isola_di_Salina_Aeolian_Islands_.html"], ["Mammasantina — Salina by boat", "https://mammasantina.it/en/salina-aeolian-islands/around-the-salina-by-boat.html"]]
  },
  {
    id: "scoglio-cacato", name: "Scoglio Cacato", island: "Salina",
    lat: 38.558, lng: 14.878, approx: true,
    type: "reef_secca", depth: 7, depthText: "3–10 m volcanic reef",
    access: "boat", anchorage: "Santa Marina Salina (8–12 m)",
    see: "Dramatic volcanic rock formations in very clear water; sponges, anemones and posidonia on the base.",
    notes: "Free, no restrictions. Steep approach from land — boat recommended.",
    desc: "A small striking rock outcrop just north of Santa Marina where the volcanic geology is unusually visible and the water especially clear — a rewarding stop most visitors skip.",
    sources: [["turismoeolie — Boating Salina", "http://aeolianislands.turismoeolie.com/boating-salina/"], ["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"]]
  },
  {
    id: "malfa-reef", name: "Malfa Reef Shoals", island: "Salina",
    lat: 38.573, lng: 14.838, approx: true,
    type: "reef_secca", depth: 16, depthText: "Surface rocks → 12–20 m outer edge",
    access: "shore", anchorage: "Malfa (anchor with care — reef hazard)",
    see: "Moray eels and octopus, dense fish shoals, 18–20 m free-dive depth on the outer edge; rocks break the surface in places.",
    notes: "Free; the reef is a boat hazard — snorkellers approach from Malfa beach (~100 m swim).",
    desc: "A submerged reef under 100 m from Malfa's beach, with surface-breaking rocks creating a rich habitat — one blogger logged morays, octopus and dense shoals in glass-clear water.",
    sources: [["Belosophy — Malfa, Salina", "https://belosophy.wordpress.com/2015/07/26/a-great-beach-and-a-terrific-cafe-at-malfa-salina-italy/"]]
  },

  // ---------------- PANAREA & ISLETS ----------------
  {
    id: "cala-junco", name: "Cala Junco", island: "Panarea",
    lat: 38.6213, lng: 15.0563, approx: false,
    type: "cove_snorkel", depth: 8, depthText: "5–12 m — 'exceptional' seabed",
    access: "shore", anchorage: "Just outside the cove (sand); swim in",
    see: "An amphitheatre of dark volcanic basalt forming a natural pool; posidonia; dense sea bream and wrasse; octopus and moray eels; exceptional underwater light.",
    notes: "Free; the cove is small — enter by swimming only. ~45 min path from San Pietro, or swim from an anchored boat.",
    desc: "The jewel of Panarea: an amphitheatre cove where extraordinary basalt formations create a natural swimming pool with some of the best snorkelling seabed in the archipelago.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["Lonely Planet — Cala Junco", "https://www.lonelyplanet.com/italy/sicily/panarea/attractions/cala-junco/a/poi-sig/1397095/359996"]]
  },
  {
    id: "calcara-thermal", name: "Calcara Beach Thermal Spring", island: "Panarea",
    lat: 38.6377, lng: 15.0432, approx: true,
    type: "thermal_bubble", depth: 1, depthText: "0–2 m shore fumaroles",
    access: "shore", anchorage: "Baia Milazzese / Ditella dock",
    see: "Fumaroles venting hot gas from the beach sediment; steaming ground; 50°C water gushing under the seabed; submarine fumarole activity just offshore.",
    notes: "Free public beach; documented since Roman times. Don't touch vent points or dig into the sediment.",
    desc: "Panarea's onshore fumarole field — the geological complement to the offshore Bottaro/Lisca Bianca vents — with steaming ground and hot springs you can pair with an offshore bubble snorkel.",
    sources: [["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"], ["Smithsonian GVP — Panarea 2002", "https://volcano.si.edu/showreport.cfm?doi=10.5479%2Fsi.GVP.BGVN200210-211041"]]
  },
  {
    id: "lisca-bianca", name: "Lisca Bianca — Fumaroles & Grotta degli Innamorati", island: "Panarea islets",
    lat: 38.6398, lng: 15.1152, approx: false,
    type: "thermal_bubble", depth: 9, depthText: "7–10 m vents; cave near surface",
    access: "boat", anchorage: "Between Lisca Bianca & Bottaro (5–13 m sand)",
    see: "An extensive underwater fumarole field venting CO₂ at ~40°C — 'deafening' bubbling underwater, sulphur at the surface; the Grotta degli Innamorati cave nearby; whitish islet colouring from fumarole activity.",
    notes: "No landing on the islet. Sulphur vents — limit time at vent centres. Activity well-established since the 2002 eruption.",
    desc: "The most spectacular natural underwater jacuzzi in the archipelago: CO₂-rich vents cascade bubbles from the seabed at 7–10 m between Lisca Bianca and Bottaro.",
    sources: [["UNESCO Smart Education — Lisca Bianca fumaroles", "https://www.smarteducationunescosicilia.it/en/isole-eolie/the-underwater-fumarolic-activity-of-lisca-bianca/"], ["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["YouTube — Skin diving on the vents", "https://www.youtube.com/watch?v=iQJiE1GGZzI"]]
  },
  {
    id: "bottaro", name: "Bottaro — La Sorgente dei Quadrati (CO₂ vents)", island: "Panarea islets",
    lat: 38.6380, lng: 15.1103, approx: false,
    type: "thermal_bubble", depth: 8, depthText: "5–13 m; most intense 5–10 m",
    access: "boat", anchorage: "Between Bottaro & Lisca Bianca (5–13 m sand)",
    see: "A hydrothermal field where CO₂ and hydrogen sulphide make the water 'boil' with bubbles — multiple vents, the largest just N of the islet; a natural hydro-massage; vent temps to 40°C.",
    notes: "No landing; same gas-caution as Lisca Bianca. All vent areas shallower than 30 m (Smithsonian GVP).",
    desc: "The most concentrated Panarea vent field, where volcanic gases bubble vigorously from the sandy seabed — descending through the bubble columns is accessible to any confident swimmer.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["Smithsonian GVP — Panarea 2002", "https://volcano.si.edu/showreport.cfm?doi=10.5479%2Fsi.GVP.BGVN200210-211041"]]
  },
  {
    id: "dattilo", name: "Dattilo Islet — Sea Caves & Passages", island: "Panarea islets",
    lat: 38.6405, lng: 15.0983, approx: false,
    type: "sea_cave", depth: 10, depthText: "5–15 m around the base",
    access: "boat", anchorage: "Off the east coast (5–13 m sand)",
    see: "A 103 m pyramid rock with sheer underwater walls; cave passages and the 'Guglia di Dattilo' gap on the west side; colourful sponges and algae; clear turquoise water.",
    notes: "No landing; navigate carefully around shallow rocks.",
    desc: "The pyramid-shaped rock of Dattilo rises 103 m from the sea, its base riddled with cave passages — easily combined with the Lisca Bianca and Bottaro bubble fields.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },
  {
    id: "lisca-nera", name: "Lisca Nera", island: "Panarea islets",
    lat: 38.6352, lng: 15.1103, approx: false,
    type: "stack", depth: 10, depthText: "5–15 m around the base",
    access: "boat", anchorage: "Between Bottaro & Lisca Bianca (5–13 m sand)",
    see: "A small elongated dark basalt formation; clear turquoise water; dark rock walls with sponges and algae; dramatic for underwater photography.",
    notes: "No landing ban; part of the same volcanic caldera rim as Bottaro and Lisca Bianca.",
    desc: "The smallest and darkest of the Panarea islet cluster — an easy add-on to the Bottaro/Lisca Bianca bubble-snorkel route.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"]]
  },
  {
    id: "basiluzzo", name: "Basiluzzo — Roman Boathouse (submerged)", island: "Panarea islets",
    lat: 38.6642, lng: 15.1144, approx: false,
    type: "shallow_archaeology", depth: 7.5, depthText: "7.5 m — Roman navalia ruins",
    access: "boat", anchorage: "East coast (9–14 m sand/stone)",
    see: "At 7.5 m near the eastern bay: ruins of a Roman boathouse (navalia), encrusted with gorgonians and sponges; a Roman villa with mosaics above water; sea bream and barracuda; exceptional clarity — ruins visible from the surface on calm days.",
    notes: "No formal dive ban; tender landing on the east beach only — the path is landslide-prone.",
    desc: "The only spot in the Aeolians with snorkelable Roman-era underwater ruins at 7.5 m — the submerged boathouse of an ancient villa that once crowned this uninhabited islet.",
    sources: [["turismoeolie — Boating Panarea", "http://aeolianislands.turismoeolie.com/boating-panarea/"], ["GetYourGuide — Aeolian water sports", "https://www.getyourguide.com/aeolian-islands-l3446/water-sports-tc55/"]]
  },
  {
    id: "piscina-romana", name: "Roman Fish Pool (Piscina Romana)", island: "Panarea",
    lat: 38.6360, lng: 15.0630, approx: true,
    type: "shallow_archaeology", depth: 3, depthText: "2–5 m — very shallow",
    access: "boat", anchorage: "San Pietro / Scalo Ditella",
    see: "A submerged Roman fish pool (piscina) visible at only a few metres; a Roman paved road was also spotted at 4–5 m near Dattilo.",
    notes: "Part of Sicily's official underwater-archaeology routes; guided tour recommended, no permit for snorkeling.",
    desc: "One of the most accessible ancient underwater sites in the Aeolians — a Roman fish pool near San Pietro lying just metres beneath the surface.",
    sources: [["VisitSicily — Underwater Archaeology Routes", "https://www.visitsicily.info/en/itinerario/underwater-archaeology-routes/"], ["turismoeolie — What to see at Panarea", "http://aeolianislands.turismoeolie.com/what-to-see-at-panarea/"]]
  },

  // ---------------- STROMBOLI ----------------
  {
    id: "strombolicchio", name: "Strombolicchio Islet", island: "Stromboli",
    lat: 38.8173, lng: 15.2519, approx: false,
    type: "stack", depth: 10, depthText: "5–15 m around the base",
    access: "boat", anchorage: "Ficogrande buoy field (~1.5 km dinghy ride)",
    see: "An ancient basalt volcanic chimney; vertical underwater walls colonised by gorgonians, sponges and bryozoans; 'deep blue' clarity; rare Aeolian wall lizards and a lighthouse on top.",
    notes: "Integral Nature Reserve — landing on the islet is PROHIBITED. Snorkelling the surrounding water is permitted. Reach by dinghy/kayak from the catamaran.",
    desc: "The basalt sea stack of Strombolicchio — the chimney of a long-eroded volcano — rises 1.5 km NE of Stromboli; snorkelling its richly colonised walls in crystal water is a must-do.",
    sources: [["Wikipedia — Strombolicchio", "https://en.wikipedia.org/wiki/Strombolicchio"], ["Italia.it — Strombolicchio", "https://www.italia.it/en/sicily/strombolicchio"]]
  },
  {
    id: "ficogrande", name: "Ficogrande / Punta Lena Shore", island: "Stromboli",
    lat: 38.793, lng: 15.220, approx: true,
    type: "beach_snorkel", depth: 8, depthText: "5–12 m sand & stones",
    access: "shore", anchorage: "Punta Lena buoy field / 5–12 m off the beach",
    see: "Black volcanic sand and pebble seabed with a dark lustre; sea bream, wrasse and damselfish; Strombolicchio visible on the horizon as you float; cave formations in nearby lava cliffs.",
    notes: "Free public beach; snorkel away from the summer ferry lane.",
    desc: "Stromboli's accessible shore snorkel along black-sand Ficogrande, with the iconic Strombolicchio silhouette on the horizon and a uniquely dramatic dark seabed.",
    sources: [["WTP Travel — Stromboli", "https://wtp.travel/travel-guides/italy/stromboli/activities/"], ["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"]]
  },
  {
    id: "piscita", name: "Piscità Beach & Lava Cave Walls", island: "Stromboli",
    lat: 38.798, lng: 15.208, approx: true,
    type: "cove_snorkel", depth: 10, depthText: "5–15 m along lava walls",
    access: "shore", anchorage: "From Ficogrande anchorage / small bay",
    see: "Ancient lava-flow cliff walls with sea caves; colourful marine life on the volcanic rock; quieter and more photogenic than Ficogrande.",
    notes: "Free; no restrictions. Calm conditions for the caves.",
    desc: "Stromboli's quietest snorkel beach, with lava cliffs and small caves to explore and unusually clear turquoise water over dark volcanic rock.",
    sources: [["WTP Travel — Stromboli", "https://wtp.travel/travel-guides/italy/stromboli/activities/"], ["Adventurous Kate — Aeolian guide", "https://www.adventurouskate.com/aeolian-islands-sicily-travel-guide/"]]
  },

  // ---------------- FILICUDI ----------------
  {
    id: "la-canna", name: "La Canna Sea Stack", island: "Filicudi",
    lat: 38.566, lng: 14.556, approx: true,
    type: "stack", depth: 17, depthText: "5–20 m around the base",
    access: "boat", anchorage: "Off Montenassari rock (12–16 m); 1.6 km offshore",
    see: "A 71 m columnar stack rising from the deep; 'crystal clear' water, colourful fish, gorgonians and sponges on the base; walls vanishing into deep blue; protected lizard population above.",
    notes: "No landing — UNESCO-protected islet with protected lizards. Surrounding water unrestricted. Sea can be rough — assess from the boat.",
    desc: "The tallest sea stack in the Aeolians — a 71 m volcanic column 1.6 km off Filicudi — ringed by some of the clearest water in the archipelago.",
    sources: [["Loveolie — La Canna", "https://www.loveolie.com/en/attractions/mare-eolie/la-canna"], ["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"]]
  },
  {
    id: "bue-marino", name: "Grotta del Bue Marino", island: "Filicudi",
    lat: 38.567, lng: 14.557, approx: true,
    type: "sea_cave", depth: 6, depthText: "0–10 m inside; seabed visible",
    access: "boat", anchorage: "Pecorini a Mare buoy field",
    see: "The largest sea cave in the archipelago; extraordinary light and shadow; named for the 'sea ox' sound and historic monk seals; turquoise-to-cobalt water; starfish, urchins, sponges, crabs and eels.",
    notes: "Inner chamber was restricted 2021–22 for rockfall risk — confirm locally; entrance/approach waters are open. Enter with a small boat able to clear the low mouth.",
    desc: "The most celebrated sea cave in the Aeolians — a vast lava cave on Filicudi's NW coast with dazzling light effects and crystal-clear shallow water.",
    sources: [["Loveolie — Grotta del Bue Marino", "https://www.loveolie.com/en/attractions/mare-eolie/grotta-bue-marino"], ["Tripadvisor — Grotta del Bue Marino", "https://www.tripadvisor.com/Attraction_Review-g675109-d15683279-Reviews-Grotta_del_bue_marino-Filicudi_Aeolian_Islands_Islands_of_Sicily_Sicily.html"]]
  },
  {
    id: "montenassari", name: "Montenassari & Giafante Stacks", island: "Filicudi",
    lat: 38.557, lng: 14.548, approx: true,
    type: "stack", depth: 11, depthText: "5–16 m around the bases",
    access: "boat", anchorage: "Montenassari (12–16 m)",
    see: "Two smaller volcanic neck formations with rewarding rocky seabed; colourful fish and the clear water typical of Filicudi's pristine west coast.",
    notes: "Free, no restrictions; day anchorage. West coast can be exposed.",
    desc: "Smaller cousins of La Canna on Filicudi's west coast — a Sailogy skipper specifically recommends anchoring here 'with a snorkel' for the rocky seabed.",
    sources: [["Sailogy — Aeolian anchorages", "https://www.sailogy.com/en/blog/yacht-rental-aeolian-islands/"], ["GetYourGuide — Filicudi & Alicudi", "https://www.getyourguide.com/grotta-del-bue-marino-l203725/"]]
  },
  {
    id: "secca-capo-graziano", name: "Secca di Capo Graziano Reef", island: "Filicudi",
    lat: 38.538, lng: 14.562, approx: true,
    type: "reef_secca", depth: 5, depthText: "Crest 3 m → 18–20 m",
    access: "boat", anchorage: "Filicudi Porto buoy field (~100 m)",
    see: "A rocky monolith rising to within 3 m of the surface with pointed jags; dense gorgonians and sponges; site of ancient & modern shipwrecks (amphora finds); the Bronze Age village visible above on the cape.",
    notes: "Free; the reef top (3–5 m) is freely snorkelable. It's a boat hazard — approach by dinghy. Formal shipwreck dives are guided/scuba; snorkelling the crest is open.",
    desc: "A submerged reef rising to 3 m below the surface off Filicudi's south tip — an important shipwreck-archaeology site whose snorkelable crest teems with marine life.",
    sources: [["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"], ["vacanzeinbarca — Filicudi", "https://www.vacanzeinbarca.it/en/destinazioni/filicudi-alicudi.php"]]
  },

  // ---------------- ALICUDI ----------------
  {
    id: "alicudi-cove", name: "Alicudi Harbour Cove", island: "Alicudi",
    lat: 38.539, lng: 14.351, approx: true,
    type: "cove_snorkel", depth: 10, depthText: "5–15 m; drops off quickly",
    access: "shore", anchorage: "Buoys off the village / 10–15 m by the dock",
    see: "Among the clearest water in the archipelago (20–30 m visibility); multicoloured seaweed and posidonia; Alicudi's signature 'fili' basalt columns; urchins, grouper and octopus; ancient rockslide fields on the seabed.",
    notes: "Free, no restrictions; no sandy beaches — entry over volcanic rock needs reef shoes. The most remote, pristine Aeolian island.",
    desc: "Alicudi's waters are arguably the cleanest in the archipelago; a short swim from the harbour reaches a largely untouched marine world of basalt 'fili' columns.",
    sources: [["Aeolian Yacht Services — Filicudi & Alicudi", "https://www.aeolianyachtservices.com/filicudi-and-alicudi/"], ["Apartment in Catania — Alicudi", "https://www.apartmentincatania.com/en/alicudi-island/"]]
  },

  // ---------------- SALINA (kept archaeology) ----------------
  {
    id: "contrada-barone", name: "Contrada Barone Roman Baths", island: "Salina",
    lat: 38.5630, lng: 14.8720, approx: true,
    type: "shallow_archaeology", depth: 1, depthText: "0–3 m coastal / tidal",
    access: "shore", anchorage: "Santa Marina Salina",
    see: "A partly-submerged Roman bath complex on the Santa Marina seafront, later reused as a garum (fish-sauce) salting plant; finds shown at the Museo Civico in Lingua.",
    notes: "Protected site; standard rules; no permit for snorkeling the shallow remains.",
    desc: "A shallow, partly-submerged Roman bath complex at Salina's seafront — one of the archipelago's accessible coastal archaeology spots.",
    sources: [["Parchi Archeologici Regione Sicilia", "https://parchiarcheologici.regione.sicilia.it/isole-eolie/en/siti-archeologici/aree-archeologiche-del-demanio-comunale/"]]
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
      [38.566, 14.556], [38.538, 14.562]
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
