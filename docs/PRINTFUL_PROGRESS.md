# Commerce progress / resume record

Updated: 1 November 2026, Europe/Paris. Overall **PARTIALLY WORKING**. Live
Printful reads work; payment/fulfillment and native Worker release remain pending.

## Verified completed

- [x] Inspect existing GitHub/Sites source and PR #3; retain branding/routes/audience.
- [x] Deliver static SHOP/cart/CZ-EN-FR repair as verified version 31 (31 October).
- [x] Keep review changes in GitHub PR #4; distinguish GitHub and Sites histories.
- [x] Real Printful authentication: expected store 18912189 once among seven,
  HTTP 200. Credential securely stored as masked Sites runtime secret.
- [x] Real full catalog sync at `2026-11-01T10:10:57.292386Z`: 20 products /
  86 variants, 83 active / 3 temporary out of stock, all retail currencies EUR.
- [x] Preserve internal/sync/catalog identities and historical price dates;
  migrate only exact legacy PF aliases to `sourceSku`, retaining actual `sku`.
- [x] Real safe shipping estimate: catalog variant 51734 × 1, official US/CA
  test destination, STANDARD €4.69 at observation. No order created.
- [x] Confirm/read existing Stripe test account and active Tax settings/two Czech
  registration records; do not mistake connector auth for a runtime key.
- [x] Implement native Worker+ASSETS, fresh server quote/prices, signed guest
  ownership/Origin/body/rate controls, D1 scoped repository and Drizzle schema.
- [x] Pass focused current groups: 56 Stripe-related, 86 Worker/D1/quote/catalog/
  HTTP, 19 original provider, 29 importer cases; UI/language/atlas regressions.
- [x] First Worker build preserves 680 frontend assets / 188,107,785 bytes.

## Pending release / configuration

- [x] Remediate build dependencies; full audit now reports zero known advisories.
- [ ] Freeze the final native-installed build and record deployment/smoke evidence.
- [ ] Publish exact Worker source/archive through existing native Sites workflow.
- [ ] Apply/verify both schema-only Drizzle migrations on actual COMMERCE_DB.
- [ ] Verify production live catalog/images/status/shipping, retained UI/languages
  and logs. Public production is still version 31 until native success is recorded.
- [ ] Securely configure actual runtime Stripe test key, actual snapshot endpoint
  signing secret and approved `COMMERCE_POLICY_JSON`.
- [ ] Run authorized real test Checkout/payment/signature/retry/draft acceptance.
- [ ] Complete durable Printful statuses/tracking, notifications, refund/cancellation
  initiation, admin failure operations and retention/anonymization.

## Current owner dependencies

Existing Printful/session secrets are already present at runtime revision 2;
there is no reason to re-request or print them. Remaining external requirements:

1. Actual connected-account `STRIPE_SECRET_KEY` test key in secure Sites config.
2. Actual snapshot destination at `/api/stripe/webhook`, pinned API
   2026-10-28.endive, and its securely stored `STRIPE_WEBHOOK_SECRET`.
3. Reviewed merchant price/tax/country policy as `COMMERCE_POLICY_JSON`, including
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
| Shipping | VERIFIED one destination-specific read; hosted integration pending |
| Catalog/cart/CZ-EN-FR | Prior production baseline + new fixture tests; new hosted smoke pending |
| Server pricing/tax/ownership | Implemented/tested; runtime merchant policy/payment config missing |
| D1 durable orders / duplicate safety | Scoped D1 interface/SQLite-backed tests pass; actual native migration pending |
| Stripe payment / actual signed delivery | BLOCKED runtime key/secret/policy; no real test payment |
| Printful draft | Fixture safety only; no actual order created |
| Paid fulfillment / tracking / refunds / notifications | Not verified; several workflows incomplete |
| Build / deployment | First build passed; native Worker release/migration/CI/smoke pending |
| Security | Production and full development audits now zero; PII retention remains incomplete |

## Resume / rollback

Read these six PRINTFUL documents, `STRIPE_SETUP.md`, current source/manifest and
actual Site deployment/D1 state. Do not replace a live catalog with an old
snapshot, infer a deployment from a push, or replay uncertain creates.

Immediate known-good rollback is saved version 31; see exact IDs in
`PRINTFUL_DEPLOYMENT.md`. Preserve D1 schema/data, runtime secrets and all local
user notes. Schema readiness is not a production payment test. Managed Miniflare
hung and stays unverified; do not relabel shim tests as native D1 success.

## Final release fields — pending root update

Append actual final source/PR commits, full audit/build/check results, native
saved version/deployment/migration results and production smoke. Until verified,
leave these release fields pending rather than carrying forward old success.
