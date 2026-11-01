# Printful / Stripe integration audit

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native **v38 / env5**
is deployed. Real Printful catalog/shipping, safe standalone draft and actual
signed webhook admission/durable unmapped classification are verified. Stripe
runtime API key and merchant policy are absent; checkout remains fail closed.
No real Stripe payment, internal paid-order linkage or full fulfillment workflow
has been verified. Earlier v35–v37 evidence below is explicitly dated history.

## Verified live behavior

- Real authorized Printful store read: HTTP 200, expected **18912189** exactly
  once among seven account stores. CLI and actual Node LivePrintfulCatalog reads
  both returned **20 products / 86 variants**, **83 active / 3 temporarily out of
  stock**, all retail currencies **EUR**. CLI observation timestamp:
  `2026-11-01T10:10:57.292386Z`.
- Production browser on v35 verified the actual live **20/86/83/3** catalog,
  product selection, cart persistence/quantity and CZ/EN/FR desktop behavior.
  Current-release real mobile viewport behavior remains **UNVERIFIED**.
- Actual v35 out-of-stock Faded Grey/L option could not add, and a second Printful
  gallery preview loaded at naturalWidth 800. V36 reports native status 200,
  checkoutAvailable:false and preserves cart quantity 1 after reload.
- Final v36 live API/browser smoke verifies mode printful-live, 20/86/83 active,
  current shipping rates and disabled tax-quote button after STANDARD selection.
  Test cart was then removed to zero and remained empty after reload. Actual D1
  internal orders/draft mappings both have zero rows; no fake paid order exists.
- Actual browser shipping for **OMERTA WITH EGO / Black / M × 1**, official
  US/California test destination: **STANDARD Flat Rate €8.39**, CO2 option
  **€8.47**. Earlier Node estimate for catalog variant 51734 × 1 was €4.69.
  These are distinct observed quotes, not fixed/global shipping prices.
- Native COMMERCE_DB now has **12 tables**, including Printful event/job/recovery,
  public catalog cache and fulfillment projection. Earlier observed cache metadata: store 18912189, **60,000 ms**
  TTL, lease NULL. The bounded row reader truncates payload text; no claim of
  parsing that truncated value is made. Browser API responses prove catalog counts.
- Real Printful draft **184026933**, external ID
  `UA_TEST_20261101_1a196badad6`, name **UA INTEGRATION TEST DRAFT ONLY**:
  created with `confirm=false`, then authenticated GET verified it remained
  `draft`. Item sync variant 5577001692 / catalog variant 51734 × 1.
  **No charge or production confirmation; the test draft remains in Printful.**
  This isolated provider proof did not create a fake internal paid order and
  does not verify the Stripe-to-draft workflow.
- Existing connected Stripe account is test mode; Tax settings and two active
  Czech registrations were read. The real four-event September snapshot endpoint
  is enabled in test mode and its masked secret/version are preserved at runtime
  revision 5 (originally configured at revision 4). Connector authorization is not a runtime Stripe API key.

## Component classification

Repository evidence: the retained frontend is authored HTML/CSS/browser ES modules
under `dist/`, with existing Three/MapLibre features. It is not a React/Next.js
migration. The backend is a Cloudflare ES-module Worker built by Vite 8.3.5 and
Cloudflare's Vite plugin 1.66.0, using Stripe SDK 23.1.0. Native Sites hosts ASSETS
and COMMERCE_DB; Drizzle 0.45.2/kit 0.31.11 describes the SQL migrations. Node
SQLite adapters are local/isolated alternatives. `.github/workflows/commerce.yml`
checks PRs; native Sites source save/deploy is a separate release pipeline.
There is no dedicated repository lint/typecheck script: syntax, Vite compilation,
Drizzle validation and the documented tests passed; this is not a claimed full
TypeScript/linter pass. Production diagnostics log bounded codes/route classes
and stack locations, without provider bodies or addresses.

