# Commerce final progress / resume record

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native v36 is deployed;
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

- [x] Final v36 actual 10:54 UTC smoke: live catalog 20/86/83 active, official
  destination rates €8.39/€8.47; STANDARD selected with tax quote disabled.
  Test item removed to 0, persisted after reload; address form empty on reload.
- [x] Actual D1 order/draft-mapping rows both zero; standalone provider draft is
  not an internal paid order. Last 5-minute/25-event error query returns 0 events,
  subject to bounded window/ingestion lag.
- [ ] Securely configure runtime STRIPE_SECRET_KEY test API key and reviewed
  COMMERCE_POLICY_JSON. Existing Printful/session/webhook secrets are already set.
- [ ] Authorized actual Stripe Tax/Checkout/payment/signature/redelivery and
  fresh captured-payment verification; durable internal order → one linked
  Printful draft. Standalone draft proof is not this workflow.
- [ ] Actual linked paid-order fulfillment/shipment progression. Owner-scoped
  projection/multiple tracking/CAS/partial UI are implemented/tested, not live
  shipment acceptance.
- [ ] Complete Printful receiver, customer notifications/refund-cancellation
  initiation, admin recovery and approved retention/anonymization. Obtain actual
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
known-good static rollback remains v31; preserve D1/schema/cache/order data,
runtime secrets, browser notes/carts and uncertain mutation gates. Never replay
an ambiguous create or treat a deployment/fixture as paid fulfillment proof.

Final v36 publication/smoke record is complete in DEPLOYMENT/TEST_RESULTS.
The full integration remains PARTIALLY WORKING, with the specific external
payment inputs and incomplete production operations above still open.
