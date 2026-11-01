import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, closeSync, lstatSync, openSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { CommerceError, boundedText, currencyCode, fulfillmentItems, shippingRecipient } from './validation.js';

const migration = readFileSync(new URL('./migrations/001-commerce.sql', import.meta.url), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const MAX_ATTEMPTS = 5;
const safeId = (value, maximum = 200) => {
  const checked = boundedText(value, maximum);
  if (checked !== value) throw new CommerceError('INVALID_REPOSITORY_IDENTIFIER');
  return checked;
};
const safeHash = value => {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new CommerceError('INVALID_REPOSITORY_HASH');
  return value;
};
const milliseconds = value => {
  if (!Number.isSafeInteger(value) || value < 0) throw new CommerceError('INVALID_REPOSITORY_TIME');
  return value;
};
const failureCode = value => {
  if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]{0,99}$/.test(value)) throw new CommerceError('INVALID_FAILURE_CODE');
  return value;
};
const canonical = value => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  throw new CommerceError('INVALID_ORDER_RECORD');
};
const draftRecord = row => row ? {
  orderId: row.order_id, externalId: row.external_id, payloadHash: row.payload_hash,
  paymentReference: row.payment_reference, state: row.state, attempted: row.attempted === 1, printfulId: row.printful_id,
  failureCode: row.failure_code, failureCount: row.failure_count,
  createdAt: row.created_at_ms, updatedAt: row.updated_at_ms
} : null;
const jobRecord = row => row ? {
  id: row.id, jobId: row.id, eventId: row.event_id, sessionId: row.session_id,
  type: row.type, created: row.provider_created, state: row.state, attempts: row.attempts,
  availableAt: row.available_at_ms, workerId: row.worker_id, leaseToken: row.lease_token, leaseExpiresAt: row.lease_expires_at_ms,
  lastErrorCode: row.last_error_code, completedAt: row.completed_at_ms
} : null;

/* Durable Node service storage. Not supported in Cloudflare Workers or static Sites.
 * The caller supplies a private durable directory and invokes migrate() at startup.
 * No method logs SQL, addresses, payment payloads or provider credentials.
 */
