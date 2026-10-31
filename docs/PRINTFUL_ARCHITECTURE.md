# Printful architecture and operational boundaries

Updated: 31 October 2026 (Europe/Paris). This describes the inspected application
and isolated code additions. It is not a claim that a production commerce
backend, payment flow or durable order pipeline is connected.

## Current deployed application

`dist/` is the maintained static application. `.openai/hosting.json` retains the
existing public Sites project and `static.directory: dist`. Atlas, Blackbook,
Alchemy/Frequency tools, Selfmade, routes, artwork and existing local user data
remain independent of commerce. The Site has no configured commerce database or
runtime secrets.

| Code/data | Responsibility | Trust boundary |
| --- | --- | --- |
| `dist/shop/index.html`, `shop.css`, `shop.js` | Catalog grid, filtering, accessible product dialog/gallery, size/color selection, saved cart UI | Public browser code; cannot authenticate providers, validate payable totals or create fulfillment |
| `dist/shop/catalog.json` | Public product snapshot with stable internal/Printful mapping | Observation data, not live stock or a delivered-price quote |
| `dist/catalog.json` | Original dated source catalog evidence | Preserve historical identities/prices; do not silently refresh dates |
| `dist/shop/source-commerce.js` | Validate historical source prices and exact original product/variant URLs | Fixed original host/handle; diagnostics are not an active checkout |
| `dist/shop/cart.js` | Versioned device-local variant IDs and quantities, bounded parsing and storage recovery | No address/card/order data, payment authority or server inventory reservation |
| `tools/sync-printful.py` | Explicit administrator-run read-only import | Token only in process environment; API allowlist, TLS, no redirects, bounded responses/retries, atomic public export |
| `server/commerce/` | Reusable provider/validation/order/webhook safety helpers | Server-only source, outside `dist/`; disconnected from HTTP hosting and durable storage |
| `docs/i18n/*-translations.json`, `tools/build-languages.py` | Translation source and generator for CZ/EN/FR | Original product names, SKUs and user text are not translated into invented data |

The exact original commerce host is
`https://hiphop.caisik.i234.me/dk/`. Historic public data resembled Medusa; its
private implementation and payment provider remain unknown. The currently
observed Synology not-found page is an external deployment failure, not evidence
that a new backend should be silently substituted.

## Catalog synchronization

1. The administrator supplies a store-scoped credential to the Python process.
   The importer authenticates `GET /stores` and checks expected store
   `18912189` before fetching products. This ID is a historical expected
   identity until verified by a real authenticated response.
2. Manual/API stores use v1 `/store/products`; ecommerce platform stores use
   `/sync/products`. The operator must establish the existing type before
   choosing `--platform`. The importer never creates another store.
3. A full scan lists bounded pages and retrieves details. Explicit
   `--product-id` refreshes only selected products and preserves other records
   with their original observation dates. An incremental result does not claim
   to verify the whole current store.
4. Existing public IDs, handles, merchandising names, categories and approved
   local images are retained. Conflicting SKU/catalog-variant identity changes
   stop the import. Removed/unconfigured/unavailable identities are recorded
   explicitly; a genuine empty full catalog is represented accurately.
5. Original-store `sourcePrice` remains dated evidence. Printful retail-price
   and availability observations have separate fields/provenance. Manufacturing
   costs never silently replace customer prices; unknown availability remains
   unknown. No catalog export enables checkout.
6. Only public product data and allowlisted previews are serialized. The final
   JSON replaces the prior file atomically only after validation. The operator
   reviews the diff/tests and publishes a separate Sites version.

GET retries are bounded and apply to transient/rate-limit failures. Permanent
authorization/schema failures stop. The importer cannot create orders, configure
webhooks or confirm fulfillment. It is not a scheduled production worker.

## Saved cart

`caisik-shop-cart-v1` stores only `{productId, variantId, quantity}` lines in a
versioned browser-local record. Product/variant descriptions and price
observations are resolved from the current public catalog. Malformed/excessive
records are rejected, and quota/storage failures are visible with an in-memory
fallback. Sequential cross-tab edits re-read storage and receive storage events;
this is not a distributed transaction or simultaneous-edit merge guarantee.

Historical estimate totals use integer minor units and remain separated by
currency. Missing/removed variants or prices make the estimate incomplete. There
is no server quote, stock reservation, order number or customer confirmation.
The disabled checkout explains the missing verified backend/provider connection.

## Required original-backend integration

This flow is the acceptance contract for reconnecting the actual backend, not an
implemented production topology:

1. Browser sends only known variant IDs, quantities and a validated delivery
   address to an authenticated/rate-limited checkout service.
