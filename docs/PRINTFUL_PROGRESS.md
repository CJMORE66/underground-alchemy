# Printful execution checklist

Updated: 2026-11-01 (Europe/Paris). Overall: PARTIALLY WORKING; live commerce BLOCKED.
This is the persistent handoff record. A checked item requires evidence in
PRINTFUL_TEST_RESULTS.md. Offline fixtures do not establish real API success.

## Current merchant connection — 1 November 2026

The owner-selected **underground alchemy** merchant is
`acct_1UWra7PkIIV492Qz`. Fresh account discovery now explicitly returns this
merchant with `livemode:false` on its Stripe connection. This is actual new
authorization, not a manually changed mode or the older Jakub Cais sandbox.
No further owner Stripe authorization is currently required for these reads.

Actual read-only requests using the returned test context succeeded:

- `GET /v1/tax/settings`: `object:tax.settings`, `livemode:false`, `status:active`.
- `GET /v1/tax/registrations?status=all&limit=100`: two active CZ registrations,
  both `livemode:false`, `has_more:false`. Their standard place-of-supply schemes
  are `inbound_goods` and `small_seller`; no merchant/legal policy is inferred
  from their presence, and neither registration was created or changed here.
- `GET /v1/webhook_endpoints?limit=100`: empty, `has_more:false` (v1 snapshot
  endpoints only; not a complete v2 Event Destination inventory).

Earlier selected-merchant live reads had active Tax and empty registrations;
those results are separate from this newly authorized test context. The older
Jakub Cais sandbox's pending/head_office result does not apply to this merchant.

Sites was independently inspected: saved version 31 remains active/public,
runtime environment revision 0 has no entries, and no D1 bindings/tables exist.
The plugin connection does not inject Stripe/Printful keys into deployed code.
The current runtime lacks the Printful token, Stripe test key, real webhook
endpoint/secret and deployed durable order backend. Backend hosting may use a
reviewed Sites Worker/D1 adaptation instead of NAS; that adaptation is not yet
implemented or deployed. Keep per-merchant/environment keys and order mappings
isolated. No Session, payment, provider configuration or Printful order was
written. Checkout remains disabled.

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
- [x] Confirm Stripe as the selected provider with the user (1 November).
- [x] Authorize and verify the selected underground alchemy merchant's own sandbox/test context; actual API reads pass, Tax active and two active CZ test registrations.
- [x] Authorize the earlier Jakub Cais Stripe sandbox and verify actual read-only API
  access through the Stripe plugin (`livemode:false`). Tax is pending (missing
  `head_office`), registrations and v1 snapshot endpoints are empty. No payment
  or account configuration was written; runtime secrets remain unavailable.
- [x] Implement official SDK test-only hosted Checkout, Stripe Tax/frozen quote,
  raw snapshot signatures and fresh Session/PI/charge/refund checks.
- [x] Implement real private-disk SQLite schema/repository, durable inbox/jobs,
  unique bindings, leases/fencing and single-POST gate; test multiprocess races.
- [x] Implement Stripe workflow/Request webhook handler and early/lost Session
  recovery; verify 67 focused local cases (fixture providers, actual SQLite).
- [x] Accept restricted sandbox API keys, distinguish denied scopes without
  leaking provider bodies, and avoid unnecessary Balance Read in preflight.
- [x] Repair Printful HTTPS/proxy retries with a fresh urllib Request per attempt;
  real ProxyHandler/isolated transport regression passes locally.
- [ ] Supply real Stripe test key/actual snapshot endpoint secret, verified Tax
  policy, Printful token and mounted Node 24 durable backend.
- [ ] Complete business auth/quote/order routes, retention/anonymization,
  operations/notifications/refund-cancellation and real provider E2E acceptance.

The 1 November work changes server source/docs/dependencies for PR #4, not the
public UI. Static version 31 remains unchanged with checkout disabled.

## External dependencies — continue independent work

1. Printful store-scoped token for actual store verification. Historical store ID
   18912189 is an expected identity, not an authenticated fact. No token is present
   in this process or Sites runtime configuration.
2. Authorized Node 24 backend host with private durable local disk and process
   supervision. If reusing original hiphop.caisik.i234.me, recover its NAS/
   reverse-proxy/Compose/backend first. Static Sites cannot run Node SQLite.
3. Current underground alchemy live MCP reads succeed and Tax is active; all
   registrations and v1 snapshot endpoint lists were empty. Its own test context
   is now authorized: Tax active, two active CZ registrations, empty v1 endpoints.
   Runtime secrets, deployment and actual merchant policy verification remain.
   The old pending/head_office finding belongs to Jakub Cais sandbox.
   Configure `STRIPE_SECRET_KEY` (prefer restricted `rk_test_…`, or `sk_test_…`) and the actual
   snapshot destination's `STRIPE_WEBHOOK_SECRET` (`whsec_…`) securely, plus
   verified active Stripe Tax registrations/product+shipping codes/countries.
   Business authentication/authorization and trusted catalog quoting remain.
4. Actual signed Printful webhook configuration and a durable authenticated backend
   endpoint. Do not replace an existing webhook configuration without inspecting it.
5. Separate explicit authorization before paid fulfillment confirmation or real
   charges. The current work does not require or perform either action.
