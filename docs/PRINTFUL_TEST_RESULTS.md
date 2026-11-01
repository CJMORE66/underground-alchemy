# Printful test results

Updated: 2026-11-01 (Europe/Paris). Overall PARTIALLY WORKING; live acceptance
BLOCKED. Stripe is confirmed; the new backend remains unhosted. The 31 October
static browser/deployment evidence below is historical and was not rerun as a
claim of backend readiness.

## Current merchant connection — 1 November 2026

The owner selected the separate **underground alchemy** merchant,
`acct_1UWra7PkIIV492Qz`. Fresh account discovery on its Stripe connection
returns this account with `livemode:true` only. The older Jakub Cais connection
still exposes its own live account and sandbox; those are separate identities.
Earlier sandbox evidence must not be attributed to underground alchemy.

Actual read-only requests on the selected merchant succeeded:

- `GET /v1/tax/settings`: object `tax.settings`, `livemode:true`, `status:active`.
- `GET /v1/tax/registrations?status=all&limit=100`: empty, `has_more:false`.
- `GET /v1/webhook_endpoints?limit=100`: empty, `has_more:false` (v1 snapshot
  endpoints only; not a complete v2 Event Destination inventory).

No settings, Session, payment, webhook destination or Printful order was written.
Active Tax settings do not establish the merchant's applicable registration or
price/tax policy. No missing head-office claim is made for this merchant; the
previous pending/head_office finding belongs to the older Jakub Cais sandbox.

Required next access: authorize this merchant's own sandbox/test context through
its Stripe connection, then rediscover the exact returned context and mode.
Do not flip this live context to false, reuse the old sandbox, inherit its keys
or reuse an old merchant's database/Session/order mappings. Runtime keys, actual
HTTPS endpoint/secret, Printful token and a deployed durable Node backend remain
unavailable. Checkout is disabled; static version 31 is unchanged.

## Earlier 1 November reads — Jakub Cais sandbox

The owner completed the earlier Jakub Cais sandbox authorization; this is not the newly selected underground alchemy merchant. All operations below
used the selected sandbox with `livemode:false`, not the connected live account.
These were actual authenticated provider reads, not mocked tests:

| Provider operation | Observed result | Limit |
| --- | --- | --- |
| `GET /v1/balance` | PASS: object `balance`, `livemode:false` | Authenticated sandbox read only; no balances retained |
| `GET /v1/tax/settings` | Authenticated; `status:pending`, `livemode:false`, missing `head_office` | BLOCKED Tax configuration; missing address does not resolve automatically |
| `GET /v1/tax/registrations?status=all&limit=100` | Empty list, `has_more:false` | No active, scheduled or expired registration returned; no registration was created |
| `GET /v1/webhook_endpoints?limit=100` | Empty list, `has_more:false` | v1 snapshot endpoint inventory only; does not inventory every v2 Event Destination or prove HTTP delivery |
| `node tools/verify-stripe.mjs` after OAuth | BLOCKED, `STRIPE_TEST_KEY_REQUIRED`, `networkAttempted:false`, exit 1 | OAuth connection does not supply the Node runtime with a key |

The plugin schema reported `2026-09-30.preview`; this does not prove runtime SDK
requests at pinned `2026-10-28.endive`. No settings, Checkout Session, payment,
webhook endpoint, Printful draft or fulfillment confirmation was written.
Authentication is verified only for these sandbox MCP reads. Checkout, runtime
credentials, merchant tax policy and public webhook delivery remain unverified.

## 1 November Stripe / durable-storage verification

| Command/check | Actual result | Evidence category |
| --- | --- | --- |
| `node tests/commerce-server.mjs` | PASS, 19 cases | Original fake-provider/repository safety fixtures |
| `node tests/stripe.mjs` | PASS, 21 cases | Official SDK 23.1.0 signature construction/verification and mocked provider HTTP: restricted/secret test keys, sanitized denied-scope errors, Tax/quote/line/address/amount binding, fresh Session/PI/charge/refund checks, pagination and deterministic lost-reply retry parameters |
| `node tests/commerce-sqlite.mjs` | PASS, 14 cases | Actual private on-disk SQLite, migration/checksum, durable reopen, transactions/uniqueness, eight-process races, single-POST gate, leases/fencing and retries/dead letters; no provider requests |
| `node tests/stripe-workflow.mjs` | PASS, 13 cases | Actual SQLite plus fake Stripe/Printful providers: durable admission, duplicate events/jobs, delayed payments, early/lost Session mapping recovery after quote expiry, ambiguous POST reconciliation, raw Request handler responses and restricted-key preflight |
| `npm run test:stripe` | PASS, 48 cases | Stripe + SQLite + workflow groups above, not live provider testing |
| Focused four-suite total | PASS, 67 cases | 19 + 21 + 14 + 13; no fixture is reported as an account/payment success |
| `node tools/verify-stripe.mjs` | BLOCKED, missing test key; `networkAttempted:false` | No authentication request, Session/payment or endpoint registration occurred |
| Runtime/process credential inspection | BLOCKED | No Stripe/Printful key or endpoint secret available; Sites environment entries remain empty |
| Latest `npm audit --json` | PASS, exit 0, zero known vulnerabilities | Current dependency advisory check; an earlier exit-2 result was not treated as a clean command |

Real database concurrency is tested, not mocked. Stripe SDK raw signatures are
tested locally with fixture keys; HTTP account/Tax/payment/refund responses remain
mocked in automated tests. The actual sandbox reads above are separate. No
actual Stripe test checkout, real signed delivery, merchant tax
configuration, Printful draft, customer charge or paid fulfillment was verified.
Static version 31 and public checkout remain unchanged. No new UI/browser E2E is
claimed for this backend-only follow-up.

### Proxy retry regression follow-up

The PR review correctly identified that urllib's real `ProxyHandler` mutates a
Request during HTTPS-over-HTTP tunneling. Reusing that Request for retries can
change its transport to HTTP. `tools/sync-printful.py` now constructs a fresh
Request for every bounded attempt, retaining the original HTTPS URL/headers.

`python tests/printful-sync.py ProxyRetryTests.test_retry_rebuilds_request_after_real_proxy_tunnel_mutation`
passes locally for 429, 503 and transport-failure subcases. The test uses the real
ProxyHandler and isolated transport, without sockets; the regression failed on
the old implementation. The agent's full 26-case importer run used a temporary
path-existence fixture because this partial checkout lacks the real image.
Only full-repository CI may establish the unmodified image/asset checks.
`python -m py_compile tools/sync-printful.py tests/printful-sync.py` passed.

Restricted-key support also extends the public artifact scanner from `sk_` to
both `sk_` and `rk_` secret formats. Full artifact validation requires the complete
repository and is recorded separately from local source syntax checks.
The first repository tree write was rejected by GitHub's secret-content rule
because tests contained complete synthetic credential-shaped literals. Fixtures
now generate explicitly artificial credentials at runtime; the rule is retained,
and no actual credential or override is used.

### Complete-repository CI after sandbox follow-up

[Commerce safety checks run 41275702803](https://github.com/CJMORE66/underground-alchemy/actions/runs/41275702803)
completed **success** at source head
`a1c3c80c697290eda628614436b7e56dcdd756b3`. All job steps passed: locked
dependency installation, `npm run test:commerce` (including the 26-case importer
suite against the repository's actual asset tree), atlas, both language suites,
static publish validation and `git diff --check`. This resolves the partial-local
asset-verification limitation for that source head. CI does not authenticate
providers, execute payment or deploy a backend. Subsequent documentation-only
evidence updates do not change the tested commerce implementation.

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
