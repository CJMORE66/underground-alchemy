# Commerce test results / evidence boundaries

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. V35 production catalog,
shipping and nine-table D1 work; one standalone real Printful draft is verified.
Stripe payment and the full internal paid-order workflow remain unverified.
V36 final UI-gate deployment and actual shipping/gate browser smoke pass.

## Actual provider and production evidence

| Check | Result | What it does not prove |
| --- | --- | --- |
| Printful auth/store | Real GET HTTP 200; expected store 18912189 once among seven | Payment/fulfillment |
| CLI + actual Node LivePrintfulCatalog | Real 20 products/86 variants; 83 active/3 temporary out of stock; EUR; CLI checked 2026-11-01T10:10:57.292386Z | Guaranteed stock, all destinations or approved customer tax policy |
| Production browser v35 | Actual live 20/86/83/3 catalog, product/cart/reload/quantity and CZ/EN/FR desktop pass | Current-release real mobile viewport, Stripe payment or actual shipments |
| Product availability/gallery | Faded Grey/L out-of-stock option cannot add; second Printful preview naturalWidth 800 | No physical garment/sample verification |
| V36 production status/cart | Status HTTP 200: mode test, catalog/shipping true, checkout false; quantity 1 survives reload; test cart cleaned to 0 and persists | No actual Stripe/internal paid order |
| V36 final actual shipping/gate smoke | PASS 10:54 UTC: live catalog 20/86/83 active, checkedAt 2026-11-01T10:53:57.110Z; fresh address sample returns €8.39/€8.47; STANDARD selection keeps tax quote disabled | Correct shipping-only behavior, not a successful payment |
| V36 actual D1 order/mapping rows | Both tables have zero rows/no_more | Standalone Printful test draft was not falsely persisted as an internal paid order |
| Actual browser shipping | OMERTA WITH EGO Black/M × 1, official US/California test destination: STANDARD Flat Rate €8.39 and CO2 €8.47 | Universal or fixed shipping prices; rates are destination/time-specific |
| Earlier Node shipping | Catalog variant 51734 × 1, official test destination: STANDARD €4.69 | Same product/destination-independent price |
| Native D1 | Nine tables incl fulfillment/public cache; store 18912189 row, 60,000 ms TTL, lease NULL | Full cached payload parsing from bounded reader: payload text is truncated and was not treated as complete JSON evidence |
| Real standalone draft | 184026933, external UA_TEST_20261101_1a196badad6, confirm=false; authenticated GET verifies draft | Stripe payment, actual internal paid order or the full payment-to-draft workflow |
| Stripe account/Tax/endpoint | Test account and active settings/registrations; enabled test September four-event endpoint/secret configured | Runtime API key, actual order Tax calculation, real signed delivery/captured test payment |
| Recent native error interval | Last 5-minute/25-event error query returns 0 events | Bounded window/log lag, not all-time clean logs; fixed failures remain historical |

Real draft authenticated GET was verified at recorded 10:50:18 UTC. Item:
sync 5577001692 / catalog 51734 × 1, name
UA INTEGRATION TEST DRAFT ONLY. No charge/production confirmation occurred. It
remains in Printful; no fake paid internal order was inserted for this proof.
No raw credentials, auth URLs or customer address payloads are test artifacts.

## Current automated / build evidence

| Command/group | Result | Category |
| --- | --- | --- |
| python tests/printful-sync.py | PASS, 29 cases | Isolated mock provider HTTP/importer mapping/retry/alias/atomic-write tests |
| node tests/commerce-server.mjs | PASS, 21 cases | Provider/order safety fixtures including native-call/redirect behavior |
| npm run test:stripe | PASS, 57 cases | Official SDK signatures/Fetch and fixture provider responses; real local SQLite in repository/workflow cases |
| npm run test:commerce:worker | PASS, 120 cases | D1-interface SQLite-backed tests, quote/live-catalog/HTTP, fulfillment CAS/projection and public-cache tests; provider values are fixtures |
| Focused groups total | PASS, 227 cases | 29 + 21 + 57 + 120; not 227 real provider calls |
| SHOP/cart/checkout UI groups | PASS | DOM/model: CZ/EN/FR, input/rates/quote expiry, redirects, owner status, multiple/partial tracking and shipping-only quote gate |
| node tests/commerce-workerd.mjs | PASS, 3 additional cases | Actual generated Worker bundle under local workerd/native D1; all outbound calls terminate in isolated synthetic handlers |
| Native-bundle D1 cache check | PASS | Second inbound request makes zero extra synthetic Printful reads; TTL 60 seconds, lease released; distinct from real provider proof |
| Atlas/shared languages/build/release/Drizzle | PASS | Retained frontend checks, byte-preserving native build, 17 syntax checks and unchanged schema-generation/migration contract |
| Final v36 build | PASS, 680 authored assets / 188,108,386 bytes, Worker 836.58 kB | Byte-preserved build is separate from actual payment acceptance |
| Runtime + full dependency audit | PASS, zero known advisories | Bounded known-advisory check, not a penetration test |
| Actual Printful credential exact-value scan | PASS, 0 matches across 533 source/public text files at 10:55 UTC | Exact configured value was not printed; limited to checked text files, not a universal Git-history/binary-secret audit |
| GitHub CI #12 | PASS at a2c7d8a6b3b91e476b74213c5cb4084311fe8837, including native bundle | https://github.com/CJMORE66/underground-alchemy/actions/runs/41299341644 ; documentation-only follow-up can be later |

After v35 browser found the quote button enabled during shipping-only mode, the
server remained fail-closed (503). Source
b5d613845852a5e14d20f4a3072189726b84fada fixes button/handler readiness and adds a
meaningful regression. Subsequent UI/shop/cart/build/release and three isolated
bundle tests pass. V36 deployed successfully at 2026-11-01T10:53:43.921359+00:00
(UTC); final status/catalog/shipping/gate/cart-cleanup smoke passed at 10:54 UTC.
Fresh reload leaves the address form empty. Current real mobile viewport remains
unverified despite desktop/DOM and older iframe checks.

## Required remaining live acceptance

- Secure runtime Stripe test API key and approved merchant price/tax/country policy.
- Actual Stripe Tax quote, successful/failed/delayed authorized test Checkout,
  real signed delivery/redelivery, fresh captured-payment verification, one
  persisted internal order and one linked Printful draft without duplicates.
- Actual linked paid-order fulfillment status/shipment progression; code/CAS/UI
  fixtures alone are not production tracking proof.
- Full Printful receiver/notifications/refund initiation/admin recovery and
  approved address-data retention/anonymization. No paid confirmation method exists.

## Dated failure / baseline history

Version 31's static browser/cart/language checks passed; its mobile iframe
checks are historical, not current mobile acceptance. V33 native cache errors
and v34 wrong native Fetch receiver / unsupported redirect:error were real
failures. Correct binding, manual mode with explicit redirect rejection and D1
caching repaired v35. Earlier Miniflare hang is superseded by later distinct
actual-workerd isolated successes; old failures were not erased from logs.

## Final release record

V36 exact IDs/source/archive and successful native result are in DEPLOYMENT.
The final actual shipping/quote-disabled browser smoke and recent bounded error
interval pass as recorded above. Do not claim end-to-end verified
working from any isolated draft, fixture suite or successful deployment.

Actual desktop collection evidence: [PRINTFUL_SHOP_VERIFIED.jpg](evidence/PRINTFUL_SHOP_VERIFIED.jpg)
(95,391 bytes; live notice/20 products, no test address/customer data visible).
Final browser location: https://caisik-underground-alchemy.caisik.chatgpt.site/shop/#shop-collection .
