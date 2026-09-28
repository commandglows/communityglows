import { createHmac, randomUUID } from 'node:crypto'

const buckets = new Map()
const MAX_BODY = 8192
const messages = {
  en: { accepted: 'Request accepted. Check your inbox to confirm your subscription.', error: 'Signup could not be completed. Please try again later.' },
  fr: { accepted: 'Demande acceptée. Consultez votre boîte mail pour confirmer votre inscription.', error: 'L’inscription n’a pas pu aboutir. Réessayez plus tard.' },
}

function reply(request, status, locale = 'en') {
  const message = messages[locale][status === 202 ? 'accepted' : 'error']
  const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ ok: status === 202, message }, { status, headers })
  }
  return new Response(`<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>CommunityGlows</title><main><h1>CommunityGlows</h1><p>${message}</p><a href="${locale === 'fr' ? '/fr/' : '/'}">${locale === 'fr' ? 'Retour' : 'Back'}</a></main></html>`, { status, headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } })
}

async function boundedText(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new Error('body_limit')
  const reader = request.body?.getReader()
  if (!reader) return ''
  let size = 0
  const chunks = []
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY) { await reader.cancel(); throw new Error('body_limit') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}

// ip must be supplied by a trusted deployment adapter, never from the form.
export async function handleSubscribe(request, { env = process.env, fetchImpl = fetch, ip = '', now = Date.now, limiter = buckets } = {}) {
  let locale = 'en'
  if (request.method !== 'POST') return reply(request, 405)
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) return reply(request, 403)
  let endpoint
  try { endpoint = new URL(env.COMMUNITYGLOWS_EMAIL_API_URL) } catch { return reply(request, 503) }
  if (env.PUBLIC_NEWSLETTER_ENABLED !== 'true' || !env.PUBLIC_NEWSLETTER_CONTROLLER || !env.PUBLIC_NEWSLETTER_NOTICE_URL || endpoint.protocol !== 'https:' || !endpoint.pathname.endsWith('/api/v1/email/subscriptions') || endpoint.search || endpoint.hash || endpoint.username || endpoint.password || !env.COMMUNITYGLOWS_EMAIL_CLIENT_TOKEN || !env.COMMUNITYGLOWS_EMAIL_AUDIENCE || !env.COMMUNITYGLOWS_EMAIL_NOTICE_VERSION || !env.COMMUNITYGLOWS_EMAIL_ABUSE_SECRET || !ip) return reply(request, 503)
  let data
  try {
    const body = await boundedText(request)
    const type = request.headers.get('content-type')?.split(';')[0]
    if (type === 'application/json') data = JSON.parse(body)
    else if (type === 'application/x-www-form-urlencoded') data = Object.fromEntries(new URLSearchParams(body))
    else return reply(request, 415)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(request, 400)
  } catch { return reply(request, 400) }
  locale = data.locale === 'fr' ? 'fr' : 'en'
  if (data.notice_version !== env.COMMUNITYGLOWS_EMAIL_NOTICE_VERSION) return reply(request, 400, locale)
  if (data.website) return reply(request, 400, locale)
  if (typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || ![true, 'yes'].includes(data.consent)) return reply(request, 400, locale)
  const abuseKey = createHmac('sha256', env.COMMUNITYGLOWS_EMAIL_ABUSE_SECRET).update(ip).digest('hex')
  const time = now()
  for (const [key, entry] of limiter) if (entry.until <= time) limiter.delete(key)
  const bucket = limiter.get(abuseKey) || { count: 0, until: time + 60000 }
  if (bucket.count >= 5 || (!limiter.has(abuseKey) && limiter.size >= 10000)) return reply(request, 429, locale)
  bucket.count++
  limiter.set(abuseKey, bucket)
  // One key per user request. No automatic retry after an ambiguous provider timeout.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetchImpl(endpoint.href, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.COMMUNITYGLOWS_EMAIL_CLIENT_TOKEN}`, 'idempotency-key': randomUUID() },
      body: JSON.stringify({ business_id: 'communityglows', email: data.email.trim(), audience_id: env.COMMUNITYGLOWS_EMAIL_AUDIENCE, purpose: 'marketing', source: 'communityglows_site', notice_version: env.COMMUNITYGLOWS_EMAIL_NOTICE_VERSION, locale, consent: true, occurred_at: new Date(time).toISOString(), abuse_key: abuseKey }),
    })
    if (!response.ok) return reply(request, response.status === 429 ? 429 : 503, locale)
    const result = await response.json()
    if (!result || !['pending', 'subscribed'].includes(result.status) || (result.business_id !== undefined && result.business_id !== 'communityglows') || (result.businessId !== undefined && result.businessId !== 'communityglows')) return reply(request, 503, locale)
    return reply(request, 202, locale)
  } catch { return reply(request, 503, locale) }
  finally { clearTimeout(timeout) }
}

// Vercel overwrites x-vercel-forwarded-for; generic client forwarding headers are ignored.
export default async function handler(req, res) {
  const host = req.headers.host
  if (!host || /[\s/@\\]/.test(host)) { res.statusCode = 400; res.end(); return }
  const protocol = process.env.VERCEL === '1' ? 'https' : 'http'
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(',') : value)
  let body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body !== undefined) {
      body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : headers.get('content-type')?.startsWith('application/x-www-form-urlencoded') ? new URLSearchParams(req.body).toString() : JSON.stringify(req.body)
    } else {
      const chunks = []
      let size = 0
      for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > MAX_BODY) { res.statusCode = 400; res.end(); return }; chunks.push(Buffer.from(chunk)) }
      body = Buffer.concat(chunks)
    }
  }
  const request = new Request(`${protocol}://${host}/api/newsletter/subscribe`, { method: req.method, headers, body })
  const ip = process.env.VERCEL === '1' ? String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim() : req.socket?.remoteAddress || ''
  const response = await handleSubscribe(request, { ip })
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(await response.text())
}
