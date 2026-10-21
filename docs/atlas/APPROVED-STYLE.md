# CAISIK — approved graphic direction

Approved by Caisik on 21 October 2026 after two visual review rounds. This is the active art direction for all website-created graphics. The previous desaturated pop-art preview was rejected as too faded; the chrome, lime and purple rendering was also rejected.

## Ground truth

`dist/assets/style-reference/approved-caisik-graphic-novel.png` is the approved reference. It combines TRANSMUTE lettering, an original hooded urban alchemist, architectural space and coherent alchemical symbols. Reuse its rendering language without repeating its character in every illustration.

## Visual language

- Electric saturated yellow (#FFD600 to #FFCC00), deep neutral black (#080808), sharp neutral white highlights; restrained crimson (#E71932) accents.
- Mature urban graphic-novel rendering: confident black ink contours, angular cel-shaded planes, dramatic perspective, solid dense color and strong figure/background separation.
- Original complex wildstyle lettering: a readable structural skeleton, interlocking extensions, strong depth, precise edge highlights and controlled drips.
- Alchemical geometry, the eye, ouroboros, sun/moon and city/music motifs belong to deliberate connected compositions.
- No chrome/metallic sculpture look, acid-green/purple scheme, pastel/desaturated ink, vintage sepia, random grain, gray wash or global fog.
- Reusable artwork is individually generated; one asset per image. Transparent surrounding areas preferred. Never recolor the old artworks as a substitute for regeneration.

## Website application

Preserve the verified cultural atlas, sources, legal-access labels, local notes and recording behavior from version 13 (source e159616e564d8bb5904c5af55f58fdc91afe8db3). Version 14 changed the page structure in a concurrent session; Caisik explicitly requested its reversal. Restore through a new source commit; never rewrite Git history.

Use dark comic panels, bright graphic borders, bold condensed UI display headings, original illustrated brand lettering and vivid yellow interaction states. Keep historical photographs documentary and captioned; do not stylize them into false historical evidence. Actual merchandise photographs remain faithful product references.

## Motion

Hover and keyboard focus may lift a panel, tilt an artwork gently, offset a crimson shadow layer, reveal geometric accents or rotate a separate decorative ring. Pointer parallax is restrained and uses requestAnimationFrame; touch uses static or press feedback. Honor both prefers-reduced-motion and the site's Pause Motion control. No flashing, autoplay sound or motion that obscures controls.

### Living main hero

The seated-alchemist homepage scene is animated as separately generated layers: `dist/assets/alchemy-motion/hero-clean.webp`, `sun.webp` and `moon.webp`. `dist/alchemy-hero.svg` is the shared 1536 × 1024 scene and occlusion masks; `alchemy-hero.js` owns its elapsed clock and eye interaction. Keep the painted layers in one frame on every breakpoint. Never move the background independently of its celestial sprites or face patches. The approved `hero-v2.webp` remains the exact static poster and social image. Generation prompts and asset hashes are recorded in `hero-motion/ASSETS.json`.

The active motion direction now combines a 26-second celestial orbit, counter-rotating engraved halos, interior torso breathing, flowing crimson ribbons, a pulsing pendant, 22 rising embers, an awakening wave, awakened/blinking eyes, vinyl glints and water ripples. Keep breathing inside a feathered stationary mask so the figure silhouette and face stay anchored. Preserve the left copy area. The drawing remains silent. Global Pause Motion, live reduced-motion preference, simple mode, hidden tabs and offscreen state control the animation lifecycle.

### Living signature

The approved new CAISIK logo is `dist/assets/logo/caisik-signature-approved.png` (1942 × 809 RGBA). Preserve this exact source, saturated yellow faces, black engraved contours, crimson cutbacks, the eye in the A, and the UNDERGROUND ALCHEMY subtitle. `caisik-signature.webp` is the delivery image; `caisik-signature.svg` adds native motion geometry while reusing the raster paint. This is not a fully vector-traced or independently redrawn alphabet.

`tools/build-logo-scene.py` authors six conservative shared motion regions through dark letter channels. Interlocking letters have no recoverable hidden strokes in the flat original: keep relative movement within four source pixels and 0.1 degrees. At rest the lettering composition stays aligned. The eye uses a native aperture, lid, sclera and the original engraved iris. Light, rings, outline accents and eight sparks are native SVG shapes. The scene viewBox includes 28 source pixels of transparent safety padding.

`dist/caisik-logo.js` uses a shared SVG/image loader, unique instance IDs and a single animation clock. Intro: 1.1 seconds. Eye opening: 220 ms. Pointer/focus sweep: 650 ms. Click/tap energy: 800 ms. Native home navigation remains available on brand links. `/logo/` is the large interactive signature view with replay, PNG download and the shared motion preference.

Use the new mark on the atlas, lesson routes, archive branding and blackbook masthead. Artwork 001 remains a historical gallery composition. Honor reduced motion, Pause Motion, simple mode, hidden tabs, offscreen state and failed-load fallback. Use static approved artwork when motion is disabled. No audio or permission requests.

### Living principles and letterworks

All seven principle paintings and all eight Living Wall placements now use native SVG scenes. Vibration is shared between the principle lesson and Frequency of the Underground, making 14 distinct scenes for 15 placements. Exact approved source WebPs remain the fallback and download artwork; no source raster was regenerated or recolored. `dist/assets/art-motion/scenes.json` records dimensions, motion summaries and SHA-256 hashes of each original and scene.

Motion follows observed details: Mentalism's eye, mirrored stair lights, opposing tuning-fork tines, crescent surfaces, the actual painted pendulum, a phased sequence through dominoes, and organic/geometric breathing. Letterworks use traced letter faces, original engraved irises, mask cracks, architectural windows, vinyl glints and reflection lines. Rotation is confined to circular interiors; unrecovered silhouette boundaries use small bounded motion. Do not describe these flattened sources as fully reconstructed 3D or recovered vector glyphs.

`tools/build-principle-scenes.py` and `tools/build-wall-scenes.py` author the scenes. `tools/build-art-scenes.py` regenerates both groups and validates the combined scene index. `dist/art-motion.js` shares loads and a single clock between visible hosts, isolates SVG references, and cleans up scenes when lesson tabs or artwork details change. The enclosing native buttons keep their labels and existing opening/navigation behavior. Full-size artwork details provide replay and click/tap activation.

Respect the atlas motion preference, live reduced-motion preference, simple mode, visibility and page lifecycle. Pause paintings behind an open artwork dialog. The exact static image remains available until a scene loads and whenever animation is disabled. Keep every experience silent; sound demonstrations retain their explicit user controls.

### Principles as visible stories

The current principle direction replaces subtle ornament with explicit, repeating transformations. Mentalism begins in a genuinely empty black field, grows a thought into drawn geometry, builds the faceted head and nine towers as separate painted parts, connects celestial anchors, holds the complete living world, and returns to black in a 24-second cycle. This remains a contemporary philosophical illustration; the educational disclosure remains present.

Rhythm uses a restored stationary frame (`rhythm-frame-clean.png`) and the original rod, faceted bob and finial clipped as one rigid object. A constant registration aligns the old source pivot to the restored suspension loop; the entire pendulum moves through a 46-degree arc. The empty clean plate removes the stationary duplicate. The original approved image remains the static fallback and gallery download. The background edit's prompt and hash are recorded in `rhythm-frame-provenance.json`.

Each principle now has a story duration and meaningful phase labels. A progress slider allows close study: moving it holds the selected frame. Play resumes that artwork; Replay begins its story again. All controls retain the global motion/reduced-motion override. No decorative pulse substitutes for the actual principle: waves propagate, halves mirror/exchange, a falling domino triggers its neighbour, and received inputs become a creative form.

`tools/build-mentalism-story.py` and `tools/build-rhythm-story.py` author the two flagship sequences; `tools/build-principle-scenes.py` builds the other five and combines their metadata. Generic story tracks are deterministic and share the existing visible-scene clock.
