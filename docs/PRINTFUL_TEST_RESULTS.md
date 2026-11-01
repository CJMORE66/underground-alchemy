# Commerce verification results

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Distinguish
live authorized reads, actual SQLite-backed tests, fixture providers, prepared
builds and native deployments. Versions 32–34 and initial D1 schema are deployed,
but production provider transport is broken and a fix is pending. No actual
payment or order was created.

## Real connected-service evidence

| Check | Observed result | Limit |
| --- | --- | --- |
| Authorized Printful `GET /stores` | HTTP 200; expected store 18912189 once among seven native stores | Read authentication/store membership, not payment or fulfillment |
| Real full CLI catalog sync | 20 products/86 variants; 83 active, 3 temporary_out_of_stock; all retail currencies EUR; checked `2026-11-01T10:10:57.292386Z` | Time-specific provider metadata, not guaranteed stock/deliverability or approved customer tax policy |
| Real Node LivePrintfulCatalog adapter | Actual authorized provider read also returned 20 products/86 variants | Distinct from the CLI and synthetic local workerd; not proof of production Worker transport |
| SKU/mapping comparison | Actual provider SKU retained; exact original `PF-…` alias becomes `sourceSku`; sync/product/catalog IDs unchanged | Narrow documented alias migration only; arbitrary real-SKU/ID drift still fails |
| Real Node Printful shipping estimate | Catalog variant 51734 × 1 to official US/California test destination; STANDARD €4.69 | One observed destination/time-specific rate; not hardcoded/global shipping; orders created 0 |
| Connected Stripe account/Tax reads | Test account `livemode:false`, Tax active, two active Czech registrations: inbound_goods/small_seller | Connector auth is not a runtime API key; no Checkout/payment/destination delivery proven |
| Sites runtime configuration | Revision 4 has masked Printful/session/actual webhook secrets and September snapshot version | Runtime Stripe API key and merchant policy absent; checkout fails closed |
| Actual Stripe snapshot endpoint | `we_1UWw4LPkIIV492Qzkv8SzPaj`, status enabled, livemode:false/test mode, September 30 contract, four events | Registration/secret configuration succeeded; no actual signed delivery/payment verified |
| Native D1/status | Seven actual COMMERCE_DB tables; status HTTP 200 with test/catalog/shipping true and checkout false | Schema/config readiness, not a successful external catalog request or actual order persistence |

No raw credentials, authentication URLs or customer address payloads are evidence
artifacts. The shipping destination was an official test destination, not a
customer order. The enabled test-mode Stripe endpoint was registered; no payment/order/
charge/paid fulfillment was submitted.

## Current automated checks

| Command/group | Result | Evidence category |
| --- | --- | --- |
| `npm run test:stripe` | PASS, 56 cases: 29 Stripe adapter + 14 SQLite + 13 workflow | Official SDK signatures/Fetch behavior with fixture provider responses; actual private-disk SQLite in repository/workflow tests |
| `npm run test:commerce:worker` | Last aggregate PASS, 89 cases; receiver/redirect repair regressions now ready, updated final/projection count pending | D1-interface shim backed by real SQLite; provider responses mocked; repaired native production path needs its own proof |
| `node tests/commerce-server.mjs` | PASS, 19 cases | Existing provider/order safety fixtures, not real account/order calls |
| `python tests/printful-sync.py` | PASS, 29 cases | Mock HTTP importer: full/incremental/empty/pagination/retries, aliases, mapping and public-field/atomic-write guards |
| SHOP/cart/checkout UI tests | PASS | DOM/model fixtures including CS/EN/FR address, shipping selection, stale response/quote invalidation, redirect and order-state boundaries |
| Atlas/shared language regressions | PASS after generated-output walk correction | Only generated root output directories excluded from source-page traversal; real source entrypoints remain checked |
| Worker build/deploy | Initial byte-preserving build and native versions 32–34 succeeded | Final receiver/projection repair build/deploy/proof pending; deployment success alone did not prove catalog health |
| Actual local workerd | Synthetic provider 20/86 execution succeeded in later runs | Actual runtime with synthetic provider responses; not real Printful egress. Initial Miniflare hang is dated earlier evidence, not current blanket failure |
| Production dependency audit (`--omit=dev`) | PASS, zero known advisories | Production dependency graph only |
| Full development dependency audit | PASS, zero advisories after patched build dependencies | Native installer/build rerun follows; prior 11 findings are retained as remediation history |

No fixture success proves real Stripe Tax calculation, captured test payment,
webhook delivery, actual order transaction or Printful draft. Provider errors are
sanitized; no raw payment card data is handled.

## Still required live acceptance

- Repair native provider Fetch binding and demonstrate production catalog/
  image/shipping smoke. Initial native D1/status are already verified; the new
  fulfillment projection migration/tests/deployment are still pending.
- Runtime Stripe test API key and reviewed merchant
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

## Native release diagnostics and pending final proof

- Version 32, source `467723d`, deployed the Worker/D1 architecture.
- Version 33, source `c8ec0ef`, added safe diagnostics; native logs confirmed a
  cache lookup failure (cache.match frame 23440). This was real runtime evidence,
  not a simulated failure or a reason to retry credentials.
- Version 34, source `3ee4110`, made the cache optional/safe. It then returned
  Printful TRANSPORT_ERROR. Investigation confirmed stored native workerd Fetch
  was invoked with the wrong receiver. A second confirmed cause is unsupported
  Cloudflare `redirect:'error'`. Correct receiver binding and `redirect:'manual'`
  with explicit redirect rejection fixes/tests are ready, not deployed. Real Node
  adapter reads still work; repaired production success is not yet accepted.
- GitHub PR #4 head `ceac189` passed CI #10. Later fixes need a new CI/result;
  this successful run is not evidence of later deployed behavior.

Record final dependency audit/build/check commands, source commit, native version/
deployment IDs, new projection migration result, production smoke and errors.
Until those observations exist, the next repair release/full hosted smoke remain
PENDING; retain the failed real observations instead of calling v34 healthy.
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
- Runtime revision 3 added snapshot version; revision 4 subsequently added the
  actual masked endpoint signing secret. Only runtime API key/merchant policy
  remain owner configuration blockers. Native initial schema/deployment are now
  verified; no payment/order/fulfillment has been created.
