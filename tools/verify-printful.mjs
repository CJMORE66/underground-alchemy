#!/usr/bin/env node
/* Read-only preflight. Never creates orders, changes webhooks or prints credentials. */
import { pathToFileURL } from 'node:url';
import { PrintfulClient } from '../server/commerce/printful.js';

export async function verifyPrintful(env, { clientFactory = options => new PrintfulClient(options) } = {}) {
  if (!env.PRINTFUL_API_TOKEN) return { status: 'BLOCKED', code: 'PRINTFUL_TOKEN_REQUIRED', networkAttempted: false };
  if (!['api', 'ecommerce'].includes(env.PRINTFUL_PLATFORM)) return { status: 'BLOCKED', code: 'PRINTFUL_PLATFORM_REQUIRED', networkAttempted: false };
  let networkAttempted = false;
  try {
    const client = clientFactory({ token: env.PRINTFUL_API_TOKEN });
    networkAttempted = true;
    const store = await client.verifyStore();
    const catalog = await client.catalogSummary({ platform: env.PRINTFUL_PLATFORM });
    return { status: 'VERIFIED_READ_ONLY', authentication: true, storeId: store.id, catalog, checkoutVerified: false, ordersCreated: 0 };
  } catch (error) {
    const allowedCodes = new Set(['PRINTFUL_TOKEN_REQUIRED', 'PRINTFUL_AUTH_FAILED', 'PRINTFUL_STORE_MISMATCH', 'PRINTFUL_RETRY_LATER', 'PRINTFUL_HTTP_ERROR', 'PRINTFUL_TRANSPORT_ERROR', 'PRINTFUL_INVALID_RESPONSE', 'PRINTFUL_RESPONSE_TOO_LARGE', 'PRINTFUL_INVALID_PAGINATION', 'PRINTFUL_DUPLICATE_PRODUCT', 'PRINTFUL_PAGINATION_LIMIT']);
    return { status: 'FAILED', code: allowedCodes.has(error?.code) ? error.code : 'PRINTFUL_VERIFICATION_FAILED', networkAttempted };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await verifyPrintful(process.env);
  console.log(JSON.stringify(result));
  process.exitCode = result.status === 'VERIFIED_READ_ONLY' ? 0 : 1;
}
