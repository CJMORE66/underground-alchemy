# Commerce test results / evidence boundaries

Updated: 1 November 2026. Overall **PARTIALLY WORKING**. Native **v39 / env5**
is deployed, actual D1 has 12 tables, and a real signed Printful callback is
durably admitted/ignored as unmapped. Stripe payment and the full internal
paid-order workflow remain unverified. V35–v37 observations below are dated
baselines, not substitutes for current acceptance. V39 adds bounded UI retry;
the real signed provider callback evidence remains the v38 observation.

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
| V35–v37 D1/cache baseline | Nine tables incl fulfillment/public cache; store 18912189 row, 60,000 ms TTL, lease NULL | Full cached payload parsing from bounded reader: payload text is truncated and was not treated as complete JSON evidence |
| Real standalone draft | 184026933, external UA_TEST_20261101_1a196badad6, confirm=false; authenticated GET verifies draft | Stripe payment, actual internal paid order or the full payment-to-draft workflow |
| Stripe account/Tax/endpoint | Test account and active settings/registrations; enabled test September four-event endpoint/secret configured | Runtime API key, actual order Tax calculation, real signed delivery/captured test payment |
| V36 native error interval (dated) | Its 5-minute/25-event error query returned 0 events | Historical bounded result, not a current all-time log result |
| V37 final status/cart/log follow-up | Actual status HTTP 200: mode test/catalog+shipping true/checkout false; modal closed CZ, cart 0, live20 notice. 11:04 UTC error query returns 3 ancillary404s only: favicon.ico/sitemap.xml/robots.txt, outcome ok | No commerce_request_failed/API failures in returned 5-minute/25-event window; bounded/lag limits apply, not zero/all-time clean logs |

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
| npm run test:commerce:worker | PASS, 166 cases | D1-interface SQLite-backed tests, quote/live-catalog/HTTP, fulfillment CAS/projection and public-cache tests; provider values are fixtures |
| Focused groups total | PASS, 273 cases | 29 + 21 + 57 + 166; not 273 real provider calls |
| SHOP/cart/checkout UI groups | PASS | DOM/model: CZ/EN/FR, input/rates/quote expiry, redirects, owner status, multiple/partial tracking and shipping-only quote gate |
| node tests/commerce-workerd.mjs | PASS, 3 additional cases | Actual generated Worker bundle under local workerd/native D1; all outbound calls terminate in isolated synthetic handlers |
| Native-bundle D1 cache check | PASS | Second inbound request makes zero extra synthetic Printful reads; TTL 60 seconds, lease released; distinct from real provider proof |
| Atlas/shared languages/build/release/Drizzle | PASS | Retained frontend checks, byte-preserving native build, 19 syntax checks and unchanged schema-generation/migration contract |
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

## Verified v37 frontend-only copy correction

Verified frontend-only v37 source
`a57f86b285a0aae0d156b5ad501b203078095920` fixes the observed live detail's
obsolete original-store-only wording. Six additional DOM scenarios cover
CS/EN/FR × live/fallback, retaining native cart action and historical price dates.
UI/shop/cart and language suites pass; dictionaries have 2,942 matching keys × 3.
Build/release pass: 680 authored assets / 188,113,092 bytes, frontend hash
`8b38bf76f09e43e7d1675227927db61005bf458aa048c876b0627ddde0156967`,
unchanged Worker 836.58 kB. Native v37 deployed successfully at
`2026-11-01T11:02:50.549892+00:00`. Actual live API returns printful-live/true,
20/86 and 83 active, checked `2026-11-01T11:03:03.836Z`. Visible live detail in CS/EN/FR after
lazy dictionary loading shows the new server-recheck/availability policy with
native Add/Open Cart and no obsolete disabled external CTA. Fallback remains
fixture coverage; do not add these six scenarios to the 227-case total.
CI #14 passes at `d3d9adba105d5432c319f796fa7781554c78cc9e`:
https://github.com/CJMORE66/underground-alchemy/actions/runs/41300046055 .

## Required remaining live acceptance

- Secure runtime Stripe test API key and approved merchant price/tax/country policy.
- Actual Stripe Tax quote, successful/failed/delayed authorized test Checkout,
  real signed delivery/redelivery, fresh captured-payment verification, one
  persisted internal order and one linked Printful draft without duplicates.
- Actual linked paid-order fulfillment status/shipment progression; code/CAS/UI
  fixtures alone are not production tracking proof.
