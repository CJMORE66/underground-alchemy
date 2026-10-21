# Hidden City verification - 21 October 2026

## Delivered scope

Existing Sites project `appgprj_6ad19e715dcc819185592c61456c5182`, public audience retained. New static atlas homepage, eleven source-backed Paris profiles with real photographs and declared image licences, three ordered thematic routes, seven interactive philosophical studies, Symbol Lens, local recorder and practice pulse, six creative formats, eight self-contained transparent SVG archive compositions, explicit local notebook save/export/delete. Existing hundred-artwork blackbook, twelve QR documents and collection pages remain served; incoming links now lead to real atlas sections.

## Automated verification

`npm run build:atlas` succeeds. `npm test` succeeds after the final production changes. The suite includes retained interaction/education/cinema behavior, 322 QR portal assertions, HTML IDs/assets/fragments and cross-document destinations, the hundred-artwork archive, new atlas DOM integration, recorder lifecycle simulation, eleven complete source profiles, search/accent/filter/empty cases, storage corruption/failure, nearest-place calculations, routes, seven studies and notebook input bounds. `git diff --check` succeeds.

Test-first failures were observed for missing new modules, the removed QR targets, generic shuffle replacing a chosen creative format, and a microphone permission promise resolving after page exit. Their matching checks now pass. Recorder coverage includes permission rejection, late permission cancellation, track release, local playback, deletion and Blob URL revocation; this is simulated audio evidence.

## Observed browser journeys

Matching surface: Codex in-app browser, actual local HTTP preview on port 4317. The initial 400 px hero/navigation and the completed 1075 px interface were inspected visually. At 1075 px there is no horizontal document overflow and loaded images are valid.

- Leaflet displays real OpenStreetMap tiles and eleven labeled geographic markers with attribution.
- Searching Flamel leaves exactly one list result and one marker; unknown search yields a useful empty state; reset restores eleven.
- Flamel profile displays a real photograph, credited licence, official historical sources, separately marked contemporary interpretation, access and creative prompt.
- A place plus a route produce saved count two, retained after reload.
- Each of seven study sliders was changed through actual keyboard input, and each reflection was marked; progress reached 7/7 with seven contextual connections.
- Place-to-lab transfer closes the profile, focuses the format selector, and carries the location-specific challenge. Selecting Graffiti sketch and shuffling preserves the location and sketch activity.
- A lab prompt was moved into the notebook, explicitly saved, restored after reload and cleared from the device.
- The named artwork dialog displays the TRANSMUTE composition and a transparent SVG download link; the photography dialog displays eleven source/author/licence entries.
- The shared reset clears place and route favorites plus study progress. Reload confirms saved count zero and study progress zero. Test notebook contents were removed.

## Privacy, provenance and limits

Geolocation runs only after a visitor request and computes nearest archive entries locally. It does not center an external tile map on user coordinates, save them or create a location history. Notes save only on explicit action. Audio stays in memory until download. Browser storage failures are reported as visit-only state rather than successful persistent saves.

Actual microphone sound/capture and an actual granted geolocation permission were not tested. No claim of hardware audio output or on-site accessibility is made. Coordinates are orientation points; accessibility is unknown unless the profile explicitly states verified information. Official visitor links remain authoritative for changing access conditions.

The Kybalion is identified as a modern 1908 Hermetic-inspired book, with its historical Gender terminology distinguished from identity or scientific claims. The eight gallery compositions rearrange original CAISIK archive artwork with new geometry; captions do not claim eight newly hand-lettered slogans. Location audio narration is optional and not added. Map tiles require network access; profiles and the discovery list remain available if tiles fail. Research and photo provenance are in `docs/HIDDEN-CITY-SOURCES.md` and `dist/assets/paris/credits.json`.

Independent code/security review and final gate evidence are under `.omo/evidence`. No raw temporary debug dumps were created by the root task; intentional verification receipts and screenshots are retained as evidence.
