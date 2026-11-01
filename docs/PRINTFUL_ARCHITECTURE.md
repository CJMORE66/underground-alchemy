# Printful / Stripe architecture and operational boundaries

Updated: 1 November 2026 (Europe/Paris). Stripe is the confirmed payment
provider. Node 24 modules implement test-mode Checkout/Tax/payment verification,
a real on-disk SQLite repository and a durable payment worker. They are not
mounted or deployed. Production remains static version 31 with checkout disabled.

## Deployed application and source map

`dist/` is the maintained static application. `.openai/hosting.json` retains the
existing public Sites project and `static.directory: dist`. Atlas, Blackbook,
Alchemy/Frequency, Selfmade, artwork, routes and local user data are preserved.
Node's `node:sqlite` cannot run in this static Sites/Cloudflare deployment.

| Code/data | Responsibility | Trust boundary |
| --- | --- | --- |
| `dist/shop/{index.html,shop.css,shop.js}` | Grid/filtering, accessible detail/gallery, variants and saved cart | Public browser; no provider authentication, payable quote or fulfillment authority |
| `dist/shop/catalog.json`, `dist/catalog.json` | Public mapped snapshot and original dated evidence | Historical observations, not live inventory or delivered-price offers |
| `dist/shop/source-commerce.js` | Historical prices and allowlisted exact original URLs | Diagnostics, not an active checkout |
| `dist/shop/cart.js` | Versioned local variant IDs/quantities with recovery | No customer address, card/order data or inventory reservation |
| `tools/sync-printful.py` | Explicit administrator-run read-only catalog import | Process-only token; fixed API/store, TLS/no redirects, bounded responses/retries and atomic public export |
| `server/commerce/` | Printful/Stripe adapters, migration, durable repository and worker | Server-only Node 24 source outside `dist/`; requires a private durable host and actual secrets |
| `docs/i18n/*-translations.json`, `tools/build-languages.py` | CZ/EN/FR source/generated dictionaries | Existing identifiers/product names/user data are preserved |

The original commerce host is `https://hiphop.caisik.i234.me/dk/`. Historic
payloads resembled Medusa; its private implementation remains uninspected.
Stripe is now selected by the user. The Synology not-found observation is dated
31 October; diagnosing/reusing that deployment needs authorized NAS/backend access.
GitHub review and Sites/backend deployments remain separate operations.

## Catalog synchronization

1. Administrator injects a store-scoped credential. `GET /stores` verifies
   expected historical store `18912189` before reads; it is not an authenticated
   account fact until a real request succeeds.
2. Existing Manual/API stores use v1 `/store/products`; ecommerce stores use
   `/sync/products`. The operator establishes the type before choosing
   `--platform`; the importer never creates another store.
3. Full sync lists bounded pages/details. Explicit `--product-id` refreshes
   selected products and preserves other records/dates; incremental output
   cannot claim a complete current store scan.
4. Stable public IDs, handles, merchandising fields and approved local images
   are retained. SKU/catalog-variant conflicts stop the import. Removed,
   ignored/unconfigured/unavailable identities and a real empty full scan are
   represented explicitly.
5. Historical `sourcePrice` remains dated; Printful retail-price/availability
   observations use separate provenance. Manufacturing costs never silently
   become customer prices. Unknown stock remains unknown; checkout stays off.
6. Public-field/image allowlists and validation precede atomic JSON replacement.
   The operator reviews the diff/tests and publishes a separate static version.

Retries apply only to bounded transient/rate-limit reads. Permanent auth/schema
errors stop. This tool cannot create orders, change webhooks or confirm production.

## Saved cart

`caisik-shop-cart-v1` stores `{productId,variantId,quantity}` only. Current public
catalog data supplies names/price observations. Invalid/excessive records are
rejected; storage/quota failures are visible with an in-memory fallback. Storage
events and re-read-before-mutation handle sequential tab edits; simultaneous
writes remain last-writer-wins.

Historical estimates use integer minor units and separate currencies. Missing
variants/prices make totals incomplete. There is no server quote, reservation,
order or confirmation. Public checkout remains disabled.

