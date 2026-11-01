# Commerce setup / remaining owner inputs

Updated: 1 November 2026. Native Worker/D1 and live catalog/shipping now work.
One standalone safe Printful draft was created/read back. Runtime Stripe payment
and end-to-end paid-order workflow remain blocked; overall PARTIALLY WORKING.
V36 native publication and final actual shipping/quote-button browser smoke
pass; only the documented payment/full-order and remaining operational scope is blocked.

V37 is a deployed/verified frontend-only live/fallback-copy correction; no new runtime
settings, API credentials or backend migration are needed for it. Native
publication and actual live CS/EN/FR detail-copy smoke pass. Use verified v36 as the preferred functional
rollback and v31 only as an emergency static fallback, preserving D1/secrets.

## Already configured and verified

- Existing Printful store 18912189: real authorized store membership among seven,
  CLI/Node live 20/86 and actual production browser catalog. Preserve the existing
  credential and exact internal/sync/catalog mappings/legacy sourceSku aliases.
- Runtime revision 4 has masked PRINTFUL_API_TOKEN, COMMERCE_SESSION_SECRET and
  actual STRIPE_WEBHOOK_SECRET; STRIPE_WEBHOOK_API_VERSION is 2026-09-30.endive.
- Enabled test-mode Stripe snapshot endpoint exists with four required events.
  Do not recreate it or ask for the signing secret again. Actual delivery/payment
  still needs testing after payment configuration.
- Native COMMERCE_DB has nine tables including fulfillment/public cache. Actual
  catalog cache metadata shows 60-second TTL; preserve native data on rollback.
- Existing Sites project/audience and Worker+ASSETS+D1 require no new hosting
  account, external Node disk or mandatory NAS recovery.

## Immediate owner inputs

Use supported secure Sites configuration. Never paste values into chat, Git,
command arguments, `dist/`, reports or `.openai/hosting.json`.

| Runtime setting | Required source / decision |
| --- | --- |
| STRIPE_SECRET_KEY | Actual connected-account test API key (secret or appropriately permitted restricted test key); connector authentication is not a runtime key |
| COMMERCE_POLICY_JSON | Reviewed selling-price/tax/country policy matching connected account, test mode and store; fields below |

The policy requires matching stripeAccountId, mode:test, printfulStoreId:18912189,
currency:EUR, currencyExponent:2, priceTaxBehavior:exclusive, policyRevision,
verified active registrationIds, approved allowedCountries, shippingTaxCode and
internal-ID keyed taxCodeByVariantId and/or taxCodeByProductId. Confirm that the
Printful retail metadata is the intended selling price and exclusive-tax treatment.
Active observed Tax registrations are not approval of every product/country rule.
Do not invent registrations, tax codes, universal shipping rates or zero-tax policy.

## Native maintenance / release

```sh
npm run test:commerce
npm test
npm run build:commerce
npm run check:commerce-release
node tests/commerce-workerd.mjs
```

Run language/Drizzle/whitespace/advisory checks described in TEST_RESULTS. The
active schema-only chain is `drizzle/0000_commerce.sql`,
`0001_commerce_immutability.sql`, `0002_fulfillment.sql`; the third includes the
public cache table too. Native migrations/schema are verified at nine tables.
Readiness checks do no request-time DDL. Use supported Sites source packaging/
save/deploy with the exact validated archive; GitHub push alone is not deployment.

Output-only packaging avoids duplicate maintained/generated asset copies:

```sh
node scripts/package-commerce-worker.mjs /absolute/sites/scripts/package-site.mjs /absolute/outside-checkout/release.tar.gz
```

Preserve the Site identity/audience and D1. `PRINTFUL_DEPLOYMENT.md` records known
release/rollback IDs and actual successful v36 shipping/quote-gate browser smoke.

## Read-only catalog refresh

With the existing token securely injected into a process, run
`python tools/sync-printful.py --platform api`. Full sync and explicit selected
`--product-id` refresh are read-only. Review stable IDs, actual SKU/source aliases,
public previews and separate live retail/availability fields. Never refresh the
historical sourcePrice date or export raw printing files/private metadata.
Catalog import alone neither publishes nor creates fulfillment.

## Remaining acceptance and operations

After payment configuration: verify actual Stripe Tax quote, authorized successful/
failed/delayed test Checkout, signed redelivery, fresh captured-payment checks,
one real internal order and one linked Printful draft. The existing standalone
draft 184026933 is provider-only evidence and remains untouched; no fake paid
internal record was created. Never confirm it for paid production in this task.

Complete notification/refund/cancellation/admin workflows and approved retention/
anonymization. Business identity, approved sender/service and retention policy
must come from the owner. Multiple-tracking projection/UI code is implemented,
but real paid-order/shipment progression remains unverified. No live-charge or
paid Printful confirmation method is delivered.
