/* Sanity checks on the model. Run: node test/check.js */
const SF = require('../src/model.js');
const f = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.log('  FAIL  ' + name + (extra ? '  — ' + extra : '')); }
  else console.log('  pass  ' + name + (extra ? '  — ' + extra : ''));
}

const s = SF.clone(SF.DEFAULTS);
const r = SF.compute(s);

console.log('\n=== BASE CASE (24 mo, $0 remote, auto-solved income) ===');
console.log('Fixed overhead/mo        ', f(r.fixedMonthly));
console.log('Travel burn total        ', f(r.travelTotal));
console.log('Fixed total over trip    ', f(r.fixedTotal));
console.log('One-time travel          ', f(r.oneTimeTotal));
console.log('Reserves                 ', f(r.reserveTotal));
console.log('TRIP COST                ', f(r.tripCost));
console.log('Landing fund             ', f(r.landing));
console.log('REQUIRED DEPARTURE CASH  ', f(r.required));
console.log('Start spendable          ', f(r.startSpendable));
console.log('Pipeline net             ', f(r.pipelineNet));
console.log('Pre-departure outflows   ', f(r.preOutflows));
console.log('REQUIRED GROSS (6 mo)    ', f(r.requiredGross), '  per month', f(r.requiredMonthlyGross));
console.log('Departure cash           ', f(r.departureCash));
console.log('Gap                      ', f(r.gap));
console.log('Ending cash              ', f(r.endingCash));
console.log('Burn abroad (recurring)  ', f(r.burnAbroad), ' all-in', f(r.burnAllIn));
console.log('Runway                   ', r.runway, 'months, crossed floor:', r.runwayCrossed);
console.log('One more month nets      ', f(r.oneMoreMonth));

console.log('\n--- identities ---');
ok('trip cost = travel + fixed + one-time + reserves',
  Math.abs(r.tripCost - (r.travelTotal + r.fixedTotal + r.oneTimeTotal + r.reserveTotal)) < 1);
ok('required = tripCost + landing at $0 remote', Math.abs(r.required - (r.tripCost + r.landing)) < 1);
ok('auto-solve closes the gap to zero', Math.abs(r.gap) < 1, 'gap ' + f(r.gap));
ok('auto-solved ending cash equals the landing fund', Math.abs(r.endingCash - r.landing) < 1, f(r.endingCash));
ok('trajectory ends at ending cash',
  Math.abs(r.traj[r.traj.length - 1].cash - r.endingCash) < 1,
  'traj ' + f(r.traj[r.traj.length - 1].cash) + ' vs ' + f(r.endingCash));
ok('trajectory departure point equals departure cash',
  Math.abs(r.traj[r.M].cash - r.departureCash) < 1,
  'traj ' + f(r.traj[r.M].cash) + ' vs ' + f(r.departureCash));
ok('trajectory length = M + T + 1', r.traj.length === r.M + r.T + 1);
ok('region months equal trip months', r.regionMonths === r.T);
ok('no validation errors in base case', r.flags.filter(x => x.level === 'error').length === 0,
  JSON.stringify(r.flags.map(x => x.level + ':' + x.text.slice(0, 40))));
ok('backstops excluded from departure cash by default', r.backstopCash === 0);

console.log('\n--- remote income lever ---');
[0, 1000, 2000, 3000, 5000, 10000].forEach(v => {
  const x = SF.runScenario(s, { remoteIncome: v });
  console.log('  $' + String(v).padStart(6) + '/mo  required ' + f(x.required).padStart(10) +
    '   gross needed ' + f(x.requiredGross).padStart(10) + '   /mo ' + f(x.requiredMonthlyGross).padStart(9));
});
const zero = SF.runScenario(s, { remoteIncome: 0 });
const two = SF.runScenario(s, { remoteIncome: 2000 });
ok('$2k/mo reduces required departure cash by exactly 24 x 2000',
  Math.abs((zero.required - two.required) - 48000) < 1, f(zero.required - two.required));

console.log('\n--- scenarios ---');
SF.SCENARIOS.forEach(sc => {
  const x = SF.runScenario(s, sc.patch);
  console.log('  ' + sc.name.padEnd(16) + ' req ' + f(x.required).padStart(10) +
    '  gross ' + f(x.requiredGross).padStart(10) + '  /mo ' + f(x.requiredMonthlyGross).padStart(9) +
    '  trip ' + f(x.tripCost).padStart(10) + '  end ' + f(x.endingCash).padStart(9) +
    '  months ' + x.regionMonths + '/' + x.T);
  if (x.regionMonths !== x.T) { fails++; console.log('    FAIL region months mismatch'); }
});

