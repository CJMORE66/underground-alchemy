# Worker deployment and rollback record

Updated: 1 November 2026, Europe/Paris. **Native Worker publication/migration is
pending.** Public production is still saved static version 31 until an actual
successful deployment record is added below. No live checkout is claimed.

## Prepared release

- Preserve Site `appgprj_6ad19e715dcc819185592c61456c5182`, its URL
  https://caisik-underground-alchemy.caisik.chatgpt.site/ and public audience.
- Source manifest now omits `static` and declares `d1: COMMERCE_DB`.
  `server/worker.js` handles commerce APIs; non-API routes use ASSETS.
- `npm run build:commerce` uses Sites/Vite/Cloudflare integration. First prepared
  build passed: Worker entry 810.76 kB / 123.81 kB gzip; 680 frontend assets,
  188,107,785 bytes, preserved byte-for-byte in generated client output.
  Dependency remediation/final rebuild is still pending.
- Schema-only chain: `drizzle/0000_commerce.sql` and
  `drizzle/0001_commerce_immutability.sql`. Native deployment must apply them to
  `COMMERCE_DB`. Repository readiness checks perform no request-time DDL.
- Masked Printful/session secrets exist at runtime revision 2. Runtime Stripe API
  key, actual snapshot signing secret and approved merchant policy are absent.
  Release must keep payment unavailable while exposing only verified safe reads.
- No external hosting account/NAS recovery is a mandatory prerequisite for this
  supported native Worker/D1 path.

## Publication checks and pending evidence

Run commerce/provider/Worker/UI tests, shared atlas/languages, current release/
whitespace checks, dependency audit and final Worker build. Production graph has
zero known advisories. The 11 development findings (7 high/4 moderate) were
remediated through patched build dependencies; the new full graph audit exits0.
Managed Miniflare hung; that is unverified, not a successful native smoke test.

Use existing Sites source packaging/save/deploy workflow, preserving identity and
access. The exact validated source/Drizzle chain must accompany the archive.
GitHub PR #4 and Sites source are separate; merging/pushing alone is not deployment.

After native publication record:

- Source SHA / archive hash / saved version ID / deployment ID and terminal result.
- Native D1 migration/readiness result; no payment/customer records need creating
  to prove schema presence.
- Actual production catalog count, real price/availability/SKU alias presentation,
  product image loading and retained atlas/navigation/languages.
- Guest status/cookie and safe address-specific shipping estimate; payment must
  remain unavailable without runtime Stripe key/secret/policy.
- Worker logs and browser errors; explicit limits on any incomplete checks.

**Current values:** new saved version/deployment/migration/production smoke are
PENDING. Add exact returned IDs/results here after verification; do not invent a
version number or interpret the prepared build as deployment.

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
Final remote CI conclusion must be recorded separately from passing local tests.