## Implemented Stripe test-mode server flow

1. **Still required from the host:** authenticate the customer/order owner,
   resolve enabled variants and selling prices from a trusted merchant catalog,
   validate the delivery address and obtain a real Printful shipping quote.
   Browser-provided prices/payment flags are never accepted as authority.
2. `StripeCheckoutAdapter.calculateTax` verifies configured test-mode Tax
   settings/registrations and obtains a calculation. It freezes delivery address,
   currency, priced lines/quantities, sync-variant mapping, shipping, tax policy
   and total into a bounded-lived quote hash. Actual merchant configuration is
   not supplied or verified by this code's existence.
3. SQLite persists the immutable trusted order. Workflow Checkout creation loads
   that order, creates a hosted Session through official SDK 23.1.0/API
   `2026-10-28.endive` and durably binds its unique Session/quote. Only `rk_test_`/`sk_test_`
   keys/test-mode objects are accepted. Discounts, adjustable quantities and
   adaptive currency changes are disabled.
4. The raw Stripe snapshot signature is verified with the official SDK. Event
   identity and pending job are committed atomically before HTTP 200. Processing
   occurs in a separate leased worker, not in webhook delivery.
5. The worker freshly retrieves the exact Session, all product/variant lines,
   shipping/address/tax/total, PaymentIntent, captured charge and refund history.
   Signed event/redirect success alone is not payment evidence. A mismatch,
   refund/dispute/review or unavailable capture prevents drafting.
6. A durable reservation binds order, payment reference, payload hash and stable
   external ID. An atomic single-POST gate admits at most one Printful create
   attempt. The draft uses configured `sync_variant_id` and
   `confirm=false&update_existing=false`; ambiguous results reconcile by
   `GET /orders/@external_id`, never another blind create.
7. Pending/transient jobs receive bounded retries; exhausted/permanent failures
   enter a durable dead-letter state. Paid Printful confirmation, customer
   notification/refund/cancellation and a durable Printful status receiver remain
   unimplemented/unconnected. A draft is not paid fulfillment.

## Actual module contracts

| Module | Implemented | External/remaining dependency |
| --- | --- | --- |
| `printful.js` | Fixed origin/store; bounded timeout/JSON/read retries; `verifyStore`, `catalogSummary`, `shippingRates`, `lookupOrder`, draft-only `createDraft` | Real token/API verification. Shipping uses catalog `variant_id`; designs use `sync_variant_id`. No arbitrary request, confirmation/refund/cancellation/registration method. |
| `stripe.js` | Test-only official SDK; restricted/secret test keys, Tax/frozen quote, hosted Checkout/resume, session-reference recovery, fresh Session/PI/charge/refund checks, raw snapshot verification | Sandbox MCP reads are authenticated; runtime keys remain absent. Actual Tax settings are pending (missing head_office), registrations empty. Merchant policy/countries/tax codes and trusted order creation remain required. |
| `sqlite-repository.js`, `migrations/001-commerce.sql` | Private durable files, checksum migration, immutable orders, unique bindings, atomic inbox/jobs, leases/fencing and failure records | Node 24/private durable local filesystem; explicit startup migration; approved PII retention/anonymization still absent. Not a D1/Cloudflare adapter. |
| `stripe-workflow.js` | Server-order Checkout coordination, raw Request handler at `/api/stripe/webhook`, durable admission/worker and session-binding recovery | Actual router/host, business authentication/authorization, abuse controls, secrets and worker supervision. |
| `orders.js` | Draft service, deterministic bounded external ID, payload/hash/payment binding and internal state guard | SQLite supplies repository methods; Stripe supplies fresh verifier. Actual provider draft behavior remains unverified. |
| `webhooks.js` | Printful v2 raw HMAC-SHA256 verification, event normalization and newer-state reduction | Actual signed subscription/delivery plus a transaction-backed Printful event ledger/snapshot receiver. |
| `validation.js` | Bounded text/items, explicit-exponent decimal conversion and integer money totals | Syntax checks are not deliverability, trusted prices, merchant tax policy or payment verification. |

