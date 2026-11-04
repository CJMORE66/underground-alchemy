# Commerce final progress / resume record

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native **v39 / env5**
is deployed; live catalog/shipping, a safe standalone draft and real signed
Printful webhook admission are verified. D1 has 12 tables. Runtime Stripe key/
merchant policy and complete paid-order/shipment acceptance remain blocked.

## Verified completed

- [x] Retain original brand/routes/assets and public Sites identity; review PR #4
  separately from Sites source/deploy history.
- [x] Real Printful auth/store: 18912189 once among seven native account stores.
- [x] Real CLI and Node adapter reads: 20 products/86 variants, 83 active/3
  temporary out of stock, all EUR; exact IDs and legacy sourceSku aliases retained.
- [x] Native live browser catalog/product/cart/persistence/quantity/CZ-EN-FR
  desktop; actual out-of-stock option cannot add; second gallery preview loads.
- [x] Actual browser shipping OMERTA Black/M × 1 at official US/California test
  destination: STANDARD €8.39, CO2 €8.47. Earlier separate Node estimate €4.69.
- [x] Twelve native D1 tables after applied migration 0003, including Printful
  inbox/jobs/recoveries and fulfillment/public cache; earlier observed store-specific
  cache metadata TTL 60,000 ms/lease NULL. Truncated row payload not treated as
  complete parsed evidence.
- [x] Safe standalone draft 184026933 created and authenticated GET verified;
  confirm=false, no charge/production. Left draft, no fake paid internal order.
- [x] Enabled test Stripe snapshot endpoint/actual masked secret and September
  version originally configured at env4 and preserved at env5. Connected test account/Tax settings inspected.
- [x] 273 focused cases (29 importer + 21 provider + 57 Stripe + 166 Worker),
  UI/regression groups and 3 actual generated-bundle isolated workerd cases pass.
- [x] Native Fetch/redirect/cache failures repaired and live v35 catalog verified;
  later v36 UI quote gate fixed/tested and deployed.
- [x] CI #12 passes at GitHub a2c7d8a6b3b91e476b74213c5cb4084311fe8837,
  including native-bundle checks.
- [x] V36 native deployment succeeds at 2026-11-01T10:53:43.921359+00:00,
  source b5d613845852a5e14d20f4a3072189726b84fada. Status 200 reports test mode,
  catalog/shipping available, checkout unavailable; cart preserves quantity 1
  after reload.

## Remaining acceptance

- [x] Deploy v37 frontend-only correction for actual obsolete original-store
  detail copy; six CS/EN/FR live/fallback DOM scenarios, UI/shop/cart/language and
  build/release checks pass. Native cart action/dated prices/backend unchanged.
- [x] V37 deployment succeeds at 2026-11-01T11:02:50.549892+00:00, live API 20/86
  with 83 active and visible CS/EN/FR detail copy pass after dictionary loading;
  CI #14 PASS. Final status200/test/catalog+shipping true/checkoutfalse,
  cart0/live20 notice and closed CZ modal verified. Latest bounded11:04UTC query
  has3 ancillary404s only (favicon/sitemap/robots), no returned commerce/API failure.
  Exact native IDs are in DEPLOYMENT. Current receiver-capable rollback is v38.

- [x] Final v36 actual 10:54 UTC smoke: live catalog 20/86/83 active, official
  destination rates €8.39/€8.47; STANDARD selected with tax quote disabled.
  Test item removed to 0, persisted after reload; address form empty on reload.
- [x] Actual D1 order/draft-mapping rows both zero; standalone provider draft is
  not an internal paid order. V36's dated 5-minute/25-event query returned0;
  dated v37 query has3 ancillary404s as above. Window/ingestion limits apply.
- [ ] Securely configure runtime STRIPE_SECRET_KEY test API key and reviewed
  COMMERCE_POLICY_JSON. Existing Printful/session/Stripe and Printful webhook secrets are set at env5.
- [ ] Authorized actual Stripe Tax/Checkout/payment/signature/redelivery and
  fresh captured-payment verification; durable internal order → one linked
  Printful draft. Standalone draft proof is not this workflow.
- [ ] Actual linked paid-order fulfillment/shipment progression. Owner-scoped
  projection/multiple tracking/CAS/partial UI are implemented/tested, not live
  shipment acceptance.
- [ ] Complete mapped paid-order reconciliation/recovery acceptance, customer
  notifications/refund-cancellation initiation, full operations and retention/
  anonymization. Obtain actual
  business identity, approved sender/service and retention policy as needed.
- [ ] Current-release real mobile viewport acceptance; desktop/fixtures do not
  substitute for it.

## Current owner inputs / state

Immediate blockers are only the secure runtime Stripe test API key and approved
merchant selling/tax/country policy. No new hosting account, mandatory NAS access,
Printful token or webhook-secret handoff is required. Connector authorization
does not grant a runtime key; never put secrets in chat/source/logs.

No real Stripe payment or full paid-order workflow is verified. No paid Printful
confirmation method exists or production charge is authorized. The standalone
test draft remains in Printful for inspection; do not confirm it automatically.

## Resume / rollback

