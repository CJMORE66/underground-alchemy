import { CommerceError } from './validation.js';

const COOKIE = '__Host-ua-commerce';
const encoder = new TextEncoder();
const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
const keyFor = secret => {
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 256) throw new CommerceError('SESSION_CONFIGURATION_REQUIRED', { status: 503 });
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};

export async function commerceSession(request, secret, { create = false, now = Date.now() } = {}) {
  const key = await keyFor(secret), seconds = Math.floor(now / 1000);
  const value = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  let nonce;
  if (value && /^[A-Za-z0-9_-]{32}\.[0-9]{10,12}\.[A-Za-z0-9_-]{43}$/.test(value)) {
    const [candidate, expiry, signature] = value.split('.');
    if (+expiry > seconds && +expiry <= seconds + 7 * 86400) {
      try { if (await crypto.subtle.verify('HMAC', key, decode(signature), encoder.encode(candidate + '.' + expiry))) nonce = candidate; } catch { /* Invalid cookies never establish ownership. */ }
    }
  }
  let cookie;
  if (!nonce && create) {
    nonce = encode(crypto.getRandomValues(new Uint8Array(24)));
    const body = nonce + '.' + (seconds + 7 * 86400);
    const signature = encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))));
    cookie = `${COOKIE}=${body}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`;
  }
  if (!nonce) throw new CommerceError('SESSION_REQUIRED', { status: 401 });
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(nonce)));
  return { ownerId: 'guest_' + [...hash].map(byte => byte.toString(16).padStart(2, '0')).join(''), cookie };
}

export function requireSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new CommerceError('ORIGIN_REJECTED', { status: 403 });
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new CommerceError('JSON_REQUIRED', { status: 415 });
}

export async function boundedRequestBytes(request, maximum = 16384) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || +declared > maximum)) throw new CommerceError('BODY_TOO_LARGE', { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) throw new CommerceError('INVALID_JSON', { status: 400 });
  const chunks = []; let length = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > maximum) { await reader.cancel(); throw new CommerceError('BODY_TOO_LARGE', { status: 413 }); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } catch (error) { if (error instanceof CommerceError) throw error; throw new CommerceError('INVALID_JSON', { status: 400 }); }
  finally { reader.releaseLock(); }
}

export async function boundedRequestJson(request, maximum = 16384) {
  const bytes = await boundedRequestBytes(request, maximum);
  try {
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required');
    return parsed;
  } catch { throw new CommerceError('INVALID_JSON', { status: 400 }); }
}
