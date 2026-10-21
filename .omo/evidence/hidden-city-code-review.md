# Hidden City final code and security review

## Final disposition after fixes

codeQualityStatus: CLEAR
recommendation: APPROVE
blockers: []

Final re-review on 2026-10-21 independently verified all production findings below resolved. The earlier report is retained as historical evidence, not outstanding findings.

### Remaining findings by severity

- CRITICAL: None.
- HIGH: None.
- MEDIUM: None.
- LOW: No actionable remaining code finding in the reviewed scope.

### Fix verification

- dist/explorer.js:15 exports nearestLocations. Geolocation at lines 75-78 only computes local nearest entries and does not recenter the third-party tile map, save coordinates, or put them in requests.
- Explorer persistence returns success at line 34 and propagates clear failure at line 81. Atlas reports that failure honestly.
- dist/atlas.js:27 uses the selected creative format and location during shuffle; dist/freestyle.js:7 attaches legacy shuffle only when the atlas format control is absent.
- Explorer restores direct-save and route-save focus at lines 63 and 67, resolves detached openers by place identity at line 70, focuses the new profile close button at line 51, and suppresses restoration during challenge transfer. atlas.js:29 focuses the lab destination after closing.
- src/atlas.html:71-72 names both dialogs through heading IDs, including the dynamic artwork heading provided by atlas.js.
- src/atlas-recorder.js and dist/freestyle.js invalidate pending microphone permission requests on pagehide, release late-acquired tracks, clear object URLs, and suppress results from obsolete sessions. Tests cover denial, late permission cancellation, normal stop, playback creation, deletion, and URL cleanup with simulated audio.
- tools/build-atlas.mjs updates retained incoming /#drops and /#film-portal links. The static test verifies homepage destinations across retained HTML documents; portal navigation targets existing atlas sections.

### Final independent test evidence

Ran npm test after the final retained-link rebuild: exit 0. All legacy interaction/education/cinematic/portal/static/artwork checks, atlas DOM checks, recorder lifecycle checks, and all four Node test entries passed. The expected simulated WebGL fallback message was the only stderr notice. After the final format-test cleanup, independently reran node tests/atlas-dom.cjs: exit 0. No production changes followed the successful full-suite run before this update.

Both required skill perspectives were consulted again against the new tests and fixes. The brittle shuffle word regex was replaced with assertions that selection persists, the prompt changes, and the chosen exercise survives. Supplied challenge text is an input fixture testing transport to the UI/notebook. No remaining substantive remove-ai-slops or programming violation was found. Storage checks and accent normalization serve actual boundaries and search requirements; no unnecessary production parser or speculative abstraction was added.

This approves source and automated checks. Browser behavior, real microphone/geolocation permission flows, audible recording, external source freshness, and publication remain outside this reviewer's assigned verification. Root owns browser QA. Native queued dialog events and focus behavior still need that browser evidence. Gallery assets remain archive recompositions as described below, and optional narration is absent.

---

## Historical initial snapshot (all findings below resolved)

Review scope: new atlas homepage, atlas/principles/explorer modules, reused recorder integration, artwork builder, portal navigation delta, and changed/new tests. Read-only source review; only this report was written. Review date: 2026-10-21.

Initial codeQualityStatus: BLOCK
Initial recommendation: REQUEST_CHANGES

This is a concurrent-work snapshot. The root agent reported that explorer privacy and clear-storage changes are in flight; findings must be rechecked after those changes land.

## Specification assessment

The new homepage integrates Paris discovery, three routes, seven studies, Symbol Lens, six creative formats, the existing local recorder, eight gallery compositions, and local notes. History and interpretation are explicitly separated. Unknown accessibility is correctly described as unknown. Le MUR is correctly presented as commissioned public art rather than unrestricted permission to paint. Optional narration is absent. The SVG gallery recomposes existing raster archive artwork; it does not create eight freshly lettered title artworks. Final reporting should describe this accurately.

## CRITICAL

None found in reviewed scope.

## HIGH

1. **Current automated test entry cannot load the explorer module.** `tests/explorer.test.mjs:2` imports `nearestLocations`, but the inspected `dist/explorer.js` does not export it. Independent `npm test` ended exit 1 with `SyntaxError: The requested module '../dist/explorer.js' does not provide an export named 'nearestLocations'`. All preceding legacy suites and three hidden-city tests passed. This appears to be an in-flight worker mismatch, but approval requires the final module and tests to agree and a fresh passing run.