2. Server re-resolves enabled variants and selling prices from trusted merchant
   records, validates currency, obtains current shipping methods and calculates
   customer tax using the merchant's configured tax service/rules.
3. Payment is created through the existing provider's authorized test/live mode.
   A redirect success page is never sufficient payment verification.
4. Verified server-side payment evidence and the internal order are persisted
   transactionally with an idempotent fulfillment job. Order/payment/event
   uniqueness is enforced by durable storage, not process memory.
5. The job creates a Printful **draft** with mapped `sync_variant_id` items,
   `confirm=false` and a stable unique `external_id`. After an ambiguous result,
   it reconciles `GET /orders/@external_id` before considering another create.
6. A successful draft is mapped to the internal order. It is not paid
   fulfillment. Confirmation can charge the merchant and requires separate
   authorization and a verified release gate.
7. Authenticated notifications and API reconciliation update canonical order
   states/tracking. A webhook is durably recorded/deduplicated before processing;
   old events cannot regress confirmed newer state. Transient failures enter a
   bounded retry queue; exhausted jobs enter an inspectable failed-job queue.
8. Cancellation/refund coordinates the actual payment-provider transaction,
   internal order and fulfillment cancellation. A Printful merchant refund is
   not automatically a refund of the customer's payment. Notifications expose
   only customer-authorized order data.

The repository's isolated helpers support parts of that contract, but no HTTP
handler, database adapter, transaction/outbox, deployed queue, administrative
screen, mail delivery or payment-provider adapter is connected. They must not be
called production-ready merely because fixture tests pass.

### Server helper contracts actually present

| Module | Implemented boundary | Required dependency/limit |
| --- | --- | --- |
| `server/commerce/printful.js` | `verifyStore`, paginated `catalogSummary`, read-only `shippingRates`, `lookupOrder`, draft-only `createDraft`; fixed origin/store, bounded JSON/timeouts/retries and redacted diagnostics | Needs a real token and verified API responses. Shipping uses catalog `variant_id`; configured draft items use `sync_variant_id`. No arbitrary request, confirmation, cancellation, refund or registration method exists. |
| `server/commerce/orders.js` | `DraftOrderService`, deterministic bounded external order ID, payload-hash matching and internal state-transition guard | Injected `getOrder`, atomic/durable `claimDraft`, conditional `markDraftCreated`, durable `recordDraftFailure` and real provider `verifyPayment` are mandatory. No storage/verifier implementation is connected. |
| `server/commerce/webhooks.js` | Verify original v2 raw bytes/key/store; normalize supported events; derive retry-stable event keys and reduce newer order/shipment states | Unique event-key insertion and snapshot persistence must share a DB transaction. Tied/conflicting event timestamps require API reconciliation. Only events verified by the helper enter its reducer. |
| `server/commerce/validation.js` | Bounded fields/items, currency syntax, explicit-exponent decimal-to-minor conversion and integer totals | Syntax checks are not country/address deliverability validation, authoritative merchant pricing, payment verification or customer tax calculation. |

The order repository must enforce unique order ID, external ID and provider
payment reference at the database level. An existing/uncertain reservation can
only reconcile; the helper does not release it for another blind POST. A remote
draft must match its ID, recipient, items, shipping and draft status. Actual
provider address/response normalization requires live verification. See
`server/commerce/README.md` for the exact adapter contract.

## Webhook policy

Use the actual configured provider/version's documented event schema. v1
Printful webhook configuration and v2 beta signing have different contracts.
Inspect existing settings before any replacement; do not steal notifications
from an existing integration. Signature verification uses the original raw
request bytes and the exact configured key/header contract. Unknown or malformed
events cannot create or pay an order.

The present v2 helper expects `X-PF-Webhook-Signature` as hexadecimal HMAC-SHA256,
decodes the configured hexadecimal secret key and matches
`X-PF-Webhook-Public-Key`. It does not accept unsigned v1 payloads. Actual v1
order creation to signed v2 subscription compatibility has not been demonstrated
for this account and must be checked with real delivery before use.

Production needs durable event uniqueness, raw-payload access controls/retention,
canonical API reconciliation and payment verification. An in-memory test store
is only a fixture. Authentication helper success is not evidence of real
webhook delivery or a correctly registered endpoint.

## Release and rollback

Static SHOP changes can be validated/published independently while checkout
stays disabled. Server-only helpers are not included in the static site. Preserve
the existing Site audience and identity. Roll back with the exact previously
deployed saved version; never erase browser notes/cart records as a deployment
step. Backend migrations/order processing require their own verified deployment
and rollback after access is available. See `PRINTFUL_DEPLOYMENT.md`.

Official contracts:
[API v1](https://developers.printful.com/docs/) and
[API v2 beta](https://developers.printful.com/docs/v2-beta/).
