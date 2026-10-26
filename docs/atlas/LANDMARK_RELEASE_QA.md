# CAISIK place illustrations and landmark models — release QA

Verification date: 26 October 2026.

This report distinguishes automated integration checks, visual inspection of generated assets, and actual browser/GPU testing. A mocked renderer does not establish that Three.js geometry renders correctly in the real MapLibre WebGL context.

## Status

- Automated place-visual integration: **PASS**, `node tests/place-visuals-integration.mjs`.
- Original model geometry: **PASS**, `node tests/city-landmarks.mjs`; twelve distinct bounded meshes and independent semantic phase timelines. This is not GPU pixel verification.
- Illustration motion: **PASS**, `node tests/place-art-motion.mjs`; native replay/pointer interaction, finite rendering, reduced motion, visibility and cleanup.
- Actual desktop/mobile browser rendering, GPU placement, camera visibility and missing-resource UI: root verification required.
- No physical-phone GPU, microphone or geolocation permission is implied by Node tests.

The intended integration preserves the existing twelve place identities, geographic coordinates, three source-ordered routes, historical evidence, source links, notes and bookmark storage. Contemporary CAISIK illustrations are the default artwork. Documentary photographs remain explicitly identified with their original credit, licence and historical caption. Missing illustrations must leave a readable labelled fallback and functioning profile/actions.

## Automated integration evidence

The new integration test boots the actual `dist/atlas.js` against a DOM fixture, with only the map renderer and unrelated module dependencies replaced. It verifies:

- Twelve distinct, genuine WebP files; actual encoded dimensions match the manifest and every retained generation prompt's SHA-256 matches the shipped image.
- All twelve places show their own labelled CAISIK artwork by default. Documentary photographs appear only in explicitly expandable source details, retaining the original source/licence links, author credit and archival caption.
- Original profile actions, exact addresses, historical evidence, source links, observations, bookmark handlers and all three ordered route hooks survive. Legacy expedition/selfmade storage is untouched.
- Missing or hostile illustration manifests do not break the atlas. A failed artwork is removed and replaced by labelled source material; the discovery action remains usable.
- All thirteen atlas HTML routes retain their map target and link the illustration-motion assets exactly once.

The test also executes the actual `dist/city-map.js`, injecting only a fake GL map and the documented `landmarksLoader` seam. It confirms no model import before viewport/map-style readiness, one mount into the existing map, all twelve real place identities, selected-model camera focus, filtering, finite replay ending at progress 1, live reduced motion, reversible 2D/3D, extrusion-filter restoration on context loss, and safe late-import/import-failure cleanup.

These checks intentionally do not assert that a mock's `render()` call proves architectural resemblance, correct lighting, real GPU depth or camera visibility.

## Asset inspection

The first four actual delivered WebPs were independently opened for visual review: Notre-Dame, Sainte-Chapelle, Flamel house and Saint-Sulpice. They use consistent strong yellow/black architectural illustration with restrained crimson and no embedded UI text. Generated proportions and ornament remain artistic interpretations, especially Flamel's decorative façade. The illustration producer retained individual visual-review notes for the remaining assets in `PLACE_ILLUSTRATION_PROMPTS.json`.

## Primary-source visual reference

The following details guide original illustrative geometry and artwork. These sources do not establish a surveyed mesh, verified entrance pin or precise model rotation.