console.log('\n--- levers behave ---');
const lean = SF.runScenario(s, { lifestyle: 0.8 });
ok('lean lifestyle lowers trip cost', lean.tripCost < r.tripCost, f(r.tripCost - lean.tripCost) + ' saved');
const t18 = SF.runScenario(s, { tripMonths: 18, months: SF.scaleRegions({ csa: 6, aus: 6, sea: 12 }, 18) });
ok('18 months costs less than 24', t18.tripCost < r.tripCost, f(r.tripCost - t18.tripCost) + ' saved');
ok('18-month flight cost scales down', t18.oneRows[0].amount < r.oneRows[0].amount);
const noAus = SF.runScenario(s, { months: { csa: 12, aus: 0, sea: 12 } });
ok('skipping Australia drops the van cost', noAus.oneRows[1].amount === 0);
const noStorage = SF.runScenario(s, { fixed: Object.assign({}, s.fixed, { storage: 0 }) });
ok('killing storage saves 175 x 24', Math.abs((r.tripCost - noStorage.tripCost) - 175 * 24) < 1);
const liq = SF.runScenario(s, { liquidateStocks: true });
ok('liquidating stocks lowers the required gross', liq.requiredGross < r.requiredGross,
  f(r.requiredGross - liq.requiredGross) + ' less');
const manual = SF.compute(Object.assign(SF.clone(s), { autoSolve: false, preIncome: 0 }));
ok('manual $0 income produces a real funding gap', manual.gap > 0, f(manual.gap));
ok('manual ending cash = landing - gap', Math.abs(manual.endingCash - (r.landing - manual.gap)) < 1);

console.log('\n--- top 5 overhead lines over the trip ---');
r.fixedRows.slice(0, 5).forEach(x => console.log('  ' + x.label.padEnd(36) + f(x.monthly).padStart(7) + '/mo  ' + f(x.trip).padStart(9)));
console.log('  ALL FIXED'.padEnd(38) + f(r.fixedMonthly).padStart(7) + '/mo  ' + f(r.fixedTotal).padStart(9));

console.log('\n--- break-even ---');
[0.25, 0.5, 0.75, 1].forEach(p => console.log('  ' + (p * 100) + '% of burn: ' + f(r.burnAbroad * p) + '/mo'));


/* ---- route-driven schedule ---- */
const SP = require('../src/spots.js');
const byId = {}; SP.SPOTS.forEach(x => byId[x.id] = x);
const route = SP.DEFAULT_ROUTE.map(l => ({ spot: l.spot, months: l.months, rid: byId[l.spot].region,
  cost: byId[l.spot].cost, name: byId[l.spot].name }));
const rs = SF.compute(Object.assign(SF.clone(SF.DEFAULTS), { route: route, useRouteCosts: true }));
console.log('\n=== ROUTE-DRIVEN ===');
rs.regionRows.forEach(r => console.log('  ' + r.short.padEnd(12) + r.months + ' mo  ' + f(r.burn) + '/mo  ' + f(r.total).padStart(9) + '  ' + Math.round(r.share*100) + '%'));
console.log('  route travel total  ' + f(rs.travelTotal) + '   flat CSV total ' + f(r.travelTotal));
console.log('  trip cost ' + f(rs.tripCost) + '  required ' + f(rs.required) + '  gross/mo ' + f(rs.requiredMonthlyGross));
console.log('  sprint at $15k/mo gross: ' + rs.sprintMonths(15000).toFixed(1) + ' months');
console.log('  sprint at $25k/mo gross: ' + rs.sprintMonths(25000).toFixed(1) + ' months');
ok('route months fill the trip', rs.regionMonths === rs.T, rs.regionMonths + '/' + rs.T);
ok('route schedule has one entry per trip month', rs.sched && rs.sched.length === rs.T);
ok('route trajectory ends at ending cash', Math.abs(rs.traj[rs.traj.length-1].cash - rs.endingCash) < 1);
ok('charter lands in a real month', rs.traj.filter(p => /charter/i.test(p.note||'')).length === 1);
ok('van cost charged once', rs.traj.filter(p => /Van purchase/.test(p.note||'')).length === 1);
const hops = rs.traj.filter(p => /Long-haul/.test(p.note||'')).length;
ok('long-haul legs = region changes', hops === 4, hops + ' hops');
console.log('\n=== LEVER RANK ===');
SF.leverRank(Object.assign(SF.clone(SF.DEFAULTS), { route: route, useRouteCosts: true }))
  .forEach(l => console.log('  ' + f(l.saves).padStart(10) + '  ' + l.label));

console.log(fails ? '\n' + fails + ' FAILURES\n' : '\nAll checks passed.\n');
process.exit(fails ? 1 : 0);
