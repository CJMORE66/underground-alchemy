# Commerce architecture

Updated: 1 November 2026. Native **Sites Worker + ASSETS + D1 v39 / env5** is
deployed with 12 observed tables and preserved actual signed Printful event
admission from v38.
Catalog/shipping work; Stripe key/policy are absent and checkout fails closed.
Overall **PARTIALLY WORKING**, not verified end-to-end commerce.

## Modules and trust boundaries

| Source | Responsibility |
| --- | --- |
| `server/worker.js` | Retained ASSETS plus same-origin catalog/status/shipping/quote/checkout/owner-order APIs and separate Stripe/Printful raw webhooks |
| `live-catalog.js` | Fixed Printful host/store, bounded provider reads, expected-store membership, public-field/image allowlists and stable ID/legacy-SKU mapping |
| `catalog-cache.js` | Sanitized public catalog in D1, store-keyed 60-second TTL, lease/fencing and crash-safe fill; quote requests do not trust the public cache |
| `quote-service.js` | Fresh active/synced prices/variants, real shipping selection, approved country/tax policy and immutable guest-owned Stripe Tax quote |
| `d1-repository.js` | Async mandatory account/test-mode/store scope, D1 batch transactions, unique order/payment/session mappings, inbox/jobs, leases/fencing and rate limits |
| `fulfillment-sync.js` | Owner-scoped remote order/item mapping, multiple shipment projection, safe tracking links and monotonic compare-and-set persistence |
| `stripe.js` | Official SDK 23.1.0/API 2026-10-28.endive, Worker Fetch/Web Crypto, test Checkout/Tax and fresh Session/line/PI/capture/refund checks |
| `stripe-workflow.js`, `orders.js` | Session mapping/recovery, durable paid-order-to-draft coordination and single-POST reconciliation gate |
| `printful.js`, `webhooks.js` | Bounded shipping/draft/read adapter and separate signed-v2 event helper; no paid confirmation method |
| `printful-webhook.js`, `printful-workflow.js` | Worker raw-byte HMAC/store validation, durable admission, mapped fresh-GET reconciliation and server-authorized recovery |
| `http-security.js` | HMAC HttpOnly/Secure/SameSite guest ownership cookie, exact Origin and bounded body controls |
| `dist/shop/` | CZ/EN/FR product/gallery/cart, destination/rates, quote/pay gates and partial/multiple-tracking UI; no secrets or browser-authoritative prices |
| `db/schema.ts`, `drizzle/0000..0003` | Native schema-only migrations: base/immutability, fulfillment projection/public cache and Printful event/job/recovery audit |

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
MCP authorization does not expose a runtime API key. Env revision 5 preserves
masked Printful/session/Stripe webhook secrets and September webhook version;
the two Printful signing secrets are now configured too. Runtime
Stripe key and approved merchant policy are absent, so checkout fails closed.
Outgoing SDK API remains October 28; snapshot version matches the actual
September 30 destination explicitly.

## Reliability / unfinished production work

The 273 focused cases distinguish fixture providers, real SQLite-backed D1
interfaces and provider-independent logic. Three additional tests execute the
actual generated Worker bundle under local workerd with isolated synthetic
outbound handlers/native D1. The cached second inbound request makes zero extra
synthetic Printful reads. These are distinct from actual production reads/schema.

The durable Printful receiver is activated: an actual signed draft-update event
was safely recorded as unmapped. Mapped processing/recovery has fixture coverage
and awaits actual linked-order acceptance. Automated notifications, customer refund/
cancellation initiation and full operational admin/recovery are incomplete.
Order-read projection is not a substitute for every background notification or
webhook workflow. Approved business identity/sender/service and retention policy
are dependencies; immutable order JSON stores addresses and cannot currently be
anonymized/deleted through an approved lifecycle. Resolve this before production
customer processing. No paid-confirmation method/live-charge release exists.

Preserve DB/provider state during rollback; never drop schema or reset uncertain
mutation gates. Version 38 is the preferred receiver-capable rollback;
version 31 is an emergency static fallback. Preserve current D1/env5 secrets in
either case. V37 has no receiver: prefer a receiver fix-forward; otherwise
provider delivery retries must be reconciled as described in DEPLOYMENT. See `PRINTFUL_DEPLOYMENT.md`.

Verified v37 changes only frontend conditional live/fallback wording and its
CS/EN/FR translation/tests. Native APIs, Worker behavior, merchant policy,
historical price dates and cart actions are unchanged. Publication/copy smoke
passed for live CS/EN/FR detail; fallback coverage is DOM-fixture evidence. No
new backend or stale-age UI completion is implied.

## Printful event path: activated v38, retained in v39

`printful-webhook.js` validates bounded original bytes using Worker Web Crypto
HMAC, configured base64 `PRINTFUL_WEBHOOK_PUBLIC_KEY`, raw-hex
`PRINTFUL_WEBHOOK_SECRET_HEX` and expected store 18912189. Both actual values are
masked in env5; missing configuration still fails closed with 503. The v2
registration covers 16 order/shipment events. Original-byte verification is
followed by durable admission before processing; GET is METHOD_NOT_ALLOWED.

Applied migration 0003 adds `commerce_d1_printful_events`,
`commerce_d1_printful_jobs` and `commerce_d1_printful_recoveries`. Fingerprints
exclude changing delivery retries. Scoped uniqueness, fenced leases, at most
five attempts/dead letters and compare-and-set recovery bound replay. Only an
existing created internal-to-Printful mapping allows fresh GET reconciliation;
unknown/unmapped events are durably ignored. No callback creates/confirms an
order or establishes payment/refund/delivery. Server-only requeue requires a
trusted authorization check and actor-hash/reason audit; drain is bounded with
no public admin route. Full operator UI, scheduling/alerts and retention remain
unfinished.

Actual v38 proof is the signed `order_updated` callback from a safe metadata-only
update to the existing unconfirmed draft. Its durable job is ignored with
attempts 0 / PRINTFUL_UNMAPPED_ORDER because no internal paid mapping exists.
That is correct admission behavior, not mapped reconciliation or payment proof.
Internal orders/draft mappings remain empty. Exact durable fingerprint/release
records are in TEST_RESULTS/DEPLOYMENT. No fake paid mapping was introduced.

## V39 catalog UI recovery

The server/receiver/schema/env5 are retained from v38. Only authored shop.js
changes: retry only CATALOG_REFRESH_PENDING, up to three total automatic attempts
at 300/600 ms, then an accessible labelled fallback/manual-retry control. Abort/
destroy cancels recovery; authentication failures do not enter retries. DOM
fixtures cover pending-to-live, cap/manual action and CZ/EN/FR behavior. Actual
v39 shows live20, persistent quantity1 and checkout false. It does not guarantee
all provider refreshes succeed automatically or complete stale-age labelling,
mobile acceptance, payment or fulfillment operations.
