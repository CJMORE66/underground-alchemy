# Living culture and visible motion — release QA

Verification date: 26 October 2026.

This change extends the existing Paris atlas with researched graffiti/art venues, shops, music spaces and philosophical circles. The original twelve discoveries, three routes, documentary sources, individual illustrations and model identities remain separate canonical records. New venue addresses are not a claim of a verified entrance pin, a partnership, live availability or permission to paint.

## Verification status

- `node tests/culture-integration.mjs` — **PASS**. Runtime parser, shipped content, all thirteen HTML entries, and the actual atlas bridge were executed.
- The release owner separately runs the existing atlas, city-map, place-artwork and expedition regression suites and records actual browser evidence before publication.
- Actual desktop/mobile browser evidence and physical-device/GPU limits must be recorded separately. A DOM test or a mocked map is not evidence that real GPU rendering, phone performance, opening hours or third-party ticket availability work.

## Automated evidence

The integration suite imports the real culture parser and runs the actual `dist/atlas.js` in a DOM harness. Only the rendering and unrelated UI dependencies are replaced. It verifies:

- Fourteen shipped additions, five cultural categories, valid per-place source dates, source links and complete question/observation/practice/review/output assignments. Existing expedition URLs are actual files.
- Hostile categories, duplicate or overridden IDs, invalid dates, unsupported schema, credentials in source URLs and unvalidated extra media are rejected or removed. Numbers without a valid geographic source remain null.
- All 26 discoveries enter the original searchable atlas. Only the twelve existing positioned places become Leaflet markers. Null-coordinate places never pan to 0,0 or show invented numeric distances, and the three added thematic routes do not bridge absent coordinates.
- Every new place opens a genuine source-dated profile containing the original research, task, official links and address navigation. An unbuilt new venue does not receive a model button or a fake documentary image.
- The culture board's real selection/filter callbacks control the original atlas. Philosophy filters produce three address-only discoveries and zero fake markers. Location is requested only after the native Near Me action.
- Existing notes, bookmarks and unrelated expedition/selfmade storage survive. Actual JSON export includes both recognized and unknown retained note IDs. A failed persistent write is visible, and the new in-memory note remains exportable.
- Missing or malformed optional data preserves the twelve original places and three original routes. An unavailable board preserves all 26 places in the original list.
- The near-map motion switch synchronizes the existing footer preference and respects a previously stored pause setting.

The test deliberately does not claim that a mocked renderer proves real WebGL composition, 3D map placement, architectural resemblance or physical-phone input performance.

## Required contracts

- Optional culture data is runtime validated; missing or malformed culture content leaves the original atlas readable and functional.
- Real location IDs remain separate from route membership. Null coordinates never become 0,0, a fake distance, a map marker or a connecting route leg.
- New profiles distinguish sourced facts, contemporary interpretation and creative assignments. Source dates are per place. Historic images and original locations are not rewritten to look recently fact-checked.
- Model actions are shown only for the twelve actual authored models. Conceptual culture symbols are not represented as photographs or reconstructions of the new venues.
- Notes use the existing `atlas-observations` notebook and remain exportable. No expedition/selfmade storage key, recording, account or location permission is added by loading the feature.
- A hidden, paused or reduced-motion scene stays readable. Visible animation strengthens source-space internal details rather than hiding text behind a mandatory introduction.
- Cache-versioned scripts and CSS are wired once to all thirteen original atlas entry routes. The additive wiring must be idempotent.

## Research and access boundaries

Each venue's official sources and access notes are retained in the culture data and field UI. A curated mural, a public gallery or a graffiti shop does not grant permission to paint. A multi-genre club is not labelled a dedicated hip-hop venue. Past event dates are not future bookings; changing ticket prices, capacity and hours require the operator's current programme.

## Rollback and content maintenance

The deployment immediately before this change is version 27. Roll back by deploying that saved version, or revert the additive culture/motion change in a new commit. Do not reset shared Git history and do not delete local notebook storage.

