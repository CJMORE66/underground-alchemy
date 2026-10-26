# The Hidden City — map data and local renderer

Verified 26 October 2026. The Paris view uses actual OpenStreetMap geography through OpenFreeMap's unmodified OpenMapTiles schema. The CAISIK style is original black/yellow/bone cartography, inspired by the spatial exploration of the supplied Marseille reference. No Marseille map code, imagery, panorama or brand asset is imported.

## Files and build

- `dist/city-map.js` and `dist/city-map.css`: map experience, independently maintained from the data/style.
- `dist/map-data/caisik-style.json`: the single basemap source URL, glyph URL, attribution and visual layers.
- `dist/map-data/vendor-entry.mjs`: small bridge for this buildless application's lazy classic-script loader.
- `dist/map-data/build-vendor.mjs`: reproducible local vendor build.
- `dist/vendor/maplibre-gl.js`, `.css`, `-worker.mjs` and `-LICENSE.txt`: local distribution assets.

Install the lockfile dependencies with `npm ci`; run `npm run build:map-vendor` after a deliberate library upgrade. It rebuilds the browser bridge and validates the style against the installed official MapLibre style specification. The Node build script and bridge source are never imported by the website UI. They do not run in the user's browser.

`maplibre-gl` is pinned exactly to **6.16.0**, verified with the npm registry on the date above. Version 6 is ESM only. The local esbuild wrapper exposes `window.maplibregl` and configures the separately copied self-contained module worker. It sets two workers; it does not prewarm or load the renderer on the initial page screen. Runtime loading remains the experience module's responsibility.

The generated JS is approximately 1.11 MB uncompressed, the module worker 519 KB and the CSS 72 KB. These are separate from vector tiles. No whole-city dataset is packaged or requested up front. Source maps are not shipped. The MapLibre BSD 3-Clause license is included alongside the code.

## Source contract

The vector source ID is `openmaptiles`. Its URL is the provider's documented stable TileJSON endpoint:

`https://tiles.openfreemap.org/planet/latest`

OpenFreeMap documents that this always resolves to the latest deployed dataset. This is a live third-party dataset, not a versioned historical record. Provider outages or restrictions remain possible; the experience must offer the existing 2D fallback and readable place list.

The official Liberty style source was inspected through its public upstream repository at `hyperknot/openfreemap-styles`, path `styles/liberty/style.json`, on the verification date. It confirms source-layer `building`, heights `render_height` / `render_min_height`, and the `hide_3d` exclusion. The shell and web retrieval of the live Liberty JSON returned an environment access error; that is not evidence that the public map service is down. Live browser tile delivery is a separate release check.

The new style defines `caisik-buildings` as a `fill-extrusion` layer, starting at zoom 13. It excludes features bearing `hide_3d`, following the provider's own style. Height and base are numeric expressions using `render_height` and `render_min_height`. The runtime may multiply these expressions by a finite intro progress without replacing the source geometry.

**Height is an approximation.** The OpenMapTiles specification derives the heights from mapped levels or height tags. Missing values use a visibly disclosed illustrative 12 metre height and zero metre base. Neither mapped nor fallback extrusion is an architectural survey. No procedural building footprint, invented landmark model, secret tunnel or claimed entrance is generated. Actual place pins come from the existing verified atlas, independent of the basemap.

Roads use `transportation`; street names use `transportation_name`; water uses `water` / `waterway`, with names from `water_name`; neighbourhood labels use `place`. Labels retain the mapped proper names. No geocoding, directions or access rules are supplied by this basemap. A line connecting ordered expedition stops is not a walkable route.

## Network, privacy and licensing

Once the map is opened, OpenFreeMap receives normal network request metadata, including the visitor's IP address and the tiles/glyph ranges requested for the displayed area. Local MapLibre code does not require an account or API key. Geolocation must remain a separate explicit user action owned by the atlas. Notes, favourites and recordings are not sent to the tile provider.

The live source can return versioned tile URLs on `tiles.openfreemap.org`. Font glyphs use `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`, with the provider's Noto Sans Regular font stack. The style deliberately has no sprite, external raster or external JavaScript dependency. The old 2D fallback retains its separate OpenStreetMap tile requests and attribution. No bulk/offline tile download is implemented.

Keep the visible attribution: **OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors**, with working links. OpenStreetMap data is subject to its ODbL copyright terms; OpenMapTiles schema attribution is also required. This implementation does not claim ownership of the basemap or mapped data. MapLibre's code license is separate from map data and glyph licensing.

## Primary sources

- [OpenFreeMap quick start and custom-style instructions](https://openfreemap.org/quick_start/)
- [OpenFreeMap source, stable TileJSON endpoint](https://github.com/hyperknot/openfreemap#tile-versions)
- [Official Liberty source style](https://github.com/hyperknot/openfreemap-styles/blob/main/styles/liberty/style.json)
- [OpenMapTiles building schema](https://openmaptiles.org/docs/schema/#building)
- [OpenFreeMap attribution, public instance and licence information](https://openfreemap.org/)
- [OpenFreeMap privacy policy](https://openfreemap.org/privacy/)
- [OpenStreetMap copyright and ODbL](https://www.openstreetmap.org/copyright)
- [MapLibre v6 migration and local-worker requirements](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/)
- [MapLibre 6.16.0 source and BSD licence](https://github.com/maplibre/maplibre-gl-js/tree/v6.16.0)

## Validation and rollback

`npm run build:map-vendor` validates the actual authored JSON with `validateStyleMin`; the initial run returned **zero validation errors**. The runtime test and desktop/mobile/WebGL/fallback browser verification are documented separately by the integrating agent. Schema validation alone does not establish that tiles load, that WebGL is available, or that the experience looks correct.

The map data/style changes do not alter atlas place IDs, route membership, source citations or storage keys. Revert the map integration commit to restore the prior Leaflet experience. Do not clear user storage when rolling back. For a provider incident, the 2D switch and existing accessible place list should remain available without changing user data.
