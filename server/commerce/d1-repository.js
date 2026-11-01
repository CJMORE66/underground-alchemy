import { CommerceError, boundedText, currencyCode, fulfillmentItems, shippingRecipient } from './validation.js';

export const D1_SCHEMA_VERSION = 1;
export const D1_SCHEMA_CONTRACT = 'ua-commerce-d1-v1';
const MAX_ATTEMPTS = 5;
const safeId = (value, maximum = 200) => { const checked = boundedText(value, maximum); if (checked !== value) throw new CommerceError('INVALID_REPOSITORY_IDENTIFIER'); return checked; };
const safeHash = value => { if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new CommerceError('INVALID_REPOSITORY_HASH'); return value; };
const milliseconds = value => { if (!Number.isSafeInteger(value) || value < 0) throw new CommerceError('INVALID_REPOSITORY_TIME'); return value; };
const failureCode = value => { if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]{0,99}$/.test(value)) throw new CommerceError('INVALID_FAILURE_CODE'); return value; };
const sha = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
const canonical = value => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  throw new CommerceError('INVALID_ORDER_RECORD');
};
const draftRecord = row => row ? { orderId: row.order_id, externalId: row.external_id, payloadHash: row.payload_hash, paymentReference: row.payment_reference, state: row.state, attempted: row.attempted === 1, printfulId: row.printful_id, failureCode: row.failure_code, failureCount: row.failure_count, createdAt: row.created_at_ms, updatedAt: row.updated_at_ms } : null;
const jobRecord = row => row ? { id: row.id, jobId: row.id, eventId: row.event_id, sessionId: row.session_id, type: row.type, created: row.provider_created, state: row.state, attempts: row.attempts, availableAt: row.available_at_ms, workerId: row.worker_id, leaseToken: row.lease_token, leaseExpiresAt: row.lease_expires_at_ms, lastErrorCode: row.last_error_code, completedAt: row.completed_at_ms } : null;
const hydratedOrder = row => row ? { ...JSON.parse(row.order_json), stripeCheckoutSessionId: row.session_id ?? null } : null;
const ORDER_SELECT = 'SELECT o.*, s.session_id FROM commerce_d1_orders o LEFT JOIN commerce_d1_sessions s ON s.scope = o.scope AND s.order_id = o.id WHERE o.scope = ? AND o.id = ?';
const JOB_SELECT = 'SELECT j.*, e.session_id, e.type, e.provider_created FROM commerce_d1_jobs j JOIN commerce_d1_events e ON e.scope = j.scope AND e.event_id = j.event_id WHERE j.scope = ? AND j.id = ?';
const READINESS_OBJECTS = Object.freeze([
  ['commerce_d1_schema', 'table'], ['commerce_d1_orders', 'table'], ['commerce_d1_sessions', 'table'],
  ['commerce_d1_drafts', 'table'], ['commerce_d1_events', 'table'], ['commerce_d1_jobs', 'table'],
  ['commerce_d1_limits', 'table'], ['commerce_d1_jobs_available', 'index'],
  ['commerce_d1_orders_immutable_update', 'trigger'], ['commerce_d1_orders_immutable_delete', 'trigger']
]);

function scopeKey(scope) {
  if (!scope || typeof scope.stripeAccountId !== 'string' || !/^acct_[A-Za-z0-9]{4,120}$/.test(scope.stripeAccountId) || !['test', 'live'].includes(scope.mode) || !Number.isSafeInteger(scope.printfulStoreId) || scope.printfulStoreId <= 0) throw new CommerceError('COMMERCE_SCOPE_REQUIRED');
  return `${scope.stripeAccountId}:${scope.mode}:${scope.printfulStoreId}`;
}

/* Worker-compatible D1 adapter. All methods are async; SQL migrations are applied
 * by deployment. migrate() only checks the installed schema, never performs DDL.
 * D1.batch supplies the transaction boundary; claims are conditional SQL writes,
 * never read/modify/write loops across separate network calls. Account/mode/store
 * scope is mandatory and appears in every business key, join, update and query.
 */
