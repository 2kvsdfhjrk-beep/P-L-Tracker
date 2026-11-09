# Van to Japan

A static, no-build site (HTML, CSS, vanilla JS) built from `van-to-japan-design-brief.md`.
It lives in this folder so the Cross-Ref tool at the repo root is untouched.

## Run locally

    cd van-to-japan && python3 -m http.server 8000   # then open http://localhost:8000

It must be served over http because the page loads `data/*.json`.

## The journey is data

| File | What it drives |
|---|---|
| `data/chapters.json` | The route down the page, chapter pages, counters, value, sea chart pins |
| `data/competitions.json` | Tickets, competition pages, ticket bars, countdowns |
| `data/winners.json` | Winner polaroids |
| `data/site.json` | Name, tagline, house target value, how-it-works steps, FAQ, free entry details, socials |

**Add a new van:** set the old chapter's `status` to `completed` (with `dateEnded` and `valueOut`), then add a new entry with `status: "current"`. The route, the van's parking spot, the odometers, the progress strip and the house tide gauge all update. The "next stop unknown" card and the destination are added automatically.

## How it is built

One page (`index.html`) with hash routes, so page changes animate and every view has a shareable link:
`#journey`, `#win`, `#winners`, `#how-it-works`, `#about`, `#free-entry`, `#legal`, `#chapter-<n>`, `#win-<competition id>`.

- `css/tokens.css`: palette, type, spacing, and the day and night ("Night Fishing") values
- `css/base.css`: reset, typography, paper grain, contour texture, wave edges
- `css/components.css`: header, tickets, logbook cards, polaroids, stamps, forms
- `css/scene.css`: harbour hero, odometers, the route, the destination
- `js/scene.js`: the illustrations and motion (van, torii, waves, route, odometer, stamps)
- `js/app.js`: data loading, routing, components and pages

Motion: the sun rises and the route draws on load, the van drives the route as you scroll, odometers roll, stamps press, the tide rises in the house, and day/night cross-fades. All of it is switched off for visitors who prefer reduced motion.

## Still to do (placeholders)

- All content is marked `"sample": true`; replace it with real chapters, photos and videos (`hero`, `gallery`, `videos` fields; videos support youtube, tiktok, instagram). Photo slots show a numbered placeholder until then.
- Target value (£150,000) is a placeholder estimate.
- **Checkout is not connected.** Add a payment provider and check the skill-question answer on the server (the answer is deliberately not in the JSON).
- Free entry address and instructions, draw platform, terms, privacy and responsible play need real, legally reviewed text for UK prize competitions.
- Series name and logo are working titles. Social links are empty.

## Deviations from the brief

- The hanko stamp and the sun use their own reds so Torii Red stays reserved for the main action.
- Link text uses a darkened Tide because the brand Tide fails AA contrast as text on Washi.
- The hero is illustrated rather than a photo, because there are no real photos yet and the brief rules out stock. Swap in a real photo by giving the current chapter a `hero` image and replacing the scene in `pages.home`.
