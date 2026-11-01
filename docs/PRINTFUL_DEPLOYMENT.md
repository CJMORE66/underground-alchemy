# Native commerce release / rollback record

Updated: 1 November 2026. **Native v39 / env5 is deployed. Actual signed
Printful admission remains verified from v38; v39 adds bounded UI recovery.** Native D1 has 12 tables. Overall
**PARTIALLY WORKING**: Stripe runtime key/merchant policy are absent and no full
paid-order workflow is proved. All timestamps below are UTC.

## Current v39 bounded catalog recovery — deployed

- Source `370fd42896a95c9a1ffd76f9bc89ad5f24a40756`; source history includes
  `b8cbccb` (actual v38 docs) then this frontend fix.
- Saved version `appgprj_6ad19e715dcc819185592c61456c5182~appgver_2862c633a45c8191ba1482674ffbc17d`.
- Deployment `appgdep_6ae7823ca42c819196a4533ad2f73cdc` **succeeded** at
  `2026-11-01T18:17:53.735340+00:00` (UTC), **env5**.
- Canonical archive SHA256
  `b17d66aa2aff09718220b446c725c395caf2e5a54d7a5c0bc1fd31afe0c857d1`,
  **191,426,560 bytes / 695 files**; local gzip **179,724,077 bytes**.
- 680 authored assets / **188,114,946 bytes**, frontend hash
  `6f759b9f0eabb593a80b12f03fd7ff006270447f6a11a2f68cb10389bbd24c54`.
  Only authored shop.js changes; other 679 assets are byte-identical. Server
  bundle **865.79 kB / gzip 136.22 kB / 236 modules**. Nineteen syntax/release
  checks, 273 focused cases, three generated-bundle fixtures and new UI scenarios
  pass. PR #4 CI #17 **SUCCESS** at
  `4f18a783df5b2730323a6b2458cbcb87cb8cc201`:
  https://github.com/CJMORE66/underground-alchemy/actions/runs/41335757707 .
- Pending-only automatic attempts are capped at three, with 300/600 ms delays;
  exhaustion leaves an accessible labelled manual retry. Auth/abort/destroy and
  CZ/EN/FR behavior are tested; success is not guaranteed automatically.
- Actual reload exposes the retry DOM control, live20 and cart quantity1 persisted,
  shipping ready; real status catalog/shipping true, checkout false. No charge.
  V38 actual shipping/quote gate and signed admission proofs are retained as dated
  evidence; no second callback is claimed on v39. Real mobile is UNVERIFIED.
- Actual desktop screenshots: [shipping v38](evidence/PRINTFUL_SHIPPING_V38.jpg)
  and [collection v39](evidence/PRINTFUL_SHOP_V39.jpg).

## Historical v37 frontend-only correction — verified

Source `a57f86b285a0aae0d156b5ad501b203078095920` changes eight frontend/translation/
test files only. It corrects actual obsolete original-store/NAS-dependent copy
shown in a live product detail, with conditional live/fallback CS/EN/FR text.
Backend/Worker behavior, native cart action and dated prices are unchanged.
Six live/fallback DOM scenarios and UI/shop/cart/language suites pass;
2,942 matching dictionary keys × 3. Build/release pass: 680 authored assets /
188,113,092 bytes, frontend hash
`8b38bf76f09e43e7d1675227927db61005bf458aa048c876b0627ddde0156967`;
Worker unchanged 836.58 kB; local gzip 179,702,509 bytes.

- Saved version: `appgprj_6ad19e715dcc819185592c61456c5182~appgver_4f31c92d450c81918fbaf77bc1ad7942`.
- Deployment: `appgdep_6ae71c3a15408191922fc997b4911e5c`, **succeeded** at
  `2026-11-01T11:02:50.549892+00:00` (UTC), env4; source
  `a57f86b285a0aae0d156b5ad501b203078095920`.
- Canonical tar SHA256
  `ef5db13aac596f098aea87ee0738235c949a8316248fe1c858599812b15c7283`,
  **191,303,680 bytes / 693 files**. Local gzip **179,702,509 bytes**.
- Actual API returns printful-live/true, **20/86**, **83 active**, checkedAt
  `2026-11-01T11:03:03.836Z`. Actual visible CS/EN/FR detail after dictionaries
  load has the new server-recheck/availability-at-load policy, no obsolete
  disabled external CTA and retained Add/Open Cart actions. Fallback is tested
  by six DOM fixture scenarios, not forced production failure.
- GitHub `d3d9adba105d5432c319f796fa7781554c78cc9e`, CI #14 **PASS**:
  https://github.com/CJMORE66/underground-alchemy/actions/runs/41300046055 .