2. **The inspected geolocation path reveals the user's surrounding area through map requests.** `dist/explorer.js:74` sets the tile-backed map view to the received user coordinates, while `dist/explorer.js:80` requests OpenStreetMap tiles. Latitude/longitude are not literal URL parameters, but tile indices reveal the viewed area. This contradicts the design's guarantee that precise coordinates stay out of third-party requests and the UI claim that coordinates stay in page memory. Keep the basemap independent of the private position, or make the disclosure/consent accurately cover this transmission. Root reports this is being fixed by the map worker; recheck before closing.

## MEDIUM

3. **Shuffle ignores the selected challenge format and location.** `dist/freestyle.js:3` unconditionally writes a generic freestyle prompt. `dist/atlas.js:25` owns format-aware prompts and `dist/atlas.js:26` owns location transfer, but neither is consulted by shuffle. Select Field-recording soundscape or Graffiti sketch and activate Another prompt: the selection remains while instructions change to generic lyrical reflection. A DOM/VM invocation confirmed that shuffle replaces a field-recording instruction with a generic prompt. Integrate shuffle with the atlas prompt state while preserving retained-page behavior.

4. **Saving removes the keyboard return target.** `dist/explorer.js:40` calls `render()`, which replaces the whole list at line 36, including the opener captured at line 43. Closing a profile after saving cannot restore focus because line 66 requires the detached opener to remain connected. Direct list Save and route Save also replace their focused controls. Preserve focus by logical location/route identity or update the existing control; when an unsaved item disappears under the saved-only filter, choose a useful remaining target.

5. **Profile-to-lab transfer restores focus to the explorer.** `dist/explorer.js:64` closes the dialog and dispatches a challenge, while line 66 restores the opener on the queued close event. `dist/atlas.js:26` scrolls the lab but never focuses a lab control. Keyboard navigation therefore remains at the explorer and focus restoration can undo the intended scroll. Suppress restoration for this intentional transfer and focus an appropriate destination control after close. Nearby profile navigation also replaces its focused button at lines 45-47 without moving focus into the new profile.

## LOW

6. `src/atlas.html:71-72` gives the artwork and credits dialogs no accessible name. Associate each dialog with its heading using `aria-labelledby`, or give an explicit label. The explorer dialog already has the appropriate naming pattern.

## Skill-perspective check

Loaded `remove-ai-slops/SKILL.md` and `programming/SKILL.md` from the installed OMO 5.1.21 skills. Applied their test relevance, abstraction, boundary validation, and implementation-mirroring criteria. No deletion-only test, brittle prompt-text snapshot, untyped escape hatch, or unnecessary production parser was found. Search normalization is needed for accented Paris names; localStorage shape checks are appropriate boundary handling. Data schema/reference checks serve real rendering contracts. The isolated Gender-name assertion is a low-value content pin, but does not warrant blocking this work. New tests do not execute `atlas.js` integration; the format/focus issues demonstrate why pure data tests alone do not establish complete interactive behavior. Browser verification remains necessary and belongs to the root agent.

## Evidence and limits

- Inspected actual working-tree diff and untracked new source files; scope is not limited to `git diff`, which omits untracked modules.
- Read `docs/specs/2026-10-21-hidden-city-design.md` and `docs/plans/2026-10-21-hidden-city.md`.
- Independently ran `npm test` from project root. Failure and successful preceding suites are recorded above.
- Inspected `src/atlas.html`, `dist/atlas.js`, `dist/principles.js`, `dist/explorer.js`, `dist/freestyle.js`, `tools/build-atlas.mjs`, and changed/new test code.
- `omo-agent-toolkit ulw-loop status --json` was unavailable (`command not found`), and no project `.omo` plan directory existed before this report. Used the required fallback report path.
- No browser automation, real microphone recording, permission dialog, source-link freshness audit, or deployment verification was performed by this reviewer. LSP servers were unavailable by prior user choice.

Blockers: resolve the missing explorer export and rerun tests; verify the in-flight geolocation privacy fix. The reproducible format and keyboard integration defects should also be corrected before claiming complete feature integration.