export class D1CommerceRepository {
  #db; #scope; #clock; #uuid; #ready = false;
  constructor({ db, scope, clock = Date.now, uuid = () => crypto.randomUUID() } = {}) {
    if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function' || typeof clock !== 'function' || typeof uuid !== 'function') throw new CommerceError('D1_BINDING_REQUIRED');
    this.#db = db; this.#scope = scopeKey(scope); this.#clock = clock; this.#uuid = uuid;
  }
  #now() { return milliseconds(this.#clock()); }
  #requireReady() { if (!this.#ready) throw new CommerceError('REPOSITORY_MIGRATION_REQUIRED'); }
  #session() { return typeof this.#db.withSession === 'function' ? this.#db.withSession('first-primary') : this.#db; }
  #safeError(error) {
    if (error instanceof CommerceError) return error;
    // Inspect classification only; never emit the SQL/error body or bound data.
    const description = typeof error?.message === 'string' ? error.message : '';
    if (/SQLITE_(BUSY|LOCKED)|database is locked/i.test(description)) return new CommerceError('REPOSITORY_BUSY', { retryable: true });
    if (/constraint failed|SQLITE_CONSTRAINT|commerce order is immutable/i.test(description)) return new CommerceError('REPOSITORY_WRITE_CONFLICT');
    return new CommerceError('REPOSITORY_UNAVAILABLE', { retryable: true });
  }
  async #first(sql, ...bindings) {
    try { return await this.#session().prepare(sql).bind(...bindings).first(); }
    catch (error) { throw this.#safeError(error); }
  }
  async #batch(statements) {
    try {
      const db = this.#session();
      const result = await db.batch(statements.map(([sql, ...bindings]) => db.prepare(sql).bind(...bindings)));
      if (!Array.isArray(result) || result.length !== statements.length || result.some(item => item?.success !== true || !Array.isArray(item.results))) throw new CommerceError('REPOSITORY_INVALID_RESPONSE', { retryable: true });
      return result;
    } catch (error) { throw this.#safeError(error); }
  }
  async migrate() {
    this.#ready = false;
    let results;
    try { results = await this.#batch([['SELECT name, type, sql FROM sqlite_master WHERE name IN (' + READINESS_OBJECTS.map(() => '?').join(',') + ')', ...READINESS_OBJECTS.map(([name]) => name)]]); }
    catch { throw new CommerceError('REPOSITORY_MIGRATION_REQUIRED'); }
    const objects = results[0].results;
    if (!objects.length) throw new CommerceError('REPOSITORY_MIGRATION_REQUIRED');
    const marker = objects.find(row => row.name === 'commerce_d1_schema')?.sql || '';
    const normalizedMarker = marker.replace(/[`"\[\]]/g, '').replace(/\s+/g, ' ');
    if (objects.length !== READINESS_OBJECTS.length || READINESS_OBJECTS.some(([name, type]) => !objects.some(row => row.name === name && row.type === type)) || !marker.includes(D1_SCHEMA_CONTRACT) || !/\bversion\b[^,)]*\bdefault\s+1\b/i.test(normalizedMarker)) throw new CommerceError('REPOSITORY_MIGRATION_MISMATCH');
    this.#ready = true;
    return { version: D1_SCHEMA_VERSION };
  }
  close() { this.#ready = false; } // D1 bindings have no per-repository connection to close.

  async createOrder(order) {
    this.#requireReady();
    if (!order || typeof order !== 'object' || Array.isArray(order)) throw new CommerceError('INVALID_ORDER_RECORD');
    if (Object.hasOwn(order, 'stripeCheckoutSessionId')) throw new CommerceError('STRIPE_SESSION_BINDING_CONFLICT');
    safeId(order.id, 120); safeHash(order.quoteHash); currencyCode(order.currency);
    if (!Number.isSafeInteger(order.totalMinor) || order.totalMinor <= 0) throw new CommerceError('INVALID_ORDER_RECORD');
    shippingRecipient(order.recipient, { order: true }); fulfillmentItems(order.items); safeId(order.shippingId, 100);
    const body = JSON.stringify(canonical(order));
    if (new TextEncoder().encode(body).byteLength > 128 * 1024) throw new CommerceError('ORDER_RECORD_TOO_LARGE');
    const orderHash = await sha(body);
    const result = await this.#batch([
      ['INSERT INTO commerce_d1_orders(scope, id, quote_hash, order_hash, order_json, total_minor, currency, created_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', this.#scope, order.id, order.quoteHash, orderHash, body, order.totalMinor, order.currency, this.#now()],
      [ORDER_SELECT, this.#scope, order.id]
    ]);
    const row = result[1].results[0];
    if (!row || row.order_hash !== orderHash) throw new CommerceError('IMMUTABLE_ORDER_CONFLICT');
    return hydratedOrder(row);
  }
  async getOrder(id) {
    this.#requireReady(); safeId(id, 120);
    return hydratedOrder(await this.#first(ORDER_SELECT, this.#scope, id));
  }
  async bindStripeSession({ orderId, quoteHash, sessionId }) {
    this.#requireReady(); safeId(orderId, 120); safeHash(quoteHash); safeId(sessionId);
    const result = await this.#batch([
      ['INSERT INTO commerce_d1_sessions(scope, session_id, order_id, quote_hash, bound_at_ms) SELECT scope, ?, id, quote_hash, ? FROM commerce_d1_orders WHERE scope = ? AND id = ? AND quote_hash = ? ON CONFLICT DO NOTHING', sessionId, this.#now(), this.#scope, orderId, quoteHash],
      ['SELECT s.* FROM commerce_d1_sessions s WHERE s.scope = ? AND (s.order_id = ? OR s.session_id = ?)', this.#scope, orderId, sessionId],
      [ORDER_SELECT, this.#scope, orderId]
    ]);
    const rows = result[1].results, order = result[2].results[0];
    if (!order || order.quote_hash !== quoteHash || rows.length !== 1 || rows[0].order_id !== orderId || rows[0].session_id !== sessionId || rows[0].quote_hash !== quoteHash) throw new CommerceError('STRIPE_SESSION_BINDING_CONFLICT');
    return hydratedOrder(order);
  }
  async getOrderByStripeSession(sessionId) {
    this.#requireReady(); safeId(sessionId);
    return hydratedOrder(await this.#first('SELECT o.*, s.session_id FROM commerce_d1_orders o JOIN commerce_d1_sessions s ON s.scope = o.scope AND s.order_id = o.id WHERE s.scope = ? AND s.session_id = ?', this.#scope, sessionId));
  }
  async getDraft(orderId) {
    this.#requireReady(); safeId(orderId, 120);
    return draftRecord(await this.#first('SELECT * FROM commerce_d1_drafts WHERE scope = ? AND order_id = ?', this.#scope, orderId));
  }
  async claimDraft({ orderId, externalId, payloadHash, paymentReference }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash); safeId(paymentReference);
    const now = this.#now();
    const result = await this.#batch([
      ["INSERT INTO commerce_d1_drafts(scope, order_id, external_id, payload_hash, payment_reference, state, created_at_ms, updated_at_ms) SELECT scope, id, ?, ?, ?, 'reserved', ?, ? FROM commerce_d1_orders WHERE scope = ? AND id = ? ON CONFLICT DO NOTHING", externalId, payloadHash, paymentReference, now, now, this.#scope, orderId],
      ['SELECT * FROM commerce_d1_drafts WHERE scope = ? AND order_id = ?', this.#scope, orderId]
    ]);
    const draft = draftRecord(result[1].results[0]);
    if (!draft || draft.externalId !== externalId || draft.payloadHash !== payloadHash || draft.paymentReference !== paymentReference) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
    return { ...draft, acquired: result[0].meta?.changes === 1 };
  }
  async beginDraftAttempt({ orderId, externalId, payloadHash }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash);
    const result = await this.#batch([
      ["UPDATE commerce_d1_drafts SET attempted = 1, state = 'reserved', updated_at_ms = ? WHERE scope = ? AND order_id = ? AND external_id = ? AND payload_hash = ? AND attempted = 0 AND state != 'created'", this.#now(), this.#scope, orderId, externalId, payloadHash],
      ['SELECT * FROM commerce_d1_drafts WHERE scope = ? AND order_id = ?', this.#scope, orderId]
    ]);
    const draft = draftRecord(result[1].results[0]);
    if (!draft || draft.externalId !== externalId || draft.payloadHash !== payloadHash) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
    return { ...draft, acquired: result[0].meta?.changes === 1 };
  }
  async markDraftCreated({ orderId, externalId, payloadHash, printfulId }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash);
    if (!Number.isSafeInteger(printfulId) || printfulId <= 0) throw new CommerceError('INVALID_PRINTFUL_ID');
    const result = await this.#batch([
      ["UPDATE commerce_d1_drafts SET state = 'created', attempted = 1, printful_id = ?, failure_code = NULL, updated_at_ms = ? WHERE scope = ? AND order_id = ? AND external_id = ? AND payload_hash = ? AND (printful_id IS NULL OR printful_id = ?)", printfulId, this.#now(), this.#scope, orderId, externalId, payloadHash, printfulId],
      ['SELECT * FROM commerce_d1_drafts WHERE scope = ? AND order_id = ?', this.#scope, orderId]
    ]);
    const draft = draftRecord(result[1].results[0]);
    if (!draft || draft.externalId !== externalId || draft.payloadHash !== payloadHash || draft.printfulId !== printfulId || draft.state !== 'created') throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
    return draft;
  }
  async recordDraftFailure({ orderId, externalId, code, ambiguous = false }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); failureCode(code);
    if (typeof ambiguous !== 'boolean') throw new CommerceError('INVALID_DRAFT_FAILURE');
    const result = await this.#batch([
      ["UPDATE commerce_d1_drafts SET state = CASE WHEN state = 'created' THEN 'created' WHEN ? = 1 OR state = 'uncertain' THEN 'uncertain' ELSE 'failed' END, failure_code = ?, failure_count = min(failure_count + 1, 10000), updated_at_ms = ? WHERE scope = ? AND order_id = ? AND external_id = ?", ambiguous ? 1 : 0, code, this.#now(), this.#scope, orderId, externalId],
      ['SELECT * FROM commerce_d1_drafts WHERE scope = ? AND order_id = ?', this.#scope, orderId]
    ]);
    const draft = draftRecord(result[1].results[0]);
    if (!draft || draft.externalId !== externalId) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
    return draft;
  }
  async enqueuePaymentEvent({ eventId, sessionId, type, created }) {
    this.#requireReady(); safeId(eventId); safeId(sessionId); safeId(type, 120); milliseconds(created);
    const id = 'stripe_' + await sha(eventId), now = this.#now();
    const result = await this.#batch([
      ['INSERT INTO commerce_d1_events(scope, event_id, session_id, type, provider_created, received_at_ms) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', this.#scope, eventId, sessionId, type, created, now],
      ["INSERT INTO commerce_d1_jobs(scope, id, event_id, state, available_at_ms, created_at_ms, updated_at_ms) SELECT scope, ?, event_id, 'pending', ?, ?, ? FROM commerce_d1_events WHERE scope = ? AND event_id = ? AND session_id = ? AND type = ? AND provider_created = ? ON CONFLICT DO NOTHING", id, now, now, now, this.#scope, eventId, sessionId, type, created],
      ['SELECT * FROM commerce_d1_events WHERE scope = ? AND event_id = ?', this.#scope, eventId],
      [JOB_SELECT, this.#scope, id]
    ]);
    const event = result[2].results[0], job = jobRecord(result[3].results[0]);
    if (!event || event.session_id !== sessionId || event.type !== type || event.provider_created !== created || !job) throw new CommerceError('PAYMENT_EVENT_CONFLICT');
    return { ...job, duplicate: result[0].meta?.changes !== 1 };
  }
  async getPaymentJob(jobId) {
    this.#requireReady(); safeId(jobId, 100);
    return jobRecord(await this.#first(JOB_SELECT, this.#scope, jobId));
  }
  async claimPaymentJob({ workerId, nowMs, leaseMs }) {
    this.#requireReady(); safeId(workerId); milliseconds(nowMs);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 15 * 60 * 1000 || !Number.isSafeInteger(nowMs + leaseMs)) throw new CommerceError('INVALID_JOB_LEASE');
    const leaseToken = safeId(this.#uuid());
    const result = await this.#batch([
      ["UPDATE commerce_d1_jobs SET state = 'dead_letter', worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, last_error_code = 'LEASE_ATTEMPTS_EXHAUSTED', updated_at_ms = ? WHERE scope = ? AND state = 'processing' AND lease_expires_at_ms <= ? AND attempts >= ?", nowMs, this.#scope, nowMs, MAX_ATTEMPTS],
      ["UPDATE commerce_d1_jobs SET state = 'processing', attempts = attempts + 1, worker_id = ?, lease_token = ?, lease_expires_at_ms = ?, updated_at_ms = ? WHERE scope = ? AND id = (SELECT id FROM commerce_d1_jobs WHERE scope = ? AND attempts < ? AND ((state = 'pending' AND available_at_ms <= ?) OR (state = 'processing' AND lease_expires_at_ms <= ?)) ORDER BY available_at_ms, created_at_ms, id LIMIT 1)", workerId, leaseToken, nowMs + leaseMs, nowMs, this.#scope, this.#scope, MAX_ATTEMPTS, nowMs, nowMs],
      ['SELECT j.*, e.session_id, e.type, e.provider_created FROM commerce_d1_jobs j JOIN commerce_d1_events e ON e.scope = j.scope AND e.event_id = j.event_id WHERE j.scope = ? AND j.lease_token = ? AND j.state = ?', this.#scope, leaseToken, 'processing']
    ]);
    if (result[1].meta?.changes !== 1) return null;
    const claimed = jobRecord(result[2].results[0]);
    if (!claimed || claimed.workerId !== workerId || claimed.leaseToken !== leaseToken || claimed.leaseExpiresAt !== nowMs + leaseMs) throw new CommerceError('PAYMENT_JOB_LEASE_CONFLICT');
    return claimed;
  }
  async completePaymentJob({ jobId, workerId, leaseToken }) {
    this.#requireReady(); safeId(jobId, 100); safeId(workerId); safeId(leaseToken);
    const now = this.#now();
    const result = await this.#batch([
      ["UPDATE commerce_d1_jobs SET state = 'completed', worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, completed_at_ms = ?, updated_at_ms = ? WHERE scope = ? AND id = ? AND state = 'processing' AND worker_id = ? AND lease_token = ? AND lease_expires_at_ms > ?", now, now, this.#scope, jobId, workerId, leaseToken, now],
      [JOB_SELECT, this.#scope, jobId]
    ]);
    if (result[0].meta?.changes !== 1) throw new CommerceError('PAYMENT_JOB_LEASE_CONFLICT');
    return jobRecord(result[1].results[0]);
  }
  async failPaymentJob({ jobId, workerId, leaseToken, code, retryable, nowMs }) {
    this.#requireReady(); safeId(jobId, 100); safeId(workerId); safeId(leaseToken); failureCode(code); milliseconds(nowMs);
    if (typeof retryable !== 'boolean' || !Number.isSafeInteger(nowMs + 60000)) throw new CommerceError('INVALID_JOB_FAILURE');
    const result = await this.#batch([
      ["UPDATE commerce_d1_jobs SET state = CASE WHEN ? = 1 AND attempts < ? THEN 'pending' ELSE 'dead_letter' END, available_at_ms = ? + min(60000, 1000 * (1 << (attempts - 1))), worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, last_error_code = ?, updated_at_ms = ? WHERE scope = ? AND id = ? AND state = 'processing' AND worker_id = ? AND lease_token = ? AND lease_expires_at_ms > ?", retryable ? 1 : 0, MAX_ATTEMPTS, nowMs, code, nowMs, this.#scope, jobId, workerId, leaseToken, nowMs],
      [JOB_SELECT, this.#scope, jobId]
    ]);
    if (result[0].meta?.changes !== 1) throw new CommerceError('PAYMENT_JOB_LEASE_CONFLICT');
    return jobRecord(result[1].results[0]);
  }
  async consumeRateLimit({ key, limit, windowMs, nowMs }) {
    this.#requireReady(); safeId(key, 200); milliseconds(nowMs);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000 || !Number.isSafeInteger(windowMs) || windowMs < 1 || windowMs > 86400000 || !Number.isSafeInteger(nowMs + windowMs)) throw new CommerceError('INVALID_RATE_LIMIT');
    const windowStart = Math.floor(nowMs / windowMs) * windowMs;
    const result = await this.#batch([
      ['INSERT INTO commerce_d1_limits(scope, key, window_start, count) VALUES (?, ?, ?, 1) ON CONFLICT(scope, key) DO UPDATE SET count = CASE WHEN excluded.window_start > window_start THEN 1 WHEN excluded.window_start = window_start THEN min(count + 1, ?) ELSE count END, window_start = max(window_start, excluded.window_start)', this.#scope, key, windowStart, limit + 1],
      ['SELECT window_start, count FROM commerce_d1_limits WHERE scope = ? AND key = ?', this.#scope, key]
    ]);
    const row = result[1].results[0];
    if (!row || !Number.isSafeInteger(row.window_start) || !Number.isSafeInteger(row.count) || row.count < 1) throw new CommerceError('REPOSITORY_INVALID_RESPONSE', { retryable: true });
    const allowed = row.window_start === windowStart && row.count <= limit;
    return { allowed, remaining: allowed ? Math.max(0, limit - row.count) : 0, retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((row.window_start + windowMs - nowMs) / 1000)) };
  }
}
