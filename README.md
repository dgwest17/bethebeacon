# Swell Fund

A surf-expedition planning dashboard: how much cash it takes to leave, how long
it lasts, and where the course actually goes.

Three tabs:

- **Treasure** — the financial model. Required departure cash (the paddle-out
  number), the funding gap, the gross income needed before departure, monthly
  burn abroad split into travel burn and home-break overhead, month-by-month
  cash trajectory, ranked overhead audit, remote-income ladder, break-even, and
  five scenarios side by side. Every input is editable and every formula is
  printed in the audit trail.
- **Integrity** — the checklist. Two lists, *before I leave* and *on the road*,
  seeded with the work the financial model already assumes you'll do. Add items
  in one line, tag them by area, hang them off a calendar month or a leg of the
  course, and tick them into the **Locked in** bucket when they're done. The
  summary shows what's open, what's due this month, and progress by area.
- **Adventure** — the route. A Pacific-centred surf chart with 29 breaks
  (season, monthly cost, visa rules, board-bag logistics, hazards), a course
  builder you can reorder and restretch, flight legs between stops, and work
  blocks showing what each leg can support — wifi and San Diego overlap.

Adventure feeds the model — changing the course rewrites the region months, the
trip length and the travel burn — and Integrity hangs its items off the same
calendar and the same legs.

## Run it

It's one static file. Open `index.html`, or:

```bash
npx serve .
```

## Deploy

**Vercel** — import the repo. `vercel.json` pins it as a static deploy of the
repo root (`outputDirectory: "."`, no build command), so `index.html` is served
directly. No build step, no environment variables. If you ever see *No Output
Directory named "public"*, it means Vercel picked up a build script — that's
what this config prevents.

```bash
npx vercel --prod
```

**GitHub Pages** — Settings → Pages → deploy from branch, root folder.

## Editing the model

Source lives in `src/` and is inlined into `index.html` by the build script.
After changing anything under `src/`, run:

```bash
node build.js      # regenerates index.html and dist/artifact.html
node test/check.js # 30+ assertions on the model's identities
```

| File | What's in it |
|---|---|
| `src/model.js` | Every figure from the planning CSV, plus the math. Runs in node and the browser. |
| `src/spots.js` | The 29 breaks, their seasons and costs, and the default course. |
| `src/tasks.js` | The seeded Integrity checklist and its categories. |
| `src/app.js` | Rendering, charts and interaction. |
| `src/styles.css` | Tokens and layout. |
| `src/page.html` | Page skeleton with inline slots. |

## Modeling rules the code keeps

- Stocks/401(k) and condo equity are **backstops**. They are never counted as
  travel cash unless their toggle is switched on, and switching one on raises a
  warning flag.
- The student-loan **balance** is never an expense. Only the monthly payment is,
  unless payoff is explicitly enabled.
- The return landing fund is a protected floor, not a budget to spend.
- Pre-departure costs and costs abroad are kept apart; balances and cash flows
  are kept apart.
- Nothing is counted twice. The long-haul flight budget covers continent jumps
  only; regional hops and board-bag fees are their own monthly line; regional
  burn already includes housing, food and local transport.
- Anything missing from the source data is marked **INPUT NEEDED** rather than
  invented. Three recurring costs absent from the CSV are marked **ADDED**:
  ATM/FX and wire fees, in-region hops and board-bag fees, and visa extensions
  and onward tickets.

State is kept in `localStorage` only. Nothing is sent anywhere.
