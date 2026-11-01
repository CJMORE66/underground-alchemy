# Stripe test-mode runtime setup

Updated: 1 November 2026. Existing Stripe test account/Tax settings and two active
Czech registration records are verified. Endpoint registration is complete and
enabled in test mode. Runtime payment key and approved merchant policy remain
missing; no actual Stripe payment or full paid-order workflow is verified.

## Required owner configuration

The deployed v37 frontend live/fallback-copy correction does not change Stripe
configuration, payment authorization or the verified v36 backend. Its native
publication/live CS/EN/FR copy smoke pass; all payment blockers below remain unchanged.

Supply through secure Sites runtime settings only:

- **STRIPE_SECRET_KEY**: actual connected-account test secret/restricted test API
  key with the required Checkout/Tax/payment-read permissions. Connector/MCP
  authorization is not this runtime credential. Never paste key values in chat,
  source, browser code, command arguments or logs.
- **COMMERCE_POLICY_JSON**: reviewed merchant selling-price, exclusive-tax,
  country, product/shipping tax-code and registration policy. Exact schema and
  scope are in `PRINTFUL_SETUP.md`; do not invent IDs/rules to enable a button.

Preserve existing masked Printful/session/webhook secrets at env revision 4.
Native Sites Worker/D1 requires no extra hosting account or mandatory NAS access.
Observed active Tax settings/registrations are not blanket approval of all
products/countries or an actual Tax calculation for the proposed order.

## Existing enabled snapshot destination

Endpoint `we_1UWw4LPkIIV492Qzkv8SzPaj` has **status enabled**, **livemode:false**
(test mode), account Snapshot contract **2026-09-30.endive**, path
`/api/stripe/webhook`. All four events are registered:

- checkout.session.completed
- checkout.session.async_payment_succeeded
- checkout.session.async_payment_failed
- checkout.session.expired

Its actual signing secret is securely configured; do not recreate it or request
another secret. `livemode:false` means test mode, not disabled. Actual signed
endpoint delivery/processing remains unverified.

Official SDK is **23.1.0**, outgoing API **2026-10-28.endive**. Worker Fetch and
Web Crypto verify original raw bytes against the explicitly configured September
snapshot version. Do not assume SDK version equals webhook version. Thin,
Connect and live-mode payloads are rejected by the test-only adapter.

Raw signature admission requires the actual endpoint secret but not the payment
API key. Valid candidates commit to scoped D1 inbox/jobs; absent runtime payment
configuration leaves them pending and returns 503 for redelivery. Processing is
awaited; waitUntil alone is not the recovery guarantee. Failed/expired events
never authorize manufacturing. No real webhook delivery has been inferred from
fixture signatures or successful registration.

## Shipping-only versus paid test flow

Live catalog/destination-specific shipping can work without Stripe payment key/
policy. Status currently reports checkoutAvailable:false. V35 showed a quote
button enabled in this mode although the server correctly rejected quotes. The
source gate fix (`b5d613845852a5e14d20f4a3072189726b84fada`) now blocks both the
button and handler until checkoutReady; tests pass and v36 is deployed. Its
final actual browser smoke passes: official-destination shipping returns €8.39/
€8.47, and selecting STANDARD leaves the tax quote button disabled while
checkoutAvailable:false. This verifies the gate, not a Stripe payment.

When payment configuration is ready, the guest sends IDs/quantities/address only.
Fresh server catalog, exact variants, shipping and approved policy feed Stripe
Tax. Immutable D1 quote binds address, all line amounts/quantities, currency,
shipping, policy and total. Stable idempotency parameters survive lost replies;
quote creation is bounded and changed/expired inputs require a new quote.

After an event, fresh Session/all lines/shipping/address/tax/total, PI, captured
charge and refund history must match. A redirect or signature alone is not
payment evidence. Refunded/disputed/reviewed, uncaptured or mismatched payments
cannot create a linked draft. Authorized successful/failed/delayed test payment,
real delivery/retries and actual internal-order-to-Printful mapping still need
demonstration after runtime configuration.

## Printful draft and production boundary

Standalone Printful draft **184026933** was created and read back safely with
confirm=false. It remains a draft, with no charge/production confirmation and no
fake paid internal order. That low-level API proof is not a Stripe payment test
or end-to-end fulfillment acceptance. Do not confirm it for production.

Owner-scoped durable fulfillment projection, multiple-tracking/partial UI and
CAS safety are implemented/tested; no actual linked paid order or shipment
progression exists. Activate/verify the prepared durable Printful receiver; complete customer
notification/refund/cancellation initiation and operational admin/recovery.
Approved business identity, sender/service and retention policy are dependencies.
Immutable address-bearing order JSON has no completed anonymization/delete
lifecycle. No live-charge mode or paid Printful confirmation method is delivered.

Sources: [Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[webhooks](https://docs.stripe.com/webhooks),
[Tax](https://docs.stripe.com/tax/standalone-tax-api),
[Printful v1](https://developers.printful.com/docs/).

## Continuation: runtime-key and Printful receiver boundaries

Stripe supports managed API keys through an approved Stripe App preview with
explicit `api_key_write`, app review/approval and installation authorization.
The available connector exposes no corresponding key-issuance operation, and
neither a CLI/injected runtime key nor that app authorization is present here.
Key creation is therefore not globally Dashboard-only; the actionable owner
input here remains a narrowly permitted **restricted test API key**, stored
securely as STRIPE_SECRET_KEY, plus reviewed COMMERCE_POLICY_JSON. Visitor
AppGateway OAuth is not an unattended merchant API credential. Never request
key values in chat/source/logs.

The new signed Printful receiver does not remove this payment dependency. Its
raw-byte HMAC/public-key validation, scoped durable inbox/jobs, fresh GET and
server-authorized recovery are implemented/tested but still awaiting native
publication/configuration and actual provider delivery. Production remains v37
at env4; Stripe key/policy are absent and checkout remains fail closed. Actual
fresh Printful webhook reads are empty; registration has not yet happened in
this continuation. No event may authorize payment or create/confirm fulfillment.
A safe callback from the existing standalone unconfirmed draft cannot substitute
for a real Stripe payment and linked internal order.

Official key references: [API keys](https://docs.stripe.com/keys),
[managed keys](https://docs.stripe.com/keys/managed-api-keys),
[approved Stripe App managed-key preview](https://docs.stripe.com/stripe-apps/api-authentication/managed-api-keys),
[restricted-key apps](https://docs.stripe.com/stripe-apps/api-authentication/rak).
