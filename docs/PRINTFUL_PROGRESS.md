# Printful execution checklist

Updated: 2026-10-31 (Europe/Paris). Overall: PARTIALLY WORKING; live commerce BLOCKED.
This is the persistent handoff record. A checked item requires evidence in
PRINTFUL_TEST_RESULTS.md. Offline fixtures do not establish real API success.

- [x] Open existing Sites project and source, retain public audience and identity.
- [x] Inspect GitHub main and open PR #3 (ready, not draft; not merged).
- [x] Audit current source and production runtime configuration.
- [x] Verify original external shop currently renders Synology not-found page.
- [x] Apply bounded PR #3 repairs onto deployed source; preserve unrelated work.
- [x] Finish importer reliability, prices, availability and full/incremental tests.
- [x] Finish persistent cart, quantity, variant, accessibility and language tests.
- [x] Finish draft-only provider adapter and webhook/order safety tests.
- [x] Run final release checks and browser QA.
- [x] Publish validated static SHOP changes and verify production.
- [x] Push reviewable GitHub commits and open integration PR.

## External dependencies — continue independent work

1. Printful store-scoped token for actual store verification. Historical store ID
   18912189 is an expected identity, not an authenticated fact. No token is present
   in this process or Sites runtime configuration.
2. Existing backend source/runtime/database access. The public frontend's original
   catalog points to hiphop.caisik.i234.me. The server currently renders a Synology
   error. No payment provider can be established from this repository.
3. Existing payment sandbox credentials, webhook signing configuration and the
   merchant's tax/currency settings. Do not invent a provider or tax policy.
4. Actual signed Printful webhook configuration and a durable authenticated backend
   endpoint. Do not replace an existing webhook configuration without inspecting it.
5. Separate explicit authorization before paid fulfillment confirmation or real
   charges. The current work does not require or perform either action.

## Acceptance criteria still requiring live evidence

Printful authentication/store, current catalog counts/variant comparison, shipping,
server price validation, test payment verification, durable order persistence,
draft creation/reconciliation, webhook delivery/deduplication, fulfillment/tracking,
cancellation/refund and customer notifications remain blocked/unverified until the
external dependencies above are available. Public checkout stays disabled.

## Resume

Read all six PRINTFUL_*.md files, current Git state, Site versions and runtime
configuration. Continue from the current branch; do not regenerate the historical
snapshot over a newer live import. Do not replay an ambiguous create-order request
without reconciliation by external_id. Keep static source and original backend
separate until their actual deployment relationship is verified.

## Acceptance status after release31

| Criterion | Evidence/status |
| --- | --- |
| Printful auth and correct store | BLOCKED: no token; preflight made no network call |
| Real current products/variants | BLOCKED: historical20/86 snapshot only; importer fixture tests pass |
| Product images | WORKING for inspected snapshot/local assets and tested product; live catalog unverified |
| Server price validation | BLOCKED: actual backend/pricing/payment adapter missing |
| Desktop/mobile cart | WORKING: automated model/DOM + browser390/320px + production smoke |
| Authorized test checkout/payment verification | BLOCKED: unknown existing provider and sandbox |
| Durable internal orders | BLOCKED: actual database adapter not connected |
| Safe real Printful draft creation | BLOCKED: fixture adapter tests only |
| Duplicate fulfillment prevention | INCOMPLETE: helper tests pass; durable production uniqueness unavailable |
| Webhooks | INCOMPLETE: signed v2 helper tests pass; endpoint/real delivery blocked |
| Shipping | INCOMPLETE: safe adapter tests pass; real address/rates blocked |
| Fulfillment/tracking | BLOCKED live; event reducer tested in isolation |
| CZ/EN/FR SHOP | WORKING for delivered UI; shared language regressions/browser checks pass |
| Automated local tests | PASS:25 importer +19 server cases, cart/shop/language/regression groups |
| Production build/artifact | PASS: static artifact validation; no framework build required |
| Deployment | PASS: saved version31; native deployment succeeded |
| Production smoke | PASS for static catalog/cart; live checkout excluded/blocked |
| Security | No critical issue found in bounded review; npm audit0 advisories; live backend cannot be assessed |

Deployed source:3fb9f74a210b6b1176c3f1363035d8b9c4054483.
Rollback: existing saved version30 (see PRINTFUL_DEPLOYMENT.md).
The full integration is not VERIFIED WORKING. Owner actions remain listed in
PRINTFUL_SETUP.md; no repeated credential/API retries should occur before access.

GitHub review: https://github.com/CJMORE66/underground-alchemy/pull/4

Review commits:41a21f25047f4f7a3db274c9f97c35eda1eb63d6 (catalog),
98e47001c7bb123516d6826a075302a3e30afb8d (server helpers),
2cb20db95f090732a22e43b0488579aeda0639f5 (SHOP/cart),
dc53845ebb7deab881f8d7a2f412f3aaeb97af8a (CI/audit/release evidence).
PR4 includes open PR3 changes and is mergeable; neither PR was merged.
GitHub Actions launched Commerce safety checks; final remote conclusion is
recorded in the task report separately from the completed local checks.
