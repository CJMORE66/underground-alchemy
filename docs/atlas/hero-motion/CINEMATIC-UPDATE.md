# Stronger main-hero animation — 21 October 2026

User requested more motion after the first published animation. Retains the approved seated-alchemist art and the existing atlas. No regenerated bitmap or new dependency.

Added:

- Interior torso breath with a 5.6-second cycle. A stationary clip and feathered mask blend a transformed copy of the approved paint into its static silhouette; eyes and outside contours remain anchored.
- Two engraved halos rotating in opposite directions.
- Advancing crimson energy strands around the figure and along the steps.
- 22 bounded rising ember/glyph particles, allocated once at scene load.
- A pulsing pendant, rotating star, stronger vinyl highlights and expanding water-ripple accents.
- Awakening raises energy smoothly and emits a short circular wave.
- Celestial orbit changed from 36 to 26 seconds, with more visible depth and pointer offsets.

Every animation uses the single existing RAF elapsed clock. Reduced motion, simple mode and Pause Motion retain the original poster; hidden/offscreen views suspend all new motion. No sound or flashing effects. Versioned JS/SVG URLs refresh the scene for returning visitors.

Validation:

- `npm test` passed: atlas content, 100 artworks, asset packaging, DOM and JavaScript syntax.
- `node tests/hero-motion.mjs` passed: new cloth/particle/energy movement, finite particle population, awakening wave, all pause sources, restart without elapsed-time jumps or particle reallocation, responsive frame and failed-asset fallback.
- Managed Chrome preview: page identity and substantive app content confirmed, no error overlay, no app console warnings/errors; extension messages excluded. Activated awakening and observed energy rise to 1.000. Inspected changing torso transforms, energy offsets and independently moving celestial sprites.
- Pause Motion hid the stage and showed the approved poster. Two separate observations confirmed frozen torso and ribbon state; Resume Motion restarted the scene.
- Nominal 390px and 740px iframe CSS viewports visually checked; 390px viewport loaded all 22 particles in the shared 735 x 490 frame. Awakening button changed its state successfully. Physical touch hardware was not tested. Temporary QA fixture removed.

Screenshot: `preview-cinematic.jpg`. Source generation metadata remains in `ASSETS.json`; all existing bitmap hashes unchanged.