- Actual mapped Printful reconciliation/retry/dead-letter behavior and shipment
  progression; notifications/refund initiation/full operations and approved
  address-data retention/anonymization. Actual unmapped admission is verified.
  No paid confirmation method exists.

## Dated failure / baseline history

Version 31's static browser/cart/language checks passed; its mobile iframe
checks are historical, not current mobile acceptance. V33 native cache errors
and v34 wrong native Fetch receiver / unsupported redirect:error were real
failures. Correct binding, manual mode with explicit redirect rejection and D1
caching repaired v35. Earlier Miniflare hang is superseded by later distinct
actual-workerd isolated successes; old failures were not erased from logs.

## Final release record

Current v39 and historical v36–v38 exact IDs/source/archive and successful
native results are in DEPLOYMENT.
The v36 actual shipping/quote-disabled smoke, v37 live-copy/status/cart checks
and distinct bounded log observations are recorded above. The dated v37 query
has three ancillary static404s, not zero events. Do not claim end-to-end verified
working from any isolated draft, fixture suite or successful deployment.

Actual desktop collection evidence: [PRINTFUL_SHOP_VERIFIED.jpg](evidence/PRINTFUL_SHOP_VERIFIED.jpg)
(live notice/20 products, no test address/customer data visible; final stable
collection evidence is retained at this path).
Final browser location: https://caisik-underground-alchemy.caisik.chatgpt.site/shop/#shop-collection .

## Verified v38: signed Printful event admission

Source `53617e2a9d04d38d06a2f6f06af4053316d94095` is deployed as native
**v38 / env5**. Migration `0003_printful_inbox.sql` is applied: actual
COMMERCE_DB has **12 tables**, including the three dedicated Printful inbox,
job and recovery-audit relations. Two new signing values are stored as masked
runtime secrets; existing Printful/session/Stripe webhook settings are preserved.
STRIPE_SECRET_KEY and COMMERCE_POLICY_JSON are still absent.

Fresh v1/v2 reads confirmed empty configuration before one v2 registration of
16 order/shipment event types to `/api/printful/webhook`. Authenticated readback
verified the destination at `2026-11-01T18:08:04.595168Z`. The actual signing-key
values are not report artifacts. A recipient test-name metadata-only PUT to
existing unconfirmed draft **184026933** used `confirm=false`; authenticated GET
at `2026-11-01T18:09:04.099847Z` confirmed the same external ID
`UA_TEST_20261101_1a196badad6`, sync variant 5577001692 × 1, still draft.
No charge, production confirmation or new test order was created.

A real provider `order_updated` event occurred at `2026-11-01T18:08:58Z` and
passed the deployed raw-byte signature/public-key/store verifier. D1 received it
at epoch milliseconds `1793556539373`, fingerprint
`3a118364d4cbf744cbc3e88317ee5dfe9a6a3620196b8f0196389c06fb82d08d`.
Its durable job is **ignored**, attempts **0**, reason
**PRINTFUL_UNMAPPED_ORDER**. The matching actual Worker POST log at
`1793556539642` records HTTP 200 / outcome ok. Persisted validated D1 records
establish durable admission; the log also confirms the response. Internal order
and draft-mapping tables remain empty.

This proves **real draft update → signed callback → verified durable admission
and safe unmapped classification**. It does not prove paid-order linkage,
mapped fresh-GET reconciliation, retry/dead-letter operation on a real order,
shipment progression or the complete Stripe workflow. Those paths have isolated
fixture/database coverage. Events never create/confirm orders or infer payment,
refund or delivery. Overall remains **PARTIALLY WORKING**.

## V38 automated/build and bounded production evidence

**273 PASS = 29 importer + 21 provider + 57 Stripe + 166 Worker**. New Worker
coverage includes 20 D1/workflow cases, 16 cryptographic cases, nine HTTP cases
and one actual-workerd/native-D1 case. Three additional post-build tests execute
the generated Worker bundle with isolated outbound handlers. All automated
provider responses are fixtures; the real event evidence above is separate.
Tests cover signature/store/raw-byte rejection, stable fingerprints, duplicates/
out-of-order admission, mapped fresh GET, fencing, five-attempt dead letters
and authorization/audit on recovery. No event infers paid manufacturing.

