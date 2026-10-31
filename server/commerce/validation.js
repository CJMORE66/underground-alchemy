/* Server-only building blocks. No public HTTP routes or payment provider are configured. */
export class CommerceError extends Error {
  constructor(code, { status = null, retryable = false, ambiguous = false } = {}) {
    super(code);
    this.name = 'CommerceError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.ambiguous = ambiguous;
  }
}

export function integer(value, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) throw new CommerceError('INVALID_INTEGER');
  return value;
}

export function boundedText(value, maximum = 200, required = true) {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string' || value.length > maximum || /[\x00-\x1f\x7f]/.test(value) || (required && !value.trim())) throw new CommerceError('INVALID_TEXT');
  return value.trim();
}

export function currencyCode(value) {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) throw new CommerceError('INVALID_CURRENCY');
  return value;
}

/* Exponent must come from the configured payment/currency adapter, never a browser. */
export function decimalToMinor(value, exponent) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 3 || typeof value !== 'string' || !/^(0|[1-9][0-9]{0,11})(\.[0-9]+)?$/.test(value)) throw new CommerceError('INVALID_MONEY');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > exponent) throw new CommerceError('INVALID_MONEY_PRECISION');
  const minor = Number(BigInt(whole) * (10n ** BigInt(exponent)) + BigInt(fraction.padEnd(exponent, '0') || '0'));
  if (!Number.isSafeInteger(minor)) throw new CommerceError('MONEY_OVERFLOW');
  return minor;
}

export function orderTotalMinor(lines, shippingMinor, taxMinor) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 100) throw new CommerceError('INVALID_LINES');
  for (const amount of [shippingMinor, taxMinor]) if (!Number.isSafeInteger(amount) || amount < 0) throw new CommerceError('INVALID_MONEY');
  let subtotal = 0n;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.unitAmountMinor) || line.unitAmountMinor < 0) throw new CommerceError('INVALID_MONEY');
    subtotal += BigInt(line.unitAmountMinor) * BigInt(integer(line.quantity, 100));
  }
  const total = subtotal + BigInt(shippingMinor) + BigInt(taxMinor);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new CommerceError('MONEY_OVERFLOW');
  return { subtotalMinor: Number(subtotal), shippingMinor, taxMinor, totalMinor: Number(total) };
}

export function shippingRecipient(source, { order = false } = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new CommerceError('INVALID_RECIPIENT');
  if (typeof source.country_code !== 'string' || !/^[A-Z]{2}$/.test(source.country_code)) throw new CommerceError('INVALID_COUNTRY');
  const recipient = { country_code: source.country_code };
  for (const key of ['name', 'company', 'address1', 'address2', 'city', 'zip', 'state_code', 'phone', 'email']) {
    const value = boundedText(source[key], key === 'email' ? 254 : 200, order && ['name', 'address1', 'city', 'zip'].includes(key));
    if (value) recipient[key] = value;
  }
  if (['US', 'AU', 'CA'].includes(recipient.country_code) && !recipient.state_code) throw new CommerceError('STATE_REQUIRED');
  return recipient;
}

export function fulfillmentItems(items, field = 'sync_variant_id') {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new CommerceError('INVALID_ITEMS');
  const seen = new Set();
  return items.map(item => {
    const id = integer(item?.[field]), quantity = integer(item?.quantity, 100);
    if (seen.has(id)) throw new CommerceError('DUPLICATE_VARIANT');
    seen.add(id);
    return { [field]: id, quantity };
  }).sort((a, b) => a[field] - b[field]);
}
