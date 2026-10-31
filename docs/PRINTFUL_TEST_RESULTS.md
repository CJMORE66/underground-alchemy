# Printful test results

Date: 2026-10-31 (Europe/Paris). Overall PARTIALLY WORKING; live acceptance BLOCKED.

## Evidence categories

| Check | Result | What it establishes |
| --- | --- | --- |
| GitHub main + PR #3 and Sites source inspection | PASS | Static frontend, separate missing original backend; PR #3 remains open |
| Sites runtime configuration read | BLOCKED | No runtime environment entries; Printful/payment secrets unavailable |
| Original catalog browser navigation | BROKEN | `https://hiphop.caisik.i234.me/dk/store?page=1` displays Synology not-found page today |
| `npm test` | PASS | Existing atlas data, local assets, DOM wiring and JavaScript syntax |
| `node tests/shop.mjs` | PASS | Current saved snapshot, all 20 products/86 variants, exact IDs/SKUs, dated prices, selection, safe images, retry/close/navigation/cart boundary |
| `node tests/cart.mjs` | PASS | Isolated local model/DOM: amounts, quantities, persistence, corruption/quota, sequential tab edits, incomplete/missing/unavailable variants, blocked checkout |
| `python tests/printful-sync.py` | PASS, 25 cases | Mocked HTTP transport: auth failures, pagination, empty full import, incremental preservation, removals, rate limits/retries, atomic failures, SKU/mapping/secret guards |
| `node tests/commerce-server.mjs` | PASS, 19 cases | Isolated fake transport/repository; must never be described as a live provider test |
| `node tests/languages.mjs` + `node tests/languages-integration.mjs` | PASS | Three generated dictionaries, real DOM observer/dynamic text tests and existing language behavior |
| `npm audit --json` and `npm audit --json --omit=dev` | PASS | npm reported zero known vulnerabilities for checked lockfile, including dev dependencies |
| Static release validation / `git diff --check` | PASS | Public artifact integrity, equal product/variant counts, syntax, bounded common-secret scan and whitespace |

Counts above describe the current **2026-10-16 snapshot**, not the current
Printful account. No fixture result verifies real authentication, inventory,
shipping, payment, fulfillment or delivery. No real charge/order was submitted.

## Browser verification

Cloud Chrome on the actual running static app; mobile checks use rendered iframe
widths, not a physical phone. Root observed the 390px SHOP search → OMERTA →
Black / 2XL → exact SKU `PF-18912189-5577030794` and dated €56.50 → local cart.
Native asynchronous dialog closing exposed a cart-focus regression; it was fixed,
covered with a queued-close test and rechecked in the browser (`#shop-cart:focus`
was true after close). The 390px cart changed quantities and showed the correct
historical subtotal. Reload preserved both exact selected variants. FR and EN
controls/disabled-checkout notices rendered correctly. At 320px, document width
and scrollWidth both measured 305px (15px scrollbar), with no horizontal overflow.
These checks do not verify a physical phone or live payment.

## Required live checks — BLOCKED, not passed

1. Real authorized `GET /stores`, correct type/identity/scopes, current complete
   product/variant count comparison and safe image availability.
2. Actual address-specific Printful shipping methods/currency and merchant tax
   service. Provider tax on manufacturing is not customer checkout tax.
3. Existing payment sandbox checkout, successful/failed payment, server-side
   amount/currency/order binding, replayed/out-of-order payment webhooks.
4. Actual durable internal order/outbox/event ledger, transaction uniqueness,
   concurrent jobs, crash recovery, dead-letter/admin visibility.
5. Authorized real draft-only Printful creation (`confirm=false`), ambiguous
   response reconciliation, duplicate protection in the deployed backend.
6. Actual signed webhook delivery/retry/status/tracking mapping and customer
   notifications; cancellation/customer refund through the real payment provider.

No confirmation-for-fulfillment API method is implemented. Paid production
confirmation and real charges require separate explicit authorization.

## Limits

The secret check covers common patterns in bounded current public text, not all
secrets or Git history. npm audit covers known advisories, not a penetration test.
Browser-local simultaneous cart writes are last-writer-wins. The importer fails
atomically for incomplete products/SKUs rather than publishing partial data.
No generic lint or TypeScript command existed; syntax checks and the actual
static artifact validator are reported separately from a framework build.

## Final local release run

`npm run test:commerce`, `npm test`, both language suites,
`node tests/atlas-place-browser.mjs`, `node tests/expeditions.mjs`,
`npm run check:commerce-release`, `git diff --check`: all passed.
Generated dictionaries: 2,936 matching keys per language, 28 HTML entrypoints.
Static validator: 20 snapshot products, 86 variants, 52 image references,
7 JavaScript syntax checks; no variant silently dropped.
`node tools/verify-printful.mjs` exited 1 as expected with
`PRINTFUL_TOKEN_REQUIRED`, status BLOCKED and `networkAttempted:false`.
This is missing-credential evidence, not a real authentication failure or success.

## Production smoke — version31

Native Sites publication succeeded. Production browser verified snapshot grid,
OMERTA Black/2XL SKU and dated €56.50, add, reload persistence, quantity, removal
and disabled checkout. Test cart returned to empty. Production errors-only
Worker query returned no events; Site-origin browser error filter returned none.
The earlier preview desktop verified translated English hero and navigation.
Only browser-local cart selections were exercised; no payment or order existed.
