# Commerce setup / remaining owner inputs

Updated: 1 November 2026. Native **v38 / env5** is deployed with live catalog/
shipping, 12 native tables and an actual signed Printful callback safely admitted
and classified as unmapped. Runtime Stripe payment and full paid-order workflow
remain blocked; overall **PARTIALLY WORKING**. Preserve D1/provider state and all
masked signing settings on rollback; v37 rollback has no Printful receiver.

## Already configured and verified

- Existing Printful store 18912189: real authorized store membership among seven,
  CLI/Node live 20/86 and actual production browser catalog. Preserve the existing
  credential and exact internal/sync/catalog mappings/legacy sourceSku aliases.
- Runtime revision 5 preserves masked PRINTFUL_API_TOKEN, COMMERCE_SESSION_SECRET
  and actual STRIPE_WEBHOOK_SECRET; STRIPE_WEBHOOK_API_VERSION remains
  2026-09-30.endive. PRINTFUL_WEBHOOK_PUBLIC_KEY and PRINTFUL_WEBHOOK_SECRET_HEX
  are also configured as masked secrets. Do not request them again.
- Enabled test-mode Stripe snapshot endpoint exists with four required events.
  Do not recreate it or ask for the signing secret again. Actual delivery/payment
  still needs testing after payment configuration.
- Native COMMERCE_DB has 12 observed tables after applied migration 0003,
  including fulfillment/public cache and dedicated Printful events/jobs/recoveries.
  Earlier cache metadata shows 60-second TTL; preserve native data on rollback.
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
`0001_commerce_immutability.sql`, `0002_fulfillment.sql` and
`0003_printful_inbox.sql`; 0002 includes public cache, 0003 adds the three
Printful inbox/job/recovery tables. Actual native schema is verified at 12 tables.
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
draft 184026933 is provider-only evidence: a metadata-only safe update tested
actual callback admission while retaining draft status. No fake paid internal
record was created. Never confirm it for paid production in this task.

Complete notification/refund/cancellation/admin workflows and approved retention/
anonymization. Business identity, approved sender/service and retention policy
must come from the owner. Multiple-tracking projection/UI code is implemented,
but real paid-order/shipment progression remains unverified. No live-charge or
paid Printful confirmation method is delivered.

## Active Printful receiver / safe maintenance

Receiver source is published as v38, migration 0003 is applied, and both signing
values are masked at env5. Fresh v1/v2 empty-config guards preceded one v2 POST
registration of 16 order/shipment types to the deployed HTTPS
`/api/printful/webhook`; authenticated readback verified it. Do not repeat
registration, overwrite settings or rotate signing keys to rerun a test.

A metadata-only recipient test-name PUT to existing draft 184026933 with
confirm=false produced a real signed order_updated callback. D1 durably classified
it ignored / attempts 0 / PRINTFUL_UNMAPPED_ORDER, then authenticated GET verified
the same draft/items. Internal orders/draft mappings remain empty. Never create
a fake paid mapping or confirm production to turn this safe proof into an
apparent end-to-end success. Exact event fingerprint/timestamps are in
TEST_RESULTS. Mapped paid-order reconciliation, actual retries/dead letters and
shipment progression remain separate acceptance steps.

Server-only authorized dead-letter requeue/audited drain is implemented; it is
not a public admin API or completed operational service. Preserve receiver,
registration, twelve-table D1 and env5 keys during maintenance. Prefer fixing
the receiver forward: older v37 lacks this route and can cause provider retries.
See DEPLOYMENT for rollback coordination; do not disable/rotate blindly.

Stripe still needs a securely stored restricted test API key and reviewed
merchant policy. Official Stripe Apps can create managed keys in an approved
preview with `api_key_write`; the available connector has no such operation or
injected runtime key here. Key issuance is not globally Dashboard-only, and
visitor AppGateway OAuth is not an unattended merchant credential.
