import { CommerceError, boundedText, integer } from './validation.js';
import { EXPECTED_STORE_ID, validateExternalId } from './printful.js';
import { FulfillmentSyncService } from './fulfillment-sync.js';

export const PRINTFUL_RECONCILIATION_EVENTS = Object.freeze(['order_created', 'order_updated', 'order_failed', 'order_canceled', 'order_put_hold', 'order_put_hold_approval', 'order_remove_hold', 'order_refunded', 'shipment_sent', 'shipment_delivered', 'shipment_returned', 'shipment_out_of_stock', 'shipment_canceled', 'shipment_put_hold', 'shipment_put_hold_approval', 'shipment_remove_hold']);
const safeCode = error => /^[A-Z][A-Z0-9_]{1,100}$/.test(error?.code || '') ? error.code : 'PRINTFUL_RECONCILIATION_FAILED';
const identifier = value => { const checked = boundedText(value, 120); if (checked !== value) throw new CommerceError('INVALID_PRINTFUL_JOB'); return checked; };

// Shape validation is not authentication. Only the injected server verifier may
// produce the hint admitted by acceptWebhook; browser data is never trusted.
export function normalizePrintfulHint(hint) {
  if (!hint || typeof hint !== 'object' || Array.isArray(hint) || Object.keys(hint).some(key => !['fingerprint', 'type', 'occurredAt', 'storeId', 'printfulId', 'externalId', 'shipmentId', 'ignored'].includes(key)) || !/^[a-f0-9]{64}$/.test(hint.fingerprint || '') || !PRINTFUL_RECONCILIATION_EVENTS.includes(hint.type) || hint.storeId !== EXPECTED_STORE_ID || (hint.ignored != null && hint.ignored !== false)) throw new CommerceError('INVALID_PRINTFUL_HINT');
  if (typeof hint.occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(hint.occurredAt) || !Number.isFinite(Date.parse(hint.occurredAt)) || new Date(hint.occurredAt).toISOString().slice(0, 19) !== hint.occurredAt.slice(0, 19)) throw new CommerceError('INVALID_PRINTFUL_HINT');
  integer(hint.printfulId);
  const externalId = hint.externalId == null ? null : validateExternalId(hint.externalId), shipmentId = hint.shipmentId == null ? null : integer(hint.shipmentId);
  if (hint.type.startsWith('shipment_') !== (shipmentId !== null)) throw new CommerceError('INVALID_PRINTFUL_HINT');
  return { fingerprint: hint.fingerprint, type: hint.type, occurredAt: hint.occurredAt, storeId: hint.storeId, printfulId: hint.printfulId, externalId, shipmentId };
}

/** Server-only event coordinator. All fulfillment work is fresh GET reconciliation.
 * It has no Stripe adapter, payment inference, order import or provider mutation.
 * No HTTP administrator route is supplied. Recovery needs a trusted injected
 * authorization verifier, and its audit stores only a caller hash/reason code.
 */