Read the six PRINTFUL documents and STRIPE_SETUP, current Site/D1/configuration
and real deployment records. V38 and prior IDs/source/archive are in DEPLOYMENT. Immediate
preferred receiver-capable rollback is v38; v31 is an emergency static
fallback. V38 retains the receiver. Older v37 lacks it and can trigger provider
retries; preserve/reconcile registration/callbacks if that emergency path is used. Preserve D1/schema/cache/order data,
runtime secrets, browser notes/carts and uncertain mutation gates. Never replay
an ambiguous create or treat a deployment/fixture as paid fulfillment proof.

Final v36 publication/smoke record is complete in DEPLOYMENT/TEST_RESULTS.
The full integration remains PARTIALLY WORKING, with the specific external
payment inputs and incomplete production operations above still open.

## Verified v38 continuation / remaining boundaries

- [x] Deploy signed Worker receiver and apply/observe migration 0003: 12 native
  tables; activate masked Printful signing configuration at env5. Exact source,
  saved/deployment/archive IDs and CI #16 success are in DEPLOYMENT.
- [x] Fresh empty v1/v2 configuration guards, one v2 POST registration for 16
  order/shipment event types, authenticated configuration readback.
- [x] Safely metadata-update existing draft184026933 with confirm=false; fresh
  GET verifies same draft/external ID/items, no charge or production confirmation.
- [x] Actual signed order_updated callback verifies and durably records at D1.
  Job ignored / attempts 0 / PRINTFUL_UNMAPPED_ORDER, correct for the standalone
  unmapped test draft. Internal orders/draft mappings remain empty; no fake paid
  record. This proves admission/classification, not a payment-to-order workflow.
- [x] Raw-byte/store/public-key validation, retry-independent fingerprints,
  existing-mapping-only fresh GET, fenced leases, five-attempt dead letters and
  authorized server-only audited requeue/drain have automated fixture/DB coverage.
  273 focused cases plus three post-build isolated generated-bundle cases pass;
  19 syntax/build/release checks pass with unchanged frontend bytes/hash.
- [x] Actual v38 browser live20/status catalog+shipping true/checkoutfalse and
  GET webhook METHOD_NOT_ALLOWED. Bounded error window has two favicon404s only,
  no returned commerce errors; D1 event records are actual callback evidence.
- [x] Implement/test/deploy v39 bounded pending-only catalog recovery: at most
  three automatic attempts with 300/600 ms delays, then accessible manual retry.
  Pending-to-live/cap/manual/auth-no-retry/abort/destroy/CZ-EN-FR tests pass.
  Initial v38 pending503/reload observation remains historical; not every
  provider load is guaranteed to recover automatically.
- [ ] Actual mapped paid-order reconciliation, retry/dead-letter recovery and
  shipment progression; notifications, refund/cancellation initiation, full
  operator tooling/scheduling and approved retention/anonymization.

Overall **PARTIALLY WORKING**. Secure restricted Stripe test API key and approved
merchant policy remain immediate owner inputs. Managed Stripe App key issuance
exists only with its own approved preview/permission workflow and is not exposed
by the available connector. Preferred prior rollback is receiver-capable v38, preserving
D1/env5/registration. Older v37 lacks this receiver and requires retry recovery.
No paid Printful confirmation or real Stripe payment is authorized/verified.

## Verified current v39 release

- [x] Deploy source370fd42896a95c9a1ffd76f9bc89ad5f24a40756 as v39/env5 at
  2026-11-01T18:17:53.735340+00:00; exact save/deploy/archive in DEPLOYMENT.
- [x] Preserve v38 receiver/twelve-table schema/signing configuration; no repeated
  registration or second callback claim. Keep actual signed v38 proof separate.
- [x] Build/release 19 syntax checks, 273 focused cases +3 isolated bundle fixtures,
  new shop recovery and cart/checkout UI tests pass; CI #17 SUCCESS.
- [x] Actual v39 reload shows retry control/live20, cart quantity1 persistence,
  shipping ready and checkoutfalse; API catalog/shipping true/checkout false.
- [x] Fresh v38 actual shipping €8.39/€8.47 for official public test destination;
  STANDARD selection keeps quote disabled/pay hidden or disabled, no charge.
- [ ] Actual payment, mapped-order/recovery/shipment, real mobile viewport,
  notifications/refund initiation/full admin operations and retention acceptance.

Desktop evidence is linked in TEST_RESULTS. Overall remains PARTIALLY WORKING;
secure runtime Stripe test key and approved merchant policy remain owner inputs.

Final v39 D1 recheck still shows **12 tables**, **one same-fingerprint signed
receipt**, and no internal orders/linked draft mappings. The fresh bounded
five-minute Worker error query contains only **two favicon404s**, with no
returned API/commerce failures; window/ingestion limits apply. Independent
frontend review found no material blocker in this narrow UI change. Reviewable
sanitized evidence: [v39 verification JSON](evidence/PRINTFUL_V39_VERIFICATION.json),
[actual desktop shipping v38](evidence/PRINTFUL_SHIPPING_V38.jpg),
[actual desktop shop v39](evidence/PRINTFUL_SHOP_V39.jpg). This preserves the
single v38 callback proof and does not imply a second delivery on v39.
