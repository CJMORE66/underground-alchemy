# Printful / commerce setup

Updated: 1 November 2026. Real Printful store/catalog reads and one shipping
estimate succeeded. The native Sites Worker/D1 release is pending publication;
Stripe payment configuration is missing. No new hosting account or mandatory
NAS recovery is required for the supported native deployment.

## Already completed

- Authorized Printful credential accepted; expected store 18912189 appeared once
  among seven native stores. It is stored as a masked Sites runtime secret, not
  committed or printed.
- Full live import at `2026-11-01T10:10:57.292386Z`: 20 products/86 variants,
  83 active/3 temporary out of stock, all retail currencies EUR. Exact internal/
  sync/catalog identities remain; actual SKU and historical alias are separate.
- Sites runtime revision 2 includes `PRINTFUL_API_TOKEN` and
  `COMMERCE_SESSION_SECRET`; source uses the existing Manual/API product family.
- Existing connected Stripe test account/Tax settings and two active Czech
  registration records were read. This is not a runtime API-key grant.

## Required remaining runtime settings

Set these through supported Sites secret/environment configuration or a secure
owner credential handoff. Never paste secrets in chat, commit them, put them in
`dist/`, command arguments, reports or `.openai/hosting.json`.

| Setting | Required value/source |
| --- | --- |
| `STRIPE_SECRET_KEY` | Actual connected-account test API key; official adapter accepts test secret/restricted test keys only. Connector authentication is not this key. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the actual test account snapshot destination at `/api/stripe/webhook`, explicit STRIPE_WEBHOOK_API_VERSION (current target2026-09-30.endive) |
| `COMMERCE_POLICY_JSON` | Reviewed merchant price/tax/country policy matching the already connected account/store/test scope; exact fields below |

Keep the existing Printful/session secrets. Do not rotate or re-enter the
Printful credential merely to repeat a successful authentication check.

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
those schema-only migrations before readiness is accepted. Repository `migrate()`
is only a readiness check; HTTP requests must never create schema. Actual hosted
migration is currently pending, despite passing SQLite-backed D1-interface tests.

After native deployment, verify catalog/status and a safe shipping estimate,
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
native D1 readiness, live Worker catalog/shipping, authorized Stripe test payment,
fresh server verification and one safely linked Printful draft before accepting
end-to-end operation. No real payment/draft has been created so far. Paid Printful
confirmation has no method and requires separate authorization/implementation.

Customer refund/cancellation initiation, durable Printful status/tracking/
notifications and administrative visibility remain incomplete. Immutable order
JSON has no completed retention/anonymization path; resolve before production
customer processing. Keep database/provider state during rollback, and never
reset the single-POST gate to recover an uncertain remote create.
