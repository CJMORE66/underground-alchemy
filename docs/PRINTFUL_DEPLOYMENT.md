# Worker deployment and rollback record

## Native archive size correction

The first Worker save was rejected before creating a version: the default
packager copied both maintained `dist/` assets and generated `dist/client/`,
exceeding the native 256 MiB archive limit. No deployment occurred from that
attempt. The build continues to preserve all maintained frontend files.

After building, invoke the official Sites packager through the output-only
staging helper (absolute helper/archive paths required):

```sh
node scripts/package-commerce-worker.mjs /absolute/sites/scripts/package-site.mjs /absolute/outside-checkout/release.tar.gz
```

The helper stages only `dist/client`, `dist/server`, `dist/.openai`, the hosting
manifest and native Drizzle migrations. SHA256 checks verify staged output
bytes. The resulting test archive was 179,682,380 bytes, under 256 MiB. The source
checkout and served asset bytes are preserved; source must still be committed
and pushed through the native Site source workflow before saving this archive.

Updated: 1 November 2026, Europe/Paris. **Worker versions 32–34 and initial D1
schema are deployed; production catalog remains broken.** Native status is HTTP
200, while v34 transport fails from wrong native Fetch receiver binding and
Cloudflare-unsupported redirect:error. Both repairs/tests are ready; new release/
full production smoke are pending. No live checkout is claimed.

## Observed native versions and current failure

| Version | Source | Actual result |
| --- | --- | --- |
| 32 | `467723d` | Native Worker/ASSETS/D1 architecture published |
| 33 | `c8ec0ef` | Safe diagnostics published; native cache.match failure confirmed in logs (frame 23440) |
| 34 | `3ee4110` | Optional/safe cache handling published; actual catalog returns Printful TRANSPORT_ERROR |

COMMERCE_DB has seven actual tables. `/api/commerce/status` returned HTTP 200:
`mode:test`, `catalogAvailable:true`, `shippingAvailable:true`,
`checkoutAvailable:false`. These are configuration/schema readiness flags, not a
provider health probe. Node LivePrintfulCatalog real reads return 20/86; actual
local workerd synthetic runs also work. Wrong native Fetch receiver and unsupported
`redirect:'error'` are confirmed causes. Both fixes/tests are ready: correct native
binding and `redirect:'manual'` with explicit redirect rejection. They are not yet
production-deployed/verified.

Runtime revision 4 includes the masked actual Stripe webhook secret and explicit
September snapshot version. Real endpoint is registered/enabled in test mode. Only
runtime Stripe test API key and approved merchant policy remain owner inputs.
Initial schema/deployment are not pending anymore. A further fulfillment
catalog-cache and fulfillment projection migrations/tables and their tested
deployments are pending; do not infer their presence from the seven-table schema.

## Prepared release

- Preserve Site `appgprj_6ad19e715dcc819185592c61456c5182`, its URL
  https://caisik-underground-alchemy.caisik.chatgpt.site/ and public audience.
- Source manifest now omits `static` and declares `d1: COMMERCE_DB`.
  `server/worker.js` handles commerce APIs; non-API routes use ASSETS.
- `npm run build:commerce` uses Sites/Vite/Cloudflare integration. First prepared
  build passed: Worker entry 810.76 kB / 123.81 kB gzip; 680 frontend assets,
  188,107,785 bytes, preserved byte-for-byte in generated client output.
  Dependency remediation and later native builds completed; final receiver/
  fulfillment-projection repair rebuild is still pending.
- Schema-only chain: `drizzle/0000_commerce.sql` and
  `drizzle/0001_commerce_immutability.sql`. Native deployment must apply them to
  `COMMERCE_DB`; the initial seven-table native schema is verified. Repository
  readiness checks perform no request-time DDL. Further projection schema changes
  need their own reviewed migration and actual readiness proof.
- Masked Printful/session/webhook secrets exist at runtime revision 4. Runtime
  Stripe API key and approved merchant policy are absent.
  Release must keep payment unavailable while exposing only verified safe reads.
- No external hosting account/NAS recovery is a mandatory prerequisite for this
  supported native Worker/D1 path.

## Publication checks and pending evidence

Run commerce/provider/Worker/UI tests, shared atlas/languages, current release/
whitespace checks, dependency audit and final Worker build. Production graph has
zero known advisories. The 11 development findings (7 high/4 moderate) were
remediated through patched build dependencies; the new full graph audit exits0.
The initial managed Miniflare attempt hung. Later actual local workerd runs
succeeded with synthetic provider responses; initial native D1/status are
verified separately. None proves the still-failing actual catalog transport.

Use existing Sites source packaging/save/deploy workflow, preserving identity and
access. The exact validated source/Drizzle chain must accompany the archive.
GitHub PR #4 and Sites source are separate; merging/pushing alone is not deployment.

After the pending receiver/projection repair publication record:

- Source SHA / archive hash / saved version ID / deployment ID and terminal result.
- Native D1 migration/readiness result; no payment/customer records need creating
  to prove schema presence.
- Actual production catalog count, real price/availability/SKU alias presentation,
  product image loading and retained atlas/navigation/languages.
- Guest status/cookie and safe address-specific shipping estimate; payment must
  remain unavailable without runtime Stripe key/secret/policy.
- Worker logs and browser errors; explicit limits on any incomplete checks.

**Next release fields:** append exact saved/deployment IDs, repaired Fetch smoke,
new projection migration result and current errors after verification. Versions
32–34 above are deployed, but full provider/checkout acceptance is not passed.

## Rollback target: verified static version 31

- Saved version: `appgprj_6ad19e715dcc819185592c61456c5182~appgver_c70a82f405a48191a09d087d4b2aa4e3`.
- Source: `3fb9f74a210b6b1176c3f1363035d8b9c4054483`.
- Archive SHA256: `027f75d4ab8ccb119b1778d77a4c235dbf5e88a77ae3e195da8deb4810dc8f5a`.
- Prior deployment: `appgdep_6ae64db70f608191b2a918ad6e45be2e`, succeeded
  31 October 2026, 21:21 Europe/Paris.

Redeploy that exact archive-backed saved version through the native Site tool and
verify its result. It restores the previous frontend/cart and disabled checkout;
never delete browser notes/carts or D1 tables as a rollback step. Preserve runtime
secrets and D1 resource/data. Pause/reconcile any pending provider work before a
future backend rollback. Never downgrade/drop schema, reset uncertain single-POST
gates, replay creates or reverse payments as part of static rollback.

The current Drizzle migrations only create schema/constraints/triggers; no
actual payment/order has been submitted. If a migration fails, inspect the exact
native failure and readiness state instead of manually marking migrations done.
Order JSON is immutable and includes address data; a reviewed retention/
anonymization migration/lifecycle is still required before production customers.

## Dated source/review context

Version 31 was a static SHOP/cart/navigation/language release, with no commerce
backend migration/provider mutation. Its production smoke passed for those
boundaries only. Prior version 30 remains historical fallback, but version 31 is
the immediate known-good rollback for this Worker change.
GitHub review: https://github.com/CJMORE66/underground-alchemy/pull/4 .
PR #4 head `ceac189` passed CI #10. Later repair commits/CI results and final
production proof must be recorded separately; do not carry that pass forward.
