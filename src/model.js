/* ==========================================================================
   SWELL FUND — financial model
   Every number here traces to the source CSV unless marked ADDED.
   Runs unchanged in the browser (global SF) and in node (module.exports).
   ========================================================================== */
(function (root) {
  'use strict';

  var TODAY = new Date(2026, 8, 1); // Sept 2026, the model's month 0

  /* ---- Source data ------------------------------------------------------ */

  // Starting position (CSV: Starting Position)
  var START = [
    { id: 'checking', label: 'Checking', amount: 12000, conf: 'Known', spend: true, note: 'Liquid now.' },
    { id: 'savings', label: 'Savings', amount: 24000, conf: 'Known', spend: true, note: 'Liquid now.' },
    { id: 'pipeline', label: 'Solar pipeline', amount: 15000, conf: 'Estimate', spend: 'pipeline', note: 'Commissions already in pipeline. Probability-adjusted by the collection lever.' },
    { id: 'stocks', label: 'Stocks / 401(k)', amount: 60000, conf: 'Known', spend: false, note: 'BACKSTOP. Never counted as travel cash unless you flip the liquidation toggle.' },
    { id: 'condoEquity', label: 'Condo equity', amount: 60000, conf: 'Estimate', spend: false, note: 'BACKSTOP. Never counted unless you flip the equity-release toggle.' }
  ];

  // Pre-departure one-time cash events (CSV: Pre-Departure)
  var PRE = [
    { id: 'bizCard', label: 'Business credit card payoff', amount: 20000, conf: 'Known', kind: 'debt', note: '0% promo ends February 2027. Model pays it in the expiry month.' },
    { id: 'taxes2026', label: '2026 tax bill remaining', amount: 10000, conf: 'Estimate', kind: 'tax', note: 'Fixed known bill. New income is taxed separately by the reserve %.' },
    { id: 'europe', label: 'Europe trip (November)', amount: 3000, conf: 'Estimate', kind: 'travel', note: '2–3 weeks. Replace with the real budget.' },
    { id: 'loanPayoff', label: 'Student loan payoff (optional)', amount: 18000, conf: 'Known', kind: 'optional', note: 'Balance, not an expense. Only spent if you switch payoff on.' }
  ];

  // Recurring burn that follows you abroad (CSV: Abroad Fixed Burn, + ADDED)
  var FIXED = [
    { id: 'condoShortfall', label: 'Condo cash-flow shortfall', group: 'Condo', amount: 200, conf: 'Estimate', note: 'Negative monthly cash flow once rented. Confirm it excludes management.' },
    { id: 'propMgmt', label: 'Property management', group: 'Condo', amount: 200, conf: 'Placeholder', note: 'Replace with a real quote — usually 8–10% of rent.' },
    { id: 'condoReserve', label: 'Repair + vacancy reserve', group: 'Condo', amount: 200, conf: 'Planning', note: 'Turnover, HOA surprises, one vacant month a year.' },
    { id: 'storage', label: 'Storage unit', group: 'US carry', amount: 175, conf: 'Placeholder', note: 'Prime cut candidate — sell or donate instead.' },
    { id: 'vehicle', label: 'Vehicle storage / insurance / rego', group: 'US carry', amount: 75, conf: 'Placeholder', note: 'Set to $0 if the vehicle is sold.' },
    { id: 'usPhone', label: 'US phone number', group: 'US carry', amount: 40, conf: 'Placeholder', note: 'Needed for banking 2FA. A cheap VoIP line does it for ~$5.' },
    { id: 'intlSim', label: 'International eSIM / data', group: 'On the road', amount: 35, conf: 'Placeholder', note: 'Local SIMs are cheaper than roaming eSIMs in Indo and Sri Lanka.' },
    { id: 'insurance', label: 'Travel + medical insurance', group: 'On the road', amount: 200, conf: 'Placeholder', note: 'CONFIRM the policy covers surfing and motorbikes. Most exclude both.' },
    { id: 'studentLoanPmt', label: 'Student loan payment', group: 'Debt', amount: 0, conf: 'INPUT NEEDED', note: 'Enter the actual payment under your chosen plan (IDR / deferment / standard).' },
    { id: 'crm', label: 'CRM / Zoho', group: 'Business', amount: 35, conf: 'Placeholder', note: '' },
    { id: 'books', label: 'QuickBooks / bookkeeping', group: 'Business', amount: 75, conf: 'Placeholder', note: '' },
    { id: 'web', label: 'Website / domains / hosting', group: 'Business', amount: 35, conf: 'Placeholder', note: '' },
    { id: 'appHosting', label: 'App hosting / database / APIs', group: 'App', amount: 125, conf: 'Placeholder', note: 'Should scale with users and revenue, not sit flat.' },
    { id: 'workspace', label: 'Email / Workspace / cloud', group: 'Business', amount: 30, conf: 'Placeholder', note: '' },
    { id: 'software', label: 'Other software subscriptions', group: 'Business', amount: 100, conf: 'Placeholder', note: 'Audit every statement before you go. This line is always understated.' },
    { id: 'cpa', label: 'CPA / tax prep reserve', group: 'Business', amount: 125, conf: 'Placeholder', note: 'Expat filing adds forms. Budget the higher end.' },
    { id: 'entity', label: 'Entity / compliance / insurance', group: 'Business', amount: 75, conf: 'Placeholder', note: 'S-Corp fees, registrations, business liability.' },
    { id: 'vpn', label: 'VPN / password manager / backups', group: 'Digital', amount: 25, conf: 'Placeholder', note: 'A VPN is effectively mandatory for US banking from abroad.' },
    { id: 'fun', label: 'Entertainment subscriptions', group: 'Personal', amount: 50, conf: 'Placeholder', note: '' },
    { id: 'bankFx', label: 'ATM, FX + wire fees', group: 'On the road', amount: 45, conf: 'ADDED', added: true, note: 'ADDED — not in your CSV. 2–4% FX spread plus $3–8 per ATM pull adds up fast in cash economies.' },
    { id: 'hops', label: 'In-region hops + board bag fees', group: 'On the road', amount: 150, conf: 'ADDED', added: true, note: 'ADDED — not in your CSV. The $6k long-haul line covers continent jumps only. Bali→Sumbawa, Lima→Piura, ferries and $75–150 board fees every leg live here.' },
    { id: 'visaRuns', label: 'Visa extensions, onward tickets', group: 'On the road', amount: 40, conf: 'ADDED', added: true, note: 'ADDED — not in your CSV. Indo 60-day extensions, throwaway onward tickets, agent fees. Distinct from the $2,000 one-time visa/vaccine reserve.' }
  ];

  // Variable travel burn by region (CSV: Travel Burn)
  var REGIONS = [
    { id: 'csa', label: 'Central & South America', short: 'Americas', amount: 3000, color: '#BF8430', note: 'Housing, food, local transport, in-country surf travel.' },
    { id: 'aus', label: 'Australia (van life)', short: 'Australia', amount: 4000, color: '#18A276', note: 'Fuel, campsites, food, insurance, repairs. Excludes the van itself.' },
    { id: 'sea', label: 'SE Asia / Sri Lanka / Indo / Philippines', short: 'SE Asia', amount: 2500, color: '#4487DE', note: 'Cheapest region by a wide margin.' }
  ];

  // One-time trip costs (CSV: Travel Burn one-time, + ADDED)
  var ONETIME = [
    { id: 'longHaul', label: 'Long-haul flights + board fees', amount: 6000, conf: 'Planning', scales: true, note: 'Major continent repositioning. 24-month planning value; scales with trip length.' },
    { id: 'van', label: 'Australia van: buy/sell loss + repairs', amount: 4000, conf: 'Planning', needsAus: true, note: 'Net loss after resale, plus setup and repairs. Drops to $0 if you skip Australia.' },
    { id: 'charter', label: 'Boat charter / liveaboard block', amount: 0, conf: 'ADDED', added: true, charter: true, note: 'ADDED — not in your CSV. Mentawai or Maldives charters run $1,800–4,500 per week per person; a bareboat yacht in Indo or Tonga runs higher. Set weeks and rate below.' }
  ];

  // Irregular reserves (CSV: Reserves) — scaled by the emergency multiplier
  var RESERVES = [
    { id: 'boards', label: 'Surfboards, wetsuits, ding repair', amount: 3000, conf: 'Planning', note: '24-month reserve. Snapped boards in Indo and Puerto are a when, not an if.' },
    { id: 'tech', label: 'Laptop / phone / camera replacement', amount: 2500, conf: 'Planning', note: 'Theft, salt, and drops. Your income depends on the laptop.' },
    { id: 'medical', label: 'Medical / dental / deductibles', amount: 2500, conf: 'Planning', note: 'Reef cuts, staph, dental. Out of pocket before insurance pays.' },
    { id: 'flightHome', label: 'Emergency flight home', amount: 2500, conf: 'Planning', note: 'Last-minute one-way from the far side of the world.' },
    { id: 'visas', label: 'Visas, permits, vaccines, licences', amount: 2000, conf: 'Planning', note: 'Entry fees, IDP, rabies and typhoid series, dive/boat permits.' },
    { id: 'misc', label: 'General unexpected reserve', amount: 5000, conf: 'Planning', note: 'Missed flights, lost deposits, damage, the thing you did not think of.' }
  ];

  /* ---- Default lever state --------------------------------------------- */

  var DEFAULTS = {
    monthsToDeparture: 6,
    tripMonths: 24,
    months: { csa: 6, aus: 6, sea: 12 },
    regionOrder: ['aus', 'sea', 'csa'],
    route: null,          // set by the Adventure tab
    useRouteCosts: true,  // use each place's real monthly cost, not the regional average
    lifestyle: 1.0,
    emergency: 1.0,
    remoteIncome: 0,
    preIncome: 0,
    autoSolve: true,
    taxPct: 0.28,
    pipelinePct: 0.8,
    taxPipeline: true,
    leucadia: 4500,
    landingFund: 15000,
    payCard: true,
    payLoan: false,
    doEurope: true,
    scaleOneTime: true,
    charterWeeks: 2,
    charterRate: 2200,
    charterOn: true,
    liquidateStocks: false,
    releaseEquity: false,
    equityAmount: 40000,
    start: {}, pre: {}, fixed: {}, region: {}, onetime: {}, reserve: {}
  };
  START.forEach(function (r) { DEFAULTS.start[r.id] = r.amount; });
  PRE.forEach(function (r) { DEFAULTS.pre[r.id] = r.amount; });
  FIXED.forEach(function (r) { DEFAULTS.fixed[r.id] = r.amount; });
  REGIONS.forEach(function (r) { DEFAULTS.region[r.id] = r.amount; });
  ONETIME.forEach(function (r) { DEFAULTS.onetime[r.id] = r.amount; });
  RESERVES.forEach(function (r) { DEFAULTS.reserve[r.id] = r.amount; });

  /* ---- Helpers ---------------------------------------------------------- */

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function monthsBetween(from, y, m) { return (y - from.getFullYear()) * 12 + (m - from.getMonth()); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

  /* ---- The model -------------------------------------------------------- */

  function compute(s) {
    var T = Math.max(1, Math.round(s.tripMonths));
    var M = Math.max(0, Math.round(s.monthsToDeparture));
    var L = s.lifestyle, E = s.emergency;

    // --- monthly fixed overhead that follows you abroad -------------------
    var fixedRows = FIXED.map(function (r) {
      var amt = num(s.fixed[r.id], r.amount);
      return { id: r.id, label: r.label, group: r.group, conf: r.conf, note: r.note,
               added: !!r.added, monthly: amt, trip: amt * T };
    });
    var fixedMonthly = sum(fixedRows.map(function (r) { return r.monthly; }));

    // --- variable travel burn by region ----------------------------------
    // A route from the Adventure tab (s.schedule) overrides the flat regional
    // averages with the real monthly cost of each place, in the order visited.
    var sched = buildSchedule(s, T);
    var regionRows = REGIONS.map(function (r) {
      var mo, total;
      if (sched) {
        var mine = sched.filter(function (x) { return x.rid === r.id; });
        mo = mine.length;
        total = sum(mine.map(function (x) { return x.cost; })) * L;
      } else {
        mo = Math.max(0, num(s.months[r.id], 0));
        total = num(s.region[r.id], r.amount) * L * mo;
      }
      return { id: r.id, label: r.label, short: r.short, color: r.color, note: r.note,
               months: mo, burn: mo > 0 ? total / mo : num(s.region[r.id], r.amount) * L, total: total };
    });
    var regionMonths = sum(regionRows.map(function (r) { return r.months; }));
    var travelTotal = sum(regionRows.map(function (r) { return r.total; }));
    var travelMonthlyAvg = regionMonths > 0 ? travelTotal / regionMonths : 0;
    regionRows.forEach(function (r) { r.share = travelTotal > 0 ? r.total / travelTotal : 0; });

    // --- one-time trip costs ---------------------------------------------
    var ausMonths = (regionRows.filter(function (r) { return r.id === 'aus'; })[0] || {}).months || 0;
    var oneRows = ONETIME.map(function (r) {
      var amt;
      if (r.charter) amt = s.charterOn ? s.charterWeeks * s.charterRate : 0;
      else {
        amt = num(s.onetime[r.id], r.amount);
        if (r.scales && s.scaleOneTime) amt = amt * (T / 24);
        if (r.needsAus && ausMonths <= 0) amt = 0;
      }
      return { id: r.id, label: r.label, conf: r.conf, note: r.note, added: !!r.added, amount: amt };
    });
    var oneTimeTotal = sum(oneRows.map(function (r) { return r.amount; }));

    // --- irregular reserves ----------------------------------------------
    var reserveRows = RESERVES.map(function (r) {
      var amt = num(s.reserve[r.id], r.amount) * E;
      return { id: r.id, label: r.label, conf: r.conf, note: r.note, amount: amt };
    });
    var reserveTotal = sum(reserveRows.map(function (r) { return r.amount; }));

    // --- headline trip cost ----------------------------------------------
    var fixedTotal = fixedMonthly * T;
    var tripCost = travelTotal + fixedTotal + oneTimeTotal + reserveTotal;
    var burnAbroad = (travelMonthlyAvg + fixedMonthly);                 // recurring only
    var burnAllIn = T > 0 ? tripCost / T : 0;                            // incl. one-times + reserves
    var remoteTotal = s.remoteIncome * T;

    var landing = num(s.landingFund, 15000);
    var requiredAtZero = tripCost + landing;
    var required = Math.max(0, tripCost + landing - remoteTotal);

    // --- pre-departure cash math ------------------------------------------
    var startSpendable = num(s.start.checking, 12000) + num(s.start.savings, 24000);
    var pipelineGross = num(s.start.pipeline, 15000) * s.pipelinePct;
    var pipelineNet = pipelineGross * (s.taxPipeline ? (1 - s.taxPct) : 1);

    var preOutflows = num(s.leucadia, 4500) * M
      + (s.doEurope ? num(s.pre.europe, 3000) : 0)
      + num(s.pre.taxes2026, 10000)
      + (s.payCard ? num(s.pre.bizCard, 20000) : 0)
      + (s.payLoan ? num(s.pre.loanPayoff, 18000) : 0);

    var backstopCash = (s.liquidateStocks ? num(s.start.stocks, 60000) : 0)
      + (s.releaseEquity ? num(s.equityAmount, 40000) : 0);

    // Required new gross income before departure, solved from the identity:
    //   start + pipelineNet + G(1 - tax) + backstops - preOutflows = required
    var requiredGross = Math.max(0,
      (required + preOutflows - startSpendable - pipelineNet - backstopCash) / (1 - s.taxPct));
    var requiredMonthlyGross = M > 0 ? requiredGross / M : Infinity;

    var G = s.autoSolve ? requiredGross : Math.max(0, num(s.preIncome, 0));
    var departureCash = startSpendable + pipelineNet + backstopCash
      + G * (1 - s.taxPct) - preOutflows;

    var gap = required - departureCash;
    var fundedPct = required > 0 ? departureCash / required : 1;
    var endingCash = departureCash - tripCost + remoteTotal;

    // --- month-by-month trajectory ----------------------------------------
    var traj = buildTrajectory(s, {
      M: M, T: T, G: G, startSpendable: startSpendable, pipelineNet: pipelineNet,
      backstopCash: backstopCash, fixedMonthly: fixedMonthly, regionRows: regionRows,
      oneRows: oneRows, reserveTotal: reserveTotal, ausMonths: ausMonths, landing: landing,
      sched: sched
    });

    // --- how long the pre-departure sprint has to run at a given monthly gross
    function sprintMonths(monthlyGross) {
      var fixedPre = (s.doEurope ? num(s.pre.europe, 3000) : 0) + num(s.pre.taxes2026, 10000)
        + (s.payCard ? num(s.pre.bizCard, 20000) : 0) + (s.payLoan ? num(s.pre.loanPayoff, 18000) : 0);
      var perMonth = monthlyGross * (1 - s.taxPct) - num(s.leucadia, 4500);
      if (perMonth <= 0) return Infinity;
      return (required + fixedPre - startSpendable - pipelineNet - backstopCash) / perMonth;
    }

    // Runway: months of travel before cash crosses the protected landing floor
    var runway = T, crossed = false;
    for (var i = 0; i < traj.length; i++) {
      if (traj[i].phase === 'trip' && traj[i].cash < landing - 1) { runway = traj[i].tripMonth - 1; crossed = true; break; }
    }
    var minCash = Math.min.apply(null, traj.map(function (p) { return p.cash; }));

    // --- break-even remote income ------------------------------------------
    var breakEven = burnAbroad;
    var breakEvenAllIn = burnAllIn;

    // --- one more month of grinding ----------------------------------------
    var expectedMonthlyGross = s.autoSolve ? requiredMonthlyGross : (M > 0 ? G / M : 0);
    var oneMoreMonth = expectedMonthlyGross * (1 - s.taxPct) - num(s.leucadia, 4500);

    return {
      T: T, M: M,
      departureDate: addMonths(TODAY, M + 1), lastGrindDate: addMonths(TODAY, M),
      returnDate: addMonths(TODAY, M + T),
      fixedRows: fixedRows.slice().sort(function (a, b) { return b.trip - a.trip; }),
      fixedMonthly: fixedMonthly, fixedTotal: fixedTotal,
      regionRows: regionRows, regionMonths: regionMonths,
      travelTotal: travelTotal, travelMonthlyAvg: travelMonthlyAvg,
      oneRows: oneRows, oneTimeTotal: oneTimeTotal,
      reserveRows: reserveRows, reserveTotal: reserveTotal,
      tripCost: tripCost, landing: landing,
      requiredAtZero: requiredAtZero, required: required,
      remoteTotal: remoteTotal,
      startSpendable: startSpendable, pipelineGross: pipelineGross, pipelineNet: pipelineNet,
      preOutflows: preOutflows, backstopCash: backstopCash,
      requiredGross: requiredGross, requiredMonthlyGross: requiredMonthlyGross,
      preIncomeUsed: G, departureCash: departureCash,
      gap: gap, fundedPct: fundedPct, endingCash: endingCash,
      burnAbroad: burnAbroad, burnAllIn: burnAllIn,
      breakEven: breakEven, breakEvenAllIn: breakEvenAllIn,
      oneMoreMonth: oneMoreMonth, expectedMonthlyGross: expectedMonthlyGross,
      sprintMonths: sprintMonths, sched: sched,
      traj: traj, runway: runway, runwayCrossed: crossed, minCash: minCash,
      touchesInvestments: s.liquidateStocks, touchesEquity: s.releaseEquity,
      flags: validate(s, { regionMonths: regionMonths, T: T, gap: gap, minCash: minCash, landing: landing, M: M })
    };
  }

  /* One entry per month abroad: which region, which place, what it costs.
     Returns null when no route is set, and the flat regional averages apply. */
  function buildSchedule(s, T) {
    if (!s.route || !s.route.length || !s.useRouteCosts) return null;
    var out = [];
    s.route.forEach(function (leg) {
      var n = Math.max(0, Math.round(leg.months));
      for (var i = 0; i < n && out.length < T; i++) {
        out.push({ rid: leg.rid, cost: leg.cost, spotId: leg.spot, label: leg.name, first: i === 0 });
      }
    });
    if (!out.length) return null;
    // Short routes fall back to the last leg's region for the remaining months
    var last = out[out.length - 1];
    while (out.length < T) out.push({ rid: last.rid, cost: last.cost, spotId: last.spotId, label: last.label + ' (unplanned)', first: false, filler: true });
    return out.slice(0, T);
  }

  /* Month-by-month cash path from today through the end of the trip. */
  function buildTrajectory(s, c) {
    var pts = [], cash = c.startSpendable + c.backstopCash;
    var M = c.M, T = c.T;
    var monthlyGross = M > 0 ? c.G / M : 0;
    var pipelineMonths = Math.min(3, Math.max(1, M));
    var novIdx = clampIdx(monthsBetween(TODAY, 2026, 10), 1, M);   // November 2026
    var febIdx = clampIdx(monthsBetween(TODAY, 2027, 1), 1, M);    // February 2027, 0% expiry
    var taxIdx = Math.max(1, M);                                   // settle the 2026 bill before wheels up

    pts.push({ i: 0, date: new Date(TODAY), phase: 'now', cash: cash, label: 'Today',
               income: 0, spend: 0, note: 'Checking + savings' + (c.backstopCash ? ' + released backstops' : '') });

    for (var i = 1; i <= M; i++) {
      var income = monthlyGross * (1 - s.taxPct);
      if (i <= pipelineMonths) income += c.pipelineNet / pipelineMonths;
      var spend = num(s.leucadia, 4500);
      var events = [];
      if (s.doEurope && i === novIdx) { spend += num(s.pre.europe, 3000); events.push('Europe trip'); }
      if (s.payCard && i === febIdx) { spend += num(s.pre.bizCard, 20000); events.push('Card payoff — 0% expires'); }
      if (i === taxIdx) { spend += num(s.pre.taxes2026, 10000); events.push('2026 tax bill'); }
      if (s.payLoan && i === M) { spend += num(s.pre.loanPayoff, 18000); events.push('Student loan payoff'); }
      cash += income - spend;
      pts.push({ i: i, date: addMonths(TODAY, i), phase: 'pre', cash: cash, income: income, spend: spend,
                 label: 'Grind month ' + i, note: events.join(' · ') || 'Leucadia living + new income' });
    }

    // Month-by-month region schedule: the route if there is one, else the
    // regions in order, in contiguous blocks.
    var sched = c.sched;
    if (!sched) {
      sched = [];
      (s.regionOrder || ['csa', 'aus', 'sea']).forEach(function (rid) {
        var r = REGIONS.filter(function (x) { return x.id === rid; })[0];
        var mo = Math.max(0, num(s.months[rid], 0));
        for (var k = 0; k < mo; k++) sched.push({ rid: rid, first: k === 0, cost: num(s.region[rid], r.amount), label: r.short });
      });
    }

    // A long-haul leg is a change of region, not a change of town.
    var hops = 0, prev = null;
    sched.forEach(function (x) { x.hop = x.rid !== prev; if (x.hop) hops++; prev = x.rid; });
    hops = hops || 1;

    var oneById = {}; c.oneRows.forEach(function (r) { oneById[r.id] = r.amount; });
    var perHopFlight = oneById.longHaul / hops;
    var reservePerMonth = T > 0 ? c.reserveTotal / T : 0;
    var charterMonth = firstCharterMonth(sched, T);
    var seenAus = false;

    for (var j = 1; j <= T; j++) {
      var slot = sched[j - 1] || { rid: 'sea', cost: 0, hop: false, label: '—' };
      var burn = slot.cost * s.lifestyle;
      var spend = c.fixedMonthly + burn + reservePerMonth;
      var ev = [];
      if (slot.hop) { spend += perHopFlight; ev.push('Long-haul to ' + slot.label); }
      if (slot.rid === 'aus' && !seenAus) { spend += oneById.van; ev.push('Van purchase + setup'); seenAus = true; }
      if (j === charterMonth && oneById.charter > 0) { spend += oneById.charter; ev.push('Boat charter block'); }
      cash += s.remoteIncome - spend;
      pts.push({ i: M + j, tripMonth: j, date: addMonths(TODAY, M + j), phase: 'trip', cash: cash,
                 income: s.remoteIncome, spend: spend, burn: burn, region: slot.rid,
                 label: slot.label, place: slot.label,
                 note: ev.join(' · ') || (slot.label + ' burn + home-break overhead') });
    }
    return pts;
  }

  /* The charter lands in the first Mentawai or Maldives month if the route has
     one, otherwise 60% of the way through the trip. */
  function firstCharterMonth(sched, T) {
    for (var i = 0; i < sched.length; i++) {
      if (sched[i].spotId === 'mentawais' || sched[i].spotId === 'maldives') return i + 1;
    }
    return Math.min(T, Math.max(1, Math.round(T * 0.6)));
  }

  function validate(s, c) {
    var f = [];
    if (c.regionMonths !== c.T) {
      f.push({ level: 'error', text: 'Region months total ' + c.regionMonths + ' but the trip is ' + c.T + ' months. ' +
        (c.regionMonths < c.T ? (c.T - c.regionMonths) + ' months are unplanned and unbudgeted.' : 'You are over by ' + (c.regionMonths - c.T) + '.') });
    }
    if (c.M === 0) f.push({ level: 'warn', text: 'Zero months until departure — you leave on whatever cash you hold today.' });
    if (s.liquidateStocks) f.push({ level: 'warn', text: 'Investment liquidation is ON. Stocks/401(k) are being counted as travel cash, against your stated preference.' });
    if (s.releaseEquity) f.push({ level: 'warn', text: 'Condo equity release is ON. You are borrowing against or selling the condo to fund the trip.' });
    if (s.payLoan) f.push({ level: 'warn', text: 'Student loan payoff is ON — the $18k balance is being treated as a pre-departure cash expense.' });
    if (!s.payCard) f.push({ level: 'error', text: 'Card payoff is OFF. The 0% promo expires in February 2027 and the balance starts accruing interest while you are abroad.' });
    if (c.minCash < 0) f.push({ level: 'error', text: 'Cash goes negative at some point in this plan. The trajectory chart shows where.' });
    else if (c.minCash < c.landing - 1) f.push({ level: 'warn', text: 'Cash dips below the protected landing fund before the trip ends.' });
    if (s.fixedVal && s.fixedVal.studentLoanPmt === 0) f.push({ level: 'info', text: 'Student loan payment is still $0 — INPUT NEEDED.' });
    return f;
  }

  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function clampIdx(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---- Scenario presets -------------------------------------------------- */

  function scaleRegions(base, T) {
    var total = base.csa + base.aus + base.sea || 1;
    var r = { csa: Math.round(base.csa / total * T), aus: Math.round(base.aus / total * T) };
    r.sea = T - r.csa - r.aus;
    return r;
  }

  var SCENARIOS = [
    { id: 'lean18', name: 'Lean 18', sub: '18 months · $0 remote · lean lifestyle',
      patch: { tripMonths: 18, lifestyle: 0.8, remoteIncome: 0, months: scaleRegions({ csa: 6, aus: 6, sea: 12 }, 18) } },
    { id: 'base24', name: 'Base 24', sub: '24 months · $0 remote',
      patch: { tripMonths: 24, lifestyle: 1.0, remoteIncome: 0, months: { csa: 6, aus: 6, sea: 12 } } },
    { id: 'base24k2', name: 'Base 24 + $2k', sub: '24 months · $2,000/mo remote',
      patch: { tripMonths: 24, lifestyle: 1.0, remoteIncome: 2000, months: { csa: 6, aus: 6, sea: 12 } } },
    { id: 'comfy', name: 'Comfortable 24', sub: '24 months · $3,000/mo remote · 1.25× lifestyle',
      patch: { tripMonths: 24, lifestyle: 1.25, remoteIncome: 3000, months: { csa: 6, aus: 6, sea: 12 } } }
  ];

  /* What each lever is worth, in dollars off the required departure cash.
     Ranked, so the biggest move is obvious without hunting through sliders. */
  function leverRank(state) {
    var base = compute(state).required;
    var tries = [
      { label: 'Cut the trip to 18 months', patch: { tripMonths: 18, months: scaleRegions(state.months, 18), route: trimRoute(state.route, 18) } },
      { label: 'Earn $2,000/mo remotely', patch: { remoteIncome: 2000 } },
      { label: 'Earn $3,000/mo remotely', patch: { remoteIncome: 3000 } },
      { label: 'Travel lean (0.8× lifestyle)', patch: { lifestyle: 0.8 } },
      { label: 'Kill storage, vehicle, subscriptions', patch: { fixed: Object.assign({}, state.fixed, { storage: 0, vehicle: 0, fun: 0, software: 40 }) } },
      { label: 'Sell the condo instead of renting it', patch: { fixed: Object.assign({}, state.fixed, { condoShortfall: 0, propMgmt: 0, condoReserve: 0 }) } },
      { label: 'Swap Australia for more SE Asia', patch: swapAus(state) },
      { label: 'Skip the boat charter', patch: { charterOn: false } },
      { label: 'Drop the landing fund to $10k', patch: { landingFund: 10000 } }
    ];
    return tries.map(function (t) {
      var s = clone(state);
      Object.keys(t.patch).forEach(function (k) { s[k] = t.patch[k]; });
      var r = compute(s);
      return { label: t.label, saves: base - r.required, required: r.required,
               monthly: r.requiredMonthlyGross };
    }).sort(function (a, b) { return b.saves - a.saves; });
  }

  /* Australia is the expensive region. This swaps its months into SE Asia at
     SE Asia's own cost, keeping the trip the same length. */
  function swapAus(state) {
    var m = { csa: state.months.csa, aus: 0, sea: state.months.sea + state.months.aus };
    if (!state.route || !state.useRouteCosts) return { months: m };
    var seaCost = 1800, route = [];
    state.route.forEach(function (leg) {
      if (leg.rid === 'aus') route.push({ spot: 'sea-swap', months: leg.months, rid: 'sea', cost: seaCost, name: 'SE Asia (swapped)' });
      else route.push(leg);
    });
    return { months: m, route: route };
  }

  function trimRoute(route, T) {
    if (!route) return route;
    var out = [], left = T;
    for (var i = 0; i < route.length && left > 0; i++) {
      var n = Math.min(route[i].months, left);
      out.push(Object.assign({}, route[i], { months: n }));
      left -= n;
    }
    return out;
  }

  function runScenario(state, patch) {
    var s = clone(state);
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    if (patch.tripMonths && s.route && !patch.route) s.route = trimRoute(s.route, patch.tripMonths);
    s.autoSolve = true;
    return compute(s);
  }

  var API = {
    TODAY: TODAY, START: START, PRE: PRE, FIXED: FIXED, REGIONS: REGIONS,
    ONETIME: ONETIME, RESERVES: RESERVES, DEFAULTS: DEFAULTS, SCENARIOS: SCENARIOS,
    compute: compute, runScenario: runScenario, clone: clone, scaleRegions: scaleRegions,
    addMonths: addMonths, leverRank: leverRank, trimRoute: trimRoute
  };

  root.SF = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
