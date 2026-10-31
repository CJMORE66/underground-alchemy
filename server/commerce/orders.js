import { createHash } from 'node:crypto';
import { CommerceError, boundedText, currencyCode } from './validation.js';
import { draftPayload, matchDraft } from './printful.js';

const hash = value => createHash('sha256').update(value).digest('hex');
export const externalOrderId = orderId => 'ua_' + hash(boundedText(orderId, 120)).slice(0, 28);

/*
 * Not wired to HTTP. repository MUST implement the atomic/durable contract in README.md.
 * verifyPayment MUST contact/verify the real provider server-side. A request's paid=true
 * field, redirect URL, browser session or unsigned webhook is never payment evidence.
 */
export class DraftOrderService {
  #client; #repository; #verifyPayment;
  constructor({ client, repository, verifyPayment }) {
    if (!client || !repository || typeof verifyPayment !== 'function' || ['getOrder', 'claimDraft', 'markDraftCreated', 'recordDraftFailure'].some(method => typeof repository[method] !== 'function')) throw new CommerceError('SERVER_ADAPTERS_REQUIRED');
    this.#client = client; this.#repository = repository; this.#verifyPayment = verifyPayment;
  }

  async createForPaidOrder(orderId) {
    boundedText(orderId, 120);
    const order = await this.#repository.getOrder(orderId);
    if (!order || order.id !== orderId || !Number.isSafeInteger(order.totalMinor) || order.totalMinor <= 0) throw new CommerceError('ORDER_NOT_READY');
    currencyCode(order.currency);
    let payment;
    try { payment = await this.#verifyPayment(order); }
    catch { throw new CommerceError('PAYMENT_VERIFICATION_FAILED'); }
    if (!payment || payment.verified !== true || payment.status !== 'paid' || payment.amountMinor !== order.totalMinor || payment.currency !== order.currency || payment.orderId !== order.id) throw new CommerceError('PAYMENT_NOT_VERIFIED');
    const paymentReference = boundedText(payment.providerReference, 200);
    const body = draftPayload({ externalId: externalOrderId(order.id), recipient: order.recipient, items: order.items, shippingId: order.shippingId });
    const payloadHash = hash(JSON.stringify({ body, currency: order.currency, totalMinor: order.totalMinor }));
    const claim = await this.#repository.claimDraft({ orderId, externalId: body.external_id, payloadHash, paymentReference });
    if (!claim || claim.externalId !== body.external_id || claim.payloadHash !== payloadHash || claim.paymentReference !== paymentReference || !['reserved', 'created', 'uncertain', 'failed'].includes(claim.state)) throw new CommerceError('DRAFT_RESERVATION_CONFLICT');
    let result;
    try {
      const found = await this.#client.lookupOrder(body.external_id);
      if (found) {
        result = matchDraft(found, body);
        if (claim.printfulId != null && claim.printfulId !== result.id) throw new CommerceError('DRAFT_RESERVATION_CONFLICT', { ambiguous: true });
      }
      else {
        if (claim.acquired !== true || claim.state !== 'reserved') throw new CommerceError('DRAFT_REQUIRES_RECONCILIATION', { ambiguous: true });
        result = await this.#client.createDraft({ externalId: body.external_id, recipient: body.recipient, items: body.items, shippingId: body.shipping });
      }
      await this.#repository.markDraftCreated({ orderId, externalId: body.external_id, payloadHash, printfulId: result.id });
      return result;
    } catch (error) {
      const safe = error instanceof CommerceError ? error : new CommerceError('DRAFT_PERSISTENCE_UNCERTAIN', { ambiguous: true });
      try { await this.#repository.recordDraftFailure({ orderId, externalId: body.external_id, code: safe.code, ambiguous: safe.ambiguous }); } catch { /* Keep the durable reservation; never retry the POST here. */ }
      throw safe;
    }
  }
}

const TRANSITIONS = Object.freeze({
  awaiting_payment: { payment_verified: 'paid', cancel_verified: 'canceled' },
  paid: { draft_reserved: 'draft_reserved', refund_requested: 'refund_pending' },
  draft_reserved: { draft_created: 'draft_created', draft_uncertain: 'draft_uncertain', draft_failed: 'draft_failed' },
  draft_uncertain: { draft_reconciled: 'draft_created', draft_failed: 'draft_failed' },
  draft_failed: { draft_reconciled: 'draft_created', refund_requested: 'refund_pending' },
  draft_created: { cancel_requested: 'cancel_pending', refund_requested: 'refund_pending' },
  cancel_pending: { cancel_verified: 'canceled' },
  canceled: { refund_requested: 'refund_pending' },
  refund_pending: { refund_verified: 'refunded' },
  refunded: {}
});

/* Internal verified events only. Request handlers must never expose event selection to clients. */
export function transitionOrder(state, event) {
  if (!Object.hasOwn(TRANSITIONS, state) || typeof event !== 'string' || !Object.hasOwn(TRANSITIONS[state], event)) throw new CommerceError('INVALID_ORDER_TRANSITION');
  return TRANSITIONS[state][event];
}