## SQLite migration, leases and recovery

Stripe plugin OAuth is a separate control-plane connection, not a credential
bridge into the Node runtime. Actual sandbox balance/Tax/registration and v1
endpoint reads are recorded in `PRINTFUL_TEST_RESULTS.md`. They do not mount a
webhook, inject a runtime key, verify the pinned SDK API version or test payment.
The runtime read-only preflight uses Tax settings to avoid requiring Balance Read
for a restricted application key; 401 and 403 return separate sanitized errors.

Filename must be absolute. Its direct parent must already be a non-symlink
private directory without group/other permissions. The DB must be a private
non-symlink regular file or is created mode 0600. Call `migrate()` before serving;
migration 001's checksum is checked on every startup. WAL, `synchronous=FULL`,
foreign keys and `BEGIN IMMEDIATE` protect local transactions. No request-time
schema creation occurs.

SQLite enforces unique order, Session, external order and provider payment
identities. `beginDraftAttempt` is a durable mutation gate. A safe initial lookup
failure can retry before the POST; once attempted/uncertain, only reconciliation
is permitted. A returned draft must match ID, recipient, shipping, items and
draft status. Failure cannot silently release the gate for another POST.

Available/expired jobs are claimed with a new random fencing token. Only the
current unexpired owner/token may complete/fail them. Attempts are capped at
five; retry backoff is bounded and exhausted jobs become `dead_letter`. There
is no lease-renewal method: provider/service timeout budgets must fit the chosen
lease (default five minutes, maximum fifteen). The host supervises/restarts
workers and exposes dead letters to an authorized operator.

A signed event may precede Session binding. Recovery retrieves the Session,
loads the immutable order by provider metadata and verifies/conditionally binds
the exact quote/Session before payment verification. After quote creation expiry,
recovery restores mapping only; it neither creates a new Session nor proves
payment. Stripe creation retains a stable idempotency key. Printful creation
uses external-ID reconciliation and the durable single-attempt gate.

`commerce_orders.order_json` contains customer address data and update/delete
triggers currently make it immutable. **Retention/anonymization is not
implemented.** An approved schema/data lifecycle, private backups/access controls
and monitoring are required before production customer data is stored.

## Webhook policy

Stripe needs an **account snapshot** destination pinned to
`2026-10-28.endive`, not a thin/Connect destination. SDK raw-byte signature
verification precedes durable admission. `checkout.session.completed` and
`checkout.session.async_payment_succeeded` enqueue payment work. Failed/expired
events are verified/ignored. An unpaid completion waits for a distinct
async-success event; fresh API reads remain authoritative. All four subscription
types and exact endpoint configuration are in `STRIPE_SETUP.md`.

Printful v1 notifications and v2 beta signing are different contracts. The v2
helper expects `X-PF-Webhook-Signature` as hex HMAC-SHA256, decodes the hex secret
and matches `X-PF-Webhook-Public-Key` and expected store. It rejects unsigned v1
payloads. Actual v1 order to signed v2 subscription compatibility remains
unverified. Inspect existing settings before replacing any webhook configuration.

Stripe normalized event identity/jobs are durable; raw customer payloads are
not persisted by its inbox. The Printful reducer still needs transactional
event-key uniqueness and snapshot persistence; tied/conflicting timestamps need
canonical API reconciliation. Neither kind of webhook confirms paid fulfillment.

## Release and rollback

Static version 31 stays unchanged for this backend-only follow-up. Backend
source is outside `dist/`; no Site migration or new public checkout is deployed.
A Node backend needs its own verified host, private durable directory, explicit
migration, backups and worker supervision. During rollback, pause work and
reconcile pending provider operations; never erase/downgrade the database or
replay uncertain creates. See `PRINTFUL_DEPLOYMENT.md` and `STRIPE_SETUP.md`.

Official contracts:
[Printful v1](https://developers.printful.com/docs/),
[Printful v2 beta](https://developers.printful.com/docs/v2-beta/),
[Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe webhooks](https://docs.stripe.com/webhooks),
[Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api).
