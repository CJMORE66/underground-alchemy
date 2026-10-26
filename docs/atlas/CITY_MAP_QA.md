# CAISIK / integration of the geographic city — 26 October 2026

The geographic city is an enhancement of the existing Paris atlas. The original twelve sourced places, three ordered editorial routes, profiles, observation fields and bookmarks remain the data model. The new presentation must not be described as a surveyed reconstruction of Paris or its monuments.

## Independent automated result

**PASS:** `node tests/city-atlas-integration.mjs`.

The suite parses all thirteen actual atlas entry documents: the homepage and twelve existing `/q/` routes. Each has exactly one original `#city-map` inside one additive `.map-wrap`, both city stylesheets once, and the original discovery/filter/profile/notebook targets. Production runtime, local library, local worker, CSS, map style and license files exist and are nonempty.

The suite also runs the actual `dist/atlas.js` against a linkedom document. Only map-rendering and pre-existing educational dependencies are stubbed; the atlas' initialization, selection, filtering, route actions, profile rendering, bookmarks and explicit geolocation handler execute as delivered.

Verified behavior:

- The city receives the twelve original geographic place records.
- Selecting a place through the city calls the original atlas selection path and refreshes its real profile preview.
- Opening a city place exposes the original history, documented symbols, artistic interpretation, access/source links and personal observation action.
- All three original routes reach the new city with the exact source-ordered stops. Closing a route clears the new route as well. The UI retains the distinction between stop sequence and a walkable route.
- The real search control filters both the discovery list and city records.
- Two-dimensional tiles are requested only when the city requests fallback; retrying fallback does not add a second tile layer. Original twelve-marker behavior remains available.
- Geolocation is not requested during load. An explicit native control action invokes the existing position workflow and passes the result to the new city.
- Saving another discovery preserves the previous bookmark and does not modify the expedition notebook key.

`tools/wire-selfmade.py` is exercised twice in an isolated temporary directory populated with real HTML copies. Starting without the geographic wrapper/styles, the first run restores one stage per atlas page; the second run is byte-identical. No active application files are rewritten by this test.

## Map content and asset contract

The style declares geographic vector data through its source URL and a building-footprint `source-layer`. Its metadata explicitly identifies approximate heights and an illustrative height for missing values. Provider attribution and the privacy disclosure remain visible. Syntax/file/contract validation does not prove remote tile availability, building completeness or physical access rights.

`tests/city-map.mjs` belongs to the city runtime implementation and covers its rendering-controller lifecycle separately; its final result should be recorded by the owning agent. This integration suite does not substitute a fake scene for geographic data and does not claim that mocked WebGL tests are a rendered map.

## Browser validation status

**Pending owning-agent browser record.** Desktop/mobile screenshots, real tile loading, camera choreography, drag/keyboard input, reverse/skip behavior, reduced motion, WebGL/context failure and fallback presentation must be assessed in the running site. The VM tests above do not establish physical phone or screen-reader compatibility.

No automatic account creation, reservation, commercial partnership, location upload or audio permission is introduced by these integration tests. Map providers still receive the network information disclosed by the UI when their real tiles are requested.

## Actual managed-browser checks — 26 October 2026

- Existing atlas search `Oberkampf` returns exactly original discovery 08; opens the real source-linked profile and address. Bookmark and note interfaces retained.
- Phone iframe at 320 CSS px (305 px content with scrollbar): page scrollWidth equals clientWidth 305 after CTA grouping fix. Profile dialog scrollWidth equals clientWidth 282 after minmax grid and CTA fix.
- 390 px phone profile screenshot: `../qa/city-mobile-preview.jpg`. This is an actual browser capture, not a generated mockup.
- Short landscape iframe 844×390 (829 px content): scrollWidth equals clientWidth 829; collapsed navigation opens all six original links. Map stage is 380 px high.
- Cloud Chromium reports no WebGL 2. Actual fallback activates, reports a concise explanation and retains list/profile/search. Therefore this browser does **not** verify actual 3D graphics. The separate successful public-client GL check is recorded below; mocked renderer checks remain distinct from GPU verification.
- OpenStreetMap raster service returned error tiles in this managed browser. This is an environment-specific availability limit; public tile access remains separately checked.

## Actual public-client GPU checks — 26 October 2026

The existing Site was published as version 25 and opened in the connected browser with real WebGL 2. Actual OpenFreeMap vector tiles and labels rendered. The 3D screenshot `../qa/city-desktop-live.png` was captured from the live Site, not a mock or generated artwork.

- Actual Paris building footprints, the Seine, street lines and mapped district names are visible in the authored gold/black style.
- 3D → 2D reveals the existing geographic Leaflet map; 2D → 3D returns to the loaded scene.
- Selecting Maison de Nicolas Flamel shows its original 51 rue de Montmorency address and profile; finite camera motion moves to it.
- The City Remembers activates exactly five numbered source stops (La Place 1, Flamel 2, République 3, Oberkampf 4, Père-Lachaise 5). The route notice explicitly says the line is an ordered sequence rather than a pedestrian route. Closing clears route mode.
- Rotate, replay intro and skip respond. After finite reveal the skip button is hidden and --city-reveal is 1. Normal mouse wheel scroll moves the page while the GL scene remains loaded.
- Visual review found a vendor CSS compact-attribution override (white background with white links) and a possible canvas-height mismatch in short screens. Both were corrected in the follow-up release: stronger scoped attribution colors and canvas height bound to the stage.

No physical-phone GPU, screen-reader audio, microphone or geolocation permission was exercised. Mobile widths, fallbacks and source contracts were checked separately as above.
