# Street portals v7

Twelve original geometric mini-experiences extend the existing `/q/:slug/` entry routes. They have individual color, artwork, narrative, reflection and an interaction. No account is required by the portal code. Hosting access is a separate deployment setting.

## Route and chapter map

| Route | Title | Symbol | Associated chapter | Interaction |
| --- | --- | --- | --- | --- |
| `/q/transmute/` | TRANSMUTE | ✳ | `/#film-portal` — THE PORTAL | Dissolve / rebuild the form |
| `/q/mentalism/` | CHANGE THE FRAME | ◉ | `/#film-principles` — THE SEVEN PRINCIPLES | Perspective slider |
| `/q/correspondence/` | WITHIN / WITHOUT | ◇ | `/#film-principles` — THE SEVEN PRINCIPLES | Nested-scale slider |
| `/q/vibration/` | FIND YOUR FREQUENCY | ≈ | `/#film-city` — THE CITY | Visual-frequency slider |
| `/q/polarity/` | BETWEEN THE EXTREMES | ◐ | `/#film-dissolution` — THE DISSOLUTION | Contrast continuum slider |
| `/q/rhythm/` | KNOW YOUR RETURN | ↔ | `/#film-principles` — THE SEVEN PRINCIPLES | Start / reset pendulum |
| `/q/cause-effect/` | MAKE A MOVE | → | `/#film-forge` — THE FORGE | Start / reset causal chain |
| `/q/generation/` | CREATE IN DIALOGUE | ⊕ | `/#film-forge` — THE FORGE | Combine / separate forms |
| `/q/shadow-work/` | MEET THE SHADOW | ◑ | `/#film-dissolution` — THE DISSOLUTION | Reveal / reset silhouette |
| `/q/as-above/` | LOOK ABOVE | △ | `/#film-portal` — THE PORTAL | Open / reset upper horizon |
| `/q/so-below/` | NOTICE BELOW | ▽ | `/#film-city` — THE CITY | Open / reset lower horizon |
| `/q/underground/` | CARRY THE SIGN | ▥ | `/#film-drop` — THE DROP | Illuminate / reset city grid |

All six chapter IDs and secondary `/#learn`, `/#drops` and `/#album` targets were checked against the current `dist/index.html`. All twelve route HTML files exist. Above/Below also link to each other. Principle portals link to education; other portals link to the real catalog without claiming that particular products form a verified collection.

## Implementation

- `dist/portals-v7.js`: activates only twelve allowlisted `/q/` routes; replaces the existing `#portal` overlay.
- `dist/portals-v7.css`: scoped responsive layout, drawing states and reduced-motion rules.
- Load the script after `experience.js` and styles after the existing responsive CSS.
- Authored SVG scene artwork is also downloadable as an original digital collectible. It is not a manufacturing drawing or a QR code.
- Controls use native buttons/ranges, pressed state, named SVGs and status announcements. Reduced motion disables animations and transitions; the pendulum uses a static changed state.
- Philosophical principles are distinguished from scientific claims. The seventh principle includes historical terminology without assigning fixed roles or abilities to people.

## Local progression, attribution and privacy

`caisik-album` records distinct portal visits in this browser, preserving the existing functional album. Opening a URL is a portal visit; it does not verify a physical sticker scan. Clearing the existing album resets that progression. There is no cross-device synchronization, proof of identity, account, or server record.

Campaign history is off by default. Only an affirmative **SAVE CAMPAIGN HISTORY LOCALLY** action enables it. The visitor can disable and remove history at any time. A previous affirmative choice applies to later portal visits on that browser.

Only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` are considered. Values must be 1–80 characters and contain only ASCII letters, numbers, spaces, underscores, periods, slashes or hyphens. Other query parameters and unsafe/overlong labels are ignored. Current labels can be displayed without storing them. Optional history contains portal slug, visit timestamp and accepted labels, capped at 50 entries, under `caisik-campaign-history-v7`; permission is stored under `caisik-campaign-consent-v7`.

There are no requests, analytics SDKs, third-party trackers, conversion measurements or server attribution in this portal module. It cannot demonstrate purchase attribution or total campaign scans. Browser storage can be blocked or cleared; the page continues to work, but persistence may be unavailable. Users should keep personal information out of campaign labels.

Physical QR artwork, destination reachability and hosting access require separate deployment verification. These portal changes do not change Magento, prices, inventory, orders, payment processing or Printful.

## Performed checks

- `node --check dist/portals-v7.js`: passed.
- Initial isolated execution checks: all twelve route branches, four sliders, eight toggles, local album, consent default, affirmative recording, invalid-label rejection and clearing passed.
- `node tests/portals.cjs`: **339 DOM assertions passed**, using `linkedom` and Node VM. The suite checks all twelve route HTML files, unique scenes/titles, accessible SVG names, actual current chapter/secondary anchor targets, slider/toggle state changes, distinct-visit album progression, no default campaign history, opt-in/opt-out/clear behavior, UTM allowlisting, overlong/unsafe-label rejection, stored affirmative choice on return, blocked-storage handling, unknown-route noninterception and zero `fetch` calls.

To run after installing the declared project dependencies:

```sh
node tests/portals.cjs
```

This development session used the already-installed scratch dependency location:

```sh
NODE_PATH=/workspace/scratch/50ee39693d80/caisik-qa/node_modules node tests/portals.cjs
```

DOM assertions do not measure rendered layout, real keyboard navigation, screen-reader behavior, QR scanning, browser FPS, Core Web Vitals, hosting authentication or end-to-end checkout. Those checks remain separate from this suite.
