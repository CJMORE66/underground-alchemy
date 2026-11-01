# Commerce verification results

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Distinguish
live authorized reads, actual SQLite-backed tests, fixture providers, prepared
builds and still-pending native deployment. No actual payment or order was created.

## Real connected-service evidence

| Check | Observed result | Limit |
| --- | --- | --- |
| Authorized Printful `GET /stores` | HTTP 200; expected store 18912189 once among seven native stores | Read authentication/store membership, not payment or fulfillment |
| Real full CLI catalog sync | 20 products/86 variants; 83 active, 3 temporary_out_of_stock; all retail currencies EUR; checked `2026-11-01T10:10:57.292386Z` | Time-specific provider metadata, not guaranteed stock/deliverability or approved customer tax policy |
| SKU/mapping comparison | Actual provider SKU retained; exact original `PF-…` alias becomes `sourceSku`; sync/product/catalog IDs unchanged | Narrow documented alias migration only; arbitrary real-SKU/ID drift still fails |
| Real Node Printful shipping estimate | Catalog variant 51734 × 1 to official US/California test destination; STANDARD €4.69 | One observed destination/time-specific rate; not hardcoded/global shipping; orders created 0 |
| Connected Stripe account/Tax reads | Test account `livemode:false`, Tax active, two active Czech registrations: inbound_goods/small_seller | Connector auth is not a runtime API key; no Checkout/payment/destination delivery proven |
| Sites runtime configuration | Revision 2 has masked Printful/session secrets | Stripe key, endpoint signing secret and merchant policy absent; checkout must fail closed |

No raw credentials, authentication URLs or customer address payloads are evidence
artifacts. The shipping destination was an official test destination, not a
customer order. No provider write/charge/paid fulfillment is claimed.

## Current automated checks

| Command/group | Result | Evidence category |
| --- | --- | --- |
| `npm run test:stripe` | PASS, 56 cases: 29 Stripe adapter + 14 SQLite + 13 workflow | Official SDK signatures/Fetch behavior with fixture provider responses; actual private-disk SQLite in repository/workflow tests |
| `npm run test:commerce:worker` | PASS, 86 cases: 20 D1 + 17 quote + 22 live catalog + 27 HTTP | D1-interface shim backed by real SQLite; fresh quote/mapping/ownership/Origin/body/rate-limit/webhook cases; provider traffic is mocked |
| `node tests/commerce-server.mjs` | PASS, 19 cases | Existing provider/order safety fixtures, not real account/order calls |
| `python tests/printful-sync.py` | PASS, 29 cases | Mock HTTP importer: full/incremental/empty/pagination/retries, aliases, mapping and public-field/atomic-write guards |
| SHOP/cart/checkout UI tests | PASS | DOM/model fixtures including CS/EN/FR address, shipping selection, stale response/quote invalidation, redirect and order-state boundaries |
| Atlas/shared language regressions | PASS after generated-output walk correction | Only generated root output directories excluded from source-page traversal; real source entrypoints remain checked |
| Worker build | PASS at first prepared build; 810.76 kB entry, 123.81 kB gzip; 680 frontend assets / 188,107,785 bytes preserved | Sites/Vite/Cloudflare output with asset byte checks, not native deployment or live runtime proof; dependency refresh/rebuild pending |
| Managed local Miniflare | UNVERIFIED / hung | Not reported as a passing Worker/D1 test; SQLite-backed shim tests are a separate category |
| Production dependency audit (`--omit=dev`) | PASS, zero known advisories | Production dependency graph only |
| Full development dependency audit | PASS, zero advisories after patched build dependencies | Native installer/build rerun follows; prior 11 findings are retained as remediation history |

No fixture success proves real Stripe Tax calculation, captured test payment,
webhook delivery, hosted D1 transaction or Printful draft. Provider errors are
sanitized; no raw payment card data is handled.

## Still required live acceptance

- Native D1 schema-only migrations, Worker/ASSETS deployment, production catalog/
  image/status/shipping smoke and logs.
- Runtime Stripe test key, actual snapshot endpoint secret and reviewed merchant
  price/tax/country policy; real authorized successful/failed/delayed test Checkout.
- Fresh live Session/line/shipping/address/tax/total/PI/charge/refund verification,
  actual signed delivery/retry and one safely linked Printful draft/reconciliation.
- Durable Printful receiver/status/tracking, customer notifications, customer
  refund/cancellation initiation, operational failure handling and PII retention.

No paid Printful confirmation method exists. Do not convert a draft or a test
payment result into a paid-production claim.

## Dated production baseline: 31 October / version 31

Native static version 31 publication succeeded. Production browser verified the
historical 20/86 grid, exact OMERTA Black/2XL alias and dated price, local add/
reload/quantity/remove, disabled checkout and CS/EN/FR switching. Test cart was
returned to empty. 320/390px checks were rendered browser iframes, not physical
phones. Browser Site-origin error filter and bounded Worker error query found no
Site errors. These are prior static observations, not today's pending live API
or payment proof.

## Pending final record — update after native release

Record final dependency audit/build/check commands, source commit, native version/
deployment IDs, actual migration result, production smoke and relevant errors.
Until those observations exist, new release/migration/hosted smoke remain PENDING.
See `PRINTFUL_DEPLOYMENT.md`.

## Final release candidate checks

- Runtime and full development dependency audits now exit0 with zero known advisories.
  Patched build pins: Vite8.3.5, Cloudflare Vite plugin1.66.0, Wrangler4.156.0,
  DrizzleKit0.31.11; scoped esbuild0.28.2 override passes actual schema generation
  without changing any migration/snapshot bytes. This supersedes the earlier
  11 development findings; no vulnerability count is hidden by omitting dev dependencies.
- Stripe suite now56 passes:29 adapter/signature,14 actualSQLite,13 workflow.
- The SDK/API client remains2026-10-28.endive. The Stripe MCP endpoint-creation
  schema supports2026-09-30.endive as its latest selectable snapshot contract.
  The Worker explicitly accepts that configured version only after matching
  signature/routing/schema checks; payment proof still requires fresh October API reads.
- Runtime configuration revision3 adds STRIPE_WEBHOOK_API_VERSION; no API key or
  endpoint signing secret has been configured yet. Hosted migration/deployment
  and smoke results remain pending below; no payment or fulfillment was created.
