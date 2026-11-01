# Printful / commerce setup

Updated: 1 November 2026. Real Printful store/catalog reads and one shipping
estimate succeeded, including a real Node LivePrintfulCatalog read. Native
Worker versions 32–34 and seven-table D1 schema are deployed. A diagnosed native
Fetch receiver bug and unsupported redirect:error still block production catalog
access. Both fixes/tests are ready, deployment/proof pending. Stripe API key/policy
are missing. No new hosting account or mandatory
NAS recovery is required for the supported native deployment.

## Already completed

- Authorized Printful credential accepted; expected store 18912189 appeared once
  among seven native stores. It is stored as a masked Sites runtime secret, not
  committed or printed.
- Full live import at `2026-11-01T10:10:57.292386Z`: 20 products/86 variants,
  83 active/3 temporary out of stock, all retail currencies EUR. Exact internal/
  sync/catalog identities remain; actual SKU and historical alias are separate.
- Sites runtime revision 4 includes masked `PRINTFUL_API_TOKEN`,
  `COMMERCE_SESSION_SECRET`, `STRIPE_WEBHOOK_SECRET` and configured
  `STRIPE_WEBHOOK_API_VERSION=2026-09-30.endive`; existing Manual/API store retained.
- Existing connected Stripe test account/Tax settings and two active Czech
  registration records were read. This is not a runtime API-key grant.
- A real four-event test Stripe destination is registered and enabled in test mode.
  Its endpoint secret/version are already securely configured; do not re-request
  the secret. No actual signed delivery/payment is verified.
- Native status returns HTTP 200, `mode:test`, catalog/shipping available,
  checkout unavailable. These readiness flags are not provider health probes.

## Required remaining runtime settings

Set these through supported Sites secret/environment configuration or a secure
owner credential handoff. Never paste secrets in chat, commit them, put them in
`dist/`, command arguments, reports or `.openai/hosting.json`.

| Setting | Required value/source |
| --- | --- |
| `STRIPE_SECRET_KEY` | Actual connected-account test API key; official adapter accepts test secret/restricted test keys only. Connector authentication is not this key. |
| `COMMERCE_POLICY_JSON` | Reviewed merchant price/tax/country policy matching the already connected account/store/test scope; exact fields below |

Keep the existing Printful/session/webhook secrets and destination version.
Owner inputs now are the runtime Stripe test API key and merchant policy only.
Testing the already-enabled destination is a technical release step after valid
payment configuration, not a request for another secret/account or registration.

The policy requires `stripeAccountId` matching the already connected account,
`mode: test`, `printfulStoreId: 18912189`, `currency: EUR`, `currencyExponent: 2`,
`priceTaxBehavior: exclusive`, a nonempty `policyRevision`, verified active
`registrationIds`, approved `allowedCountries`, `shippingTaxCode`, and
`taxCodeByVariantId` and/or `taxCodeByProductId` keyed by retained internal IDs.
Approve that Printful retail metadata is the intended customer selling price
and confirm exclusive-tax treatment. Observed active registrations alone do not
establish every country/product's tax obligations. Do not invent tax-code IDs,
zero-tax policy, countries or a universal shipping price.

## Native build, schema and deployment

The existing Site identity/audience is retained. Source manifest declares D1
binding `COMMERCE_DB` and omits static hosting. Use the supported Sites source
packaging/save/deploy workflow; no external Cloudflare account bootstrap is needed.

```sh
npm run test:commerce
npm test
npm run build:commerce
npm run check:commerce-release
```

Run language/regression/whitespace checks documented in `PRINTFUL_TEST_RESULTS.md`.
Do not regenerate migrations to hide a schema mismatch. The reviewed migration
chain is `drizzle/0000_commerce.sql` and `drizzle/0001_commerce_immutability.sql`,
from `db/schema.ts`/Drizzle metadata. Native deployment must apply and verify
those schema-only migrations before readiness is accepted. The initial native
seven-table schema is now verified. Repository `migrate()` is only a readiness
check; HTTP requests never create schema. Durable catalog-cache and fulfillment
projection/table migrations are pending; test/apply them separately before
claiming additional native support.

After deploying both receiver-binding/manual-redirect repairs, verify catalog/status and a safe shipping estimate,
retained frontend/images/languages and checkout-disabled behavior. With runtime
Stripe key/policy still absent, status must not claim checkout is available.
Append actual version/deployment IDs and smoke results to
`PRINTFUL_DEPLOYMENT.md`; do not infer deployment from a GitHub merge.

## Read-only catalog refresh

With the existing authorized token securely injected into a local process:

```sh
python tools/sync-printful.py --platform api
```

Full sync is explicit; `--product-id` supports bounded selected-product refresh.
Review the public JSON diff and stable IDs/SKUs/source aliases. Preserve historical
`sourcePrice.checkedAt`; live retail/availability observations have separate
provenance. No raw printing files, private metadata or credentials are exported.
Importer reads do not create orders or publish the Site automatically.

## Remaining acceptance

See `STRIPE_SETUP.md` for actual snapshot destination and test flow. Demonstrate
the repaired live Worker catalog/shipping, authorized Stripe test payment,
fresh server verification and one safely linked Printful draft before accepting
end-to-end operation. No real payment/draft has been created so far. Paid Printful
confirmation has no method and requires separate authorization/implementation.

Customer refund/cancellation initiation and notifications/admin handling remain
incomplete. Durable owner-visible fulfillment projection/read synchronization is
in progress, with no accepted production result yet. Immutable order
JSON has no completed retention/anonymization path; resolve before production
customer processing. Keep database/provider state during rollback, and never
reset the single-POST gate to recover an uncertain remote create.
