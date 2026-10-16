# Verification — 16 October 2026

## Scope and environment

Static Sites deployment. Live browser: remote Chrome, viewport 1363 × 936 CSS px, reported connection type 4g, no network or CPU throttling applied. GPU/WebGL is disabled in this browser. Exact physical device/Chrome version was not exposed. This is not a representative mobile test and is not field data.

## Actual browser observations

- Existing storefront inspected before redesign; large header/settings bands and disconnected story blocks motivated a compact header and one continuous stage.
- Published six-chapter fallback inspected visually. Native Portal → City link advanced the counter to 02; cinematic product CTA opened the real OMERTA detail.
- Black / 2XL selection displayed €56.50 and SKU PF-18912189-5577030794; purchase href carried the exact source variant ID.
- Original store accepted that variant into its bag and cart, then displayed the shipping-address checkout screen with the same variant and €56.50 subtotal. No personal information, payment or order was submitted. The test item was removed and the empty cart verified.
- A fresh original-store variant URL selected Black / 2XL automatically and enabled Add to cart.
- Educational causal graph changed from missing placement to accepted workflow after both preparation inputs and the accept choice. Its explanation explicitly rejects treating that model as evidence of real print quality.
- The real Transmute sticker URL redirected to its slash route with all UTM labels preserved. Its public portal opened without login. The reveal control changed its state; campaign history remained off by default.

## Measured browser sessions

| Published build / visit | LCP | CLS | INP | Interpretation |
|---|---:|---:|---:|---|
| v7, warm visit | 460 ms | 0.009 | 2,152 ms | Slow interaction observed; cause not attributed. Target missed in this visit. |
| v8, controller/first chapter/product visit | 2,412 ms | 0.010 | 16 ms | Meets the numeric targets for this one desktop fallback session only. |

Readings came from web-vitals 6.2.3 on the actual rendered page, read from the session performance disclosure after interaction. LCP/INP may depend on cache, page visibility, browser automation and which interactions occurred. The second sample does not prove the earlier slow interaction is resolved. No external telemetry is sent. No 60 FPS result or throttled-mobile score is claimed.

## Source and interaction checks

`npm ci --ignore-scripts --offline`, `npm run build:cinema`, and `npm test` succeeded in the provided environment. Exact dependency versions are locked. Tests use Linkedom/VM and are explicitly not rendered-browser tests.

- Legacy feature regressions: three concept collections, seven lab scenes, twelve album entries, wishlist, theme/motion controls, quiz, local preference, original optional artwork/exhibits and product filtering/search.
- Commerce: 20 product IDs/original names/base prices and all 86 SKUs/options preserved against the prior source; exact variant prices/IDs enriched from fresh public product detail data. Selecting 2XL and clearing it checks against stale pricing and stale variant links.
- Education: seven bilingual lessons, wrong-answer retry, 7/7 completion/reset, exercises, 24 causal workflow combinations, 14 reflection prompts, language remounts, page-memory notes and privacy reset.
- Cinema: six keyframes, bounded interpolation, chapter counters, all seven lesson actions, product action/fallback, Simple/reduced-motion transform reset, mobile/save-data/adaptive quality and local measurement initialization.
- QR portals: 339 DOM assertions across all 12 routes, unique scenes, interaction states, actual chapter targets, progression, affirmative consent, revocation, invalid UTM handling and blocked storage.
- All 12 print sticker SVGs were rendered at 1000 px and decoded using zxing-cpp. Each encoded the correct portal path and sticker/qr/campaign/content UTM labels. This is not a physical print/camera test.
- HTML IDs/fragments/local assets, image alt attributes and embedded JSON were checked. Linked CSS parsed without syntax errors; JS syntax and the production bundle build passed. No external CSS/font fetch is needed.

## Security and accessibility boundary

The added frontend has no commerce write API, secrets, customer/order import, analytics endpoint or compulsory account. Source URLs are HTTPS; public product data is rendered with existing escaping and DOM text nodes. Campaign labels are allowlisted and length-limited. New tab links preserve noopener. Native controls, labels, semantic headings, skip navigation, keyboard actions and reduced motion are implemented. This is source review and functional testing, not a penetration test, formal WCAG certification or full screen-reader audit.

## Remaining release checks

1. Real phone/tablet browsers at 320–1024 px, touch, keyboard/screen reader and contrast review.
2. Capable desktop GPU inspection of the extruded emblem, camera framing, context loss/recovery and sustained frame rate.
3. Cold-cache representative mobile tests with documented device, CPU and network profiles; LCP ≤2.5 s, CLS ≤0.1 and INP ≤200 ms remain unverified for mobile/field use.
4. Investigate the earlier slow interaction with a browser performance trace; do not generalize the faster single sample.
5. Authenticated Magento access/configuration: the public GraphQL endpoint exposed zero products; the actual source catalog uses different product identifiers. No Magento cart integration is claimed.
6. Payment, country/shipping/tax totals, Printful fulfillment, production order/webhook delivery and authenticated customer flows require authorized integration testing.
7. Server campaign analytics, conversion attribution/dashboard and cross-device progression need a consent-aware backend. Current progression/history is local only.
8. Accurate garment scans/front/back designation and manufacturing/fit simulation require verified assets. Current sculpture is conceptual; source previews are authentic.

The reference video page was accessible but no playable frames were obtained. No analysis of that video's motion is claimed.

Final integration adds an immediately enforced CSS reduced-motion reset, a consistent primary variant price, compact optional source details, canonical/social metadata, local hero font preload and QR overlay scroll containment. All interaction suites and static checks were rerun after these changes.
