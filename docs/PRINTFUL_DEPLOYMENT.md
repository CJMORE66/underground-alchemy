# Printful deployment and rollback

Date: 2026-10-31 (Europe/Paris). Static release 31 deployed successfully; no live checkout claimed.

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

Printful token/store verification, existing backend/NAS access, payment sandbox,
merchant price/tax rules, durable persistence and signed webhook configuration
are missing. Checkout, order creation/confirmation, shipping, tax and customer
notifications therefore remain unavailable. See PRINTFUL_SETUP.md.

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
