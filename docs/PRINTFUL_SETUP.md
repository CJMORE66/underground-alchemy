# Printful setup and remaining access dependencies

Updated: 31 October 2026 (Europe/Paris). Live commerce remains blocked. Do not
send API tokens, payment keys, customer records or webhook secrets in chat or
commit them to this repository. Set values through the actual server's secret
manager or the authorized local process environment.

## Required owner actions

| Dependency | Exact access/action needed | Purpose |
| --- | --- | --- |
| Original NAS/deployment | Authorized access to Synology reverse proxy/HTTPS virtual host for `hiphop.caisik.i234.me`, its target port, Container Manager/Docker Compose definitions and bounded service logs | Diagnose today's Synology not-found page and restore the existing storefront/backend |
| Original backend source/runtime | Repository/branch, running platform/version, deployment procedure and environment-key names; do not paste secret values | Locate existing cart/checkout, payment provider and fulfillment adapter; prevent a duplicate sender |
| Backend database/admin | Read-only product/order mapping and schema first, then narrowly authorized migration/write path if necessary | Verify source product/variant IDs, SKU, selling price/currency, Printful mapping, existing orders and uniqueness |
| Existing Printful store | Account access establishing store ID/type and existing integration/webhook settings; expected historical ID is `18912189` | Verify the correct actual store and its configuration without creating a replacement |
| Printful credential | Store-scoped private token stored securely as `PRINTFUL_API_TOKEN`, initially `sync_products/read`; add `orders/read` only for authorized read verification | Authenticate catalog/store reads and establish real counts/variant mappings |
| Draft-order capability | Only when backend is identified: narrowly scoped `orders` permission in the actual server's secret configuration | Verify a deliberate draft-only create/reconcile flow. It does not authorize confirmation or paid fulfillment |
| Existing payment sandbox | Provider identity, existing sandbox/test account connection, test credentials in server secrets, webhook endpoint/configuration and signing secret | Verify server-side payment status and duplicate/replayed event behavior without real charges |
| Merchant business/tax configuration | Verified merchant country, tax registrations, supported selling currencies/countries, configured tax service and product tax handling | Calculate actual customer tax and totals; do not derive them from Printful's merchant cost/tax |
| Durable processing/notifications | Existing database/queue/job host, admin access boundaries and customer notification service | Persist orders, event/job uniqueness, retries/dead letters, state/tracking and customer confirmations |

No real charge or paid fulfillment test is needed for the currently authorized
offline/static release. Request separate explicit authorization before either.
Adding a read-only token does not resolve the backend/payment/tax dependencies.

## Read-only catalog import

Prerequisites: Python 3.10+, a verified existing store type, secure credential
injection into the current process, network permission for
`https://api.printful.com`, and a clean/reviewed output diff. Do not place the
token in a command argument, `.openai/hosting.json`, browser JavaScript or logs.

From the repository root, with `PRINTFUL_API_TOKEN` already injected securely:

```sh
# Existing Manual/API store; full scan is the default.
python tools/sync-printful.py --platform api --output /tmp/caisik-printful-review.json

# Use this family only if the existing store is an ecommerce platform store.
python tools/sync-printful.py --platform ecommerce --output /tmp/caisik-printful-review.json

# Explicit bounded incremental refresh; repeat --product-id for more products.
python tools/sync-printful.py --platform api --product-id 482104768 --output /tmp/caisik-printful-review.json
```

The numeric product ID in the incremental example comes from the historical
catalog and must be verified for the actual store. It is not a promise that this
product still exists. Choose one appropriate command, not all three blindly.
For repeated incremental review, use the intended current review file as the
previous state. A separate new output falls back to the checked-in public
catalog for stable mappings. The CLI never creates or confirms an order.

After a real successful read:

1. Record only sanitized identity/count/timestamp results. Compare returned
   store identity/type and real product/variant counts with the public export.
2. Review removed/ignored/unconfigured/unavailable variants and SKU/catalog-ID
   conflicts. Review public preview images and retained merchandising fields.
3. Keep historical `sourcePrice.checkedAt` unchanged. Separately review Printful
   retail-price/availability observations; establish customer selling prices,
   currency, shipping and tax in the actual backend before enabling checkout.
4. Run the current tests in `PRINTFUL_TEST_RESULTS.md`, review the JSON diff,
   then deliberately replace `dist/shop/catalog.json` with the reviewed public
   export. Do not copy raw provider responses or credentials.
5. Publish through the existing Sites workflow. Importing JSON or merging a
   GitHub PR alone does not deploy it. Remove the process credential afterward.

The importer validates expected historical store `18912189`, allows only GET
store/catalog endpoints, refuses redirects, bounds requests/responses/retries
and writes output atomically. A genuine empty full scan is distinct from failed
authentication. Incremental scans cannot certify a full current store.

## Provider and webhook wiring

Use [Printful API v1](https://developers.printful.com/docs/) for existing
store/catalog/order/shipping contracts. Base URL is
`https://api.printful.com`; authentication is Bearer token. `X-PF-Store-Id`
identifies the expected store for account-level contexts; prefer a token scoped
to the actual store. Inspect the granted scopes and do not infer permission
from the token's existence.

Before order writes, inspect whether the original backend/Printful integration
already imports paid orders. Exactly one path should own submission. Use stable
internal order identity for `external_id`, map configured `sync_variant_id`,
create a draft with `confirm=false`, and reconcile an ambiguous create by
external ID. Never interpret an order draft as paid/confirmed manufacturing.

Before registering webhooks, read existing configuration. v1 has a single
webhook configuration per store; replacing it can disrupt the original
integration. The [v2 beta documentation](https://developers.printful.com/docs/v2-beta/)
defines signed webhooks with a separate contract; inspect actual available
version/key/header configuration before use. Do not assume that v1 events have
v2 signatures or that beta registration already exists. Payment webhooks must
follow the actual payment provider's official signing/API verification rules.

Use `webhooks/read` for the initial authorized configuration inspection. Only
grant `webhooks` write permission if a reviewed configuration change is required.
Keep the provider-created hexadecimal secret and public key in server secret
configuration. Pass original request bytes and the exact signature/public-key
headers to the verifier; JSON parsing or middleware rewriting must not precede
signature verification. Real registration/delivery and cross-version order
notifications remain unverified.

`server/commerce/` is a disconnected server-only library. It is intentionally
outside `dist/`; setting a Site environment variable alone does not expose an
endpoint or connect storage. Wire it into the identified original backend only
after matching its interfaces, durable repository, payment evidence and secret
handling. Verify recovery/concurrency through the real database before live use.

## Verification required before enabling sales

The owner/backend team must be able to demonstrate, with authorized test data:

1. Real Printful authentication and exact correct store/product/variant mapping.
2. Server-approved variant price/currency, live shipping methods and configured
   customer tax for the test address; frontend price tampering is rejected.
3. Successful and failed test checkout; verified server-side payment evidence;
   durable internal order persistence.
4. One linked Printful draft after payment, including concurrent duplicate
   events, timeout reconciliation and retry/dead-letter recovery.
5. Real webhook delivery/authentication, duplicate/out-of-order processing,
   canonical status/tracking synchronization and authorized order visibility.
6. Payment-provider refund/cancellation handling coordinated with internal and
   Printful states; customer notifications without data leaks.
7. Production build/deployment, reachable configured endpoints, production logs,
   rate limits, retention controls and tested rollback.

Keep checkout disabled until these applicable criteria are supported by real
evidence. Update `PRINTFUL_PROGRESS.md` and `PRINTFUL_TEST_RESULTS.md` rather than
relabeling mocked tests as live verification.
