import assert from 'node:assert/strict';
import test from 'node:test';
import { createCommerceWorker } from '../server/worker.js';
import { greeting } from '../dist/alchymista/story.js';

const origin = 'https://example.test';
const route = '/api/alchymista/live';
const offer = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n';
const answer = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=recvonly\r\n';
const visitor = 'site-specific-visitor-fixture';
const key = 'synthetic-live-key';

function fixture({ allowed = [], upstream, configured = true } = {}) {
  const calls = { provider: [], quota: [], migration: 0 };
  const env = {
    OPENAI_API_KEY: configured ? key : undefined,
    COMMERCE_DB: {},
    ASSETS: { fetch: async request => new Response(new URL(request.url).pathname) },
  };
  const worker = createCommerceWorker({
    async fetchImplementation(url, init) {
      calls.provider.push({ url, init });
      return upstream
        ? upstream()
        : Response.json({ session: { id: 'live_fixture' }, transport: { sdp: answer } }, { status: 201 });
    },
    repositoryFactory: () => ({
      async migrate() { calls.migration++; },
      async consumeRateLimit(entry) {
        const index = calls.quota.push(entry) - 1;
        return { allowed: allowed[index] ?? true };
      },
    }),
  });
  return { calls, fetch: request => worker.fetch(request, env, {}) };
}

function request(path, { method = 'GET', user = visitor, headers = {}, body } = {}) {
  return new Request(origin + path, {
    method,
    headers: {
      ...(user ? { 'oai-authenticated-user-id': user } : {}),
      origin,
      'content-type': 'application/json',
      ...headers,
    },
    body,
  });
}

function session({ body = { sdp: offer }, ...options } = {}) {
  return request(route + '/session', { method: 'POST', body: JSON.stringify(body), ...options });
}

test('public readiness is uncached and reports configuration and sign-in without contacting GPT-Live', async () => {
  for (const configured of [false, true]) {
    const f = fixture({ configured });
    for (const signedIn of [false, true]) {
      const response = await f.fetch(request(route + '/status', { user: signedIn ? visitor : null }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { configured, signedIn });
    }
    assert.deepEqual(f.calls, { provider: [], quota: [], migration: 0 });
  }
});

test('unconfigured, anonymous, malformed and cross-origin requests cannot spend quota or call the provider', async () => {
  const unconfigured = fixture({ configured: false });
  assert.equal((await unconfigured.fetch(session())).status, 503);
  assert.deepEqual(unconfigured.calls, { provider: [], quota: [], migration: 0 });

  const f = fixture();
  const cases = [
    [session({ user: null }), 401],
    [session({ headers: { origin: 'https://other.example' } }), 403],
    [session({ headers: { 'sec-fetch-site': 'cross-site' } }), 403],
    [session({ headers: { 'content-type': 'text/plain' } }), 415],
    [session({ body: { sdp: 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 99\r\n' } }), 400],
    [session({ body: { sdp: offer + 'a=x:'.padEnd(33_000, 'x') } }), 413],
    [request(route + '/session'), 405],
  ];
  for (const [incoming, expected] of cases) {
    assert.equal((await f.fetch(incoming)).status, expected);
  }
  assert.deepEqual(f.calls, { provider: [], quota: [], migration: 0 });
});

test('an authorized offer uses the documented GPT-Live WebRTC endpoint and returns only the answer SDP', async () => {
  const f = fixture();
  const response = await f.fetch(session({ body: { sdp: offer, instructions: 'untrusted fixture text' } }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { sdp: answer });
  assert.equal(f.calls.migration, 1);
  assert.equal(f.calls.provider.length, 1);
  const [{ url, init }] = f.calls.provider;
  assert.equal(url, 'https://api.openai.com/v1/live/sessions');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Bearer ' + key);
  assert.ok(init.signal instanceof AbortSignal);
  const body = JSON.parse(init.body);
  assert.equal(body.session.model, 'gpt-live-1');
  assert.match(body.session.instructions, /Alchymista/);
  assert.deepEqual(body.session.input, [{ role: 'developer', content: [{ type: 'input_text', text: greeting }] }]);
  assert.ok(!init.body.includes('untrusted fixture text'));
  assert.ok(!init.body.includes(visitor));
  assert.deepEqual(body.transport, { type: 'webrtc', sdp: offer });
  const [individual, total] = f.calls.quota;
  assert.match(individual.key, /^live:user:[a-f\d]{64}$/);
  assert.equal(total.key, 'live:site');
  assert.ok(individual.limit < total.limit);
});

test('both quota gates block paid session creation', async () => {
  for (const [allowed, limitChecks] of [[[false], 1], [[true, false], 2]]) {
    const f = fixture({ allowed });
    const response = await f.fetch(session());
    assert.equal(response.status, 429);
    assert.equal(f.calls.quota.length, limitChecks);
    assert.equal(f.calls.provider.length, 0);
  }
});

test('provider rejection and malformed SDP stay private, and the text guide still uses the asset route', async () => {
  const testResponses = [
    [() => Response.json({ detail: 'private fixture' }, { status: 401 }), 'LIVE_PROVIDER_UNAVAILABLE'],
    [() => Response.json({ transport: { sdp: 'private fixture' } }), 'INVALID_LIVE_ANSWER'],
  ];
  for (const [upstream, error] of testResponses) {
    const f = fixture({ upstream });
    const response = await f.fetch(session());
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error });
    const guide = await f.fetch(request('/alchymista/'));
    assert.equal(guide.status, 200);
    assert.equal(await guide.text(), '/alchymista/');
  }
});
