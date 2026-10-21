# CAISIK UNDERGROUND ALCHEMY

Cultural atlas and creative learning experience for the existing public CAISIK Site. The homepage now contains the source-backed Paris explorer, seven philosophical studies, a local freestyle recorder, eight original archive compositions and optional browser-local fieldnotes. The repository serves static HTML, CSS and ES modules from `dist`; commerce remains in the original store.

## Build

Use Node.js with npm. Install the exact dependencies in `package.json`, then run:

```sh
npm ci
npm run build:atlas
npm test
python tools/package-source.py
```

`src/atlas.html` builds to `dist/index.html`; `dist/atlas.js` and `dist/explorer.js` are the homepage entry modules. The twelve `dist/q/<slug>/index.html` documents intentionally retain their original exhibits, with updated portal links into the new atlas. Do not overwrite them with the atlas homepage. Collection documents and the complete `/art/` blackbook remain served. Leaflet is vendored locally; the map requests OpenStreetMap tiles and displays attribution. Discovery filtering and profiles continue to work without map tiles.

`node tools/fetch-paris-assets.mjs` refreshes the explicitly selected Commons photographs and their declared author/license metadata. This is not required for ordinary builds; the photographs and credits are tracked in `dist/assets/paris`. Access research was checked on 21 October 2026; each profile links to official current visitor information. Coordinates are orientation points, not surveyed accessible entrances.

The WebGL code is split into a small entry, lazy scene and shared Three.js chunk. `advanced-loader-v7.js` loads the original optional forge/exhibits on demand. Local fonts, WebP city/logo derivatives and original product previews are included. Original source assets remain available.

## Implementation and evidence

- [Storyboard and scene graph](docs/STORYBOARD.md)
- [Commerce source, variants and checkout evidence](docs/COMMERCE.md)
- [Educational modules](docs/EDUCATION.md)
- [QR experiences and consent](docs/QR-PORTALS.md)
- [Responsive configurations](docs/RESPONSIVE.md)
- [Asset inventory](docs/ASSETS.md)
- [Test results and unverified requirements](docs/VERIFICATION.md)

The live site has a performance disclosure showing local Web Vitals measurements for the current visit. No measurement is transmitted. It does not replace throttled mobile lab tests or real-user field data.

## Limits

The public source exposes 20 products / 86 variants. The accessible Magento GraphQL catalog returns zero products; therefore this release does not claim a working Magento cart integration. Source-backed variant links open the original store, where current stock, tax, shipping, payment and final totals are authoritative. Payment capture, fulfillment and Printful order delivery have not been tested.

Mobile/reduced-motion fallbacks are implemented. This environment has no usable GPU and no mobile viewport/device capability; desktop WebGL visual quality, 60 FPS, representative mobile Core Web Vitals and full cross-device approval remain release checks. No fabricated urgency or inventory quantities are added.
