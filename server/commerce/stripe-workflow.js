import { CommerceError, boundedText } from './validation.js';
import { DraftOrderService } from './orders.js';

const PAYMENT_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);
const safeCode = error => typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{1,100}$/.test(error.code) ? error.code : 'COMMERCE_OPERATION_FAILED';

/** Server-only coordinator. Call createCheckout only after authenticating order ownership. */
export class StripeOrderWorkflow {
  #repository; #stripe; #printful; #now;
  constructor({ repository, stripe, printful, now = Date.now }) {
    const required = ['getOrder', 'bindStripeSession', 'getOrderByStripeSession', 'enqueuePaymentEvent', 'claimPaymentJob', 'completePaymentJob', 'failPaymentJob'];
    if (!repository || required.some(name => typeof repository[name] !== 'function') || !stripe || ['createCheckout', 'resumeCheckout', 'verifyPayment', 'verifyWebhook'].some(name => typeof stripe[name] !== 'function') || !printful || typeof now !== 'function') throw new CommerceError('SERVER_ADAPTERS_REQUIRED');
    this.#repository = repository; this.#stripe = stripe; this.#printful = printful; this.#now = now;
  }

  async createCheckout(orderId) {
    boundedText(orderId, 120);
    const order = await this.#repository.getOrder(orderId);
    if (!order || order.id !== orderId) throw new CommerceError('ORDER_NOT_READY');
    // Never accept prices, addresses, payment flags or redirect URLs from a browser here.
    if (order.stripeCheckoutSessionId) return this.#stripe.resumeCheckout(order);
    const session = await this.#stripe.createCheckout(order);
    if (!session || typeof session.id !== 'string' || !/^cs_test_[A-Za-z0-9]+$/.test(session.id)) throw new CommerceError('STRIPE_INVALID_SESSION', { ambiguous: true });
    try { await this.#repository.bindStripeSession({ orderId, quoteHash: order.quoteHash, sessionId: session.id }); }
    catch { throw new CommerceError('STRIPE_SESSION_PERSISTENCE_UNCERTAIN', { ambiguous: true, retryable: true }); }
    return session;
  }

  async acceptWebhook(rawBody, signature) {
    let event;
    try { event = await this.#stripe.verifyWebhook(rawBody, signature); }
    catch { throw new CommerceError('STRIPE_WEBHOOK_REJECTED', { status: 400 }); }
    if (!event || !PAYMENT_EVENTS.has(event.type)) return { received: true, ignored: true };
    try {
      const accepted = await this.#repository.enqueuePaymentEvent({ eventId: event.id, sessionId: event.sessionId, type: event.type, created: event.created });
      return { received: true, duplicate: accepted.duplicate === true, jobId: accepted.jobId || accepted.id };
    } catch { throw new CommerceError('STRIPE_WEBHOOK_PERSISTENCE_FAILED', { status: 503, retryable: true }); }
  }

  async processNextPayment({ workerId, leaseMs = 300000 } = {}) {
    boundedText(workerId, 120);
    const job = await this.#repository.claimPaymentJob({ workerId, nowMs: this.#now(), leaseMs });
    if (!job) return { status: 'idle' };
    const jobId = job.jobId || job.id;
    let verificationFailure;
    try {
      let order = await this.#repository.getOrderByStripeSession(job.sessionId);
      if (!order && typeof this.#stripe.recoverOrderReference === 'function') {
        // A signed event can arrive after Stripe accepted Session creation but
        // before our mapping committed. Resolve through a fresh provider read,
        // then conditionally bind the unchanged authoritative quote.
        const recovered = await this.#stripe.recoverOrderReference(job.sessionId, id => this.#repository.getOrder(id));
        await this.#repository.bindStripeSession(recovered);
        order = await this.#repository.getOrderByStripeSession(job.sessionId);
      }
      if (!order) throw new CommerceError('STRIPE_ORDER_MAPPING_NOT_READY', { retryable: true });
      const drafts = new DraftOrderService({ client: this.#printful, repository: this.#repository, verifyPayment: async persisted => {
        try { return await this.#stripe.verifyPayment(persisted); }
        catch (error) { verificationFailure = error; throw error; }
      }});
      const draft = await drafts.createForPaidOrder(order.id);
      await this.#repository.completePaymentJob({ jobId, workerId, leaseToken: job.leaseToken });
      return { status: 'draft_created', jobId, printfulId: draft.id };
    } catch (caught) {
      const error = verificationFailure || caught;
      if (error?.code === 'STRIPE_PAYMENT_PENDING' && job.type === 'checkout.session.completed') {
        // Delayed methods send a separate signed async-success event when paid.
        await this.#repository.completePaymentJob({ jobId, workerId, leaseToken: job.leaseToken });
        return { status: 'awaiting_payment', jobId };
      }
      const code = safeCode(error);
      const retryable = error?.retryable === true || error?.ambiguous === true || (error?.code === 'STRIPE_PAYMENT_PENDING' && job.type === 'checkout.session.async_payment_succeeded');
      await this.#repository.failPaymentJob({ jobId, workerId, leaseToken: job.leaseToken, code, retryable, nowMs: this.#now() });
      return { status: retryable ? 'retry_scheduled' : 'failed', jobId, code };
    }
  }
}

/** Mount on the actual server; a static Sites deployment does not expose this route. */
export function createStripeWebhookHandler(workflow) {
  if (typeof workflow?.acceptWebhook !== 'function') throw new CommerceError('SERVER_ADAPTERS_REQUIRED');
  const response = (status, body, headers = {}) => Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });
  return async request => {
    if (new URL(request.url).pathname !== '/api/stripe/webhook') return response(404, { error: 'not_found' });
    if (request.method !== 'POST') return response(405, { error: 'method_not_allowed' }, { allow: 'POST' });
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return response(415, { error: 'json_required' });
    const signature = request.headers.get('stripe-signature');
    if (!signature || signature.length > 8192) return response(400, { error: 'webhook_rejected' });
    const reader = request.body?.getReader();
    if (!reader) return response(400, { error: 'webhook_rejected' });
    const chunks = []; let length = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 256 * 1024) { await reader.cancel(); return response(413, { error: 'body_too_large' }); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      // Preserve the exact original bytes for Stripe SDK signature verification.
      await workflow.acceptWebhook(bytes, signature);
      return response(200, { received: true });
    } catch (error) {
      return response(error?.status === 400 ? 400 : 503, { error: error?.status === 400 ? 'webhook_rejected' : 'temporarily_unavailable' });
    } finally { reader.releaseLock(); }
  };
}