Update the retained primary-source research and the canonical culture JSON, then run the runtime validation/integration tests and the atlas regressions. Re-run the HTML wiring after any older page generator. If a venue closes or moves, mark its current status and review route membership; do not silently reuse its ID for a different business.

## Actual browser evidence

The managed Chrome preview rendered the real application, not a generated mockup. Actual desktop and same-origin responsive iframe views were inspected. Screenshots are retained in `docs/qa/culture-desktop.jpg`, `culture-mobile.jpg`, `culture-motion-a.jpg` and `culture-motion-b.jpg`.

- Desktop: 26 discoveries, 14 living-culture entries, native category filtering, keyboard Enter activation, real address links and source disclosures. The cultural record-shop scene rendered and its vinyl group had an actual changing CSS transformation matrix. No horizontal page overflow.
- Original Notre-Dame profile: individual overlay paths, bright moving nibs and source-paint regions were observed changing in real browser frames. Frame A: first paint-region rotation 8.202 degrees, runner dashoffset 0.6825, trace dashoffset 0.0691, phase KRESBA. Frame B: rotation 3.444 degrees, runner dashoffset 0.5625, trace dashoffset 0, phase SVĚTLO. The intact original image stays fixed.
- Actual global pause through the new map control set `data-motion=off`, synchronized the footer and stopped the illustration. Native replay showed an explicit visible explanation and retained a hidden SVG layer. Restoring the control resumed playback. Final code also points to the new map control in the explanatory message.
- Mobile 390px and compact 320px viewports: document client/scroll widths matched at 375/375 and 305/305 (native scrollbars account for the difference); the normal-mode SVG artwork remains visible at 180px height. Field mode hides optional artwork and exposes the selected address/navigation and a single practice step. The compact field module measured 275/275 without overflow.
- Short landscape 844x390 viewport: client/scroll widths matched at 829/829; native vertical scrolling remains available.
- A typed Czech Blackbook draft survived changing practice steps and category render; its exact value remained in the textarea. These preview drafts were not submitted or saved to the public site.
- The mobile philosophy selection opened Café des Phares in the existing profile dialog, retained the official source link, displayed one contemporary SVG symbol and offered no nonexistent building-model action. Profile width/scrollWidth matched at 300/300.
- Direct `#culture-district` entry is re-aligned after the optional asynchronous module mounts, so a late content expansion cannot leave the intended section below the viewport.

No microphone or geolocation permission was requested. The responsive iframe fixture was local QA only and was removed before packaging. Reduced-motion preference and storage failures were exercised in runtime tests; a physical device OS preference was not changed.

## Regression results

PASS: `npm test`, `node tests/culture-board.mjs`, `node tests/culture-integration.mjs`, `node tests/place-art-motion.mjs`, `node tests/place-visuals-integration.mjs`, `node tests/city-map.mjs`, `node tests/city-landmarks.mjs`, `node tests/expeditions.mjs`, `node tests/play-integration.mjs` and `git diff --check`. Repeated HTML wiring is idempotent. The original twelve illustrations and model identities remain unchanged.

## Remaining verification limits and materials

This cloud browser has no WebGL2, so the existing GPU model layer still cannot be visually verified here. The original twelve models and their SVG study viewer are retained, with existing geometry/lifecycle regressions passing. No 3D models, building photographs or scanned geometry are claimed for the fourteen new venues; their animated symbols identify cultural layers. Their official addresses are provided with external navigation, while the unverified coordinates stay null and are visibly excluded from geographic pins and connecting route legs.

Research verifies published primary-source statements as of 26 October 2026. It does not prove an establishment is physically open today, its entrance is accessible, a workshop has capacity or a particular event will occur. No painting approval, artist recording permission, partner contract or booking has been obtained. Existing historical sources and their earlier verification dates remain intact. Physical mobile performance and current on-site access remain separate from this release's browser tests.
