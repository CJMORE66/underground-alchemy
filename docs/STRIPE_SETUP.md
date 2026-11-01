# Stripe test-mode runtime setup

Updated: 1 November 2026. Stripe is confirmed and the existing connected test
account was read successfully: `livemode:false`, Tax settings active, two active
Czech registration records (`inbound_goods`, `small_seller`). Do not create a
replacement account or assume connector authorization supplies runtime keys.
No actual Checkout/payment or paid Printful order has been created.

## Runtime configuration still missing

Use supported Sites secure configuration for the existing Worker project:

- `STRIPE_SECRET_KEY`: actual connected-account test secret or appropriately
  permitted restricted test key. Test-only adapter accepts `sk_test_…`/`rk_test_…`
  and rejects live keys/mode. Never transmit a value through chat, Git or logs.
- `COMMERCE_POLICY_JSON`: verified merchant settings in `PRINTFUL_SETUP.md`;
  do not substitute synthetic tax IDs or infer treatment from a connector read.

Existing masked `PRINTFUL_API_TOKEN`, `COMMERCE_SESSION_SECRET` and actual
`STRIPE_WEBHOOK_SECRET` are configured at runtime revision 4. Snapshot version
`STRIPE_WEBHOOK_API_VERSION=2026-09-30.endive` is configured too. Remaining owner
inputs are only the runtime Stripe test API key and approved merchant policy.
Native Worker/D1 supplies the backend; no new hosting account, Node disk path
or NAS administration step is required for this deployment path.

SDK is pinned to **23.1.0** and API to **2026-10-28.endive**. Worker uses Stripe's
Fetch client and Web Crypto asynchronous SDK verification. Policy must match
the connected account/test mode/store 18912189 and currently supported
EUR/exponent 2/exclusive selling-price treatment. Product/shipping tax codes,
delivery countries and registration IDs need merchant review; active Tax
settings alone do not approve the policy.

## Configured actual snapshot destination

Already created on the existing test account: endpoint
`we_1UWw4LPkIIV492Qzkv8SzPaj`, **account Snapshot**, `livemode:false`,
**2026-09-30.endive**, status **enabled**, `livemode:false` (**test mode**).
Its masked signing secret is stored
in Sites and all four events below are subscribed. Do not duplicate the endpoint
or request its secret again. After payment configuration, test delivery through
the authorized connected workflow. `livemode:false` does not mean disabled;
registration is complete, but no actual delivery is verified yet.

Outgoing SDK API remains **2026-10-28.endive**. Snapshot verification matches
the actual endpoint version using `STRIPE_WEBHOOK_API_VERSION`; it explicitly
supports the configured September contract rather than assuming SDK version
equals destination version. The adapter rejects thin/Connect/live events.

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Preserve original bytes: no JSON
parsing/re-serialization before SDK verification. Raw body is bounded at 256 KiB.
Only completed/async-success candidates enter the scoped D1 inbox/job transaction.
Failed/expired events do not create fulfillment work; invalid signatures fail.

Signature admission is independent of runtime API-key construction. With an
actual endpoint secret and ready D1, valid events can be saved even if the API
key/policy is missing. Pending work returns **503** for redelivery; receipt is
not acknowledged as completed payment processing. The Worker awaits durable
processing and does not rely only on `waitUntil`.

## Quote, test Checkout and payment verification

The same-origin CS/EN/FR UI obtains a signed guest ownership cookie through
status, then submits IDs/quantities/address to shipping/quote APIs. Server reads
current Printful prices/active variants, actual rates and approved tax policy.
Browser prices, historical estimates and paid flags are not trusted. Guest
cookie possession is order ownership, not verified personal identity.

Stripe Tax freezes address, exact variant/quantity/line price, currency,
shipping, policy revision and total. D1 persists the owner-bound quote; Checkout
loads it by ID. Stable idempotency parameters survive lost replies. New quote
creation lasts at most 30 minutes. Hosted Session expiry is fixed to
`quoteExpiry + 1860` across retries. Changed/expired inputs require a fresh quote.

After a signed event, freshly retrieved Session/all lines/shipping/address/tax/
total, PaymentIntent, captured charge and refund history must match. A browser
return or signed event alone is never payment proof. Refunded/disputed/reviewed,
uncaptured or mismatched payments cannot create a draft.

Authorized test acceptance must demonstrate successful/failed/delayed payments,
actual delivery/retries, ownership, native D1 recovery and one linked Printful
**draft**. Use authorized Stripe test methods. A draft is not paid manufacturing;
no Printful confirmation method or real-charge authorization exists in this work.

## Durable operation and unfinished work

D1 operations are scoped to Stripe account + test mode + Printful store. Atomic
inbox/jobs, unique bindings, leases/fencing, five-attempt bound, dead letters and
single-POST gate are implemented. Safe initial reads can retry; uncertain
attempted Printful creates only reconcile by external ID. Never reset the gate
because a lookup is temporarily empty.

Native initial D1 schema and Worker versions 32–34 are deployed. Production
status is ready for catalog/shipping but not checkout; a diagnosed native Fetch
receiver binding and unsupported redirect:error still prevent catalog access.
Correct binding plus redirect:manual/explicit redirect rejection fixes/tests are
ready, but deployment/new production proof are pending. Later local workerd
synthetic runs succeeded; the original
Miniflare hang is historical and does not invalidate those later distinct tests.
Checkout fails closed without runtime payment API key and approved policy.
Finish retention/anonymization of immutable address-bearing orders,
customer refund/cancellation initiation, Printful status/tracking receiver,
notifications and operational admin handling before production customers.

Sources: [Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[webhooks](https://docs.stripe.com/webhooks),
[Tax](https://docs.stripe.com/tax/standalone-tax-api),
[Printful v1](https://developers.printful.com/docs/).
