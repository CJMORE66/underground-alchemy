# Interactive text / 26 October 2026

The requested change adds text entrances/exits and pointer-driven letter interaction to the existing CAISIK visual language. It does not replace the approved artwork, alter source facts or change user storage. The implementation remains buildless HTML/CSS/JavaScript.

## Runtime and integration contract

`dist/text-motion.js` and `dist/text-motion.css` progressively enhance display headings and an explicit set of calls to action. Original `em`, `span`, `br`, native control identity, link destinations and text are retained. Custom inline elements avoid inheriting the existing site's broad `h1 span`/`h2 span` display rules. Editable content, forms, live status, code and changing control labels remain outside the text effect.

Native scrolling drives entry, exit and re-entry. Fine pointer movement affects nearby characters and ink emphasis; leaving restores the original composition. Keyboard/touch paths retain their native action. Existing global Pause Motion, Selfmade quiet settings and live OS reduced-motion preference remain authoritative. Background/offscreen scenes must not create an idle requestAnimationFrame loop.

The public diagnostics API contains counts and lifecycle controls only. It does not expose user notes or media. No dependency or audio permission is introduced by text motion.

## Automated verification

Run `node tests/text-motion.mjs` from the repository root. The VM uses the actual delivered runtime with a real linkedom document and controlled media, visibility, intersection and animation-frame callbacks.

The suite verifies exact semantic text, nested element identity and click handlers; exclusion of editors/status/code; idempotent enhancement and newly mounted headings; actual in/out/re-entry states; changed pointer properties and finite reset; live OS/global preference changes; background/page lifecycle; BFCache restore; explicit teardown and absence of a post-teardown restart; and readable fallback when optional browser APIs are missing.

**PASS:** `node tests/text-motion.mjs` executed against the delivered module. Added regressions verify delegated pointer-out returns intensity to zero, keyboard focus produces/restores a real response, existing accessible names remain authoritative, linebreaks create a word boundary in generated names, dynamically changed headings retain their new text, hidden panels remain idle, and observers disconnect on teardown. A further regression keeps non-heading hero prose at whole-word granularity: exact text and linebreaks survive, no individual glyph nodes or unsupported paragraph aria-label are added, and the phrase still responds to the mouse. The 320px CTA regression also verifies that a multiword label remains one direct flex item, its original separate arrow node and pre-existing click handler survive enhancement, and teardown removes the grouping. No application/storage files were modified by this independent QA task.

## Browser and offline boundaries

The owning agent performs rendered desktop/mobile, pointer and keyboard checks and records them separately. DOM/VM checks are not screenshots, actual pointer feel, a physical phone test or a complete screen-reader audit.

The opt-in expedition service worker caches its existing text/runtime package. Root-level motion assets are optional network enhancements; losing them must leave original text readable. This change does not claim offline text animation and does not widen the worker's scope.

References: [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).

## Actual managed-browser checks — 26 October 2026

- Mouse over THE HIDDEN CITY creates different nonzero glyph transforms (observed x/y/rotation values per glyph). Global PAUSE MOTION removes active classes and computed transforms become `none`; resume retains all text and controls.
- `/play/` 320 and 390 px phone iframes: no heading overflows; 320 content scrollWidth/clientWidth both 305. Exact SELFMADE two-line title remains readable.
- Atlas long Blackbook CTA initially overflowed at 320 px; fixed by a single shrinkable text run, then actual scrollWidth/clientWidth both 305.
- Quick workspace navigation workshop → quests leaves only quests visible after finite transition; no stale outgoing panel wins.
- Native search and OPEN DISCOVERY still open the original profile. No microphone/location permission requested during checks.
