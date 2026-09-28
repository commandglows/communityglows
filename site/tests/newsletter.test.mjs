import test from 'node:test'
import assert from 'node:assert/strict'
import { handleSubscribe } from '../api/newsletter/subscribe.js'

const env = {
  PUBLIC_NEWSLETTER_ENABLED: 'true', PUBLIC_NEWSLETTER_CONTROLLER: 'Test controller', PUBLIC_NEWSLETTER_NOTICE_URL: '/privacy/',
  COMMUNITYGLOWS_EMAIL_API_URL: 'https://central.example/api/v1/email/subscriptions', COMMUNITYGLOWS_EMAIL_CLIENT_TOKEN: 'private-test-token',
  COMMUNITYGLOWS_EMAIL_AUDIENCE: 'community-news', COMMUNITYGLOWS_EMAIL_NOTICE_VERSION: 'v1', COMMUNITYGLOWS_EMAIL_ABUSE_SECRET: 'private-test-abuse-secret',
}
function request(data = { email: 'reader@example.test', consent: true, locale: 'fr' }, headers = {}) {
  return new Request('https://community.example/api/newsletter/subscribe', { method: 'POST', headers: { origin: 'https://community.example', 'content-type': 'application/json', accept: 'application/json', ...headers }, body: JSON.stringify(data === null ? null : { notice_version: 'v1', ...data }) })
}
const options = (extra = {}) => ({ env, ip: '192.0.2.1', limiter: new Map(), fetchImpl: async () => Response.json({ status: 'pending', business_id: 'communityglows' }, { status: 202 }), ...extra })

test('forwards fixed scope, consent evidence and opaque abuse/idempotency keys', async () => {
  let call
  const result = await handleSubscribe(request({ email: 'reader@example.test', consent: true, locale: 'fr', business_id: 'another', purpose: 'transactional' }), options({ fetchImpl: async (url, init) => { call = { url, ...init }; return Response.json({ status: 'pending', business_id: 'communityglows' }, { status: 202 }) } }))
  assert.equal(result.status, 202)
  const body = JSON.parse(call.body)
  assert.equal(body.business_id, 'communityglows')
  assert.equal(body.purpose, 'marketing')
  assert.equal(body.source, 'communityglows_site')
  assert.equal(body.notice_version, 'v1')
  assert.equal(body.locale, 'fr')
  assert.match(body.abuse_key, /^[a-f0-9]{64}$/)
  assert.match(call.headers['idempotency-key'], /^[a-f0-9-]{36}$/)
  assert.equal(call.headers.authorization, 'Bearer private-test-token')
  assert.equal(call.redirect, 'error')
  assert.ok(call.signal instanceof AbortSignal)
  assert.ok(!call.body.includes('192.0.2.1'))
  const output = await result.text()
  assert.match(output, /Demande acceptée/)
  assert.ok(!output.includes('private-test'))
  assert.ok(!output.includes('reader@'))
})

test('fails closed with missing activation, configuration or trusted IP', async () => {
  for (const key of Object.keys(env)) {
    const response = await handleSubscribe(request(), options({ env: { ...env, [key]: '' }, fetchImpl: () => { assert.fail('network must not run') } }))
    assert.equal(response.status, 503, key)
  }
  assert.equal((await handleSubscribe(request(), options({ ip: '' }))).status, 503)
})

test('rejects invalid origin, consent, email, honeypot and oversized input without upstream', async () => {
  const noFetch = options({ fetchImpl: () => assert.fail('network must not run') })
  for (const origin of ['', 'https://attacker.example']) assert.equal((await handleSubscribe(request(undefined, { origin }), noFetch)).status, 403)
  for (const data of [{ email: 'a@example.test' }, { email: 'bad', consent: true }, { email: 'a@example.test', consent: true, website: 'bot' }, { email: 'x'.repeat(9000), consent: true }, null]) {
    assert.equal((await handleSubscribe(request(data), noFetch)).status, 400)
  }
})

test('native form returns HTML and safe localized outcome', async () => {
  const req = new Request('https://community.example/api/newsletter/subscribe', { method: 'POST', headers: { origin: 'https://community.example', 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' }, body: new URLSearchParams({ email: 'reader@example.test', consent: 'yes', locale: 'fr', notice_version: 'v1' }) })
  const response = await handleSubscribe(req, options())
  assert.equal(response.status, 202)
  assert.match(response.headers.get('content-type'), /text\/html/)
  assert.match(await response.text(), /lang="fr"/)
})

test('stale or missing rendered notice version is rejected before upstream', async () => {
  for (const notice_version of ['old-version', '', undefined]) {
    const response = await handleSubscribe(request({ email: 'reader@example.test', consent: true, notice_version }), options({ fetchImpl: () => assert.fail('network must not run') }))
    assert.equal(response.status, 400)
  }
})

test('only explicit central subscription success is accepted', async () => {
  for (const body of ['', '{}', '<html>gateway</html>', '{"status":"sent"}', '{"status":"pending","business_id":"other"}', '{"status":"subscribed","businessId":"other"}']) {
    assert.equal((await handleSubscribe(request(), options({ fetchImpl: async () => new Response(body, { status: 200 }) }))).status, 503)
  }
  for (const status of ['pending', 'subscribed']) {
    assert.equal((await handleSubscribe(request(), options({ fetchImpl: async () => Response.json({ status, businessId: 'communityglows' }) }))).status, 202)
  }
})

test('provider errors and timeout are generic failures, never success', async () => {
  for (const fetchImpl of [async () => new Response('private-test-token reader@example.test', { status: 500 }), async () => { throw new DOMException('sensitive details', 'AbortError') }]) {
    const response = await handleSubscribe(request(), options({ fetchImpl }))
    assert.equal(response.status, 503)
    const output = await response.text()
    assert.ok(!output.includes('private-test') && !output.includes('reader@') && !output.includes('sensitive'))
  }
  assert.equal((await handleSubscribe(request(), options({ fetchImpl: async () => new Response('', { status: 429 }) }))).status, 429)
})

test('upstream request is aborted after the configured timeout', { timeout: 18000 }, async () => {
  const started = Date.now()
  const response = await handleSubscribe(request(), options({ fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }) }))
  assert.equal(response.status, 503)
  assert.ok(Date.now() - started >= 14500)
})

test('supplementary limiter allows five requests and rejects sixth', async () => {
  let calls = 0
  const opts = options({ fetchImpl: async () => { calls++; return Response.json({ status: 'pending', business_id: 'communityglows' }, { status: 202 }) } })
  for (let i = 0; i < 5; i++) assert.equal((await handleSubscribe(request(), opts)).status, 202)
  assert.equal((await handleSubscribe(request(), opts)).status, 429)
  assert.equal(calls, 5)
})

test('rejects unsafe endpoint and unsupported methods and content types', async () => {
  for (const url of ['http://central.example/api/v1/email/subscriptions', 'https://central.example/other', 'https://user:pass@central.example/api/v1/email/subscriptions']) assert.equal((await handleSubscribe(request(), options({ env: { ...env, COMMUNITYGLOWS_EMAIL_API_URL: url } }))).status, 503)
  assert.equal((await handleSubscribe(new Request('https://community.example/api/newsletter/subscribe'), options())).status, 405)
  assert.equal((await handleSubscribe(request(undefined, { 'content-type': 'text/plain' }), options())).status, 415)
})
