# Mobile atlas: current place, then detail

27 October 2026. Additive change to the existing atlas; original 32 discoveries, 31 source-backed pins, approved imagery, route IDs and note keys remain intact.

## The observed source problem

The previous layout put32 places in a long horizontal strip below a490 px mobile map. Selection changed a separate preview, but there was no previous/next action, no quick picker, no current filtered-list position and no guarantee the active list button stayed visible. This made place-to-place exploration require repeated sideways scrolling and reorientation.

## The resulting behavior

- A persistent navigator between the map and the preview has46 px previous/next buttons, a native single-select picker and a position within the *current* search/layer/period/access result set. It uses the same ordering as the list, including explicit geolocation distance ordering.
- Previous/next stop at real result boundaries. Filtering chooses the first matching place only when the previous selection is absent. Zero results disable navigation and retain the real reset action. Opening an out-of-filter place keeps that situation explicit and allows returning to filtered results.
- At 760 px and below, the32-card horizontal strip becomes an optional vertical list, bounded to235 px or 31 svh. It starts folded. Picking from the list folds it and returns focus to the stable native select with `preventScroll:true`.
- The mobile map is285–380 px high. The navigator shares the atlas containing block with the detail, so it stays reachable while reading the place. A short landscape viewport uses normal flow instead of sticky navigation.
- Selecting a marker, previous/next button or native option updates the existing preview, pressed list state and map selection. It never scrolls the whole document. A list-only bounding-rectangle adjustment reveals a late selected button when the list is open; there is no `scrollIntoView`, smooth scrolling, custom swipe recognizer or wheel listener.
- List buttons use a roving tab stop. Arrows, Home and End navigate within the current results and keep keyboard focus on the corresponding button. Escape closes the mobile chooser. Filter buttons preserve keyboard focus when their existing container is rerendered.
- The existing preview's large live region becomes silent; one concise polite status announces the current proper name and position. The map retains native pan/zoom behavior, legal/source information and opt-in geolocation. Address-only places never receive invented coordinates or a camera pan to 0,0.

The navigator/select/buttons remain the same DOM nodes across selection; only list membership changes after a filter/search update. English/French/Czech translation is supplied through the existing language layer. Proper names in native options are explicitly retained. Root adds final dictionary entries and bumps the atlas/CSS asset versions in the HTML wiring generator.

## Files

- `dist/atlas.js`: shared ordered result set, stable navigator, current selection, list-only reveal, picker/key/focus lifecycle.
- `dist/city-atlas.css`: existing visual identity, responsive placement,46 px touch controls and bounded list.
- `tests/atlas-place-browser.mjs`: the real production atlas runtime and data in a DOM/VM harness.

## Verification

Passed `node tests/atlas-place-browser.mjs`, `node tests/culture-integration.mjs`, `node tests/place-visuals-integration.mjs` and `npm test`.

The new behavior test drives the actual DOM events: next/previous, native quick selection, all three philosophy results, no-result/reset, unresolved Spot13, list-only scroll, keyboard arrows/Home/End/Escape, marker selection, mobile ↔ desktop breakpoints, final listener removal and optional culture-network failure. It verifies unchanged notes and no page scrolling or automatic geolocation. It does not render CSS or claim physical-device touch/GPU performance. Actual mobile/desktopcaptures remain the release owner's check.

## Rollback

Revert the mobile-browser source/CSSchange and associated HTML cache-version bumps, or redeploy the preceding saved Site version 29. No data migration or deletion is needed. Do not clear local notebooks.
