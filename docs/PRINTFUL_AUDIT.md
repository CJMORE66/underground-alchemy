# Printful / Stripe integration audit

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native version 37 is
deployed and its live API/CS-EN-FR product-detail copy are verified. Prior v35/36
provider, shipping, status/cart and quote-gate proofs remain valid dated evidence.
A real standalone Printful
draft was created and read back safely. Stripe Checkout/payment verification and
the full paid-order workflow remain blocked/unverified. V36 final actual shipping/
quote-button gate smoke passed at 10:54 UTC: shipping works, tax quote remains
disabled while checkoutAvailable:false.

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
- Native COMMERCE_DB has **nine tables**, including public catalog cache and
  fulfillment projection. Observed cache metadata: store 18912189, **60,000 ms**
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
  is enabled in test mode and its masked secret/version are configured at runtime
  revision 4. Connector authorization is not a runtime Stripe API key.

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
| D1 schema / public cache | WORKING for observed scope | Nine native tables and public cache metadata; no actual internal paid order persisted |
| Quote / ownership / payment integrity | INCOMPLETE | Server-owned fresh pricing, guest ownership, Tax quote binding and fail-closed gates tested; runtime Stripe key/approved merchant policy absent |
| Stripe Checkout / real payment verification | BLOCKED | SDK test integration exists; no authorized actual test checkout/capture verified |
| Stripe webhook | INCOMPLETE | Actual enabled test endpoint/secret/version configured; raw signature/durable admission tested; no real signed delivery/payment workflow proved |
| Printful draft API | WORKING low-level | One real draft created/GET-verified safely; no Stripe payment or internal-order linkage |
| Durable fulfillment projection / multiple tracking | INCOMPLETE | Owner-scoped GET refresh, multiple shipments, monotonic CAS persistence and partial-tracking UI implemented/tested; no actual linked paid order or shipment progression |
| Printful webhook receiver / recovery | INCOMPLETE | Signed durable receiver/recovery candidate implemented and fixture-tested; native activation and actual delivery pending |
| Notifications / refund initiation / full operations | INCOMPLETE | Business/sender/retention decisions and complete production operations remain open |
| Paid Printful confirmation | MISSING intentionally | No confirmation method; paid production not authorized |
| Retention / customer-data lifecycle | INCOMPLETE | Immutable address-bearing order JSON lacks an approved retention/anonymization lifecycle |
| Build / tests / release | WORKING for recorded scope | Prior native v37 verified; new receiver candidate 273 focused cases plus 3 isolated post-build bundle tests passes, activation pending |

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
cart 0/live20 collection and closed CZ modal are confirmed. Latest 11:04 UTC
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

## Prepared continuation: signed Printful event receiver

The restored source baseline is `2b18699669879b26a75627ab908628abee6755c1`.
The new receiver is **IMPLEMENTED / activation UNVERIFIED**; current production
remains the verified v37 above. No receiver publication, registration, provider
write or actual signed delivery is claimed for this continuation yet.

Fresh authorized reads verified expected store 18912189 again. Printful v1
`GET /webhooks` returned HTTP 200 with no URL/types; v2
`GET /v2/webhooks?show_expired=true` returned HTTP 200 with no default URL,
events or public key. Recheck immediately before registration; these reads do
not establish permanent ownership of an empty configuration.

`/api/printful/webhook` verifies the original bytes with Worker Web Crypto HMAC,
expected public key and store before durable admission. Missing configuration
returns 503. Migration `0003_printful_inbox.sql` adds separate inbox, jobs and
recovery-audit tables: production still has nine tables until this migration is
actually applied and observed. Retry-independent fingerprints, fenced leases,
five-attempt dead letters, fresh provider GET reconciliation and authorized
server-only requeue/drain are tested. Unknown/unmapped events are durably ignored;
events cannot create/confirm orders or infer payment, refund or delivery.

The candidate has **273 passing focused fixture/database cases**, plus three
post-build isolated generated-bundle cases. Native registration, actual signature
admission/retry and resulting production records remain acceptance steps. This
reduces the receiver/admin-recovery code gap, but does not deliver notifications,
refund/cancellation initiation, full operational tooling, retention or real
paid-order/shipment progression. Overall remains **PARTIALLY WORKING**.
