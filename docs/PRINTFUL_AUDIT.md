# Printful integration audit

Audit date: 31 October 2026 (Europe/Paris). Overall: **PARTIALLY WORKING**;
live commerce is **BLOCKED**. This document separates inspected code, offline
tests, current browser observations and unverified external services. Final test
and deployment evidence belongs in `PRINTFUL_TEST_RESULTS.md` and
`PRINTFUL_DEPLOYMENT.md`.

## Inspected sources and deployment

- GitHub: `CJMORE66/underground-alchemy`, `main` at
  `be639623d83da4f6527732b5672a7960b430765c` when inspected.
- [PR #3](https://github.com/CJMORE66/underground-alchemy/pull/3) is open and
  ready for review, not a draft. Its head at inspection was
  `99b86b626f0d6a2c2ca3f058ead5c77f37edd7a3`. It fixes SHOP access and historical
  product mapping; it does not implement checkout or order fulfillment.
- Sites project: `appgprj_6ad19e715dcc819185592c61456c5182`, public audience.
  Opened source was version 30, commit
  `bf4c1077f072847991c3d8eea0925b9ae5061e66`.
- Hosting is static `dist/`, declared by `.openai/hosting.json`. GitHub and
  Sites have separate source histories and publishing workflows. A GitHub merge
  is not evidence of a Sites deployment. Bounded PR #3 changes were applied to
  the opened Sites source while preserving unrelated content.
- Sites runtime environment inspection returned **zero configured entries**.
  No Printful token, payment credentials or backend database was available.

## Classification

`WORKING` means supported by the evidence stated in that row, not necessarily
live end-to-end commerce. `INCOMPLETE` means some code exists without the full
required behavior. `MISSING` means absent from this inspected application.
`BLOCKED` identifies a required external dependency. `UNVERIFIED` is not a pass.

| Component | Status | Evidence and practical limit |
| --- | --- | --- |
| Framework/runtime | WORKING | Static HTML/CSS, browser ES modules; Python tools and Node tests. No framework migration was needed. |
| Dependencies | WORKING | `package.json` and lockfile contain maplibre-gl, three, web-vitals; esbuild and linkedom are development dependencies. Dependency/security check results are recorded separately. |
| Frontend hosting | WORKING | Existing public Sites project and static manifest inspected; source version 30 opened. New release result is in deployment evidence. |
| GitHub review | WORKING | Repository permissions and open PR #3 inspected. Only its bounded repair scope was adopted. |
| Existing original commerce host | BROKEN | On 31 October the browser opened the documented `hiphop.caisik.i234.me/dk/store?page=1` and displayed the Czech Synology not-found page. The underlying proxy/container/backend cause cannot be determined from that page. |
| Original backend framework | UNVERIFIED | Historic public payload uses `prod_…`/`variant_…` IDs consistent with Medusa. This is an inference; private source/runtime was not inspected. Magento is a separate historically inspected host, not an established replacement. |
| Server API routes/functions | MISSING | Current Site publishes only `dist/`; no commerce HTTP service is connected. New `server/commerce/` helpers are reusable code, not deployed endpoints. |
| Authentication/secret configuration | BLOCKED | No authorized Printful credential was supplied or configured. Real authenticated request and store identity remain unverified. |
| Product/variant mapping | INCOMPLETE | Historical snapshot has 20 products/86 variants and retained Printful/source identities. Current counts, designs and identities require authenticated comparison. |
| Product synchronization | INCOMPLETE | Read-only importer supports full/explicit incremental reads, bounded pagination/retries, public-field filtering and atomic output. Offline test evidence does not establish live API compatibility. |
| Prices and availability | INCOMPLETE | Dated original-store prices remain historical evidence; importer records separately observed Printful retail prices/availability. No value is a server-approved customer checkout quote. |
| Product grid/detail/gallery | WORKING | Existing SHOP supports search, categories, variant selection and original product mockups; latest release checks are in test evidence. |
| Cart | INCOMPLETE | Device-local saved variant/quantity selections exist. They are not an order or a server quote; current browser/test evidence is recorded separately. |
| CZ/EN/FR | INCOMPLETE | Existing translation pipeline and three dictionaries are retained; final cart/SHOP translation and browser evidence are recorded separately. |
| Checkout/payment integration | BLOCKED | Original backend/payment provider and sandbox unavailable. Public checkout remains disabled. No real charge or payment was created. |
| Shipping/address validation | INCOMPLETE | Reusable validation/provider helpers can be tested offline; live shipping estimates and destination acceptance require authorized API calls and original backend wiring. |
| Customer tax/currency policy | BLOCKED | Merchant country/registrations, supported currencies and configured tax service were not established. No tax rate or shipping charge is invented. |
| Database/models/migrations | MISSING | No Site commerce database, migrations or durable order schema is configured. Browser cart storage is not order persistence. |
| Internal order lifecycle | INCOMPLETE | Draft-only safety/state helpers are disconnected. No transaction-safe production repository, queue or verified payment source is connected. |
| Printful order creation | BLOCKED | Requires authorized token, correct mapped variants and original backend. No live draft or confirmed fulfillment order was created in this task. |
| Payment webhooks | BLOCKED | Payment provider and signing configuration unknown. No public payment webhook endpoint is configured. |
| Printful webhooks | INCOMPLETE | Authentication/deduplication helpers are isolated; real webhook configuration, durable receiver, delivery and out-of-order reconciliation remain unverified. |
| Fulfillment/tracking/customer notifications | BLOCKED | No verified paid/internal order, backend delivery service or live Printful order is available. |
| Refund/cancellation | BLOCKED | Actual payment-provider refund API and merchant authorization are unavailable; no customer/merchant charge was changed. |
| CI/CD | INCOMPLETE | No active `.github/workflows` pipeline was found. Archived import recipe in `docs/github/` is not an active deployment pipeline. Sites publishing uses explicit saved versions/deployments. |
| Logging/monitoring | INCOMPLETE | Importer errors avoid credentials/upstream bodies; server helpers provide safe errors. Production commerce telemetry, audit storage and failure alerts require a backend. |
| Automated tests | INCOMPLETE | Existing and added offline suites verify isolated behavior. Exact executed commands/results are in `PRINTFUL_TEST_RESULTS.md`; real API/payment E2E is blocked. |
| Security | INCOMPLETE | Existing image/URL allowlists, bounded inputs, secret exclusions and disabled checkout reduce exposure. No backend security or production-readiness claim is made without a configured backend and live verification. |

## Root causes found

1. The exhibition/atlas was a static frontend with an archived product snapshot,
   not a complete commerce backend. Historic product and cart-address-step
   evidence from 16 October had been mistaken for a complete Printful flow.
2. The original external commerce path is currently unavailable. It owns the
   previously observed cart/checkout behavior, but its deployment is outside
   this repository and unavailable for repair with the current access.
3. PR #3 had not been published to Sites. It preserved original prices/SKUs and
   improved entry points, but did not supply authentication, payment or orders.
4. The earlier importer assumed the Manual/API product family, refused a real
   empty store and lacked safe rate-limit/transient retries. It stripped price
   observations and had no explicit incremental mode. Current changes address
   these code defects; live behavior still needs authenticated verification.
5. Neither a Printful credential nor the actual payment provider, tax policy,
   order database or webhook secret was configured. Those are separate
   dependencies; a read-only Printful token alone cannot enable sales.

## Security and evidence boundaries

- No raw card data, customer address or real payment was submitted. No paid
  fulfillment confirmation is authorized by an offline test result.
- A bounded known-pattern secret scan found no matches in inspected checkout
  text files up to 2 MB. It excluded binary files/history and is not proof that
  every historical artifact is free of secrets. Runtime secret values were not
  printed. Local environment/runtime secret files are excluded from Git.
- Public preview URLs are allowlisted; original printing files and upstream
  private metadata are not exported. Product/variant identifiers are public
  references, not authentication credentials.
- Browser quantities/prices never authorize payment or fulfillment. The new
  cart retains selections only, and public checkout stays disabled.
- API v1 webhook payloads must not be treated as authenticated payment/order
  truth. The v2 beta documentation describes signing, but actual configuration
  must be inspected and verified before wiring a production receiver.
- Do not register another Printful sender or replace webhook settings before
  inspecting the original integration; duplicate fulfillment is a material risk.

## Authoritative references

- [Printful API v1: authentication, scopes, stores, sync products, orders, shipping](https://developers.printful.com/docs/)
- [Printful API v2 beta: signed webhook documentation](https://developers.printful.com/docs/v2-beta/)
- Repository evidence: `docs/COMMERCE.md`, `docs/commerce/SHOP_REPAIR.md`,
  `docs/commerce/PRINTFUL_CONNECT.md`, `dist/catalog.json`,
  `dist/shop/catalog.json`, `tools/sync-printful.py`, `.openai/hosting.json`.

Read `PRINTFUL_ARCHITECTURE.md`, `PRINTFUL_SETUP.md`,
`PRINTFUL_TEST_RESULTS.md`, `PRINTFUL_DEPLOYMENT.md` and
`PRINTFUL_PROGRESS.md` before resuming. A blocked component is not accepted as
complete merely because its helper or test fixture exists.
