import { CommerceError, integer, boundedText, currencyCode, shippingRecipient, fulfillmentItems } from './validation.js';

const ORIGIN = 'https://api.printful.com';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const TRANSIENT = new Set([429, 500, 502, 503, 504]);
export const EXPECTED_STORE_ID = 18912189;

async function boundedJson(response) {
  if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) throw new CommerceError('PRINTFUL_INVALID_RESPONSE');
  const reader = response.body?.getReader();
  if (!reader) throw new CommerceError('PRINTFUL_INVALID_RESPONSE');
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new CommerceError('PRINTFUL_RESPONSE_TOO_LARGE'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const envelope = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!envelope || envelope.code !== response.status || !Object.hasOwn(envelope, 'result')) throw new CommerceError('PRINTFUL_INVALID_RESPONSE');
    return envelope;
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError('PRINTFUL_INVALID_RESPONSE');
  } finally { reader.releaseLock(); }
}

function retryDelay(response, attempt, maximum) {
  const value = response.headers.get('retry-after');
  const seconds = value && /^\d+$/.test(value) ? Number(value) : value ? Math.max(0, (Date.parse(value) - Date.now()) / 1000) : 0;
  const reset = response.headers.get('x-ratelimit-reset');
  const delay = value ? seconds * 1000 : response.status === 429 && /^\d+$/.test(reset || '') ? Number(reset) * 1000 : 250 * (2 ** attempt);
  if (!Number.isFinite(delay) || delay > maximum) throw new CommerceError('PRINTFUL_RETRY_LATER', { status: response.status, retryable: true });
  return Math.max(0, delay);
}

