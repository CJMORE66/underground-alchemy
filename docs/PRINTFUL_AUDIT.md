# Printful / Stripe integration audit

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Printful
read authentication/catalog and one shipping estimate are verified live from
Node. Worker versions 32–34 are deployed and native D1/status are verified, but
the production catalog is still broken by native Fetch receiver binding and
Cloudflare-unsupported `redirect:'error'`. Both code fixes/regression tests are
ready; their deployment/new production proof are pending. Payment remains blocked.

## Verified current facts

- Real authorized `GET /stores` returned HTTP 200. Expected store **18912189**
  occurred exactly once among **seven** native account stores. Store verification
  no longer incorrectly requires an account-level token to see only one store.
- Real full CLI sync at **2026-11-01T10:10:57.292386Z** fetched **20 products /
  86 variants**: **83 active**, **3 temporary_out_of_stock**, all retail currencies
  **EUR**. These are actual observations, not historical count targets.
- The actual Node `LivePrintfulCatalog` adapter also fetched the real **20/86**
  using the authorized credential. This is live adapter evidence, distinct from
  both the CLI import and synthetic local workerd responses.
- Actual Printful SKUs differ from the original storefront's `PF-…` aliases.
  Exact sync/product/catalog IDs were preserved; only that documented alias
  migration is allowed. `sku` now holds the actual provider value; `sourceSku`
  preserves the original alias. Historical `sourcePrice` dates remain unchanged.
- A real read-only shipping estimate for catalog variant 51734, quantity 1, to
  Printful's official US/California test destination returned **STANDARD €4.69**.
  This is one destination/time-specific estimate, not a fixed/global rate.
  Orders created: **0**.
- A real connected Stripe test account was inspected: `livemode:false`, Tax
  settings active, two active Czech registrations (`inbound_goods`, `small_seller`).
  That observation does not approve merchant tax treatment/country coverage.
  Connector authentication does **not** provide a runtime Stripe API key.
- Runtime revision **4** has masked Printful/session/webhook secrets and explicit
  `STRIPE_WEBHOOK_API_VERSION=2026-09-30.endive`. The real test Stripe endpoint is
  registered and enabled in test mode; no actual delivery is verified. Only
  `STRIPE_SECRET_KEY` and reviewed `COMMERCE_POLICY_JSON` remain owner inputs.
- Native `COMMERCE_DB` has **seven actual tables**. Production status returned
  HTTP 200 with `mode:test`, catalog/shipping available and checkout unavailable.
  Those flags report configuration/schema readiness, not a successful provider
  catalog fetch. No payment/order has been created.

## Current source and release boundary

The supported implementation is now a **Sites Cloudflare Worker + ASSETS + D1**.
`.openai/hosting.json` keeps project `appgprj_6ad19e715dcc819185592c61456c5182`,
declares `d1: COMMERCE_DB` and omits static hosting. Vite/Cloudflare/Sites build
preserves the maintained `dist/` frontend and emits Worker/assets deployment output.
No separate hosting account or mandatory NAS recovery is needed for this path.