| Atlas ID | Actual object and distinguishing features | Primary source |
| --- | --- | --- |
| `notre-dame` | Cathedral with Latin-cross plan, WNW-facing principal façade and ESE apse; twin square towers, three portals, rose, long pitched roof, transept and spire. Towers are 69 m. | [Cathedral plans](https://www.notredamedeparis.fr/en/understand/architecture/plans/), [west façade](https://www.notredamedeparis.fr/en/understand/architecture/the-western-facade/) |
| `sainte-chapelle` | Slender palace chapel: lower and upper chapels, fifteen tall window bays, western rose and slender spire. It does not have Notre-Dame's paired towers. | [CMN history](https://www.sainte-chapelle.fr/en/discover/history-of-the-sainte-chapelle), [closer look](https://www.sainte-chapelle.fr/en/discover/a-closer-look-at-the-sainte-chapelle) |
| `flamel-house` | Modest attached urban stone house at 51 rue de Montmorency; inscription band, decorated piers, mullioned windows and cornice. | [Ministry record](https://pop.culture.gouv.fr/notice/merimee/PA00086213), [City description](https://www.paris.fr/pages/une-balade-a-velo-a-la-decouverte-des-maisons-d-artistes-ca-vous-dit-26974), [museum façade record](https://www.parismuseescollections.paris.fr/en/node/158661) |
| `saint-sulpice` | Broad classical arcaded façade, unequal towers and long church body; not a Gothic twin of Notre-Dame. Foundation gives approximately 120 m length, 57 m width and 30 m vault height. | [Restoration foundation](https://www.fondationavenirpatrimoineparis.fr/nos-chantiers/sauvegarde-eglise-saint-sulpice/), [parish](https://www.paroissesaintsulpice.paris/art-et-architecture/) |
| `pere-lachaise` | Cemetery entrance and landscape, not a single church: semicircular main-entry arrangement, two tall pylons, winged-hourglass/torch ornaments, walls, trees and chapel context. | [City before/after](https://www.paris.fr/pages/le-cimetiere-du-pere-lachaise-comparez-les-avant-apres-17914), [district restoration](https://mairie11.paris.fr/pages/travaux-restauration-de-la-porte-principale-du-cimetiere-du-pere-lachaise-15572) |
| `republique` | Monument: Marianne above a tall stone pedestal, three allegorical base figures and relief band. City gives 15.5 m pedestal plus 9.5 m bronze figure. | [City history](https://www.paris.fr/pages/1-lieu-3-histoires-la-place-de-la-republique-33595) |
| `abbesses` | Small covered metro entrance: open stair access, curved Art Nouveau ironwork and projecting glass canopy. It is not a freestanding station building. | [RATP station history](https://www.ratp.fr/decouvrir/patrimoine/histoire-station-abbesses), [Guimard](https://www.ratp.fr/decouvrir/patrimoine/hector-guimard) |
| `mur-oberkampf` | A curated 3 × 8 m mural panel on a street-corner wall. The depicted CAISIK painting is an original interpretation, not the currently exhibited mural. | [Operator](https://www.lemur.fr/lasso/) |
| `la-place` | Venue beneath La Canopée: broad undulating roof, repeated ribs, golden-yellow glass, side wings and sheltered open space. The canopy is the venue's architectural context. | [Venue](https://laplace-paris.com/a-propos/), [glass designer](https://www.atelierbarrois.com/en/projects/the-canopy-forum-des-halles) |
| `centquatre` | Reused industrial hall complex: two large halls, glazed roofs, structural repetition, intervening courtyards and enclosing street façades. No invented factory chimneys. | [Operator](https://www.104.fr/projet-du-lieu), [City inspection report](https://cdn.paris.fr/paris/2020/08/14/59149cbf15dd0973f6f5ff5fe862a660.pdf) |
| `philharmonie` | Mineral hill-like mass, angular outer planes, sweeping aluminium bands and bird-patterned surface. Operator gives 52 m overall height. | [Philharmonie architecture](https://philharmoniedeparis.fr/fr/decouvrir/philharmonie) |
| `shakespeare-company` | Bookshop in an old masonry street-front building at 37 rue de la Bûcherie. Glazed storefront, upper windows and book displays are simplified illustrative composition choices; exact present frontage dimensions/colours were not established by operator text. | [Bookshop history](https://www.shakespeareandcompany.com/history), [official frontage image](https://www.shakespeareandcompany.com/media/general/_1340x804_crop_center-center_none/1192409/IMG_6314.jpg) |

## Research limitations and corrections

- Notre-Dame's indexed official pages disagree on façade width: 41 m versus 43.5 m. No precise façade-width claim should be published. Direct retrieval returned 403; official indexed results supplied the orientation and tower figures.
- Flamel's museum description records a photograph made in 1916. Historic business signage is not evidence of the current façade.
- The Père-Lachaise main-gate cross was removed in 1883, according to the City. Do not reproduce it as a current entrance feature. The district describes an entry over 6 m tall and approximately 40 m long, arranged as a semicircle.
- The association between the approximate Père-Lachaise atlas pin and the principal entrance is a modelling inference, not a verified entrance survey. Existing coordinates are retained.
- Exact rotations for the other eleven places were not independently established. They are illustrative implementation choices.
- These sources verify architectural identity/features. Their images and third-party meshes were not copied into the project by this research task.

## Renderer API reference

The current MapLibre `CustomRenderMethodInput` documentation explicitly supports `args.defaultProjectionData.mainMatrix` for simple Mercator custom layers. `MercatorCoordinate.fromLngLat` converts geographic positions; `renderingMode: '3d'` uses a conformal height coordinate.

- [CustomRenderMethodInput](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CustomRenderMethodInput/)
- [CustomLayerInterface](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)
- [Current official Three.js example](https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/)

The older standalone Three.js, shadow and terrain example URLs returned 404 during this verification. Source/API checks do not replace a real shared-context rendering check.

## Actual managed-browser checks — 26 October 2026

- The original Notre-Dame profile opens with the new saturated CAISIK illustration and `filter: none`. The documentary source is closed initially and retains its original archive caption and credits.
- Notre-Dame artwork animates 13 traced architectural paths and three independently transformed painted regions; observed native rotations differ per rose/ornamental part. Philharmonie uses its separate 18-path facet/bird/ribbon sequence, rather than the same motion. Native replay works.
- Actual model-study SVG projection renders approximately 2,980 face paths for Notre-Dame. Orbit changes the projected path data; replay starts at progress 0/first construction phase and finishes at 100/complete model, then stops. Closing empties its study host. This is a rendered projection of the same real mesh geometry as the custom map layer, not a GPU-map screenshot.
- Corrected actual visual findings: reduced overexposed lighting (including Three SVGRenderer ignoring AmbientLight intensity), warmer bone surfaces, full-mesh framing, smaller desktop stage so controls remain visible, yellow native slider accent.
- At phone iframe widths 390 and 320 px, illustration/profile and model dialogs have matching scrollWidth/clientWidth (348/348 and 282/282). All replay/orbit controls remain accessible. Short 844×390 landscape model dialog has no horizontal overflow (774/774); its contents remain natively scrollable.
- Global Pause Motion leaves the artwork static and model replay at complete progress 100. Native model orbit remains available. No microphone or geolocation permission was requested.
- Actual screenshots: `../qa/landmark-art-desktop.jpg`, `../qa/landmark-model-desktop.jpg`, `../qa/landmark-art-mobile.jpg`. The CPU model contact sheet independently documents all twelve distinct geometries.

### Verification limit

The managed Chrome browser reports no WebGL 2, so the **new custom map mesh layer has not been visually GPU-verified in this environment**. Its native MapLibre integration, geographic transforms, extrusion exclusions, selection/animation clock and lifecycle are exercised by executable integration tests; the actual geometries, animation and interaction were rendered and checked through the bundled CPU/SVG study viewer. The original geographic map still has its existing 2D fallback. Do not describe these SVG screenshots or mocked map tests as successful GPU-map rendering. Physical-phone GPU performance remains untested.