/* No arbitrary URLs, raw responses, redirect following, mutation retries or confirmation method. */
export class PrintfulClient {
  #token; #fetch; #log; #sleep; #timeout; #retryLimit; #maxWait; #verified = false;
  constructor({ token, fetch = globalThis.fetch, log = () => {}, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), timeoutMs = 10000, retryLimit = 2, maxRetryWaitMs = 5000 } = {}) {
    if (typeof token !== 'string' || !/^[!-~]{8,4096}$/.test(token)) throw new CommerceError('PRINTFUL_TOKEN_REQUIRED');
    if (typeof fetch !== 'function' || typeof log !== 'function' || typeof sleep !== 'function') throw new CommerceError('INVALID_ADAPTER');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000 || !Number.isInteger(retryLimit) || retryLimit < 0 || retryLimit > 3 || !Number.isInteger(maxRetryWaitMs) || maxRetryWaitMs < 0 || maxRetryWaitMs > 10000) throw new CommerceError('INVALID_RETRY_POLICY');
    this.#token = token; this.#fetch = fetch; this.#log = log; this.#sleep = sleep; this.#timeout = timeoutMs; this.#retryLimit = retryLimit; this.#maxWait = maxRetryWaitMs;
  }

  #emit(entry) { try { this.#log(entry); } catch { /* Observability must not repeat a request. */ } }

  async #request(operation, path, { method = 'GET', body, safeRead = method === 'GET', notFound = false, withPaging = false } = {}) {
    for (let attempt = 0; ; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.#timeout);
      try {
        const response = await this.#fetch(ORIGIN + path, {
          method, redirect: 'error', signal: controller.signal,
          headers: { Authorization: `Bearer ${this.#token}`, 'X-PF-Store-Id': String(EXPECTED_STORE_ID), Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        this.#emit({ event: 'printful_request', operation, attempt, status: response.status });
        if (response.status === 404 && notFound) { await response.body?.cancel(); return null; }
        if (!response.ok) {
          await response.body?.cancel();
          if (safeRead && TRANSIENT.has(response.status) && attempt < this.#retryLimit) { clearTimeout(timer); await this.#sleep(retryDelay(response, attempt, this.#maxWait)); continue; }
          throw new CommerceError([401, 403].includes(response.status) ? 'PRINTFUL_AUTH_FAILED' : 'PRINTFUL_HTTP_ERROR', { status: response.status, retryable: safeRead && TRANSIENT.has(response.status), ambiguous: !safeRead && response.status >= 500 });
        }
        let envelope;
        try { envelope = await boundedJson(response); }
        catch (error) {
          // A successful HTTP mutation may already exist even when its body is unusable.
          if (!safeRead && error instanceof CommerceError) error.ambiguous = true;
          throw error;
        }
        return withPaging ? envelope : envelope.result;
      } catch (error) {
        if (error instanceof CommerceError) throw error;
        this.#emit({ event: 'printful_transport_error', operation, attempt });
        if (safeRead && attempt < this.#retryLimit) { clearTimeout(timer); await this.#sleep(Math.min(250 * (2 ** attempt), this.#maxWait)); continue; }
        throw new CommerceError('PRINTFUL_TRANSPORT_ERROR', { retryable: safeRead, ambiguous: !safeRead });
      } finally { clearTimeout(timer); }
    }
  }

  async verifyStore() {
    this.#verified = false;
    const stores = await this.#request('verify_store', '/stores');
    if (!Array.isArray(stores) || !stores.some(store => store?.id === EXPECTED_STORE_ID)) throw new CommerceError('PRINTFUL_STORE_MISMATCH');
    this.#verified = true;
    return { id: EXPECTED_STORE_ID, verified: true };
  }

  #requireStore() { if (!this.#verified) throw new CommerceError('PRINTFUL_STORE_NOT_VERIFIED'); }

  async catalogSummary({ platform }) {
    this.#requireStore();
    if (!['api', 'ecommerce'].includes(platform)) throw new CommerceError('PRINTFUL_PLATFORM_REQUIRED');
    const base = platform === 'api' ? '/store/products' : '/sync/products';
    const seen = new Set(); let total = null, offset = 0;
    for (let page = 0; page < 10; page++) {
      const envelope = await this.#request('catalog_summary', `${base}?offset=${offset}&limit=100`, { withPaging: true });
      const paging = envelope.paging, items = envelope.result;
      if (!paging || !Array.isArray(items) || !Number.isInteger(paging.total) || paging.total < 0 || paging.total > 500 || paging.offset !== offset || !Number.isInteger(paging.limit) || paging.limit < 1 || paging.limit > 100 || items.length > paging.limit || (total != null && paging.total !== total)) throw new CommerceError('PRINTFUL_INVALID_PAGINATION');
      total = paging.total;
      if ((!items.length && offset !== total) || offset + items.length > total) throw new CommerceError('PRINTFUL_INVALID_PAGINATION');
      for (const item of items) { integer(item?.id); if (seen.has(item.id)) throw new CommerceError('PRINTFUL_DUPLICATE_PRODUCT'); seen.add(item.id); }
      offset += items.length;
      if (offset === total) return { storeId: EXPECTED_STORE_ID, platform, productCount: total, checkedAt: new Date().toISOString() };
    }
    throw new CommerceError('PRINTFUL_PAGINATION_LIMIT');
  }

  async shippingRates({ recipient, items, currency }) {
    this.#requireStore();
    const body = { recipient: shippingRecipient(recipient), items: fulfillmentItems(items, 'variant_id'), currency: currencyCode(currency) };
    const rates = await this.#request('shipping_rates', '/shipping/rates', { method: 'POST', body, safeRead: true });
    if (!Array.isArray(rates) || rates.length > 100) throw new CommerceError('PRINTFUL_INVALID_RATES');
    const ids = new Set();
    return rates.map(rate => {
      const id = boundedText(rate.id, 200), name = boundedText(rate.name, 500), resultCurrency = currencyCode(rate.currency);
      if (resultCurrency !== body.currency || typeof rate.rate !== 'string' || !/^(0|[1-9][0-9]{0,11})(\.[0-9]{1,3})?$/.test(rate.rate) || ids.has(id)) throw new CommerceError('PRINTFUL_INVALID_RATES');
      ids.add(id);
      return { id, name, rate: rate.rate, currency: resultCurrency };
    });
  }

  async lookupOrder(externalId) {
    this.#requireStore(); validateExternalId(externalId);
    return this.#request('lookup_order', '/orders/@' + externalId, { notFound: true });
  }

  async createDraft(input) {
    this.#requireStore();
    const body = draftPayload(input);
    try {
      return matchDraft(await this.#request('create_draft', '/orders?confirm=false&update_existing=false', { method: 'POST', body, safeRead: false }), body);
    } catch (error) {
      if (!(error instanceof CommerceError) || (!error.ambiguous && error.status !== 409 && error.code !== 'PRINTFUL_INVALID_RESPONSE' && error.code !== 'DRAFT_MISMATCH')) throw error;
      // The server may have accepted a POST before the connection/response failed.
      // A lookup is safe; another POST is intentionally impossible in this invocation.
      const found = await this.lookupOrder(body.external_id);
      if (found) return matchDraft(found, body);
      throw new CommerceError('PRINTFUL_DRAFT_UNCERTAIN', { ambiguous: true });
    }
  }
}

export function validateExternalId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(value)) throw new CommerceError('INVALID_EXTERNAL_ID');
  return value;
}

export function draftPayload({ externalId, recipient, items, shippingId }) {
  return { external_id: validateExternalId(externalId), recipient: shippingRecipient(recipient, { order: true }), items: fulfillmentItems(items), shipping: boundedText(shippingId, 200) };
}

export function matchDraft(result, expected) {
  try {
    if (!result || result.external_id !== expected.external_id || result.status !== 'draft' || !Number.isSafeInteger(result.id) || result.id <= 0) throw new CommerceError('DRAFT_MISMATCH');
    if (JSON.stringify(fulfillmentItems(result.items)) !== JSON.stringify(expected.items) || result.shipping !== expected.shipping) throw new CommerceError('DRAFT_MISMATCH');
    for (const [key, value] of Object.entries(expected.recipient)) if (result.recipient?.[key] !== value) throw new CommerceError('DRAFT_MISMATCH');
    return { id: integer(result.id), externalId: result.external_id, status: 'draft' };
  } catch { throw new CommerceError('DRAFT_MISMATCH', { ambiguous: true }); }
}