export class PrintfulOrderWorkflow {
  #repository; #printful; #verify; #now; #authorizeRecovery;
  constructor({ repository, printful, verifyWebhook, now = Date.now, authorizeRecovery } = {}) {
    const methods = ['enqueuePrintfulEvent', 'getPrintfulJob', 'claimPrintfulJob', 'completePrintfulJob', 'failPrintfulJob', 'getOrderByPrintfulMapping'];
    if (!repository || methods.some(name => typeof repository[name] !== 'function') || (printful != null && ['verifyStore', 'lookupOrder'].some(name => typeof printful[name] !== 'function')) || typeof verifyWebhook !== 'function' || typeof now !== 'function' || (authorizeRecovery != null && typeof authorizeRecovery !== 'function')) throw new CommerceError('PRINTFUL_SERVER_ADAPTERS_REQUIRED');
    this.#repository = repository; this.#printful = printful; this.#verify = verifyWebhook; this.#now = now; this.#authorizeRecovery = authorizeRecovery;
  }
  async acceptWebhook(input) {
    let hint;
    try { hint = await this.#verify(input); }
    catch (error) {
      if (error?.code === 'PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED') throw new CommerceError('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED', { status: 503, retryable: true });
      throw new CommerceError('PRINTFUL_WEBHOOK_REJECTED', { status: 400 });
    }
    if (hint?.ignored === true) return { received: true, ignored: true };
    const normalized = normalizePrintfulHint(hint);
    const receipt = await this.#repository.enqueuePrintfulEvent(normalized);
    return { received: true, ignored: receipt.state === 'ignored', duplicate: receipt.duplicate, jobId: receipt.jobId, state: receipt.state };
  }
  async processNext({ workerId, leaseMs = 120000, jobId } = {}) {
    identifier(workerId); if (jobId != null) identifier(jobId);
    if (!this.#printful) throw new CommerceError('PRINTFUL_TOKEN_REQUIRED', { status: 503, retryable: true });
    const job = await this.#repository.claimPrintfulJob({ workerId, nowMs: this.#now(), leaseMs, jobId });
    if (!job) return { status: 'idle' };
    try {
      const order = await this.#repository.getOrderByPrintfulMapping({ printfulId: job.printfulId, externalId: job.externalId });
      if (!order || order.id !== job.orderId || typeof order.ownerId !== 'string' || !order.ownerId) {
        await this.#repository.completePrintfulJob({ jobId: job.jobId, workerId, leaseToken: job.leaseToken, ignored: true });
        return { status: 'ignored', jobId: job.jobId };
      }
      // Event fields are hints, not status/payment evidence. Existing sync checks
      // the mapped ID, external ID, exact items and current provider store again.
      await new FulfillmentSyncService({ repository: this.#repository, printful: this.#printful, clock: this.#now }).refreshOrder(order.id, { ownerId: order.ownerId });
      await this.#repository.completePrintfulJob({ jobId: job.jobId, workerId, leaseToken: job.leaseToken });
      return { status: 'reconciled', jobId: job.jobId };
    } catch (error) {
      // A commit may have succeeded even if its response was lost. Never reset
      // a completed receipt, or write using another worker's replacement lease.
      const current = await this.#repository.getPrintfulJob(job.jobId);
      if (current?.state === 'completed' || current?.state === 'ignored') return { status: current.state === 'completed' ? 'reconciled' : 'ignored', jobId: job.jobId };
      const retryable = error?.retryable === true || error?.ambiguous === true;
      const failed = await this.#repository.failPrintfulJob({ jobId: job.jobId, workerId, leaseToken: job.leaseToken, code: safeCode(error), retryable, nowMs: this.#now() });
      return { status: failed.state === 'pending' ? 'retry_scheduled' : 'dead_letter', jobId: job.jobId, code: safeCode(error) };
    }
  }
  async drain({ workerId, limit = 5, leaseMs = 120000 } = {}) {
    identifier(workerId);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw new CommerceError('INVALID_PRINTFUL_DRAIN');
    const results = [];
    for (let count = 0; count < limit; count++) { const result = await this.processNext({ workerId, leaseMs }); if (result.status === 'idle') break; results.push(result); }
    return { processed: results.length, results };
  }
  async retryDeadLetter({ jobId, expectedUpdatedAt, expectedRecoveryCount, authorization } = {}) {
    identifier(jobId);
    if (!this.#authorizeRecovery || typeof this.#repository.retryPrintfulJob !== 'function') throw new CommerceError('PRINTFUL_RECOVERY_AUTHORIZATION_REQUIRED', { status: 403 });
    let approval;
    try { approval = await this.#authorizeRecovery({ operation: 'retry_printful_job', jobId, expectedUpdatedAt, expectedRecoveryCount, authorization }); } catch { /* Reject without recording raw authorization. */ }
    if (approval?.authorized !== true || !/^[a-f0-9]{64}$/.test(approval.actorHash || '') || !/^[A-Z][A-Z0-9_]{0,99}$/.test(approval.reasonCode || '')) throw new CommerceError('PRINTFUL_RECOVERY_AUTHORIZATION_REQUIRED', { status: 403 });
    return this.#repository.retryPrintfulJob({ jobId, expectedUpdatedAt, expectedRecoveryCount, actorHash: approval.actorHash, reasonCode: approval.reasonCode });
  }
}
