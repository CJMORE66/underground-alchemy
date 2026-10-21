# Living homepage hero — 21 October 2026

Implemented on the existing version 15 atlas without changing its other modules.

- Native SVG scene uses an edited clean plate and two transparent generated celestial sprites. An outer stationary figure mask occludes both moving bodies.
- Opposed 36-second elliptical paths, restrained depth changes, rotating engraved ring, clipped vinyl groove accents and subtle water shimmer.
- Original hooded eye glows are covered while dreaming, revealed on hover/focus or button activation, then briefly blink. Pointer gaze offsets are limited to two source pixels. Tap/click toggles persistent awakening.
- All elements share one 1536 × 1024 frame. Desktop matches contain/right-bottom placement; mobile matches the original 490px cover crop.
- Initial reduced-motion preference skips animated asset downloads. Global pause/reduced motion/simple mode display the original approved poster. Offscreen and hidden tabs cancel RAF without losing elapsed time. Asset failure leaves the poster and hides unavailable controls.

Validation completed:

1. `npm test`: existing atlas data, ordered routes, seven principles, eight gallery themes, all 100 regenerated artworks, local asset references, DOM and JS syntax.
2. `node tests/hero-motion.mjs`: controlled DOM lifecycle checks cover loading, no initial reduced-motion downloads, responsive frame dimensions, moving bodies, eye interaction, ARIA labels, all pause sources, exactly one resumed RAF chain, no elapsed-time jump and failed-asset fallback.
3. Managed Chrome preview at 1363 × 936: inspected real artwork, corrected inherited SVG strokes on closed eyelids, activated the awakening button, observed eye opacity reach 0.003 and orbit transforms change. Global Pause Motion showed the original poster, hid the stage and disabled the hero control; Resume Motion restored it.
4. Browser iframes with nominal 390px and 740px viewport widths: inspected both responsive compositions and shared source frames; clicked the awakening control in the narrow frame. This checks CSS viewport layout, not physical mobile hardware. Temporary QA fixture removed before packaging.

Screenshot `preview.jpg` shows the completed awake scene. `ASSETS.json` records generation prompts, dimensions and SHA-256 hashes. The clean-plate edit preserves the composition but re-renders some fine ink and shading; it is not a pixel-identical inpaint.
