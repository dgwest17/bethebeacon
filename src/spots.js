/* ==========================================================================
   SWELL FUND — surf destinations
   season: months the spot actually works (1 = Jan). cost: solo monthly all-in,
   housing + food + local transport, in the region's own currency converted to USD.
   wifi: 1 = phone tether only, 5 = fibre, take a client call.
   utc: standard offset, used to compute the overlap with a San Diego workday.
   ========================================================================== */
(function (root) {
  'use strict';

  function m(a, b) { var out = []; for (var i = a; i !== (b % 12) + 1; i = (i % 12) + 1) out.push(i); return out; }

  var SPOTS = [
    /* ---- Central & South America ------------------------------------- */
    { id: 'puerto', name: 'Puerto Escondido', country: 'Mexico', region: 'csa', lat: 15.86, lng: -97.07,
      season: m(4, 9), peak: 'May–Aug', cost: 2200, wifi: 4, utc: -6, level: 'Expert',
      wave: 'Heaviest beach break on earth. Zicatela barrels, La Punta for the longboard days.',
      visa: '180 days on arrival, no visa needed.', board: 'Fly OAX or HUX. Domestic hops charge $60–90 per board bag.',
      watch: 'Serious drownings every season. La Punta is the safe half of town.' },
    { id: 'salina', name: 'Salina Cruz', country: 'Mexico', region: 'csa', lat: 16.17, lng: -95.20,
      season: m(4, 9), peak: 'Apr–Sep', cost: 2600, wifi: 2, utc: -6, level: 'Advanced',
      wave: 'A hundred kilometres of empty sand-bottom right points.',
      visa: '180 days on arrival.', board: 'Guide trucks are the only realistic access — $80–120/day including boat and driver.',
      watch: 'Guide fees are the budget line people forget. Costs more than Puerto to surf.' },
    { id: 'tunco', name: 'El Tunco / Punta Roca', country: 'El Salvador', region: 'csa', lat: 13.49, lng: -89.38,
      season: m(3, 10), peak: 'Apr–Sep', cost: 1800, wifi: 3, utc: -6, level: 'Intermediate',
      wave: 'Cobblestone rights that run forever. Punta Roca is world class on a solid SW.',
      visa: '90 days CA-4 zone, covers Guatemala, Honduras and Nicaragua too.', board: 'SAL airport is 45 minutes away. One of the cheapest board-friendly arrivals in the Americas.',
      watch: 'The CA-4 clock is shared across four countries — leaving to Nicaragua does not reset it.' },
    { id: 'popoyo', name: 'Popoyo', country: 'Nicaragua', region: 'csa', lat: 11.47, lng: -86.13,
      season: m(3, 10), peak: 'Apr–Sep', cost: 1900, wifi: 3, utc: -6, level: 'Intermediate',
      wave: 'Offshore ~300 days a year on the Lake Nicaragua wind. Outer reef holds size.',
      visa: '90 days CA-4.', board: 'MGA then a 3-hour shuttle. Bring spare fins, nothing is sold locally.',
      watch: 'Dry-season wind is the whole point here, and it also makes it dusty and hot.' },
    { id: 'santacat', name: 'Santa Catalina', country: 'Panama', region: 'csa', lat: 7.63, lng: -81.27,
      season: m(4, 10), peak: 'Apr–Oct', cost: 2000, wifi: 3, utc: -5, level: 'Intermediate',
      wave: 'Rock-shelf right that handles real swell. Jump-off point for Isla Cébaco boats.',
      visa: '180 days on arrival.', board: 'PTY then 7 hours overland, or fly to David.',
      watch: 'Low tide over that shelf is unforgiving. Reef booties earn their space in the bag.' },
    { id: 'pavones', name: 'Pavones', country: 'Costa Rica', region: 'csa', lat: 8.39, lng: -83.13,
      season: m(4, 10), peak: 'May–Aug', cost: 2600, wifi: 3, utc: -6, level: 'Intermediate',
      wave: 'Two-minute left point on a big south swell. One of the longest lefts anywhere.',
      visa: '180 days, proof of onward travel enforced at the airport.', board: 'SJO then 8 hours, or fly to Golfito. Board bags on the domestic prop plane are a gamble.',
      watch: 'It only breaks properly on a real south swell. Check the forecast before committing a month.' },
    { id: 'santateresa', name: 'Santa Teresa', country: 'Costa Rica', region: 'csa', lat: 9.64, lng: -85.17,
      season: m(3, 10), peak: 'Apr–Oct', cost: 3200, wifi: 4, utc: -6, level: 'All levels',
      wave: 'Consistent beach break, works nearly every day, gets crowded because of it.',
      visa: '180 days, onward ticket required.', board: 'The most expensive coast in Central America and the best connected.',
      watch: 'Costa Rica prices are close to California prices. Budget accordingly.' },
    { id: 'ayampe', name: 'Ayampe / Montañita', country: 'Ecuador', region: 'csa', lat: -1.67, lng: -80.78,
      season: m(12, 4), peak: 'Jan–Mar', cost: 1700, wifi: 3, utc: -5, level: 'Intermediate',
      wave: 'Northern-hemisphere swell window — the answer for December through March in the Americas.',
      visa: '90 days on arrival.', board: 'GYE then 3 hours. USD currency, so no FX spread at all.',
      watch: 'Opposite season to everywhere else on this coast. That is exactly why it is here.' },
    { id: 'lobitos', name: 'Lobitos', country: 'Peru', region: 'csa', lat: -4.45, lng: -81.28,
      season: m(4, 10), peak: 'Apr–Sep', cost: 1500, wifi: 2, utc: -5, level: 'Advanced',
      wave: 'Cold, mechanical, sand-bottom lefts in an old oil town. Barrels most days.',
      visa: '183 days per year on arrival.', board: 'Fly TAL, one hour from Máncora.',
      watch: 'Water is cold for the latitude — the Humboldt current. Pack a 3/2 for the tropics.' },
    { id: 'chicama', name: 'Chicama', country: 'Peru', region: 'csa', lat: -7.70, lng: -79.44,
      season: m(4, 9), peak: 'Apr–Aug', cost: 1700, wifi: 3, utc: -5, level: 'Intermediate',
      wave: 'The longest left on the planet. Two kilometres, and a boat back to the top.',
      visa: '183 days per year.', board: 'TRU then 90 minutes. Boat lifts cost about $20 a session.',
      watch: 'Cold and windy. A month here is a legs-of-steel month.' },
    { id: 'floripa', name: 'Florianópolis', country: 'Brazil', region: 'csa', lat: -27.60, lng: -48.55,
      season: m(4, 9), peak: 'May–Aug', cost: 2400, wifi: 4, utc: -3, level: 'All levels',
      wave: 'Forty beaches on one island, so something works in any wind.',
      visa: '90 days visa-free for US passports.', board: 'FLN is a proper airport and Brazil is board-friendly.',
      watch: 'Strongest wifi and city infrastructure in South America — a good work month.' },
    { id: 'lobos', name: 'Punta de Lobos', country: 'Chile', region: 'csa', lat: -34.42, lng: -72.05,
      season: m(4, 9), peak: 'Apr–Aug', cost: 2200, wifi: 4, utc: -4, level: 'Advanced',
      wave: 'Big, cold, serious left point. Pichilemu is the Chilean surf capital.',
      visa: '90 days visa-free.', board: 'SCL then 3.5 hours. A 4/3 and booties, minimum.',
      watch: 'Genuinely cold water year round. This is a wetsuit destination inside a boardshorts trip.' },

    /* ---- Australia ----------------------------------------------------- */
    { id: 'goldcoast', name: 'Gold Coast', country: 'Australia', region: 'aus', lat: -28.16, lng: 153.54,
      season: m(1, 4), peak: 'Feb–Apr cyclone swell', cost: 4200, wifi: 5, utc: 10, level: 'All levels',
      wave: 'Snapper, Kirra, Burleigh. Sand-bottom points and the best waves in the country when a cyclone lines up.',
      visa: 'eVisitor / ETA, 3 months per entry, 12-month validity.', board: 'OOL airport lands you 10 minutes from Snapper.',
      watch: 'The most crowded waves in the southern hemisphere. Van parking is heavily policed.' },
    { id: 'byron', name: 'Byron Bay / Lennox', country: 'Australia', region: 'aus', lat: -28.64, lng: 153.61,
      season: m(2, 6), peak: 'Mar–Jun', cost: 4500, wifi: 4, utc: 10, level: 'All levels',
      wave: 'The Pass on an east swell, Lennox Head point when it gets big.',
      visa: 'eVisitor, 3 months per entry.', board: 'One hour from OOL. Van-friendly coast if you know the spots.',
      watch: 'Rents and groceries here are the most expensive on the trip. Van life is not optional, it is the budget.' },
    { id: 'noosa', name: 'Noosa', country: 'Australia', region: 'aus', lat: -26.39, lng: 153.09,
      season: m(12, 3), peak: 'Dec–Mar', cost: 4000, wifi: 5, utc: 10, level: 'All levels',
      wave: 'Perfect, slow, right-hand points inside a national park. Needs a cyclone swell to switch on.',
      visa: 'eVisitor.', board: 'Two hours north of Brisbane.',
      watch: 'Only breaks a handful of weeks a year. Park nearby, do not plan a month around it.' },
    { id: 'sydney', name: 'Sydney Northern Beaches', country: 'Australia', region: 'aus', lat: -33.74, lng: 151.29,
      season: m(3, 9), peak: 'Apr–Aug', cost: 4800, wifi: 5, utc: 10, level: 'All levels',
      wave: 'Twenty beaches on a bus line. Nothing world class, everything consistent.',
      visa: 'eVisitor.', board: 'SYD is the best-connected airport on the route.',
      watch: 'The work month of Australia — fastest internet, biggest cost. Time it for client-heavy stretches.' },
    { id: 'bells', name: 'Bells Beach / Torquay', country: 'Australia', region: 'aus', lat: -38.37, lng: 144.28,
      season: m(4, 9), peak: 'Apr–Sep southern winter', cost: 3900, wifi: 4, utc: 10, level: 'Advanced',
      wave: 'Southern Ocean power. Winston and Bells hold serious size all winter.',
      visa: 'eVisitor.', board: '90 minutes from Melbourne. Free and cheap campsites along the Great Ocean Road.',
      watch: 'Winter here is 12°C water and 4/3 with a hood. This is the cold half of van life.' },
    { id: 'margarets', name: 'Margaret River', country: 'Australia', region: 'aus', lat: -33.96, lng: 114.99,
      season: m(4, 10), peak: 'Apr–Sep southern winter', cost: 3800, wifi: 4, utc: 8, level: 'Advanced',
      wave: 'Main Break, North Point, The Box. Heavy reef and relentless Indian Ocean swell.',
      visa: 'eVisitor.', board: 'Fly PER then 3 hours south. Best winter swell window in Australia.',
      watch: 'White sharks are a real consideration on this coast, not a cliché.' },
    { id: 'gnaraloo', name: 'Gnaraloo / Red Bluff', country: 'Australia', region: 'aus', lat: -23.79, lng: 113.51,
      season: m(4, 9), peak: 'May–Aug', cost: 3200, wifi: 1, utc: 8, level: 'Expert',
      wave: 'Left-hand reef in the desert. Camp on the cliff, surf with nobody.',
      visa: 'eVisitor.', board: 'Twelve hours north of Perth on one road. 4WD and water tanks.',
      watch: 'No phone signal, no services, no medical. A satellite messenger is the honest minimum.' },

    /* ---- SE Asia, Sri Lanka, Indonesia, Philippines --------------------- */
    { id: 'bali', name: 'Bali — Uluwatu / Canggu', country: 'Indonesia', region: 'sea', lat: -8.81, lng: 115.09,
      season: m(4, 10), peak: 'May–Sep dry season', cost: 2200, wifi: 5, utc: 8, level: 'All levels',
      wave: 'The Bukit reefs on every dry-season swell, Keramas and the east when the wind swings.',
      visa: 'B1 visa on arrival, 30 days, extends once to 60. E-visa B211A runs 60 + 60 + 60.',
      board: 'DPS is the hub of the entire region. Board repair and new boards are cheap and everywhere.',
      watch: 'The best work base on the trip: fibre internet, cafés, and a flight to anywhere in Indo.' },
    { id: 'lombok', name: 'Lombok / Desert Point', country: 'Indonesia', region: 'sea', lat: -8.75, lng: 115.83,
      season: m(5, 9), peak: 'Jun–Aug', cost: 1800, wifi: 3, utc: 8, level: 'Expert',
      wave: 'Desert Point is a ten-second barrel over dry reef. Kuta Lombok has the beginner bays.',
      visa: 'Same Indonesian visa clock as Bali — it does not reset by island hopping.',
      board: 'Fast boat or 30-minute flight from Bali.',
      watch: 'Deserts breaks maybe 30 days a year and the crowd knows the forecast too.' },
    { id: 'sumbawa', name: 'Sumbawa — Lakey Peak', country: 'Indonesia', region: 'sea', lat: -8.86, lng: 118.30,
      season: m(4, 9), peak: 'May–Aug', cost: 1700, wifi: 2, utc: 8, level: 'Advanced',
      wave: 'Three world-class waves in one bay: Lakey Peak, Lakey Pipe, Periscopes.',
      visa: 'Indonesian visa clock.', board: 'Fly to Bima then 2 hours, or the long overland-and-ferry haul.',
      watch: 'Cheapest good waves in Indonesia. Bring cash — ATMs are unreliable and often empty.' },
    { id: 'mentawais', name: 'Mentawai Islands', country: 'Indonesia', region: 'sea', lat: -1.95, lng: 99.60,
      season: m(4, 10), peak: 'May–Sep', cost: 4500, wifi: 1, utc: 7, level: 'Advanced',
      wave: 'The densest concentration of perfect reef passes on earth. Boat or land camp.',
      visa: 'Indonesian visa clock.', board: 'Padang then a 12-hour ferry, or a charter pickup. THIS is the boat-charter line in the model.',
      watch: 'Charters run $1,800–4,500 per week per person. Malaria prophylaxis is worth the conversation.' },
    { id: 'nias', name: 'Nias — Lagundri Bay', country: 'Indonesia', region: 'sea', lat: 0.58, lng: 97.75,
      season: m(6, 9), peak: 'Jun–Sep', cost: 1500, wifi: 2, utc: 7, level: 'Advanced',
      wave: 'A perfect right-hand barrel that breaks on the same reef every single swell.',
      visa: 'Indonesian visa clock.', board: 'Fly to Gunungsitoli via Medan, then 3 hours.',
      watch: 'Cheapest month you will have all trip. Also the most remote medical situation.' },
    { id: 'arugam', name: 'Arugam Bay', country: 'Sri Lanka', region: 'sea', lat: 6.84, lng: 81.83,
      season: m(5, 9), peak: 'Jun–Aug', cost: 1500, wifi: 3, utc: 5.5, level: 'All levels',
      wave: 'Main Point is a forgiving right point. Whiskey Point and Peanut Farm for the empty days.',
      visa: 'ETA online, 30 days, extends to 6 months in Colombo.',
      board: 'CMB then 7 hours overland, or a domestic hop.',
      watch: 'Exactly opposite season to the south coast — the island always has a working side.' },
    { id: 'midigama', name: 'Midigama / Weligama', country: 'Sri Lanka', region: 'sea', lat: 5.96, lng: 80.39,
      season: m(11, 4), peak: 'Dec–Mar', cost: 1600, wifi: 4, utc: 5.5, level: 'All levels',
      wave: 'Lazy Left, Ram, Coconuts. Mellow reef and beach breaks 90 minutes from the airport.',
      visa: 'ETA, extendable to 6 months.', board: 'The easiest arrival in Asia — highway straight from CMB.',
      watch: 'The best November–March option in the region. Pairs with Arugam Bay to cover a full year.' },
    { id: 'siargao', name: 'Siargao — Cloud 9', country: 'Philippines', region: 'sea', lat: 9.81, lng: 126.16,
      season: m(8, 11), peak: 'Sep–Nov', cost: 1800, wifi: 3, utc: 8, level: 'Intermediate',
      wave: 'Cloud 9 is a shallow right barrel with a boardwalk. A dozen quieter reefs around the island.',
      visa: '30 days on arrival, extendable up to 36 months in-country.',
      board: 'Fly via Cebu or Manila to Sayak. Typhoon season is also swell season.',
      watch: 'The Sep–Nov window fills the gap when Indo has gone flat. Typhoon risk is real.' },
    { id: 'maldives', name: 'Maldives — North Malé', country: 'Maldives', region: 'sea', lat: 4.18, lng: 73.51,
      season: m(3, 10), peak: 'Apr–Sep', cost: 4000, wifi: 3, utc: 5, level: 'Intermediate',
      wave: 'Warm, playful reef passes. Chickens, Cokes, Sultans within one boat ride.',
      visa: '30 days free on arrival.', board: 'MLE is well connected. Guesthouse islands made this affordable; boats did not.',
      watch: 'The other charter option. Guesthouse-and-ferry keeps it near $4k; a boat doubles it.' }
  ];

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Default course — your 6 / 6 / 12 split, resequenced so every single leg
     lands inside its own season for a March 2027 departure. Australia comes
     first because that puts van life in the southern winter, which is what
     you asked for and what the swell charts agree with. */
  var DEFAULT_ROUTE = [
    { spot: 'bells', months: 2 },      // Apr–May 27    · Southern Ocean swell switches on
    { spot: 'margarets', months: 3 },  // Jun–Aug 27    · peak WA winter, van life
    { spot: 'sydney', months: 1 },     // Sep 27        · the work month: fastest wifi in Australia
    { spot: 'mentawais', months: 1 },  // Oct 27        · the charter block lands here
    { spot: 'siargao', months: 1 },    // Nov 27        · last of the typhoon swell
    { spot: 'midigama', months: 4 },   // Dec 27–Mar 28 · Sri Lanka south coast season
    { spot: 'tunco', months: 2 },      // Apr–May 28    · El Salvador points
    { spot: 'puerto', months: 2 },     // Jun–Jul 28    · peak south swell
    { spot: 'lobitos', months: 2 },    // Aug–Sep 28    · Peru winter
    { spot: 'bali', months: 1 },       // Oct 28        · tail of the dry season
    { spot: 'siargao', months: 1 },    // Nov 28        · Cloud 9 again
    { spot: 'midigama', months: 4 }    // Dec 28–Mar 29 · back to the south coast, then home
  ];

  /* Work the trip supports — editable on the Adventure tab. */
  var PROJECTS = [
    { id: 'p1', name: 'Ship the app to paying users', why: 'The single lever that changes every number on the Treasure tab.', need: 4 },
    { id: 'p2', name: 'Recurring revenue / subscription layer', why: '$2k/mo of recurring income cuts $48k off the required departure cash.', need: 4 },
    { id: 'p3', name: 'Rep training content + onboarding', why: 'Records once, sells while you are in the water. Needs upload bandwidth.', need: 3 },
    { id: 'p4', name: 'Pipeline follow-up + referrals', why: 'Calls into Pacific time. Only works where the overlap is workable.', need: 4 },
    { id: 'p5', name: 'Film and edit the trip', why: 'Storage and upload heavy. Cheap months are the right months for it.', need: 2 },
    { id: 'p6', name: 'Deep work: no calls, build only', why: 'The remote low-wifi legs are for this and nothing else.', need: 1 }
  ];

  var API = { SPOTS: SPOTS, MONTH_NAMES: MONTH_NAMES, DEFAULT_ROUTE: DEFAULT_ROUTE, PROJECTS: PROJECTS };
  root.SFSPOTS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
