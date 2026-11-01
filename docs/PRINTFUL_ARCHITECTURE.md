# Commerce architecture

Updated: 1 November 2026. Native **Sites Worker + ASSETS + D1** version 37 is deployed.
V35 live catalog/shipping and nine-table schema are verified. V36 final UI-gate
release is deployed; final actual shipping/gate browser smoke passes. Shipping
works while the tax quote button stays disabled without payment configuration.
Overall integration is
PARTIALLY WORKING, not verified end-to-end commerce.

## Modules and trust boundaries

| Source | Responsibility |
| --- | --- |
| `server/worker.js` | Retained ASSETS plus same-origin catalog/status/shipping/quote/checkout/owner-order APIs and Stripe raw webhook |
| `live-catalog.js` | Fixed Printful host/store, bounded provider reads, expected-store membership, public-field/image allowlists and stable ID/legacy-SKU mapping |
| `catalog-cache.js` | Sanitized public catalog in D1, store-keyed 60-second TTL, lease/fencing and crash-safe fill; quote requests do not trust the public cache |
| `quote-service.js` | Fresh active/synced prices/variants, real shipping selection, approved country/tax policy and immutable guest-owned Stripe Tax quote |
| `d1-repository.js` | Async mandatory account/test-mode/store scope, D1 batch transactions, unique order/payment/session mappings, inbox/jobs, leases/fencing and rate limits |
| `fulfillment-sync.js` | Owner-scoped remote order/item mapping, multiple shipment projection, safe tracking links and monotonic compare-and-set persistence |
| `stripe.js` | Official SDK 23.1.0/API 2026-10-28.endive, Worker Fetch/Web Crypto, test Checkout/Tax and fresh Session/line/PI/capture/refund checks |
| `stripe-workflow.js`, `orders.js` | Session mapping/recovery, durable paid-order-to-draft coordination and single-POST reconciliation gate |
| `printful.js`, `webhooks.js` | Bounded shipping/draft/read adapter and separate signed-v2 event helper; no paid confirmation method |
| `http-security.js` | HMAC HttpOnly/Secure/SameSite guest ownership cookie, exact Origin and bounded body controls |
| `dist/shop/` | CZ/EN/FR product/gallery/cart, destination/rates, quote/pay gates and partial/multiple-tracking UI; no secrets or browser-authoritative prices |
| `db/schema.ts`, `drizzle/0000..0002` | Native schema-only migrations: base/immutability, fulfillment projection and public cache |

The maintained frontend stays under `dist/`; generated client/server output is
packaged through the Sites/Vite/Cloudflare build. Native binding is COMMERCE_DB;
repository `migrate()` checks schema only and never creates request-time tables.
The older Node SQLite repository is alternative/local test source, not the Site DB.

## Request / order flow

1. Public catalog reads provider data through a sanitized D1 cache. Actual native
   metadata shows a 60,000 ms TTL and no held lease. Full payload proof comes from
   HTTP/browser results, not the bounded database reader's truncated payload text.
2. Guest status creates/reads a seven-day HMAC possession cookie. Mutations
   require same Origin, bounded JSON and owner/network limits. This is guest
   ownership, not verified personal identity or durable account-login recovery.
3. Shipping/quote use a fresh request-local provider catalog, exact internal →
   sync/catalog variant mapping and provider rates. Browser amounts, historical
   sourcePrice, inventory guesses and paid flags never authorize payment.
4. Approved merchant policy and actual Stripe Tax freeze address, per-variant
   price/quantity, shipping, currency and total. D1 immutable order is owner-bound;
   Checkout loads it by ID and uses stable idempotency parameters.
5. Raw account snapshot signature is verified independently of runtime API-key
   construction. Actual endpoint is enabled, test mode, September contract; only
   completed/async-success candidates enter the scoped durable inbox/jobs.
   Pending work returns 503 for redelivery, not a false processing success.
6. Fresh Session/lines/shipping/address/tax/total, PI, captured charge and refund
   history must match. A redirect or signed event alone is not payment proof.
   Durable unique bindings/leases and single-POST gate prevent blind duplicate
   Printful creation. Ambiguous attempts only reconcile by external ID.
