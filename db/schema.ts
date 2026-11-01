import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// Schema-only readiness marker: deliberately no inserted rows or data migration.
export const commerceSchema = sqliteTable('commerce_d1_schema', {
  version: integer('version').notNull().default(1).primaryKey(),
  contract: text('contract').notNull().default('ua-commerce-d1-v1')
}, table => [check('commerce_d1_schema_version_check', sql`${table.version} = 1`), check('commerce_d1_schema_contract_check', sql`${table.contract} = 'ua-commerce-d1-v1'`)]);

export const commerceOrders = sqliteTable('commerce_d1_orders', {
  scope: text('scope').notNull(), id: text('id').notNull(), quoteHash: text('quote_hash').notNull(),
  orderHash: text('order_hash').notNull(), orderJson: text('order_json').notNull(),
  totalMinor: integer('total_minor').notNull(), currency: text('currency').notNull(),
  createdAt: integer('created_at_ms').notNull()
}, table => [
  primaryKey({ columns: [table.scope, table.id] }),
  check('commerce_d1_order_scope_check', sql`length(${table.scope}) BETWEEN 1 AND 180`),
  check('commerce_d1_order_json_check', sql`json_valid(${table.orderJson})`),
  check('commerce_d1_order_total_check', sql`${table.totalMinor} > 0`),
  check('commerce_d1_order_currency_check', sql`length(${table.currency}) = 3`)
]);

export const commerceSessions = sqliteTable('commerce_d1_sessions', {
  scope: text('scope').notNull(), sessionId: text('session_id').notNull(), orderId: text('order_id').notNull(),
  quoteHash: text('quote_hash').notNull(), boundAt: integer('bound_at_ms').notNull()
}, table => [primaryKey({ columns: [table.scope, table.sessionId] }), unique('commerce_d1_session_order_unique').on(table.scope, table.orderId), foreignKey({ columns: [table.scope, table.orderId], foreignColumns: [commerceOrders.scope, commerceOrders.id] })]);

export const commerceDrafts = sqliteTable('commerce_d1_drafts', {
  scope: text('scope').notNull(), orderId: text('order_id').notNull(), externalId: text('external_id').notNull(),
  payloadHash: text('payload_hash').notNull(), paymentReference: text('payment_reference').notNull(),
  state: text('state').notNull(), attempted: integer('attempted').notNull().default(0), printfulId: integer('printful_id'),
  failureCode: text('failure_code'), failureCount: integer('failure_count').notNull().default(0),
  createdAt: integer('created_at_ms').notNull(), updatedAt: integer('updated_at_ms').notNull()
}, table => [
  primaryKey({ columns: [table.scope, table.orderId] }),
  unique('commerce_d1_draft_external_unique').on(table.scope, table.externalId),
  unique('commerce_d1_draft_payload_unique').on(table.scope, table.payloadHash),
  unique('commerce_d1_draft_payment_unique').on(table.scope, table.paymentReference),
  unique('commerce_d1_draft_printful_unique').on(table.scope, table.printfulId),
  foreignKey({ columns: [table.scope, table.orderId], foreignColumns: [commerceOrders.scope, commerceOrders.id] }),
  check('commerce_d1_draft_state_check', sql`${table.state} IN ('reserved', 'created', 'uncertain', 'failed')`),
  check('commerce_d1_draft_attempted_check', sql`${table.attempted} IN (0, 1)`),
  check('commerce_d1_draft_printful_check', sql`${table.printfulId} IS NULL OR ${table.printfulId} > 0`),
  check('commerce_d1_draft_failures_check', sql`${table.failureCount} BETWEEN 0 AND 10000`)
]);

export const commerceEvents = sqliteTable('commerce_d1_events', {
  scope: text('scope').notNull(), eventId: text('event_id').notNull(), sessionId: text('session_id').notNull(),
  type: text('type').notNull(), providerCreated: integer('provider_created').notNull(), receivedAt: integer('received_at_ms').notNull()
}, table => [primaryKey({ columns: [table.scope, table.eventId] }), check('commerce_d1_event_created_check', sql`${table.providerCreated} >= 0`)]);

