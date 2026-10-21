# CAISIK — The Hidden City / Underground Alchemy

A static, source-backed Paris cultural atlas. The new homepage combines an interactive geographic explorer, three ordered routes, seven philosophical lessons, a browser-local freestyle workspace, and the original CAISIK graffiti archive. The existing Site identity and public audience are preserved.

## Run and verify

The deployment serves `dist/` directly. No dependency installation or build is required for this release. In the managed Sites environment use `sites-preview start /workspace/sites/caisik-underground-alchemy` for internal browser QA. Run `npm test` for the focused atlas integrity and syntax checks.

- `dist/atlas.js` owns discovery filters, geographic map, profiles, local notebook, source register and gallery.
- `dist/atlas-principles.js` owns the seven lessons, visual/sound demonstrations and observation-based progression.
- `dist/atlas-frequency.js` owns creative prompts, local writing, microphone capture, playback/download and timing tools.
- `dist/locations-data.json` contains research, explicit access flags, approximate/verified coordinate notes, routes and credited image sources.
- `dist/principles-data.json` contains the modern Kybalion context, attributed doctrine and original creative exercises.
- `dist/atlas.css` and the two module styles implement the obsidian/gold/bone editorial design.

## Content and privacy

Historical evidence and contemporary CAISIK interpretation are presented separately. The Kybalion is identified as a 1908 modern Hermetic-inspired text, not an authenticated ancient Egyptian source. Le M.U.R. is a curated exhibition, not a free-paint wall. Access conditions are sourced per location and can change after the 21 October 2026 research check.

Notes, favourites and lesson progress use browser localStorage with an in-memory fallback. Export a JSON notebook for a durable personal copy. Microphone permission is requested only by Record; recordings are never uploaded, stop at five minutes or when the page becomes hidden, and must be downloaded before leaving. Narration uses only a device voice marked local. Geolocation is opt-in, retained only in page memory, and map requests reveal the viewed area and IP to OpenStreetMap. Maps request only ordinary viewed tiles, without prefetch or offline download.

## Retained experiences and visual limits

The original homepage is preserved at `/archive/`; collections, the 100-work `/art/` blackbook, and store links remain available. The twelve existing `/q/` entry paths now open related lessons in the new experience. Product ordering remains with the original store.

Nine discovery profiles use credited, reusable external Commons photographs, some explicitly archival. La Place, Le M.U.R. and Philharmonie use labelled contemporary geometric studies and link to official venue imagery; those are not documentary photos. The hero is a generated artistic collage. Seven existing artworks and a newly generated transparent TRANSMUTE composition are curated under eight thematic prompts.

Desktop browser interactions were verified at the cloud browser's native viewport. Mobile responsive rules were reviewed in source; a physical mobile browser, actual microphone capture, geolocation permission grant, and device-local narration were not exercised. Browser permission/format fallbacks are implemented, but these remain device checks.
