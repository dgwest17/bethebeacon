/* ==========================================================================
   SWELL FUND — Integrity: the list of things you said you'd do.
   Two lists (before you leave / on the road), one bucket for what's locked in.
   ========================================================================== */
(function (root) {
  'use strict';

  var CATS = [
    { id: 'money', label: 'Money' },
    { id: 'condo', label: 'Condo' },
    { id: 'business', label: 'Business' },
    { id: 'gear', label: 'Gear' },
    { id: 'admin', label: 'Admin' },
    { id: 'body', label: 'Body' },
    { id: 'build', label: 'Build' },
    { id: 'life', label: 'Life' }
  ];

  /* Seeded from the model — every line here is something the Treasure tab is
     already assuming you will do. */
  var SEED = [
    // --- before you leave ------------------------------------------------
    ['pre', 'money', 'Pay off the $20k business card before the 0% promo expires in February', 'The model assumes this. If it slips, interest follows you around the world.', 'm5'],
    ['pre', 'money', 'Set the student loan to IDR or deferment and put the real payment in the model', 'The only INPUT NEEDED left on the Treasure tab.', 'm2'],
    ['pre', 'money', 'Open a no-FX-fee card and a zero-ATM-fee checking account', 'Worth roughly $45/mo — the ADDED banking-fees line.', 'm3'],
    ['pre', 'money', 'Move 2FA off the physical SIM onto an authenticator app', 'Losing a US number abroad locks you out of your own bank.', 'm3'],
    ['pre', 'money', 'Give someone you trust a POA and a way to reach your accounts', 'For the version of the trip where something goes wrong at home.', 'm5'],
    ['pre', 'money', 'Confirm the 2026 tax bill with the CPA before it is due', 'Currently a $10,000 estimate.', 'm4'],
    ['pre', 'condo', 'Get three property-management quotes and replace the $200 placeholder', 'Usually 8–10% of rent. The placeholder is almost certainly low.', 'm2'],
    ['pre', 'condo', 'Price the rent off real comparable listings, not an online estimate', 'Drives the $200/mo shortfall line.', 'm2'],
    ['pre', 'condo', 'Switch to landlord insurance and notify the HOA', 'Most policies void the moment it becomes a rental.', 'm5'],
    ['pre', 'condo', 'Decide: rent it or sell it', 'Selling removes $14,400 of trip cost. It is the third-biggest lever you have.', 'm1'],
    ['pre', 'business', 'Audit every subscription statement line by line and cancel what will not survive', 'Budgeted at $2,035/mo of overhead. This is where it gets cut.', 'm3'],
    ['pre', 'business', 'Move to a CPA who handles expat filing — FEIE, FBAR, state residency', 'Filing from abroad is not the same return.', 'm4'],
    ['pre', 'business', 'Decide what happens to the rep team while you are gone', 'And who answers the phone.', 'm2'],
    ['pre', 'business', 'Collect the solar pipeline — the model only banks 80% of it', 'Every point of collection is real departure cash.', 'm4'],
    ['pre', 'gear', 'Build the quiver and buy the board bag you will actually travel with', 'Two-board coffin, wheels, padding. It has to survive 15 flights.', 'm5'],
    ['pre', 'gear', 'Buy travel insurance that genuinely covers surfing AND motorbikes', 'Most policies exclude both. Read the exclusions, not the summary.', 'm4'],
    ['pre', 'gear', 'Pack a real ding-repair kit and learn to use it before you need it', 'Sun-cure resin, cloth, sandpaper. A snapped board in Nias is a week lost otherwise.', 'm6'],
    ['pre', 'admin', 'Passport: 12+ months validity and at least 6 blank pages', 'Indonesia and Australia both refuse entry inside 6 months.', 'm1'],
    ['pre', 'admin', 'Vaccines: typhoid, hep A, tetanus, rabies series', 'The rabies series takes a month. Start early.', 'm1'],
    ['pre', 'admin', 'International Driving Permit', 'Required to legally ride in Indonesia and to rent in Australia.', 'm5'],
    ['pre', 'admin', 'Mail forwarding plus a US address that is not the condo', 'You cannot use a rented-out condo as your address.', 'm5'],
    ['pre', 'body', 'Full physical and a dentist visit before you go', 'Cheaper here than an emergency anywhere on the route.', 'm4'],
    ['pre', 'body', 'Get genuinely fit for 4-hour sessions and 12-hour travel days', 'The first month abroad is brutal if you arrive out of shape.', ''],
    ['pre', 'life', 'Sell or donate enough that the storage unit goes to $0', '$175/mo is $4,200 over the trip to keep things you may not want back.', 'm6'],
    ['pre', 'life', 'Sell the car or park the $75/mo carrying cost', '', 'm6'],
    ['pre', 'life', 'Book or cut the November Europe trip', '$3,000 either way — decide, do not drift.', 'm1'],
    ['pre', 'build', 'Get the app in front of paying users before you leave', 'Recurring revenue earned at home is worth the same as revenue earned abroad, and it is far easier to sell in person.', 'm6'],

    // --- on the road -------------------------------------------------------
    ['abroad', 'build', 'Get recurring revenue to $2,000/mo', 'Worth $48,000 off the departure number. The single biggest lever in the model.'],
    ['abroad', 'build', 'Ship the app to paying users', 'Do it on a fast-wifi leg, not from a boat.'],
    ['abroad', 'build', 'Record the rep training modules', 'Upload-heavy. Bali, the Gold Coast or Sydney.'],
    ['abroad', 'build', 'One call block a week from an Americas leg', 'Those are the only legs with a workable San Diego overlap.'],
    ['abroad', 'money', 'Reconcile real burn against this model on the 1st of every month', 'A plan you never check is a wish.', 'monthly'],
    ['abroad', 'money', 'Keep receipts monthly, not at tax time', '', 'monthly'],
    ['abroad', 'money', 'Never touch the landing fund', 'It is a floor, not a budget.'],
    ['abroad', 'gear', 'Board count in, board count out — log every ding and repair', ''],
    ['abroad', 'body', 'Surf something that scares you at least once per region', ''],
    ['abroad', 'body', 'Stay swimming-fit on the flat weeks', ''],
    ['abroad', 'life', 'Learn enough Spanish to live in it, and Bahasa basics', 'Six months in the Americas is enough time if you actually work at it.'],
    ['abroad', 'life', 'Send something home monthly so nobody has to guess', '', 'monthly'],
    ['abroad', 'life', 'Film and edit on the cheap legs', 'Sri Lanka and Peru are the months with time and low burn.']
  ];

  function seed() {
    return SEED.map(function (t, i) {
      return { id: 't' + i + '-' + Math.random().toString(36).slice(2, 7),
               list: t[0], cat: t[1], text: t[2], note: t[3] || '', by: t[4] || '', done: false, doneAt: null };
    });
  }

  var API = { CATS: CATS, seed: seed };
  root.SFTASKS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