export const commerceJobs = sqliteTable('commerce_d1_jobs', {
  scope: text('scope').notNull(), id: text('id').notNull(), eventId: text('event_id').notNull(), state: text('state').notNull(),
  attempts: integer('attempts').notNull().default(0), availableAt: integer('available_at_ms').notNull(), workerId: text('worker_id'),
  leaseToken: text('lease_token'), leaseExpiresAt: integer('lease_expires_at_ms'), lastErrorCode: text('last_error_code'),
  completedAt: integer('completed_at_ms'), createdAt: integer('created_at_ms').notNull(), updatedAt: integer('updated_at_ms').notNull()
}, table => [
  primaryKey({ columns: [table.scope, table.id] }), unique('commerce_d1_job_event_unique').on(table.scope, table.eventId),
  unique('commerce_d1_job_lease_unique').on(table.scope, table.leaseToken),
  foreignKey({ columns: [table.scope, table.eventId], foreignColumns: [commerceEvents.scope, commerceEvents.eventId] }),
  index('commerce_d1_jobs_available').on(table.scope, table.state, table.availableAt, table.createdAt),
  check('commerce_d1_job_state_check', sql`${table.state} IN ('pending', 'processing', 'completed', 'dead_letter')`),
  check('commerce_d1_job_attempts_check', sql`${table.attempts} BETWEEN 0 AND 5`),
  check('commerce_d1_job_lease_check', sql`(${table.state} = 'processing' AND ${table.workerId} IS NOT NULL AND ${table.leaseToken} IS NOT NULL AND ${table.leaseExpiresAt} IS NOT NULL) OR (${table.state} != 'processing' AND ${table.workerId} IS NULL AND ${table.leaseToken} IS NULL AND ${table.leaseExpiresAt} IS NULL)`)
]);

export const commerceLimits = sqliteTable('commerce_d1_limits', {
  scope: text('scope').notNull(), key: text('key').notNull(), windowStart: integer('window_start').notNull(), count: integer('count').notNull()
}, table => [primaryKey({ columns: [table.scope, table.key] }), check('commerce_d1_limit_window_check', sql`${table.windowStart} >= 0`), check('commerce_d1_limit_count_check', sql`${table.count} BETWEEN 1 AND 10001`)]);

// Read-only provider observations, separate from immutable prices/payment/order records.
export const commerceFulfillment = sqliteTable('commerce_d1_fulfillment', {
  scope: text('scope').notNull(), orderId: text('order_id').notNull(), printfulId: integer('printful_id').notNull(),
  externalId: text('external_id').notNull(), providerUpdatedAt: integer('provider_updated_at').notNull(),
  projectionHash: text('projection_hash').notNull(), projectionJson: text('projection_json').notNull(), observedAt: integer('observed_at_ms').notNull()
}, table => [
  primaryKey({ columns: [table.scope, table.orderId] }),
  unique('commerce_d1_fulfillment_printful_unique').on(table.scope, table.printfulId),
  unique('commerce_d1_fulfillment_external_unique').on(table.scope, table.externalId),
  foreignKey({ columns: [table.scope, table.orderId], foreignColumns: [commerceDrafts.scope, commerceDrafts.orderId] }),
  check('commerce_d1_fulfillment_printful_check', sql`${table.printfulId} > 0`),
  check('commerce_d1_fulfillment_version_check', sql`${table.providerUpdatedAt} >= 0`),
  check('commerce_d1_fulfillment_hash_check', sql`length(${table.projectionHash}) = 64`),
  check('commerce_d1_fulfillment_json_check', sql`json_valid(${table.projectionJson})`),
  check('commerce_d1_fulfillment_observed_check', sql`${table.observedAt} >= 0`)
]);

// Public catalog only. No credentials or customer/order records belong in this cache.
export const commercePublicCatalogCache = sqliteTable('commerce_d1_public_catalog_cache', {
  storeId: integer('store_id').primaryKey(), payloadJson: text('payload_json'),
  verifiedAt: integer('verified_at_ms').notNull().default(0), expiresAt: integer('expires_at_ms').notNull().default(0),
  leaseToken: text('lease_token'), leaseExpiresAt: integer('lease_expires_at_ms').notNull().default(0), updatedAt: integer('updated_at_ms').notNull().default(0)
}, table => [
  check('commerce_d1_catalog_store_check', sql`${table.storeId} > 0`),
  check('commerce_d1_catalog_json_check', sql`${table.payloadJson} IS NULL OR json_valid(${table.payloadJson})`),
  check('commerce_d1_catalog_time_check', sql`${table.verifiedAt} >= 0 AND ${table.expiresAt} >= 0 AND ${table.leaseExpiresAt} >= 0 AND ${table.updatedAt} >= 0`)
]);
