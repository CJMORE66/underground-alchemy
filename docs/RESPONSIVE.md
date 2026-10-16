# Responsive configuration and verification

Reviewed on 16 October 2026. This records the source configuration and static checks performed. It is not a claim that a mobile device, browser layout, checkout, screen reader or GPU performance test passed.

## Layout ownership

- `dist/responsive-v6.css` owns shared responsive layout, product grids, touch controls, dialogs, the original story archive and compact navigation.
- `dist/cinematic-v7.css` loads after it and owns the fixed header, bottom experience controls and the six-chapter native-scroll film. The final rules remove the film-stage minimum-height mismatch, give an open menu an opaque backing and reserve 90 px at the bottom of the document for the fixed controls.
- `dist/learn.css` and `dist/education-v7.css` own the responsive educational section. That section sets its own `lang` to Czech or English as selected.
- `dist/commerce-v7.css` and `dist/portals-v7.css` own the added product and QR experiences. The enhanced QR overlay has z-index 100, above the fixed header and experience controls.
- `dist/responsive-v6.js` owns the mobile menu state (`header.nav-open`, `aria-expanded`) and closes the menu on navigation, Escape, outside click or a return to desktop width.

## Width and motion behavior

| Viewport / setting | Source behavior |
|---|---|
| Above 1100 px | Four actual-product columns |
| 769–1100 px | Three actual-product columns |
| 360–768 px | Two actual-product columns |
| Below 360 px | One actual-product column |
| Up to 768 px | Compact header menu; shared visual/control grids stack; original three-chapter story becomes a complete sequential narrative |
| Above 768 px | Original story can use its sticky cinematic layout; desktop product tilt stays available to fine pointers |
| Up to 700 px | The new film uses its lightweight poster and layered CSS presentation instead of starting its WebGL scene |
| `prefers-reduced-motion`, Simple mode | WebGL stops; CSS animations/transitions are disabled; text and native navigation remain available |
| Save-Data enabled | Initial film quality profile disables WebGL |
| Low CPU/memory profile | Desktop scene profile lowers its rendering budget and targets 30 fps |

The normal film uses native scrolling and six textual chapters over one persistent visual stage. No wheel interception is required. WebGL is optional; the static imagery, copy, catalog links and keyboard-operable lesson controls are still present without the rendering module.

The original story archive uses the same 768 px breakpoint in CSS and JavaScript. Its chapters become non-inert in compact mode. Resizing back to desktop invalidates the active chapter and reapplies the appropriate inert state. Static review covered the transitions between compact/desktop, Simple/Cinematic and system reduced motion.

## Touch and content constraints

Shared buttons, search controls, catalog filters, summary controls and dialog close actions have at least 44 px target-height rules. The final film rules also enlarge its lesson/index controls. Form text uses 16 px where practical on phones. The compact product layout wraps product names, and dialog content, SKU lists, long labels and tables have explicit containment/overflow handling.

The main mobile breakpoints are 1024, 900, 768, 600, 390 and 359 px. These were reviewed from source; 320, 360, 390, 600, 768 and 1024 px remain the intended real-browser/device checks.

## Local fonts

`dist/fonts-v7.css` serves official Google Fonts files locally with `font-display: swap`:

- Barlow Condensed 600, 700 and 800: Latin and Latin Extended subsets.
- DM Sans variable 400–700: Latin and Latin Extended subsets.

The eight WOFF2 files total 166,080 bytes. The Latin Extended subsets include the character ranges needed for Czech diacritics. OFL license texts for both families are stored beside the fonts in `dist/assets/fonts/`. All font and license downloads succeeded. WOFF2 signatures and CSS syntax were checked; deep font metadata decoding was unavailable because the Python Brotli extension is not installed.

## Static checks completed

- 16 root distribution and project source JavaScript files passed `node --check`.
- Eight linked CSS files were recursively parsed, including media blocks and declarations, with zero syntax errors.
- Every local URL referenced from those CSS files resolved to an existing asset; no external font/CSS URLs remained.
- Main HTML had no duplicate IDs, missing same-page fragment targets, missing local `src`/`href` targets or images missing an `alt` attribute.
- Embedded catalog JSON and ItemList JSON-LD parsed successfully. Product schema does not invent a stock status or verified checkout offer.
- External new-tab links in the main HTML included `rel="noopener"`.
- The two selects flagged by a simple label scan were manually confirmed to be inside implicit `<label>` elements.
- The main document uses English; educational content updates its own language attribute. The second H1 belongs to the hidden QR overlay, rather than a second visible main title.

These checks establish source consistency and syntax. They do not measure rendered contrast, overflow, focus order, screen-reader announcements, Core Web Vitals or actual frame rate.

## Final manual checks still required

Use a real authenticated preview/public build to verify:

1. Widths 320/360/390/600/768/1024 px, plus a short landscape viewport.
2. Full header menu opening/closing, keyboard focus and no clipping behind fixed chrome.
3. Long product names, wishlist, filtered empty state, product dialog and SKU lists.
4. Czech and English lessons, exercise controls, feedback, quiz options and progress state.
5. Film Simple mode and system reduced motion: no moving city, sigil or product layer; camera and GPU loops stopped.
6. Footer controls and toast visibility above the bottom experience bar and safe-area inset.
7. Background tab, return to foreground, WebGL failure and Save-Data behavior.
8. Font loading/layout shift on a cold cache and a slower real connection.

At the time of this review, mobile-device and rendered-browser verification were unavailable. Do not describe these as passed checks or attach invented screenshots/metrics.

## Narrow follow-ups raised during static review

- On 390–480 px screens the two-column collection-world cards can give the 30 px word “UNDERGROUND” too little room. Use a single-column breakpoint around 480 px or an explicit word-wrapping strategy.
- The cinematic controller must suppress its DOM layer transforms as well as the WebGL loop under Simple/system reduced motion. This was flagged for the integration owner; verify the final guard/reset in the built module.
- Canonical and social-share metadata are optional publication follow-ups. The current title and description exist; private access and actual public launch settings remain a separate decision.

Root integration resolved both review followups: collection cards use one column at widths up to 480 px; Simple/reduced motion returns before visual transforms and resets existing layer transforms. Final browser checks are in VERIFICATION.md.
