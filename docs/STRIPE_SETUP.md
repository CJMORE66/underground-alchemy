# Stripe test-mode setup

Updated: 1 November 2026 (Europe/Paris). Stripe is confirmed by the user.
Implemented source is test-only. The owner-authorized sandbox now passes actual
read-only Stripe MCP requests; the Node runtime still has no key. Tax settings
are `pending` with missing `head_office`, and registrations are empty. No actual
payment was created and no backend is deployed. Static Sites version
31 is unchanged, with public checkout disabled. This setup cannot enable live
keys or confirm paid Printful manufacturing.

## Required host and secrets

- Node 24 with installed locked dependencies, including official `stripe`
  **23.1.0**. API/snapshot version is pinned to **2026-10-28.endive**.
- A real Node host/router and supervisor with a private durable local directory.
  The `node:sqlite` repository cannot run in static Sites or Cloudflare Workers.
  If reusing the original NAS, first obtain authorized reverse-proxy/Compose/
  backend access and repair the observed Synology routing failure.
- Secret-manager injection of `STRIPE_SECRET_KEY` from the actual test account
  (prefer a restricted `rk_test_…`; `sk_test_…` is also supported),
  `STRIPE_WEBHOOK_SECRET` from the actual registered endpoint
  (`whsec_…`), and the authorized store-scoped `PRINTFUL_API_TOKEN`.
- Verified Stripe Tax policy: active test settings/registration IDs, merchant
  country, allowed delivery countries, product/shipping tax codes and supported
  selling currencies/prices. No sample registration or tax rate is a real policy.
- Authenticated/authorized business routes, trusted catalog/quote creation,
  request limits, dead-letter administration and a PII retention/anonymization
  design. These remain host integration work, not completed by setting secrets.

Never paste secrets into chat, commit them, put them in browser code, command
arguments or `.openai/hosting.json`. The installed Stripe plugin is now authorized
for the sandbox. This OAuth connection does not inject a key or webhook secret
into the Node backend.

## Actual sandbox verification — 1 November 2026

The account list returned the existing live account and its separate sandbox.
Only the owner-selected sandbox (`livemode:false`) was used for API reads:

- `GET /v1/balance`: authenticated, object `balance`, `livemode:false`; no amounts retained.
- `GET /v1/tax/settings`: `status:pending`, `livemode:false`, missing `head_office`.
- `GET /v1/tax/registrations?status=all&limit=100`: empty, `has_more:false`.
- `GET /v1/webhook_endpoints?limit=100`: empty, `has_more:false`. This inventories
  v1 snapshot endpoints only, not every v2 Event Destination.

These are actual provider responses through the plugin, not fixtures and not an
SDK/runtime preflight. The plugin advertises schema `2026-09-30.preview`; these
reads do not verify the adapter's pinned API `2026-10-28.endive` in the runtime.
No account settings were written and no Session, payment or Printful order was
created. Existing live-account settings were not inspected or changed.

Next, the owner must complete the sandbox's Tax head-office address and confirm
the applicable merchant tax policy. Add registrations only for jurisdictions
where the merchant is actually registered; do not create fictitious registrations
to pass a test. The current automatic-tax adapter requires verified active
settings/registrations and deliberately blocks an empty configuration. If a
different tax policy is required, verify and implement it before checkout.

After an authorized Node host is available, inject a restricted sandbox key with
the minimum permissions for Tax settings/registrations reads, Tax calculations,
Checkout creation/read, line items and PaymentIntent/charge/refund reads. The
CLI preflight uses Tax settings and does not require Balance Read. Configure the
real HTTPS snapshot endpoint and inject its signing secret only after it exists.