Build/release pass: Worker **865.79 kB**, 680 authored assets / 188,113,092 bytes,
unchanged frontend hash
`8b38bf76f09e43e7d1675227927db61005bf458aa048c876b0627ddde0156967`,
19 syntax checks. Slice security review found no material blocker. GitHub mirror
`75ae5808019d787bbc8c19e8535e85e0b384a940`, PR #4 CI #16 **SUCCESS**:
https://github.com/CJMORE66/underground-alchemy/actions/runs/41334842634 .

Actual v38 CZ browser loads the live 20-product collection; status shows catalog/
shipping true, checkout false. Fresh catalog GET first returned 503
CATALOG_REFRESH_PENDING during D1 single fill, then one reload succeeded with
checkedAt `2026-11-01T18:10:24.869Z`, 20/86, 83 active/3 temporary out of stock,
EUR, full sync and no removed entries. This is an observed recovery, not
always-immediate success. V39 subsequently implements/tests/deploys bounded
pending-only UI retry and a visible manual fallback retry.
Actual mobile viewport remains UNVERIFIED. GET webhook reports METHOD_NOT_ALLOWED. The bounded
15-minute Worker error window contains only two favicon404 events, no returned
commerce errors. Window/ingestion limits apply; absence of callback logs is not
delivery evidence. The verified D1 event/job records prove admission.

Actual production Worker log at `1793556539642` confirms
`POST /api/printful/webhook` returned **200**, outcome **ok**, matching the
durable signed event receipt above. Subsequent catalog/status GET logs return
200; the separately recorded refresh-pending503 is preserved as a real transient.

Desktop v38 live browser also verifies OMERTA Black/M selection, add to cart,
quantity1→2 using the plus control, historical subtotal €109.00 and quantity2
after reload. CZ/EN/FR cart copy was observed after translations completed.
This does not establish mobile viewport or payment acceptance.

## Current v39 build, UI and production smoke

V39/env5 deployment succeeded at `2026-11-01T18:17:53.735340+00:00` (UTC).
The 273 focused backend cases and three generated-workerd isolated fixtures
remain passing. New SHOP scenarios pass for pending→live recovery, three-attempt
cap, labelled manual retry, authentication no-retry, abort/destroy and accessible
CZ/EN/FR controls; cart/checkout UI groups pass. Automatic retry only targets
CATALOG_REFRESH_PENDING and waits 300/600 ms; exhaustion is visible, not an
infinite or always-successful recovery. No fixture is real callback/payment proof.

Build/release: 680 authored assets / **188,114,946 bytes**, frontend SHA256
`6f759b9f0eabb593a80b12f03fd7ff006270447f6a11a2f68cb10389bbd24c54`.
Only authored shop.js changes; other 679 assets are byte-identical. Server bundle
**865.79 kB / gzip 136.22 kB / 236 modules**; 19 syntax checks pass. PR #4 CI #17
**SUCCESS** at `4f18a783df5b2730323a6b2458cbcb87cb8cc201`:
https://github.com/CJMORE66/underground-alchemy/actions/runs/41335757707 .

Actual v39 browser reload has the new retry DOM control, live20 collection
notice, cart quantity1 persisted and shipping ready; API status reports catalog/
shipping true and checkout false. This does not establish an observed forced
retry sequence in production. No second real provider callback is claimed after
v39. Current real mobile viewport remains UNVERIFIED.

Fresh actual v38 shipping for OMERTA Black/M ×1 at the official public Printful
US/CA sample returned **STANDARD €8.39**, **CO2 STANDARD €8.47**. Selecting STANDARD
kept tax quote disabled and payment hidden/disabled. Rates are destination/time
specific; no charge occurred. Desktop evidence:
[shipping v38](evidence/PRINTFUL_SHIPPING_V38.jpg),
[collection v39](evidence/PRINTFUL_SHOP_V39.jpg). These are actual desktop screens,
not mobile acceptance or completed checkout.

Final v39 D1 recheck still shows **12 tables**, **one same-fingerprint signed
receipt**, and no internal orders/linked draft mappings. The fresh bounded
five-minute Worker error query contains only **two favicon404s**, with no
returned API/commerce failures; window/ingestion limits apply. Independent
frontend review found no material blocker in this narrow UI change. Reviewable
sanitized evidence: [v39 verification JSON](evidence/PRINTFUL_V39_VERIFICATION.json),
[actual desktop shipping v38](evidence/PRINTFUL_SHIPPING_V38.jpg),
[actual desktop shop v39](evidence/PRINTFUL_SHOP_V39.jpg). This preserves the
single v38 callback proof and does not imply a second delivery on v39.
