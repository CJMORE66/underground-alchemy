# Node commerce backend — implemented, not hosted

Updated 2026-11-01. Stripe is confirmed. Server-only modules stay outside
published `dist/`; static Sites version 31 is unchanged and checkout is disabled.
Node 24/`node:sqlite` needs a separate durable Node host and cannot run in static
Sites/Cloudflare. Actual sandbox MCP authentication is verified separately;
runtime credentials, actual payment and backend deployment remain unverified.
Sandbox Tax is pending (missing `head_office`), with no registrations returned.

## Modules

- `stripe.js`: official SDK 23.1.0, pinned API `2026-10-28.endive`, restricted
  `rk_test_` (preferred) or `sk_test_` keys only. Verifies actual configured Tax settings/registrations, calculates
  and freezes address/line/variant/shipping/tax/total quotes, creates/resumes hosted
  Checkout with stable idempotency parameters, recovers Session references and
  re-fetches Session/lines/PI/captured charge/refund history before payment proof.
  Raw account snapshot events use SDK signature verification; live/Connect/thin
  payloads are not supported. No raw card data is handled.
- `sqlite-repository.js` + `migrations/001-commerce.sql`: real private-file SQLite
  repository; checksum-checked explicit startup migration, WAL/FULL transactions,
  immutable orders, unique Session/external/payment references, atomic event
  inbox/jobs, leases with random fencing tokens, bounded retries/dead letters and
  a durable single-Printful-POST gate.
- `stripe-workflow.js`: loads authoritative persisted orders for Checkout,
  conditionally binds Sessions, admits signed events durably before HTTP 200,
  and runs payment-to-draft jobs through a leased worker. Exported
  `createStripeWebhookHandler` handles raw Request POSTs at
  `/api/stripe/webhook`; no actual HTTP server/router is mounted.
- `orders.js`: deterministic bounded external ID, amount/currency/order/payment
  reference checks, payload hashing and durable draft workflow. `beginDraftAttempt`
  atomically permits a POST only before any attempted mutation; ambiguous results
  can only reconcile. No timeout clears the durable gate.
- `printful.js`: fixed origin/store, verified store precondition, no redirects,
  bounded JSON/timeouts/read retries, shipping estimates and draft creation with
  `confirm=false&update_existing=false`. Shipping uses catalog `variant_id`;
  configured designs use `sync_variant_id`. No confirmation, cancellation,
  refund, webhook-registration or arbitrary-request method exists.
- `webhooks.js`: Printful v2 hex-key HMAC-SHA256/raw-byte/public-key/store
  verification and newer-order/shipment state reducer. It rejects unsigned v1
  events; actual signed subscription/cross-version delivery and a durable
  Printful event-ledger/snapshot receiver remain unconnected.
- `validation.js`: bounded inputs/items, explicit currency exponent and integer
  money arithmetic. It does not establish deliverability or merchant tax policy.

## Startup and host contract

See [`docs/STRIPE_SETUP.md`](../../docs/STRIPE_SETUP.md) for actual bootstrap,
tax configuration/quote fields, secrets, snapshot subscription and worker calls.
Use a private durable directory mode 0700, service umask 0077 and absolute DB
filename outside public mounts. Call `repository.migrate()` before serving or
starting workers; checksum mismatch must stop startup. Database/WAL/SHM files
need private durable storage/backups. Tests establish local shared-file
concurrency, not multi-machine/network-filesystem support.

The host must supply `STRIPE_SECRET_KEY` (prefer restricted `rk_test_…`, or `sk_test_…`), the actual destination's
`STRIPE_WEBHOOK_SECRET` (`whsec_…`), `PRINTFUL_API_TOKEN`, verified active Stripe
Tax registrations/product+shipping tax codes/countries, and authoritative
merchant catalog prices. Secrets belong in the host secret manager, never chat,
Git, logs or browser code. No arbitrary browser totals/paid flags are trusted.

Mount authenticated/authorized quote, checkout and order routes with abuse
controls. The supplied webhook handler preserves raw bytes, requires JSON POST,
limits body size and returns 503 when the event cannot be durably saved. Configure
account **snapshot** events at API `2026-10-28.endive`: completed, async success,
async failure and expired Checkout Sessions. Only the first two enqueue jobs.
Success redirects are not payment evidence or a completed confirmation UI.

Supervisor-managed workers call `processNextPayment` with distinct IDs. Default
lease is five minutes, maximum fifteen; no renewal method exists, so bound the
whole attempt beneath its lease. Fencing prevents expired owners completing
reclaimed jobs. Five attempts and bounded backoff end in durable dead letters;
operator monitoring/replay UI is not implemented. Do not replay uncertain
Printful mutations or release their reservation after an empty lookup.

## Evidence and remaining limits

Latest focused local run: **67 passed** — 19 original server fixture cases, 21 Stripe
adapter cases with official SDK signature checks/mock HTTP, 14 real disk SQLite
integration cases including eight-process races, 13 real-SQLite workflow cases
with fake providers. This is actual database evidence, not real Stripe/Printful
authentication, account Tax configuration, payment, webhook delivery or draft.

Missing host work includes actual secrets/configuration/HTTPS mounting, business
authentication/authorization/rate limits, trusted catalog quoting/address
validation, production backups/monitoring, notifications, customer refund/
cancellation and durable Printful status/tracking receiver. Current payment
verification detects refunds/disputes/reviews; it does not initiate refunds.

**PII retention is incomplete:** immutable `commerce_orders.order_json` stores
customer addresses and SQL triggers block update/delete. Implement an approved
retention/anonymization schema/process and backup lifecycle before production
customer storage. No live-key mode or paid Printful confirmation is implemented
or authorized. Keep public checkout disabled until real acceptance is demonstrated.

Contracts: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe webhooks](https://docs.stripe.com/webhooks),
[Stripe Tax](https://docs.stripe.com/tax/standalone-tax-api),
[Printful v1](https://developers.printful.com/docs/),
[Printful v2 beta](https://developers.printful.com/docs/v2-beta/).