Official setup references: [Stripe Tax setup](https://docs.stripe.com/tax/set-up),
[API/restricted keys](https://docs.stripe.com/keys), and
[sandbox isolation](https://docs.stripe.com/sandboxes).

## Read-only preflight

With the actual test key securely injected into the process environment:

```sh
node tools/verify-stripe.mjs
node tools/verify-printful.mjs
```

Stripe preflight reads the test Tax settings object/mode only. It creates
no Session/payment, writes no webhook configuration and prints no balance/customer
data. `VERIFIED_READ_ONLY` would prove that bounded read only, not checkout,
registrations, endpoint signature or payment. Missing/live keys stop before
network access. Current observed result is `BLOCKED`, `networkAttempted:false`.

## Private database and module bootstrap

Provision a durable service-owned directory mode **0700** outside the repository,
`dist/` and any public/static mount. Use a service umask **0077**. Database/WAL/
SHM files contain private data and need equivalent access controls and backups.
Inject its absolute database filename as a host setting such as
`COMMERCE_DB_PATH`; the code below reads that setting explicitly.

The following assembly belongs inside the actual Node service. It is not a
standalone HTTP storefront; the host must mount the handler and supervise its
worker. `taxConfiguration` must be loaded from verified server-owned policy:
`{mode:'stripe_automatic', policyRevision, registrationIds, allowedCountries}`.
Do not populate it with guessed identifiers/countries.

```js
import { SqliteCommerceRepository } from './server/commerce/sqlite-repository.js';
import { createStripeTestAdapter } from './server/commerce/stripe.js';
import { PrintfulClient } from './server/commerce/printful.js';
import { StripeOrderWorkflow, createStripeWebhookHandler } from './server/commerce/stripe-workflow.js';

export async function bootstrapCommerce(taxConfiguration) {
  const repository = new SqliteCommerceRepository({ filename: process.env.COMMERCE_DB_PATH });
  repository.migrate(); // Explicit startup only, before requests/workers.
  const stripe = createStripeTestAdapter({
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    taxConfiguration
  });
  const printful = new PrintfulClient({ token: process.env.PRINTFUL_API_TOKEN });
  await printful.verifyStore();
  const workflow = new StripeOrderWorkflow({ repository, stripe, printful });
  return {
    repository, stripe, workflow,
    webhookHandler: createStripeWebhookHandler(workflow)
  };
}
```

`migrate()` applies/checks migration 001's checksum transactionally; it never
runs in the webhook request. A mismatch stops startup. Use one durable local
SQLite volume shared by the service's local worker processes. Multi-machine
network-filesystem/WAL operation is not established by the tests.

After the host authenticates order ownership, resolves enabled variants/prices
from trusted merchant records, validates the address and selects an actual
Printful shipping quote, its server-owned order can be frozen/persisted:

```js
const quote = await stripe.calculateTax(trustedOrder);
repository.createOrder({ ...trustedOrder, ...quote });
const session = await workflow.createCheckout(trustedOrder.id);
// Return only the validated hosted URL to the authorized owner.
```

`trustedOrder` must include `id`, uppercase `currency`, validated `recipient`,
`items:[{sync_variant_id,quantity}]`, actual `shippingId`/`shippingMinor`, verified
`shippingTaxCode`, and `checkoutLines:[{syncVariantId,name,unitAmountMinor,quantity,taxCode}]`.
Every line must map one-to-one to the same fulfillment variant/quantity. No
browser-provided amount or historic public catalog price supplies these values.

The quote binds address/variants/amounts/policy and expires for new creation in
at most 30 minutes. Checkout uses deterministic `expires_at=quoteExpiry+1860`
and stable idempotency key, so lost-reply retries serialize identically. A
Session can remain open roughly 31–61 minutes after creation; fresh verification
still demands the original frozen address/tax/total. Changed data is rejected.
Expiry/requote/customer recovery UI is host work. Public return URLs currently
point to static SHOP and are not an implemented order-confirmation screen.

## Actual snapshot endpoint

On the real test account create an **account / Snapshot** event destination,
API version **2026-10-28.endive**, HTTPS path `/api/stripe/webhook` on the Node
host. This adapter rejects thin/Connect/live-mode payloads. Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Store that endpoint's signing secret securely. A Stripe CLI forwarding secret
belongs to its local listener and must not be substituted for the deployed
endpoint secret. Mount `webhookHandler` with original request bytes untouched:
no JSON-body parsing/re-serialization before the SDK signature check. The
handler bounds JSON requests to 256 KiB, handles POST only, and acknowledges
after durable event/job insertion. Persistence failure returns 503 for retry;
invalid signatures return 400. It does not perform provider fulfillment inline.

Only completed/async-success events enqueue work. An unpaid completed event
waits for a separately signed async success; failed/expired events do not trigger
drafting. The worker then re-fetches Session, lines, shipping/address/tax/total,
PaymentIntent, captured charge and refund history. A valid signature by itself
does not prove payment or authorize a draft.

## Worker and recovery

Each supervised worker uses a distinct stable process ID and repeatedly calls:

```js
await workflow.processNextPayment({ workerId, leaseMs: 300000 });
```

Poll/back off when idle; catch/report safe error codes without customer data.
The repository owns atomic claims, random fencing tokens, five-attempt limit,
bounded retries and durable `dead_letter` states. Lease expiry permits recovery;
stale owners cannot acknowledge a reclaimed job. There is no renewal/heartbeat
method, so provider timeouts plus the whole attempt must fit the chosen lease
(maximum fifteen minutes). Dead-letter replay/admin UI is not supplied.

Early webhooks can recover a lost Session binding through freshly retrieved
metadata and the immutable quote, including after creation expiry. This restores
mapping only. Printful's durable single-POST gate survives crashes: safe initial
lookup errors can retry, while ambiguous accepted creates reconcile by external
ID without another POST. Never manually reset that gate merely because a lookup
is temporarily empty.

## Before production

Actual test credentials, Tax registration/country/tax-code policy, HTTPS delivery,
host persistence/restart/backup and authorized test checkout must be demonstrated.
The latest 67 focused local tests include a real disk database and official SDK
signatures, but Stripe/Printful HTTP calls remain fixtures.

`commerce_orders.order_json` persists customer address data; SQL triggers
currently prohibit update/delete. **Retention/anonymization is not implemented**
and must be designed/migrated before production customers. Also complete
ordinary business auth/rate limits, trusted quoting, notifications, customer
refund/cancellation and durable Printful status/tracking integration. No live-key
mode or paid Printful confirmation method is implemented or authorized.

Sources: [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create),
[webhooks](https://docs.stripe.com/webhooks),
[Tax](https://docs.stripe.com/tax/standalone-tax-api),
[Printful v1](https://developers.printful.com/docs/).
