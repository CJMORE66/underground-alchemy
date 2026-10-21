# Hidden City: Paris source and verification record

Prepared 21 October 2026. The parent research task checked the official sources below live and supplied the factual notes used in `dist/paris-locations.js`. Each profile separately labels documented history and original symbolic interpretation. Original prompts and analogies are not historical evidence.

| Profile | Official source | Important constraint |
| --- | --- | --- |
| Notre-Dame | https://boutique.notredamedeparis.fr/fr/content/18-les-vitraux-de-notre-dame-de-paris ; https://www.notredamedeparis.fr/visiter/reserver-gratuitement/ | Christian iconography; cathedral reservation is free, towers separate. |
| Sainte-Chapelle | https://www.sainte-chapelle.fr/en/discover/history-of-the-sainte-chapelle ; https://www.sainte-chapelle.fr/en/visit/practical-information | Ticketed, security and time-slot conditions. |
| Nicolas Flamel house | https://pop.culture.gouv.fr/notice/merimee/PA00086213 ; https://www.paris.fr/pages/une-balade-a-velo-a-la-decouverte-des-maisons-d-artistes-ca-vous-dit-26974 | Historical charitable house versus later alchemist legend; façade access only assumed. |
| July Column | https://www.colonne-de-juillet.fr/visiter/informations-pratiques | Commemorates 1830, not 1789; necropolis guided booking, upper column inaccessible. |
| Père-Lachaise | https://www.paris.fr/lieux/cimetiere-du-pere-lachaise-4080 ; https://www.paris.fr/pages/cimetiere-du-pere-lachaise-plus-de-200-ans-d-histoire-17482 | Active cemetery; hours and gate limitations apply. |
| Observatory | https://observatoiredeparis.psl.eu/le-meridien-de-paris-une.html ; https://observatoiredeparis.psl.eu/-visites-73-.html | Visits suspended during works; exterior only. Intended 135 Arago markers does not imply all survive. |
| Guimard, Porte Dauphine | https://www.ratp.fr/decouvrir/patrimoine/hector-guimard | Exterior viewing is not evidence of accessible station platforms. |
| Le M.U.R. | https://www.lemur.fr/ | Curated commissioned wall, not an open legal painting wall. |
| La Villette | https://www.lavillette.com/histoire-et-patrimoine/ ; https://www.lavillette.com/horaires-et-acces/ ; https://www.lavillette.com/accessibilite/ | Park versus separately ticketed venues. |
| La Place | https://laplace-paris.com/a-propos/ ; https://www.paris.fr/lieux/la-place-18289 | Programme, studio and workshop bookings vary. |
| Maison de Victor Hugo | https://www.maisonsvictorhugo.paris.fr/paris/votre-visite/informations-pratiques | Exceptional paid period 11 June–22 November 2026. |

All coordinates are orientation points, not surveyed accessible entrances. Accessibility remains explicitly unknown pending individual access checks. Route lines connect ordered stops and are not turn-by-turn walking directions. The extended frequency route is transit-assisted. Opening conditions can change after the checked date.

Photo provenance is stored in `dist/assets/paris/credits.json`, supplied by the asset task. Each profile displays its author, license, source link and note. Le M.U.R. uses an archival 2015 photograph and must not be mistaken for the present artwork.

Leaflet 1.9.4 is vendored from `https://unpkg.com/leaflet@1.9.4/dist/` with its license. OpenStreetMap supplies live tiles and is attributed in the map. Location permission is requested only by the Locate me button. Coordinates calculate nearest archive entries locally, with straight-line distances; the map is never recentered to the visitor and no user-position marker is created. Saved place and route IDs use the browser key `caisik-explorer-v1`; unavailable storage degrades to this-page memory with a visible status message. The root clear event receives a false persistence result if storage cannot be cleared.

## Focused verification

Invocation: `node tests/explorer.test.mjs` from the project root.

RED observed before implementation: exit 1, `ERR_MODULE_NOT_FOUND` for `dist/explorer.js`.

The next test run exposed the user-facing `pere lachaise` versus `Père-Lachaise` search mismatch. Normalization now removes accents and collapses punctuation.

GREEN observed: exit 0, `PASS: Paris search, filters, saved-data failures, routes, and 11 complete profiles`.

The assertions exercise nearest-entry geographic calculation, figure search, accent/punctuation search, no results, topic filtering, favorites-only filtering, unavailable storage, malformed JSON, invalid stored IDs, quota errors, three valid ordered routes and all eleven complete source-backed geographic profiles. The nearest-entry tests were separately observed RED with a missing export before implementation. This report records unit-level evidence; browser and visual verification are owned by the parent task.
