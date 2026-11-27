# CAISIK — The Hidden City / Underground Alchemy

The homepage opens with the original 27-shot scroll film. After the last shot, a three-window facade starts the first playable chapter. Each room, story step and field stop has a direct address. The five street trails, local Frequency studio, seven principles and player notebook work on a static server.

## Run and verify

Serve the authored frontend with `python -m http.server 8080 --directory dist`. Use `npm ci` to install development dependencies. Run `npm test` for the atlas and story regressions, `npm run test:commerce` for the lookbook and commerce suites, and `npm run test:edition:browser` for the Chromium interaction checks (Python Playwright and Chromium required). The optional native Worker deployment is built with `npm run build` and checked with `npm run check:commerce-release`.

| Entrance | Content |
| --- | --- |
| `/#story/continue` | Resume the saved scene and step. An eight-step player rhythm changes Window II. |
| `/#atlas/zin/le-grand-jeu` | Writer’s field edition, followed by Le M.U.R. Oberkampf and Lavo//Matik. |
| `/#atlas/places` and `/#atlas/principles/rhythm` | Documented venues, routes, expeditions and seven freely readable principles. |
| `/#workshop/frequency` | Local Frequency writing and audio, with separate entrances to GPT-Live and SELFMADE. |
| `/#blackbook` | Personal rhythms, drawings, texts, field notes and seals with their origins. |
| `/art/`, `/shop/`, `/archive/` | Galerie CAISIK, the streetwear lookbook and the original edition. |

The twelve sticker URLs under `/q/` are permanent entrances to their corresponding principles. The atlas keeps access conditions, fact sources and image credits next to the places. The field edition distinguishes documentary photographs from fictional scenes and original CAISIK margin notes. It identifies *The Kybalion* (1908) as a modern source of inspiration. Le M.U.R. is a curated exhibition.

## Privacy and commerce

Writing and sketches stay in the browser. Download a Frequency recording before leaving the session. GPT-Live is a separate voice experience that requires explicit consent for network audio. GPS is optional. The field edition includes its own static map. The full external map has a separate data connection.

The shop opens as a static lookbook. Product and variant identifiers remain available for the commerce integration. A live order requires separately configured fulfillment and payment services. The original approved art direction is in [APPROVED-STYLE.md](docs/atlas/APPROVED-STYLE.md).

## Restoration

At the user’s explicit request, the atlas functionality was restored from version 13, source `e159616e564d8bb5904c5af55f58fdc91afe8db3`, before applying the approved graphic-novel direction. The superseded version 14 was preserved in Git history and the local `before-approved-style-v14` branch. No history was rewritten.

## Historical commerce release of 31 October 2026

Static Sites release31 adds a saved variant cart and reviewed SHOP repairs.
The live Printful/payment/order backend remains blocked; checkout stays disabled.
Read `docs/PRINTFUL_PROGRESS.md` and the other five `docs/PRINTFUL_*.md` files
before resuming. Run `npm run test:commerce` and `npm run check:commerce-release`.
GitHub source commits do not deploy Sites automatically.