Latest observed production is **version 34**, source `3ee4110`; versions 32
(`467723d`) and 33 (`c8ec0ef`) preceded it. Version 31 is the known-good static
rollback. GitHub [PR #4](https://github.com/CJMORE66/underground-alchemy/pull/4)
head `ceac189` passed CI #10; later changes need their own result. GitHub and
Sites histories/deployments remain separate. See `PRINTFUL_DEPLOYMENT.md`.

## Component classification

| Component | Status | Evidence / remaining boundary |
| --- | --- | --- |
| Printful auth / expected store | WORKING | Real HTTP 200; canonical expected store exactly once among seven |
| Real catalog / variant mapping | WORKING | Full live 20/86 read; actual SKU + preserved legacy alias and stable IDs |
| Production catalog API | BROKEN | V34 TRANSPORT_ERROR has two confirmed causes: wrong native Fetch receiver and unsupported redirect:error. Both fixes/tests ready; not production-deployed/verified |
| Retail prices / availability | WORKING for observations | Live EUR retail metadata and 83/3 availability; merchant selling-price/tax approval still required |
| Product imagery | INCOMPLETE | Public preview/local asset allowlists and build checks pass; new hosted runtime/browser image smoke pending |
| Frontend / local cart / CZ/EN/FR | WORKING for prior release and fixtures | Existing release 31 browser checks; new address/shipping/quote/pay/status UI tested with fixtures, hosted smoke pending |
| Server routes / ownership / abuse controls | INCOMPLETE | Native status and D1 readiness work; ownership/Origin/body/limits pass fixture tests; real provider route still needs repaired hosted smoke |
| Shipping | INCOMPLETE | One real address-specific estimate works; hosted frontend/API integration pending |
| Customer price / tax quote | INCOMPLETE | Fresh server catalog/price/variant/shipping binding and Stripe Tax frozen quote implemented; approved `COMMERCE_POLICY_JSON` and runtime Stripe key absent |
| Stripe account | WORKING connector read | Existing test account and active Tax registrations observed; no runtime key or test payment verified |
| Stripe Checkout / payment verification | BLOCKED | Official SDK 23.1.0/API 2026-10-28.endive implemented; actual runtime API key and merchant policy absent; signing secret already configured |
| D1 persistence / migrations | INCOMPLETE | Native seven-table schema/status verified; scoped repository tests pass. No actual payment/order persisted; further fulfillment projection migration is in progress |
| Internal order / duplicate prevention | INCOMPLETE | Durable leases, unique scope/payment/order bindings and single-POST gate tested; no actual hosted order/payment |
| Stripe webhook | INCOMPLETE | Real enabled test-mode endpoint and masked secret/version configured; keyless raw signature admission tested, but actual delivery/payment processing not verified |
| Printful draft | BLOCKED live | Draft-only safe adapter/tests; no real draft created |
| Fulfillment status / tracking | INCOMPLETE | Signed-v2 helper exists; owner-visible durable projection/read-side synchronization and new migration are in progress, not accepted as production-working |
| Refund / cancellation / notifications | INCOMPLETE | Fresh refund/dispute detection exists; initiating customer refunds/cancellations and notifications are not implemented |
| Build / CI / deploy | INCOMPLETE | Versions 32–34 and native D1 deployed; CI #10 passed earlier PR head. Latest runtime fix/migration/build/CI and full production smoke remain pending |
| Security / retention | INCOMPLETE | Secret separation, price binding, signatures, ownership and scoped D1 tested; immutable address-bearing order JSON lacks a completed retention/anonymization lifecycle |

## Root causes addressed and remaining limits

The earlier Site was static catalog presentation, with an unavailable external
checkout and an unpublished repair PR. A single-store-only authentication check
and strict comparison against legacy storefront SKU placeholders would reject
the real account/catalog. Canonical store membership and narrowly bound SKU
alias migration fix those mismatches. Current Worker/D1 code replaces the earlier
mandatory external-backend dependency while preserving frontend identity.
Native v33 exposed a cache lookup error; v34 makes the cache optional/safe and
then exposed Printful TRANSPORT_ERROR. Investigation confirmed calling stored
native workerd Fetch with the wrong receiver, and separately confirmed that
Cloudflare does not support `redirect:'error'`. The repair binds native Fetch
correctly, uses `redirect:'manual'` and explicitly rejects redirect responses.
Both code fixes/tests are ready but not deployed. Node reads and synthetic runs
are not proof of the repaired production path. Durable cache/table and fulfillment
projection migrations are also pending; current native database remains seven
verified tables until a later migration is actually observed.

Actual payment configuration and approved merchant policy are now the main
external dependencies. Runtime repair, further projection migration, hosted smoke and remaining order/status/
notification/retention work still require verification or implementation. No
paid Printful confirmation method exists. No real payment/order was submitted.
A passing provider fixture is never evidence of live payment or fulfillment.

References: [Printful v1](https://developers.printful.com/docs/),
[Printful v2 beta](https://developers.printful.com/docs/v2-beta/),
[Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe webhooks](https://docs.stripe.com/webhooks),
[Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api).
