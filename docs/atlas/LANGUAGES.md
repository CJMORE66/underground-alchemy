# CZ / EN / FR — reading and language practice

The existing approved CAISIK identity stays intact. `dist/languages.js` is a classic defer enhancement; `dist/languages.css` provides a compact bottom-left dock, inline controls in native application dialogs, and a dedicated practice dialog. The same script can be wired once to all existing route entrypoints. Prefer loading it before `text-motion.js` where practical; it also handles headings/actions already wrapped by that runtime.

## Dictionary contract

Serve `/i18n/cs.json`, `/i18n/en.json` and `/i18n/fr.json` as flat objects mapping canonical source text to plain-string translations. `{ "messages": { ... } }` is also accepted. Keys are normalized by collapsing whitespace and trimming ends. Initial source text may be Czech or English. Place names, addresses, source URLs, artwork lettering, note values and identifiers stay authoritative. Do not add HTML to dictionary values.

Numeric templates use indexed placeholders: `{0} / {1} DISCOVERIES` can map to `{0} / {1} OBJEVŮ`. Captured digit strings retain leading zeroes. Existing node records and reverse indexes recover canonical text across repeated switches; translated numeric templates have a bounded reverse matcher. Canonical lookup uses indexed Maps rather than scanning the whole dictionary for every node.

Only the selected locale loads at startup. An explicit language switch loads its locale. Context comparison may load the chosen learning locale after the user requests comparison. No automatic translation service is called. Unmatched content remains in its source language. The dock warns about missing public prose: sentence-like text of at least five words in paragraphs, list entries, definitions, quotations and designated interpretation containers. Names, addresses, source captions and status readouts remain diagnostic entries without a misleading page-wide warning. Missing parent aggregates containing line breaks do not count when their child fragments translate. This heuristic is not a claim of complete editorial coverage; `getMissing()` retains unmatched strings for review and `getState().untranslatedProse` reports the warning count. Dynamic coverage updates cannot erase a real fetch or storage error.

## Public API and integration

`window.CaisikI18n` exposes:

- `ready`: a promise for the initial locale load.
- `t(source, language?)`: synchronous exact/template lookup from cached local dictionaries; returns the source when unavailable.
- `setLanguage('cs'|'en'|'fr')`: asynchronous switch with stale-request protection.
- `getLanguage()`, `getState()`, `getMissing()`.
- `rescan(scope?)`: translate an optional newly rendered DOM subtree.
- `openLearning()`, `compareSelection()`, `destroy()`.

A successful switch dispatches `caisik:languagechange` with `detail.language`. Global `html.lang` follows the chosen interface language. Translated text containers receive the active language; unmatched simple containers retain their original language metadata. Mixed fragments preserve individual links/icons and their controls. English artwork words and deliberately retained brand titles are not rewritten inside raster/SVG imagery.

The mutation observer catches new profiles, tabs, task copy, status labels and relevant attributes. It ignores SVG/canvas and every language utility it owns. WeakMap source/last-render records make repeated scans idempotent. Kinetic text wrappers are flattened only when an actual known translation changes their content; the existing text-motion runtime is rescanned afterward. Native buttons, links, form controls, textarea values and their event listeners retain their DOM identities.

## Learning while reading

The ↔ control enables **Učit se při čtení / Learn while reading / Apprendre en lisant**. The user selects a sentence in public main/profile content and then presses **Srovnat vybraný text**. The comparison shows the selected source and a locally supplied target translation together, with language attributes and optional local pronunciation. It requires a matching local dictionary entry; no substitute or speculative translation is fabricated.

Selections from inputs, textareas, editable regions, notebook notes, journal artifacts, aliases, lyric previews and other marked user-content containers are rejected. A range crossing those containers is rejected before reading its string. Selection text stays in page memory and is never uploaded or persisted. Integrators should mark every new user-generated readout with `data-i18n-user` or `translate="no"`.

## Practice cards and pronunciation

`dist/language-lessons.json` contains forty original practical cards, each in Czech, English and French. Topics: navigating the city, asking for graffiti permission, preparing a recording session, freestyle, and philosophical dialogue. These are language examples, not claims of access, bookings, permissions or historical facts.

Users can reveal translations, type a recall attempt, compare the supplied wording, select another target language, save a phrase and mark it as practised. The comparison is exact normalized wording with a separate accent-insensitive hint; alternate valid translations are explicitly not automatically judged. There are no AI quality percentages or artistic scores.

Speech starts only on the user's pronunciation button. The selected voice must have `localService === true` and match the requested language. Remote-only voices are refused with readable feedback. The `voiceschanged` event is observed; no microphone, speech recognition, audio upload or autoplay is introduced. Close, page hiding and teardown stop speech.

## Storage, export and fallback

Interface preference uses only `caisik-language-v1`. Practice uses only `caisik-language-learning-v1`. Existing atlas, expedition and Selfmade notes are not modified. Failed writes remain visible; practice is retained in memory and can be exported as JSON. Malformed stored practice is retained for recovery and included in an explicit export rather than overwritten silently. Deleting practice requires a separate local confirmation and removes only the language-practice key.

A failed locale fetch preserves readable current content and permits retry. A failed card fetch leaves the site language controls available. Missing local speech voices leave full text readable. Native page scrolling and the original reduced-motion behavior are unchanged; the language layer itself has no animation clock.

## Verification

`node tests/languages.mjs` runs the real runtime in a DOM/VM harness. It covers three-language persistence, lazy fetches, numeric templates and reverse recovery, dynamic and kinetic text, preserved icons/buttons/links/user drafts, native-dialog controls, stale locale requests, offline/storage failures, forty three-language cards, recall, local-only speech, progress export and explicit reset, reading comparisons and private/cross-field selection rejection, and lifecycle cleanup.

Rendered browser layout, actual platform speech voice availability, physical-device selection gestures and editorial coverage of the final locale catalogues remain separate checks for the release owner. A dictionary or test count alone does not prove that every sentence has been translated or that a pronunciation voice exists on a particular phone.

Relevant primary platform documentation:

- [W3C: language declarations](https://www.w3.org/International/questions/qa-html-language-declarations.en)
- [MDN: SpeechSynthesisVoice.localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
- [MDN: voiceschanged](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event)
