# Native scene transitions

`dist/journey-scroll.js/css` add four short scene bridges to the existing atlas. Link CSS and the classic defer script once on the homepage and twelve `q/` aliases. No dependency, remote image, scroll engine, input permission or storage key is added.

```html
<link rel="stylesheet" href="/journey-scroll.css?v=1">
<script src="/journey-scroll.js?v=1" defer></script>
```

The runtime inserts a bridge immediately before each existing target: `#hidden-city`, `#principles`, `#frequency`, `#living-wall`. It never replaces those sections. A compact sticky chapter rail links to those four genuine anchors and `#manifesto`; its header offset matches the current 112px desktop / 96px mobile CAISIK header. The rail occupies normal layout space. It is hidden visually, without collapsing its space, behind native dialogs.

## What the scroll changes

| Boundary | Native-scroll composition |
|---|---|
| Into Hidden City | Foundation grid, individually drawn building edges and an ordered route line. These are conceptual diagrams, not measured buildings or geographic routes. |
| Into Seven Principles | The eye's iris expands, geometry turns and separate circular/radial strokes appear. This is a contemporary illustration of changing attention. |
| Into Frequency | A skyline gives way to individually growing sound bars and arc constructions. It is a silent visual analogy, not an audio waveform recording. |
| Into Living Wall | A waveform recedes as separate original angular letter faces and their cuts emerge behind a scroll-controlled reveal. |

Every bridge has an HTML caption and a readable purpose. Actual body text stays fully visible. Native scroll writes progress, ring rotation, iris scale, before/after phases and separate SVG `stroke-dashoffset` values. Backward scrolling computes the same state in reverse. Original headings, artwork, map interaction, filters, fields and buttons are not moved or replaced.

The real sections also receive a narrow decorative progress ruler. The rail reflects actual document progress and the current section; this is navigation, not a fictional learning or artistic-quality score.

## Motion and lifecycle

The input listener is passive and never cancels wheel, touch or keyboard events. A single requested frame coalesces pending layout reads/writes, then stops immediately. This is not represented as a lower-frequency scroll throttle. IntersectionObserver limits motion to visible bridges; ResizeObserver catches height changes caused by asynchronous content. There is no idle RAF loop.

Global `data-motion=off`, live OS reduced motion, quiet/reduced Selfmade settings, simple mode, expedition field mode and the cultural board's field mode resolve to complete static drawings. Native dialogs pause background composition. Hidden tabs and BFCache sleep stop pending work; visible/page-show resumes deterministic scroll positioning. No automatic audio is used. Without JavaScript, existing site content remains unchanged; with motion disabled, all inserted diagrams stay complete and readable.

## Language and API

Visible captions, rail labels and accessible labels call `window.CaisikI18n?.t(source)` with their original Czech source string. The public `caisik:languagechange` event updates those labels while preserving actual SVG nodes and scroll progress. No independent language storage or language selector is introduced.

`window.CaisikJourneyScroll` exposes `rescan()`, `stats()` and `destroy()`. Rescan is idempotent. Destroy disconnects observers/listeners and removes only the bridge, rail, decorative rulers and attributes owned by this module.

Run `node --check dist/journey-scroll.js` and `node tests/journey-scroll.mjs`. Tests cover actual path/property changes in forward/backward native scroll, chapter links/progress, preserved native actions and body text, pause/reduced/field/modal/tab/BFCache behavior, finite scheduling, language updates and cleanup. These do not substitute for browser typography/layout or physical-phone review.

Primary API references: [MDN scroll events](https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event), [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [W3C reduced-motion technique](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR40).