7. Created fulfillment is a **draft** with confirm=false. Owner order GET can
   refresh a linked remote order into a durable whitelisted multi-shipment
   projection. Monotonic provider timestamps and compare-and-set prevent older
   concurrent snapshots replacing newer data. The API exposes cached/stale/
   unavailable sync metadata separately from internal payment/draft state; the
   UI handles partial shipments and reconciliation. Explicit stale-age labelling
   in the UI remains incomplete. This path is implemented/tested, not verified on an actual
   linked paid order or real shipment progression.

## Actual evidence boundaries

Production browser catalog/cart/languages and real shipping are verified. A
separate low-level draft 184026933 was created/read back safely without a
payment, fake internal paid order, charge or production confirmation. It does
not prove steps 4–7 end-to-end. The test draft remains in Printful.

Actual connected Stripe account/Tax and enabled snapshot registration are known;
MCP authorization does not expose a runtime API key. Env revision 4 contains
masked Printful/session/webhook secrets and September webhook version. Runtime
Stripe key and approved merchant policy are absent, so checkout fails closed.
Outgoing SDK API remains October 28; snapshot version matches the actual
September 30 destination explicitly.

## Reliability / unfinished production work

The 227 focused cases distinguish fixture providers, real SQLite-backed D1
interfaces and provider-independent logic. Three additional tests execute the
actual generated Worker bundle under local workerd with isolated synthetic
outbound handlers/native D1. The cached second inbound request makes zero extra
synthetic Printful reads. These are distinct from actual production reads/schema.

The durable Printful event receiver/recovery candidate is implemented but awaits
native activation and real delivery. Automated notifications, customer refund/
cancellation initiation and full operational admin/recovery are incomplete.
Order-read projection is not a substitute for every background notification or
webhook workflow. Approved business identity/sender/service and retention policy
are dependencies; immutable order JSON stores addresses and cannot currently be
anonymized/deleted through an approved lifecycle. Resolve this before production
customer processing. No paid-confirmation method/live-charge release exists.

Preserve DB/provider state during rollback; never drop schema or reset uncertain
mutation gates. Version 37 is the preferred verified rollback for the continuation;
version 31 is an emergency static fallback. Preserve current D1/secrets in
either case. See `PRINTFUL_DEPLOYMENT.md`.

Verified v37 changes only frontend conditional live/fallback wording and its
CS/EN/FR translation/tests. Native APIs, Worker behavior, merchant policy,
historical price dates and cart actions are unchanged. Publication/copy smoke
passed for live CS/EN/FR detail; fallback coverage is DOM-fixture evidence. No
new backend or stale-age UI completion is implied.

## Prepared continuation: signed Printful event receiver

Candidate source adds `printful-webhook.js` (strict bounded raw-byte HMAC
verification/normalization), `printful-workflow.js` (durable processing/recovery),
and the Worker POST `/api/printful/webhook`. Runtime configuration is
`PRINTFUL_WEBHOOK_PUBLIC_KEY` (base64) and `PRINTFUL_WEBHOOK_SECRET_HEX` (raw hex
secret). No values belong in source/logs. The endpoint fails closed with 503
until configured; after validation it durably admits before processing.

Migration `0003_printful_inbox.sql` adds `commerce_d1_printful_events`,
`commerce_d1_printful_jobs` and `commerce_d1_printful_recoveries`. Fingerprints
exclude changing delivery retries. Scoped uniqueness, fenced claims, bounded
five-attempt retry/dead-letter handling and compare-and-set recovery prevent
uncontrolled replay. Only an existing created internal-to-Printful mapping is
eligible for fresh GET reconciliation; unknown/unmapped events are durably
ignored rather than imported as paid orders. No event creates/confirms an order
or establishes payment/refund/delivery. Existing projection handles safe status
and multiple tracking updates from authenticated fresh reads.

Authorized server-only requeue requires a trusted injected authorization check
and records actor hash/reason; bounded drain has no public admin route. A full
operator interface, scheduling/alerting and retention lifecycle are still gaps.
The standalone test draft has no internal paid mapping and must not be given a
fake one to make a webhook look complete.

This slice is prepared/tested, not yet deployed/registered or proven by actual
delivery. Current production remains v37/nine tables; the candidate migration
would add three tables. Preferred rollback for the next release is verified v37,
with v36 an older functional baseline and v31 emergency static fallback. Preserve
D1 data, provider state and uncertain mutation gates throughout rollback.
