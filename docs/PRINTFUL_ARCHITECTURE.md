# Commerce architecture

Updated: 1 November 2026. Candidate hosting is **Sites Worker + ASSETS + D1**;
public production remains version 31 until deployment evidence is appended.
Stripe is the confirmed payment provider. The supported native hosting path does
not require a new NAS/Node host or another hosting account.

## Source map

| Source | Responsibility |
| --- | --- |
| `server/worker.js` | Same-origin catalog/status/shipping/quote/checkout/order APIs and Stripe webhook; ASSETS serves all retained non-API routes |
| `server/commerce/live-catalog.js` | Fixed Printful origin/store; full live product reads, public sanitization, exact merchandising/SKU alias mapping; request-local quote cache |
| `server/commerce/quote-service.js` | Fresh trusted variants/prices, address/country/currency validation, real shipping selection, approved tax codes, frozen Stripe Tax quote and owner-bound order |
| `server/commerce/d1-repository.js` | Async account/mode/store-scoped persistence, atomic D1 batches/claims, inbox/jobs, leases/fencing, mutation gate and rate counters |
| `db/schema.ts`, `drizzle/0000_commerce.sql`, `0001_commerce_immutability.sql` | Schema-only deployment migrations, constraints/indexes and immutable-order triggers |
| `server/commerce/stripe.js` | Official SDK 23.1.0/API 2026-10-28.endive; Worker Fetch client/Web Crypto signatures, test Checkout/Tax and fresh captured-payment/refund verification |
| `server/commerce/stripe-workflow.js`, `orders.js` | Session binding/recovery, durable payment-to-draft work and unique single-POST/reconciliation behavior |
| `server/commerce/printful.js`, `webhooks.js` | Read-only shipping, draft-only Printful adapter and separate signed-v2 event reducer helper |
| `server/commerce/http-security.js` | HMAC guest ownership cookie, exact same-Origin checks and bounded body handling |
| `dist/shop/` | Catalog, variants/gallery/cart plus CS/EN/FR address/shipping/quote/pay/status UI; no provider secrets or authoritative client prices |
| `scripts/build-commerce-worker.mjs`, `scripts/commerce-vite.config.ts` | Sites/Vite/Cloudflare Worker packaging with byte-preserved frontend ASSETS |

The earlier Node SQLite repository remains local/alternative test source. It is
not the deployed Worker database. Native hosting uses binding `COMMERCE_DB`.
`D1CommerceRepository.migrate()` checks installed schema readiness only; it never
executes request-time DDL. Deployment applies the two tracked Drizzle migrations.
The legacy `server/commerce/d1-migrations/` file is not the active migration chain.

## HTTP contract

| Route | Behavior / boundary |
| --- | --- |
| `GET /api/commerce/catalog` | Sanitized live public catalog; edge response may cache 60 seconds |
| `GET /api/commerce/status` | Creates/reads guest cookie and reports actual configuration/schema readiness; never enables checkout from browser claims |
| `POST /api/commerce/shipping` | Known variant IDs/quantities + destination; freshly verifies availability/currency and obtains actual Printful rates |
| `POST /api/commerce/quote` | Fresh merchant-approved variant prices, shipping and Stripe Tax; persists immutable owner-bound quote/order |
| `POST /api/commerce/checkout` | Accepts only order ID, checks guest ownership and loads authoritative persisted quote before hosted Stripe Session |
| `GET /api/commerce/orders/{id}` or `/by-session/{session}` | Owner-scoped minimal state; another guest cannot fetch the order |
| `POST /api/stripe/webhook` | Raw snapshot SDK verification, durable admission and awaited/retryable processing; never trusts a redirect as payment |

The guest cookie `__Host-ua-commerce` is HMAC signed, HttpOnly, Secure,
SameSite=Strict and seven-day bounded. Its nonce hash owns quotes/orders; this
is guest possession, not a verified personal identity or account-login system.
Mutations require exact Origin/JSON and reject cross-site requests. D1 limits
owner quote/shipping and checkout attempts plus a secret-salted network hash;
provider payloads, addresses and raw network identifiers are not logged.

## Data / payment flow

1. Administrator full sync and live server reads verify store 18912189 among
   account stores. Actual sync IDs map to retained internal IDs; real SKU replaces
   only a documented `PF-…` alias preserved as `sourceSku`. Original source-price
   dates remain historical; no manufacturing-cost/stock values are invented.
2. Public catalog may cache briefly, but each quote request constructs a fresh
   `LivePrintfulCatalog`. Price/currency, active/synced status and exact variant
   mapping come from authenticated provider reads, not browser snapshot amounts.
3. The guest submits IDs/quantities/address only. Shipping aggregates blank catalog
   `variant_id`; configured designs retain `sync_variant_id`. Merchant policy
   supplies approved exclusive-price treatment, EUR exponent, allowed countries
   and product/shipping tax codes. Tax readiness checks actual Stripe settings/
   registrations; frozen quote binds address, each line/variant, currency and total.
4. D1 stores the immutable quote/order under connected Stripe account + test mode
   + Printful store scope. Every business key/query/join is scoped. Unique Session,
   payment/external-ID bindings, conditional writes and transactional batches
   prevent cross-account/mode/store collisions and duplicate admission.
5. Checkout uses stable SDK idempotency parameters and returns a validated hosted
   Stripe URL. Fresh Session/all lines/shipping/address/tax/total, PaymentIntent,
   captured charge and refund history must match before any draft is permitted.
6. A durable draft reservation and single-POST gate survive lease expiry/crashes.
   Safe reads can retry; an ambiguous attempted Printful create only reconciles
   `GET /orders/@external_id`, never blindly repeats POST. The order is a draft
   (`confirm=false`), not authorized paid production.
7. Signed Stripe events are admitted without requiring a runtime API key first.
   When actual endpoint signing secret/D1 are available but payment config is not,
   valid work stays pending and HTTP 503 requests redelivery. Processing is awaited;
   `waitUntil` alone is not the recovery mechanism. Leases/fencing, bounded retry
   and dead-letter state are durable. No standalone recurring worker is claimed.

Stripe only accepts test keys/test-mode objects and account snapshot events at
API `2026-10-28.endive`. Supported events: completed, async payment succeeded,
async payment failed and expired Checkout Sessions. Only paid-work candidates
queue; fresh API reads remain authoritative. Payment keys and policy are absent
now, so checkout fails closed.

## Remaining boundaries

Actual D1 migration/Worker publication and production smoke are pending. The
D1-interface tests use real SQLite behind a D1 shim; they are not Miniflare or
hosted D1 evidence. The managed Miniflare attempt hung and remains unverified.
Actual test Checkout, Stripe destination delivery and Printful draft are not
verified. Paid Printful confirmation is not implemented or authorized.

Printful v2 HMAC/event reduction is a helper, not a mounted durable receiver;
status/tracking/notifications, customer refund/cancellation initiation and admin
operations remain incomplete. Immutable D1 order JSON contains customer address
data and forbids update/delete; retention/anonymization is not implemented.
Resolve that lifecycle before production customer processing. Preserve D1 data
and reconcile uncertain mutations during rollback; see `PRINTFUL_DEPLOYMENT.md`.
