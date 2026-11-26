import { greeting } from '../../dist/alchymista/story.js';
import { boundedRequestJson, requireSameOrigin } from '../commerce/http-security.js';

const instructions = [
  'Jsi Alchymista, český MC a průvodce na CAISIK Underground Alchemy. Mluv česky, stručně, civilně a v obrazech.',
  'Po startu se představ jednou větou a nabídni dvě krátké linky na dvojhlas. Nech uživatele dokončit jeho sloku.',
  'Rapujte na střídačku. Po výzvě dej maximálně dvě krátké původní linky, navazuj na konkrétní obraz nebo poslední slovo uživatele a vrať mu prostor.',
  'Nová sekce je pouze kontext. Sama o sobě není pokyn začít mluvit. Když člověk mluví nebo rapuje, nech ho dojet.',
  'Beat a tempo řídí web. Netvrď, že slyšíš přehrávaný beat nebo znáš přesný takt. Nepředstírej GPS ani aktuální ověření míst.',
  'Rozliš doložený kontext a svůj výklad. Tvoř a ptej se na konkrétní detail. Když si nejsi jistý, řekni to. Blackbook zůstává v prohlížeči.',
].join(' ');

const response = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const identity = request => request.headers.get('oai-authenticated-user-id');
const configured = env => Boolean(env.OPENAI_API_KEY && env.COMMERCE_DB);

export async function handleAlchymistaLive(request, env, { fetchImplementation, repositoryFor }) {
  const statusRoute = new URL(request.url).pathname.endsWith('/status');
  if (request.method !== (statusRoute ? 'GET' : 'POST')) return response(405, { error: 'METHOD_NOT_ALLOWED' });
  const user = identity(request);
  if (statusRoute) return response(200, { configured: configured(env), signedIn: Boolean(user) });
  if (!configured(env)) return response(503, { error: 'LIVE_NOT_CONFIGURED' });
  if (!user) return response(401, { error: 'SIGN_IN_REQUIRED' });

  try {
    requireSameOrigin(request);
    const { sdp } = await boundedRequestJson(request, 32_768);
    if (typeof sdp !== 'string' || !/^v=0\r?\n/.test(sdp) || !/^m=audio /m.test(sdp)) {
      return response(400, { error: 'INVALID_OFFER' });
    }

    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(user)));
    const userKey = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
    const repository = await repositoryFor(env);
    const nowMs = Date.now();
    const individual = await repository.consumeRateLimit({ key: 'live:user:' + userKey, limit: 4, windowMs: 86_400_000, nowMs });
    if (!individual.allowed) return response(429, { error: 'LIVE_LIMIT_REACHED' });
    const total = await repository.consumeRateLimit({ key: 'live:site', limit: 24, windowMs: 86_400_000, nowMs });
    if (!total.allowed) return response(429, { error: 'LIVE_LIMIT_REACHED' });

    const upstream = await fetchImplementation('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          model: 'gpt-live-1',
          instructions,
          input: [{
            role: 'developer',
            content: [{ type: 'input_text', text: greeting }],
          }],
        },
        transport: { type: 'webrtc', sdp },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) return response(502, { error: 'LIVE_PROVIDER_UNAVAILABLE' });
    const { transport } = await upstream.json();
    if (typeof transport?.sdp !== 'string' || !/^v=0\r?\n/.test(transport.sdp)) {
      return response(502, { error: 'INVALID_LIVE_ANSWER' });
    }
    return response(201, { sdp: transport.sdp });
  } catch (error) {
    const status = [400, 403, 413, 415].includes(error?.status) ? error.status : 503;
    return response(status, { error: status === 503 ? 'LIVE_UNAVAILABLE' : 'INVALID_LIVE_REQUEST' });
  }
}
