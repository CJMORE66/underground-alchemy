# Map buildings and authored studies

The geographic atlas defaults to **MAPOVÉ BUDOVY**. Building geometry comes from the actual OpenStreetMap/OpenMapTiles building layer served by OpenFreeMap. A venue pin does not prove the shape or entrance of a building under it. The selected place panel retains the real name, address and supplied coordinate-status description.

Map data can be incomplete or out of date. Dataset `render_height` values may themselves be estimates. Where a feature has no numeric height, the site leaves the footprint flat instead of assigning a fabricated 12 m extrusion. The source footprint fill stays visible. This is a geographic map, not a measured or current-condition building survey.

## Explicit authored mode

The native **AUTORSKÉ MODELY** button selects the twelve contemporary CAISIK model studies. Proportions, bearings and anchor positions are approximate. The separate model-study viewer remains available through profiles. This button never claims a detailed model exists for every additional venue or studio.

The model bundle is not imported at default map readiness. It loads only after explicit selection of authored mode. The wrapper exposes `data-city-building-mode="map"` or `"artwork"`; the two native buttons expose `aria-pressed` states in a labelled group.

Only an active authored adapter may apply geographic extrusion exclusions. Returning to MAPOVÉ BUDOVY destroys the custom layer, cancels its finite reveal RAF, clears focus metadata and restores the exact previous filters on affected base-building layers. Default source geometry is never suppressed simply because an optional model bundle exists.

A monotonic import epoch rejects stale opt-in results after switching off, selecting again, losing WebGL, or destroying the map. An unavailable authored layer leaves the native map working with a visible message. A late import resolving in 2D does not mount a hidden custom layer; returning to 3D can request the optional module again through the normal cached import path.

Motion remains finite. Native page scrolling is not intercepted. Explicit Ctrl-wheel zoom, drag and native camera controls remain. Reduced-motion, field/simple/quiet mode, hidden-document and viewport rules retain their behaviour.

## Content contract

A coordinate record distinguishes official linked points, geocoded address points, approximate building centres and unknown positions. `null` remains absent. An address geocode is not a building centroid, surveyed model anchor, accessible entrance or confirmation that the business occupies every floor below it.

The map does not automatically label the nearest rendered footprint as a verified venue building. It shows geographic source geometry and the researched address point independently.

## Verification

- `node tests/city-map.mjs`: geographic validation, source building layer, zero missing-height fallback, native wheel, stable pins, route gaps, 2D/3D, finite motion, reduced-motion, BFCache and cleanup.
- `node tests/city-map-identity.mjs`: no default model import, explicit opt-in, exact filter restoration, repeated opt-in, unsupported places, failed bundles, import races/destroy safety, safe identity labels, and installed official MapLibre style-schema validation.

Node tests use the real wrapper and an instrumented MapLibre mock. They do not prove actual GPU rendering, monument-to-footprint alignment, current business occupancy, physical-phone performance or current public entrances. Separate browser/device review is required for those claims.

Source and attribution definitions remain in `dist/map-data/caisik-style.json`. Official references: [OpenFreeMap tile versions](https://github.com/hyperknot/openfreemap#tile-versions), [OpenMapTiles building schema](https://openmaptiles.org/schema/#building), [MapLibre style specification](https://maplibre.org/maplibre-style-spec/).
