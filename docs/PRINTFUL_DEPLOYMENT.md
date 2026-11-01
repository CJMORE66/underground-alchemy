# Native commerce release / rollback record

Updated: 1 November 2026. **Version 37 is deployed and live catalog/CS-EN-FR
detail copy are verified.** V36 shipping/quote-gate proofs remain dated baseline
evidence; native D1 has nine tables. Overall
PARTIALLY WORKING: Stripe runtime payment key/merchant policy and full paid-order
acceptance are still absent. All timestamps in the final v36 record are UTC.

## Current v37 frontend-only correction — verified

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

These failures are historical, not the current catalog status. Three isolated
actual-bundle workerd cases now exercise native fetch/cache/redirect behavior.

## Rollback

Preferred verified functional v36 saved version:
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
