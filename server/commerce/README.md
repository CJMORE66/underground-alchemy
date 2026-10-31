# Server commerce adapters — implemented, not connected

These modules are server-only integration building blocks. They are outside the
published `dist/` directory. They expose no HTTP endpoint, collect no customer
data, choose no payment provider, and are **not a deployed checkout**.

`printful.js` fixes the API origin/store, refuses redirects, bounds response bodies
and timeouts, redacts diagnostics, retries only reads and read-only shipping
estimates, and creates drafts using `confirm=false&update_existing=false`. It has
no confirmation, cancellation, refund, webhook-registration or arbitrary-request
method. Shipping uses the catalog `variant_id`; configured draft designs use the
store's `sync_variant_id`. Store verification must complete first.

`orders.js` loads authoritative persisted orders and requires an injected payment
verifier that verifies the existing payment provider server-side. The verifier
must bind order ID, captured amount, currency and unique provider reference.
Browser flags/redirects are not payment evidence. The payment verifier and order
repository are required dependencies and have **not been supplied**.

The repository adapter must implement:

- `getOrder(id)`: immutable server-side priced order, address, shipping method and
  Printful sync variant IDs; no browser-supplied prices or payment state.
- `claimDraft({orderId,externalId,payloadHash,paymentReference})`: atomic insert
  with unique constraints on order ID, external ID and payment reference. Return
  `{externalId,payloadHash,paymentReference,state,acquired}`. Exactly one caller
  gets `acquired:true`, state `reserved`; repeats get false. A different hash or
  payment reference is a conflict. Reservations survive process failure.
- `markDraftCreated(...)`: conditional durable update tied to the same reservation
  and payload hash. Never replace another Printful ID.
- `recordDraftFailure(...)`: durable failure/dead-letter record, with bounded
  retries of safe reconciliation and administrative visibility. Never release a
  reservation after timeout merely because an order lookup is temporarily empty.

An ambiguous POST is reconciled using `GET /orders/@external_id`; it is never
blindly retried. A repeat invocation with an existing reservation can only read
and reconcile. A remote draft whose ID, contents, recipient, shipping method or
draft status do not match is rejected. Provider response normalization (including
address normalization) still requires live verification before use.

`webhooks.js` verifies v2 HMAC-SHA256 over original bytes, decodes the hexadecimal
secret key, matches the configured public key/store, and normalizes only supported
order/shipment events. v1's unsigned payload is not accepted. Keys must come from
the actual Printful-created configuration; registering webhooks can replace prior
settings and is not performed by these modules. Verify v1 order notifications
against the actual signed v2 subscription before relying on cross-version delivery.

The event reducer requires authenticated events and keeps order status, shipments
and refund state separate. Persist its result and a unique event-key insert in
one DB transaction. Older order updates cannot overwrite newer ones; timestamp
ties with conflicting values require provider reconciliation. Events do not
charge cards, confirm production, cancel orders or issue customer refunds.
Printful refunds to the merchant are not customer payment refunds.

`validation.js` performs integer money arithmetic with an explicit currency
exponent. It does not invent tax rates or decide merchant tax obligations.

All tests use isolated fake transports/repositories. Missing pieces include the
actual backend adapter, transaction/locking/dead-letter implementation, provider
payment verification, authoritative pricing/tax/address validation, authenticated
routes/abuse protection, real API/webhook tests, notifications and deployment.

Official contracts checked 2026-10-31:

- https://developers.printful.com/docs/ — auth, stores, shipping rates, draft
  creation, external IDs and sync variants.
- https://developers.printful.com/docs/v2-beta/ — signed webhook bytes, hex key,
  public-key header, order and shipment events. API v2 is beta.
