# CAISIK language and city release: independent QA

Date: 2026-10-27. Branch: `feature/city-languages`. Restoration baseline: `254091db`.

This report records source and runtime tests. It does not certify a physical phone, browser rendering, map-tile availability, GPU performance, studio bookings, or installed speech voices. No publication was performed by this audit.

## Independent release gate

Run:

```sh
node tests/languages-integration.mjs
```

The test reads the shipped production data and dictionaries rather than a copy of their expected wording. It checks three matching dictionary key sets; real location, principle, freestyle, culture, expedition, studio-session and Selfmade teaching fields; all 27 experience HTML entries; and language asset ordering before kinetic text. It also checks 13 atlas entries retain the scroll runtime, 32 places contain 31 real coordinate pairs, six researched studios exist, and the studio practice has three lessons. Spot13 remains unpinned. A missing coordinate is not interpreted as zero.

The runtime part executes the actual `dist/languages.js` and `dist/text-motion.js` against the complete production homepage DOM. The production Journal and Store modules add saved user projects, revisions, an inventory, vocabulary and linked works. User-written strings deliberately match real dictionary keys, so an incorrect translation of private work is detectable.

Linkedom's actual MutationObserver delivers mutations through its real microtask behavior. A delegating wrapper counts deliveries without synthesizing mutation records. A finite RAF queue supplies browser frame callbacks and detects requeueing. The child process has a 15-second hard timeout, and each settle phase requires three idle event-loop turns. These checks detect self-requeueing that a manually triggered observer mock would miss.

The runtime checks six language transitions, lazy initial locale loading, original button/icon identity and handlers, translated semantic heading names and alternative text on the actual homepage hero, kinetic wrappers, observed dynamic paragraph and heading insertion, replacement of an existing paragraph's source, persistence-key isolation, cleanup and zero work after settling. The actual Frequency module is also mounted: all six creative-format buttons are clicked in all three languages, checking independently translated instructions and the linked place challenge while preserving the user's draft and word chain. Quiet/resume preferences exercise the real kinetic runtime's observer too.

The final catalogue gate passed with 2,825 matching entries per locale, 1,121 checked public teaching/profile/task/access field occurrences, 27 correctly wired HTML pages, 13 scroll-enabled atlas entries, 32 places/31 pins/six studios/three studio lessons, and descriptive alternative-text coverage on every wired HTML page. The runtime passed with 99 observer deliveries, 29,954 mutation records and 69 finite RAF callbacks in 2,832 ms; it then remained idle. These counts and timing describe this local harness run, not phone performance or an editorial percentage.

## Other executed checks

| Command | Result | What it verifies |
| --- | --- | --- |
| `node tests/languages.mjs` | PASS | CS/EN/FR preference, lazy dictionaries, numeric templates, race/offline/storage failures, 40 practice cards, recall, export/reset, modal controls, explicit public-text comparison and private selection rejection |
| `node tests/journey-scroll.mjs` | PASS | Four reversible native-scroll compositions, chapter navigation, finite RAF, pause/reduced/field/modal/tab/BFCache handling and updated language labels |
| `node tests/culture-integration.mjs` | PASS | 20 researched additions, 32 discoveries/31 pins, source dates, safe validation, real board filtering, preserved notes/export and failure states |
| `node tests/city-map-identity.mjs` | PASS | Real map footprints by default, no invented height, explicit authored-model opt-in, late-import cleanup, filter restoration, coordinate/address evidence and fallback |
| `node tests/play-journal.mjs` | PASS | Stored revisions, safe standalone HTML/SVG and TXT, hostile-content escaping, selected editions and consent-bound local deletion |

The language unit suite's observer is a controlled mock; the independent integration suite above supplies the separate actual-observer regression check. Neither harness renders CSS or exercises WebGL.

## Findings and corrective checks

The actual-observer test previously exposed translation writes feeding another scan. The language runtime now disconnects its observer around its synchronous translation writes and uses idempotent setters for its own controls. The real homepage and kinetic runtime now settle, and a subsequent idle phase adds no observer deliveries or RAF callbacks.

