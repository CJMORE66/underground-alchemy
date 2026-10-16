# CAISIK UNDERGROUND ALCHEMY

Cinematic redesign of the existing Sites storefront. This repository serves static HTML, CSS and ES modules from `dist`; commerce remains in the authoritative original store. No production catalog/order/payment data is written by this repository.

## Build

Use Node.js with npm. Install the exact dependencies in `package.json`, then run:

```sh
npm ci
npm run build:cinema
npm test
python tools/package-source.py
```

`dist/index.html` and every `dist/q/<slug>/index.html` are directly served files. After changing the main document, copy it to the 12 existing QR entry documents. The portal script switches only allowlisted QR paths. Collection landing documents live under `dist/collections`.

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
