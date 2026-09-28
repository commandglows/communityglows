# CommunityGlows newsletter pilot

The Astro site stays static. Vercel discovers `api/newsletter/subscribe.js` as a Node function outside `dist`; ordinary static file hosting does not execute this handler. The function exports a portable Web Request handler for tests and a Vercel adapter. Verify the function in an authorized preview deployment before enabling the form. `astro dev` alone does not run Vercel API functions.

The form is disabled by default and retains the honest preparation announcement. Public activation requires approved controller identity and notice, an operational central CommandGlows audience with double opt-in, and separately authorized receipt testing. Do not enable based solely on a successful build.

Configure these values through the existing deployment environment manager; never place credentials in public variables or Git:

| Variable | Meaning |
| --- | --- |
| `PUBLIC_NEWSLETTER_ENABLED` | Set to `true` only after notice/entity approval and pilot proof; rebuild to change the static page. Also checked by the function. |
| `PUBLIC_NEWSLETTER_CONTROLLER` | Approved legal controller display name, public. |
| `PUBLIC_NEWSLETTER_NOTICE_URL` | Approved privacy notice URL, HTTPS or same-origin absolute path, public. Must explain marketing purpose, withdrawal, retention, recipients/transfers, and rights. |
| `PUBLIC_NEWSLETTER_NOTICE_VERSION` | Build-time notice version embedded in the form. Required for activation; must exactly match the runtime registered version below. Old forms fail closed after notice changes. |
| `COMMUNITYGLOWS_EMAIL_API_URL` | Actual HTTPS central endpoint ending `/api/v1/email/subscriptions`; no invented host. |
| `COMMUNITYGLOWS_EMAIL_CLIENT_TOKEN` | Dedicated server credential scoped to CommunityGlows subscription intake. |
| `COMMUNITYGLOWS_EMAIL_AUDIENCE` | Registered CommunityGlows marketing audience identifier. |
| `COMMUNITYGLOWS_EMAIL_NOTICE_VERSION` | Registered immutable version matching the displayed consent and notice. |
| `COMMUNITYGLOWS_EMAIL_ABUSE_SECRET` | Dedicated random server HMAC secret for IP-derived abuse keys; provision privately. |

The proxy fixes business `communityglows`, purpose `marketing`, source `communityglows_site`; callers cannot override them. It forwards locale, explicit consent, time, a fresh cryptographic idempotency key, and an HMAC abuse key. CommandGlows must register that source and compatible notice, enforce durable IP-derived rate limits and duplicate-address confirmation cooldown, and own all consent/delivery state. A fresh browser retry is a new request, so central domain deduplication is also required. The local 5 requests/minute limiter is supplementary and not distributed or durable. No raw IP is sent upstream or logged. Vercel's trusted `x-vercel-forwarded-for` supplies IP; other hosts must implement their own trusted adapter. No generic forwarding header is trusted.

HTML native form POST and enhanced JSON submission share the same validation. The submitted build-time notice version must exactly match the configured runtime version, so stale pages cannot record consent under a newer notice. Success requires a central JSON status of `pending` or `subscribed` and, if returned, a matching business identifier. Success means the central request was accepted, not that delivery or consent confirmation succeeded. The proxy does not automatically retry a timed-out request. Browser CORS is not enabled; Origin must match the function host. The endpoint rejects absent Origin, honeypots, missing consent, unsupported body types and bodies larger than 8 KiB. The central call has a 15-second timeout. Errors return generic text without upstream payloads or credentials.

Local verification: `node --test tests/newsletter.test.mjs`, then the site's existing build and launch checks. Tests mock upstream network. Before launch, separately authorize preview hosting and an exact recipient, verify persisted signup → confirmation → receipt → unsubscribe → blocked further marketing, and exercise provider failure/bounce/complaint. No deployment, DNS change, contact import or real send is included in this code change.
