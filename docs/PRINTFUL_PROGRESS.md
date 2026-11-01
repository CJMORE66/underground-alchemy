# Commerce progress / resume record

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Live
Printful real Node reads work; native Worker versions 32–34/D1/status are
deployed. Production catalog transport is broken by native Fetch receiver and
unsupported redirect:error. Both fixes/tests are ready; deployment/new hosted
proof and payment/fulfillment acceptance remain pending.

## Verified completed

- [x] Inspect existing GitHub/Sites source and PR #3; retain branding/routes/audience.
- [x] Deliver static SHOP/cart/CZ-EN-FR repair as verified version 31 (31 October).
- [x] Keep review changes in GitHub PR #4; distinguish GitHub and Sites histories.
- [x] Real Printful authentication: expected store 18912189 once among seven,
  HTTP 200. Credential securely stored as masked Sites runtime secret.
- [x] Real full catalog sync at `2026-11-01T10:10:57.292386Z`: 20 products /
  86 variants, 83 active / 3 temporary out of stock, all retail currencies EUR.
- [x] Actual Node LivePrintfulCatalog also reads the real 20/86; distinct from
  both CLI results and actual local workerd runs with synthetic 20/86 responses.
- [x] Preserve internal/sync/catalog identities and historical price dates;
  migrate only exact legacy PF aliases to `sourceSku`, retaining actual `sku`.
- [x] Real safe shipping estimate: catalog variant 51734 × 1, official US/CA
  test destination, STANDARD €4.69 at observation. No order created.
- [x] Confirm/read existing Stripe test account and active Tax settings/two Czech
  registration records; do not mistake connector auth for a runtime key.
- [x] Implement native Worker+ASSETS, fresh server quote/prices, signed guest
  ownership/Origin/body/rate controls, D1 scoped repository and Drizzle schema.
- [x] Pass latest reported groups: 56 Stripe-related, 89 Worker/D1/quote/catalog/
  HTTP, 19 original provider, 29 importer cases; UI/language/atlas regressions.
- [x] First Worker build preserves 680 frontend assets / 188,107,785 bytes.
- [x] Deploy native v32 (`467723d`), v33 (`c8ec0ef`) and v34 (`3ee4110`).
- [x] Verify seven actual COMMERCE_DB tables and native status HTTP 200:
  test/catalog/shipping true, checkout false. No order created.
- [x] Register actual enabled test-mode Stripe endpoint, four September-version
  snapshot events; securely store its signing secret/version at runtime rev4.
- [x] GitHub PR #4 head `ceac189` passes CI #10; later fixes require later proof.

## Pending release / configuration

- [x] Remediate build dependencies; full audit now reports zero known advisories.
- [x] Publish initial Worker/archive and apply/verify initial native D1 schema.
- [x] Prepare/test correct native Fetch receiver and manual-redirect/explicit
  redirect rejection fixes. Cloudflare redirect:error is unsupported.
- [ ] Publish/verify those fixes in the next exact source. V33 exposed cache.match failure; v34 made
  cache safe/optional but actual provider catalog still returns TRANSPORT_ERROR.
- [ ] Finish/test/apply durable cache and owner-visible fulfillment projection/table migrations.
- [ ] Verify production live catalog/images/status/shipping, retained UI/languages
  and logs. Current observed production is v34; its catalog is not accepted working.
- [ ] Securely configure actual runtime Stripe test API key and approved
  `COMMERCE_POLICY_JSON`; existing endpoint secret/version do not need re-entry.
- [ ] Run authorized real test Checkout/payment/signature/retry/draft acceptance.
- [ ] Complete durable Printful statuses/tracking, notifications, refund/cancellation
  initiation, admin failure operations and retention/anonymization.

## Current owner dependencies

Existing Printful/session/webhook secrets and September snapshot version are
already present at runtime revision 4;
there is no reason to re-request or print them. Remaining external requirements:

1. Actual connected-account `STRIPE_SECRET_KEY` test key in secure Sites config.
2. Reviewed merchant price/tax/country policy as `COMMERCE_POLICY_JSON`, including
   intended selling prices/exclusive tax treatment, registrations and tax codes.

No new hosting account or mandatory NAS access is needed for the native Worker/D1
path. Connector authentication does not supply a runtime API key. Never paste
secrets into chat. No real-charge or paid Printful confirmation is authorized;
no confirmation method is implemented.

## Acceptance status

| Criterion | Current evidence/status |
| --- | --- |
| Printful authentication / store | VERIFIED live read |
| Real products / variants / prices / availability | VERIFIED live full read; customer policy still needs approval |
| Production catalog transport | BROKEN v34; receiver/manual-redirect fixes and regressions ready, new deployment/production proof pending |
| Shipping | VERIFIED one destination-specific read; hosted integration pending |
| Catalog/cart/CZ-EN-FR | Prior production baseline + new fixture tests; new hosted smoke pending |
| Server pricing/tax/ownership | Implemented/tested; runtime merchant policy/payment config missing |
| D1 durable orders / duplicate safety | Native seven-table schema/status verified; no actual order; new fulfillment projection migration pending |
| Stripe payment / actual signed delivery | BLOCKED runtime API key/policy; endpoint enabled in test mode and secret/version configured; no real test payment/delivery |
| Printful draft | Fixture safety only; no actual order created |
| Paid fulfillment / tracking / refunds / notifications | Not verified; several workflows incomplete |
| Build / deployment | Versions 32–34 deployed; CI #10 passes earlier PR head. New receiver/projection fix/deploy/CI/smoke pending |
| Security | Production and full development audits now zero; PII retention remains incomplete |

## Resume / rollback

Read these six PRINTFUL documents, `STRIPE_SETUP.md`, current source/manifest and
actual Site deployment/D1 state. Do not replace a live catalog with an old
snapshot, infer a deployment from a push, or replay uncertain creates.

Immediate known-good rollback is saved version 31; see exact IDs in
`PRINTFUL_DEPLOYMENT.md`. Preserve D1 schema/data, runtime secrets and all local
user notes. Schema readiness is not a production payment test. Initial Miniflare
hang is dated earlier evidence; later actual local workerd synthetic runs passed.
Keep shim/synthetic/native-D1/real-provider evidence categories separate.

## Final release fields — pending root update

Append new repair/projection source/PR commits, checks/CI, exact native saved/
deployment IDs, migration result and production provider smoke. Do not relabel
the current failed catalog path or carry earlier CI success to later code.
