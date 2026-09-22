/* ==========================================================================
   SWELL FUND — interface
   ========================================================================== */
(function () {
  'use strict';

  var SPOTS = SFSPOTS.SPOTS, MN = SFSPOTS.MONTH_NAMES, PROJECTS = SFSPOTS.PROJECTS;
  var byId = {}; SPOTS.forEach(function (s) { byId[s.id] = s; });
  var REG = { csa: { name: 'Americas', color: '#BF8430' }, aus: { name: 'Australia', color: '#18A276' }, sea: { name: 'SE Asia', color: '#4487DE' } };
  var STORE = 'swellfund.v1';

  /* ---- state ------------------------------------------------------------ */

  var S = SF.clone(SF.DEFAULTS);
  S.route = SFSPOTS.DEFAULT_ROUTE.map(function (l, i) { return mkLeg(l.spot, l.months, i); });
  S.tab = 'treasure';
  S.monthFilter = 0;          // 0 = any month
  S.regionFilter = 'all';
  S.assign = {};              // legKey -> project id
  syncMonths();
  load();

  function mkLeg(spotId, months, i) {
    var sp = byId[spotId];
    return { key: spotId + '-' + i + '-' + Math.random().toString(36).slice(2, 7),
             spot: spotId, name: sp.name, rid: sp.region, cost: sp.cost, months: months };
  }
  function syncMonths() {
    var m = { csa: 0, aus: 0, sea: 0 };
    S.route.forEach(function (l) { m[l.rid] += l.months; });
    var total = m.csa + m.aus + m.sea;
    if (total > 0) { S.months = m; S.tripMonths = total; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var v = JSON.parse(raw);
      Object.keys(v).forEach(function (k) { S[k] = v[k]; });
      if (!S.route || !S.route.length) S.route = SFSPOTS.DEFAULT_ROUTE.map(function (l, i) { return mkLeg(l.spot, l.months, i); });
      syncMonths();
    } catch (e) {}
  }

  /* ---- formatting ------------------------------------------------------- */

  function money(n, dp) {
    if (!isFinite(n)) return '—';
    var neg = n < 0, v = Math.abs(n);
    return (neg ? '−$' : '$') + v.toLocaleString('en-US', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }
  function k(n) {
    if (!isFinite(n)) return '—';
    var neg = n < 0, v = Math.abs(n);
    if (v >= 1000) return (neg ? '−$' : '$') + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
    return (neg ? '−$' : '$') + Math.round(v);
  }
  function pct(n) { return Math.round(n * 100) + '%'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function monthLabel(d) { return MN[d.getMonth()] + " '" + String(d.getFullYear()).slice(2); }
  function tripDate(i) { return SF.addMonths(SF.TODAY, i); }

  /* ---- render root ------------------------------------------------------ */

  var R = null;   // latest model result

  function recompute() { R = SF.compute(S); }

  function renderAll(keepLevers) {
    recompute();
    document.getElementById('verdict').outerHTML = verdictPill();
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.tab === S.tab));
    });
    document.getElementById('treasure').hidden = S.tab !== 'treasure';
    document.getElementById('adventure').hidden = S.tab !== 'adventure';
    if (S.tab === 'treasure') renderTreasure(keepLevers); else renderAdventure();
    save();
  }

  function verdictPill() {
    var p = R.fundedPct, cls = p >= 0.995 ? 'go' : p >= 0.85 ? 'close' : 'no';
    var txt = p >= 0.995 ? 'Trip funded' : p >= 0.85 ? 'Nearly there' : 'Not funded';
    return '<span class="verdict ' + cls + '" id="verdict"><span class="dot"></span>' + txt +
      ' · ' + pct(Math.min(p, 9.99)) + '</span>';
  }

  /* ======================================================================
     TREASURE
     ====================================================================== */

  function renderTreasure(keepLevers) {
    if (keepLevers) {
      document.querySelectorAll('[data-readout]').forEach(function (n) { n.textContent = readout(n.dataset.readout); });
    } else {
      document.getElementById('levers').innerHTML = leversHTML();
    }
    document.getElementById('kpis').innerHTML = kpisHTML();
    document.getElementById('gauge').innerHTML = gaugeHTML();
    document.getElementById('flags').innerHTML = flagsHTML();
    document.getElementById('traj').innerHTML = trajHTML();
    document.getElementById('glance').innerHTML = glanceHTML();
    document.getElementById('plan').innerHTML = planHTML();
    document.getElementById('levrank').innerHTML = leverRankHTML();
    document.getElementById('audit').innerHTML = auditHTML();
    document.getElementById('ladder').innerHTML = ladderHTML();
    document.getElementById('breakeven').innerHTML = breakEvenHTML();
    document.getElementById('onemore').innerHTML = oneMoreHTML();
    document.getElementById('scen').innerHTML = scenariosHTML();
    document.getElementById('inputs').innerHTML = inputsHTML();
    wireChart();
  }

  /* ---- levers ----------------------------------------------------------- */

  var LEVERS = [
    { id: 'monthsToDeparture', label: 'Months until departure', min: 0, max: 18, step: 1, fmt: 'mo',
      note: 'Sets the length of the income sprint.' },
    { id: 'tripMonths', label: 'Months abroad', min: 6, max: 30, step: 1, fmt: 'mo',
      note: 'Route months must match. Change it on the Adventure tab to keep them in sync.' },
    { id: 'lifestyle', label: 'Travel lifestyle', min: 0.7, max: 1.5, step: 0.05, fmt: 'x',
      note: '0.8 lean · 1.0 base · 1.25 comfortable.' },
    { id: 'remoteIncome', label: 'Remote income abroad', min: 0, max: 10000, step: 250, fmt: '$mo',
      note: 'After tax. The base case has to work at $0.' },
    { id: 'taxPct', label: 'Tax reserve on new income', min: 0.1, max: 0.5, step: 0.01, fmt: '%',
      note: 'Applied to new gross income and, optionally, the pipeline.' },
    { id: 'pipelinePct', label: 'Pipeline collection rate', min: 0, max: 1, step: 0.05, fmt: '%',
      note: 'What share of the $15k pipeline actually lands.' },
    { id: 'leucadia', label: 'Leucadia living', min: 2500, max: 8000, step: 100, fmt: '$mo',
      note: 'Use your trailing 3-month actual, not the number you wish it were.' },
    { id: 'landingFund', label: 'Landing fund on return', min: 0, max: 50000, step: 1000, fmt: '$',
      note: 'Protected floor. Never spent as travel money.' },
    { id: 'emergency', label: 'Emergency set multiplier', min: 0.5, max: 2, step: 0.05, fmt: 'x',
      note: 'Scales every irregular reserve at once.' },
    { id: 'charterWeeks', label: 'Boat charter weeks', min: 0, max: 8, step: 1, fmt: 'wk',
      note: 'Mentawai or Maldives. Lands in your first boat-trip month.' },
    { id: 'charterRate', label: 'Charter rate per week', min: 800, max: 6000, step: 100, fmt: '$',
      note: 'Bunk on a surf charter $1.8–4.5k. Bareboat yacht runs higher.' },
    { id: 'preIncome', label: 'Pre-departure gross income', min: 0, max: 400000, step: 5000, fmt: '$',
      note: 'Switch off auto-solve to drive this yourself.' }
  ];

  function readout(id) {
    var l = LEVERS.filter(function (x) { return x.id === id; })[0], v = S[id];
    if (l.fmt === '$mo') return money(v) + '/mo';
    if (l.fmt === '$') return money(v);
    if (l.fmt === '%') return Math.round(v * 100) + '%';
    if (l.fmt === 'x') return v.toFixed(2) + '×';
    if (l.fmt === 'wk') return v + (v === 1 ? ' wk' : ' wks');
    return v + ' mo';
  }

  function leversHTML() {
    var h = LEVERS.map(function (l) {
      var disabled = (l.id === 'preIncome' && S.autoSolve) || (l.id === 'tripMonths');
      return '<div class="lever">' +
        '<label for="lv-' + l.id + '"><span>' + esc(l.label) + '</span><b data-readout="' + l.id + '">' + readout(l.id) + '</b></label>' +
        '<input type="range" id="lv-' + l.id + '" data-lever="' + l.id + '" min="' + l.min + '" max="' + l.max +
        '" step="' + l.step + '" value="' + S[l.id] + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="note">' + esc(l.note) + '</span></div>';
    }).join('');

    var toggles = [
      ['autoSolve', 'Auto-solve pre-departure income to the required number'],
      ['payCard', 'Pay off the $20k business card before the 0% expires'],
      ['doEurope', 'Keep the November Europe trip'],
      ['charterOn', 'Include a boat charter block'],
      ['taxPipeline', 'Reserve tax on collected pipeline too'],
      ['scaleOneTime', 'Scale long-haul flights to trip length'],
      ['useRouteCosts', 'Price the trip off my actual route, not regional averages'],
      ['payLoan', 'Pay off the $18k student loan before leaving'],
      ['liquidateStocks', 'Liquidate stocks / 401(k) — backstop, off by default'],
      ['releaseEquity', 'Release condo equity — backstop, off by default']
    ].map(function (t) {
      return '<label class="switch"><input type="checkbox" data-toggle="' + t[0] + '"' + (S[t[0]] ? ' checked' : '') + '>' +
        '<span>' + esc(t[1]) + '</span></label>';
    }).join('');

    return '<div class="levers">' + h + '</div>' +
      '<div class="card-h" style="margin-top:22px">Switches<span class="rule"></span></div>' +
      '<div class="levers">' + toggles + '</div>';
  }

  /* ---- KPI tiles -------------------------------------------------------- */

  function kpisHTML() {
    var tiles = [
      { surf: 'Paddle-Out', fin: 'Required departure cash', val: money(R.required), cls: 'key',
        sub: R.remoteTotal > 0 ? money(R.requiredAtZero) + ' if remote income is $0' : 'Trip cost + landing fund' },
      { surf: 'Swell Fund', fin: 'Cash on departure day', val: money(R.departureCash),
        cls: R.departureCash >= R.required ? 'good' : '', sub: 'Checking + savings + pipeline + new income − costs' },
      { surf: 'The Gap', fin: 'Funding shortfall', val: money(Math.max(0, R.gap)),
        cls: R.gap > 1 ? 'bad' : 'good', sub: R.gap > 1 ? 'Still to find before wheels up' : 'Funded — nothing left to find' },
      { surf: 'The Grind', fin: 'Gross income needed before departure', val: money(R.requiredGross),
        sub: 'Over ' + R.M + ' months, at a ' + Math.round(S.taxPct * 100) + '% tax reserve' },
      { surf: 'Monthly Set', fin: 'Required gross income per month', val: money(R.requiredMonthlyGross),
        cls: 'warn', sub: 'Every month between now and ' + monthLabel(R.lastGrindDate) },
      { surf: 'Burn Rate', fin: 'Monthly burn abroad', val: money(R.burnAbroad),
        sub: money(R.burnAllIn) + '/mo all-in with one-times and reserves' },
      { surf: 'Return Cash', fin: 'Projected cash on return', val: money(R.endingCash),
        cls: R.endingCash >= R.landing ? 'good' : 'bad', sub: monthLabel(R.returnDate) + ' · floor is ' + money(R.landing) },
      { surf: 'Runway', fin: 'Months before cash hits the floor', val: R.runwayCrossed ? R.runway + ' mo' : R.T + '+ mo',
        cls: R.runwayCrossed ? 'bad' : 'good', sub: R.runwayCrossed ? 'Dry ' + (R.T - R.runway) + (R.T - R.runway === 1 ? ' month' : ' months') + ' before the trip ends' : 'Covers the whole trip' }
    ];
    return tiles.map(function (t) {
      return '<div class="kpi ' + (t.cls || '') + '"><div class="surf">' + t.surf + '</div>' +
        '<div class="fin">' + t.fin + '</div>' +
        '<div class="val num">' + t.val + '</div><div class="sub">' + esc(t.sub) + '</div></div>';
    }).join('');
  }

  /* ---- gauge ------------------------------------------------------------ */

  function gaugeHTML() {
    var p = Math.max(0, Math.min(1.15, R.fundedPct));
    var W = 250, H = 148, cx = 125, cy = 126, r = 96;
    function pt(t) { var a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }
    function arc(t0, t1, color, w, op) {
      var a = pt(t0), b = pt(t1);
      return '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' +
        b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" fill="none" stroke="' + color + '" stroke-width="' + w +
        '" stroke-linecap="butt" opacity="' + (op || 1) + '"></path>';
    }
    var track = arc(0, 0.7, 'var(--coral)', 9, 0.22) + arc(0.705, 0.95, 'var(--amber)', 9, 0.22) + arc(0.955, 1, 'var(--mint)', 9, 0.22);
    var col = p >= 0.995 ? 'var(--mint)' : p >= 0.85 ? 'var(--amber)' : 'var(--coral)';
    var live = p > 0.004 ? arc(0, Math.min(p, 1), col, 9) : '';
    var n = pt(Math.min(p, 1));
    var needle = '<line x1="' + cx + '" y1="' + cy + '" x2="' + n[0].toFixed(1) + '" y2="' + n[1].toFixed(1) +
      '" stroke="' + col + '" stroke-width="2"></line><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + col + '"></circle>';
    var ticks = [0, 0.7, 0.95, 1].map(function (t) {
      var o = pt(t), i2 = [cx + (r - 13) * Math.cos(Math.PI * (1 - t)), cy - (r - 13) * Math.sin(Math.PI * (1 - t))];
      return '<line x1="' + i2[0].toFixed(1) + '" y1="' + i2[1].toFixed(1) + '" x2="' + o[0].toFixed(1) + '" y2="' + o[1].toFixed(1) +
        '" stroke="var(--line)" stroke-width="1"></line>';
    }).join('');

    var msg = p >= 0.995
      ? 'Funded. Ending cash lands at ' + money(R.endingCash) + '.'
      : p >= 0.85
        ? 'Close. ' + money(R.gap) + ' short — one strong month or a small cut closes it.'
        : 'Not funded yet. ' + money(R.gap) + ' short of the paddle-out number.';

    return '<div class="gauge-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" ' +
      'aria-label="Funded ' + pct(R.fundedPct) + ' of required departure cash">' +
      track + live + ticks + needle +
      '<text x="18" y="142" fill="var(--dim)" text-anchor="start">0%</text>' +
      '<text x="' + cx + '" y="20" fill="var(--dim)" text-anchor="middle">95%</text>' +
      '<text x="232" y="142" fill="var(--dim)" text-anchor="end">100%</text>' +
      '</svg><div class="gauge-read"><div class="pct" style="color:' + col + '">' + pct(Math.min(R.fundedPct, 9.99)) + '</div>' +
      '<div class="cap">Departure cash vs required</div></div></div>' +
      '<p class="hint">' + esc(msg) + '</p>' +
      '<div class="kv"><div class="r"><span class="k">Departure</span><span class="fill"></span><span class="v">' + monthLabel(R.departureDate) + '</span></div>' +
      '<div class="r"><span class="k">Home again</span><span class="fill"></span><span class="v">' + monthLabel(R.returnDate) + '</span></div>' +
      '<div class="r"><span class="k">Sprint at $15k/mo gross</span><span class="fill"></span><span class="v">' + sprintTxt(15000) + '</span></div>' +
      '<div class="r"><span class="k">Sprint at $25k/mo gross</span><span class="fill"></span><span class="v">' + sprintTxt(25000) + '</span></div></div>';
  }

  function sprintTxt(g) {
    var m = R.sprintMonths(g);
    if (!isFinite(m) || m > 120) return 'never';
    return (m <= 0 ? '0' : m.toFixed(1)) + ' mo';
  }

  /* ---- flags ------------------------------------------------------------ */

  function flagsHTML() {
    if (!R.flags.length) return '<div class="flag info"><b>OK</b><span>Every check passes. Region months match the trip, no backstop is being counted, and cash never goes negative.</span></div>';
    return R.flags.map(function (f) {
      return '<div class="flag ' + f.level + '"><b>' + (f.level === 'error' ? 'Check' : f.level === 'warn' ? 'Note' : 'FYI') + '</b><span>' + esc(f.text) + '</span></div>';
    }).join('');
  }

  /* ---- cash trajectory chart -------------------------------------------- */

  function trajHTML() {
    var pts = R.traj, W = 1000, H = 330, P = { t: 18, r: 16, b: 46, l: 62 };
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var vals = pts.map(function (p) { return p.cash; }).concat([0, R.landing]);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.1 || 1000; lo -= pad; hi += pad;
    var X = function (i) { return P.l + (i / (pts.length - 1)) * iw; };
    var Y = function (v) { return P.t + (1 - (v - lo) / (hi - lo)) * ih; };

    // gridlines on round numbers the chart actually reaches
    var step = niceStep((hi - lo) / 5), g = '';
    for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      g += '<line x1="' + P.l + '" y1="' + Y(v).toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + Y(v).toFixed(1) +
        '" stroke="var(--line-soft)" stroke-width="1"></line>' +
        '<text x="' + (P.l - 9) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" fill="var(--dim)" text-anchor="end">' + k(v) + '</text>';
    }

    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.cash).toFixed(1); }).join(' ');
    var area = line + ' L' + X(pts.length - 1).toFixed(1) + ' ' + Y(Math.max(lo, 0)).toFixed(1) +
      ' L' + X(0).toFixed(1) + ' ' + Y(Math.max(lo, 0)).toFixed(1) + ' Z';

    // region ribbon under the plot
    var ribbon = '';
    pts.forEach(function (p, i) {
      if (p.phase !== 'trip') return;
      var c = (REG[p.region] || {}).color || 'var(--line)';
      ribbon += '<rect x="' + (X(i) - iw / (pts.length - 1) / 2).toFixed(1) + '" y="' + (P.t + ih + 9) +
        '" width="' + (iw / (pts.length - 1) + 0.6).toFixed(1) + '" height="6" fill="' + c + '" opacity="0.85"></rect>';
    });
    ribbon += '<rect x="' + X(0).toFixed(1) + '" y="' + (P.t + ih + 9) + '" width="' + (X(R.M) - X(0)).toFixed(1) +
      '" height="6" fill="var(--gold)" opacity="0.5"></rect>';

    var depX = X(R.M);
    var marks =
      '<line x1="' + depX.toFixed(1) + '" y1="' + P.t + '" x2="' + depX.toFixed(1) + '" y2="' + (P.t + ih) +
      '" stroke="var(--gold)" stroke-width="1" stroke-dasharray="3 3"></line>' +
      '<text x="' + (depX + 6).toFixed(1) + '" y="' + (P.t + 11) + '" fill="var(--gold-hi)">DEPARTURE ' + monthLabel(R.departureDate).toUpperCase() + '</text>' +
      '<line x1="' + P.l + '" y1="' + Y(R.landing).toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + Y(R.landing).toFixed(1) +
      '" stroke="var(--mint)" stroke-width="1" stroke-dasharray="5 4" opacity="0.75"></line>' +
      '<text x="' + (W - P.r) + '" y="' + (Y(R.landing) - 6).toFixed(1) + '" fill="var(--mint)" text-anchor="end">LANDING FUND FLOOR ' + k(R.landing) + '</text>';
    if (lo < 0 && hi > 0) {
      marks += '<line x1="' + P.l + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + Y(0).toFixed(1) +
        '" stroke="var(--coral)" stroke-width="1" opacity="0.6"></line>';
    }

    // x labels: every 3rd month
    var xl = '';
    pts.forEach(function (p, i) {
      if (i % 3) return;
      xl += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 16) + '" fill="var(--dim)" text-anchor="middle">' + monthLabel(p.date) + '</text>';
    });

    var end = pts[pts.length - 1];
    var endCol = end.cash >= R.landing ? 'var(--mint)' : 'var(--coral)';

    return '<div class="chart-holder"><svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" id="trajsvg" role="img" ' +
      'aria-label="Cash month by month from today through the end of the trip">' +
      '<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#6FE0A6" stop-opacity="0.26"></stop>' +
      '<stop offset="100%" stop-color="#6FE0A6" stop-opacity="0.01"></stop></linearGradient></defs>' +
      g +
      '<path d="' + area + '" fill="url(#fill)"></path>' +
      '<path d="' + line + '" fill="none" stroke="#6FE0A6" stroke-width="2" stroke-linejoin="round"></path>' +
      marks + ribbon + xl +
      '<circle cx="' + X(pts.length - 1).toFixed(1) + '" cy="' + Y(end.cash).toFixed(1) + '" r="4.5" fill="' + endCol + '" stroke="var(--ink)" stroke-width="2"></circle>' +
      '<g id="cross" style="display:none"><line y1="' + P.t + '" y2="' + (P.t + ih) + '" stroke="var(--gold)" stroke-width="1"></line>' +
      '<circle r="4.5" fill="var(--gold-hi)" stroke="var(--ink)" stroke-width="2"></circle></g>' +
      '<rect id="hitzone" x="' + P.l + '" y="' + P.t + '" width="' + iw + '" height="' + (ih + 14) + '" fill="transparent"></rect>' +
      '</svg><div class="tipbox" id="tip" hidden></div></div>' +
      '<div class="legend" style="margin-top:12px">' +
      '<span><i class="line-key" style="background:#6FE0A6"></i>Cash balance</span>' +
      '<span><i class="line-key" style="background:var(--mint);opacity:.75"></i>Landing-fund floor</span>' +
      '<span><i style="background:var(--gold);opacity:.6"></i>Pre-departure sprint</span>' +
      Object.keys(REG).map(function (r) { return '<span><i style="background:' + REG[r].color + '"></i>' + REG[r].name + '</span>'; }).join('') +
      '</div>';
  }

  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(Math.abs(raw) || 1)));
    var n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  function wireChart() {
    var svg = document.getElementById('trajsvg');
    if (!svg) return;
    var tip = document.getElementById('tip'), cross = document.getElementById('cross');
    var holder = svg.parentElement, pts = R.traj;
    var W = 1000, P = { l: 62, r: 16, t: 18 }, iw = W - P.l - P.r;

    function move(ev) {
      var box = svg.getBoundingClientRect();
      var cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      var cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      var vx = (cx - box.left) / box.width * W;
      var i = Math.round((vx - P.l) / iw * (pts.length - 1));
      i = Math.max(0, Math.min(pts.length - 1, i));
      var p = pts[i];
      var sx = P.l + (i / (pts.length - 1)) * iw;
      var vals = pts.map(function (q) { return q.cash; }).concat([0, R.landing]);
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var pad = (hi - lo) * 0.1 || 1000; lo -= pad; hi += pad;
      var ih = 330 - P.t - 46;
      var sy = P.t + (1 - (p.cash - lo) / (hi - lo)) * ih;
      cross.style.display = '';
      cross.querySelector('line').setAttribute('x1', sx); cross.querySelector('line').setAttribute('x2', sx);
      cross.querySelector('circle').setAttribute('cx', sx); cross.querySelector('circle').setAttribute('cy', sy);

      var head = p.phase === 'now' ? 'Today · ' + monthLabel(p.date)
        : p.phase === 'pre' ? monthLabel(p.date) + ' · grind month ' + p.i
        : monthLabel(p.date) + ' · ' + p.label + ' · trip month ' + p.tripMonth;
      tip.innerHTML = '<div class="t">' + esc(head) + '</div>' +
        (p.phase !== 'now' ? '<div class="l"><span>In</span><span class="pos">' + money(p.income) + '</span></div>' +
          '<div class="l"><span>Out</span><span class="neg">' + money(p.spend) + '</span></div>' : '') +
        '<div class="l"><span>Cash</span><span style="color:' + (p.cash >= R.landing ? 'var(--mint)' : 'var(--coral)') + '">' + money(p.cash) + '</span></div>' +
        (p.note ? '<div style="color:var(--dim);margin-top:5px;font-size:11px">' + esc(p.note) + '</div>' : '');
      tip.hidden = false;
      var hb = holder.getBoundingClientRect();
      var tw = tip.offsetWidth;
      var left = Math.max(4, Math.min(hb.width - tw - 4, (sx / W) * hb.width - tw / 2));
      tip.style.left = left + 'px';
      tip.style.top = Math.max(4, (cy - hb.top) - tip.offsetHeight - 14) + 'px';
    }
    function out() { tip.hidden = true; cross.style.display = 'none'; }
    svg.addEventListener('mousemove', move);
    svg.addEventListener('mouseleave', out);
    svg.addEventListener('touchmove', function (e) { move(e); e.preventDefault(); }, { passive: false });
    svg.addEventListener('touchend', out);
  }

  /* ---- at a glance ------------------------------------------------------ */

  function glanceHTML() {
    function row(k2, v, cls, dim) {
      return '<div class="r"><span class="k"' + (dim ? ' style="color:var(--dim)"' : '') + '>' + k2 + '</span><span class="fill"></span>' +
        '<span class="v ' + (cls || '') + '">' + v + '</span></div>';
    }
    var h = '<div class="card-h">Paddle-out breakdown<span class="rule"></span></div><div class="kv">' +
      row('Travel burn · ' + R.T + ' mo', money(R.travelTotal)) +
      row('Home-break overhead', money(R.fixedTotal)) +
      row('Flights, van, charter', money(R.oneTimeTotal)) +
      row('Emergency set', money(R.reserveTotal)) +
      row('Landing fund', money(R.landing)) +
      (R.remoteTotal > 0 ? row('Less remote income', '−' + money(R.remoteTotal), 'pos') : '') +
      '<div class="r total"><span class="k">Required</span><span class="fill"></span><span class="v">' + money(R.required) + '</span></div></div>';

    h += '<div class="card-h" style="margin-top:22px">Where departure cash comes from<span class="rule"></span></div><div class="kv">' +
      row('Checking + savings', money(R.startSpendable)) +
      row('Pipeline after tax · ' + pct(S.pipelinePct), money(R.pipelineNet)) +
      row('New income after tax', money(R.preIncomeUsed * (1 - S.taxPct))) +
      (R.backstopCash ? row('Backstops released', money(R.backstopCash), 'pos') : '') +
      row('Leucadia living · ' + R.M + ' mo', '−' + money(S.leucadia * R.M), 'neg') +
      row('Card, taxes, Europe', '−' + money(R.preOutflows - S.leucadia * R.M), 'neg') +
      '<div class="r total"><span class="k">On departure day</span><span class="fill"></span><span class="v">' + money(R.departureCash) + '</span></div></div>';

    h += '<div class="card-h" style="margin-top:22px">Backstops · not travel cash<span class="rule"></span></div><div class="kv">' +
      row('Stocks / 401(k)', money(S.start.stocks), S.liquidateStocks ? 'neg' : 'flat-c') +
      row('Condo equity', money(S.start.condoEquity), S.releaseEquity ? 'neg' : 'flat-c') +
      '</div><p class="hint" style="margin-top:8px">' +
      (S.liquidateStocks || S.releaseEquity
        ? 'A backstop is switched on. This plan is spending assets you said you wanted to keep.'
        : 'Both untouched. Every number above is funded from cash and income only.') + '</p>';
    return h;
  }

  /* ---- region plan ------------------------------------------------------ */

  function planHTML() {
    var flat = { csa: S.region.csa, aus: S.region.aus, sea: S.region.sea };
    var rows = R.regionRows.map(function (r) {
      var delta = r.months > 0 ? (r.burn - flat[r.id] * S.lifestyle) * r.months : 0;
      return '<tr><td><div class="lab"><span class="swatch" style="background:' + r.color + '"></span>' + esc(r.short) + '</div></td>' +
        '<td class="n">' + r.months + '</td>' +
        '<td class="n">' + money(r.burn) + '</td>' +
        '<td class="n">' + money(r.total) + '</td>' +
        '<td class="n" style="color:' + (delta < -50 ? 'var(--mint)' : delta > 50 ? 'var(--coral)' : 'var(--dim)') + '">' +
        (Math.abs(delta) < 50 ? '—' : (delta > 0 ? '+' : '−') + money(Math.abs(delta))) + '</td>' +
        '<td class="n">' + pct(r.share) + '</td>' +
        '<td style="width:120px"><div class="bar"><i style="width:' + (r.share * 100).toFixed(1) + '%;background:' + r.color + '"></i></div></td></tr>';
    }).join('');
    return '<div class="tbl-scroll"><table><thead><tr><th>Region</th><th>Months</th><th>Burn / mo</th><th>Total</th>' +
      '<th>vs CSV plan</th><th>Share</th><th></th></tr></thead><tbody>' + rows +
      '<tr class="hi"><td><b>All regions</b></td><td class="n">' + R.regionMonths + '</td>' +
      '<td class="n">' + money(R.travelMonthlyAvg) + '</td><td class="n">' + money(R.travelTotal) + '</td>' +
      '<td class="n"></td><td class="n">100%</td><td></td></tr></tbody></table></div>' +
      '<p class="hint" style="margin-top:12px">' + (S.useRouteCosts
        ? 'Priced off your actual route on the Adventure tab — each month costs what that place costs. The <strong>vs CSV plan</strong> column is the difference from the flat regional averages in your spreadsheet.'
        : 'Priced off the flat regional averages from your CSV. Switch on <strong>price the trip off my actual route</strong> to use each destination’s real cost instead.') + '</p>';
  }

  /* ---- lever rank ------------------------------------------------------- */

  function leverRankHTML() {
    var ranked = SF.leverRank(S);
    var max = Math.max.apply(null, ranked.map(function (x) { return Math.abs(x.saves); })) || 1;
    return '<div class="tbl-scroll"><table><thead><tr><th>Move</th><th>Cuts the paddle-out by</th><th>New monthly target</th><th></th></tr></thead><tbody>' +
      ranked.map(function (x, i) {
        return '<tr' + (i < 3 ? ' class="hi"' : '') + '><td>' + esc(x.label) + '</td>' +
          '<td class="n pos">' + money(x.saves) + '</td>' +
          '<td class="n">' + money(x.monthly) + '/mo</td>' +
          '<td style="width:150px"><div class="bar mint"><i style="width:' + (Math.abs(x.saves) / max * 100).toFixed(1) + '%"></i></div></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="hint" style="margin-top:12px">Each row is that one change on its own, against everything else as it sits now. They stack, but not perfectly — the trip-length rows overlap with the lifestyle rows.</p>';
  }

  /* ---- overhead audit --------------------------------------------------- */

  function auditHTML() {
    var rows = R.fixedRows, max = rows[0].trip || 1;
    var top5 = rows.slice(0, 5).reduce(function (a, b) { return a + b.trip; }, 0);
    var body = rows.map(function (r, i) {
      return '<tr' + (i < 5 ? ' class="hi"' : '') + '><td><div class="lab">' +
        (i < 5 ? '<span class="tag" style="color:var(--gold-hi);border-color:var(--gold)">Cut ' + (i + 1) + '</span>' : '') +
        esc(r.label) + (r.added ? ' <span class="tag added">Added</span>' : '') +
        (r.conf === 'INPUT NEEDED' ? ' <span class="tag need">Input needed</span>' : '') + '</div></td>' +
        '<td class="n" style="color:var(--dim)">' + esc(r.group) + '</td>' +
        '<td><input type="number" data-fixed="' + r.id + '" value="' + r.monthly + '" step="5" min="0" style="width:88px"></td>' +
        '<td class="n">' + money(r.trip) + '</td>' +
        '<td style="width:150px"><div class="bar"><i style="width:' + (r.trip / max * 100).toFixed(1) + '%"></i></div></td></tr>';
    }).join('');
    return '<div class="tbl-scroll"><table><thead><tr><th>Line</th><th>Group</th><th>Per month</th><th>Over ' + R.T + ' months</th><th></th></tr></thead><tbody>' +
      body + '<tr><td><b>Total home-break overhead</b></td><td></td><td class="n"><b>' + money(R.fixedMonthly) + '</b></td>' +
      '<td class="n"><b>' + money(R.fixedTotal) + '</b></td><td></td></tr></tbody></table></div>' +
      '<p class="hint" style="margin-top:12px">The top five alone cost <strong>' + money(top5) + '</strong> over the trip — ' +
      pct(top5 / (R.fixedTotal || 1)) + ' of all fixed overhead, and ' + pct(top5 / (R.required || 1)) + ' of the entire paddle-out number. ' +
      'Three of these lines are the condo; killing storage and the vehicle is the fastest clean cut. Edit any number here and every figure on the page moves.</p>';
  }

  /* ---- remote income ladder --------------------------------------------- */

  function ladderHTML() {
    var steps = [0, 1000, 2000, 3000, 5000, 10000];
    var names = ['Flat day', 'Moonlight', "Swami's", 'Pipes', 'Trestles', 'Cortes Bank'];
    var cur = S.remoteIncome;
    var rows = steps.map(function (v, i) {
      var x = SF.runScenario(S, { remoteIncome: v });
      var on = (i === steps.length - 1 ? cur >= v : cur >= v && cur < steps[i + 1]);
      return '<div class="row' + (on ? ' on' : '') + '"><span class="name">' + names[i] + '</span>' +
        '<span class="rng">' + money(v) + '/MO</span>' +
        '<span class="amt">' + money(x.required) + '</span></div>';
    }).join('');
    var two = SF.runScenario(S, { remoteIncome: 2000 });
    return '<div class="ladder">' + rows + '</div>' +
      '<p class="hint" style="margin-top:14px">Required departure cash at each level of remote income. Every $1,000/month of recurring revenue takes <strong>' +
      money(R.T * 1000) + '</strong> off the number you have to save before you leave. At $2,000/month the monthly grind target drops from <strong>' +
      money(R.requiredMonthlyGross) + '</strong> to <strong>' + money(two.requiredMonthlyGross) + '</strong>.</p>';
  }

  /* ---- break-even ------------------------------------------------------- */

  function breakEvenHTML() {
    var rows = [[0.25, 'Quarter of burn'], [0.5, 'Half of burn'], [0.75, 'Three quarters'], [1, 'Full break-even']].map(function (p) {
      var v = R.burnAbroad * p[0];
      return '<div class="r"><span class="k">' + p[1] + '</span><span class="fill"></span>' +
        '<span class="v' + (S.remoteIncome >= v ? ' pos' : '') + '">' + money(v) + '/mo</span></div>';
    }).join('');
    return '<div class="kv">' + rows +
      '<div class="r total"><span class="k">All-in break-even</span><span class="fill"></span><span class="v">' + money(R.breakEvenAllIn) + '/mo</span></div></div>' +
      '<p class="hint" style="margin-top:12px">Break-even is the point where cash stops falling while you are abroad. <strong>' +
      money(R.burnAbroad) + '/mo</strong> covers the recurring burn — travel plus home-break overhead. <strong>' + money(R.breakEvenAllIn) +
      '/mo</strong> also covers flights, the van, the charter and the reserves, which is the honest number: hit it and the trip pays for itself indefinitely.</p>';
  }

  /* ---- one more month --------------------------------------------------- */

  function oneMoreHTML() {
    var net = R.oneMoreMonth;
    var extra = SF.runScenario(S, { monthsToDeparture: S.monthsToDeparture + 1 });
    return '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">' +
      '<div class="num" style="font-size:36px;color:' + (net > 0 ? 'var(--mint)' : 'var(--coral)') + '">' + money(net) + '</div>' +
      '<div class="hint" style="max-width:260px">net added to the trip fund by one more month of grinding</div></div>' +
      '<div class="kv" style="margin-top:12px">' +
      '<div class="r"><span class="k">Gross earned</span><span class="fill"></span><span class="v">' + money(R.expectedMonthlyGross) + '</span></div>' +
      '<div class="r"><span class="k">Less tax reserve · ' + Math.round(S.taxPct * 100) + '%</span><span class="fill"></span><span class="v neg">−' + money(R.expectedMonthlyGross * S.taxPct) + '</span></div>' +
      '<div class="r"><span class="k">Less Leucadia living</span><span class="fill"></span><span class="v neg">−' + money(S.leucadia) + '</span></div>' +
      '<div class="r total"><span class="k">Net per extra month</span><span class="fill"></span><span class="v ' + (net > 0 ? 'pos' : 'neg') + '">' + money(net) + '</span></div></div>' +
      '<p class="hint" style="margin-top:12px">Staying a seventh month drops the required monthly target to <strong>' +
      money(extra.requiredMonthlyGross) + '</strong>. Below <strong>' + money(S.leucadia / (1 - S.taxPct)) +
      '</strong> gross a month you are going backwards — an extra month costs more in Leucadia rent than it brings in.</p>';
  }

  /* ---- scenarios -------------------------------------------------------- */

  function scenariosHTML() {
    var list = SF.SCENARIOS.map(function (sc) { return { name: sc.name, sub: sc.sub, r: SF.runScenario(S, sc.patch) }; });
    list.push({ name: 'Your dials', sub: 'Whatever the controls say right now', r: R, cur: true });
    var rows = list.map(function (x) {
      var r = x.r;
      return '<tr' + (x.cur ? ' class="hi"' : '') + '><td><div class="lab"><div><b style="font-family:var(--serif);font-size:17px">' + esc(x.name) +
        '</b><div style="font-size:11px;color:var(--dim)">' + esc(x.sub) + '</div></div></div></td>' +
        '<td class="n">' + money(r.required) + '</td>' +
        '<td class="n">' + money(r.requiredGross) + '</td>' +
        '<td class="n" style="color:var(--gold-hi)">' + money(r.requiredMonthlyGross) + '</td>' +
        '<td class="n">' + money(r.tripCost) + '</td>' +
        '<td class="n pos">' + money(r.endingCash) + '</td>' +
        '<td>' + yn(r.touchesInvestments) + '</td><td>' + yn(r.touchesEquity) + '</td></tr>';
    }).join('');
    return '<div class="tbl-scroll"><table><thead><tr><th>Scenario</th><th>Required departure cash</th><th>Gross before departure</th>' +
      '<th>Per month</th><th>Total trip cost</th><th>Ending cash</th><th>Investments?</th><th>Condo equity?</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' +
      '<p class="hint" style="margin-top:12px">Every scenario auto-solves the pre-departure income so the trip ends exactly on the landing fund. Investments and condo equity stay untouched in all of them unless you switch a backstop on.</p>';
  }
  function yn(b) {
    return b ? '<span class="tag need">Yes</span>' : '<span class="tag" style="color:var(--mint);border-color:rgba(111,224,166,.4)">No</span>';
  }

  /* ---- editable inputs / audit trail ------------------------------------ */

  function inputsHTML() {
    function numCell(group, id, val, step) {
      return '<input type="number" data-' + group + '="' + id + '" value="' + val + '" step="' + (step || 100) + '" style="width:110px">';
    }
    function tbl(head, rows) {
      return '<div class="tbl-scroll"><table><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    var startRows = SF.START.map(function (r) {
      return '<tr><td>' + esc(r.label) + (r.spend === false ? ' <span class="tag">Backstop</span>' : '') + '</td>' +
        '<td>' + numCell('start', r.id, S.start[r.id], 500) + '</td>' +
        '<td class="n" style="color:var(--dim)">' + r.conf + '</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(r.note) + '</td></tr>';
    }).join('');

    var preRows = SF.PRE.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td>' + numCell('pre', r.id, S.pre[r.id], 500) + '</td>' +
        '<td class="n" style="color:var(--dim)">' + r.conf + '</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(r.note) + '</td></tr>';
    }).join('');

    var regionRows = SF.REGIONS.map(function (r) {
      return '<tr><td><div class="lab"><span class="swatch" style="background:' + r.color + '"></span>' + esc(r.label) + '</div></td>' +
        '<td>' + numCell('region', r.id, S.region[r.id], 100) + '</td>' +
        '<td class="n">' + S.months[r.id] + ' mo</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(r.note) + '</td></tr>';
    }).join('');

    var oneRows = R.oneRows.map(function (r) {
      var editable = r.id !== 'charter';
      return '<tr><td>' + esc(r.label) + (r.added ? ' <span class="tag added">Added</span>' : '') + '</td>' +
        '<td>' + (editable ? numCell('onetime', r.id, S.onetime[r.id], 250) : '<span class="num">' + money(r.amount) + '</span>') + '</td>' +
        '<td class="n">' + money(r.amount) + '</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(r.note) + '</td></tr>';
    }).join('');

    var resRows = R.reserveRows.map(function (r) {
      return '<tr><td>' + esc(r.label) + '</td><td>' + numCell('reserve', r.id, S.reserve[r.id], 250) + '</td>' +
        '<td class="n">' + money(r.amount) + '</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(r.note) + '</td></tr>';
    }).join('');

    var formula =
      '<div class="formula">' +
      '<b>Trip cost</b> <span class="op">=</span> travel burn <span class="op">+</span> home-break overhead × months <span class="op">+</span> one-time travel <span class="op">+</span> reserves × emergency multiplier<br>' +
      '<b>Paddle-out number</b> <span class="op">=</span> trip cost <span class="op">+</span> landing fund <span class="op">−</span> remote income × months abroad<br>' +
      '<b>Departure cash</b> <span class="op">=</span> checking <span class="op">+</span> savings <span class="op">+</span> pipeline × collection × (1 − tax) <span class="op">+</span> new gross × (1 − tax) <span class="op">−</span> Leucadia × months <span class="op">−</span> Europe <span class="op">−</span> 2026 tax bill <span class="op">−</span> card payoff<br>' +
      '<b>Required gross</b> <span class="op">=</span> (paddle-out <span class="op">+</span> pre-departure outflows <span class="op">−</span> starting cash <span class="op">−</span> pipeline net) <span class="op">÷</span> (1 − tax)<br>' +
      '<b>Ending cash</b> <span class="op">=</span> departure cash <span class="op">−</span> trip cost <span class="op">+</span> remote income × months abroad<br>' +
      '<b>Break-even</b> <span class="op">=</span> average travel burn <span class="op">+</span> home-break overhead<br>' +
      '<b>One more month</b> <span class="op">=</span> monthly gross × (1 − tax) <span class="op">−</span> Leucadia living' +
      '</div>' +
      '<p class="hint" style="margin-top:14px"><strong>Rules this model keeps.</strong> Stocks and condo equity are never spendable unless their toggle is on. ' +
      'The student-loan balance is never an expense — only the monthly payment is, unless payoff is switched on. The landing fund is a floor, not a budget. ' +
      'Balances and cash flows are kept apart. Nothing is counted twice: the long-haul flight line is continent jumps only, the in-region line is everything shorter, ' +
      'and regional burn already contains housing, food and local transport.</p>';

    return '<details open><summary>Starting position</summary><div class="details-body">' +
      tbl(['Item', 'Amount', 'Confidence', 'Note'], startRows) + '</div></details>' +
      '<details><summary>Pre-departure one-time events</summary><div class="details-body">' +
      tbl(['Item', 'Amount', 'Confidence', 'Note'], preRows) + '</div></details>' +
      '<details><summary>Regional burn · CSV planning averages</summary><div class="details-body">' +
      tbl(['Region', 'Per month', 'Months', 'Note'], regionRows) + '</div></details>' +
      '<details><summary>One-time trip costs</summary><div class="details-body">' +
      tbl(['Item', 'Input', 'Applied', 'Note'], oneRows) + '</div></details>' +
      '<details><summary>Emergency set · irregular reserves</summary><div class="details-body">' +
      tbl(['Item', 'Input', 'After ' + S.emergency.toFixed(2) + '× multiplier', 'Note'], resRows) + '</div></details>' +
      '<details><summary>The math, in full</summary><div class="details-body">' + formula + '</div></details>';
  }

  /* ======================================================================
     ADVENTURE
     ====================================================================== */

  function renderAdventure() {
    document.getElementById('ocean').innerHTML = oceanHTML();
    document.getElementById('monthchips').innerHTML = monthChipsHTML();
    document.getElementById('course').innerHTML = courseHTML();
    document.getElementById('coursefoot').innerHTML = courseFootHTML();
    document.getElementById('library').innerHTML = libraryHTML();
    document.getElementById('regionchips').innerHTML = regionChipsHTML();
    document.getElementById('logistics').innerHTML = logisticsHTML();
    document.getElementById('workblocks').innerHTML = workHTML();
  }

  /* Pacific-centred equirectangular: Asia left, the Americas right, the whole
     surf belt in one uninterrupted band. */
  var OW = 1000, OH = 420;
  function px(lng) { return ((lng - 60 + 360) % 360) / 360 * OW; }
  function py(lat) { return (42 - lat) / 88 * OH; }

  function oceanHTML() {
    var g = '';
    [[0, 'EQUATOR'], [23.4, 'TROPIC OF CANCER'], [-23.4, 'TROPIC OF CAPRICORN']].forEach(function (l) {
      var y = py(l[0]);
      g += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + OW + '" y2="' + y.toFixed(1) +
        '" stroke="rgba(255,255,255,.16)" stroke-width="1" stroke-dasharray="' + (l[0] === 0 ? '0' : '4 6') + '"></line>' +
        '<text x="8" y="' + (y - 5).toFixed(1) + '" fill="rgba(255,255,255,.42)" font-size="9" letter-spacing="1.6">' + l[1] + '</text>';
    });
    for (var lo = 60; lo < 420; lo += 30) {
      var x = px(lo > 180 ? lo - 360 : lo);
      if (x < 2 || x > OW - 2) continue;
      g += '<line x1="' + x.toFixed(1) + '" y1="0" x2="' + x.toFixed(1) + '" y2="' + OH + '" stroke="rgba(255,255,255,.07)" stroke-width="1"></line>';
    }
    ['ASIA & THE INDIAN OCEAN|110', 'OCEANIA|168', 'THE PACIFIC|-150', 'THE AMERICAS|-80'].forEach(function (s) {
      var p = s.split('|');
      g += '<text x="' + px(+p[1]).toFixed(1) + '" y="26" fill="rgba(255,255,255,.34)" font-size="10" letter-spacing="3" text-anchor="middle">' + p[0] + '</text>';
    });

    // home break
    var hx = px(-117.3), hy = py(33.0);
    g += '<g><circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5" fill="none" stroke="#EFC46B" stroke-width="1.5"></circle>' +
      '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="2" fill="#EFC46B"></circle>' +
      '<text x="' + (hx + 10).toFixed(1) + '" y="' + (hy + 3).toFixed(1) + '" fill="#EFC46B" font-size="9.5" letter-spacing="1.4">HOME BREAK</text></g>';

    // the course: dotted rhumb lines between consecutive legs
    var path = '';
    var stops = S.route.map(function (l) { return byId[l.spot]; }).filter(Boolean);
    if (stops.length) {
      var d = 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1);
      stops.forEach(function (sp) { d += ' L' + px(sp.lng).toFixed(1) + ' ' + py(sp.lat).toFixed(1); });
      path = '<path d="' + d + '" fill="none" stroke="rgba(239,196,107,.55)" stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round"></path>';
    }

    var inRoute = {}; S.route.forEach(function (l) { inRoute[l.spot] = true; });
    var dots = SPOTS.filter(visible).map(function (sp) {
      var x = px(sp.lng), y = py(sp.lat), c = REG[sp.region].color, on = inRoute[sp.id];
      return '<g class="spot-dot' + (on ? ' sel' : '') + '" data-spot="' + sp.id + '" tabindex="0" role="button" aria-label="' + esc(sp.name) + ', ' + money(sp.cost) + ' a month">' +
        '<circle class="hit" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="15"></circle>' +
        (on ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" fill="' + c + '" opacity="0.2"></circle>' : '') +
        '<circle class="core" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (on ? 6 : 4.5) + '" fill="' + c + '" stroke="rgba(5,12,21,.8)" stroke-width="1"></circle>' +
        '<title>' + esc(sp.name + ' · ' + sp.country + ' · ' + money(sp.cost) + '/mo · ' + sp.peak) + '</title></g>';
    }).join('');

    // Label only the places on the course, nudged apart so none collide.
    var placed = [];
    var labels = SPOTS.filter(function (sp) { return visible(sp) && inRoute[sp.id]; })
      .map(function (sp) { return { sp: sp, x: px(sp.lng), y: py(sp.lat) }; })
      .sort(function (a, b) { return a.y - b.y; })
      .map(function (o) {
        var ly = o.y;
        placed.forEach(function (q) { if (Math.abs(q.x - o.x) < 150 && ly - q.ly < 14) ly = q.ly + 14; });
        placed.push({ x: o.x, ly: ly });
        var right = o.x < OW - 150;
        var tx = right ? o.x + 11 : o.x - 11;
        var tick = Math.abs(ly - o.y) > 2
          ? '<line x1="' + o.x.toFixed(1) + '" y1="' + o.y.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y2="' + (ly - 3).toFixed(1) +
            '" stroke="rgba(255,255,255,.3)" stroke-width="1"></line>' : '';
        return tick + '<text x="' + tx.toFixed(1) + '" y="' + (ly + 3.5).toFixed(1) +
          '" fill="rgba(255,255,255,.88)" font-size="10" letter-spacing="0.6" text-anchor="' +
          (right ? 'start' : 'end') + '">' + esc(o.sp.name) + '</text>';
      }).join('');

    return '<div class="ocean"><svg viewBox="0 0 ' + OW + ' ' + OH + '" role="img" aria-label="World surf chart, Pacific centred">' +
      g + path + dots + labels + '</svg></div>';
  }

  function visible(sp) {
    if (S.regionFilter !== 'all' && sp.region !== S.regionFilter) return false;
    if (S.monthFilter && sp.season.indexOf(S.monthFilter) === -1) return false;
    return true;
  }

  function monthChipsHTML() {
    var h = '<button class="chip" data-month="0" aria-pressed="' + (S.monthFilter === 0) + '">Any month</button>';
    for (var i = 1; i <= 12; i++) h += '<button class="chip" data-month="' + i + '" aria-pressed="' + (S.monthFilter === i) + '">' + MN[i - 1] + '</button>';
    return h;
  }
  function regionChipsHTML() {
    var h = '<button class="chip" data-region="all" aria-pressed="' + (S.regionFilter === 'all') + '">All regions</button>';
    Object.keys(REG).forEach(function (r) {
      h += '<button class="chip" data-region="' + r + '" aria-pressed="' + (S.regionFilter === r) + '">' + REG[r].name + '</button>';
    });
    return h;
  }

  /* ---- the course ------------------------------------------------------- */

  function legMonths() {
    var out = [], m = S.monthsToDeparture + 1;
    S.route.forEach(function (l) { out.push({ leg: l, start: m, end: m + l.months - 1 }); m += l.months; });
    return out;
  }

  function seasonFit(leg, start, months) {
    var hit = 0, sp = byId[leg.spot];
    for (var i = 0; i < months; i++) {
      var d = tripDate(start + i);
      if (sp.season.indexOf(d.getMonth() + 1) !== -1) hit++;
    }
    return months ? hit / months : 0;
  }

  function courseHTML() {
    var spans = legMonths();
    if (!spans.length) return '<p class="hint">No legs yet. Add a destination from the chart or the library below.</p>';
    return spans.map(function (sp2, i) {
      var l = sp2.leg, spot = byId[l.spot], f = seasonFit(l, sp2.start, l.months);
      var cls = f >= 0.99 ? 'on' : f >= 0.5 ? 'mid' : 'off';
      var txt = f >= 0.99 ? 'In season' : f > 0 ? Math.round(f * l.months) + ' of ' + l.months + ' in season' : 'Off season';
      return '<div class="leg" style="--rc:' + REG[l.rid].color + '">' +
        '<span class="idx num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="who"><b>' + esc(spot.name) + '</b><span>' + esc(spot.country) + ' · ' + esc(spot.peak) + '</span></span>' +
        '<span class="when">' + monthLabel(tripDate(sp2.start)) + ' – ' + monthLabel(tripDate(sp2.end)) + '</span>' +
        '<span class="mo"><button data-legdec="' + l.key + '" aria-label="One month less">−</button>' +
        '<b class="num">' + l.months + '</b>' +
        '<button data-leginc="' + l.key + '" aria-label="One month more">+</button></span>' +
        '<span class="cost num">' + money(spot.cost * l.months * S.lifestyle) + '</span>' +
        '<span class="acts"><span class="fit ' + cls + '">' + txt + '</span>' +
        '<button class="chip" data-legup="' + l.key + '" aria-label="Move earlier">↑</button>' +
        '<button class="chip" data-legdown="' + l.key + '" aria-label="Move later">↓</button>' +
        '<button class="chip" data-legdel="' + l.key + '" aria-label="Remove leg">✕</button></span></div>';
    }).join('');
  }

  function courseFootHTML() {
    var spans = legMonths();
    var off = spans.filter(function (s2) { return seasonFit(s2.leg, s2.start, s2.leg.months) < 0.99; });
    var byRegion = { csa: 0, aus: 0, sea: 0 };
    S.route.forEach(function (l) { byRegion[l.rid] += l.months; });
    var total = byRegion.csa + byRegion.aus + byRegion.sea;
    var pills = Object.keys(REG).map(function (r) {
      return '<span class="fit" style="color:' + REG[r].color + ';background:rgba(255,255,255,.04)">' + REG[r].name + ' ' + byRegion[r] + ' mo</span>';
    }).join(' ');
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' + pills +
      '<span class="fit" style="color:var(--gold-hi);background:var(--gold-dim)">' + total + ' months total</span>' +
      '<span class="fit" style="color:var(--mint);background:rgba(111,224,166,.10)">' + money(R.travelTotal) + ' travel burn</span></div>' +
      '<p class="hint">' + (off.length === 0
        ? 'Every leg lands inside its own season. Reorder or restretch and this line will tell you the moment that stops being true.'
        : off.length + ' leg' + (off.length > 1 ? 's' : '') + ' sit partly outside season: <strong>' +
          off.map(function (s2) { return esc(byId[s2.leg.spot].name); }).join(', ') +
          '</strong>. Move them up or down the list, or trade months with a neighbour.') +
      ' Changing the course rewrites the region months, the trip length and the burn on the Treasure tab.</p>';
  }

  /* ---- library ---------------------------------------------------------- */

  function libraryHTML() {
    var list = SPOTS.filter(visible);
    if (!list.length) return '<p class="hint">Nothing works in that month in that region. Try another filter.</p>';
    return list.map(function (sp) {
      var strip = '';
      for (var i = 1; i <= 12; i++) {
        strip += '<i class="' + (sp.season.indexOf(i) !== -1 ? 'on' : '') + (S.monthFilter === i ? ' now' : '') + '"></i>';
      }
      return '<div class="spot" style="--rc:' + REG[sp.region].color + '">' +
        '<h4>' + esc(sp.name) + '</h4>' +
        '<div class="meta"><span>' + esc(sp.country) + '</span><span>·</span><span>' + esc(sp.level) + '</span><span>·</span>' +
        '<span>wifi <span class="dots">' + [1, 2, 3, 4, 5].map(function (n) { return '<i class="' + (n <= sp.wifi ? 'on' : '') + '"></i>'; }).join('') + '</span></span></div>' +
        '<div class="season-strip" aria-label="Season by month">' + strip + '</div>' +
        '<div class="meta"><span>' + esc(sp.peak) + '</span></div>' +
        '<p class="desc">' + esc(sp.wave) + '</p>' +
        '<div class="facts"><div><b>Visa</b> ' + esc(sp.visa) + '</div><div><b>Getting in</b> ' + esc(sp.board) + '</div></div>' +
        '<p class="watch">' + esc(sp.watch) + '</p>' +
        '<div class="foot"><span class="price num">' + money(sp.cost) + '<small>/mo</small></span>' +
        '<button class="add" data-add="' + sp.id + '">Add to course</button></div></div>';
    }).join('');
  }

  /* ---- logistics -------------------------------------------------------- */

  function logisticsHTML() {
    var spans = legMonths();
    if (!spans.length) return '<p class="hint">Add legs to see the hops between them.</p>';
    var rows = '', prev = null, prevName = 'San Diego';
    spans.forEach(function (s2) {
      var sp = byId[s2.leg.spot];
      var jump = prev ? haversine(prev.lat, prev.lng, sp.lat, sp.lng) : haversine(33.0, -117.3, sp.lat, sp.lng);
      var changed = !prev || prev.region !== sp.region;
      var est = changed ? Math.round((800 + jump * 0.09) / 50) * 50 : Math.round((90 + jump * 0.05) / 10) * 10;
      rows += '<tr><td><div class="lab"><span class="swatch" style="background:' + REG[sp.region].color + '"></span>' +
        esc(prevName) + ' → ' + esc(sp.name) + '</div></td>' +
        '<td class="n">' + Math.round(jump).toLocaleString('en-US') + ' km</td>' +
        '<td>' + (changed ? '<span class="tag" style="color:var(--gold-hi);border-color:var(--gold)">Long-haul</span>' : '<span class="tag">Regional hop</span>') + '</td>' +
        '<td class="n">' + money(est) + '</td>' +
        '<td style="text-align:left;color:var(--dim);font-size:11.5px">' + esc(sp.board) + '</td></tr>';
      prev = sp; prevName = sp.name;
    });
    var last = byId[spans[spans.length - 1].leg.spot];
    var home = haversine(last.lat, last.lng, 33.0, -117.3);
    rows += '<tr><td><div class="lab"><span class="swatch" style="background:var(--gold)"></span>' + esc(last.name) + ' → San Diego</div></td>' +
      '<td class="n">' + Math.round(home).toLocaleString('en-US') + ' km</td>' +
      '<td><span class="tag" style="color:var(--gold-hi);border-color:var(--gold)">Long-haul</span></td>' +
      '<td class="n">' + money(Math.round((800 + home * 0.09) / 50) * 50) + '</td>' +
      '<td style="text-align:left;color:var(--dim);font-size:11.5px">Coming home with the quiver. Budget two extra bags.</td></tr>';

    return '<div class="tbl-scroll"><table><thead><tr><th>Leg</th><th>Distance</th><th>Type</th><th>Rough airfare + board bags</th><th>Notes</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' +
      '<p class="hint" style="margin-top:12px">Distances are great-circle, so treat the fares as order-of-magnitude, not quotes. The model funds long-hauls from the <strong>' +
      money(R.oneRows[0].amount) + '</strong> repositioning budget and regional hops from the <strong>' + money(S.fixed.hops) +
      '/mo</strong> line — if the fares above add up to more than that, raise one of them on the Treasure tab.</p>';
  }

  function haversine(a1, o1, a2, o2) {
    var toR = Math.PI / 180, R2 = 6371;
    var dLat = (a2 - a1) * toR, dLon = (o2 - o1) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a1 * toR) * Math.cos(a2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R2 * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  /* ---- work blocks ------------------------------------------------------ */

  function overlap(utc) {
    // San Diego workday 08:00–17:00 PDT (UTC−7); count hours that land between
    // 07:00 and 22:00 local at the destination.
    var delta = utc + 7, hrs = 0, first = null, last = null;
    for (var h = 8; h < 17; h++) {
      var loc = ((h + delta) % 24 + 24) % 24;
      if (loc >= 7 && loc < 22) { hrs++; if (first === null) first = loc; last = loc; }
    }
    return { hrs: hrs, first: first, last: last };
  }
  function hh(x) { var h = Math.floor(x), m = Math.round((x - h) * 60); return (h % 24) + ':' + String(m).padStart(2, '0'); }

  function workHTML() {
    var spans = legMonths();
    if (!spans.length) return '<p class="hint">Add legs to plan the work around them.</p>';
    var opts = PROJECTS.map(function (p) { return p; });
    return spans.map(function (s2) {
      var sp = byId[s2.leg.spot], o = overlap(sp.utc);
      var suggested = sp.wifi >= 4 ? (o.hrs >= 4 ? 'p4' : 'p1') : sp.wifi >= 3 ? 'p3' : 'p6';
      var chosen = S.assign[s2.leg.key] || suggested;
      var fit = sp.wifi >= 4 ? 'on' : sp.wifi >= 3 ? 'mid' : 'off';
      var fitTxt = sp.wifi >= 4 ? 'Client-ready' : sp.wifi >= 3 ? 'Async only' : 'Offline work';
      return '<div class="work-row" style="--rc:' + REG[sp.region].color + '">' +
        '<div><div class="p">' + esc(sp.name) + '</div><div class="s">' + monthLabel(tripDate(s2.start)) + ' – ' + monthLabel(tripDate(s2.end)) + ' · ' + s2.leg.months + ' mo</div></div>' +
        '<span class="fit ' + fit + '">' + fitTxt + '</span>' +
        '<div><div class="s">San Diego overlap</div><div class="num" style="font-size:13px;color:' + (o.hrs >= 4 ? 'var(--mint)' : o.hrs >= 2 ? 'var(--amber)' : 'var(--coral)') + '">' +
        (o.hrs ? o.hrs + ' hrs · ' + hh(o.first) + '–' + hh(o.last + 1) + ' local' : 'none') + '</div></div>' +
        '<select data-assign="' + s2.leg.key + '">' +
        opts.map(function (p) {
          return '<option value="' + p.id + '"' + (p.id === chosen ? ' selected' : '') + (p.need > sp.wifi ? ' data-warn="1"' : '') + '>' +
            esc(p.name) + (p.need > sp.wifi ? ' — needs better wifi' : '') + '</option>';
        }).join('') + '</select></div>';
    }).join('') +
      '<p class="hint" style="margin-top:14px">Overlap is how many hours of a San Diego 8-to-5 land inside a workable local day. Australia and SE Asia give you an evening call window at best, so anything that needs live calls belongs in the Americas legs — or in the pre-departure sprint. ' +
      'The fastest wifi on the route is Bali, the Gold Coast and Sydney; Gnaraloo and the Mentawais have none, which makes them the right months for deep build work and the wrong months for a launch.</p>';
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.lever) {
      var id = t.dataset.lever, v = parseFloat(t.value);
      S[id] = v;
      if (id === 'charterWeeks' || id === 'charterRate') S.charterOn = S.charterWeeks > 0;
      renderAll(true);
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target, g;
    if (t.dataset.toggle) { S[t.dataset.toggle] = t.checked; return renderAll(); }
    ['fixed', 'start', 'pre', 'region', 'onetime', 'reserve'].forEach(function (grp) {
      if (t.dataset[grp] !== undefined) { g = true; S[grp][t.dataset[grp]] = parseFloat(t.value) || 0; }
    });
    if (g) return renderAll();
    if (t.dataset.assign) { S.assign[t.dataset.assign] = t.value; save(); }
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-month],[data-region],[data-add],[data-legup],[data-legdown],[data-legdel],[data-leginc],[data-legdec],[data-spot],[data-reset]');
    if (!t) return;
    var d = t.dataset;
    if (d.tab) { S.tab = d.tab; return renderAll(); }
    if (d.reset !== undefined) {
      if (!confirm('Reset every number and the whole course back to the CSV defaults?')) return;
      try { localStorage.removeItem(STORE); } catch (err) {}
      var keep = S.tab;
      S = SF.clone(SF.DEFAULTS);
      S.route = SFSPOTS.DEFAULT_ROUTE.map(function (l, i) { return mkLeg(l.spot, l.months, i); });
      S.tab = keep; S.monthFilter = 0; S.regionFilter = 'all'; S.assign = {};
      syncMonths(); return renderAll();
    }
    if (d.month !== undefined) { S.monthFilter = +d.month; return renderAll(); }
    if (d.region) { S.regionFilter = d.region; return renderAll(); }
    if (d.add || d.spot) {
      var sid = d.add || d.spot;
      S.route.push(mkLeg(sid, 2, S.route.length));
      syncMonths(); renderAll();
      if (d.spot) document.getElementById('course-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var i = idx(d.legup || d.legdown || d.legdel || d.leginc || d.legdec);
    if (i < 0) return;
    if (d.legup && i > 0) { var a = S.route.splice(i, 1)[0]; S.route.splice(i - 1, 0, a); }
    if (d.legdown && i < S.route.length - 1) { var b = S.route.splice(i, 1)[0]; S.route.splice(i + 1, 0, b); }
    if (d.legdel) S.route.splice(i, 1);
    if (d.leginc) S.route[i].months = Math.min(24, S.route[i].months + 1);
    if (d.legdec) { S.route[i].months -= 1; if (S.route[i].months < 1) S.route.splice(i, 1); }
    syncMonths(); renderAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest('.spot-dot');
    if (g) { e.preventDefault(); g.click(); }
  });

  function idx(key) { for (var i = 0; i < S.route.length; i++) if (S.route[i].key === key) return i; return -1; }

  renderAll();
})();