| Component | Status | Verified scope / remaining limit |
| --- | --- | --- |
| Printful authentication / correct store | WORKING | Real authorized store membership, CLI and Node adapter reads |
| Production catalog / variants / prices / availability | WORKING for reads | Live browser 20/86/83/3; exact internal/sync/catalog IDs, actual SKU and retained legacy sourceSku; merchant selling/tax policy still needed |
| Desktop shop / cart / CZ-EN-FR | WORKING | Actual product/OOS/gallery/cart/language checks; v36 shipping-only quote gate and cleanup/reload pass |
| Mobile usability | UNVERIFIED current release | Prior v31 iframe evidence is historical; no new real mobile viewport acceptance |
| Shipping | WORKING for tested destinations | Actual browser and Node estimates; other destinations/methods require fresh rates |
| D1 schema / public cache | WORKING for observed scope | Twelve native tables after migration 0003; prior cache metadata and actual live responses; internal order/draft mappings remain empty |
| Quote / ownership / payment integrity | INCOMPLETE | Server-owned fresh pricing, guest ownership, Tax quote binding and fail-closed gates tested; runtime Stripe key/approved merchant policy absent |
| Stripe Checkout / real payment verification | BLOCKED | SDK test integration exists; no authorized actual test checkout/capture verified |
| Stripe webhook | INCOMPLETE | Actual enabled test endpoint/secret/version configured; raw signature/durable admission tested; no real signed delivery/payment workflow proved |
| Printful draft API | WORKING low-level | One real draft created/GET-verified safely; no Stripe payment or internal-order linkage |
| Durable fulfillment projection / multiple tracking | INCOMPLETE | Owner-scoped GET refresh, multiple shipments, monotonic CAS persistence and partial-tracking UI implemented/tested; no actual linked paid order or shipment progression |
| Printful webhook admission | WORKING for observed scope | Real signed order_updated durably ignored as unmapped, no fake paid record |
| Printful mapped reconciliation / recovery | INCOMPLETE | Fresh GET, fencing, bounded retries/dead letters and server-authorized recovery fixture-tested; no actual mapped paid-order progression/retry proved |
| Notifications / refund initiation / full operations | INCOMPLETE | Business/sender/retention decisions and complete production operations remain open |
| Paid Printful confirmation | MISSING intentionally | No confirmation method; paid production not authorized |
| Retention / customer-data lifecycle | INCOMPLETE | Immutable address-bearing order JSON lacks an approved retention/anonymization lifecycle |
| Build / tests / release | WORKING for recorded scope | 273 focused cases plus 3 isolated post-build bundle cases; v38/env5 deployed, PR #4 CI #16 succeeds |

## Root causes and repairs

Earlier static presentation and a broken external checkout were not a full
commerce backend. Account store verification and exact legacy-PF SKU migration
were corrected without replacing real identities. Native Worker failures then
revealed cache API behavior, wrong receiver on stored native Fetch and unsupported
Cloudflare `redirect:'error'`. Binding native Fetch correctly, using manual mode
with explicit redirect rejection, safe optional edge caching and durable D1
catalog caching resolved the v35 production catalog path. Versions 33–34 failures
are dated diagnostics, not the current catalog status.

V35 browser testing exposed a UI-only quote button enabled in shipping-only mode;
server quote/checkout still rejected it. The meaningful gate fix and regression
are committed/deployed as `b5d613845852a5e14d20f4a3072189726b84fada`, with UI/
shop/cart/build/release/native-bundle checks passing. V36 native publication
succeeded at `2026-11-01T10:53:43.921359+00:00` (UTC); final shipping/gate browser
smoke passed at 10:54 UTC. Exact native IDs are in DEPLOYMENT. V36's dated bounded
Worker error query returned zero events, subject to window/ingestion limits.

Immediate owner inputs: secure runtime **STRIPE_SECRET_KEY** test key and reviewed
**COMMERCE_POLICY_JSON**. No new Printful token, webhook secret, hosting account
or mandatory NAS recovery is needed. Further notification/retention work requires
approved business identity, sender/service and retention policy; do not invent them.

## Verified v37 frontend copy correction

