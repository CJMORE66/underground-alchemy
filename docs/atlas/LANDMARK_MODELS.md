# Twelve original CAISIK landmark models

The atlas now has twelve distinct authored mesh models. These are illustrative three-dimensional studies, not imported CAD, photogrammetry, measured building surveys or documentary photographs. Existing place identities and coordinates remain authoritative; the geometry adds no claim of an exact entrance. Dimensions and most headings are artistic approximations. Notre-Dame's WNW facade / ESE apse is grounded in the cathedral's official plans.

## Architecture and motion

| Place | Recognizable mesh features | Distinct reveal sequence |
| --- | --- | --- |
| Notre-Dame | Latin-cross massing, three portals, twin open bell towers, rose tracery, pitched nave/transept roofs, eight pairs of flying buttresses, crossing spire | Plinth and aisles → nave/apse → facade → open bell towers → buttresses → rose/window details → spire |
| Sainte-Chapelle | Lower chapel, tall glass hall, repeated buttresses, western rose, steep roof, slender spire | Lower volume → glass hall → window tracery → roof/turrets → spire |
| Maison de Nicolas Flamel | Three-bay masonry street facade, three ground arches, inscription band, window sills and pitched roof | House → arches → windows → inscription rhythm → roof |
| Saint-Sulpice | Classical basilica, two unequal towers, two-level colonnade and three entries | Main volume → columns → entablatures → towers → bell openings → cornices |
| Père-Lachaise | Formal contextual gateway, twin pylons, winged hourglass motifs, railings and funerary chapels | Threshold → gate/piers → chapels → funerary details |
| République | Stepped plinth, pedestal, faceted Marianne with raised arm/branch, allegories, reliefs and lion | Steps → pedestal → lion/base → Marianne → branch/tablet |
| Abbesses | Open stair area, curved green iron supports, glazed canopy and repeated ribs | Stair → iron stems → canopy → ribs |
| Le M.U.R. Oberkampf | Wall panel on a street facade with original abstract graphic strokes | Facade → panel → drawn strokes → frame |
| La Place / Canopée context | Broad undulating yellow-glass canopy with side wings, columns and roof ribs | Columns → roof wings → ribs → glass edges |
| CENTQUATRE | Twin industrial halls, glass roofs, metal trusses and entry arches | Brick/entry → halls → trusses → glazing → ridge details |
| Philharmonie | Faceted mineral mass with layered wrapping bands | Base → facets → ribbon → surface details |
| Shakespeare and Company | Small masonry shop facade, glazed windows, green awning and book crates | Street volume → windows → awning → books |

Père-Lachaise is a place illustration, not a measured reconstruction at the atlas's Rue du Repos pin; the removed cross is not restored above its gateway. The Oberkampf graphic is original CAISIK artwork, not a claim about the currently exhibited mural. La Place is situated beneath the Canopée; the roof model is its surrounding context. Bookshop colors and exact frontage proportions are illustrative.

`src/city-landmarks/registry.js` is the only model registry: approximate heading/bounds, suggested close-focus zoom, duration and semantic phase order. Each model uses separate actual meshes. A finite 2.5–3.6 second progress sequence reveals the selected model's components; no building permanently rotates or runs an idle animation clock.

## Integration API

`dist/city-landmarks.js` is a lazy local ESM bundle built with `node tools/build-city-landmarks.mjs`. It contains the already-installed Three renderer and original geometry. There are no external mesh, texture, account or audio dependencies.

`mountCityLandmarks(map, maplibregl, {places,onReady,onError})` returns:

- `setPlaces(places, selectedId)` — synchronize the visible filtered place identities.
- `select(id, {animate:false})` — select a model, optionally reset its individual reveal, and return its registry metadata.
- `setMotionProgress(0..1)` — drive the selected model through semantic phases from the atlas's finite clock.
- `getState()` and `destroy()` — inspect readiness/failure and release geometry/material/renderer resources.

The MapLibre v6 custom layer uses `args.defaultProjectionData.mainMatrix`, a local Mercator anchor near Paris and metre-sized authored coordinates. MapLibre owns the camera, shared GL context and depth buffer. The layer resets renderer state before/after drawing, never clears the map canvas, never calls `forceContextLoss`, and never schedules its own repaint loop.

`getLandmarkExclusionFilter(places)` produces a valid MapLibre keep-filter for ordinary source buildings. It excludes tightly bounded building footprints plus the original building feature containing each of eight building place points. The two small street-front houses permit a four-metre margin. Gates, sculpture, the street-art wall and cemetery illustrations do not remove broad source-building areas. The root restores/updates this filter when the visible model set changes. Approximate pins can still differ from exact building entrances.

## Study without WebGL

`mountLandmarkStudy(host, {id,onReady,onError})` projects the same real Three meshes to SVG on the CPU. It returns `select`, `setMotionProgress`, `play`, `getState` and `destroy`. Dragging or arrow controls changes the camera; a range control studies construction progress. Explicit replay has a finite clock and respects reduced motion, global pause, document visibility and closed dialogs. It is a geometric study fallback, not a screenshot of a rendered GPU map.

`docs/qa/landmark-models-cpu.png` is a contact sheet of all twelve actual mesh models rendered with Three's SVGRenderer and converted to PNG. It verifies model silhouettes, not WebGL support or alignment within the live basemap. Each mesh was inspected; all twelve identities are visually distinct. The cathedral includes open tower voids and actual flying-buttress geometry. Renderer colors and lighting can differ slightly between CPU SVG and the GPU map.

## Tests and sources

`node tests/city-landmarks.mjs` checks all twelve identities, distinct builders, semantic architecture, finite vertices, bounded world-scale dimensions, geographic exclusion/filter validity against the installed official MapLibre style specification, and local east/north coordinate signs. It also constructs the real SVG viewer, verifies projected face paths, switches model, studies progress, stops the only scheduled frame on motion pause and removes the viewer on destroy. The lazy bundle remains below 800 KB uncompressed.

Architecture sources and model limitations are listed with primary operator URLs in `LANDMARK_RELEASE_QA.md`. Map renderer references:

- https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CustomRenderMethodInput/
- https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/
- https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/

No external building-model license is implied because these meshes were authored here. Retain MapLibre/Three distribution licences and the basemap attribution. Rollback the model integration while retaining source photographs, existing place data and user storage; do not clear notebooks or reset routes.
