# Be The Beacon

A surf-expedition planning dashboard: how much cash it takes to leave, how long
it lasts, and where the course actually goes.

Four tabs:

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
- **Research** — the other reason to go. A lead pipeline of people and
  organisations along the course working on ocean plastic, reefs, kelp and
  mangroves, energy, fisheries policy and coastal communities. Drag a card
  between stages, see which stops still have nobody on them, and work the eight
  standing questions so eighteen conversations add up to one body of work.
  Seeded with 18 real organisations, each with a source link and no contact
  name — finding the right person is the first piece of research on every one.
- **Adventure** — the route. A Pacific-centred surf chart with 33 breaks across the
  Americas, Australia, New Zealand and Asia, four one-click course presets
  (each with season, monthly cost, visa rules, board-bag logistics and hazards),
  a course builder you drag to reorder, flight legs totalled against the
  repositioning budget, and work blocks showing what each leg can support —
  wifi and San Diego overlap.

Adventure feeds the model — changing the course rewrites the region months, the
trip length and the travel burn. Integrity hangs its items off the same calendar
and the same legs, and Research measures its coverage against them, so a stop
with nobody to see shows up as a gap rather than a blank.

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
| `src/spots.js` | The 33 breaks, their seasons and costs, and the four course presets. |
| `src/tasks.js` | The seeded Integrity checklist and its categories. |
| `src/research.js` | The seeded research leads, themes, pipeline stages and standing questions. |
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

## Where your data lives

Every change on all three tabs autosaves immediately. Where it lands depends on
where the page is running:

- **On your own domain** (this repo, deployed to Vercel): `localStorage` only —
  one browser on one device, nothing sent anywhere.
- **Opened as a Claude artifact**: also synced to a small per-artifact document
  store tied to your account, so the plan follows you between laptop and phone
  with nothing to set up. The header chip reads *Synced* instead of *Saved*.
  The page feature-detects this at runtime; the same file does both.

The **Saving & backup** panel at the top of the page covers the rest:

- **Download backup file** — a dated `be-the-beacon-YYYY-MM-DD.json` holding the
  complete state. Keep it in Dropbox, iCloud or the repo. (Uses the artifact
  `downloads` capability when present, a blob link otherwise.)
- **Copy backup to clipboard** — the same JSON, for when a sandboxed preview
  blocks downloads.
- **Copy portable link** — the entire plan gzipped into a URL hash (~5 KB).
  Mail it to yourself, open it anywhere, and the dashboard rebuilds itself.
  Requires no account and no server.
- **Restore** from a file or from pasted text.
- **Daily snapshots** — one per day, eight kept, in the same browser storage.
  Protection against a mis-click, not against losing the laptop.

The save chip in the header shows the time of the last write, and turns red if
the browser is refusing storage (private windows, blocked site data).

## Courses

Four presets sit above the leg list; loading one replaces the legs and nothing
else, so the financial inputs and the Integrity checklist are untouched. Each
card shows its length, its season fit and its travel burn before you commit:

| Preset | Shape |
|---|---|
| **The Beacon Run** | Central America in spring, WA and New Zealand for the southern winter, Asia, a second Australian winter, home via Ecuador. |
| **Long New Zealand** | A full southern winter across both NZ islands before Asia. |
| **Australia First** | Straight into the southern winter, the Americas at the end. |
| **The CSV Split** | The original 6 / 6 / 12 blocks, resequenced so every month is in season. |

All four are season-checked against an April 2027 departure by `test/check.js`.

## Reordering the course

Legs on the Adventure tab are dragged by the numbered grip on the left — one
pointer-event path, so it works with a mouse, a pen and a finger. Focus a grip
and the up/down arrow keys move that leg instead, which keeps the whole thing
usable from the keyboard.
