# Printful integration audit

Updated: 1 November 2026 (Europe/Paris). Overall: **PARTIALLY WORKING**;
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
  Static version 31 was deployed on 31 October; source
  `3fb9f74a210b6b1176c3f1363035d8b9c4054483`. It remains unchanged by the
  1 November backend work. See `PRINTFUL_DEPLOYMENT.md` for exact release IDs.
- Hosting is static `dist/`, declared by `.openai/hosting.json`. GitHub and
  Sites have separate source histories and publishing workflows. A GitHub merge
  is not evidence of a Sites deployment. Bounded PR #3 changes were applied to
  the opened Sites source while preserving unrelated content.
- Sites runtime environment inspection returned **zero configured entries**.
  No Printful/Stripe credentials were available in the process or Site settings.
  The user confirmed **Stripe** on 1 November and then authorized its separate
  Jakub Cais sandbox through the plugin. Those earlier MCP reads authenticate
  with `livemode:false`; the newly selected underground alchemy live connection
  is documented above and must not inherit that sandbox evidence. This does not inject runtime credentials or establish a
  configured Tax policy: settings are pending, missing `head_office`, and all
  registrations are empty. See `PRINTFUL_TEST_RESULTS.md` for exact read scope.
- The new server work uses Node 24, official Stripe SDK **23.1.0**, pinned API
  **2026-10-28.endive**, a real on-disk SQLite repository and durable payment
  inbox/worker. These are source changes for
  [PR #4](https://github.com/CJMORE66/underground-alchemy/pull/4), not a backend
  deployment. Static Sites/Cloudflare cannot execute this Node SQLite service.

## Current merchant connection — 1 November 2026

The owner selected the separate **underground alchemy** merchant,
`acct_1UWra7PkIIV492Qz`. Fresh account discovery on its Stripe connection
returns this account with `livemode:true` only. The older Jakub Cais connection
still exposes its own live account and sandbox; those are separate identities.
Earlier sandbox evidence must not be attributed to underground alchemy.

Actual read-only requests on the selected merchant succeeded:

- `GET /v1/tax/settings`: object `tax.settings`, `livemode:true`, `status:active`.
- `GET /v1/tax/registrations?status=all&limit=100`: empty, `has_more:false`.
- `GET /v1/webhook_endpoints?limit=100`: empty, `has_more:false` (v1 snapshot
  endpoints only; not a complete v2 Event Destination inventory).

No settings, Session, payment, webhook destination or Printful order was written.
Active Tax settings do not establish the merchant's applicable registration or
price/tax policy. No missing head-office claim is made for this merchant; the
previous pending/head_office finding belongs to the older Jakub Cais sandbox.

Required next access: authorize this merchant's own sandbox/test context through
its Stripe connection, then rediscover the exact returned context and mode.
Do not flip this live context to false, reuse the old sandbox, inherit its keys
or reuse an old merchant's database/Session/order mappings. Runtime keys, actual
HTTPS endpoint/secret, Printful token and a deployed durable Node backend remain
unavailable. Checkout is disabled; static version 31 is unchanged.

## Classification

The subsequent sandbox follow-up also repaired a confirmed proxy retry bug:
urllib mutates the Request transport while tunneling, so reusing a Request could
break HTTPS retries. Each attempt now starts with a fresh Request. A regression
uses the actual ProxyHandler with isolated transport (429/503/network failures).
Restricted test keys are accepted server-side, denied scopes have a sanitized
distinct error, and the public artifact scan includes `rk_` credentials.

`WORKING` means supported by the evidence stated in that row, not necessarily
live end-to-end commerce. `INCOMPLETE` means some code exists without the full
required behavior. `MISSING` means absent from this inspected application.
`BLOCKED` identifies a required external dependency. `UNVERIFIED` is not a pass.

| Component | Status | Evidence and practical limit |
| --- | --- | --- |
| Framework/runtime | WORKING | Static HTML/CSS, browser ES modules; Python tools and Node tests. No framework migration was needed. |
| Dependencies | WORKING | Locked frontend dependencies plus official Stripe SDK 23.1.0; pinned API 2026-10-28.endive. Node 24 is needed for the SQLite backend. Security command results are recorded separately. |
| Frontend hosting | WORKING | Static version 31 and production SHOP/cart smoke were verified on 31 October. No UI deployment accompanies the Stripe backend changes. |
| GitHub review | WORKING | PR #4 carries the bounded commerce changes and this Stripe follow-up. Review/merge is distinct from Site or backend deployment. |
| Existing original commerce host | BROKEN | On 31 October the browser opened the documented `hiphop.caisik.i234.me/dk/store?page=1` and displayed the Czech Synology not-found page. The underlying proxy/container/backend cause cannot be determined from that page. |
| Original backend framework | UNVERIFIED | Historic public payload uses `prod_…`/`variant_…` IDs consistent with Medusa. This is an inference; private source/runtime was not inspected. Magento is a separate historically inspected host, not an established replacement. |
| Server API routes/functions | INCOMPLETE | `createStripeWebhookHandler` implements a bounded raw-body Request handler for `/api/stripe/webhook`, but no Node host/router is mounted. Authenticated quote/checkout/order routes remain to be implemented in the real host. |
| Selected merchant authentication | WORKING for bounded live MCP reads | underground alchemy Tax settings return active/livemode:true; registrations and v1 snapshot endpoints are empty. Its own sandbox is not authorized yet. Earlier Jakub Cais sandbox evidence does not transfer. |
| Runtime authentication/secret configuration | BLOCKED | No Printful token, Stripe test runtime key or actual endpoint signing secret is configured. The runtime CLI preflight blocks before network access; plugin OAuth credentials are separate. |
| Product/variant mapping | INCOMPLETE | Historical snapshot has 20 products/86 variants and retained Printful/source identities. Current counts, designs and identities require authenticated comparison. |
| Product synchronization | INCOMPLETE | Read-only importer supports full/explicit incremental reads, bounded pagination/retries, public-field filtering and atomic output. Offline test evidence does not establish live API compatibility. |
| Prices and availability | INCOMPLETE | Dated original-store prices remain historical evidence; importer records separately observed Printful retail prices/availability. No value is a server-approved customer checkout quote. |
| Product grid/detail/gallery | WORKING | Existing SHOP supports search, categories, variant selection and original product mockups; latest release checks are in test evidence. |
| Cart | WORKING | Version 31 device-local saved selections, quantities and reload behavior passed automated/browser/production checks. This is not a server quote/order. |
| CZ/EN/FR | WORKING | Delivered SHOP/cart controls passed shared language suites and production switching checks; no new public UI is introduced here. |
| Checkout/payment integration | INCOMPLETE | Stripe is confirmed. A test-only hosted Checkout adapter implements immutable quote/session/variant/amount bindings and fresh payment verification. Real account/test credentials, business routes and end-to-end checkout remain BLOCKED; public checkout stays disabled. |
| Shipping/address validation | INCOMPLETE | Reusable validation/provider helpers can be tested offline; live shipping estimates and destination acceptance require authorized API calls and original backend wiring. |
| Customer tax/currency policy | INCOMPLETE policy | Current underground alchemy live Tax settings are active with no registrations returned. Its sandbox Tax remains unverified. Merchant tax policy, product/shipping tax codes, delivery countries and selling prices still need verification. |
| Database/models/migrations | WORKING locally; BLOCKED deployment | `SqliteCommerceRepository` and checksum-checked migration provide real private on-disk persistence, transactions, unique bindings and leases; 14 integration tests include multiprocess races. No durable backend disk/host is connected. |
| Internal order lifecycle | INCOMPLETE | Durable Stripe event inbox/jobs, worker leases, payment-to-draft coordination and single-POST gate are implemented/tested locally. Production host, trusted order/quote creation, notifications and operational controls remain absent. |
| Printful order creation | BLOCKED | Requires authorized token, correct mapped variants and original backend. No live draft or confirmed fulfillment order was created in this task. |
| Payment webhooks | INCOMPLETE | Stripe SDK verifies raw snapshot events at the pinned API version; handler durably enqueues before HTTP 200. Real snapshot destination, actual endpoint secret, reachable host and real delivery remain BLOCKED. |
| Printful webhooks | INCOMPLETE | Authentication/deduplication helpers are isolated; real webhook configuration, durable receiver, delivery and out-of-order reconciliation remain unverified. |
| Fulfillment/tracking/customer notifications | BLOCKED | No verified paid/internal order, backend delivery service or live Printful order is available. |
| Refund/cancellation | INCOMPLETE | Fresh Stripe verification rejects refunded/disputed/reviewed payments and any refund history before drafting. Initiating customer refunds/cancellations and Printful cancellation are not implemented. No actual charge changed. |
| CI/CD | INCOMPLETE | `.github/workflows/commerce.yml` contains Node 24 offline safety checks. Local evidence is separate from the latest remote CI result. No backend deployment pipeline is configured; Sites uses explicit saved versions. |
| Logging/monitoring | INCOMPLETE | Importer errors avoid credentials/upstream bodies; server helpers provide safe errors. Production commerce telemetry, audit storage and failure alerts require a backend. |
| Automated tests | WORKING for local scope | Earlier focused run: 19 existing server + 19 Stripe SDK/signature + 14 actual SQLite + 12 workflow tests passed. Automated provider calls remain fixtures. Actual sandbox read-only verification is separate; payment E2E remains unverified. |
| Security | INCOMPLETE | Payment integrity, raw signatures, private DB permissions, leases/uniqueness and disabled public checkout are tested. Business authentication/authorization, abuse controls, customer-data retention/anonymization and real deployment review remain required. |

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
5. On 31 October there was no configured payment adapter, durable order database
   or webhook receiver. The 1 November Stripe adapter, SQLite repository and
   durable worker resolve those source-code gaps. They do not resolve missing
   credentials, actual merchant Tax configuration or a mounted backend host.
6. Immutable `commerce_orders.order_json` stores the validated order/address.
   Migration 001 prevents order update/delete, and there is no implemented
   retention/anonymization path. That is a concrete production blocker, not a
   completed customer-data retention policy.

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
- The Stripe adapter accepts restricted `rk_test_` and `sk_test_` credentials and requires test-mode
  objects; it does not support live keys or paid Printful confirmation. A
  provider redirect or signed event alone is never payment proof: the worker
  re-fetches the Session, all bound lines/shipping, PaymentIntent, captured
  charge and refund history.
- Actual SQLite transaction/concurrency tests are not mocked database tests.
  Provider fixtures and local SDK signature tests are still not real Stripe
  authentication, merchant Tax readiness or payment evidence.

## Authoritative references

- [Printful API v1: authentication, scopes, stores, sync products, orders, shipping](https://developers.printful.com/docs/)
- [Printful API v2 beta: signed webhook documentation](https://developers.printful.com/docs/v2-beta/)
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe webhooks: snapshot format, API version and raw signature verification](https://docs.stripe.com/webhooks)
- [Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api)
- Repository evidence: `docs/COMMERCE.md`, `docs/commerce/SHOP_REPAIR.md`,
  `docs/commerce/PRINTFUL_CONNECT.md`, `dist/catalog.json`,
  `dist/shop/catalog.json`, `tools/sync-printful.py`, `.openai/hosting.json`.

Read `PRINTFUL_ARCHITECTURE.md`, `PRINTFUL_SETUP.md`,
`PRINTFUL_TEST_RESULTS.md`, `PRINTFUL_DEPLOYMENT.md` and
`PRINTFUL_PROGRESS.md` before resuming. A blocked component is not accepted as
complete merely because its helper or test fixture exists.
Stripe-specific configuration and host bootstrap are in `STRIPE_SETUP.md`.