- Final actual status HTTP 200 reports mode:test, catalog/shipping available and
  checkout unavailable. Modal closed in CZ; empty cart **0** and live **20-product**
  collection notice are confirmed.
- Latest bounded error query at **11:04 UTC** (5 minutes / limit 25) returns
  **three ancillary 404 request events only**: `/favicon.ico`, `/sitemap.xml`,
  `/robots.txt`, outcome ok. No commerce_request_failed/API failure appears in
  the returned window. These existing static-asset gaps are not a clean-log
  result or a new SEO work scope. Preserve the earlier v36 zero-event result as
  dated history, not the latest query.

## Earlier healthy release: v35

- Site: appgprj_6ad19e715dcc819185592c61456c5182, public audience preserved.
- URL: https://caisik-underground-alchemy.caisik.chatgpt.site/ .
- Source: `6e758e1`.
- Saved version: `appgprj_6ad19e715dcc819185592c61456c5182~appgver_11c7eff050e48191b99fb4043acfb9bc`.
- Deployment: `appgdep_6ae718e3fe248191b5437e9b3932656b`, succeeded;
  recorded time 10:48:25. Runtime env revision 4.
- Actual browser proof recorded 10:48:41: live 20 products/86 variants,
  83 active/3 temporary out of stock, product/cart/persistence/quantity and
  CZ/EN/FR desktop. Real mobile viewport remains unverified.
- Browser shipping on OMERTA Black/M × 1, official US/California test destination:
  STANDARD €8.39 / CO2 €8.47. No universal shipping-price claim.
- Native D1 has nine tables, including fulfillment and public cache. Cache metadata
  confirms store 18912189, 60,000 ms TTL, lease NULL. Bounded payload reader
  truncates; catalog content proof comes from actual HTTP/browser responses.
- Checked new native log interval has no errors. Earlier repaired failures remain
  historical; no all-time clean-log claim or log deletion.

A real low-level Printful draft was created and GET-verified afterward:
184026933 / UA_TEST_20261101_1a196badad6, confirm=false, no charge/production,
left as draft. This is not a real paid internal order or Stripe workflow proof.

## Final v36 release — verified

V35 exposed a quote button enabled while only shipping was available. The server
still rejected quotes. Source **b5d613845852a5e14d20f4a3072189726b84fada** fixes
both button and handler to require checkout readiness, with a meaningful UI
regression. UI/shop/cart/build/release and three actual-workerd isolated bundle
checks passed again. Native publication and the final actual smoke succeeded:

- Source: `b5d613845852a5e14d20f4a3072189726b84fada`.
- Saved version: `appgprj_6ad19e715dcc819185592c61456c5182~appgver_337ea06b363c81918affa223c4a21ab5`.
- Deployment: `appgdep_6ae71a2303288191918d0da936d4f235`, **succeeded** at
  `2026-11-01T10:53:43.921359+00:00`; env revision **4**.
- Canonical saved tar: SHA256
  `35b89ec30fba9ee7a98fc38ed78e6df787af56ef279fc310cf19d5ea01eb7806`,
  **191,303,680 bytes / 693 files**. Local gzip: **179,699,162 bytes**.
- Build: **680 authored assets / 188,108,386 bytes**, Worker **836.58 kB**;
  frontend hash `2bfebd79cfb97d1db811b7173b6a6b18792dddfb0e6ae4515f47445aa72f2504`.
- Final actual smoke at **10:54 UTC**: catalog mode printful-live/verified true,
  20 products/86 variants/83 active, checkedAt `2026-11-01T10:53:57.110Z`;
  status HTTP 200 and checkoutAvailable:false.
- Fresh reload clears address form. Entering the official test destination again
  returns actual €8.39/€8.47 shipping; selecting STANDARD leaves the final tax
  quote button **disabled**, as required without payment configuration.
- Test cart persisted through reload, then test item was removed and empty cart
  persisted after reload. Desktop OOS option/gallery/CZ-EN-FR checks pass;
  current real mobile viewport remains unverified.
- Actual D1 orders and draft-mapping tables contain zero rows, with no_more true.
  The standalone provider draft was not falsely persisted as an internal paid order.
- Recent error query (5 minutes, limit 25) returned **0 events**. Bounded window/
  ingestion lag apply; historical repaired errors are not erased or called absent.

## Packaging / migrations

Supported architecture is Sites Worker + ASSETS + COMMERCE_DB. The source manifest
omits static hosting and retains project identity. Active schema-only chain is
Drizzle 0000 base, 0001 immutability and 0002 fulfillment/public-cache migration;
all nine native tables are observed. Repository readiness performs no DDL.

The first save failed before creating a version because duplicate maintained
and generated asset copies exceeded the 256 MiB archive limit. Output-only
staging fixed this without deleting frontend source. Use:

```sh
node scripts/package-commerce-worker.mjs /absolute/sites/scripts/package-site.mjs /absolute/outside-checkout/release.tar.gz
```

It stages generated client/server/hosting output and migrations, checks bytes
and packages below the native limit. Preserve exact pushed source/archive
provenance. GitHub PR #4 and Sites histories/deployments are separate. CI #12 at
`a2c7d8a6b3b91e476b74213c5cb4084311fe8837` **passed**, including native-bundle
checks: https://github.com/CJMORE66/underground-alchemy/actions/runs/41299341644 .

## Root-cause history

| Version | Source | Historical result |
| --- | --- | --- |
| 31 | 3fb9f74a210b6b1176c3f1363035d8b9c4054483 | Verified static SHOP/cart/languages, no live commerce backend |
| 32 | 467723d | Native Worker/D1 architecture deployed |
| 33 | c8ec0ef | Native cache API failure identified by safe diagnostics |
| 34 | 3ee4110 | Optional safe cache; native Fetch wrong receiver/unsupported redirect:error exposed |
| 35 | 6e758e1 | Correct binding/manual redirect rejection + D1 cache; actual live catalog/shipping verified |
| 36 | b5d613845852a5e14d20f4a3072189726b84fada | Shipping-only tax-quote UI gate fixed; native publish and final actual smoke pass |
| 37 | a57f86b285a0aae0d156b5ad501b203078095920 | Frontend-only live/fallback detail copy corrected; actual CS/EN/FR live copy and live API verified |
| 38 | 53617e2a9d04d38d06a2f6f06af4053316d94095 | Signed Printful receiver, 12-table native schema, env5 activation and actual durable unmapped event admission |
| 39 | 370fd42896a95c9a1ffd76f9bc89ad5f24a40756 | Bounded pending-only catalog UI retry and labelled manual recovery; real live/cart/status smoke |

These failures are historical, not the current catalog status. Three isolated
actual-bundle workerd cases now exercise native fetch/cache/redirect behavior.

## Rollback

Older verified functional v36 saved version (v38 is now preferred):
`appgprj_6ad19e715dcc819185592c61456c5182~appgver_337ea06b363c81918affa223c4a21ab5`.
Source: `b5d613845852a5e14d20f4a3072189726b84fada`.
Deployment: `appgdep_6ae71a2303288191918d0da936d4f235`.
Canonical archive SHA256:
`35b89ec30fba9ee7a98fc38ed78e6df787af56ef279fc310cf19d5ea01eb7806`.
This restores the verified live backend/cart/quote gate, with the older detail
copy. Preserve D1/secrets and verify the native rollback result.

Emergency static v31 saved version:
`appgprj_6ad19e715dcc819185592c61456c5182~appgver_c70a82f405a48191a09d087d4b2aa4e3`.
Source: `3fb9f74a210b6b1176c3f1363035d8b9c4054483`.
Archive SHA256: `027f75d4ab8ccb119b1778d77a4c235dbf5e88a77ae3e195da8deb4810dc8f5a`.
Prior deployment: `appgdep_6ae64db70f608191b2a918ad6e45be2e`.

Redeploy that archive-backed version through native Sites and verify the result.
Preserve D1 resource/schema/data, runtime secrets, browser notes/carts and the
standalone Printful test draft. Pause/reconcile pending provider work; never
reset uncertain single-POST gates, replay creates, drop/downgrade schema or
reverse customer payments as a static rollback step. No paid-confirmation method
is implemented. Retention/anonymization and full operational recovery remain
incomplete, even though current catalog/shipping deployment works.

## Verified v38 signed receiver — actual admission baseline

- Source: `53617e2a9d04d38d06a2f6f06af4053316d94095`.
- Saved version: `appgprj_6ad19e715dcc819185592c61456c5182~appgver_382a75a348d08191ada342a9ef5d37c9`.
- Canonical archive SHA256:
  `fdf30fb898dfff2371baae8c96253247e7cd6eb41954bd19017b94a322a5ad2d`,
  **191,426,560 bytes / 695 files**; local gzip **179,721,164 bytes**.
- Initial env4 deployment `appgdep_6ae77f9ae6c48191901cf9be3da03fb3`
  succeeded at `2026-11-01T18:06:40.842748+00:00`.
- Activated **env5** deployment `appgdep_6ae7800d3c10819193f6121b3b9bcaa5`
  succeeded at `2026-11-01T18:08:34.312252+00:00`.
- Applied schema-only migration 0003 is observed in native D1: **12 tables**.
  Existing settings are preserved; two actual Printful signing values are masked.
  Runtime Stripe payment key and approved merchant policy are still absent.
