# Printful deployment and rollback

Updated: 2026-11-01 (Europe/Paris). Static release 31 remains deployed and
unchanged. Stripe/durable-backend source changes are not deployed; no live
checkout is claimed.

## 1 November backend release boundary

Stripe is confirmed. PR #4 receives official SDK 23.1.0/API
2026-10-28.endive test-only Checkout/Tax/payment verification, a real Node 24
SQLite repository/migration, raw snapshot Request handler and durable leased
payment worker. The 64 focused local tests pass with actual SQLite and fixture
providers. No Stripe/Printful credentials, actual merchant Tax settings or
durable Node host are configured. Public checkout remains disabled.

This is a backend-only source follow-up: no Site build/publication, runtime
secret change or production database migration occurs. Static Sites/Cloudflare
cannot execute `node:sqlite`. Follow `STRIPE_SETUP.md` to assemble/mount the
service on an authorized Node 24 host; recover the original NAS first if reusing
its deployment. Authenticated business routes and trusted merchant quote creation
remain required.

Before any backend launch: provision service-owned private durable directory
0700/umask 0077, protect DB/WAL/SHM and backups, run the checksum-checked migration
explicitly before serving, then mount raw `/api/stripe/webhook` and supervised
workers. Configure the actual account snapshot destination/version, real test
keys, verified Tax registrations/codes/countries and Printful token securely.
Test host restart, expired leases/fencing, dead letters and safe reconciliation.
No paid fulfillment confirmation method exists.

`commerce_orders.order_json` is immutable and contains address data; retention/
anonymization is not implemented. Resolve that production blocker before real
customer storage. Local migration tests are not production migration evidence.

For Node rollback, pause worker admission/processing, preserve private DB plus
WAL-consistent backups, and inspect pending/uncertain remote operations. Do not
downgrade/delete schema, reset single-POST gates or replay uncertain creates.
Migration 001's checksum is immutable; later changes need a reviewed migration/
restore strategy. Reverting static Sites does not roll back a separately hosted
database or provider side effect.

## Existing environment

- Site: `appgprj_6ad19e715dcc819185592c61456c5182`, public audience retained.
- URL: https://caisik-underground-alchemy.caisik.chatgpt.site/
- Application: maintained static HTML/CSS/ES modules in `dist/`.
- Original deployed source before this work: `bf4c1077f072847991c3d8eea0925b9ae5061e66`.
- Known previous saved version: 30,
  `appgprj_6ad19e715dcc819185592c61456c5182~appgver_62bc31d888ec8191ba0f40f6a072b35d`.
- GitHub `main`/PR #3 and Sites have separate source histories. A GitHub merge
  alone does not deploy this Site. Only reviewed bounded commerce changes are
  transferred; unrelated GitHub RPG200 work remains intact.

## Release content and checks

Publish the static SHOP/cart/navigation/language fixes with checkout disabled.
Preserve the original dated catalog; no actual Printful catalog has been read.
`server/commerce/` remains source-only outside the published static directory;
shipping/order/webhook helpers are not production endpoints.

Run `npm run test:commerce`, `npm test`, language tests, Python/JS syntax,
`npm run check:commerce-release` and `git diff --check`. No framework build or
database migration is needed for this static release. Do not introduce a dummy
backend or runtime credential merely to make a configuration check green.

Use the existing Sites source helper to push the exact validated state, package
it, save a version, and deploy through the public-Site workflow. Retain returned
commit/version/deployment IDs. Do not deploy an unvalidated tree or change access.
Production smoke checks must verify actual product images, variant/cart behavior,
language controls and disabled checkout. Check Worker logs where exposed; static
hosting has no commerce Worker whose successful operation could be inferred.

## Rollback

Deploy the exact saved version 30 above using `sites.deploy_site_version` with
the same project ID. It is already archive-backed. Confirm the deployment result.
This restores the previous static app without deleting browser notes or carts.
New cart data may remain harmlessly stored until a compatible version is used.
No database migration, live order, webhook registration or provider setting was
changed by this release, so there is no transactional commerce rollback.

For later backend work: append-only schema migrations, backup/restore, provider
job pausing and reconciliation must be designed for the actual database. Never
replay uncertain creates or reverse real payments as part of a static rollback.

## Current external blockers

Printful token/store verification, Node backend host/NAS access, actual Stripe
test key/snapshot endpoint secret, merchant price/Tax policy, business auth/routes,
PII retention and actual signed delivery are missing. Durable persistence is
implemented/tested locally, but is not mounted in production. Checkout/order
creation, shipping, customer tax and notifications remain unavailable publicly.
See PRINTFUL_SETUP.md and STRIPE_SETUP.md.

## Release record

Final validated source, saved version, deployment result and production smoke
evidence are appended after publication. Any failure remains explicitly reported.

### Completed publication

- Published saved version **31**, `appgprj_6ad19e715dcc819185592c61456c5182~appgver_c70a82f405a48191a09d087d4b2aa4e3`.
- Deployed source `3fb9f74a210b6b1176c3f1363035d8b9c4054483`; archive SHA256 `027f75d4ab8ccb119b1778d77a4c235dbf5e88a77ae3e195da8deb4810dc8f5a`.
- Deployment `appgdep_6ae64db70f608191b2a918ad6e45be2e`: **succeeded**, 2026-10-31 21:21 Europe/Paris; public audience retained; runtime env revision 0.
- Production https://caisik-underground-alchemy.caisik.chatgpt.site/shop/ rendered 20 snapshot products, exact OMERTA Black/2XL SKU and dated €56.50, saved local cart through reload, quantity and remove actions. Test cart returned to empty. Checkout stayed disabled; no paid request/order was sent.
- Error-only Sites Worker log query (previous10minutes, limit25) returned zero events. This static result does not demonstrate a running commerce Worker. Captured browser errors were extension metadata errors; filtered Site-origin error logs returned none.
- Subsequent documentation-only commits record this outcome; they do not change the deployed static artifact. No database migration or runtime/provider configuration was applied.

GitHub review: https://github.com/CJMORE66/underground-alchemy/pull/4
The four review commits are listed in PRINTFUL_PROGRESS.md. Existing PR3 remains
open/unmerged. The new PR is mergeable; no merge or new paid backend deployment
was performed.

