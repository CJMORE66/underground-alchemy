# Individual CAISIK location artwork motion

The twelve new location posters are generated contemporary illustrations. Their motion is an artistic study of the painting, not architectural evidence or a simulation of a real building moving. Documentary photos (`img[data-place-photo]`) are never animated by this module.

`dist/place-art-motion.js` is a classic defer script. It enhances only `.place-artwork[data-place-art]` hosts containing `img[data-place-illustration]`. The existing replay button `[data-place-replay]` keeps its DOM identity and native handlers. The corresponding CSS must load after the static artwork framing.

## Paint and ink contract

Every actual final WebP was visually inspected at 1536×1024 before drawing its source-space paths. The overlay uses the same viewBox and preserves the image frame. Do not reuse these coordinates if a poster is regenerated or cropped differently. Keep the frame at the original 3:2 ratio; the intact static image remains the source of truth.

Native SVG paths redraw selected edges and progress through actual window or roof regions. Each trace now has a dark source-aligned under-stroke, a yellow construction stroke and a separate bone-white travelling nib. This preserves contrast against the saturated illustration at mobile scale; the old 2.4-source-pixel strokes became subpixel lines in narrow profiles. Window lighting reaches a deliberate 48% rather than the previous barely visible 22%. A small number of painted details are duplicated from the original image and clipped to inspected interior ellipses; their movement preserves the silhouette and occlusion. Near-circular symbolic sun/star interiors rotate once per loop; other painted interiors rock within their inspected bounds. Architectural facades and the complete poster never rotate as a substitute for detail motion. This is not a fully separated or recovered 3D raster illustration. The whole image and card do not translate, tilt, scale, rotate or fade as a substitute for internal animation.

| Place | Individual illustrated motion | Loop |
|---|---|---:|
| Notre-Dame | Interior rose-window tracery, separate painted halo, three portals, tower edges and crossing spire | 9.28 s |
| Sainte-Chapelle | Western rose, tall glazing in sequence, roof edge and slender spire | 10.44 s |
| Maison de Nicolas Flamel | Separate window bays, carved lintel bands, painted sun and moon | 8.70 s |
| Saint-Sulpice | Unequal tower edges, individual colonnade strokes, portals and central light axis | 9.86 s |
| Père-Lachaise | Tomb-chapel arches, successive stair treads, small painted leaf and star | 10.44 s |
| République | Pedestal bands, branch/figure outline, shield and low-relief light | 9.86 s |
| Abbesses | Individual canopy ribs, organic iron supports and separate kiosk lamps | 9.28 s |
| Le M.U.R. Oberkampf | Original painted letter strokes, wall edges and separate lamp cones | 8.70 s |
| La Place / Canopée | Left/right roof wings, structural ribs, passage glazing and painted compass | 10.44 s |
| CENTQUATRE | Separate hall fronts, iron trusses, glazed roof panels and pendant lights | 10.44 s |
| Philharmonie | Bird-pattern facet edges, rising roof/ribbon path and glazed recesses | 9.86 s |
| Shakespeare and Company | Bookshop window bays, shelf lines, awning and separate interior lamps | 9.28 s |

The first construction becomes visibly readable in approximately two seconds. A compact HTML badge names the current phase (outline, light, detail), and explicit replay resets the sequence and announces the scene. A blocked replay explains the active global pause, calm mode or system reduced-motion setting in visible text and a live status region; it does not silently fail or override the visitor’s choice. The original global preference remains authoritative.

Visibility uses the actual SVG `hidden` attribute, not the non-reflected `SVGElement.hidden` JavaScript expando. This fixes the discrepancy between a DOM test harness and browser rendering.

Motion pauses immediately when a host leaves the viewport, the tab is hidden, reduced motion is requested, the global `data-motion="off"` preference is set, a quiet Selfmade mode is active, or simple mode is selected. An open modal pauses posters behind it. No audio, permissions, requests to remote services or storage writes are added.

There is one shared requestAnimationFrame loop while at least one eligible poster is visible. It stops when none are running. Mouse/focus gently increases the existing detail response; touch can use the explicit replay button. An image failure or missing visibility APIs leaves a static poster rather than running an untracked animation.

The shared mutation observer handles dynamic previews and profiles. Removed posters release their listeners, SVG and visibility observation. Nonpersisted page exit destroys the runtime; BFCache exit sleeps and resumes without duplicating overlays.

## Developer API and verification

`window.CaisikPlaceArtMotion.rescan()` schedules an idempotent scan. `stats()` reports enhanced/visible counts, running state and scene IDs. `destroy()` removes only this module's overlays/listeners; original images, captions, buttons and documentary source panels remain.

Run:

```sh
node --check dist/place-art-motion.js
node tests/place-art-motion.mjs
```

The Node suite runs the actual runtime in a DOM/VM harness. It verifies internal animated changes for all twelve distinct scene paths, source-paint clipping, replay handler preservation, pointer changes, visible construction/light within the first seconds, per-trace contrast and moving nibs, explicit blocked-replay feedback, modal/offscreen/tab/reduced-motion pause, unique SVG references, dynamic cleanup, BFCache and static failure/API fallbacks. It does not claim physical-phone rendering or precise visual alignment without a separate browser review.
