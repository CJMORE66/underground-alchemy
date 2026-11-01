# Printful test results

Updated: 2026-11-01 (Europe/Paris). Overall PARTIALLY WORKING; live acceptance
BLOCKED. Stripe is confirmed; the new backend remains unhosted. The 31 October
static browser/deployment evidence below is historical and was not rerun as a
claim of backend readiness.

## 1 November Stripe / durable-storage verification

| Command/check | Actual result | Evidence category |
| --- | --- | --- |
| `node tests/commerce-server.mjs` | PASS, 19 cases | Original fake-provider/repository safety fixtures |
| `node tests/stripe.mjs` | PASS, 19 cases | Official SDK 23.1.0 signature construction/verification and mocked provider HTTP: test-only keys, Tax/quote/line/address/amount binding, fresh Session/PI/charge/refund checks, pagination and deterministic lost-reply retry parameters |
| `node tests/commerce-sqlite.mjs` | PASS, 14 cases | Actual private on-disk SQLite, migration/checksum, durable reopen, transactions/uniqueness, eight-process races, single-POST gate, leases/fencing and retries/dead letters; no provider requests |
| `node tests/stripe-workflow.mjs` | PASS, 12 cases | Actual SQLite plus fake Stripe/Printful providers: durable admission, duplicate events/jobs, delayed payments, early/lost Session mapping recovery after quote expiry, ambiguous POST reconciliation and raw Request handler responses |
| `npm run test:stripe` | PASS, 45 cases | Stripe + SQLite + workflow groups above, not live provider testing |
| Focused four-suite total | PASS, 64 cases | 19 + 19 + 14 + 12; no fixture is reported as an account/payment success |
| `node tools/verify-stripe.mjs` | BLOCKED, missing test key; `networkAttempted:false` | No authentication request, Session/payment or endpoint registration occurred |
| Runtime/process credential inspection | BLOCKED | No Stripe/Printful key or endpoint secret available; Sites environment entries remain empty |
| Latest `npm audit --json` | PASS, exit 0, zero known vulnerabilities | Current dependency advisory check; an earlier exit-2 result was not treated as a clean command |

Real database concurrency is tested, not mocked. Stripe SDK raw signatures are
tested locally with fixture keys; HTTP account/Tax/payment/refund responses remain
mocked. No actual Stripe test checkout, real signed delivery, merchant tax
configuration, Printful draft, customer charge or paid fulfillment was verified.
Static version 31 and public checkout remain unchanged. No new UI/browser E2E is
claimed for this backend-only follow-up.

## 31 October static release evidence

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
3. Actual Stripe test checkout, successful/failed payment, server-side
   amount/currency/order binding, replayed/out-of-order payment webhooks.
4. Deployed durable internal order/inbox/jobs, host restart/backup recovery and
   dead-letter/admin visibility. Local real SQLite transaction/concurrency/lease
   behavior now passes; actual host deployment is still blocked.
5. Authorized real draft-only Printful creation (`confirm=false`), ambiguous
   response reconciliation, duplicate protection in the deployed backend.
6. Actual signed webhook delivery/retry/status/tracking mapping and customer
   notifications; cancellation/customer refund through the real payment provider.

No confirmation-for-fulfillment API method is implemented. Paid production
confirmation and real charges require separate explicit authorization.
Stripe test keys/actual snapshot endpoint secret, verified Tax registrations,
product/shipping tax codes and countries, real Printful token, authenticated
business routes/trusted quotes and a Node 24 durable host are still required.
Immutable order JSON lacks an implemented PII retention/anonymization path.

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

Post-deployment English/French/Czech switching also verified translated hero
headings and checkout-unavailable controls. Test cart remained empty afterward.


### Repository-wide CI for the Stripe code

GitHub Actions run41265201942 completed successfully for code commit
a59ed6923471fefae4bf929ec00ae50b20842a46:
https://github.com/CJMORE66/underground-alchemy/actions/runs/41265201942
It executed the full checkout, including existing SHOP/cart/importer/language/atlas
checks, the45new Stripe/storage/workflow tests and static release validation.
This is CI/fixture evidence, not live provider verification.
