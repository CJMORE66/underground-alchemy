#!/usr/bin/env node
/* Read-only test credential check. No sessions, payments, webhook writes or PII output. */
import { pathToFileURL } from 'node:url';
import { createTestStripeClient, isStripeTestKey, STRIPE_API_VERSION } from '../server/commerce/stripe.js';

export async function verifyStripe(env, { clientFactory = createTestStripeClient } = {}) {
  if (!isStripeTestKey(env.STRIPE_SECRET_KEY)) return { status: 'BLOCKED', code: 'STRIPE_TEST_KEY_REQUIRED', networkAttempted: false };
  let networkAttempted = false;
  try {
    const stripe = clientFactory(env.STRIPE_SECRET_KEY);
    networkAttempted = true;
    // Tax Settings Read is already needed by checkout. Do not require unrelated
    // Balance Read access merely to verify a least-privilege test key.
    const tax = await stripe.tax.settings.retrieve();
    if (tax?.object !== 'tax.settings' || tax.livemode !== false) return { status: 'FAILED', code: 'STRIPE_TEST_MODE_MISMATCH', networkAttempted };
    return { status: 'VERIFIED_READ_ONLY', authentication: true, mode: 'test', apiVersion: STRIPE_API_VERSION, taxSettingsActive: tax?.status === 'active', webhookSecretConfigured: typeof env.STRIPE_WEBHOOK_SECRET === 'string' && /^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET), checkoutVerified: false, paymentsCreated: 0 };
  } catch (error) {
    return { status: 'FAILED', code: error?.statusCode === 401 ? 'STRIPE_AUTH_FAILED' : error?.statusCode === 403 ? 'STRIPE_PERMISSION_DENIED' : 'STRIPE_READ_ONLY_CHECK_FAILED', networkAttempted };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await verifyStripe(process.env);
  console.log(JSON.stringify(result));
  process.exitCode = result.status === 'VERIFIED_READ_ONLY' ? 0 : 1;
}
