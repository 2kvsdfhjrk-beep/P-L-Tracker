# Van to Japan: site framework

Static, no-build site (HTML, CSS, vanilla JS) built from `van-to-japan-design-brief.md`.
It lives in this folder so the Cross-Ref tool at the repo root is untouched.

## Run locally

    cd van-to-japan && python3 -m http.server 8000   # then open http://localhost:8000

It must be served over http because the pages load `data/*.json`.

## The journey is data

| File | What it drives |
|---|---|
| `data/chapters.json` | Timeline, route map pins, counters, value meter, chapter pages |
| `data/competitions.json` | Competition cards and pages, ticket bars, countdowns |
| `data/winners.json` | Winner cards and carousel |
| `data/site.json` | Name, tagline, house target value, how-it-works steps, FAQ, free entry details, socials |

**Add a new van:** set the old chapter's `status` to `completed` (with `dateEnded` and `valueOut`), add a new entry with `status: "current"`. The timeline, map, counters and home page all update. The "Chapter ?: next stop unknown" card and the faded Japan card are added automatically.

## Structure

- `css/tokens.css`: palette, type, spacing, light and dark ("Night Fishing") tokens
- `css/base.css`: reset, typography, paper grain, contour texture
- `css/components.css`: all components from section 5 of the brief
- `js/app.js`: data loading, derived state, shared header/progress strip/mobile bar/footer, page renderers
- `*.html`: thin shells; `data-page` on `<body>` picks the renderer

Pages: home, journey, chapter (`chapter.html?n=1`), win, competition (`competition.html?id=...`), winners, how-it-works, about, free-entry, legal.

## Still to do (placeholders)

- All content is marked `"sample": true`; replace it with real chapters, photos and videos (`hero`, `gallery`, `videos` fields; videos support youtube, tiktok, instagram).
- Target value (£150,000) is a placeholder estimate.
- **Checkout is not connected.** The competition form validates nothing server-side. Add a payment provider and check the skill-question answer on the server (the answer is deliberately not in the JSON).
- Free entry address and instructions, draw platform, terms, privacy and responsible play pages need real, legally reviewed text for UK prize competitions.
- Series name and logo are working titles. Open decisions from the brief: dark mode default (currently follows the system, with a toggle), literal vs symbolic route map (currently symbolic).

## Deviations from the brief

- The hanko stamp uses a slightly deeper red (`--colour-hanko`) so Torii Red stays reserved for the main action.
- Link text uses a darkened Tide (`--colour-tide-text`) because the brand Tide fails AA contrast as text on Washi. Brand Tide is still used for the route line and dividers.