An actual v36 product-detail UX defect retained obsolete wording that the
original store must be restored/prices checked there and all variants were only
saved data, even when live Printful data was loaded. Source
`a57f86b285a0aae0d156b5ad501b203078095920` fixes only eight frontend/translation/
test files: conditional live/fallback detail/footer copy in CS/EN/FR. Native
cart action and dated prices remain unchanged; no backend/payment configuration
changes. Six DOM scenarios cover live/fallback in all three languages, and UI/
shop/cart/language/build/release checks pass (2,942 matching keys per language).
V37 native deployment succeeded at `2026-11-01T11:02:50.549892+00:00` (UTC),
env4. Actual API is printful-live/verified true, 20 products/86 variants, 83 active, checked
`2026-11-01T11:03:03.836Z`. Actual visible CS/EN/FR detail after dictionary load
shows server recheck/availability-at-load wording, no obsolete disabled external
CTA, and retains Add/Open Cart actions. Six fallback/live DOM scenarios are
fixture coverage, not a claim of forced production fallback. No backend change.
CI #14 passes at GitHub `d3d9adba105d5432c319f796fa7781554c78cc9e`.
Actual final status is HTTP 200/test/catalog+shipping true/checkout false;
cart 0/live20 collection and closed CZ modal are confirmed. The dated v37 11:04 UTC
bounded error query returns three ancillary static404 events (favicon/sitemap/
robots), outcome ok, with no commerce_request_failed/API failure in its window.
This is not a zero-error query; v36 zero events remain dated earlier evidence.
V37 is the preferred verified rollback for the continuation; v31 is emergency static.

Exact configured Printful-credential scan across 533 source/public text files
returned zero matches at 10:55 UTC, without printing the value. This is bounded
text evidence, not a universal secret/history audit.
Actual collection screenshot: [PRINTFUL_SHOP_VERIFIED.jpg](evidence/PRINTFUL_SHOP_VERIFIED.jpg).

References: [Printful v1](https://developers.printful.com/docs/),
[Printful v2 beta](https://developers.printful.com/docs/v2-beta/),
[Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe webhooks](https://docs.stripe.com/webhooks),
[Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api).

## Verified v38: signed Printful event admission

Source `53617e2a9d04d38d06a2f6f06af4053316d94095` is deployed as native
**v38 / env5**. Migration `0003_printful_inbox.sql` is applied: actual
COMMERCE_DB has **12 tables**, including the three dedicated Printful inbox,
job and recovery-audit relations. Two new signing values are stored as masked
runtime secrets; existing Printful/session/Stripe webhook settings are preserved.
STRIPE_SECRET_KEY and COMMERCE_POLICY_JSON are still absent.

Fresh v1/v2 reads confirmed empty configuration before one v2 registration of
16 order/shipment event types to `/api/printful/webhook`. Authenticated readback
verified the destination at `2026-11-01T18:08:04.595168Z`. The actual signing-key
values are not report artifacts. A recipient test-name metadata-only PUT to
existing unconfirmed draft **184026933** used `confirm=false`; authenticated GET
at `2026-11-01T18:09:04.099847Z` confirmed the same external ID
`UA_TEST_20261101_1a196badad6`, sync variant 5577001692 × 1, still draft.
No charge, production confirmation or new test order was created.

A real provider `order_updated` event occurred at `2026-11-01T18:08:58Z` and
passed the deployed raw-byte signature/public-key/store verifier. D1 received it
at epoch milliseconds `1793556539373`, fingerprint
`3a118364d4cbf744cbc3e88317ee5dfe9a6a3620196b8f0196389c06fb82d08d`.
Its durable job is **ignored**, attempts **0**, reason
**PRINTFUL_UNMAPPED_ORDER**. This terminal path returns HTTP 200 by code; the
persisted record is the delivery evidence, not a log inference or fabricated
external HTTP trace. Internal order and draft-mapping tables remain empty.

This proves **real draft update → signed callback → verified durable admission
and safe unmapped classification**. It does not prove paid-order linkage,
mapped fresh-GET reconciliation, retry/dead-letter operation on a real order,
shipment progression or the complete Stripe workflow. Those paths have isolated
fixture/database coverage. Events never create/confirm orders or infer payment,
refund or delivery. Overall remains **PARTIALLY WORKING**.

The v38 browser shows the actual 20-product live collection in CZ; status
reports catalog/shipping available and checkout unavailable. A fresh catalog GET
first returned 503 CATALOG_REFRESH_PENDING during the D1 single-fill lease. One
reload succeeded with checkedAt `2026-11-01T18:10:24.869Z`: 20 products, 86 variants,
83 active / 3 temporarily out of stock, EUR, full sync and no removed entries.
This does not prove every initial request succeeds immediately; bounded UI
retry/visible fallback recovery is a narrow follow-up. Real mobile viewport
acceptance remains UNVERIFIED. Its bounded 15-minute
Worker error query returned only two favicon404 events, with no returned commerce
errors; ingestion/window limits apply. This is not callback-delivery proof.