- Fresh v1/v2 empty-configuration guard preceded one v2 POST registration of 16
  order/shipment types to `/api/printful/webhook`. Authenticated readback at
  `2026-11-01T18:08:04.595168Z` verifies it. Public-key SHA256 fingerprint:
  `aa443877917ab0bbf93e98728a4d9d2d3ae8f98f842fdc37744f96b9c6b277ec`;
  no signing values are recorded here.
- Existing standalone draft 184026933 was safely metadata-updated with
  confirm=false and GET verified unchanged draft/items/external ID at
  `2026-11-01T18:09:04.099847Z`. The real signed order_updated event at
  `2026-11-01T18:08:58Z` is durably ignored with attempts 0 /
  PRINTFUL_UNMAPPED_ORDER. TEST_RESULTS records the stable fingerprint and
  received time. Internal orders/draft mappings remain empty. No charge or
  production confirmation occurred; this is not the full paid-order workflow.
- Browser CZ live20 and status catalog/shipping true/checkout false are verified.
  A fresh catalog GET had 503 CATALOG_REFRESH_PENDING during single fill; one
  reload succeeded at checkedAt 2026-11-01T18:10:24.869Z with 20/86, 83 active/
  3temporary out of stock, EUR/full sync/no removed entries. Initial-request
  success is not guaranteed; bounded UI recovery is deployed in v39. Actual mobile
  viewport remains UNVERIFIED. GET webhook is METHOD_NOT_ALLOWED. Bounded 15-minute errors show two favicon
  404s only, no returned commerce errors; D1 records, not logs, prove callback.
- 273 focused cases plus three isolated post-build generated-bundle cases pass.
  Worker 865.79 kB; 680 assets / 188,113,092 bytes; unchanged frontend hash
  `8b38bf76f09e43e7d1675227927db61005bf458aa048c876b0627ddde0156967`;
  19 syntax checks. GitHub mirror `75ae5808019d787bbc8c19e8535e85e0b384a940`,
  PR #4 CI #16 **SUCCESS**:
  https://github.com/CJMORE66/underground-alchemy/actions/runs/41334842634 .

## Receiver-aware rollback caveat

Preferred receiver-capable prior release is **v38**, saved version
`appgprj_6ad19e715dcc819185592c61456c5182~appgver_382a75a348d08191ada342a9ef5d37c9`,
source `53617e2a9d04d38d06a2f6f06af4053316d94095`, env5 deployment
`appgdep_6ae7800d3c10819193f6121b3b9bcaa5`. Exact archive proof is above.
This retains the receiver and loses only the v39 catalog UI recovery fix.
Preserve all twelve D1 tables, env5 keys, provider configuration and job state.

Older **v37** saved version
`appgprj_6ad19e715dcc819185592c61456c5182~appgver_4f31c92d450c81918fbaf77bc1ad7942`,
source `a57f86b285a0aae0d156b5ad501b203078095920`, deployment
`appgdep_6ae71c3a15408191922fc997b4911e5c`. Exact archive proof is above.
V36 is older functional fallback, v31 emergency static fallback.

**V37 has no Printful receiver. Prefer a receiver fix-forward when possible.**
An application rollback must preserve the twelve-table D1, env5 signing values,
provider registration and all inbox/recovery/provider state. A missing receiver
can cause 404/503 delivery retries; reconcile pending callbacks after restoration.
Disable the provider destination only with authorization and preserve its keys/
configuration for recovery; do not blindly rotate keys, reset claims, replay
creates or drop/downgrade schema. No paid-confirmation method is delivered.

Actual production Worker log at `1793556539642` confirms
`POST /api/printful/webhook` returned **200**, outcome **ok**, matching the
durable signed event receipt above. Subsequent catalog/status GET logs return
200; the separately recorded refresh-pending503 is preserved as a real transient.

Desktop v38 live browser also verifies OMERTA Black/M selection, add to cart,
quantity1→2 using the plus control, historical subtotal €109.00 and quantity2
after reload. CZ/EN/FR cart copy was observed after translations completed.
This does not establish mobile viewport or payment acceptance.

Final v39 D1 recheck still shows **12 tables**, **one same-fingerprint signed
receipt**, and no internal orders/linked draft mappings. The fresh bounded
five-minute Worker error query contains only **two favicon404s**, with no
returned API/commerce failures; window/ingestion limits apply. Independent
frontend review found no material blocker in this narrow UI change. Reviewable
sanitized evidence: [v39 verification JSON](evidence/PRINTFUL_V39_VERIFICATION.json),
[actual desktop shipping v38](evidence/PRINTFUL_SHIPPING_V38.jpg),
[actual desktop shop v39](evidence/PRINTFUL_SHOP_V39.jpg). This preserves the
single v38 callback proof and does not imply a second delivery on v39.