export class SqliteCommerceRepository {
  #db; #ready = false; #clock;
  constructor({ filename, clock = Date.now } = {}) {
    if (typeof filename !== 'string' || !isAbsolute(filename) || typeof clock !== 'function') throw new CommerceError('PRIVATE_DATABASE_PATH_REQUIRED');
    try {
      const directory = lstatSync(dirname(filename));
      if (!directory.isDirectory() || directory.isSymbolicLink() || (directory.mode & 0o077)) throw new CommerceError('PRIVATE_DATABASE_PATH_REQUIRED');
      try {
        const file = lstatSync(filename);
        if (!file.isFile() || file.isSymbolicLink() || (file.mode & 0o077)) throw new CommerceError('PRIVATE_DATABASE_PATH_REQUIRED');
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
        const descriptor = openSync(filename, 'wx', 0o600);
        closeSync(descriptor);
      }
      chmodSync(filename, 0o600);
      this.#db = new DatabaseSync(filename, { timeout: 5000, enableForeignKeyConstraints: true, enableDoubleQuotedStringLiterals: false });
      this.#db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON;');
      this.#clock = clock;
    } catch (error) {
      try { this.#db?.close(); } catch { /* Preserve original safe failure. */ }
      if (error instanceof CommerceError) throw error;
      throw new CommerceError('REPOSITORY_OPEN_FAILED');
    }
  }

  #now() { return milliseconds(this.#clock()); }
  #requireReady() { if (!this.#ready) throw new CommerceError('REPOSITORY_MIGRATION_REQUIRED'); }
  #transaction(operation) {
    let began = false;
    try {
      this.#db.exec('BEGIN IMMEDIATE'); began = true;
      const result = operation();
      this.#db.exec('COMMIT');
      return result;
    } catch (error) {
      if (began) { try { this.#db.exec('ROLLBACK'); } catch { /* The original failure remains authoritative. */ } }
      if (error instanceof CommerceError) throw error;
      if ([5, 6].includes(error?.errcode)) throw new CommerceError('REPOSITORY_BUSY', { retryable: true });
      throw new CommerceError('REPOSITORY_WRITE_CONFLICT');
    }
  }

  migrate() {
    const checksum = sha(migration);
    this.#transaction(() => {
      const installed = this.#db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'commerce_schema_migrations'").get();
      if (installed) {
        const versions = this.#db.prepare('SELECT version, checksum FROM commerce_schema_migrations ORDER BY version').all();
        if (versions.length !== 1 || versions[0].version !== 1 || versions[0].checksum !== checksum) throw new CommerceError('REPOSITORY_MIGRATION_MISMATCH');
      } else {
        this.#db.exec(migration);
        this.#db.prepare('INSERT INTO commerce_schema_migrations(version, checksum, applied_at_ms) VALUES(1, ?, ?)').run(checksum, this.#now());
      }
    });
    this.#ready = true;
    return { version: 1 };
  }
  close() { this.#ready = false; this.#db.close(); }

  createOrder(order) {
    this.#requireReady();
    if (!order || typeof order !== 'object' || Array.isArray(order)) throw new CommerceError('INVALID_ORDER_RECORD');
    if (Object.hasOwn(order, 'stripeCheckoutSessionId')) throw new CommerceError('STRIPE_SESSION_BINDING_CONFLICT');
    safeId(order.id, 120); safeHash(order.quoteHash); currencyCode(order.currency);
    if (!Number.isSafeInteger(order.totalMinor) || order.totalMinor <= 0) throw new CommerceError('INVALID_ORDER_RECORD');
    shippingRecipient(order.recipient, { order: true }); fulfillmentItems(order.items); safeId(order.shippingId, 100);
    const body = JSON.stringify(canonical(order));
    if (Buffer.byteLength(body) > 128 * 1024) throw new CommerceError('ORDER_RECORD_TOO_LARGE');
    const orderHash = sha(body);
    return this.#transaction(() => {
      const old = this.#db.prepare('SELECT order_hash, order_json FROM commerce_orders WHERE id = ?').get(order.id);
      if (old) {
        if (old.order_hash !== orderHash) throw new CommerceError('IMMUTABLE_ORDER_CONFLICT');
        return this.getOrder(order.id);
      }
      this.#db.prepare('INSERT INTO commerce_orders(id, quote_hash, order_hash, order_json, total_minor, currency, created_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(order.id, order.quoteHash, orderHash, body, order.totalMinor, order.currency, this.#now());
      return this.getOrder(order.id);
    });
  }
  getOrder(id) {
    this.#requireReady(); safeId(id, 120);
    const row = this.#db.prepare('SELECT o.order_json, s.session_id FROM commerce_orders o LEFT JOIN commerce_stripe_sessions s ON s.order_id = o.id WHERE o.id = ?').get(id);
    return row ? { ...JSON.parse(row.order_json), stripeCheckoutSessionId: row.session_id ?? null } : null;
  }
  bindStripeSession({ orderId, quoteHash, sessionId }) {
    this.#requireReady(); safeId(orderId, 120); safeHash(quoteHash); safeId(sessionId);
    return this.#transaction(() => {
      const order = this.#db.prepare('SELECT quote_hash FROM commerce_orders WHERE id = ?').get(orderId);
      if (!order || order.quote_hash !== quoteHash) throw new CommerceError('STRIPE_SESSION_BINDING_CONFLICT');
      const existing = this.#db.prepare('SELECT * FROM commerce_stripe_sessions WHERE order_id = ? OR session_id = ?').all(orderId, sessionId);
      if (existing.length && (existing.length !== 1 || existing[0].order_id !== orderId || existing[0].session_id !== sessionId || existing[0].quote_hash !== quoteHash)) throw new CommerceError('STRIPE_SESSION_BINDING_CONFLICT');
      if (!existing.length) this.#db.prepare('INSERT INTO commerce_stripe_sessions(session_id, order_id, quote_hash, bound_at_ms) VALUES (?, ?, ?, ?)').run(sessionId, orderId, quoteHash, this.#now());
      return this.getOrder(orderId);
    });
  }
  getOrderByStripeSession(sessionId) {
    this.#requireReady(); safeId(sessionId);
    const row = this.#db.prepare('SELECT o.order_json, s.session_id FROM commerce_orders o JOIN commerce_stripe_sessions s ON s.order_id = o.id WHERE s.session_id = ?').get(sessionId);
    return row ? { ...JSON.parse(row.order_json), stripeCheckoutSessionId: row.session_id } : null;
  }

  getDraft(orderId) {
    this.#requireReady(); safeId(orderId, 120);
    return draftRecord(this.#db.prepare('SELECT * FROM commerce_draft_reservations WHERE order_id = ?').get(orderId));
  }
  claimDraft({ orderId, externalId, payloadHash, paymentReference }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash); safeId(paymentReference);
    return this.#transaction(() => {
      const existing = this.getDraft(orderId);
      if (existing) {
        if (existing.externalId !== externalId || existing.payloadHash !== payloadHash || existing.paymentReference !== paymentReference) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
        return { ...existing, acquired: false };
      }
      const now = this.#now();
      this.#db.prepare("INSERT INTO commerce_draft_reservations(order_id, external_id, payload_hash, payment_reference, state, created_at_ms, updated_at_ms) VALUES (?, ?, ?, ?, 'reserved', ?, ?)")
        .run(orderId, externalId, payloadHash, paymentReference, now, now);
      return { ...this.getDraft(orderId), acquired: true };
    });
  }
  beginDraftAttempt({ orderId, externalId, payloadHash }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash);
    return this.#transaction(() => {
      const existing = this.getDraft(orderId);
      if (!existing || existing.externalId !== externalId || existing.payloadHash !== payloadHash) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
      if (existing.attempted || existing.state === 'created') return { ...existing, acquired: false };
      const result = this.#db.prepare("UPDATE commerce_draft_reservations SET attempted = 1, state = 'reserved', updated_at_ms = ? WHERE order_id = ? AND external_id = ? AND payload_hash = ? AND attempted = 0 AND state != 'created'")
        .run(this.#now(), orderId, externalId, payloadHash);
      return { ...this.getDraft(orderId), acquired: result.changes === 1 };
    });
  }
  markDraftCreated({ orderId, externalId, payloadHash, printfulId }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); safeHash(payloadHash);
    if (!Number.isSafeInteger(printfulId) || printfulId <= 0) throw new CommerceError('INVALID_PRINTFUL_ID');
    return this.#transaction(() => {
      const existing = this.getDraft(orderId);
      if (!existing || existing.externalId !== externalId || existing.payloadHash !== payloadHash || (existing.printfulId !== null && existing.printfulId !== printfulId)) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
      this.#db.prepare("UPDATE commerce_draft_reservations SET state = 'created', attempted = 1, printful_id = ?, failure_code = NULL, updated_at_ms = ? WHERE order_id = ? AND external_id = ? AND payload_hash = ? AND (printful_id IS NULL OR printful_id = ?)")
        .run(printfulId, this.#now(), orderId, externalId, payloadHash, printfulId);
      return this.getDraft(orderId);
    });
  }
  recordDraftFailure({ orderId, externalId, code, ambiguous = false }) {
    this.#requireReady(); safeId(orderId, 120); safeId(externalId, 32); failureCode(code);
    if (typeof ambiguous !== 'boolean') throw new CommerceError('INVALID_DRAFT_FAILURE');
    return this.#transaction(() => {
      const existing = this.getDraft(orderId);
      if (!existing || existing.externalId !== externalId) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
      const state = existing.state === 'created' ? 'created' : (ambiguous || existing.state === 'uncertain') ? 'uncertain' : 'failed';
      this.#db.prepare('UPDATE commerce_draft_reservations SET state = ?, failure_code = ?, failure_count = min(failure_count + 1, 10000), updated_at_ms = ? WHERE order_id = ? AND external_id = ?')
        .run(state, code, this.#now(), orderId, externalId);
      return this.getDraft(orderId);
    });
  }

  enqueuePaymentEvent({ eventId, sessionId, type, created }) {
    this.#requireReady(); safeId(eventId); safeId(sessionId); safeId(type, 120); milliseconds(created);
    const id = 'stripe_' + sha(eventId);
    return this.#transaction(() => {
      const existing = this.#db.prepare('SELECT * FROM commerce_payment_events WHERE event_id = ?').get(eventId);
      if (existing) {
        if (existing.session_id !== sessionId || existing.type !== type || existing.provider_created !== created) throw new CommerceError('PAYMENT_EVENT_CONFLICT');
        return { ...this.getPaymentJob(id), duplicate: true };
      }
      const now = this.#now();
      this.#db.prepare('INSERT INTO commerce_payment_events(event_id, session_id, type, provider_created, received_at_ms) VALUES (?, ?, ?, ?, ?)').run(eventId, sessionId, type, created, now);
      this.#db.prepare("INSERT INTO commerce_payment_jobs(id, event_id, state, available_at_ms, created_at_ms, updated_at_ms) VALUES (?, ?, 'pending', ?, ?, ?)").run(id, eventId, now, now, now);
      return { ...this.getPaymentJob(id), duplicate: false };
    });
  }
  getPaymentJob(jobId) {
    this.#requireReady(); safeId(jobId, 100);
    return jobRecord(this.#db.prepare('SELECT j.*, e.session_id, e.type, e.provider_created FROM commerce_payment_jobs j JOIN commerce_payment_events e ON e.event_id = j.event_id WHERE j.id = ?').get(jobId));
  }
  claimPaymentJob({ workerId, nowMs, leaseMs }) {
    this.#requireReady(); safeId(workerId); milliseconds(nowMs);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 15 * 60 * 1000 || !Number.isSafeInteger(nowMs + leaseMs)) throw new CommerceError('INVALID_JOB_LEASE');
    return this.#transaction(() => {
      this.#db.prepare("UPDATE commerce_payment_jobs SET state = 'dead_letter', worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, last_error_code = 'LEASE_ATTEMPTS_EXHAUSTED', updated_at_ms = ? WHERE state = 'processing' AND lease_expires_at_ms <= ? AND attempts >= ?").run(nowMs, nowMs, MAX_ATTEMPTS);
      const row = this.#db.prepare("SELECT id FROM commerce_payment_jobs WHERE attempts < ? AND ((state = 'pending' AND available_at_ms <= ?) OR (state = 'processing' AND lease_expires_at_ms <= ?)) ORDER BY available_at_ms, created_at_ms, id LIMIT 1").get(MAX_ATTEMPTS, nowMs, nowMs);
      if (!row) return null;
      this.#db.prepare("UPDATE commerce_payment_jobs SET state = 'processing', attempts = attempts + 1, worker_id = ?, lease_token = ?, lease_expires_at_ms = ?, updated_at_ms = ? WHERE id = ?").run(workerId, randomUUID(), nowMs + leaseMs, nowMs, row.id);
      return this.getPaymentJob(row.id);
    });
  }
  completePaymentJob({ jobId, workerId, leaseToken }) {
    this.#requireReady(); safeId(jobId, 100); safeId(workerId); safeId(leaseToken);
    return this.#transaction(() => {
      const now = this.#now();
      const result = this.#db.prepare("UPDATE commerce_payment_jobs SET state = 'completed', worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, completed_at_ms = ?, updated_at_ms = ? WHERE id = ? AND state = 'processing' AND worker_id = ? AND lease_token = ? AND lease_expires_at_ms > ?").run(now, now, jobId, workerId, leaseToken, now);
      if (result.changes !== 1) throw new CommerceError('PAYMENT_JOB_LEASE_CONFLICT');
      return this.getPaymentJob(jobId);
    });
  }
  failPaymentJob({ jobId, workerId, leaseToken, code, retryable, nowMs }) {
    this.#requireReady(); safeId(jobId, 100); safeId(workerId); safeId(leaseToken); failureCode(code); milliseconds(nowMs);
    if (typeof retryable !== 'boolean') throw new CommerceError('INVALID_JOB_FAILURE');
    return this.#transaction(() => {
      const job = this.getPaymentJob(jobId);
      if (!job || job.state !== 'processing' || job.workerId !== workerId || job.leaseToken !== leaseToken || job.leaseExpiresAt <= nowMs) throw new CommerceError('PAYMENT_JOB_LEASE_CONFLICT');
      const retry = retryable && job.attempts < MAX_ATTEMPTS;
      const available = nowMs + Math.min(60000, 1000 * 2 ** (job.attempts - 1));
      milliseconds(available);
      this.#db.prepare('UPDATE commerce_payment_jobs SET state = ?, available_at_ms = ?, worker_id = NULL, lease_token = NULL, lease_expires_at_ms = NULL, last_error_code = ?, updated_at_ms = ? WHERE id = ? AND worker_id = ? AND lease_token = ?')
        .run(retry ? 'pending' : 'dead_letter', available, code, nowMs, jobId, workerId, leaseToken);
      return this.getPaymentJob(jobId);
    });
  }
}
