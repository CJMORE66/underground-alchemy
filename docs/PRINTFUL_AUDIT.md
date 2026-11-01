# Printful / Stripe integration audit

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Printful
read authentication/catalog and one shipping estimate are verified live.
Checkout/payment/fulfillment remain blocked; the new Worker release is prepared
but not yet deployed in this document's current evidence snapshot.

## Verified current facts

- Real authorized `GET /stores` returned HTTP 200. Expected store **18912189**
  occurred exactly once among **seven** native account stores. Store verification
  no longer incorrectly requires an account-level token to see only one store.
- Real full CLI sync at **2026-11-01T10:10:57.292386Z** fetched **20 products /
  86 variants**: **83 active**, **3 temporary_out_of_stock**, all retail currencies
  **EUR**. These are actual observations, not historical count targets.
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
- Sites runtime environment revision **2** has masked Printful/session secrets;
  the catalog uses the existing Manual/API store family. `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `COMMERCE_POLICY_JSON` are not configured.

## Current source and release boundary

The supported implementation is now a **Sites Cloudflare Worker + ASSETS + D1**.
`.openai/hosting.json` keeps project `appgprj_6ad19e715dcc819185592c61456c5182`,
declares `d1: COMMERCE_DB` and omits static hosting. Vite/Cloudflare/Sites build
preserves the maintained `dist/` frontend and emits Worker/assets deployment output.
No separate hosting account or mandatory NAS recovery is needed for this path.

Public production is still saved **version 31** until the pending native
publication is verified. GitHub [PR #4](https://github.com/CJMORE66/underground-alchemy/pull/4)
and Sites have separate histories; a push/merge does not itself deploy the Site.
See `PRINTFUL_DEPLOYMENT.md` for the prior release and pending update fields.

## Component classification

| Component | Status | Evidence / remaining boundary |
| --- | --- | --- |
| Printful auth / expected store | WORKING | Real HTTP 200; canonical expected store exactly once among seven |
| Real catalog / variant mapping | WORKING | Full live 20/86 read; actual SKU + preserved legacy alias and stable IDs |
| Retail prices / availability | WORKING for observations | Live EUR retail metadata and 83/3 availability; merchant selling-price/tax approval still required |
| Product imagery | INCOMPLETE | Public preview/local asset allowlists and build checks pass; new hosted runtime/browser image smoke pending |
| Frontend / local cart / CZ/EN/FR | WORKING for prior release and fixtures | Existing release 31 browser checks; new address/shipping/quote/pay/status UI tested with fixtures, hosted smoke pending |
| Server routes / ownership / abuse controls | UNVERIFIED hosted | Worker routes, signed guest cookie, exact Origin checks, bounded JSON and owner/network rate limits pass HTTP fixtures |
| Shipping | INCOMPLETE | One real address-specific estimate works; hosted frontend/API integration pending |
| Customer price / tax quote | INCOMPLETE | Fresh server catalog/price/variant/shipping binding and Stripe Tax frozen quote implemented; approved `COMMERCE_POLICY_JSON` and runtime Stripe key absent |
| Stripe account | WORKING connector read | Existing test account and active Tax registrations observed; no runtime key or test payment verified |
| Stripe Checkout / payment verification | BLOCKED | Official SDK 23.1.0/API 2026-10-28.endive implemented; actual runtime test key/policy/endpoint secret absent |
| D1 persistence / migrations | UNVERIFIED hosted | Scoped async repository and two schema-only Drizzle migrations; 20 SQLite-backed D1-interface tests pass; native migration pending |
| Internal order / duplicate prevention | INCOMPLETE | Durable leases, unique scope/payment/order bindings and single-POST gate tested; no actual hosted order/payment |
| Stripe webhook | INCOMPLETE | Raw SDK signature verification can admit to durable inbox without API key; valid pending work returns 503 if payment config is missing; actual destination/secret/delivery pending |
| Printful draft | BLOCKED live | Draft-only safe adapter/tests; no real draft created |
| Printful status / tracking webhook | INCOMPLETE | Signed v2 reducer helper exists; no connected durable Printful receiver/subscription/delivery verified |
| Refund / cancellation / notifications | INCOMPLETE | Fresh refund/dispute detection exists; initiating customer refunds/cancellations and notifications are not implemented |
| Build / CI / deploy | INCOMPLETE | Worker build passed with byte-preserved frontend; native deployment/migration, final CI and production smoke pending |
| Security / retention | INCOMPLETE | Secret separation, price binding, signatures, ownership and scoped D1 tested; immutable address-bearing order JSON lacks a completed retention/anonymization lifecycle |

## Root causes addressed and remaining limits

The earlier Site was static catalog presentation, with an unavailable external
checkout and an unpublished repair PR. A single-store-only authentication check
and strict comparison against legacy storefront SKU placeholders would reject
the real account/catalog. Canonical store membership and narrowly bound SKU
alias migration fix those mismatches. Current Worker/D1 code replaces the earlier
mandatory external-backend dependency while preserving frontend identity.

Actual payment configuration and approved merchant policy are now the main
external dependencies. Schema migration, hosted smoke and remaining order/status/
notification/retention work still require verification or implementation. No
paid Printful confirmation method exists. No real payment/order was submitted.
A passing provider fixture is never evidence of live payment or fulfillment.

References: [Printful v1](https://developers.printful.com/docs/),
[Printful v2 beta](https://developers.printful.com/docs/v2-beta/),
[Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe webhooks](https://docs.stripe.com/webhooks),
[Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api).
