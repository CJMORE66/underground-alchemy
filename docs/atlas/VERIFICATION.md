# Approved graphic-novel release verification

Restored atlas baseline: e159616e564d8bb5904c5af55f58fdc91afe8db3 (version 13), on top of preserved version 14 history.

- 100 full-size regenerated artworks and 100 thumbnails decoded; actual dimensions and alpha recorded in GRAPHIC-ASSETS.json. 99 assets contain transparent areas; the approved TRANSMUTE scene has an opaque composed background.
- Actual generation prompts synchronized to dist/art/prompts.json. The approved reference and written style direction are retained.
- npm test passed: 12 researched locations, 3 ordered routes, 7 principles, 8 curated themes, 100 artworks, local assets, DOM IDs and JavaScript syntax.
- Locations, principle content and the frequency/recording module are byte-identical to version 13. Separate read-only reviews found no material source regressions or broken active graphic references.
- Desktop browser QA at 1363×936: hero loaded without horizontal overflow; pointer movement changed artwork transform; principle tabs switched to the correct new artwork; map empty-search reset and profile sources worked; freestyle format and silent pulse start/stop worked; Living Wall modal and 100-work gallery filters worked; PNG export produced a downloadable blob; checkerboard preview state worked. No application-origin console errors observed.
- Twelve sticker SVGs and ZIP verified. QR fragments exactly match version 13, including geometry, size and placement; hashes recorded in STICKER-INTEGRITY.json. Browser-rendered sticker checked.
- Physical mobile, microphone hardware capture, geolocation permission grant, device narration and physical print scans were not exercised. Responsive and permission fallbacks remain from the restored atlas.
- Optional legacy bundle rebuilding was unavailable because local esbuild dependencies are not installed. This release serves the checked-in dist output directly; corresponding source and served asset-reference/color edits were applied together.

Preview evidence: preview-home.jpg.
