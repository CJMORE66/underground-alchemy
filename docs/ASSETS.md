# Scene asset inventory

| Asset | Bytes | Purpose |
|---|---:|---|
| `assets/caisik-graffiti.webp` | 450,536 | Original graffiti derivative; hero poster and extruded cap texture |
| `assets/alchemy-passage.webp` | 211,984 | Original city atmosphere derivative; multi-layer fallback |
| `assets/emblem-contours.json` | 17,860 | 11 traced alpha contours / 1195 vertices; sculptural extrusion |
| `assets/catalog/printful-18912189-482104768.png` | 240,171 | Authentic OMERTA store/Printful preview; source garment plane |
| `cinematic-v7.js` | 14,655 | Classic story/controller entry; no eager Three.js |
| `film-scene-v7.js` | 6,725 | Lazy 3D scene entry |
| `motion-source.js` | 9,595 | Lazy existing conceptual forge/exhibits |
| `chunks/experience-DM22MDVD.js` | 578,720 | Shared runtime dependency |

Eight local WOFF2 font subsets total 166,080 bytes, with both OFL licenses in `assets/fonts`. Twenty locally copied catalog previews remain available. Original PNG artwork and three illustrative collection SVGs remain available for the preserved editorial features. Twelve real QR matrices and twelve print sticker SVGs remain unchanged.

No GLB/garment scan, video sequence or fabric simulation has been invented. The graffiti extrusion is an artistic sculpture; the product plane is an authentic product preview. Geometry uses built-in Three.js primitives, deterministic emblem fragments, fog and an additive lighting approximation.

Each current source asset can be inspected in the downloadable source archive. Build dependencies and exact versions are in package-lock.json.
