/* ==========================================================================
   BE THE BEACON — Research: the other reason to go.
   People and organisations along the course doing something real about the
   ocean, the coast, or where energy comes from. Seeded with verified orgs;
   the person to contact is left blank on purpose — that is the work.
   ========================================================================== */
(function (root) {
  'use strict';

  var THEMES = [
    { id: 'plastic', label: 'Ocean plastic' },
    { id: 'reef', label: 'Reefs & coral' },
    { id: 'habitat', label: 'Kelp, seagrass, mangrove' },
    { id: 'energy', label: 'Energy' },
    { id: 'policy', label: 'Fisheries & policy' },
    { id: 'community', label: 'Coastal communities' }
  ];

  /* The pipeline, left to right. A lead only ever moves one way in practice,
     but nothing stops you dragging it back. */
  var STAGES = [
    { id: 'spotted', label: 'Spotted', hint: 'Worth a look' },
    { id: 'digging', label: 'Digging', hint: 'Reading their work' },
    { id: 'reached', label: 'Reached out', hint: 'Message sent' },
    { id: 'booked', label: 'Booked', hint: 'Something in the diary' },
    { id: 'met', label: 'Interviewed', hint: 'Recorded, notes taken' },
    { id: 'shared', label: 'Shared', hint: 'Published something' }
  ];

  /* spot: which break on the course this sits next to. '' = not tied to one
     place. Every entry below came from a real source, listed in `url`. */
  var SEED = [
    // --- Indonesia ------------------------------------------------------
    { org: 'Sungai Watch', spot: 'bali', place: 'Bali, Indonesia', theme: 'plastic',
      what: 'Floating barriers across Balinese rivers that catch plastic before it reaches the sea, plus a sister company turning the haul into furniture.',
      why: 'The clearest example anywhere of intercepting plastic upstream instead of skimming the ocean. They publish their own audit data, brand by brand.',
      url: 'https://sungai.watch/' },
    { org: 'Karang Lestari Pemuteran', spot: 'bali', place: 'Pemuteran, North Bali', theme: 'reef',
      what: 'The largest Biorock coral restoration site in the world — low-voltage mineral accretion structures that grow reef on steel frames.',
      why: 'Twenty-plus years of data on a technique most of the reef world still argues about. A day trip from the Bukit.',
      url: 'https://karanglestaripemuteran.com/' },
    { org: 'Biorock Indonesia', spot: 'bali', place: 'Bali & beyond', theme: 'reef',
      what: 'Builds and monitors Biorock reef structures across Indonesia and trains local communities to run them.',
      why: 'The engineering side of the same story — who pays for it, and whether it scales past showcase sites.',
      url: 'https://www.biorock-indonesia.com/en/' },
    { org: 'SurfAid', spot: 'mentawais', place: 'Mentawai Islands, Sumatra', theme: 'community',
      what: 'Founded by a surfer-doctor after a boat trip; runs maternal health, water and nutrition programmes in villages next to the waves.',
      why: 'The model for surfers giving something back to the places they visit, thirty years in. Ask what actually worked and what did not.',
      url: 'https://surfaid.org/' },

    // --- Sri Lanka ------------------------------------------------------
    { org: 'Blue Resources Trust', spot: 'midigama', place: 'Sri Lanka', theme: 'policy',
      what: 'Independent marine research and consultancy — coral reef monitoring, fisheries policy, shark and ray conservation.',
      why: 'Science that feeds straight into national policy in a country with enormous reef pressure and thin enforcement.',
      url: 'https://www.blueresources.org/' },
    { org: 'Blue Resources — coral programme', spot: 'midigama', place: 'Sri Lanka south & east coasts', theme: 'reef',
      what: 'Long-term reef monitoring and restoration trials on reefs hit hard by bleaching.',
      why: 'You will be there four months. Long enough to actually help with a survey season.',
      url: 'https://www.blueresources.org/coral-reefs' },

    // --- Philippines ----------------------------------------------------
    { org: 'S.E.A. Movement', spot: 'siargao', place: 'Siargao, Philippines', theme: 'plastic',
      what: 'Siargao-based ocean advocacy — education, clean-ups and youth programmes on an island being reshaped by tourism.',
      why: 'Small, local, and dealing with exactly the tension you are part of: surfers arriving faster than the infrastructure.',
      url: 'https://www.seamovementph.org/' },
    { org: 'Del Carmen Mangrove Reserve', spot: 'siargao', place: 'Del Carmen, Siargao', theme: 'habitat',
      what: 'The largest contiguous mangrove forest in the Philippines, a Ramsar wetland of international importance, managed with the local government.',
      why: 'After Typhoon Odette the mangroves measurably shielded the towns behind them. That is a story with numbers attached.',
      url: 'https://rsis.ramsar.org/ris/2553' },
    { org: 'Save Philippine Seas', spot: 'siargao', place: 'Philippines', theme: 'policy',
      what: 'Campaigning and youth-leadership organisation behind several national marine wins.',
      why: 'The national picture your Siargao months sit inside.',
      url: 'https://www.savephilippineseas.org/' },

    // --- Australia ------------------------------------------------------
    { org: 'Carnegie Clean Energy — CETO', spot: 'margarets', place: 'Perth & Garden Island, WA', theme: 'energy',
      what: 'Submerged buoy wave-energy converters. The Perth Wave Energy Project ran the first grid-connected array of its kind.',
      why: 'Wave power keeps almost working. Worth asking someone who has spent a decade on it what the real barrier is.',
      url: 'https://carnegiece.com/' },
    { org: 'Seagrass restoration, Cockburn Sound', spot: 'margarets', place: 'Perth, WA', theme: 'habitat',
      what: 'Australia’s largest seagrass restoration effort — volunteer divers hand-planting shoots and collecting seed, with UWA running the science.',
      why: 'Decades of attempts, honestly published including the failures. Volunteer seasons are open to outsiders.',
      url: 'https://www.seagrassresearch.net/projects' },
    { org: 'Great Southern Reef Foundation', spot: 'bells', place: 'Southern Australia', theme: 'habitat',
      what: 'Research and restoration across the temperate kelp reef that runs 8,000 km along Australia’s southern coast — the one nobody has heard of.',
      why: 'A reef worth billions that gets a fraction of the Barrier Reef’s attention, warming faster than almost anywhere. You will be surfing over it.',
      url: 'https://greatsouthernreef.com/' },
    { org: 'Golden kelp restoration, Victoria', spot: 'bells', place: 'Port Phillip & the Victorian coast', theme: 'habitat',
      what: 'Victorian National Parks Association project replanting golden kelp on reefs stripped by urchins and warming.',
      why: 'Volunteer-scale restoration a surfer can actually join between swells.',
      url: 'https://vnpa.org.au/restoring-golden-kelp-forests/' },

    // --- New Zealand ----------------------------------------------------
    { org: 'Xtreme Zero Waste', spot: 'raglan', place: 'Raglan / Whaingaroa, NZ', theme: 'plastic',
      what: 'Community-owned enterprise that took over the town’s waste and now diverts the large majority of it from landfill — and holds the district contract.',
      why: 'A surf town that solved its own rubbish problem and made it a business. The single most transferable model on your whole route.',
      url: 'https://xtremezerowaste.org.nz/' },

    // --- The Americas ---------------------------------------------------
    { org: 'LaGeo — geothermal El Salvador', spot: 'tunco', place: 'El Salvador', theme: 'energy',
      what: 'State geothermal operator running around a fifth of national electricity off volcanoes, now expanding with World Bank backing.',
      why: 'A small, poor, seismically violent country quietly running one of the cleanest grids in the Americas. Nobody covers it.',
      url: 'https://www.thinkgeoenergy.com/el-salvador-deriving-20-of-its-electricity-from-geothermal/' },
    { org: 'Mangrove governance, Manabí', spot: 'ayampe', place: 'Manabí coast, Ecuador', theme: 'habitat',
      what: 'Community mangrove concessions: crabber and fisher associations given legal custody of the mangroves they depend on.',
      why: 'Conservation that works because the people protecting it eat from it. The opposite of a fenced-off reserve.',
      url: 'https://satoyamainitiative.org/case_studies/ensuring-conservation-good-governance-and-sustainable-livelihoods-through-landscape-management-of-mangrove-ecosystems-in-manabi-ecuador/' },
    { org: 'TNC Ecuador — coastal mangroves', spot: 'ayampe', place: 'Ecuador coast', theme: 'habitat',
      what: 'Community development work tied to mangrove protection along the Ecuadorian coast, including the shrimp-pond conflict.',
      why: 'The big-NGO view to set against the community one. Interview both and you have an actual story.',
      url: 'https://www.nature.org/en-us/about-us/where-we-work/latin-america/ecuador/sustainable-community-development-mangrove-forest-protect-ecuador-conservation-program/' },

    // --- Runs through the whole trip -------------------------------------
    { org: 'Save The Waves Coalition', spot: '', place: 'Global — World Surfing Reserves', theme: 'policy',
      what: 'Protects surf ecosystems through World Surfing Reserves. Puerto Escondido became the 14th; Punta de Lobos, Noosa and the Gold Coast are all reserves.',
      why: 'The spine of the whole trip: a protection framework that uses waves as the reason to protect a coastline. Several reserves sit on your course.',
      url: 'https://www.savethewaves.org/wsr/' }
  ];

  /* The questions you ask everyone, so the interviews are comparable later. */
  var QUESTIONS = [
    'What is the problem you are actually solving, in one sentence a fisherman would recognise?',
    'What did you try first that did not work?',
    'Who pays for this, and what happens when they stop?',
    'What would you do with ten times the money — and would it actually be ten times better?',
    'What does success look like in five years? What does failure look like?',
    'Who locally decides whether this succeeds, and are they on your side?',
    'What could a person passing through for two months genuinely help with?',
    'Who else should I be talking to, here or on the rest of this route?'
  ];

  function seed() {
    return SEED.map(function (r, i) {
      return { id: 'r' + i + '-' + Math.random().toString(36).slice(2, 7),
               org: r.org, person: '', spot: r.spot, place: r.place, theme: r.theme,
               what: r.what, why: r.why, url: r.url, stage: 'spotted', next: '', notes: '' };
    });
  }

  var API = { THEMES: THEMES, STAGES: STAGES, QUESTIONS: QUESTIONS, seed: seed };
  root.SFRESEARCH = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