6. PII retention/anonymization: immutable order JSON stores customer addresses;
   migration 001 has no approved anonymize/delete lifecycle. Resolve before
   production, together with backup/access/monitoring and operational admin work.

## Acceptance criteria still requiring live evidence

Printful authentication/store, current catalog counts/variant comparison, shipping,
server price validation, test payment verification, durable order persistence,
deployed draft creation/reconciliation, actual webhook delivery/deduplication, fulfillment/tracking,
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
| Selected merchant authentication | WORKING via actual underground alchemy test MCP reads: Tax active, two active CZ test registrations. Runtime SDK/key/API-version/Checkout verification remains BLOCKED; plugin authorization is complete. |
| Real current products/variants | BLOCKED: historical20/86 snapshot only; importer fixture tests pass |
| Product images | WORKING for inspected snapshot/local assets and tested product; live catalog unverified |
| Server price validation | INCOMPLETE: Stripe frozen quote/line/address/amount binding tested; trusted catalog/quote builder and authenticated business routes still required |
| Desktop/mobile cart | WORKING: automated model/DOM + browser390/320px + production smoke |
| Authorized test checkout/payment verification | INCOMPLETE: Stripe SDK test adapter/fresh verification pass fixtures; actual test key/Tax/host unavailable |
| Durable internal orders | WORKING locally: actual SQLite migration/transactions/reopen/races; BLOCKED deployed host and PII retention |
| Safe real Printful draft creation | BLOCKED: fixture adapter tests only |
| Duplicate fulfillment prevention | INCOMPLETE: SQLite uniqueness, leased jobs and single-POST gate tested; actual provider/deployment verification unavailable |
| Webhooks | INCOMPLETE: Stripe raw Request/SDK snapshot + durable inbox and Printful v2 reducer tested; actual HTTPS delivery/Printful durable receiver unavailable |
| Shipping | INCOMPLETE: safe adapter tests pass; real address/rates blocked |
| Fulfillment/tracking | BLOCKED live; event reducer tested in isolation |
| CZ/EN/FR SHOP | WORKING for delivered UI; shared language regressions/browser checks pass |
| Automated local tests | PASS:67 focused server/Stripe/SQLite/workflow cases plus isolated real-proxy retry regression. Full current importer/static checks require complete-repository CI; previous checks recorded separately. |
| Production build/artifact | PASS: static artifact validation; no framework build required |
| Deployment | PASS: saved version31; native deployment succeeded |
| Production smoke | PASS for static catalog/cart; live checkout excluded/blocked |
| Security | No critical issue found in bounded review; npm audit0 advisories; live backend cannot be assessed |

Deployed source:3fb9f74a210b6b1176c3f1363035d8b9c4054483.
Rollback: existing saved version30 (see PRINTFUL_DEPLOYMENT.md).
The full integration is not VERIFIED WORKING. Owner actions remain listed in
PRINTFUL_SETUP.md and STRIPE_SETUP.md; no repeated credential/API retries should
occur before access. The runtime Stripe CLI preflight is still BLOCKED before
network access because no runtime key is injected; separate sandbox MCP reads
succeeded. No payment or Printful order was created.

GitHub review: https://github.com/CJMORE66/underground-alchemy/pull/4

Review commits:41a21f25047f4f7a3db274c9f97c35eda1eb63d6 (catalog),
98e47001c7bb123516d6826a075302a3e30afb8d (server helpers),
2cb20db95f090732a22e43b0488579aeda0639f5 (SHOP/cart),
dc53845ebb7deab881f8d7a2f412f3aaeb97af8a (CI/audit/release evidence).
PR4 includes open PR3 changes and is mergeable; neither PR was merged.
GitHub Actions launched Commerce safety checks; final remote conclusion is
recorded in the task report separately from the completed local checks.

1 November code follow-up on the same PR #4:

- `cdccb19b8136626fa8f0799c0b96f02edb7c0719` — Stripe SDK/Tax/Checkout/payment verification.
- `a59ed6923471fefae4bf929ec00ae50b20842a46` — SQLite repository/migration, durable workflow and read-only preflight.

Remote CI is separate from the 64 focused local passes; report its actual final
run conclusion rather than inferring success from a push. These commits do not
change deployed Site version 31.

Sandbox follow-up, same PR #4:

- `8e938369044c6edacc8d637c2f29461f569abda4` — fresh HTTPS Requests across
  Printful proxy retries; actual ProxyHandler regression (isolated transport).
- `14e5cebf812be31908ac22c6102bce33bfa2a710` — restricted sandbox keys,
  distinct sanitized permission errors, least-privilege runtime preflight,
  generated synthetic credential fixtures and broader public secret scan.
- Latest local focused result: 67 cases passed. Full current repository CI must
  be checked on the final PR head; no new deployment is implied by these commits.
- Actual plugin reads: sandbox authentication succeeds; Tax pending/missing
  head_office, empty registrations and v1 snapshot endpoints. No writes/charges.
- Full repository CI on `a1c3c80c697290eda628614436b7e56dcdd756b3` completed
  success: https://github.com/CJMORE66/underground-alchemy/actions/runs/41275702803
  Commerce/importer, atlas, both language suites, static release validation and
  whitespace steps all passed. No backend or new Site deployment occurred.

