# Sites commerce Worker

Updated 1 November 2026. Supported hosting is native **Sites Worker + ASSETS +
D1**, not a required external Node/NAS service. `server/worker.js` serves APIs;
non-API traffic retains the existing frontend via ASSETS. The candidate build
passes, but native publication/migration/production smoke are still pending.
Public production remains static version 31 until the release record is updated.

## Modules and boundaries

| Module | Responsibility |
| --- | --- |
| `live-catalog.js` | Fixed Printful origin/store, bounded reads, expected-store membership among account stores, stable merchandising mappings, exact legacy SKU aliases and public preview whitelist |
| `quote-service.js` | Fresh active/synced variant price/currency mapping, actual shipping method, approved merchant tax codes/countries and immutable owner-bound Stripe Tax quote |
| `http-security.js` | HMAC HttpOnly/Secure/SameSite guest cookie, exact Origin checks and bounded bodies; cookie possession establishes guest order ownership |
| `d1-repository.js` | Async mandatory account/mode/store scope in all business operations, atomic batches/conditional claims, inbox/jobs, leases/fencing, mutation gate and rate limits |
| `stripe.js` | Official SDK 23.1.0/API 2026-10-28.endive, Worker Fetch/Web Crypto, test-only hosted Checkout/Tax, raw snapshot admission and fresh Session/PI/capture/refund verification |
| `stripe-workflow.js`, `orders.js` | Session binding/recovery, leased payment-to-draft work, stable external ID, unique payment binding and single-POST gate |
| `printful.js` | Store verification, bounded read retries/shipping and draft-only create/reconciliation; no paid confirmation, cancellation/refund/registration method |
| `webhooks.js` | Separate signed Printful v2 normalization/reducer helper; durable receiver/subscription/tracking is not connected |
| `sqlite-repository.js` | Alternative/local Node storage/test implementation; not the native Worker database |

Source manifest declares `COMMERCE_DB` and omits static hosting. Deployment uses
`db/schema.ts` and `drizzle/0000_commerce.sql` +
`drizzle/0001_commerce_immutability.sql`. D1 repository `migrate()` checks installed
schema only; it never executes request-time DDL. Do not apply the older
`d1-migrations/` file as a competing migration chain. Native D1 migration remains
pending despite passing SQLite-backed D1-interface tests.

## Routes / flow

`/api/commerce/catalog` exposes only sanitized public data (up to 60-second edge
cache). Status establishes guest/session readiness. Same-origin POST shipping,
quote and checkout accept IDs/quantities/address or owner-bound order ID, never
browser prices/paid flags. Orders are owner-scoped, including by-session lookup.
Quote uses a new request-local live catalog rather than the edge/public cache.
D1 owner/network limits and bounded bodies protect mutations.

`/api/stripe/webhook` verifies original account snapshot bytes with the SDK and
actual endpoint secret before durable queue admission. Signature verification is
keyless with respect to the runtime Stripe API key: valid events may be retained
while payment config is unavailable, with HTTP 503 for pending redelivery. Worker
processing is awaited; `waitUntil` alone is not the recovery guarantee. Fresh
Session/lines/address/tax/total/PI/charge/refund reads still decide payment truth.

Single-POST gate survives lease expiry/crashes. Initial safe reads may retry;
once Printful creation is attempted/uncertain, only external-ID reconciliation
is allowed. Every created order is a draft with `confirm=false`; paid production
confirmation is not implemented or authorized. Printful merchant refunds do not
automatically refund customer Stripe payments.

## Actual connected evidence / missing config

Real Printful auth/store/full sync succeeded: 20 products/86 variants, 83 active/
3 temporarily unavailable, all EUR, checked 2026-11-01T10:10:57.292386Z. One actual
official-test-destination shipping estimate succeeded; no orders were created.
Masked Printful/session secrets are configured at Sites revision 2.

Existing Stripe test account/Tax settings and two active Czech registrations were
read through the connector. That is not a runtime API-key grant. Runtime
`STRIPE_SECRET_KEY`, actual `STRIPE_WEBHOOK_SECRET` and approved
`COMMERCE_POLICY_JSON` remain absent; checkout fails closed. No new hosting
account/NAS recovery is a mandatory dependency. Never print credentials or
customer payloads. Exact configuration is in `docs/STRIPE_SETUP.md` and
`docs/PRINTFUL_SETUP.md`.

## Tests and unfinished work

56 Stripe-related cases pass (SDK/fixture providers + real Node SQLite); 86
Worker cases pass (20 SQLite-backed D1 shim, 17 quote, 22 live catalog, 27 HTTP).
Original provider/importer/UI/language checks are separate. Managed Miniflare
hung; neither shim tests nor a prepared build prove native D1/production behavior.

Native migration/deploy/smoke, actual authorized Stripe test payment/webhook and
one Printful draft remain unverified. Customer refund/cancellation initiation,
Printful status/tracking receiver, notifications and operational admin handling
remain incomplete. Immutable D1 order JSON stores addresses and forbids update/
delete; approved retention/anonymization is not implemented. Preserve DB/provider
state during rollback and never reset uncertain mutation gates.