The user-content audit found plain rendered project decisions, next steps, titles, inventory values, vocabulary terms and room artwork titles. Those must carry `data-i18n-user` or an equivalent protected ancestor. The production Journal test covers archive cards, opened revision detail, inventory and desk, vocabulary, linked works, room, edition and palette readouts. Mark new user-content readouts explicitly rather than relying on their text being absent from a dictionary.

The room excerpt regression uses a short saved text equal to a public dictionary key. This prevents a long truncated excerpt from passing only because no translation happened to match it. The actual project's snippet stays unchanged across language switches.

Source coverage also checks the actual `culturePlace()` and `cultureRoutes()` outputs. This catches compound profile prose and shared interpretation/accessibility fallbacks that checking only raw JSON misses. Editorial completeness is evaluated against those real public fields, not a translation-count percentage.

An optional diagnostics run is `CAISIK_AUDIT_MISSING=1 node tests/languages-integration.mjs`. It prints unmatched strings from this synthetic test fixture. Missing diagnostics can include retained place names, source titles and already-translated text joined across line breaks, so the count is not a reliable coverage percentage. Do not run such logging against a real user's saved work. The source gate and rendered functional checks are the release tests.

## Checks requiring the release owner's browser/device evidence

- Actual desktop, narrow mobile and short landscape screenshots; dock obstruction, modal language controls, focus/keyboard order and mobile text selection.
- Forward and backward native scrolling with normal and reduced motion, including reading while an animation is paused.
- Actual map rendering, external tiles, correct footprint alignment, optional authored-model appearance, and GPU/frame behavior on the target device.
- A local CZ/EN/FR speech voice on each target OS. The runtime intentionally refuses remote-only voices; installed voices vary. Readable text remains available without a voice.
- Airplane-mode revisit with previously cached versus uncached locale/card assets. Fetch failure behavior is covered in the harness; it does not promise every route is available offline.

Do not describe browser or GPU checks as passed until their real screenshots and observations are attached by the release owner. Existing authored models remain declared artistic approximations, not surveyed building models. Studio availability, equipment and session scope remain conditions to confirm with the venue; no partnership or booking follows from a source link.

## Content maintenance and rollback

Update the appropriate `docs/i18n/*-translations.json` entry and run `python tools/build-languages.py`. Preserve source keys, proper place names and retained English chapter titles. Run both language suites and the integration gate after changes. New user text uses `data-i18n-user`; never put it into shared translation catalogues.

Revert this feature branch's language/runtime/content commits to restore the reviewed baseline. Keep existing atlas, expedition and Selfmade storage keys and the user's exported data. Language preferences and language practice use only `caisik-language-v1` and `caisik-language-learning-v1`; reverting UI code does not require deleting unrelated notes.


## Release-owner final verification

Final compiled catalogue: 2,825 keys per locale. Final actual integration: 99 observer deliveries, 29,954 mutation records, 69 finite RAF callbacks, 2,832 ms, then idle stable. Following the final catalogue and profile-fragment changes, the actual language/culture/place integration and atlas tests passed again.

Seventeen distinct suite groups passed: `languages.mjs`, `languages-integration.mjs`, `city-map.mjs`, `city-map-identity.mjs`, `city-landmarks.mjs`, `culture-board.mjs`, `culture-integration.mjs`, `journey-scroll.mjs`, `place-visuals-integration.mjs`, `place-art-motion.mjs`, `text-motion.mjs`, `play-journal.mjs`, `play-integration.mjs`, `play-workshops.mjs`, `play-field.mjs`, `expeditions.mjs`, and `npm test`. The expedition suite includes actual worker upgrade/failure/quota behavior and exact same-origin language-asset allowlisting. Root additionally marked custom quest values, private field-point values, workshop comparison decisions and inventory-derived prompts as user content.

Actual Chrome observations, desktop and responsive-frame screenshots, measured forward/backward scroll values, native dialog locale switching, Escape focus return, the observed unavailable-local-French-voice fallback, and remaining physical-device/GPU limitations are recorded in `CITY_LANGUAGES_RELEASE.md`. The independent Node audit does not assert those browser results. Temporary QA HTML wrappers were removed before packaging; their screenshots remain in `docs/qa/city-languages/`.
