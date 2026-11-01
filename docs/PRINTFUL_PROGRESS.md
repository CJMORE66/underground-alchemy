# Commerce final progress / resume record

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native v37 is deployed;
live catalog/shipping and one standalone safe Printful draft are verified. Runtime
Stripe API key/merchant policy and complete paid-order acceptance remain blocked.
V36 final shipping/quote-button browser smoke passes; this does not make the
Stripe payment/full-order workflow complete.

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
- [x] Nine native D1 tables incl fulfillment/public cache; observed store-specific
  cache metadata TTL 60,000 ms/lease NULL. Truncated row payload not treated as
  complete parsed evidence.
- [x] Safe standalone draft 184026933 created and authenticated GET verified;
  confirm=false, no charge/production. Left draft, no fake paid internal order.
- [x] Enabled test Stripe snapshot endpoint/actual masked secret and September
  version configured at env4. Connected test account/Tax settings inspected.
- [x] 227 focused cases (29 importer + 21 provider + 57 Stripe + 120 Worker),
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
  Exact native IDs are in DEPLOYMENT. Preferred rollback for the continuation is v37.

- [x] Final v36 actual 10:54 UTC smoke: live catalog 20/86/83 active, official
  destination rates €8.39/€8.47; STANDARD selected with tax quote disabled.
  Test item removed to 0, persisted after reload; address form empty on reload.
- [x] Actual D1 order/draft-mapping rows both zero; standalone provider draft is
  not an internal paid order. V36's dated 5-minute/25-event query returned0;
  latest v37 query has3 ancillary404s as above. Window/ingestion limits apply.
- [ ] Securely configure runtime STRIPE_SECRET_KEY test API key and reviewed
  COMMERCE_POLICY_JSON. Existing Printful/session/webhook secrets are already set.
- [ ] Authorized actual Stripe Tax/Checkout/payment/signature/redelivery and
  fresh captured-payment verification; durable internal order → one linked
  Printful draft. Standalone draft proof is not this workflow.
- [ ] Actual linked paid-order fulfillment/shipment progression. Owner-scoped
  projection/multiple tracking/CAS/partial UI are implemented/tested, not live
  shipment acceptance.
- [ ] Activate/verify the prepared Printful receiver; complete customer notifications/
  refund-cancellation initiation, full operations and retention/anonymization. Obtain actual
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
and real deployment records. V36 IDs/source/archive are in DEPLOYMENT. Immediate
preferred verified rollback is v37; v31 is an emergency static
fallback. Preserve D1/schema/cache/order data,
runtime secrets, browser notes/carts and uncertain mutation gates. Never replay
an ambiguous create or treat a deployment/fixture as paid fulfillment proof.

Final v36 publication/smoke record is complete in DEPLOYMENT/TEST_RESULTS.
The full integration remains PARTIALLY WORKING, with the specific external
payment inputs and incomplete production operations above still open.

## Prepared continuation: signed receiver

- [x] Implement raw-byte HMAC/public-key/store validation and gated Worker POST
  `/api/printful/webhook`; dedicated D1 inbox/jobs/recovery-audit migration.
- [x] Implement retry-independent fingerprinting, durable unknown/unmapped ignore,
  existing-created-mapping-only fresh GET reconciliation, fenced leases,
  five-attempt dead letters and authorized server-only requeue/audited drain.
  Events never create/confirm orders or infer payment/refund/delivery.
- [x] Pass 273 focused cases (29 importer + 21 provider + 57 Stripe + 166 Worker),
  plus three post-build isolated generated-bundle cases; providers are fixtures.
  Build/release and 19 syntax checks pass; frontend bytes/hash unchanged.
- [x] Fresh read-only Printful store membership and v1/v2 empty webhook
  configurations verified. No provider write has occurred in this continuation.
- [ ] Publish receiver and apply/observe three new native relations. Current
  production remains verified v37/env4/nine tables until actual release evidence.
- [ ] Freshly recheck configuration, register deployed HTTPS destination, mask
  provider-issued keys, safely trigger from the existing unconfirmed test draft,
  and prove actual signed admission/durable classification/retry. Never create
  a fake internal paid mapping or confirm the draft for production.
- [ ] Actual mapped paid-order/status progression, notifications, refund/cancel
  initiation, full operator tooling/scheduling and approved retention remain open.

Overall remains **PARTIALLY WORKING**. Secure restricted Stripe test API key and
approved merchant policy are still the immediate owner inputs; managed Stripe
App key issuance exists only with its own approved preview/permission workflow
and is not exposed by the current connector. Preferred rollback for the next
release is verified v37 (exact saved ID in DEPLOYMENT); preserve native data and
all uncertain mutation gates. This prepared slice is not actual delivery proof.
